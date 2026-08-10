'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Package,
  Layers,
  Calculator,
  Users,
  Clock,
  TrendingUp,
  ShieldCheck,
  Search,
  BookOpen,
  Droplets,
  Zap,
  Info,
  Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CostingGuideProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct: any;
  activeRecipe: any;
  results: any;
  formValues: any;
  suggestedPrice: number;
}

export function CostingGuide({ 
  isOpen, 
  onClose, 
  selectedProduct, 
  activeRecipe, 
  results, 
  formValues, 
  suggestedPrice 
}: CostingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const totalSteps = 17;

  const steps = [
    {
      title: "Step 1 — Select the Product",
      instruction: "Select the product for which the final costing is being prepared.",
      validate: () => !!formValues.productId,
      missingLabel: "No product selected",
      animation: (
        <div className="flex flex-col items-center justify-center h-full space-y-6">
          <motion.div 
            animate={{ y: [0, -10, 0] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-48 h-12 bg-muted rounded-xl border-2 border-dashed flex items-center px-4 gap-3"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <div className="h-2 w-24 bg-muted-foreground/20 rounded" />
          </motion.div>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={formValues.productId ? { scale: 1, opacity: 1 } : {}}
            className="p-6 bg-primary/10 rounded-2xl border-2 border-primary/20 text-center"
          >
            <p className="font-bold text-sm text-primary">{selectedProduct?.name || "Search Identity"}</p>
            <p className="text-[10px] uppercase font-black tracking-widest text-primary/60 mt-1">{selectedProduct?.sku || "ID: ---"}</p>
          </motion.div>
        </div>
      )
    },
    {
      title: "Step 2 — Load Recipe",
      instruction: "The system automatically loads the active recipe associated with the selected product.",
      validate: () => !!activeRecipe,
      missingLabel: "No active recipe linked",
      animation: (
        <div className="flex items-center justify-center h-full gap-8">
          <motion.div 
            animate={{ x: [0, 20, 0] }}
            className="p-4 bg-muted rounded-xl"
          >
            <Package className="h-8 w-8 text-stone-400" />
          </motion.div>
          <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ArrowRight className="h-6 w-6 text-primary" />
          </motion.div>
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={activeRecipe ? { y: 0, opacity: 1 } : {}}
            className="p-6 bg-stone-900 rounded-2xl border border-stone-800 text-center"
          >
            <BookOpen className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="font-bold text-xs text-white">{activeRecipe?.name || "Recipe Logic"}</p>
            <Badge variant="outline" className="mt-2 text-[8px] border-primary/20 text-primary">v{activeRecipe?.currentVersion || "1.0"}</Badge>
          </motion.div>
        </div>
      )
    },
    {
      title: "Step 3 — Review Ingredient Costs",
      instruction: "Review every ingredient used in the recipe and verify its current purchase cost.",
      validate: () => results?.ingredientBreakdown?.length > 0,
      missingLabel: "No ingredients in recipe",
      animation: (
        <div className="w-full max-w-xs mx-auto space-y-3">
          {[0, 1, 2].map(i => (
            <motion.div 
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.2 }}
              className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border"
            >
              <div className="h-2 w-20 bg-muted-foreground/20 rounded" />
              <div className="h-2 w-12 bg-primary/20 rounded" />
            </motion.div>
          ))}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="pt-4 flex justify-between items-baseline"
          >
            <span className="text-[8px] font-black uppercase text-stone-400">Raw Material Total</span>
            <span className="text-xl font-bold font-headline">₹{results?.rawMaterialCost?.toFixed(2) || '0.00'}</span>
          </motion.div>
        </div>
      )
    },
    {
      title: "Step 4 — Verify Batch Size & Yield",
      instruction: "Verify the relationship between the recipe batch size and the number of finished units produced.",
      animation: (
        <div className="flex flex-col items-center justify-center h-full space-y-6">
          <div className="flex items-end gap-1">
            <motion.div animate={{ height: [20, 60, 20] }} transition={{ repeat: Infinity, duration: 3 }} className="w-12 bg-primary/20 rounded-t-lg" />
            <motion.div animate={{ height: [40, 20, 40] }} transition={{ repeat: Infinity, duration: 3 }} className="w-12 bg-primary/40 rounded-t-lg" />
            <motion.div animate={{ height: [10, 40, 10] }} transition={{ repeat: Infinity, duration: 3 }} className="w-12 bg-primary/60 rounded-t-lg" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold">{formValues.productionYield} Finished Units</p>
            <p className="text-[10px] text-muted-foreground uppercase">From {formValues.batchSize} {formValues.batchUnit} Batch</p>
          </div>
        </div>
      )
    },
    {
      title: "Step 5 — Account for Wastage",
      instruction: "Apply production losses (tempering, handling, etc.) to the raw material load.",
      animation: (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <div className="relative w-32 h-32">
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              className="absolute inset-0 border-4 border-dashed border-stone-200 rounded-full" 
            />
            <div className="absolute inset-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Droplets className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>
          <Badge className="bg-amber-500/20 text-amber-600 border-none">+{formValues.wastagePercent}% Buffer</Badge>
        </div>
      )
    },
    {
      title: "Step 6 — Calculate Packaging Cost",
      instruction: "Add all applicable packaging components (primary, secondary, labels, boxes).",
      animation: (
        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
          {['Box', 'Foil', 'Label', 'Bag'].map((p, i) => (
            <motion.div 
              key={p}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.15 }}
              className="p-4 bg-muted/40 rounded-2xl border flex flex-col items-center"
            >
              <Package className="h-4 w-4 text-stone-400 mb-1" />
              <span className="text-[8px] font-bold uppercase">{p}</span>
            </motion.div>
          ))}
          <div className="col-span-2 text-center pt-2">
            <p className="text-lg font-bold">₹{results?.totalPackagingCost?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
      )
    },
    {
      title: "Step 7 — Calculate Direct Labour",
      instruction: "Include the cost of artisanal effort based on worker count and production time.",
      animation: (
        <div className="flex items-center justify-center h-full gap-6">
          <div className="text-center space-y-1">
             <div className="h-10 w-10 bg-accent/20 rounded-full flex items-center justify-center mx-auto"><Users className="h-5 w-5 text-accent" /></div>
             <p className="text-[8px] font-bold">{formValues.numWorkers} Staff</p>
          </div>
          <div className="text-xl font-light text-stone-300">×</div>
          <div className="text-center space-y-1">
             <div className="h-10 w-10 bg-accent/20 rounded-full flex items-center justify-center mx-auto"><Clock className="h-5 w-5 text-accent" /></div>
             <p className="text-[8px] font-bold">{formValues.labourHours} Hrs</p>
          </div>
          <div className="text-xl font-light text-stone-300">=</div>
          <div className="text-center">
             <p className="text-xl font-bold text-accent">₹{results?.totalLabourCost?.toFixed(2)}</p>
          </div>
        </div>
      )
    },
    {
      title: "Step 8 — Add Production Costs",
      instruction: "Consider electricity, water, and equipment usage necessary for this batch.",
      animation: (
        <div className="flex flex-col items-center justify-center h-full">
           <motion.div 
            animate={{ rotateY: 180 }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="p-8 bg-stone-100 rounded-[2rem] border-4 border-stone-200"
           >
              <Zap className="h-10 w-10 text-amber-500" />
           </motion.div>
           <p className="mt-4 text-[10px] font-black uppercase text-stone-400 tracking-widest">Equipment Power Load</p>
        </div>
      )
    },
    {
      title: "Step 9 — Apply Manufacturing Overhead",
      instruction: "Apply general factory overheads as per your current simulation settings.",
      animation: (
        <div className="relative w-48 h-24 flex items-center justify-center">
           <motion.div 
            animate={{ x: [-50, 0], opacity: [0, 1] }}
            className="absolute left-0 w-12 h-12 bg-muted rounded-xl"
           />
           <motion.div 
            animate={{ x: [50, 0], opacity: [0, 1] }}
            className="absolute right-0 w-12 h-12 bg-muted rounded-xl"
           />
           <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="z-10 w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl"
           >
              <Layers className="h-8 w-8" />
           </motion.div>
        </div>
      )
    },
    {
      title: "Step 10 — Calculate Basic Manufacturing Cost",
      instruction: "All components merge to form the certified basic manufacturing cost.",
      animation: (
        <div className="flex flex-col items-center justify-center h-full space-y-8">
           <div className="relative h-32 w-32 flex items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="absolute inset-0 border-2 border-dashed border-primary/20 rounded-full" />
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                className="w-24 h-24 bg-stone-900 rounded-[2rem] flex flex-col items-center justify-center text-primary shadow-2xl"
              >
                <Calculator className="h-8 w-8" />
                <span className="text-[7px] font-black uppercase mt-1">Total Logic</span>
              </motion.div>
           </div>
           <p className="text-3xl font-bold font-headline">₹{results?.basicManufacturingCost?.toFixed(2)}</p>
        </div>
      )
    },
    {
      title: "Step 11 — Calculate Cost Per Unit",
      instruction: "Divide total manufacturing cost by yield to determine the individual unit cost.",
      animation: (
        <div className="flex flex-col items-center justify-center h-full space-y-6">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-lg font-bold text-xs">Total Cost</div>
              <div className="text-xl">÷</div>
              <div className="p-3 bg-muted rounded-lg font-bold text-xs">Yield</div>
           </div>
           <motion.div 
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-center"
           >
              <p className="text-4xl font-bold text-primary tracking-tighter">₹{results?.costPerUnit?.toFixed(2)}</p>
              <p className="text-[10px] font-black uppercase text-stone-400">Cost / Finished Unit</p>
           </motion.div>
        </div>
      )
    },
    {
      title: "Step 12 — Calculate Cost Per Weight",
      instruction: "View standardized costs per gram and per 100g for benchmarking.",
      animation: (
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs mx-auto">
           <div className="p-4 bg-muted/30 rounded-2xl border text-center">
              <p className="text-[8px] font-black text-stone-400 uppercase">Per Gram</p>
              <p className="font-bold">₹{(results?.costPerUnit / (parseFloat(selectedProduct?.weight) || 1)).toFixed(2)}</p>
           </div>
           <div className="p-4 bg-muted/30 rounded-2xl border text-center">
              <p className="text-[8px] font-black text-stone-400 uppercase">Per 100g</p>
              <p className="font-bold text-primary">₹{results?.costPer100g?.toFixed(2)}</p>
           </div>
        </div>
      )
    },
    {
      title: "Step 13 — Review Additional Costs",
      instruction: "Consider non-manufacturing costs such as logistics and marketing separately.",
      animation: (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
           <div className="h-1 bg-muted w-32 rounded-full overflow-hidden">
              <motion.div animate={{ x: [-128, 128] }} transition={{ repeat: Infinity, duration: 2 }} className="h-full w-16 bg-primary" />
           </div>
           <div className="flex gap-4 text-stone-300">
              <Truck className="h-6 w-6" />
              <TrendingUp className="h-6 w-6" />
              <Info className="h-6 w-6" />
           </div>
        </div>
      )
    },
    {
      title: "Step 14 — Optional Selling Price Simulation",
      instruction: "Simulate a retail price based on your desired profit and channel margins.",
      animation: (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
           <div className="flex justify-between w-48 p-2 border-b">
              <span className="text-[10px] font-bold">Cost</span>
              <span className="text-[10px] font-bold">₹{results?.costPerUnit?.toFixed(0)}</span>
           </div>
           <div className="flex justify-between w-48 p-2 border-b text-green-600">
              <span className="text-[10px] font-bold">Profit ({formValues.pricing.profitPercent}%)</span>
              <span className="text-[10px] font-bold">Included</span>
           </div>
           <motion.div 
            animate={{ scale: [1, 1.05, 1] }} 
            className="p-4 bg-stone-900 rounded-2xl w-48 text-center shadow-xl"
           >
              <p className="text-[8px] font-black uppercase text-primary mb-1">Suggested Retail</p>
              <p className="text-2xl font-bold text-white">₹{suggestedPrice?.toFixed(0)}</p>
           </motion.div>
        </div>
      )
    },
    {
      title: "Step 15 — Review Final Cost Summary",
      instruction: "Finalize your audit of the entire financial simulation.",
      animation: (
        <div className="space-y-2 w-full max-w-[200px] mx-auto text-[9px] font-bold">
           <div className="flex justify-between text-stone-400"><span>Materials</span> <span>₹{results?.rawMaterialCost?.toFixed(0)}</span></div>
           <div className="flex justify-between text-stone-400"><span>Labour</span> <span>₹{results?.totalLabourCost?.toFixed(0)}</span></div>
           <div className="flex justify-between text-stone-400"><span>Overhead</span> <span>₹{results?.totalOverheadCost?.toFixed(0)}</span></div>
           <Separator className="my-2" />
           <div className="flex justify-between text-primary text-sm font-black uppercase tracking-tighter"><span>Basic Cost</span> <span>₹{results?.costPerUnit?.toFixed(2)}</span></div>
        </div>
      )
    },
    {
      title: "Step 16 — Save the Simulation",
      instruction: "Commit your simulation to the encrypted artisan database.",
      animation: (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
           <motion.div 
            animate={{ scale: [1, 0.9, 1] }}
            className="p-8 bg-primary text-stone-950 rounded-[2.5rem] shadow-2xl"
           >
              <ShieldCheck className="h-12 w-12" />
           </motion.div>
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary animate-pulse">Ready to Synchronize</p>
        </div>
      )
    },
    {
      title: "Step 17 — Final Cost Approval",
      instruction: "Finalize this record to create a permanent historical costing snapshot.",
      animation: (
        <div className="space-y-4 text-left p-6 bg-muted/20 rounded-[2rem] border border-dashed border-stone-200">
           <div className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-green-500" /> <span className="text-[10px] font-bold">Product Identity Verified</span></div>
           <div className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-green-500" /> <span className="text-[10px] font-bold">Recipe Logic Validated</span></div>
           <div className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-green-500" /> <span className="text-[10px] font-bold">Price Snapshots Ready</span></div>
           <Separator className="my-2" />
           <p className="text-[9px] text-stone-500 italic">"Once finalized, this version will be preserved as a historical costing snapshot."</p>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const validationError = currentStepData.validate && !currentStepData.validate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-5xl rounded-[3rem] border-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] bg-background overflow-hidden flex flex-col h-[90vh]">
        <div className="bg-stone-900 text-white px-10 py-6 border-b shrink-0 flex items-center justify-between">
           <div className="space-y-1">
              <h2 className="text-2xl font-headline flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-primary" />
                Artisan Costing Advisor
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Step {currentStep + 1} of {totalSteps}</span>
                <Progress value={((currentStep + 1) / totalSteps) * 100} className="w-32 h-1 bg-stone-800" />
              </div>
           </div>
           <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 text-white">
              <X className="h-6 w-6" />
           </Button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
           <div className="lg:w-1/2 flex flex-col justify-center p-10 lg:p-16 space-y-10 border-r">
              <AnimatePresence mode="wait">
                 <motion.div 
                    key={currentStep}
                    initial={shouldReduceMotion ? { opacity: 0 } : { x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { x: 20, opacity: 0 }}
                    className="space-y-6"
                 >
                    <Badge className="bg-primary text-stone-950 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">
                      {isLastStep ? "Final Validation" : `Operational Phase ${currentStep + 1}`}
                    </Badge>
                    <h3 className="text-4xl font-headline font-bold leading-tight">{currentStepData.title}</h3>
                    <p className="text-lg text-stone-500 font-light leading-relaxed">{currentStepData.instruction}</p>

                    {validationError && (
                      <div className="p-6 bg-rose-50 rounded-2xl border-2 border-rose-100 flex gap-4 animate-in shake-in duration-500">
                         <AlertCircle className="h-6 w-6 text-rose-600 shrink-0" />
                         <div className="space-y-1">
                            <p className="font-bold text-rose-900 text-sm">Information Required</p>
                            <p className="text-xs text-rose-700">{currentStepData.missingLabel}</p>
                            <Button variant="link" size="sm" className="p-0 h-auto text-rose-600 font-bold uppercase text-[9px] tracking-widest" onClick={onClose}>Go to Required Information</Button>
                         </div>
                      </div>
                    )}
                 </motion.div>
              </AnimatePresence>

              <div className="flex gap-4 pt-10">
                 <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold uppercase text-[10px] tracking-widest" onClick={handleBack} disabled={currentStep === 0}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                 </Button>
                 {isLastStep ? (
                   <Button className="flex-2 px-10 h-14 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20" onClick={onClose}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Finish Guide
                   </Button>
                 ) : (
                   <Button className="flex-2 px-10 h-14 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20" onClick={handleNext} disabled={validationError}>
                      Next Step <ChevronRight className="ml-2 h-4 w-4" />
                   </Button>
                 )}
              </div>
              
              <div className="flex justify-center gap-8 pt-4">
                 <Button variant="link" className="text-stone-400 hover:text-primary text-[9px] font-black uppercase tracking-widest" onClick={() => setCurrentStep(0)}>Restart Guide</Button>
                 <Button variant="link" className="text-stone-400 hover:text-stone-900 text-[9px] font-black uppercase tracking-widest" onClick={onClose}>Skip Guide</Button>
              </div>
           </div>

           <div className="lg:w-1/2 bg-stone-50 p-10 lg:p-20 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
              <AnimatePresence mode="wait">
                 <motion.div 
                    key={currentStep}
                    initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { scale: 1.1, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full h-full flex items-center justify-center"
                 >
                    <div className="w-full max-w-sm aspect-square bg-white rounded-[3rem] shadow-2xl border border-stone-100 flex flex-col items-center justify-center p-8 overflow-hidden relative">
                       {currentStepData.animation}
                       
                       {/* Background Decorations */}
                       <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                       <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                    </div>
                 </motion.div>
              </AnimatePresence>
           </div>
        </div>
      </Card>
    </div>
  );
}
