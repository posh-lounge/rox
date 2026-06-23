import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─────────────────────────────────────────────
// FETCH TEAMS (with members + channels)
// ─────────────────────────────────────────────
export const useTeams = () => {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await fetch('/api/main/dashboard/teams/fetch-teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.teams as Team[];
    },
    refetchInterval: 30_000,
  });
};

// ─────────────────────────────────────────────
// FETCH CHANNEL MESSAGES
// ─────────────────────────────────────────────
export const useChannelMessages = (channelId: number | null) => {
  return useQuery({
    queryKey: ['channelMessages', channelId],
    queryFn: async () => {
      const res = await fetch('/api/main/dashboard/teams/fetch-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: channelId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.messages as TeamMessage[];
    },
    enabled: !!channelId,
    refetchInterval: 5_000, // poll every 5s (replace with websockets if available)
  });
};

// ─────────────────────────────────────────────
// FETCH MENTIONS
// ─────────────────────────────────────────────
export const useMentions = () => {
  return useQuery({
    queryKey: ['mentions'],
    queryFn: async () => {
      const res = await fetch('/api/main/dashboard/teams/fetch-mentions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.mentions as MentionMessage[];
    },
    refetchInterval: 15_000,
  });
};

// ─────────────────────────────────────────────
// SEND MESSAGE (with optional file attachments)
// ─────────────────────────────────────────────
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/main/dashboard/teams/send-message', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.message as TeamMessage;
    },
    onSuccess: (newMessage) => {
      // Optimistic update
      queryClient.setQueryData<TeamMessage[]>(
        ['channelMessages', newMessage.channel_id],
        (old) => [...(old ?? []), newMessage]
      );
      queryClient.invalidateQueries({ queryKey: ['teams'] }); // refresh unread counts
    },
  });
};

// ─────────────────────────────────────────────
// TOGGLE REACTION
// ─────────────────────────────────────────────
export const useToggleReaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, emoji, channelId }: { messageId: number; emoji: string; channelId: number }) => {
      const res = await fetch('/api/main/dashboard/teams/toggle-reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: messageId, emoji }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return { ...json, channelId };
    },
    onSuccess: ({ channelId }) => {
      queryClient.invalidateQueries({ queryKey: ['channelMessages', channelId] });
    },
  });
};

// ─────────────────────────────────────────────
// CREATE TEAM
// ─────────────────────────────────────────────
export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; color?: string; member_ids?: string[] , companyNo: number }) => {
      const res = await fetch('/api/main/dashboard/teams/create-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
};

// ─────────────────────────────────────────────
// CREATE CHANNEL
// ─────────────────────────────────────────────
export const useCreateChannel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { team_id: number; name: string; description?: string; type?: string; member_ids?: string[] }) => {
      const res = await fetch('/api/main/dashboard/teams/create-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
};

// ─────────────────────────────────────────────
// MANAGE MEMBER (add/remove/promote/demote)
// ─────────────────────────────────────────────
export const useManageMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { team_id: number; target_user_id: string; action: 'add' | 'remove' | 'promote' | 'demote' }) => {
      const res = await fetch('/api/main/dashboard/teams/manage-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
};

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
export interface TeamMember {
  id: number;
  user_id: string;
  role: 'leader' | 'member';
  joined_at: string;
  firstname: string;
  lastname: string;
  email: string;
  avatar_url: string;
  position: string;
}

export interface TeamChannel {
  id: number;
  name: string;
  description: string;
  type: 'public' | 'private' | 'direct';
  created_at: string;
  is_member: number;
  unread_count: number;
}

export interface Team {
  id: number;
  name: string;
  companyNo: number;
  description: string;
  color: string;
  owner_id: string;
  role: 'leader' | 'member';
  created_at: string;
  members: TeamMember[];
  channels: TeamChannel[];
}

export interface Reaction {
  emoji: string;
  count: number;
  user_ids: string[];
  reacted_by_me: boolean;
}

export interface Attachment {
  id: number;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

export interface ReadReceipt {
  user_id: string;
  firstname: string;
  lastname: string;
  avatar_url: string;
  read_at: string;
}

export interface MentionInfo {
  user_id: string | null;
  is_everyone: number;
  firstname?: string;
  lastname?: string;
}

export interface TeamMessage {
  id: number;
  channel_id: number;
  user_id: string;
  content: string;
  parent_id: number | null;
  edited_at: string | null;
  created_at: string;
  firstname: string;
  lastname: string;
  avatar_url: string;
  position: string;
  reactions: Reaction[];
  mentions: MentionInfo[];
  attachments: Attachment[];
  read_by: ReadReceipt[];
  is_everyone: boolean;
}

export interface MentionMessage {
  id: number;
  channel_id: number;
  user_id: string;
  content: string;
  created_at: string;
  channel_name: string;
  team_name: string;
  firstname: string;
  lastname: string;
  avatar_url: string;
  is_everyone: number;
}

export interface MentionInfo {
  user_id: string | null;
  is_everyone: number;
  firstname?: string;
  lastname?: string;
}
 
export interface TeamMessage {
  id: number;
  channel_id: number;
  user_id: string;
  content: string;
  parent_id: number | null;
  edited_at: string | null;
  created_at: string;
  firstname: string;
  lastname: string;
  avatar_url: string;
  position: string;
  reactions: Reaction[];
  mentions: MentionInfo[];
  attachments: Attachment[];
  read_by: ReadReceipt[];
  is_everyone: boolean;
}
 
export interface MentionMessage {
  id: number;
  channel_id: number;
  user_id: string;
  content: string;
  created_at: string;
  channel_name: string;
  team_name: string;
  firstname: string;
  lastname: string;
  avatar_url: string;
  is_everyone: number;
}
 
// ─────────────────────────────────────────────
// DM TYPES
// ─────────────────────────────────────────────
export interface DirectMessage {
  dm_id: number;
  team_id: number;
  team_name: string;
  team_color: string;
  other_user_id: string;
  other_firstname: string;
  other_lastname: string;
  other_avatar: string;
  other_position: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}
 
export interface DmMessage {
  id: number;
  dm_id: number;
  user_id: string;
  content: string;
  parent_id: number | null;
  edited_at: string | null;
  created_at: string;
  firstname: string;
  lastname: string;
  avatar_url: string;
  position: string;
  attachments: Attachment[];
  reactions: Reaction[];
  read_by: ReadReceipt[];
  type: 'dm';
}
 
export const useDMs = () => {
  return useQuery({
    queryKey: ['dms'],
    queryFn: async () => {
      const res = await fetch('/api/main/dashboard/fetch/fetch-dms', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.dms as DirectMessage[];
    },
    refetchInterval: 10_000,
  });
};
 
// ─────────────────────────────────────────────
// FETCH DM MESSAGES
// ─────────────────────────────────────────────
export const useDmMessages = (dmId: number | null) => {
  return useQuery({
    queryKey: ['dmMessages', dmId],
    queryFn: async () => {
      const res = await fetch('/api/main/dashboard/fetch/fetch-dm-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dm_id: dmId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.messages as DmMessage[];
    },
    enabled: !!dmId,
    refetchInterval: 5_000,
  });
};
 
// ─────────────────────────────────────────────
// START OR GET DM
// ─────────────────────────────────────────────
export const useStartDm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { target_user_id: string; team_id: number }) => {
      const res = await fetch('/api/main/dashboard/create/start-dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json as { dm_id: number; created: boolean };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dms'] }),
  });
};
 
// ─────────────────────────────────────────────
// SEND DM MESSAGE  (reuse useSendMessage — just pass dm_id in FormData)
// ─────────────────────────────────────────────
export const useSendDmMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/main/dashboard/teams/send-message', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.message as DmMessage;
    },
    onSuccess: (msg) => {
      queryClient.setQueryData<DmMessage[]>(
        ['dmMessages', msg.dm_id],
        (old) => [...(old ?? []), msg]
      );
      queryClient.invalidateQueries({ queryKey: ['dms'] });
    },
  });
};
 