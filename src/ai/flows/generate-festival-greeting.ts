'use server';
/**
 * @fileOverview A Genkit flow for generating festival-specific greetings.
 *
 * - generateFestivalGreeting - A function that handles the greeting generation.
 * - GenerateFestivalGreetingInput - The input type for the function.
 * - GenerateFestivalGreetingOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateFestivalGreetingInputSchema = z.object({
  festivalName: z.string().describe('The name of the festival or special occasion.'),
});
export type GenerateFestivalGreetingInput = z.infer<typeof GenerateFestivalGreetingInputSchema>;

const GenerateFestivalGreetingOutputSchema = z.object({
  greeting: z.string().describe('The generated greeting message suitable for a broadcast.'),
});
export type GenerateFestivalGreetingOutput = z.infer<typeof GenerateFestivalGreetingOutputSchema>;

export async function generateFestivalGreeting(input: GenerateFestivalGreetingInput): Promise<GenerateFestivalGreetingOutput> {
  return generateFestivalGreetingFlow(input);
}

const festivalGreetingPrompt = ai.definePrompt({
  name: 'festivalGreetingPrompt',
  input: { schema: GenerateFestivalGreetingInputSchema },
  output: { schema: GenerateFestivalGreetingOutputSchema },
  prompt: `You are a marketing specialist for 'Roseberry Chocolate', a luxury artisan chocolate brand.
Your task is to craft a warm and appropriate greeting for the following festival or special occasion: {{{festivalName}}}.

The message should be celebratory, inclusive, and align with a premium brand. Mention the festival and wish customers well.
You could also suggest that Roseberry chocolates are a great way to celebrate or gift during this time.
Keep it concise and ready for a broadcast.
`,
});

const generateFestivalGreetingFlow = ai.defineFlow(
  {
    name: 'generateFestivalGreetingFlow',
    inputSchema: GenerateFestivalGreetingInputSchema,
    outputSchema: GenerateFestivalGreetingOutputSchema,
  },
  async (input) => {
    const { output } = await festivalGreetingPrompt(input);
    return output!;
  }
);
