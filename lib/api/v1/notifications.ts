import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const apiCall = async (data: any) => {
  const res = await fetch('/api/main/projects/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message);
  return json;
};

export const useNotifications = (limit = 20) => useQuery({
  queryKey: ['notifications'],
  queryFn: () => apiCall({ action: 'fetch', limit }).then(r => r.notifications),
  refetchInterval: 15000,
});

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id?: string) => apiCall({ action: 'mark_read', id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};