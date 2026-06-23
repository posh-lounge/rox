import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

// --- Teams ---
export const useTeams = () => {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await fetch('/api/main/dashboard/teams/fetch-teams', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.teams;
    },
  });
};

export const useAddTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string; color?: string }) => {
      const res = await fetch('/api/main/dashboard/teams/add-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  });
};

export const useUpdateTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: number; name: string; description?: string; color?: string }) => {
      const res = await fetch('/api/main/dashboard/teams/update-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  });
};

export const useDeleteTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch('/api/main/dashboard/teams/delete-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  });
};

// --- Team Members ---
export const useAddTeamMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { team_id: number; member_user_id: string }) => {
      const res = await fetch('/api/main/dashboard/teams/add-team-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }), // could also invalidate team members query
  });
};

// --- Channels ---
export const useTeamChannels = (teamId: number) => {
  return useQuery({
    queryKey: ['teamChannels', teamId],
    queryFn: async () => {
      const res = await fetch('/api/main/dashboard/teams/fetch-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: teamId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.channels;  // includes unread count
    },
    enabled: !!teamId,
  });
};

export const useAddChannel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { team_id: number; name: string; type: 'public' | 'private'; member_user_ids?: string[] }) => {
      const res = await fetch('/api/main/dashboard/teams/add-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['teamChannels', vars.team_id] }),
  });
};

// --- Messages ---

type ChannelMessagesResponse = {
  messages: Array<{ id: number } & Record<string, unknown>>;
  members: unknown;
  has_more: boolean;
};

export const useChannelMessages = (channelId: number) => {
  return useInfiniteQuery<
    ChannelMessagesResponse,
    Error,
    ChannelMessagesResponse,
    ['channelMessages', number],
    number
  >({
    queryKey: ['channelMessages', channelId],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await fetch('/api/main/dashboard/teams/fetch-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: channelId,
          before_id: pageParam || undefined,
          limit: 30,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json; // { messages, members, has_more }
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.has_more) return undefined;
      const messages = lastPage.messages;
      if (messages.length === 0) return undefined;
      return messages[0]?.id; // oldest message id from this page
    },
    enabled: !!channelId,
    refetchInterval: 5000,   // poll every 5 seconds
    initialPageParam: 0,
  });
};

export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { channel_id: number; content: string; parent_id?: number }) => {
      const res = await fetch('/api/main/dashboard/teams/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['channelMessages', vars.channel_id] });
      qc.invalidateQueries({ queryKey: ['teamChannels'] }); // update unread
    },
  });
};

// --- Read Receipts ---
export const useMarkRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (channelId: number) => {
      const res = await fetch('/api/main/dashboard/teams/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: channelId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (_, channelId) => {
      qc.invalidateQueries({ queryKey: ['teamChannels'] });
      qc.invalidateQueries({ queryKey: ['channelMessages', channelId] });
    },
  });
};

// --- Reactions ---
export const useAddReaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { message_id: number; emoji: string }) => {
      const res = await fetch('/api/main/dashboard/teams/add-reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channelMessages'] }),
  });
};

export const useRemoveReaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { message_id: number; emoji: string }) => {
      const res = await fetch('/api/main/dashboard/teams/remove-reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channelMessages'] }),
  });
};