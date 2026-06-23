import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const apiCall = async (endpoint: string, data?: any, isFormData = false) => {
  const url = `/api/main/projects/${endpoint}`;
  const options: RequestInit = { method: 'POST' };
  if (isFormData) {
    options.body = data;
  } else {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(data);
  }
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message);
  return json;
};

export const useProjects = (teamId: number) => useQuery({
  queryKey: ['projects', teamId],
  queryFn: () => apiCall('manage-project', { action: 'fetch', team_id: teamId }).then(r => r.projects),
  enabled: !!teamId,
});

export const useProjectTasks = (projectId: string) => useQuery({
  queryKey: ['tasks', projectId],
  queryFn: () => apiCall('manage-task', { action: 'fetch_project_tasks', project_id: projectId }).then(r => r.tasks),
  enabled: !!projectId,
  refetchInterval: 30000, // poll every 30s for real-time feel
});

export const useTaskDetail = (taskId: string) => useQuery({
  queryKey: ['task', taskId],
  queryFn: () => apiCall('manage-task', { action: 'fetch_task', task_id: taskId }).then(r => r.task),
  enabled: !!taskId,
});

export const useManageProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiCall('manage-project', data),
    onSuccess: (_, vars) => {
      if (vars.team_id) qc.invalidateQueries({ queryKey: ['projects', vars.team_id] });
    },
  });
};

export const useManageTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiCall('manage-task', data),
    onSuccess: (_, vars) => {
      if (vars.project_id) qc.invalidateQueries({ queryKey: ['tasks', vars.project_id] });
      if (vars.task_id) qc.invalidateQueries({ queryKey: ['task', vars.task_id] });
      if (vars.action === 'change_status' && typeof window !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Task status changed', { body: `Task moved to ${vars.status}` });
      }
    },
  });
};