'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Ingredient, AllergenStatus } from '@/lib/types';
import { 
  MoreHorizontal, 
  PlusCircle, 
  Loader2, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  Star, 
  Download, 
  X, 
  ShieldAlert,
  Beaker,
  ShieldCheck,
  Thermometer,
  Zap,
  Save,
  Layers,
  FlaskConical,
  CircleCheck,
  History,
  Check
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// --- Artisan Taxonomy Configuration ---

export const ARTISAN_TAXONOMY = {
  'Cocoa & Chocolate': {
    subcategories: ['Cocoa Beans / Cacao Nibs', 'Cocoa Mass / Cocoa Liquor', 'Cocoa Powder', 'Cocoa Butter', 'Couverture Chocolate'],
    forms: ['Raw', 'Roasted', 'Milled', 'Deodorized', 'Dark', 'Milk', 'White', 'Ruby', 'Blond'],
    roleMapping: (sub: string, form: string) => {
      if (sub === 'Cocoa Beans / Cacao Nibs') return ['Cocoa Flavour Component', 'Cocoa Texture Inclusion', 'Roasted Cocoa Inclusion', 'Crunch Component'];
      if (sub === 'Cocoa Mass / Cocoa Liquor') return ['Cocoa Base', 'Cocoa Solids Component', 'Cocoa Flavour Component'];
      if (sub === 'Cocoa Powder') return ['Cocoa Solids', 'Cocoa Flavour', 'Colour Component'];
      if (sub === 'Cocoa Butter') return ['Chocolate Fat Phase', 'Fluidity Adjustment', 'Texture Modifier', 'Crystal Structure Component'];
      if (sub === 'Couverture Chocolate') return ['Dark Chocolate Base', 'Milk Chocolate Base', 'White Chocolate Base', 'Ruby Chocolate Base', 'Blond Chocolate Base'];
      return ['Chocolate Component'];
    }
  },
  'Dairy & Milk': {
    subcategories: ['Milk Powder', 'Whey Powder', 'Butter', 'Cream', 'Milk Crumb'],
    forms: ['Powdered', 'Liquid', 'Solid', 'Concentrated', 'Caramelized'],
    roleMapping: (sub: string) => {
      if (sub === 'Milk Powder') return ['Milk Solids', 'Dairy Flavour Component', 'Creaminess Component'];
      if (sub === 'Whey Powder') return ['Whey Solids', 'Dairy Flavour Component'];
      if (sub === 'Butter') return ['Dairy Fat', 'Creaminess Component', 'Flavour Component'];
      if (sub === 'Cream') return ['Dairy Liquid Phase', 'Ganache Base', 'Creaminess Component'];
      if (sub === 'Milk Crumb') return ['Milk Chocolate Component', 'Caramelized Dairy Component', 'Flavour Component'];
      return ['Dairy Component'];
    }
  },
  'Sweeteners': {
    subcategories: ['Granulated / Caster / Icing Sugar', 'Jaggery / Palm Sugar / Coconut Sugar', 'Glucose / Glucose Syrup', 'Invert Sugar', 'Honey'],
    forms: ['Crystalline', 'Syrup', 'Liquid', 'Blocks'],
    roleMapping: (sub: string) => {
      if (sub === 'Granulated / Caster / Icing Sugar') return ['Primary Sweetener', 'Bulk Sweetener', 'Texture Modifier'];
      if (sub === 'Jaggery / Palm Sugar / Coconut Sugar') return ['Primary Sweetener', 'Caramel / Molasses Flavour', 'Natural Sweetening Component'];
      if (sub === 'Glucose / Glucose Syrup') return ['Sweetener', 'Humectant', 'Texture Modifier', 'Crystallization Control'];
      if (sub === 'Invert Sugar') return ['Sweetener', 'Humectant', 'Crystallization Control', 'Texture Modifier'];
      if (sub === 'Honey') return ['Sweetener', 'Humectant', 'Flavour Component'];
      return ['Sweetener'];
    }
  },
  'Nuts & Tree Nuts': {
    subcategories: ['Almond', 'Hazelnut', 'Pistachio', 'Cashew', 'Walnut', 'Pecan', 'Macadamia', 'Brazil Nut', 'Pine Nut', 'Coconut'],
    forms: ['Raw', 'Roasted', 'Caramelized', 'Powdered', 'Paste', 'Butter', 'Praline', 'Whole', 'Chopped', 'Sliced'],
    roleMapping: (sub: string, form: string) => {
      if (form === 'Paste') return ['Nut Paste', 'Fat Phase', 'Flavour Component', 'Filling Component'];
      if (form === 'Butter') return ['Nut Fat Component', 'Filling Component', 'Flavour Component'];
      if (form === 'Praline') return ['Praline Component', 'Filling Component', 'Flavour Component', 'Crunch Component'];
      if (form === 'Powdered') return ['Nut Solids', 'Flavour Component', 'Texture Component'];
      return ['Inclusion', 'Crunch Component', 'Decoration'];
    }
  },
  'Peanut': {
    subcategories: ['Peanut'],
    forms: ['Whole', 'Roasted', 'Powdered', 'Butter', 'Praline', 'Paste'],
    roleMapping: (sub: string, form: string) => {
      if (form === 'Powdered') return ['Peanut Solids', 'Flavour Component', 'Texture Component'];
      if (form === 'Butter') return ['Peanut Fat Component', 'Filling Component', 'Flavour Component'];
      if (form === 'Praline') return ['Praline Component', 'Filling Component', 'Crunch Component'];
      return ['Inclusion', 'Crunch', 'Decoration'];
    }
  },
  'Fruits & Fruit Preparations': {
    subcategories: ['Fresh / Frozen Fruit', 'Dried Fruit', 'Freeze-Dried Fruit', 'Fruit Powder', 'Fruit Puree', 'Fruit Concentrate', 'Fruit Gel', 'Candied Fruit'],
    forms: ['Whole', 'Pieces', 'Powder', 'Puree', 'Liquid', 'Gel'],
    roleMapping: (sub: string) => {
      if (sub === 'Fresh / Frozen Fruit') return ['Fruit Inclusion', 'Flavour Component'];
      if (sub === 'Dried Fruit') return ['Fruit Inclusion', 'Texture Component', 'Decoration'];
      if (sub === 'Freeze-Dried Fruit') return ['Fruit Inclusion', 'Flavour Component', 'Decoration', 'Texture Component'];
      if (sub === 'Fruit Powder') return ['Fruit Solids', 'Flavour Component', 'Colour Component'];
      if (sub === 'Fruit Puree') return ['Fruit Phase', 'Filling Component', 'Flavour Component'];
      if (sub === 'Fruit Concentrate') return ['Flavour Component', 'Fruit Solids Component', 'Sweetness / Acidity Component'];
      if (sub === 'Fruit Gel') return ['Gel Filling', 'Fruit Flavour Component', 'Centre Component'];
      if (sub === 'Candied Fruit') return ['Fruit Inclusion', 'Decoration', 'Flavour Component'];
      return ['Fruit Component'];
    }
  },
  'Indian Spices & Botanical Ingredients': {
    subcategories: ['Whole / Ground Spices', 'Extracts', 'Floral Ingredients', 'Indian Specialty Ingredients'],
    forms: ['Whole', 'Ground', 'Liquid Extract', 'Paste', 'Petals'],
    roleMapping: (sub: string) => {
      if (sub === 'Whole / Ground Spices') return ['Flavour', 'Aroma', 'Inclusion'];
      if (sub === 'Extracts') return ['Flavour Extract', 'Aroma Extract'];
      if (sub === 'Floral Ingredients') return ['Floral Flavour', 'Aroma', 'Decorative Inclusion'];
      if (sub === 'Indian Specialty Ingredients') return ['Floral Filling', 'Flavour Component', 'Filling Inclusion'];
      return ['Spice / Botanical Component'];
    }
  },
  'Coffee & Tea': {
    subcategories: ['Coffee Beans / Ground Coffee', 'Instant Coffee', 'Coffee Extract', 'Tea / Tea Powder', 'Matcha'],
    forms: ['Whole Beans', 'Ground', 'Powder', 'Extract', 'Matcha Powder'],
    roleMapping: (sub: string) => {
      if (sub === 'Coffee Beans / Ground Coffee') return ['Coffee Inclusion', 'Flavour Component', 'Aroma Component'];
      if (sub === 'Instant Coffee') return ['Coffee Flavour', 'Coffee Solids'];
      if (sub === 'Coffee Extract') return ['Coffee Flavour', 'Aroma'];
      if (sub === 'Tea / Tea Powder') return ['Tea Flavour', 'Botanical Inclusion'];
      if (sub === 'Matcha') return ['Tea Flavour', 'Colour Component', 'Botanical Solids'];
      return ['Beverage Flavour Component'];
    }
  },
  'Flavourings': {
    subcategories: ['Oil-Soluble Flavour', 'Water-Soluble Flavour', 'Natural Extract', 'Artificial / Nature-Identical Flavour'],
    forms: ['Liquid', 'Powder', 'Paste'],
    roleMapping: (sub: string) => {
      if (sub === 'Oil-Soluble Flavour') return ['Fat-Phase Flavour'];
      if (sub === 'Water-Soluble Flavour') return ['Water-Phase Flavour'];
      if (sub === 'Natural Extract') return ['Natural Flavour', 'Aroma'];
      if (sub === 'Artificial / Nature-Identical Flavour') return ['Flavour', 'Aroma'];
      return ['Flavour Component'];
    }
  },
  'Emulsifiers & Functional Ingredients': {
    subcategories: ['Lecithin', 'PGPR', 'Pectin', 'Gelatin', 'Xanthan / Guar Gum'],
    forms: ['Liquid', 'Granular', 'Powder', 'Sheets'],
    roleMapping: (sub: string) => {
      if (sub === 'Lecithin') return ['Emulsifier', 'Viscosity Management'];
      if (sub === 'PGPR') return ['Viscosity Management', 'Flowability Adjustment'];
      if (sub === 'Pectin' || sub === 'Gelatin') return ['Gel Formation', 'Structure'];
      if (sub.includes('Gum')) return ['Thickening', 'Stabilization'];
      return ['Functional Component'];
    }
  },
  'Filling Components': {
    subcategories: ['Ganache Components', 'Caramel', 'Dulce de Leche', 'Gianduja', 'Praline'],
    forms: ['Paste', 'Liquid', 'Fat Phase', 'Finished Filling'],
    roleMapping: (sub: string) => {
      if (sub === 'Ganache Components') return ['Ganache Fat Phase', 'Ganache Liquid Phase', 'Ganache Sweetener', 'Ganache Flavour'];
      if (sub === 'Caramel') return ['Caramel Filling', 'Flavour Component', 'Texture Component'];
      if (sub === 'Dulce de Leche') return ['Dairy Filling', 'Caramel Flavour'];
      if (sub === 'Gianduja') return ['Nut-Chocolate Filling', 'Fat Phase', 'Flavour Component'];
      if (sub === 'Praline') return ['Nut Praline Filling', 'Crunch Component', 'Flavour Component'];
      return ['Filling Base'];
    }
  },
  'Inclusions & Texture': {
    subcategories: ['Crisps / Puffed Ingredients', 'Biscuit / Wafer', 'Feuilletine', 'Honeycomb / Toffee', 'Chocolate Pieces'],
    forms: ['Pieces', 'Puffed', 'Flakes', 'Shards'],
    roleMapping: (sub: string) => {
      if (sub === 'Crisps / Puffed Ingredients') return ['Crunch', 'Texture Inclusion'];
      if (sub === 'Biscuit / Wafer') return ['Crunch', 'Layered Inclusion', 'Texture Component'];
      if (sub === 'Feuilletine') return ['Crunch', 'Layered Texture'];
      if (sub === 'Honeycomb / Toffee') return ['Crunch', 'Caramel Texture'];
      if (sub === 'Chocolate Pieces') return ['Chocolate Inclusion', 'Texture Component'];
      return ['Texture Component'];
    }
  },
  'Colours & Decoration': {
    subcategories: ['Cocoa Butter Colour', 'Powder Colour', 'Edible Metallic', 'Sprinkles / Sugar Decorations'],
    forms: ['Liquid', 'Powder', 'Dust', 'Solids'],
    roleMapping: (sub: string) => {
      if (sub === 'Cocoa Butter Colour') return ['Chocolate Surface Colour', 'Decoration'];
      if (sub === 'Powder Colour') return ['Surface Decoration', 'Dry Colour Component'];
      if (sub === 'Edible Metallic') return ['Surface Decoration', 'Luxury Finish'];
      if (sub === 'Sprinkles / Sugar Decorations') return ['Decoration', 'Texture Inclusion'];
      return ['Decorative Component'];
    }
  },
  'Salt': {
    subcategories: ['Fine Salt', 'Fleur de Sel / Flake Salt', 'Smoked Salt'],
    forms: ['Fine Powder', 'Flakes', 'Crystals'],
    roleMapping: (sub: string) => {
      if (sub === 'Fine Salt') return ['Flavour Balancing', 'Sweetness Enhancement'];
      if (sub === 'Fleur de Sel / Flake Salt') return ['Flavour Balancing', 'Surface Decoration', 'Texture Contrast'];
      if (sub === 'Smoked Salt') return ['Flavour Component', 'Aroma Component'];
      return ['Flavour Balancer'];
    }
  }
};

const MASTER_CATEGORIES = Object.keys(ARTISAN_TAXONOMY);

const ALLERGENS: (keyof Ingredient['allergens'])[] = [
  'milk', 'egg', 'fish', 'crustacean', 'treeNuts', 'peanuts', 'wheat', 'soy', 'sesame'
];

const allergenStatusOptions: AllergenStatus[] = ['Contains', 'Does Not Contain', 'May Contain', 'Cross-Contact Risk', 'Unknown'];

const allergenMatrixSchema = z.object({
  milk: z.enum(allergenStatusOptions),
  egg: z.enum(allergenStatusOptions),
  fish: z.enum(allergenStatusOptions),
  crustacean: z.enum(allergenStatusOptions),
  treeNuts: z.enum(allergenStatusOptions),
  peanuts: z.enum(allergenStatusOptions),
  wheat: z.enum(allergenStatusOptions),
  soy: z.enum(allergenStatusOptions),
  sesame: z.enum(allergenStatusOptions),
  glutenFree: z.boolean().default(false),
  vegan: z.boolean().default(false),
  vegetarian: z.boolean().default(false),
  verificationDate: z.string().optional(),
});

const ingredientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  masterCategorySource: z.enum(['System', 'Custom']).default('System'),
  subCategory: z.string().min(1, 'Subcategory is required'),
  subCategorySource: z.enum(['System', 'Custom']).default('System'),
  ingredientForm: z.string().min(1, 'Form is required'),
  primaryRole: z.string().min(1, 'Primary formulation role is required'),
  secondaryRoles: z.array(z.string()).default([]),
  brand: z.string().optional(),
  supplierName: z.string().optional(),
  origin: z.string().optional(),
  defaultUnit: z.enum(['mg', 'g', 'kg', 'ml', 'L', 'pcs', 'tbsp', 'tsp', 'pinch']),
  description: z.string().optional(),
  
  cocoaPercent: z.coerce.number().optional(),
  fatPercent: z.coerce.number().optional(),
  sugarPercent: z.coerce.number().optional(),
  moisturePercent: z.coerce.number().optional(),
  brix: z.coerce.number().optional(),
  ph: z.coerce.number().optional(),
  
  allergens: allergenMatrixSchema,
  
  storageCondition: z.enum(['Ambient', 'Cool & Dry', 'Refrigerated', 'Frozen', 'Temp Controlled', 'Humidity Controlled']).default('Ambient'),
  shelfLifeDays: z.coerce.number().optional(),
  batchNumber: z.string().optional(),
  lotNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  
  purchasePrice: z.coerce.number().min(0).optional(),
  purchaseQuantity: z.coerce.number().min(0).optional(),
  purchaseUnit: z.string().optional(),
  isActive: z.boolean().default(true),
});

type IngredientFormValues = z.infer<typeof ingredientSchema>;

/**
 * Robust Searchable Selector with Hybrid Manual Toggle
 */
function SearchableSelector({ 
  items, 
  value, 
  onChange, 
  onCustom, 
  placeholder, 
  label,
  isCustom,
  customValue,
  onCustomChange
}: { 
  items: string[], 
  value: string, 
  onChange: (v: string) => void, 
  onCustom: () => void, 
  placeholder: string,
  label: string,
  isCustom: boolean,
  customValue: string,
  onCustomChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
          <Label className="uppercase text-[9px] font-black tracking-widest text-stone-400">{label}</Label>
          <Button 
            type="button" 
            variant="ghost" 
            className="h-4 p-0 text-[8px] font-black uppercase text-primary hover:bg-transparent" 
            onClick={onCustom}
          >
            {isCustom ? (
              <div className="flex items-center gap-1"><History className="h-2 w-2" /> Use Registered List</div>
            ) : (
              <div className="flex items-center gap-1"><PlusCircle className="h-2 w-2" /> Enter Manually</div>
            )}
          </Button>
      </div>
      
      {isCustom ? (
        <Input 
          className="h-12 rounded-xl border-primary/40 focus:ring-primary/20" 
          placeholder={`Enter Custom ${label}...`}
          value={customValue ?? ''}
          onChange={(e) => onCustomChange(e.target.value)}
        />
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-12 rounded-xl text-left font-normal border-stone-200"
            >
              {value ? value : placeholder}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0 rounded-xl overflow-hidden shadow-2xl border-none" align="start">
            <Command className="border-none" filter={(value, search) => value.includes(search.toLowerCase()) ? 1 : 0}>
              <CommandInput placeholder={`Search ${label.toLowerCase()}...`} className="h-12" />
              <CommandList className="max-h-[300px]">
                <CommandEmpty className="py-6 px-4 text-xs italic text-muted-foreground text-center">No existing entry found.</CommandEmpty>
                <CommandGroup heading="Artisan Registry">
                  {items.map((item) => (
                    <CommandItem
                      key={item}
                      value={item.toLowerCase()}
                      onSelect={() => {
                        onChange(item);
                        setOpen(false);
                      }}
                      className="flex items-center justify-between py-3 cursor-pointer"
                    >
                      <span className="text-sm font-medium">{item}</span>
                      <Check className={cn("h-4 w-4 text-primary", value === item ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

export default function IngredientLibraryPage() {
  const firestore = useFirestore();
  const ingredientsQuery = useMemo(() => (firestore ? collection(firestore, 'ingredients') : null), [firestore]);
  const { data: ingredients, loading } = useCollection<Ingredient>(ingredientsQuery);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [isSaving, setIsSaving] = useState(false);

  const [masterCategoryMode, setMasterCategoryMode] = useState<'select' | 'custom'>('select');
  const [subCategoryMode, setSubCategoryMode] = useState<'select' | 'custom'>('select');
  
  const [itemToDelete, setItemToDelete] = useState<Ingredient | null>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  const form = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: '',
      sku: '',
      category: '',
      masterCategorySource: 'System',
      subCategory: '',
      subCategorySource: 'System',
      ingredientForm: '',
      primaryRole: '',
      secondaryRoles: [],
      brand: '',
      supplierName: '',
      origin: '',
      description: '',
      defaultUnit: 'g',
      isActive: true,
      batchNumber: '',
      lotNumber: '',
      expiryDate: '',
      purchasePrice: 0,
      purchaseQuantity: 0,
      purchaseUnit: '',
      allergens: {
        milk: 'Unknown', egg: 'Unknown', fish: 'Unknown', crustacean: 'Unknown',
        treeNuts: 'Unknown', peanuts: 'Unknown', wheat: 'Unknown', soy: 'Unknown', sesame: 'Unknown',
        glutenFree: false, vegan: false, vegetarian: false
      }
    }
  });

  const watchCategory = useWatch({ control: form.control, name: 'category' });
  const watchSubCategory = useWatch({ control: form.control, name: 'subCategory' });
  const watchForm = useWatch({ control: form.control, name: 'ingredientForm' });
  const watchSecondaryRoles = useWatch({ control: form.control, name: 'secondaryRoles' }) || [];

  const taxonomyConfig = useMemo(() => {
    return (ARTISAN_TAXONOMY as any)[watchCategory] || { subcategories: [], forms: [], roleMapping: () => [] };
  }, [watchCategory]);

  const availableRoles = useMemo(() => {
    return taxonomyConfig.roleMapping(watchSubCategory, watchForm);
  }, [taxonomyConfig, watchSubCategory, watchForm]);

  const registeredMasterCategories = useMemo(() => {
    if (!ingredients) return MASTER_CATEGORIES;
    const fromDB = ingredients.map(i => i.category);
    return Array.from(new Set([...MASTER_CATEGORIES, ...fromDB])).filter(Boolean).sort();
  }, [ingredients]);

  const registeredSubCategories = useMemo(() => {
    const systemOnes = (ARTISAN_TAXONOMY as any)[watchCategory]?.subcategories || [];
    if (!ingredients || !watchCategory) return systemOnes;
    const fromDB = ingredients.filter(i => i.category === watchCategory).map(i => i.subCategory).filter(Boolean) as string[];
    return Array.from(new Set([...systemOnes, ...fromDB])).sort();
  }, [ingredients, watchCategory]);

  useEffect(() => {
    if (editingIngredient) {
      form.reset({
        ...editingIngredient,
        sku: editingIngredient.sku || '',
        brand: editingIngredient.brand || '',
        supplierName: editingIngredient.supplierName || '',
        origin: editingIngredient.origin || '',
        description: editingIngredient.description || '',
        batchNumber: editingIngredient.batchNumber || '',
        lotNumber: editingIngredient.lotNumber || '',
        expiryDate: editingIngredient.expiryDate || '',
        purchaseUnit: editingIngredient.purchaseUnit || '',
        purchasePrice: editingIngredient.purchasePrice || 0,
        purchaseQuantity: editingIngredient.purchaseQuantity || 0,
        masterCategorySource: editingIngredient.masterCategorySource || 'System',
        subCategorySource: editingIngredient.subCategorySource || 'System',
        secondaryRoles: editingIngredient.secondaryRoles || [],
        allergens: {
          ...editingIngredient.allergens,
          verificationDate: editingIngredient.allergens.verificationDate || '',
        }
      } as any);

      setMasterCategoryMode(editingIngredient.masterCategorySource === 'Custom' ? 'custom' : 'select');
      setSubCategoryMode(editingIngredient.subCategorySource === 'Custom' ? 'custom' : 'select');
    } else {
      form.reset({ 
        name: '', 
        sku: '',
        category: '', 
        masterCategorySource: 'System',
        subCategory: '',
        subCategorySource: 'System',
        ingredientForm: '',
        primaryRole: '',
        secondaryRoles: [],
        brand: '',
        supplierName: '',
        origin: '',
        description: '',
        batchNumber: '',
        lotNumber: '',
        expiryDate: '',
        purchasePrice: 0,
        purchaseQuantity: 0,
        purchaseUnit: '',
        defaultUnit: 'g', 
        isActive: true, 
        allergens: {
          milk: 'Unknown', egg: 'Unknown', fish: 'Unknown', crustacean: 'Unknown',
          treeNuts: 'Unknown', peanuts: 'Unknown', wheat: 'Unknown', soy: 'Unknown', sesame: 'Unknown',
          glutenFree: false, vegan: false, vegetarian: false
        }
      });
      setMasterCategoryMode('select');
      setSubCategoryMode('select');
    }
  }, [editingIngredient, form, isAddDialogOpen]);

  const onSave = (values: IngredientFormValues) => {
    if (!firestore) return;
    setIsSaving(true);

    const id = editingIngredient?.id || `ING-${Date.now()}`;
    const ingRef = doc(firestore, 'ingredients', id);
    
    const isSystemCategory = MASTER_CATEGORIES.includes(values.category);
    const finalMasterSource = isSystemCategory ? 'System' : values.masterCategorySource;
    
    const standardSubCategories = (ARTISAN_TAXONOMY as any)[values.category]?.subcategories || [];
    const isSystemSub = standardSubCategories.includes(values.subCategory);
    const finalSubSource = isSystemSub ? 'System' : values.subCategorySource;

    const ingData = {
      ...values,
      id,
      masterCategorySource: finalMasterSource,
      subCategorySource: finalSubSource,
      updatedAt: new Date().toISOString(),
      createdAt: editingIngredient?.createdAt || new Date().toISOString(),
    };

    setDoc(ingRef, ingData)
      .then(() => {
        setIsAddDialogOpen(false);
        setEditingIngredient(null);
        toast({ title: editingIngredient ? 'Intelligence Refined' : 'Artisan Ingredient Registered' });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: ingRef.path,
          operation: editingIngredient ? 'update' : 'create',
          requestResourceData: ingData
        }));
      })
      .finally(() => setIsSaving(false));
  };

  const handleToggleFavourite = (ing: Ingredient) => {
    if (!firestore) return;
    updateDoc(doc(firestore, 'ingredients', ing.id), { isFavourite: !ing.isFavourite });
  };

  const confirmDelete = async () => {
    if (!firestore || !itemToDelete) return;
    setIsDeleting(true);
    deleteDoc(doc(firestore, 'ingredients', itemToDelete.id))
      .then(() => {
        toast({ title: 'Ingredient Removed' });
        setItemToDelete(null);
        setDeleteInput('');
      })
      .finally(() => setIsDeleting(false));
  };

  const filteredIngredients = useMemo(() => {
    if (!ingredients) return [];
    return ingredients
      .filter(i => filterCategory === 'all' || i.category === filterCategory)
      .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [ingredients, searchTerm, filterCategory]);

  return (
    <>
      <PageHeader 
        title="Artisan Ingredient Intelligence" 
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl"><Download className="h-4 w-4 mr-2" /> Export Matrix</Button>
            <Button onClick={() => { setEditingIngredient(null); setIsAddDialogOpen(true); }} className="rounded-xl shadow-lg shadow-primary/20 bg-primary text-stone-950 font-bold">
                <PlusCircle className="mr-2 h-4 w-4" /> Register Ingredient
            </Button>
          </div>
        } 
      />

      <div className="grid grid-cols-1 gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search master library..." 
                className="pl-10 h-11 rounded-xl bg-card border-none shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <Select value={filterCategory} onValueChange={setFilterCategory}>
             <SelectTrigger className="w-full md:w-64 h-11 rounded-xl">
               <div className="flex items-center gap-2"><Filter className="h-4 w-4" /><SelectValue placeholder="Filter by Category" /></div>
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Artisan Categories</SelectItem>
               {MASTER_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
             </SelectContent>
           </Select>
        </div>

        <Card className="rounded-[2rem] overflow-hidden border-none shadow-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <TableHead className="p-6 w-12"></TableHead>
                  <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest">Component Identity</TableHead>
                  <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest">Classification</TableHead>
                  <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest">Role (Primary)</TableHead>
                  <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest text-center">Safety Icons</TableHead>
                  <TableHead className="p-6 uppercase text-[10px] font-black tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIngredients.map((ing) => (
                  <TableRow key={ing.id} className="group hover:bg-muted/5 transition-colors">
                    <TableCell className="p-6">
                      <button onClick={() => handleToggleFavourite(ing)} className={cn("transition-colors", ing.isFavourite ? "text-amber-500" : "text-stone-200 hover:text-amber-200")}>
                        <Star className={cn("h-5 w-5", ing.isFavourite && "fill-current")} />
                      </button>
                    </TableCell>
                    <TableCell className="p-6">
                       <div className="space-y-1">
                          <p className="font-bold text-stone-900 leading-none">{ing.name}</p>
                          <p className="text-[9px] font-black uppercase text-stone-400 tracking-tighter">{ing.sku || ing.id}</p>
                       </div>
                    </TableCell>
                    <TableCell className="p-6">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="rounded-lg text-[9px] font-black uppercase tracking-tight bg-stone-100 text-stone-500 border-none w-fit">
                                {ing.category}
                            </Badge>
                            {ing.masterCategorySource === 'Custom' && <Badge variant="outline" className="text-[7px] border-primary/20 text-primary h-3 px-1 font-bold">Custom</Badge>}
                          </div>
                          <div className="flex items-center gap-1.5 ml-1">
                            <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">{ing.subCategory} • {ing.ingredientForm}</p>
                            {ing.subCategorySource === 'Custom' && <Badge variant="outline" className="text-[6px] border-primary/20 text-primary h-2.5 px-1">Custom</Badge>}
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="p-6">
                       <div className="flex items-center gap-2">
                          <Layers className="h-3 w-3 text-primary opacity-40" />
                          <span className="text-[10px] font-bold text-stone-600">{ing.primaryRole || 'Not Specified'}</span>
                       </div>
                    </TableCell>
                    <TableCell className="p-6 text-center">
                       <div className="flex justify-center gap-2">
                          {ing.allergens?.vegan && <Badge className="bg-green-600/10 text-green-600 border-none rounded-full h-5 w-5 p-0 flex items-center justify-center" title="Vegan">V</Badge>}
                          {ing.allergens?.glutenFree && <Badge className="bg-blue-600/10 text-blue-600 border-none rounded-full h-5 w-5 p-0 flex items-center justify-center" title="Gluten Free">G</Badge>}
                          {ing.storageCondition === 'Temp Controlled' && <Thermometer className="h-4 w-4 text-rose-500" title="Temp Controlled" />}
                       </div>
                    </TableCell>
                    <TableCell className="p-6 text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            <DropdownMenuItem onClick={() => { setEditingIngredient(ing); setActiveTab('basic'); setIsAddDialogOpen(true); }}><Edit className="h-4 w-4 mr-2" /> Refine Intelligence</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setItemToDelete(ing)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Permanent Destroy</DropdownMenuItem>
                          </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={(o) => { if (!o) { setIsAddDialogOpen(false); setEditingIngredient(null); } }}>
        <DialogContent 
          className="sm:max-w-4xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl flex flex-col h-[90vh] bg-background"
        >
          <div className="bg-stone-900 text-white p-8 shrink-0 flex items-center justify-between">
            <DialogHeader className="text-left">
              <DialogTitle className="text-3xl font-headline">{editingIngredient ? 'Refine Intelligence' : 'Register Artisan Component'}</DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-[0.2em] font-black text-stone-500">Master Specification Logic</DialogDescription>
            </DialogHeader>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/10 text-white"><X className="h-5 w-5" /></Button>
            </DialogClose>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <div className="px-8 pt-4 border-b bg-muted/30">
               <TabsList className="bg-transparent h-12 w-full justify-start gap-8">
                  <TabsTrigger value="basic" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-bold uppercase text-[10px] tracking-widest h-full">Basic Identity</TabsTrigger>
                  <TabsTrigger value="formulation" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-bold uppercase text-[10px] tracking-widest h-full">Formulation Roles</TabsTrigger>
                  <TabsTrigger value="technical" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-bold uppercase text-[10px] tracking-widest h-full">Quality Specs</TabsTrigger>
                  <TabsTrigger value="allergens" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-bold uppercase text-[10px] tracking-widest h-full text-rose-500">Safety & Allergens</TabsTrigger>
                  <TabsTrigger value="commercial" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-bold uppercase text-[10px] tracking-widest h-full">Logistics</TabsTrigger>
               </TabsList>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSave)} className="flex flex-col flex-1 overflow-hidden">
                <ScrollArea className="flex-1 px-10 py-10" dual>
                  <TabsContent value="basic" className="space-y-10 mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <FormField control={form.control} name="name" render={({ field }) => (
                         <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-stone-400">Ingredient Identity</FormLabel>
                            <FormControl><Input className="h-12 rounded-xl" placeholder="e.g. Criollo Cocoa Mass" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                         </FormItem>
                       )} />
                       
                       <FormField control={form.control} name="category" render={({ field }) => (
                         <SearchableSelector 
                            label="Master Category"
                            items={registeredMasterCategories}
                            value={field.value ?? ''}
                            placeholder="Select Master Category..."
                            isCustom={masterCategoryMode === 'custom'}
                            customValue={field.value ?? ''}
                            onCustomChange={(val) => {
                                field.onChange(val);
                                form.setValue('masterCategorySource', 'Custom');
                                // Cascading Sanitization Pulse
                                form.setValue('subCategory', '');
                                form.setValue('ingredientForm', '');
                                form.setValue('primaryRole', '');
                                form.setValue('secondaryRoles', []);
                            }}
                            onCustom={() => {
                                const newMode = masterCategoryMode === 'select' ? 'custom' : 'select';
                                setMasterCategoryMode(newMode);
                                form.setValue('masterCategorySource', newMode === 'custom' ? 'Custom' : 'System');
                            }}
                            onChange={(val) => {
                                field.onChange(val);
                                form.setValue('masterCategorySource', 'System');
                                // Cascading Sanitization Pulse
                                form.setValue('subCategory', '');
                                form.setValue('ingredientForm', '');
                                form.setValue('primaryRole', '');
                                form.setValue('secondaryRoles', []);
                            }}
                         />
                       )} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <FormField control={form.control} name="subCategory" render={({ field }) => (
                         <SearchableSelector 
                            label="Sub Category"
                            items={registeredSubCategories}
                            value={field.value ?? ''}
                            placeholder={!watchCategory ? "Select Master Category First" : "Select Sub Category..."}
                            isCustom={subCategoryMode === 'custom'}
                            customValue={field.value ?? ''}
                            onCustomChange={(val) => {
                                field.onChange(val);
                                form.setValue('subCategorySource', 'Custom');
                            }}
                            onCustom={() => {
                                const newMode = subCategoryMode === 'select' ? 'custom' : 'select';
                                setSubCategoryMode(newMode);
                                form.setValue('subCategorySource', newMode === 'custom' ? 'Custom' : 'System');
                            }}
                            onChange={(val) => {
                                field.onChange(val);
                                form.setValue('subCategorySource', 'System');
                                // Reset roles if form changes
                                form.setValue('ingredientForm', '');
                                form.setValue('primaryRole', '');
                                form.setValue('secondaryRoles', []);
                            }}
                         />
                       )} />
                       <FormField control={form.control} name="ingredientForm" render={({ field }) => (
                         <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-stone-400">Ingredient Form (Physical State)</FormLabel>
                            <Select onValueChange={(val) => {
                                field.onChange(val);
                                form.setValue('primaryRole', '');
                                form.setValue('secondaryRoles', []);
                            }} value={field.value ?? ''} disabled={!watchSubCategory}>
                               <FormControl><SelectTrigger className="h-12 rounded-xl border-stone-200"><SelectValue placeholder="Select form..." /></SelectTrigger></FormControl>
                               <SelectContent>{taxonomyConfig.forms.map((f: string) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                            </Select>
                         </FormItem>
                       )} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <FormField control={form.control} name="sku" render={({ field }) => (
                         <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-stone-400">SKU / Code</FormLabel>
                            <FormControl><Input className="h-10 rounded-xl" placeholder="RB-CHO-001" {...field} value={field.value ?? ''} /></FormControl>
                         </FormItem>
                       )} />
                       <FormField control={form.control} name="brand" render={({ field }) => (
                         <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Brand / Manufacturer</FormLabel>
                            <FormControl><Input className="h-10 rounded-xl" {...field} value={field.value ?? ''} /></FormControl>
                         </FormItem>
                       )} />
                        <FormField control={form.control} name="origin" render={({ field }) => (
                         <FormItem>
                            <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Country of Origin</FormLabel>
                            <FormControl><Input className="h-10 rounded-xl" {...field} value={field.value ?? ''} /></FormControl>
                         </FormItem>
                       )} />
                    </div>
                  </TabsContent>

                  <TabsContent value="formulation" className="space-y-12 mt-0">
                    <div className="bg-stone-50 p-10 rounded-[2.5rem] border-2 border-dashed space-y-10">
                        <div className="flex items-center gap-3 text-primary">
                           <FlaskConical className="h-6 w-6" />
                           <span className="text-[10px] font-black uppercase tracking-[0.4em]">Formulation Matrix</span>
                        </div>

                        <div className="space-y-8">
                           <FormField control={form.control} name="primaryRole" render={({ field }) => (
                             <FormItem>
                                <FormLabel className="uppercase text-[10px] font-black tracking-widest text-primary flex items-center gap-2">
                                  <CircleCheck className="h-3 w-3" /> Primary Formulation Role
                                </FormLabel>
                                <p className="text-[9px] text-stone-500 italic mt-1">The main function this ingredient serves in your artisanal chocolate.</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                                   {availableRoles.length > 0 ? (
                                      availableRoles.map((role: string) => (
                                        <div 
                                          key={role} 
                                          className={cn(
                                            "flex items-center gap-2 p-4 bg-background rounded-2xl border-2 transition-all cursor-pointer",
                                            field.value === role ? "border-primary bg-primary/5 shadow-md" : "border-stone-100 hover:border-primary/20"
                                          )} 
                                          onClick={() => field.onChange(role)}
                                        >
                                           <div className={cn("h-4 w-4 rounded-full border-2 flex items-center justify-center", field.value === role ? "border-primary bg-primary" : "border-stone-200")}>
                                              {field.value === role && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                           </div>
                                           <span className="text-[10px] font-bold uppercase tracking-tight">{role}</span>
                                        </div>
                                      ))
                                   ) : (
                                     <div className="col-span-full py-10 text-center bg-stone-100/50 rounded-[2rem] italic text-stone-400 text-xs">
                                        Select Category, Type, and Form to unlock roles.
                                     </div>
                                   )}
                                </div>
                                <FormMessage />
                             </FormItem>
                           )} />

                           <Separator className="bg-stone-200/50" />

                           <FormField control={form.control} name="secondaryRoles" render={({ field }) => (
                             <FormItem>
                                <FormLabel className="uppercase text-[10px] font-black tracking-widest text-stone-400">Secondary Roles (Optional)</FormLabel>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                                   {availableRoles.map((role: string) => (
                                      <div 
                                        key={role} 
                                        className={cn(
                                          "flex items-center gap-2 p-4 bg-background rounded-2xl border-2 transition-all cursor-pointer",
                                          watchSecondaryRoles.includes(role) ? "border-primary/40 bg-primary/5" : "border-stone-100 hover:border-primary/10"
                                        )} 
                                        onClick={() => {
                                          const current = form.getValues('secondaryRoles') || [];
                                          if (current.includes(role)) {
                                            form.setValue('secondaryRoles', current.filter(r => r !== role));
                                          } else {
                                            form.setValue('secondaryRoles', [...current, role]);
                                          }
                                        }}
                                      >
                                         <Checkbox checked={watchSecondaryRoles.includes(role)} />
                                         <span className="text-[10px] font-bold uppercase tracking-tight text-stone-500">{role}</span>
                                      </div>
                                   ))}
                                </div>
                             </FormItem>
                           )} />
                        </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="technical" className="space-y-10 mt-0">
                     <div className="bg-stone-50 p-8 rounded-[2rem] border-2 border-dashed space-y-8">
                        <div className="flex items-center gap-3 text-primary mb-4">
                           <Beaker className="h-6 w-6" />
                           <span className="text-[10px] font-black uppercase tracking-[0.3em]">Quality Matrix: {watchCategory}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                           {(watchCategory?.includes('Chocolate') || watchCategory?.includes('Cocoa')) && (
                             <>
                               <FormField control={form.control} name="cocoaPercent" render={({ field }) => (
                                 <FormItem><FormLabel className="uppercase text-[8px] font-black text-stone-400">Cocoa Total %</FormLabel><FormControl><Input type="number" step="0.1" className="h-10 rounded-lg" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                               )} />
                               <FormField control={form.control} name="fatPercent" render={({ field }) => (
                                 <FormItem><FormLabel className="uppercase text-[8px] font-black text-stone-400">Total Fat %</FormLabel><FormControl><Input type="number" step="0.1" className="h-10 rounded-lg" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                               )} />
                             </>
                           )}
                           {watchCategory === 'Sweeteners' && (
                             <FormField control={form.control} name="sugarPercent" render={({ field }) => (
                               <FormItem><FormLabel className="uppercase text-[8px] font-black text-stone-400">Sugar Content %</FormLabel><FormControl><Input type="number" step="0.1" className="h-10 rounded-lg" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                             )} />
                           )}
                           {(watchCategory?.includes('Fruits') || watchCategory?.includes('Botanicals')) && (
                             <>
                               <FormField control={form.control} name="brix" render={({ field }) => (
                                 <FormItem><FormLabel className="uppercase text-[8px] font-black text-stone-400">Brix Scale</FormLabel><FormControl><Input type="number" step="0.1" className="h-10 rounded-lg" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                               )} />
                               <FormField control={form.control} name="ph" render={({ field }) => (
                                 <FormItem><FormLabel className="uppercase text-[8px] font-black text-stone-400">Acidity (pH)</FormLabel><FormControl><Input type="number" step="0.1" className="h-10 rounded-lg" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                             )} />
                             </>
                           )}
                           <FormField control={form.control} name="moisturePercent" render={({ field }) => (
                             <FormItem><FormLabel className="uppercase text-[8px] font-black text-stone-400">Moisture Load %</FormLabel><FormControl><Input type="number" step="0.1" className="h-10 rounded-lg" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                           )} />
                        </div>
                     </div>
                  </TabsContent>

                  <TabsContent value="allergens" className="space-y-10 mt-0">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                           <h4 className="text-xl font-headline font-bold flex items-center gap-2 text-rose-600">
                             <ShieldAlert className="h-5 w-5" /> Allergen Matrix
                           </h4>
                           <div className="space-y-4">
                              {ALLERGENS.map((a) => (
                                <div key={a} className="grid grid-cols-2 items-center border-b pb-3 border-stone-100">
                                   <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{a}</span>
                                   <FormField control={form.control} name={`allergens.${a}` as any} render={({ field }) => (
                                      <Select onValueChange={field.onChange} value={field.value ?? 'Unknown'}>
                                         <FormControl><SelectTrigger className="h-8 rounded-lg text-[9px] font-bold uppercase border-stone-200"><SelectValue /></SelectTrigger></FormControl>
                                         <SelectContent>{allergenStatusOptions.map(opt => <SelectItem key={opt} value={opt} className="text-[9px]">{opt}</SelectItem>)}</SelectContent>
                                      </Select>
                                   )} />
                                </div>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-8">
                           <div className="p-8 bg-stone-50 rounded-[2rem] border space-y-6">
                              <h5 className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Certifications</h5>
                              <div className="space-y-4">
                                 {['glutenFree', 'vegan', 'vegetarian'].map(c => (
                                   <div key={c} className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold uppercase">{c.replace(/([A-Z])/g, ' $1').trim()}</span>
                                      <FormField control={form.control} name={`allergens.${c}` as any} render={({ field }) => (
                                         <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                                      )} />
                                   </div>
                                 ))}
                              </div>
                           </div>
                           
                           <FormField control={form.control} name="allergens.verificationDate" render={({ field }) => (
                             <FormItem>
                                <FormLabel className="uppercase text-[8px] font-black tracking-widest text-stone-400">Supplier Specification Verification Date</FormLabel>
                                <FormControl><Input type="date" className="h-10 rounded-xl border-stone-200" {...field} value={field.value ?? ''} /></FormControl>
                                <FormDescription className="text-[8px]">Allergen status should be verified against actual manufacturer documents.</FormDescription>
                             </FormItem>
                           )} />
                        </div>
                     </div>
                  </TabsContent>

                  <TabsContent value="commercial" className="space-y-10 mt-0">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-8">
                           <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest border-b pb-2">
                              <Zap className="h-4 w-4" /> Logistics Intelligence
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField control={form.control} name="storageCondition" render={({ field }) => (
                                <FormItem>
                                   <FormLabel className="uppercase text-[9px] font-black text-stone-400">Storage Environment</FormLabel>
                                   <Select onValueChange={field.onChange} value={field.value ?? 'Ambient'}>
                                      <FormControl><SelectTrigger className="h-10 rounded-xl border-stone-200"><SelectValue /></SelectTrigger></FormControl>
                                      <SelectContent>{['Ambient', 'Cool & Dry', 'Refrigerated', 'Frozen', 'Temp Controlled', 'Humidity Controlled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                   </Select>
                                </FormItem>
                              )} />
                              <FormField control={form.control} name="shelfLifeDays" render={({ field }) => (
                                <FormItem>
                                   <FormLabel className="uppercase text-[9px] font-black text-stone-400">Shelf Life (Days)</FormLabel>
                                   <FormControl><Input type="number" className="h-10 rounded-xl border-stone-200" {...field} value={field.value ?? ''} /></FormControl>
                                </FormItem>
                              )} />
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField control={form.control} name="batchNumber" render={({ field }) => (
                                <FormItem>
                                   <FormLabel className="uppercase text-[9px] font-black text-stone-400">Current Batch #</FormLabel>
                                   <FormControl><Input className="h-10 rounded-xl border-stone-200" {...field} value={field.value ?? ''} /></FormControl>
                                </FormItem>
                              )} />
                              <FormField control={form.control} name="lotNumber" render={({ field }) => (
                                <FormItem>
                                   <FormLabel className="uppercase text-[9px] font-black text-stone-400">Lot Identifier</FormLabel>
                                   <FormControl><Input className="h-10 rounded-xl border-stone-200" {...field} value={field.value ?? ''} /></FormControl>
                                </FormItem>
                              )} />
                           </div>
                           <FormField control={form.control} name="expiryDate" render={({ field }) => (
                              <FormItem>
                                 <FormLabel className="uppercase text-[9px] font-black text-stone-400">Expiry Date</FormLabel>
                                 <FormControl><Input type="date" className="h-10 rounded-xl border-stone-200" {...field} value={field.value ?? ''} /></FormControl>
                              </FormItem>
                           )} />
                        </div>

                        <div className="space-y-8">
                           <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest border-b pb-2">
                              <Download className="h-4 w-4" /> Procurement Defaults
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <FormField control={form.control} name="purchasePrice" render={({ field }) => (
                                <FormItem><FormLabel className="uppercase text-[8px] font-bold text-stone-400">Purchase Rate (₹)</FormLabel><FormControl><Input type="number" className="h-10 rounded-xl border-stone-200" {...field} value={field.value ?? 0} /></FormControl></FormItem>
                              )} />
                              <FormField control={form.control} name="purchaseUnit" render={({ field }) => (
                                <FormItem><FormLabel className="uppercase text-[8px] font-bold text-stone-400">Rate Unit (kg/L)</FormLabel><FormControl><Input className="h-10 rounded-xl border-stone-200" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                              )} />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <FormField control={form.control} name="purchaseQuantity" render={({ field }) => (
                                <FormItem><FormLabel className="uppercase text-[8px] font-bold text-stone-400">Purchase Qty</FormLabel><FormControl><Input type="number" className="h-10 rounded-xl border-stone-200" {...field} value={field.value ?? 0} /></FormControl></FormItem>
                              )} />
                              <FormField control={form.control} name="defaultUnit" render={({ field }) => (
                                 <FormItem>
                                   <FormLabel className="uppercase text-[9px] font-black text-stone-400">Recipe Unit</FormLabel>
                                   <Select onValueChange={field.onChange} value={field.value ?? 'g'}>
                                      <FormControl><SelectTrigger className="h-10 rounded-xl border-stone-200"><SelectValue /></SelectTrigger></FormControl>
                                      <SelectContent>{['mg', 'g', 'kg', 'ml', 'L', 'pcs', 'tbsp', 'tsp', 'pinch'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                                   </Select>
                                 </FormItem>
                              )} />
                           </div>
                        </div>
                     </div>
                  </TabsContent>
                </ScrollArea>

                <div className="p-8 border-t bg-background flex items-center justify-between shrink-0">
                   <div className="flex items-center gap-4 text-muted-foreground">
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Certified Artisan Specification System</p>
                   </div>
                   <div className="flex gap-4">
                      <DialogClose asChild><Button type="button" variant="ghost" className="h-12 px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest">Abort</Button></DialogClose>
                      <Button type="submit" disabled={isSaving} className="h-12 px-12 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 bg-primary text-stone-950">
                        {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                        Commit Intelligence
                      </Button>
                   </div>
                </div>
              </form>
            </Form>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={!!itemToDelete} onOpenChange={(o) => { if(!o) { setItemToDelete(null); setDeleteInput(''); } }}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
          <div className="bg-destructive/10 p-8 border-b border-destructive/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline flex items-center gap-3 text-destructive">
                <ShieldAlert className="h-8 w-8" />
                Permanent Removal
              </DialogTitle>
              <DialogDescription className="text-stone-600 font-medium">
                Destroying <strong className="text-stone-900">{itemToDelete?.name}</strong> will impact historical recipes and costing logs. This action is irreversible.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-10 space-y-6">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Security Verification</Label>
              <p className="text-xs text-stone-500 italic">Type the word <span className="font-bold text-destructive underline">delete</span> manually to authorize destruction.</p>
              <Input 
                placeholder="Type here..." 
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                className="h-14 rounded-2xl border-2 border-stone-200 focus:border-destructive/40 focus:ring-destructive/10 text-center text-lg font-bold tracking-widest"
              />
            </div>
            <div className="flex gap-4">
               <Button variant="ghost" onClick={() => setItemToDelete(null)} className="flex-1 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest" disabled={isDeleting}>Abort</Button>
               <Button 
                variant="destructive" 
                className="flex-2 px-10 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-destructive/20" 
                disabled={deleteInput.toLowerCase() !== 'delete' || isDeleting}
                onClick={confirmDelete}
               >
                 {isDeleting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Final Destroy'}
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
