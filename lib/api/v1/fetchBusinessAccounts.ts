import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ── Types ──────────────────────────────────────────────────────────────────
export interface CurrencyPeriod {
  currency: string;
  income:   number;
  expense:  number;
  net:      number;
}

export interface AccountByCurrency {
  currency: string;
  total:    number;
  accounts: { id: number; name: string; type: string; current_balance: number; color: string }[];
}

export interface Analytics {
  currencies:           string[];
  daily:                Record<string, CurrencyPeriod>;
  weekly:               Record<string, CurrencyPeriod>;
  monthly:              Record<string, CurrencyPeriod>;
  accounts_by_currency: AccountByCurrency[];
  categories:           Record<string, { category: string; type: string; total: number }[]>;
  trend:                Record<string, { month: string; income: number; expense: number }[]>;
}

export interface TransactionSummary {
  currency:       string;
  total_income:   number;
  total_expense:  number;
  total_transfer: number;
  net:            number;
  count:          number;
}

export interface Business {
  id: number;
  name: string;
  type: 'personal' | 'business';
  description: string;
  color: string;
  icon: string;
  is_active: number;
  transaction_count: number;
  created_at: string;
}

export interface Account {
  id: number;
  name: string;
  type: 'cash' | 'bank' | 'mobile_money' | 'credit' | 'savings' | 'investment' | 'other';
  currency: string;
  opening_balance: number;
  current_balance: number;
  color: string;
  icon: string;
  description: string;
  is_active: number;
  total_income: number;
  total_expense: number;
}

export interface Transaction {
  id: number;
  business_id: number;
  account_id: number;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category: string;
  description: string;
  reference: string;
  transaction_date: string;
  transfer_to_account_id: number | null;
  business_name: string;
  business_type: string;
  account_name: string;
  account_type: string;
  currency: string;
  transfer_to_account_name: string | null;
}

export interface Loan {
  id: number;
  direction: 'borrowed' | 'lent';
  account_id: number;
  person_name: string;
  amount: number;
  paid_amount: number;
  remaining: number;
  currency: string;
  interest_rate: number;
  due_date: string | null;
  status: 'active' | 'partially_paid' | 'paid' | 'cancelled';
  description: string;
  account_name: string | null;
}

export interface ScheduledPayment {
  id: number;
  business_id: number | null;
  account_id: number | null;
  title: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string | null;
  next_due_date: string;
  last_paid_date: string | null;
  is_active: number;
  reminder_days: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  days_until_due: number;
  business_name: string | null;
  account_name: string | null;
}

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
}

export interface AccountDetail {
  account:      Account;
  transactions: Transaction[];
  summary:      { total_income: number; total_expense: number; total_transferred_out: number; total_transferred_in: number; total_count: number };
  trend:        { month: string; income: number; expense: number }[];
}

export interface BusinessDetail {
  business:     Business;
  transactions: Transaction[];
  by_currency:  { currency: string; total_income: number; total_expense: number; count: number }[];
  accounts:     { id: number; name: string; type: string; currency: string; current_balance: number; color: string }[];
  trend:        { month: string; income: number; expense: number; currency: string }[];
  categories:   { category: string; type: string; currency: string; total: number }[];
}

// ── Helper ─────────────────────────────────────────────────────────────────
// Add to existing fetchBusinessAccounts.ts
export const useTransactionCategories = (type: string) => {
  return useQuery({
    queryKey: ['transactionCategories', type],
    queryFn: async () => {
      const res = await fetch('/api/main/dashboard/fetch/transaction-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.categories as string[];
    },
    enabled: !!type,
  });
};

async function post(url: string, body?: object) {
  const res  = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Request failed');
  return json;
}

// ── Businesses ─────────────────────────────────────────────────────────────

export const useExchangeRates = (base = 'USD') => useQuery({
  queryKey: ['exchange-rates', base],
  queryFn: () => post('/api/main/dashboard/fetch/fetch-exchange-rates', { base }).then(r => r as ExchangeRates),
  staleTime: 60 * 60 * 1000, // 1 hour
  retry: false,
});

export const useAccountDetail = (accountId: number, filters?: { start_date?: string; end_date?: string; type?: string }) =>
  useQuery({
    queryKey: ['account-detail', accountId, filters],
    queryFn:  () => post('/api/main/dashboard/fetch/fetch-account-detail', { account_id: accountId, ...filters }),
    enabled:  accountId > 0,
  });

export const useBusinessDetail = (businessId: number, filters?: { start_date?: string; end_date?: string; type?: string }) =>
  useQuery({
    queryKey: ['business-detail', businessId, filters],
    queryFn:  () => post('/api/main/dashboard/fetch/fetch-business-detail', { business_id: businessId, ...filters }),
    enabled:  businessId > 0,
  });

// Utility: convert amount using cached rates
export function convertAmount(amount: number, from: string, to: string, rates: Record<string, number>): number {
  if (from === to) return amount;
  const fromRate = rates[from] ?? 1;
  const toRate   = rates[to]   ?? 1;
  // rates are from base (USD), so: amount / fromRate * toRate
  return (amount / fromRate) * toRate;
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export const useBusinesses = () => useQuery({
  queryKey: ['businesses'],
  queryFn: () => post('/api/main/dashboard/fetch/fetch-businesses').then(r => r.businesses as Business[]),
});

export const useAddBusiness = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Business>) => post('/api/main/dashboard/create/add-business', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['businesses'] }),
  });
};

export const useUpdateBusiness = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Business> & { id: number }) => post('/api/main/dashboard/update/update-business', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['businesses'] }),
  });
};

// ── Accounts ───────────────────────────────────────────────────────────────

export const useAccounts = () => useQuery({
  queryKey: ['accounts'],
  queryFn: () => post('/api/main/dashboard/fetch/fetch-accounts').then(r => r.accounts as Account[]),
});

export const useAddAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Account>) => post('/api/main/dashboard/create/add-account', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
};

export const useUpdateAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Account> & { id: number }) => post('/api/main/dashboard/update/update-account', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
};

export const useTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { from_account_id: number; to_account_id: number; amount: number; business_id: number; description?: string; date?: string }) =>
      post('/api/main/dashboard/create/transfer', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

// ── Transactions ───────────────────────────────────────────────────────────

export const useTransactions = (filters?: {
  start_date?:  string;
  end_date?:    string;
  business_id?: number;
  account_id?:  number;
  type?:        string;
  currency?:    string;
  limit?:       number;
  offset?:      number;
}) => useQuery({
  queryKey: ['transactions', filters],
  queryFn:  () => post('/api/main/dashboard/fetch/fetch-transactions', filters ?? {}),
});

export const useAddTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Transaction>) => post('/api/main/dashboard/create/add-transaction', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useUpdateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Transaction> & { id: number }) => post('/api/main/dashboard/update/update-transaction', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => post('/api/main/dashboard/delete/delete-transaction', { id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

// ── Loans ──────────────────────────────────────────────────────────────────

export const useLoans = () => useQuery({
  queryKey: ['loans'],
  queryFn: () => post('/api/main/dashboard/fetch/fetch-loans'),
});

export const useAddLoan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Loan>) => post('/api/main/dashboard/create/add-loan', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loans'] }),
  });
};

export const useUpdateLoan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Loan> & { id: number }) => post('/api/main/dashboard/update/update-loan', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loans'] }),
  });
};

export const usePayLoan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { loan_id: number; amount: number; note?: string }) => post('/api/main/dashboard/create/pay-loan', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loans'] }),
  });
};

// ── Scheduled payments ─────────────────────────────────────────────────────

export const useScheduledPayments = () => useQuery({
  queryKey: ['scheduled'],
  queryFn: () => post('/api/main/dashboard/fetch/fetch-scheduled'),
  refetchInterval: 60 * 1000, // refresh every minute
});

export const useAddScheduled = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ScheduledPayment>) => post('/api/main/dashboard/create/add-scheduled', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduled'] }),
  });
};

export const useUpdateScheduled = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ScheduledPayment> & { id: number }) => post('/api/main/dashboard/update/update-scheduled', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduled'] }),
  });
};

export const useMarkPaidScheduled = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => post('/api/main/dashboard/update/mark-paid-scheduled', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduled'] }),
  });
};

// ── Analytics ──────────────────────────────────────────────────────────────
export const useAnalytics = () => useQuery({
  queryKey: ['analytics'],
  queryFn:  () => post('/api/main/dashboard/fetch/fetch-analytics').then(r => r as Analytics),
});
