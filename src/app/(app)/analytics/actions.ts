'use server';

import { forecastChocolateDemand, type DemandForecastInput, type DemandForecastOutput } from '@/ai/flows/forecast-chocolate-demand';
import { products } from '@/lib/data';

export async function getDemandForecastAction(
  input: Omit<DemandForecastInput, 'historicalSalesData' | 'productName'>
): Promise<DemandForecastOutput | { error: string }> {
  
  const product = products.find(p => p.id === input.productId);
  if (!product) {
    return { error: 'Product not found.' };
  }

  // In a real application, you would fetch this from a database.
  // For this demo, we'll generate some mock historical data.
  const mockHistoricalSales: DemandForecastInput['historicalSalesData'] = [
    { date: '2024-04-01', salesCount: Math.floor(Math.random() * 20) + 10 },
    { date: '2024-04-08', salesCount: Math.floor(Math.random() * 20) + 15 },
    { date: '2024-04-15', salesCount: Math.floor(Math.random() * 25) + 20 },
    { date: '2024-04-22', salesCount: Math.floor(Math.random() * 30) + 18 },
    { date: '2024-04-29', salesCount: Math.floor(Math.random() * 28) + 22 },
    { date: '2024-05-06', salesCount: Math.floor(Math.random() * 35) + 25 },
    { date: '2024-05-13', salesCount: Math.floor(Math.random() * 40) + 30 },
    { date: '2024-05-20', salesCount: Math.floor(Math.random() * 38) + 28 },
  ];

  try {
    const result = await forecastChocolateDemand({
      ...input,
      productName: product.name,
      historicalSalesData: mockHistoricalSales,
    });
    return result;
  } catch (error) {
    console.error('Error generating demand forecast:', error);
    return { error: 'Failed to generate forecast. Please try again.' };
  }
}
