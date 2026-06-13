# The Arben Group — Writings

A bare, publishing-first site. The front page (`index.html`) is the writing feed:
essays, field notes, and curated research by Ben Harris and Arden Smith. No
marketing funnel, no contact form — just the work.

This is a **separate Cloudflare Pages project** from the main `arben_group_website`
marketing site. It shares the same component CSS and the same admin/backend code,
but stands on its own.

## Structure

| Path | Purpose |
|------|---------|
| `index.html` | The public writing feed (front page) |
| `admin/` | Password-gated publishing panel (`/admin`) |
| `article.html` | Reader page for body-type entries |
| `functions/api/` | Cloudflare Pages Functions — entries CRUD + PDF upload |
| `migrations/0001_init.sql` | D1 schema |
| `wrangler.toml` | Bindings (D1 `DB`, R2 `R2`) |
| `styles.css` `assets/` | Shared design system |

## Data layer — pick one before deploying

`wrangler.toml` currently points at the **same D1 database and R2 bucket** as the
original site (`arben-insights` / `arben-assets`). That means anything published
here also appears on the original site's `/insights`, and vice-versa.

- **Share content (default):** leave `wrangler.toml` as-is. Works immediately with
  whatever is already published.
- **Independent content:** create a fresh D1 + R2 and swap the ids:
  ```bash
  npx wrangler d1 create arben-writings
  npx wrangler r2 bucket create arben-writings-assets
  # paste the new database_id / bucket_name into wrangler.toml
  npx wrangler d1 execute arben-writings --file=migrations/0001_init.sql
  ```

## Deploy

1. Create the GitHub repo and push:
   ```bash
   gh repo create arben_group_writings --public --source=. --remote=origin --push
   ```
2. In the Cloudflare dashboard → **Pages → Create → Connect to Git** → pick this repo.
   - Build command: *(none)*
   - Output directory: `/`
3. Add the bindings under **Settings → Functions**: D1 (`DB`) and R2 (`R2`),
   matching `wrangler.toml`.
4. Set the admin password secret used by `functions/api/`:
   ```bash
   npx wrangler pages secret put ADMIN_PASSWORD --project-name arben-writings
   ```
   (Check `functions/api/entries.js` for the exact env var name.)

Once deployed, the site is at `arben-writings.pages.dev` (or your custom domain),
and publishing happens at `/admin`.
