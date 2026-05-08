// ══════════════════════════════════════════════════════════════
// AuthContext — Real Supabase Auth Provider
// ══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authService from '../services/auth.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Supabase auth user
  const [profile, setProfile] = useState(null);  // profiles table row
  const [roles, setRoles] = useState([]);        // user_roles rows
  const [merchantMemberships, setMerchantMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user data (profile + roles + memberships)
  const loadUserData = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      setProfile(null);
      setRoles([]);
      setMerchantMemberships([]);
      return;
    }

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
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  }, []);

  // Initialize: check existing session
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const session = await authService.getSession();
        if (mounted && session?.user) {
          await loadUserData(session.user);
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();

    // Listen for auth state changes
    const subscription = authService.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserData(session.user);
      } else if (event === 'SIGNED_OUT') {
        await loadUserData(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  // Actions
  const signIn = useCallback(async (email, password) => {
    setError(null);
    try {
      const { user: authUser } = await authService.signIn(email, password);
      await loadUserData(authUser);
      return authUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadUserData]);

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
    await authService.signOut();
    await loadUserData(null);
  }, [loadUserData]);

  // Helpers
  const hasRole = useCallback((role) => roles.includes(role), [roles]);
  const isAuthenticated = !!user;

  // Determine primary role for routing
  const primaryRole = roles.includes('admin') ? 'admin'
    : roles.includes('merchant_owner') || roles.includes('merchant_staff') ? 'merchant'
    : roles.includes('courier') ? 'courier'
    : 'customer';

  const value = {
    user,
    profile,
    roles,
    merchantMemberships,
    loading,
    error,
    isAuthenticated,
    primaryRole,
    hasRole,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
