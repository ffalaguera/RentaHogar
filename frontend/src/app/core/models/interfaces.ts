// ── User ──
export interface User {
  id: string;
  _id?: string;
  fullName: string;
  email: string;
  role: 'owner' | 'tenant';
  phone?: string;
  avatar?: string;
  gender?: 'male' | 'female';
  isActive?: boolean;
  mustChangePassword?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// ── Property ──
export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country?: string;
}

export interface Property {
  _id: string;
  owner: string;
  name: string;
  address: Address;
  type: 'apartment' | 'house' | 'studio' | 'room' | 'commercial';
  monthlyRent: number;
   // Modo de alquiler: completo (alquiler total) o por habitaciones
  rentMode?: 'full' | 'rooms';
  // Lista de alquileres por habitación cuando rentMode === 'rooms'
  roomRents?: number[];
  bedrooms: number;
  bathrooms: number;
  squareMeters: number;
  description?: string;
  isActive: boolean;
  tenants?: User[];
  tenantCount?: number;
  // Alquiler total actual (suma de inquilinos activos si es por habitaciones)
  currentMonthlyRent?: number;
  createdAt?: string;
}

// ── Tenant Assignment ──
export interface TenantAssignment {
  _id: string;
  tenant: User;
  property: Property;
  owner: string;
  monthlyRent: number;
  room?: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

// ── Payment ──
export interface Payment {
  _id: string;
  tenant: User;
  property: Property;
  owner: string;
  amount: number;
  month: number;
  year: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
  paymentMethod?: string;
  notes?: string;
  daysOverdue?: number;
  colorLevel?: 'green' | 'yellow' | 'red';
}

export interface PaymentSummary {
  currentMonth: {
    totalRent: number;
    paid: number;
    pending: number;
  };
  currentYear: {
    totalRent: number;
    paid: number;
    pending: number;
  };
  month: number;
  year: number;
}

// ── Invoice ──
export type InvoiceType = 'water' | 'gas' | 'electricity' | 'internet' | 'community' | 'insurance' | 'other';

export interface Invoice {
  _id: string;
  property: Property;
  owner: string;
  type: InvoiceType;
  amount: number;
  periodStart: { month: number; year: number };
  periodEnd: { month: number; year: number };
  issueDate: string;
  isPaid: boolean;
  paidDate?: string;
  reference?: string;
  documentUrl?: string;
  notes?: string;
}

// ── Incident ──
export type IncidentType = 'plumbing' | 'electrical' | 'structural' | 'appliance' | 'heating' | 'pest' | 'other';
export type IncidentStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Incident {
  _id: string;
  tenant: User;
  property: Property;
  owner: string;
  title: string;
  description: string;
  type: IncidentType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: IncidentStatus;
  resolvedAt?: string;
  ownerNotes?: string;
  createdAt: string;
}

// ── Notification ──
export interface Notification {
  _id: string;
  recipient: string;
  type: 'incident' | 'payment' | 'reminder' | 'welcome' | 'general';
  title: string;
  message: string;
  relatedModel?: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

// ── API Response ──
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    pages: number;
  };
  total?: number;
}

// ── Tenant Dashboard ──
export interface TenantDashboardData {
  owner: User;
  property: Property;
  flatmates?: (Pick<User, 'fullName' | 'email' | 'phone'> & { id?: string })[];
  monthlyRent: number;
  invoices: {
    items: Invoice[];
    total: number;
  };
  totalMonthly: number;
  paymentStatus: {
    status: string;
    daysOverdue: number;
    colorLevel: 'green' | 'yellow' | 'red';
    currentPayment?: Payment;
  };
  incidents: Incident[];
}

// ── Search Results ──
export interface SearchResults {
  properties: Property[];
  tenants: (User & { property?: Property })[];
}
