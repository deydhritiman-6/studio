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

export default function GstBillingPage() {
  const [generatedInvoice, setGeneratedInvoice] = useState<GenerateGstInvoiceOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<GstBillingFormValues>({
    resolver: zodResolver(gstBillingFormSchema),
    defaultValues: {
      customerName: '',
      customerAddress: '',
      customerGst: '',
      items: [{ productId: '', quantity: 1, pricePerUnit: 0 }],
      gstRate: 18,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  const watchItems = form.watch('items');

  async function onSubmit(values: GstBillingFormValues) {
    setIsLoading(true);
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
    setIsLoading(false);

    if ('error' in result) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      setGeneratedInvoice(result);
      toast({ title: 'Invoice Generated', description: 'The GST invoice has been successfully generated.' });
    }
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
    message += `${generatedInvoice.items[0].productName}\n`;
    message += `${generatedInvoice.customerAddress}\n`;
    if (generatedInvoice.items[0]) message += `GSTIN: ${generatedInvoice.items[0].pricePerUnit}\n\n`;

    message += `*Items:*\n`;
    generatedInvoice.items.forEach(item => {
      message += `- ${item.productName} (Qty: ${item.quantity}) @ ₹${item.pricePerUnit.toFixed(2)}: ₹${item.total.toFixed(2)}\n`;
    });
    
    message += `\n*Subtotal:* ₹${generatedInvoice.subtotal.toFixed(2)}\n`;
    message += `*CGST @${generatedInvoice.totalGst / 2}%:* ₹${generatedInvoice.cgst.toFixed(2)}\n`;
    message += `*SGST @${generatedInvoice.totalGst / 2}%:* ₹${generatedInvoice.sgst.toFixed(2)}\n`;
    message += `*Total GST:* ₹${generatedInvoice.totalGst.toFixed(2)}\n`;
    message += `*GRAND TOTAL:* *₹${generatedInvoice.grandTotal.toFixed(2)}*\n\n`;
    message += `Thank you for your business!`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }
  
  function handlePrint() {
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
                        ${form.getValues('customerName')}<br>
                        ${form.getValues('customerAddress').replace(/\n/g, '<br>')}
                        ${form.getValues('customerGst') ? `<br>GSTIN: ${form.getValues('customerGst')}` : ''}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr class="heading"><td>Item</td><td class="text-right">Price</td><td class="text-right">Qty</td><td class="text-right">Total</td></tr>
              ${generatedInvoice.items.map(item => `<tr class="item"><td>${item.productName}</td><td class="text-right">₹${item.pricePerUnit.toFixed(2)}</td><td class="text-right">${item.quantity}</td><td class="text-right">₹${item.total.toFixed(2)}</td></tr>`).join('')}
              <tr class="total"><td colspan="3" class="text-right">Subtotal</td><td class="text-right">₹${generatedInvoice.subtotal.toFixed(2)}</td></tr>
              <tr class="total"><td colspan="3" class="text-right">CGST (${(generatedInvoice.totalGst / generatedInvoice.subtotal * 50).toFixed(1)}%)</td><td class="text-right">₹${generatedInvoice.cgst.toFixed(2)}</td></tr>
              <tr class="total"><td colspan="3" class="text-right">SGST (${(generatedInvoice.totalGst / generatedInvoice.subtotal * 50).toFixed(1)}%)</td><td class="text-right">₹${generatedInvoice.sgst.toFixed(2)}</td></tr>
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


  return (
    <>
      <PageHeader title="GST Billing" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Create GST Invoice</CardTitle>
            <CardDescription>Fill in the customer and item details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="customerName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Rohan Kumar" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="customerAddress" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Address</FormLabel>
                    <FormControl><Textarea placeholder="e.g., 123 Main St, Bengaluru, KA" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="customerGst" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer GSTIN (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., 29ABCDE1234F1Z5" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <Separator />
                
                <div className="space-y-4">
                  <FormLabel>Items</FormLabel>
                  {fields.map((field, index) => (
                    <Card key={field.id} className="p-4 relative">
                        <div className="grid grid-cols-5 gap-2">
                           <FormField
                              control={form.control}
                              name={`items.${index}.productId`}
                              render={({ field }) => (
                                <FormItem className="col-span-5">
                                  <FormLabel className="sr-only">Product</FormLabel>
                                  <Select
                                    onValueChange={(value) => {
                                      const product = products.find(p => p.id === value);
                                      field.onChange(value);
                                      if (product) {
                                        form.setValue(`items.${index}.pricePerUnit`, product.price);
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
                            <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                                <FormItem className="col-span-2">
                                  <FormLabel className="sr-only">Quantity</FormLabel>
                                  <FormControl><Input type="number" placeholder="Qty" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name={`items.${index}.pricePerUnit`} render={({ field }) => (
                                <FormItem className="col-span-3">
                                  <FormLabel className="sr-only">Price</FormLabel>
                                  <FormControl><Input type="number" placeholder="Price" {...field} readOnly /></FormControl>
                                  <FormMessage />
                                </FormItem>
                             )} />
                        </div>
                        {fields.length > 1 && (
                             <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                        )}
                    </Card>
                  ))}
                  <Button type="button" variant="outline" onClick={() => append({ productId: '', quantity: 1, pricePerUnit: 0 })}>
                    <PlusCircle className="mr-2"/> Add Item
                  </Button>
                </div>
                
                <Separator />

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Generate Invoice'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="lg:col-span-2">
          {isLoading && <p>Generating...</p>}
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
                      <span>CGST ({generatedInvoice.items.length > 0 ? (form.getValues('gstRate') / 2) : 0}%)</span>
                      <span>₹{generatedInvoice.cgst.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between text-sm text-muted-foreground">
                      <span>SGST ({generatedInvoice.items.length > 0 ? (form.getValues('gstRate') / 2) : 0}%)</span>
                      <span>₹{generatedInvoice.sgst.toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Grand Total</span>
                      <span>₹{generatedInvoice.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handlePrint} className="w-full">
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
    </>
  );
}
