import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  expense_date: string;
}

export interface Income {
  id: number;
  amount: number;
  source: string;
  description: string;
  income_date: string;
}

// ========== EXPENSES ==========
export const useExpenses = (startDate?: string, endDate?: string) => useQuery({
  queryKey: ['expenses', startDate, endDate],
  queryFn: async () => {
    const res = await fetch('/api/main/dashboard/fetch/fetch-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_date: startDate, end_date: endDate }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json.expenses as Expense[];
  },
});

export const useAddExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Expense, 'id'>) => {
      const res = await fetch('/api/main/dashboard/create/add-expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
};

export const useDeleteExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch('/api/main/dashboard/update/delete-expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
};

// ========== INCOMES (same pattern, replace 'expenses' with 'incomes') ==========
export const useIncomes = (startDate?: string, endDate?: string) => useQuery({
  queryKey: ['incomes', startDate, endDate],
  queryFn: async () => {
    const res = await fetch('/api/main/dashboard/fetch/fetch-incomes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_date: startDate, end_date: endDate }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json.incomes as Income[];
  },
});

export const useAddIncome = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Income, 'id'>) => {
      const res = await fetch('/api/main/dashboard/create/add-incomes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incomes'] }),
  });
};

export const useUpdateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; amount: number; category: string; description: string; expense_date: string }) => {
      const res = await fetch('/api/main/dashboard/update/update-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
};

export const useUpdateIncome = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; amount: number; source: string; description: string; income_date: string }) => {
      const res = await fetch('/api/main/dashboard/update/update-incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incomes'] }),
  });
};
export const useDeleteIncome = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch('/api/main/dashboard/update/delete-incomes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incomes'] }),
  });
};