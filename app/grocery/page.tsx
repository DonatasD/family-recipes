import GroceryList, { type PickerRecipe } from "@/components/GroceryList";
import NoPermissionNotice from "@/components/NoPermissionNotice";
import { prisma } from "@/lib/db";
import { getGroceryList } from "@/lib/grocery-server";
import { requireUser } from "@/lib/guard";
import { can } from "@/lib/permissions";

export const metadata = { title: "Grocery list — Don & Ugnė's Recipes" };

export default async function GroceryPage() {
  const user = await requireUser("/grocery");
  if (!can(user, "grocery")) return <NoPermissionNotice needs="grocery" />;

  const [list, rows] = await Promise.all([
    getGroceryList(),
    prisma.recipe.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        ingredients: true,
        prepMinutes: true,
        cookMinutes: true,
      },
      orderBy: { title: "asc" },
    }),
  ]);

  const recipes: PickerRecipe[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    ingredientCount: Array.isArray(row.ingredients) ? row.ingredients.length : 0,
    totalMinutes:
      row.prepMinutes === null && row.cookMinutes === null
        ? null
        : (row.prepMinutes ?? 0) + (row.cookMinutes ?? 0),
  }));

  return <GroceryList initialList={list} recipes={recipes} />;
}
