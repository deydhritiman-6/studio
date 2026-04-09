'use server';

import { recommendChocolate, type RecommendChocolateInput, type RecommendChocolateOutput } from '@/ai/flows/recommend-chocolate';
import { customers, orders, products } from '@/lib/data';

export async function getChocolateRecommendations(customerId: string): Promise<RecommendChocolateOutput | { error: string }> {
  if (!customerId) {
    return { error: 'Customer ID is required.' };
  }

  const customer = customers.find((c) => c.id === customerId);
  if (!customer) {
    return { error: 'Customer not found.' };
  }

  // Get the customer's orders
  const customerOrders = orders.filter((o) => o.customerId === customerId);

  // Build the purchase history from the orders
  const purchaseHistory: RecommendChocolateInput['purchaseHistory'] = customerOrders.flatMap((order) =>
    order.products.map((p) => {
      const productDetails = products.find((prod) => prod.id === p.productId);
      return {
        productId: p.productId,
        productName: productDetails?.name || 'Unknown',
        flavor: productDetails?.flavor || 'Unknown',
        quantity: p.quantity,
      };
    })
  );

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
