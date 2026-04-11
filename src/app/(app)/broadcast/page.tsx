'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { generateBroadcastAction } from './actions';
import { GenerateBroadcastMessageInputSchema, type GenerateBroadcastMessageOutput } from '@/ai/flows/generate-broadcast-message';
import { Input } from '@/components/ui/input';

export default function BroadcastPage() {
  const [generatedMessage, setGeneratedMessage] = useState<GenerateBroadcastMessageOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<import('zod').infer<typeof GenerateBroadcastMessageInputSchema>>({
    resolver: zodResolver(GenerateBroadcastMessageInputSchema),
    defaultValues: {
      broadcastType: 'General Announcement',
      targetAudience: 'All Customers',
      channel: 'Email',
      messageDetails: '',
    },
  });

  async function onSubmit(values: import('zod').infer<typeof GenerateBroadcastMessageInputSchema>) {
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
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
                        {['Product Update', 'Special Discount', 'General Announcement', 'Event Invitation'].map(type => (
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
                    <FormLabel>Message Details</FormLabel>
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
        <div className="lg:col-span-2">
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
    </>
  );
}
