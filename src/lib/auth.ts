/**
 * Better Auth 配置（D1 + Drizzle ORM）
 *
 * 使用工厂函数模式，因为 Better Auth 实例需要 D1 binding
 * 而 D1 binding 仅在请求处理时可用（locals.runtime.env.DB）
 *
 * 认证方式：email + password
 * Session：数据库存储 + cookie cache（JWE 加密）
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/d1';

export function createAuth(db: D1Database) {
  const d1 = drizzle(db);

  return betterAuth({
    database: drizzleAdapter(d1, {
      provider: 'sqlite',
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 天
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5 分钟 cookie 缓存
        strategy: 'jwe', // JWE 加密
      },
      freshAge: 60 * 60 * 24, // 1 天内 session 视为 fresh
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

/**
 * 服务端获取当前 session
 */
export async function getServerSession(request: Request, db: D1Database) {
  const auth = createAuth(db);
  return auth.api.getSession({
    headers: request.headers,
  });
}

/**
 * 检查是否已认证（管理员）
 */
export async function isAuthenticated(request: Request, db: D1Database): Promise<boolean> {
  const session = await getServerSession(request, db);
  return !!session?.user;
}

/**
 * 创建未认证的重定向响应
 */
export function createUnauthorizedResponse(): Response {
  return new Response(null, {
    status: 302,
    headers: { 'Location': '/admin/login' },
  });
}
