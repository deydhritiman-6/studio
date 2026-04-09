'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const markdownContent = `# Roseberry Ops: Developer Guide & Tutorial

Welcome to the developer guide for Roseberry Ops! This document provides a comprehensive overview of the application's architecture, technologies, and patterns. Use this guide to understand how the application works and how to effectively contribute to it.

## 1. Tech Stack

Roseberry Ops is built on a modern, robust, and AI-first technology stack:

- **Framework**: [Next.js 15](https://nextjs.org/) (using the App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Integration**: [Genkit](https://firebase.google.com/docs/genkit) (with Google's Gemini models)
- **State Management**: React Hooks & Server Actions
- **Schema & Validation**: [Zod](https://zod.dev/)

## 2. Project Structure

The project follows a feature-oriented structure that keeps related code organized and easy to navigate.

\'\'\'
/
├── src/
│   ├── app/
│   │   ├── (app)/                  # Main application group
│   │   │   ├── [feature]/          # Each feature page (e.g., dashboard, customers)
│   │   │   │   ├── page.tsx        # The main React component for the page
│   │   │   │   └── actions.ts      # Server Actions for this feature
│   │   │   ├── layout.tsx          # The main app layout with sidebar navigation
│   │   │   └── ...
│   │   ├── globals.css             # Global styles and Tailwind directives
│   │   └── layout.tsx              # Root layout for the entire app
│   │
│   ├── ai/
│   │   ├── flows/                  # Directory for all Genkit AI flows
│   │   │   └── [flow-name].ts      # A self-contained AI capability
│   │   ├── genkit.ts               # Main Genkit initialization and configuration
│   │   └── dev.ts                  # Genkit development server entry point
│   │
│   ├── components/
│   │   ├── ui/                     # Reusable UI components from ShadCN
│   │   └── *.tsx                   # Custom, app-specific components (e.g., PageHeader)
│   │
│   ├── hooks/
│   │   └── *.ts                    # Custom React hooks (e.g., use-toast)
│   │
│   ├── lib/
│   │   ├── data.ts                 # Mock data source for the application
│   │   ├── types.ts                # TypeScript type definitions for data models
│   │   └── utils.ts                # Utility functions (e.g., cn for classnames)
│
└── tailwind.config.ts              # Tailwind CSS configuration
\'\'\'

## 3. Core Architectural Concepts

### UI & Styling

-   The UI is built from components found in \`src/components/ui\`. These are high-quality primitives from ShadCN.
-   Styling is done with Tailwind CSS utility classes.
-   The application theme (colors, fonts, etc.) is defined using CSS variables in \`src/app/globals.css\`. To change the color scheme, you should modify the HSL values in the \`:root\` and \`.dark\` blocks.
-   Application fonts are configured in \`tailwind.config.ts\` and imported in the root layout (\`src/app/layout.tsx\`).

### Pages, Layouts, and Server Actions

-   The app uses the Next.js App Router. Pages are defined by \`page.tsx\` files.
-   The main navigation and structure are controlled by \`src/app/(app)/layout.tsx\`.
-   Client-side forms communicate with the server using **Server Actions**. These are \`async\` functions defined with the \`'use server';\` directive, typically in a co-located \`actions.ts\` file. This pattern simplifies the architecture by removing the need for traditional API routes.

### The AI System (Genkit)

This is the heart of the application's intelligent features.

-   **Initialization**: The core Genkit instance is configured in \`src/ai/genkit.ts\`. It's where plugins (like \`googleAI\`) are registered.
-   **AI Flows**: Each distinct AI capability is a "flow" located in \`src/ai/flows/\`. A flow is a server-side function that orchestrates calls to AI models.
-   **Schema-Driven I/O**: Each flow uses Zod to define a strict schema for its \`input\` and \`output\`. This provides type safety and is used by Genkit to ensure the AI model returns data in the correct JSON format.
-   **Prompts**: Prompts are defined using \`ai.definePrompt\`. They use Handlebars templating (\`{{{...}}}\`) to insert dynamic data from the flow's input.

## 4. Tutorial: Adding a New AI Feature

Let's walk through creating a new feature: an **AI Product Description Generator**.

### Step 1: Create the AI Flow

First, we'll define the AI's capability to write a product description.

1.  Create a new file: \`src/ai/flows/generate-product-description.ts\`.
2.  Add the following code. We'll define the input (product details) and output (the description), write the prompt, and create the flow.

    \'\'\'typescript
    'use server';
    /**
     * @fileOverview A Genkit flow for generating a product description.
     */

    import { ai } from '@/ai/genkit';
    import { z } from 'genkit';

    export const GenerateProductDescriptionInputSchema = z.object({
      productName: z.string().describe('The name of the chocolate product.'),
      flavorProfile: z.string().describe('The key flavor notes of the product (e.g., "dark, nutty, rich").'),
      ingredients: z.string().describe('A comma-separated list of key ingredients.'),
    });
    export type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;

    export const GenerateProductDescriptionOutputSchema = z.object({
      description: z.string().describe('The generated, marketing-ready product description.'),
    });
    export type GenerateProductDescriptionOutput = z.infer<typeof GenerateProductDescriptionOutputSchema>;

    export async function generateProductDescription(input: GenerateProductDescriptionInput): Promise<GenerateProductDescriptionOutput> {
      return generateProductDescriptionFlow(input);
    }

    const productDescriptionPrompt = ai.definePrompt({
      name: 'productDescriptionPrompt',
      input: { schema: GenerateProductDescriptionInputSchema },
      output: { schema: GenerateProductDescriptionOutputSchema },
      prompt: \`You are a world-class marketing copywriter for 'Roseberry Chocolate', an ultra-premium artisan chocolate brand.
      Your task is to write a compelling, elegant, and brief product description.

      Product Name: {{{productName}}}
      Flavor Profile: {{{flavorProfile}}}
      Key Ingredients: {{{ingredients}}}

      Generate a product description that is alluring and emphasizes luxury and quality.
      \`,
    });

    const generateProductDescriptionFlow = ai.defineFlow(
      {
        name: 'generateProductDescriptionFlow',
        inputSchema: GenerateProductDescriptionInputSchema,
        outputSchema: GenerateProductDescriptionOutputSchema,
      },
      async (input) => {
        const { output } = await productDescriptionPrompt(input);
        return output!;
      }
    );
    \'\'\'
3.  Register the new flow with the Genkit dev server by adding an import to \`src/ai/dev.ts\`:
    \'\'\'typescript
    // src/ai/dev.ts
    // ... existing imports
    import '@/ai/flows/generate-product-description.ts'; 
    \'\'\'

### Step 2: Create the UI and Server Action

Now, let's create the page where a user can interact with this new AI flow.

1.  Create a new folder: \`src/app/(app)/product-description\`.
2.  Inside it, create a new file \`actions.ts\` to expose your AI flow to the client.

    \'\'\'typescript
    // src/app/(app)/product-description/actions.ts
    'use server';

    import { generateProductDescription, type GenerateProductDescriptionInput, type GenerateProductDescriptionOutput } from '@/ai/flows/generate-product-description';

    export async function generateDescriptionAction(
      input: GenerateProductDescriptionInput
    ): Promise<GenerateProductDescriptionOutput | { error: string }> {
      try {
        return await generateProductDescription(input);
      } catch (error) {
        console.error('Error generating product description:', error);
        return { error: 'Failed to generate description. Please try again.' };
      }
    }
    \'\'\'
3.  Next, create the page component in \`src/app/(app)/product-description/page.tsx\`. This will contain the form.

    \'\'\'tsx
    // src/app/(app)/product-description/page.tsx
    'use client';

    import { useState } from 'react';
    import { useForm } from 'react-hook-form';
    import { zodResolver } from '@hookform/resolvers/zod';
    import { PageHeader } from '@/components/page-header';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
    import { Input } from '@/components/ui/input';
    import { Textarea } from '@/components/ui/textarea';
    import { useToast } from '@/hooks/use-toast';
    import { Loader2, Sparkles } from 'lucide-react';
    import { generateDescriptionAction } from './actions';
    import { GenerateProductDescriptionInputSchema, type GenerateProductDescriptionOutput } from '@/ai/flows/generate-product-description';

    export default function ProductDescriptionPage() {
      const [generatedDesc, setGeneratedDesc] = useState<GenerateProductDescriptionOutput | null>(null);
      const [isLoading, setIsLoading] = useState(false);
      const { toast } = useToast();

      const form = useForm<import('zod').infer<typeof GenerateProductDescriptionInputSchema>>({
        resolver: zodResolver(GenerateProductDescriptionInputSchema),
        defaultValues: {
          productName: '',
          flavorProfile: '',
          ingredients: '',
        },
      });

      async function onSubmit(values: import('zod').infer<typeof GenerateProductDescriptionInputSchema>) {
        setIsLoading(true);
        setGeneratedDesc(null);
        const result = await generateDescriptionAction(values);
        setIsLoading(false);

        if ('error' in result) {
          toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
          setGeneratedDesc(result);
        }
      }

      return (
        <>
          <PageHeader title="AI Product Description Writer" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Generate Description</CardTitle>
                <CardDescription>Enter product details to generate marketing copy.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="productName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl><Input placeholder="e.g., Velvet Noir 85%" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="flavorProfile" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flavor Profile</FormLabel>
                        <FormControl><Input placeholder="e.g., Rich, dark, fruity" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="ingredients" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key Ingredients</FormLabel>
                        <FormControl><Textarea placeholder="e.g., Cacao Beans, Cocoa Butter, Raspberry" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                      Generate
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Generated Description</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading && <p>Generating...</p>}
                  {generatedDesc && <p className="whitespace-pre-wrap">{generatedDesc.description}</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      );
    }
    \'\'\'

### Step 3: Add the Page to the Sidebar

Finally, let's add a link to our new page in the main navigation.

1.  Open \`src/app/(app)/layout.tsx\`.
2.  Import a new icon for our page, like \`PenSquare\`.
3.  Add a new entry to the \`subItems\` array under the "AI System".

    \'\'\'tsx
    // ... imports
    import {
      // ... other icons
      PenSquare,
    } from 'lucide-react';
    
    // ...
    const navItems = [
      // ... other nav items
      {
        icon: BrainCircuit,
        label: 'AI System',
        subItems: [
          { href: '/ai/recommendations', icon: Lightbulb, label: 'Recommendations' },
          { href: '/analytics', icon: BarChart, label: 'Demand Forecasting' },
          { href: '/marketing', icon: Megaphone, label: 'Marketing Copy' },
          { href: '/vip-clients', icon: Gem, label: 'VIP Insights' },
          // Add the new item here
          { href: '/product-description', icon: PenSquare, label: 'Product Descriptions' },
        ],
      },
    ];
    // ...
    \'\'\'

And that's it! You have successfully added a new, end-to-end AI-powered feature to the Roseberry Ops application. You can now start the server, navigate to your new page, and generate product descriptions.

## 5. Next Steps

-   **Connect a Database**: The current application uses mock data from \`src/lib/data.ts\`. The next major step would be to replace this with a real database like **Firebase Firestore**. You would update the \`actions.ts\` files to fetch data from Firestore instead of the local data file.
-   **Add Authentication**: Implement user login using a service like **Firebase Authentication** to secure the application.
-   **Expand AI Capabilities**: Think about what other tedious tasks can be automated with AI. You now have a repeatable pattern for adding new AI features quickly.

Happy coding!
`;

export default function GuidePage() {
  return (
    <>
      <PageHeader title="Developer Guide" />
      <Card>
        <CardContent className="p-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdownContent}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
