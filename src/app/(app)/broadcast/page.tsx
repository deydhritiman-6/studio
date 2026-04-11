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
import { Loader2, Send } from 'lucide-react';
import { generateBroadcastAction, generateFestivalMessageAction } from './actions';
import { type GenerateBroadcastMessageOutput } from '@/ai/flows/generate-broadcast-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { festivals as festivalData } from '@/lib/indian-festivals.json';
import { format, parseISO } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        <TooltipTrigger>{format(date, 'd')}</TooltipTrigger>
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
                      Generate Broadcast
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-full">
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
                 <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-border text-center p-8 min-h-[300px]">
                    <Send className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold font-headline">Reach Your Audience</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm">
                       Fill in the details to generate a professional broadcast message for your customers.
                    </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
       <Card className="mt-8">
          <CardHeader>
              <CardTitle>Festival Calendar & Holiday List</CardTitle>
              <CardDescription>When "Festival Greeting" is selected, click a highlighted date to generate a message.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 xl:grid-cols-3 gap-8 p-4">
               <div className="xl:col-span-2">
                 <TooltipProvider>
                     <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateSelect}
                      className="p-0"
                      numberOfMonths={12}
                      classNames={{
                          months: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10",
                          month: "space-y-3",
                          caption_label: "font-headline text-base",
                          head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                          row: "flex w-full mt-2",
                          cell: "h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                          nationalHoliday: 'relative after:content-[""] after:block after:h-1.5 after:w-1.5 after:rounded-full after:bg-chart-1 after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2',
                          hinduFestival: 'relative after:content-[""] after:block after:h-1.5 after:w-1.5 after:rounded-full after:bg-chart-2 after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2',
                          muslimFestival: 'relative after:content-[""] after:block after:h-1.5 after:w-1.5 after:rounded-full after:bg-chart-3 after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2',
                          sikhFestival: 'relative after:content-[""] after:block after:h-1.5 after:w-1.5 after:rounded-full after:bg-chart-4 after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2',
                          christianFestival: 'relative after:content-[""] after:block after:h-1.5 after:w-1.5 after:rounded-full after:bg-chart-5 after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2',
                      }}
                      formatters={{ formatDay: (date) => <DayContentWithTooltip date={date} /> }}
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
               </div>
               <div className="xl:col-span-1">
                 <h3 className="font-semibold mb-4 font-headline">Holidays & Observances</h3>
                 <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                        {festivalData.map((festival) => (
                           <div key={festival.name} className="flex items-start text-sm">
                                <p className="font-medium w-24 text-muted-foreground">{format(parseISO(festival.date), 'MMM dd')}</p>
                                <p className="">{festival.name}</p>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
               </div>
          </CardContent>
        </Card>
    </>
  );
}
