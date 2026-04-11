
'use client';

import { useState } from 'react';
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
import { Loader2, Send, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { generateBroadcastAction, generateFestivalMessageAction } from './actions';
import { type GenerateBroadcastMessageOutput } from '@/ai/flows/generate-broadcast-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { festivals as festivalData } from '@/lib/indian-festivals.json';
import { format, parseISO } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type Festival = {
  date: string;
  name: string;
  type: string;
};

const formSchema = z.object({
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


const festivalMap: Map<string, Festival> = new Map(
  festivalData.map(f => [format(parseISO(f.date), 'yyyy-MM-dd'), f])
);

function DayContentWithTooltip({ date }: { date: Date }) {
  const formattedDate = format(date, 'yyyy-MM-dd');
  const festival = festivalMap.get(formattedDate);

  if (festival) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
            <span>{format(date, 'd')}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{festival.name}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  return <>{format(date, 'd')}</>;
}


export default function BroadcastPage() {
  const [generatedMessage, setGeneratedMessage] = useState<GenerateBroadcastMessageOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingForFestival, setIsGeneratingForFestival] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(new Date());
  const [scheduleTime, setScheduleTime] = useState<string>(() => new Date().toTimeString().slice(0, 5));

  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      broadcastType: 'General Announcement',
      targetAudience: 'All Customers',
      channel: 'Email',
      messageDetails: '',
    },
  });

  const nationalHolidays = festivalData.filter(f => f.type === 'National Holiday').map(f => parseISO(f.date));
  const hinduFestivals = festivalData.filter(f => f.type === 'Hindu Festival').map(f => parseISO(f.date));
  const muslimFestivals = festivalData.filter(f => f.type === 'Muslim Festival').map(f => parseISO(f.date));
  const sikhFestivals = festivalData.filter(f => f.type === 'Sikh Festival').map(f => parseISO(f.date));
  const christianFestivals = festivalData.filter(f => f.type === 'Christian Festival').map(f => parseISO(f.date));

  async function handleDateSelect(selectedDate: Date | undefined) {
    setDate(selectedDate);
    if (!selectedDate) return;

    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const festival = festivalMap.get(formattedDate);
    const broadcastType = form.getValues('broadcastType');
    
    if (festival) {
        if (broadcastType === 'Festival Greeting') {
            setIsGeneratingForFestival(true);
            const result = await generateFestivalMessageAction({ festivalName: festival.name });
            setIsGeneratingForFestival(false);

            if ('error' in result) {
                toast({ variant: 'destructive', title: 'AI Error', description: result.error });
            } else {
                form.setValue('messageDetails', result.greeting);
                toast({ title: 'AI Suggestion', description: `Message generated for ${festival.name}!` });
            }
        } else {
            toast({
                title: 'Set Broadcast Type',
                description: `To auto-generate a message for ${festival.name}, please select "Festival Greeting" as the broadcast type first.`,
            });
        }
    }
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
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
    if (!scheduleDate) {
      toast({ variant: 'destructive', title: 'No date selected', description: 'Please select a date to schedule the broadcast.' });
      return;
    }
    toast({
      title: 'Broadcast Scheduled',
      description: `Your message is scheduled to be sent on ${format(scheduleDate, 'PPP')} at ${scheduleTime}.`,
    });
  }

  function handleSendNow() {
     if (!generatedMessage) {
      toast({ variant: 'destructive', title: 'No message to send', description: 'Please generate a message first.' });
      return;
    }
     toast({ title: 'Broadcast Sent', description: 'Your message has been sent successfully.' });
  }
  
  const channel = form.watch('channel');

  return (
    <>
      <PageHeader title="Broadcast System" />
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
                Send your broadcast immediately or schedule it for a future date and time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Schedule Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !scheduleDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduleDate ? format(scheduleDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduleDate}
                      onSelect={setScheduleDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="schedule-time">Schedule Time</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" className="w-full" onClick={handleSendNow} disabled={!generatedMessage || isLoading}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Now
                </Button>
                <Button className="w-full" onClick={handleSchedule} disabled={!generatedMessage || isLoading}>
                  <Clock className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
       <Card className="mt-8">
          <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <CalendarIcon className="h-8 w-8 text-primary" />
                    <CardTitle className="text-2xl font-bold">
                        {new Date().getFullYear()} Annual Multi-Faith Planner
                    </CardTitle>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-chart-2"></div>
                        <span>Hindu</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-chart-3"></div>
                        <span>Muslim</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-chart-5"></div>
                        <span>Christian</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-chart-4"></div>
                        <span>Sikh</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-chart-1"></div>
                        <span>National</span>
                    </div>
                </div>
              </div>
          </CardHeader>
          <CardContent className="p-4 bg-muted/50">
                <TooltipProvider>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateSelect}
                      className="p-0"
                      numberOfMonths={12}
                      formatters={{ 
                        formatCaption: (month, options) => format(month, 'LLLL yyyy', { locale: options?.locale }).toUpperCase(),
                        formatDay: (date) => <DayContentWithTooltip date={date} />
                      }}
                      classNames={{
                          months: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
                          month: "space-y-4 rounded-lg bg-card p-4 shadow-sm",
                          caption: "flex justify-center text-center relative items-center mb-2",
                          caption_label: "text-sm font-medium uppercase tracking-wider text-muted-foreground",
                          nav_button: "hidden",
                          head_row: "flex",
                          head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] uppercase",
                          row: "flex w-full mt-2",
                          cell: "w-full text-center text-sm p-0 relative focus-within:relative focus-within:z-20 aspect-square",
                          day: "h-full w-full p-0 font-normal aria-selected:opacity-100 flex items-center justify-center",
                          day_selected: "bg-primary text-primary-foreground rounded-full hover:bg-primary/90 focus:bg-primary focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground rounded-full",
                          day_outside: "text-muted-foreground opacity-50",
                          day_disabled: "text-muted-foreground opacity-50",
                          day_hidden: "invisible",
                          nationalHoliday: 'relative after:content-[""] after:block after:h-1.5 after:w-1.5 after:rounded-full after:bg-chart-1 after:absolute after:bottom-1.5 after:left-1/2 after:-translate-x-1/2',
                          hinduFestival: 'relative after:content-[""] after:block after:h-1.5 after:w-1.5 after:rounded-full after:bg-chart-2 after:absolute after:bottom-1.5 after:left-1/2 after:-translate-x-1/2',
                          muslimFestival: 'relative after:content-[""] after:block after:h-1.5 after:w-1.5 after:rounded-full after:bg-chart-3 after:absolute after:bottom-1.5 after:left-1/2 after:-translate-x-1/2',
                          sikhFestival: 'relative after:content-[""] after:block after:h-1.5 after:w-1.5 after:rounded-full after:bg-chart-4 after:absolute after:bottom-1.5 after:left-1/2 after:-translate-x-1/2',
                          christianFestival: 'relative after:content-[""] after:block after:h-1.5 after:w-1.5 after:rounded-full after:bg-chart-5 after:absolute after:bottom-1.5 after:left-1/2 after:-translate-x-1/2',
                      }}
                      modifiers={{
                        nationalHoliday: nationalHolidays,
                        hinduFestival: hinduFestivals,
                        muslimFestival: muslimFestivals,
                        sikhFestival: sikhFestivals,
                        christianFestival: christianFestivals,
                      }}
                      modifiersClassNames={{
                        nationalHoliday: 'nationalHoliday',
                        hinduFestival: 'hinduFestival',
                        muslimFestival: 'muslimFestival',
                        sikhFestival: 'sikhFestival',
                        christianFestival: 'christianFestival',
                      }}
                     />
                 </TooltipProvider>
          </CardContent>
        </Card>
    </>
  );
}
