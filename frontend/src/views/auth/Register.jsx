"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function Register() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Kayıt başarısız. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7FB] p-4">
        <Card className="w-full max-w-md shadow-xl rounded-2xl border-0 text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto w-16 h-16 bg-[#00C2A8]/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-[#00C2A8]" />
            </div>
            <h2 className="text-xl font-bold text-[#1A1A1A]">Kayıt Başarılı!</h2>
            <p className="text-gray-500 text-sm">
              E-posta adresinize doğrulama linki gönderildi. Lütfen e-postanızı kontrol edin.
            </p>
            <Button
              onClick={() => router.push('/login')}
              className="w-full h-14 rounded-full bg-[#6C3BFF] hover:bg-[#582CD6] text-white font-bold"
            >
              Giriş Sayfasına Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7FB] p-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-[#6C3BFF] to-[#00C2A8] rounded-2xl flex items-center justify-center">
            <span className="text-white font-extrabold text-2xl">SK</span>
          </div>
          <CardTitle className="text-2xl font-extrabold text-[#1A1A1A]">Kayıt Ol</CardTitle>
          <CardDescription className="text-gray-500">SestaKibris'e katılın</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-semibold">Ad Soyad</Label>
              <Input
                id="fullName" type="text" placeholder="Adınız Soyadınız"
                value={fullName} onChange={(e) => setFullName(e.target.value)}
                required className="rounded-xl h-12"
                data-testid="register-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">E-posta</Label>
              <Input
                id="email" type="email" placeholder="ornek@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required className="rounded-xl h-12"
                data-testid="register-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Şifre</Label>
              <Input
                id="password" type="password" placeholder="En az 6 karakter"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={6} className="rounded-xl h-12"
                data-testid="register-password"
              />
            </div>
            <Button
              type="submit" disabled={loading}
              className="w-full h-14 rounded-full bg-[#6C3BFF] hover:bg-[#582CD6] text-white font-bold text-base"
              data-testid="register-submit"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Kayıt Ol'}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Zaten hesabınız var mı?{' '}
            <Link href="/login" className="text-[#6C3BFF] font-semibold hover:underline">
              Giriş Yap
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
