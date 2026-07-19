import { getBearerToken, json, type Env } from '../_lib';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const token = getBearerToken(request);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  return json({ ok: true });
};
