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
  orderNumber: z.string().optional().describe("The order number associated with the invoice."),
  dateOfSupply: z.string().optional().describe("The date of supply in YYYY-MM-DD format."),
  placeOfSupply: z.string().optional().describe("The place of supply (e.g., state)."),
  items: z.array(z.object({
    productName: z.string().describe("Name of the product."),
    hsnCode: z.string().optional().describe("HSN/SAC code for the product."),
    quantity: z.number().describe("Quantity of the product."),
    pricePerUnit: z.number().describe("Price per unit of the product (pre-tax).")
  })).describe("An array of items in the invoice."),
  gstRate: z.number().describe("The applicable GST rate in percentage (e.g., 18 for 18%)."),
});
export type GenerateGstInvoiceInput = z.infer<typeof GenerateGstInvoiceInputSchema>;

const itemTotalSchema = z.object({
  productName: z.string(),
  hsnCode: z.string().optional(),
  quantity: z.number(),
  pricePerUnit: z.number(),
  total: z.number().describe("Total price for this item (quantity * pricePerUnit)."),
});

const GenerateGstInvoiceOutputSchema = z.object({
  invoiceNumber: z.string().describe("A unique invoice number (e.g., INV-YYYYMMDD-HHMMSS)."),
  invoiceDate: z.string().describe("The date of the invoice in YYYY-MM-DD format."),
  orderNumber: z.string().optional(),
  dateOfSupply: z.string().optional(),
  placeOfSupply: z.string().optional(),
  subtotal: z.number().describe("The sum of all item totals before tax."),
  cgst: z.number().describe("Central GST amount (GST Rate / 2)."),
  sgst: z.number().describe("State GST amount (GST Rate / 2)."),
  totalGst: z.number().describe("Total GST amount (CGST + SGST)."),
  grandTotal: z.number().describe("The final amount to be paid (Subtotal + Total GST)."),
  items: z.array(itemTotalSchema).describe("An array of items with calculated totals."),
  amountInWords: z.string().describe("The grand total in words."),
  companyName: z.string().default("Roseberry Chocolate"),
  companyAddress: z.string().default("123, Chocolate Lane, Kolkata, West Bengal, India, 700001"),
  companyGst: z.string().default("34ABCDE1234F1Z5"),
  bankDetails: z.object({
    bankName: z.string(),
    accountNumber: z.string(),
    ifscCode: z.string(),
  }),
  termsAndConditions: z.string(),
});
export type GenerateGstInvoiceOutput = z.infer<typeof GenerateGstInvoiceOutputSchema>;

// Helper function to convert number to words for Indian currency
function numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const numToWords = (n: number): string => {
        let str = "";
        if (n > 99) {
            str += ones[Math.floor(n / 100)] + " Hundred ";
            n %= 100;
        }
        if (n > 19) {
            str += tens[Math.floor(n / 10)] + " " + ones[n % 10];
        } else {
            str += ones[n];
        }
        return str.trim();
    };

    const convert = (n: number): string => {
        if (n === 0) return "Zero";
        let words = "";
        if (Math.floor(n / 10000000) > 0) {
            words += numToWords(Math.floor(n / 10000000)) + " Crore ";
            n %= 10000000;
        }
        if (Math.floor(n / 100000) > 0) {
            words += numToWords(Math.floor(n / 100000)) + " Lakh ";
            n %= 100000;
        }
        if (Math.floor(n / 1000) > 0) {
            words += numToWords(Math.floor(n / 1000)) + " Thousand ";
            n %= 1000;
        }
        if (n > 0) {
            words += numToWords(n);
        }
        return words.trim();
    }
    
    const rupees = Math.floor(num);
    const paisa = Math.round((num - rupees) * 100);
    
    let result = convert(rupees) + " Rupees";
    if (paisa > 0) {
        result += " and " + convert(paisa) + " Paisa";
    }
    
    return result.replace(/\s\s+/g, ' ').trim() + ' Only';
}

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
    const invoiceNumber = `RBS/${now.getFullYear().toString().slice(-2)}-${(now.getFullYear()+1).toString().slice(-2)}/` + Math.floor(Math.random() * 900 + 100);
    const invoiceDate = new Date().toISOString().split('T')[0];

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
    const sgst = parseFloat((totalGst - cgst).toFixed(2));
    
    // 4. Calculate Grand Total
    const grandTotal = parseFloat((subtotal + totalGst).toFixed(2));
    
    // 5. Convert grand total to words
    const amountInWords = `Rupees ${numberToWords(grandTotal)}`;

    const output: z.infer<typeof GenerateGstInvoiceOutputSchema> = {
      invoiceNumber,
      invoiceDate,
      orderNumber: input.orderNumber,
      dateOfSupply: input.dateOfSupply,
      placeOfSupply: input.placeOfSupply,
      subtotal,
      cgst: parseFloat(cgst.toFixed(2)),
      sgst: parseFloat(sgst.toFixed(2)),
      totalGst,
      grandTotal,
      items: itemsWithTotals,
      amountInWords,
      companyName: "Roseberry Chocolate",
      companyAddress: "123, Chocolate Lane, Kolkata, West Bengal, India, 700001",
      companyGst: "34ABCDE1234F1Z5",
      bankDetails: {
        bankName: "STATE BANK OF INDIA",
        accountNumber: "000000123456789",
        ifscCode: "SBIN0000123",
      },
      termsAndConditions: "1. All disputes are subject to Kolkata jurisdiction only.\n2. Goods once sold will not be taken back or exchanged.",
    };

    // This is important to ensure the output matches the schema, especially with floating point numbers.
    return GenerateGstInvoiceOutputSchema.parse(output);
  }
);
