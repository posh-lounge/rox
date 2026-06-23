// lib/api/v1/fetchProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Fetch all projects ──────────────────────────────────────────────────────

export const useProjects = (teamId?: number) => {
  return useQuery({
    queryKey: ['projects', teamId],
    queryFn: async () => {
      const res = await fetch('/api/main/dashboard/projects/fetch-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: teamId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.projects as Project[];
    },
  });
};

// ─── Fetch single project detail ─────────────────────────────────────────────

export const useProjectDetail = (projectId: string) => {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await fetch('/api/main/dashboard/projects/fetch-project-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json as ProjectDetail;
    },
    enabled: !!projectId,
  });
};

// ─── Add project ─────────────────────────────────────────────────────────────

export const useAddProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AddProjectInput) => {
      const res = await fetch('/api/main/dashboard/projects/add-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
};

// ─── Add milestone ───────────────────────────────────────────────────────────

export const useAddMilestone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AddMilestoneInput) => {
      const res = await fetch('/api/main/dashboard/projects/add-milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['project', vars.project_id] }),
  });
};

// ─── Update milestone status ─────────────────────────────────────────────────

export const useUpdateMilestoneStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateStatusInput) => {
      const res = await fetch('/api/main/dashboard/projects/update-milestone-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['project', vars.project_id] }),
  });
};

// ─── Add comment (with optional file attachments) ────────────────────────────

export const useAddComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/main/dashboard/projects/add-comment', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (_, fd) => {
      const projectId = fd.get('project_id') as string;
      if (projectId) qc.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
};

// ─── Types ───────────────────────────────────────────────────────────────────

export type MilestoneStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface Project {
  id: string;
  team_id: number;
  name: string;
  description: string | null;
  status: 'active' | 'completed' | 'archived';
  start_date: string | null;
  end_date: string | null;
  created_by: string;
  created_at: string;
  team_name: string;
  team_color: string;
  milestone_count: number;
  done_count: number;
}

export interface Milestone {
  no: number;
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: MilestoneStatus;
  assignee_user_id: string | null;
  assignee_firstname: string | null;
  assignee_lastname: string | null;
  assignee_avatar: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  comments: Comment[];
  attachments: Attachment[];
  history: StatusHistory[];
}

export interface Comment {
  no: number;
  id: string;
  task_id?: string;
  project_id?: string;
  user_id: string;
  content: string;
  firstname: string;
  lastname: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Attachment {
  no: number;
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string | null;
  firstname: string;
  lastname: string;
  created_at: string;
}

export interface StatusHistory {
  id: string;
  old_status: string;
  new_status: string;
  comment: string | null;
  firstname: string;
  lastname: string;
  created_at: string;
}

export interface ProjectDetail {
  project: Project;
  milestones: Milestone[];
  project_comments: Comment[];
  project_attachments: Attachment[];
}

export interface AddProjectInput {
  team_id: number;
  name: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export interface AddMilestoneInput {
  project_id: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  assignee_user_id?: string;
  due_date?: string;
}

export interface UpdateStatusInput {
  milestone_id: string;
  project_id: string;
  status: MilestoneStatus;
  comment?: string;
}