# MySQL Binlog Recovery Script
$binlogPath = "C:\Users\KPro\mysql_data\binlog.000030"
$outputFile = "binlog_preview.sql"

Write-Host "`n=== MySQL Binlog Recovery Tool ===" -ForegroundColor Cyan
Write-Host "File: $binlogPath`n" -ForegroundColor Yellow

if (-not (Test-Path $binlogPath)) {
    Write-Host "Error: Binlog file not found: $binlogPath" -ForegroundColor Red
    exit 1
}

$fileSize = [math]::Round((Get-Item $binlogPath).Length / 1MB, 2)
Write-Host "File found: ${fileSize}MB`n" -ForegroundColor Green

$mysqlbinlogPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqlbinlog.exe"
if (-not (Test-Path $mysqlbinlogPath)) {
    $mysqlbinlogPath = "mysqlbinlog"
}

Write-Host "=== Binlog Preview ===" -ForegroundColor Cyan
Write-Host "Converting... (may take a while)`n" -ForegroundColor Yellow

try {
    $binlogContent = & $mysqlbinlogPath --base64-output=DECODE-ROWS -v $binlogPath 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "mysqlbinlog execution error:" -ForegroundColor Red
        Write-Host $binlogContent -ForegroundColor Red
        exit 1
    }
    
    $binlogContent | Out-File -FilePath $outputFile -Encoding UTF8
    
    Write-Host "=== Binlog Summary ===" -ForegroundColor Green
    
    $startTime = ($binlogContent | Select-String "^# at" | Select-Object -First 1).Line
    Write-Host "Start: $startTime" -ForegroundColor White
    
    $endTime = ($binlogContent | Select-String "^# at" | Select-Object -Last 1).Line
    Write-Host "End: $endTime" -ForegroundColor White
    
    $insertCount = ($binlogContent | Select-String "^INSERT INTO" | Measure-Object).Count
    $updateCount = ($binlogContent | Select-String "^UPDATE" | Measure-Object).Count
    $deleteCount = ($binlogContent | Select-String "^DELETE FROM" | Measure-Object).Count
    
    Write-Host "`n=== Data Changes ===" -ForegroundColor Green
    Write-Host "INSERT: $insertCount" -ForegroundColor Cyan
    Write-Host "UPDATE: $updateCount" -ForegroundColor Yellow
    Write-Host "DELETE: $deleteCount" -ForegroundColor Magenta
    
    Write-Host "`n=== Affected Tables ===" -ForegroundColor Green
    $tables = $binlogContent | Select-String "Table_map.*\.(\w+)" | ForEach-Object {
        if ($_.Line -match "Table_map.*\.(\w+)") {
            $matches[1]
        }
    } | Select-Object -Unique | Sort-Object
    
    $tables | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    
    Write-Host "`n=== SQL Preview (first 50 lines) ===" -ForegroundColor Green
    Write-Host "-------------------------------------------------------" -ForegroundColor DarkGray
    $binlogContent | Select-Object -First 50 | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
    Write-Host "-------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "... (see full content in $outputFile)`n" -ForegroundColor Yellow
    
    Write-Host "=== Confirmation ===" -ForegroundColor Cyan
    Write-Host "Apply this binlog to database (crm_ai_web)?" -ForegroundColor Yellow
    Write-Host "WARNING: This will modify your database!" -ForegroundColor Red
    Write-Host "`nTo view full SQL: notepad $outputFile" -ForegroundColor Cyan
    $confirm = Read-Host "`nProceed with recovery? (yes/no)"
    
    if ($confirm -ne "yes") {
        Write-Host "`nRecovery cancelled." -ForegroundColor Yellow
        Write-Host "SQL file saved to: $outputFile" -ForegroundColor Cyan
        exit 0
    }
    
    Write-Host "`n=== Starting Binlog Recovery ===" -ForegroundColor Green
    Write-Host "Applying to database...`n" -ForegroundColor Yellow
    
    $result = Get-Content $outputFile | mysql -u dbuser -pdbpassword crm_ai_web 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nRecovery completed successfully!" -ForegroundColor Green
        
        Write-Host "`n=== Verifying data ===" -ForegroundColor Cyan
        node verify-restore.js
    } else {
        Write-Host "`nRecovery failed!" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        Write-Host "`nCheck SQL file: $outputFile" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "`nError: $_" -ForegroundColor Red
    exit 1
}
