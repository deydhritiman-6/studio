/**
 * @fileOverview Centralized color mapping for Admin Panel functional workspaces.
 */

export const WORKSPACE_COLORS = {
  core: { color: '#0ea5e9', label: 'Orders & Invoicing' },      // Sky Blue
  recipes: { color: '#10b981', label: 'Recipes & Ingredients' }, // Emerald Green
  products: { color: '#2563eb', label: 'Product Portfolio' },    // Vivid Blue
  commercial: { color: '#f59e0b', label: 'Costing Intelligence' }, // Amber Gold
  procurement: { color: '#14b8a6', label: 'Vendors & Procurement' }, // Teal
  broadcasting: { color: '#a855f7', label: 'Broadcasting Systems' }, // Purple
  ai: { color: '#f43f5e', label: 'AI & Analytics' },            // Rose Pink
  optimization: { color: '#f97316', label: 'Administration & Settings' }, // Orange
  default: { color: '#64748b', label: 'Workspace' }             // Slate
};

export const getWorkspaceConfig = (pathname: string) => {
  const path = pathname || '';
  
  // Orders & Invoicing (Sky Blue)
  if (path.includes('/dashboard') || path.includes('/performance') || path.includes('/customers') || path.includes('/orders') || path.includes('/production') || path.includes('/gst-billing') || path.includes('/invoices')) {
    return WORKSPACE_COLORS.core;
  }
  
  // Recipes & Ingredients (Emerald Green)
  if (path.includes('/recipes') || path.includes('/ingredients')) {
    return WORKSPACE_COLORS.recipes;
  }
  
  // Product Portfolio (Vivid Blue)
  if (path.includes('/products') || path.includes('/photo-gallery')) {
    return WORKSPACE_COLORS.products;
  }
  
  // Vendors & Procurement (Teal)
  if (path.includes('/vendors') || path.includes('/material-purchase') || path.includes('/inventory')) {
    return WORKSPACE_COLORS.procurement;
  }
  
  // Costing Intelligence / Commercial (Amber Gold)
  if (path.includes('/quotations') || path.includes('/billing/shipping-status') || path.includes('/billing/tracking-visibility') || path.includes('/distributors') || path.includes('/costing')) {
    return WORKSPACE_COLORS.commercial;
  }
  
  // Broadcasting (Purple)
  if (path.includes('/broadcast')) {
    return WORKSPACE_COLORS.broadcasting;
  }
  
  // AI System (Rose Pink)
  if (path.includes('/ai') || path.includes('/analytics') || path.includes('/marketing') || path.includes('/vip-clients')) {
    return WORKSPACE_COLORS.ai;
  }
  
  // Optimization & Admin (Orange)
  if (path.includes('/seo-dashboard') || path.includes('/settings') || path.includes('/guide') || path.includes('/user-guide')) {
    return WORKSPACE_COLORS.optimization;
  }
  
  return WORKSPACE_COLORS.default;
};
