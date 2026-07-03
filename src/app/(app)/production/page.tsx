'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Loader2, BookOpen, Sparkles } from 'lucide-react';
import type { Order, Product, Recipe, OrderHistoryItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, updateDoc, arrayUnion, setDoc, query, where, getDocs } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const productionStatuses = [
  'New Order for Production',
  'Production Started',
  'Production Ongoing',
  'Production Complete',
  'Product Packaging Complete',
  'Product Ready'
];

const statusColorMap: Record<string, string> = {
  'New Order for Production': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Production Started': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Production Ongoing': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'Production Complete': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'Product Packaging Complete': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'Product Ready': 'bg-green-600 text-white border-green-700',
};

export default function ProductionPage() {
  const firestore = useFirestore();
  const ordersQuery = useMemo(() => (firestore ? collection(firestore, 'orders') : null), [firestore]);
  const productsQuery = useMemo(() => (firestore ? collection(firestore, 'products') : null), [firestore]);
  const recipesQuery = useMemo(() => (firestore ? collection(firestore, 'recipes') : null), [firestore]);
  
  const { data: orders, loading: ordersLoading } = useCollection<Order>(ordersQuery);
  const { data: products } = useCollection<Product>(productsQuery);
  const { data: recipes } = useCollection<Recipe>(recipesQuery);

  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [recipeSelectionOrder, setRecipeSelectionOrder] = useState<Order | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  
  const { toast } = useToast();

  const productionOrders = useMemo(() => {
    return orders?.filter(o => productionStatuses.includes(o.deliveryStatus)) || [];
  }, [orders]);

  const getProductName = (productId: string) => {
    return products?.find(p => p.id === productId)?.name || 'Unknown Product';
  }

  const handleUpdateStatus = (order: Order, status: Order['deliveryStatus'], recipe?: Recipe) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', order.id);
    
    let adminName = 'Admin';
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        adminName = user.name || 'Admin';
      }
    } catch (e) {}

    const historyItem: OrderHistoryItem = {
      status,
      timestamp: new Date().toISOString(),
      adminName: adminName,
    };

    if (recipe) {
      historyItem.recipeId = recipe.id;
      historyItem.recipeName = recipe.name;
    }

    const updateData: any = { 
      deliveryStatus: status,
      history: arrayUnion(historyItem)
    };

    // Integration: When production is done, add it to the Shipping list automatically
    if (status === 'Product Ready') {
      updateData.shippingStatus = 'Ready for Dispatch';
    }

    if (recipe) {
      updateData.recipeId = recipe.id;
      updateData.recipeName = recipe.name;
    }

    updateDoc(orderRef, updateData)
      .then(() => {
        // Automation: When status is "Product Ready", sync with Products and Inventory
        if (status === 'Product Ready') {
          syncProductionToProducts(order, recipe);
        }
        
        toast({ title: 'Stage Updated', description: `Order ${order.id} is now in '${status}' stage.` });
        setRecipeSelectionOrder(null);
        setSelectedRecipeId('');
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: orderRef.path,
          operation: 'update',
          requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const syncProductionToProducts = async (order: Order, readyRecipe?: Recipe) => {
    if (!firestore) return;

    const now = new Date().toISOString();
    const packagingDate = order.history?.find(h => h.status === 'Product Packaging Complete')?.timestamp || now;
    const recipeUsed = readyRecipe?.name || order.history?.find(h => h.status === 'Production Started')?.recipeName || 'Artisan Secret Formulation';

    for (const item of order.products) {
      const productRef = doc(firestore, 'products', item.productId);
      
      const productUpdate: Partial<Product> = {
        productionStatus: 'Product Ready',
        sku: `RB-BATCH-${order.id.split('-').pop()}`,
        recipeUsed: recipeUsed,
        productionDate: now.split('T')[0],
        packagingDate: packagingDate.split('T')[0],
        quantityProduced: item.quantity,
        unitOfMeasurement: 'Units',
        originalOrderId: order.id,
        availabilityStatus: 'In Stock'
      };

      setDoc(productRef, productUpdate, { merge: true });

      const productName = getProductName(item.productId);
      const inventoryRef = collection(firestore, 'inventory');
      const q = query(inventoryRef, where('name', '==', productName), where('category', '==', 'Finished Products'));
      
      try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const invDoc = querySnapshot.docs[0];
          const currentStock = invDoc.data().stockLevel || 0;
          updateDoc(invDoc.ref, {
            stockLevel: currentStock + item.quantity,
            status: 'In Stock'
          });
        }
      } catch (e) {
        console.error('Inventory auto-sync error:', e);
      }
    }
  };

  const handleProductionStarted = (order: Order) => {
    setRecipeSelectionOrder(order);
  };

  const handleConfirmRecipe = () => {
    if (!recipeSelectionOrder || !selectedRecipeId) return;
    const recipe = recipes?.find(r => r.id === selectedRecipeId);
    if (!recipe) return;

    handleUpdateStatus(recipeSelectionOrder, 'Production Started', recipe);
  };

  if (ordersLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <>
       <Dialog open={!!viewingOrder} onOpenChange={(open) => !open && setViewingOrder(null)}>
        {viewingOrder && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Artisan Production Details</DialogTitle>
              <DialogDescription>Viewing specifications for order {viewingOrder.id}.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div>
                    <h4 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground">Customer</h4>
                    <p className="font-headline text-lg">{viewingOrder.customerName}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground">Products to Manufacture</h4>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                        {viewingOrder.products.map(p => (
                            <li key={p.productId}>{getProductName(p.productId)} <span className="text-muted-foreground font-mono">x{p.quantity}</span></li>
                        ))}
                    </ul>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground">Current Stage</h4>
                    <Badge variant="outline" className={cn("rounded-full px-3 py-1", statusColorMap[viewingOrder.deliveryStatus])}>
                        {viewingOrder.deliveryStatus}
                    </Badge>
                </div>
                {viewingOrder.statusReason && (
                   <div className="bg-muted p-3 rounded-lg border border-border">
                      <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Production Notes</p>
                      <p className="text-sm italic">{viewingOrder.statusReason}</p>
                   </div>
                )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={!!recipeSelectionOrder} onOpenChange={(open) => !open && setRecipeSelectionOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recipe Formulation Selection</DialogTitle>
            <DialogDescription>Select the artisanal recipe required to begin manufacturing this order.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
             <div className="space-y-2">
                <Label>Artisan Recipe</Label>
                <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select recipe..." />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes?.map(recipe => (
                      <SelectItem key={recipe.id} value={recipe.id}>{recipe.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
             {selectedRecipeId && (
               <div className="p-4 bg-muted/50 border rounded-xl animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-2">
                    <BookOpen className="h-3 w-3" /> Formulation Preview
                  </div>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    {recipes?.find(r => r.id === selectedRecipeId)?.ingredients.map((ing, i) => (
                      <li key={i}>{ing.name}: {ing.quantity}</li>
                    ))}
                  </ul>
               </div>
             )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRecipeSelectionOrder(null)}>Cancel</Button>
            <Button disabled={!selectedRecipeId} onClick={handleConfirmRecipe}>Initialize Production</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PageHeader title="Production Schedule" />
      <Card className="rounded-[2rem] overflow-hidden border-none shadow-xl">
        <CardHeader className="bg-muted/30 p-8 border-b">
            <CardTitle className="text-2xl font-headline">Active Production Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
        {productionOrders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10">
                <TableHead className="font-black uppercase text-[10px] tracking-widest p-6">Identity</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest p-6">Customer</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest p-6">Artisan Load</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest p-6">Status Indicator</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest p-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productionOrders.map((order) => (
                <TableRow key={order.id} className="group hover:bg-muted/5 transition-colors">
                  <TableCell className="p-6">
                    <div className="font-mono text-xs font-bold text-primary">{order.id}</div>
                    <div className="text-[10px] text-muted-foreground">{order.orderDate}</div>
                  </TableCell>
                  <TableCell className="p-6">
                    <div className="font-medium">{order.customerName}</div>
                  </TableCell>
                  <TableCell className="p-6">
                    <div className="text-xs space-y-1">
                        {order.products.map(p => (
                            <div key={p.productId} className="flex gap-2">
                                <span className="font-bold">{p.quantity}x</span>
                                <span className="text-muted-foreground truncate max-w-[150px]">{getProductName(p.productId)}</span>
                            </div>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell className="p-6">
                    <button 
                      onClick={() => order.deliveryStatus === 'New Order for Production' && setViewingOrder(order)}
                      className={cn(
                        "rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest border-2 transition-all",
                        statusColorMap[order.deliveryStatus],
                        order.deliveryStatus === 'New Order for Production' ? 'hover:scale-105 active:scale-95 cursor-pointer shadow-sm' : 'cursor-default'
                      )}
                    >
                      {order.deliveryStatus}
                    </button>
                  </TableCell>
                  <TableCell className="p-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => setViewingOrder(order)}>
                          View Order Details
                        </DropdownMenuItem>
                        <Separator className="my-1" />
                        <DropdownMenuItem onClick={() => handleProductionStarted(order)}>
                          Production Started
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'Production Ongoing')}>
                          Production Ongoing
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'Production Complete')}>
                          Production Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'Product Packaging Complete')}>
                          Product Packaging Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'Product Ready')} className="bg-primary/10 font-bold">
                          <Sparkles className="mr-2 h-4 w-4 text-primary" /> Product Ready
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          ) : (
            <div className="text-center py-20 text-muted-foreground bg-stone-50/50 rounded-b-[2rem]">
               <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 opacity-20" />
               <p className="font-headline text-xl italic">The production floor is currently silent.</p>
               <p className="text-xs uppercase tracking-widest mt-2">New batches will appear here as they are confirmed.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
