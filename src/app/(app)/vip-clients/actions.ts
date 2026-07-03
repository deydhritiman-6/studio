'use server';

import {
  analyzeVIPCustomerBehavior,
  type AnalyzeVIPCustomerBehaviorInput,
  type AnalyzeVIPCustomerBehaviorOutput,
} from '@/ai/flows/analyze-vip-customer-behavior';

export async function analyzeCustomerAction(
  input: AnalyzeVIPCustomerBehaviorInput
): Promise<AnalyzeVIPCustomerBehaviorOutput | { error: string }> {
  try {
    const analysis = await analyzeVIPCustomerBehavior(input);
    return analysis;
  } catch (error) {
    console.error('Error analyzing customer behavior:', error);
    return { error: 'Failed to generate analysis. Please try again.' };
  }
}
