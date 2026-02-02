"use client";

import { useState } from "react";
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

interface OrderSearchFilterProps {
  // 검색 상태
  searchName: string;
  setSearchName: (value: string) => void;
  searchPhone: string;
  setSearchPhone: (value: string) => void;
  orderSource: string;
  setOrderSource: (value: string) => void;
  dateRange: string;
  setDateRange: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  itemsPerPage: number;
  setItemsPerPage: (value: number) => void;
  
  // 필터 결과
  filteredCount: number;
  totalCount: number;
  
  // 초기화 함수
  onReset: () => void;
  
  // 페이지 변경 콜백
  onPageChange?: () => void;
  
  // 고객주문처명 목록
  orderSources?: string[];
  
  // 고객주문처명 필터 사용 여부
  showOrderSourceFilter?: boolean;
  
  // 고객주문처명 필터 비활성화 (협력사 사용자일 경우)
  disableOrderSourceFilter?: boolean;
}

export function OrderSearchFilter({
  searchName,
  setSearchName,
  searchPhone,
  setSearchPhone,
  orderSource,
  setOrderSource,
  dateRange,
  setDateRange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  itemsPerPage,
  setItemsPerPage,
  filteredCount,
  totalCount,
  onReset,
  onPageChange,
  orderSources = ["본사", "로켓그로스", "그로트", "스몰닷", "해피포즈", "기타"],
  showOrderSourceFilter = true,
  disableOrderSourceFilter = false,
}: OrderSearchFilterProps) {
  // 오늘 날짜를 기본값으로 설정
  const today = new Date().toISOString().split('T')[0];
  
  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    const today = new Date();
    
    if (value === "1day") {
      setStartDate(today.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (value === "1week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      setStartDate(weekAgo.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (value === "1month") {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      setStartDate(monthAgo.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (value === "1year") {
      const yearAgo = new Date(today);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      setStartDate(yearAgo.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
    
    onPageChange?.();
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    onPageChange?.();
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="space-y-3">
        {/* 첫 번째 줄: 검색 필드 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 고객주문처명 */}
          {showOrderSourceFilter && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">
                고객주문처명
                {disableOrderSourceFilter && <span className="ml-1 text-orange-600">(고정)</span>}
              </label>
              <Select 
                value={orderSource} 
                onValueChange={(value) => { setOrderSource(value); onPageChange?.(); }}
                disabled={disableOrderSourceFilter}
              >
                <SelectTrigger className={`w-[140px] bg-white ${disableOrderSourceFilter ? 'opacity-70' : ''}`}>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {orderSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 고객명 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">고객명</label>
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
                <SelectItem value="1day">1일</SelectItem>
                <SelectItem value="1week">1주</SelectItem>
                <SelectItem value="1month">1달</SelectItem>
                <SelectItem value="1year">1년</SelectItem>
                <SelectItem value="custom">직접 선택</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 페이지당 개수 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">페이지 표시</label>
            <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-[100px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10개</SelectItem>
                <SelectItem value="50">50개</SelectItem>
                <SelectItem value="100">100개</SelectItem>
                <SelectItem value="500">500개</SelectItem>
                <SelectItem value="1000">1000개</SelectItem>
                <SelectItem value="10000">10000개</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 초기화 버튼 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-transparent">.</label>
            <Button variant="outline" size="sm" onClick={onReset} className="bg-white">
              <RotateCcw className="h-4 w-4 mr-1" />
              초기화
            </Button>
          </div>
        </div>

        {/* 두 번째 줄: 날짜 범위 선택 (직접 선택 시) */}
        {dateRange === "custom" && (
          <div className="flex items-center gap-3 pt-2 border-t border-blue-200">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); onPageChange?.(); }}
                className="w-[160px] bg-white"
                max={endDate || today}
              />
              <span className="text-gray-500 font-medium">~</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); onPageChange?.(); }}
                className="w-[160px] bg-white"
                min={startDate}
                max={today}
              />
            </div>
          </div>
        )}

        {/* 검색 결과 표시 */}
        <div className="flex items-center justify-between pt-2 border-t border-blue-200">
          <div className="text-sm text-gray-600">
            검색결과: <span className="font-bold text-blue-600 text-lg">{filteredCount}</span>건
            {filteredCount !== totalCount && (
              <span className="text-gray-400 ml-2">(전체: {totalCount}건)</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
