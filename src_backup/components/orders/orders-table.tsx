"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrder, deleteOrder } from "@/app/actions/orders";
import { Pencil, Save, X, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export function OrdersTable({ orders: initialOrders }: { orders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [isPending, startTransition] = useTransition();

  const startEdit = (order: any) => {
    setEditingId(order.id);
    setEditData({
      orderDate: new Date(order.orderDate).toISOString().split("T")[0],
      recipientName: order.recipientName || "",
      recipientPhone: order.recipientPhone || "",
      recipientMobile: order.recipientMobile || "",
      recipientZipCode: order.recipientZipCode || "",
      recipientAddr: order.recipientAddr || "",
      orderNumber: order.orderNumber || "",
      productInfo: order.productInfo || "",
      deliveryMsg: order.deliveryMsg || "",
      orderSource: order.orderSource || "",
      unitPrice: order.unitPrice || 0,
      shippingFee: order.shippingFee || 0,
      courier: order.courier || "",
      trackingNumber: order.trackingNumber || "",
      status: order.status,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (orderId: string) => {
    const totalAmount =
      (parseFloat(editData.unitPrice) || 0) +
      (parseFloat(editData.shippingFee) || 0);

    startTransition(async () => {
      await updateOrder(orderId, {
        ...editData,
        totalAmount,
      });
      setEditingId(null);
      setEditData({});
      window.location.reload();
    });
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm("정말 이 주문을 삭제하시겠습니까?")) return;

    startTransition(async () => {
      await deleteOrder(orderId);
      setOrders(orders.filter((o) => o.id !== orderId));
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: { variant: "secondary", label: "대기" },
      PROCESSING: { variant: "default", label: "처리중" },
      SHIPPED: { variant: "outline", label: "배송중" },
      DELIVERED: { variant: "outline", label: "배송완료" },
      CANCELLED: { variant: "destructive", label: "취소" },
    };
    const config = variants[status] || { variant: "default", label: status };
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[100px]">날짜</TableHead>
              <TableHead>고객명</TableHead>
              <TableHead>수취인명</TableHead>
              <TableHead>수취인 전화번호</TableHead>
              <TableHead>수취인 이동통신</TableHead>
              <TableHead>우편번호</TableHead>
              <TableHead>수취인 주소</TableHead>
              <TableHead>주문번호</TableHead>
              <TableHead>상품명 및 수량</TableHead>
              <TableHead>배송메세지</TableHead>
              <TableHead>고객주문처명</TableHead>
              <TableHead>단가</TableHead>
              <TableHead>배송비</TableHead>
              <TableHead>택배사</TableHead>
              <TableHead>운송장번호</TableHead>
              <TableHead className="w-[100px]">상태</TableHead>
              <TableHead className="w-[120px] text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={17} className="h-24 text-center">
                  등록된 주문이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const isEditing = editingId === order.id;
                return (
                  <TableRow key={order.id} className={isEditing ? "bg-blue-50" : ""}>
                    {/* 날짜 */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editData.orderDate}
                          onChange={(e) =>
                            setEditData({ ...editData, orderDate: e.target.value })
                          }
                          className="w-[100px]"
                        />
                      ) : (
                        new Date(order.orderDate || order.createdAt).toLocaleDateString("ko-KR")
                      )}
                    </TableCell>

                    {/* 고객명 */}
                    <TableCell>{order.customer.name}</TableCell>

                    {/* 수취인명 */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.recipientName}
                          onChange={(e) =>
                            setEditData({ ...editData, recipientName: e.target.value })
                          }
                          className="w-[100px]"
                        />
                      ) : (
                        order.recipientName || "-"
                      )}
                    </TableCell>

                    {/* 수취인 전화번호 */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.recipientPhone}
                          onChange={(e) =>
                            setEditData({ ...editData, recipientPhone: e.target.value })
                          }
                          className="w-[120px]"
                        />
                      ) : (
                        order.recipientPhone || "-"
                      )}
                    </TableCell>

                    {/* 수취인 이동통신 */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.recipientMobile}
                          onChange={(e) =>
                            setEditData({ ...editData, recipientMobile: e.target.value })
                          }
                          className="w-[120px]"
                        />
                      ) : (
                        order.recipientMobile || "-"
                      )}
                    </TableCell>

                    {/* 우편번호 */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.recipientZipCode}
                          onChange={(e) =>
                            setEditData({ ...editData, recipientZipCode: e.target.value })
                          }
                          className="w-[80px]"
                        />
                      ) : (
                        order.recipientZipCode || "-"
                      )}
                    </TableCell>

                    {/* 수취인 주소 */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.recipientAddr}
                          onChange={(e) =>
                            setEditData({ ...editData, recipientAddr: e.target.value })
                          }
                          className="w-[180px]"
                        />
                      ) : (
                        <div className="max-w-[180px] truncate" title={order.recipientAddr}>
                          {order.recipientAddr || "-"}
                        </div>
                      )}
                    </TableCell>

                    {/* 주문번호 */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.orderNumber}
                          onChange={(e) =>
                            setEditData({ ...editData, orderNumber: e.target.value })
                          }
                          className="w-[120px]"
                        />
                      ) : (
                        order.orderNumber || "-"
                      )}
                    </TableCell>

                    {/* 상품명 및 수량 */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.productInfo}
                          onChange={(e) =>
                            setEditData({ ...editData, productInfo: e.target.value })
                          }
                          className="w-[150px]"
                        />
                      ) : (
                        <div className="max-w-[150px] truncate" title={order.productInfo}>
                          {order.productInfo || "-"}
                        </div>
                      )}
                    </TableCell>

                    {/* 배송메세지 */}
                    <TableCell>
                      {isEditing ? (
                        <Textarea
                          value={editData.deliveryMsg}
                          onChange={(e) =>
                            setEditData({ ...editData, deliveryMsg: e.target.value })
                          }
                          className="w-[150px]"
                          rows={2}
                        />
                      ) : (
                        <div className="max-w-[150px] truncate" title={order.deliveryMsg}>
                          {order.deliveryMsg || "-"}
                        </div>
                      )}
                    </TableCell>

                    {/* 고객주문처명 */}
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={editData.orderSource}
                          onValueChange={(value) =>
                            setEditData({ ...editData, orderSource: value })
                          }
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="본사">본사</SelectItem>
                            <SelectItem value="그로트">그로트</SelectItem>
                            <SelectItem value="헤이플로">헤이플로</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        order.orderSource || "-"
                      )}
                    </TableCell>

                    {/* 단가 */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editData.unitPrice}
                          onChange={(e) =>
                            setEditData({ ...editData, unitPrice: e.target.value })
                          }
                          className="w-[100px]"
                        />
                      ) : (
                        order.unitPrice ? `₩${Number(order.unitPrice).toLocaleString()}` : "-"
                      )}
                    </TableCell>

                    {/* 배송비 */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editData.shippingFee}
                          onChange={(e) =>
                            setEditData({ ...editData, shippingFee: e.target.value })
                          }
                          className="w-[100px]"
                        />
                      ) : (
                        order.shippingFee ? `₩${Number(order.shippingFee).toLocaleString()}` : "-"
                      )}
                    </TableCell>

                    {/* 택배사 */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.courier}
                          onChange={(e) =>
                            setEditData({ ...editData, courier: e.target.value })
                          }
                          className="w-[100px]"
                        />
                      ) : (
                        order.courier || "-"
                      )}
                    </TableCell>

                    {/* 운송장번호 */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.trackingNumber}
                          onChange={(e) =>
                            setEditData({ ...editData, trackingNumber: e.target.value })
                          }
                          className="w-[120px]"
                        />
                      ) : (
                        order.trackingNumber || "-"
                      )}
                    </TableCell>

                    {/* 상태 */}
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={editData.status}
                          onValueChange={(value) =>
                            setEditData({ ...editData, status: value })
                          }
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">대기</SelectItem>
                            <SelectItem value="PROCESSING">처리중</SelectItem>
                            <SelectItem value="SHIPPED">배송중</SelectItem>
                            <SelectItem value="DELIVERED">배송완료</SelectItem>
                            <SelectItem value="CANCELLED">취소</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        getStatusBadge(order.status)
                      )}
                    </TableCell>

                    {/* 작업 */}
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            onClick={() => saveEdit(order.id)}
                            disabled={isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                            disabled={isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(order)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(order.id)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
