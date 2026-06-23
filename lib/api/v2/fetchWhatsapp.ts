import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// ── Types ──────────────────────────────────────────────────────────────────

export interface WAChat {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: number;
  pinned: boolean;
  archived: boolean;
}

export interface WAMessage {
  id: string;
  body: string;
  type: string;
  fromMe: boolean;
  timestamp: number;
  hasMedia: boolean;
  ack: number;
  author: string | null;
}

export interface WAStatus {
  isReady: boolean;
  isInitializing: boolean;
  qrCode: string | null;
  phone: string | null;
  name: string | null;
}

// ── Status ─────────────────────────────────────────────────────────────────

export const useWAStatus = () =>
  useQuery({
    queryKey: ['wa-status'],
    queryFn: async () => {
      const res  = await fetch('/api/main/whatsapp/status');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json as WAStatus;
    },
    refetchInterval: 5000,
    retry: false,
  });

// ── Chats ──────────────────────────────────────────────────────────────────

export const useWAChats = () =>
  useQuery({
    queryKey: ['wa-chats'],
    queryFn: async () => {
      const res  = await fetch('/api/main/whatsapp/chats');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.chats as WAChat[];
    },
    retry: false,
  });

// ── Messages ───────────────────────────────────────────────────────────────

export const useWAMessages = (chatId: string | null) =>
  useQuery({
    queryKey: ['wa-messages', chatId],
    queryFn: async () => {
      const res  = await fetch('/api/main/whatsapp/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chatId, limit: 50 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.messages as WAMessage[];
    },
    enabled: !!chatId,
    retry: false,
  });

// ── Send message ───────────────────────────────────────────────────────────

export const useWASend = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ to, message }: { to: string; message: string }) => {
      const res  = await fetch('/api/main/whatsapp/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ to, message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['wa-messages', vars.to] });
      qc.invalidateQueries({ queryKey: ['wa-chats'] });
    },
  });
};

// ── Send media ─────────────────────────────────────────────────────────────

export const useWASendMedia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      to, base64, mimetype, filename, caption,
    }: {
      to: string;
      base64: string;
      mimetype: string;
      filename: string;
      caption?: string;
    }) => {
      const res  = await fetch('/api/main/whatsapp/send-media', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ to, base64, mimetype, filename, caption }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['wa-messages', vars.to] });
      qc.invalidateQueries({ queryKey: ['wa-chats'] });
    },
  });
};

// ── Mark as read ───────────────────────────────────────────────────────────

export const useWAMarkRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (chatId: string) => {
      const res  = await fetch('/api/main/whatsapp/read', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chatId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wa-chats'] });
    },
  });
};

// ── Logout ─────────────────────────────────────────────────────────────────

export const useWALogout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res  = await fetch('/api/main/whatsapp/logout', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wa-status'] });
      qc.invalidateQueries({ queryKey: ['wa-chats'] });
      qc.removeQueries({ queryKey: ['wa-messages'] });
    },
  });
};

// ── Socket.io — real-time ──────────────────────────────────────────────────

export const useWASocket = (
  onMessage: (msg: WAMessage & { from: string; to: string; contactName: string; chatName: string }) => void,
  onStatusChange: (status: {
    type: 'init' | 'qr' | 'authenticated' | 'loading' | 'ready' | 'disconnected' | 'auth_failure' | 'ack';
    [key: string]: any;
  }) => void,
) => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const WA_SERVER = process.env.WA_SERVER_URL ?? 'https://whatsapp-server-1-vz0u.onrender.com';

    socketRef.current = io(WA_SERVER, {
      transports:           ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay:    2000,
      timeout:              10000,
    });

    socketRef.current.on('connect', () => {
      setConnected(true);
      console.log('WA socket connected');
    });

    socketRef.current.on('disconnect', (reason) => {
      setConnected(false);
      console.log('WA socket disconnected:', reason);
    });

    socketRef.current.on('connect_error', (err) => {
      setConnected(false);
      console.error('WA socket error:', err.message);
    });

    socketRef.current.on('message',       (d) => onMessage(d));
    socketRef.current.on('init',          (d) => onStatusChange({ type: 'init',          ...d }));
    socketRef.current.on('qr',            (qr) => onStatusChange({ type: 'qr',           qr }));
    socketRef.current.on('authenticated', ()  => onStatusChange({ type: 'authenticated' }));
    socketRef.current.on('loading',       (d) => onStatusChange({ type: 'loading',       ...d }));
    socketRef.current.on('ready',         (d) => onStatusChange({ type: 'ready',         ...d }));
    socketRef.current.on('disconnected',  (d) => onStatusChange({ type: 'disconnected',  ...d }));
    socketRef.current.on('auth_failure',  (d) => onStatusChange({ type: 'auth_failure',  ...d }));
    socketRef.current.on('message_ack',   (d) => onStatusChange({ type: 'ack',           ...d }));

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return { connected };
};