// ══════════════════════════════════════════════════════════════
// Service Layer — Auth
// Handles login, signup, logout, session, and role fetching.
// ══════════════════════════════════════════════════════════════

import { getSupabaseBrowserClient } from '../lib/supabase/client';
import type { Profile, UserRoleRow, MerchantUser, UserRole } from '../types';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

const getClient = () => {
  try {
    const client = getSupabaseBrowserClient();
    if (!client) {
      throw new AuthError('Supabase is not configured.');
    }
    return client;
  } catch (e) {
    if (e instanceof AuthError) throw e;
    throw new AuthError(e instanceof Error ? e.message : 'Supabase init failed');
  }
};

/** Sign up with email + password. Auto-creates profile + customer role via DB trigger. */
export async function signUp(email: string, password: string, fullName: string) {
  const supabase = getClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });
  if (error) throw new AuthError(error.message);
  return data;
}

/** Sign in with email + password. */
export async function signIn(email: string, password: string) {
  const supabase = getClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new AuthError(error.message);
  return data;
}

/** Sign out and clear session. */
export async function signOut() {
  const supabase = getClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new AuthError(error.message);
}

/** Get current session (or null). */
export async function getSession() {
  const supabase = getClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw new AuthError(error.message);
  return session;
}

/** Fetch the user's profile from profiles table. */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as Profile;
}

/** Fetch all roles for a user. */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('is_active', true);
  if (error) return ['customer']; // fallback
  return (data as UserRoleRow[]).map(r => r.role);
}

/** Fetch merchant memberships for a user. */
export async function getMerchantMemberships(userId: string): Promise<MerchantUser[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('merchant_users')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);
  if (error) return [];
  return data as MerchantUser[];
}

/** Update user profile. */
export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw new AuthError(error.message);
  return data as Profile;
}

/** Listen to auth state changes. Returns unsubscribe function. */
export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  const supabase = getClient();
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
}
