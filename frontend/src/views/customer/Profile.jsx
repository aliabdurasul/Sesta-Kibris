"use client";
import React, { useState } from "react";
import { useNavigate } from "@/lib/router-bridge";
import { useMarketplace } from "@/store/GapGelContext";
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
  RotateCcw,
  Plus,
  Star,
  Trash2,
  Pencil,
} from "lucide-react";

export default function CustomerProfile() {
  const navigate = useNavigate();
  const {
    state,
    findCustomer,
    resetDemo,
    addAddress,
    removeAddress,
    setDefaultAddress,
    updateAddress,
  } = useMarketplace();
  const user = findCustomer(state.currentCustomerId);
  const addresses = user?.addresses || [];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // address obj or null
  const [form, setForm] = useState({
    label: "",
    line: "",
    district: "",
    notes: "",
    isDefault: false,
  });

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
    if (!form.label.trim() || !form.line.trim()) return;
    if (editing) {
      updateAddress(user.id, editing.id, form);
      if (form.isDefault && !editing.isDefault) {
        setDefaultAddress(user.id, editing.id);
      }
    } else {
      addAddress(user.id, form);
    }
    setOpen(false);
  };

  return (
    <div className="gg-rise px-4 pb-24 pt-4" data-testid="customer-profile">
      <h1 className="mb-4 text-2xl font-extrabold">Profil</h1>
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-[#6C3BFF] text-xl font-bold text-white">
            {user.name[0]}
          </div>
          <div>
            <div className="text-base font-bold">{user.name}</div>
            <div className="text-xs text-gray-500">Demo hesap</div>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="h-4 w-4" />
            {user.phone}
          </div>
        </div>
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
                    onClick={() => setDefaultAddress(user.id, a.id)}
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
                    onClick={() => removeAddress(user.id, a.id)}
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

      <div className="mt-4 rounded-2xl border border-dashed border-[#6C3BFF]/30 bg-white p-4 text-xs text-gray-500">
        Demo verisi tarayıcınızda saklanır — sayfa yenilense bile siparişler
        kalır. Üst çubuktaki rol seçiciden istediğiniz role geçebilirsiniz.
      </div>

      {/* Onboarding CTAs */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          onClick={() => navigate("/merchant/onboarding")}
          variant="outline"
          className="tap h-12 rounded-2xl border-[#6C3BFF]/30 font-bold text-[#6C3BFF] hover:bg-[#6C3BFF]/5"
          data-testid="apply-merchant-button"
        >
          Mağaza ol
        </Button>
        <Button
          onClick={() => navigate("/courier/onboarding")}
          variant="outline"
          className="tap h-12 rounded-2xl border-[#00C2A8]/30 font-bold text-[#00A38D] hover:bg-[#00C2A8]/5"
          data-testid="apply-courier-button"
        >
          Kurye ol
        </Button>
      </div>

      <Button
        onClick={resetDemo}
        variant="outline"
        className="tap mt-3 h-12 w-full rounded-full border-red-200 font-bold text-red-600 hover:bg-red-50"
        data-testid="reset-demo-button"
      >
        <RotateCcw className="mr-2 h-4 w-4" /> Demoyu sıfırla
      </Button>

      {/* Address dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="rounded-2xl"
          data-testid="address-dialog"
        >
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
                onChange={(e) => setForm({ ...form, district: e.target.value })}
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
