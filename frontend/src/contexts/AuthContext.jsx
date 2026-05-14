// ══════════════════════════════════════════════════════════════
// AuthContext — Supabase Auth (single identity system)
// ══════════════════════════════════════════════════════════════

"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import * as authService from "../services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [roles, setRoles] = useState([]);
  const [merchantMemberships, setMerchantMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  // Track whether signIn() already loaded data to skip duplicate onAuthStateChange trigger
  const [signInInProgress, setSignInInProgress] = useState(false);

  const loadUserData = useCallback(async (authUser, { silent = false } = {}) => {
    if (!authUser) {
      setUser(null);
      setProfile(null);
      setRoles([]);
      setMerchantMemberships([]);
      return [];
    }

    if (silent) setIsRefreshing(true);
    setUser(authUser);
    try {
      const [profileData, rolesData, memberships] = await Promise.all([
        authService.getProfile(authUser.id),
        authService.getUserRoles(authUser.id),
        authService.getMerchantMemberships(authUser.id),
      ]);
      setProfile(profileData);
      setRoles(rolesData);
      setMerchantMemberships(memberships);
      // Return fetched roles so callers can act on them without a second DB round-trip
      return rolesData;
    } catch (err) {
      console.error("Failed to load user data:", err);
      return [];
    } finally {
      if (silent) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const session = await authService.getSession();
        if (mounted && session?.user) {
          await loadUserData(session.user);
          if (mounted) setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Session check failed:", err);
      }
      if (mounted) setLoading(false);
    }
    init();

    const subscription = authService.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      // Skip if signIn() already handled this — prevents duplicate loadUserData
      if (signInInProgress) return;
      if (event === "SIGNED_IN" && session?.user) {
        await loadUserData(session.user);
      } else if (event === "SIGNED_OUT") {
        await loadUserData(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const signIn = useCallback(
    async (email, password) => {
      setError(null);
      setSignInInProgress(true);
      try {
        const { user: authUser } = await authService.signIn(email, password);
        // loadUserData returns the fetched roles — use them directly,
        // no second DB round-trip needed.
        const loadedRoles = await loadUserData(authUser);
        const primaryRole = loadedRoles.includes("admin")
          ? "admin"
          : loadedRoles.includes("merchant_owner") || loadedRoles.includes("merchant_staff")
            ? "merchant"
            : loadedRoles.includes("courier")
              ? "courier"
              : "customer";
        return { user: authUser, primaryRole };
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        // Allow future onAuthStateChange events (e.g. token refresh)
        setSignInInProgress(false);
      }
    },
    [loadUserData],
  );

  const signUp = useCallback(async (email, password, fullName) => {
    setError(null);
    try {
      const { user: authUser } = await authService.signUp(email, password, fullName);
      return authUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authService.signOut();
    } catch {
      /* ignore */
    }
    await loadUserData(null);
  }, [loadUserData]);

  const refreshUser = useCallback(async () => {
    try {
      const session = await authService.getSession();
      if (session?.user) {
        await loadUserData(session.user, { silent: true });
      }
    } catch (err) {
      console.error("refreshUser failed:", err);
    }
  }, [loadUserData]);

  const hasRole = useCallback((role) => roles.includes(role), [roles]);
  const isAuthenticated = !!user;

  const primaryRole = roles.includes("admin")
    ? "admin"
    : roles.includes("merchant_owner") || roles.includes("merchant_staff")
      ? "merchant"
      : roles.includes("courier")
        ? "courier"
        : "customer";

  const value = {
    user,
    profile,
    roles,
    merchantMemberships,
    loading,
    isRefreshing,
    error,
    isAuthenticated,
    primaryRole,
    hasRole,
    signIn,
    signUp,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
