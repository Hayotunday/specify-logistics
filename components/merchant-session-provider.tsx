"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearMerchantSession,
  getMerchantSession,
  type MerchantRole,
} from "@/lib/merchant-session";
import { supabase } from "@/lib/supabase";

type MerchantSessionContextValue = {
  role: MerchantRole | null;
  loading: boolean;
  hasNormalDashboardSession: boolean;
  refreshMerchantSession: () => Promise<void>;
  signOutMerchant: () => Promise<void>;
};

const MerchantSessionContext = createContext<MerchantSessionContextValue | null>(
  null,
);

export function MerchantSessionProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<MerchantRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNormalDashboardSession, setHasNormalDashboardSession] = useState(false);

  const refreshMerchantSession = useCallback(async () => {
    try {
      const session = await getMerchantSession();
      setRole(session.role);
      setHasNormalDashboardSession(session.normalDashboardSession);
    } catch {
      setRole(null);
      setHasNormalDashboardSession(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMerchantSession();

    // Keeps the merchant session alive while this dashboard is open. When the
    // user leaves, the heartbeat stops and the server cookie expires shortly.
    const heartbeat = window.setInterval(refreshMerchantSession, 5 * 60 * 1000);
    return () => window.clearInterval(heartbeat);
  }, [refreshMerchantSession]);

  useEffect(() => {
    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange(() => {
      refreshMerchantSession();
    });
    return () => data.subscription.unsubscribe();
  }, [refreshMerchantSession]);

  const signOutMerchant = useCallback(async () => {
    await clearMerchantSession();
    setRole(null);
  }, []);

  const value = useMemo(
    () => ({
      role,
      loading,
      hasNormalDashboardSession,
      refreshMerchantSession,
      signOutMerchant,
    }),
    [hasNormalDashboardSession, loading, refreshMerchantSession, role, signOutMerchant],
  );

  return (
    <MerchantSessionContext.Provider value={value}>
      {children}
    </MerchantSessionContext.Provider>
  );
}

export function useMerchantSession() {
  const context = useContext(MerchantSessionContext);
  if (!context) {
    throw new Error("useMerchantSession must be used within MerchantSessionProvider.");
  }
  return context;
}
