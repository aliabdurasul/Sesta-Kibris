// ══════════════════════════════════════════════════════════════
// Hook — useCourier
// ══════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as couriersService from '../services/couriers.service';
import { useAuth } from '../contexts/AuthContext';

export const courierKeys = {
  profile: (uid) => ['courier', 'profile', uid],
  available: () => ['courier', 'available'],
  earnings: (uid) => ['courier', 'earnings', uid],
};

export function useCourierProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: courierKeys.profile(user?.id),
    queryFn: () => couriersService.getCourierProfile(user.id),
    enabled: !!user,
  });
}

export function useAvailableCouriers() {
  return useQuery({
    queryKey: courierKeys.available(),
    queryFn: couriersService.getAvailableCouriers,
    staleTime: 30 * 1000, // 30s — couriers go online/offline frequently
  });
}

export function useCourierEarnings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: courierKeys.earnings(user?.id),
    queryFn: () => couriersService.getCourierEarnings(user.id),
    enabled: !!user,
  });
}

export function useToggleOnline() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (isOnline) => couriersService.toggleOnline(user.id, isOnline),
    onSuccess: () => qc.invalidateQueries({ queryKey: courierKeys.profile(user?.id) }),
  });
}

export function useSubmitCourierApplication() {
  return useMutation({
    mutationFn: couriersService.submitCourierApplication,
  });
}
