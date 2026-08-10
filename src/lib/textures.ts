
import { ProductTexture } from './types';

export const CHOCOLATE_TEXTURE_CATEGORIES = [
  'Classic Chocolate',
  'Premium & Artisan',
  'Surface Effects',
  'Flavoured Chocolate',
  'White & Special Chocolate'
] as const;

export const CHOCOLATE_TEXTURES: ProductTexture[] = [
  // --- Classic Chocolate ---
  { id: 'smooth-milk', name: 'Smooth Milk Chocolate', category: 'Classic Chocolate', description: 'Silky and balanced standard milk chocolate.', color: 0x7b3f00, roughness: 0.45, metalness: 0.05, glossLevel: 'Satin' },
  { id: 'smooth-dark', name: 'Smooth Dark Chocolate', category: 'Classic Chocolate', description: 'Deep, rich dark chocolate with a smooth finish.', color: 0x3d1e16, roughness: 0.38, metalness: 0.08, glossLevel: 'Satin' },
  { id: 'smooth-white', name: 'Smooth White Chocolate', category: 'Classic Chocolate', description: 'Creamy, buttery white chocolate.', color: 0xf3e5ab, roughness: 0.3, metalness: 0.02, glossLevel: 'Satin' },
  { id: 'glossy-milk', name: 'Glossy Milk Chocolate', category: 'Classic Chocolate', description: 'High-shine tempered milk chocolate.', color: 0x7b3f00, roughness: 0.15, metalness: 0.1, glossLevel: 'Glossy' },
  { id: 'glossy-dark', name: 'Glossy Dark Chocolate', category: 'Classic Chocolate', description: 'Polished high-percentage dark chocolate.', color: 0x3d1e16, roughness: 0.12, metalness: 0.12, glossLevel: 'Glossy' },
  { id: 'matte-dark', name: 'Matte Dark Chocolate', category: 'Classic Chocolate', description: 'Ultra-dark chocolate with a non-reflective finish.', color: 0x2b130e, roughness: 0.85, metalness: 0.0, glossLevel: 'Matte' },
  { id: 'semi-matte', name: 'Semi-Matte Chocolate', category: 'Classic Chocolate', description: 'Subtle sheen with soft reflections.', color: 0x4a2a16, roughness: 0.65, metalness: 0.03, glossLevel: 'Semi-Matte' },

  // --- Premium & Artisan ---
  { id: 'handcrafted-artisan', name: 'Handcrafted Artisan Chocolate', category: 'Premium & Artisan', description: 'Irregular surface showing hand-finishing.', color: 0x3d1e16, roughness: 0.5, metalness: 0.05, normalType: 'Hammered', glossLevel: 'Satin' },
  { id: 'tempered-chocolate', name: 'Tempered Chocolate', category: 'Premium & Artisan', description: 'Expertly snapped and tempered perfection.', color: 0x3d1e16, roughness: 0.2, metalness: 0.08, glossLevel: 'Glossy' },
  { id: 'fine-tempered-gloss', name: 'Fine Tempered Gloss', category: 'Premium & Artisan', description: 'Luxury mirror-like chocolate finish.', color: 0x3d1e16, roughness: 0.08, metalness: 0.15, glossLevel: 'Glossy' },
  { id: 'luxury-satin', name: 'Luxury Satin Chocolate', category: 'Premium & Artisan', description: 'Soft, diffused light reflections.', color: 0x4d281a, roughness: 0.35, metalness: 0.05, glossLevel: 'Satin' },
  { id: 'hand-poured', name: 'Hand-Poured Chocolate', category: 'Premium & Artisan', description: 'Natural waves from manual pouring.', color: 0x3d1e16, roughness: 0.4, metalness: 0.05, normalType: 'Rippled', glossLevel: 'Satin' },
  { id: 'handmade-rustic', name: 'Handmade Rustic Chocolate', category: 'Premium & Artisan', description: 'Rough, organic textures from old-world methods.', color: 0x3d1e16, roughness: 0.75, metalness: 0.02, normalType: 'Hammered', glossLevel: 'Matte' },
  { id: 'premium-belgian', name: 'Premium Belgian-Style Chocolate', category: 'Premium & Artisan', description: 'Consistent, elegant, and velvety.', color: 0x3d1e16, roughness: 0.3, metalness: 0.06, normalType: 'Velvet', glossLevel: 'Satin' },
  { id: 'fine-cocoa-finish', name: 'Fine Cocoa Finish', category: 'Premium & Artisan', description: 'Subtle micro-texture from premium beans.', color: 0x3d1e16, roughness: 0.42, metalness: 0.04, normalType: 'Velvet', glossLevel: 'Satin' },

  // --- Surface Effects ---
  { id: 'cocoa-powder-dusted', name: 'Cocoa Powder Dusted', category: 'Surface Effects', description: 'Covered in a fine layer of raw cocoa powder.', color: 0x4e271c, roughness: 0.95, metalness: 0.0, normalType: 'Dusted', glossLevel: 'Matte' },
  { id: 'fine-cocoa-speckles', name: 'Fine Cocoa Speckles', category: 'Surface Effects', description: 'Smooth base with tiny cocoa nib inclusions.', color: 0x3d1e16, roughness: 0.4, metalness: 0.05, normalType: 'Dusted', glossLevel: 'Satin' },
  { id: 'cracked-chocolate', name: 'Cracked Chocolate', category: 'Surface Effects', description: 'Aged or intentional surface fractures.', color: 0x3d1e16, roughness: 0.45, metalness: 0.05, normalType: 'Cracked', glossLevel: 'Satin' },
  { id: 'rough-chocolate', name: 'Rough Chocolate', category: 'Surface Effects', description: 'Aggressive, unpolished surface.', color: 0x3d1e16, roughness: 0.8, metalness: 0.02, normalType: 'Hammered', glossLevel: 'Matte' },
  { id: 'rippled-chocolate', name: 'Rippled Chocolate', category: 'Surface Effects', description: 'Concentric or linear waves.', color: 0x3d1e16, roughness: 0.35, metalness: 0.08, normalType: 'Rippled', glossLevel: 'Satin' },
  { id: 'brushed-chocolate', name: 'Brushed Chocolate', category: 'Surface Effects', description: 'Directional streaks for a modern look.', color: 0x3d1e16, roughness: 0.4, metalness: 0.1, normalType: 'Ridged', glossLevel: 'Satin' },
  { id: 'marble-chocolate', name: 'Marble Chocolate', category: 'Surface Effects', description: 'Swirled mix of dark and white chocolate.', color: 0x3d1e16, roughness: 0.3, metalness: 0.05, glossLevel: 'Satin' }, // Marble logic in shader
  { id: 'swirled-chocolate', name: 'Swirled Chocolate', category: 'Surface Effects', description: 'Dynamic swirl pattern.', color: 0x7b3f00, roughness: 0.35, metalness: 0.05, normalType: 'Rippled', glossLevel: 'Satin' },
  { id: 'air-bubble', name: 'Air-Bubble Chocolate', category: 'Surface Effects', description: 'Light, aerated texture with surface pops.', color: 0x7b3f00, roughness: 0.5, metalness: 0.02, normalType: 'Bubbles', glossLevel: 'Satin' },
  { id: 'natural-bloom', name: 'Natural Chocolate Bloom', category: 'Surface Effects', description: 'Natural fat bloom haze on dark chocolate.', color: 0x5a3e35, roughness: 0.9, metalness: 0.0, glossLevel: 'Matte' },

  // --- Flavoured Chocolate ---
  { id: 'hazelnut-choc', name: 'Hazelnut Chocolate', category: 'Flavoured Chocolate', description: 'Infused with roasted hazelnut butter.', color: 0x5e3111, roughness: 0.5, metalness: 0.04, glossLevel: 'Satin' },
  { id: 'almond-choc', name: 'Almond Chocolate', category: 'Flavoured Chocolate', description: 'Classic nutty milk chocolate.', color: 0x73482a, roughness: 0.48, metalness: 0.04, glossLevel: 'Satin' },
  { id: 'pistachio-choc', name: 'Pistachio Chocolate', category: 'Flavoured Chocolate', description: 'Distinctive green-tinted specialty chocolate.', color: 0x87a96b, roughness: 0.5, metalness: 0.02, glossLevel: 'Satin' },
  { id: 'coffee-choc', name: 'Coffee Chocolate', category: 'Flavoured Chocolate', description: 'Deep mocha-toned energizing chocolate.', color: 0x2e1a0d, roughness: 0.35, metalness: 0.08, glossLevel: 'Glossy' },
  { id: 'caramel-choc', name: 'Caramel Chocolate', category: 'Flavoured Chocolate', description: 'Golden-brown salted caramel infusion.', color: 0x965a38, roughness: 0.25, metalness: 0.1, glossLevel: 'Glossy' },
  { id: 'coconut-choc', name: 'Coconut Chocolate', category: 'Flavoured Chocolate', description: 'Tropical white chocolate blend.', color: 0xfffcf5, roughness: 0.4, metalness: 0.02, glossLevel: 'Satin' },
  { id: 'strawberry-choc', name: 'Strawberry Chocolate', category: 'Flavoured Chocolate', description: 'Vibrant fruit-infused pink chocolate.', color: 0xdc4d5c, roughness: 0.35, metalness: 0.05, glossLevel: 'Satin' },
  { id: 'orange-choc', name: 'Orange Chocolate', category: 'Flavoured Chocolate', description: 'Citrus-toned dark chocolate.', color: 0x3d1e16, roughness: 0.3, metalness: 0.1, glossLevel: 'Glossy' },
  { id: 'mint-choc', name: 'Mint Chocolate', category: 'Flavoured Chocolate', description: 'Fresh, cool dark chocolate.', color: 0x1a2e1d, roughness: 0.4, metalness: 0.05, glossLevel: 'Satin' },
  { id: 'peanut-choc', name: 'Peanut Chocolate', category: 'Flavoured Chocolate', description: 'Salty and savory milk chocolate.', color: 0x7b3f00, roughness: 0.55, metalness: 0.03, glossLevel: 'Satin' },

  // --- White & Special Chocolate ---
  { id: 'ivory-white', name: 'Ivory White Chocolate', category: 'White & Special Chocolate', description: 'Premium high-cacao butter ivory shade.', color: 0xede6d6, roughness: 0.25, metalness: 0.02, glossLevel: 'Satin' },
  { id: 'cream-white', name: 'Cream White Chocolate', category: 'White & Special Chocolate', description: 'Traditional milky white finish.', color: 0xfdfbf3, roughness: 0.3, metalness: 0.01, glossLevel: 'Satin' },
  { id: 'ruby-choc', name: 'Ruby Chocolate', category: 'White & Special Chocolate', description: 'Naturally berry-coloured unique chocolate.', color: 0xba3e54, roughness: 0.38, metalness: 0.08, glossLevel: 'Satin' },
  { id: 'strawberry-pink', name: 'Strawberry Pink Chocolate', category: 'White & Special Chocolate', description: 'Confectionery pink decorative chocolate.', color: 0xe5a9a9, roughness: 0.4, metalness: 0.05, glossLevel: 'Satin' },
  { id: 'matcha-green', name: 'Matcha Green Chocolate', category: 'White & Special Chocolate', description: 'Authentic ceremonial matcha infusion.', color: 0x5d713c, roughness: 0.6, metalness: 0.0, normalType: 'Velvet', glossLevel: 'Matte' },
  { id: 'caramel-gold', name: 'Caramel Gold Chocolate', category: 'White & Special Chocolate', description: 'Luxury caramelized white chocolate.', color: 0xbc9142, roughness: 0.2, metalness: 0.12, glossLevel: 'Glossy' },
  { id: 'coffee-beige', name: 'Coffee Beige Chocolate', category: 'White & Special Chocolate', description: 'Soft coffee-milk latte shade.', color: 0xa68a64, roughness: 0.45, metalness: 0.03, glossLevel: 'Satin' },
];

export const DEFAULT_TEXTURE = CHOCOLATE_TEXTURES[0]; // Smooth Milk
