"use client";
import React, { useState } from "react";
import { useNavigate, Link } from "@/lib/router-bridge";
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
  ChevronDown,
} from "lucide-react";

const ROLE_ROUTES = {
  admin: "/admin",
  merchant: "/merchant",
  courier: "/courier",
  customer: "/",
};

const DEMO_ACCOUNTS = [
  {
    role: "customer",
    label: "Müşteri",
    email: "customer@sestakibris.com",
    icon: User,
    color: "bg-purple-50 text-[#6C3BFF] border-purple-200",
  },
  {
    role: "merchant",
    label: "Mağaza",
    email: "merchant@sestakibris.com",
    icon: Store,
    color: "bg-blue-50 text-blue-600 border-blue-200",
  },
  {
    role: "courier",
    label: "Kurye",
    email: "courier@sestakibris.com",
    icon: Bike,
    color: "bg-cyan-50 text-[#00C2A8] border-cyan-200",
  },
  {
    role: "admin",
    label: "Admin",
    email: "admin@sestakibris.com",
    icon: ShieldCheck,
    color: "bg-orange-50 text-orange-500 border-orange-200",
  },
];

const DEMO_PASSWORD = "123456";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [error, setError] = useState("");
  const [showCredentials, setShowCredentials] = useState(false);

  const doSignIn = async (e, emailOverride, passwordOverride) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await signIn(
        emailOverride ?? email,
        passwordOverride ?? password,
      );
      const { getUserRoles } = await import("@/services/auth.service");
      let primaryRole = "customer";
      try {
        const rolesData = await getUserRoles(user.id);
        if (rolesData.includes("admin")) primaryRole = "admin";
        else if (
          rolesData.includes("merchant_owner") ||
          rolesData.includes("merchant_staff")
        )
          primaryRole = "merchant";
        else if (rolesData.includes("courier")) primaryRole = "courier";
      } catch {
        // fallback to customer
      }
      navigate(ROLE_ROUTES[primaryRole] || "/", { replace: true });
    } catch (err) {
      setError(err.message || "Giriş başarısız. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account) => {
    setError("");
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);

    // Seed demo data first (idempotent — safe to call every time)
    setSeedingDemo(true);
    try {
      await fetch("/api/seed", { method: "POST" });
    } catch {
      // Seed failure is non-fatal; attempt login anyway
    } finally {
      setSeedingDemo(false);
    }

    await doSignIn(null, account.email, DEMO_PASSWORD);
  };

  const isSubmitting = loading || seedingDemo;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F7FB] p-4">
      <Card className="w-full max-w-md rounded-2xl border-0 shadow-xl">
        <CardHeader className="pb-2 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6C3BFF] to-[#00C2A8]">
            <span className="text-2xl font-extrabold text-white">SK</span>
          </div>
          <CardTitle className="text-2xl font-extrabold text-[#1A1A1A]">
            Giriş Yap
          </CardTitle>
          <CardDescription className="text-gray-500">
            SestaKibris hesabınıza giriş yapın
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* ── Demo accounts ─────────────────────────────── */}
          <div className="mb-5">
            <button
              type="button"
              onClick={() => setShowCredentials((v) => !v)}
              className="mb-3 flex w-full items-center justify-center gap-1 text-center text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
            >
              Demo Hesaplar
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${showCredentials ? "rotate-180" : ""}`}
              />
            </button>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => {
                const Icon = account.icon;
                return (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => handleDemoLogin(account)}
                    disabled={isSubmitting}
                    className={`tap flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-opacity disabled:opacity-60 ${account.color}`}
                    data-testid={`demo-${account.role}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-bold">{account.label}</span>
                    </div>
                    {showCredentials && (
                      <span className="text-[10px] opacity-70">
                        {account.email}
                        <br />
                        Şifre: {DEMO_PASSWORD}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {seedingDemo && (
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Demo hesap hazırlanıyor…
              </div>
            )}
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">
                veya e-posta ile giriş yap
              </span>
            </div>
          </div>

          <form onSubmit={doSignIn} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">
                E-posta
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl"
                data-testid="login-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">
                Şifre
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 rounded-xl"
                data-testid="login-password"
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-14 w-full rounded-full bg-[#6C3BFF] text-base font-bold text-white hover:bg-[#582CD6]"
              data-testid="login-submit"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Giriş Yap"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Hesabınız yok mu?{" "}
            <Link
              to="/register"
              className="font-semibold text-[#6C3BFF] hover:underline"
            >
              Kayıt Ol
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
