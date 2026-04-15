import type { Comment, CommentWithReplies } from './types';

export interface CreateCommentInput {
  news_id: number;
  parent_id?: number;
  author_name: string;
  author_email?: string;
  content: string;
  ip_address?: string;
  user_agent?: string;
}

export async function createComment(
  db: D1Database,
  input: CreateCommentInput
): Promise<number> {
  const result = await db.prepare(`
    INSERT INTO comments (
      news_id, parent_id, author_name, author_email, content, ip_address, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    input.news_id,
    input.parent_id || null,
    input.author_name,
    input.author_email || null,
    input.content,
    input.ip_address || null,
    input.user_agent || null
  ).run();

  return result.meta.last_row_id;
}

export async function getCommentsByNewsId(
  db: D1Database,
  newsId: number,
  onlyApproved: boolean = true
): Promise<Comment[]> {
  let query = 'SELECT * FROM comments WHERE news_id = ?';
  const params: unknown[] = [newsId];

  if (onlyApproved) {
    query += ' AND status = ?';
    params.push('approved');
  }

  query += ' ORDER BY created_at DESC';

  const result = await db.prepare(query).bind(...params).all<Comment>();
  return result.results;
}

export async function getCommentsWithReplies(
  db: D1Database,
  newsId: number
): Promise<CommentWithReplies[]> {
  const comments = await getCommentsByNewsId(db, newsId, true);

  // 构建树形结构
  const commentMap = new Map<number, CommentWithReplies>();
  const rootComments: CommentWithReplies[] = [];

  // 首先创建所有评论的映射
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // 然后构建树形结构
  comments.forEach(comment => {
    const commentWithReplies = commentMap.get(comment.id)!;
    if (comment.parent_id && commentMap.has(comment.parent_id)) {
      commentMap.get(comment.parent_id)!.replies.push(commentWithReplies);
    } else {
      rootComments.push(commentWithReplies);
    }
  });

  return rootComments;
}

export async function getCommentById(
  db: D1Database,
  id: number
): Promise<Comment | null> {
  const result = await db.prepare(`
    SELECT * FROM comments WHERE id = ?
  `).bind(id).first<Comment>();

  return result;
}

export async function updateCommentStatus(
  db: D1Database,
  id: number,
  status: 'pending' | 'approved' | 'rejected'
): Promise<boolean> {
  const result = await db.prepare(`
    UPDATE comments SET status = ? WHERE id = ?
  `).bind(status, id).run();

  return result.meta.changes > 0;
}

export async function getPendingComments(
  db: D1Database,
  limit: number = 20,
  offset: number = 0
): Promise<Comment[]> {
  const result = await db.prepare(`
    SELECT * FROM comments WHERE status = 'pending'
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all<Comment>();

  return result.results;
}

export async function getCommentCount(
  db: D1Database,
  newsId?: number,
  status?: string
): Promise<number> {
  let query = 'SELECT COUNT(*) as count FROM comments WHERE 1=1';
  const params: unknown[] = [];

  if (newsId) {
    query += ' AND news_id = ?';
    params.push(newsId);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  const result = await db.prepare(query).bind(...params).first<{ count: number }>();
  return result?.count || 0;
}
