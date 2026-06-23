import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Company {
  companyId: string;
  companyNo: number;
  companyName: string;
  companyDescrption: string;
  created_at: string;
  created_by: string;
  status: string;
}

export interface AssociatedUser {
  associationId: string;
  userId: string;
  firstname: string;
  lastname: string;
  full_name: string;
  email: string;
  phonenumber: string;
  position: string | null;
  department: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
}

export interface CompanyDetail extends Company {
  users: AssociatedUser[];
}

// ---- Fetch all companies for the current user ----
export const useCompanies = () =>
  useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await fetch('/api/main/dashboard/fetch/fetch-companies', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.companies as Company[];
    },
  });

// ---- Fetch one company + its associated users ----
export const useCompanyDetail = (companyNo: number | null) =>
  useQuery({
    queryKey: ['company', companyNo],
    queryFn: async () => {
      const res = await fetch('/api/main/dashboard/fetch/fetch-company-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyNo }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.company as CompanyDetail;
    },
    enabled: !!companyNo,
  });

// ---- Create company ----
export const useCreateCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { companyName: string; companyDescrption: string }) => {
      const res = await fetch('/api/main/dashboard/create/create-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  });
};

// ---- Update company ----
export const useUpdateCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { companyNo: number; companyName: string; companyDescrption: string; status: string }) => {
      const res = await fetch('/api/main/dashboard/update/update-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['company', vars.companyNo] });
    },
  });
};

// ---- Remove user from company ----
export const useRemoveAssociation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { associationId: string; companyNo: number }) => {
      const res = await fetch('/api/main/dashboard/update/remove-association', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['company', vars.companyNo] }),
  });
};

// ---- Generate invite session for company sign-up ----
export const useCreateInviteSession = () =>
  useMutation({
    mutationFn: async (companyNo: number) => {
      const res = await fetch('/api/main/dashboard/create/create-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyNo }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json as { token: string; expiresAt: string };
    },
  });