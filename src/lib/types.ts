
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

export type Product = {
  id: string;
  name: string;
  flavor: string;
  weight?: string;
  dimensions?: string; // Legacy string format
  productDimensions?: ProductDimensions; // New structured format
  productShape?: 'Square' | 'Rectangular' | 'Spherical' | 'Half Spherical' | 'Circular' | 'Cylindrical' | 'Oval' | 'Heart' | 'Triangular' | 'Conical' | 'Irregular' | 'Other';
  productSkin?: 'Dark' | 'Milk' | 'White' | 'Rose' | 'Gold'; // Legacy skin field
  productTexture?: string; // ID of the texture from the library
  textureId?: string;
  textureName?: string;
  textureCategory?: string;
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

export type Recipe = {
  id: string;
  name: string;
  associatedProduct: string;
  ingredients: { name: string; quantity: string }[];
};

export type InventoryItem = {
  id: string;
  name: string;
  category: 'Raw Materials' | 'Packaging Materials' | 'Finished Products';
  stockLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
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
