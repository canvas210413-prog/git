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
  onSearchSubmit?: () => void; // 검색 실행 핸들러
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
  
  // 날짜 범위 선택 시 콜백 (서버 사이드 검색용)
  onDateRangeSelect?: (startDate: string, endDate: string) => void;
  
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
  onSearchSubmit,
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
  onDateRangeSelect,
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
    const todayStr = today.toISOString().split('T')[0];
    
    let newStartDate = "";
    let newEndDate = "";
    
    if (value === "today") {
      // 오늘
      newStartDate = todayStr;
      newEndDate = todayStr;
    } else if (value === "yesterday") {
      // 어제
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      newStartDate = yesterdayStr;
      newEndDate = yesterdayStr;
    } else if (value === "7days") {
      // 최근 7일
      const daysAgo = new Date(today);
      daysAgo.setDate(daysAgo.getDate() - 6); // 오늘 포함 7일
      newStartDate = daysAgo.toISOString().split('T')[0];
      newEndDate = todayStr;
    } else if (value === "30days") {
      // 최근 30일
      const daysAgo = new Date(today);
      daysAgo.setDate(daysAgo.getDate() - 29); // 오늘 포함 30일
      newStartDate = daysAgo.toISOString().split('T')[0];
      newEndDate = todayStr;
    } else if (value === "90days") {
      // 최근 90일
      const daysAgo = new Date(today);
      daysAgo.setDate(daysAgo.getDate() - 89); // 오늘 포함 90일
      newStartDate = daysAgo.toISOString().split('T')[0];
      newEndDate = todayStr;
    } else if (value === "180days") {
      // 최근 180일
      const daysAgo = new Date(today);
      daysAgo.setDate(daysAgo.getDate() - 179); // 오늘 포함 180일
      newStartDate = daysAgo.toISOString().split('T')[0];
      newEndDate = todayStr;
    } else if (value === "365days") {
      // 최근 365일
      const daysAgo = new Date(today);
      daysAgo.setDate(daysAgo.getDate() - 364); // 오늘 포함 365일
      newStartDate = daysAgo.toISOString().split('T')[0];
      newEndDate = todayStr;
    } else if (value === "all") {
      // 전체 기간
      newStartDate = "";
      newEndDate = "";
    }
    
    // 날짜 상태 설정
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    
    // 서버 사이드 검색용 콜백 (두 날짜를 한 번에 전달)
    if (onDateRangeSelect) {
      onDateRangeSelect(newStartDate, newEndDate);
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
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSearchSubmit?.();
                  }
                }}
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
              onChange={(e) => setSearchPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSearchSubmit?.();
                }
              }}
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
            <div className="flex gap-1">
              <Button variant="default" size="sm" onClick={onSearchSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Search className="h-4 w-4 mr-1" />
                검색
              </Button>
              <Button variant="outline" size="sm" onClick={onReset} className="bg-white">
                <RotateCcw className="h-4 w-4 mr-1" />
                초기화
              </Button>
            </div>
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
