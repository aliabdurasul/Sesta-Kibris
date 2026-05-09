// ══════════════════════════════════════════════════════════════
// RoleGuard — Redirect users without the required role
// ══════════════════════════════════════════════════════════════

"use client";
import React from 'react';
import { Navigate, Outlet } from '@/lib/router-bridge';
import { useAuth } from '../contexts/AuthContext';

/**
 * Usage: <Route element={<RoleGuard allowed={['merchant_owner','merchant_staff']} />}>
 *          <Route path="/merchant" element={<MerchantDashboard />} />
 *        </Route>
 */
export default function RoleGuard({ allowed = [], children }) {
  const { roles, primaryRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7FB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C3BFF]" />
      </div>
    );
  }

  // Check if user has any of the allowed roles
  const hasAccess = allowed.some(role => roles.includes(role));

  if (!hasAccess) {
    // Redirect to appropriate dashboard based on primary role
    const redirectMap = {
      admin: '/admin',
      merchant: '/merchant',
      courier: '/courier',
      customer: '/customer',
    };
    return <Navigate to={redirectMap[primaryRole] || '/customer'} replace />;
  }

  return children;
}
