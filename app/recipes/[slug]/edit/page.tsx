import { notFound } from "next/navigation";

import NoPermissionNotice from "@/components/NoPermissionNotice";
import RecipeForm from "@/components/RecipeForm";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { recipeInclude, serializeRecipe } from "@/lib/recipes";

type Props = { params: Promise<{ slug: string }> };

export const metadata = { title: "Edit recipe" };

export default async function EditRecipePage({ params }: Props) {
  const { slug } = await params;
  const user = await requireUser(`/recipes/${slug}/edit`);
  if (!can(user, "recipes:edit")) {
    return <NoPermissionNotice needs="recipes:edit" />;
  }

  const row = await prisma.recipe.findUnique({
    where: { slug },
    include: recipeInclude,
  });
  if (!row) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-3xl">Edit recipe</h1>
      <RecipeForm recipe={serializeRecipe(row)} />
    </div>
  );
}
