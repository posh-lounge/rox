import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

/* ---------- TYPES ---------- */
export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface Message {
  id: number;
  channel_id: number;
  user_id: string;
  content: string;
  parent_id: number | null;
  created_at: string;
  edited_at: string | null;
  firstname: string;
  lastname: string;
  email: string;
  senderId: string;
  mentions: Array<{
    user_id: string | null;
    is_everyone: number;
    firstname: string | null;
    lastname: string | null;
  }>;
  reactions: MessageReaction[];
}

export interface ChannelMember {
  user_id: string;
  firstname: string;
  lastname: string;
  email: string;
  last_read: string | null;
}

export interface ChannelMessagesPage {
  messages: Message[];
  members: ChannelMember[];
  has_more: boolean;
}

/* ---------- TEAMS ---------- */
export const useTeams = () => {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await fetch('/api/main/dashboard/teams/fetch-teams', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch teams');
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

/* ---------- MEMBERS ---------- */
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  });
};

export const useRemoveTeamMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { team_id: number; member_user_id: string }) => {
      const res = await fetch('/api/main/dashboard/teams/remove-team-member', {
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

/* ---------- CHANNELS ---------- */
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
      if (!res.ok) throw new Error(json.message || 'Failed to fetch channels');
      return json.channels;
    },
    enabled: !!teamId,
  });
};

export const useAddChannel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      team_id: number;
      name: string;
      type: 'public' | 'private' | 'direct';
      member_user_ids?: string[];
    }) => {
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

/* ---------- MESSAGES ---------- */
export const useChannelMessages = (channelId: number) => {
  return useInfiniteQuery<ChannelMessagesPage>({
    queryKey: ['channelMessages', channelId],
    queryFn: async ({ pageParam }) => {
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
      if (!res.ok) throw new Error(json.message || 'Failed to fetch messages');
      return json as ChannelMessagesPage;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.has_more || lastPage.messages.length === 0) return undefined;
      return lastPage.messages[0]?.id;
    },
    initialPageParam: undefined as number | undefined,
    enabled: !!channelId,
    refetchInterval: 5000,
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
      qc.invalidateQueries({ queryKey: ['teamChannels'] });
    },
  });
};

/* ---------- READ RECEIPTS ---------- */
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

/* ---------- REACTIONS ---------- */
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