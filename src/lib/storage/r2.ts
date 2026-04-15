import { AwsClient } from 'aws4fetch';

export interface PresignedUrlResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

/**
 * R2 公开访问域名
 * 开启 Public Access 后绑定自定义域名，直接通过 HTTPS 访问
 * 例如: media.xxxx.com
 */
function getR2PublicUrl(key: string): string {
  const publicDomain = process.env.R2_PUBLIC_DOMAIN || 'media.xxxx.com';
  return `https://${publicDomain}/${key}`;
}

/**
 * 防盗链校验 - 验证 Referer 头
 * 仅允许从 xxxx.com 和 cms.xxxx.com 引用资源
 *
 * 注意：此函数用于 API 层面的校验（如 presigned URL 生成时记录来源）。
 * R2 自定义域的防盗链通过 Cloudflare WAF / Transform Rules 实现。
 */
export function isRefererAllowed(referer: string | null): boolean {
  if (!referer) return false; // 无 Referer 的直接访问默认拒绝

  const allowedOrigins = [
    'https://xxxx.com',
    'https://www.xxxx.com',
    'https://cms.xxxx.com',
    'https://media.xxxx.com',
  ];

  try {
    const refererUrl = new URL(referer);
    return allowedOrigins.some(origin => {
      const originUrl = new URL(origin);
      return refererUrl.hostname === originUrl.hostname;
    });
  } catch {
    return false;
  }
}

/**
 * 生成R2预签名上传URL
 */
export async function generatePresignedUploadUrl(
  env: Env,
  options: {
    filename: string;
    contentType: string;
    maxSizeBytes?: number;
  }
): Promise<PresignedUrlResult> {
  const { filename, contentType } = options;

  // 生成唯一key
  const ext = filename.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const randomId = crypto.randomUUID();
  const key = `uploads/${timestamp}-${randomId}.${ext}`;

  // 创建AWS客户端
  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto'
  });

  // 生成presigned URL
  const r2Url = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${key}`;

  const signedRequest = await client.sign(
    new Request(r2Url, { method: 'PUT' }),
    { aws: { signQuery: true } }
  );

  // 公开访问URL（R2 Public Access + 自定义域名）
  const publicUrl = getR2PublicUrl(key);

  return {
    uploadUrl: signedRequest.url.toString(),
    publicUrl,
    key
  };
}

/**
 * 直接从Worker上传到R2
 */
export async function uploadToR2(
  env: Env,
  key: string,
  body: ArrayBuffer | ReadableStream,
  contentType: string
): Promise<string> {
  await env.MEDIA_BUCKET.put(key, body, {
    httpMetadata: {
      contentType
    }
  });

  return getR2PublicUrl(key);
}

/**
 * 从R2删除文件
 */
export async function deleteFromR2(env: Env, key: string): Promise<boolean> {
  try {
    await env.MEDIA_BUCKET.delete(key);
    return true;
  } catch (error) {
    console.error('Delete from R2 failed:', error);
    return false;
  }
}

/**
 * 获取R2文件
 */
export async function getFromR2(env: Env, key: string): Promise<R2ObjectBody | null> {
  return env.MEDIA_BUCKET.get(key);
}

/**
 * 验证文件类型
 */
export function validateFileType(contentType: string): boolean {
  const allowedTypes = [
    // 图片
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // 文档
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // 压缩文件
    'application/zip',
    'application/x-rar-compressed',
  ];

  return allowedTypes.includes(contentType);
}

/**
 * MIME Magic Bytes 校验
 * 通过文件头部字节验证实际文件类型，防止扩展名伪造
 *
 * 支持的类型:
 * - JPEG: FF D8 FF
 * - PNG: 89 50 4E 47
 * - GIF: 47 49 46 38
 * - WebP: 52 49 46 46 ... 57 45 42 50 (at offset 8)
 * - PDF: 25 50 44 46 (%PDF)
 * - ZIP: 50 4B 03 04 (also used for .docx, .xlsx)
 * - RAR: 52 61 72 21
 */
const MAGIC_BYTES: Record<string, (bytes: Uint8Array) => boolean> = {
  'image/jpeg': (bytes) => bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF,
  'image/png': (bytes) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47,
  'image/gif': (bytes) => bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38,
  'image/webp': (bytes) =>
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50,
  'application/pdf': (bytes) => bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46,
  'application/zip': (bytes) => bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04,
  'application/x-rar-compressed': (bytes) => bytes[0] === 0x52 && bytes[1] === 0x61 && bytes[2] === 0x72 && bytes[3] === 0x21,
};

/**
 * 校验文件 Magic Bytes 是否与声明的 Content-Type 匹配
 * 用于上传端点二次验证，防止扩展名伪造攻击
 *
 * @param buffer 文件二进制数据（至少前 12 字节）
 * @param declaredType 声明的 Content-Type
 * @returns true 如果校验通过或类型无需校验
 */
export function validateMagicBytes(buffer: ArrayBuffer, declaredType: string): boolean {
  const validator = MAGIC_BYTES[declaredType];

  // 未知类型跳过校验（如 .doc, .xls 等旧格式）
  if (!validator) return true;

  const bytes = new Uint8Array(buffer.slice(0, 12));
  return validator(bytes);
}

/**
 * 获取文件扩展名对应的Content-Type
 */
export function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    // 图片
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    // 文档
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // 压缩文件
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}
