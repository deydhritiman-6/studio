'use client';

import { useState, useMemo } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { formatINR } from '@/lib/currency';

const itemSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  hsnCode: z.string().optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  pricePerUnit: z.coerce.number(),
});

const gstBillingFormSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerBillingAddress: z.string().min(1, 'Billing address is required'),
  isShippingSameAsBilling: z.boolean().default(true),
  customerShippingAddress: z.string().optional(),
  customerGst: z.string().optional(),
  orderNumber: z.string().optional(),
  dateOfSupply: z.string().optional(),
  placeOfSupply: z.string().optional(),
  items: z.array(itemSchema).min(1, "At least one item is required."),
  gstRate: z.coerce.number().min(0, "GST rate cannot be negative.").default(18),
}).refine((data) => {
    if (data.isShippingSameAsBilling) return true;
    return data.customerShippingAddress && data.customerShippingAddress.trim().length > 0;
  }, {
    message: 'Shipping address is required when different from billing.',
    path: ['customerShippingAddress'],
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
  const firestore = useFirestore();
  const productsQuery = useMemo(() => (firestore ? collection(firestore, 'products') : null), [firestore]);
  const { data: products } = useCollection<Product>(productsQuery);

  const gstForm = useForm<GstBillingFormValues>({
    resolver: zodResolver(gstBillingFormSchema),
    defaultValues: {
      customerName: '',
      customerBillingAddress: '',
      customerShippingAddress: '',
      isShippingSameAsBilling: true,
      customerGst: '',
      orderNumber: '',
      dateOfSupply: '',
      placeOfSupply: '',
      items: [{ productId: '', hsnCode: '', quantity: 1, pricePerUnit: 0 }],
      gstRate: 18,
    },
  });

  const { fields: gstFields, append: gstAppend, remove: gstRemove } = useFieldArray({
    control: gstForm.control,
    name: 'items',
  });
  const isShippingSameAsBilling = gstForm.watch('isShippingSameAsBilling');

  const cashBillForm = useForm<CashBillFormValues>({
    resolver: zodResolver(cashBillFormSchema),
    defaultValues: {
      customerName: '',
      items: [{ productId: '', hsnCode: '', quantity: 1, pricePerUnit: 0 }],
    },
  });

  const { fields: cashFields, append: cashAppend, remove: cashRemove } = useFieldArray({
    control: cashBillForm.control,
    name: 'items',
  });

  async function onGstSubmit(values: GstBillingFormValues) {
    if (!products) return;
    setIsGstLoading(true);
    setGeneratedInvoice(null);
    
    const invoiceInput = {
      ...values,
      customerShippingAddress: values.isShippingSameAsBilling ? values.customerBillingAddress : values.customerShippingAddress,
      items: values.items.map(item => ({
        productName: products.find(p => p.id === item.productId)?.name || 'Unknown Product',
        hsnCode: item.hsnCode,
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
    if (!products) return;
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
    message += `${gstForm.getValues('customerBillingAddress')}\n`;
    if (gstForm.getValues('customerGst')) message += `GSTIN: ${gstForm.getValues('customerGst')}\n`;

     if (!gstForm.getValues('isShippingSameAsBilling') && gstForm.getValues('customerShippingAddress')) {
        message += `\n*Ship To:*\n`;
        message += `${gstForm.getValues('customerName')}\n`;
        message += `${gstForm.getValues('customerShippingAddress')}\n`;
    }
    message += '\n';

    message += `*Items:*\n`;
    generatedInvoice.items.forEach(item => {
      message += `- ${item.productName} (Qty: ${item.quantity}) @ ${formatINR(item.pricePerUnit)}: ${formatINR(item.total)}\n`;
    });
    
    message += `\n*Subtotal:* ${formatINR(generatedInvoice.subtotal)}\n`;
    message += `*CGST @${(gstForm.getValues('gstRate') / 2)}%:* ${formatINR(generatedInvoice.cgst)}\n`;
    message += `*SGST @${(gstForm.getValues('gstRate') / 2)}%:* ${formatINR(generatedInvoice.sgst)}\n`;
    message += `*Total GST:* ${formatINR(generatedInvoice.totalGst)}\n`;
    message += `*GRAND TOTAL:* *${formatINR(generatedInvoice.grandTotal)}*\n\n`;
    message += `Thank you for your business!`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }
  
  function handlePrintGstInvoice() {
    if (!generatedInvoice) return;
    
    const printContent = `
      <html>
        <head>
          <title>Tax Invoice - ${generatedInvoice.invoiceNumber}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
          <style>
            body { 
              font-family: 'Inter', sans-serif;
              color: #111827; 
              background-color: #fff; 
              margin: 0; 
              padding: 0;
              font-size: 10px;
              -webkit-print-color-adjust: exact; 
            }
            .invoice-container { max-width: 800px; margin: 20px auto; padding: 20px; border: 1px solid #e5e7eb; }
            .header { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
            .company-details h1 { font-size: 18px; font-weight: 700; margin: 0 0 5px 0; }
            .company-details p { margin: 0; line-height: 1.4; }
            .invoice-title { text-align: right; }
            .invoice-title h2 { font-size: 24px; font-weight: 700; margin: 0; text-transform: uppercase; }
            .invoice-meta { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #000; }
            .invoice-meta-left, .invoice-meta-right { padding: 5px 0; }
            .invoice-meta-right { border-left: 1px solid #000; padding-left: 10px; }
            .invoice-meta p { margin: 2px 0; display: grid; grid-template-columns: 100px 1fr; }
            .invoice-meta p strong { font-weight: 700; }
            .party-details { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #000; }
            .billing-party, .shipping-party { padding: 5px 0; }
            .shipping-party { border-left: 1px solid #000; padding-left: 10px; }
            .party-details h4 { font-weight: 700; margin: 0 0 5px 0; font-size: 10px; }
            .party-details p { margin: 0; line-height: 1.4; }
            .items-table { width: 100%; border-collapse: collapse; margin-top: 1px; }
            .items-table th, .items-table td { border: 1px solid #000; padding: 6px; text-align: center; }
            .items-table th { font-weight: 700; }
            .items-table td:nth-child(2) { text-align: left; }
            .items-table .total-row td { font-weight: 700; }
            .footer { margin-top: 1px; }
            .footer .totals { display: grid; grid-template-columns: 1fr 150px 120px; border-top: 1px solid #000; }
            .footer .totals .label-cell { border-right: 1px solid #000; padding: 6px; text-align: right; font-weight: 700; }
            .footer .totals .value-cell { padding: 6px; text-align: right; font-weight: 700; }
            .footer .amount-in-words { border-top: 1px solid #000; padding: 8px 6px; }
            .footer-bottom { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #000; }
            .bank-details, .signature-area { padding: 8px 6px; }
            .bank-details { border-right: 1px solid #000; }
            .signature-area { text-align: right; }
            .bank-details p, .signature-area p { margin: 0; line-height: 1.4; }
            .bank-details h5, .signature-area h5 { margin: 0 0 5px 0; font-weight: 700; }
            .signature-area .signatory { margin-top: 30px; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="company-details">
                <h1>${generatedInvoice.companyName}</h1>
                <p>${generatedInvoice.companyAddress.replace(/, /g, '<br>')}</p>
                <p><strong>GSTIN:</strong> ${generatedInvoice.companyGst}</p>
              </div>
              <div class="invoice-title"><h2>Tax Invoice</h2></div>
            </div>

            <div class="invoice-meta">
              <div class="invoice-meta-left">
                <p><strong>Invoice No:</strong> <span>${generatedInvoice.invoiceNumber}</span></p>
                <p><strong>Invoice Date:</strong> <span>${new Date(generatedInvoice.invoiceDate).toLocaleDateString('en-GB')}</span></p>
              </div>
              <div class="invoice-meta-right">
                <p><strong>Order No:</strong> <span>${generatedInvoice.orderNumber || 'N/A'}</span></p>
                <p><strong>Date of Supply:</strong> <span>${generatedInvoice.dateOfSupply ? new Date(generatedInvoice.dateOfSupply).toLocaleDateString('en-GB') : 'N/A'}</span></p>
                <p><strong>Place of Supply:</strong> <span>${generatedInvoice.placeOfSupply || 'N/A'}</span></p>
              </div>
            </div>

            <div class="party-details">
              <div class="billing-party">
                <h4>Bill To (Buyer)</h4>
                <p><strong>${gstForm.getValues('customerName')}</strong></p>
                <p>${gstForm.getValues('customerBillingAddress').replace(/\n/g, '<br>')}</p>
                ${gstForm.getValues('customerGst') ? `<p><strong>GSTIN:</strong> ${gstForm.getValues('customerGst')}</p>` : ''}
              </div>
              <div class="shipping-party">
                <h4>Ship To (Consignee)</h4>
                <p><strong>${gstForm.getValues('customerName')}</strong></p>
                <p>${(gstForm.getValues('isShippingSameAsBilling') ? gstForm.getValues('customerBillingAddress') : gstForm.getValues('customerShippingAddress') || '').replace(/\n/g, '<br>')}</p>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Description of Goods</th>
                  <th>HSN/SAC</th>
                  <th>Qty.</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${generatedInvoice.items.map((item, index) => `
                  <tr>
                    <td>${index + 1}.</td>
                    <td>${item.productName}</td>
                    <td>${item.hsnCode || ''}</td>
                    <td>${item.quantity}</td>
                    <td>${formatINR(item.pricePerUnit)}</td>
                    <td>${formatINR(item.total)}</td>
                  </tr>
                `).join('')}
                 <tr>
                    <td colspan="5" style="text-align:right; font-weight:700;">Subtotal</td>
                    <td style="font-weight:700;">${formatINR(generatedInvoice.subtotal)}</td>
                </tr>
                 <tr>
                    <td colspan="5" style="text-align:right;">Add: CGST @ ${(gstForm.getValues('gstRate') / 2).toFixed(1)}%</td>
                    <td>${formatINR(generatedInvoice.cgst)}</td>
                </tr>
                 <tr>
                    <td colspan="5" style="text-align:right;">Add: SGST @ ${(gstForm.getValues('gstRate') / 2).toFixed(1)}%</td>
                    <td>${formatINR(generatedInvoice.sgst)}</td>
                </tr>
                <tr class="total-row">
                    <td colspan="5" style="text-align:right;">Total</td>
                    <td>${formatINR(generatedInvoice.grandTotal)}</td>
                </tr>
              </tbody>
            </table>

            <div class="footer">
                <div class="amount-in-words">
                    <strong>Amount in Words:</strong> ${generatedInvoice.amountInWords}
                </div>
                <div class="footer-bottom">
                    <div class="bank-details">
                        <h5>Bank Details</h5>
                        <p><strong>Bank:</strong> ${generatedInvoice.bankDetails.bankName}</p>
                        <p><strong>A/C No.:</strong> ${generatedInvoice.bankDetails.accountNumber}</p>
                        <p><strong>IFSC Code:</strong> ${generatedInvoice.bankDetails.ifscCode}</p>
                    </div>
                    <div class="signature-area">
                        <p>For <strong>${generatedInvoice.companyName}</strong></p>
                        <p class="signatory">Authorised Signatory</p>
                    </div>
                </div>
                 <div class="amount-in-words" style="border-top: 1px solid #000; border-bottom: 1px solid #e5e7eb;">
                    <strong>Terms & Conditions:</strong><br/>
                    <pre style="font-family: inherit; font-size: 9px; margin: 0;">${generatedInvoice.termsAndConditions}</pre>
                </div>
            </div>

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
              ${generatedCashBill.items.map(item => `<tr class="item"><td>${item.productName}</td><td class="text-right">${item.quantity}</td><td class="text-right">${formatINR(item.total)}</td></tr>`).join('')}
              <tr class="total"><td colspan="2" class="text-right">Grand Total</td><td class="text-right">${formatINR(generatedCashBill.total)}</td></tr>
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
      <PageHeader title="Create Invoice" />
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
                    <FormField control={gstForm.control} name="customerBillingAddress" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Address</FormLabel>
                        <FormControl><Textarea placeholder="e.g., 123 Main St, Bengaluru, KA" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField
                      control={gstForm.control}
                      name="isShippingSameAsBilling"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Shipping address is the same as billing address
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    {!isShippingSameAsBilling && (
                       <FormField control={gstForm.control} name="customerShippingAddress" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shipping Address</FormLabel>
                          <FormControl><Textarea placeholder="e.g., 456 Park Ave, Mumbai, MH" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}
                    <FormField control={gstForm.control} name="customerGst" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer GSTIN (Optional)</FormLabel>
                        <FormControl><Input placeholder="e.g., 29ABCDE1234F1Z5" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={gstForm.control} name="orderNumber" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order Number</FormLabel>
                            <FormControl><Input placeholder="e.g., ORD-001" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={gstForm.control} name="dateOfSupply" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Supply</FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                    </div>
                     <FormField control={gstForm.control} name="placeOfSupply" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Place of Supply</FormLabel>
                            <FormControl><Input placeholder="e.g., Puducherry" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <FormLabel>Items</FormLabel>
                         {!products && <Loader2 className="h-3 w-3 animate-spin" />}
                      </div>
                      {gstFields.map((field, index) => (
                        <Card key={field.id} className="p-4 relative">
                            <div className="grid grid-cols-1 gap-2">
                              <FormField
                                  control={gstForm.control}
                                  name={`items.${index}.productId`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="sr-only">Product</FormLabel>
                                      <Select
                                        onValueChange={(value) => {
                                          const product = products?.find(p => p.id === value);
                                          field.onChange(value);
                                          if (product) {
                                            gstForm.setValue(`items.${index}.pricePerUnit`, product.price);
                                          }
                                        }}
                                        defaultValue={field.value}
                                      >
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                          {products?.map((product) => (
                                            <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="grid grid-cols-3 gap-2">
                                <FormField control={gstForm.control} name={`items.${index}.hsnCode`} render={({ field }) => (
                                    <FormItem className="col-span-1">
                                      <FormLabel className="sr-only">HSN Code</FormLabel>
                                      <FormControl><Input placeholder="HSN" {...field} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={gstForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                                    <FormItem className="col-span-1">
                                      <FormLabel className="sr-only">Quantity</FormLabel>
                                      <FormControl><Input type="number" placeholder="Qty" {...field} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={gstForm.control} name={`items.${index}.pricePerUnit`} render={({ field }) => (
                                    <FormItem className="col-span-1">
                                      <FormLabel className="sr-only">Price</FormLabel>
                                      <FormControl><Input type="number" placeholder="Price" {...field} readOnly /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                 )} />
                                </div>
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
                      <Button type="button" variant="outline" onClick={() => gstAppend({ productId: '', hsnCode: '', quantity: 1, pricePerUnit: 0 })}>
                        <PlusCircle className="mr-2"/> Add Item
                      </Button>
                    </div>
                    
                    <Separator />

                    <Button type="submit" disabled={isGstLoading || !products} className="w-full">
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
                              <span>{formatINR(item.total)}</span>
                            </li>
                          ))}
                        </ul>
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>{formatINR(generatedInvoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>CGST ({(gstForm.getValues('gstRate') / 2)}%)</span>
                          <span>{formatINR(generatedInvoice.cgst)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>SGST ({(gstForm.getValues('gstRate') / 2)}%)</span>
                          <span>{formatINR(generatedInvoice.sgst)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Grand Total</span>
                          <span>{formatINR(generatedInvoice.grandTotal)}</span>
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
                      <div className="flex items-center justify-between">
                         <FormLabel>Items</FormLabel>
                         {!products && <Loader2 className="h-3 w-3 animate-spin" />}
                      </div>
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
                                          const product = products?.find(p => p.id === value);
                                          field.onChange(value);
                                          if (product) {
                                            cashBillForm.setValue(`items.${index}.pricePerUnit`, product.price);
                                          }
                                        }}
                                        defaultValue={field.value}
                                      >
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                          {products?.map((product) => (
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
                      <Button type="button" variant="outline" onClick={() => cashAppend({ productId: '', hsnCode: '', quantity: 1, pricePerUnit: 0 })}>
                        <PlusCircle className="mr-2"/> Add Item
                      </Button>
                    </div>
                    <Separator />
                    <Button type="submit" disabled={!products} className="w-full">Generate Bill</Button>
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
                                        <span>{formatINR(item.total)}</span>
                                        </li>
                                    ))}
                                    </ul>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between font-bold text-lg">
                                    <span>Grand Total</span>
                                    <span>{formatINR(generatedCashBill.total)}</span>
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
