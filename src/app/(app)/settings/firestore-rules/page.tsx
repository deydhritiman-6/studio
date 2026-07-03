'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShieldCheck, Lock, Info, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const FIRESTORE_RULES = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Allow authenticated users to manage all data in this artisan system
    // This includes anonymous sessions for guests (to view products/place orders)
    // and Staff/Admin sessions.
    match /{document=**} {
      allow read, write: if isAuthenticated();
    }

    // Specific rules for collections
    match /products/{productId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    match /customers/{customerId} {
      allow read, write: if isAuthenticated();
    }

    match /orders/{orderId} {
      allow read, write: if isAuthenticated();
    }

    match /inventory/{itemId} {
      allow read, write: if isAuthenticated();
    }

    match /distributors/{distributorId} {
      allow read, write: if isAuthenticated();
    }

    match /recipes/{recipeId} {
      allow read, write: if isAuthenticated();
    }
  }
}`;

export default function FirestoreRulesPage() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES);
    setCopied(true);
    toast({ title: 'Rules Copied', description: 'Security rules have been copied to your clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <PageHeader 
        title="Firestore Security Rules" 
        actions={
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            Copy Rules
          </Button>
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl bg-stone-950 text-stone-300 rounded-[2rem] overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-stone-900/50 p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-headline text-stone-100 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    Security Definition
                  </CardTitle>
                  <CardDescription className="text-stone-500">The core logic protecting the Roseberry database.</CardDescription>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 uppercase tracking-widest text-[10px]">Version 2</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px] w-full">
                <pre className="p-8 font-code text-sm leading-relaxed overflow-x-auto text-emerald-400">
                  {FIRESTORE_RULES}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[2rem] shadow-md border-border">
            <CardHeader>
              <CardTitle className="text-lg font-headline">Policy Overview</CardTitle>
              <CardDescription>Understanding our security posture.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold uppercase tracking-tight">Identity Required</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">No data is accessible without a valid Firebase Authentication token.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <Info className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold uppercase tracking-tight">Anonymous Support</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">Guests are automatically issued anonymous credentials to safely view the catalog and place orders.</p>
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Affected Collections</h4>
                <div className="flex flex-wrap gap-2">
                  {['Products', 'Orders', 'Inventory', 'Customers', 'Recipes', 'Distributors'].map(tag => (
                    <Badge key={tag} variant="secondary" className="rounded-md font-medium">{tag}</Badge>
                  ))}
                </div>
              </div>

              <div className="bg-muted p-4 rounded-2xl text-[11px] leading-relaxed text-muted-foreground italic">
                "These rules ensure that while our workshop is transparent to our customers, our internal operations remain shielded from unauthorized tampering."
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
