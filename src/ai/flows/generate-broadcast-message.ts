'use server';
/**
 * @fileOverview A Genkit flow for generating broadcast announcements.
 *
 * - generateBroadcastMessage - A function that handles the broadcast generation process.
 * - GenerateBroadcastMessageInput - The input type for the function.
 * - GenerateBroadcastMessageOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateBroadcastMessageInputSchema = z.object({
  broadcastType: z
    .enum(['Product Update', 'Special Discount', 'General Announcement', 'Event Invitation'])
    .describe('The type of broadcast being sent.'),
  targetAudience: z
    .enum(['All Customers', 'VIP Customers', 'Wholesale Partners', 'New Subscribers'])
    .describe('The specific customer segment the broadcast is for.'),
  channel: z
    .enum(['Email', 'SMS', 'Social Media Post'])
    .describe('The communication channel for the broadcast.'),
  messageDetails: z
    .string()
    .describe('Key information, details, or talking points to be included in the broadcast message.'),
});
export type GenerateBroadcastMessageInput = z.infer<typeof GenerateBroadcastMessageInputSchema>;

export const GenerateBroadcastMessageOutputSchema = z.object({
  subjectLine: z.string().optional().describe('The generated subject line, applicable for Email channel.'),
  messageBody: z.string().describe('The main body content of the broadcast message, tailored for the specified channel.'),
});
export type GenerateBroadcastMessageOutput = z.infer<typeof GenerateBroadcastMessageOutputSchema>;

export async function generateBroadcastMessage(input: GenerateBroadcastMessageInput): Promise<GenerateBroadcastMessageOutput> {
  return generateBroadcastMessageFlow(input);
}

const broadcastMessagePrompt = ai.definePrompt({
  name: 'broadcastMessagePrompt',
  input: { schema: GenerateBroadcastMessageInputSchema },
  output: { schema: GenerateBroadcastMessageOutputSchema },
  prompt: `You are a communications director for 'Roseberry Chocolate', a luxury artisan chocolate brand.
Your task is to craft a compelling and professional broadcast message based on the provided details. The tone should be elegant and on-brand.

Broadcast Details:
- Type: {{{broadcastType}}}
- Target Audience: {{{targetAudience}}}
- Channel: {{{channel}}}
- Key Details: {{{messageDetails}}}

Instructions:
1.  **Craft a Message Body**: Write the content for the broadcast.
    -   For 'Email', write a complete and well-structured message.
    -   For 'SMS', be concise and direct (under 160 characters).
    -   For 'Social Media Post', make it engaging, use hashtags if appropriate.
2.  **Generate a Subject Line**: If the channel is 'Email', create a catchy and relevant subject line. For other channels, you can leave this field empty.

Generate the broadcast message now.`,
});

const generateBroadcastMessageFlow = ai.defineFlow(
  {
    name: 'generateBroadcastMessageFlow',
    inputSchema: GenerateBroadcastMessageInputSchema,
    outputSchema: GenerateBroadcastMessageOutputSchema,
  },
  async (input) => {
    const { output } = await broadcastMessagePrompt(input);
    return output!;
  }
);
