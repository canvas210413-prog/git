# Restore the correct versions (skip empty files from 14:51)
$ErrorActionPreference = "Continue"
$historyPath = "$env:APPDATA\Code\User\History"
$projectPath = "C:\k-project\crm-ai-web"

Write-Host "=== Restoring Correct Versions ===" -ForegroundColor Cyan
Write-Host ""

# Get all files from src folder
$allFiles = Get-ChildItem "$projectPath\src" -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx

$restored = 0
$skipped = 0
$cutoffTime = [DateTimeOffset]::Parse("2026-01-31 14:51:00").ToUnixTimeMilliseconds()

foreach ($file in $allFiles) {
    $relativePath = $file.FullName.Replace("$projectPath\", "")
    
    # Find history for this file
    $foundHistory = $false
    
    foreach ($folder in (Get-ChildItem $historyPath -Directory)) {
        $entriesFile = Join-Path $folder.FullName "entries.json"
        if (-not (Test-Path $entriesFile)) { continue }
        
        try {
            $entries = Get-Content $entriesFile -Raw -Encoding UTF8 | ConvertFrom-Json
            $resourcePath = $entries.resource
            
            if (-not $resourcePath) { continue }
            
            $normalizedPath = $resourcePath -replace 'file:///', '' -replace '%3A', ':' -replace '%20', ' ' -replace '%5B', '[' -replace '%5D', ']' -replace '/', '\' -replace '.*crm-ai-web\\', ''
            
            if ($normalizedPath -ne $relativePath) { continue }
            
            # Found the file - get the best version (before 14:51 and non-empty)
            $bestEntry = $null
            $bestSize = 0
            
            foreach ($entry in ($entries.entries | Sort-Object timestamp -Descending)) {
                if ($entry.timestamp -ge $cutoffTime) { continue }
                
                $histFile = Join-Path $folder.FullName $entry.id
                if (-not (Test-Path $histFile)) { continue }
                
                $fileInfo = Get-Item $histFile
                if ($fileInfo.Length -gt $bestSize) {
                    $bestEntry = $entry
                    $bestSize = $fileInfo.Length
                    $bestFile = $histFile
                }
            }
            
            if ($bestEntry -and $bestSize -gt 0) {
                # Check if current file needs update
                $currentSize = $file.Length
                
                if ($currentSize -lt $bestSize * 0.9) {
                    # Current file is significantly smaller, restore
                    Copy-Item $bestFile $file.FullName -Force
                    $date = [DateTimeOffset]::FromUnixTimeMilliseconds($bestEntry.timestamp).LocalDateTime
                    Write-Host "[RESTORED] $relativePath" -ForegroundColor Green
                    Write-Host "           $currentSize -> $bestSize bytes ($date)" -ForegroundColor Gray
                    $restored++
                } else {
                    $skipped++
                }
                
                $foundHistory = $true
                break
            }
        }
        catch {
            # Skip invalid entries
        }
    }
}

Write-Host ""
Write-Host "=== Complete ===" -ForegroundColor Cyan
Write-Host "Restored: $restored files" -ForegroundColor Green
Write-Host "Skipped (already good): $skipped files" -ForegroundColor Gray
