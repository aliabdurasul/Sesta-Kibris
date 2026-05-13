// ══════════════════════════════════════════════════════════════
// AuthContext — Auth-Free Application Identity
//
// Identity is application-level: stored in localStorage (key: sesta_user)
// and persisted to the app_users Supabase table (no auth.users FK).
//
// The exported useAuth() hook shape is IDENTICAL to the previous
// Supabase auth version — zero view-file changes required.
// ══════════════════════════════════════════════════════════════

"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const STORAGE_KEY = "sesta_user";

const AuthContext = createContext(null);

// ─── Helpers ─────────────────────────────────────────────────

function readStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStorage(u) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
}

function clearStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  // also clear the old demo session key if present
  localStorage.removeItem("sesta_demo_session");
}

// Map stored role → primaryRole string used by layouts/guards
function toPrimaryRole(role) {
  if (role === "admin") return "admin";
  if (role === "merchant") return "merchant";
  if (role === "courier") return "courier";
  return "customer";
}

// ─── Provider ────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [roles, setRoles] = useState([]);
  const [merchantMemberships, setMerchantMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load from localStorage on mount — synchronous, no network call
  useEffect(() => {
    const stored = readStorage();
    if (stored?.id && stored?.role) {
      applyUser(stored);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyUser(stored) {
    // Map stored role string → roles array format expected by guards/views
    // Guards check for 'merchant_owner' so we normalise here
    const dbRole = stored.role === "merchant" ? "merchant_owner" : stored.role;
    setUser({ id: stored.id, email: stored.email || null, name: stored.name });
    setProfile({
      id: stored.id,
      full_name: stored.name,
      phone: stored.phone || null,
      email: stored.email || null,
    });
    setRoles([dbRole]);
    setMerchantMemberships(
      stored.merchant_id ? [{ merchant_id: stored.merchant_id, role: "owner", is_active: true }] : []
    );
  }

  // ── signIn: register/login — insert into app_users, write localStorage ──
  // params: { name, role, phone? }
  const signIn = useCallback(async ({ name, role, phone } = {}) => {
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      let userId;

      if (supabase) {
        const { data, error: dbError } = await supabase
          .from("app_users")
          .insert({ name, role, phone: phone || null })
          .select()
          .single();
        if (dbError) throw new Error(dbError.message);
        userId = data.id;
      } else {
        // Supabase unavailable — generate a local id
        userId = crypto.randomUUID?.() || `local-${Date.now()}`;
      }

      const stored = { id: userId, name, role, phone: phone || null };
      writeStorage(stored);
      applyUser(stored);
      return stored;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // ── signUp: alias for signIn (no separate concept without auth) ──
  const signUp = useCallback(
    async (email, password, fullName) => {
      return signIn({ name: fullName, role: "customer" });
    },
    [signIn]
  );

  // ── signOut: clear localStorage, reset state ──
  const signOut = useCallback(async () => {
    clearStorage();
    setUser(null);
    setProfile(null);
    setRoles([]);
    setMerchantMemberships([]);
    setError(null);
  }, []);

  // ── refreshUser: re-read localStorage (e.g. after onboarding updates merchant_id) ──
  const refreshUser = useCallback(() => {
    const stored = readStorage();
    if (stored?.id && stored?.role) {
      applyUser(stored);
    }
  }, []);

  // Helpers
  const hasRole = useCallback((role) => roles.includes(role), [roles]);
  const isAuthenticated = !!user;

  const primaryRole =
    roles.includes("admin") ? "admin"
    : roles.includes("merchant_owner") || roles.includes("merchant_staff") ? "merchant"
    : roles.includes("courier") ? "courier"
    : "customer";

  const value = {
    user,
    profile,
    roles,
    merchantMemberships,
    loading,
    isRefreshing: false,   // kept for API compat — no async reload needed
    error,
    isAuthenticated,
    primaryRole,
    hasRole,
    signIn,
    signUp,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
