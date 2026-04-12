'use server';

import {
  generateGstInvoice,
  type GenerateGstInvoiceInput,
  type GenerateGstInvoiceOutput,
} from '@/ai/flows/generate-gst-invoice';

export async function generateGstInvoiceAction(
  input: GenerateGstInvoiceInput
): Promise<GenerateGstInvoiceOutput | { error: string }> {
  try {
    const result = await generateGstInvoice(input);
    return result;
  } catch (error) {
    console.error('Error generating GST invoice:', error);
    return { error: 'Failed to generate invoice. Please try again.' };
  }
}
