import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * OpenAPI description of the recipe API, consumed by ChatGPT custom-GPT
 * Actions ("import from URL" in the GPT editor). Served without auth —
 * the GPT editor fetches it anonymously, and it reveals nothing that the
 * public repository doesn't already.
 */
export async function GET(request: Request) {
  return NextResponse.json(buildSpec(new URL(request.url).origin));
}

function buildSpec(origin: string) {
  const recipeRef = { $ref: "#/components/schemas/Recipe" };
  const unauthorized = { description: "Missing or invalid token" };

  return {
    openapi: "3.1.0",
    info: {
      title: "Don & Ugnė's Recipes API",
      version: "1.0.0",
      description:
        "A private two-person recipe collection. Every operation requires a " +
        "personal API token sent as a bearer header. A saved recipe's page " +
        `lives at ${origin}/recipes/{slug}.`,
    },
    servers: [{ url: origin }],
    security: [{ bearerAuth: [] }],
    paths: {
      "/api/recipes": {
        get: {
          operationId: "searchRecipes",
          summary: "List and search recipes",
          parameters: [
            {
              name: "q",
              in: "query",
              schema: { type: "string" },
              description: "Matches title, description, notes, or a tag",
            },
            {
              name: "tag",
              in: "query",
              schema: { type: "string" },
              description: "Exact lowercase tag",
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 100 },
            },
            {
              name: "offset",
              in: "query",
              schema: { type: "integer", minimum: 0 },
            },
          ],
          responses: {
            "200": {
              description: "Matching recipes, newest first",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      total: { type: "integer" },
                      limit: { type: "integer" },
                      offset: { type: "integer" },
                      recipes: { type: "array", items: recipeRef },
                    },
                  },
                },
              },
            },
            "401": unauthorized,
          },
        },
        post: {
          operationId: "createRecipe",
          summary: "Save a new recipe",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RecipeInput" },
              },
            },
          },
          responses: {
            "201": {
              description:
                "The saved recipe. Link to it as /recipes/{slug} on this host.",
              content: { "application/json": { schema: recipeRef } },
            },
            "401": unauthorized,
            "422": {
              description:
                "Validation failed; the error field maps field names to messages",
            },
          },
        },
      },
      "/api/recipes/{idOrSlug}": {
        get: {
          operationId: "getRecipe",
          summary: "Fetch one recipe by id or slug",
          parameters: [
            {
              name: "idOrSlug",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "The recipe",
              content: { "application/json": { schema: recipeRef } },
            },
            "401": unauthorized,
            "404": { description: "No recipe with that id or slug" },
          },
        },
        patch: {
          operationId: "updateRecipe",
          summary: "Update any subset of a recipe's fields",
          description:
            "Send only the fields to change. Changing the title also changes the slug.",
          parameters: [
            {
              name: "idOrSlug",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RecipeUpdate" },
              },
            },
          },
          responses: {
            "200": {
              description: "The updated recipe",
              content: { "application/json": { schema: recipeRef } },
            },
            "401": unauthorized,
            "404": { description: "No recipe with that id or slug" },
            "422": { description: "Validation failed" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description:
            "Personal API token from the settings page (starts with rcp_)",
        },
      },
      schemas: {
        IngredientInput: {
          oneOf: [
            {
              type: "string",
              description: 'A whole ingredient line, e.g. "2 tbsp olive oil"',
            },
            { $ref: "#/components/schemas/Ingredient" },
          ],
        },
        Ingredient: {
          type: "object",
          required: ["item"],
          properties: {
            amount: {
              type: "string",
              maxLength: 40,
              description: 'The quantity as text, e.g. "500", "1.5", "1/2"',
            },
            unit: {
              type: "string",
              maxLength: 40,
              description: 'e.g. "g", "ml", "tbsp"; omit for countable items',
            },
            item: { type: "string", maxLength: 300 },
          },
        },
        RecipeFields: {
          type: "object",
          properties: {
            title: { type: "string", maxLength: 200 },
            description: {
              type: "string",
              maxLength: 2000,
              description: "One or two sentences",
            },
            ingredients: {
              type: "array",
              minItems: 1,
              maxItems: 200,
              items: { $ref: "#/components/schemas/IngredientInput" },
            },
            steps: {
              type: "array",
              minItems: 1,
              maxItems: 100,
              items: { type: "string", maxLength: 4000 },
              description: "One instruction per entry, in cooking order",
            },
            servings: { type: "integer", minimum: 0, maximum: 1000 },
            prepMinutes: { type: "integer", minimum: 0 },
            cookMinutes: { type: "integer", minimum: 0 },
            tags: {
              type: "array",
              maxItems: 30,
              items: { type: "string", maxLength: 40 },
              description: "Lowercase keywords: cuisine, course, season…",
            },
            imageUrl: { type: "string", format: "uri" },
            sourceName: {
              type: "string",
              maxLength: 200,
              description: "Site, book, or person the recipe came from",
            },
            sourceUrl: { type: "string", format: "uri" },
            notes: { type: "string", maxLength: 5000 },
          },
        },
        RecipeInput: {
          allOf: [
            { $ref: "#/components/schemas/RecipeFields" },
            { required: ["title", "ingredients", "steps"] },
          ],
        },
        RecipeUpdate: {
          allOf: [
            { $ref: "#/components/schemas/RecipeFields" },
            { description: "All fields optional; send at least one" },
          ],
        },
        Recipe: {
          type: "object",
          description: "A stored recipe as returned by every endpoint",
          properties: {
            id: { type: "string" },
            slug: {
              type: "string",
              description: `The page lives at ${origin}/recipes/{slug}`,
            },
            title: { type: "string" },
            description: { type: "string" },
            ingredients: {
              type: "array",
              items: { $ref: "#/components/schemas/Ingredient" },
            },
            steps: { type: "array", items: { type: "string" } },
            servings: { type: "integer" },
            prepMinutes: { type: "integer" },
            cookMinutes: { type: "integer" },
            totalMinutes: { type: "integer" },
            tags: { type: "array", items: { type: "string" } },
            imageUrl: { type: "string" },
            sourceName: { type: "string" },
            sourceUrl: { type: "string" },
            notes: { type: "string" },
            averageStars: { type: "number" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  };
}
