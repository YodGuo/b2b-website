import type { APIRoute } from 'astro';
import { createAuth } from '../../../lib/auth';

/**
 * Better Auth catch-all handler
 * 处理所有 /api/auth/* 请求（登录、注销、session 等）
 */
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const db = Astro.locals.runtime?.env?.DB;
  if (!db) {
    return new Response('Database not available', { status: 503 });
  }
  const auth = createAuth(db);
  return auth.handler(request);
};

export const POST: APIRoute = async ({ request }) => {
  const db = Astro.locals.runtime?.env?.DB;
  if (!db) {
    return new Response('Database not available', { status: 503 });
  }
  const auth = createAuth(db);
  return auth.handler(request);
};
