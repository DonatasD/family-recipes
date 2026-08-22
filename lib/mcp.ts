import type { AuthInfo, McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

import type { AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  recipeCreateSchema,
  recipeInclude,
  serializeRecipe,
  uniqueSlug,
} from "@/lib/recipes";

// Kept apart from the route so the server definition has no `server-only`
// imports and can be exercised outside a Next.js request (scripts, tests).

export const mcpServerOptions = {
  serverInfo: { name: "don-ugne-recipes", version: "1.0.0" },
  instructions:
    "Don & Ugnė's private recipe collection. Recipes are addressable by id or slug; " +
    "titles may contain Lithuanian characters and slugs are derived automatically.",
};

type ToolContext = { http?: { authInfo?: AuthInfo } };

/**
 * withMcpAuth({ required: true }) rejects unauthenticated requests before the
 * handler runs, so a missing user here means the auth wiring broke — fail loud.
 */
function callerOf(ctx: ToolContext): AuthUser {
  const user = ctx.http?.authInfo?.extra?.user as AuthUser | undefined;
  if (!user) throw new Error("MCP tool invoked without an authenticated user");
  return user;
}

function json(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function failure(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

function findRecipe(idOrSlug: string) {
  return prisma.recipe.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: recipeInclude,
  });
}

const idOrSlugField = z
  .string()
  .trim()
  .min(1)
  .describe("Recipe id or URL slug");

export function registerRecipeTools(server: McpServer) {
  server.registerTool(
    "list_recipes",
    {
      title: "List recipes",
      description:
        "Search the recipe collection. Returns compact summaries; use get_recipe for full details.",
      inputSchema: z.object({
        query: z
          .string()
          .trim()
          .min(1)
          .optional()
          .describe("Matches title, description, notes, and tags"),
        tag: z.string().trim().min(1).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        offset: z.number().int().min(0).optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ query, tag, limit = 50, offset = 0 }, ctx) => {
      callerOf(ctx);

      const where: Prisma.RecipeWhereInput = {};
      if (query) {
        where.OR = [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { notes: { contains: query, mode: "insensitive" } },
          { tags: { has: query.toLowerCase() } },
        ];
      }
      if (tag) where.tags = { has: tag.toLowerCase() };

      const [rows, total] = await Promise.all([
        prisma.recipe.findMany({
          where,
          include: recipeInclude,
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        prisma.recipe.count({ where }),
      ]);

      return json({
        total,
        limit,
        offset,
        recipes: rows.map(serializeRecipe).map((r) => ({
          id: r.id,
          slug: r.slug,
          title: r.title,
          description: r.description,
          tags: r.tags,
          totalMinutes: r.totalMinutes,
          servings: r.servings,
          averageStars: r.averageStars,
        })),
      });
    }
  );

  server.registerTool(
    "get_recipe",
    {
      title: "Get a recipe",
      description:
        "Fetch one recipe in full (ingredients, steps, ratings) by id or slug.",
      inputSchema: z.object({ idOrSlug: idOrSlugField }),
      annotations: { readOnlyHint: true },
    },
    async ({ idOrSlug }, ctx) => {
      callerOf(ctx);
      const recipe = await findRecipe(idOrSlug);
      if (!recipe) return failure(`Recipe "${idOrSlug}" not found`);
      return json(serializeRecipe(recipe));
    }
  );

  server.registerTool(
    "create_recipe",
    {
      title: "Create a recipe",
      description:
        "Add a new recipe. Ingredients may be objects ({ amount, unit, item }) or plain strings like '2 tbsp olive oil'.",
      inputSchema: recipeCreateSchema,
    },
    async (data, ctx) => {
      const user = callerOf(ctx);
      const recipe = await prisma.recipe.create({
        data: {
          slug: await uniqueSlug(data.title),
          title: data.title,
          description: data.description ?? null,
          ingredients: data.ingredients,
          steps: data.steps,
          servings: data.servings ?? null,
          prepMinutes: data.prepMinutes ?? null,
          cookMinutes: data.cookMinutes ?? null,
          tags: data.tags ?? [],
          imageUrl: data.imageUrl ?? null,
          sourceName: data.sourceName ?? null,
          sourceUrl: data.sourceUrl ?? null,
          notes: data.notes ?? null,
          authorId: user.id,
        },
        include: recipeInclude,
      });
      return json(serializeRecipe(recipe));
    }
  );

  server.registerTool(
    "update_recipe",
    {
      title: "Update a recipe",
      description:
        "Edit an existing recipe by id or slug. Only the provided fields change; ingredients and steps replace the whole list when given.",
      inputSchema: recipeCreateSchema
        .partial()
        .extend({ idOrSlug: idOrSlugField }),
    },
    async ({ idOrSlug, ...data }, ctx) => {
      callerOf(ctx);

      if (Object.values(data).every((value) => value === undefined)) {
        return failure("Provide at least one field to update");
      }

      const existing = await findRecipe(idOrSlug);
      if (!existing) return failure(`Recipe "${idOrSlug}" not found`);

      const updated = await prisma.recipe.update({
        where: { id: existing.id },
        data: {
          ...data,
          // Keep the slug in step with the title, but never break an existing
          // link for an unrelated edit.
          ...(data.title && data.title !== existing.title
            ? { slug: await uniqueSlug(data.title, existing.id) }
            : {}),
        },
        include: recipeInclude,
      });
      return json(serializeRecipe(updated));
    }
  );

  server.registerTool(
    "delete_recipe",
    {
      title: "Delete a recipe",
      description: "Permanently delete a recipe by id or slug.",
      inputSchema: z.object({ idOrSlug: idOrSlugField }),
      annotations: { destructiveHint: true },
    },
    async ({ idOrSlug }, ctx) => {
      callerOf(ctx);
      const existing = await findRecipe(idOrSlug);
      if (!existing) return failure(`Recipe "${idOrSlug}" not found`);
      await prisma.recipe.delete({ where: { id: existing.id } });
      return json({ deleted: true, id: existing.id, slug: existing.slug });
    }
  );
}
