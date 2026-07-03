
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

export type OrderHistoryItem = {
  status: string;
  timestamp: string;
  adminName: string;
  reason?: string;
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
  deliveryStatus: 'New Order' | 'Order Confirmed' | 'Sent for Production' | 'Order On Hold' | 'Order Rejected' | 'Pending' | 'Confirmed' | 'Preparing' | 'Packed' | 'Shipped' | 'Delivered';
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

export type Product = {
  id: string;
  name: string;
  flavor: string;
  price: number;
  wholesalePrice: number;
  availabilityStatus: 'In Stock' | 'Out of Stock';
  imageUrls: string[];
  imageHint: string;
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

export type Distributor = {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  region: string;
  state: string;
  district: string;
  status: 'Active' | 'Inactive';
  lastOrderDate: string;
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
