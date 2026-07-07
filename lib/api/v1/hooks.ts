import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from './fetchApi';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface Product {
  product_id: number; product_code: string; product_name: string;
  category_id: number; cat_name: string; unit_type: string;
  selling_price: number; current_quantity: number; low_stock_alert: number;
  description: string; image_url: string | null; status: string;
  capital_value: number; created_by: string; created_at: string;
}

export interface AvailableProduct {
  product_id: number; product_name: string; unit_type: string;
  selling_price: number; current_quantity: number; available_quantity: number;
  reserved_in_orders: number; low_stock_alert: number;
  cat_name: string; image_url: string | null; status: string;
}

export interface Purchase {
  purchase_id: number; purchase_ref: string; product_id: number;
  product_name?: string; unit_type?: string; quantity: number;
  remaining_quantity: number; unit_cost: number; total_cost: number;
  supplier_name: string; notes: string; created_by: string; created_at: string;
}

export interface Sale {
  sale_id: number; sale_ref: string; customer_name: string;
  customer_phone: string; total_amount: number; discount_amount: number;
  paid_amount: number; change_amount: number; payment_method: string;
  payment_reference: string; status: string; notes: string;
  created_by: string; accepted_by: string; created_at: string;
  loan_id: number | null; order_id: number | null;
  firstname?: string; lastname?: string;
}

export interface SaleItem {
  item_id: number; sale_id: number; product_id: number;
  product_name?: string; unit_type?: string; quantity: number;
  unit_price: number; unit_cost: number; subtotal: number; profit: number;
}

// ─── Orders (multi-customer named sessions) ──────────────────
export interface Order {
  order_id: number; order_ref: string; order_name: string;
  status: 'open' | 'paid' | 'cancelled'; notes: string | null;
  item_count: number; total: number;
  created_by: string; created_at: string; closed_at: string | null;
  firstname?: string; lastname?: string;
}

export interface OrderItem {
  item_id: number; order_id: number; product_id: number;
  product_name: string; unit_type: string; current_quantity: number;
  quantity: number; unit_price: number; subtotal: number;
  max_quantity: number; created_at: string;
}

// ─── Loan Accounts ───────────────────────────────────────────
export interface LoanAccount {
  loan_id: number; account_ref: string; customer_name: string;
  customer_phone: string; customer_email: string; notes: string;
  total_debt: number; total_paid: number; balance: number;
  status: 'active' | 'settled' | 'suspended';
  created_by: string; created_at: string; updated_at: string;
  sale_count?: number; payment_count?: number;
}

export interface LoanPayment {
  payment_id: number; loan_id: number; amount: number;
  payment_method: string; payment_reference: string; notes: string;
  received_by: string; created_at: string;
  firstname?: string; lastname?: string;
}

// ─── Spaces ──────────────────────────────────────────────────
export interface Space {
  space_id: number; space_name: string; space_type: string;
  floor: string; price_per_period: number; billing_period: string;
  status: string; description: string;
  occupancy_id?: number; tenant_name?: string; tenant_phone?: string;
  tenant_email?: string; start_date?: string; next_payment_date?: string;
  agreed_price?: number; days_until_payment?: number; is_overdue?: number;
  total_occupancies?: number; total_collected?: number;
}

export interface Occupancy {
  occupancy_id: number; space_id: number; tenant_name: string;
  tenant_phone: string; tenant_email: string; tenant_id_number: string;
  start_date: string; end_date: string | null; next_payment_date: string;
  agreed_price: number; billing_period: string;
  status: 'active' | 'ended' | 'evicted';
  notes: string; created_by: string; created_at: string;
}

export interface SpacePayment {
  payment_id: number; occupancy_id: number; space_id: number;
  amount: number; payment_method: string; payment_reference: string;
  period_covered_from: string; period_covered_to: string;
  tenant_name?: string; notes: string; created_by: string;
  accepted_by: string; created_at: string;
  firstname?: string; lastname?: string;
}

// ─── Stock ───────────────────────────────────────────────────
export interface StockSession {
  session_id: number; session_date: string; status: string;
  opened_by: string; opened_by_name: string; closed_by_name?: string;
  entry_count: number; missing_count: number; opened_at: string;
  closed_at: string | null; notes: string;
}

export interface StockEntry {
  entry_id: number; session_id: number; product_id: number;
  product_name: string; unit_type: string; entry_type: string;
  recorded_quantity: number; system_quantity: number; variance: number; notes: string;
}

// ─── Dashboard ───────────────────────────────────────────────
export interface DashboardData {
  today_sales: { cnt: number; revenue: number; collected: number };
  month_sales: { cnt: number; revenue: number };
  month_profit: { profit: number };
  top_products: Array<{ product_name: string; unit_type: string; total_qty: number; total_revenue: number; total_profit: number }>;
  low_stock: Product[];
  stock_issues: StockEntry[];
  space_reminders: Space[];
  overdue_spaces: Space[];
  space_summary: Array<{ status: string; cnt: number }>;
  weekly_chart: Array<{ sale_date: string; sales_count: number; revenue: number }>;
  capital: { total_capital: number };
}

// ─── Users / Roles ───────────────────────────────────────────
export interface User {
  user_no: number; userId: string; firstname: string; lastname: string;
  email: string; phonenumber: string; status: string;
  role_id: number; role_name?: string; dates?: string;
}

export interface Role { role_id: number; role_name: string; description: string; }

export interface Purchase {
  purchase_id: number; purchase_ref: string; product_id: number;
  product_name?: string; unit_type?: string; quantity: number;
  remaining_quantity: number; unit_cost: number; total_cost: number;
  supplier_name: string; notes: string; created_by: string; created_at: string;
  updated_by?: string; updated_at?: string;
}

// ═══════════════════════════════════════════════════════════════
// EDIT PURCHASE
// ═══════════════════════════════════════════════════════════════


export const useEditPurchase = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<Purchase>) => apiPost('/api/main/dashboard/update/update-purchase', d as Record<string, unknown>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['available-stock'] });
    },
  });
};
// ═══════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════

export const useProducts = (filters?: { category_id?: string; search?: string; status?: string }) =>
  useQuery({
    queryKey: ['products', filters],
    queryFn: () => apiPost<{ products: Product[] }>('/api/main/dashboard/fetch/fetch-products', filters || {}),
  });

export const useAddProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<Product>) => apiPost('/api/main/dashboard/create/add-product', d as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<Product>) => apiPost('/api/main/dashboard/update/update-product', d as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useProductCategories = () =>
  useQuery({
    queryKey: ['product-categories'],
    queryFn: () => apiPost<{ categories: Array<{ cat_id: number; cat_name: string }> }>('/api/main/dashboard/fetch/fetch-product-categories', {}),
  });

// ─── Available stock (accounts for all open orders) ──────────
export const useAvailableStock = (orderId?: number | null) =>
  useQuery({
    queryKey: ['available-stock', orderId],
    queryFn: () => apiPost<{ products: AvailableProduct[] }>('/api/main/dashboard/fetch/fetch-available-stock', { order_id: orderId ?? null }),
    refetchInterval: 12000,
  });

// ═══════════════════════════════════════════════════════════════
// PURCHASES
// ═══════════════════════════════════════════════════════════════

export const usePurchases = (productId?: number) =>
  useQuery({
    queryKey: ['purchases', productId],
    queryFn: () => apiPost<{ purchases: Purchase[] }>('/api/main/dashboard/fetch/fetch-purchases', { product_id: productId }),
  });

export const useAddPurchase = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<Purchase>) => apiPost('/api/main/dashboard/create/add-purchase', d as Record<string, unknown>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['available-stock'] });
    },
  });
};

// ═══════════════════════════════════════════════════════════════
// ORDERS (named multi-customer sessions — replaces cart)
// ═══════════════════════════════════════════════════════════════

export const useOrders = () =>
  useQuery({
    queryKey: ['orders'],
    queryFn: () => apiPost<{ orders: Order[] }>('/api/main/dashboard/create/order-action', { action: 'list' }),
    refetchInterval: 10000,
  });

export const useOrderDetail = (orderId: number | null) =>
  useQuery({
    queryKey: ['order', orderId],
    enabled: !!orderId,
    queryFn: () => apiPost<{ order: Order; items: OrderItem[]; total: number }>(
      '/api/main/dashboard/create/order-action',
      { action: 'fetch_order', order_id: orderId }
    ),
    refetchInterval: 8000,
  });

export const useOrderAction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Record<string, unknown>) => apiPost('/api/main/dashboard/create/order-action', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order'] });
      qc.invalidateQueries({ queryKey: ['available-stock'] });
    },
  });
};

// ═══════════════════════════════════════════════════════════════
// SALES
// ═══════════════════════════════════════════════════════════════

export const useSales = (filters?: { date_from?: string; date_to?: string; status?: string; search?: string }) =>
  useQuery({
    queryKey: ['sales', filters],
    queryFn: () => apiPost<{ sales: Sale[]; totals: { cnt: number; revenue: number; discounts: number } }>(
      '/api/main/dashboard/fetch/fetch-sales', filters || {}
    ),
  });

export const useSale = (id: number) =>
  useQuery({
    queryKey: ['sale', id],
    enabled: !!id,
    queryFn: () => apiPost<{ sale: Sale; items: SaleItem[] }>('/api/main/dashboard/fetch/fetch-sale', { sale_id: id }),
  });

export const useCreateSale = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      apiPost<{ sale_id: number; sale_ref: string; total_amount: number; change_amount: number; net: number }>(
        '/api/main/dashboard/create/add-sale', d
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['available-stock'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order'] });
      qc.invalidateQueries({ queryKey: ['loan-accounts'] });
      qc.invalidateQueries({ queryKey: ['loan-detail'] });
    },
  });
};

// ═══════════════════════════════════════════════════════════════
// LOAN ACCOUNTS
// ═══════════════════════════════════════════════════════════════

export const useLoanAccounts = () =>
  useQuery({
    queryKey: ['loan-accounts'],
    queryFn: () => apiPost<{ accounts: LoanAccount[] }>('/api/main/dashboard/create/loan-action', { action: 'list' }),
  });

export const useLoanSearch = (query: string) =>
  useQuery({
    queryKey: ['loan-search', query],
    enabled: query.length > 1,
    queryFn: () => apiPost<{ accounts: LoanAccount[] }>('/api/main/dashboard/create/loan-action', { action: 'search', query }),
  });

export const useLoanDetail = (loanId: number | null) =>
  useQuery({
    queryKey: ['loan-detail', loanId],
    enabled: !!loanId,
    queryFn: () => apiPost<{ account: LoanAccount; sales: Sale[]; payments: LoanPayment[] }>(
      '/api/main/dashboard/create/loan-action',
      { action: 'detail', loan_id: loanId }
    ),
  });

export const useLoanAction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Record<string, unknown>) => apiPost('/api/main/dashboard/create/loan-action', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loan-accounts'] });
      qc.invalidateQueries({ queryKey: ['loan-detail'] });
      qc.invalidateQueries({ queryKey: ['loan-search'] });
    },
  });
};

// ═══════════════════════════════════════════════════════════════
// SPACES
// ═══════════════════════════════════════════════════════════════

export const useSpaces = (status?: string) =>
  useQuery({
    queryKey: ['spaces', status],
    queryFn: () => apiPost<{ spaces: Space[] }>('/api/main/dashboard/fetch/fetch-spaces', { status }),
    refetchInterval: 15000,
  });

export const useSpaceDetail = (spaceId: number | null) =>
  useQuery({
    queryKey: ['space-detail', spaceId],
    enabled: !!spaceId,
    queryFn: () => apiPost<{ space: Space; current_occupancy: Occupancy | null; history: Occupancy[]; payments: SpacePayment[] }>(
      '/api/main/dashboard/fetch/fetch-spaces',
      { view: 'detail', space_id: spaceId }
    ),
  });

export const useAddSpace = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<Space>) => apiPost('/api/main/dashboard/create/add-space', d as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spaces'] }),
  });
};

export const useAddOccupancy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Record<string, unknown>) => apiPost('/api/main/dashboard/create/add-occupancy', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spaces'] });
      qc.invalidateQueries({ queryKey: ['space-detail'] });
    },
  });
};

export const useAddSpacePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Record<string, unknown>) => apiPost('/api/main/dashboard/create/add-space-payment', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spaces'] });
      qc.invalidateQueries({ queryKey: ['space-detail'] });
    },
  });
};

export const useEndOccupancy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Record<string, unknown>) => apiPost('/api/main/dashboard/update/end-occupancy', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spaces'] });
      qc.invalidateQueries({ queryKey: ['space-detail'] });
    },
  });
};

export const useUpdateSpace = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<Space>) => apiPost('/api/main/dashboard/update/update-space', d as Record<string, unknown>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spaces'] });
      qc.invalidateQueries({ queryKey: ['space-detail'] });
    },
  });
};

// ═══════════════════════════════════════════════════════════════
// STOCK
// ═══════════════════════════════════════════════════════════════

export const useStockSessions = (sessionId?: number) =>
  useQuery({
    queryKey: ['stock', sessionId],
    queryFn: () => apiPost<{ sessions: StockSession[]; entries: StockEntry[] }>(
      '/api/main/dashboard/create/stock-session',
      { action: 'fetch', session_id: sessionId }
    ),
  });

export const useStockAction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Record<string, unknown>) => apiPost('/api/main/dashboard/create/stock-session', d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock'] }),
  });
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiPost<DashboardData>('/api/main/dashboard/fetch/fetch-dashboard', {}),
    refetchInterval: 60000,
  });

// ═══════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════

export const useReport = (filters: { date_from: string; date_to: string; group_by?: string }) =>
  useQuery({
    queryKey: ['report', filters],
    queryFn: () => apiPost<Record<string, unknown>>('/api/main/dashboard/fetch/fetch-report', filters),
  });

// ═══════════════════════════════════════════════════════════════
// USERS & ROLES
// ═══════════════════════════════════════════════════════════════

export const useUsers = () =>
  useQuery({
    queryKey: ['users'],
    queryFn: () => apiPost<{ users: User[] }>('/api/main/dashboard/fetch/fetch-users', {}),
  });

export const useRoles = () =>
  useQuery({
    queryKey: ['roles'],
    queryFn: () => apiPost<{ roles: Role[] }>('/api/main/dashboard/fetch/fetch-roles', {}),
  });

export const useUpdateUserRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: { target_user_id: string; role_id: number }) =>
      apiPost('/api/main/dashboard/update/update-user-role', d as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};