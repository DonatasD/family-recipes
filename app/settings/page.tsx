import ApiTokenPanel from "@/components/ApiTokenPanel";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guard";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser("/settings");

  const { apiToken } = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { apiToken: true },
  });

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="font-display text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Signed in as {user.name} ({user.email})
        </p>
      </div>

      <ApiTokenPanel initialToken={apiToken} />

      <section className="space-y-4">
        <h2 className="font-display text-xl">Uploading recipes via the API</h2>
        <p className="text-sm text-muted">
          Send your token as a bearer header. Every endpoint below accepts either
          the token or your browser session.
        </p>

        <pre className="overflow-x-auto rounded-xl border border-line bg-card p-4 text-xs leading-relaxed">
{`curl -X POST "$SITE/api/recipes" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Šaltibarščiai",
    "description": "Cold beetroot soup for hot days.",
    "servings": 4,
    "prepMinutes": 15,
    "tags": ["soup", "lithuanian"],
    "ingredients": [
      { "amount": "500", "unit": "ml", "item": "kefir" },
      "1 cucumber, grated"
    ],
    "steps": [
      "Grate the beetroot and cucumber.",
      "Stir everything together and chill."
    ],
    "sourceName": "Ugnė's grandmother",
    "notes": "Better the next day."
  }'`}
        </pre>

        <div className="space-y-2 text-sm">
          <Endpoint method="GET" path="/api/recipes?q=&tag=&limit=&offset=">
            List and search recipes
          </Endpoint>
          <Endpoint method="POST" path="/api/recipes">
            Add a recipe
          </Endpoint>
          <Endpoint method="GET" path="/api/recipes/:idOrSlug">
            Fetch one recipe
          </Endpoint>
          <Endpoint method="PATCH" path="/api/recipes/:idOrSlug">
            Update any subset of fields
          </Endpoint>
          <Endpoint method="DELETE" path="/api/recipes/:idOrSlug">
            Delete a recipe
          </Endpoint>
          <Endpoint method="POST" path="/api/recipes/:idOrSlug/photo">
            Attach a photo (multipart, field <code>file</code>, max 4 MB)
          </Endpoint>
          <Endpoint method="PUT" path="/api/recipes/:idOrSlug/rating">
            Set your <code>stars</code> (1-5) and/or <code>favorite</code>
          </Endpoint>
        </div>
      </section>
    </div>
  );
}

function Endpoint({
  method,
  path,
  children,
}: {
  method: string;
  path: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 border-b border-line pb-2">
      <span className="w-16 shrink-0 font-mono text-xs font-semibold text-accent">
        {method}
      </span>
      <code className="text-xs">{path}</code>
      <span className="text-xs text-muted">{children}</span>
    </div>
  );
}
