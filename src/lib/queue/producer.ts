/**
 * Cloudflare Queue 通知生产者
 * 将询价和评论通知消息发送到队列，由消费者Worker异步处理
 *
 * 消息格式:
 * {
 *   type: 'inquiry' | 'comment',
 *   data: { ... },
 *   createdAt: string,
 *   retryCount: number
 * }
 */

export interface NotificationMessage {
  type: 'inquiry' | 'comment';
  data: Record<string, unknown>;
  createdAt: string;
  retryCount?: number;
}

/**
 * 发送询价通知到队列
 */
export async function enqueueInquiryNotification(
  queue: Queue<NotificationMessage>,
  data: {
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
): Promise<void> {
  const message: NotificationMessage = {
    type: 'inquiry',
    data,
    createdAt: new Date().toISOString(),
  };

  await queue.send(message);
  console.log(`[Queue] Inquiry notification enqueued: #${data.id}`);
}

/**
 * 发送评论通知到队列
 */
export async function enqueueCommentNotification(
  queue: Queue<NotificationMessage>,
  data: {
    id: number;
    news_title: string;
    author_name: string;
    content: string;
  }
): Promise<void> {
  const message: NotificationMessage = {
    type: 'comment',
    data,
    createdAt: new Date().toISOString(),
  };

  await queue.send(message);
  console.log(`[Queue] Comment notification enqueued: #${data.id}`);
}
