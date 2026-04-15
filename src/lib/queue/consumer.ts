/**
 * Cloudflare Queue 通知消费者
 * 从队列中消费消息，执行实际的通知发送（邮件、Telegram、企业微信）
 *
 * 此文件导出的 queue handler 会被 Cloudflare Workers 自动调用
 * 配置: wrangler.jsonc → queues.consumers
 */

import { sendEmail, formatInquiryEmail, formatCommentEmail } from '../notifications/email';
import { sendTelegramMessage, formatInquiryTelegramMessage, formatCommentTelegramMessage } from '../notifications/telegram';
import { sendWecomMessage, formatInquiryWecomMessage, formatCommentWecomMessage } from '../notifications/wecom';
import type { NotificationMessage } from './producer';

interface Env {
  NOTIFICATION_QUEUE: Queue<NotificationMessage>;
  ADMIN_EMAIL: string;
  RESEND_API_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  WECOM_WEBHOOK_URL: string;
}

/**
 * 发送邮件通知（直接使用 Resend）
 * 注意：Mailchannels 于 2024 年 6 月终止免费服务，已移除作为主通道
 */
async function sendEmailNotification(env: Env, options: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  try {
    await sendEmail(env, options);
    return true;
  } catch (error) {
    console.error('[Consumer] Resend email failed:', error);
    return false;
  }
}

/**
 * 处理单条询价通知
 */
async function handleInquiryNotification(env: Env, data: NotificationMessage['data']) {
  const adminEmail = env.ADMIN_EMAIL || 'sales@yourcompany.com';

  // 并行发送所有通知渠道
  const results = await Promise.allSettled([
    // 邮件（Resend）
    sendEmailNotification(env, {
      to: adminEmail,
      subject: `[New Inquiry] ${data.company_name} - ${data.contact_name}`,
      html: formatInquiryEmail(data as Parameters<typeof formatInquiryEmail>[0]),
      replyTo: data.email as string,
    }),
    // Telegram
    sendTelegramMessage(env, formatInquiryTelegramMessage(data as Parameters<typeof formatInquiryTelegramMessage>[0])),
    // 企业微信
    sendWecomMessage(env, formatInquiryWecomMessage(data as Parameters<typeof formatInquiryWecomMessage>[0])),
  ]);

  // 记录失败
  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    console.error(`[Consumer] Inquiry #${data.id} had ${failures.length} notification failures`);
    failures.forEach((f, i) => {
      console.error(`[Consumer] Channel ${i} error:`, f.reason);
    });
  }

  console.log(`[Consumer] Inquiry #${data.id} notifications sent: ${3 - failures.length}/3`);
}

/**
 * 处理单条评论通知
 */
async function handleCommentNotification(env: Env, data: NotificationMessage['data']) {
  const adminEmail = env.ADMIN_EMAIL || 'admin@yourcompany.com';

  const results = await Promise.allSettled([
    sendEmailNotification(env, {
      to: adminEmail,
      subject: `[New Comment] ${data.news_title}`,
      html: formatCommentEmail(data as Parameters<typeof formatCommentEmail>[0]),
    }),
    sendTelegramMessage(env, formatCommentTelegramMessage(data as Parameters<typeof formatCommentTelegramMessage>[0])),
    sendWecomMessage(env, formatCommentWecomMessage(data as Parameters<typeof formatCommentWecomMessage>[0])),
  ]);

  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    console.error(`[Consumer] Comment #${data.id} had ${failures.length} notification failures`);
  }

  console.log(`[Consumer] Comment #${data.id} notifications sent: ${3 - failures.length}/3`);
}

/**
 * Queue Consumer Handler
 * Cloudflare Workers 自动调用此函数处理队列中的消息
 *
 * - max_batch_size: 10（每批最多10条消息）
 * - max_batch_timeout: 5（最多等5秒就处理）
 * - max_retries: 3（失败最多重试3次）
 * - dead_letter_queue: 失败消息进入死信队列
 */
export default {
  async queue(batch: MessageBatch<NotificationMessage>, env: Env): Promise<void> {
    const messages = batch.messages;

    console.log(`[Consumer] Received batch of ${messages.length} message(s)`);

    for (const message of messages) {
      try {
        const { type, data } = message.body;

        if (type === 'inquiry') {
          await handleInquiryNotification(env, data);
        } else if (type === 'comment') {
          await handleCommentNotification(env, data);
        } else {
          console.warn(`[Consumer] Unknown message type: ${type}`);
        }

        // 确认消息处理成功
        message.ack();

      } catch (error) {
        console.error(`[Consumer] Error processing message ${message.id}:`, error);
        // 不调用 ack()，消息将被重试（最多3次）
        // 超过重试次数后进入死信队列 b2b-notifications-dlq
        message.retry();
      }
    }
  },
};
