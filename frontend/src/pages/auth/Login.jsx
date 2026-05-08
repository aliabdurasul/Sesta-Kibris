import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, primaryRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      // Redirect based on role
      const routes = { admin: '/admin', merchant: '/merchant', courier: '/courier', customer: '/customer' };
      navigate(routes[primaryRole] || '/customer', { replace: true });
    } catch (err) {
      setError(err.message || 'Giriş başarısız. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7FB] p-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-[#6C3BFF] to-[#00C2A8] rounded-2xl flex items-center justify-center">
            <span className="text-white font-extrabold text-2xl">SK</span>
          </div>
          <CardTitle className="text-2xl font-extrabold text-[#1A1A1A]">Giriş Yap</CardTitle>
          <CardDescription className="text-gray-500">SestaKibris hesabınıza giriş yapın</CardDescription>
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
              <Label htmlFor="email" className="text-sm font-semibold">E-posta</Label>
              <Input
                id="email" type="email" placeholder="ornek@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required className="rounded-xl h-12"
                data-testid="login-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Şifre</Label>
              <Input
                id="password" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={6} className="rounded-xl h-12"
                data-testid="login-password"
              />
            </div>
            <Button
              type="submit" disabled={loading}
              className="w-full h-14 rounded-full bg-[#6C3BFF] hover:bg-[#582CD6] text-white font-bold text-base"
              data-testid="login-submit"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Giriş Yap'}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Hesabınız yok mu?{' '}
            <Link to="/register" className="text-[#6C3BFF] font-semibold hover:underline">
              Kayıt Ol
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
