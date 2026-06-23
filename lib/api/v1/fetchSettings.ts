import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface UserProfile {
  user_no: number;
  userId: string;
  firstname: string;
  lastname: string;
  full_name: string;
  email: string;
  phonenumber: string;
  status: string;
  access_id: number;
  dates: string;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  email_notifications: boolean;
}

export const useUserProfile = () => useQuery({
  queryKey: ['userProfile'],
  queryFn: async () => {
    const res = await fetch('/api/main/dashboard/fetch/fetch-settings', { method: 'POST' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return { 
      user: json.user as UserProfile, 
      settings: json.settings as UserSettings,
      plan: json.plan as string
    };
  },
});

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { firstname: string; lastname: string; email: string; phonenumber: string }) => {
      const res = await fetch('/api/main/dashboard/update/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['userProfile'] }),
  });
};

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { theme: string; email_notifications: boolean }) => {
      const res = await fetch('/api/main/dashboard/update/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['userProfile'] }),
  });
};