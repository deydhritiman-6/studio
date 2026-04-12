'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Printer, MessageCircle, PlusCircle, Trash2 } from 'lucide-react';
import { generateGstInvoiceAction } from './actions';
import { type GenerateGstInvoiceOutput } from '@/ai/flows/generate-gst-invoice';
import { products } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const itemSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  pricePerUnit: z.coerce.number(),
});

const gstBillingFormSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerAddress: z.string().min(1, 'Customer address is required'),
  customerGst: z.string().optional(),
  items: z.array(itemSchema).min(1, "At least one item is required."),
  gstRate: z.coerce.number().min(0, "GST rate cannot be negative.").default(18),
});

type GstBillingFormValues = z.infer<typeof gstBillingFormSchema>;

const cashBillFormSchema = z.object({
  customerName: z.string().optional(),
  items: z.array(itemSchema).min(1, "At least one item is required."),
});

type CashBillFormValues = z.infer<typeof cashBillFormSchema>;

type CashBill = {
  customerName?: string;
  items: {
    productName: string;
    quantity: number;
    pricePerUnit: number;
    total: number;
  }[];
  total: number;
  date: string;
}

export default function GstBillingPage() {
  const [generatedInvoice, setGeneratedInvoice] = useState<GenerateGstInvoiceOutput | null>(null);
  const [isGstLoading, setIsGstLoading] = useState(false);

  const [generatedCashBill, setGeneratedCashBill] = useState<CashBill | null>(null);
  
  const { toast } = useToast();

  const gstForm = useForm<GstBillingFormValues>({
    resolver: zodResolver(gstBillingFormSchema),
    defaultValues: {
      customerName: '',
      customerAddress: '',
      customerGst: '',
      items: [{ productId: '', quantity: 1, pricePerUnit: 0 }],
      gstRate: 18,
    },
  });

  const { fields: gstFields, append: gstAppend, remove: gstRemove } = useFieldArray({
    control: gstForm.control,
    name: 'items',
  });

  const cashBillForm = useForm<CashBillFormValues>({
    resolver: zodResolver(cashBillFormSchema),
    defaultValues: {
      customerName: '',
      items: [{ productId: '', quantity: 1, pricePerUnit: 0 }],
    },
  });

  const { fields: cashFields, append: cashAppend, remove: cashRemove } = useFieldArray({
    control: cashBillForm.control,
    name: 'items',
  });

  async function onGstSubmit(values: GstBillingFormValues) {
    setIsGstLoading(true);
    setGeneratedInvoice(null);
    
    const invoiceInput = {
      ...values,
      items: values.items.map(item => ({
        productName: products.find(p => p.id === item.productId)?.name || 'Unknown Product',
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
      })),
    };
    
    const result = await generateGstInvoiceAction(invoiceInput);
    setIsGstLoading(false);

    if ('error' in result) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      setGeneratedInvoice(result);
      toast({ title: 'Invoice Generated', description: 'The GST invoice has been successfully generated.' });
    }
  }

  function onCashSubmit(values: CashBillFormValues) {
    const itemsWithTotals = values.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
            productName: product?.name || 'Unknown',
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            total: item.quantity * item.pricePerUnit,
        }
    });

    const total = itemsWithTotals.reduce((acc, item) => acc + item.total, 0);

    setGeneratedCashBill({
      customerName: values.customerName,
      items: itemsWithTotals,
      total: total,
      date: new Date().toLocaleDateString('en-IN')
    });
    toast({ title: 'Cash Bill Generated', description: 'The cash bill is ready to be printed.' });
  }
  
  function handleSendWhatsApp() {
    if (!generatedInvoice) return;

    let message = `*GST INVOICE*\n`;
    message += `*${generatedInvoice.companyName}*\n`;
    message += `${generatedInvoice.companyAddress}\n`;
    message += `GSTIN: ${generatedInvoice.companyGst}\n\n`;

    message += `*Invoice No:* ${generatedInvoice.invoiceNumber}\n`;
    message += `*Date:* ${generatedInvoice.invoiceDate}\n\n`;

    message += `*Bill To:*\n`;
    message += `${gstForm.getValues('customerName')}\n`;
    message += `${gstForm.getValues('customerAddress')}\n`;
    if (gstForm.getValues('customerGst')) message += `GSTIN: ${gstForm.getValues('customerGst')}\n\n`;

    message += `*Items:*\n`;
    generatedInvoice.items.forEach(item => {
      message += `- ${item.productName} (Qty: ${item.quantity}) @ ₹${item.pricePerUnit.toFixed(2)}: ₹${item.total.toFixed(2)}\n`;
    });
    
    message += `\n*Subtotal:* ₹${generatedInvoice.subtotal.toFixed(2)}\n`;
    message += `*CGST @${(gstForm.getValues('gstRate') / 2)}%:* ₹${generatedInvoice.cgst.toFixed(2)}\n`;
    message += `*SGST @${(gstForm.getValues('gstRate') / 2)}%:* ₹${generatedInvoice.sgst.toFixed(2)}\n`;
    message += `*Total GST:* ₹${generatedInvoice.totalGst.toFixed(2)}\n`;
    message += `*GRAND TOTAL:* *₹${generatedInvoice.grandTotal.toFixed(2)}*\n\n`;
    message += `Thank you for your business!`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }
  
  function handlePrintGstInvoice() {
    if (!generatedInvoice) return;
    
    const printContent = `
      <html>
        <head>
          <title>Invoice - ${generatedInvoice.invoiceNumber}</title>
          <style>
            body { font-family: sans-serif; margin: 20px; }
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); font-size: 16px; line-height: 24px; }
            .invoice-box table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
            .invoice-box table td { padding: 5px; vertical-align: top; }
            .invoice-box table tr.top table td { padding-bottom: 20px; }
            .invoice-box table tr.information table td { padding-bottom: 40px; }
            .invoice-box table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
            .invoice-box table tr.item td { border-bottom: 1px solid #eee; }
            .invoice-box table tr.total td:last-child { font-weight: bold; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <table>
              <tr class="top">
                <td colspan="4">
                  <table>
                    <tr>
                      <td class="title"><h2>${generatedInvoice.companyName}</h2></td>
                      <td class="text-right">
                        Invoice #: ${generatedInvoice.invoiceNumber}<br>
                        Created: ${generatedInvoice.invoiceDate}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr class="information">
                <td colspan="4">
                  <table>
                    <tr>
                      <td>
                        ${generatedInvoice.companyAddress.replace(/\n/g, '<br>')}<br>
                        GSTIN: ${generatedInvoice.companyGst}
                      </td>
                      <td class="text-right">
                        <b>Bill To:</b><br>
                        ${gstForm.getValues('customerName')}<br>
                        ${gstForm.getValues('customerAddress').replace(/\n/g, '<br>')}
                        ${gstForm.getValues('customerGst') ? `<br>GSTIN: ${gstForm.getValues('customerGst')}` : ''}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr class="heading"><td>Item</td><td class="text-right">Price</td><td class="text-right">Qty</td><td class="text-right">Total</td></tr>
              ${generatedInvoice.items.map(item => `<tr class="item"><td>${item.productName}</td><td class="text-right">₹${item.pricePerUnit.toFixed(2)}</td><td class="text-right">${item.quantity}</td><td class="text-right">₹${item.total.toFixed(2)}</td></tr>`).join('')}
              <tr class="total"><td colspan="3" class="text-right">Subtotal</td><td class="text-right">₹${generatedInvoice.subtotal.toFixed(2)}</td></tr>
              <tr class="total"><td colspan="3" class="text-right">CGST (${(gstForm.getValues('gstRate') / 2).toFixed(1)}%)</td><td class="text-right">₹${generatedInvoice.cgst.toFixed(2)}</td></tr>
              <tr class="total"><td colspan="3" class="text-right">SGST (${(gstForm.getValues('gstRate') / 2).toFixed(1)}%)</td><td class="text-right">₹${generatedInvoice.sgst.toFixed(2)}</td></tr>
              <tr class="total"><td colspan="3" class="text-right"><b>Grand Total</b></td><td class="text-right"><b>₹${generatedInvoice.grandTotal.toFixed(2)}</b></td></tr>
            </table>
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(printContent);
    printWindow?.document.close();
    printWindow?.focus();
    printWindow?.print();
  }

  function handlePrintCashBill() {
    if (!generatedCashBill) return;
    
    const printContent = `
      <html>
        <head>
          <title>Cash Bill</title>
          <style>
            body { font-family: sans-serif; margin: 20px; }
            .bill-box { max-width: 400px; margin: auto; padding: 20px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); font-size: 14px; line-height: 20px; }
            .bill-box table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
            .bill-box table td { padding: 5px; vertical-align: top; }
            .bill-box .heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
            .bill-box .item td { border-bottom: 1px solid #eee; }
            .bill-box .total td { font-weight: bold; border-top: 2px solid #eee; }
            .text-right { text-align: right; }
            .center { text-align: center; }
          </style>
        </head>
        <body>
          <div class="bill-box">
            <h2 class="center">Roseberry Chocolate</h2>
            <p class="center">Cash Bill</p>
            <p>Date: ${generatedCashBill.date}</p>
            ${generatedCashBill.customerName ? `<p>Customer: ${generatedCashBill.customerName}</p>` : ''}
            <table>
              <tr class="heading"><td>Item</td><td class="text-right">Qty</td><td class="text-right">Total</td></tr>
              ${generatedCashBill.items.map(item => `<tr class="item"><td>${item.productName}</td><td class="text-right">${item.quantity}</td><td class="text-right">₹${item.total.toFixed(2)}</td></tr>`).join('')}
              <tr class="total"><td colspan="2" class="text-right">Grand Total</td><td class="text-right">₹${generatedCashBill.total.toFixed(2)}</td></tr>
            </table>
            <p class="center" style="margin-top: 20px;">Thank you!</p>
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(printContent);
    printWindow?.document.close();
    printWindow?.focus();
    printWindow?.print();
  }

  return (
    <>
      <PageHeader title="Billing" />
      <Tabs defaultValue="gst-invoice" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gst-invoice">GST Invoice</TabsTrigger>
          <TabsTrigger value="cash-bill">Cash Bill</TabsTrigger>
        </TabsList>
        <TabsContent value="gst-invoice">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Create GST Invoice</CardTitle>
                <CardDescription>Fill in the customer and item details.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...gstForm}>
                  <form onSubmit={gstForm.handleSubmit(onGstSubmit)} className="space-y-4">
                    <FormField control={gstForm.control} name="customerName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl><Input placeholder="e.g., Rohan Kumar" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={gstForm.control} name="customerAddress" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Address</FormLabel>
                        <FormControl><Textarea placeholder="e.g., 123 Main St, Bengaluru, KA" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={gstForm.control} name="customerGst" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer GSTIN (Optional)</FormLabel>
                        <FormControl><Input placeholder="e.g., 29ABCDE1234F1Z5" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <FormLabel>Items</FormLabel>
                      {gstFields.map((field, index) => (
                        <Card key={field.id} className="p-4 relative">
                            <div className="grid grid-cols-5 gap-2">
                              <FormField
                                  control={gstForm.control}
                                  name={`items.${index}.productId`}
                                  render={({ field }) => (
                                    <FormItem className="col-span-5">
                                      <FormLabel className="sr-only">Product</FormLabel>
                                      <Select
                                        onValueChange={(value) => {
                                          const product = products.find(p => p.id === value);
                                          field.onChange(value);
                                          if (product) {
                                            gstForm.setValue(`items.${index}.pricePerUnit`, product.price);
                                          }
                                        }}
                                        defaultValue={field.value}
                                      >
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                          {products.map((product) => (
                                            <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField control={gstForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                                    <FormItem className="col-span-2">
                                      <FormLabel className="sr-only">Quantity</FormLabel>
                                      <FormControl><Input type="number" placeholder="Qty" {...field} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={gstForm.control} name={`items.${index}.pricePerUnit`} render={({ field }) => (
                                    <FormItem className="col-span-3">
                                      <FormLabel className="sr-only">Price</FormLabel>
                                      <FormControl><Input type="number" placeholder="Price" {...field} readOnly /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                 )} />
                            </div>
                            {gstFields.length > 1 && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6"
                                    onClick={() => gstRemove(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                            )}
                        </Card>
                      ))}
                      <Button type="button" variant="outline" onClick={() => gstAppend({ productId: '', quantity: 1, pricePerUnit: 0 })}>
                        <PlusCircle className="mr-2"/> Add Item
                      </Button>
                    </div>
                    
                    <Separator />

                    <Button type="submit" disabled={isGstLoading} className="w-full">
                      {isGstLoading ? <Loader2 className="animate-spin" /> : 'Generate Invoice'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <div className="lg:col-span-2">
              {isGstLoading && <p>Generating...</p>}
              {generatedInvoice ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice Generated: {generatedInvoice.invoiceNumber}</CardTitle>
                    <CardDescription>Review the generated invoice below.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold mb-2">Items</h3>
                        <ul className="space-y-1">
                          {generatedInvoice.items.map((item, index) => (
                            <li key={index} className="flex justify-between">
                              <span>{item.productName} x {item.quantity}</span>
                              <span>₹{item.total.toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>₹{generatedInvoice.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>CGST ({(gstForm.getValues('gstRate') / 2)}%)</span>
                          <span>₹{generatedInvoice.cgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>SGST ({(gstForm.getValues('gstRate') / 2)}%)</span>
                          <span>₹{generatedInvoice.sgst.toFixed(2)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Grand Total</span>
                          <span>₹{generatedInvoice.grandTotal.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handlePrintGstInvoice} className="w-full">
                          <Printer className="mr-2" /> Generate & Print
                        </Button>
                        <Button onClick={handleSendWhatsApp} variant="secondary" className="w-full">
                          <MessageCircle className="mr-2" /> Send via WhatsApp
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-border text-center p-8 min-h-[300px]">
                    <Printer className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold font-headline">Your Invoice Appears Here</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm">
                      Fill in the form to generate a GST-compliant invoice, ready to print or send.
                    </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="cash-bill">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Create Cash Bill</CardTitle>
                <CardDescription>A simple bill for cash transactions.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...cashBillForm}>
                  <form onSubmit={cashBillForm.handleSubmit(onCashSubmit)} className="space-y-4">
                     <FormField control={cashBillForm.control} name="customerName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name (Optional)</FormLabel>
                        <FormControl><Input placeholder="e.g., Walk-in Customer" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Separator />
                     <div className="space-y-4">
                      <FormLabel>Items</FormLabel>
                      {cashFields.map((field, index) => (
                        <Card key={field.id} className="p-4 relative">
                            <div className="grid grid-cols-5 gap-2">
                              <FormField
                                  control={cashBillForm.control}
                                  name={`items.${index}.productId`}
                                  render={({ field }) => (
                                    <FormItem className="col-span-5">
                                      <FormLabel className="sr-only">Product</FormLabel>
                                      <Select
                                        onValueChange={(value) => {
                                          const product = products.find(p => p.id === value);
                                          field.onChange(value);
                                          if (product) {
                                            cashBillForm.setValue(`items.${index}.pricePerUnit`, product.price);
                                          }
                                        }}
                                        defaultValue={field.value}
                                      >
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                          {products.map((product) => (
                                            <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField control={cashBillForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                                    <FormItem className="col-span-2">
                                      <FormLabel className="sr-only">Quantity</FormLabel>
                                      <FormControl><Input type="number" placeholder="Qty" {...field} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={cashBillForm.control} name={`items.${index}.pricePerUnit`} render={({ field }) => (
                                    <FormItem className="col-span-3">
                                      <FormLabel className="sr-only">Price</FormLabel>
                                      <FormControl><Input type="number" placeholder="Price" {...field} readOnly /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                 )} />
                            </div>
                            {cashFields.length > 1 && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6"
                                    onClick={() => cashRemove(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                            )}
                        </Card>
                      ))}
                      <Button type="button" variant="outline" onClick={() => cashAppend({ productId: '', quantity: 1, pricePerUnit: 0 })}>
                        <PlusCircle className="mr-2"/> Add Item
                      </Button>
                    </div>
                    <Separator />
                    <Button type="submit" className="w-full">Generate Bill</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            <div className="lg:col-span-2">
                {generatedCashBill ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Cash Bill Generated</CardTitle>
                            <CardDescription>Review the generated bill below.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-4 border rounded-lg">
                                    <h3 className="font-semibold mb-2">Items</h3>
                                    <ul className="space-y-1">
                                    {generatedCashBill.items.map((item, index) => (
                                        <li key={index} className="flex justify-between">
                                        <span>{item.productName} x {item.quantity}</span>
                                        <span>₹{item.total.toFixed(2)}</span>
                                        </li>
                                    ))}
                                    </ul>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between font-bold text-lg">
                                    <span>Grand Total</span>
                                    <span>₹{generatedCashBill.total.toFixed(2)}</span>
                                    </div>
                                </div>
                                <Button onClick={handlePrintCashBill} className="w-full">
                                    <Printer className="mr-2" /> Print Bill
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-border text-center p-8 min-h-[300px]">
                        <Printer className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold font-headline">Your Cash Bill Appears Here</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm">
                        Add items to generate a simple bill for cash payments.
                        </p>
                    </div>
                )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
