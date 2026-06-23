"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useVoltStatus, useVoltUnlock, useVoltLock, clearStoredToken, getStoredToken } from '@/lib/api/v1/fetchVolt';

interface VoltContextType {
  isUnlocked:       boolean;
  remainingSeconds: number;
  isLoading:        boolean;
  isConfigured:     boolean;
  unlock:           (pin: string) => Promise<{ success: boolean; error?: string; lockdown?: boolean; attempts_left?: number }>;
  lock:             (pin: string) => Promise<{ success: boolean; error?: string }>;
  showUnlockModal:  () => void;
  showLockModal:    () => void;
  hideModal:        () => void;
  modalState:       'hidden' | 'unlock' | 'lock';
}

const VoltContext = createContext<VoltContextType | null>(null);

export function VoltProvider({ children }: { children: React.ReactNode }) {
  const qc                     = useQueryClient();
  const { data: status, isLoading } = useVoltStatus();
  const unlock                 = useVoltUnlock();
  const lock                   = useVoltLock();
  const [modalState, setModal] = useState<'hidden'|'unlock'|'lock'>('hidden');
  const timerRef               = useRef<NodeJS.Timeout | null>(null);

  const isUnlocked       = status?.unlocked        ?? false;
  const remainingSeconds = status?.remaining_seconds ?? 0;
  const isConfigured     = getStoredToken() !== null || isUnlocked;

  // Auto-lock when timer expires
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isUnlocked && remainingSeconds > 0) {
      timerRef.current = setTimeout(() => {
        clearStoredToken();
        qc.invalidateQueries({ queryKey: ['volt-status'] });
      }, remainingSeconds * 1000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isUnlocked, remainingSeconds]);

  const handleUnlock = useCallback(async (pin: string) => {
    try {
      const res = await unlock.mutateAsync({ pin });
      if (res.success) { setModal('hidden'); return { success: true }; }
      return { success: false, error: res.message, lockdown: res.lockdown, attempts_left: res.attempts_left };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }, [unlock]);

  const handleLock = useCallback(async (pin: string) => {
    try {
      const res = await lock.mutateAsync({ pin });
      if (res.success) { setModal('hidden'); return { success: true }; }
      return { success: false, error: res.message };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }, [lock]);

  return (
    <VoltContext.Provider value={{
      isUnlocked, remainingSeconds, isLoading,
      isConfigured: true,
      unlock:          handleUnlock,
      lock:            handleLock,
      showUnlockModal: () => setModal('unlock'),
      showLockModal:   () => setModal('lock'),
      hideModal:       () => setModal('hidden'),
      modalState,
    }}>
      {children}
    </VoltContext.Provider>
  );
}

export const useVolt = () => {
  const ctx = useContext(VoltContext);
  if (!ctx) throw new Error('useVolt must be used inside VoltProvider');
  return ctx;
};