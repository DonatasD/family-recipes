"use client";

import Link from "next/link";
import { useState } from "react";

import {
  formatAmount,
  GROCERY_CATEGORIES,
  parseAmount,
  type GroceryCategoryId,
  type GroceryList as List,
} from "@/lib/grocery";
import { MEASUREMENT_UNITS } from "@/lib/measurements";

export type PickerRecipe = {
  id: string;
  slug: string;
  title: string;
  ingredientCount: number;
  totalMinutes: number | null;
};

/** Bunting colours from globals.css, reused as category markers. */
const CATEGORY_COLORS: Record<GroceryCategoryId, string> = {
  veg: "#66761a",
  meat: "#cf6b3f",
  dairy: "#e3b62e",
  grains: "#a9b665",
  pantry: "#81845c",
  other: "#b9b58f",
};

const CATEGORY_NAMES = Object.fromEntries(
  GROCERY_CATEGORIES.map((category) => [category.id, category.name])
) as Record<GroceryCategoryId, string>;

type View = "recipe" | "all" | "category";

/** One ingredient line or extra item, flattened for merging and ticking. */
type Occurrence = {
  key: string;
  recipeSlug: string | null;
  ingredientIndex: number | null;
  itemId: string | null;
  source: string | null;
  item: string;
  unit: string | null;
  /** Parsed and servings-scaled; null when the amount isn't a number. */
  amountNum: number | null;
  /** The original text when it couldn't be parsed (e.g. "a splash"). */
  amountRaw: string | null;
  category: GroceryCategoryId;
  checked: boolean;
};

type MergedRow = {
  item: string;
  category: GroceryCategoryId;
  amountText: string;
  sources: string[];
  occurrences: Occurrence[];
  done: boolean;
};

function occurrencesOf(list: List): Occurrence[] {
  const out: Occurrence[] = [];
  for (const entry of list.recipes) {
    const scale =
      entry.servings && entry.recipeServings
        ? entry.servings / entry.recipeServings
        : 1;
    entry.ingredients.forEach((ingredient, index) => {
      const parsed = parseAmount(ingredient.amount);
      out.push({
        key: `${entry.recipeId}:${index}`,
        recipeSlug: entry.slug,
        ingredientIndex: index,
        itemId: null,
        source: entry.title,
        item: ingredient.item,
        unit: ingredient.unit,
        amountNum: parsed === null ? null : parsed * scale,
        amountRaw: parsed === null ? ingredient.amount : null,
        category: ingredient.category,
        checked: entry.checked.includes(index),
      });
    });
  }
  for (const item of list.items) {
    const parsed = parseAmount(item.amount);
    out.push({
      key: `item:${item.id}`,
      recipeSlug: null,
      ingredientIndex: null,
      itemId: item.id,
      source: null,
      item: item.item,
      unit: item.unit,
      amountNum: parsed,
      amountRaw: parsed === null ? item.amount : null,
      category: item.category,
      checked: item.checked,
    });
  }
  return out;
}

function amountLabel(occurrence: Occurrence): string {
  const amount =
    occurrence.amountNum !== null
      ? formatAmount(occurrence.amountNum)
      : occurrence.amountRaw ?? "";
  return [amount, occurrence.unit ?? ""].filter(Boolean).join(" ");
}

/** Same name → one row; amounts sum per unit, unparseable ones tag along. */
function merge(occurrences: Occurrence[]): MergedRow[] {
  const groups = new Map<string, Occurrence[]>();
  for (const occurrence of occurrences) {
    const key = occurrence.item.trim().toLowerCase();
    const group = groups.get(key);
    if (group) group.push(occurrence);
    else groups.set(key, [occurrence]);
  }
  return [...groups.values()].map((group) => {
    const sums = new Map<string, number>();
    const raws: string[] = [];
    for (const occurrence of group) {
      if (occurrence.amountNum !== null) {
        const unit = occurrence.unit ?? "";
        sums.set(unit, (sums.get(unit) ?? 0) + occurrence.amountNum);
      } else if (occurrence.amountRaw) {
        raws.push(
          [occurrence.amountRaw, occurrence.unit ?? ""].filter(Boolean).join(" ")
        );
      }
    }
    const sources = [
      ...new Set(group.map((o) => o.source ?? "your item")),
    ];
    return {
      item: group[0].item,
      category: group[0].category,
      amountText: [...sums]
        .map(([unit, total]) =>
          [formatAmount(total), unit].filter(Boolean).join(" ")
        )
        .concat(raws)
        .join(" + "),
      sources,
      occurrences: group,
      done: group.every((o) => o.checked),
    };
  });
}

function withChecks(list: List, keys: Set<string>, next: boolean): List {
  return {
    recipes: list.recipes.map((entry) => {
      const affected = entry.ingredients
        .map((_, index) => index)
        .filter((index) => keys.has(`${entry.recipeId}:${index}`));
      if (affected.length === 0) return entry;
      const checked = new Set(entry.checked);
      for (const index of affected) {
        if (next) checked.add(index);
        else checked.delete(index);
      }
      return { ...entry, checked: [...checked].sort((a, b) => a - b) };
    }),
    items: list.items.map((item) =>
      keys.has(`item:${item.id}`) ? { ...item, checked: next } : item
    ),
  };
}

export default function GroceryList({
  initialList,
  recipes,
}: {
  initialList: List;
  recipes: PickerRecipe[];
}) {
  const [list, setList] = useState(initialList);
  const [view, setView] = useState<View>("recipe");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    unit: "pcs",
    item: "",
    category: "" as "" | GroceryCategoryId,
  });

  const occurrences = occurrencesOf(list);
  const mergedAll = merge(occurrences);
  const totalRows = mergedAll.length;
  const doneRows = mergedAll.filter((row) => row.done).length;
  const entryBySlug = new Map(list.recipes.map((r) => [r.slug, r]));

  async function request(path: string, method: string, body?: unknown) {
    setError(null);
    try {
      const response = await fetch(path, {
        method,
        headers: body !== undefined ? { "Content-Type": "application/json" } : {},
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) throw new Error();
      return (await response.json()) as List;
    } catch {
      setError("Could not save that just now — try again.");
      return null;
    }
  }

  async function refetch() {
    const fresh = await request("/api/grocery", "GET");
    if (fresh) setList(fresh);
  }

  async function apply(promise: Promise<List | null>) {
    const next = await promise;
    if (next) setList(next);
  }

  function toggle(group: Occurrence[], next: boolean) {
    const keys = new Set(group.map((o) => o.key));
    const optimistic = withChecks(list, keys, next);
    setList(optimistic);
    void (async () => {
      let failed = false;
      for (const entry of optimistic.recipes) {
        const touches = group.some((o) => o.recipeSlug === entry.slug);
        if (!touches) continue;
        const result = await request(
          `/api/grocery/recipes/${entry.slug}`,
          "PATCH",
          { checked: entry.checked }
        );
        if (!result) failed = true;
      }
      for (const occurrence of group) {
        if (!occurrence.itemId) continue;
        const result = await request(
          `/api/grocery/items/${occurrence.itemId}`,
          "PATCH",
          { checked: next }
        );
        if (!result) failed = true;
      }
      if (failed) await refetch();
    })();
  }

  async function addExtra(event: React.FormEvent) {
    event.preventDefault();
    const item = form.item.trim();
    if (!item) return;
    const next = await request("/api/grocery/items", "POST", {
      item,
      // A unit with no amount reads oddly ("pcs shaving kit"), so default to 1.
      amount: form.amount.trim() || "1",
      unit: form.unit || null,
      category: form.category || null,
    });
    if (next) {
      setList(next);
      setForm({ amount: "", unit: "pcs", item: "", category: "" });
    }
  }

  async function copy() {
    const lines: string[] = [];
    const mark = (done: boolean) => (done ? "[x] " : "[ ] ");
    if (view === "recipe") {
      for (const entry of list.recipes) {
        lines.push(entry.title.toUpperCase());
        for (const o of occurrences.filter((o) => o.recipeSlug === entry.slug)) {
          lines.push(mark(o.checked) + [amountLabel(o), o.item].filter(Boolean).join(" "));
        }
        lines.push("");
      }
      const extras = occurrences.filter((o) => o.itemId);
      if (extras.length > 0) {
        lines.push("EXTRA ITEMS");
        for (const o of extras) {
          lines.push(mark(o.checked) + [amountLabel(o), o.item].filter(Boolean).join(" "));
        }
      }
    } else if (view === "all") {
      for (const row of [...mergedAll].sort((a, b) => a.item.localeCompare(b.item))) {
        lines.push(mark(row.done) + [row.amountText, row.item].filter(Boolean).join(" "));
      }
    } else {
      for (const category of GROCERY_CATEGORIES) {
        const rows = mergedAll
          .filter((row) => row.category === category.id)
          .sort((a, b) => a.item.localeCompare(b.item));
        if (rows.length === 0) continue;
        lines.push(category.name.toUpperCase());
        for (const row of rows) {
          lines.push(mark(row.done) + [row.amountText, row.item].filter(Boolean).join(" "));
        }
        lines.push("");
      }
    }
    const text = lines.join("\n").trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("The browser blocked clipboard access.");
    }
  }

  const headline = (() => {
    const parts: string[] = [];
    const recipeCount = list.recipes.length;
    const extraCount = list.items.length;
    if (recipeCount > 0)
      parts.push(`${recipeCount} ${recipeCount === 1 ? "recipe" : "recipes"}`);
    if (extraCount > 0)
      parts.push(`${extraCount} extra ${extraCount === 1 ? "item" : "items"}`);
    if (parts.length === 0) return "Nothing on the list yet.";
    return `${parts.join(" · ")} · ${totalRows} ${totalRows === 1 ? "item" : "items"} to buy`;
  })();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Grocery list</h1>
        <p className="mt-1 text-sm text-muted">{headline}</p>
      </div>

      {error && (
        <p className="rounded-lg border border-line bg-accent-soft px-4 py-2 text-sm text-accent">
          {error}
        </p>
      )}

      <section>
        <p className="label">Recipes on the list</p>
        {recipes.length === 0 ? (
          <p className="text-sm text-muted">
            No recipes yet —{" "}
            <Link href="/recipes/new" className="text-accent hover:underline">
              add one first
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => {
              const entry = entryBySlug.get(recipe.slug);
              const servings = entry
                ? entry.servings ?? entry.recipeServings
                : null;
              return (
                <div
                  key={recipe.id}
                  className={`flex flex-col gap-2 rounded-xl border bg-card p-4 ${
                    entry ? "border-accent" : "border-line"
                  }`}
                >
                  <Link
                    href={`/recipes/${recipe.slug}`}
                    className="font-display text-lg leading-tight hover:text-accent"
                  >
                    {recipe.title}
                  </Link>
                  <p className="text-xs text-muted">
                    {recipe.ingredientCount}{" "}
                    {recipe.ingredientCount === 1 ? "ingredient" : "ingredients"}
                    {recipe.totalMinutes !== null && ` · ${recipe.totalMinutes} min`}
                  </p>
                  <div className="mt-auto flex items-center gap-2 pt-1">
                    {entry ? (
                      <>
                        {servings !== null && (
                          <span className="inline-flex items-center rounded-lg border border-line bg-paper">
                            <button
                              type="button"
                              aria-label="Fewer servings"
                              className="px-2 py-1 text-sm hover:text-accent"
                              onClick={() =>
                                servings > 1 &&
                                void apply(
                                  request(`/api/grocery/recipes/${recipe.slug}`, "PATCH", {
                                    servings: servings - 1,
                                  })
                                )
                              }
                            >
                              −
                            </button>
                            <span className="min-w-[5.5rem] text-center text-xs font-semibold tabular-nums">
                              {servings} {servings === 1 ? "serving" : "servings"}
                            </span>
                            <button
                              type="button"
                              aria-label="More servings"
                              className="px-2 py-1 text-sm hover:text-accent"
                              onClick={() =>
                                void apply(
                                  request(`/api/grocery/recipes/${recipe.slug}`, "PATCH", {
                                    servings: servings + 1,
                                  })
                                )
                              }
                            >
                              +
                            </button>
                          </span>
                        )}
                        <button
                          type="button"
                          className="ml-auto text-xs text-muted hover:text-accent"
                          onClick={() =>
                            void apply(
                              request(`/api/grocery/recipes/${recipe.slug}`, "DELETE")
                            )
                          }
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                        onClick={() =>
                          void apply(
                            request("/api/grocery/recipes", "POST", {
                              recipe: recipe.slug,
                            })
                          )
                        }
                      >
                        Add to list
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <p className="label">Anything else</p>
        <form onSubmit={addExtra} className="flex flex-wrap items-center gap-2">
          <input
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            inputMode="decimal"
            placeholder="1"
            aria-label="Quantity"
            className="field max-w-16"
          />
          <select
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            aria-label="Unit"
            className="field max-w-28"
          >
            {MEASUREMENT_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
          <input
            value={form.item}
            onChange={(e) => setForm({ ...form, item: e.target.value })}
            placeholder="e.g. shaving kit"
            required
            aria-label="Item name"
            className="field min-w-48 flex-1"
          />
          <select
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value as "" | GroceryCategoryId })
            }
            aria-label="Category"
            className="field max-w-44"
          >
            <option value="">Category: auto</option>
            {GROCERY_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Add item
          </button>
        </form>
        <p className="mt-2 text-xs text-muted">
          One-off items land on the same list and merge with recipe
          ingredients when the name matches.
        </p>
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-line bg-paper px-4 py-3">
          <div className="flex gap-1 rounded-full border border-line bg-card p-1">
            {(
              [
                ["recipe", "By recipe"],
                ["all", "All together"],
                ["category", "By category"],
              ] as [View, string][]
            ).map(([id, name]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={`rounded-full px-3 py-1 text-xs ${
                  view === id
                    ? "bg-accent-soft font-semibold text-accent"
                    : "text-muted hover:text-accent"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-3 text-xs">
            <button type="button" onClick={() => void copy()} className="text-muted hover:text-accent">
              {copied ? "Copied ✓" : "Copy list"}
            </button>
            <button
              type="button"
              onClick={() => void apply(request("/api/grocery", "PATCH", { checked: false }))}
              className="text-muted hover:text-accent"
            >
              Uncheck all
            </button>
            <button
              type="button"
              onClick={() => void apply(request("/api/grocery", "DELETE"))}
              className="text-muted hover:text-accent"
            >
              Clear list
            </button>
          </div>
        </div>

        {occurrences.length > 0 && (
          <div className="flex items-center gap-3 border-b border-line px-4 py-2 text-xs text-muted">
            <span className="whitespace-nowrap tabular-nums">
              {doneRows} of {totalRows} picked up
            </span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <span
                className="block h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${totalRows ? Math.round((doneRows / totalRows) * 100) : 0}%` }}
              />
            </span>
          </div>
        )}

        {occurrences.length === 0 ? (
          <div className="m-4 rounded-xl border border-dashed border-line p-10 text-center">
            <p className="font-display text-xl">Nothing to buy yet</p>
            <p className="mt-2 text-sm text-muted">
              Add a recipe or two above and the ingredients land here.
            </p>
          </div>
        ) : view === "recipe" ? (
          <div className="pb-3">
            {list.recipes.map((entry) => (
              <div key={entry.recipeId}>
                <GroupHead
                  title={entry.title}
                  meta={
                    (entry.servings ?? entry.recipeServings) !== null
                      ? `${entry.servings ?? entry.recipeServings} servings`
                      : undefined
                  }
                />
                <ul>
                  {occurrences
                    .filter((o) => o.recipeSlug === entry.slug)
                    .map((o) => (
                      <Row
                        key={o.key}
                        amount={amountLabel(o)}
                        item={o.item}
                        note={CATEGORY_NAMES[o.category]}
                        checked={o.checked}
                        onToggle={(next) => toggle([o], next)}
                      />
                    ))}
                </ul>
              </div>
            ))}
            {list.items.length > 0 && (
              <div>
                <GroupHead title="Extra items" meta="not from a recipe" />
                <ul>
                  {occurrences
                    .filter((o) => o.itemId)
                    .map((o) => (
                      <Row
                        key={o.key}
                        amount={amountLabel(o)}
                        item={o.item}
                        note={CATEGORY_NAMES[o.category]}
                        checked={o.checked}
                        onToggle={(next) => toggle([o], next)}
                        onRemove={() =>
                          void apply(request(`/api/grocery/items/${o.itemId}`, "DELETE"))
                        }
                      />
                    ))}
                </ul>
              </div>
            )}
          </div>
        ) : view === "all" ? (
          <ul className="py-3">
            {[...mergedAll]
              .sort((a, b) => a.item.localeCompare(b.item))
              .map((row) => (
                <Row
                  key={row.item.toLowerCase()}
                  amount={row.amountText}
                  item={row.item}
                  note={row.sources.join(" + ")}
                  checked={row.done}
                  onToggle={(next) => toggle(row.occurrences, next)}
                />
              ))}
          </ul>
        ) : (
          <div className="pb-3">
            {GROCERY_CATEGORIES.map((category) => {
              const rows = mergedAll
                .filter((row) => row.category === category.id)
                .sort((a, b) => a.item.localeCompare(b.item));
              if (rows.length === 0) return null;
              return (
                <div key={category.id}>
                  <GroupHead
                    title={category.name}
                    meta={`${rows.length} ${rows.length === 1 ? "item" : "items"}`}
                    color={CATEGORY_COLORS[category.id]}
                  />
                  <ul>
                    {rows.map((row) => (
                      <Row
                        key={row.item.toLowerCase()}
                        amount={row.amountText}
                        item={row.item}
                        note={row.sources.join(" + ")}
                        checked={row.done}
                        onToggle={(next) => toggle(row.occurrences, next)}
                      />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function GroupHead({
  title,
  meta,
  color,
}: {
  title: string;
  meta?: string;
  color?: string;
}) {
  return (
    <div className="flex items-baseline gap-2 px-4 pb-1 pt-4">
      {color && (
        <span
          aria-hidden
          className="h-2.5 w-2.5 self-center rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="font-display text-lg">{title}</span>
      {meta && <span className="text-xs text-muted">{meta}</span>}
    </div>
  );
}

function Row({
  amount,
  item,
  note,
  checked,
  onToggle,
  onRemove,
}: {
  amount: string;
  item: string;
  note?: string;
  checked: boolean;
  onToggle: (next: boolean) => void;
  onRemove?: () => void;
}) {
  return (
    <li className="flex items-baseline gap-3 px-4 py-1.5 hover:bg-paper">
      <label className="flex min-w-0 flex-1 cursor-pointer items-baseline gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
          aria-label={`Picked up ${item}`}
          className="h-4 w-4 self-center accent-accent"
        />
        <span
          className={`min-w-[4.5rem] whitespace-nowrap text-sm font-semibold tabular-nums ${
            checked ? "text-muted line-through opacity-70" : "text-accent"
          }`}
        >
          {amount || " "}
        </span>
        <span
          className={`text-[0.93rem] ${
            checked ? "text-muted line-through opacity-70" : ""
          }`}
        >
          {item}
        </span>
      </label>
      {note && (
        <span className="hidden max-w-[40%] truncate text-xs text-muted sm:block">
          {note}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${item}`}
          onClick={onRemove}
          className="text-muted hover:text-accent"
        >
          ×
        </button>
      )}
    </li>
  );
}
