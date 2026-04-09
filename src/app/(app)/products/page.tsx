import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { products } from '@/lib/data';
import { PlusCircle } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

export default function ProductsPage() {
  return (
    <>
      <PageHeader title="Products" actions={
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      } />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <Card key={product.id} className="flex flex-col">
            <CardHeader className="p-0 relative">
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={400}
                height={300}
                className="object-cover rounded-t-lg aspect-[4/3]"
                data-ai-hint={product.imageHint}
              />
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <CardTitle className="font-headline text-lg mb-1">{product.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{product.flavor}</p>
              <div className="flex justify-between items-center mt-4">
                <p className="text-lg font-semibold">₹{product.price}</p>
                 <Badge variant={product.availabilityStatus === 'In Stock' ? 'default' : 'destructive'} className={product.availabilityStatus === 'In Stock' ? 'bg-green-700 hover:bg-green-800' : ''}>
                    {product.availabilityStatus}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button variant="outline" className="w-full">Edit Product</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
