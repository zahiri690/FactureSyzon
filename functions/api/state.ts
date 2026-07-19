import { json, requireSession, type Env } from '../_lib';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const session = await requireSession(request, env);
  if (session instanceof Response) return session;

  const row = await env.DB.prepare('SELECT data FROM app_state WHERE id = 1').first<{ data: string }>();
  if (!row) return json(null);
  return new Response(row.data, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const session = await requireSession(request, env);
  if (session instanceof Response) return session;

  let raw: string;
  try {
    const parsed: unknown = await request.json();
    raw = JSON.stringify(parsed);
  } catch {
    return json({ error: 'JSON invalide' }, 400);
  }

  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
  ).bind(raw, now).run();

  return json({ ok: true });
};
