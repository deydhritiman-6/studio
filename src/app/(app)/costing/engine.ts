import { Ingredient, Recipe, CostingSnapshot } from '@/lib/types';

/**
 * Standardizes units to a common base (grams/milliliters) for calculation
 */
export function convertToStandardBase(quantity: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u === 'kg' || u === 'l') return quantity * 1000;
  if (u === 'mg') return quantity / 1000;
  return quantity; // Assume g, ml, pcs, etc. are base units or don't need scaling for cost
}

/**
 * Calculates the cost of a specific ingredient quantity based on its purchase price
 */
export function calculateIngredientCost(
  usedQty: number, 
  usedUnit: string, 
  purchasePrice: number, 
  purchaseQty: number, 
  purchaseUnit: string
): number {
  if (!purchasePrice || !purchaseQty) return 0;
  
  const baseUsed = convertToStandardBase(usedQty, usedUnit);
  const basePurchase = convertToStandardBase(purchaseQty, purchaseUnit);
  
  const costPerBase = purchasePrice / basePurchase;
  return baseUsed * costPerBase;
}

/**
 * Core Costing Calculation Logic
 */
export function calculateBasicManufacturingCost(params: {
  recipe: Recipe;
  ingredients: Ingredient[];
  snapshot: CostingSnapshot;
  labourHours: number;
  numWorkers: number;
  productionYield: number; // How many units this batch produces
}) {
  const { recipe, ingredients, snapshot, labourHours, numWorkers, productionYield } = params;

  // 1. Raw Material Cost
  let rawMaterialCost = 0;
  recipe.ingredients.forEach((ri) => {
    const master = ingredients.find((i) => i.id === ri.ingredientId);
    if (master && master.purchasePrice && master.purchaseQuantity) {
      rawMaterialCost += calculateIngredientCost(
        ri.quantity,
        ri.unit,
        master.purchasePrice,
        master.purchaseQuantity,
        master.purchaseUnit || master.defaultUnit
      );
    }
  });

  // 2. Wastage Adjustment
  const wastageAmount = rawMaterialCost * (snapshot.wastagePercent / 100);
  const adjustedRawMaterialCost = rawMaterialCost + wastageAmount;

  // 3. Packaging Cost
  const totalPackagingCost = Object.values(snapshot.packagingCosts).reduce((a, b) => a + (b || 0), 0);

  // 4. Labour Cost
  let totalLabourCost = 0;
  if (snapshot.labourType === 'Hour') {
    totalLabourCost = snapshot.labourRate * labourHours * numWorkers;
  } else if (snapshot.labourType === 'Batch') {
    totalLabourCost = snapshot.labourRate;
  } else {
    totalLabourCost = snapshot.labourRate * (productionYield || 1);
  }

  // 5. Manufacturing Overhead
  let totalOverheadCost = 0;
  if (snapshot.overheadType === 'Fixed') {
    totalOverheadCost = snapshot.overheadRate;
  } else {
    const directCost = adjustedRawMaterialCost + totalPackagingCost + totalLabourCost;
    totalOverheadCost = directCost * (snapshot.overheadRate / 100);
  }

  const basicManufacturingCost = adjustedRawMaterialCost + totalPackagingCost + totalLabourCost + totalOverheadCost;
  const costPerUnit = productionYield > 0 ? basicManufacturingCost / productionYield : basicManufacturingCost;

  return {
    rawMaterialCost,
    wastageAmount,
    adjustedRawMaterialCost,
    totalPackagingCost,
    totalLabourCost,
    totalOverheadCost,
    basicManufacturingCost,
    costPerUnit,
    costPer100g: 0, // Calculated separately based on product weight
  };
}
