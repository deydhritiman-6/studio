import type { Metadata, Viewport } from 'next';
import { Playfair_Display, PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { FirebaseClientProvider } from '@/firebase';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
  display: 'swap',
});

const ptSans = PT_Sans({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-pt-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#3D1E16',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://roseberrychocolate.com'),
  title: {
    default: 'Roseberry Chocolate | Artisan Handmade Chocolates in Kolkata',
    template: '%s | Roseberry Chocolate',
  },
  description: 'Indulge in Kolkata\'s finest artisan chocolates. Hand-crafted single-origin truffles, pralines, and gift boxes made with love and extraordinary patience.',
  keywords: ['Artisan Chocolate Kolkata', 'Handmade Chocolate India', 'Luxury Truffles', 'Single Origin Chocolate', 'Chocolate Gift Boxes Kolkata', 'Premium Pralines'],
  authors: [{ name: 'Roseberry Chocolate LLP' }],
  creator: 'Roseberry Chocolate',
  publisher: 'Roseberry Chocolate LLP',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://roseberrychocolate.com',
    siteName: 'Roseberry Chocolate',
    title: 'Roseberry Chocolate | Artisan Handmade Chocolates in Kolkata',
    description: 'Exquisite single-origin handmade chocolates. Kolkata\'s premier artisan chocolate studio.',
    images: [
      {
        url: '/rosebg.jpeg',
        width: 1200,
        height: 630,
        alt: 'Roseberry Chocolate Artisan Studio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roseberry Chocolate | Artisan Handmade Chocolates',
    description: 'Handmade luxury chocolates from the heart of Kolkata.',
    images: ['/rosebg.jpeg'],
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Roseberry Chocolate",
    "alternateName": "Roseberry Chocolate LLP",
    "url": "https://roseberrychocolate.com",
    "logo": "https://roseberrychocolate.com/Roseberry Logo.jpeg",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-9876543210",
      "contactType": "customer service",
      "areaServed": "IN",
      "availableLanguage": ["en", "Hindi", "Bengali"]
    },
    "sameAs": [
      "https://www.instagram.com/roseberrychocolate",
      "https://www.facebook.com/roseberrychocolate"
    ]
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    "name": "Roseberry Chocolate Studio",
    "image": "https://roseberrychocolate.com/rosebg.jpeg",
    "@id": "https://roseberrychocolate.com",
    "url": "https://roseberrychocolate.com",
    "telephone": "+91-9876543210",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Chocolate Lane",
      "addressLocality": "Kolkata",
      "postalCode": "700001",
      "addressRegion": "WB",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 22.5726,
      "longitude": 88.3639
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      "opens": "10:00",
      "closes": "20:00"
    }
  };

  return (
    <html lang="en" suppressHydrationWarning className={`${playfair.variable} ${ptSans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body className="font-body antialiased min-h-screen bg-background">
        <FirebaseClientProvider>
          <ThemeProvider defaultTheme="dark">
            {children}
            <Toaster />
          </ThemeProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
