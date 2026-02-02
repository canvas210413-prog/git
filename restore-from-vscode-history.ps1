# VSCode 로컬 히스토리에서 최신 파일 복구 스크립트

$historyPath = "$env:APPDATA\Code\User\History"
$projectPath = "C:\k-project\crm-ai-web\src"

Write-Host "VSCode 로컬 히스토리에서 파일을 검색합니다..." -ForegroundColor Cyan

# 최근 1시간 내 변경된 히스토리 폴더들
$recentFolders = Get-ChildItem $historyPath -Directory | 
    Where-Object { $_.LastWriteTime -gt (Get-Date).AddHours(-2) } |
    Sort-Object LastWriteTime -Descending

$foundFiles = @{}

foreach ($folder in $recentFolders) {
    $entriesFile = Join-Path $folder.FullName "entries.json"
    if (Test-Path $entriesFile) {
        try {
            $entries = Get-Content $entriesFile -Raw | ConvertFrom-Json
            
            foreach ($entry in $entries.entries) {
                if ($entry.resource -like "*crm-ai-web\src*") {
                    $relativePath = $entry.resource -replace '.*crm-ai-web\\src\\', ''
                    $timestamp = $entry.timestamp
                    
                    # 각 파일의 최신 버전만 저장
                    if (-not $foundFiles.ContainsKey($relativePath) -or 
                        $timestamp -gt $foundFiles[$relativePath].timestamp) {
                        
                        $historyFile = Join-Path $folder.FullName $entry.id
                        if (Test-Path $historyFile) {
                            $foundFiles[$relativePath] = @{
                                timestamp = $timestamp
                                historyFile = $historyFile
                                resource = $entry.resource
                            }
                        }
                    }
                }
            }
        }
        catch {
            # 파일 파싱 오류 무시
        }
    }
}

Write-Host "`n발견된 파일: $($foundFiles.Count)개" -ForegroundColor Green

if ($foundFiles.Count -eq 0) {
    Write-Host "복구할 파일을 찾을 수 없습니다." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Restore files? Y or N: " -NoNewline -ForegroundColor Yellow
$confirm = Read-Host

if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    Write-Host "Cancelled." -ForegroundColor Red
    exit 0
}

$restored = 0
foreach ($file in $foundFiles.GetEnumerator()) {
    $targetPath = Join-Path $projectPath $file.Key
    $targetDir = Split-Path $targetPath -Parent
    
    try {
        # 디렉토리 생성
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        
        # 파일 복사
        Copy-Item $file.Value.historyFile $targetPath -Force
        $restored++
        Write-Host "✓ 복구: $($file.Key)" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ 실패: $($file.Key) - $_" -ForegroundColor Red
    }
}

Write-Host "`n완료: $restored/$($foundFiles.Count) 파일 복구됨" -ForegroundColor Cyan
