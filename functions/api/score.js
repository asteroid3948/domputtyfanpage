import { failure, isSameOrigin, json } from './_lib.js';

const cleanName = value => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';

export async function onRequestPost({ request, env }) {
  if (!isSameOrigin(request)) return failure('Request origin is not allowed.', 403);

  let body;
  try { body = await request.json(); } catch { return failure('Send a valid JSON request.'); }

  const firstName = cleanName(body.firstName);
  const lastName = cleanName(body.lastName);
  const score = body.score;
  const validName = /^[\p{L}][\p{L}'-]{0,29}$/u;

  if (!validName.test(firstName) || !validName.test(lastName)) {
    return failure('Enter a valid first and last name (letters, apostrophes, or hyphens; up to 30 characters each).');
  }
  if (!Number.isSafeInteger(score) || score < 0 || score > 1000000) {
    return failure('Score must be a whole number from 0 to 1,000,000.');
  }

  const normalizedName = `${firstName} ${lastName}`.normalize('NFKC').toLocaleLowerCase('en-US');
  const existing = await env.DB.prepare('SELECT best_score FROM public_scores WHERE normalized_name = ?')
    .bind(normalizedName).first();
  const updated = !existing || score > existing.best_score;

  await env.DB.prepare(
    `INSERT INTO public_scores (normalized_name, first_name, last_name, best_score, updated_at)
     VALUES (?, ?, ?, ?, unixepoch())
     ON CONFLICT(normalized_name) DO UPDATE SET
       best_score = MAX(public_scores.best_score, excluded.best_score),
       updated_at = CASE WHEN excluded.best_score > public_scores.best_score THEN unixepoch() ELSE public_scores.updated_at END`
  ).bind(normalizedName, firstName, lastName, score).run();

  return json({ saved: true, updated });
}
