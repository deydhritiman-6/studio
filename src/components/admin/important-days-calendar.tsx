'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Search, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { enUS } from 'date-fns/locale';
import { getMonth, getYear, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, isSameMonth, isToday, addMonths, subMonths, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

// --- DATA & TYPES ---
const categories = {
  HINDU: { label: 'Hindu', icon: '🕉️', color: 'bg-orange-100 text-orange-800' },
  BENGALI: { label: 'Bengali Festivals', icon: '🌺', color: 'bg-rose-100 text-rose-800' },
  BUDDHIST: { label: 'Buddhist', icon: '☸️', color: 'bg-yellow-100 text-yellow-800' },
  CHRISTIAN: { label: 'Christian', icon: '✝️', color: 'bg-blue-100 text-blue-800' },
  MUSLIM: { label: 'Muslim', icon: '☪️', color: 'bg-green-100 text-green-800' },
  JAIN: { label: 'Jain', icon: '🕎', color: 'bg-purple-100 text-purple-800' },
  NATIONAL: { label: 'National', icon: '🇮🇳', color: 'bg-gray-100 text-gray-800' },
  INTERNATIONAL: { label: 'International', icon: '🌍', color: 'bg-indigo-100 text-indigo-800' },
  CULTURAL: { label: 'Cultural', icon: '🎉', color: 'bg-pink-100 text-pink-800' },
};

type OccasionCategory = keyof typeof categories;

interface Occasion {
  date: string; // MM-DD format for annual repetition
  name: string;
  category: OccasionCategory;
}

// Comprehensive list of important days and festivals, now using MM-DD for annual repetition.
const importantOccasions: Occasion[] = [
  // Bengali Festivals
  { date: '01-14', name: 'Poush Parbon / Ganga Sagar Mela', category: 'BENGALI' },
  { date: '02-14', name: 'Saraswati Puja', category: 'BENGALI' },
  { date: '03-08', name: 'Maha Shivratri', category: 'BENGALI' },
  { date: '03-25', name: 'Dol Jatra / Dol Purnima', category: 'BENGALI' },
  { date: '04-14', name: 'Poila Boishakh / Bengali New Year', category: 'BENGALI' },
  { date: '04-16', name: 'Basanti Puja', category: 'BENGALI' },
  { date: '06-12', name: 'Jamai Shashti', category: 'BENGALI' },
  { date: '07-07', name: 'Rathayatra', category: 'BENGALI' },
  { date: '08-26', name: 'Janmashtami', category: 'BENGALI' },
  { date: '09-17', name: 'Vishwakarma Puja', category: 'BENGALI' },
  { date: '10-02', name: 'Mahalaya', category: 'BENGALI' },
  { date: '10-10', name: 'Durga Puja (Maha Saptami)', category: 'BENGALI' },
  { date: '10-11', name: 'Durga Puja (Maha Ashtami)', category: 'BENGALI' },
  { date: '10-12', name: 'Durga Puja (Maha Navami)', category: 'BENGALI' },
  { date: '10-13', name: 'Bijoya Dashami', category: 'BENGALI' },
  { date: '10-16', name: 'Kojagari Lakshmi Puja', category: 'BENGALI' },
  { date: '10-31', name: 'Kali Puja', category: 'BENGALI' },
  { date: '11-03', name: 'Bhai Phonta', category: 'BENGALI' },
  { date: '11-10', name: 'Jagaddhatri Puja', category: 'BENGALI' },
  { date: '11-17', name: 'Nabanna', category: 'BENGALI' },

  // Hindu
  { date: '08-19', name: 'Raksha Bandhan', category: 'HINDU' },
  { date: '08-26', name: 'Janmashtami', category: 'HINDU' },
  { date: '09-07', name: 'Ganesh Chaturthi', category: 'HINDU' },
  { date: '10-03', name: 'Navaratri Start', category: 'HINDU' },
  { date: '10-12', name: 'Dussehra', category: 'HINDU' },
  { date: '10-31', name: 'Diwali', category: 'HINDU' },

  // Muslim (Note: Islamic dates are lunar, these are approximations)
  { date: '06-17', name: 'Eid al-Adha', category: 'MUSLIM' },
  { date: '07-17', name: 'Ashura', category: 'MUSLIM' },
  { date: '09-16', name: 'Mawlid al-Nabi', category: 'MUSLIM' },

  // Christian
  { date: '12-25', name: 'Christmas Day', category: 'CHRISTIAN' },
  { date: '04-18', name: 'Good Friday', category: 'CHRISTIAN' },
  { date: '04-20', name: 'Easter Sunday', category: 'CHRISTIAN' },

  // National
  { date: '08-15', name: 'Independence Day', category: 'NATIONAL' },
  { date: '10-02', name: 'Gandhi Jayanti', category: 'NATIONAL' },
  { date: '01-26', name: 'Republic Day', category: 'NATIONAL' },
  
  // International
  { date: '01-01', name: 'New Year\'s Day', category: 'INTERNATIONAL' },
  { date: '02-14', name: 'Valentine\'s Day', category: 'INTERNATIONAL' },
  { date: '05-01', name: 'International Labour Day', category: 'INTERNATIONAL' },
  { date: '06-21', name: 'International Day of Yoga', category: 'INTERNATIONAL' },
  { date: '10-05', name: 'World Teachers\' Day', category: 'INTERNATIONAL' },

  // Buddhist
  { date: '05-23', name: 'Buddha Purnima', category: 'BUDDHIST' },

  // Jain
  { date: '04-21', name: 'Mahavir Jayanti', category: 'JAIN' },
  { date: '09-07', name: 'Paryushana Parva', category: 'JAIN' },
];

// --- HELPER FUNCTIONS ---
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// India has one fixed offset (UTC+5:30) year-round — no DST — so we don't
// need a timezone library. We take the input's UTC timestamp and shift it
// by the IST offset.
const getIndianDate = (date: Date | number = new Date()): Date => {
  const d = typeof date === 'number' ? new Date(date) : date;
  // Correct for the local timezone offset to get a true UTC-based time, then add IST offset.
  return new Date(d.getTime() + IST_OFFSET_MS + d.getTimezoneOffset() * 60 * 1000);
};


// --- COMPONENTS ---
function Calendar({ currentMonth, onDateSelect, occasions, selectedDate, today }: {
  currentMonth: Date;
  onDateSelect: (date: Date) => void;
  occasions: Occasion[];
  selectedDate: Date | null;
  today: Date;
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="grid grid-cols-7 border-t border-l rounded-lg shadow-inner bg-muted/20">
      {weekdays.map(day => (
        <div key={day} className="p-2 text-center text-xs font-bold text-muted-foreground border-b border-r">{day}</div>
      ))}
      {days.map((day, i) => {
        const dayMonthDate = format(day, 'MM-dd');
        const occasionsOnDay = occasions.filter(o => o.date === dayMonthDate);
        const isTodayIST = isSameDay(day, today);
        const isSelected = selectedDate && isSameDay(day, selectedDate);

        return (
          <div 
            key={i}
            onClick={() => onDateSelect(day)}
            className={cn(
              "border-r border-b p-2 min-h-[120px] relative transition-all cursor-pointer",
              !isSameMonth(day, monthStart) ? 'bg-muted/30' : 'bg-white hover:bg-primary/5',
              isTodayIST ? 'bg-amber-50/80 ring-2 ring-primary/40 ring-inset' : '',
              isSelected && !isTodayIST ? 'bg-primary/10 shadow-[inset_0_0_0_2px_hsl(var(--primary))]' : ''
            )}
          >
            <div className="flex justify-between items-start">
                <span className={cn(
                  "text-sm font-bold h-7 w-7 flex items-center justify-center rounded-full transition-colors",
                  !isSameMonth(day, monthStart) ? 'text-muted-foreground' : 'text-stone-800',
                  isTodayIST ? 'bg-primary text-white shadow-md scale-110' : ''
                )}>
                  {format(day, 'd')}
                </span>
                {isTodayIST && (
                    <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-tighter h-4 px-1.5 animate-pulse">
                        TODAY
                    </Badge>
                )}
            </div>

            <div className="mt-2 space-y-1">
              {occasionsOnDay.slice(0, 2).map((o, idx) => (
                <div key={idx} className={cn("text-[10px] p-1 rounded-md truncate font-medium", categories[o.category].color)}>
                  {categories[o.category].icon} {o.name}
                </div>
              ))}
              {occasionsOnDay.length > 2 && (
                <div className="text-[10px] font-bold text-primary px-1">+ {occasionsOnDay.length - 2} more</div>
              )}
            </div>
            
            {/* Subtle glow for today */}
            {isTodayIST && (
                <div className="absolute inset-0 pointer-events-none bg-primary/5 opacity-50 blur-sm" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OccasionDetails({ selectedDate, occasions, onUseOccasion, today }: { 
  selectedDate: Date | null;
  occasions: Occasion[];
  onUseOccasion: (occasion: Occasion) => void;
  today: Date;
}) {
  const occasionsOnDay = useMemo(() => {
    if (!selectedDate) return [];
    const dayMonthDate = format(selectedDate, 'MM-dd');
    return occasions.filter(o => o.date === dayMonthDate);
  }, [selectedDate, occasions]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-inner border h-full">
      <h3 className="font-headline text-xl mb-4 flex flex-wrap items-center gap-2">
        {selectedDate ? format(selectedDate, 'PPP') : 'Select a Date'}
        {selectedDate && isSameDay(selectedDate, today) && (
            <Badge className="bg-primary/20 text-primary text-[10px] border-none font-black uppercase tracking-widest px-2 h-5">Today</Badge>
        )}
      </h3>
      {occasionsOnDay.length > 0 ? (
        <ul className="space-y-3">
          {occasionsOnDay.map((o, i) => (
            <li key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-muted/50 hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3">
                <span className={cn("text-2xl p-2 rounded-xl bg-white shadow-sm border border-muted", categories[o.category].color.split(' ')[0])}>{categories[o.category].icon}</span>
                <div>
                  <p className="font-bold text-sm text-stone-800">{o.name}</p>
                  <Badge variant="outline" className={cn("text-[9px] font-black uppercase border-none px-0 tracking-widest", categories[o.category].color.split(' ')[1])}>
                    {categories[o.category].label}
                  </Badge>
                </div>
              </div>
              <Button size="sm" className="rounded-lg h-8 px-4 font-bold text-[10px] uppercase tracking-widest shadow-sm" onClick={() => onUseOccasion(o)}>Use</Button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 text-center space-y-4 opacity-40">
            <CalendarIcon className="h-10 w-10 text-stone-300" />
            <p className="text-sm text-stone-400 italic font-medium">No recorded occasions for this artisan date.</p>
        </div>
      )}
    </div>
  );
}

export function ImportantDaysCalendar() {
  const todayIST = useMemo(() => getIndianDate(), []);
  
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(todayIST));
  const [selectedDate, setSelectedDate] = useState<Date | null>(todayIST);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOccasions, setFilteredOccasions] = useState(importantOccasions);

  useEffect(() => {
    let result = importantOccasions;
    if (categoryFilter !== 'ALL') {
      result = result.filter(o => o.category === categoryFilter);
    }
    if (searchTerm) {
      result = result.filter(o => o.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    setFilteredOccasions(result);
  }, [categoryFilter, searchTerm]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleGoToToday = () => {
    setCurrentMonth(startOfMonth(todayIST));
    setSelectedDate(todayIST);
  };

  const handleUseOccasion = (occasion: Occasion) => {
    console.log('Using Occasion:', occasion);
    // Future integration placeholder
  };

  return (
    <div className="mt-8">
      <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
        <CardHeader className="p-10 bg-muted/30 border-b relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.4em] mb-2">
                    <Sparkles className="h-3 w-3" /> Cultural Intelligence
                </div>
                <CardTitle className="text-3xl font-headline flex items-center gap-3">
                    <CalendarIcon className="h-8 w-8 text-primary" />
                    Important Days & Festivals
                </CardTitle>
                <CardDescription className="text-stone-500 font-medium">A curated selection of cultural, national, and international events for artisanal greetings.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
                <div className="bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 flex flex-col items-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary leading-none mb-1">Today in IST</p>
                    <p className="text-sm font-bold text-stone-900 leading-none">{format(todayIST, 'd MMM, yyyy')}</p>
                </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8">
              {/* Calendar Controls */}
              <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 shadow-inner">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-white transition-all" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-5 w-5" /></Button>
                    <h2 className="text-lg font-bold w-44 text-center font-headline">{format(currentMonth, 'MMMM yyyy')}</h2>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-white transition-all" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-5 w-5" /></Button>
                  </div>
                  <Button variant="outline" className="rounded-xl h-12 px-6 border-2 border-stone-200 font-bold uppercase text-[10px] tracking-widest hover:border-primary/30 hover:text-primary transition-all hidden md:inline-flex" onClick={handleGoToToday}>
                    Today
                  </Button>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full md:w-56">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                     <Input placeholder="Search moments..." className="pl-10 h-12 rounded-xl border-stone-200 bg-stone-50/50" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-12 rounded-xl w-full md:w-56 border-stone-200 bg-stone-50/50 font-bold text-[10px] uppercase tracking-widest">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      <SelectItem value="ALL" className="text-[10px] font-bold uppercase">All Artisan Moments</SelectItem>
                      {Object.entries(categories).map(([key, { label, icon }]) => (
                        <SelectItem key={key} value={key} className="text-[10px] font-bold uppercase">{icon} {label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Calendar Grid */}
              <Calendar 
                currentMonth={currentMonth} 
                onDateSelect={handleDateSelect} 
                occasions={filteredOccasions} 
                selectedDate={selectedDate}
                today={todayIST}
              />
            </div>
            <div className="lg:col-span-4 h-full">
               {/* Occasion Details */}
              <OccasionDetails 
                selectedDate={selectedDate} 
                occasions={filteredOccasions} 
                onUseOccasion={handleUseOccasion}
                today={todayIST}
              />
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t flex flex-wrap justify-center gap-x-8 gap-y-4">
             {Object.entries(categories).map(([key, { label, icon, color }]) => (
                 <div key={key} className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", color.split(' ')[0])}></span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{label}</span>
                 </div>
             ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}