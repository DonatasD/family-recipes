import { notFound } from "next/navigation";

import RecipeForm from "@/components/RecipeForm";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { recipeInclude, serializeRecipe } from "@/lib/recipes";

type Props = { params: Promise<{ slug: string }> };

export const metadata = { title: "Edit recipe" };

export default async function EditRecipePage({ params }: Props) {
  const { slug } = await params;
  await requireUser(`/recipes/${slug}/edit`);

  const row = await prisma.recipe.findUnique({
    where: { slug },
    include: recipeInclude,
  });
  if (!row) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-3xl">Edit recipe</h1>
      <RecipeForm recipe={serializeRecipe(row)} />
    </div>
  );
}
