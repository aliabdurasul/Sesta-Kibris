// ══════════════════════════════════════════════════════════════
// Hook — useOrders
// React Query + Supabase Realtime for order lifecycle
// ══════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient, useQueryClient as useQC } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as ordersService from '../services/orders.service';
import { useAuth } from '../contexts/AuthContext';

// ─── Query Keys ──────────────────────────────────────────────
export const orderKeys = {
  all: ['orders'],
  customer: () => ['orders', 'customer'],
  merchant: (id) => ['orders', 'merchant', id],
  courier: () => ['orders', 'courier'],
  detail: (id) => ['orders', id],
};

// ─── Customer Queries ─────────────────────────────────────────

export function useCustomerOrders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: orderKeys.customer(),
    queryFn: ordersService.getCustomerOrders,
    enabled: !!user,
  });
}

// ─── Merchant Queries ─────────────────────────────────────────

export function useMerchantOrders(merchantId) {
  return useQuery({
    queryKey: orderKeys.merchant(merchantId),
    queryFn: () => ordersService.getMerchantOrders(merchantId),
    enabled: !!merchantId,
    refetchInterval: 30 * 1000, // poll every 30s as fallback
  });
}

// ─── Courier Queries ──────────────────────────────────────────

export function useCourierOrders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: orderKeys.courier(),
    queryFn: ordersService.getCourierOrders,
    enabled: !!user,
  });
}

// ─── Single Order ─────────────────────────────────────────────

export function useOrder(orderId) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => ordersService.getOrder(orderId),
    enabled: !!orderId,
  });
}

// ─── Realtime Subscription ────────────────────────────────────

/**
 * Subscribe to realtime order updates.
 * filter: { column: 'customer_id' | 'merchant_id' | 'courier_id', value: string }
 */
export function useOrderRealtime(filter) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!filter?.value) return;

    const unsubscribe = ordersService.subscribeToOrders(filter, (updatedOrder) => {
      // Update the specific order in cache
      qc.setQueryData(orderKeys.detail(updatedOrder.id), updatedOrder);
      // Invalidate list queries to trigger refetch
      qc.invalidateQueries({ queryKey: orderKeys.all });
    });

    return unsubscribe;
  }, [filter?.column, filter?.value, qc]);
}

// ─── Mutations ────────────────────────────────────────────────

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ordersService.placeOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: orderKeys.customer() }),
  });
}

export function useTransitionOrder() {
  const qc = useQueryClient();
  const { primaryRole, roles } = useAuth();

  return useMutation({
    mutationFn: ({ orderId, toStatus }) => {
      // Determine acting role — pick most permissive applicable role
      const actingRole = roles.includes('admin') ? 'admin'
        : roles.includes('merchant_owner') ? 'merchant_owner'
        : roles.includes('merchant_staff') ? 'merchant_staff'
        : roles.includes('courier') ? 'courier'
        : 'customer';
      return ordersService.transitionOrder(orderId, toStatus, actingRole);
    },
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      qc.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useAssignCourier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, courierId, courier, order, deliveryMode }) =>
      ordersService.assignCourier(orderId, courierId, courier, order, deliveryMode),
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      qc.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  const { roles } = useAuth();
  return useMutation({
    mutationFn: ({ orderId, reason }) => {
      const role = roles.includes('admin') ? 'admin'
        : roles.includes('merchant_owner') ? 'merchant_owner'
        : 'customer';
      return ordersService.cancelOrder(orderId, reason, role);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: orderKeys.all }),
  });
}
