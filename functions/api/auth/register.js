import { createSession, failure, isSameOrigin, json, passwordHash, randomToken, sessionCookie, validCredentials } from '../_lib.js';

export async function onRequestPost({ request, env }) {
  if (!isSameOrigin(request)) return failure('Request origin is not allowed.', 403);
  let body;
  try { body = await request.json(); } catch { return failure('Send a valid JSON request.'); }
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = body.password;
  if (!validCredentials(username, password)) return failure('Username must be 3–20 letters, numbers, or underscores; password must be 10–128 characters.');

  const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').bind(username).first();
  if (existing) return failure('That username is already taken.', 409);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltText = Array.from(salt, byte => byte.toString(16).padStart(2, '0')).join('');
  const hash = await passwordHash(password, salt);
  let result;
  try {
    result = await env.DB.prepare('INSERT INTO users (username, password_hash, password_salt) VALUES (?, ?, ?)')
      .bind(username, hash, saltText).run();
  } catch {
    return failure('Could not create account. The username may already be in use.', 409);
  }
  const token = await createSession(result.meta.last_row_id, env);
  return json({ username }, 201, { 'set-cookie': sessionCookie(token) });
}
