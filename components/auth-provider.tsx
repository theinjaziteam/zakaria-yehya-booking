"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    async function init() {
      try {
        const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
        const sb = createBrowserSupabaseClient();

        const { data: { session } } = await sb.auth.getSession();
        setUser(session?.user ?? null);

        const { data: { subscription } } = sb.auth.onAuthStateChange((_, s) => {
          setUser(s?.user ?? null);
        });
        unsub = () => subscription.unsubscribe();
      } catch {
        // Supabase not configured
      } finally {
        setLoading(false);
      }
    }

    init();
    return () => unsub?.();
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
      const { error } = await createBrowserSupabaseClient().auth.signInWithPassword({ email, password });
      return error?.message ?? null;
    } catch { return "Sign in failed"; }
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      // Server-side creation via admin API — marks email confirmed, no verification email sent
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json() as { ok?: boolean; existing?: boolean; error?: string };
      if (!res.ok && !json.existing) return json.error ?? "Sign up failed";

      // Account ready — sign in to establish session
      const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
      const { error } = await createBrowserSupabaseClient().auth.signInWithPassword({ email, password });
      if (error) return "Account exists — check your password.";
      return null;
    } catch { return "Sign up failed"; }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
      await createBrowserSupabaseClient().auth.signOut();
    } catch { /* ignore */ }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
