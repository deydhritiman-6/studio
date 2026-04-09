'use server';
/**
 * @fileOverview An AI agent that analyzes VIP customer data to identify behavioral patterns and generate actionable insights for personalized experiences.
 *
 * - analyzeVIPCustomerBehavior - A function that handles the VIP customer behavior analysis process.
 * - AnalyzeVIPCustomerBehaviorInput - The input type for the analyzeVIPCustomerBehavior function.
 * - AnalyzeVIPCustomerBehaviorOutput - The return type for the analyzeVIPCustomerBehavior function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeVIPCustomerBehaviorInputSchema = z.object({
  customerId: z.string().describe('The unique identifier for the customer.'),
  customerProfile: z.object({
    name: z.string().describe('The name of the VIP customer.'),
    email: z.string().email().describe('The email address of the VIP customer.'),
    vipLevel: z.enum(['Gold', 'Platinum', 'Royal', 'None']).describe('The VIP level of the customer.').default('None'),
    customerType: z.enum(['VIP', 'Regular', 'Corporate', 'Wholesale']).describe('The type of customer.'),
    totalPurchaseValue: z.number().describe('The total value of all purchases made by the customer.'),
    birthday: z.string().optional().describe('The customer\'s birthday in YYYY-MM-DD format.'),
    anniversary: z.string().optional().describe('The customer\'s anniversary in YYYY-MM-DD format.'),
  }).describe('Comprehensive profile information for the VIP customer.'),
  purchaseHistory: z.array(z.object({
    orderId: z.string().describe('The ID of the purchase order.'),
    orderDate: z.string().describe('The date of the purchase in YYYY-MM-DD format.'),
    totalAmount: z.number().describe('The total amount of the purchase.'),
    products: z.array(z.string()).describe('A list of product names purchased in this order.'),
  })).describe('A chronological list of the customer\'s purchase history.'),
  interactionLogs: z.array(z.object({
    date: z.string().describe('The date of the interaction in YYYY-MM-DD format.'),
    type: z.string().describe('The type of interaction (e.g., email, WhatsApp, call, in-person).'),
    summary: z.string().describe('A brief summary of the interaction.'),
  })).describe('A log of past interactions with the customer.'),
  feedback: z.array(z.string()).describe('A collection of feedback received from the customer.'),
});
export type AnalyzeVIPCustomerBehaviorInput = z.infer<typeof AnalyzeVIPCustomerBehaviorInputSchema>;

const AnalyzeVIPCustomerBehaviorOutputSchema = z.object({
  behavioralPatterns: z.array(z.string()).describe('Key behavioral patterns identified from the customer data, such as preferred product categories, purchase frequency, response to promotions, etc.'),
  summary: z.string().describe('A concise overall summary of the customer\'s behavior and preferences.'),
  recommendedActions: z.array(z.string()).describe('Actionable recommendations for the VIP client manager to proactively tailor exclusive offers, experiences, or follow-up strategies.'),
});
export type AnalyzeVIPCustomerBehaviorOutput = z.infer<typeof AnalyzeVIPCustomerBehaviorOutputSchema>;

export async function analyzeVIPCustomerBehavior(input: AnalyzeVIPCustomerBehaviorInput): Promise<AnalyzeVIPCustomerBehaviorOutput> {
  return analyzeVIPCustomerBehaviorFlow(input);
}

const analyzeVIPCustomerBehaviorPrompt = ai.definePrompt({
  name: 'analyzeVIPCustomerBehaviorPrompt',
  input: { schema: AnalyzeVIPCustomerBehaviorInputSchema },
  output: { schema: AnalyzeVIPCustomerBehaviorOutputSchema },
  prompt: `You are an expert AI business intelligence analyst specializing in luxury customer experiences.
Your task is to analyze comprehensive customer data for a VIP client of Roseberry Chocolate.
Identify key behavioral patterns and generate concise summaries and actionable recommendations for the VIP client manager.

Customer ID: {{{customerId}}}

Customer Profile:
Name: {{{customerProfile.name}}}
Email: {{{customerProfile.email}}}
VIP Level: {{{customerProfile.vipLevel}}}
Customer Type: {{{customerProfile.customerType}}}
Total Purchase Value: {{{customerProfile.totalPurchaseValue}}}
{{#if customerProfile.birthday}}Birthday: {{{customerProfile.birthday}}}{{/if}}
{{#if customerProfile.anniversary}}Anniversary: {{{customerProfile.anniversary}}}{{/if}}

Purchase History:
{{#if purchaseHistory}}
  {{#each purchaseHistory}}
  - Order ID: {{{orderId}}}, Date: {{{orderDate}}}, Amount: {{{totalAmount}}}, Products: {{#each products}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  {{/each}}
{{else}}
  No purchase history available.
{{/if}}

Interaction Logs:
{{#if interactionLogs}}
  {{#each interactionLogs}}
  - Date: {{{date}}}, Type: {{{type}}}, Summary: {{{summary}}}
  {{/each}}
{{else}}
  No interaction logs available.
{{/if}}

Feedback:
{{#if feedback}}
  {{#each feedback}}
  - "{{{this}}}"
  {{/each}}
{{else}}
  No feedback available.
{{/if}}

Based on the provided data, perform the following:
1.  **Identify Key Behavioral Patterns**: Analyze purchase frequency, preferred product types/flavors, response to past promotions, common themes in interactions/feedback, and any special occasions like birthdays/anniversaries.
2.  **Generate a Concise Summary**: Provide an executive summary of this VIP customer's overall engagement, preferences, and potential for future high-value interactions.
3.  **Propose Actionable Recommendations**: Suggest specific, tailored exclusive offers, personalized communication strategies, or unique experiences that the VIP client manager can implement to enhance the customer's loyalty and engagement with Roseberry Chocolate.

Ensure your output is structured precisely according to the JSON schema provided, with arrays for 'behavioralPatterns' and 'recommendedActions'.`,
});

const analyzeVIPCustomerBehaviorFlow = ai.defineFlow(
  {
    name: 'analyzeVIPCustomerBehaviorFlow',
    inputSchema: AnalyzeVIPCustomerBehaviorInputSchema,
    outputSchema: AnalyzeVIPCustomerBehaviorOutputSchema,
  },
  async (input) => {
    const { output } = await analyzeVIPCustomerBehaviorPrompt(input);
    return output!;
  }
);
