
'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Product } from '@/lib/types';
import { 
  Trash2, 
  RotateCcw, 
  Loader2, 
  Search,
  ShieldAlert,
  ArrowLeft,
  Calendar
} from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ProductBinPage() {
  const firestore = useFirestore();
  const productsQuery = useMemo(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const { data: allProducts, loading } = useCollection<Product>(productsQuery);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();

  const archivedProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts
      .filter(p => p.isArchived)
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime());
  }, [allProducts, searchTerm]);

  const handleRestore = (id: string) => {
    if (!firestore) return;
    const productRef = doc(firestore, 'products', id);
    updateDoc(productRef, { isArchived: false, deletedAt: null })
      .then(() => toast({ title: 'Creation Restored', description: 'Product is back in the active portfolio.' }))
      .catch((err) => console.error(err));
  };

  const handlePermanentDelete = (id: string) => {
    if (!firestore) return;
    setIsProcessing(true);
    const productRef = doc(firestore, 'products', id);
    
    deleteDoc(productRef)
      .then(() => {
        toast({ title: 'Record Destroyed', description: 'The artisanal record has been permanently deleted.' });
        setProductToDelete(null);
        setDeleteInput('');
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: productRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsProcessing(false));
  };

  return (
    <>
      <PageHeader 
        title="Product Bin" 
        actions={
          <Button asChild variant="ghost" className="rounded-xl">
            <Link href="/products">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Portfolio
            </Link>
          </Button>
        } 
      />

      <div className="grid grid-cols-1 gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search archived creations..." 
                className="pl-10 h-11 rounded-xl bg-card border-none shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
             <Trash2 className="h-4 w-4" /> {archivedProducts.length} Archived Records
           </div>
        </div>

        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
        ) : archivedProducts.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {archivedProducts.map((product) => (
              <Card key={product.id} className="flex flex-col group overflow-hidden border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[2rem] bg-card grayscale hover:grayscale-0 opacity-80 hover:opacity-100">
                <CardHeader className="p-0 relative">
                   <div className="block w-full aspect-[4/3] relative overflow-hidden">
                      <Image src={product.imageUrls?.[0] || 'https://picsum.photos/seed/default/400/300'} alt={product.name} fill className="object-cover" />
                    </div>
                    <div className="absolute top-4 left-4">
                        <Badge variant="destructive" className="bg-stone-900/80 backdrop-blur-md border-none uppercase tracking-[0.2em] text-[8px] font-black">Archived</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-6 flex-grow space-y-4">
                  <div className="space-y-1">
                     <CardTitle className="font-headline text-xl">{product.name}</CardTitle>
                     <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                        <Calendar className="h-3 w-3" /> Deleted {product.deletedAt ? format(new Date(product.deletedAt), 'MMM d, yyyy') : 'Recently'}
                     </div>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0 grid grid-cols-2 gap-3">
                  <Button variant="outline" className="rounded-2xl h-11 font-bold uppercase text-[9px] tracking-widest border-2" onClick={() => handleRestore(product.id)}>
                     <RotateCcw className="h-3 w-3 mr-1.5" /> Restore
                  </Button>
                  <Button variant="destructive" className="rounded-2xl h-11 font-bold uppercase text-[9px] tracking-widest shadow-lg shadow-destructive/10" onClick={() => setProductToDelete(product)}>
                     <Trash2 className="h-3 w-3 mr-1.5" /> Destroy
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed rounded-[2.5rem] bg-muted/30 border-border text-center px-4">
             <Trash2 className="h-16 w-16 text-muted-foreground opacity-20 mb-6" />
             <p className="text-muted-foreground font-headline text-2xl italic">The bin is currently empty.</p>
             <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2">Deleted records will appear here before permanent removal.</p>
          </div>
        )}
      </div>

      <Dialog open={!!productToDelete} onOpenChange={(o) => { if(!o) { setProductToDelete(null); setDeleteInput(''); } }}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
          <div className="bg-destructive/10 p-8 border-b border-destructive/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline flex items-center gap-3 text-destructive">
                <ShieldAlert className="h-8 w-8" />
                Permanent Removal
              </DialogTitle>
              <DialogDescription className="text-stone-600 font-medium">
                You are about to permanently destroy <strong className="text-stone-900 font-bold">{productToDelete?.name}</strong>. This record cannot be recovered.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-10 space-y-6">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Security Verification</Label>
              <p className="text-xs text-stone-500 italic">Type the word <span className="font-bold text-destructive underline">delete</span> manually to authorize final destruction.</p>
              <Input 
                placeholder="Type here..." 
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                className="h-14 rounded-2xl border-2 border-stone-200 focus:border-destructive/40 focus:ring-destructive/10 text-center text-lg font-bold tracking-widest"
              />
            </div>
            <div className="flex gap-4">
               <Button variant="ghost" onClick={() => setProductToDelete(null)} className="flex-1 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest" disabled={isProcessing}>Abort</Button>
               <Button 
                variant="destructive" 
                className="flex-2 px-10 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-destructive/20" 
                disabled={deleteInput.toLowerCase() !== 'delete' || isProcessing}
                onClick={() => productToDelete && handlePermanentDelete(productToDelete.id)}
               >
                 {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Final Destroy'}
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
