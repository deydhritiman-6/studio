'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldAlert } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const userCredentials = {
  'Super Admin': {
    email: 'admin@roseberry.com',
    name: 'Admin User',
  },
  'Store Manager': {
    email: 'manager@roseberry.com',
    name: 'Manager User',
  },
  'Staff': {
    email: 'staff@roseberry.com',
    name: 'Staff User',
  }
}

type UserRole = 'Super Admin' | 'Store Manager' | 'Staff';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const [role, setRole] = useState<UserRole>('Super Admin');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // UseEffect hook to set mounted state to true after initial hydration
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
      // Sign in anonymously to satisfy Firestore security rules
      await signInAnonymously(auth);
      
      const userToLogin = userCredentials[role];
      localStorage.setItem('user', JSON.stringify({ name: userToLogin.name, email: userToLogin.email, role: role }));
      
      toast({
        title: 'Access Granted',
        description: `Welcome to the Roseberry Ops command center.`,
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      let message = 'An unexpected error occurred during authentication.';
      
      if (error.code === 'auth/api-key-not-valid') {
        message = 'The Firebase API key is invalid.';
      } else if (error.code === 'auth/operation-not-allowed') {
        message = 'Anonymous sign-in is disabled.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your connection.';
      }

      setAuthError(message);
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.message || 'Secure connection failed.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent hydration mismatch by returning a skeleton or placeholder until mounted
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-sm shadow-2xl border-border rounded-[2rem] animate-pulse">
          <div className="h-[400px] w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl border-border rounded-[2rem]">
        <CardHeader className="text-center space-y-4 pt-10">
          <div className="flex justify-center">
             <Logo className="h-12" />
          </div>
          <CardTitle className="font-headline text-3xl tracking-tight leading-tight">Master Control</CardTitle>
          <CardDescription className="text-muted-foreground font-light">Select your role to access the Roseberry ecosystem.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-2">
          {authError && (
            <Alert variant="destructive" className="mb-6 rounded-xl border-2">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle className="text-xs font-bold uppercase tracking-wider text-left">Access Denied</AlertTitle>
              <AlertDescription className="text-xs mt-1 leading-relaxed text-left">
                {authError}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-8">
            <RadioGroup value={role} onValueChange={(value: any) => setRole(value)} className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <RadioGroupItem value="Super Admin" id="super-admin" className="peer sr-only" />
                  <Label
                    htmlFor="super-admin"
                    className="flex h-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-3 text-[10px] font-black uppercase tracking-tighter text-center hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary transition-all"
                  >
                    Super Admin
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="Store Manager" id="store-manager" className="peer sr-only" />
                  <Label
                    htmlFor="store-manager"
                    className="flex h-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-3 text-[10px] font-black uppercase tracking-tighter text-center hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary transition-all"
                  >
                    Store Manager
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="Staff" id="staff" className="peer sr-only" />
                  <Label
                    htmlFor="staff"
                    className="flex h-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-3 text-[10px] font-black uppercase tracking-tighter text-center hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary transition-all"
                  >
                    Kitchen Staff
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identity</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={userCredentials[role].email}
                  readOnly
                  className="h-12 rounded-xl cursor-not-allowed opacity-70"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Access Key</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value="••••••••"
                  readOnly
                  className="h-12 rounded-xl cursor-not-allowed opacity-70"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95" 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : `Enter Workspace`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
