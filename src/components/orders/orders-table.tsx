"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
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
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrder, deleteOrder } from "@/app/actions/orders";
import { updateOrderDeliveryStatus } from "@/app/actions/delivery";
import { getAfterServiceById } from "@/app/actions/after-service";
import { Pencil, Save, X, Trash2, Package, Truck, MapPin, Home, CheckCircle, RefreshCw, Wrench, Calendar, AlertCircle, Filter, Search, RotateCcw, Settings2, Eye, EyeOff, XCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrderSearchFilter } from "./order-search-filter";
import { EditOrderDialog } from "./edit-order-dialog";
import { ASRequestDialog } from "./as-request-dialog";

// Ïª¨Îüº ?ïÏùò
const ALL_COLUMNS = [
  { id: "orderDate", label: "?†Ïßú", width: "w-[100px]", default: true },
  { id: "recipientName", label: "Í≥†Í∞ùÎ™?, width: "w-[100px]", default: true },
  { id: "recipientPhone", label: "?ÑÌôîÎ≤àÌò∏", width: "w-[120px]", default: true },
  { id: "recipientMobile", label: "?¥Îèô?µÏã†", width: "w-[120px]", default: true },
  { id: "recipientZipCode", label: "?∞Ìé∏Î≤àÌò∏", width: "w-[100px]", default: true },
  { id: "recipientAddr", label: "Ï£ºÏÜå", width: "w-[180px]", default: true },
  { id: "orderNumber", label: "Ï£ºÎ¨∏Î≤àÌò∏", width: "w-[120px]", default: true },
  { id: "productInfo", label: "?ÅÌíàÎ™?Î∞??òÎüâ", width: "w-[150px]", default: true },
  { id: "deliveryMsg", label: "Î∞∞ÏÜ°Î©îÏãúÏßÄ", width: "w-[150px]", default: true },
  { id: "orderSource", label: "Í≥†Í∞ùÏ£ºÎ¨∏Ï≤òÎ™Ö", width: "w-[100px]", default: true },
  { id: "basePrice", label: "?®Í?", width: "w-[100px]", default: true },
  { id: "shippingFee", label: "Î∞∞ÏÜ°Îπ?, width: "w-[100px]", default: true },
  { id: "courier", label: "?ùÎ∞∞??, width: "w-[100px]", default: true },
  { id: "trackingNumber", label: "?¥ÏÜ°?•Î≤à??, width: "w-[120px]", default: true },
  { id: "giftSent", label: "?¨Ï??àÎ∞ú??, width: "w-[100px]", default: true },
] as const;

type ColumnId = typeof ALL_COLUMNS[number]["id"];

// Î∞∞ÏÜ° ?ÅÌÉú 5?®Í≥Ñ ?ïÏùò
const DELIVERY_STATUS_STEPS = [
  { key: "PICKED_UP", label: "?ÅÌíà?∏Ïàò", icon: Package },
  { key: "IN_TRANSIT", label: "?ÅÌíà?¥ÎèôÏ§?, icon: Truck },
  { key: "ARRIVED", label: "Î∞∞ÏÜ°ÏßÄ?ÑÏ∞©", icon: MapPin },
  { key: "OUT_FOR_DELIVERY", label: "Î∞∞ÏÜ°Ï∂úÎ∞ú", icon: Home },
  { key: "DELIVERED", label: "Î∞∞ÏÜ°?ÑÎ£å", icon: CheckCircle },
];

// Î∞∞ÏÜ° ?ÅÌÉú ÏßÑÌñâ ?úÏãú Ïª¥Ìè¨?åÌä∏
function DeliveryStatusProgress({ status }: { status: string | null }) {
  if (!status || status === "PENDING") {
    return <span className="text-gray-400 text-xs">-</span>;
  }

  const currentIndex = DELIVERY_STATUS_STEPS.findIndex(s => s.key === status);
  
  return (
    <div className="flex items-center gap-0.5">
      {DELIVERY_STATUS_STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const Icon = step.icon;
        
        return (
          <div key={step.key} className="flex items-center">
            <div
              className={`
                flex flex-col items-center
                ${isCompleted ? 'text-blue-600' : 'text-gray-300'}
              `}
              title={step.label}
            >
              <Icon className={`h-4 w-4 ${isCurrent ? 'animate-pulse' : ''}`} />
            </div>
            {index < DELIVERY_STATUS_STEPS.length - 1 && (
              <div 
                className={`w-2 h-0.5 mx-0.5 ${
                  index < currentIndex ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Î∞∞ÏÜ° ?ÅÌÉú Î±ÉÏ? Ïª¥Ìè¨?åÌä∏
function DeliveryStatusBadge({ status }: { status: string | null }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: "?ÄÍ∏?, className: "bg-gray-100 text-gray-600" },
    PICKED_UP: { label: "?ÅÌíà?∏Ïàò", className: "bg-blue-100 text-blue-700" },
    IN_TRANSIT: { label: "?ÅÌíà?¥ÎèôÏ§?, className: "bg-indigo-100 text-indigo-700" },
    ARRIVED: { label: "Î∞∞ÏÜ°ÏßÄ?ÑÏ∞©", className: "bg-purple-100 text-purple-700" },
    OUT_FOR_DELIVERY: { label: "Î∞∞ÏÜ°Ï∂úÎ∞ú", className: "bg-orange-100 text-orange-700" },
    DELIVERED: { label: "Î∞∞ÏÜ°?ÑÎ£å", className: "bg-green-100 text-green-700" },
  };

  const config = statusConfig[status || "PENDING"] || statusConfig.PENDING;
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

export function OrdersTable({ 
  orders: initialOrders,
  selectedOrderIds,
  onSelectionChange 
}: { 
  orders: any[];
  selectedOrderIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
}) {
  const { data: session } = useSession();
  
  // ?ÑÏû¨ ?¨Ïö©?êÏùò ?ëÎ†•???ïÎ≥¥ (null?¥Î©¥ Î≥∏ÏÇ¨ - ?ÑÏ≤¥ ?ëÍ∑º)
  const userPartner = (session?.user as { assignedPartner?: string | null })?.assignedPartner || null;
  
  // ?†Ïßú???ïÎ†¨ ?®Ïàò
  const sortOrdersByDate = (orderList: any[]) => {
    return [...orderList].sort((a, b) => {
      return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
    });
  };

  const [orders, setOrders] = useState(sortOrdersByDate(initialOrders));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [isPending, startTransition] = useTransition();
  
  // ?∏Î??êÏÑú ?ÑÎã¨??selectedOrderIdsÎ•??¨Ïö©?òÍ±∞?? ?¥Î? ?ÅÌÉú ?¨Ïö©
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set());
  const selectedIds = selectedOrderIds || internalSelectedIds;
  const setSelectedIds = onSelectionChange || setInternalSelectedIds;
  const [asDialogOpen, setAsDialogOpen] = useState(false);
  const [selectedAsInfo, setSelectedAsInfo] = useState<any>(null);
  const [loadingAs, setLoadingAs] = useState(false);
  const [asSelectedOrder, setAsSelectedOrder] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Ïª¨Îüº ?úÏãú ?ÅÌÉú (Î°úÏª¨?§ÌÜ†Î¶¨Ï??êÏÑú Î≥µÏõê ?êÎäî Í∏∞Î≥∏Í∞??¨Ïö©)
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`orders-columns-${userPartner || "headquarters"}`);
      if (saved) {
        try {
          return new Set(JSON.parse(saved) as ColumnId[]);
        } catch {
          // ?åÏã± ?§Ìå®??Í∏∞Î≥∏Í∞??¨Ïö©
        }
      }
    }
    // Í∏∞Î≥∏ ?úÏãú Ïª¨Îüº
    return new Set(ALL_COLUMNS.filter(col => col.default).map(col => col.id));
  });

  // Ïª¨Îüº ?úÏãú ?ÅÌÉú Î≥ÄÍ≤???Î°úÏª¨?§ÌÜ†Î¶¨Ï????Ä??
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `orders-columns-${userPartner || "headquarters"}`,
        JSON.stringify(Array.from(visibleColumns))
      );
    }
  }, [visibleColumns, userPartner]);

  // Ïª¨Îüº ?†Í? ?∏Îì§??
  const toggleColumn = (columnId: ColumnId) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  // Î™®Îì† Ïª¨Îüº ?úÏãú
  const showAllColumns = () => {
    setVisibleColumns(new Set(ALL_COLUMNS.map(col => col.id)));
  };

  // Í∏∞Î≥∏ Ïª¨ÎüºÎß??úÏãú
  const resetColumns = () => {
    setVisibleColumns(new Set(ALL_COLUMNS.filter(col => col.default).map(col => col.id)));
  };

  // Ï£ºÎ¨∏ ?òÏ†ï ?ùÏóÖ ?ÅÌÉú
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogMode, setEditDialogMode] = useState<"view" | "edit" | "create">("edit");
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<any>(null);
  
  // ?êÎü¨ ?§Ïù¥?ºÎ°úÍ∑??ÅÌÉú
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // øÓº€¿Âπ¯»£ ¿œ∞˝ ªË¡¶ ªÛ≈¬
  const [clearTrackingDialogOpen, setClearTrackingDialogOpen] = useState(false);
  const [clearingTracking, setClearingTracking] = useState(false);

  // Í≤Ä??Î∞??ÑÌÑ∞ ?ÅÌÉú
  // ?ëÎ†•???¨Ïö©?êÎäî ?êÏã†???ÖÏ≤¥Î°?Ï¥àÍ∏∞??
  const [orderSource, setOrderSource] = useState("all");
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // ?àÏö©??Í≥†Í∞ùÏ£ºÎ¨∏Ï≤òÎ™Ö Î™©Î°ù
  const ALL_ORDER_SOURCES = ["Î≥∏ÏÇ¨", "Î°úÏºìÍ∑∏Î°ú??, "Í∑∏Î°ú??, "?§Î™∞??, "?¥Ìîº?¨Ï¶à", "Í∏∞Ì?"];
  
  // ?ëÎ†•???¨Ïö©?êÎäî ?êÏã†???ÖÏ≤¥Îß??úÏãú
  const ALLOWED_ORDER_SOURCES = useMemo(() => {
    if (userPartner) {
      return [userPartner];
    }
    return ALL_ORDER_SOURCES;
  }, [userPartner]);
  
  // ?ëÎ†•???¨Ïö©?êÎäî ?ÖÏ≤¥ ?ÑÌÑ∞ ?êÎèô ?§Ï†ï
  useEffect(() => {
    if (userPartner && orderSource === "all") {
      setOrderSource(userPartner);
    }
  }, [userPartner]);

  // props Î≥ÄÍ≤????ïÎ†¨?òÏó¨ ?ÅÌÉú ?ÖÎç∞?¥Ìä∏
  useEffect(() => {
    setOrders(sortOrdersByDate(initialOrders));
  }, [initialOrders]);

  // Í≤Ä??Î∞??ÑÌÑ∞Îß?
  const filteredOrders = orders.filter((order) => {
    // Í≥†Í∞ùÏ£ºÎ¨∏Ï≤òÎ™Ö ?ÑÌÑ∞
    if (orderSource !== "all") {
      const source = order.orderSource || "?êÏÇ¨Î™?;
      if (source !== orderSource) {
        return false;
      }
    }

    // ?òÏ∑®?∏Î™Ö Í≤Ä??
    if (searchName.trim()) {
      const name = order.recipientName || "";
      if (!name.toLowerCase().includes(searchName.toLowerCase().trim())) {
        return false;
      }
    }

    // ?ÑÌôîÎ≤àÌò∏ Í≤Ä??
    if (searchPhone.trim()) {
      const phone = order.recipientPhone || order.recipientMobile || "";
      if (!phone.includes(searchPhone.trim())) {
        return false;
      }
    }

    // ?†Ïßú ?ÑÌÑ∞
    const orderDate = new Date(order.orderDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateRange === "1day") {
      const orderDay = new Date(orderDate);
      orderDay.setHours(0, 0, 0, 0);
      if (orderDay.getTime() !== today.getTime()) {
        return false;
      }
    } else if (dateRange === "1week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (orderDate < weekAgo) {
        return false;
      }
    } else if (dateRange === "1month") {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      if (orderDate < monthAgo) {
        return false;
      }
    } else if (dateRange === "1year") {
      const yearAgo = new Date(today);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      if (orderDate < yearAgo) {
        return false;
      }
    } else if (dateRange === "custom" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (orderDate < start || orderDate > end) {
        return false;
      }
    }

    return true;
  });

  // ?òÏù¥ÏßÄ?§Ïù¥??Í≥ÑÏÇ∞
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Í≤Ä??Ï¥àÍ∏∞??
  const handleResetSearch = () => {
    setOrderSource("all");
    setSearchName("");
    setSearchPhone("");
    setDateRange("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  // ?¥ÏÜ°?•Î≤à???ºÍ¥Ñ ??†ú ?∏Îì§??
  const handleClearTrackingNumbers = async () => {
    if (selectedIds.size === 0) {
      alert("?¥ÏÜ°?•Î≤à?∏Î? ??†ú??Ï£ºÎ¨∏???†ÌÉù?¥Ï£º?∏Ïöî.");
      return;
    }

    // ?¥ÏÜ°?•Î≤à?∏Í? ?àÎäî ??™©Îß??ÑÌÑ∞Îß?
    const ordersWithTracking = orders.filter(
      o => selectedIds.has(o.id) && o.trackingNumber
    );

    if (ordersWithTracking.length === 0) {
      alert("?†ÌÉù??Ï£ºÎ¨∏ Ï§??¥ÏÜ°?•Î≤à?∏Í? ?ÖÎ†•????™©???ÜÏäµ?àÎã§.");
      return;
    }

    setClearTrackingDialogOpen(true);
  };

  // ?¥ÏÜ°?•Î≤à????†ú ?ïÏù∏
  const confirmClearTracking = async () => {
    try {
      setClearingTracking(true);

      const response = await fetch("/api/orders/clear-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: Array.from(selectedIds) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "?¥ÏÜ°?•Î≤à????†ú???§Ìå®?àÏäµ?àÎã§.");
      }

      if (data.success) {
        // Î°úÏª¨ ?ÅÌÉú ?ÖÎç∞?¥Ìä∏
        setOrders(prevOrders =>
          prevOrders.map(order =>
            selectedIds.has(order.id) && order.trackingNumber
              ? { ...order, trackingNumber: null, courier: null }
              : order
          )
        );

        // ?†ÌÉù ?¥Ï†ú
        setSelectedIds(new Set());

        alert(data.message);
        setClearTrackingDialogOpen(false);
      } else {
        alert(data.message || "?¥ÏÜ°?•Î≤à?∏Í? ?ÖÎ†•??Ï£ºÎ¨∏???ÜÏäµ?àÎã§.");
      }
    } catch (error) {
      console.error("?¥ÏÜ°?•Î≤à????†ú ?§Î•ò:", error);
      alert(error instanceof Error ? error.message : "?¥ÏÜ°?•Î≤à????†ú Ï§??§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.");
    } finally {
      setClearingTracking(false);
    }
  };


  // ?òÏù¥ÏßÄ Î≥ÄÍ≤?
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ?òÏù¥ÏßÄ????™© ??Î≥ÄÍ≤?
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

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
      basePrice: order.basePrice || 0,
      shippingFee: order.shippingFee || 0,
      courier: order.courier || "",
      trackingNumber: order.trackingNumber || "",
      deliveryStatus: order.deliveryStatus || "",
      status: order.status,
      giftSent: order.giftSent ?? false,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (orderId: string) => {
    startTransition(async () => {
      // ?´Ïûê ?ÑÎìú Î≥Ä??
      const updateData: any = { ...editData };
      
      // ?´Ïûê ?ÑÎìúÎ•?Î™ÖÏãú?ÅÏúºÎ°?Î≥Ä??
      if (updateData.basePrice !== undefined) {
        updateData.basePrice = Number(updateData.basePrice) || 0;
      }
      if (updateData.shippingFee !== undefined) {
        updateData.shippingFee = Number(updateData.shippingFee) || 0;
      }
      if (updateData.additionalFee !== undefined) {
        updateData.additionalFee = Number(updateData.additionalFee) || 0;
      }
      
      // totalAmount Í≥ÑÏÇ∞
      const basePrice = updateData.basePrice || 0;
      const shippingFee = updateData.shippingFee || 0;
      const additionalFee = updateData.additionalFee || 0;
      updateData.totalAmount = basePrice + shippingFee + additionalFee;
      
      console.log("[saveEdit] Sending data:", { orderId, updateData });
      
      const result = await updateOrder(orderId, updateData);
      
      console.log("[saveEdit] Result:", result);
      
      if (result.success) {
        // ?±Í≥µ ???∏Ïßë Î™®Îìú Ï¢ÖÎ£å Î∞??ÅÌÉú Ï¥àÍ∏∞??
        setEditingId(null);
        setEditData({});
        
        // ?òÏù¥ÏßÄ ?àÎ°úÍ≥†Ïπ®
        window.location.reload();
      } else {
        // ?§Ìå® ???êÎü¨ Î©îÏãúÏßÄ ?úÏãú
        const errorDetails = result.error?.details 
          ? `\n?ÅÏÑ∏: ${JSON.stringify(result.error.details, null, 2)}`
          : "";
        alert(`???Ä???§Ìå®: ${result.error?.message || "?????ÜÎäî ?§Î•ò"}${errorDetails}`);
      }
    });
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm("?ïÎßê ??Ï£ºÎ¨∏????†ú?òÏãúÍ≤†Ïäµ?àÍπå?")) return;

    startTransition(async () => {
      try {
        const result = await deleteOrder(orderId);
        
        if (result.success) {
          setOrders(orders.filter((o) => o.id !== orderId));
          alert("Ï£ºÎ¨∏????†ú?òÏóà?µÎãà??");
        } else {
          setErrorMessage(result.error?.message || "?????ÜÎäî ?§Î•ò");
          setErrorDialogOpen(true);
        }
      } catch (error) {
        console.error("Delete failed:", error);
        setErrorMessage(error instanceof Error ? error.message : "Ï£ºÎ¨∏ ??†ú Ï§??§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.");
        setErrorDialogOpen(true);
      }
    });
  };

  // ?ÑÏ≤¥ ?†ÌÉù/?¥Ï†ú
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedOrders.map(o => o.id)));
    }
  };

  // Í∞úÎ≥Ñ ?†ÌÉù/?¥Ï†ú
  const toggleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // ?§Ï§ë ??†ú
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`?†ÌÉù??${selectedIds.size}Í∞úÏùò Ï£ºÎ¨∏????†ú?òÏãúÍ≤†Ïäµ?àÍπå?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const deletePromises = Array.from(selectedIds).map(id => deleteOrder(id));
        const results = await Promise.all(deletePromises);
        
        // ?±Í≥µ??Í≤ÉÎßå ?ÑÌÑ∞Îß?
        const successIds = Array.from(selectedIds).filter((id, idx) => results[idx].success);
        const failedCount = selectedIds.size - successIds.length;
        
        if (successIds.length > 0) {
          setOrders(orders.filter(o => !successIds.includes(o.id)));
        }
        
        setSelectedIds(new Set());
        
        if (failedCount === 0) {
          alert(`${successIds.length}Í∞úÏùò Ï£ºÎ¨∏????†ú?òÏóà?µÎãà??`);
        } else {
          alert(`${successIds.length}Í∞???†ú ?±Í≥µ, ${failedCount}Í∞??§Ìå®`);
        }
      } catch (error) {
        console.error("Bulk delete failed:", error);
        alert("?ºÎ? Ï£ºÎ¨∏ ??†ú???§Ìå®?àÏäµ?àÎã§.");
      }
    });
  };

  const handleViewAsInfo = async (asInfo: any) => {
    setLoadingAs(true);
    setAsDialogOpen(true);
    
    const result = await getAfterServiceById(asInfo.id);
    
    if (result.success && result.data) {
      setSelectedAsInfo(result.data);
    } else {
      setSelectedAsInfo(asInfo);
    }
    
    setLoadingAs(false);
  };

  const handleSyncDelivery = async (orderId: string) => {
    startTransition(async () => {
      const result = await updateOrderDeliveryStatus(orderId);
      
      if (result.success) {
        alert("??Î∞∞ÏÜ° ?ïÎ≥¥Í∞Ä ?ÖÎç∞?¥Ìä∏?òÏóà?µÎãà??);
        window.location.reload();
      } else {
        alert("??" + (result.error || "Î∞∞ÏÜ° ?ïÎ≥¥ Ï°∞Ìöå ?§Ìå®"));
      }
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: { variant: "secondary", label: "?ÄÍ∏? },
      PROCESSING: { variant: "default", label: "Ï≤òÎ¶¨Ï§? },
      SHIPPED: { variant: "outline", label: "Î∞∞ÏÜ°Ï§? },
      DELIVERED: { variant: "outline", label: "Î∞∞ÏÜ°?ÑÎ£å" },
      CANCELLED: { variant: "destructive", label: "Ï∑®ÏÜå" },
    };
    const config = variants[status] || { variant: "default", label: status };
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Í≤Ä??Î∞??ÑÌÑ∞ ?ÅÏó≠ */}
      <OrderSearchFilter
        searchName={searchName}
        setSearchName={setSearchName}
        searchPhone={searchPhone}
        setSearchPhone={setSearchPhone}
        orderSource={orderSource}
        setOrderSource={setOrderSource}
        dateRange={dateRange}
        setDateRange={setDateRange}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        filteredCount={filteredOrders.length}
        totalCount={orders.length}
        onReset={handleResetSearch}
        onPageChange={() => setCurrentPage(1)}
        orderSources={ALLOWED_ORDER_SOURCES}
        showOrderSourceFilter={true}
        disableOrderSourceFilter={!!userPartner}
      />

      {/* ?åÏù¥Î∏?*/}
      <div className="rounded-md border">
        {/* Ïª¨Îüº ?§Ï†ï Î≤ÑÌäº */}
        <div className="flex justify-end p-2 border-b bg-gray-50">
        {/* ?†ÌÉù????™©???¥ÏÜ°?•Î≤à???ºÍ¥Ñ ??†ú */}
        {selectedIds.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearTrackingNumbers}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            ?¥ÏÜ°?•Î≤à???ºÍ¥Ñ ??†ú ({selectedIds.size})
          </Button>
        )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Ïª¨Îüº ?§Ï†ï
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>?úÏãú??Ïª¨Îüº ?†ÌÉù</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_COLUMNS.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visibleColumns.has(column.id)}
                  onCheckedChange={() => toggleColumn(column.id)}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <div className="flex gap-1 px-2 py-1">
                <Button variant="outline" size="sm" onClick={showAllColumns} className="flex-1 text-xs">
                  ?ÑÏ≤¥ ?úÏãú
                </Button>
                <Button variant="outline" size="sm" onClick={resetColumns} className="flex-1 text-xs">
                  Í∏∞Î≥∏Í∞?
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
            <span className="text-sm font-medium">{selectedIds.size}Í∞??†ÌÉù??/span>
            <Button 
              onClick={handleBulkDelete} 
              variant="destructive" 
              size="sm"
              disabled={isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              ?†ÌÉù ??†ú
            </Button>
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={paginatedOrders.length > 0 && selectedIds.size === paginatedOrders.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                {visibleColumns.has("orderDate") && <TableHead className="w-[100px]">?†Ïßú</TableHead>}
                {visibleColumns.has("recipientName") && <TableHead>Í≥†Í∞ùÎ™?/TableHead>}
                {visibleColumns.has("recipientPhone") && <TableHead>?ÑÌôîÎ≤àÌò∏</TableHead>}
                {visibleColumns.has("recipientMobile") && <TableHead>?¥Îèô?µÏã†</TableHead>}
                {visibleColumns.has("recipientZipCode") && <TableHead>?∞Ìé∏Î≤àÌò∏</TableHead>}
                {visibleColumns.has("recipientAddr") && <TableHead>Ï£ºÏÜå</TableHead>}
                {visibleColumns.has("orderNumber") && <TableHead>Ï£ºÎ¨∏Î≤àÌò∏</TableHead>}
                {visibleColumns.has("productInfo") && <TableHead>?ÅÌíàÎ™?Î∞??òÎüâ</TableHead>}
                {visibleColumns.has("deliveryMsg") && <TableHead>Î∞∞ÏÜ°Î©îÏãúÏßÄ</TableHead>}
                {visibleColumns.has("orderSource") && <TableHead>Í≥†Í∞ùÏ£ºÎ¨∏Ï≤òÎ™Ö</TableHead>}
                {visibleColumns.has("basePrice") && <TableHead>?®Í?</TableHead>}
                {visibleColumns.has("shippingFee") && <TableHead>Î∞∞ÏÜ°Îπ?/TableHead>}
                {visibleColumns.has("courier") && <TableHead>?ùÎ∞∞??/TableHead>}
                {visibleColumns.has("trackingNumber") && <TableHead>?¥ÏÜ°?•Î≤à??/TableHead>}
                {visibleColumns.has("giftSent") && <TableHead className="text-center">?¨Ï??àÎ∞ú??/TableHead>}
                <TableHead className="text-center">AS?îÏ≤≠</TableHead>
                <TableHead className="w-[120px] text-right">?ëÏóÖ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={16} className="h-24 text-center">
                  {filteredOrders.length === 0 && orders.length > 0 
                    ? "Í≤Ä??Í≤∞Í≥ºÍ∞Ä ?ÜÏäµ?àÎã§." 
                    : "?±Î°ù??Ï£ºÎ¨∏???ÜÏäµ?àÎã§."
                  }
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => {
                const isEditing = editingId === order.id;
                return (
                  <TableRow key={order.id} className={isEditing ? "bg-blue-50" : ""}>
                    {/* Ï≤¥ÌÅ¨Î∞ïÏä§ */}
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(order.id)}
                        onCheckedChange={() => toggleSelectOne(order.id)}
                      />
                    </TableCell>
                    {/* ?†Ïßú */}
                    {visibleColumns.has("orderDate") && (
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
                    )}

                    {/* ?òÏ∑®?∏Î™Ö */}
                    {visibleColumns.has("recipientName") && (
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
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setDetailDialogOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                        >
                          {order.recipientName || "-"}
                        </button>
                      )}
                    </TableCell>
                    )}

                    {/* ?òÏ∑®???ÑÌôîÎ≤àÌò∏ */}
                    {visibleColumns.has("recipientPhone") && (
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
                    )}

                    {/* ?òÏ∑®???¥Îèô?µÏã† */}
                    {visibleColumns.has("recipientMobile") && (
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
                    )}

                    {/* ?òÏ∑®???∞Ìé∏Î≤àÌò∏ */}
                    {visibleColumns.has("recipientZipCode") && (
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
                    )}

                    {/* ?òÏ∑®??Ï£ºÏÜå */}
                    {visibleColumns.has("recipientAddr") && (
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
                    )}

                    {/* Ï£ºÎ¨∏Î≤àÌò∏ */}
                    {visibleColumns.has("orderNumber") && (
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
                    )}

                    {/* ?ÅÌíàÎ™?Î∞??òÎüâ */}
                    {visibleColumns.has("productInfo") && (
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
                    )}

                    {/* Î∞∞ÏÜ°Î©îÏãúÏßÄ */}
                    {visibleColumns.has("deliveryMsg") && (
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
                    )}

                    {/* Í≥†Í∞ùÏ£ºÎ¨∏Ï≤òÎ™Ö */}
                    {visibleColumns.has("orderSource") && (
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
                            <SelectItem value="?êÏÇ¨Î™?>?êÏÇ¨Î™?/SelectItem>
                            <SelectItem value="?§Î™∞??>?§Î™∞??/SelectItem>
                            <SelectItem value="?ºÌïëÎ™?>?ºÌïëÎ™?/SelectItem>
                            <SelectItem value="Í∑∏Î°ú??>Í∑∏Î°ú??/SelectItem>
                            <SelectItem value="?¥Ìîº?¨Ï¶à">?¥Ìîº?¨Ï¶à</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        order.orderSource || "-"
                      )}
                    </TableCell>
                    )}

                    {/* ?®Í? */}
                    {visibleColumns.has("basePrice") && (
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editData.basePrice}
                          onChange={(e) =>
                            setEditData({ ...editData, basePrice: e.target.value })
                          }
                          className="w-[100px]"
                        />
                      ) : (
                        (() => {
                          const price = (Number(order.basePrice) || 0);
                          return price > 0 ? price.toLocaleString() : "-";
                        })()
                      )}
                    </TableCell>
                    )}

                    {/* Î∞∞ÏÜ°Îπ?*/}
                    {visibleColumns.has("shippingFee") && (
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
                        order.shippingFee ? Number(order.shippingFee).toLocaleString() : "-"
                      )}
                    </TableCell>
                    )}

                    {/* ?ùÎ∞∞??*/}
                    {visibleColumns.has("courier") && (
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
                    )}

                    {/* ?¥ÏÜ°?•Î≤à??*/}
                    {visibleColumns.has("trackingNumber") && (
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
                    )}

                    {/* ?¨Ï???Î∞úÏÜ° */}
                    {visibleColumns.has("giftSent") && (
                    <TableCell className="text-center">
                      {isEditing ? (
                        <Button
                          variant={editData.giftSent ? "default" : "outline"}
                          size="sm"
                          onClick={() => setEditData({ ...editData, giftSent: !editData.giftSent })}
                          className={`h-7 px-2 text-xs ${editData.giftSent ? "bg-green-600 hover:bg-green-700" : ""}`}
                        >
                          {editData.giftSent ? "Î∞úÏÜ°" : "ÎØ∏Î∞ú??}
                        </Button>
                      ) : (
                        <Button
                          variant={order.giftSent ? "default" : "outline"}
                          size="sm"
                          onClick={async () => {
                            const debugInfo: string[] = [];
                            const timestamp = new Date().toISOString();
                            
                            debugInfo.push(`?ïí ?úÏûë ?úÍ∞Ñ: ${timestamp}`);
                            debugInfo.push(`?ì¶ Ï£ºÎ¨∏ ID: ${order.id}`);
                            debugInfo.push(`?ë§ Í≥†Í∞ùÎ™? ${order.recipientName}`);
                            debugInfo.push(`?ìã ?¥Ï†Ñ ?ÅÌÉú: ${order.giftSent ? 'Î∞úÏÜ°' : 'ÎØ∏Î∞ú??}`);
                            
                            const newValue = !order.giftSent;
                            const previousValue = order.giftSent;
                            
                            debugInfo.push(`?ìã ???ÅÌÉú: ${newValue ? 'Î∞úÏÜ°' : 'ÎØ∏Î∞ú??}`);
                            
                            try {
                              // Ï¶âÏãú UI ?ÖÎç∞?¥Ìä∏ (?ôÍ????ÖÎç∞?¥Ìä∏)
                              debugInfo.push(`??UI ?ôÍ????ÖÎç∞?¥Ìä∏ ?úÏûë`);
                              setOrders(prevOrders => {
                                const updated = prevOrders.map(o => o.id === order.id ? { ...o, giftSent: newValue } : o);
                                debugInfo.push(`?ìä ?ÖÎç∞?¥Ìä∏??Ï£ºÎ¨∏ ?? ${updated.filter(o => o.id === order.id).length}`);
                                return updated;
                              });
                              
                              // ÎπÑÎèôÍ∏∞Î°ú ?úÎ≤Ñ ?ÖÎç∞?¥Ìä∏
                              debugInfo.push(`?åê ?úÎ≤Ñ ?ÖÎç∞?¥Ìä∏ ?îÏ≤≠ ?úÏûë...`);
                              debugInfo.push(`?ì§ ?ÑÏÜ° ?∞Ïù¥?? { giftSent: ${newValue} }`);
                              
                              const startTime = performance.now();
                              const result = await updateOrder(order.id, { giftSent: newValue });
                              const endTime = performance.now();
                              const duration = (endTime - startTime).toFixed(2);
                              
                              debugInfo.push(`?±Ô∏è API ?ëÎãµ ?úÍ∞Ñ: ${duration}ms`);
                              debugInfo.push(`?ì• ?ëÎãµ: ${JSON.stringify(result, null, 2)}`);
                              
                              // ?§Ìå® ??Î°§Î∞±
                              if (!result.success) {
                                debugInfo.push(`???ÖÎç∞?¥Ìä∏ ?§Ìå®!`);
                                debugInfo.push(`?îô Î°§Î∞± ?òÌñâ Ï§?..`);
                                setOrders(prevOrders =>
                                  prevOrders.map(o => o.id === order.id ? { ...o, giftSent: previousValue } : o)
                                );
                                debugInfo.push(`?îô Î°§Î∞± ?ÑÎ£å`);
                                
                                if (result.error) {
                                  debugInfo.push(`???êÎü¨ ÏΩîÎìú: ${result.error.code}`);
                                  debugInfo.push(`???êÎü¨ Î©îÏãúÏßÄ: ${result.error.message}`);
                                  if (result.error.details) {
                                    debugInfo.push(`?ìã ?êÎü¨ ?ÅÏÑ∏: ${JSON.stringify(result.error.details, null, 2)}`);
                                  }
                                }
                                
                                alert('?êõ ?îÎ≤ÑÍπ??ïÎ≥¥\n\n' + debugInfo.join('\n'));
                              } else {
                                debugInfo.push(`???ÖÎç∞?¥Ìä∏ ?±Í≥µ!`);
                                console.log('???¨Ï??àÎ∞ú???ÖÎç∞?¥Ìä∏ ?±Í≥µ:', debugInfo.join('\n'));
                              }
                            } catch (error) {
                              debugInfo.push(`?í• ?àÏô∏ Î∞úÏÉù: ${error}`);
                              debugInfo.push(`?îô Î°§Î∞± ?òÌñâ Ï§?..`);
                              setOrders(prevOrders =>
                                prevOrders.map(o => o.id === order.id ? { ...o, giftSent: previousValue } : o)
                              );
                              alert('?êõ ?îÎ≤ÑÍπ??ïÎ≥¥\n\n' + debugInfo.join('\n'));
                            }
                          }}
                          className={`h-7 px-2 text-xs ${order.giftSent ? "bg-green-600 hover:bg-green-700" : ""}`}
                        >
                          {order.giftSent ? "Î∞úÏÜ°" : "ÎØ∏Î∞ú??}
                        </Button>
                      )}
                    </TableCell>
                    )}

                    {/* AS?îÏ≤≠ */}
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAsSelectedOrder(order);
                          setAsDialogOpen(true);
                        }}
                        className="h-8 w-8 p-0"
                        title="AS ?îÏ≤≠"
                      >
                        <Wrench className="h-4 w-4 text-purple-500" />
                      </Button>
                    </TableCell>

                    {/* ?ëÏóÖ */}
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
                          {order.courier && order.trackingNumber && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSyncDelivery(order.id)}
                              disabled={isPending}
                              title="Î∞∞ÏÜ°?ïÎ≥¥ ?∞Îèô"
                            >
                              <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedOrderForEdit(order);
                              setEditDialogMode("edit");
                              setEditDialogOpen(true);
                            }}
                            title="?òÏ†ï"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(order.id)}
                            disabled={isPending}
                            title="??†ú"
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

      {/* ?òÏù¥ÏßÄ?§Ïù¥??*/}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-500">
            {startIndex + 1} - {Math.min(endIndex, filteredOrders.length)} / Ï¥?{filteredOrders.length}Í±?
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              Ï≤òÏùå
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ?¥Ï†Ñ
            </Button>
            
            {/* ?òÏù¥ÏßÄ Î≤àÌò∏??*/}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="min-w-[40px]"
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              ?§Ïùå
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              ÎßàÏ?Îß?
            </Button>
          </div>
        </div>
      )}
    </div>

      {/* AS ?îÏ≤≠ ?§Ïù¥?ºÎ°úÍ∑?*/}
      <ASRequestDialog
        open={asDialogOpen}
        onOpenChange={setAsDialogOpen}
        order={asSelectedOrder}
      />

      {/* AS ?ëÏàò ?ïÎ≥¥ ?§Ïù¥?ºÎ°úÍ∑?*/}
      <Dialog open={asDialogOpen && selectedAsInfo} onOpenChange={setAsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              AS ?ëÏàò ?ÅÏÑ∏ ?ïÎ≥¥
            </DialogTitle>
            <DialogDescription>
              Í≥†Í∞ù A/S ?ëÏàò Î∞?Ï≤òÎ¶¨ ?¥Ïó≠???ïÏù∏?????àÏäµ?àÎã§.
            </DialogDescription>
          </DialogHeader>

          {loadingAs ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : selectedAsInfo ? (
            <div className="space-y-6">
              {/* Í∏∞Î≥∏ ?ïÎ≥¥ */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">?ëÏàòÎ≤àÌò∏</label>
                  <p className="text-base font-semibold">{selectedAsInfo.ticketNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">?ëÏàò?ºÏãú</label>
                  <p className="text-base flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedAsInfo.serviceDate).toLocaleString('ko-KR')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Í≥†Í∞ùÎ™?/label>
                  <p className="text-base font-semibold">{selectedAsInfo.customerName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">?∞ÎùΩÏ≤?/label>
                  <p className="text-base">{selectedAsInfo.customerPhone}</p>
                </div>
              </div>

              {/* ?ÅÌÉú */}
              <div>
                <label className="text-sm font-medium text-gray-500">Ï≤òÎ¶¨ ?ÅÌÉú</label>
                <div className="mt-1">
                  <Badge className={
                    selectedAsInfo.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    selectedAsInfo.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    selectedAsInfo.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }>
                    {selectedAsInfo.status === "RECEIVED" && "?ëÏàò"}
                    {selectedAsInfo.status === "DIAGNOSED" && "ÏßÑÎã® Ï§?}
                    {selectedAsInfo.status === "PARTS_ORDERED" && "Î∂Ä??Î∞úÏ£º"}
                    {selectedAsInfo.status === "SCHEDULED" && "Î∞©Î¨∏ ?àÏ†ï"}
                    {selectedAsInfo.status === "IN_PROGRESS" && "Ï≤òÎ¶¨ Ï§?}
                    {selectedAsInfo.status === "COMPLETED" && "?ÑÎ£å"}
                    {selectedAsInfo.status === "CANCELLED" && "Ï∑®ÏÜå"}
                  </Badge>
                  <Badge variant="outline" className="ml-2">
                    {selectedAsInfo.priority === "URGENT" && "Í∏¥Í∏â"}
                    {selectedAsInfo.priority === "HIGH" && "?íÏùå"}
                    {selectedAsInfo.priority === "NORMAL" && "Î≥¥ÌÜµ"}
                    {selectedAsInfo.priority === "LOW" && "??ùå"}
                  </Badge>
                </div>
              </div>

              {/* ?úÌíà ?ïÎ≥¥ */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  ?úÌíà ?ïÎ≥¥
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">?úÌíàÎ™?/label>
                    <p className="text-base">{selectedAsInfo.productName || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Î™®Îç∏Î™?/label>
                    <p className="text-base">{selectedAsInfo.modelNumber || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">?úÎ¶¨?ºÎ≤à??/label>
                    <p className="text-base font-mono text-sm">{selectedAsInfo.serialNumber || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Î≥¥Ï¶ù ?ÅÌÉú</label>
                    <p className="text-base">
                      {selectedAsInfo.warrantyStatus === 'IN_WARRANTY' ? 'Î≥¥Ï¶ùÍ∏∞Í∞Ñ ?? : 'Î≥¥Ï¶ùÍ∏∞Í∞Ñ ??}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ï¶ùÏÉÅ Î∞?Î¨∏Ï†ú */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Ï¶ùÏÉÅ Î∞?Î¨∏Ï†ú
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Î¨∏Ï†ú ?†Ìòï</label>
                    <p className="text-base">
                      {selectedAsInfo.issueType === 'NOISE' && '?åÏùå'}
                      {selectedAsInfo.issueType === 'FILTER' && '?ÑÌÑ∞ ÍµêÏ≤¥'}
                      {selectedAsInfo.issueType === 'POWER' && '?ÑÏõê Î¨∏Ï†ú'}
                      {selectedAsInfo.issueType === 'SENSOR' && '?ºÏÑú ?§Î•ò'}
                      {selectedAsInfo.issueType === 'PERFORMANCE' && '?±Îä• ?Ä??}
                      {selectedAsInfo.issueType === 'ODOR' && '?ÑÏÉà'}
                      {selectedAsInfo.issueType === 'OTHER' && 'Í∏∞Ì?'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ï¶ùÏÉÅ ?§Î™Ö</label>
                    <p className="text-base bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                      {selectedAsInfo.issueDescription || selectedAsInfo.issueTitle || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ï≤òÎ¶¨ ?¥Ïó≠ */}
              {(selectedAsInfo.repairContent || selectedAsInfo.repairDetails) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">?òÎ¶¨ ?¥Ïó≠</h4>
                  <p className="text-base bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                    {selectedAsInfo.repairContent || selectedAsInfo.repairDetails}
                  </p>
                </div>
              )}

              {/* Î∞∞ÏÜ° ?ïÎ≥¥ */}
              {(selectedAsInfo.courier || selectedAsInfo.trackingNumber) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Î∞∞ÏÜ° ?ïÎ≥¥
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">?ùÎ∞∞??/label>
                      <p className="text-base">{selectedAsInfo.courier || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">?¥ÏÜ°?•Î≤à??/label>
                      <p className="text-base font-mono text-sm">{selectedAsInfo.trackingNumber || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ÎπÑÏö© ?ïÎ≥¥ */}
              {(selectedAsInfo.totalCost > 0 || selectedAsInfo.laborCost > 0 || selectedAsInfo.partsCost > 0) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">ÎπÑÏö© ?ïÎ≥¥</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">?∏Í±¥Îπ?/label>
                      <p className="text-base font-semibold">
                        {selectedAsInfo.laborCost?.toLocaleString()}??
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Î∂Ä?àÎπÑ</label>
                      <p className="text-base font-semibold">
                        {selectedAsInfo.partsCost?.toLocaleString()}??
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ï¥?ÎπÑÏö©</label>
                      <p className="text-lg font-bold text-blue-600">
                        {selectedAsInfo.totalCost?.toLocaleString()}??
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ?¥Îãπ???ïÎ≥¥ */}
              {selectedAsInfo.assignedTo && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">?¥Îãπ??/h4>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {selectedAsInfo.assignedTo.name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{selectedAsInfo.assignedTo.name}</p>
                      <p className="text-sm text-gray-500">{selectedAsInfo.assignedTo.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              AS ?ïÎ≥¥Î•?Î∂àÎü¨?????ÜÏäµ?àÎã§.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ï£ºÎ¨∏ ?ÅÏÑ∏ ?ïÎ≥¥ ?§Ïù¥?ºÎ°úÍ∑?*/}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-600">Ï£ºÎ¨∏ ?ÅÏÑ∏ ?ïÎ≥¥</DialogTitle>
            <DialogDescription>
              Ï£ºÎ¨∏Î≤àÌò∏: {selectedOrder?.orderNumber || "-"}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Í≥†Í∞ù ?ïÎ≥¥ */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Í≥†Í∞ù ?ïÎ≥¥
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Í≥†Í∞ùÎ™?/label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.recipientName || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">?ÑÌôîÎ≤àÌò∏</label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.recipientPhone || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">?¥Î??ÑÌôî</label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.recipientMobile || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">?∞Ìé∏Î≤àÌò∏</label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.recipientZipCode || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Ï£ºÏÜå</label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.recipientAddr || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Ï£ºÎ¨∏ ?ïÎ≥¥ */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Ï£ºÎ¨∏ ?ïÎ≥¥
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Ï£ºÎ¨∏??/label>
                    <p className="text-base font-semibold text-gray-800">
                      {selectedOrder.orderDate 
                        ? new Date(selectedOrder.orderDate).toLocaleDateString("ko-KR") 
                        : new Date(selectedOrder.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Ï£ºÎ¨∏Ï≤?/label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.orderSource || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Î∞∞ÏÜ° Î©îÏãúÏßÄ</label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.deliveryMsg || "-"}</p>
                  </div>
                </div>
              </div>

              {/* ?ÅÌíà ?ïÎ≥¥ */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-200">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-600" />
                  ?ÅÌíà ?ïÎ≥¥
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">?ÅÌíàÎ™?Î∞??òÎüâ</label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.productInfo || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">?®Í?</label>
                    <p className="text-base font-semibold text-gray-800">
                      {selectedOrder.basePrice ? `${selectedOrder.basePrice.toLocaleString()}?? : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Î∞∞ÏÜ°Îπ?/label>
                    <p className="text-base font-semibold text-gray-800">
                      {selectedOrder.shippingFee ? `${selectedOrder.shippingFee.toLocaleString()}?? : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Ï¥?Í∏àÏï°</label>
                    <p className="text-lg font-bold text-emerald-600">
                      {selectedOrder.totalAmount ? `${selectedOrder.totalAmount.toLocaleString()}?? : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Î∞∞ÏÜ° ?ïÎ≥¥ */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-orange-600" />
                  Î∞∞ÏÜ° ?ïÎ≥¥
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">?ùÎ∞∞??/label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.courier || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">?¥ÏÜ°?•Î≤à??/label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.trackingNumber || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Î∞∞ÏÜ° ?ÅÌÉú</label>
                    <div className="mt-1">
                      <DeliveryStatusProgress status={selectedOrder.deliveryStatus} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">?¨Ï???Î∞úÏÜ°</label>
                    <p className="text-base font-semibold text-gray-800">{selectedOrder.giftSent || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Í∏∞Ì? ?ïÎ≥¥ */}
              {(selectedOrder.memo || selectedOrder.internalNotes) && (
                <div className="bg-gradient-to-br from-gray-50 to-slate-100 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold mb-3 text-gray-800">Í∏∞Ì? ?ïÎ≥¥</h4>
                  {selectedOrder.memo && (
                    <div className="mb-3">
                      <label className="text-sm font-medium text-gray-600">Î©îÎ™®</label>
                      <p className="text-base text-gray-800">{selectedOrder.memo}</p>
                    </div>
                  )}
                  {selectedOrder.internalNotes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">?¥Î? Î©îÎ™®</label>
                      <p className="text-base text-gray-800">{selectedOrder.internalNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ï£ºÎ¨∏ ?òÏ†ï ?§Ïù¥?ºÎ°úÍ∑?*/}
      <EditOrderDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        order={selectedOrderForEdit}
        mode={editDialogMode}
      />

      {/* ?§Î•ò Î©îÏãúÏßÄ ?§Ïù¥?ºÎ°úÍ∑?*/}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>?§Î•ò Î∞úÏÉù</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60 text-sm whitespace-pre-wrap break-words">
              {errorMessage}
            </pre>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(errorMessage);
                  alert("?§Î•ò Î©îÏãúÏßÄÍ∞Ä Î≥µÏÇ¨?òÏóà?µÎãà??");
                }}
              >
                Î≥µÏÇ¨
              </Button>
              <Button onClick={() => setErrorDialogOpen(false)}>
                ?´Í∏∞
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
