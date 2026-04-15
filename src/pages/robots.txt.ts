import type { APIRoute } from 'astro';

/**
 * 动态 robots.txt
 * 使用 Astro.site 获取实际域名，避免硬编码占位符
 */
export const GET: APIRoute = ({ site }) => {
  const siteUrl = site?.toString().replace(/\/$/, '') || 'https://yourdomain.com';

  const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${siteUrl}/sitemap-index.xml

# Disallow admin, API and CMS routes
Disallow: /admin/
Disallow: /api/
Disallow: /keystatic/
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
