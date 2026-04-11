import type { Customer, Order, Product, InventoryItem, Recipe, SalesData, TopProductData, Distributor, PerformanceDataPoint } from './types';

export const customers: Customer[] = [
  { id: 'C001', name: 'Aarav Sharma', email: 'aarav.sharma@example.com', phone: '+91 9876543210', customerType: 'VIP', vipLevel: 'Platinum', totalPurchaseValue: 150000, joinedDate: '2023-01-15' },
  { id: 'C002', name: 'Vivaan Singh', email: 'vivaan.singh@example.com', phone: '+91 8765432109', customerType: 'Regular', vipLevel: 'Silver', totalPurchaseValue: 25000, joinedDate: '2023-03-22' },
  { id: 'C003', name: 'Global Exports Inc.', email: 'contact@globalexports.com', phone: '+91 7654321098', customerType: 'Corporate', vipLevel: 'Silver', totalPurchaseValue: 500000, joinedDate: '2022-11-05' },
  { id: 'C004', name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+91 6543210987', customerType: 'VIP', vipLevel: 'Gold', totalPurchaseValue: 85000, joinedDate: '2023-02-10' },
  { id: 'C005', name: 'Sweet Delights', email: 'orders@sweetdelights.com', phone: '+91 5432109876', customerType: 'Wholesale', vipLevel: 'Silver', totalPurchaseValue: 1200000, joinedDate: '2022-09-01' },
];

export const orders: Order[] = [
  { id: 'ORD-001', customerId: 'C001', customerName: 'Aarav Sharma', orderDate: '2024-05-20', totalAmount: 12500, products: [{ productId: 'P001', quantity: 10 }, { productId: 'P002', quantity: 5 }], paymentStatus: 'Paid', deliveryStatus: 'Delivered' },
  { id: 'ORD-002', customerId: 'C002', customerName: 'Vivaan Singh', orderDate: '2024-05-18', totalAmount: 3200, products: [{ productId: 'P005', quantity: 5 }], paymentStatus: 'Paid', deliveryStatus: 'Shipped' },
  { id: 'ORD-003', customerId: 'C005', customerName: 'Sweet Delights', orderDate: '2024-05-15', totalAmount: 150000, products: [{ productId: 'P001', quantity: 100 }, { productId: 'P005', quantity: 200 }], paymentStatus: 'Paid', deliveryStatus: 'Packed' },
  { id: 'ORD-004', customerId: 'C003', customerName: 'Global Exports Inc.', orderDate: '2024-05-12', totalAmount: 85000, products: [{ productId: 'P003', quantity: 50 }, { productId: 'P004', quantity: 50 }], paymentStatus: 'Pending', deliveryStatus: 'Confirmed' },
  { id: 'ORD-005', customerId: 'C004', customerName: 'Priya Patel', orderDate: '2024-05-10', totalAmount: 8800, products: [{ productId: 'P002', quantity: 4 }, { productId: 'P004', quantity: 4 }], paymentStatus: 'Paid', deliveryStatus: 'Preparing' },
  { id: 'ORD-006', customerId: 'C001', customerName: 'Aarav Sharma', orderDate: '2024-05-08', totalAmount: 7200, products: [{ productId: 'P003', quantity: 8 }], paymentStatus: 'Paid', deliveryStatus: 'Delivered' },
];

export const products: Product[] = [
  { id: 'P001', name: 'Velvet Noir 85% Cacao', flavor: 'Dark Chocolate', price: 850, wholesalePrice: 600, availabilityStatus: 'In Stock', imageUrls: ["https://picsum.photos/seed/101/400/300", "https://picsum.photos/seed/101a/200/150", "https://picsum.photos/seed/101b/200/150", "https://picsum.photos/seed/101c/200/150"], imageHint: "dark chocolate" },
  { id: 'P002', name: 'Golden Hazelnut Praline', flavor: 'Nutty', price: 1200, wholesalePrice: 850, availabilityStatus: 'In Stock', imageUrls: ["https://picsum.photos/seed/103/400/300", "https://picsum.photos/seed/103a/200/150", "https://picsum.photos/seed/103b/200/150", "https://picsum.photos/seed/103c/200/150"], imageHint: "chocolate praline" },
  { id: 'P003', name: 'Himalayan Pink Salt Caramel', flavor: 'Caramel', price: 950, wholesalePrice: 700, availabilityStatus: 'In Stock', imageUrls: ["https://picsum.photos/seed/104/400/300", "https://picsum.photos/seed/104a/200/150", "https://picsum.photos/seed/104b/200/150", "https://picsum.photos/seed/104c/200/150"], imageHint: "caramel chocolate" },
  { id: 'P004', name: 'Royal Raspberry Ganache', flavor: 'Fruity', price: 1100, wholesalePrice: 800, availabilityStatus: 'Out of Stock', imageUrls: ["https://picsum.photos/seed/105/400/300", "https://picsum.photos/seed/105a/200/150", "https://picsum.photos/seed/105b/200/150", "https://picsum.photos/seed/105c/200/150"], imageHint: "raspberry chocolate" },
  { id: 'P005', name: 'Classic Milk Chocolate Bar', flavor: 'Milk Chocolate', price: 650, wholesalePrice: 450, availabilityStatus: 'In Stock', imageUrls: ["https://picsum.photos/seed/102/400/300", "https://picsum.photos/seed/102a/200/150", "https://picsum.photos/seed/102b/200/150", "https://picsum.photos/seed/102c/200/150"], imageHint: "milk chocolate" },
];

export const recipes: Recipe[] = [
  { id: 'R001', name: 'Velvet Noir 85% Cacao Recipe', associatedProduct: 'Velvet Noir 85% Cacao', ingredients: [{ name: 'Cocoa Beans', quantity: '1kg' }, { name: 'Cocoa Butter', quantity: '200g' }, { name: 'Jaggery', quantity: '150g' }] },
  { id: 'R002', name: 'Golden Hazelnut Praline Recipe', associatedProduct: 'Golden Hazelnut Praline', ingredients: [{ name: 'Hazelnuts', quantity: '500g' }, { name: 'Milk Chocolate', quantity: '1kg' }, { name: 'Sugar', quantity: '300g' }] },
  { id: 'R003', name: 'Himalayan Pink Salt Caramel Recipe', associatedProduct: 'Himalayan Pink Salt Caramel', ingredients: [{ name: 'Sugar', quantity: '500g' }, { name: 'Cream', quantity: '250ml' }, { name: 'Himalayan Salt', quantity: '10g' }] },
];

export const inventory: InventoryItem[] = [
  { id: 'INV001', name: 'Cocoa Beans', category: 'Raw Materials', stockLevel: 50, status: 'In Stock' },
  { id: 'INV002', name: 'Milk Powder', category: 'Raw Materials', stockLevel: 12, status: 'Low Stock' },
  { id: 'INV003', name: 'Luxury Gift Box (12 pcs)', category: 'Packaging Materials', stockLevel: 200, status: 'In Stock' },
  { id: 'INV004', name: 'Velvet Noir 85% Cacao Bar', category: 'Finished Products', stockLevel: 80, status: 'In Stock' },
  { id: 'INV005', name: 'Golden Hazelnut Praline', category: 'Finished Products', stockLevel: 8, status: 'Low Stock' },
  { id: 'INV006', name: 'Gold Foil Wrappers', category: 'Packaging Materials', stockLevel: 5000, status: 'In Stock' },
];

export const recentSalesData: SalesData[] = [
  { month: 'Jan', sales: 400000 },
  { month: 'Feb', sales: 300000 },
  { month: 'Mar', sales: 500000 },
  { month: 'Apr', sales: 450000 },
  { month: 'May', sales: 600000 },
  { month: 'Jun', sales: 550000 },
];

export const topProductsData: TopProductData[] = [
    { name: "Velvet-Noir-85%-Cacao", sales: 400 },
    { name: "Golden-Hazelnut-Praline", sales: 300 },
    { name: "Himalayan-Pink-Salt-Caramel", sales: 200 },
    { name: "Royal-Raspberry-Ganache", sales: 150 },
    { name: "Classic-Milk-Chocolate-Bar", sales: 100 },
];

export const distributors: Distributor[] = [
  { id: 'D001', name: 'Premium Foods India', contactPerson: 'Rohan Mehta', email: 'rohan@premiumfoods.in', phone: '+91 9988776655', region: 'North India', state: 'Delhi', district: 'New Delhi', status: 'Active', lastOrderDate: '2024-05-15' },
  { id: 'D002', name: 'South Delicacies', contactPerson: 'Ananya Rao', email: 'ananya@southdelicacies.com', phone: '+91 8877665544', region: 'South India', state: 'Karnataka', district: 'Bengaluru (Bangalore) Urban', status: 'Active', lastOrderDate: '2024-05-18' },
  { id: 'D003', name: 'Western Gourmet', contactPerson: 'Siddharth Joshi', email: 'sid@westerngourmet.co', phone: '+91 7766554433', region: 'West India', state: 'Maharashtra', district: 'Mumbai City', status: 'Inactive', lastOrderDate: '2023-12-10' },
  { id: 'D004', name: 'Eastern Treats', contactPerson: 'Ishita Banerjee', email: 'ishita@easterntreats.net', phone: '+91 6655443322', region: 'East India', state: 'West Bengal', district: 'Kolkata', status: 'Active', lastOrderDate: '2024-04-30' },
];

export const performanceData: PerformanceDataPoint[] = [
  { month: 'Month One', previousMonthName: 'January', currentMonthName: 'July', previousSales: 350, currentSales: 450, previousRevenue: 350000, currentRevenue: 450000, previousOrders: 80, currentOrders: 100, previousCustomers: 20, currentCustomers: 25 },
  { month: 'Month Two', previousMonthName: 'February', currentMonthName: 'August', previousSales: 380, currentSales: 480, previousRevenue: 380000, currentRevenue: 480000, previousOrders: 85, currentOrders: 110, previousCustomers: 22, currentCustomers: 28 },
  { month: 'Month Three', previousMonthName: 'March', currentMonthName: 'September', previousSales: 420, currentSales: 520, previousRevenue: 420000, currentRevenue: 520000, previousOrders: 95, currentOrders: 120, previousCustomers: 25, currentCustomers: 32 },
  { month: 'Month Four', previousMonthName: 'April', currentMonthName: 'October', previousSales: 400, currentSales: 550, previousRevenue: 400000, currentRevenue: 550000, previousOrders: 90, currentOrders: 130, previousCustomers: 24, currentCustomers: 35 },
  { month: 'Month Five', previousMonthName: 'May', currentMonthName: 'November', previousSales: 450, currentSales: 580, previousRevenue: 450000, currentRevenue: 580000, previousOrders: 100, currentOrders: 140, previousCustomers: 28, currentCustomers: 40 },
  { month: 'Month Six', previousMonthName: 'June', currentMonthName: 'December', previousSales: 480, currentSales: 620, previousRevenue: 480000, currentRevenue: 620000, previousOrders: 110, currentOrders: 150, previousCustomers: 30, currentCustomers: 45 },
];
