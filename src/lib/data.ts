import type { Customer, Order, Product, InventoryItem, Recipe, SalesData, TopProductData } from './types';

export const customers: Customer[] = [
  { id: 'C001', name: 'Aarav Sharma', email: 'aarav.sharma@example.com', phone: '+91 9876543210', customerType: 'VIP', vipLevel: 'Platinum', totalPurchaseValue: 150000, joinedDate: '2023-01-15' },
  { id: 'C002', name: 'Vivaan Singh', email: 'vivaan.singh@example.com', phone: '+91 8765432109', customerType: 'Regular', vipLevel: 'None', totalPurchaseValue: 25000, joinedDate: '2023-03-22' },
  { id: 'C003', name: 'Global Exports Inc.', email: 'contact@globalexports.com', phone: '+91 7654321098', customerType: 'Corporate', vipLevel: 'None', totalPurchaseValue: 500000, joinedDate: '2022-11-05' },
  { id: 'C004', name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+91 6543210987', customerType: 'VIP', vipLevel: 'Gold', totalPurchaseValue: 85000, joinedDate: '2023-02-10' },
  { id: 'C005', name: 'Sweet Delights', email: 'orders@sweetdelights.com', phone: '+91 5432109876', customerType: 'Wholesale', vipLevel: 'None', totalPurchaseValue: 1200000, joinedDate: '2022-09-01' },
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
  { id: 'P001', name: 'Velvet Noir 85% Cacao', flavor: 'Dark Chocolate', price: 850, wholesalePrice: 600, availabilityStatus: 'In Stock', imageUrl: "https://picsum.photos/seed/101/400/300", imageHint: "dark chocolate" },
  { id: 'P002', name: 'Golden Hazelnut Praline', flavor: 'Nutty', price: 1200, wholesalePrice: 850, availabilityStatus: 'In Stock', imageUrl: "https://picsum.photos/seed/103/400/300", imageHint: "chocolate praline" },
  { id: 'P003', name: 'Himalayan Pink Salt Caramel', flavor: 'Caramel', price: 950, wholesalePrice: 700, availabilityStatus: 'In Stock', imageUrl: "https://picsum.photos/seed/104/400/300", imageHint: "caramel chocolate" },
  { id: 'P004', name: 'Royal Raspberry Ganache', flavor: 'Fruity', price: 1100, wholesalePrice: 800, availabilityStatus: 'Out of Stock', imageUrl: "https://picsum.photos/seed/105/400/300", imageHint: "raspberry chocolate" },
  { id: 'P005', name: 'Classic Milk Chocolate Bar', flavor: 'Milk Chocolate', price: 650, wholesalePrice: 450, availabilityStatus: 'In Stock', imageUrl: "https://picsum.photos/seed/102/400/300", imageHint: "milk chocolate" },
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
  { month: 'Jan', sales: 4000 },
  { month: 'Feb', sales: 3000 },
  { month: 'Mar', sales: 5000 },
  { month: 'Apr', sales: 4500 },
  { month: 'May', sales: 6000 },
  { month: 'Jun', sales: 5500 },
];

export const topProductsData: TopProductData[] = [
    { name: "Velvet Noir 85%", sales: 400 },
    { name: "Hazelnut Praline", sales: 300 },
    { name: "Salted Caramel", sales: 200 },
    { name: "Raspberry Ganache", sales: 150 },
    { name: "Classic Milk", sales: 100 },
];
