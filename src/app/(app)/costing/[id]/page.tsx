'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Costing } from '@/lib/types';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  Loader2, 
  Calculator, 
  ShieldCheck, 
  History,
  Layers,
  Component,
  Users,
  Package,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function CostingViewPage() {
  const params = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const id = params.id as string;

  const costingRef = useMemo(() => (firestore ? doc(firestore, 'costings', id) : null), [firestore, id]);
  const { data: costing, loading } = useDoc<Costing>(costingRef as any);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  if (!costing) return <div className="p-20 text-center text-stone-400 font-headline text-xl italic">Costing record not found in the artisan vault.</div>;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/costing')} className="rounded-full h-12 w-12 border-2"><ArrowLeft className="h-5 w-5" /></Button>
          <div className="space-y-1">
             <h1 className="text-3xl font-headline font-bold">Cost Breakdown Sheet</h1>
             <p className="text-[10px] uppercase font-black tracking-widest text-stone-400">Simulation Record {costing.id}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-12 rounded-xl px-6" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Sheet</Button>
          <Button variant="outline" className="h-12 rounded-xl px-6"><Download className="mr-2 h-4 w-4" /> Export PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
        <div className="lg:col-span-8 space-y-8">
          <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden print:shadow-none print:border">
            <CardHeader className="p-10 bg-muted/30 border-b flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-3xl font-headline">{costing.productName}</CardTitle>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400">
                    <Component className="h-3 w-3" /> Code: {costing.productCode || 'N/A'}
                    <span className="h-1 w-1 rounded-full bg-stone-200" />
                    <History className="h-3 w-3" /> Ver {costing.version}
                </div>
              </div>
              <Badge className="rounded-full px-6 py-2 bg-green-600/10 text-green-700 border-2 border-green-600/20 font-black uppercase tracking-widest">{costing.status}</Badge>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Formulation Used</p>
                    <p className="font-bold">{costing.recipeName} (V{costing.recipeVersion})</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Batch Yield</p>
                    <p className="font-bold">{costing.productionYield} Finished Units</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Record Created</p>
                    <p className="font-bold">{format(new Date(costing.createdAt), 'MMMM d, yyyy')}</p>
                  </div>
               </div>

               <Separator />

               <div className="space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Layers className="h-4 w-4" /> Material Cost Breakdown
                  </h3>
                  <div className="bg-stone-50 rounded-2xl border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-stone-100/50">
                          <TableHead className="text-[9px] font-black uppercase p-4">Component</TableHead>
                          <TableHead className="text-[9px] font-black uppercase p-4 text-center">Measured Quantity</TableHead>
                          <TableHead className="text-[9px] font-black uppercase p-4 text-center">Market Rate (Snapshot)</TableHead>
                          <TableHead className="text-[9px] font-black uppercase p-4 text-right">Extended Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costing.results.ingredientBreakdown?.map((item) => (
                          <TableRow key={item.ingredientId}>
                            <TableCell className="p-4 font-bold text-xs">
                                {item.name}
                                {item.missingPrice && <AlertTriangle className="inline h-3 w-3 ml-2 text-amber-500" />}
                            </TableCell>
                            <TableCell className="p-4 text-center text-xs tabular-nums">{item.quantity} {item.unit}</TableCell>
                            <TableCell className="p-4 text-center text-xs tabular-nums text-stone-400">₹{item.rate} / {item.rateUnit}</TableCell>
                            <TableCell className="p-4 text-right text-xs font-bold tabular-nums">₹{item.cost.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-end gap-10 text-xs">
                     <div className="text-right">
                        <span className="text-stone-400 uppercase font-black tracking-widest block text-[8px] mb-1">Base Material Load</span>
                        <span className="font-bold text-lg">₹{costing.results.rawMaterialCost.toFixed(2)}</span>
                     </div>
                     <div className="text-right">
                        <span className="text-stone-400 uppercase font-black tracking-widest block text-[8px] mb-1">With {costing.snapshot.wastagePercent}% Wastage</span>
                        <span className="font-bold text-lg text-primary">₹{costing.results.adjustedRawMaterialCost.toFixed(2)}</span>
                     </div>
                  </div>
               </div>

               <Separator />

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Users className="h-4 w-4" /> Labour Assumption
                    </h3>
                    <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                          <span className="text-stone-500">Personnel count:</span>
                          <span className="font-bold">{costing.numWorkers} Artisans</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-stone-500">Effort logged:</span>
                          <span className="font-bold">{costing.labourHours} Hours</span>
                       </div>
                       <div className="flex justify-between border-t pt-2">
                          <span className="text-stone-500 font-bold">Total Labour Cost:</span>
                          <span className="font-bold text-primary">₹{costing.results.totalLabourCost.toFixed(2)}</span>
                       </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Package className="h-4 w-4" /> Packaging Materials
                    </h3>
                    <div className="space-y-2 text-sm">
                       {Object.entries(costing.snapshot.packagingCosts).map(([type, cost]) => (
                         <div key={type} className="flex justify-between">
                            <span className="text-stone-500 capitalize">{type} Packaging:</span>
                            <span className="font-bold">₹{(cost as number).toFixed(2)}</span>
                         </div>
                       ))}
                       <div className="flex justify-between border-t pt-2">
                          <span className="text-stone-500 font-bold">Total Packaging:</span>
                          <span className="font-bold text-primary">₹{costing.results.totalPackagingCost.toFixed(2)}</span>
                       </div>
                    </div>
                  </div>
               </div>
            </CardContent>
            <CardFooter className="bg-stone-900 text-white p-10 flex flex-col items-center gap-6">
                <div className="flex flex-col items-center gap-2 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Certified Basic Manufacturing Cost</p>
                    <p className="text-7xl font-bold font-headline tabular-nums">₹{costing.results.costPerUnit.toFixed(2)}</p>
                    <div className="flex items-center gap-4">
                        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Value Per Finished Unit</p>
                        {costing.results.costPer100g > 0 && (
                            <>
                                <Separator orientation="vertical" className="h-3 bg-stone-700" />
                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">₹{costing.results.costPer100g.toFixed(2)} / 100g</p>
                            </>
                        )}
                    </div>
                </div>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8 print:hidden">
           <Card className="rounded-[2.5rem] border-none shadow-2xl bg-stone-50 overflow-hidden sticky top-28">
              <CardHeader className="p-10 border-b bg-white">
                 <CardTitle className="text-2xl font-headline">Pricing Model</CardTitle>
                 <CardDescription>Estimated market positioning.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                 <div className="space-y-6">
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-stone-500">Artisan Profit ({costing.pricing?.desiredProfitPercent}%)</span>
                       <span className="font-bold text-green-600">Calculated</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-stone-500">Channel Margin ({costing.pricing?.distributorMarginPercent}%)</span>
                       <span className="font-bold text-amber-600">Calculated</span>
                    </div>
                    <Separator />
                    <div className="text-center space-y-3">
                       <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Suggested Listing Price</p>
                       <p className="text-5xl font-bold font-headline text-stone-900">₹{costing.pricing?.suggestedRetailPrice.toFixed(0)}</p>
                    </div>
                 </div>
                 
                 <div className="pt-6 border-t">
                    <div className="bg-white p-6 rounded-2xl border border-dashed text-center space-y-2">
                        <ShieldCheck className="h-6 w-6 mx-auto text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Security Snapshot</p>
                        <p className="text-xs text-stone-500 italic">This record was authorized by {costing.createdBy} and reflects market conditions on the date of simulation.</p>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </>
  );
}
