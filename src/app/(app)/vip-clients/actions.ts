'use server';

import {
  analyzeVIPCustomerBehavior,
  type AnalyzeVIPCustomerBehaviorInput,
  type AnalyzeVIPCustomerBehaviorOutput,
} from '@/ai/flows/analyze-vip-customer-behavior';
import { customers, orders, products } from '@/lib/data';

export async function analyzeCustomerAction(
  customerId: string
): Promise<AnalyzeVIPCustomerBehaviorOutput | { error: string }> {
  const customer = customers.find((c) => c.id === customerId);

  if (!customer) {
    return { error: 'Customer not found.' };
  }

  // In a real application, you would fetch this data from your database.
  // For this demo, we'll filter the mock data.
  const customerOrders = orders.filter((o) => o.customerId === customerId);

  const purchaseHistory: AnalyzeVIPCustomerBehaviorInput['purchaseHistory'] = customerOrders.map(order => ({
    orderId: order.id,
    orderDate: order.orderDate,
    totalAmount: order.totalAmount,
    products: order.products.map(p => products.find(prod => prod.id === p.productId)?.name || 'Unknown Product'),
  }));

  // Mock interaction logs and feedback for the demo
  const interactionLogs: AnalyzeVIPCustomerBehaviorInput['interactionLogs'] = [
    { date: '2024-04-15', type: 'Email', summary: 'Inquired about new dark chocolate collection.' },
    { date: '2024-05-20', type: 'WhatsApp', summary: 'Positive feedback on the Velvet Noir 85% Cacao order.' },
  ];

  const feedback: AnalyzeVIPCustomerBehaviorInput['feedback'] = [
    "The packaging is exquisite and feels very premium.",
    "Would love to see more sugar-free options.",
  ];
  
  const customerProfile: AnalyzeVIPCustomerBehaviorInput['customerProfile'] = {
    name: customer.name,
    email: customer.email,
    vipLevel: customer.vipLevel,
    customerType: customer.customerType,
    totalPurchaseValue: customer.totalPurchaseValue,
    // Mock birthday/anniversary for demo purposes
    birthday: '1985-08-22', 
  };


  try {
    const analysis = await analyzeVIPCustomerBehavior({
      customerId: customer.id,
      customerProfile,
      purchaseHistory,
      interactionLogs,
      feedback,
    });
    return analysis;
  } catch (error) {
    console.error('Error analyzing customer behavior:', error);
    return { error: 'Failed to generate analysis. Please try again.' };
  }
}
