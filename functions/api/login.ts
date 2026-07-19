import { createSession, getAdmin, json, sha256Hex, timingSafeEqual, type Env } from '../_lib';

interface LoginBody {
  username?: string;
  password?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: LoginBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Requête invalide' }, 400);
  }

  const username = body.username?.trim() ?? '';
  const password = body.password ?? '';
  if (!username || !password) return json({ error: 'Identifiants requis' }, 400);

  const admin = await getAdmin(env);
  const hash = await sha256Hex(password);

  if (!timingSafeEqual(username, admin.username) || !timingSafeEqual(hash, admin.password_hash)) {
    return json({ error: 'Identifiant ou mot de passe incorrect.' }, 401);
  }

  const token = await createSession(env);
  return json({ token, username: admin.username });
};
