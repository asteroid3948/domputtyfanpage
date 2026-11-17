import { createSession, decodeBase64url, failure, isSameOrigin, json, passwordHash, sessionCookie } from '../_lib.js';

export async function onRequestPost({ request, env }) {
  if (!isSameOrigin(request)) return failure('Request origin is not allowed.', 403);
  let body;
  try { body = await request.json(); } catch { return failure('Send a valid JSON request.'); }
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = body.password;
  if (typeof username !== 'string' || typeof password !== 'string' || password.length > 128) return failure('Invalid username or password.', 400);

  const user = await env.DB.prepare('SELECT id, username, password_hash, password_salt FROM users WHERE username = ? COLLATE NOCASE')
    .bind(username).first();
  if (!user) return failure('Username or password is incorrect.', 401);
  const salt = Uint8Array.from(user.password_salt.match(/.{2}/g), byte => parseInt(byte, 16));
  const candidate = await passwordHash(password, salt);
  const expected = decodeBase64url(user.password_hash);
  const actual = decodeBase64url(candidate);
  let mismatch = expected.length ^ actual.length;
  for (let i = 0; i < Math.max(expected.length, actual.length); i++) mismatch |= (expected[i] || 0) ^ (actual[i] || 0);
  if (mismatch !== 0) return failure('Username or password is incorrect.', 401);

  const token = await createSession(user.id, env);
  return json({ username: user.username }, 200, { 'set-cookie': sessionCookie(token) });
}
