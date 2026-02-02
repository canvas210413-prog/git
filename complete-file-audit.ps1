# Complete File Audit and Restore Script
$ErrorActionPreference = "Continue"
$projectPath = "C:\k-project\crm-ai-web"
$historyPath = "$env:APPDATA\Code\User\History"
$cutoffTime = [DateTimeOffset]::Parse("2026-01-31 14:51:00").ToUnixTimeMilliseconds()

Write-Host "=== Complete File Audit ===" -ForegroundColor Cyan
Write-Host ""

# Get all source files
$allFiles = Get-ChildItem "$projectPath\src" -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx
Write-Host "Total files to check: $($allFiles.Count)" -ForegroundColor Yellow
Write-Host ""

# Build complete history map
Write-Host "Building complete history map (this will take a moment)..." -ForegroundColor Yellow
$historyFolders = Get-ChildItem $historyPath -Directory
Write-Host "Scanning $($historyFolders.Count) history folders..." -ForegroundColor Gray

$historyMap = @{}
$processed = 0

foreach ($folder in $historyFolders) {
    $processed++
    if ($processed % 50 -eq 0) {
        Write-Host "  Processed $processed/$($historyFolders.Count) history folders..." -ForegroundColor DarkGray
    }
    
    $entriesFile = Join-Path $folder.FullName "entries.json"
    if (-not (Test-Path $entriesFile)) { continue }
    
    try {
        $content = Get-Content $entriesFile -Raw -Encoding UTF8
        $entries = $content | ConvertFrom-Json
        
        $resourcePath = $entries.resource
        if (-not $resourcePath -or $resourcePath -notlike "*crm-ai-web*") { continue }
        
        $normalizedPath = $resourcePath -replace 'file:///', '' -replace '%3A', ':' -replace '%20', ' ' -replace '%5B', '[' -replace '%5D', ']' -replace '/', '\' -replace '.*crm-ai-web\\', ''
        
        if ($normalizedPath -notlike 'src\*') { continue }
        
        # Find best version before cutoff
        foreach ($entry in ($entries.entries | Sort-Object timestamp -Descending)) {
            if ($entry.timestamp -ge $cutoffTime) { continue }
            if (-not $entry.id) { continue }
            
            $histFile = Join-Path $folder.FullName $entry.id
            if (-not (Test-Path $histFile)) { continue }
            
            $fileInfo = Get-Item $histFile
            if ($fileInfo.Length -eq 0) { continue }
            
            # Store the largest version found
            if (-not $historyMap.ContainsKey($normalizedPath)) {
                $historyMap[$normalizedPath] = @{
                    historyFile = $histFile
                    timestamp = $entry.timestamp
                    size = $fileInfo.Length
                }
            } else {
                $existing = $historyMap[$normalizedPath]
                # Keep the version with larger size, or if same size, the newer one
                if ($fileInfo.Length -gt $existing.size -or 
                    ($fileInfo.Length -eq $existing.size -and $entry.timestamp -gt $existing.timestamp)) {
                    $historyMap[$normalizedPath] = @{
                        historyFile = $histFile
                        timestamp = $entry.timestamp
                        size = $fileInfo.Length
                    }
                }
            }
            break  # Found valid version, move to next file
        }
    }
    catch {
        # Skip invalid entries
    }
}

Write-Host ""
Write-Host "History map built: $($historyMap.Count) files found in history" -ForegroundColor Green
Write-Host ""

# Compare and find files that need update
Write-Host "Comparing with current files..." -ForegroundColor Yellow
$needsUpdate = @()
$alreadyGood = 0
$noHistory = 0
$checked = 0

foreach ($file in $allFiles) {
    $checked++
    if ($checked % 50 -eq 0) {
        Write-Host "  Checked $checked/$($allFiles.Count) files..." -ForegroundColor DarkGray
    }
    
    $relativePath = $file.FullName.Replace("$projectPath\", "")
    $currentSize = $file.Length
    
    if ($historyMap.ContainsKey($relativePath)) {
        $history = $historyMap[$relativePath]
        $historySize = $history.size
        
        # Check if history version is significantly larger (at least 5% or 100 bytes)
        $threshold = [Math]::Max($currentSize * 0.05, 100)
        
        if ($historySize -gt ($currentSize + $threshold)) {
            $date = [DateTimeOffset]::FromUnixTimeMilliseconds($history.timestamp).LocalDateTime
            $needsUpdate += @{
                path = $file.FullName
                relativePath = $relativePath
                currentSize = $currentSize
                historySize = $historySize
                historyFile = $history.historyFile
                date = $date
            }
        } else {
            $alreadyGood++
        }
    } else {
        $noHistory++
    }
}

Write-Host ""
Write-Host "=== Audit Results ===" -ForegroundColor Cyan
Write-Host "Files needing update: $($needsUpdate.Count)" -ForegroundColor $(if($needsUpdate.Count -gt 0){'Red'}else{'Green'})
Write-Host "Files already good: $alreadyGood" -ForegroundColor Green
Write-Host "Files without history: $noHistory" -ForegroundColor Gray
Write-Host ""

if ($needsUpdate.Count -eq 0) {
    Write-Host "All files are up to date! No restore needed." -ForegroundColor Green
    exit 0
}

# Show files that need update
Write-Host "Files that will be updated:" -ForegroundColor Yellow
foreach ($item in $needsUpdate) {
    $sizeDiff = $item.historySize - $item.currentSize
    Write-Host "  $($item.relativePath)" -ForegroundColor White
    Write-Host "    Current: $($item.currentSize) bytes -> History: $($item.historySize) bytes (+$sizeDiff)" -ForegroundColor Gray
    Write-Host "    Date: $($item.date)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Proceed with restore? (Y/N): " -NoNewline -ForegroundColor Yellow
$confirm = Read-Host

if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    Write-Host "Cancelled." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Restoring files..." -ForegroundColor Yellow

$restored = 0
$failed = 0

foreach ($item in $needsUpdate) {
    try {
        # Backup current file
        $backupPath = "$($item.path).backup2"
        Copy-Item $item.path $backupPath -Force -ErrorAction SilentlyContinue
        
        # Restore from history
        Copy-Item $item.historyFile $item.path -Force
        
        $restored++
        Write-Host "[OK] $($item.relativePath)" -ForegroundColor Green
    }
    catch {
        $failed++
        Write-Host "[FAIL] $($item.relativePath) - $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Complete ===" -ForegroundColor Cyan
Write-Host "Restored: $restored files" -ForegroundColor Green
Write-Host "Failed: $failed files" -ForegroundColor $(if($failed -gt 0){'Red'}else{'Gray'})
Write-Host ""
Write-Host "Backups saved with .backup2 extension" -ForegroundColor Gray
