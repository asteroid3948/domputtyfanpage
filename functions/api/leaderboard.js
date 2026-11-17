import { json } from './_lib.js';

export async function onRequestGet({ env }) {
  const result = await env.DB.prepare(
    `SELECT users.username, scores.best_score AS score FROM scores
     JOIN users ON users.id = scores.user_id
     ORDER BY scores.best_score DESC, users.username COLLATE NOCASE ASC LIMIT 10`
  ).all();
  return json({ entries: result.results || [] }, 200, { 'cache-control': 'public, max-age=30' });
}
