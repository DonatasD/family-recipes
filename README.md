# Don & Ugnė's Recipes

A private recipe site for two people. Recipes can be added through the website
or uploaded over a JSON API.

- **Stack** — Next.js 16 (App Router) · React 19 · Tailwind v4 · Prisma 7 · Postgres (Neon) · Vercel Blob
- **Access** — every page and endpoint requires a signed-in account. There is no
  public view and no signup route; accounts are created from the command line.

## Requirements

Node 22.12 or newer (Prisma 7 needs it). The repo pins a version in `.nvmrc`:

```bash
nvm use
```

## Setup

```bash
npm install
cp .env.example .env      # then fill in the values below
npm run db:push           # create the tables
npm run user:add -- --email you@example.com --name "Your name"
npm run dev               # http://localhost:3000
```

`user:add` prints a generated password and an API token. It is the only time
they are shown — put both in a password manager. Run it once per person; adding
an email that already exists resets that password but keeps the API token.

### Environment variables

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** connection string — used by the running app |
| `DIRECT_URL` | Neon **direct** connection string — used by `db:push` and migrations |
| `AUTH_SECRET` | Signs the session cookie. `openssl rand -base64 32` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for photos. Set automatically on Vercel; only needed locally |

Both Neon strings are in the Neon dashboard under **Connection string** — one
with `-pooler` in the host, one without.

### Running against a local database instead

Handy for offline work; a container is already set up on this machine:

```bash
docker start recipes-pg
# or, to recreate it:
docker run -d --name recipes-pg -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=recipes -p 55432:5432 postgres:17-alpine
```

Then point both `DATABASE_URL` and `DIRECT_URL` at
`postgresql://postgres:devpass@localhost:55432/recipes`.

## Deploying to Vercel

1. Push the repo to GitHub and import it in Vercel.
2. **Storage → Neon** — create or connect the database. Vercel injects
   `DATABASE_URL`; add `DIRECT_URL` manually from the Neon dashboard.
3. **Storage → Blob** — create a store. `BLOB_READ_WRITE_TOKEN` is injected.
4. Add `AUTH_SECRET` under **Settings → Environment Variables**.
5. Deploy. Then create the tables against production:

   ```bash
   DATABASE_URL=… DIRECT_URL=… npm run db:push
   DATABASE_URL=… DIRECT_URL=… npm run user:add -- --email … --name …
   ```

`prisma generate` runs on `postinstall` and again in `build`, so no extra build
command is needed.

## The API

Every endpoint accepts either your personal API token or a browser session
cookie. The token is on the **Settings** page, and can be regenerated there.

```bash
export SITE=https://your-site.vercel.app
export TOKEN=rcp_…
```

### Add a recipe

```bash
curl -X POST "$SITE/api/recipes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Šaltibarščiai",
    "description": "Cold beetroot soup for hot days.",
    "servings": 4,
    "prepMinutes": 15,
    "cookMinutes": 0,
    "tags": ["soup", "lithuanian"],
    "ingredients": [
      { "amount": "500", "unit": "ml", "item": "kefir" },
      "1 cucumber, grated"
    ],
    "steps": [
      "Grate the beetroot and cucumber.",
      "Stir everything together and chill."
    ],
    "sourceName": "Ugnė'\''s grandmother",
    "sourceUrl": null,
    "notes": "Better the next day."
  }'
```

Only `title`, `ingredients`, and `steps` are required. An ingredient can be an
object or a plain string. Tags are lower-cased and de-duplicated. The response
is the saved recipe, including the `slug` its page lives at.

### Everything else

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/recipes` | `?q=` searches title, description, notes and tags. Also `?tag=`, `?limit=` (max 100), `?offset=` |
| `POST` | `/api/recipes` | Add a recipe |
| `GET` | `/api/recipes/:idOrSlug` | Fetch one |
| `PATCH` | `/api/recipes/:idOrSlug` | Any subset of fields. Changing the title changes the slug |
| `DELETE` | `/api/recipes/:idOrSlug` | Returns `204` |
| `POST` | `/api/recipes/:idOrSlug/photo` | `multipart/form-data`, field `file`, max 4 MB |
| `PUT` | `/api/recipes/:idOrSlug/rating` | `{"stars": 1-5, "favorite": true}` — one rating per person |
| `DELETE` | `/api/recipes/:idOrSlug/rating` | Remove your rating |

Errors come back as `{"error": "…"}`, with `422` responses adding
`{"details": {"field": "message"}}`.

### Attaching a photo

```bash
curl -X POST "$SITE/api/recipes/saltibarsciai/photo" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@dinner.jpg"
```

Vercel caps serverless request bodies at 4.5 MB, so this endpoint rejects
anything over 4 MB. The website is not affected — it uploads straight to Blob
storage and handles phone-sized photos.

## MCP

The site is also a [Model Context Protocol](https://modelcontextprotocol.io)
server at `/api/mcp` (Streamable HTTP), so an agent can search, add, and edit
recipes with the same personal API token the REST API uses:

```json
{
  "mcpServers": {
    "recipes": {
      "url": "https://your-site.vercel.app/api/mcp",
      "headers": { "Authorization": "Bearer rcp_…" }
    }
  }
}
```

Clients that only speak stdio can bridge with
[`mcp-remote`](https://www.npmjs.com/package/mcp-remote):

```json
{
  "mcpServers": {
    "recipes": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote", "https://your-site.vercel.app/api/mcp",
        "--header", "Authorization: Bearer rcp_…"
      ]
    }
  }
}
```

Tools: `list_recipes`, `get_recipe`, `create_recipe`, `update_recipe`,
`delete_recipe`. There is no OAuth flow — only the bearer token — so clients
that insist on OAuth for remote servers can't connect yet.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:push` | Apply `prisma/schema.prisma` to the database |
| `npm run db:studio` | Browse the data in Prisma Studio |
| `npm run user:add` | Create or update an account |

## Layout

```
app/
  page.tsx                    recipe list, search and tag filter
  login/                      sign-in page
  settings/                   API token and endpoint reference
  recipes/new/                add form
  recipes/[slug]/             recipe page, and /edit
  api/                        JSON API
components/                   form, card, rating, small client bits
lib/
  auth.ts                     bearer token + session resolution
  session.ts                  JWT cookie signing
  recipes.ts                  Zod schemas, slugs, serializer
  mcp.ts                      MCP server tools (served at api/mcp)
  db.ts                       Prisma client
prisma/schema.prisma          data model
scripts/create-user.ts        account creation
```
