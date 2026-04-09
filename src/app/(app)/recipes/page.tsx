import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { recipes } from '@/lib/data';
import { PlusCircle } from 'lucide-react';

export default function RecipesPage() {
  return (
    <>
      <PageHeader title="Recipes" actions={
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Recipe
        </Button>
      } />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <Card key={recipe.id}>
            <CardHeader>
              <CardTitle className="font-headline">{recipe.name}</CardTitle>
              <CardDescription>Associated with: {recipe.associatedProduct}</CardDescription>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-2">Key Ingredients:</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {recipe.ingredients.slice(0, 3).map((ingredient) => (
                  <li key={ingredient.name}>{ingredient.name} ({ingredient.quantity})</li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View Full Recipe</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
