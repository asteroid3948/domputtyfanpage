import { json } from './_lib.js';

export async function onRequestGet({ env }) {
  const result = await env.DB.prepare(
    `SELECT first_name, last_name, best_score AS score FROM public_scores
     ORDER BY best_score DESC, normalized_name ASC LIMIT 10`
  ).all();
  return json({ entries: result.results || [] }, 200, { 'cache-control': 'public, max-age=30' });
}
