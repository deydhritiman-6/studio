'use server';

import {
  generateBroadcastMessage,
  type GenerateBroadcastMessageInput,
  type GenerateBroadcastMessageOutput,
} from '@/ai/flows/generate-broadcast-message';

export async function generateBroadcastAction(
  input: GenerateBroadcastMessageInput
): Promise<GenerateBroadcastMessageOutput | { error: string }> {
  try {
    const result = await generateBroadcastMessage(input);
    return result;
  } catch (error) {
    console.error('Error generating broadcast message:', error);
    return { error: 'Failed to generate broadcast. Please try again.' };
  }
}
