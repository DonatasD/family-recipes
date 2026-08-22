/**
 * Grocery-list vocabulary and arithmetic. Kept import-free (like
 * lib/measurements.ts) so the grocery page's client component can share the
 * category and amount logic with the server without pulling in Prisma or Zod.
 */

export const GROCERY_CATEGORIES = [
  { id: "veg", name: "Fruit & vegetables" },
  { id: "meat", name: "Meat & fish" },
  { id: "dairy", name: "Dairy & eggs" },
  { id: "grains", name: "Grains & baking" },
  { id: "pantry", name: "Pantry & spices" },
  { id: "other", name: "Other" },
] as const;

export type GroceryCategoryId = (typeof GROCERY_CATEGORIES)[number]["id"];

export const GROCERY_CATEGORY_IDS = GROCERY_CATEGORIES.map(
  (category) => category.id
) as [GroceryCategoryId, ...GroceryCategoryId[]];

/**
 * Keyword → category, matched as a prefix of any word in the (diacritic-
 * stripped) ingredient name, in both English and Lithuanian. Pantry runs
 * first so "coconut milk" and "chicken stock" don't land in dairy or meat.
 * A guess with an "other" fallback — extras can override it explicitly.
 */
const CATEGORY_KEYWORDS: [GroceryCategoryId, string[]][] = [
  [
    "pantry",
    ["salt", "drusk", "pepper", "pipir", "oil", "aliej", "vinegar", "actas",
     "stock", "broth", "sultin", "coconut", "kokos", "soy",
     "soj", "mustard", "garsty", "ketchup", "mayo", "majonez", "honey",
     "medus", "olive", "alyvuog", "paste", "curry", "cinnamon", "cinamon",
     "oregano", "basil", "bazilik", "cumin", "kmyn", "paprika", "spice",
     "prieskon", "sauce", "padaz", "can", "konserv"],
  ],
  [
    "meat",
    ["chicken", "vistien", "beef", "jautien", "pork", "kiaulien", "fish",
     "zuv", "salmon", "lasis", "turkey", "kalakut", "mince", "farsas",
     "sausage", "desr", "bacon", "sonin", "lamb", "avien", "ham", "kumpis",
     "shrimp", "krevet", "tuna", "tunas", "herring", "silk"],
  ],
  [
    "dairy",
    ["milk", "pien", "cheese", "suris", "surio", "kefir", "kefyr", "yogurt",
     "jogurt", "cream", "grietin", "butter", "sviest", "egg", "kiausin",
     "feta", "varsk", "mozzarella", "parmesan"],
  ],
  [
    "grains",
    ["flour", "milt", "rice", "ryz", "pasta", "makaron", "bread", "duon",
     "oat", "aviz", "buckwheat", "grik", "sugar", "cukr", "yeast", "miel",
     "spaghetti", "noodle", "couscous", "semolina", "mann"],
  ],
  [
    "veg",
    ["potato", "bulv", "tomato", "pomidor", "cucumber", "agurk", "onion",
     "svogun", "garlic", "cesnak", "carrot", "mork", "beet", "burok",
     "cabbage", "kopust", "lettuce", "salot", "dill", "krap", "parsley",
     "petraz", "spinach", "spinat", "mushroom", "gryb", "zucchini",
     "cukinij", "broccoli", "brokol", "cauliflower", "ziedin", "celery",
     "salier", "apple", "obuol", "banana", "banan", "lemon", "citrin",
     "lime", "laim", "orange", "apelsin", "berry", "uog", "ginger",
     "imbier", "pea", "zirn", "bean", "pupel", "avocado", "avokad",
     "radish", "ridik", "pumpkin", "moliug", "herb", "zol"],
  ],
];

/** Best-effort category for an ingredient name; "other" when unsure. */
export function guessCategory(item: string): GroceryCategoryId {
  const words = item
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((key) => words.some((word) => word.startsWith(key)))) {
      return category;
    }
  }
  return "other";
}

/** "1", "1.5", "1,5", "1/2", "1 1/2" → number; anything else null. */
export function parseAmount(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const value = raw.trim().replace(",", ".");
  const mixed = value.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = value.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  return /^\d*\.?\d+$/.test(value) ? parseFloat(value) : null;
}

const FRACTION_GLYPHS: Record<number, string> = {
  0.25: "¼",
  0.5: "½",
  0.75: "¾",
};

/** 1.5 → "1½", 0.25 → "¼", 666.6667 → "666.67". */
export function formatAmount(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const whole = Math.floor(rounded);
  const glyph = FRACTION_GLYPHS[Math.round((rounded - whole) * 100) / 100];
  if (glyph) return whole ? `${whole}${glyph}` : glyph;
  return String(rounded);
}

/** One ingredient line on the list, with the category already resolved. */
export type GroceryIngredient = {
  amount: string | null;
  unit: string | null;
  item: string;
  category: GroceryCategoryId;
};

export type GroceryListRecipe = {
  recipeId: string;
  slug: string;
  title: string;
  /** Servings the recipe was written for; null when the recipe doesn't say. */
  recipeServings: number | null;
  /** Servings being shopped for; null means "as written". */
  servings: number | null;
  ingredients: GroceryIngredient[];
  /** Indexes into `ingredients` already picked up. */
  checked: number[];
  addedAt: string;
};

export type GroceryListItem = {
  id: string;
  amount: string | null;
  unit: string | null;
  item: string;
  category: GroceryCategoryId;
  checked: boolean;
  addedAt: string;
};

export type GroceryList = {
  recipes: GroceryListRecipe[];
  items: GroceryListItem[];
};
