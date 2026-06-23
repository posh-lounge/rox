import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

// ── Device fingerprint (stable per browser/device) ─────────────────────────
export function getDeviceId(): string {
  const key = 'volt_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `${navigator.userAgent.length}-${screen.width}x${screen.height}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    id = btoa(id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 40);
    localStorage.setItem(key, id);
  }
  return id;
}

export function getDeviceInfo() {
  const ua      = navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone/i.test(ua);
  const isTablet = /Tablet|iPad/i.test(ua);
  const type     = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
  const browser  = /Chrome/i.test(ua) ? 'Chrome' : /Firefox/i.test(ua) ? 'Firefox' : /Safari/i.test(ua) ? 'Safari' : /Edge/i.test(ua) ? 'Edge' : 'Unknown';
  const os       = /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : /Android/i.test(ua) ? 'Android' : /iOS|iPhone|iPad/i.test(ua) ? 'iOS' : 'Unknown';
  const name     = `${browser} on ${os}`;
  return { type, browser, os, name };
}

// ── Session storage (per device) ───────────────────────────────────────────
const SESSION_KEY = 'volt_session_token';


export const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
};

export const storeToken = (t: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, t);
};

export const clearStoredToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
};
// ── Types ──────────────────────────────────────────────────────────────────
export interface VoltSession {
  is_active: any;
  id:               number;
  device_id:        string;
  device_name:      string;
  device_type:      string;
  browser:          string;
  os:               string;
  ip_address:       string;
  country:          string;
  city:             string;
  unlocked_at:      string;
  expires_at:       string;
  minutes_remaining: number;
  overridden_at:    string | null;
}

export interface VoltConfig {
  unlock_duration: number;
  failed_attempts: number;
  lockdown_until:  string | null;
  is_locked:       number;
}

export interface VoltSessionsData {
  active_sessions: VoltSession[];
  history:         VoltSession[];
  audit_log:       { action: string; device_name: string; ip_address: string; note: string; created_at: string }[];
  config:          VoltConfig | null;
}

async function post(url: string, body?: object) {
  const res  = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Request failed');
  return json;
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export const useVoltSessions = () => useQuery({
  queryKey: ['volt-sessions'],
  queryFn:  () => post('/api/main/support/volt/sessions').then(r => r as VoltSessionsData),
  refetchInterval: 60 * 1000,
});

export const useVoltSetup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { pin: string; unlock_duration: number }) => post('/api/main/support/volt/setup', data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['volt-sessions'] }),
  });
};

export const useVoltUnlock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { pin: string }) => {
      const deviceId   = getDeviceId();
      const deviceInfo = getDeviceInfo();
      return post('/api/main/support/volt/unlock', { pin: data.pin, device_id: deviceId, device_name: deviceInfo.name, device_type: deviceInfo.type, browser: deviceInfo.browser, os: deviceInfo.os });
    },
    onSuccess: (data) => {
      if (data.session_token) storeToken(data.session_token);
      qc.invalidateQueries({ queryKey: ['volt-sessions'] });
      qc.invalidateQueries({ queryKey: ['volt-status'] });
    },
  });
};

export const useVoltLock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { pin: string }) => {
      const token    = getStoredToken();
      const deviceId = getDeviceId();
      if (!token) throw new Error('No active session');
      return post('/api/main/support/volt/lock', { pin: data.pin, session_token: token, device_id: deviceId });
    },
    onSuccess: () => {
      clearStoredToken();
      qc.invalidateQueries({ queryKey: ['volt-sessions'] });
      qc.invalidateQueries({ queryKey: ['volt-status'] });
    },
  });
};

export const useVoltOverride = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { session_id: number; pin: string }) => post('/api/main/support/volt/override', data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['volt-sessions'] }),
  });
};

export const useVoltUpdateConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { pin: string; new_pin?: string; unlock_duration?: number }) => post('/api/main/support/volt/update-config', data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['volt-sessions'] }),
  });
};

export const useVoltManagePages = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { action: 'add'|'remove'; page_key: string; page_label?: string }) => post('/api/main/support/volt/manage-pages', data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['volt-pages'] }),
  });
};

export const useVoltPages = () => useQuery({
  queryKey: ['volt-pages'],
  queryFn:  () => post('/api/main/support/volt/manage-pages', { action: 'fetch' }).then(r => r.pages as { id: number; page_key: string; page_label: string }[]),
});

// ── Core: verify session status for this device ────────────────────────────
export const useVoltStatus = () => {
  const token    = typeof window !== 'undefined' ? getStoredToken()   : null;
  const deviceId = typeof window !== 'undefined' ? getDeviceId()      : '';
  return useQuery({
    queryKey: ['volt-status', token],
    queryFn:  async () => {
      if (!token) return { unlocked: false, remaining_seconds: 0 };
      const res = await post('/api/main/support/volt/verify', { session_token: token, device_id: deviceId });
      return res as { unlocked: boolean; expires_at?: string; remaining_seconds?: number };
    },
    refetchInterval: 30 * 1000,
    retry: false,
  });
};