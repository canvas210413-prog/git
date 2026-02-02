"use client";

import { useState } from "react";
import { ExcelToolbar } from "@/components/common/excel-toolbar";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteAllOrders } from "@/app/actions/orders";

interface Order {
  id: string;
  orderNumber?: string;
  orderDate: Date;
  recipientName?: string;
  recipientPhone?: string;
  recipientMobile?: string;
  recipientZipCode?: string;
  recipientAddr?: string;
  productInfo?: string;
  deliveryMsg?: string;
  orderSource?: string;
  totalAmount: number;
  shippingFee?: number;
  courier?: string;
  trackingNumber?: string;
  giftSent?: boolean;
}

interface OrderExcelToolbarProps {
  orders: Order[];
  buttonText?: string;
}

export function OrderExcelToolbar({ orders, buttonText }: OrderExcelToolbarProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // 내보내기용 데이터 변환 (L열에 사은품발송)
  const exportData = orders.map(o => ({
    날짜: new Date(o.orderDate).toLocaleDateString("ko-KR"),
    수취인명: o.recipientName || "",
    "수취인 전화번호": o.recipientPhone || "",
    "수취인 이동통신": o.recipientMobile || "",
    "수취인 우편번호": o.recipientZipCode || "",
    "수취인 주소": o.recipientAddr || "",
    주문번호: o.orderNumber || "",
    "상품명 및 수량": o.productInfo || "",
    배송메세지: o.deliveryMsg || "",
    고객주문처명: o.orderSource || "",
    단가: (o.totalAmount || 0) - (o.shippingFee || 0),
    사은품발송: o.giftSent ? "발송" : "",
    배송비: o.shippingFee || 0,
    택배사: o.courier || "",
    운송장번호: o.trackingNumber || "",
  }));

  // Import용 컬럼 정의 (L열에 사은품발송)
  const importColumns = [
    { header: '날짜', key: '날짜', width: 12 },
    { header: '수취인명', key: '수취인명', width: 15 },
    { header: '수취인 전화번호', key: '수취인 전화번호', width: 15 },
    { header: '수취인 이동통신', key: '수취인 이동통신', width: 15 },
    { header: '수취인 우편번호', key: '수취인 우편번호', width: 12 },
    { header: '수취인 주소', key: '수취인 주소', width: 40 },
    { header: '주문번호', key: '주문번호', width: 20 },
    { header: '상품명 및 수량', key: '상품명 및 수량', width: 30 },
    { header: '배송메시지', key: '배송메시지', width: 30 },
    { header: '고객주문처명', key: '고객주문처명', width: 15 },
    { header: '단가', key: '단가', width: 12 },
    { header: '사은품발송', key: '사은품발송', width: 12 },
    { header: '배송비', key: '배송비', width: 10 },
    { header: '택배사', key: '택배사', width: 15 },
    { header: '운송장번호', key: '운송장번호', width: 20 },
  ];

  // 샘플 데이터 (L열에 사은품발송)
  const sampleData = [
    {
      날짜: "2026-01-13",
      수취인명: "홍길동",
      "수취인 전화번호": "010-1234-5678",
      "수취인 이동통신": "010-1234-5678",
      "수취인 우편번호": "12345",
      "수취인 주소": "서울시 강남구 테스트로 123",
      주문번호: "ORD-2026-001",
      "상품명 및 수량": "쉴드미니 프로 / 블랙 / 1개",
      배송메시지: "문 앞에 놓아주세요",
      고객주문처명: "자사몰",
      단가: 50000,
      사은품발송: "발송",
      배송비: 3000,
      택배사: "CJ대한통운",
      운송장번호: "123456789012",
    },
  ];

  // Import 핸들러
  const handleImport = async (data: any[]) => {
    try {
      console.log(`📊 ${data.length}건의 주문을 처리합니다...`);
      
      const results = [];
      const errors: { row: number; name: string; error: string }[] = [];
      
      // createOrder 함수 미리 import
      const { createOrder } = await import("@/app/actions/orders");
      
      // 순차 처리로 변경 (병렬 처리 시 에러 발생 가능)
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 1;
        
        try {
          // 날짜 파싱 - "2023-09-01" 형식 지원
          let orderDate = new Date();
          if (row.날짜) {
            const dateStr = String(row.날짜).trim();
            // "2023-09-01" 형식 또는 Excel 숫자 날짜
            if (dateStr.includes('-')) {
              orderDate = new Date(dateStr);
            } else {
              // Excel 숫자 날짜 변환 (1900-01-01 기준)
              const excelDate = Number(dateStr);
              if (!isNaN(excelDate)) {
                orderDate = new Date((excelDate - 25569) * 86400 * 1000);
              }
            }
          }
          
          // 단가와 배송비로 총액 계산
          const basePrice = Number(row.단가) || 0;
          const shippingFee = Number(row.배송비) || 0;
          const totalAmount = basePrice + shippingFee;

          // 고객 이름 (없으면 기본값)
          const customerName = row.수취인명 ? String(row.수취인명).trim() : `고객_${rowNumber}`;
          
          // 주문번호 처리 - 빈 값이면 null, 아니면 unique한 값 생성
          let orderNumber = row.주문번호 ? String(row.주문번호).trim() : "";
          if (!orderNumber) {
            // 주문번호가 없으면 타임스탬프 + 행번호로 고유값 생성
            orderNumber = `ORD-${Date.now()}-${rowNumber}`;
          }
          
          // 사은품발송 처리
          const giftSentValue = String(row.사은품발송 || "").trim();
          const giftSent = giftSentValue === "발송" || giftSentValue === "Y" || giftSentValue === "O" || giftSentValue === "1";
          
          console.log(`[행 ${rowNumber}] 🎁 사은품발송 디버깅:`);
          console.log(`  - 원본 값: "${row.사은품발송}"`);
          console.log(`  - 정제된 값: "${giftSentValue}"`);
          console.log(`  - 변환 결과: ${giftSent}`);
          
          // 주문 생성 데이터
          const orderData = {
            orderDate: orderDate.toISOString().split('T')[0],
            totalAmount,
            status: "PENDING",
            recipientName: customerName,
            recipientPhone: String(row["수취인 전화번호"] || "").trim(),
            recipientMobile: String(row["수취인 이동통신"] || "").trim(),
            recipientZipCode: String(row["수취인 우편번호"] || "").trim(),
            recipientAddr: String(row["수취인 주소"] || "").trim(),
            orderNumber: orderNumber, // 고유한 주문번호
            productInfo: String(row["상품명 및 수량"] || "").trim(),
            deliveryMsg: String(row.배송메시지 || "").trim(),
            orderSource: String(row.고객주문처명 || "자사몰").trim(),
            basePrice, // 단가
            shippingFee,
            giftSent, // 사은품 발송 여부
            courier: String(row.택배사 || "").trim(),
            trackingNumber: String(row.운송장번호 || "").trim(),
          };
          
          console.log(`[행 ${rowNumber}] 📦 orderData.giftSent: ${orderData.giftSent}`);

          console.log(`[행 ${rowNumber}] 주문 데이터:`, JSON.stringify(orderData, null, 2));

          const result = await createOrder(orderData);
          
          console.log(`[행 ${rowNumber}] 📬 createOrder 결과:`, JSON.stringify(result, null, 2));
          
          if (result.success) {
            console.log(`✅ [행 ${rowNumber}] 주문 생성 성공`);
            results.push({ row: rowNumber, success: true });
          } else {
            console.error(`❌ [행 ${rowNumber}] 주문 생성 실패:`, result.error);
            // 상세 에러 정보 수집
            const errorDetails = {
              row: rowNumber,
              name: customerName,
              error: result.error?.message || "알 수 없는 오류",
              code: result.error?.code,
              details: result.error?.details ? JSON.stringify(result.error.details) : null,
              data: JSON.stringify(orderData, null, 2)
            };
            
            console.error(`[행 ${rowNumber}] 에러:`, errorDetails);
            
            errors.push(errorDetails);
          }
        } catch (error: any) {
          const errorDetails = {
            row: rowNumber,
            name: row.수취인명 || `행 ${rowNumber}`,
            error: error.message || String(error),
            stack: error.stack,
            data: JSON.stringify(orderData, null, 2)
          };
          
          console.error(`[행 ${rowNumber}] 예외:`, errorDetails);
          
          errors.push(errorDetails);
        }
      }

      const successCount = results.length;
      const failCount = errors.length;

      // 결과 메시지
      let message = `✅ 성공: ${successCount}건\n`;
      if (failCount > 0) {
        message += `❌ 실패: ${failCount}건\n\n`;
        message += "실패 상세:\n";
        errors.slice(0, 5).forEach((err: any) => {
          message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          message += `📍 행 ${err.row} (${err.name})\n`;
          message += `❌ 에러: ${err.error}\n`;
          if (err.code) {
            message += `🔑 코드: ${err.code}\n`;
          }
          if (err.details) {
            message += `📋 상세: ${err.details}\n`;
          }
          if (err.data) {
            message += `📦 데이터:\n${err.data}\n`;
          }
        });
        if (errors.length > 5) {
          message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          message += `... 외 ${errors.length - 5}건\n\n`;
          message += `💡 전체 에러는 브라우저 콘솔(F12)을 확인하세요.`;
        }
      }
      
      alert(message);
      
      if (successCount > 0) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Import error:", error);
      alert(`❌ 가져오기 실패: ${error}`);
    }
  };

  // 유효성 검사 (필요시 확장 가능)
  const validateRow = (row: Record<string, unknown>) => {
    // 모든 데이터 허용
    return { valid: true };
  };

  // 전체 삭제 핸들러
  const handleDeleteAll = async () => {
    const confirmMessage = `정말로 모든 주문(${orders.length}건)을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    const doubleConfirm = confirm("한 번 더 확인합니다. 정말 삭제하시겠습니까?");
    
    if (!doubleConfirm) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteAllOrders();
      if (result.success) {
        alert(`✅ ${result.data?.deletedCount || 0}건의 주문이 삭제되었습니다.`);
        window.location.reload();
      } else {
        alert(`❌ 삭제 실패: ${result.error?.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      alert(`❌ 삭제 중 오류 발생: ${error}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <ExcelToolbar
        data={exportData}
        columns={importColumns}
        entityName="주문"
        onImport={handleImport}
        validateRow={validateRow}
        sampleData={sampleData}
        buttonText={buttonText}
      />
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDeleteAll}
        disabled={isDeleting || orders.length === 0}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        {isDeleting ? "삭제 중..." : "전체 지우기"}
      </Button>
    </div>
  );
}
