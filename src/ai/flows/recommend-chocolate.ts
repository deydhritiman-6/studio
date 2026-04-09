'use server';
/**
 * @fileOverview An AI-powered chocolate recommendation engine.
 *
 * - recommendChocolate - A function that generates personalized chocolate recommendations.
 * - RecommendChocolateInput - The input type for the recommendChocolate function.
 * - RecommendChocolateOutput - The return type for the recommendChocolate function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendChocolateInputSchema = z.object({
  customerId: z.string().describe('The unique identifier for the customer.'),
  purchaseHistory: z
    .array(
      z.object({
        productId: z.string().describe('The unique identifier for the purchased product.'),
        productName: z.string().describe('The name of the purchased product.'),
        flavor: z.string().describe('The primary flavor profile of the purchased product (e.g., dark, milk, nutty, fruity).'),
        quantity: z.number().int().positive().describe('The quantity of the product purchased.'),
      })
    )
    .describe('A list of the customer\'s past chocolate purchases.'),
});
export type RecommendChocolateInput = z.infer<typeof RecommendChocolateInputSchema>;

const RecommendChocolateOutputSchema = z.object({
  recommendations: z
    .array(
      z.object({
        productId: z.string().describe('The unique identifier for the recommended product.'),
        productName: z.string().describe('The name of the recommended product.'),
        reason: z.string().describe('A concise explanation for why this chocolate is recommended.'),
      })
    )
    .describe('A list of personalized chocolate recommendations for the customer.'),
});
export type RecommendChocolateOutput = z.infer<typeof RecommendChocolateOutputSchema>;

export async function recommendChocolate(input: RecommendChocolateInput): Promise<RecommendChocolateOutput> {
  return recommendChocolateFlow(input);
}

const chocolateRecommendationPrompt = ai.definePrompt({
  name: 'chocolateRecommendationPrompt',
  input: {schema: RecommendChocolateInputSchema},
  output: {schema: RecommendChocolateOutputSchema},
  prompt: `You are an expert chocolate sommelier, highly skilled in understanding customer preferences and providing tailored recommendations.

Analyze the provided customer's purchase history to identify patterns, preferred flavors, and product types. Based on this analysis, recommend 3 to 5 personalized chocolate products that the customer is highly likely to enjoy.

For each recommendation, provide the product ID, product name, and a brief, compelling reason for the recommendation, linking it back to their purchase history.

If the purchase history is empty, recommend 3 to 5 of the most popular or universally appealing products. The reason should state that these are popular choices for new customers.

Customer ID: {{{customerId}}}

Customer Purchase History:
{{#if purchaseHistory}}
{{#each purchaseHistory}}
- Product ID: {{{productId}}}, Name: {{{productName}}}, Flavor: {{{flavor}}}, Quantity: {{{quantity}}}
{{/each}}
{{else}}
No purchase history available.
{{/if}}

Provide your recommendations in the specified JSON format.`,
});

const recommendChocolateFlow = ai.defineFlow(
  {
    name: 'recommendChocolateFlow',
    inputSchema: RecommendChocolateInputSchema,
    outputSchema: RecommendChocolateOutputSchema,
  },
  async input => {
    const {output} = await chocolateRecommendationPrompt(input);
    return output!;
  }
);
