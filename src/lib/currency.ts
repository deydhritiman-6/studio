/**
 * @fileOverview Centralized Indian Rupee (INR) currency formatter.
 */

export const formatINR = (amount: number | string): string => {
  const numericAmount =
    typeof amount === "string"
      ? Number(amount.replace(/[₹₱,\s]/g, ""))
      : amount;

  if (!Number.isFinite(numericAmount) || numericAmount === null) {
    return "₹0";
  }

  // We explicitly prepend the ₹ symbol and use Indian locale number formatting
  // to ensure a consistent "₹900" style and avoid environment-specific Intl differences.
  const formattedNumber = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericAmount);

  return `₹${formattedNumber}`;
};
