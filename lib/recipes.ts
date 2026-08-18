import { z } from "zod";

import { prisma } from "@/lib/db";

/** An ingredient line. Only `item` is required. */
export const ingredientSchema = z.object({
  amount: z.string().trim().max(40).optional().nullable(),
  unit: z.string().trim().max(40).optional().nullable(),
  item: z.string().trim().min(1).max(300),
});

export type Ingredient = z.infer<typeof ingredientSchema>;

/**
 * Ingredients may be posted as objects or as plain strings ("2 tbsp olive
 * oil"), whichever is easier at the call site. Strings land in `item`.
 */
const ingredientInput = z.union([
  z.string().trim().min(1).max(300).transform((item) => ({ item })),
  ingredientSchema,
]);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null));

const positiveInt = (max: number) =>
  z.number().int().min(0).max(max).optional().nullable();

export const recipeCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: optionalText(2000),
  ingredients: z.array(ingredientInput).min(1).max(200),
  steps: z.array(z.string().trim().min(1).max(4000)).min(1).max(100),
  servings: positiveInt(1000),
  prepMinutes: positiveInt(100000),
  cookMinutes: positiveInt(100000),
  tags: z
    .array(z.string().trim().min(1).max(40))
    .max(30)
    .optional()
    .transform((tags) => normalizeTags(tags ?? [])),
  imageUrl: z.string().url().max(2000).optional().nullable(),
  sourceName: optionalText(200),
  sourceUrl: z.string().url().max(2000).optional().nullable(),
  notes: optionalText(5000),
});

/** Every field optional, but at least one must be present. */
export const recipeUpdateSchema = recipeCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export type RecipeCreateInput = z.infer<typeof recipeCreateSchema>;

/** Lowercase, de-duplicated, order preserved. */
export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    const clean = tag.trim().toLowerCase();
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      out.push(clean);
    }
  }
  return out;
}

/** URL-safe slug that survives Lithuanian diacritics (ąčęėįšųūž). */
export function slugify(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "recipe";
}

/** Appends -2, -3, ... until the slug is free. */
export async function uniqueSlug(
  title: string,
  excludeId?: string
): Promise<string> {
  const base = slugify(title);
  for (let attempt = 1; ; attempt++) {
    const candidate = attempt === 1 ? base : `${base}-${attempt}`;
    const clash = await prisma.recipe.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash || clash.id === excludeId) return candidate;
  }
}

export const recipeInclude = {
  author: { select: { id: true, name: true } },
  ratings: {
    select: {
      stars: true,
      favorite: true,
      user: { select: { id: true, name: true } },
    },
  },
} as const;

type RecipeRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  ingredients: unknown;
  steps: unknown;
  servings: number | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  tags: string[];
  imageUrl: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; name: string };
  ratings: {
    stars: number | null;
    favorite: boolean;
    user: { id: string; name: string };
  }[];
};

/** Mean of the star ratings that were actually given, to one decimal. */
function averageStars(ratings: { stars: number | null }[]): number | null {
  const given = ratings.filter((r) => r.stars !== null).map((r) => r.stars!);
  if (given.length === 0) return null;
  const mean = given.reduce((sum, stars) => sum + stars, 0) / given.length;
  return Math.round(mean * 10) / 10;
}

/** Shapes a DB row into the JSON the API and pages both use. */
export function serializeRecipe(recipe: RecipeRow) {
  const ratings = recipe.ratings.map((rating) => ({
    stars: rating.stars,
    favorite: rating.favorite,
    userId: rating.user.id,
    userName: rating.user.name,
  }));

  const totalMinutes =
    recipe.prepMinutes === null && recipe.cookMinutes === null
      ? null
      : (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);

  return {
    id: recipe.id,
    slug: recipe.slug,
    title: recipe.title,
    description: recipe.description,
    ingredients: (recipe.ingredients ?? []) as Ingredient[],
    steps: (recipe.steps ?? []) as string[],
    servings: recipe.servings,
    prepMinutes: recipe.prepMinutes,
    cookMinutes: recipe.cookMinutes,
    totalMinutes,
    tags: recipe.tags,
    imageUrl: recipe.imageUrl,
    sourceName: recipe.sourceName,
    sourceUrl: recipe.sourceUrl,
    notes: recipe.notes,
    author: recipe.author,
    ratings,
    averageStars: averageStars(ratings),
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
  };
}

export type SerializedRecipe = ReturnType<typeof serializeRecipe>;
