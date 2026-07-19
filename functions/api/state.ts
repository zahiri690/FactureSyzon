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

  let parsed: Record<string, unknown>;
  try {
    parsed = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'JSON invalide' }, 400);
  }

  const incomingUpdatedAt = typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null;

  const existing = await env.DB.prepare('SELECT updated_at FROM app_state WHERE id = 1')
    .first<{ updated_at: string }>();

  if (existing && incomingUpdatedAt && existing.updated_at > incomingUpdatedAt) {
    return json(
      { error: 'Données modifiées depuis un autre appareil', updatedAt: existing.updated_at },
      409,
    );
  }

  const now = new Date().toISOString();
  parsed.updatedAt = now;
  const raw = JSON.stringify(parsed);

  await env.DB.prepare(
    `INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
  ).bind(raw, now).run();

  return json({ ok: true, updatedAt: now });
};
