'use server';
/**
 * @fileOverview A Genkit flow for forecasting future demand for specific chocolate products.
 *
 * - forecastChocolateDemand - A function that handles the chocolate demand forecasting process.
 * - DemandForecastInput - The input type for the forecastChocolateDemand function.
 * - DemandForecastOutput - The return type for the forecastChocolateDemand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DemandForecastInputSchema = z.object({
  productId: z.string().describe('The unique identifier of the chocolate product.'),
  productName: z.string().describe('The name of the chocolate product.'),
  historicalSalesData: z
    .array(
      z.object({
        date: z.string().describe('The date of sales in YYYY-MM-DD format.'),
        salesCount: z.number().describe('The number of units sold on that date.'),
      })
    )
    .describe('Historical sales data for the product, including date and sales count.'),
  seasonalTrends: z
    .string()
    .optional()
    .describe('A description of known seasonal patterns that affect sales.'),
  upcomingEvents: z
    .string()
    .optional()
    .describe('A description of known upcoming events that might influence sales.'),
});
export type DemandForecastInput = z.infer<typeof DemandForecastInputSchema>;

const DemandForecastOutputSchema = z.object({
  forecastedDemand: z
    .array(
      z.object({
        period: z.string().describe('The forecasting period (e.g., "next 7 days", "next 30 days").'),
        predictedSales: z.number().describe('The predicted number of units to be sold in that period.'),
      })
    )
    .describe('Predicted demand for the specified product over different periods.'),
  reasoning: z.string().describe('An explanation of the factors and analysis leading to the forecast.'),
  confidenceScore: z.number().min(0).max(100).describe('A confidence score (0-100) for the accuracy of the forecast.'),
});
export type DemandForecastOutput = z.infer<typeof DemandForecastOutputSchema>;

export async function forecastChocolateDemand(
  input: DemandForecastInput
): Promise<DemandForecastOutput> {
  return forecastChocolateDemandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'demandForecastPrompt',
  input: {schema: DemandForecastInputSchema},
  output: {schema: DemandForecastOutputSchema},
  prompt: `You are an expert inventory manager and business intelligence analyst specializing in luxury artisan chocolate.
Your task is to analyze the provided data to predict future demand for a specific chocolate product.

Product ID: {{{productId}}}
Product Name: {{{productName}}}

Historical Sales Data:
{{#each historicalSalesData}}- Date: {{{date}}}, Sales: {{{salesCount}}}
{{/each}}

Seasonal Trends: {{#if seasonalTrends}}{{{seasonalTrends}}}{{else}}No specific seasonal trends provided.{{/if}}

Upcoming Events: {{#if upcomingEvents}}{{{upcomingEvents}}}{{else}}No specific upcoming events provided.{{/if}}

Based on the historical sales data, any provided seasonal trends, and upcoming events, forecast the demand for the product '{{{productName}}}' for the next 7 days and the next 30 days.
Provide a clear explanation for your forecast and assign a confidence score (0-100) indicating the reliability of your prediction.
`,
});

const forecastChocolateDemandFlow = ai.defineFlow(
  {
    name: 'forecastChocolateDemandFlow',
    inputSchema: DemandForecastInputSchema,
    outputSchema: DemandForecastOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
