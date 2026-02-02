// ============================================
// CRM AI Platform - Type Definitions
// ============================================

// Common Types
export type Status = 'ACTIVE' | 'INACTIVE' | 'PENDING';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

// Server Action Response
export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

// Customer Domain
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: Status;
  segment?: CustomerSegment;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type CustomerSegment = 'VIP' | 'REGULAR' | 'NEW' | 'DORMANT' | 'AT_RISK';

export interface CustomerMetrics {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  lifetimeValue: number;
  churnRisk: number;
}

// Order Domain
export interface Order {
  id: string;
  customerId: string;
  orderNumber?: string;
  orderDate: Date;
  totalAmount: number;
  status: OrderStatus;
  items: OrderItem[];
  shipping?: ShippingInfo;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'PROCESSING' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'CANCELLED' 
  | 'REFUNDED';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ShippingInfo {
  ordererName: string;
  contactPhone: string;
  address: string;
  zipCode: string;
  courier?: string;
  trackingNumber?: string;
  deliveryMessage?: string;
}

// Product Domain
export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  stock: number;
  category?: string;
  status: Status;
}

// Ticket Domain
export interface Ticket {
  id: string;
  subject: string;
  description?: string;
  status: TicketStatus;
  priority: Priority;
  category?: string;
  customerId?: string;
  assignedToId?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

// Lead Domain
export interface Lead {
  id: string;
  title: string;
  description?: string;
  value?: number;
  status: LeadStatus;
  customerId?: string;
  assignedToId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';

// Review Domain
export interface Review {
  id: string;
  source: string;
  author: string;
  content: string;
  rating: number;
  date: Date;
  sentiment?: Sentiment;
  topics?: string[];
  productUrl?: string;
}

// Campaign Domain
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  targetSegment?: CustomerSegment;
  budget?: number;
  spent: number;
  roi: number;
  startDate: Date;
  endDate: Date;
  metrics: CampaignMetrics;
}

export type CampaignType = 'COUPON' | 'EMAIL' | 'SMS' | 'PUSH';
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface CampaignMetrics {
  sentCount: number;
  openCount: number;
  clickCount: number;
  convertCount: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

// Dashboard KPIs
export interface DashboardKPIs {
  revenue: {
    total: number;
    currentMonth: number;
    previousMonth: number;
    growth: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    averageValue: number;
  };
  customers: {
    total: number;
    active: number;
    new: number;
    churnRate: number;
    repeatRate: number;
  };
  support: {
    tickets: {
      total: number;
      open: number;
      inProgress: number;
      resolved: number;
    };
    resolutionRate: number;
    avgResponseTime: number;
  };
  inventory: {
    totalStock: number;
    lowStockItems: number;
    outOfStockItems: number;
  };
  leads: {
    total: number;
    won: number;
    lost: number;
    conversionRate: number;
  };
}

// Alert Types
export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  isRead: boolean;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export type AlertType = 
  | 'ORDER_SURGE' 
  | 'LOW_STOCK' 
  | 'SYSTEM_ERROR' 
  | 'MALICIOUS_REVIEW' 
  | 'CHURN_RISK';

export type AlertSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

// Filter & Search
export interface SearchFilters {
  query?: string;
  status?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  segment?: string[];
  [key: string]: unknown;
}

// Recent Activity Types
export interface RecentActivity {
  orders: RecentOrder[];
  tickets: RecentTicket[];
}

export interface RecentOrder {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
  customer: {
    id: string;
    name: string;
  };
}

export interface RecentTicket {
  id: string;
  subject: string;
  status: string;
  customer: {
    id: string;
    name: string;
  };
}

// Table Column Types
export interface TableColumn<T = unknown> {
  key: string;
  title: string;
  sortable?: boolean;
  width?: string | number;
  render?: (value: unknown, row: T) => React.ReactNode;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}
