'use server';

import { recommendChocolate, type RecommendChocolateInput, type RecommendChocolateOutput } from '@/ai/flows/recommend-chocolate';

export async function getChocolateRecommendations(customerId: string): Promise<RecommendChocolateOutput | { error: string }> {
  if (!customerId) {
    return { error: 'Customer ID is required.' };
  }

  // In a real application, you would fetch this data from your database based on the customerId.
  const mockPurchaseHistory: RecommendChocolateInput['purchaseHistory'] = [
    { productId: 'P001', productName: 'Velvet Noir 85% Cacao', flavor: 'dark', quantity: 2 },
    { productId: 'P003', productName: 'Himalayan Pink Salt Caramel', flavor: 'caramel', quantity: 3 },
  ];

  try {
    const recommendations = await recommendChocolate({
      customerId: customerId,
      purchaseHistory: mockPurchaseHistory,
    });
    return recommendations;
  } catch (error) {
    console.error('Error getting chocolate recommendations:', error);
    return { error: 'Failed to generate recommendations. Please try again.' };
  }
}
