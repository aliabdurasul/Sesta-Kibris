// ══════════════════════════════════════════════════════════════
// Hook — useMerchants
// React Query wrapper for merchant + product queries
// ══════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as merchantsService from '../services/merchants.service';
import * as productsService from '../services/products.service';

// ─── Query Keys ──────────────────────────────────────────────
export const merchantKeys = {
  all: ['merchants'],
  active: () => ['merchants', 'active'],
  detail: (id) => ['merchants', id],
  products: (id) => ['merchants', id, 'products'],
  categories: (id) => ['merchants', id, 'categories'],
};

// ─── Queries ─────────────────────────────────────────────────

/** Fetch all active merchants (customer home). */
export function useActiveMerchants() {
  return useQuery({
    queryKey: merchantKeys.active(),
    queryFn: merchantsService.getActiveMerchants,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

/** Fetch single merchant by ID. */
export function useMerchant(merchantId) {
  return useQuery({
    queryKey: merchantKeys.detail(merchantId),
    queryFn: () => merchantsService.getMerchantById(merchantId),
    enabled: !!merchantId,
    staleTime: 3 * 60 * 1000,
  });
}

/** Fetch merchant's products. */
export function useMerchantProducts(merchantId) {
  return useQuery({
    queryKey: merchantKeys.products(merchantId),
    queryFn: () => merchantsService.getMerchantProducts(merchantId),
    enabled: !!merchantId,
    staleTime: 2 * 60 * 1000,
  });
}

/** Fetch merchant's categories. */
export function useMerchantCategories(merchantId) {
  return useQuery({
    queryKey: merchantKeys.categories(merchantId),
    queryFn: () => merchantsService.getMerchantCategories(merchantId),
    enabled: !!merchantId,
  });
}

// ─── Mutations ───────────────────────────────────────────────

/** Create product. */
export function useCreateProduct(merchantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productsService.createProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: merchantKeys.products(merchantId) }),
  });
}

/** Update product. */
export function useUpdateProduct(merchantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }) => productsService.updateProduct(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: merchantKeys.products(merchantId) }),
  });
}

/** Delete product (soft). */
export function useDeleteProduct(merchantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productsService.deleteProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: merchantKeys.products(merchantId) }),
  });
}

/** Upload product image. */
export function useUploadProductImage(merchantId) {
  return useMutation({
    mutationFn: ({ file }) => productsService.uploadProductImage(merchantId, file),
  });
}

/** Create merchant (onboarding). */
export function useCreateMerchant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: merchantsService.createMerchant,
    onSuccess: () => qc.invalidateQueries({ queryKey: merchantKeys.all }),
  });
}
