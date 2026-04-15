/**
 * 域名路由中间件
 * xxxx.com → 前台网站（产品、新闻、询价、评论）
 * cms.xxxx.com → 后台（Keystatic CMS + 管理面板）
 *
 * 使用方式:
 *   import { requireCmsHost, requirePublicHost } from '../lib/routing';
 *   const result = requireCmsHost(Astro.request);
 *   if (result) return result; // 返回 404 响应
 */

// CMS域名列表（支持多个，如本地开发时 localhost）
const CMS_HOSTNAMES = ['cms.xxxx.com', 'localhost', '127.0.0.1'];

// 前台域名
const PUBLIC_HOSTNAMES = ['xxxx.com', 'www.xxxx.com'];

/**
 * 判断是否为CMS域名
 */
export function isCmsHost(hostname: string): boolean {
  return CMS_HOSTNAMES.includes(hostname);
}

/**
 * 判断是否为前台域名
 */
export function isPublicHost(hostname: string): boolean {
  return PUBLIC_HOSTNAMES.includes(hostname);
}

/**
 * 获取站点类型
 */
export function getSiteType(hostname: string): 'public' | 'cms' {
  return isCmsHost(hostname) ? 'cms' : 'public';
}

/**
 * CMS域名守卫 - 非CMS域名访问时返回 404（不暴露后台域名）
 * 用于 /admin/* 和 /keystatic/* 路由
 *
 * 安全策略：前台域名访问后台路径时，假装页面不存在，
 * 避免暴露 cms.xxxx.com 域名，实现真正的域名隔离。
 */
export function requireCmsHost(request: Request): Response | null {
  const hostname = new URL(request.url).hostname;

  if (isCmsHost(hostname)) {
    return null; // 允许访问
  }

  // 非CMS域名，返回 404（不暴露后台域名）
  return new Response(
    JSON.stringify({ error: 'Not Found' }),
    {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * 前台域名守卫 - 非前台域名访问时重定向到前台域名
 * 用于公开页面路由（可选使用）
 */
export function requirePublicHost(request: Request): Response | null {
  const hostname = new URL(request.url).hostname;

  if (isPublicHost(hostname)) {
    return null; // 允许访问
  }

  // 非前台域名，重定向到前台域名
  const publicUrl = new URL(request.url);
  publicUrl.hostname = 'xxxx.com';
  publicUrl.protocol = 'https:';

  return Response.redirect(publicUrl.toString(), 301);
}
