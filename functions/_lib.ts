// Utilitaires partagés par les Pages Functions.
// Le préfixe "_" exclut ce fichier du routage (ce n'est pas une route API).

export interface Env {
  DB: D1Database;
}

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 jours

export const json = (data: unknown, init?: number | ResponseInit): Response => {
  const responseInit: ResponseInit = typeof init === 'number' ? { status: init } : init ?? {};
  return new Response(JSON.stringify(data), {
    ...responseInit,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...(responseInit.headers ?? {}) },
  });
};

export const sha256Hex = async (text: string): Promise<string> => {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/** Comparaison en temps constant pour limiter les attaques par mesure de temps. */
export const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

export const getBearerToken = (request: Request): string | null => {
  const header = request.headers.get('Authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1] : null;
};

/**
 * Vérifie la session. Retourne le token si valide, ou une Response 401 sinon.
 * Le point d'appel doit faire : `const s = await requireSession(...); if (s instanceof Response) return s;`
 */
export const requireSession = async (request: Request, env: Env): Promise<string | Response> => {
  const token = getBearerToken(request);
  if (!token) return json({ error: 'Authentification requise' }, 401);

  const row = await env.DB.prepare('SELECT expires_at FROM sessions WHERE token = ?')
    .bind(token)
    .first<{ expires_at: string }>();

  if (!row) return json({ error: 'Session invalide ou expirée' }, 401);
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return json({ error: 'Session invalide ou expirée' }, 401);
  }
  return token;
};

export const createSession = async (env: Env): Promise<string> => {
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, '');
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DURATION_MS);
  await env.DB.prepare('INSERT INTO sessions (token, created_at, expires_at) VALUES (?, ?, ?)')
    .bind(token, now.toISOString(), expires.toISOString())
    .run();
  return token;
};

export interface AdminRow {
  username: string;
  password_hash: string;
}

export const getAdmin = async (env: Env): Promise<AdminRow> => {
  const row = await env.DB.prepare('SELECT username, password_hash FROM admin WHERE id = 1').first<AdminRow>();
  if (row) return row;
  // Filet de sécurité si la migration n'a pas encore tourné : admin / Syzon@2025
  const fallback: AdminRow = {
    username: 'admin',
    password_hash: 'bebd615fff73c8e9c65de9544cf9ab62b3b5e1e8a09353fa4155fbf1ad763f4f',
  };
  await env.DB.prepare(
    'INSERT OR IGNORE INTO admin (id, username, password_hash) VALUES (1, ?, ?)',
  ).bind(fallback.username, fallback.password_hash).run();
  return fallback;
};
