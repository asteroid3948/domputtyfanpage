import { failure, isSameOrigin, json, readSession } from './_lib.js';

export async function onRequestPost({ request, env }) {
  if (!isSameOrigin(request)) return failure('Request origin is not allowed.', 403);
  const user = await readSession(request, env);
  if (!user) return failure('Sign in before saving a score.', 401);

  let body;
  try { body = await request.json(); } catch { return failure('Send a valid JSON request.'); }
  const score = body.score;
  if (!Number.isSafeInteger(score) || score < 0 || score > 1000000) return failure('Score must be a whole number from 0 to 1,000,000.');

  await env.DB.prepare(
    `INSERT INTO scores (user_id, best_score, updated_at) VALUES (?, ?, unixepoch())
     ON CONFLICT(user_id) DO UPDATE SET best_score = MAX(scores.best_score, excluded.best_score), updated_at = unixepoch()`
  ).bind(user.id, score).run();
  const saved = await env.DB.prepare('SELECT best_score FROM scores WHERE user_id = ?').bind(user.id).first();
  return json({ score: saved.best_score });
}
