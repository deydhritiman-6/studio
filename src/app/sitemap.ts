import { MetadataRoute } from 'next';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Product } from '@/lib/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://roseberrychocolate.com';
  
  // Base routes
  const routes = [
    '',
    '/shop',
    '/shop/cart',
    '/shop/my-orders',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Fetch products for dynamic sitemap
  try {
    const { firestore } = initializeFirebase();
    const productsSnapshot = await getDocs(collection(firestore, 'products'));
    
    // Filter out archived products from the sitemap
    const productRoutes = productsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Product))
      .filter((p) => !p.isArchived)
      .map((p) => ({
        url: `${baseUrl}/shop/product/${p.id}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));

    return [...routes, ...productRoutes];
  } catch (error) {
    console.error('Sitemap product fetch failed', error);
    return routes;
  }
}
