"use client";

import { upload } from "@vercel/blob/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { MEASUREMENT_UNITS } from "@/lib/measurements";
import type { Ingredient, SerializedRecipe } from "@/lib/recipes";

type Props = { recipe?: SerializedRecipe };

type Row = { amount: string; unit: string; customUnit: boolean; item: string };

const emptyRow: Row = { amount: "", unit: "", customUnit: false, item: "" };

const isKnownUnit = (unit: string) =>
  (MEASUREMENT_UNITS as readonly string[]).includes(unit);

function toRows(ingredients: Ingredient[]): Row[] {
  if (ingredients.length === 0) return [{ ...emptyRow }];
  return ingredients.map((ingredient) => {
    const unit = ingredient.unit ?? "";
    return {
      amount: ingredient.amount ?? "",
      unit,
      customUnit: unit !== "" && !isKnownUnit(unit),
      item: ingredient.item,
    };
  });
}

export default function RecipeForm({ recipe }: Props) {
  const router = useRouter();
  const editing = Boolean(recipe);

  const [title, setTitle] = useState(recipe?.title ?? "");
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [servings, setServings] = useState(recipe?.servings?.toString() ?? "");
  const [prepMinutes, setPrepMinutes] = useState(
    recipe?.prepMinutes?.toString() ?? ""
  );
  const [cookMinutes, setCookMinutes] = useState(
    recipe?.cookMinutes?.toString() ?? ""
  );
  const [tags, setTags] = useState(recipe?.tags.join(", ") ?? "");
  const [ingredients, setIngredients] = useState<Row[]>(
    toRows(recipe?.ingredients ?? [])
  );
  const [steps, setSteps] = useState<string[]>(
    recipe?.steps.length ? recipe.steps : [""]
  );
  const [sourceName, setSourceName] = useState(recipe?.sourceName ?? "");
  const [sourceUrl, setSourceUrl] = useState(recipe?.sourceUrl ?? "");
  const [notes, setNotes] = useState(recipe?.notes ?? "");
  const [imageUrl, setImageUrl] = useState(recipe?.imageUrl ?? "");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePhoto(file: File) {
    setError(null);
    setUploading(true);
    try {
      // Straight to Blob storage, so phone-sized photos aren't capped by the
      // 4.5 MB serverless body limit.
      const blob = await upload(`recipes/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
      });
      setImageUrl(blob.url);
    } catch {
      setError(
        "Photo upload failed. Check that BLOB_READ_WRITE_TOKEN is set for this environment."
      );
    } finally {
      setUploading(false);
    }
  }

  function numberOrNull(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? Math.round(parsed) : null;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      ingredients: ingredients
        .filter((row) => row.item.trim())
        .map((row) => ({
          amount: row.amount.trim() || null,
          unit: row.unit.trim() || null,
          item: row.item.trim(),
        })),
      steps: steps.map((step) => step.trim()).filter(Boolean),
      servings: numberOrNull(servings),
      prepMinutes: numberOrNull(prepMinutes),
      cookMinutes: numberOrNull(cookMinutes),
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      imageUrl: imageUrl || null,
      sourceName: sourceName.trim() || null,
      sourceUrl: sourceUrl.trim() || null,
      notes: notes.trim() || null,
    };

    if (!payload.title) return setError("A title is required.");
    if (payload.ingredients.length === 0)
      return setError("Add at least one ingredient.");
    if (payload.steps.length === 0) return setError("Add at least one step.");

    setSaving(true);
    const response = await fetch(
      editing ? `/api/recipes/${recipe!.slug}` : "/api/recipes",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setSaving(false);
      setError(body?.error ?? "Could not save the recipe.");
      return;
    }

    const saved = (await response.json()) as SerializedRecipe;
    router.push(`/recipes/${saved.slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            className="field"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Šaltibarščiai"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="description">
            Short description
          </label>
          <textarea
            id="description"
            className="field"
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Cold beetroot soup for hot days."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="servings">
              Servings
            </label>
            <input
              id="servings"
              className="field"
              inputMode="numeric"
              value={servings}
              onChange={(event) => setServings(event.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="prep">
              Prep (min, optional)
            </label>
            <input
              id="prep"
              className="field"
              inputMode="numeric"
              value={prepMinutes}
              onChange={(event) => setPrepMinutes(event.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="cook">
              Cook (min, optional)
            </label>
            <input
              id="cook"
              className="field"
              inputMode="numeric"
              value={cookMinutes}
              onChange={(event) => setCookMinutes(event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="tags">
            Tags (comma separated)
          </label>
          <input
            id="tags"
            className="field"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="soup, lithuanian, summer"
          />
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Ingredients</h2>
        {ingredients.map((row, index) => (
          <div key={index} className="flex gap-2">
            <input
              className="field w-20"
              placeholder="500"
              aria-label="Amount"
              value={row.amount}
              onChange={(event) =>
                setIngredients((rows) =>
                  rows.map((r, i) =>
                    i === index ? { ...r, amount: event.target.value } : r
                  )
                )
              }
            />
            <select
              className="field w-24"
              aria-label="Unit"
              value={row.customUnit ? "custom" : row.unit}
              onChange={(event) => {
                const value = event.target.value;
                setIngredients((rows) =>
                  rows.map((r, i) =>
                    i === index
                      ? value === "custom"
                        ? { ...r, unit: "", customUnit: true }
                        : { ...r, unit: value, customUnit: false }
                      : r
                  )
                );
              }}
            >
              <option value="">no unit</option>
              {MEASUREMENT_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
              <option value="custom">custom…</option>
            </select>
            {row.customUnit && (
              <input
                className="field w-24"
                placeholder="handful"
                aria-label="Custom unit"
                value={row.unit}
                onChange={(event) =>
                  setIngredients((rows) =>
                    rows.map((r, i) =>
                      i === index ? { ...r, unit: event.target.value } : r
                    )
                  )
                }
              />
            )}
            <input
              className="field flex-1"
              placeholder="kefir"
              aria-label="Ingredient"
              value={row.item}
              onChange={(event) =>
                setIngredients((rows) =>
                  rows.map((r, i) =>
                    i === index ? { ...r, item: event.target.value } : r
                  )
                )
              }
            />
            <button
              type="button"
              aria-label="Remove ingredient"
              onClick={() =>
                setIngredients((rows) =>
                  rows.length === 1
                    ? [{ ...emptyRow }]
                    : rows.filter((_, i) => i !== index)
                )
              }
              className="px-2 text-muted hover:text-accent"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setIngredients((rows) => [...rows, { ...emptyRow }])}
          className="text-sm text-accent hover:underline"
        >
          + Add ingredient
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Method</h2>
        {steps.map((step, index) => (
          <div key={index} className="flex gap-2">
            <span className="mt-2 w-5 shrink-0 text-sm text-muted">
              {index + 1}.
            </span>
            <textarea
              className="field flex-1"
              rows={2}
              aria-label={`Step ${index + 1}`}
              value={step}
              onChange={(event) =>
                setSteps((all) =>
                  all.map((s, i) => (i === index ? event.target.value : s))
                )
              }
            />
            <button
              type="button"
              aria-label="Remove step"
              onClick={() =>
                setSteps((all) =>
                  all.length === 1 ? [""] : all.filter((_, i) => i !== index)
                )
              }
              className="px-2 text-muted hover:text-accent"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSteps((all) => [...all, ""])}
          className="text-sm text-accent hover:underline"
        >
          + Add step
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Photo</h2>
        {imageUrl && (
          <div className="relative aspect-[16/9] w-full max-w-md overflow-hidden rounded-lg border border-line">
            <Image src={imageUrl} alt="" fill sizes="400px" className="object-cover" />
          </div>
        )}
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            aria-label="Recipe photo"
            className="text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:text-accent"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handlePhoto(file);
            }}
          />
          {uploading && (
            <span role="status" className="text-sm text-muted">
              Uploading…
            </span>
          )}
          {imageUrl && !uploading && (
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="text-sm text-muted hover:text-accent"
            >
              Remove
            </button>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl">Source &amp; notes</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="sourceName">
              Where it came from
            </label>
            <input
              id="sourceName"
              className="field"
              value={sourceName}
              onChange={(event) => setSourceName(event.target.value)}
              placeholder="Ugnė's grandmother"
            />
          </div>
          <div>
            <label className="label" htmlFor="sourceUrl">
              Link (optional)
            </label>
            <input
              id="sourceUrl"
              className="field"
              type="url"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://…"
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            className="field"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Halved the dill last time — better."
          />
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-accent bg-accent-soft px-4 py-3 text-sm text-accent"
        >
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded-lg bg-accent px-5 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : editing ? "Save changes" : "Add recipe"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-muted hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
