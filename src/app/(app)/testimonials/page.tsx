
'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  MoreHorizontal, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Eye, 
  Star, 
  MessageSquare,
  Globe,
  Search,
  Filter,
  ShieldAlert
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Testimonial } from '@/lib/types';
import { updateTestimonialStatusAction, deleteTestimonialAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const statusColorMap: Record<string, string> = {
  'pending': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'approved': 'bg-green-600/10 text-green-600 border-green-600/20',
  'rejected': 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function TestimonialModerationPage() {
  const firestore = useFirestore();
  const testimonialQuery = useMemo(() => (firestore ? query(collection(firestore, 'testimonials'), orderBy('createdAt', 'desc')) : null), [firestore]);
  const { data: testimonials, loading } = useCollection<Testimonial>(testimonialQuery);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingTestimonial, setViewingTestimonial] = useState<Testimonial | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const counts = useMemo(() => {
    if (!testimonials) return { pending: 0, approved: 0, rejected: 0, total: 0, avg: 0 };
    const stats = testimonials.reduce((acc, t) => {
        acc[t.status]++;
        acc.totalRating += t.rating;
        return acc;
    }, { pending: 0, approved: 0, rejected: 0, totalRating: 0 });
    
    return {
        ...stats,
        total: testimonials.length,
        avg: testimonials.length ? (stats.totalRating / testimonials.length).toFixed(1) : 0
    };
  }, [testimonials]);

  const filtered = useMemo(() => {
    if (!testimonials) return [];
    return testimonials.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.testimonial.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [testimonials, searchTerm]);

  const handleStatusChange = async (id: string, status: Testimonial['status']) => {
    setIsProcessing(true);
    try {
      await updateTestimonialStatusAction(id, status);
      toast({ title: 'Moderation Updated', description: `Record marked as ${status}.` });
      setViewingTestimonial(null);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Update Failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this story?')) return;
    setIsProcessing(true);
    try {
      await deleteTestimonialAction(id);
      toast({ title: 'Story Removed' });
      setViewingTestimonial(null);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Delete Failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <>
      <PageHeader title="Patron Stories" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {[
          { label: 'Total Stories', val: counts.total, color: 'text-stone-900', icon: Globe },
          { label: 'Awaiting Review', val: counts.pending, color: 'text-blue-600', icon: MessageSquare },
          { label: 'Public Stories', val: counts.approved, color: 'text-green-600', icon: CheckCircle2 },
          { label: 'Rejected', val: counts.rejected, color: 'text-red-500', icon: XCircle },
          { label: 'Average Appreciation', val: `${counts.avg}★`, color: 'text-amber-500', icon: Star },
        ].map(stat => (
          <Card key={stat.label} className="border-none shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className={cn("text-3xl font-bold font-headline", stat.color)}>{stat.val}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden">
        <CardHeader className="p-8 border-b bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-headline">Testimonial Library</CardTitle>
            <CardDescription>Review and moderate artisan patron feedback.</CardDescription>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by patron or content..." 
              className="pl-10 h-11 rounded-xl" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10">
                <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest">Patron</TableHead>
                <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest text-center">Appreciation</TableHead>
                <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest">Story Extract</TableHead>
                <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest text-center">Status</TableHead>
                <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} className="group hover:bg-muted/5 transition-colors">
                  <TableCell className="p-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border-2 border-stone-100">
                        <AvatarImage src={t.photoUrl} />
                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">{t.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm">{t.name}</p>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter">{t.city}, {t.country}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-6 text-center">
                    <div className="flex justify-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("h-3 w-3", i < t.rating ? "fill-amber-500 text-amber-500" : "text-stone-200")} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="p-6">
                    <p className="text-xs text-stone-600 italic line-clamp-2 leading-relaxed">"{t.testimonial}"</p>
                  </TableCell>
                  <TableCell className="p-6 text-center">
                    <Badge variant="outline" className={cn("rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest border-2", statusColorMap[t.status])}>
                        {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-xl">
                        <DropdownMenuItem onClick={() => setViewingTestimonial(t)}><Eye className="h-4 w-4 mr-2" /> View Full Story</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(t.id, 'approved')} className="text-green-600 font-bold"><CheckCircle2 className="h-4 w-4 mr-2" /> Approve for Web</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(t.id, 'rejected')} className="text-rose-500"><XCircle className="h-4 w-4 mr-2" /> Reject Submission</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(t.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Final Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="py-20 text-center text-stone-400 italic font-headline text-xl">No stories match your criteria.</div>
          )}
        </CardContent>
      </Card>

      {/* Moderation Detail Dialog */}
      <Dialog open={!!viewingTestimonial} onOpenChange={() => setViewingTestimonial(null)}>
        <DialogContent className="sm:max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          {viewingTestimonial && (
            <>
              <div className="bg-stone-900 p-8 text-white">
                <DialogHeader>
                    <div className="flex items-center gap-3 text-primary mb-2">
                        <MessageSquare className="h-6 w-6" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Submission Detail</span>
                    </div>
                    <DialogTitle className="text-3xl font-headline">Patron Reflection</DialogTitle>
                </DialogHeader>
              </div>

              <ScrollArea className="max-h-[60vh]">
                <div className="p-10 space-y-10">
                   <div className="flex flex-col md:flex-row gap-8">
                      <Avatar className="h-24 w-24 border-4 border-stone-50 shadow-xl rounded-[2rem]">
                        <AvatarImage src={viewingTestimonial.photoUrl} className="object-cover" />
                        <AvatarFallback className="bg-primary/5 text-primary text-3xl font-bold">
                            {viewingTestimonial.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold font-headline">{viewingTestimonial.name}</h3>
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={cn("h-4 w-4", i < viewingTestimonial.rating ? "fill-amber-500 text-amber-500" : "text-stone-100")} />
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">Origin</p>
                                <p className="text-sm font-bold">{viewingTestimonial.city}, {viewingTestimonial.country}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">Language</p>
                                <Badge variant="secondary" className="uppercase text-[9px]">{viewingTestimonial.language}</Badge>
                            </div>
                        </div>
                      </div>
                   </div>

                   <div className="bg-stone-50 p-8 rounded-[2rem] border border-stone-100 space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Globe className="h-3 w-3" /> Patron Experience
                      </p>
                      <p className="text-lg font-light leading-relaxed italic text-stone-700">
                        "{viewingTestimonial.testimonial}"
                      </p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 border-b pb-2">Technical Context</h4>
                        <div className="space-y-3">
                            {viewingTestimonial.occasion && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-500">Occasion:</span>
                                    <span className="font-bold">{viewingTestimonial.occasion}</span>
                                </div>
                            )}
                            {viewingTestimonial.product && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-500">Product:</span>
                                    <span className="font-bold">{viewingTestimonial.product}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-stone-500">Submitted:</span>
                                <span className="font-bold">{format(new Date(viewingTestimonial.createdAt), 'PPP')}</span>
                            </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 border-b pb-2">Patron Identity (Private)</h4>
                        <div className="space-y-3">
                            {viewingTestimonial.email ? (
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-stone-400 uppercase">Email Address</span>
                                    <span className="text-sm font-bold break-all">{viewingTestimonial.email}</span>
                                </div>
                            ) : (
                                <p className="text-xs text-stone-400 italic">No email provided.</p>
                            )}
                            {viewingTestimonial.phone && (
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-stone-400 uppercase">Phone Contact</span>
                                    <span className="text-sm font-bold">{viewingTestimonial.phone}</span>
                                </div>
                            )}
                        </div>
                      </div>
                   </div>
                </div>
              </ScrollArea>

              <div className="p-8 border-t bg-stone-50 flex flex-col md:flex-row gap-4 shrink-0">
                  <div className="flex-1 flex gap-4">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-2xl h-14 font-bold" 
                      onClick={() => handleStatusChange(viewingTestimonial.id, 'approved')}
                      disabled={isProcessing || viewingTestimonial.status === 'approved'}
                    >
                      Approve Story
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-2xl h-14 font-bold text-rose-500 border-rose-200" 
                      onClick={() => handleStatusChange(viewingTestimonial.id, 'rejected')}
                      disabled={isProcessing || viewingTestimonial.status === 'rejected'}
                    >
                      Reject Story
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="h-14 px-8 rounded-2xl text-stone-400 hover:text-destructive" 
                    onClick={() => handleDelete(viewingTestimonial.id)}
                    disabled={isProcessing}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
