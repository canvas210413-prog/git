"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import * as XLSX from "xlsx";
import { Download, Upload, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { deleteAllOrders, createOrder } from "@/app/actions/orders";

interface Order {
  id: string;
  orderDate: string;
  recipientName: string | null;
  recipientPhone: string | null;
  recipientMobile: string | null;
  recipientZipCode: string | null;
  recipientAddr: string | null;
  orderNumber: string | null;
  productInfo: string | null;
  deliveryMsg: string | null;
  orderSource: string | null;
  basePrice: number | null;
  shippingFee: number | null;
  courier: string | null;
  trackingNumber: string | null;
  giftSent: boolean | null;
}

interface OrderStatusExcelToolbarProps {
  orders: Order[];
}

export function OrderStatusExcelToolbar({ orders }: OrderStatusExcelToolbarProps) {
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    failed: number;
    errors: Array<{
      row: number;
      name: string;
      error: string;
      data: any;
    }>;
  } | null>(null);

  // Import/Export용 컬럼 정의
  const columns = [
    { header: "날짜", key: "날짜", width: 12 },
    { header: "고객명", key: "고객명", width: 15 },
    { header: "전화번호", key: "전화번호", width: 15 },
    { header: "이동통신", key: "이동통신", width: 15 },
    { header: "우편번호", key: "우편번호", width: 12 },
    { header: "주소", key: "주소", width: 40 },
    { header: "주문번호", key: "주문번호", width: 20 },
    { header: "상품명 및 수량", key: "상품명 및 수량", width: 30 },
    { header: "배송메시지", key: "배송메시지", width: 30 },
    { header: "고객주문처명", key: "고객주문처명", width: 15 },
    { header: "단가", key: "단가", width: 12 },
    { header: "배송비", key: "배송비", width: 10 },
    { header: "택배사", key: "택배사", width: 15 },
    { header: "운송장번호", key: "운송장번호", width: 20 },
  ];

  // 샘플 데이터
  const sampleData = [
    {
      날짜: "2024-01-15",
      고객명: "홍길동",
      전화번호: "02-1234-5678",
      이동통신: "010-1234-5678",
      우편번호: "12345",
      주소: "서울시 강남구 테헤란로 123",
      주문번호: "ORD-2024-001",
      "상품명 및 수량": "노트북 x 1",
      배송메시지: "문앞에 놔주세요",
      고객주문처명: "리셀러A",
      단가: 1000000,
      배송비: 3000,
      택배사: "",
      운송장번호: "",
    },
  ];

  // Excel Export
  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    const data = orders.map((order) => ({
      날짜: order.orderDate || "",
      고객명: order.recipientName || "",
      전화번호: order.recipientPhone || "",
      이동통신: order.recipientMobile || "",
      우편번호: order.recipientZipCode || "",
      주소: order.recipientAddr || "",
      주문번호: order.orderNumber || "",
      "상품명 및 수량": order.productInfo || "",
      배송메시지: order.deliveryMsg || "",
      고객주문처명: order.orderSource || "자사몰",
      단가: order.basePrice || 0,
      배송비: order.shippingFee || 0,
      택배사: order.courier || "",
      운송장번호: order.trackingNumber || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = columns.map((col) => ({ wch: col.width }));

    XLSX.utils.book_append_sheet(wb, ws, "발주서");
    XLSX.writeFile(wb, `발주서_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // 샘플 다운로드
  const handleDownloadSample = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws["!cols"] = columns.map((col) => ({ wch: col.width }));

    XLSX.utils.book_append_sheet(wb, ws, "발주서_샘플");
    XLSX.writeFile(wb, "발주서_샘플.xlsx");
  };

  // Excel Import
  const handleImport = async (data: any[]) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadResult(null);
      console.log(`📊 ${data.length}건의 주문을 처리합니다...`);

      const results = [];
      const errors: { row: number; name: string; error: string; data: any }[] = [];

      const { createOrder } = await import("@/app/actions/orders");

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 1;

        // 프로그레스 업데이트
        setUploadProgress(Math.round(((i + 1) / data.length) * 100));

        try {
          // 빈 행 체크 - 고객명이 없으면 빈 행으로 간주
          const recipientName = row.고객명 ? String(row.고객명).trim() : "";
          if (!recipientName) {
            console.log(`[행 ${rowNumber}] 빈 행 - 건너뜀`);
            continue;
          }

          // 엑셀 날짜 파싱
          let orderDate: Date;
          
          if (row.날짜) {
            // 엑셀에서 날짜 읽기
            const excelDate = row.날짜;
            
            if (typeof excelDate === 'number') {
              // Excel 일련번호를 JavaScript Date로 변환
              // Excel은 1900-01-01을 1로 시작 (1899-12-31 = 0)
              // Excel 버그: 1900년을 윤년으로 처리하므로 1900-03-01 이후는 +1 필요 없음
              const EXCEL_EPOCH = new Date(1899, 11, 30); // 1899-12-30
              const days = Math.floor(excelDate);
              const milliseconds = days * 24 * 60 * 60 * 1000;
              
              // 로컬 시간대로 날짜 생성 (정오 기준으로 생성하여 시간대 변환 문제 방지)
              const tempDate = new Date(EXCEL_EPOCH.getTime() + milliseconds);
              orderDate = new Date(
                tempDate.getFullYear(),
                tempDate.getMonth(),
                tempDate.getDate(),
                12, 0, 0, 0  // 정오로 설정하여 시간대 영향 최소화
              );
              
              console.log(`[행 ${rowNumber}] Excel 날짜 변환: ${excelDate} -> ${orderDate.toISOString().split('T')[0]}`);
            } else if (typeof excelDate === 'string') {
              // 문자열 형식의 날짜
              const parsedDate = new Date(excelDate);
              orderDate = new Date(
                parsedDate.getFullYear(),
                parsedDate.getMonth(),
                parsedDate.getDate(),
                12, 0, 0, 0
              );
              console.log(`[행 ${rowNumber}] 문자열 날짜 변환: ${excelDate} -> ${orderDate.toISOString().split('T')[0]}`);
            } else {
              // Date 객체
              const dateObj = new Date(excelDate);
              orderDate = new Date(
                dateObj.getFullYear(),
                dateObj.getMonth(),
                dateObj.getDate(),
                12, 0, 0, 0
              );
              console.log(`[행 ${rowNumber}] Date 객체 변환: ${orderDate.toISOString().split('T')[0]}`);
            }
            
            // 유효한 날짜인지 확인
            if (isNaN(orderDate.getTime())) {
              console.log(`[행 ${rowNumber}] 잘못된 날짜 형식, 현재 날짜 사용`);
              orderDate = new Date();
            }
          } else {
            // 날짜가 없으면 현재 날짜 사용
            orderDate = new Date();
          }

          // 단가와 배송비 파싱 (쉼표 제거)
          const parsedBasePrice = row.단가 
            ? Number(String(row.단가).replace(/,/g, '')) 
            : 0;
          const parsedShippingFee = row.배송비 
            ? Number(String(row.배송비).replace(/,/g, '')) 
            : 0;
          
          const basePrice = isNaN(parsedBasePrice) ? 0 : parsedBasePrice;
          const shippingFee = isNaN(parsedShippingFee) ? 0 : parsedShippingFee;
          const totalAmount = basePrice + shippingFee;
          
          console.log(`[행 ${rowNumber}] 단가: ${row.단가} -> ${basePrice}, 배송비: ${row.배송비} -> ${shippingFee}`);

          const customerName = recipientName;

          // 주문번호가 없으면 undefined (null로 저장, unique constraint 중복 방지)
          const orderNumberValue = row.주문번호 ? String(row.주문번호).trim() : "";
          const orderNumber = orderNumberValue || undefined;

          // 사은품발송 처리 - 컬럼이 없거나 값이 없으면 false (미발송)
          const giftSentValue = row.사은품발송 ? String(row.사은품발송).trim() : "";
          const giftSent = giftSentValue === "발송" || giftSentValue === "Y" || giftSentValue === "O" || giftSentValue === "1";

          const orderData = {
            orderDate: orderDate.toISOString().split("T")[0],
            totalAmount,
            status: "PENDING",
            recipientName: customerName,
            recipientPhone: String(row.전화번호 || "").trim(),
            recipientMobile: String(row.이동통신 || "").trim(),
            recipientZipCode: String(row.우편번호 || "").trim(),
            recipientAddr: String(row.주소 || "").trim(),
            orderNumber: orderNumber,
            productInfo: String(row["상품명 및 수량"] || "").trim(),
            deliveryMsg: String(row.배송메시지 || row.배송메세지 || "").trim(),
            orderSource: String(row.고객주문처명 || "자사몰").trim(),
            basePrice,
            shippingFee,
            giftSent, // 디폴트: false (미발송)
            courier: "",
            trackingNumber: "",
            skipNotification: true, // 일괄 업로드 시 개별 알림 방지
          };

          console.log(`[행 ${rowNumber}] 주문 데이터:`, JSON.stringify(orderData, null, 2));

          const result = await createOrder(orderData);

          console.log(`[행 ${rowNumber}] 결과:`, result);

          if (result.success) {
            results.push({ row: rowNumber, success: true });
          } else {
            const errorDetails = {
              row: rowNumber,
              name: customerName,
              error: result.error?.message || "알 수 없는 오류",
              data: row, // 원본 데이터 저장
            };

            console.error(`[행 ${rowNumber}] 에러:`, errorDetails);
            errors.push(errorDetails);
          }
        } catch (error: any) {
          const errorDetails = {
            row: rowNumber,
            name: row.고객명 || `행 ${rowNumber}`,
            error: error.message || String(error),
            data: row, // 원본 데이터 저장
          };

          console.error(`[행 ${rowNumber}] 예외:`, errorDetails);
          errors.push(errorDetails);
        }
      }

      const successCount = results.length;
      const failCount = errors.length;

      // 결과 저장
      setUploadResult({
        success: successCount,
        failed: failCount,
        errors: errors,
      });
      setIsUploading(false);

      // 협력사인 경우 성공한 주문에 대한 일괄 알림 전송
      console.log(`🎯 [발주서 업로드 완료] successCount: ${successCount}`);
      if (successCount > 0) {
        try {
          console.log(`🎯 [발주서 업로드 완료] 협력사 일괄 알림 전송 시작`);
          
          console.log(`🎯 [발주서 업로드 완료] session:`, session?.user);
          const assignedPartner = (session?.user as any)?.assignedPartner;
          console.log(`🎯 [발주서 업로드 완료] assignedPartner: ${assignedPartner}`);
          
          if (assignedPartner) {
            // 협력사가 발주서 업로드한 경우 Server Action을 통해 알림 전송
            console.log(`🎯 [발주서 업로드 완료] Server Action 호출`);
            const { notifyPartnerOrderUpload } = await import("@/app/actions/notifications");
            const result = await notifyPartnerOrderUpload(assignedPartner, successCount);
            
            if (result.success) {
              console.log(`📢 협력사 일괄 알림 전송 완료: ${assignedPartner}, ${successCount}건`);
            } else {
              console.error(`❌ 협력사 일괄 알림 전송 실패:`, result.error);
            }
          } else {
            console.log(`⚠️ [발주서 업로드 완료] assignedPartner가 없음 - 관리자 계정`);
          }
        } catch (error) {
          console.error("❌ 협력사 일괄 알림 전송 실패:", error);
        }
      }

      // Dialog에서 결과를 표시하므로 alert 제거
      // 성공 건수가 있으면 자동으로 페이지 새로고침은 Dialog 닫을 때 처리
    } catch (error) {
      console.error("Import error:", error);
      setIsUploading(false);
      alert(`❌ 가져오기 실패: ${error}`);
    }
  };

  // 실패한 데이터를 CSV로 다운로드
  const handleDownloadFailedData = () => {
    if (!uploadResult || uploadResult.errors.length === 0) return;

    const failedData = uploadResult.errors.map((err) => ({
      행번호: err.row,
      날짜: err.data.날짜 || "",
      고객명: err.data.고객명 || "",
      전화번호: err.data.전화번호 || "",
      이동통신: err.data.이동통신 || "",
      우편번호: err.data.우편번호 || "",
      주소: err.data.주소 || "",
      주문번호: err.data.주문번호 || "",
      "상품명 및 수량": err.data["상품명 및 수량"] || "",
      배송메시지: err.data.배송메시지 || "",
      고객주문처명: err.data.고객주문처명 || "",
      단가: err.data.단가 || "",
      배송비: err.data.배송비 || "",
      택배사: err.data.택배사 || "",
      운송장번호: err.data.운송장번호 || "",
      에러내용: err.error,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(failedData);
    ws["!cols"] = [
      { wch: 8 },  // 행번호
      { wch: 12 }, // 날짜
      { wch: 15 }, // 고객명
      { wch: 15 }, // 전화번호
      { wch: 15 }, // 이동통신
      { wch: 12 }, // 우편번호
      { wch: 40 }, // 주소
      { wch: 20 }, // 주문번호
      { wch: 30 }, // 상품명 및 수량
      { wch: 30 }, // 배송메시지
      { wch: 15 }, // 고객주문처명
      { wch: 12 }, // 단가
      { wch: 10 }, // 배송비
      { wch: 15 }, // 택배사
      { wch: 20 }, // 운송장번호
      { wch: 50 }, // 에러내용
    ];

    XLSX.utils.book_append_sheet(wb, ws, "실패목록");
    XLSX.writeFile(wb, `발주서_업로드_실패_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleCloseDialog = () => {
    setIsUploadDialogOpen(false);
    if (uploadResult && uploadResult.success > 0) {
      window.location.reload();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length === 0) {
          alert("❌ 발주서 파일에 데이터가 없습니다.");
          return;
        }

        setIsUploadDialogOpen(true);
        handleImport(jsonData);
      } catch (error) {
        console.error("Excel parse error:", error);
        alert(`❌ 발주서 파일 읽기 실패: ${error}`);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleDownloadSample}
          variant="outline"
          size="default"
        >
          <Download className="mr-2 h-4 w-4" />
          샘플 다운로드
        </Button>

        <Button asChild variant="default" size="default" className="bg-green-600 hover:bg-green-700">
          <label className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            발주서 업로드
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </Button>
      </div>

      {/* 업로드 진행 상황 Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>발주서 업로드</DialogTitle>
            <DialogDescription>
              {isUploading
                ? "발주서 데이터를 업로드하고 있습니다..."
                : uploadResult
                ? "업로드가 완료되었습니다."
                : "업로드를 시작합니다."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>진행률</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {uploadResult && (
              <div className="space-y-3">
                <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                  <p className="text-sm font-medium text-green-800">
                    ✅ 성공: {uploadResult.success}건
                  </p>
                </div>

                {uploadResult.failed > 0 && (
                  <div className="rounded-lg bg-red-50 p-4 border border-red-200 space-y-3">
                    <p className="text-sm font-medium text-red-800">
                      ❌ 실패: {uploadResult.failed}건
                    </p>
                    
                    <div className="max-h-[200px] overflow-y-auto space-y-2">
                      {uploadResult.errors.slice(0, 5).map((err, index) => (
                        <div key={index} className="text-xs text-red-700 bg-white p-2 rounded border border-red-100">
                          <div className="font-medium">행 {err.row}: {err.name}</div>
                          <div className="text-red-600 mt-1">{err.error}</div>
                        </div>
                      ))}
                      {uploadResult.errors.length > 5 && (
                        <p className="text-xs text-red-600 text-center pt-2">
                          ... 외 {uploadResult.errors.length - 5}건
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={handleDownloadFailedData}
                      variant="outline"
                      size="sm"
                      className="w-full border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      실패 내역 CSV 다운로드
                    </Button>
                  </div>
                )}

                {uploadResult.success > 0 && (
                  <p className="text-sm text-gray-600">
                    📧 협력사 계정인 경우, 관리자에게 자동으로 알림이 전송되었습니다.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={handleCloseDialog}
              disabled={isUploading}
            >
              {isUploading ? "업로드 중..." : "확인"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

