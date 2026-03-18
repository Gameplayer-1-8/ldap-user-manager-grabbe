'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, ShieldCheck, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await axios.post('/api/auth/login', { password });
      // Nutze window.location für einen sauberen State-Reset nach Login
      window.location.href = '/users';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login fehlgeschlagen. Bitte prüfe das Passwort.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 relative overflow-hidden">
      {/* Dekorative Hintergründe */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

      <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-zinc-800 rounded-2xl border border-zinc-700 shadow-inner">
              <ShieldCheck className="w-10 h-10 text-blue-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Grabbe LDAP Portal
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Bitte melde dich mit dem LDAP-Admin Passwort an.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" title="Passwort" className="text-zinc-300">Admin Passwort</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-500 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20 text-center">
                {error}
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-6 rounded-xl transition-all shadow-lg shadow-blue-600/20"
                disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authentifizierung...
                </>
              ) : (
                'Anmelden'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className="absolute bottom-6 text-zinc-600 text-xs font-medium tracking-widest uppercase">
        Grabbe-Gymnasium Cloud • Admin Portal
      </div>
    </div>
  );
}
