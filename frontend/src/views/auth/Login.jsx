"use client";
// ══════════════════════════════════════════════════════════════
// Login / Identity — Role-picker onboarding screen
// No passwords. No email. No Supabase Auth.
// User picks a name + role → inserted into app_users → localStorage.
// ══════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { useNavigate } from "@/lib/router-bridge";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AlertCircle,
  Loader2,
  Store,
  Bike,
  ShieldCheck,
  User,
} from "lucide-react";

const ROLES = [
  {
    id: "customer",
    label: "Müşteri",
    desc: "Sipariş ver, mağazaları keşfet",
    icon: User,
    color: "border-[#6C3BFF] text-[#6C3BFF] bg-purple-50",
    route: "/",
  },
  {
    id: "merchant",
    label: "Satıcı",
    desc: "Mağaza aç, ürün ve sipariş yönet",
    icon: Store,
    color: "border-blue-500 text-blue-600 bg-blue-50",
    route: "/merchant",
  },
  {
    id: "courier",
    label: "Kurye",
    desc: "Siparişleri teslim et, kazan",
    icon: Bike,
    color: "border-[#00C2A8] text-[#00C2A8] bg-cyan-50",
    route: "/courier",
  },
  {
    id: "admin",
    label: "Admin",
    desc: "Sistemi yönet, mağazaları onayla",
    icon: ShieldCheck,
    color: "border-orange-400 text-orange-500 bg-orange-50",
    route: "/admin",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError("İsminizi girin."); return; }
    if (!selectedRole) { setError("Bir rol seçin."); return; }

    setError("");
    setLoading(true);
    try {
      await signIn({ name: name.trim(), role: selectedRole.id });
      navigate(selectedRole.route, { replace: true });
    } catch (err) {
      setError(err.message || "Giriş başarısız. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F7FB] p-4">
      <Card className="w-full max-w-md rounded-2xl border-0 shadow-xl">
        <CardHeader className="pb-2 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6C3BFF] to-[#00C2A8]">
            <span className="text-2xl font-extrabold text-white">SK</span>
          </div>
          <CardTitle className="text-2xl font-extrabold text-[#1A1A1A]">
            SestaKibris'e Hoş Geldiniz
          </CardTitle>
          <CardDescription className="text-gray-500">
            Devam etmek için adınızı girin ve rolünüzü seçin
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">
                Adınız Soyadınız
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Mehmet Yılmaz"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12 rounded-xl"
                data-testid="login-name"
              />
            </div>

            {/* Role picker */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Rolünüzü Seçin</Label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const active = selectedRole?.id === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      data-testid={`role-${r.id}`}
                      className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all ${
                        active
                          ? r.color + " shadow-sm"
                          : "border-[#E5E7EB] bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-bold">{r.label}</span>
                      </div>
                      <span className="text-[10px] leading-tight opacity-70">
                        {r.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !name.trim() || !selectedRole}
              className="h-14 w-full rounded-full bg-[#6C3BFF] text-base font-bold text-white hover:bg-[#582CD6] disabled:opacity-50"
              data-testid="login-submit"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Devam Et"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
