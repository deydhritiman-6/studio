'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  sendPasswordResetEmail,
  signOut,
  reload,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { useAuth, useUser, useFirestore } from '@/firebase';
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
import { 
  Loader2, 
  Mail, 
  Lock, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Phone,
  MessageSquare
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type AuthView = 'sign-in' | 'sign-up' | 'verify-email' | 'forgot-password' | 'verify-otp';
type AuthMethod = 'email' | 'mobile';

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onOpenChange, onSuccess }: AuthModalProps) {
  const [view, setView] = useState<AuthView>('sign-in');
  const [method, setMethod] = useState<AuthMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  // Reset state when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView('sign-in');
        setMethod('email');
        setEmail('');
        setPhone('+91');
        setOtp('');
        setPassword('');
        setConfirmPassword('');
        setIsLoading(false);
        setShowPassword(false);
        setConfirmationResult(null);
        if (recaptchaVerifier.current) {
          recaptchaVerifier.current.clear();
          recaptchaVerifier.current = null;
        }
      }, 300);
    }
  }, [isOpen]);

  // Handle reCAPTCHA initialization when switching to mobile
  useEffect(() => {
    if (isOpen && method === 'mobile' && !recaptchaVerifier.current && auth) {
      const initTimer = setTimeout(() => {
        initRecaptcha();
      }, 500); // Give DOM time to render the container
      return () => clearTimeout(initTimer);
    }
  }, [isOpen, method, auth]);

  const initRecaptcha = () => {
    if (!auth || recaptchaVerifier.current) return;
    const container = document.getElementById('recaptcha-container');
    if (!container) return;
    
    // Ensure container is clean
    container.innerHTML = '';
    
    try {
      recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          if (recaptchaVerifier.current) {
            recaptchaVerifier.current.clear();
            recaptchaVerifier.current = null;
          }
        }
      });
    } catch (e) {
      console.error('Recaptcha init failed', e);
    }
  };

  const syncCustomerProfile = async (uid: string, data: any) => {
    if (!firestore) return;
    const ref = doc(firestore, 'customers', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: uid,
        ...data,
        customerType: 'Regular',
        vipLevel: 'Silver',
        totalPurchaseValue: 0,
        joinedDate: new Date().toISOString().split('T')[0],
      });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    if (method === 'mobile') {
      handleSendOtp();
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user.emailVerified) {
        await syncCustomerProfile(userCredential.user.uid, { email });
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

    if (method === 'mobile') {
      handleSendOtp();
      return;
    }

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

  const handleSendOtp = async () => {
    if (!auth) return;
    
    // Simple E.164 check: +[country code][number]
    const cleanPhone = phone.trim();
    if (!cleanPhone.startsWith('+') || cleanPhone.length < 10) {
      toast({ variant: "destructive", title: "Invalid Mobile", description: "Please include country code (e.g. +91)." });
      return;
    }

    setIsLoading(true);
    if (!recaptchaVerifier.current) {
      initRecaptcha();
    }

    try {
      const result = await signInWithPhoneNumber(auth, cleanPhone, recaptchaVerifier.current!);
      setConfirmationResult(result);
      setView('verify-otp');
      toast({ title: "OTP Sent", description: "A verification code is on its way to your mobile." });
    } catch (error: any) {
      handleAuthError(error);
      // Reset reCAPTCHA on failure to allow retry
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
        recaptchaVerifier.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setIsLoading(true);

    try {
      const result = await confirmationResult.confirm(otp);
      await syncCustomerProfile(result.user.uid, { phoneNumber: phone });
      toast({ title: "Identity Verified", description: "Your artisan access is now active." });
      onSuccess?.();
      onOpenChange(false);
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
        await syncCustomerProfile(auth.currentUser.uid, { email: auth.currentUser.email });
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
    let message = "Something went wrong. Please try again.";
    const code = error.code;

    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      message = "Incorrect email or password.";
    } else if (code === 'auth/email-already-in-use') {
      message = "This email is already registered. Please sign in.";
    } else if (code === 'auth/weak-password') {
      message = "Password should be at least 6 characters.";
    } else if (code === 'auth/invalid-email') {
      message = "Please enter a valid email address.";
    } else if (code === 'auth/too-many-requests') {
      message = "Too many verification attempts. Please wait and try again.";
    } else if (code === 'auth/invalid-phone-number') {
      message = "Please enter a valid mobile number with country code.";
    } else if (code === 'auth/code-expired') {
      message = "Verification code expired. Please try again.";
    } else if (code === 'auth/invalid-verification-code') {
      message = "Incorrect verification code. Please try again.";
    } else if (code === 'auth/captcha-check-failed') {
      message = "reCAPTCHA verification failed. Please try again.";
    }

    toast({ variant: "destructive", title: "Indulgence Interrupted", description: message });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-background">
        {/* Hidden reCAPTCHA container - MUST BE INSIDE DIALOG CONTENT */}
        <div id="recaptcha-container" className="absolute pointer-events-none opacity-0"></div>
        
        <div className="bg-stone-900 text-white p-8 pb-4 shrink-0 flex flex-col items-center text-center space-y-4">
          <Logo className="h-10 w-auto" />
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-headline font-bold">
              {view === 'sign-in' && "Artisan Access"}
              {view === 'sign-up' && "Join the Family"}
              {view === 'verify-email' && "Verify Your Story"}
              {view === 'forgot-password' && "Recover Access"}
              {view === 'verify-otp' && "Confirm Mobile"}
            </DialogTitle>
            <DialogDescription className="text-stone-400 text-[10px] font-black uppercase tracking-[0.3em]">
              {view === 'verify-email' || view === 'verify-otp' ? "Security Protocol" : "Certified Artisan Portal"}
            </DialogDescription>
          </div>
        </div>

        <div className="p-10 pt-6">
          {(view === 'sign-in' || view === 'sign-up') && (
            <div className="flex bg-muted/50 p-1 rounded-xl mb-6">
               <button 
                onClick={() => setMethod('email')}
                className={cn(
                  "flex-1 h-9 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  method === 'email' ? "bg-white text-primary shadow-sm" : "text-stone-400 hover:text-stone-600"
                )}
               >
                 Email
               </button>
               <button 
                onClick={() => setMethod('mobile')}
                className={cn(
                  "flex-1 h-9 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  method === 'mobile' ? "bg-white text-primary shadow-sm" : "text-stone-400 hover:text-stone-600"
                )}
               >
                 Mobile Number
               </button>
            </div>
          )}

          {view === 'sign-in' && (
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-4">
                {method === 'email' ? (
                  <>
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
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          className="pl-10 pr-10 h-12 rounded-xl" 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          required 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label className="uppercase text-[9px] font-black tracking-widest text-muted-foreground ml-1">Mobile Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                      <Input type="tel" placeholder="+91 0000000000" className="pl-10 h-12 rounded-xl" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </div>
                  </div>
                )}
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white">
                {isLoading ? <Loader2 className="animate-spin" /> : <><ShieldCheck className="mr-2 h-5 w-5" /> {method === 'email' ? 'Enter Boutique' : 'Send OTP'}</>}
              </Button>
              <p className="text-center text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                New to Roseberry? <button type="button" onClick={() => setView('sign-up')} className="text-primary hover:underline">Create Account</button>
              </p>
            </form>
          )}

          {view === 'sign-up' && (
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="space-y-4">
                {method === 'email' ? (
                  <>
                    <div className="space-y-2">
                      <Label className="uppercase text-[9px] font-black tracking-widest text-muted-foreground ml-1">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                        <Input type="email" placeholder="your@email.com" className="pl-10 h-12 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="uppercase text-[9px] font-black tracking-widest text-muted-foreground ml-1">Access Key</Label>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            className="pr-10 h-12 rounded-xl" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="uppercase text-[9px] font-black tracking-widest text-muted-foreground ml-1">Confirm Key</Label>
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          className="h-12 rounded-xl" 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label className="uppercase text-[9px] font-black tracking-widest text-muted-foreground ml-1">Mobile Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                      <Input type="tel" placeholder="+91 0000000000" className="pl-10 h-12 rounded-xl" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </div>
                  </div>
                )}
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20">
                {isLoading ? <Loader2 className="animate-spin" /> : <><Sparkles className="mr-2 h-5 w-5" /> {method === 'email' ? 'Join Collection' : 'Verify Mobile'}</>}
              </Button>
              <p className="text-center text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                Already registered? <button type="button" onClick={() => setView('sign-in')} className="text-primary hover:underline">Sign In</button>
              </p>
            </form>
          )}

          {view === 'verify-otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
               <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-stone-800">Verification Sent</p>
                    <p className="text-xs text-stone-500">Enter the 6-digit code sent to {phone}</p>
                  </div>
               </div>
               
               <div className="space-y-2">
                  <Label className="uppercase text-[9px] font-black tracking-widest text-muted-foreground ml-1">Verification Code</Label>
                  <Input 
                    placeholder="000000" 
                    className="h-14 rounded-2xl text-center text-2xl tracking-[0.5em] font-black" 
                    maxLength={6} 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    required 
                  />
               </div>

               <div className="space-y-4">
                 <Button type="submit" disabled={isLoading || otp.length < 6} className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl">
                   {isLoading ? <Loader2 className="animate-spin" /> : "Verify & Enter"}
                 </Button>
                 <div className="flex justify-between items-center px-2">
                   <button type="button" onClick={handleSendOtp} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Resend OTP</button>
                   <button type="button" onClick={() => setView('sign-in')} className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-600">Change Number</button>
                 </div>
               </div>
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
