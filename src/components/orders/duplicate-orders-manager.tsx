"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Trash2, RefreshCw, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatNumber, formatDate } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string | null;
  recipientName: string;
  orderDate: Date;
  productName: string | null;
  status: string;
  totalAmount: string;
  orderSource: string | null;
  trackingNumber: string | null;
  createdAt: Date;
}

interface DuplicateGroup {
  recipientPhone: string;
  count: number;
  orders: Order[];
}

interface DuplicateOrdersManagerProps {
  onRefresh?: () => void;
}

export function DuplicateOrdersManager({ onRefresh }: DuplicateOrdersManagerProps) {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders/duplicates');
      if (response.ok) {
        const data = await response.json();
        setDuplicates(data.duplicates || []);
      }
    } catch (error) {
      console.error('중복 주문 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const toggleGroup = (recipientPhone: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(recipientPhone)) {
        next.delete(recipientPhone);
      } else {
        next.add(recipientPhone);
      }
      return next;
    });
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const toggleGroupSelection = (group: DuplicateGroup) => {
    const groupOrderIds = group.orders.map((o) => o.id);
    const allSelected = groupOrderIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        groupOrderIds.forEach((id) => next.delete(id));
      } else {
        groupOrderIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      alert('삭제할 주문을 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedIds.size}개의 주문을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch('/api/orders/duplicates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: Array.from(selectedIds) }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${data.deletedCount}개의 주문이 삭제되었습니다.`);
        setSelectedIds(new Set());
        await fetchDuplicates();
        onRefresh?.();
      } else {
        alert('주문 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('주문 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const totalDuplicates = duplicates.reduce((sum, g) => sum + g.count, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            중복 전화번호 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (duplicates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            중복 전화번호 관리
          </CardTitle>
          <CardDescription>동일한 전화번호를 가진 중복 주문을 관리합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              중복된 전화번호가 없습니다.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              중복 전화번호 관리
            </CardTitle>
            <CardDescription>
              {duplicates.length}개의 중복 전화번호, 총 {totalDuplicates}개 주문
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDuplicates}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0 || deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              선택 삭제 ({selectedIds.size})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            중복된 주문을 신중하게 확인하고 삭제하세요. 삭제된 주문은 복구할 수 없습니다.
          </AlertDescription>
        </Alert>

        {duplicates.map((group) => {
          const isExpanded = expandedGroups.has(group.recipientPhone);
          const groupOrderIds = group.orders.map((o) => o.id);
          const allSelected = groupOrderIds.every((id) => selectedIds.has(id));
          const someSelected = groupOrderIds.some((id) => selectedIds.has(id));

          return (
            <Card key={group.recipientPhone} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => toggleGroupSelection(group)}
                      className={someSelected && !allSelected ? "opacity-50" : ""}
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{group.recipientPhone}</h3>
                      <p className="text-sm text-muted-foreground">
                        중복 {group.count}건
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleGroup(group.recipientPhone)}
                  >
                    {isExpanded ? '접기' : '펼치기'}
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {group.orders.map((order) => {
                      const isSelected = selectedIds.has(order.id);
                      return (
                        <div
                          key={order.id}
                          className={`flex items-center gap-3 p-3 border rounded-lg ${
                            isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleOrderSelection(order.id)}
                          />
                          <div className="flex-1 grid grid-cols-5 gap-4 text-sm">
                            <div>
                              <p className="font-medium">{order.orderNumber || '번호없음'}</p>
                              <p className="text-muted-foreground">
                                {formatDate(new Date(order.orderDate))}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium">{order.productName || '-'}</p>
                              <p className="text-muted-foreground">{order.orderSource || '-'}</p>
                            </div>
                            <div>
                              <Badge variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                {order.status}
                              </Badge>
                            </div>
                            <div>
                              <p className="font-medium">{formatNumber(order.totalAmount)}원</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                등록: {formatDate(new Date(order.createdAt))}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                송장: {order.trackingNumber || '없음'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
