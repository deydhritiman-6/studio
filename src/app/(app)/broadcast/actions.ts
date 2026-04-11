'use server';

import {
  generateBroadcastMessage,
  type GenerateBroadcastMessageInput,
  type GenerateBroadcastMessageOutput,
} from '@/ai/flows/generate-broadcast-message';

import {
  generateFestivalGreeting,
  type GenerateFestivalGreetingInput,
  type GenerateFestivalGreetingOutput,
} from '@/ai/flows/generate-festival-greeting';


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

export async function generateFestivalMessageAction(
  input: GenerateFestivalGreetingInput
): Promise<GenerateFestivalGreetingOutput | { error: string }> {
  try {
    const result = await generateFestivalGreeting(input);
    return result;
  } catch (error) {
    console.error('Error generating festival message:', error);
    return { error: 'Failed to generate message. Please try again.' };
  }
}
