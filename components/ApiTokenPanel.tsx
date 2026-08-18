"use client";

import { useState } from "react";

export default function ApiTokenPanel({
  initialToken,
}: {
  initialToken: string;
}) {
  const [token, setToken] = useState(initialToken);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function regenerate() {
    setRegenerating(true);
    const response = await fetch("/api/me/token", { method: "POST" });
    if (response.ok) {
      const body = (await response.json()) as { apiToken: string };
      setToken(body.apiToken);
      setVisible(true);
    }
    setRegenerating(false);
    setConfirming(false);
  }

  async function copy() {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl">Your API token</h2>
      <p className="text-sm text-muted">
        Anyone holding this token can read and change our recipes. Keep it in a
        password manager, not in a shared document.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <code className="flex-1 overflow-x-auto rounded-lg border border-line bg-card px-3 py-2 font-mono text-xs">
          {visible ? token : "•".repeat(32)}
        </code>
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="rounded-lg border border-line px-3 py-2 text-sm hover:border-accent hover:text-accent"
        >
          {visible ? "Hide" : "Show"}
        </button>
        <button
          type="button"
          onClick={copy}
          className="rounded-lg border border-line px-3 py-2 text-sm hover:border-accent hover:text-accent"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {confirming ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted">
            Regenerating stops the old token working anywhere you&rsquo;ve used it.
          </span>
          <button
            type="button"
            onClick={regenerate}
            disabled={regenerating}
            className="rounded-lg bg-accent px-3 py-1.5 text-white disabled:opacity-50"
          >
            {regenerating ? "Working…" : "Regenerate"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-muted hover:text-ink"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-sm text-muted hover:text-accent"
        >
          Regenerate token
        </button>
      )}
    </section>
  );
}
