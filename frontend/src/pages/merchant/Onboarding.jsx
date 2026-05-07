import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGapGel } from "@/store/GapGelContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Store,
  Package,
  MapPin,
  Truck,
  FileText,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { TYPE_LABELS, DELIVERY_MODE_LABELS } from "@/data/seed";

const STEPS = [
  { key: "business", label: "İşletme", icon: Store },
  { key: "category", label: "Kategori", icon: Package },
  { key: "delivery", label: "Teslimat", icon: Truck },
  { key: "address", label: "Adres", icon: MapPin },
  { key: "docs", label: "Belgeler", icon: FileText },
  { key: "review", label: "Gönder", icon: CheckCircle2 },
];

export default function MerchantOnboarding() {
  const navigate = useNavigate();
  const { submitMerchantApplication } = useGapGel();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: "",
    tagline: "",
    type: "market",
    deliveryMode: "platform_only",
    deliveryWindow: "20–35 dk",
    address: "",
    docs: { taxNumber: "", license: "" },
  });

  const set = (patch) => setData((d) => ({ ...d, ...patch }));
  const setDoc = (patch) =>
    setData((d) => ({ ...d, docs: { ...d.docs, ...patch } }));

  const canNext = () => {
    if (step === 0) return data.name.trim().length >= 2;
    if (step === 3) return data.address.trim().length >= 4;
    if (step === 4) return data.docs.taxNumber.trim().length >= 4;
    return true;
  };

  const submit = () => {
    submitMerchantApplication(data);
    navigate("/merchant");
  };

  return (
    <div
      className="mx-auto max-w-3xl px-4 py-8"
      data-testid="merchant-onboarding"
    >
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => navigate("/merchant")}
          className="tap grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm"
          data-testid="onboarding-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="text-xs text-gray-500">Mağaza başvurusu</div>
          <h1 className="text-2xl font-extrabold">HADE'ye katılın</h1>
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-6 grid grid-cols-6 gap-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const current = i === step;
          return (
            <div
              key={s.key}
              className="flex flex-col items-center"
              data-testid={`onboarding-step-${s.key}`}
            >
              <div
                className={`grid h-9 w-9 place-items-center rounded-full transition-all ${
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

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">İşletme bilgileri</h2>
            <Field label="İşletme adı *">
              <Input
                value={data.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="Örn: Yeşil Market"
                data-testid="onboarding-name"
              />
            </Field>
            <Field label="Kısa açıklama">
              <Textarea
                value={data.tagline}
                onChange={(e) => set({ tagline: e.target.value })}
                placeholder="Mahallenin taze sebze meyve kaynağı"
                className="min-h-[80px]"
                data-testid="onboarding-tagline"
              />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Kategori</h2>
            <Field label="İşletme türü">
              <Select
                value={data.type}
                onValueChange={(v) => set({ type: v })}
              >
                <SelectTrigger data-testid="onboarding-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <p className="text-xs text-gray-500">
              Onaydan sonra ürün kataloğunuzu Mağaza panelinden ekleyebilirsiniz.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Teslimat tercihleri</h2>
            <Field label="Teslimat modu">
              <Select
                value={data.deliveryMode}
                onValueChange={(v) => set({ deliveryMode: v })}
              >
                <SelectTrigger data-testid="onboarding-delivery-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DELIVERY_MODE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tahmini teslimat süresi">
              <Input
                value={data.deliveryWindow}
                onChange={(e) => set({ deliveryWindow: e.target.value })}
                placeholder="20–35 dk"
                data-testid="onboarding-window"
              />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Adres</h2>
            <Field label="İşletme adresi *">
              <Textarea
                value={data.address}
                onChange={(e) => set({ address: e.target.value })}
                placeholder="Atatürk Caddesi 12, Lefkoşa"
                className="min-h-[80px]"
                data-testid="onboarding-address"
              />
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Belgeler</h2>
            <Field label="Vergi numarası *">
              <Input
                value={data.docs.taxNumber}
                onChange={(e) => setDoc({ taxNumber: e.target.value })}
                placeholder="1234567890"
                data-testid="onboarding-tax"
              />
            </Field>
            <Field label="İşyeri ruhsatı no (opsiyonel)">
              <Input
                value={data.docs.license}
                onChange={(e) => setDoc({ license: e.target.value })}
                placeholder="LIC-…"
                data-testid="onboarding-license"
              />
            </Field>
            <p className="text-xs text-gray-500">
              Demo: gerçek belge yüklemesi yerine numara girin.
            </p>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3" data-testid="onboarding-review">
            <h2 className="text-lg font-bold">Özet</h2>
            <Row k="İşletme" v={data.name} />
            <Row k="Açıklama" v={data.tagline || "—"} />
            <Row k="Kategori" v={TYPE_LABELS[data.type]} />
            <Row k="Teslimat modu" v={DELIVERY_MODE_LABELS[data.deliveryMode]} />
            <Row k="Süre" v={data.deliveryWindow} />
            <Row k="Adres" v={data.address} />
            <Row k="Vergi no" v={data.docs.taxNumber} />
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              Gönderdikten sonra başvurunuz <b>Beklemede</b> durumuna geçer.
              Yönetici onayladıktan sonra ürün ekleyip sipariş alabilirsiniz.
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-full"
            data-testid="onboarding-prev"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Geri
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="rounded-full bg-[#6C3BFF] hover:bg-[#582CD6]"
              data-testid="onboarding-next"
            >
              İleri <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={submit}
              className="rounded-full bg-[#00C2A8] hover:bg-[#00A38D]"
              data-testid="onboarding-submit"
            >
              Başvuruyu gönder <CheckCircle2 className="ml-1 h-4 w-4" />
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
    <div className="flex justify-between border-b border-dashed border-gray-100 py-1.5 text-sm">
      <span className="text-gray-500">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}
