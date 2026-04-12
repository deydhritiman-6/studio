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

export const GenerateGstInvoiceInputSchema = z.object({
  customerName: z.string().describe("The full name of the customer."),
  customerAddress: z.string().describe("The full address of the customer."),
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

export const GenerateGstInvoiceOutputSchema = z.object({
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

const gstInvoicePrompt = ai.definePrompt({
  name: 'gstInvoicePrompt',
  input: { schema: GenerateGstInvoiceInputSchema },
  output: { schema: GenerateGstInvoiceOutputSchema },
  prompt: `You are an accounting expert for 'Roseberry Chocolate', a luxury artisan chocolate brand in India.
Your task is to generate a complete and accurate GST invoice based on the provided details.

**Invoice Details:**
- Customer Name: {{{customerName}}}
- Customer Address: {{{customerAddress}}}
{{#if customerGst}}- Customer GSTIN: {{{customerGst}}}{{/if}}

**Items:**
{{#each items}}
- Product: {{{productName}}}, Quantity: {{{quantity}}}, Price/Unit: {{{pricePerUnit}}}
{{/each}}

- GST Rate: {{{gstRate}}}%

**Instructions:**
1.  **Generate a unique Invoice Number**: Use the format 'INV-' followed by the current timestamp (e.g., INV-20240726-153000).
2.  **Set the Invoice Date**: Use today's date in YYYY-MM-DD format.
3.  **Calculate Item Totals**: For each item, calculate the total price (quantity * pricePerUnit).
4.  **Calculate Subtotal**: Sum up the total price for all items.
5.  **Calculate GST**:
    -   Total GST = Subtotal * (GST Rate / 100).
    -   CGST = Total GST / 2.
    -   SGST = Total GST / 2.
6.  **Calculate Grand Total**: Grand Total = Subtotal + Total GST.
7.  **Fill Company Details**: Use the default company name, address, and GSTIN.
8.  **Return the final invoice object** in the specified JSON format. Ensure all calculations are precise to two decimal places.
`,
});

const generateGstInvoiceFlow = ai.defineFlow(
  {
    name: 'generateGstInvoiceFlow',
    inputSchema: GenerateGstInvoiceInputSchema,
    outputSchema: GenerateGstInvoiceOutputSchema,
  },
  async (input) => {
    const { output } = await gstInvoicePrompt(input);
    return output!;
  }
);
