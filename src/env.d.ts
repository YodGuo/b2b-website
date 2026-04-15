/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface NotificationMessage {
  type: 'inquiry' | 'comment';
  data: Record<string, unknown>;
  createdAt: string;
  retryCount?: number;
}

interface Env {
  // Cloudflare bindings
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  SESSION: KVNamespace;

  // Cloudflare Queue - 通知队列
  NOTIFICATION_QUEUE: Queue<NotificationMessage>;

  // Secrets - Better Auth
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;

  // Secrets - 邮件通知
  RESEND_API_KEY: string;
  ADMIN_EMAIL: string;

  // Secrets - 即时通讯通知
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  WECOM_WEBHOOK_URL: string;

  // Secrets - R2存储
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_ACCOUNT_ID: string;
  R2_BUCKET: string;

  // Secrets - Turnstile人机验证
  TURNSTILE_SECRET_KEY: string;

  // Secrets - Cron 备份鉴权
  CRON_SECRET: string;

  // Public vars
  TURNSTILE_SITE_KEY: string;
  PUBLIC_SITE_URL: string;
  CMS_SITE_URL: string;
  R2_PUBLIC_DOMAIN: string;
}

declare namespace App {
  interface Locals {
    runtime: {
      env: Env;
    };
  }
}
