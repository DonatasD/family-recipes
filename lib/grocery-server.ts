import { z } from "zod";

import { prisma } from "@/lib/db";
import {
  GROCERY_CATEGORY_IDS,
  guessCategory,
  type GroceryList,
  type GroceryListItem,
  type GroceryListRecipe,
} from "@/lib/grocery";

/** POST /api/grocery/recipes — `recipe` takes an id or a slug. */
export const groceryRecipeAddSchema = z.object({
  recipe: z.string().trim().min(1).max(300),
  servings: z.number().int().min(1).max(1000).optional(),
});

export const groceryRecipeUpdateSchema = z
  .object({
    servings: z.number().int().min(1).max(1000).nullable().optional(),
    checked: z.array(z.number().int().min(0).max(999)).max(200).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide `servings` and/or `checked`",
  });

export const groceryItemCreateSchema = z.object({
  item: z.string().trim().min(1).max(300),
  amount: z
    .string()
    .trim()
    .max(40)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
  unit: z
    .string()
    .trim()
    .max(40)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
  /** Omit (or null) to auto-guess from the name. */
  category: z.enum(GROCERY_CATEGORY_IDS).optional().nullable(),
});

export const groceryItemUpdateSchema = z.object({
  checked: z.boolean(),
});

export const groceryRecipeInclude = {
  recipe: {
    select: {
      id: true,
      slug: true,
      title: true,
      servings: true,
      ingredients: true,
    },
  },
} as const;

type GroceryRecipeRow = {
  servings: number | null;
  checked: unknown;
  addedAt: Date;
  recipe: {
    id: string;
    slug: string;
    title: string;
    servings: number | null;
    ingredients: unknown;
  };
};

type GroceryItemRow = {
  id: string;
  amount: string | null;
  unit: string | null;
  item: string;
  category: string | null;
  checked: boolean;
  addedAt: Date;
};

function serializeGroceryRecipe(row: GroceryRecipeRow): GroceryListRecipe {
  const ingredients = (row.recipe.ingredients ?? []) as {
    amount?: string | null;
    unit?: string | null;
    item: string;
  }[];
  const checked = Array.isArray(row.checked)
    ? row.checked.filter((index): index is number => typeof index === "number")
    : [];
  return {
    recipeId: row.recipe.id,
    slug: row.recipe.slug,
    title: row.recipe.title,
    recipeServings: row.recipe.servings,
    servings: row.servings,
    ingredients: ingredients.map((ingredient) => ({
      amount: ingredient.amount ?? null,
      unit: ingredient.unit ?? null,
      item: ingredient.item,
      category: guessCategory(ingredient.item),
    })),
    checked,
    addedAt: row.addedAt.toISOString(),
  };
}

function serializeGroceryItem(row: GroceryItemRow): GroceryListItem {
  const stored = GROCERY_CATEGORY_IDS.find((id) => id === row.category);
  return {
    id: row.id,
    amount: row.amount,
    unit: row.unit,
    item: row.item,
    category: stored ?? guessCategory(row.item),
    checked: row.checked,
    addedAt: row.addedAt.toISOString(),
  };
}

/**
 * The whole list, in the shape every /api/grocery mutation also returns —
 * clients replace their state with the response instead of patching it.
 */
export async function getGroceryList(): Promise<GroceryList> {
  const [recipes, items] = await Promise.all([
    prisma.groceryRecipe.findMany({
      include: groceryRecipeInclude,
      orderBy: { addedAt: "asc" },
    }),
    prisma.groceryItem.findMany({ orderBy: { addedAt: "asc" } }),
  ]);
  return {
    recipes: recipes.map(serializeGroceryRecipe),
    items: items.map(serializeGroceryItem),
  };
}
