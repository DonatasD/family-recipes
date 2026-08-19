/**
 * The units the recipe form offers. Ingredient `unit` deliberately stays a
 * free string in the API schema so custom measurements ("handful",
 * "žiupsnis") and old data remain valid — this list is the shared
 * vocabulary, not a restriction.
 *
 * Kept import-free so client components can use it without dragging
 * Prisma/pg into the browser bundle.
 */
export const MEASUREMENT_UNITS = [
  "g",
  "kg",
  "ml",
  "l",
  "tsp",
  "tbsp",
  "cup",
  "pcs",
  "pinch",
  "clove",
  "slice",
  "can",
  "pack",
] as const;

export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];
