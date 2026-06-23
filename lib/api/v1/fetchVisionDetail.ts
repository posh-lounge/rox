import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface StepComment {
  id: number;
  step_id: number;
  user_id: string;
  comment: string;
  user_name: string;
  created_at: string;
}

export interface VisionStep {
  id: number;
  vision_item_id: number;
  title: string;
  description: string | null;
  display_order: number;
  is_achieved: boolean;
  achieved_at: string | null;
  created_at: string;
  comments: StepComment[];
}

export interface VisionItemDetail {
  id: number;
  vision_id: number;
  title: string;
  description: string | null;
  category_id: number;
  category_name: string;
  image_url: string | null;
  target_year: number | null;
  status: 'active' | 'in_progress' | 'achieved' | 'archived';
  created_at: string;
}

// ── Fetch item detail + steps + comments ──────────────────────────────────
export const useVisionItemDetail = (itemId: number) => {
  return useQuery({
    queryKey: ['visionItemDetail', itemId],
    queryFn: async () => {
      const res = await fetch('/api/main/dashboard/fetch/fetch-item-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return { item: json.item as VisionItemDetail, steps: json.steps as VisionStep[] };
    },
    enabled: itemId > 0,
  });
};

// ── Add step ──────────────────────────────────────────────────────────────
export const useAddStep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, title, description }: { itemId: number; title: string; description?: string }) => {
      const res = await fetch('/api/main/dashboard/create/add-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, title, description }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['visionItemDetail', vars.itemId] });
    },
  });
};

// ── Update step ───────────────────────────────────────────────────────────
export const useUpdateStep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ stepId, itemId, title, description }: { stepId: number; itemId: number; title?: string; description?: string }) => {
      const res = await fetch('/api/main/dashboard/update/update-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_id: stepId, title, description }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['visionItemDetail', vars.itemId] });
    },
  });
};

// ── Delete step ───────────────────────────────────────────────────────────
export const useDeleteStep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ stepId }: { stepId: number; itemId: number }) => {
      const res = await fetch('/api/main/dashboard/update/delete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_id: stepId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['visionItemDetail', vars.itemId] });
      queryClient.invalidateQueries({ queryKey: ['visionItems'] });
    },
  });
};

// ── Achieve step ──────────────────────────────────────────────────────────
export const useAchieveStep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ stepId }: { stepId: number; itemId: number }) => {
      const res = await fetch('/api/main/dashboard/update/achieve-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_id: stepId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['visionItemDetail', vars.itemId] });
      queryClient.invalidateQueries({ queryKey: ['visionItems'] });
    },
  });
};

// ── Unachieve step ────────────────────────────────────────────────────────
export const useUnachieveStep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ stepId }: { stepId: number; itemId: number }) => {
      const res = await fetch('/api/main/dashboard/update/unachieve-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_id: stepId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['visionItemDetail', vars.itemId] });
      queryClient.invalidateQueries({ queryKey: ['visionItems'] });
    },
  });
};

// ── Add comment ───────────────────────────────────────────────────────────
export const useAddComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ stepId, comment }: { stepId: number; itemId: number; comment: string }) => {
      const res = await fetch('/api/main/dashboard/create/add-step-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_id: stepId, comment }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['visionItemDetail', vars.itemId] });
    },
  });
};