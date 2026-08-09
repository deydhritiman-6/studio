
'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Loader2, Printer, FileText, Trash2, Send, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import type { Quotation } from '@/lib/types';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const statusColorMap: Record<string, string> = {
  'Draft': 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  'Sent': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Accepted': 'bg-green-700/10 text-green-700 border-green-700/20',
  'Expired': 'bg-red-500/10 text-red-500 border-red-500/20',
  'Converted to Order': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

export default function QuotationsListPage() {
  const firestore = useFirestore();
  const quotationsQuery = useMemo(() => (firestore ? collection(firestore, 'quotations') : null), [firestore]);
  const { data: quotations, loading } = useCollection<Quotation>(quotationsQuery);
  const { toast } = useToast();

  const handleUpdateStatus = (id: string, status: Quotation['status']) => {
    if (!firestore) return;
    const qRef = doc(firestore, 'quotations', id);
    updateDoc(qRef, { status })
      .then(() => toast({ title: 'Status Updated', description: `Quotation is now marked as ${status}.` }))
      .catch(() => toast({ variant: 'destructive', title: 'Update Failed' }));
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    deleteDoc(doc(firestore, 'quotations', id))
      .then(() => toast({ title: 'Quotation Deleted' }))
      .catch(() => toast({ variant: 'destructive', title: 'Delete Failed' }));
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <>
      <PageHeader 
        title="Artisan Quotations" 
        actions={
          <Button asChild className="rounded-xl shadow-lg shadow-primary/20">
            <Link href="/quotations/create">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Quotation
            </Link>
          </Button>
        } 
      />

      <Card className="rounded-[2rem] overflow-hidden border-none shadow-xl">
        <CardContent className="p-0">
          {quotations && quotations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest p-6">Reference</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest p-6">Patron</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest p-6">Validity</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest p-6">Total Value</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest p-6">Status</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest p-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((q) => (
                  <TableRow key={q.id} className="group hover:bg-muted/5 transition-colors">
                    <TableCell className="p-6">
                      <div className="font-mono text-xs font-bold text-primary">{q.id}</div>
                      <div className="text-[10px] text-muted-foreground">{q.date}</div>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="font-medium">{q.customerName}</div>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="text-xs font-bold">{q.expiryDate}</div>
                      <p className="text-[10px] text-muted-foreground">Expires on</p>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="font-bold">₹{q.totalAmount.toLocaleString('en-IN')}</div>
                    </TableCell>
                    <TableCell className="p-6">
                      <Badge variant="outline" className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest", statusColorMap[q.status])}>
                        {q.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => handleUpdateStatus(q.id, 'Sent')}>
                            <Send className="mr-2 h-4 w-4" /> Mark as Sent
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(q.id, 'Accepted')} className="text-green-600 font-bold">
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Accepted
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(q.id, 'Expired')} className="text-red-500">
                            <Clock className="mr-2 h-4 w-4" /> Mark Expired
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(q.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 text-center space-y-6">
              <FileText className="h-16 w-16 text-muted-foreground/20" />
              <div className="space-y-2">
                <h3 className="text-2xl font-headline italic text-muted-foreground">The quotation log is silent.</h3>
                <p className="text-xs uppercase tracking-widest text-muted-foreground/60">Generate your first artisan quotation to get started.</p>
              </div>
              <Button asChild variant="outline" className="rounded-xl px-10">
                <Link href="/quotations/create">Initialize First Quote</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

import { Clock, DropdownMenuSeparator } from 'lucide-react';
