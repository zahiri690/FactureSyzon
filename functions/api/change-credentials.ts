import { getAdmin, json, requireSession, sha256Hex, timingSafeEqual, type Env } from '../_lib';

interface ChangeBody {
  currentPassword?: string;
  newUsername?: string;
  newPassword?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const session = await requireSession(request, env);
  if (session instanceof Response) return session;

  let body: ChangeBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Requête invalide' }, 400);
  }

  const admin = await getAdmin(env);
  const currentHash = await sha256Hex(body.currentPassword ?? '');
  if (!timingSafeEqual(currentHash, admin.password_hash)) {
    return json({ error: 'Mot de passe actuel incorrect' }, 401);
  }

  const username = body.newUsername?.trim() || admin.username;
  const passwordHash = body.newPassword ? await sha256Hex(body.newPassword) : admin.password_hash;

  await env.DB.prepare('UPDATE admin SET username = ?, password_hash = ? WHERE id = 1')
    .bind(username, passwordHash)
    .run();

  return json({ ok: true, username });
};
