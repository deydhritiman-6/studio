/**
 * @fileOverview Centralized color mapping for Admin Panel functional workspaces.
 */

export const WORKSPACE_COLORS = {
  core: { color: '#0ea5e9', label: 'Core Operations' }, // Sky Blue
  recipes: { color: '#10b981', label: 'Recipes & Ingredients' }, // Emerald Green
  products: { color: '#2563eb', label: 'Product Portfolio' }, // Vivid Blue
  procurement: { color: '#14b8a6', label: 'Procurement & Logistics' }, // Teal
  billing: { color: '#6366f1', label: 'Billing & Invoices' }, // Indigo
  commercial: { color: '#f59e0b', label: 'Commercial & Costing' }, // Amber Gold
  ai: { color: '#f43f5e', label: 'AI System' }, // Rose Pink
  optimization: { color: '#f97316', label: 'Optimization & Admin' }, // Orange
  default: { color: '#64748b', label: 'Workspace' } // Slate
};

export const getWorkspaceConfig = (pathname: string) => {
  const path = pathname || '';
  
  // Core Operations: Dashboard, Performance, Customers, Orders, Production
  if (path.includes('/dashboard') || path.includes('/performance') || path.includes('/customers') || path.includes('/orders') || path.includes('/production')) {
    return WORKSPACE_COLORS.core;
  }
  
  // Recipes: Recipe Manager, Ingredient Library
  if (path.includes('/recipes') || path.includes('/ingredients')) {
    return WORKSPACE_COLORS.recipes;
  }
  
  // Products: Artisan Portfolio, Product Bin
  if (path.includes('/products')) {
    return WORKSPACE_COLORS.products;
  }
  
  // Procurement & Logistics: Vendors, Material Purchase, Photo Gallery, Inventory
  if (path.includes('/vendors') || path.includes('/material-purchase') || path.includes('/photo-gallery') || path.includes('/inventory')) {
    return WORKSPACE_COLORS.procurement;
  }
  
  // Billing & Invoices: Create Invoice, View Invoices
  if (path.includes('/gst-billing') || path.includes('/invoices')) {
    return WORKSPACE_COLORS.billing;
  }
  
  // Commercial: Quotations, Dispatch, Visibility, Distributors, Broadcasts, Costing
  if (path.includes('/quotations') || path.includes('/billing/shipping-status') || path.includes('/billing/tracking-visibility') || path.includes('/distributors') || path.includes('/broadcast') || path.includes('/costing')) {
    return WORKSPACE_COLORS.commercial;
  }
  
  // AI System
  if (path.includes('/ai') || path.includes('/analytics') || path.includes('/marketing') || path.includes('/vip-clients')) {
    return WORKSPACE_COLORS.ai;
  }
  
  // Optimization & Admin
  if (path.includes('/seo-dashboard') || path.includes('/settings') || path.includes('/guide') || path.includes('/user-guide')) {
    return WORKSPACE_COLORS.optimization;
  }
  
  return WORKSPACE_COLORS.default;
};
