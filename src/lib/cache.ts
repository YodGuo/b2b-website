/**
 * 通用 KV 缓存工具
 * 用于缓存高频读取、低频写入的公开数据（如评论列表）
 *
 * 设计原则：
 * - 仅缓存公开读多写少的数据
 * - 管理后台实时数据不缓存
 * - 写操作自动清除对应缓存
 * - 缓存键格式: cache:{namespace}:{key}
 * - 默认 TTL: 5 分钟
 */

const CACHE_PREFIX = 'cache:';

export interface CacheOptions {
  /** 缓存 TTL（秒），默认 300（5 分钟） */
  ttl?: number;
  /** 缓存命名空间，用于批量清除 */
  namespace?: string;
}

/**
 * 从 KV 获取缓存
 * @returns 缓存数据，未命中返回 null
 */
export async function getCache<T>(
  kv: KVNamespace,
  key: string,
  options?: CacheOptions
): Promise<T | null> {
  const fullKey = buildKey(key, options?.namespace);

  try {
    const data = await kv.get(fullKey, 'json');
    return data as T | null;
  } catch (error) {
    console.error(`[Cache] GET failed for ${fullKey}:`, error);
    return null;
  }
}

/**
 * 写入 KV 缓存
 */
export async function setCache<T>(
  kv: KVNamespace,
  key: string,
  data: T,
  options?: CacheOptions
): Promise<void> {
  const fullKey = buildKey(key, options?.namespace);
  const ttl = options?.ttl ?? 300; // 默认 5 分钟

  try {
    await kv.put(fullKey, JSON.stringify(data), {
      expirationTtl: ttl,
    });
  } catch (error) {
    console.error(`[Cache] SET failed for ${fullKey}:`, error);
  }
}

/**
 * 删除指定缓存
 */
export async function deleteCache(
  kv: KVNamespace,
  key: string,
  options?: CacheOptions
): Promise<void> {
  const fullKey = buildKey(key, options?.namespace);

  try {
    await kv.delete(fullKey);
  } catch (error) {
    console.error(`[Cache] DELETE failed for ${fullKey}:`, error);
  }
}

/**
 * 清除命名空间下所有缓存
 * 注意：KV 不支持按前缀批量删除，此方法需要列出所有 key 再逐个删除
 * 仅用于批量失效场景（如内容更新后）
 */
export async function invalidateNamespace(
  kv: KVNamespace,
  namespace: string
): Promise<number> {
  const prefix = `${CACHE_PREFIX}${namespace}:`;
  let deleted = 0;

  try {
    const list = await kv.list({ prefix });
    for (const key of list.keys) {
      await kv.delete(key.name);
      deleted++;
    }

    // KV list 一次最多返回 1000 个，处理分页
    let cursor = list.list_complete ? '' : list.cursor;
    while (cursor) {
      const nextPage = await kv.list({ prefix, cursor });
      for (const key of nextPage.keys) {
        await kv.delete(key.name);
        deleted++;
      }
      cursor = nextPage.list_complete ? '' : nextPage.cursor;
    }
  } catch (error) {
    console.error(`[Cache] Invalidate namespace ${namespace} failed:`, error);
  }

  return deleted;
}

/**
 * 带缓存的查询包装器
 * 先查 KV 缓存，未命中则执行 fetcher 并写入缓存
 *
 * @example
 * const comments = await withCache(
 *   env.SESSION,
 *   `comments:news:${newsId}`,
 *   () => getCommentsWithReplies(env.DB, newsId),
 *   { ttl: 300, namespace: 'comments' }
 * );
 */
export async function withCache<T>(
  kv: KVNamespace,
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  // 先查缓存
  const cached = await getCache<T>(kv, key, options);
  if (cached !== null) {
    return cached;
  }

  // 缓存未命中，执行查询
  const data = await fetcher();

  // 写入缓存（仅缓存非空数据）
  if (data !== null && data !== undefined) {
    await setCache(kv, key, data, options);
  }

  return data;
}

/**
 * 构建完整缓存键
 */
function buildKey(key: string, namespace?: string): string {
  if (namespace) {
    return `${CACHE_PREFIX}${namespace}:${key}`;
  }
  return `${CACHE_PREFIX}${key}`;
}
