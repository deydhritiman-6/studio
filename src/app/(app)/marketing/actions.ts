'use server';

import {
  generateMarketingCopy,
  type GenerateMarketingCopyInput,
  type GenerateMarketingCopyOutput,
} from '@/ai/flows/generate-marketing-copy';

export async function createMarketingCopyAction(
  input: GenerateMarketingCopyInput
): Promise<GenerateMarketingCopyOutput | { error: string }> {
  try {
    const result = await generateMarketingCopy(input);
    return result;
  } catch (error) {
    console.error('Error generating marketing copy:', error);
    return { error: 'Failed to generate marketing copy. Please try again.' };
  }
}
