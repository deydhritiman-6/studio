'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const markdownContent = `# Roseberry Ops: User Guide & Tutorial

Welcome to Roseberry Ops, your all-in-one system for managing your artisan chocolate business. This guide will walk you through the key features of the application and how to use them to streamline your operations.

## 1. Getting Started: The Dashboard

The first page you see after logging in is the **Dashboard**. It gives you a high-level overview of your business at a glance.

-   **Key Metrics**: At the top, you'll find key performance indicators (KPIs) like Daily Sales, Monthly Revenue, New Orders, and the number of VIP Customers.
-   **Recent Sales**: A bar chart showing your sales performance over the past few months.
-   **Top Selling Products**: A pie chart that highlights which of your products are the most popular.

## 2. Managing Your Business

The sidebar on the left is your main navigation. It's organized into several key areas of your business.

### Sales & Customer Management

-   **Customers**: View a complete list of your customers. You can search for specific customers and filter them by type (e.g., VIP, Regular).
-   **Orders**: Track all customer orders, from placement to delivery. You can see details like the order date, total amount, and current delivery status.
-   **Create Invoice**: Generate professional GST-compliant invoices or simple cash bills for your customers.
-   **View Invoices**: Access a history of all generated invoices and manage their payment status.
-   **Shipping Status**: Track the real-time logistics of your orders and update transit details for your customers.
-   **Distributors**: Manage your relationships with your distribution partners. You can see their contact information, region, and status (Active/Inactive).

### Product & Inventory

-   **Products**: A visual catalog of all your chocolate products. You can see pricing, availability, and edit product details.
-   **Recipes**: Access the recipes for each of your products, including key ingredients.
-   **Inventory**: Keep track of your stock levels. The inventory is split into three categories: Raw Materials, Packaging Materials, and Finished Products. Statuses like "In Stock" or "Low Stock" help you know when to reorder.
-   **Production**: This page shows a schedule of active production orders (orders that have been confirmed but not yet shipped). It helps your production team know what to make next.

## 3. The AI System: Your Smart Assistant

Roseberry Ops includes a powerful AI System to help you make smarter decisions. You can find these tools under the "AI System" menu in the sidebar.

### How to Use the AI Tools

All AI tools follow a simple pattern:
1.  **Fill out the form** on the left with the required information.
2.  **Click the "Generate" button.**
3.  **View the AI's output** on the right.

Here's what each tool can do:

-   **Recommendations**: Select a customer from the dropdown list and click "Generate". The AI will analyze their purchase history and recommend other products they are likely to enjoy.
-   **Demand Forecasting**: Choose a product, add any known seasonal trends or upcoming events (like holidays), and click "Generate Forecast". The AI will predict future sales demand for that product.
-   **Marketing Copy**: Need to write an email or a WhatsApp message for a campaign? This tool does it for you. Select the campaign type, customer segment, and other details, and the AI will generate compelling marketing copy.
-   **VIP Insights**: Get a deep understanding of your most valuable customers. Select a VIP client, and the AI will analyze their behavior, provide a summary, and suggest personalized actions to keep them engaged.

## 4. Settings & Guides

-   **Settings**: Here you can update your personal profile information and switch the application's appearance between light and dark mode.
-   **Developer Guide**: For developers, this guide provides technical details about the application's architecture and how to add new features.
-   **User Guide**: The page you're reading right now!

Happy managing!
`;

export default function UserGuidePage() {
  return (
    <>
      <PageHeader title="User Guide" />
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
