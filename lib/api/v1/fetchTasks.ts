import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task } from '@/types/types';

interface TasksResponse {
  success: boolean;
  tasks: Task[];
}

const fetchTasks = async (filters?: any): Promise<TasksResponse> => {
  const res = await fetch('/api/main/dashboard/fetch/fetch-tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters }),
  });
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
};

export const useTasks = (filters?: any) => {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => fetchTasks(filters),
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskData: any) => {
      const res = await fetch('/api/main/dashboard/create/add-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, ...data }: any) => {
      const res = await fetch('/api/main/dashboard/update/update-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, ...data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
};

export const useCancelTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, cancel_reason }: { taskId: string; cancel_reason: string }) => {
      const res = await fetch('/api/main/dashboard/update/cancel-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, cancel_reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
};

export const useTask = (taskId: string) => {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const res = await fetch('/api/main/dashboard/fetch/fetch-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.task;
    },
    enabled: !!taskId,
  });
};