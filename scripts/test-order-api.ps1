// 주문 등록 API 테스트 (PowerShell용)

$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    customerName = "테스트고객-$(Get-Date -Format 'HHmmss')"
    orderDate = (Get-Date).ToString("yyyy-MM-dd")
    totalAmount = 53000
    status = "PENDING"
    ordererName = "주문자홍길동"
    contactPhone = "010-1111-2222"
    recipientName = "수취인김철수"
    recipientPhone = "010-3333-4444"
    recipientMobile = "010-5555-6666"
    recipientZipCode = "12345"
    recipientAddr = "서울시 강남구 테스트로 123"
    orderNumber = "TEST-$(Get-Date -Format 'yyyyMMddHHmmss')"
    productInfo = "테스트 상품 A x 1개"
    deliveryMsg = "문 앞에 놓아주세요"
    orderSource = "자사몰"
    partner = "스몰닷"
    shippingFee = 3000
    courier = "CJ대한통운"
    trackingNumber = "123456789012"
} | ConvertTo-Json

Write-Host "📦 주문 등록 테스트 시작..." -ForegroundColor Cyan
Write-Host "요청 데이터:" -ForegroundColor Yellow
Write-Host $body

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/orders/create" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -UseBasicParsing
    
    Write-Host "`n✅ 주문 등록 성공!" -ForegroundColor Green
    Write-Host "응답 상태: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "응답 내용:" -ForegroundColor Yellow
    Write-Host ($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "`n❌ 주문 등록 실패!" -ForegroundColor Red
    Write-Host "에러: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "응답 내용: $responseBody" -ForegroundColor Red
    }
}
