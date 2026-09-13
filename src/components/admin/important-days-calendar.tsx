'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Search, Calendar as CalendarIcon } from 'lucide-react';
import { enUS } from 'date-fns/locale';
import { getMonth, getYear, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, isSameMonth, isToday, addMonths, subMonths, isSameDay } from 'date-fns';

// --- DATA & TYPES ---
const categories = {
  HINDU: { label: 'Hindu', icon: '🕉️', color: 'bg-orange-100 text-orange-800' },
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
function Calendar({ currentMonth, onDateSelect, occasions, selectedDate }: {
  currentMonth: Date;
  onDateSelect: (date: Date) => void;
  occasions: Occasion[];
  selectedDate: Date | null;
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

        return (
          <div 
            key={i}
            onClick={() => onDateSelect(day)}
            className={`border-r border-b p-2 min-h-[120px] relative transition-colors cursor-pointer 
              ${!isSameMonth(day, monthStart) ? 'bg-muted/30' : 'bg-white hover:bg-primary/5'}
              ${isToday(day) ? 'bg-accent/10 border-accent' : ''}
              ${selectedDate && isSameDay(day, selectedDate) ? 'ring-2 ring-primary ring-inset' : ''}
            `}
          >
            <span className={`text-sm font-bold ${!isSameMonth(day, monthStart) ? 'text-muted-foreground' : 'text-stone-800'}`}>
              {format(day, 'd')}
            </span>
            <div className="mt-1 space-y-1">
              {occasionsOnDay.slice(0, 2).map((o, idx) => (
                <div key={idx} className={`text-[10px] p-1 rounded-md ${categories[o.category].color} truncate`}>
                  {categories[o.category].icon} {o.name}
                </div>
              ))}
              {occasionsOnDay.length > 2 && (
                <div className="text-[10px] font-bold text-primary">+ {occasionsOnDay.length - 2} more</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OccasionDetails({ selectedDate, occasions, onUseOccasion }: { 
  selectedDate: Date | null;
  occasions: Occasion[];
  onUseOccasion: (occasion: Occasion) => void;
}) {
  const occasionsOnDay = useMemo(() => {
    if (!selectedDate) return [];
    const dayMonthDate = format(selectedDate, 'MM-dd');
    return occasions.filter(o => o.date === dayMonthDate);
  }, [selectedDate, occasions]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-inner">
      <h3 className="font-headline text-xl mb-4">
        {selectedDate ? format(selectedDate, 'PPP') : 'Select a Date'}
      </h3>
      {occasionsOnDay.length > 0 ? (
        <ul className="space-y-3">
          {occasionsOnDay.map((o, i) => (
            <li key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <span className={`text-xl ${categories[o.category].color} p-1 rounded-md`}>{categories[o.category].icon}</span>
                <div>
                  <p className="font-bold text-sm">{o.name}</p>
                  <Badge variant="outline" className={`text-[9px] ${categories[o.category].color}`}>{categories[o.category].label}</Badge>
                </div>
              </div>
              <Button size="sm" className="rounded-lg" onClick={() => onUseOccasion(o)}>Use</Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground italic">No occasions on this date.</p>
      )}
    </div>
  );
}

export function ImportantDaysCalendar() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(getIndianDate()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(getIndianDate());
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

  const handleUseOccasion = (occasion: Occasion) => {
    // In a real app, this would integrate with the parent form.
    // For now, we'll log it.
    console.log('Using Occasion:', occasion);
    alert(`Selected: ${occasion.name}`);
  };

  return (
    <div className="mt-8">
      <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden">
        <CardHeader className="p-10 bg-muted/30">
          <CardTitle className="text-3xl font-headline flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-primary" />
            Important Days & Festivals Calendar
          </CardTitle>
          <CardDescription>A comprehensive calendar for cultural, national, and international events.</CardDescription>
        </CardHeader>
        <CardContent className="p-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Calendar Controls */}
              <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="rounded-lg" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft/></Button>
                  <h2 className="text-xl font-bold w-48 text-center">{format(currentMonth, 'MMMM yyyy')}</h2>
                  <Button variant="outline" size="icon" className="rounded-lg" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight/></Button>
                  <Button variant="outline" className="rounded-lg hidden md:inline-flex" onClick={() => setCurrentMonth(startOfMonth(getIndianDate()))}>Today</Button>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative w-full md:w-48">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input placeholder="Search..." className="pl-10 h-10 rounded-lg" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-10 rounded-lg w-48">
                      <SelectValue placeholder="Filter by Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Categories</SelectItem>
                      {Object.entries(categories).map(([key, { label, icon }]) => (
                        <SelectItem key={key} value={key}>{icon} {label}</SelectItem>
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
              />
            </div>
            <div className="lg:col-span-1">
               {/* Occasion Details */}
              <OccasionDetails 
                selectedDate={selectedDate} 
                occasions={filteredOccasions} 
                onUseOccasion={handleUseOccasion}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
