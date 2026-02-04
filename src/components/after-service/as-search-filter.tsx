"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RotateCcw, Calendar } from "lucide-react";

interface ASSearchFilterProps {
  // 검색 상태
  companyFilter: string;
  setCompanyFilter: (value: string) => void;
  searchName: string;
  setSearchName: (value: string) => void;
  searchPhone: string;
  setSearchPhone: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  dateRange: string;
  setDateRange: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  pageSize: number;
  setPageSize: (value: number) => void;
  
  // 필터 결과
  filteredCount: number;
  totalCount: number;
  
  // 초기화 함수
  onReset: () => void;
  
  // 페이지 변경 콜백
  onPageChange?: () => void;
  
  // 업체명 목록
  companies?: string[];
  
  // 업체명 필터 비활성화 (협력사 사용자일 경우)
  disableCompanyFilter?: boolean;
}

export function ASSearchFilter({
  companyFilter,
  setCompanyFilter,
  searchName,
  setSearchName,
  searchPhone,
  setSearchPhone,
  statusFilter,
  setStatusFilter,
  dateRange,
  setDateRange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  pageSize,
  setPageSize,
  filteredCount,
  totalCount,
  onReset,
  onPageChange,
  companies = ["본사", "로켓그로스", "그로트", "스몰닷", "해피포즈", "기타"],
  disableCompanyFilter = false,
}: ASSearchFilterProps) {
  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (value === "today") {
      // 오늘
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (value === "yesterday") {
      // 어제
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      setStartDate(yesterdayStr);
      setEndDate(yesterdayStr);
    } else if (value === "7days") {
      // 최근 7일
      const daysAgo = new Date(today);
      daysAgo.setDate(daysAgo.getDate() - 6);
      setStartDate(daysAgo.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (value === "30days") {
      // 최근 30일
      const daysAgo = new Date(today);
      daysAgo.setDate(daysAgo.getDate() - 29);
      setStartDate(daysAgo.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (value === "90days") {
      // 최근 90일
      const daysAgo = new Date(today);
      daysAgo.setDate(daysAgo.getDate() - 89);
      setStartDate(daysAgo.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (value === "180days") {
      // 최근 180일
      const daysAgo = new Date(today);
      daysAgo.setDate(daysAgo.getDate() - 179);
      setStartDate(daysAgo.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (value === "365days") {
      // 최근 365일
      const daysAgo = new Date(today);
      daysAgo.setDate(daysAgo.getDate() - 364);
      setStartDate(daysAgo.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (value === "all") {
      // 전체 기간
      setStartDate("");
      setEndDate("");
    }
    
    onPageChange?.();
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="space-y-3">
        {/* 첫 번째 줄: 검색 필드 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 고객주문처명(업체명) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              고객주문처명
              {disableCompanyFilter && <span className="ml-1 text-orange-600">(고정)</span>}
            </label>
            <Select 
              value={companyFilter} 
              onValueChange={(value) => { setCompanyFilter(value); onPageChange?.(); }}
              disabled={disableCompanyFilter}
            >
              <SelectTrigger className={`w-[140px] bg-white ${disableCompanyFilter ? 'opacity-70' : ''}`}>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 고객명 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">수취인명</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="이름 검색"
                value={searchName}
                onChange={(e) => { setSearchName(e.target.value); onPageChange?.(); }}
                className="w-[150px] pl-8 bg-white"
              />
            </div>
          </div>

          {/* 전화번호 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">전화번호</label>
            <Input
              placeholder="전화번호 검색"
              value={searchPhone}
              onChange={(e) => { setSearchPhone(e.target.value); onPageChange?.(); }}
              className="w-[150px] bg-white"
            />
          </div>

          {/* 조회기간 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">조회기간</label>
            <Select value={dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-[130px] bg-white">
                <SelectValue placeholder="전체 기간" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 기간</SelectItem>
                <SelectItem value="today">오늘</SelectItem>
                <SelectItem value="yesterday">어제</SelectItem>
                <SelectItem value="7days">최근 7일</SelectItem>
                <SelectItem value="30days">최근 30일</SelectItem>
                <SelectItem value="90days">최근 90일</SelectItem>
                <SelectItem value="180days">최근 180일</SelectItem>
                <SelectItem value="365days">최근 365일</SelectItem>
                <SelectItem value="custom">직접 선택</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 상태 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">상태</label>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); onPageChange?.(); }}>
              <SelectTrigger className="w-[120px] bg-white">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="RECEIVED">접수</SelectItem>
                <SelectItem value="IN_PROGRESS">처리</SelectItem>
                <SelectItem value="AS">AS</SelectItem>
                <SelectItem value="EXCHANGE">교환</SelectItem>
                <SelectItem value="COMPLETED">완료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 페이지 표시 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">페이지 표시</label>
            <Select value={pageSize.toString()} onValueChange={(value) => { setPageSize(Number(value)); onPageChange?.(); }}>
              <SelectTrigger className="w-[100px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10개</SelectItem>
                <SelectItem value="20">20개</SelectItem>
                <SelectItem value="50">50개</SelectItem>
                <SelectItem value="100">100개</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 초기화 버튼 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 opacity-0">초기화</label>
            <Button
              onClick={onReset}
              variant="outline"
              size="default"
              className="bg-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              초기화
            </Button>
          </div>
        </div>

        {/* 두 번째 줄: 직접입력 날짜 범위 */}
        {dateRange === "custom" && (
          <div className="flex items-center gap-3 pl-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); onPageChange?.(); }}
                className="w-[150px] bg-white"
              />
              <span className="text-gray-500">~</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); onPageChange?.(); }}
                className="w-[150px] bg-white"
              />
            </div>
          </div>
        )}

        {/* 세 번째 줄: 검색 결과 */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm text-gray-600">
            검색결과: <span className="font-semibold text-blue-600">{filteredCount}건</span>
            {filteredCount !== totalCount && (
              <span className="text-gray-500"> / 전체 {totalCount}건</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
