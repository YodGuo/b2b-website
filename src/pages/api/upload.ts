import type { APIRoute } from 'astro';
import { generatePresignedUploadUrl, validateFileType, isRefererAllowed } from '../../lib/storage/r2';
import { verifyTurnstile } from '../../lib/turnstile';

export const POST: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;

  try {
    // ========== Turnstile 人机验证 ==========
    const body = await request.json();
    const { filename, contentType, cfTurnstileToken } = body;

    if (!cfTurnstileToken) {
      return new Response(JSON.stringify({ error: 'Missing CAPTCHA token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const ip = request.headers.get('CF-Connecting-IP') || '';
    const turnstileResult = await verifyTurnstile(
      cfTurnstileToken,
      env.TURNSTILE_SECRET_KEY,
      ip
    );

    if (!turnstileResult.success) {
      return new Response(JSON.stringify({ error: 'CAPTCHA verification failed', detail: turnstileResult.error }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ========== 防盗链校验（双重保障） ==========
    const referer = request.headers.get('Referer');
    if (!isRefererAllowed(referer)) {
      return new Response(JSON.stringify({ error: '非法来源，不允许上传' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!filename || !contentType) {
      return new Response(JSON.stringify({ error: '缺少文件名或文件类型' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 验证文件类型
    if (!validateFileType(contentType)) {
      return new Response(JSON.stringify({ error: '不支持的文件类型' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 生成presigned URL
    const result = await generatePresignedUploadUrl(env, {
      filename,
      contentType,
      maxSizeBytes: 10 * 1024 * 1024 // 10MB
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
