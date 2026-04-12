'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useTheme } from '@/components/theme-provider';

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Mock user data for now
const defaultValues: Partial<ProfileFormValues> = {
  name: 'Admin User',
  email: 'admin@roseberry.com',
};

export default function SettingsPage() {
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  function onSubmit(data: ProfileFormValues) {
    toast({
      title: 'Profile updated!',
      description: 'Your profile information has been successfully updated.',
    });
  }

  return (
    <>
      <PageHeader title="Settings" />
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your account settings and email preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Your email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Update Profile</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application. Select a theme.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <RadioGroup
                value={theme}
                onValueChange={(value: any) => setTheme(value)}
                className="grid max-w-md grid-cols-2 gap-8 pt-2"
              >
                <div>
                  <Label className="[&:has([data-state=checked])>div]:border-primary">
                    <RadioGroupItem value="light" className="sr-only" />
                    <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                      <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                        <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                          <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                        </div>
                      </div>
                    </div>
                    <span className="block w-full p-2 text-center font-normal">
                      Light
                    </span>
                  </Label>
                </div>
                <div>
                  <Label className="[&:has([data-state=checked])>div]:border-primary">
                    <RadioGroupItem value="dark" className="sr-only" />
                    <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:border-accent">
                      <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                        <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                          <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-slate-400" />
                          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-slate-400" />
                          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                        </div>
                      </div>
                    </div>
                    <span className="block w-full p-2 text-center font-normal">
                      Dark
                    </span>
                  </Label>
                </div>
                <div>
                  <Label className="[&:has([data-state=checked])>div]:border-primary">
                    <RadioGroupItem value="rose" className="sr-only" />
                    <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:border-accent">
                      <div className="space-y-2 rounded-sm bg-[hsl(350,25%,12%)] p-2">
                        <div className="space-y-2 rounded-md bg-[hsl(350,25%,17%)] p-2 shadow-sm">
                          <div className="h-2 w-[80px] rounded-lg bg-[hsl(345,80%,65%)]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[hsl(345,80%,65%)]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-[hsl(350,25%,17%)] p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-[hsl(345,80%,65%)]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[hsl(345,80%,65%)]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-[hsl(350,25%,17%)] p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-[hsl(345,80%,65%)]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[hsl(345,80%,65%)]" />
                        </div>
                      </div>
                    </div>
                    <span className="block w-full p-2 text-center font-normal">
                      Rose
                    </span>
                  </Label>
                </div>
                <div>
                  <Label className="[&:has([data-state=checked])>div]:border-primary">
                    <RadioGroupItem value="ocean" className="sr-only" />
                    <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:border-accent">
                      <div className="space-y-2 rounded-sm bg-[hsl(210,25%,10%)] p-2">
                        <div className="space-y-2 rounded-md bg-[hsl(210,25%,14%)] p-2 shadow-sm">
                          <div className="h-2 w-[80px] rounded-lg bg-[hsl(190,80%,55%)]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[hsl(190,80%,55%)]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-[hsl(210,25%,14%)] p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-[hsl(190,80%,55%)]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[hsl(190,80%,55%)]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-[hsl(210,25%,14%)] p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-[hsl(190,80%,55%)]" />
                          <div className="h-2 w-[100px] rounded-lg bg-[hsl(190,80%,55%)]" />
                        </div>
                      </div>
                    </div>
                    <span className="block w-full p-2 text-center font-normal">
                      Ocean
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
