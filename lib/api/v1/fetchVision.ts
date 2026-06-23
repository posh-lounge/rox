import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useVisions = (type?: 'vision' | 'dream_board') => {
  return useQuery({
    queryKey: ['visions', type],
    queryFn: async () => {
      const res = await fetch('/api/main/dashboard/fetch/fetch-visions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.visions;
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/main/dashboard/fetch/fetch-categories', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.categories;
    },
  });
};

export const useVisionItems = (visionId: number) => {
  return useQuery({
    queryKey: ['visionItems', visionId],
    queryFn: async () => {
      const res = await fetch('/api/main/dashboard/fetch/fetch-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vision_id: visionId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.items;
    },
    enabled: !!visionId,
  });
};

// ---- Add Vision (FormData — supports cover image) ----
export const useAddVision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/main/dashboard/create/add-vision', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['visions'] }),
  });
};

// ---- Update Vision (FormData — supports cover image replace/remove) ----
export const useUpdateVision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/main/dashboard/update/update-vision', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['visions'] }),
  });
};

// ---- Add Vision Item ----
export const useAddVisionItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/main/dashboard/create/add-item', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (_, variables) => {
      const visionId = variables.get('vision_id');
      queryClient.invalidateQueries({ queryKey: ['visionItems', Number(visionId)] });
    },
  });
};

// ---- Update Vision Item ----
export const useUpdateVisionItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/main/dashboard/update/update-item', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (_, formData) => {
      const visionId = formData.get('vision_id');
      if (visionId) queryClient.invalidateQueries({ queryKey: ['visionItems', Number(visionId)] });
      queryClient.invalidateQueries({ queryKey: ['visions'] });
    },
  });
};

// ---- Delete Vision Item ----
export const useDeleteVisionItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: number) => {
      const res = await fetch('/api/main/dashboard/update/delete-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visionItems'] });
      queryClient.invalidateQueries({ queryKey: ['visions'] });
    },
  });
};

// ---- Categories ----
export const useAddCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; icon?: string; display_order?: number }) => {
      const res = await fetch('/api/main/dashboard/create/add-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; name: string; description?: string; icon?: string; display_order?: number }) => {
      const res = await fetch('/api/main/dashboard/update/update-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch('/api/main/dashboard/delete/delete-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
};