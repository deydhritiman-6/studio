import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/login/', '/settings/', '/seo-dashboard/', '/shop/success'],
      },
    ],
    sitemap: 'https://roseberrychocolate.com/sitemap.xml',
  };
}
