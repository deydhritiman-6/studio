'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';

const userCredentials = {
  'Super Admin': {
    email: 'admin@roseberry.com',
    name: 'Admin User',
  },
  'Staff': {
    email: 'staff@roseberry.com',
    name: 'Staff User',
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const [role, setRole] = useState<'Super Admin' | 'Staff'>('Super Admin');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: 'Firebase Authentication is not initialized. Check your Firebase config.',
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // For the prototype, we sign in anonymously to ensure Firestore security rules 
      // (which usually check if auth != null) are satisfied.
      await signInAnonymously(auth);
      
      const userToLogin = userCredentials[role];
      localStorage.setItem('user', JSON.stringify({ name: userToLogin.name, email: userToLogin.email, role: role }));
      
      toast({
        title: 'Access Granted',
        description: `Welcome back to the Roseberry Ops command center.`,
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Unable to establish a secure connection to the database.';
      if (error.code === 'auth/api-key-not-valid') {
        errorMessage = 'The Firebase API key is invalid. Please update src/firebase/config.ts.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Anonymous sign-in is not enabled in your Firebase project settings.';
      }

      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4 bg-stone-50">
      <Card className="w-full max-w-sm shadow-2xl border-stone-100 rounded-[2rem]">
        <CardHeader className="text-center space-y-4 pt-10">
          <div className="flex justify-center">
             <Logo className="h-12" />
          </div>
          <CardTitle className="font-headline text-3xl text-stone-900 tracking-tight leading-tight">Master Control</CardTitle>
          <CardDescription className="text-stone-400 font-light">Select your role to access the Roseberry ecosystem.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-2">
          <form onSubmit={handleLogin} className="space-y-8">
            <RadioGroup value={role} onValueChange={(value: any) => setRole(value)} className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroupItem value="Super Admin" id="super-admin" className="peer sr-only" />
                <Label
                  htmlFor="super-admin"
                  className="flex cursor-pointer flex-col items-center justify-between rounded-2xl border-2 border-muted bg-popover p-4 text-xs font-bold uppercase tracking-widest hover:bg-stone-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary transition-all [&:has([data-state=checked])]:border-primary"
                >
                  Super Admin
                </Label>
              </div>
              <div>
                <RadioGroupItem value="Staff" id="staff" className="peer sr-only" />
                <Label
                  htmlFor="staff"
                  className="flex cursor-pointer flex-col items-center justify-between rounded-2xl border-2 border-muted bg-popover p-4 text-xs font-bold uppercase tracking-widest hover:bg-stone-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary transition-all [&:has([data-state=checked])]:border-primary"
                >
                  Kitchen Staff
                </Label>
              </div>
            </RadioGroup>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Identity</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={userCredentials[role].email}
                  disabled
                  className="bg-stone-50 border-stone-100 h-12 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Access Key</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value="password"
                  disabled
                  className="bg-stone-50 border-stone-100 h-12 rounded-xl"
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : `Enter Workspace`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
