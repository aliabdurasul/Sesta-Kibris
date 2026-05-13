"use client";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Bike, DollarSign, TrendingUp, Calendar, Power, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import * as couriersService from "@/services/couriers.service";
import { toast } from "sonner";

export default function CourierProfile() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();

  const { data: courierProfile, isLoading } = useQuery({
    queryKey: ["courier-profile", user?.id],
    queryFn: () => couriersService.getCourierProfile(user.id),
    enabled: !!user?.id,
  });

  const toggleMutation = useMutation({
    mutationFn: (isOnline) => couriersService.toggleOnline(user.id, isOnline),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courier-profile", user?.id] });
    },
    onError: (e) => toast.error(`Hata: ${e.message}`),
  });

  const { data: earnings = [] } = useQuery({
    queryKey: ["courier-earnings", user?.id],
    queryFn: () => couriersService.getCourierEarnings(user.id),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6C3BFF]" />
      </div>
    );
  }

  const displayName = profile?.full_name || user?.email || "Kurye";
  const isOnline = courierProfile?.is_online ?? false;

  const lifetimeFee = earnings.reduce((s, o) => s + (o.delivery_fee || 0), 0);
  const deliveries = earnings.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEarnings = earnings.filter(
    (o) => o.delivered_at && new Date(o.delivered_at) >= today,
  );
  const todayFee = todayEarnings.reduce((s, o) => s + (o.delivery_fee || 0), 0);

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEarnings = earnings.filter(
    (o) => o.delivered_at && new Date(o.delivered_at) >= weekStart,
  );
  const weekFee = weekEarnings.reduce((s, o) => s + (o.delivery_fee || 0), 0);

  return (
    <div className="gg-rise px-4 pb-24 pt-4" data-testid="courier-profile">
      <h1 className="mb-4 text-2xl font-extrabold">Profil</h1>

      {/* Identity card */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-[#6C3BFF] text-white">
            <Bike className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-base font-bold">{displayName}</div>
            <div className="text-xs text-gray-500">
              {courierProfile?.vehicle_type || "Araç belirtilmemiş"}
              {courierProfile && (
                <>
                  {" · "}
                  <span
                    className={`font-bold ${
                      isOnline ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {isOnline ? "çevrimiçi" : "çevrimdışı"}
                  </span>
                </>
              )}
            </div>
          </div>
          {courierProfile && (
            <div className="flex items-center gap-2">
              <Power
                className={`h-4 w-4 ${
                  isOnline ? "text-[#00C2A8]" : "text-gray-400"
                }`}
              />
              <Switch
                checked={isOnline}
                onCheckedChange={(v) => toggleMutation.mutate(v)}
                disabled={toggleMutation.isPending}
                data-testid="courier-online-toggle"
              />
            </div>
          )}
        </div>

        {courierProfile && !courierProfile.is_approved && (
          <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            Başvurunuz inceleniyor. Onaydan sonra aktif olacaksınız.
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatTile label="Toplam teslimat" value={deliveries} />
          <StatTile label="Bu hafta" value={weekEarnings.length} />
        </div>
      </div>

      {/* Earnings */}
      <div
        className="mt-4 rounded-2xl border border-[#00C2A8]/30 bg-gradient-to-br from-[#00C2A8]/10 to-[#6C3BFF]/5 p-4 shadow-sm"
        data-testid="courier-earnings"
      >
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#00A38D]">
          <DollarSign className="h-3.5 w-3.5" /> Kazanç
        </div>
        <div
          className="mt-1 text-3xl font-extrabold"
          data-testid="earnings-lifetime"
        >
          ₺{lifetimeFee.toFixed(2)}
        </div>
        <div className="text-xs text-gray-500">
          {deliveries} teslimat
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <EarnTile
            icon={Calendar}
            label="Bugün"
            money={todayFee}
            sub={`${todayEarnings.length} teslimat`}
          />
          <EarnTile
            icon={TrendingUp}
            label="Bu hafta"
            money={weekFee}
            sub={`${weekEarnings.length} teslimat`}
          />
        </div>
      </div>

      {!courierProfile && !isLoading && (
        <div className="mt-4 rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-5 text-center text-sm text-gray-500 shadow-sm">
          Kurye profili bulunamadı.{" "}
          <button
            onClick={() => window.location.replace("/courier/onboarding")}
            className="font-semibold text-[#6C3BFF] underline"
          >
            Başvuru yap
          </button>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
      <div className="text-[11px] font-semibold uppercase text-gray-500">
        {label}
      </div>
      <div className="mt-0.5 text-xl font-extrabold">{value}</div>
    </div>
  );
}

function EarnTile({ icon: Icon, label, money, sub }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#6C3BFF]">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-0.5 text-lg font-extrabold">₺{money.toFixed(2)}</div>
      <div className="text-[11px] text-gray-500">{sub}</div>
    </div>
  );
}
