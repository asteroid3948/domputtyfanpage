# Cloudflare Pages setup

This repository is a static HTML site with Pages Functions for a shared leaderboard. Scores are tracked in the visitor's browser and can be submitted by first and last name; no password or account is required. The server stores one best-score row per normalized full name in Cloudflare D1.

## Pages deployment

1. Connect `asteroid3948/domputtyfanpage` to Cloudflare Pages and deploy the `main` branch.
2. This is a plain static site: use no framework preset, leave the build command empty, and set the output directory to `/` (repository root).
3. In the Pages project settings, add a D1 database binding named exactly `DB` and select your database (for example `leaderboard`). Configure Production and Preview if both are used, then redeploy.

## Database setup

The existing database contains the account tables from an earlier version. To add the name-only leaderboard table, run just this SQL in the same D1 database Console (safe to run more than once):

```sql
CREATE TABLE IF NOT EXISTS public_scores (
  normalized_name TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  best_score INTEGER NOT NULL DEFAULT 0 CHECK(best_score >= 0),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

Alternatively, rerun the updated `schema.sql`; its statements use `IF NOT EXISTS` and preserve existing tables/data.

After redeployment and schema setup, visit `/api/leaderboard`. It should return `{"entries":[]}` if no names have submitted scores yet.

## How scores and names work

Burgers fed and personal best are saved locally in the browser's localStorage. Press **Save score to leaderboard** to submit the current score. First and last names are required. The leaderboard is global and shows the top 10. Names are normalized for case and whitespace, so the same full name cannot create duplicate leaderboard entries; submitting again only raises that name's best score. Anyone can submit a score, so this casual leaderboard is not cheat-proof and should not be used for prizes. Names are public—avoid submitting private information.

The old password-based auth endpoints are no longer used by the page. No password is requested or stored by the name-only leaderboard.
