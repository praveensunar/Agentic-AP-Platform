// ─── Invoice ──────────────────────────────────────────────────────────────────
export type InvoiceStatus =
  | 'Uploaded'
  | 'Processing'
  | 'OCR Complete'
  | 'PII Masked'
  | 'Extraction Complete'
  | 'Validation Complete'
  | 'Human Review'
  | 'Approved'
  | 'Failed';

export type UserRole = 'Admin' | 'User';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Vendor {
  _id: string;
  vendorName: string;
  vendorCode: string;
  gstNumber?: string;
  panNumber?: string;
  email: string;
  phone?: string;
  country?: string;
  status: 'Active' | 'Inactive' | 'Pending';
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  vendor?: Vendor | null;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  confidenceScore?: number | null;
  uploadedAt: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export type NotificationType = 'invoice' | 'vendor' | 'system' | 'alert';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardSummary {
  totalInvoices: number;
  totalVendors: number;
  approvedAmount: number;
  approvedCount: number;
  failedCount: number;
  pendingCount: number;
}

export interface StatusCount {
  status: InvoiceStatus;
  count: number;
}

export interface MonthlyData {
  month: string;
  count: number;
  amount: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  statusBreakdown: StatusCount[];
  monthlyChart: MonthlyData[];
  recentInvoices: Invoice[];
}

export interface VendorStat {
  _id: string;
  vendorName: string;
  vendorCode: string;
  invoiceCount: number;
  totalAmount: number;
  approvedCount: number;
  failedCount: number;
  avgConfidenceScore: number | null;
  approvalRate: number;
}

export interface VendorDashboardData {
  summary: {
    totalVendors: number;
    activeVendors: number;
    inactiveVendors: number;
    pendingVendors: number;
  };
  countryDistribution: { country: string; count: number }[];
  monthlyCreation: { month: string; count: number }[];
  performance: VendorStat[];
}

// ─── API Generic ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ─── Socket Events ───────────────────────────────────────────────────────────
export interface InvoiceStatusUpdate {
  invoiceId: string;
  status: InvoiceStatus;
  invoiceNumber: string;
  confidenceScore?: number;
  timestamp: string;
}
