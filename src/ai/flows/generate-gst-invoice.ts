'use server';
/**
 * @fileOverview A Genkit flow for generating a GST-compliant invoice.
 *
 * - generateGstInvoice - A function that handles the invoice generation process.
 * - GenerateGstInvoiceInput - The input type for the function.
 * - GenerateGstInvoiceOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateGstInvoiceInputSchema = z.object({
  customerName: z.string().describe("The full name of the customer."),
  customerBillingAddress: z.string().describe("The billing address of the customer."),
  customerShippingAddress: z.string().optional().describe("The shipping address of the customer, if different from billing."),
  customerGst: z.string().optional().describe("The customer's GSTIN, if available."),
  items: z.array(z.object({
    productName: z.string().describe("Name of the product."),
    quantity: z.number().describe("Quantity of the product."),
    pricePerUnit: z.number().describe("Price per unit of the product (pre-tax).")
  })).describe("An array of items in the invoice."),
  gstRate: z.number().describe("The applicable GST rate in percentage (e.g., 18 for 18%)."),
});
export type GenerateGstInvoiceInput = z.infer<typeof GenerateGstInvoiceInputSchema>;

const itemTotalSchema = z.object({
  productName: z.string(),
  quantity: z.number(),
  pricePerUnit: z.number(),
  total: z.number().describe("Total price for this item (quantity * pricePerUnit)."),
});

const GenerateGstInvoiceOutputSchema = z.object({
  invoiceNumber: z.string().describe("A unique invoice number (e.g., INV-YYYYMMDD-HHMMSS)."),
  invoiceDate: z.string().describe("The date of the invoice in YYYY-MM-DD format."),
  subtotal: z.number().describe("The sum of all item totals before tax."),
  cgst: z.number().describe("Central GST amount (GST Rate / 2)."),
  sgst: z.number().describe("State GST amount (GST Rate / 2)."),
  totalGst: z.number().describe("Total GST amount (CGST + SGST)."),
  grandTotal: z.number().describe("The final amount to be paid (Subtotal + Total GST)."),
  items: z.array(itemTotalSchema).describe("An array of items with calculated totals."),
  companyName: z.string().default("Roseberry Chocolate"),
  companyAddress: z.string().default("123, Chocolate Lane, Puducherry, India"),
  companyGst: z.string().default("22AAAAA0000A1Z5"),
});
export type GenerateGstInvoiceOutput = z.infer<typeof GenerateGstInvoiceOutputSchema>;

export async function generateGstInvoice(input: GenerateGstInvoiceInput): Promise<GenerateGstInvoiceOutput> {
  return generateGstInvoiceFlow(input);
}

const generateGstInvoiceFlow = ai.defineFlow(
  {
    name: 'generateGstInvoiceFlow',
    inputSchema: GenerateGstInvoiceInputSchema,
    outputSchema: GenerateGstInvoiceOutputSchema,
  },
  async (input) => {
    // 1. Generate Invoice Number and Date
    const now = new Date();
    const invoiceNumber = `INV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    const invoiceDate = now.toISOString().split('T')[0];

    // 2. Calculate Item Totals and Subtotal
    let subtotal = 0;
    const itemsWithTotals = input.items.map(item => {
      const total = item.quantity * item.pricePerUnit;
      subtotal += total;
      return {
        ...item,
        total: parseFloat(total.toFixed(2)),
      };
    });
    subtotal = parseFloat(subtotal.toFixed(2));
    
    // 3. Calculate GST
    const totalGst = parseFloat((subtotal * (input.gstRate / 100)).toFixed(2));
    const cgst = parseFloat((totalGst / 2).toFixed(2));
    const sgst = totalGst - cgst; // To avoid rounding issues
    
    // 4. Calculate Grand Total
    const grandTotal = parseFloat((subtotal + totalGst).toFixed(2));

    const output: z.infer<typeof GenerateGstInvoiceOutputSchema> = {
      invoiceNumber,
      invoiceDate,
      subtotal,
      cgst: parseFloat(cgst.toFixed(2)),
      sgst: parseFloat(sgst.toFixed(2)),
      totalGst,
      grandTotal,
      items: itemsWithTotals,
      companyName: "Roseberry Chocolate",
      companyAddress: "123, Chocolate Lane, Puducherry, India",
      companyGst: "22AAAAA0000A1Z5",
    };

    // This is important to ensure the output matches the schema, especially with floating point numbers.
    return GenerateGstInvoiceOutputSchema.parse(output);
  }
);
