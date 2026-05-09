// ══════════════════════════════════════════════════════════════
// AuthGuard — Redirect unauthenticated users to /login
// ══════════════════════════════════════════════════════════════

"use client";
import React from 'react';
import { Navigate, Outlet, useLocation } from '@/lib/router-bridge';
import { useAuth } from '../contexts/AuthContext';

export default function AuthGuard({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7FB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C3BFF]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
