import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import pagefind from 'astro-pagefind';

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://yourdomain.com',
  // Astro 5: output 默认为 "static"，SSR 页面通过 export const prerender = false 控制
  adapter: cloudflare({
    imageService: 'cloudflare',
    runtime: {
      mode: 'advanced'  // 使用 Cloudflare Worker 模式（非 Pages）
    },
    platformProxy: {
      enabled: true,
      persist: { path: './.cache/wrangler/v3' }
    },
    routes: {
      extend: {
        include: [
          { pattern: '/api/*' },
          { pattern: '/contact' },
          { pattern: '/admin/*' },
          { pattern: '/keystatic/*' },
        ]
      }
    }
  }),
  integrations: [
    react(),
    tailwind(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
        },
      },
      filter: (page) => !page.includes('/admin') && !page.includes('/api') && !page.includes('/keystatic'),
    }),
    markdoc(),
    keystatic(),
    pagefind(),
  ],
  vite: {
    ssr: {
      external: [
        'resend',
        'better-auth',
        '@better-auth/drizzle-adapter',
        '@better-auth/core',
        'drizzle-orm',
      ]
    },
    build: {
      rollupOptions: {
        external: [
          '/pagefind/pagefind.js',
          '/pagefind/pagefind-entry.json',
          'better-auth',
          '@better-auth/drizzle-adapter',
          '@better-auth/core',
          'drizzle-orm',
        ]
      }
    }
  }
});
