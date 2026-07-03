'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useDoc } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, ShieldCheck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const visibilityStatuses = [
  { id: 'Order Confirmed', label: 'Order Confirmed' },
  { id: 'Sent for Production', label: 'Sent for Production' },
  { id: 'Order On Hold', label: 'Order On Hold' },
  { id: 'Order Rejected', label: 'Order Rejected' },
  { id: 'Production Started', label: 'Production Started' },
  { id: 'Production Ongoing', label: 'Production Ongoing' },
  { id: 'Production Complete', label: 'Production Complete' },
  { id: 'Product Packaging Complete', label: 'Packaging Complete' },
  { id: 'Product Ready', label: 'Product Ready' },
  { id: 'Ready for Dispatch', label: 'Product Ready for Dispatch' },
  { id: 'Dispatched', label: 'Product Dispatched' },
  { id: 'Delivered', label: 'Product Delivered' },
  { id: 'Expected Arrival Date', label: 'Expected Arrival Date' },
];

export default function TrackingVisibilityPage() {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const settingsRef = useMemo(() => (firestore ? doc(firestore, 'settings', 'tracking-visibility') : null), [firestore]);
  const { data: visibilitySettings, loading } = useDoc<any>(settingsRef as any);

  const handleVisibilityToggle = (id: string, checked: boolean) => {
    if (!firestore || !settingsRef) return;

    setIsSaving(true);
    const newSettings = {
      ...(visibilitySettings || {}),
      [id]: checked,
      updatedAt: new Date().toISOString()
    };

    setDoc(settingsRef, newSettings)
      .then(() => {
        toast({ title: 'Visibility Updated', description: 'Customer tracking milestones have been updated.' });
      })
      .catch(() => {
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Failed to save visibility settings.' });
      })
      .finally(() => setIsSaving(false));
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <>
      <PageHeader title="Customer Visibility Control" />
      
      <div className="grid grid-cols-1 gap-8">
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-stone-900 text-white overflow-hidden">
          <CardHeader className="p-10 pb-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-3xl font-headline flex items-center gap-3">
                  <Eye className="h-8 w-8 text-primary" />
                  Transparency Policy Console
                </CardTitle>
                <CardDescription className="text-stone-400">Define which artisanal milestones are shared with the patron in their live tracking dashboard.</CardDescription>
              </div>
              {isSaving && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            </div>
          </CardHeader>
          <CardContent className="p-10 pt-0">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibilityStatuses.map((status) => (
                  <div key={status.id} className="flex items-center space-x-3 bg-stone-800/50 p-6 rounded-2xl border border-stone-800 hover:border-primary/30 transition-all group">
                    <Checkbox 
                      id={`v-${status.id}`} 
                      checked={!!visibilitySettings?.[status.id]} 
                      onCheckedChange={(checked) => handleVisibilityToggle(status.id, !!checked)}
                      className="h-5 w-5 border-stone-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label 
                      htmlFor={`v-${status.id}`} 
                      className="text-sm font-bold uppercase tracking-tight cursor-pointer group-hover:text-primary transition-colors flex-1"
                    >
                      {status.label}
                    </label>
                  </div>
                ))}
             </div>
             <div className="mt-10 pt-8 border-t border-stone-800 flex items-center gap-4 text-stone-500">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Global Visibility Policy - Changes apply in real-time to all patron sessions.</p>
             </div>
          </CardContent>
        </Card>

        <div className="bg-muted/50 rounded-[2rem] p-10 border-2 border-dashed">
            <h4 className="text-lg font-headline font-bold mb-2">How this works</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
                When a team member updates an order's status in the production or logistics workspaces, it is logged in the order's history. 
                The toggles above act as a "whitelist"—only statuses checked here will be displayed to the customer when they view their 
                "Artisan Journey". This allows you to manage internal workflows privately while sharing important milestones with your patrons.
            </p>
        </div>
      </div>
    </>
  );
}
