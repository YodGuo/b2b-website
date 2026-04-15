/**
 * Dead Letter Queue (DLQ) 消费者
 * 当主队列 b2b-notifications 消息重试 3 次仍失败后，进入此队列
 * DLQ 消费者发送告警通知到 Telegram，避免消息静默丢失
 *
 * 配置: wrangler.jsonc → queues.consumers (需添加 DLQ consumer)
 */

import { sendTelegramMessage } from '../notifications/telegram';
import type { NotificationMessage } from './producer';

interface DlqEnv {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

/**
 * 格式化 DLQ 告警消息
 */
function formatDlqAlert(message: { id: string; body: NotificationMessage; timestamp?: string }): string {
  const { body } = message;
  const type = body.type === 'inquiry' ? '📋 询价' : '💬 评论';
  const data = body.data;

  const lines = [
    '⚠️ <b>DLQ 告警: 通知发送失败</b>',
    '',
    `<b>消息ID:</b> <code>${message.id}</code>`,
    `<b>类型:</b> ${type}`,
    `<b>创建时间:</b> ${body.createdAt}`,
    '',
    '<b>消息内容:</b>',
    `<pre>${JSON.stringify(data, null, 2).substring(0, 800)}</pre>`,
    '',
    '请检查 Resend API Key、Telegram Bot Token 等配置是否有效。',
    `⏰ 告警时间: ${new Date().toISOString()}`,
  ];

  return lines.join('\n');
}

/**
 * DLQ Consumer Handler
 * Cloudflare Workers 自动调用
 */
export default {
  async queue(batch: MessageBatch<NotificationMessage>, env: DlqEnv): Promise<void> {
    const messages = batch.messages;

    console.error(`[DLQ] Received ${messages.length} failed message(s)`);

    for (const message of messages) {
      try {
        // 发送 Telegram 告警
        if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
          const alertMessage = formatDlqAlert({
            id: message.id,
            body: message.body,
          });

          await sendTelegramMessage(env, alertMessage);
          console.log(`[DLQ] Alert sent for message ${message.id}`);
        } else {
          console.warn(`[DLQ] Telegram not configured, skipping alert for message ${message.id}`);
        }

        // 确认消息（避免重复告警）
        message.ack();

      } catch (error) {
        console.error(`[DLQ] Failed to process message ${message.id}:`, error);
        // 即使告警失败也 ack，避免无限重试
        message.ack();
      }
    }
  },
};
