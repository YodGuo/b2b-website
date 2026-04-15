import type { APIRoute } from 'astro';

// SSR 端点，不预渲染
export const prerender = false;

/**
 * D1 数据库自动备份端点
 * 由 Cloudflare Cron Trigger 每天凌晨 3 点 (UTC) 自动调用
 * 也可手动触发: curl -H "Authorization: Bearer $CRON_SECRET" https://cms.xxxx.com/api/cron/backup
 *
 * 备份策略:
 * - 导出 inquiries + comments 全量数据
 * - 上传到 R2: backups/d1-YYYY-MM-DD.json
 * - 自动清理 30 天前的备份
 */
export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;

  // ========== 鉴权: Bearer Token ==========
  const auth = request.headers.get('Authorization');
  if (!auth || auth !== `Bearer ${env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // ========== 导出 D1 数据 ==========
    const [inquiriesResult, commentsResult] = await Promise.all([
      env.DB.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all(),
      env.DB.prepare('SELECT * FROM comments ORDER BY created_at DESC').all(),
    ]);

    const backup = {
      version: 1,
      date: new Date().toISOString(),
      tables: {
        inquiries: inquiriesResult.results,
        comments: commentsResult.results,
      },
      stats: {
        inquiries_count: inquiriesResult.results?.length || 0,
        comments_count: commentsResult.results?.length || 0,
      },
    };

    const backupJson = JSON.stringify(backup, null, 2);
    const today = new Date().toISOString().split('T')[0];
    const backupKey = `backups/d1-${today}.json`;

    // ========== 上传到 R2 ==========
    await env.MEDIA_BUCKET.put(backupKey, backupJson, {
      httpMetadata: {
        contentType: 'application/json',
      },
      customMetadata: {
        backupDate: today,
        version: '1',
      },
    });

    // ========== 清理 30 天前的备份 ==========
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];

    try {
      const listed = await env.MEDIA_BUCKET.list({ prefix: 'backups/d1-' });
      for (const object of listed.objects) {
        // 从 key 中提取日期: backups/d1-2025-01-15.json
        const match = object.key.match(/backups\/d1-(\d{4}-\d{2}-\d{2})\.json/);
        if (match && match[1] < cutoffDate) {
          await env.MEDIA_BUCKET.delete(object.key);
          console.log(`[Backup] Cleaned up old backup: ${object.key}`);
        }
      }
    } catch (cleanupError) {
      // 清理失败不影响备份成功
      console.warn('[Backup] Cleanup failed (non-critical):', cleanupError);
    }

    console.log(`[Backup] Completed: ${backupKey} (${backupJson.length} bytes)`);

    return new Response(JSON.stringify({
      success: true,
      backupKey,
      stats: backup.stats,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Backup] Failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
