'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Flame, Moon, Flag, Star } from 'lucide-react';
import { generateBroadcastAction, generateFestivalMessageAction } from './actions';
import { type GenerateBroadcastMessageOutput } from '@/ai/flows/generate-broadcast-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import festivalJsonData from '@/lib/indian-festivals.json';
import { format, parseISO, startOfMonth, getDaysInMonth, getDay, addMonths, subMonths, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from '@/components/ui/scroll-area';


type Festival = {
  date: string;
  name: string;
  type: string;
  category: string;
  description: string;
};

const festivalData: Festival[] = festivalJsonData.festivals;


const broadcastFormSchema = z.object({
  broadcastType: z
    .enum(['Product Update', 'Special Discount', 'General Announcement', 'Event Invitation', 'Festival Greeting']),
  targetAudience: z
    .enum(['All Customers', 'VIP Customers', 'Wholesale Partners', 'New Subscribers']),
  channel: z
    .enum(['Email', 'SMS', 'Social Media Post']),
  messageDetails: z
    .string()
    .min(1, 'Message details are required.'),
});


// --- Custom Icons ---

const SikhIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256" {...props} className={cn("h-5 w-5", props.className)}>
    <path fill="currentColor" d="M224 56a8 8 0 0 1-8 8h-46.9a88.1 88.1 0 0 1-138.2 0H8a8 8 0 0 1 0-16h208a8 8 0 0 1 8 8M71.42 80h113.16a72.11 72.11 0 0 0-113.16 0M120 120.47V216a8 8 0 0 0 16 0V120.47a40 40 0 1 0-16 0m0 64a24 24 0 1 1 24-24a24 24 0 0 1-24 24"/>
  </svg>
);

const BuddhistJainIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props} className={cn("h-5 w-5", props.className)}>
    <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m0 18a8 8 0 1 1 8-8a8 8 0 0 1-8 8m4-7h-3v-3a1 1 0 0 0-2 0v3H8a1 1 0 0 0 0 2h3v3a1 1 0 0 0 2 0v-3h3a1 1 0 0 0 0-2"/>
  </svg>
);

const ChristianIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props} className={cn("h-5 w-5", props.className)}>
        <path fill="currentColor" d="M10.5 10.5V4.5a1.5 1.5 0 0 1 3 0v6h6a1.5 1.5 0 0 1 0 3h-6v6a1.5 1.5 0 0 1-3 0v-6h-6a1.5 1.5 0 0 1 0-3h6Z" />
    </svg>
)


const categoryIcons: { [key: string]: React.ReactNode } = {
    'Hindu Festival': <Flame className="text-orange-500" />,
    'Muslim Festival': <Moon className="text-green-500" />,
    'Christian Festival': <ChristianIcon className="text-blue-500" />,
    'Sikh Festival': <SikhIcon className="text-yellow-500" />,
    'Buddhist Festival': <BuddhistJainIcon className="text-purple-500" />,
    'Jain Festival': <BuddhistJainIcon className="text-purple-500" />,
    'National Holiday': <Flag className="text-red-500" />,
    'Observance': <Star className="text-sky-500" />,
};


export default function BroadcastPage() {
  const [generatedMessage, setGeneratedMessage] = useState<GenerateBroadcastMessageOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingForFestival, setIsGeneratingForFestival] = useState(false);
  
  const [displayDate, setDisplayDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [viewingFestival, setViewingFestival] = useState<Festival | null>(null);

  const { toast } = useToast();

  const form = useForm<z.infer<typeof broadcastFormSchema>>({
    resolver: zodResolver(broadcastFormSchema),
    defaultValues: {
      broadcastType: 'General Announcement',
      targetAudience: 'All Customers',
      channel: 'Email',
      messageDetails: '',
    },
  });

  const broadcastType = form.watch('broadcastType');
  const channel = form.watch('channel');

 const festivalsByDate = useMemo(() => {
    const map = new Map<string, Festival[]>();
    festivalData.forEach(f => {
      const dateKey = format(parseISO(f.date), 'MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(f);
    });
    return map;
  }, []);

  const { monthlyFestivals, monthlyImportantDays } = useMemo(() => {
    const currentYear = displayDate.getFullYear();
    const currentMonth = displayDate.getMonth();
    
    const festivals = festivalData.filter(f => {
        const festivalDate = parseISO(f.date);
        return festivalDate.getFullYear() === currentYear && festivalDate.getMonth() === currentMonth;
    });
    
    return {
        monthlyFestivals: festivals.filter(f => f.type.includes('Festival')),
        monthlyImportantDays: festivals.filter(f => !f.type.includes('Festival')),
    };
  }, [displayDate]);


  async function handleDateClick(day: number) {
    const newSelectedDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
    setSelectedDate(newSelectedDate);
    
    const dateKey = format(newSelectedDate, 'MM-dd');
    const festivalsOnDate = festivalsByDate.get(dateKey);

    if (festivalsOnDate) {
        setViewingFestival(festivalsOnDate[0]);
    }

    if (broadcastType === 'Festival Greeting' && festivalsOnDate) {
        generateGreetingForFestival(festivalsOnDate[0]);
    }
  }
  
  async function generateGreetingForFestival(festival: Festival) {
    if (!festival) return;
    
    setIsGeneratingForFestival(true);
    const result = await generateFestivalMessageAction({ festivalName: festival.name });
    setIsGeneratingForFestival(false);

    if ('error' in result) {
      toast({ variant: 'destructive', title: 'AI Error', description: result.error });
    } else {
      form.setValue('messageDetails', result.greeting);
      toast({ title: 'AI Suggestion', description: `Message for ${festival.name} has been generated!` });
      setViewingFestival(null); // Close the dialog
    }
  }


  async function onSubmit(values: z.infer<typeof broadcastFormSchema>) {
    setIsLoading(true);
    setGeneratedMessage(null);
    const result = await generateBroadcastAction(values);
    setIsLoading(false);

    if ('error' in result) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      setGeneratedMessage(result);
    }
  }

  function handleSchedule() {
    if (!generatedMessage) {
      toast({ variant: 'destructive', title: 'No message to schedule', description: 'Please generate a message first.' });
      return;
    }
    toast({
      title: 'Broadcast Scheduled',
      description: `Your message is scheduled to be sent on ${format(selectedDate, 'PPP')}.`,
    });
  }

  function handleSendNow() {
     if (!generatedMessage) {
      toast({ variant: 'destructive', title: 'No message to send', description: 'Please generate a message first.' });
      return;
    }
     toast({ title: 'Broadcast Sent', description: 'Your message has been sent successfully.' });
  }

  // --- Calendar Rendering Logic ---
  const renderCalendar = () => {
    const monthStart = startOfMonth(displayDate);
    const daysInMonth = getDaysInMonth(displayDate);
    const startDayOfWeek = getDay(monthStart);

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="border-r border-b border-amber-200"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
        const dateKey = format(date, 'MM-dd');
        const festivals = festivalsByDate.get(dateKey);
        const isSun = getDay(date) === 0;

        const dayCell = (
             <div 
                onClick={() => handleDateClick(day)}
                className={cn(
                    "p-2 text-center border-r border-b border-amber-200 relative cursor-pointer hover:bg-amber-100 h-24 flex flex-col items-center justify-start",
                    isSun && "text-red-600",
                    isToday(date) && "bg-rose-200",
                    isSameDay(date, selectedDate) && "bg-amber-300",
                )}
            >
                <span className="text-lg font-bold">{day}</span>
                <div className="absolute bottom-1 left-1 flex gap-1">
                    {festivals?.map((f, i) => {
                      const iconElement = categoryIcons[f.type] as React.ReactElement;
                      return (
                        <div key={`${f.name}-${i}`}>
                            {React.cloneElement(iconElement, { className: cn(iconElement.props.className, 'h-5 w-5 text-stone-800')})}
                        </div>
                      )
                    })}
                </div>
            </div>
        );

        if (festivals && festivals.length > 0) {
            days.push(
                <Tooltip key={day} delayDuration={100}>
                    <TooltipTrigger asChild>
                        {dayCell}
                    </TooltipTrigger>
                    <TooltipContent>
                        <ul className="space-y-1 p-2">
                           {festivals.map(f => {
                                const iconElement = categoryIcons[f.type] as React.ReactElement;
                                return (
                                   <li key={f.name} className="flex items-center gap-2">
                                         {React.cloneElement(iconElement, { className: cn(iconElement.props.className, 'h-5 w-5') })}
                                         <span>{f.name}</span>
                                   </li>
                                )
                            })}
                        </ul>
                    </TooltipContent>
                </Tooltip>
            );
        } else {
            days.push(React.cloneElement(dayCell, { key: day }));
        }
    }
    while (days.length % 7 !== 0) {
        days.push(<div key={`empty-end-${days.length}`} className="border-r border-b border-amber-200"></div>);
    }
    if (days.length < 42) {
       const remaining = 42 - days.length;
       for (let i = 0; i < remaining; i++) {
        days.push(<div key={`empty-extra-${i}`} className="border-r border-b border-amber-200"></div>);
       }
    }


    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    return (
        <Card className="mt-8 bg-amber-50/50 border-amber-200 shadow-lg">
            <CardContent className="p-4 md:p-6">
                <div className="flex flex-col gap-6">
                    {/* Calendar */}
                    <div className="border border-amber-200 rounded-lg p-3 bg-white/50">
                       <div className="flex items-center justify-between mb-4">
                           <Button variant="ghost" size="icon" onClick={() => setDisplayDate(subMonths(displayDate, 1))} className="hover:bg-amber-100">
                               <ChevronLeft className="h-10 w-10 text-amber-500" />
                           </Button>
                           <h2 className="text-3xl font-bold font-headline text-red-700 uppercase tracking-widest">
                               {format(displayDate, 'MMMM yyyy')}
                           </h2>
                           <Button variant="ghost" size="icon" onClick={() => setDisplayDate(addMonths(displayDate, 1))} className="hover:bg-amber-100">
                               <ChevronRight className="h-10 w-10 text-amber-500" />
                           </Button>
                       </div>
                       <div className="grid grid-cols-7 text-center font-bold text-amber-800">
                           {weekdays.map(day => <div key={day} className="py-2 border-b-2 border-r border-amber-200">{day}</div>)}
                       </div>
                       <div className="grid grid-cols-7">
                           {days}
                       </div>
                    </div>
                    {/* Festivals List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="bg-red-700 text-white p-2 rounded-md text-center shadow-md">
                               <h3 className="font-bold font-headline text-xl">Festive Days</h3>
                            </div>
                            <ScrollArea className="h-48 rounded-md border p-4">
                               {monthlyFestivals.length > 0 ? (
                                   <ul className="space-y-2">
                                       {monthlyFestivals.map(f => {
                                           const iconElement = categoryIcons[f.type] as React.ReactElement;
                                           return (
                                              <li key={f.name} className="flex items-center gap-3 text-sm">
                                                  {React.cloneElement(iconElement, { className: cn(iconElement.props.className, 'h-5 w-5') })}
                                                  <span>{format(parseISO(f.date), 'd MMM')}: {f.name} ({f.type.replace(' Festival', '')})</span>
                                              </li>
                                           )
                                       })}
                                   </ul>
                               ) : (
                                   <p className="text-sm text-muted-foreground text-center flex items-center justify-center h-full">No festivals this month.</p>
                               )}
                           </ScrollArea>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-green-700 text-white p-2 rounded-md text-center shadow-md">
                               <h3 className="font-bold font-headline text-xl">Important Days</h3>
                            </div>
                             <ScrollArea className="h-48 rounded-md border p-4">
                               {monthlyImportantDays.length > 0 ? (
                                   <ul className="space-y-2">
                                       {monthlyImportantDays.map(f => {
                                           const iconElement = categoryIcons[f.type] as React.ReactElement;
                                           return (
                                             <li key={f.name} className="flex items-center gap-3 text-sm">
                                                 {React.cloneElement(iconElement, { className: cn(iconElement.props.className, 'h-5 w-5') })}
                                                 <span>{format(parseISO(f.date), 'd MMM')}: {f.name}</span>
                                             </li>
                                           )
                                       })}
                                   </ul>
                               ) : (
                                   <p className="text-sm text-muted-foreground text-center flex items-center justify-center h-full">No important days this month.</p>
                               )}
                           </ScrollArea>
                        </div>
                    </div>
                </div>
            </CardContent>
            <div className="border-t-2 border-amber-200 bg-amber-100/50 p-3 rounded-b-lg">
                 <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-bold text-amber-950/80">
                    {Object.entries(categoryIcons).map(([type, icon]) => {
                        const iconElement = icon as React.ReactElement;
                        return (
                            <div key={type} className="flex items-center gap-2">
                                {React.cloneElement(iconElement, {className: cn(iconElement.props.className, 'h-5 w-5')})}
                                <span>{type.replace(' Festival', '').replace(' Holiday', '')}</span>
                            </div>
                        )
                    })}
                 </div>
            </div>
        </Card>
    );
  }


  return (
    <TooltipProvider>
      <PageHeader title="Broadcast System" />
       <Dialog open={!!viewingFestival} onOpenChange={(open) => !open && setViewingFestival(null)}>
        {viewingFestival && (
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center gap-3">
                 {(() => {
                    const iconElement = categoryIcons[viewingFestival.type] as React.ReactElement;
                    return React.cloneElement(iconElement, { className: cn(iconElement.props.className, 'h-8 w-8') });
                 })()}
                <DialogTitle className="text-2xl font-headline">{viewingFestival.name}</DialogTitle>
              </div>
              <DialogDescription className="pt-2">{viewingFestival.type}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">{viewingFestival.description}</p>
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={() => setViewingFestival(null)}>Close</Button>
               <Button onClick={() => generateGreetingForFestival(viewingFestival)} disabled={isGeneratingForFestival}>
                 {isGeneratingForFestival ? <Loader2 className="animate-spin" /> : 'Generate Greeting'}
               </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Create Broadcast</CardTitle>
                <CardDescription>Craft and send announcements to your customers.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="broadcastType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Broadcast Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {['Product Update', 'Special Discount', 'General Announcement', 'Event Invitation', 'Festival Greeting'].map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="targetAudience" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Audience</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {['All Customers', 'VIP Customers', 'Wholesale Partners', 'New Subscribers'].map(audience => (
                              <SelectItem key={audience} value={audience}>{audience}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="channel" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Channel</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {['Email', 'SMS', 'Social Media Post'].map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="messageDetails" render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                            <FormLabel>Message Details</FormLabel>
                            {isGeneratingForFestival && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        </div>
                        <FormControl><Textarea placeholder="e.g., Announcing our new Monsoon Collection, available from July 1st. 15% off for the first week." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
                      Generate Message
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Generated Message</CardTitle>
              <CardDescription>The AI-generated message will appear here. Review and copy it for sending.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && (
                 <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-8 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full mt-4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                </div>
              )}
              {generatedMessage && (
                <div className="space-y-4">
                  {channel === 'Email' && generatedMessage.subjectLine && (
                    <div className="space-y-1">
                      <Label htmlFor='subject'>Subject Line</Label>
                      <Input id="subject" readOnly value={generatedMessage.subjectLine} />
                    </div>
                  )}
                   <div className="space-y-1">
                      <Label htmlFor='message-body'>Message Body</Label>
                      <Textarea id="message-body" readOnly value={generatedMessage.messageBody} className="h-64 whitespace-pre-wrap" />
                    </div>
                </div>
              )}
               {!isLoading && !generatedMessage && (
                 <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-center p-8 min-h-[300px]">
                    <Send className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold font-headline">Reach Your Audience</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm">
                       Fill in the details to generate a professional broadcast message for your customers.
                    </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule & Send</CardTitle>
              <CardDescription>
                Send your broadcast immediately or schedule it for a future date by selecting a date on the calendar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Button variant="outline" className="w-full" onClick={handleSendNow} disabled={!generatedMessage || isLoading}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Now
                </Button>
                <Button className="w-full" onClick={handleSchedule} disabled={!generatedMessage || isLoading}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Schedule for {format(selectedDate, 'd MMM')}
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
      {renderCalendar()}
    </TooltipProvider>
  );
}
