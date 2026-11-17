import { failure, isSameOrigin, json, readSession, sessionCookie, sha256 } from '../_lib.js';

export async function onRequestGet({ request, env }) {
  const user = await readSession(request, env);
  return json({ username: user?.username || null });
}

export async function onRequestPost({ request, env }) {
  if (!isSameOrigin(request)) return failure('Request origin is not allowed.', 403);
  const cookie = request.headers.get('Cookie') || '';
  const token = cookie.split(';').map(part => part.trim()).find(part => part.startsWith('bennet_session='))?.slice('bennet_session='.length);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
}
