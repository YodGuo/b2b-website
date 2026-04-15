import type { News } from './types';

export interface CreateNewsInput {
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  author?: string;
  published_at?: string;
}

export async function createNews(
  db: D1Database,
  input: CreateNewsInput
): Promise<number> {
  const result = await db.prepare(`
    INSERT INTO news (slug, title, content, excerpt, cover_image, author, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    input.slug,
    input.title,
    input.content,
    input.excerpt || null,
    input.cover_image || null,
    input.author || 'Admin',
    input.published_at || null
  ).run();

  return result.meta.last_row_id;
}

export async function getNewsBySlug(
  db: D1Database,
  slug: string
): Promise<News | null> {
  const result = await db.prepare(`
    SELECT * FROM news WHERE slug = ?
  `).bind(slug).first<News>();

  return result;
}

export async function getNewsById(
  db: D1Database,
  id: number
): Promise<News | null> {
  const result = await db.prepare(`
    SELECT * FROM news WHERE id = ?
  `).bind(id).first<News>();

  return result;
}

export async function getPublishedNews(
  db: D1Database,
  limit: number = 10,
  offset: number = 0
): Promise<News[]> {
  const result = await db.prepare(`
    SELECT * FROM news
    WHERE published_at IS NOT NULL AND published_at <= CURRENT_TIMESTAMP
    ORDER BY published_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all<News>();

  return result.results;
}

export async function getAllNews(
  db: D1Database,
  limit: number = 20,
  offset: number = 0
): Promise<News[]> {
  const result = await db.prepare(`
    SELECT * FROM news
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all<News>();

  return result.results;
}

export async function updateNews(
  db: D1Database,
  id: number,
  input: Partial<CreateNewsInput>
): Promise<boolean> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.slug !== undefined) {
    fields.push('slug = ?');
    values.push(input.slug);
  }
  if (input.title !== undefined) {
    fields.push('title = ?');
    values.push(input.title);
  }
  if (input.content !== undefined) {
    fields.push('content = ?');
    values.push(input.content);
  }
  if (input.excerpt !== undefined) {
    fields.push('excerpt = ?');
    values.push(input.excerpt);
  }
  if (input.cover_image !== undefined) {
    fields.push('cover_image = ?');
    values.push(input.cover_image);
  }
  if (input.author !== undefined) {
    fields.push('author = ?');
    values.push(input.author);
  }
  if (input.published_at !== undefined) {
    fields.push('published_at = ?');
    values.push(input.published_at);
  }

  if (fields.length === 0) return false;

  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);

  const result = await db.prepare(`
    UPDATE news SET ${fields.join(', ')} WHERE id = ?
  `).bind(...values).run();

  return result.meta.changes > 0;
}

export async function deleteNews(
  db: D1Database,
  id: number
): Promise<boolean> {
  const result = await db.prepare(`
    DELETE FROM news WHERE id = ?
  `).bind(id).run();

  return result.meta.changes > 0;
}

export async function getNewsCount(
  db: D1Database,
  publishedOnly: boolean = false
): Promise<number> {
  let query = 'SELECT COUNT(*) as count FROM news';

  if (publishedOnly) {
    query += " WHERE published_at IS NOT NULL AND published_at <= CURRENT_TIMESTAMP";
  }

  const result = await db.prepare(query).first<{ count: number }>();
  return result?.count || 0;
}
