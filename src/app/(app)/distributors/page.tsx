'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { distributors as initialDistributors } from '@/lib/data';
import indianStates from '@/lib/indian-states.json';
import type { Distributor } from '@/lib/types';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

const distributorFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  region: z.string().min(1, 'Region is required'),
  state: z.string().min(1, 'State is required'),
  district: z.string().min(1, 'District is required'),
  status: z.enum(['Active', 'Inactive']),
});

type DistributorFormValues = z.infer<typeof distributorFormSchema>;

const getStatusBadgeClassName = (status: Distributor['status']) => {
    switch (status) {
        case 'Active':
            return 'bg-green-700 hover:bg-green-800';
        default:
            return '';
    }
}

const indianRegions = ['North India', 'South India', 'East India', 'West India', 'Central India', 'North-East India'];

export default function DistributorsPage() {
  const [distributors, setDistributors] = useState<Distributor[]>(() => {
    if (typeof window === 'undefined') {
      return initialDistributors;
    }
    try {
      const savedDistributors = localStorage.getItem('roseberry-distributors');
      return savedDistributors ? JSON.parse(savedDistributors) : initialDistributors;
    } catch (error) {
      console.error("Failed to read distributors from localStorage", error);
      return initialDistributors;
    }
  });
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('roseberry-distributors', JSON.stringify(distributors));
      } catch (error) {
        console.error("Failed to save distributors to localStorage", error);
      }
    }
  }, [distributors]);

  const [isAddOrEditDialogOpen, setIsAddOrEditDialogOpen] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState<Distributor | null>(null);
  const [viewingDistributor, setViewingDistributor] = useState<Distributor | null>(null);
  
  const { toast } = useToast();

  const form = useForm<DistributorFormValues>({
    resolver: zodResolver(distributorFormSchema),
  });

  const selectedRegion = form.watch('region');
  const selectedState = form.watch('state');

  const statesForSelectedRegion = useMemo(() => {
    if (!selectedRegion) {
      return [];
    }
    return indianStates.states.filter(s => s.region === selectedRegion);
  }, [selectedRegion]);

  const districtsForSelectedState = useMemo(() => {
    return statesForSelectedRegion.find(s => s.name === selectedState)?.districts || [];
  }, [selectedState, statesForSelectedRegion]);


  useEffect(() => {
    if (editingDistributor) {
      form.reset(editingDistributor);
    } else {
      form.reset({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        region: '',
        state: '',
        district: '',
        status: 'Active',
      });
    }
  }, [editingDistributor, form]);
  
  useEffect(() => {
    // When the region changes, reset state and district
    if (form.getValues('state') && !statesForSelectedRegion.some(s => s.name === form.getValues('state'))) {
      form.setValue('state', '');
      form.setValue('district', '');
    }
  }, [selectedRegion, statesForSelectedRegion, form]);

  useEffect(() => {
    // When the state changes, reset the district field
    if (form.getValues('district') && !districtsForSelectedState.includes(form.getValues('district'))) {
      form.setValue('district', '');
    }
  }, [selectedState, districtsForSelectedState, form]);

  const onDialogSubmit = (values: DistributorFormValues) => {
    if (editingDistributor) {
      const updatedDistributor: Distributor = {
        ...editingDistributor,
        ...values,
      };
      setDistributors(distributors.map(d => d.id === editingDistributor.id ? updatedDistributor : d));
      toast({ title: 'Distributor Updated', description: `${values.name}'s details have been updated.` });
    } else {
      const newDistributor: Distributor = {
        id: `D${String(distributors.length + 10).padStart(3, '0')}`,
        lastOrderDate: new Date().toISOString().split('T')[0],
        ...values,
      };
      setDistributors([newDistributor, ...distributors]);
      toast({ title: 'Distributor Added', description: `${values.name} has been added.` });
    }
    setIsAddOrEditDialogOpen(false);
    setEditingDistributor(null);
  };
  
  const handleOpenAddDialog = () => {
    setEditingDistributor(null);
    form.reset({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        region: '',
        state: '',
        district: '',
        status: 'Active',
    });
    setIsAddOrEditDialogOpen(true);
  };
  
  const handleOpenEditDialog = (distributor: Distributor) => {
    setEditingDistributor(distributor);
    setIsAddOrEditDialogOpen(true);
  };

  return (
    <>
      <PageHeader title="Distributors" actions={
        <Button onClick={handleOpenAddDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Distributor
        </Button>
      } />
      
      {/* View Details Dialog */}
      <Dialog open={!!viewingDistributor} onOpenChange={(open) => !open && setViewingDistributor(null)}>
        {viewingDistributor && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{viewingDistributor.name}</DialogTitle>
              <DialogDescription>Distributor Details</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-muted-foreground">Distributor ID</h4>
                  <p className="text-sm font-semibold">{viewingDistributor.id}</p>
              </div>
               <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-muted-foreground">Contact Person</h4>
                  <p className="text-sm font-semibold">{viewingDistributor.contactPerson}</p>
              </div>
              <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
                  <p className="text-sm font-semibold">{viewingDistributor.phone}</p>
              </div>
              <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                  <p className="text-sm font-semibold">{viewingDistributor.email}</p>
              </div>
               <Separator />
               <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                <Badge variant={viewingDistributor.status === 'Active' ? 'default' : 'destructive'} className={getStatusBadgeClassName(viewingDistributor.status)}>
                    {viewingDistributor.status}
                </Badge>
              </div>
               <Separator />
               <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-muted-foreground">Region</h4>
                  <p className="text-sm font-semibold">{viewingDistributor.region}</p>
              </div>
              <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-muted-foreground">State</h4>
                  <p className="text-sm font-semibold">{viewingDistributor.state}</p>
              </div>
              <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-muted-foreground">District</h4>
                  <p className="text-sm font-semibold">{viewingDistributor.district}</p>
              </div>
               <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-muted-foreground">Last Order</h4>
                  <p className="text-sm font-semibold">{viewingDistributor.lastOrderDate}</p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      
      {/* Add/Edit Dialog */}
      <Dialog open={isAddOrEditDialogOpen} onOpenChange={setIsAddOrEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingDistributor ? 'Edit Distributor' : 'Add New Distributor'}</DialogTitle>
            <DialogDescription>
              {editingDistributor ? "Update the distributor's details." : "Fill in the details for the new distributor."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onDialogSubmit)}>
              <ScrollArea className="h-[60vh] pr-6">
                <div className="space-y-4 py-4 pr-2">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distributor Name</FormLabel>
                      <FormControl><Input placeholder="e.g., Premium Foods India" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="contactPerson" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl><Input placeholder="e.g., Rohan Mehta" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input placeholder="e.g., contact@premiumfoods.in" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl><Input placeholder="e.g., +91 9988776655" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="region" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {indianRegions.map(region => (
                            <SelectItem key={region} value={region}>{region}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedRegion}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statesForSelectedRegion.map(state => (
                            <SelectItem key={state.name} value={state.name}>{state.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="district" render={({ field }) => (
                    <FormItem>
                      <FormLabel>District</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedState}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a district" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {districtsForSelectedState.map(district => (
                            <SelectItem key={district} value={district}>{district}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {['Active', 'Inactive'].map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </ScrollArea>
              <DialogFooter className="mt-4 border-t pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Distributor Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>State</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distributors.map((distributor) => (
                <TableRow key={distributor.id}>
                  <TableCell className="font-medium">{distributor.name}</TableCell>
                  <TableCell>{distributor.contactPerson}</TableCell>
                  <TableCell>{distributor.email}</TableCell>
                  <TableCell>{distributor.state}</TableCell>
                  <TableCell>{distributor.district}</TableCell>
                  <TableCell>
                    <Badge variant={distributor.status === 'Active' ? 'default' : 'destructive'} className={getStatusBadgeClassName(distributor.status)}>
                      {distributor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingDistributor(distributor)}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEditDialog(distributor)}>
                          Edit distributor
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
