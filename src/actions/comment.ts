import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { createComment, getNewsById } from '../lib/db';
import { sendCommentNotification } from '../lib/notifications';
import { deleteCache } from '../lib/cache';

export const comment = defineAction({
  accept: 'form',
  input: z.object({
    newsId: z.coerce.number().positive('无效的文章ID'),
    parentId: z.coerce.number().positive().optional(),
    authorName: z.string().min(2, '姓名至少2个字符').max(50, '姓名不能超过50个字符'),
    authorEmail: z.string().email('请输入有效的邮箱').optional().or(z.literal('')),
    content: z.string()
      .min(5, '评论内容至少5个字符')
      .max(1000, '评论内容不能超过1000个字符'),
    // Honeypot field for spam protection
    website: z.string().max(0).optional(),
  }),
  handler: async (input, context) => {
    const { env, request } = context.locals.runtime;

    // 垃圾评论检测 - 如果honeypot字段有值，说明是机器人
    if (input.website && input.website.length > 0) {
      throw new ActionError({
        code: 'BAD_REQUEST',
        message: 'Invalid submission'
      });
    }

    // 获取客户端信息
    const ip = request.headers.get('CF-Connecting-IP') ||
               request.headers.get('X-Forwarded-For') ||
               'unknown';
    const userAgent = request.headers.get('User-Agent') || '';

    // 检查文章是否存在
    const news = await getNewsById(env.DB, input.newsId);
    if (!news) {
      throw new ActionError({
        code: 'NOT_FOUND',
        message: '文章不存在'
      });
    }

    try {
      // 保存评论
      const commentId = await createComment(env.DB, {
        news_id: input.newsId,
        parent_id: input.parentId,
        author_name: input.authorName,
        author_email: input.authorEmail || undefined,
        content: input.content,
        ip_address: ip,
        user_agent: userAgent
      });

      // 发送通知给管理员
      await sendCommentNotification(env, {
        id: commentId,
        news_title: news.title,
        author_name: input.authorName,
        content: input.content
      });

      // 清除评论缓存（新评论提交后）
      if (env.SESSION) {
        await deleteCache(env.SESSION, `comments:news:${input.newsId}`, { namespace: 'comments' });
        await deleteCache(env.SESSION, `comment-count:news:${input.newsId}`, { namespace: 'comments' });
      }

      return {
        success: true,
        message: '评论已提交，等待审核后显示',
        commentId
      };
    } catch (error) {
      console.error('Comment submission error:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '评论提交失败，请稍后重试'
      });
    }
  }
});
