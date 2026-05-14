"use client";
// ══════════════════════════════════════════════════════════════
// Login — Supabase Auth (email + password)
// ══════════════════════════════════════════════════════════════

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
import { AlertCircle, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { primaryRole: freshRole } = await signIn(email.trim(), password);
      const next = searchParams.get("next");
      if (next && next.startsWith("/") && !next.startsWith("//")) {
        router.replace(next);
      } else {
        const roleRedirects = {
          admin: "/admin",
          merchant: "/merchant",
          courier: "/courier",
          customer: "/",
        };
        router.replace(roleRedirects[freshRole] || "/");
      }
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
            Giriş Yap
          </CardTitle>
          <CardDescription className="text-gray-500">
            E-posta ve şifrenizle devam edin
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                autoComplete="email"
                placeholder="ornek@posta.com"
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
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl"
                data-testid="login-password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-14 w-full rounded-full bg-[#6C3BFF] text-base font-bold text-white hover:bg-[#582CD6] disabled:opacity-50"
              data-testid="login-submit"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Giriş Yap"
              )}
            </Button>

            <p className="text-center text-sm text-gray-500">
              Hesabınız yok mu?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#6C3BFF] hover:underline"
              >
                Kayıt ol
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F7F7FB]">
          <Loader2 className="h-8 w-8 animate-spin text-[#6C3BFF]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
