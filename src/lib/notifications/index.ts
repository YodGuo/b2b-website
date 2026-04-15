import { enqueueInquiryNotification, enqueueCommentNotification } from '../queue/producer';
import type { NotificationMessage } from '../queue/producer';

export interface InquiryNotificationData {
  id: number;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  country?: string;
  product_interest?: string;
  quantity?: string;
  message: string;
  attachments?: string[];
}

export interface CommentNotificationData {
  id: number;
  news_title: string;
  author_name: string;
  content: string;
}

/**
 * 发送询价通知 → 通过Cloudflare Queue异步处理
 *
 * 不再直接调用邮件/Telegram/企业微信API，
 * 而是将消息投递到队列，由消费者Worker异步处理。
 * 这样即使通知服务暂时不可用，消息也不会丢失。
 */
export async function sendInquiryNotification(env: Env, data: InquiryNotificationData) {
  try {
    await enqueueInquiryNotification(env.NOTIFICATION_QUEUE, data);
    return { success: true, method: 'queue' };
  } catch (error) {
    console.error('[Notification] Failed to enqueue inquiry notification:', error);
    return { success: false, method: 'queue', error: String(error) };
  }
}

/**
 * 发送评论通知 → 通过Cloudflare Queue异步处理
 */
export async function sendCommentNotification(env: Env, data: CommentNotificationData) {
  try {
    await enqueueCommentNotification(env.NOTIFICATION_QUEUE, data);
    return { success: true, method: 'queue' };
  } catch (error) {
    console.error('[Notification] Failed to enqueue comment notification:', error);
    return { success: false, method: 'queue', error: String(error) };
  }
}

// 导出子模块（消费者Worker仍需要直接调用）
export * from './email';
export * from './telegram';
export * from './wecom';
export * from './mailchannels';
