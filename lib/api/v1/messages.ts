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

export const useConversations = () => useQuery({
  queryKey: ['conversations'],
  queryFn: () => apiCall('manage-conversation', { action: 'fetch_conversations' }).then(r => r.conversations),
  refetchInterval: 10000,
});

export const useMessages = (conversationId: string) => useQuery({
  queryKey: ['messages', conversationId],
  queryFn: () => apiCall('manage-conversation', { action: 'fetch_messages', conversation_id: conversationId, limit: 50 }).then(r => r.messages),
  enabled: !!conversationId,
  refetchInterval: 5000,
});

export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiCall('send-message', { action: 'send', ...data }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['messages', vars.conversation_id] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useReactToMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiCall('send-message', { action: 'react', ...data }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['messages', vars.conversation_id] });
    },
  });
};

export const useUploadMessageAttachment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, message_id, conversation_id }: { file: File; message_id: string; conversation_id: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('message_id', message_id);
      formData.append('action', 'upload_attachment');
      return apiCall('send-message', formData, true);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['messages', vars.conversation_id] });
    },
  });
};

export const useCreateDirectConversation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (otherUserId: string) => apiCall('manage-conversation', { action: 'create_direct', other_user_id: otherUserId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
};