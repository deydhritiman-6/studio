'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createMarketingCopyAction } from './actions';
import type { GenerateMarketingCopyOutput } from '@/ai/flows/generate-marketing-copy';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  customerSegment: z.enum(['VIP', 'Regular', 'Corporate', 'Wholesale']),
  campaignType: z.enum([
    'Birthday Greeting',
    'Anniversary Greeting',
    'Festival Campaign',
    'Product Launch',
    'VIP Offer',
    'Re-engagement',
  ]),
  channel: z.enum(['Email', 'WhatsApp']),
  customerName: z.string().optional(),
  productName: z.string().optional(),
  discountCode: z.string().optional(),
  occasionDetails: z.string().optional(),
});

export default function MarketingPage() {
  const [generatedCopy, setGeneratedCopy] = useState<GenerateMarketingCopyOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerSegment: 'VIP',
      campaignType: 'Product Launch',
      channel: 'Email',
      customerName: '',
      productName: '',
      discountCode: '',
      occasionDetails: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setGeneratedCopy(null);
    const result = await createMarketingCopyAction(values);
    setIsLoading(false);

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else {
      setGeneratedCopy(result);
    }
  }

  return (
    <>
      <PageHeader title="AI Marketing Assistant" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Generate Copy</CardTitle>
            <CardDescription>Fill in the details to generate personalized marketing copy.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="campaignType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a campaign type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[
                            'Birthday Greeting',
                            'Anniversary Greeting',
                            'Festival Campaign',
                            'Product Launch',
                            'VIP Offer',
                            'Re-engagement',
                          ].map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerSegment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Segment</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer segment" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {['VIP', 'Regular', 'Corporate', 'Wholesale'].map((segment) => (
                            <SelectItem key={segment} value={segment}>{segment}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="channel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Channel</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a channel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {['Email', 'WhatsApp'].map((channel) => (
                            <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Priya Kumar" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Velvet Noir 85%" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="occasionDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occasion Details (Optional)</FormLabel>
                       <FormControl>
                        <Textarea placeholder="e.g., For the Diwali festival" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Copy
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Generated Copy</CardTitle>
              <CardDescription>The AI-generated marketing copy will appear here.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              )}
              {generatedCopy && (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {generatedCopy.marketingCopy}
                </div>
              )}
               {!isLoading && !generatedCopy && (
                 <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-border text-center p-8 min-h-[300px]">
                    <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold font-headline">Your Creative Partner</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm">
                        Select your campaign details and let our AI craft the perfect message to engage your customers.
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
