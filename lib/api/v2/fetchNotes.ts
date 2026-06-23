import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Note {
  id: number;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}
export interface Category {
  noteCatId: number;
  categorynamee: string;
}

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/main/cowork/fetch/fetch-categories-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.categories as Category[];
    },
  });
};
export const useNotes = (category?: string) => {
  return useQuery({
    queryKey: ['notes', category],
    queryFn: async () => {
      const res = await fetch('/api/main/cowork/fetch/fetch-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.notes as Note[];
    },
  });
};

export const useNote = (id: number) => {
  return useQuery({
    queryKey: ['note', id],
    queryFn: async () => {
      const res = await fetch('/api/main/cowork/fetch/fetch-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.note as Note;
    },
    enabled: !!id,
  });
};

export const useAddNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; content: string; category: string; image_url?: string }) => {
      const res = await fetch('/api/main/cowork/create/add-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; title: string; content: string; category: string; image_url?: string }) => {
      const res = await fetch('/api/main/cowork/update/update-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note', id] });
    },
  });
};