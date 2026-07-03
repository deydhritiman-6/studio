'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!auth) {
      setAuthError('Firebase Authentication is not initialized.');
      return;
    }
    
    setIsLoading(true);

    try {
      await signInAnonymously(auth);
      
      localStorage.setItem('user', JSON.stringify({ 
        name: 'Admin User', 
        email: 'admin@roseberry.com', 
        role: 'Super Admin' 
      }));
      
      toast({
        title: 'Access Granted',
        description: 'Welcome to the Super Admin workspace.',
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      setAuthError(error.message || 'Secure connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl border-border rounded-[2rem]">
        <CardHeader className="text-center space-y-4 pt-10 relative">
          <Link href="/login" className="absolute left-6 top-10 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex justify-center">
             <Logo className="h-12" />
          </div>
          <CardTitle className="font-headline text-2xl tracking-tight leading-tight">Super Admin</CardTitle>
          <CardDescription className="text-muted-foreground font-light italic">Restricted Executive Access</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-2">
          {authError && (
            <Alert variant="destructive" className="mb-6 rounded-xl border-2">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle className="text-xs font-bold uppercase tracking-wider text-left">Access Denied</AlertTitle>
              <AlertDescription className="text-xs mt-1 leading-relaxed text-left">{authError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identity</Label>
                <Input value="admin@roseberry.com" readOnly className="h-12 rounded-xl bg-muted/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Access Key</Label>
                <Input type="password" value="••••••••" readOnly className="h-12 rounded-xl bg-muted/50" />
              </div>
            </div>
            <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Enter Workspace'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
