import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from './fetchApi';

// ─── Types ───────────────────────────────────────────────────
export interface Product {
  product_id: number; product_code: string; product_name: string;
  category_id: number; cat_name: string; unit_type: string;
  selling_price: number; current_quantity: number; low_stock_alert: number;
  description: string; image_url: string | null; status: string;
  capital_value: number; created_by: string; created_at: string;
}
export interface Purchase {
  purchase_id: number; purchase_ref: string; product_id: number;
  product_name?: string; quantity: number; remaining_quantity: number;
  unit_cost: number; total_cost: number; supplier_name: string;
  notes: string; created_by: string; created_at: string;
}
export interface Sale {
  sale_id: number; sale_ref: string; customer_name: string;
  customer_phone: string; total_amount: number; discount_amount: number;
  paid_amount: number; change_amount: number; payment_method: string;
  payment_reference: string; status: string; notes: string;
  created_by: string; accepted_by: string; created_at: string;
  firstname?: string; lastname?: string;
}
export interface SaleItem {
  item_id: number; sale_id: number; product_id: number;
  product_name?: string; quantity: number; unit_price: number;
  unit_cost: number; subtotal: number; profit: number;
}
export interface CartItem {
  cart_id: number; product_id: number; product_name: string;
  unit_type: string; current_quantity: number; quantity: number;
  unit_price: number; subtotal: number; image_url: string | null;
}
export interface Space {
  space_id: number; space_name: string; space_type: string;
  floor: string; price_per_period: number; billing_period: string;
  status: string; description: string;
  occupancy_id?: number; tenant_name?: string; tenant_phone?: string;
  start_date?: string; next_payment_date?: string; agreed_price?: number;
  days_until_payment?: number; is_overdue?: number;
}
export interface StockSession {
  session_id: number; session_date: string; status: string;
  opened_by: string; opened_by_name: string; entry_count: number;
  missing_count: number; opened_at: string;
}
export interface StockEntry {
  entry_id: number; session_id: number; product_id: number;
  product_name: string; unit_type: string; entry_type: string;
  recorded_quantity: number; system_quantity: number; variance: number; notes: string;
}
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
export interface User {
  user_no: number; userId: string; firstname: string; lastname: string;
  email: string; phonenumber: string; status: string; role_id: number; role_name?: string;
}
export interface Role { role_id: number; role_name: string; description: string; }

// ─── Products ────────────────────────────────────────────────
export const useProducts = (filters?: { category_id?: string; search?: string; status?: string }) =>
  useQuery({ queryKey: ['products', filters], queryFn: () =>
    apiPost<{ products: Product[] }>('/api/main/dashboard/fetch/fetch-products', filters || {}) });

export const useAddProduct = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Partial<Product>) =>
    apiPost('/api/main/dashboard/create/add-product', d as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }) });
};
export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Partial<Product>) =>
    apiPost('/api/main/dashboard/update/update-product', d as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }) });
};

// ─── Purchases ───────────────────────────────────────────────
export const usePurchases = (productId?: number) =>
  useQuery({ queryKey: ['purchases', productId], queryFn: () =>
    apiPost<{ purchases: Purchase[] }>('/api/main/dashboard/fetch/fetch-purchases', { product_id: productId }) });

export const useAddPurchase = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Partial<Purchase>) =>
    apiPost('/api/main/dashboard/create/add-purchase', d as Record<string, unknown>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchases'] }); qc.invalidateQueries({ queryKey: ['products'] }); } });
};

// ─── Sales ───────────────────────────────────────────────────
export const useSales = (filters?: { date_from?: string; date_to?: string; status?: string; search?: string }) =>
  useQuery({ queryKey: ['sales', filters], queryFn: () =>
    apiPost<{ sales: Sale[]; totals: { cnt: number; revenue: number } }>('/api/main/dashboard/fetch/fetch-sales', filters || {}) });

export const useSale = (id: number) =>
  useQuery({ queryKey: ['sale', id], enabled: !!id, queryFn: () =>
    apiPost<{ sale: Sale; items: SaleItem[] }>('/api/main/dashboard/fetch/fetch-sale', { sale_id: id }) });

export const useCreateSale = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) =>
    apiPost<{ sale_id: number; sale_ref: string; total_amount: number; change_amount: number }>('/api/main/dashboard/create/add-sale', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales'] }); qc.invalidateQueries({ queryKey: ['products'] }); qc.invalidateQueries({ queryKey: ['cart'] }); } });
};

// ─── Cart ────────────────────────────────────────────────────
export const useCart = () =>
  useQuery({ queryKey: ['cart'], queryFn: () =>
    apiPost<{ items: CartItem[]; total: number; count: number }>('/api/main/dashboard/create/cart-action', { action: 'fetch' }) });

export const useCartAction = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) =>
    apiPost('/api/main/dashboard/create/cart-action', d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }) });
};

// ─── Spaces ──────────────────────────────────────────────────
export const useSpaces = (status?: string) =>
  useQuery({ queryKey: ['spaces', status], queryFn: () =>
    apiPost<{ spaces: Space[] }>('/api/main/dashboard/fetch/fetch-spaces', { status }) });

export const useAddSpace = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Partial<Space>) =>
    apiPost('/api/main/dashboard/create/add-space', d as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spaces'] }) });
};
export const useAddOccupancy = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) =>
    apiPost('/api/main/dashboard/create/add-occupancy', d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spaces'] }) });
};
export const useAddSpacePayment = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) =>
    apiPost('/api/main/dashboard/create/add-space-payment', d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spaces'] }) });
};

// ─── Stock ───────────────────────────────────────────────────
export const useStockSessions = (sessionId?: number) =>
  useQuery({ queryKey: ['stock', sessionId], queryFn: () =>
    apiPost<{ sessions: StockSession[]; entries: StockEntry[] }>('/api/main/dashboard/create/stock-session', { action: 'fetch', session_id: sessionId }) });

export const useStockAction = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Record<string, unknown>) =>
    apiPost('/api/main/dashboard/create/stock-session', d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock'] }) });
};

// ─── Dashboard ───────────────────────────────────────────────
export const useDashboard = () =>
  useQuery({ queryKey: ['dashboard'], queryFn: () =>
    apiPost<DashboardData>('/api/main/dashboard/fetch/fetch-dashboard', {}),
    refetchInterval: 60000 });

// ─── Reports ─────────────────────────────────────────────────
export const useReport = (filters: { date_from: string; date_to: string; group_by?: string }) =>
  useQuery({ queryKey: ['report', filters], queryFn: () =>
    apiPost<Record<string, unknown>>('/api/main/dashboard/fetch/fetch-report', filters) });

// ─── Users ───────────────────────────────────────────────────
export const useUsers = () =>
  useQuery({ queryKey: ['users'], queryFn: () =>
    apiPost<{ users: User[] }>('/api/main/dashboard/fetch/fetch-users', {}) });

export const useRoles = () =>
  useQuery({ queryKey: ['roles'], queryFn: () =>
    apiPost<{ roles: Role[] }>('/api/main/dashboard/fetch/fetch-roles', {}) });

// ─── Product Categories ──────────────────────────────────────
export const useProductCategories = () =>
  useQuery({ queryKey: ['product-categories'], queryFn: () =>
    apiPost<{ categories: Array<{cat_id: number; cat_name: string}> }>('/api/main/dashboard/fetch/fetch-product-categories', {}) });
