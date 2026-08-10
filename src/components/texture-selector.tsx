
'use client';

import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2, Palette, Sparkles, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CHOCOLATE_TEXTURES, CHOCOLATE_TEXTURE_CATEGORIES } from '@/lib/textures';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface TextureSelectorProps {
  selectedId: string;
  onSelect: (textureId: string) => void;
  onRemove: () => void;
}

export function TextureSelector({ selectedId, onSelect, onRemove }: TextureSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredTextures = useMemo(() => {
    return CHOCOLATE_TEXTURES.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory ? t.category === activeCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  const selectedTexture = useMemo(() => CHOCOLATE_TEXTURES.find(t => t.id === selectedId), [selectedId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search Artisan Library..." 
            className="pl-10 h-11 rounded-xl bg-card border-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
           <Button 
            variant={activeCategory === null ? 'default' : 'secondary'} 
            size="sm" 
            className="rounded-full text-[10px] uppercase font-bold tracking-widest px-4 h-9"
            onClick={() => setActiveCategory(null)}
           >
             All
           </Button>
           {CHOCOLATE_TEXTURE_CATEGORIES.map(cat => (
             <Button 
              key={cat}
              variant={activeCategory === cat ? 'default' : 'secondary'} 
              size="sm" 
              className="rounded-full text-[10px] uppercase font-bold tracking-widest px-4 h-9 whitespace-nowrap"
              onClick={() => setActiveCategory(cat)}
             >
               {cat}
             </Button>
           ))}
        </div>
      </div>

      {selectedTexture && (
        <div className="bg-primary/5 border border-primary/20 rounded-[1.5rem] p-4 flex items-center justify-between animate-in fade-in zoom-in-95 duration-300">
           <div className="flex items-center gap-4">
              <div 
                className="h-10 w-10 rounded-xl shadow-inner border border-white/20"
                style={{ backgroundColor: `#${selectedTexture.color.toString(16).padStart(6, '0')}` }}
              />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-1">Active Specification</p>
                <p className="text-sm font-bold leading-none">{selectedTexture.name}</p>
              </div>
           </div>
           <Button variant="ghost" size="icon" onClick={onRemove} className="text-stone-400 hover:text-destructive h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
           </Button>
        </div>
      )}

      <ScrollArea className="h-[450px] pr-4 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTextures.map((t) => (
            <div 
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={cn(
                "group relative bg-card rounded-2xl border-2 p-4 cursor-pointer transition-all duration-300 overflow-hidden",
                selectedId === t.id ? "border-primary shadow-xl scale-[1.02]" : "border-stone-100 hover:border-primary/40 hover:shadow-lg"
              )}
            >
              {/* Swatch Preview */}
              <div className="aspect-video w-full rounded-xl mb-4 relative overflow-hidden shadow-inner border border-stone-50">
                 <div 
                    className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundColor: `#${t.color.toString(16).padStart(6, '0')}` }}
                 />
                 {/* Procedural Reflection Hint */}
                 <div className={cn(
                    "absolute inset-0 opacity-40",
                    t.glossLevel === 'Glossy' ? "bg-gradient-to-tr from-white/20 via-transparent to-white/40" : "bg-black/5"
                 )} />
                 
                 {selectedId === t.id && (
                   <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center">
                      <CheckCircle2 className="text-white h-8 w-8 drop-shadow-xl" />
                   </div>
                 )}
              </div>

              <div className="space-y-1">
                 <h4 className="text-xs font-bold leading-tight line-clamp-1">{t.name}</h4>
                 <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">{t.category.split(' ')[0]}</p>
                 <p className="text-[10px] text-stone-400 font-medium line-clamp-2 italic pt-2">{t.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-50 flex items-center justify-between">
                 <Badge variant="outline" className="rounded-full text-[8px] uppercase tracking-tighter border-none bg-stone-50 text-stone-400 font-black">
                   {t.glossLevel}
                 </Badge>
                 {selectedId === t.id ? (
                   <Button variant="ghost" size="sm" className="h-6 text-[8px] font-black uppercase text-primary p-0">In Use</Button>
                 ) : (
                   <Button variant="link" size="sm" className="h-6 text-[8px] font-black uppercase text-stone-300 group-hover:text-primary p-0 transition-colors">Apply</Button>
                 )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
