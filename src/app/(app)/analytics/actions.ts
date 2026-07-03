'use server';

import { forecastChocolateDemand, type DemandForecastInput, type DemandForecastOutput } from '@/ai/flows/forecast-chocolate-demand';

export async function getDemandForecastAction(
  input: DemandForecastInput
): Promise<DemandForecastOutput | { error: string }> {
  try {
    const result = await forecastChocolateDemand(input);
    return result;
  } catch (error) {
    console.error('Error generating demand forecast:', error);
    return { error: 'Failed to generate forecast. Please try again.' };
  }
}
