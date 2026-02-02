"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ASSearchFilter } from "@/components/after-service/as-search-filter";
import { ASRequestDialog } from "@/components/orders/as-request-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Phone,
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench,
  Package,
  FileText,
  Bell,
  Upload,
  FileSpreadsheet,
  Download,
  Truck,
  Trash2,
  RefreshCw,
  Building,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  X,
  Save,
  BarChart3,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import * as XLSX from "xlsx";

// 상태 라벨 (5단계)
const statusLabels: Record<string, string> = {
  RECEIVED: "접수",
  IN_PROGRESS: "처리",
  AS: "AS",
  EXCHANGE: "교환",
  COMPLETED: "완료",
};

// 상태 색상
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    RECEIVED: "bg-blue-100 text-blue-800 border-blue-300",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800 border-yellow-300",
    AS: "bg-purple-100 text-purple-800 border-purple-300",
    EXCHANGE: "bg-orange-100 text-orange-800 border-orange-300",
    COMPLETED: "bg-green-100 text-green-800 border-green-300",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

interface AfterService {
  id: string;
  asNumber: string;
  ticketNumber?: string;
  companyName?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  pickupRequestDate?: string;
  processDate?: string;
  shipDate?: string;
  pickupCompleteDate?: string;
  purchaseDate?: string;
  productName?: string;
  description?: string;
  repairContent?: string;
  trackingNumber?: string;
  courier?: string;
  status: string;
  priority: string;
  receivedAt: string;
  completedAt?: string;
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
}

export default function AfterServicePage() {
  const { data: session } = useSession();
  
  // 현재 사용자의 협력사 정보 (null이면 본사 - 전체 접근)
  const userPartner = (session?.user as { assignedPartner?: string | null })?.assignedPartner || null;
  
  const [asData, setAsData] = useState<AfterService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  
  // 상세 검색 조건
  // 협력사 사용자는 자신의 업체만 선택 가능
  const [companyFilter, setCompanyFilter] = useState("all"); // 고객주문처명(업체명)
  const [searchName, setSearchName] = useState(""); // 고객명
  const [searchPhone, setSearchPhone] = useState(""); // 전화번호
  const [dateRange, setDateRange] = useState("all"); // 조회기간
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // 허용된 업체명 목록
  const ALL_COMPANIES = ["본사", "로켓그로스", "그로트", "스몰닷", "해피포즈", "기타"];
  
  // 협력사 사용자는 자신의 업체만 표시
  const ALLOWED_COMPANIES = useMemo(() => {
    if (userPartner) {
      // 협력사 사용자: 자신의 업체만 표시
      return [userPartner];
    }
    // 본사 사용자: 전체 업체 표시
    return ALL_COMPANIES;
  }, [userPartner]);
  
  // 협력사 사용자는 업체명 필터를 자동 설정
  useEffect(() => {
    if (userPartner && companyFilter === "all") {
      setCompanyFilter(userPartner);
    }
  }, [userPartner]);
  
  // 협력사 사용자는 신규 등록 시 업체명 자동 설정
  useEffect(() => {
    if (userPartner) {
      setNewAS(prev => ({ ...prev, companyName: userPartner }));
    }
  }, [userPartner]);
  
  // 다이얼로그 상태
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAS, setSelectedAS] = useState<AfterService | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [errorLogDialogOpen, setErrorLogDialogOpen] = useState(false);
  const [errorLogs, setErrorLogs] = useState<string[]>([]);
  
  // 인라인 등록/수정 상태
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // 신규 등록 폼
  const [newAS, setNewAS] = useState({
    companyName: "",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    pickupRequestDate: "",
    processDate: "",
    shipDate: "",
    pickupCompleteDate: "",
    purchaseDate: "",
    productName: "",
    description: "",
    repairContent: "",
    trackingNumber: "",
    courier: "",
    status: "RECEIVED",
    receivedAt: new Date().toISOString().split('T')[0],
  });
  
  // 인라인 수정용 데이터
  const [editData, setEditData] = useState<Partial<AfterService>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 데이터 조회
  const fetchASData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/after-service");
      if (response.ok) {
        const data = await response.json();
        setAsData(data);
      }
    } catch (error) {
      console.error("AS 데이터 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSearch = () => {
    setSearchTerm("");
    setSearchName("");
    setSearchPhone("");
    setCompanyFilter("all");
    setStatusFilter("all");
    setDateRange("all");
    setStartDate("");
    setEndDate("");
    setPageSize(50);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchASData();
  }, []);

  // 필터링된 데이터
  const filteredData = asData
    .filter(item => {
      // 업체명 필터
      if (companyFilter !== "all" && item.companyName !== companyFilter) {
        return false;
      }
      
      // 고객명 검색
      if (searchName.trim()) {
        const name = (item.customerName || "").toLowerCase();
        if (!name.includes(searchName.toLowerCase().trim())) {
          return false;
        }
      }
      
      // 전화번호 검색
      if (searchPhone.trim()) {
        const phone = item.customerPhone || "";
        if (!phone.includes(searchPhone.trim())) {
          return false;
        }
      }
      
      // 날짜 필터
      const receivedDate = new Date(item.receivedAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateRange === "1day") {
        const itemDay = new Date(receivedDate);
        itemDay.setHours(0, 0, 0, 0);
        if (itemDay.getTime() !== today.getTime()) {
          return false;
        }
      } else if (dateRange === "1week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (receivedDate < weekAgo) {
          return false;
        }
      } else if (dateRange === "1month") {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        if (receivedDate < monthAgo) {
          return false;
        }
      } else if (dateRange === "1year") {
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        if (receivedDate < yearAgo) {
          return false;
        }
      } else if (dateRange === "custom" && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (receivedDate < start || receivedDate > end) {
          return false;
        }
      }
      
      // 통합 검색 (기존 searchTerm)
      if (searchTerm.trim()) {
        const matchSearch = 
          (item.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.asNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.productName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.customerPhone || "").includes(searchTerm);
        if (!matchSearch) {
          return false;
        }
      }
      
      // 상태 필터
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      return matchStatus;
    })
    .sort((a, b) => {
      // 접수일 기준 최신순 정렬 (내림차순)
      const dateA = new Date(a.receivedAt).getTime();
      const dateB = new Date(b.receivedAt).getTime();
      return dateB - dateA;
    });

  // 페이지네이션
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 통계
  const stats = {
    total: asData.length,
    received: asData.filter(a => a.status === "RECEIVED").length,
    inProgress: asData.filter(a => a.status === "IN_PROGRESS").length,
    as: asData.filter(a => a.status === "AS").length,
    exchange: asData.filter(a => a.status === "EXCHANGE").length,
    completed: asData.filter(a => a.status === "COMPLETED").length,
  };

  // 날짜 포맷
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "yy.MM.dd", { locale: ko });
    } catch {
      return dateStr;
    }
  };

  const formatDateFull = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "yyyy.MM.dd", { locale: ko });
    } catch {
      return dateStr;
    }
  };

  // 인라인 신규 등록 시작
  const startAddNew = () => {
    setIsAddingNew(true);
    setNewAS({
      companyName: "",
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      pickupRequestDate: "",
      processDate: "",
      shipDate: "",
      pickupCompleteDate: "",
      purchaseDate: "",
      productName: "",
      description: "",
      repairContent: "",
      trackingNumber: "",
      courier: "",
      status: "RECEIVED",
      receivedAt: new Date().toISOString().split('T')[0],
    });
  };

  // 인라인 신규 등록 취소
  const cancelAddNew = () => {
    setIsAddingNew(false);
  };

  // 인라인 신규 등록 저장
  const saveNewAS = async () => {
    if (!newAS.customerName) {
      alert("고객명을 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/after-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAS),
      });
      
      if (response.ok) {
        alert("✅ AS가 성공적으로 접수되었습니다.");
        setIsAddingNew(false);
        fetchASData();
      } else {
        const error = await response.json();
        alert(`❌ 접수 실패: ${error.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      alert("❌ 접수 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 인라인 수정 시작
  const startEdit = (item: AfterService) => {
    setEditingId(item.id);
    setEditData({ ...item });
  };

  // 인라인 수정 취소
  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // 인라인 수정 저장
  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/after-service`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editData }),
      });
      
      if (response.ok) {
        alert("✅ AS 정보가 수정되었습니다.");
        setEditingId(null);
        setEditData({});
        fetchASData();
      } else {
        const error = await response.json();
        alert(`❌ 수정 실패: ${error.message || error.error || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("수정 오류:", error);
      alert("❌ 수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // AS 수정
  const handleUpdateAS = async () => {
    if (!selectedAS) return;
    try {
      const response = await fetch(`/api/after-service`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedAS),
      });
      
      if (response.ok) {
        alert("✅ AS 정보가 수정되었습니다.");
        setEditDialogOpen(false);
        fetchASData();
      } else {
        const error = await response.json();
        alert(`❌ 수정 실패: ${error.message || error.error || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("수정 오류:", error);
      alert("❌ 수정 중 오류가 발생했습니다.");
    }
  };

  // AS 삭제
  const handleDeleteAS = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    
    try {
      console.log("삭제 요청 시작:", id);
      const response = await fetch(`/api/after-service/${id}`, {
        method: "DELETE",
      });
      
      console.log("응답 상태:", response.status);
      const result = await response.json();
      console.log("응답 결과:", result);
      
      if (response.ok) {
        alert("✅ 삭제되었습니다.");
        fetchASData();
      } else {
        alert(`❌ 삭제 실패: ${result.error || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("삭제 오류:", error);
      alert(`❌ 삭제 중 오류가 발생했습니다: ${error}`);
    }
  };

  // 엑셀 파일 읽기 (1단계: 파일만 읽고 년도 선택 대기)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // 첫 번째 행은 헤더
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];
      
      const mappedData = rows.filter(row => row.length > 0 && row[0]).map(row => {
        // 엑셀 컬럼 순서: 날짜, 업체명, 고객명, 수거요청, 처리, 발송, 수거완료, 구매일자, 제품, 내용, 수리내역, 운송장번호, 연락처, 주소지
        return {
          receivedAt: parseExcelDate(row[0]),
          companyName: row[1] || "",
          customerName: row[2] || "",
          pickupRequestDate: parseExcelDate(row[3]),
          status: mapStatus(row[4]),
          shipDate: parseExcelDate(row[5]),
          pickupCompleteDate: parseExcelDate(row[6]),
          purchaseDate: parseExcelDate(row[7]),
          productName: row[8] || "",
          description: row[9] || "",
          repairContent: row[10] || "",
          trackingNumber: String(row[11] || ""),
          customerPhone: row[12] || "",
          customerAddress: row[13] || "",
        };
      });
      
      setImportPreview(mappedData);
      setImportDialogOpen(true);
    };
    reader.readAsBinaryString(file);
    
    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };



  // 엑셀 날짜 파싱 - 엑셀에 2026-01-01 형식으로 저장된 날짜를 파싱
  const parseExcelDate = (value: any): string => {
    if (!value) return "";
    
    // 숫자형 (엑셀 시리얼 넘버)
    if (typeof value === "number") {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
      }
    }
    
    // 문자열
    const str = String(value).trim();
    
    // "2026-01-01" 형식 (ISO 날짜 형식)
    const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      const year = isoMatch[1];
      const month = isoMatch[2].padStart(2, "0");
      const day = isoMatch[3].padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    
    // "2026.01.01" 또는 "2026.1.1" 형식
    const fullDotMatch = str.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
    if (fullDotMatch) {
      const year = fullDotMatch[1];
      const month = fullDotMatch[2].padStart(2, "0");
      const day = fullDotMatch[3].padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    
    // "26.01.01" 형식 (2자리 년도) - 20XX로 변환
    const shortYearDotMatch = str.match(/^(\d{2})\.(\d{1,2})\.(\d{1,2})$/);
    if (shortYearDotMatch) {
      const year = `20${shortYearDotMatch[1]}`;
      const month = shortYearDotMatch[2].padStart(2, "0");
      const day = shortYearDotMatch[3].padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    
    // "2026/01/01" 형식
    const slashMatch = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (slashMatch) {
      const year = slashMatch[1];
      const month = slashMatch[2].padStart(2, "0");
      const day = slashMatch[3].padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    
    return str;
  };

  // 상태 매핑 - 엑셀 데이터를 분석하여 적절한 상태로 변환
  const mapStatus = (value: any): string => {
    const str = String(value || "").toUpperCase().trim();
    
    // AS 상태 체크
    if (str === "AS" || str.includes("수리") || str.includes("A/S") || str.includes("A.S")) {
      return "AS";
    }
    
    // 교환 상태 체크
    if (str.includes("교환") || str.includes("교체") || str === "EXCHANGE") {
      return "EXCHANGE";
    }
    
    // 처리 상태 체크
    if (str.includes("처리") || str === "IN_PROGRESS" || str.includes("진행")) {
      return "IN_PROGRESS";
    }
    
    // 접수 상태 (기본값)
    if (str.includes("접수") || str === "RECEIVED" || str === "신규") {
      return "RECEIVED";
    }
    
    // 기본값은 접수
    return "RECEIVED";
  };

  // 일괄 import
  const handleBulkImport = async () => {
    try {
      const response = await fetch("/api/after-service/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: importPreview }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        if (result.errors && result.errors.length > 0) {
          // 일부 실패
          setErrorLogs(result.errors);
          setErrorLogDialogOpen(true);
          alert(`⚠️ ${result.successCount}건 성공, ${result.errors.length}건 실패\n실패 내역을 확인해주세요.`);
        } else {
          // 전체 성공
          alert(`✅ ${result.count}건이 성공적으로 등록되었습니다.`);
        }
        setImportDialogOpen(false);
        setImportPreview([]);
        fetchASData();
      } else {
        // API 에러
        const errorMessage = result.error || result.message || "알 수 없는 오류";
        const errorDetail = result.details ? `\n상세: ${result.details}` : "";
        setErrorLogs([`API 에러: ${errorMessage}${errorDetail}`]);
        setErrorLogDialogOpen(true);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "알 수 없는 오류";
      setErrorLogs([`네트워크 오류: ${errorMsg}`]);
      setErrorLogDialogOpen(true);
    }
  };

  // 엑셀 내보내기
  const handleExport = () => {
    const exportData = filteredData.map(item => ({
      "날짜": formatDateFull(item.receivedAt),
      "업체명": item.companyName || "",
      "고객명": item.customerName || "",
      "수거요청": formatDateFull(item.pickupRequestDate),
      "처리": statusLabels[item.status] || item.status,
      "발송": formatDateFull(item.shipDate),
      "수거완료": formatDateFull(item.pickupCompleteDate),
      "구매일자": formatDateFull(item.purchaseDate),
      "제품": item.productName || "",
      "내용": item.description || "",
      "수리 내역": item.repairContent || "",
      "운송장번호": item.trackingNumber || "",
      "연락처": item.customerPhone || "",
      "주소지": item.customerAddress || "",
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AS목록");
    XLSX.writeFile(wb, `AS관리_${format(new Date(), "yyyyMMdd")}.xlsx`);
  };

  // 에러 로그 복사
  const copyErrorLogs = () => {
    const logText = errorLogs.join("\n\n");
    navigator.clipboard.writeText(logText).then(() => {
      alert("✅ 에러 로그가 클립보드에 복사되었습니다.");
    }).catch(() => {
      alert("❌ 복사 중 오류가 발생했습니다.");
    });
  };

  // 전체 삭제
  const handleDeleteAll = async () => {
    if (deleteConfirmText !== "전체삭제") {
      alert("⚠️ '전체삭제'를 정확히 입력해주세요.");
      return;
    }

    try {
      const response = await fetch("/api/after-service/delete-all", {
        method: "DELETE",
      });

      if (response.ok) {
        alert("✅ 전체 데이터가 삭제되었습니다.");
        setDeleteAllDialogOpen(false);
        setDeleteConfirmText("");
        fetchASData();
      } else {
        alert("❌ 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Delete all error:", error);
      alert(`❌ 삭제 중 오류 발생: ${error}`);
    }
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(item => item.id)));
    }
  };

  // 개별 선택/해제
  const toggleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // 다중 삭제
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`선택한 ${selectedIds.size}개의 AS 건을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedIds).map(id =>
        fetch(`/api/after-service/${id}`, { method: "DELETE" })
      );
      
      const responses = await Promise.all(deletePromises);
      const successCount = responses.filter(r => r.ok).length;
      
      if (successCount === selectedIds.size) {
        alert(`${successCount}개의 AS 건이 삭제되었습니다.`);
      } else {
        alert(`${successCount}/${selectedIds.size}개의 AS 건이 삭제되었습니다.`);
      }
      
      setSelectedIds(new Set());
      fetchASData();
    } catch (error) {
      console.error("Bulk delete failed:", error);
      alert("일부 AS 건 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            🔧 AS 접수 및 관리
          </h2>
          <p className="text-muted-foreground mt-1">
            A/S 접수 현황을 관리하고 엑셀로 일괄 등록할 수 있습니다
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/after-service/kpi">
            <Button variant="outline" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              KPI 대시보드
            </Button>
          </Link>
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" />
            엑셀 Import
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            엑셀 Export
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setDeleteAllDialogOpen(true)} 
            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
          >
            <Trash2 className="h-4 w-4" />
            전체 삭제
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4" />
            신규 접수
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체</CardTitle>
            <Package className="h-5 w-5 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">접수</CardTitle>
            <Clock className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{stats.received}</div>
            <Progress value={stats.total > 0 ? (stats.received / stats.total) * 100 : 0} className="mt-2 h-1.5 [&>div]:bg-blue-500" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">처리</CardTitle>
            <Wrench className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700">{stats.inProgress}</div>
            <Progress value={stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0} className="mt-2 h-1.5 [&>div]:bg-amber-500" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">AS</CardTitle>
            <Settings className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">{stats.as}</div>
            <Progress value={stats.total > 0 ? (stats.as / stats.total) * 100 : 0} className="mt-2 h-1.5 [&>div]:bg-purple-500" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">교환</CardTitle>
            <RefreshCw className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">{stats.exchange}</div>
            <Progress value={stats.total > 0 ? (stats.exchange / stats.total) * 100 : 0} className="mt-2 h-1.5 [&>div]:bg-orange-500" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">완료</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{stats.completed}</div>
            <Progress value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0} className="mt-2 h-1.5 [&>div]:bg-green-500" />
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <ASSearchFilter
        companyFilter={companyFilter}
        setCompanyFilter={setCompanyFilter}
        searchName={searchName}
        setSearchName={setSearchName}
        searchPhone={searchPhone}
        setSearchPhone={setSearchPhone}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        pageSize={pageSize}
        setPageSize={setPageSize}
        filteredCount={filteredData.length}
        totalCount={asData.length}
        onReset={handleResetSearch}
        onPageChange={() => setCurrentPage(1)}
        companies={ALLOWED_COMPANIES}
        disableCompanyFilter={!!userPartner}
      />

      {/* AS 목록 테이블 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle>AS 목록</CardTitle>
                <Badge variant="secondary">{filteredData.length}건</Badge>
              </div>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-600">{selectedIds.size}개 선택됨</span>
                  <Button 
                    onClick={handleBulkDelete} 
                    variant="destructive" 
                    size="sm"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    선택 삭제
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-[80px]">날짜</TableHead>
                  <TableHead className="w-[80px]">업체명</TableHead>
                  <TableHead className="w-[80px]">고객명</TableHead>
                  <TableHead className="w-[110px]">연락처</TableHead>
                  <TableHead className="min-w-[200px]">주소</TableHead>
                  <TableHead className="w-[80px]">수거요청</TableHead>
                  <TableHead className="w-[70px]">상태</TableHead>
                  <TableHead className="w-[80px]">발송</TableHead>
                  <TableHead className="w-[80px]">수거완료</TableHead>
                  <TableHead className="w-[80px]">구매일자</TableHead>
                  <TableHead className="w-[100px]">제품</TableHead>
                  <TableHead className="w-[120px]">내용</TableHead>
                  <TableHead className="w-[120px]">수리내역</TableHead>
                  <TableHead className="w-[100px]">운송장</TableHead>
                  <TableHead className="w-[80px]">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* 신규 등록 행 */}
                {isAddingNew && (
                  <TableRow className="bg-blue-50 hover:bg-blue-100">
                    <TableCell>
                      <Input
                        type="date"
                        value={newAS.receivedAt}
                        onChange={(e) => setNewAS({ ...newAS, receivedAt: e.target.value })}
                        className="h-8 w-full text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={newAS.companyName} 
                        onValueChange={(v) => setNewAS({ ...newAS, companyName: v })}
                        disabled={!!userPartner}
                      >
                        <SelectTrigger className={`h-8 text-xs ${userPartner ? 'opacity-70' : ''}`}>
                          <SelectValue placeholder="업체" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALLOWED_COMPANIES.map((company) => (
                            <SelectItem key={company} value={company}>
                              {company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="고객명*"
                        value={newAS.customerName}
                        onChange={(e) => setNewAS({ ...newAS, customerName: e.target.value })}
                        className="h-8 w-full text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="연락처"
                        value={newAS.customerPhone}
                        onChange={(e) => setNewAS({ ...newAS, customerPhone: e.target.value })}
                        className="h-8 w-full text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="주소"
                        value={newAS.customerAddress}
                        onChange={(e) => setNewAS({ ...newAS, customerAddress: e.target.value })}
                        className="h-8 w-full text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={newAS.pickupRequestDate}
                        onChange={(e) => setNewAS({ ...newAS, pickupRequestDate: e.target.value })}
                        className="h-8 w-full text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={newAS.status} onValueChange={(v) => setNewAS({ ...newAS, status: v })}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RECEIVED">접수</SelectItem>
                          <SelectItem value="IN_PROGRESS">처리</SelectItem>
                          <SelectItem value="AS">AS</SelectItem>
                          <SelectItem value="EXCHANGE">교환</SelectItem>
                          <SelectItem value="COMPLETED">완료</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={newAS.shipDate}
                        onChange={(e) => setNewAS({ ...newAS, shipDate: e.target.value })}
                        className="h-8 w-full text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={newAS.pickupCompleteDate}
                        onChange={(e) => setNewAS({ ...newAS, pickupCompleteDate: e.target.value })}
                        className="h-8 w-full text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={newAS.purchaseDate}
                        onChange={(e) => setNewAS({ ...newAS, purchaseDate: e.target.value })}
                        className="h-8 w-full text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="제품명"
                        value={newAS.productName}
                        onChange={(e) => setNewAS({ ...newAS, productName: e.target.value })}
                        className="h-8 w-full text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="내용"
                        value={newAS.description}
                        onChange={(e) => setNewAS({ ...newAS, description: e.target.value })}
                        className="h-8 w-full text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="수리내역"
                        value={newAS.repairContent}
                        onChange={(e) => setNewAS({ ...newAS, repairContent: e.target.value })}
                        className="h-8 w-full text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="운송장"
                        value={newAS.trackingNumber}
                        onChange={(e) => setNewAS({ ...newAS, trackingNumber: e.target.value })}
                        className="h-8 w-full text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={saveNewAS}
                        disabled={saving}
                        className="h-7"
                      >
                        <Save className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )}

                {loading ? (
                  <TableRow>
                    <TableCell colSpan={16} className="h-32 text-center">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 && !isAddingNew ? (
                  <TableRow>
                    <TableCell colSpan={16} className="h-32 text-center text-muted-foreground">
                      등록된 AS 데이터가 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => {
                    const isEditing = editingId === item.id;
                    const data = isEditing ? editData : item;

                    return (
                      <TableRow key={item.id} className={isEditing ? "bg-yellow-50 hover:bg-yellow-100" : "hover:bg-muted/30"}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={() => toggleSelectOne(item.id)}
                          />
                        </TableCell>
                        
                        {/* 날짜 */}
                        <TableCell className="text-xs">
                          {isEditing ? (
                            <Input
                              type="date"
                              value={data.receivedAt ? new Date(data.receivedAt).toISOString().split('T')[0] : ""}
                              onChange={(e) => setEditData({ ...editData, receivedAt: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                              className="h-8 w-full text-xs"
                            />
                          ) : (
                            formatDate(item.receivedAt)
                          )}
                        </TableCell>
                        
                        {/* 업체명 */}
                        <TableCell className="text-xs">
                          {isEditing ? (
                            <Select 
                              value={data.companyName || ""} 
                              onValueChange={(v) => setEditData({ ...editData, companyName: v })}
                              disabled={!!userPartner}
                            >
                              <SelectTrigger className={`h-8 text-xs ${userPartner ? 'opacity-70' : ''}`}>
                                <SelectValue placeholder="업체" />
                              </SelectTrigger>
                              <SelectContent>
                                {ALLOWED_COMPANIES.map((company) => (
                                  <SelectItem key={company} value={company}>
                                    {company}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            item.companyName || "-"
                          )}
                        </TableCell>
                        
                        {/* 고객명 */}
                        <TableCell className="text-xs font-medium">
                          {isEditing ? (
                            <Input
                              value={data.customerName || ""}
                              onChange={(e) => setEditData({ ...editData, customerName: e.target.value })}
                              className="h-8 w-full text-xs"
                            />
                          ) : (
                            <button
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              onClick={() => {
                                setSelectedAS(item);
                                setViewDialogOpen(true);
                              }}
                            >
                              {item.customerName}
                            </button>
                          )}
                        </TableCell>
                        
                        {/* 연락처 */}
                        <TableCell className="text-xs">
                          {isEditing ? (
                            <Input
                              value={data.customerPhone || ""}
                              onChange={(e) => setEditData({ ...editData, customerPhone: e.target.value })}
                              className="h-8 w-full text-xs"
                            />
                          ) : (
                            item.customerPhone || "-"
                          )}
                        </TableCell>
                        
                        {/* 주소 */}
                        <TableCell className="text-xs max-w-[250px] truncate" title={item.customerAddress}>
                          {isEditing ? (
                            <Input
                              value={data.customerAddress || ""}
                              onChange={(e) => setEditData({ ...editData, customerAddress: e.target.value })}
                              className="h-8 w-full text-xs"
                            />
                          ) : (
                            item.customerAddress || "-"
                          )}
                        </TableCell>
                        
                        {/* 수거요청일 */}
                        <TableCell className="text-xs">
                          {isEditing ? (
                            <Input
                              type="date"
                              value={data.pickupRequestDate ? new Date(data.pickupRequestDate).toISOString().split('T')[0] : ""}
                              onChange={(e) => setEditData({ ...editData, pickupRequestDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                              className="h-8 w-full text-xs"
                            />
                          ) : (
                            formatDate(item.pickupRequestDate)
                          )}
                        </TableCell>
                        
                        {/* 상태 */}
                        <TableCell>
                          {isEditing ? (
                            <Select value={data.status} onValueChange={(v) => setEditData({ ...editData, status: v })}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="RECEIVED">접수</SelectItem>
                                <SelectItem value="IN_PROGRESS">처리</SelectItem>
                                <SelectItem value="AS">AS</SelectItem>
                                <SelectItem value="EXCHANGE">교환</SelectItem>
                                <SelectItem value="COMPLETED">완료</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                              {statusLabels[item.status]}
                            </Badge>
                          )}
                        </TableCell>
                        
                        {/* 발송일 */}
                        <TableCell className="text-xs">
                          {isEditing ? (
                            <Input
                              type="date"
                              value={data.shipDate ? new Date(data.shipDate).toISOString().split('T')[0] : ""}
                              onChange={(e) => setEditData({ ...editData, shipDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                              className="h-8 w-full text-xs"
                            />
                          ) : (
                            formatDate(item.shipDate)
                          )}
                        </TableCell>
                        
                        {/* 수거완료일 */}
                        <TableCell className="text-xs">
                          {isEditing ? (
                            <Input
                              type="date"
                              value={data.pickupCompleteDate ? new Date(data.pickupCompleteDate).toISOString().split('T')[0] : ""}
                              onChange={(e) => setEditData({ ...editData, pickupCompleteDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                              className="h-8 w-full text-xs"
                            />
                          ) : (
                            formatDate(item.pickupCompleteDate)
                          )}
                        </TableCell>
                        
                        {/* 구매일자 */}
                        <TableCell className="text-xs">
                          {isEditing ? (
                            <Input
                              type="date"
                              value={data.purchaseDate ? new Date(data.purchaseDate).toISOString().split('T')[0] : ""}
                              onChange={(e) => setEditData({ ...editData, purchaseDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                              className="h-8 w-full text-xs"
                            />
                          ) : (
                            formatDate(item.purchaseDate)
                          )}
                        </TableCell>
                        
                        {/* 제품 */}
                        <TableCell className="text-xs">
                          {isEditing ? (
                            <Input
                              value={data.productName || ""}
                              onChange={(e) => setEditData({ ...editData, productName: e.target.value })}
                              className="h-8 w-full text-xs"
                            />
                          ) : (
                            item.productName || "-"
                          )}
                        </TableCell>
                        
                        {/* 내용 */}
                        <TableCell className="text-xs">
                          {isEditing ? (
                            <Input
                              value={data.description || ""}
                              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                              className="h-8 w-full text-xs"
                            />
                          ) : (
                            <div 
                              className="max-w-[120px] truncate cursor-help" 
                              title={item.description || "-"}
                            >
                              {item.description || "-"}
                            </div>
                          )}
                        </TableCell>
                        
                        {/* 수리내역 */}
                        <TableCell className="text-xs">
                          {isEditing ? (
                            <Input
                              value={data.repairContent || ""}
                              onChange={(e) => setEditData({ ...editData, repairContent: e.target.value })}
                              className="h-8 w-full text-xs"
                            />
                          ) : (
                            <div 
                              className="max-w-[120px] truncate cursor-help" 
                              title={item.repairContent || "-"}
                            >
                              {item.repairContent || "-"}
                            </div>
                          )}
                        </TableCell>
                        
                        {/* 운송장 */}
                        <TableCell className="text-xs">
                          {isEditing ? (
                            <Input
                              value={data.trackingNumber || ""}
                              onChange={(e) => setEditData({ ...editData, trackingNumber: e.target.value })}
                              className="h-8 w-full text-xs"
                            />
                          ) : (
                            item.trackingNumber || "-"
                          )}
                        </TableCell>
                        
                        {/* 관리 */}
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                setSelectedAS(item);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteAS(item.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                전체 {filteredData.length}건 중 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredData.length)}건
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 신규 접수 다이얼로그 */}
      <ASRequestDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchASData}
      />

      {/* 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              AS 정보 수정
            </DialogTitle>
          </DialogHeader>
          {selectedAS && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  업체명
                  {userPartner && <span className="ml-1 text-orange-600 text-xs">(고정)</span>}
                </Label>
                <Select 
                  value={selectedAS.companyName || ""} 
                  onValueChange={(v) => setSelectedAS({ ...selectedAS, companyName: v })}
                  disabled={!!userPartner}
                >
                  <SelectTrigger className={userPartner ? 'opacity-70' : ''}>
                    <SelectValue placeholder="업체 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALLOWED_COMPANIES.map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>고객명</Label>
                <Input
                  value={selectedAS.customerName || ""}
                  onChange={(e) => setSelectedAS({ ...selectedAS, customerName: e.target.value })}
                />
              </div>
              <div>
                <Label>연락처</Label>
                <Input
                  value={selectedAS.customerPhone || ""}
                  onChange={(e) => setSelectedAS({ ...selectedAS, customerPhone: e.target.value })}
                />
              </div>
              <div>
                <Label>상태</Label>
                <Select
                  value={selectedAS.status}
                  onValueChange={(v) => setSelectedAS({ ...selectedAS, status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECEIVED">접수</SelectItem>
                    <SelectItem value="IN_PROGRESS">처리</SelectItem>
                    <SelectItem value="AS">AS</SelectItem>
                    <SelectItem value="EXCHANGE">교환</SelectItem>
                    <SelectItem value="COMPLETED">완료</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>제품명</Label>
                <Input
                  value={selectedAS.productName || ""}
                  onChange={(e) => setSelectedAS({ ...selectedAS, productName: e.target.value })}
                />
              </div>
              <div>
                <Label>운송장번호</Label>
                <Input
                  value={selectedAS.trackingNumber || ""}
                  onChange={(e) => setSelectedAS({ ...selectedAS, trackingNumber: e.target.value })}
                />
              </div>
              <div>
                <Label>수거요청일</Label>
                <Input
                  type="date"
                  value={selectedAS.pickupRequestDate ? new Date(selectedAS.pickupRequestDate).toISOString().split('T')[0] : ""}
                  onChange={(e) => setSelectedAS({ ...selectedAS, pickupRequestDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                />
              </div>
              <div>
                <Label>처리일</Label>
                <Input
                  type="date"
                  value={selectedAS.processDate ? new Date(selectedAS.processDate).toISOString().split('T')[0] : ""}
                  onChange={(e) => setSelectedAS({ ...selectedAS, processDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                />
              </div>
              <div>
                <Label>발송일</Label>
                <Input
                  type="date"
                  value={selectedAS.shipDate ? new Date(selectedAS.shipDate).toISOString().split('T')[0] : ""}
                  onChange={(e) => setSelectedAS({ ...selectedAS, shipDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                />
              </div>
              <div>
                <Label>수거완료일</Label>
                <Input
                  type="date"
                  value={selectedAS.pickupCompleteDate ? new Date(selectedAS.pickupCompleteDate).toISOString().split('T')[0] : ""}
                  onChange={(e) => setSelectedAS({ ...selectedAS, pickupCompleteDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                />
              </div>
              <div>
                <Label>구매일</Label>
                <Input
                  type="date"
                  value={selectedAS.purchaseDate ? new Date(selectedAS.purchaseDate).toISOString().split('T')[0] : ""}
                  onChange={(e) => setSelectedAS({ ...selectedAS, purchaseDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                />
              </div>
              <div>
                <Label>접수일</Label>
                <Input
                  type="date"
                  value={selectedAS.receivedAt ? new Date(selectedAS.receivedAt).toISOString().split('T')[0] : ""}
                  onChange={(e) => setSelectedAS({ ...selectedAS, receivedAt: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                />
              </div>
              <div className="col-span-2">
                <Label>주소</Label>
                <Input
                  value={selectedAS.customerAddress || ""}
                  onChange={(e) => setSelectedAS({ ...selectedAS, customerAddress: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>내용</Label>
                <Textarea
                  value={selectedAS.description || ""}
                  onChange={(e) => setSelectedAS({ ...selectedAS, description: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>수리 내역</Label>
                <Textarea
                  value={selectedAS.repairContent || ""}
                  onChange={(e) => setSelectedAS({ ...selectedAS, repairContent: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>취소</Button>
            <Button onClick={handleUpdateAS}>
              <Save className="mr-2 h-4 w-4" />
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 상세보기 다이얼로그 */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>AS 상세 정보</DialogTitle>
          </DialogHeader>
          {selectedAS && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">AS번호</p>
                  <p className="font-medium">{selectedAS.asNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">상태</p>
                  <Badge className={getStatusColor(selectedAS.status)}>
                    {statusLabels[selectedAS.status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">업체명</p>
                  <p className="font-medium">{selectedAS.companyName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">고객명</p>
                  <p className="font-medium">{selectedAS.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">연락처</p>
                  <p className="font-medium">{selectedAS.customerPhone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">제품명</p>
                  <p className="font-medium">{selectedAS.productName || "-"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">주소</p>
                <p className="text-sm">{selectedAS.customerAddress || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">내용</p>
                <p className="text-sm p-3 bg-muted/30 rounded">{selectedAS.description || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">수리 내역</p>
                <p className="text-sm p-3 bg-muted/30 rounded">{selectedAS.repairContent || "-"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">운송장번호</p>
                  <p className="font-medium">{selectedAS.trackingNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">접수일</p>
                  <p className="font-medium">{formatDateFull(selectedAS.receivedAt)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={() => {
                if (selectedAS) {
                  setViewDialogOpen(false);
                  handleDeleteAS(selectedAS.id);
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>닫기</Button>
              <Button onClick={() => { setViewDialogOpen(false); setEditDialogOpen(true); }}>
                <Edit className="mr-2 h-4 w-4" />
                수정
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 엑셀 Import 미리보기 다이얼로그 */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              엑셀 Import 미리보기
            </DialogTitle>
            <DialogDescription>
              {importPreview.length}건의 데이터를 가져왔습니다. 확인 후 등록해주세요.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>업체명</TableHead>
                  <TableHead>고객명</TableHead>
                  <TableHead>수거요청</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>제품</TableHead>
                  <TableHead>내용</TableHead>
                  <TableHead>연락처</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importPreview.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs">{item.companyName}</TableCell>
                    <TableCell className="text-xs">{item.customerName}</TableCell>
                    <TableCell className="text-xs">{item.pickupRequestDate}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                        {statusLabels[item.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{item.productName}</TableCell>
                    <TableCell className="text-xs max-w-[150px] truncate">{item.description}</TableCell>
                    <TableCell className="text-xs">{item.customerPhone}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportDialogOpen(false); setImportPreview([]); }}>
              취소
            </Button>
            <Button onClick={handleBulkImport} className="bg-green-600 hover:bg-green-700">
              <Upload className="mr-2 h-4 w-4" />
              {importPreview.length}건 일괄 등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* 전체 삭제 확인 다이얼로그 */}
      <Dialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              전체 AS 데이터 삭제
            </DialogTitle>
            <DialogDescription className="text-red-600 font-medium">
              ⚠️ 이 작업은 되돌릴 수 없습니다!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium mb-2">
                삭제 대상: <span className="text-lg">{asData.length}건</span>
              </p>
              <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                <li>모든 AS 접수 데이터가 영구 삭제됩니다</li>
                <li>삭제된 데이터는 복구할 수 없습니다</li>
                <li>연관된 히스토리도 함께 삭제됩니다</li>
              </ul>
            </div>
            <div>
              <Label htmlFor="confirmText" className="text-sm font-medium">
                정말 삭제하시겠습니까? 확인을 위해 <span className="text-red-600 font-bold">'전체삭제'</span>를 입력하세요.
              </Label>
              <Input
                id="confirmText"
                placeholder="전체삭제"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="mt-2 border-red-300 focus:border-red-500"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteAllDialogOpen(false);
                setDeleteConfirmText("");
              }}
            >
              취소
            </Button>
            <Button 
              onClick={handleDeleteAll}
              disabled={deleteConfirmText !== "전체삭제"}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              삭제 실행
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 에러 로그 다이얼로그 */}
      <Dialog open={errorLogDialogOpen} onOpenChange={setErrorLogDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              등록 실패 내역
            </DialogTitle>
            <DialogDescription>
              다음 항목들의 등록에 실패했습니다. 로그를 복사하여 확인하세요.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh] w-full rounded-md border p-4">
            <div className="space-y-3">
              {errorLogs.map((log, index) => (
                <div 
                  key={index} 
                  className="p-3 bg-red-50 border border-red-200 rounded text-sm font-mono"
                >
                  <div className="text-red-800 whitespace-pre-wrap break-all">
                    {log}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setErrorLogDialogOpen(false)}
            >
              닫기
            </Button>
            <Button 
              onClick={copyErrorLogs}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              로그 복사
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
