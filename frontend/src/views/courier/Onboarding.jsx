"use client";
import React, { useState } from "react";
import { useNavigate } from "@/lib/router-bridge";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";
import * as couriersService from "@/services/couriers.service";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  IdCard,
  Bike,
  Phone,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

const STEPS = [
  { key: "personal", label: "Bilgiler", icon: User },
  { key: "id", label: "Kimlik", icon: IdCard },
  { key: "vehicle", label: "Araç", icon: Bike },
  { key: "phone", label: "Telefon", icon: Phone },
  { key: "review", label: "Gönder", icon: CheckCircle2 },
];

export default function CourierOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [data, setData] = useState({
    name: "",
    idDocument: "",
    vehicle: "Motosiklet",
    courierType: "platform",
    phone: "",
  });

  const set = (patch) => setData((d) => ({ ...d, ...patch }));

  const sendOtp = () => {
    if (data.phone.length < 8) return;
    setOtpSent(true);
  };
  const verifyOtp = () => {
    // Demo: any 4-digit code is accepted
    if (otpInput.length >= 4) setOtpVerified(true);
  };

  const canNext = () => {
    if (step === 0) return data.name.trim().length >= 2;
    if (step === 1) return data.idDocument.trim().length >= 5;
    if (step === 3) return otpVerified;
    return true;
  };

  const applyMutation = useMutation({
    mutationFn: () =>
      couriersService.submitCourierApplication({
        user_id: user.id,
        vehicle_type: data.vehicle,
      }),
    onSuccess: () => {
      toast.success("Başvurunuz alındı! Onay bekleniyor.");
      navigate("/courier");
    },
    onError: (e) => toast.error(`Başvuru hatası: ${e.message}`),
  });

  const submit = () => {
    if (!user?.id) {
      toast.error("Giriş yapmanız gerekiyor.");
      return;
    }
    applyMutation.mutate();
  };

  return (
    <div
      className="mx-auto max-w-md px-4 py-8"
      data-testid="courier-onboarding"
    >
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => navigate("/courier")}
          className="tap grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm"
          data-testid="courier-onboarding-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="text-xs text-gray-500">Kurye başvurusu</div>
          <h1 className="text-xl font-extrabold">SestaKibris Kurye Olun</h1>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-5 gap-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const current = i === step;
          return (
            <div
              key={s.key}
              className="flex flex-col items-center"
              data-testid={`courier-onboarding-step-${s.key}`}
            >
              <div
                className={`grid h-9 w-9 place-items-center rounded-full ${
                  done
                    ? "bg-[#00C2A8] text-white"
                    : current
                      ? "bg-[#6C3BFF] text-white shadow-[0_0_0_4px_rgba(108,59,255,0.18)]"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div
                className={`mt-1 text-[10px] font-bold ${
                  current ? "text-[#6C3BFF]" : done ? "text-[#00A38D]" : "text-gray-400"
                }`}
              >
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold">Kişisel bilgiler</h2>
            <Field label="Ad Soyad *">
              <Input
                value={data.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="Mehmet Yılmaz"
                data-testid="courier-onboarding-name"
              />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold">Kimlik / Sürücü belgesi</h2>
            <Field label="Belge numarası *">
              <Input
                value={data.idDocument}
                onChange={(e) => set({ idDocument: e.target.value })}
                placeholder="TC veya sürücü belgesi"
                data-testid="courier-onboarding-id"
              />
            </Field>
            <p className="text-xs text-gray-500">
              Demo: gerçek belge yüklemesi yerine numara girin.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold">Araç bilgisi</h2>
            <Field label="Araç türü">
              <Select
                value={data.vehicle}
                onValueChange={(v) => set({ vehicle: v })}
              >
                <SelectTrigger data-testid="courier-onboarding-vehicle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Motosiklet">Motosiklet</SelectItem>
                  <SelectItem value="Elektrikli Bisiklet">
                    Elektrikli Bisiklet
                  </SelectItem>
                  <SelectItem value="Bisiklet">Bisiklet</SelectItem>
                  <SelectItem value="Otomobil">Otomobil</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Kurye tipi">
              <Select
                value={data.courierType}
                onValueChange={(v) => set({ courierType: v })}
              >
                <SelectTrigger data-testid="courier-onboarding-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform">Platform Kuryesi</SelectItem>
                  <SelectItem value="merchant">Mağaza Kuryesi</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold">Telefon doğrulaması</h2>
            <Field label="Telefon numarası">
              <div className="flex gap-2">
                <Input
                  value={data.phone}
                  onChange={(e) => set({ phone: e.target.value })}
                  placeholder="+90 392 555 0000"
                  disabled={otpSent}
                  data-testid="courier-onboarding-phone"
                />
                {!otpSent && (
                  <Button
                    onClick={sendOtp}
                    className="rounded-full bg-[#6C3BFF] hover:bg-[#582CD6]"
                    data-testid="courier-onboarding-send-otp"
                  >
                    OTP gönder
                  </Button>
                )}
              </div>
            </Field>
            {otpSent && !otpVerified && (
              <Field label="OTP kodu (demo: 1234)">
                <div className="flex gap-2">
                  <Input
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="1234"
                    maxLength={6}
                    data-testid="courier-onboarding-otp"
                  />
                  <Button
                    onClick={verifyOtp}
                    className="rounded-full bg-[#00C2A8] hover:bg-[#00A38D]"
                    data-testid="courier-onboarding-verify-otp"
                  >
                    Doğrula
                  </Button>
                </div>
              </Field>
            )}
            {otpVerified && (
              <div
                className="rounded-lg bg-[#00C2A8]/10 p-2 text-xs font-bold text-[#00A38D]"
                data-testid="courier-onboarding-otp-verified"
              >
                ✓ Telefon doğrulandı
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-2" data-testid="courier-onboarding-review">
            <h2 className="text-base font-bold">Özet</h2>
            <Row k="Ad Soyad" v={data.name} />
            <Row k="Kimlik" v={data.idDocument} />
            <Row k="Araç" v={data.vehicle} />
            <Row k="Kurye tipi" v={data.courierType === "platform" ? "Platform" : "Mağaza"} />
            <Row k="Telefon" v={data.phone} />
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              Onay sonrası teslimat almaya başlayabilirsiniz.
            </p>
          </div>
        )}

        <div className="mt-5 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-full"
            data-testid="courier-onboarding-prev"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Geri
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="rounded-full bg-[#6C3BFF] hover:bg-[#582CD6]"
              data-testid="courier-onboarding-next"
            >
              İleri <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={submit}
              disabled={applyMutation.isPending}
              className="rounded-full bg-[#00C2A8] hover:bg-[#00A38D]"
              data-testid="courier-onboarding-submit"
            >
              {applyMutation.isPending ? "Gönderiliyor…" : (
                <>Başvuruyu gönder <CheckCircle2 className="ml-1 h-4 w-4" /></>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between border-b border-dashed border-gray-100 py-1 text-sm">
      <span className="text-gray-500">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}
