'use server';

import { recommendChocolate, type RecommendChocolateInput, type RecommendChocolateOutput } from '@/ai/flows/recommend-chocolate';

export async function getChocolateRecommendationsAction(
  customerId: string,
  purchaseHistory: RecommendChocolateInput['purchaseHistory']
): Promise<RecommendChocolateOutput | { error: string }> {
  if (!customerId) {
    return { error: 'Customer ID is required.' };
  }

  try {
    const recommendations = await recommendChocolate({
      customerId: customerId,
      purchaseHistory: purchaseHistory,
    });
    return recommendations;
  } catch (error) {
    console.error('Error getting chocolate recommendations:', error);
    return { error: 'Failed to generate recommendations. Please try again.' };
  }
}
