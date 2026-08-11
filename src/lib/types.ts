
export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  customerType: 'VIP' | 'Regular' | 'Corporate' | 'Wholesale';
  vipLevel: 'Gold' | 'Platinum' | 'Diamond' | 'Silver';
  totalPurchaseValue: number;
  joinedDate: string;
};

export type UserAccount = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'Super Admin' | 'Store Manager' | 'Staff';
  photoUrl?: string;
  createdAt: string;
  permissions: string[];
};

export type Ingredient = {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  description?: string;
  defaultUnit: 'mg' | 'g' | 'kg' | 'ml' | 'L' | 'pcs' | 'tbsp' | 'tsp' | 'pinch';
  density?: number;
  allergens?: string[];
  purchasePrice?: number;
  purchaseQuantity?: number;
  purchaseUnit?: string;
  isActive: boolean;
  isFavourite?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RecipeIngredient = {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  percentage?: number;
  preparation?: string;
  stage?: string;
  notes?: string;
  order: number;
};

export type RecipeStep = {
  id: string;
  title: string;
  instructions: string;
  temperature?: number;
  tempUnit: 'C' | 'F';
  time?: number;
  equipment?: string;
  order: number;
};

export type Recipe = {
  id: string;
  name: string;
  code?: string;
  associatedProductId?: string;
  productName?: string;
  chocolateType?: string;
  currentVersion: string;
  status: 'Draft' | 'Testing' | 'Approved' | 'Published' | 'Archived';
  difficulty?: 'Easy' | 'Intermediate' | 'Professional' | 'Master';
  prepTime?: number;
  processTime?: number;
  batchSize: number;
  batchUnit: string;
  yield?: number;
  yieldUnit?: string;
  shortDescription?: string;
  detailedDescription?: string;
  internalNotes?: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  allergens: string[];
  totalCost?: number;
  costPer100g?: number;
  updatedBy: string;
  updatedAt: string;
  createdAt: string;
};

export type OrderHistoryItem = {
  status: string;
  timestamp: string;
  adminName: string;
  reason?: string;
  recipeId?: string;
  recipeName?: string;
};

export type Order = {
  id: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  totalAmount: number;
  products: {
    productId: string;
    quantity: number;
  }[];
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  deliveryStatus: 'New Order' | 'Order Confirmed' | 'Sent for Production' | 'Order On Hold' | 'Order Rejected' | 'Pending' | 'Confirmed' | 'Preparing' | 'Packed' | 'Shipped' | 'Delivered' | 'New Order for Production' | 'Production Started' | 'Production Ongoing' | 'Production Complete' | 'Product Packaging Complete' | 'Product Ready';
  statusReason?: string;
  history?: OrderHistoryItem[];
  shippingStatus?: 'Order Received' | 'Production in Progress' | 'Ready for Dispatch' | 'Dispatched' | 'Delivered' | 'Cancelled' | 'On Hold';
  dispatchDetails?: {
    description: string;
    courierName: string;
    trackingNumber: string;
    dispatchDate: string;
    expectedDeliveryDate?: string;
    updatedBy: string;
    updatedAt: string;
  };
};

export type QuotationItem = {
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
};

export type Quotation = {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  expiryDate: string;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Expired' | 'Converted to Order';
  items: QuotationItem[];
  notes?: string;
  terms?: string;
};

export type ProductDimensions = {
  unit: 'mm' | 'cm' | 'inch';
  length?: number;
  width?: number;
  height?: number;
  diameter?: number;
  sideLength?: number;
  base?: number;
  radius?: number;
  custom1?: number;
  custom2?: number;
  custom3?: number;
  customLabel1?: string;
  customLabel2?: string;
  customLabel3?: string;
  additionalDescription?: string;
};

export type SurfacePatternParams = {
  length?: number;
  width?: number;
  depth?: number;
  scale?: number;
  repeatX?: number;
  repeatY?: number;
  spacing?: number;
  offsetX?: number;
  offsetY?: number;
  rotation?: number;
};

export type ProductTexture = {
  id: string;
  name: string;
  category: string;
  description: string;
  color: number;
  roughness: number;
  metalness: number;
  normalType?: 'Smooth' | 'Velvet' | 'Hammered' | 'Ridged' | 'Dusted' | 'Cracked' | 'Bubbles' | 'Rippled';
  glossLevel?: 'Glossy' | 'Satin' | 'Matte' | 'Semi-Matte';
};

export type SurfacePattern = 
  | 'None' 
  | 'Molded Chocolate Grid Texture' 
  | 'Rippled Surface' 
  | 'Wavy Surface' 
  | 'Ribbed Surface' 
  | 'Striped Surface'
  | 'Crosshatch Surface'
  | 'Polka Dot Surface'
  | 'Granular Surface'
  | 'Embossed Surface' 
  | 'Debossed Surface';

export type SegmentType = 'Square' | 'Rectangular' | 'Rounded' | 'Modular' | 'Premium';

export type Product = {
  id: string;
  name: string;
  flavor: string;
  weight?: string;
  dimensions?: string;
  productDimensions?: ProductDimensions;
  surfacePatternParams?: SurfacePatternParams;
  productShape?: 'Square' | 'Rectangular' | 'Spherical' | 'Half Spherical' | 'Circular' | 'Cylindrical' | 'Oval' | 'Heart' | 'Triangular' | 'Conical' | 'Irregular' | 'Other' | 'Bar' | 'Dome';
  productSkin?: 'Dark' | 'Milk' | 'White' | 'Rose' | 'Gold';
  productTexture?: string;
  textureId?: string;
  textureName?: string;
  textureCategory?: string;
  surfacePattern?: SurfacePattern;
  segmentType?: SegmentType;
  price: number;
  wholesalePrice: number;
  availabilityStatus: 'In Stock' | 'Out of Stock';
  imageUrls: string[];
  mainImage?: string;
  subImages?: string[];
  imageHint: string;
  sku?: string;
  recipeUsed?: string;
  productionDate?: string;
  packagingDate?: string;
  quantityProduced?: number;
  unitOfMeasurement?: string;
  manufacturingCost?: number;
  expiryDate?: string;
  productionStatus?: string;
  originalOrderId?: string;
  isArchived?: boolean;
  deletedAt?: string;
};

export type ProductGallery = {
  id: string;
  productId: string;
  productName: string;
  mainImage: string;
  subImages: string[];
  createdAt: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: 'Raw Materials' | 'Packaging Materials' | 'Finished Products';
  stockLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
};

export type Vendor = {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  categories: string[];
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
};

export type PurchaseItem = {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
};

export type MaterialPurchase = {
  id: string;
  purchaseDate: string;
  vendorId: string;
  vendorName: string;
  invoiceNumber: string;
  totalAmount: number;
  status: 'Ordered' | 'Received' | 'Cancelled';
  items: PurchaseItem[];
  createdAt: string;
  updatedAt: string;
};

export type SalesData = {
  month: string;
  sales: number;
};

export type TopProductData = {
  name: string;
  sales: number;
};

export type PerformanceDataPoint = {
  month: string;
  previousMonthName: string;
  currentMonthName: string;
  previousSales: number;
  currentSales: number;
  previousRevenue: number;
  currentRevenue: number;
  previousOrders: number;
  currentOrders: number;
  previousCustomers: number;
  currentCustomers: number;
};

export type CostingSnapshot = {
  ingredientPrices: Record<string, { purchasePrice: number; purchaseQuantity: number; purchaseUnit: string }>;
  packagingCosts: {
    primary?: number;
    secondary?: number;
    label?: number;
    box?: number;
    other?: number;
  };
  labourRate: number;
  labourType: 'Hour' | 'Batch' | 'Unit';
  overheadRate: number;
  overheadType: 'Fixed' | 'Percentage';
  wastagePercent: number;
};

export type Costing = {
  id: string;
  productId: string;
  productName: string;
  productCode?: string;
  recipeId?: string;
  recipeName?: string;
  recipeVersion?: string;
  version: string;
  date: string;
  status: 'Draft' | 'Calculated' | 'Reviewed' | 'Approved' | 'Archived';
  
  snapshot: CostingSnapshot;
  
  labourHours: number;
  numWorkers: number;
  productionYield: number;
  
  results: {
    rawMaterialCost: number;
    wastageAmount: number;
    adjustedRawMaterialCost: number;
    totalPackagingCost: number;
    totalLabourCost: number;
    totalOverheadCost: number;
    basicManufacturingCost: number;
    costPerUnit: number;
    costPer100g: number;
  };
  
  pricing?: {
    desiredProfitPercent: number;
    distributorMarginPercent: number;
    suggestedRetailPrice: number;
  };
  
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
