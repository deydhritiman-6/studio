'use client';

import React, { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  sendPasswordResetEmail,
  signOut,
  reload
} from 'firebase/auth';
import { useAuth, useUser } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, Sparkles, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

type AuthView = 'sign-in' | 'sign-up' | 'verify-email' | 'forgot-password';

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onOpenChange, onSuccess }: AuthModalProps) {
  const [view, setView] = useState<AuthView>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();

  // Reset state when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView('sign-in');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setIsLoading(false);
      }, 300);
    }
  }, [isOpen]);

  // Handle auto-transition to verification screen if user is logged in but not verified
  useEffect(() => {
    if (user && !user.emailVerified && !user.isAnonymous && isOpen) {
      setView('verify-email');
    }
  }, [user, isOpen]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user.emailVerified) {
        toast({ title: "Welcome back!", description: "Access granted to the artisan collection." });
        onSuccess?.();
        onOpenChange(false);
      } else {
        setView('verify-email');
      }
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords mismatch", description: "Please ensure both passwords match." });
      return;
    }
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setView('verify-email');
      toast({ title: "Account Created", description: "A verification email has been sent to your inbox." });
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Reset Link Sent", description: "Check your email to reset your access key." });
      setView('sign-in');
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkVerification = async () => {
    if (!auth?.currentUser) return;
    setIsVerifying(true);
    try {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        toast({ title: "Email Verified", description: "Welcome to the Roseberry family!" });
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast({ variant: "destructive", title: "Still Unverified", description: "Please check your inbox and click the verification link." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not refresh verification status." });
    } finally {
      setIsVerifying(false);
    }
  };

  const resendVerification = async () => {
    if (!auth?.currentUser) return;
    setIsLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast({ title: "Email Sent", description: "A new verification link is on its way." });
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthError = (error: any) => {
    let message = "An unexpected error occurred. Please try again.";
    const code = error.code;

    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      message = "Invalid email or password combination.";
    } else if (code === 'auth/email-already-in-use') {
      message = "This email is already registered. Please sign in.";
    } else if (code === 'auth/weak-password') {
      message = "Password should be at least 6 characters.";
    } else if (code === 'auth/invalid-email') {
      message = "Please enter a valid email address.";
    } else if (code === 'auth/too-many-requests') {
      message = "Too many attempts. Please try again later.";
    }

    toast({ variant: "destructive", title: "Authentication Issue", description: message });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-background">
        <div className="bg-stone-900 text-white p-8 pb-4 shrink-0 flex flex-col items-center text-center space-y-4">
          <Logo className="h-10 w-auto brightness-0 invert" />
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-headline font-bold">
              {view === 'sign-in' && "Artisan Access"}
              {view === 'sign-up' && "Join the Family"}
              {view === 'verify-email' && "Verify Your Story"}
              {view === 'forgot-password' && "Recover Access"}
            </DialogTitle>
            <DialogDescription className="text-stone-400 text-[10px] font-black uppercase tracking-[0.3em]">
              {view === 'verify-email' ? "Security Protocol" : "Certified Artisan Portal"}
            </DialogDescription>
          </div>
        </div>

        <div className="p-10 pt-6">
          {view === 'sign-in' && (
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="uppercase text-[9px] font-black tracking-widest text-muted-foreground ml-1">Workplace Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <Input type="email" placeholder="email@example.com" className="pl-10 h-12 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="uppercase text-[9px] font-black tracking-widest text-muted-foreground ml-1">Secret Key</Label>
                    <button type="button" onClick={() => setView('forgot-password')} className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-rose-700 transition-colors">Forgot?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <Input type="password" placeholder="••••••••" className="pl-10 h-12 rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white">
                {isLoading ? <Loader2 className="animate-spin" /> : <><ShieldCheck className="mr-2 h-5 w-5" /> Enter Boutique</>}
              </Button>
              <p className="text-center text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                New to Roseberry? <button type="button" onClick={() => setView('sign-up')} className="text-primary hover:underline">Create Account</button>
              </p>
            </form>
          )}

          {view === 'sign-up' && (
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="uppercase text-[9px] font-black tracking-widest text-muted-foreground ml-1">Email Address</Label>
                  <Input type="email" placeholder="your@email.com" className="h-12 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="uppercase text-[9px] font-black tracking-widest text-muted-foreground ml-1">Access Key</Label>
                    <Input type="password" placeholder="••••••••" className="h-12 rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="uppercase text-[9px] font-black tracking-widest text-muted-foreground ml-1">Confirm Key</Label>
                    <Input type="password" placeholder="••••••••" className="h-12 rounded-xl" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20">
                {isLoading ? <Loader2 className="animate-spin" /> : <><Sparkles className="mr-2 h-5 w-5" /> Join Collection</>}
              </Button>
              <p className="text-center text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                Already registered? <button type="button" onClick={() => setView('sign-in')} className="text-primary hover:underline">Sign In</button>
              </p>
            </form>
          )}

          {view === 'verify-email' && (
            <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="h-24 w-24 bg-primary/10 rounded-[2rem] flex items-center justify-center shadow-inner">
                <Mail className="h-10 w-10 text-primary animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold text-stone-800">Verify your indulgence</p>
                <p className="text-xs text-stone-500 leading-relaxed px-4">
                  We've sent a craft-protection link to <strong className="text-stone-900">{user?.email}</strong>. Please click it to continue your artisanal selection.
                </p>
              </div>
              
              <div className="w-full space-y-3">
                <Button onClick={checkVerification} disabled={isVerifying} className="w-full h-14 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg">
                  {isVerifying ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  I've Verified My Email
                </Button>
                <Button variant="outline" onClick={resendVerification} disabled={isLoading} className="w-full h-12 rounded-xl border-2 font-bold text-[10px] uppercase tracking-widest">
                  {isLoading ? <Loader2 className="animate-spin" /> : <><RefreshCw className="mr-2 h-3.5 w-3.5" /> Resend Link</>}
                </Button>
              </div>

              <button 
                type="button" 
                onClick={() => { signOut(auth!); setView('sign-in'); }} 
                className="text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-primary transition-colors"
              >
                Use different email
              </button>
            </div>
          )}

          {view === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-8">
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-100 flex gap-4">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                  <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed">Enter your registered email to receive a secure recovery key.</p>
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-[9px] font-black tracking-widest text-muted-foreground ml-1">Email Address</Label>
                  <Input type="email" placeholder="your@email.com" className="h-12 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <Button type="submit" disabled={isLoading} className="h-14 text-lg font-bold rounded-2xl shadow-xl">
                  {isLoading ? <Loader2 className="animate-spin" /> : "Send Recovery Key"}
                </Button>
                <button type="button" onClick={() => setView('sign-in')} className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">Return to Login</button>
              </div>
            </form>
          )}
        </div>

        <div className="p-6 bg-stone-50 border-t flex items-center justify-center gap-4">
           <ShieldCheck className="h-4 w-4 text-stone-300" />
           <span className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400">Secure Artisan Authentication Node</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
