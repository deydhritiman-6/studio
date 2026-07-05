
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Star, 
  Sparkles, 
  Heart, 
  History, 
  Crown, 
  CheckCircle2, 
  ShoppingBag,
  Truck
} from 'lucide-react';
import { Logo } from '@/components/logo';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50 font-body">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-xl px-4 md:px-8 h-20 md:h-24 flex items-center shadow-sm">
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex-1 flex justify-start">
             <Link href="/shop/my-orders" className="flex items-center gap-2 group text-stone-500 hover:text-primary transition-colors">
                <div className="relative h-10 w-10 md:h-12 md:w-12 rounded-full overflow-hidden border border-stone-200 group-hover:border-primary/30 transition-all">
                  <Image src="/delivery.jpeg" alt="Tracking" fill className="object-cover" />
                </div>
                <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">Track Journey</span>
             </Link>
          </div>
          
          <div className="flex-shrink-0">
            <Link href="/" className="hover:scale-105 transition-transform duration-500 block">
              <Logo className="h-8 md:h-12 w-auto" />
            </Link>
          </div>

          <div className="flex-1 flex justify-end items-center gap-6">
            <nav className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
              <Link href="/shop" className="hover:text-primary transition-colors">The Shop</Link>
              <Link href="#story" className="hover:text-primary transition-colors">Our Story</Link>
            </nav>
            <Link href="/shop/cart" className="flex items-center gap-2 group text-stone-500 hover:text-primary transition-colors">
                <span className="hidden md:block text-[10px] font-black uppercase tracking-widest text-right">My Basket</span>
                <div className="relative h-10 w-10 md:h-12 md:w-12 rounded-full overflow-hidden border border-stone-200 group-hover:border-primary/30 transition-all">
                  <Image src="/cart2.jpeg" alt="Basket" fill className="object-cover" />
                </div>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-32 px-6">
          <div className="absolute inset-0 -z-10">
            <Image 
              src="https://picsum.photos/seed/roseberry-hero/1920/1080" 
              alt="Artisan Chocolate Workspace" 
              fill 
              className="object-cover brightness-[0.85] grayscale-[0.2]" 
              priority
              data-ai-hint="artisan chocolate"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-stone-900/40 via-stone-900/20 to-stone-50"></div>
          </div>

          <div className="max-w-5xl mx-auto text-center space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.4em] mx-auto shadow-2xl">
              <Sparkles className="h-3 w-3 text-amber-400" /> Since 2021 • Kolkata
            </div>
            
            <h1 className="text-5xl md:text-8xl font-bold font-headline text-white tracking-tight leading-[1.05] drop-shadow-2xl">
              Handmade with Love.<br />Crafted for Every <span className="italic font-serif text-amber-200">Celebration</span>.
            </h1>
            
            <p className="text-white/90 text-lg md:text-2xl font-light max-w-2xl mx-auto leading-relaxed drop-shadow-lg">
              Indulge in the finest single-origin chocolates, meticulously tempered in our Kolkata kitchen for the true connoisseur.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
              <Button size="lg" className="h-16 px-12 text-lg rounded-2xl bg-amber-600 hover:bg-amber-700 text-white shadow-2xl shadow-amber-900/40 transition-all hover:scale-105" asChild>
                <Link href="/shop">Explore the Collection <ArrowRight className="ml-3 h-5 w-5" /></Link>
              </Button>
              <Button variant="outline" size="lg" className="h-16 px-12 text-lg rounded-2xl bg-white/5 hover:bg-white/10 text-white border-white/30 backdrop-blur-sm transition-all" asChild>
                <Link href="#story">The Artisan Story</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Collections Showcase */}
        <section className="py-32 px-6 bg-stone-50">
          <div className="max-w-7xl mx-auto space-y-20">
            <div className="flex flex-col md:flex-row items-end justify-between gap-8">
              <div className="space-y-4">
                <Badge className="bg-amber-600/10 text-amber-700 border-none px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">Signature Range</Badge>
                <h2 className="text-4xl md:text-6xl font-bold font-headline text-stone-900 tracking-tight">Curated Indulgence</h2>
              </div>
              <Button variant="ghost" className="text-stone-400 hover:text-primary font-bold uppercase tracking-widest text-xs" asChild>
                <Link href="/shop">View Complete Catalog <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { title: "Dark Truffles", desc: "85% Cacao single-origin excellence.", seed: "truffle" },
                { title: "Milk Pralines", desc: "Velvety smooth, nutty perfection.", seed: "praline" },
                { title: "Fruity Ganache", desc: "Infused with organic local harvests.", seed: "berry" },
              ].map((col, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="aspect-[4/5] relative rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700">
                    <Image 
                      src={`https://picsum.photos/seed/rose-${col.seed}/600/800`} 
                      alt={col.title} 
                      fill 
                      className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                      data-ai-hint="luxury chocolate"
                    />
                    <div className="absolute inset-0 bg-stone-900/20 group-hover:bg-stone-900/40 transition-colors duration-500"></div>
                    <div className="absolute bottom-10 left-10 right-10 text-white space-y-2">
                       <h3 className="text-3xl font-bold font-headline">{col.title}</h3>
                       <p className="text-sm font-light text-white/80 opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-500">{col.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Founder Story Section */}
        <section id="story" className="py-32 px-6 bg-stone-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 blur-[120px] rounded-full -mr-48 -mt-48"></div>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
            <div className="lg:col-span-5 relative">
              <div className="aspect-[3/4] relative rounded-[3rem] overflow-hidden border-8 border-stone-800 shadow-2xl">
                <Image 
                  src="https://picsum.photos/seed/raisa/600/800" 
                  alt="Founder Raisa" 
                  fill 
                  className="object-cover" 
                  data-ai-hint="woman smiling"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 bg-amber-600 p-10 rounded-[2.5rem] shadow-2xl hidden md:block">
                 <History className="h-12 w-12 text-stone-950 mb-4" />
                 <p className="font-headline text-3xl text-stone-950 font-bold leading-none">Est. 2021</p>
                 <p className="text-stone-900 text-[10px] font-black uppercase tracking-widest mt-1">Kolkata, India</p>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-10">
              <div className="space-y-4">
                <Badge className="bg-amber-600/20 text-amber-400 border-none px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">The Visionary</Badge>
                <h2 className="text-5xl md:text-7xl font-bold font-headline leading-tight">Meet <span className="text-amber-500 italic">Raisa</span></h2>
              </div>
              
              <div className="space-y-6 text-stone-400 text-lg md:text-xl font-light leading-relaxed">
                <p>
                  Raisa founded Roseberry Chocolate at the age of 65, transforming a lifelong passion into Kolkata's most beloved artisan studio.
                </p>
                <p className="border-l-4 border-amber-600/30 pl-8 italic">
                  "I believe that dreams have no age limit. Our chocolates are born from a desire to bring pure, handmade joy to every celebration, using only the finest ethical ingredients."
                </p>
                <p>
                  Every piece that leaves our kitchen is hand-tempered and personally inspected by Raisa, ensuring the "Handmade with Love" promise is never compromised.
                </p>
              </div>

              <div className="pt-8">
                <Button className="h-16 px-12 text-lg rounded-2xl bg-white text-stone-900 hover:bg-stone-100 transition-all shadow-xl shadow-white/5 group" asChild>
                  <Link href="/shop">Indulge Now <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Features */}
        <section className="py-32 px-6 bg-white">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              { icon: Crown, title: "Artisan Quality", desc: "Meticulously hand-tempered by master chocolatiers." },
              { icon: Heart, title: "Ethical Sourcing", desc: "Supporting small-scale cacao farmers across the belt." },
              { icon: CheckCircle2, title: "Pure Ingredients", desc: "No artificial preservatives. Just raw, vibrant flavor." },
            ].map((feat, i) => (
              <div key={i} className="text-center space-y-6 group">
                <div className="h-20 w-20 bg-stone-50 rounded-[2rem] flex items-center justify-center mx-auto text-amber-600 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 shadow-inner">
                  <feat.icon className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold font-headline text-stone-900">{feat.title}</h4>
                  <p className="text-stone-500 font-light leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews Section */}
        <section className="py-32 px-6 bg-stone-50">
          <div className="max-w-4xl mx-auto text-center space-y-16">
            <Badge className="bg-primary/10 text-primary border-none px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">Patron Testimonials</Badge>
            
            <div className="relative">
              <div className="absolute -top-10 -left-10 text-stone-200 opacity-50"><span className="text-9xl font-serif">“</span></div>
              <p className="text-3xl md:text-5xl font-headline text-stone-800 italic leading-tight relative z-10">
                "The texture and depth of flavor are unparalleled. You can truly taste the love in every bite. It's not just chocolate; it's an experience."
              </p>
            </div>

            <div className="flex items-center justify-center gap-4">
               <div className="h-12 w-12 rounded-full overflow-hidden bg-stone-200">
                  <Image src="https://picsum.photos/seed/patron/100/100" alt="Patron" width={48} height={48} />
               </div>
               <div className="text-left">
                  <p className="font-bold text-stone-900">Ananya Sen</p>
                  <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Connoisseur • Kolkata</p>
               </div>
            </div>
            
            <div className="flex justify-center gap-1 text-amber-400">
               {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
            </div>
          </div>
        </section>
      </main>

      {/* Public Footer */}
      <footer className="bg-stone-900 py-24 px-6 text-center text-white border-t border-white/5">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex justify-center">
              <Logo className="h-10 md:h-12 w-auto brightness-0 invert opacity-60" />
          </div>
          
          <nav className="flex flex-wrap justify-center gap-8 md:gap-16 text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">
            <Link href="/shop" className="hover:text-white transition-colors">Catalog</Link>
            <Link href="#story" className="hover:text-white transition-colors">Our Heritage</Link>
            <Link href="/shop/my-orders" className="hover:text-white transition-colors">Track Order</Link>
            <Link href="/login" className="hover:text-white transition-colors">Wholesale Portal</Link>
          </nav>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-stone-500 text-xs">&copy; {new Date().getFullYear()} Roseberry Chocolate. Kolkata, India.</p>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 text-stone-500 text-[10px] font-bold uppercase tracking-widest">
                  <Heart className="h-3 w-3 text-rose-500" /> Handmade in India
               </div>
               <div className="flex items-center gap-2 text-stone-500 text-[10px] font-bold uppercase tracking-widest">
                  <Truck className="h-3 w-3 text-amber-500" /> Pan-India Shipping
               </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
