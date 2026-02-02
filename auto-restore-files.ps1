# VSCode Local History Auto Restore Script
# Restores files that were accidentally deleted or emptied

$ErrorActionPreference = "Continue"
$projectPath = "C:\k-project\crm-ai-web"
$historyPath = "$env:APPDATA\Code\User\History"

Write-Host "=== VSCode Local History Auto Restore ===" -ForegroundColor Cyan
Write-Host ""

# Find all 0KB files or very small files that should have content
Write-Host "[1/5] Scanning for empty/corrupted files..." -ForegroundColor Yellow
$emptyFiles = Get-ChildItem "$projectPath\src" -Recurse -File | Where-Object { 
    $_.Length -eq 0 -or ($_.Length -lt 100 -and $_.Extension -match '\.(tsx?|jsx?)$')
} | Select-Object FullName, @{N='RelPath';E={$_.FullName.Replace("$projectPath\", "")}}

Write-Host "Found $($emptyFiles.Count) files to restore" -ForegroundColor Green
if ($emptyFiles.Count -eq 0) {
    Write-Host "No files to restore. Exiting." -ForegroundColor Yellow
    exit 0
}

# Scan VSCode history folders
Write-Host ""
Write-Host "[2/5] Scanning VSCode history (this may take a moment)..." -ForegroundColor Yellow

$historyFolders = Get-ChildItem $historyPath -Directory -ErrorAction SilentlyContinue
if (-not $historyFolders) {
    Write-Host "ERROR: Could not access VSCode history folder" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($historyFolders.Count) history folders" -ForegroundColor Green

# Build a map of file paths to their history entries
Write-Host ""
Write-Host "[3/5] Building file history map..." -ForegroundColor Yellow

$fileHistoryMap = @{}
$processedFolders = 0

foreach ($folder in $historyFolders) {
    $processedFolders++
    if ($processedFolders % 100 -eq 0) {
        Write-Host "  Processed $processedFolders/$($historyFolders.Count) folders..." -ForegroundColor Gray
    }
    
    $entriesFile = Join-Path $folder.FullName "entries.json"
    if (-not (Test-Path $entriesFile)) { continue }
    
    try {
        $content = Get-Content $entriesFile -Raw -Encoding UTF8
        $entries = $content | ConvertFrom-Json
        
        # Check if this file is in our project
        $resourcePath = $entries.resource
        if (-not $resourcePath -or $resourcePath -notlike "*crm-ai-web*") { continue }
        
        # Normalize path - handle URL encoded paths
        $normalizedPath = $resourcePath -replace 'file:///', '' -replace '%3A', ':' -replace '%20', ' ' -replace '%5B', '[' -replace '%5D', ']' -replace '/', '\'
        $normalizedPath = $normalizedPath -replace '.*crm-ai-web\\', ''
        
        if ($entries.entries) {
            # Find the most recent NON-EMPTY entry for this file
            $validEntry = $null
            foreach ($entry in ($entries.entries | Sort-Object timestamp -Descending)) {
                if ($entry.id) {
                    $historyFile = Join-Path $folder.FullName $entry.id
                    if (Test-Path $historyFile) {
                        $fileInfo = Get-Item $historyFile
                        if ($fileInfo.Length -gt 0) {
                            $validEntry = $entry
                            break
                        }
                    }
                }
            }
            
            if ($validEntry) {
                $historyFile = Join-Path $folder.FullName $validEntry.id
                $fileInfo = Get-Item $historyFile
                
                # Store in map (keep the most recent non-empty version for each file)
                if (-not $fileHistoryMap.ContainsKey($normalizedPath)) {
                    $fileHistoryMap[$normalizedPath] = @{
                        historyFile = $historyFile
                        timestamp = $validEntry.timestamp
                        size = $fileInfo.Length
                        folder = $folder.Name
                    }
                } else {
                    # Keep the newer version
                    $existing = $fileHistoryMap[$normalizedPath]
                    if ($validEntry.timestamp -gt $existing.timestamp) {
                        $fileHistoryMap[$normalizedPath] = @{
                            historyFile = $historyFile
                            timestamp = $validEntry.timestamp
                            size = $fileInfo.Length
                            folder = $folder.Name
                        }
                    }
                }
            }
        }
    }
    catch {
        # Skip invalid JSON files
    }
}

Write-Host "Built history map with $($fileHistoryMap.Count) files" -ForegroundColor Green

# Match empty files with their history
Write-Host ""
Write-Host "[4/5] Matching files with history..." -ForegroundColor Yellow

$restoreList = @()
foreach ($emptyFile in $emptyFiles) {
    $relativePath = $emptyFile.RelPath
    $normalizedPath = $relativePath -replace '/', '\'
    
    if ($fileHistoryMap.ContainsKey($normalizedPath)) {
        $history = $fileHistoryMap[$normalizedPath]
        $restoreList += @{
            targetPath = $emptyFile.FullName
            historyFile = $history.historyFile
            relativePath = $relativePath
            size = $history.size
            timestamp = $history.timestamp
        }
        Write-Host "  Match: $relativePath -> $([math]::Round($history.size/1KB, 1)) KB" -ForegroundColor Gray
    } else {
        Write-Host "  No history found: $relativePath" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "Ready to restore $($restoreList.Count) files" -ForegroundColor Green

if ($restoreList.Count -eq 0) {
    Write-Host "No files matched with history. Cannot restore." -ForegroundColor Red
    exit 1
}

# Confirm before restoring
Write-Host ""
Write-Host "Proceed with restore? (Y/N): " -NoNewline -ForegroundColor Yellow
$confirm = Read-Host

if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    Write-Host "Cancelled." -ForegroundColor Red
    exit 0
}

# Restore files
Write-Host ""
Write-Host "[5/5] Restoring files..." -ForegroundColor Yellow

$restored = 0
$failed = 0

foreach ($item in $restoreList) {
    try {
        # Backup the empty file first
        $backupPath = "$($item.targetPath).backup"
        if (Test-Path $item.targetPath) {
            Copy-Item $item.targetPath $backupPath -Force -ErrorAction SilentlyContinue
        }
        
        # Restore from history
        Copy-Item $item.historyFile $item.targetPath -Force
        
        $restored++
        Write-Host "  [OK] $($item.relativePath)" -ForegroundColor Green
    }
    catch {
        $failed++
        Write-Host "  [FAIL] $($item.relativePath) - $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Restore Complete ===" -ForegroundColor Cyan
Write-Host "  Restored: $restored files" -ForegroundColor Green
Write-Host "  Failed: $failed files" -ForegroundColor $(if($failed -gt 0){'Red'}else{'Gray'})
Write-Host ""
Write-Host "Backup files saved with .backup extension" -ForegroundColor Gray
