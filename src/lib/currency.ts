/**
 * @fileOverview Centralized Indian Rupee (INR) currency formatter.
 */

export const formatINR = (amount: number | string): string => {
  const numericAmount =
    typeof amount === "string"
      ? Number(amount.replace(/[₹₽,\s]/g, ""))
      : amount;

  if (!Number.isFinite(numericAmount)) {
    return "₹0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numericAmount);
};
