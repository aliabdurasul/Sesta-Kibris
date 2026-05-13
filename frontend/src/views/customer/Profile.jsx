"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MapPin,
  Phone,
  Plus,
  Star,
  Trash2,
  Pencil,
  LogOut,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

function addrKey(userId) {
  return `sesta_addresses_${userId}`;
}

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function CustomerProfile() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    label: "",
    line: "",
    district: "",
    notes: "",
    isDefault: false,
  });

  // Load addresses from localStorage once user is known
  useEffect(() => {
    if (!user?.id) return;
    try {
      const raw = localStorage.getItem(addrKey(user.id));
      if (raw) setAddresses(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }
  }, [user?.id]);

  const persist = (next) => {
    setAddresses(next);
    try {
      localStorage.setItem(addrKey(user.id), JSON.stringify(next));
    } catch {}
  };

  const addAddress = (addr) =>
    persist([...addresses, { ...addr, id: newId(), isDefault: addresses.length === 0 }]);

  const updateAddress = (id, patch) =>
    persist(addresses.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const removeAddress = (id) =>
    persist(addresses.filter((a) => a.id !== id));

  const setDefaultAddress = (id) =>
    persist(addresses.map((a) => ({ ...a, isDefault: a.id === id })));

  const openNew = () => {
    setEditing(null);
    setForm({ label: "", line: "", district: "", notes: "", isDefault: false });
    setOpen(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({
      label: a.label || "",
      line: a.line || "",
      district: a.district || "",
      notes: a.notes || "",
      isDefault: !!a.isDefault,
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.label.trim() || !form.line.trim()) {
      toast.error("Etiket ve adres alanları zorunludur.");
      return;
    }
    if (editing) {
      updateAddress(editing.id, form);
      if (form.isDefault) setDefaultAddress(editing.id);
    } else {
      addAddress(form);
    }
    setOpen(false);
    toast.success(editing ? "Adres güncellendi" : "Adres eklendi");
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6C3BFF]" />
      </div>
    );
  }

  const displayName = profile?.full_name || user?.email || "Kullanıcı";
  const displayEmail = user?.email || "";

  return (
    <div className="gg-rise px-4 pb-24 pt-4" data-testid="customer-profile">
      <h1 className="mb-4 text-2xl font-extrabold">Profil</h1>

      {/* User card */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-[#6C3BFF] text-xl font-bold text-white">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-bold">{displayName}</div>
            <div className="truncate text-xs text-gray-500">{displayEmail}</div>
          </div>
        </div>
        {profile?.phone && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4 shrink-0" />
            {profile.phone}
          </div>
        )}
      </div>

      {/* Address Book */}
      <div
        className="mt-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
        data-testid="address-book"
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">Adres defterim</h2>
            <p className="text-xs text-gray-500">
              {addresses.length} kayıtlı adres
            </p>
          </div>
          <Button
            onClick={openNew}
            className="tap h-9 rounded-full bg-[#6C3BFF] px-4 text-xs font-bold hover:bg-[#582CD6]"
            data-testid="add-address-button"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Yeni adres
          </Button>
        </div>

        <div className="space-y-2">
          {addresses.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-500">
              Henüz adres yok. Yeni adres ekleyin.
            </div>
          )}
          {addresses.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-[#E5E7EB] bg-white p-3"
              data-testid={`address-item-${a.id}`}
            >
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#6C3BFF]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold">{a.label}</span>
                    {a.isDefault && (
                      <span
                        className="rounded-full bg-[#00C2A8]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#00A38D]"
                        data-testid={`address-default-badge-${a.id}`}
                      >
                        Varsayılan
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-700">{a.line}</div>
                  {a.district && (
                    <div className="text-[11px] text-gray-400">{a.district}</div>
                  )}
                  {a.notes && (
                    <div className="mt-1 rounded-md bg-gray-50 px-2 py-1 text-[11px] italic text-gray-500">
                      "{a.notes}"
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2 flex gap-1.5">
                {!a.isDefault && (
                  <Button
                    onClick={() => setDefaultAddress(a.id)}
                    variant="outline"
                    className="h-7 rounded-full border-[#6C3BFF]/30 px-3 text-[11px] font-bold text-[#6C3BFF]"
                    data-testid={`address-set-default-${a.id}`}
                  >
                    <Star className="mr-1 h-3 w-3" /> Varsayılan yap
                  </Button>
                )}
                <Button
                  onClick={() => openEdit(a)}
                  variant="outline"
                  className="h-7 rounded-full border-gray-200 px-3 text-[11px] font-bold text-gray-600"
                  data-testid={`address-edit-${a.id}`}
                >
                  <Pencil className="mr-1 h-3 w-3" /> Düzenle
                </Button>
                {addresses.length > 1 && (
                  <Button
                    onClick={() => removeAddress(a.id)}
                    variant="outline"
                    className="h-7 rounded-full border-red-200 px-3 text-[11px] font-bold text-red-600 hover:bg-red-50"
                    data-testid={`address-delete-${a.id}`}
                  >
                    <Trash2 className="mr-1 h-3 w-3" /> Sil
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Onboarding CTAs */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          onClick={() => router.push("/merchant/onboarding")}
          variant="outline"
          className="tap h-12 rounded-2xl border-[#6C3BFF]/30 font-bold text-[#6C3BFF] hover:bg-[#6C3BFF]/5"
          data-testid="apply-merchant-button"
        >
          Mağaza ol
        </Button>
        <Button
          onClick={() => router.push("/courier/onboarding")}
          variant="outline"
          className="tap h-12 rounded-2xl border-[#00C2A8]/30 font-bold text-[#00A38D] hover:bg-[#00C2A8]/5"
          data-testid="apply-courier-button"
        >
          Kurye ol
        </Button>
      </div>

      {/* Sign out */}
      <Button
        onClick={handleSignOut}
        variant="outline"
        className="tap mt-3 h-12 w-full rounded-full border-red-200 font-bold text-red-600 hover:bg-red-50"
        data-testid="sign-out-button"
      >
        <LogOut className="mr-2 h-4 w-4" /> Çıkış yap
      </Button>

      {/* Address dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl" data-testid="address-dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Adresi düzenle" : "Yeni adres"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Etiket (Ev, İş, vb.)
              </label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Ev"
                className="h-10 rounded-xl"
                data-testid="address-input-label"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Adres
              </label>
              <Input
                value={form.line}
                onChange={(e) => setForm({ ...form, line: e.target.value })}
                placeholder="Atatürk Caddesi 221, Daire 4"
                className="h-10 rounded-xl"
                data-testid="address-input-line"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Mahalle / Bölge
              </label>
              <Input
                value={form.district}
                onChange={(e) =>
                  setForm({ ...form, district: e.target.value })
                }
                placeholder="Lefkoşa Merkez"
                className="h-10 rounded-xl"
                data-testid="address-input-district"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Teslimat notu
              </label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Resepsiyona bırakın…"
                className="min-h-[60px] resize-none rounded-xl"
                data-testid="address-input-notes"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) =>
                  setForm({ ...form, isDefault: e.target.checked })
                }
                className="h-4 w-4 accent-[#6C3BFF]"
                data-testid="address-input-default"
              />
              Varsayılan adres olarak kaydet
            </label>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-full"
              data-testid="address-dialog-cancel"
            >
              İptal
            </Button>
            <Button
              onClick={submit}
              className="rounded-full bg-[#6C3BFF] hover:bg-[#582CD6]"
              data-testid="address-dialog-save"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
