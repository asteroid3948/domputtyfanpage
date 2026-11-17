# Cloudflare Pages setup

The page is static, but accounts anzd a shared leaderboard need a server-side API and persistent database. The `/functions` directory in this repo supplies Cloudflare Pages Functions; `schema.sql` creates the D1 tables.

## Connect the GitHub repo to Pages

1. In the Cloudflare dashboard, open **Workers & Pages → Create → Pages → Connect to Git** and select `asteroid3948/domputtyfanpage`.
2. Use the `main` branch. This is a plain static site: leave the build command empty and set the build output directory to `/` (the repository root). Do not set a framework preset.
3. Deploy once, then open the Pages project settings.

## Create and bind the D1 database

1. Open **Workers & Pages → D1 SQL Database** and create a database, for example `domputtyfanpage`.
2. In that database's **Console**, run the contents of `schema.sql`.
3. Open the Pages project **Settings → Functions → D1 database bindings**, add a binding named exactly `DB`, and select the database. Save and redeploy.
4. Check the deployed site at `/api/leaderboard`; it should return `{"entries":[]}`. The registration/login functions use D1 and will fail until the `DB` binding and schema are ready.

Pages Functions use Cloudflare's HTTPS origin and set session cookies as `Secure`, `HttpOnly`, and `SameSite=Strict`. Passwords are hashed on the server with PBKDF2-SHA-256 and a unique random salt; the password itself is not stored. Usernames are public on the leaderboard. Ask users not to reuse an important password. For a public launch, add Cloudflare Turnstile or another abuse-prevention/rate-limiting measure to account creation and login.

## Gameplay and leaderboard notes

- Bennet waddles around the viewport. Drag and release to toss him; he says “OW!”. The bottom-right button drops burgers from above. Each collision feeds him, increases the score, and makes him larger.
- Guests can play but their score is only in the current page session. Sign in/create an account to save the best score globally.
- The API stores only each account's best score. Since gameplay runs in a user's browser, scores are not cheat-proof; do not use these scores for prizes or anything security-sensitive without server-authoritative gameplay/validation.
- This project intentionally does not store accounts or scores in browser localStorage. D1 is the shared source of truth.

## Updating

Push changes to `main`; Cloudflare Pages will build and deploy the static files and Functions. If the Functions code changes, redeploy and check **Workers & Pages → your Pages project → Deployments → Functions** for runtime errors.
