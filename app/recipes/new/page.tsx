import RecipeForm from "@/components/RecipeForm";
import { requireUser } from "@/lib/guard";

export const metadata = { title: "Add a recipe" };

export default async function NewRecipePage() {
  await requireUser("/recipes/new");

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-3xl">Add a recipe</h1>
      <RecipeForm />
    </div>
  );
}
