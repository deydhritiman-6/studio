'use server';
/**
 * @fileOverview A Genkit flow for generating personalized marketing copy.
 *
 * - generateMarketingCopy - A function that handles the marketing copy generation process.
 * - GenerateMarketingCopyInput - The input type for the generateMarketingCopy function.
 * - GenerateMarketingCopyOutput - The return type for the generateMarketingCopy function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMarketingCopyInputSchema = z.object({
  customerSegment: z
    .enum(['VIP', 'Regular', 'Corporate', 'Wholesale'])
    .describe('The segment of the customer for whom the copy is being generated.'),
  campaignType: z
    .enum([
      'Birthday Greeting',
      'Anniversary Greeting',
      'Festival Campaign',
      'Product Launch',
      'VIP Offer',
      'Re-engagement',
    ])
    .describe('The type of marketing campaign.'),
  customerName: z.string().optional().describe('The name of the customer, if available.'),
  productName: z.string().optional().describe('The name of the product being promoted.'),
  discountCode: z.string().optional().describe('A special discount code for the campaign.'),
  occasionDetails: z
    .string()
    .optional()
    .describe('Specific details about the occasion (e.g., name of festival, new feature details).'),
  channel: z.enum(['Email', 'WhatsApp']).describe('The communication channel for the marketing copy.'),
});
export type GenerateMarketingCopyInput = z.infer<typeof GenerateMarketingCopyInputSchema>;

const GenerateMarketingCopyOutputSchema = z.object({
  marketingCopy: z.string().describe('The generated personalized marketing copy.'),
});
export type GenerateMarketingCopyOutput = z.infer<typeof GenerateMarketingCopyOutputSchema>;

export async function generateMarketingCopy(
  input: GenerateMarketingCopyInput
): Promise<GenerateMarketingCopyOutput> {
  return generateMarketingCopyFlow(input);
}

const marketingCopyPrompt = ai.definePrompt({
  name: 'marketingCopyPrompt',
  input: { schema: GenerateMarketingCopyInputSchema },
  output: { schema: GenerateMarketingCopyOutputSchema },
  prompt: `You are a sophisticated marketing assistant for 'Roseberry Chocolate', an ultra-premium artisan chocolate brand.
Your task is to generate engaging and personalized marketing copy for a specific campaign and customer segment.

Keep the tone luxurious, elegant, and appealing to a premium audience. Emphasize exclusivity, quality, and the unique experience of Roseberry Chocolate.

Here are the details:
Customer Segment: {{{customerSegment}}}
Campaign Type: {{{campaignType}}}
Communication Channel: {{{channel}}}
{{#if customerName}}Customer Name: {{{customerName}}}{{/if}}
{{#if productName}}Product Name: {{{productName}}}{{/if}}
{{#if discountCode}}Discount Code: {{{discountCode}}}{{/if}}
{{#if occasionDetails}}Occasion Details: {{{occasionDetails}}}{{/if}}

Guidelines for copy:
- For 'Email' channel, the copy should be slightly more descriptive and elegant.
- For 'WhatsApp' channel, the copy should be concise, friendly, and direct, suitable for quick reading on a mobile device.
- Incorporate the customer's name if provided for personalization.
- Ensure the copy is tailored to the campaign type (e.g., warm wishes for birthdays, excitement for product launches).
- End with a call to action relevant to Roseberry Chocolate (e.g., 'Explore our collection', 'Discover your perfect treat').
- The output should only contain the marketing copy, formatted as plain text.

Generate the marketing copy now.`,
});

const generateMarketingCopyFlow = ai.defineFlow(
  {
    name: 'generateMarketingCopyFlow',
    inputSchema: GenerateMarketingCopyInputSchema,
    outputSchema: GenerateMarketingCopyOutputSchema,
  },
  async (input) => {
    const { output } = await marketingCopyPrompt(input);
    return output!;
  }
);
