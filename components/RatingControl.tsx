"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RatingControl({
  slug,
  initialStars,
  initialFavorite,
}: {
  slug: string;
  initialStars: number | null;
  initialFavorite: boolean;
}) {
  const router = useRouter();
  const [stars, setStars] = useState(initialStars);
  const [favorite, setFavorite] = useState(initialFavorite);
  const [error, setError] = useState<string | null>(null);

  async function save(next: { stars?: number; favorite?: boolean }) {
    setError(null);
    const response = await fetch(`/api/recipes/${slug}/rating`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!response.ok) {
      setError("Could not save that just now.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-1" role="group" aria-label="Rate this recipe">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
            aria-pressed={stars !== null && value <= stars}
            onClick={() => {
              setStars(value);
              save({ stars: value });
            }}
            className={`text-2xl leading-none transition ${
              stars !== null && value <= stars
                ? "text-accent"
                : "text-line hover:text-accent"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <button
        type="button"
        aria-pressed={favorite}
        onClick={() => {
          const next = !favorite;
          setFavorite(next);
          save({ favorite: next });
        }}
        className={`rounded-full border px-3 py-1 text-sm ${
          favorite
            ? "border-accent bg-accent-soft text-accent"
            : "border-line text-muted hover:border-accent hover:text-accent"
        }`}
      >
        {favorite ? "♥ A keeper" : "♡ Mark as keeper"}
      </button>

      {error && (
        <span role="alert" className="text-sm text-accent">
          {error}
        </span>
      )}
    </div>
  );
}
