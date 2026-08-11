'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  PlusCircle, 
  Search, 
  MoreHorizontal, 
  Loader2, 
  BookOpen, 
  Copy, 
  Archive, 
  Trash2, 
  ChevronRight,
  Sparkles,
  ShieldCheck,
  History,
  ShieldAlert
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Recipe } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { duplicateRecipeAction, archiveRecipeAction, deleteRecipeAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const statusColors: Record<string, string> = {
  'Draft': 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  'Testing': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Approved': 'bg-green-600/10 text-green-600 border-green-600/20',
  'Published': 'bg-primary/10 text-primary border-primary/20',
  'Archived': 'bg-stone-500/10 text-stone-500 border-stone-500/20',
};

export default function RecipeManagementPage() {
  const firestore = useFirestore();
  const recipesQuery = useMemo(() => (firestore ? query(collection(firestore, 'recipes'), orderBy('updatedAt', 'desc')) : null), [firestore]);
  const { data: recipes, loading } = useCollection<Recipe>(recipesQuery);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [itemToDelete, setItemToDelete] = useState<Recipe | null>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];
    return recipes.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.productName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recipes, searchTerm]);

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateRecipeAction(id);
      toast({ title: 'Recipe Duplicated', description: 'Draft version created.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Action Failed' });
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteRecipeAction(itemToDelete.id);
      toast({ title: 'Recipe Removed' });
      setItemToDelete(null);
      setDeleteInput('');
    } catch (e) {
      toast({ variant: 'destructive', title: 'Action Failed' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <>
      <PageHeader 
        title="Recipe Formulation Suite" 
        actions={
          <Button asChild className="rounded-xl shadow-lg shadow-primary/20">
            <Link href="/recipes/add">
              <PlusCircle className="mr-2 h-4 w-4" /> New Formulation
            </Link>
          </Button>
        } 
      />

      <div className="grid grid-cols-1 gap-8">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search artisan recipes..." 
            className="pl-10 h-11 rounded-xl bg-card border-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Card className="rounded-[2rem] overflow-hidden border-none shadow-xl">
          <CardContent className="p-0">
            {filteredRecipes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10">
                    <TableHead className="p-8 uppercase text-[10px] font-black tracking-widest">Recipe Identity</TableHead>
                    <TableHead className="p-8 uppercase text-[10px] font-black tracking-widest text-center">Batch Configuration</TableHead>
                    <TableHead className="p-8 uppercase text-[10px] font-black tracking-widest">Allergens</TableHead>
                    <TableHead className="p-8 uppercase text-[10px] font-black tracking-widest text-center">Formulation Status</TableHead>
                    <TableHead className="p-8 uppercase text-[10px] font-black tracking-widest text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecipes.map((recipe) => (
                    <TableRow key={recipe.id} className="group hover:bg-muted/5 transition-colors">
                      <TableCell className="p-8">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold font-headline">{recipe.name}</h3>
                          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-stone-400">
                             <Sparkles className="h-3 w-3 text-primary" /> {recipe.productName || 'General Formulation'}
                             <Separator orientation="vertical" className="h-3" />
                             <History className="h-3 w-3" /> Ver {recipe.currentVersion}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-8 text-center">
                        <div className="inline-flex flex-col items-center bg-muted/30 px-6 py-2 rounded-2xl border">
                           <span className="text-xl font-bold font-headline">{recipe.batchSize} {recipe.batchUnit}</span>
                           <span className="text-[9px] font-black uppercase tracking-tighter text-stone-400">Standard Batch</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-8">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                           {recipe.allergens?.length > 0 ? (
                             recipe.allergens.map(a => <Badge key={a} variant="outline" className="text-[9px] border-rose-200 text-rose-600 bg-rose-50 font-bold">{a}</Badge>)
                           ) : (
                             <span className="text-[10px] italic text-stone-400">None detected</span>
                           )}
                        </div>
                      </TableCell>
                      <TableCell className="p-8 text-center">
                        <Badge variant="outline" className={cn("rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-2", statusColors[recipe.status])}>
                          {recipe.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-8 text-right">
                        <div className="flex justify-end gap-2">
                           <Button asChild variant="secondary" size="sm" className="rounded-xl h-10 px-6 hover:bg-primary hover:text-white transition-all shadow-sm">
                             <Link href={`/recipes/edit/${recipe.id}`}>Edit</Link>
                           </Button>
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 rounded-xl border-2">
                                <DropdownMenuItem onClick={() => handleDuplicate(recipe.id)}><Copy className="h-4 w-4 mr-2" /> Duplicate Draft</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => archiveRecipeAction(recipe.id)}><Archive className="h-4 w-4 mr-2" /> Archive Record</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setItemToDelete(recipe)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Final Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 space-y-6 text-center px-4">
                 <BookOpen className="h-16 w-16 text-stone-200" />
                 <div className="space-y-1">
                    <h4 className="text-2xl font-headline italic text-stone-400">The formulation log is silent.</h4>
                    <p className="text-[10px] uppercase font-black tracking-widest text-stone-300">Register your first artisan recipe to begin manufacturing.</p>
                 </div>
                 <Button asChild variant="outline" className="rounded-xl px-10 border-2">
                   <Link href="/recipes/add">Initialize First Formula</Link>
                 </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!itemToDelete} onOpenChange={(o) => { if(!o) { setItemToDelete(null); setDeleteInput(''); } }}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
          <div className="bg-destructive/10 p-8 border-b border-destructive/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline flex items-center gap-3 text-destructive">
                <ShieldAlert className="h-8 w-8" />
                Confirm Removal
              </DialogTitle>
              <DialogDescription className="text-stone-600 font-medium">
                Are you sure you want to permanently remove formulation <strong className="text-stone-900">{itemToDelete?.name}</strong>?
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-10 space-y-6">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Security Verification</Label>
              <p className="text-xs text-stone-500 italic">Type the word <span className="font-bold text-destructive underline">delete</span> manually to authorize removal.</p>
              <Input 
                placeholder="Type here..." 
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                className="h-14 rounded-2xl border-2 border-stone-200 focus:border-destructive/40 focus:ring-destructive/10 text-center text-lg font-bold tracking-widest"
              />
            </div>
            <div className="flex gap-4">
               <Button variant="ghost" onClick={() => setItemToDelete(null)} className="flex-1 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest" disabled={isDeleting}>Abort</Button>
               <Button 
                variant="destructive" 
                className="flex-2 px-10 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-destructive/20" 
                disabled={deleteInput.toLowerCase() !== 'delete' || isDeleting}
                onClick={confirmDelete}
               >
                 {isDeleting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Final Destroy'}
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}