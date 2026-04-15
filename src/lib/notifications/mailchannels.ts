/**
 * Mailchannels 邮件服务
 * 注意：Mailchannels 于 2024 年 6 月终止免费服务
 * 当前保留此模块作为备用，主通道已切换为 Resend
 */

import { escapeHtml } from '../utils/html';

interface MailchannelsOptions {
  from: {
    email: string;
    name?: string;
  };
  to: Array<{ email: string; name?: string }>;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendMailchannelsEmail(options: MailchannelsOptions): Promise<boolean> {
  const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [
        {
          to: options.to,
        },
      ],
      from: {
        email: options.from.email,
        name: options.from.name || 'B2B Website',
      },
      subject: options.subject,
      content: [
        {
          type: 'text/html',
          value: options.html,
        },
      ],
      ...(options.replyTo ? { reply_to: options.replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Mailchannels error:', error);
    throw new Error(`Mailchannels send failed: ${response.status}`);
  }

  return true;
}

/**
 * 发送询价通知邮件 (Mailchannels版本)
 */
export function buildInquiryMailchannelsHTML(data: {
  id: number;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  country?: string;
  product_interest?: string;
  quantity?: string;
  message: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .field { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb; }
    .field:last-child { border-bottom: none; }
    .label { font-weight: 600; color: #374151; display: block; margin-bottom: 5px; }
    .value { color: #6b7280; }
    .message-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin-top: 10px; }
    .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📋 新询价通知</h1>
    </div>
    <div class="content">
      <p style="margin-top: 0;">您收到了一条新的询价请求。</p>
      <div class="field"><span class="label">询价编号</span><span class="value">#${escapeHtml(String(data.id))}</span></div>
      <div class="field"><span class="label">公司名称</span><span class="value">${escapeHtml(data.company_name)}</span></div>
      <div class="field"><span class="label">联系人</span><span class="value">${escapeHtml(data.contact_name)}</span></div>
      <div class="field"><span class="label">邮箱</span><span class="value"><a href="mailto:${escapeHtml(data.email)}" style="color:#2563eb">${escapeHtml(data.email)}</a></span></div>
      ${data.phone ? `<div class="field"><span class="label">电话</span><span class="value">${escapeHtml(data.phone)}</span></div>` : ''}
      ${data.country ? `<div class="field"><span class="label">国家</span><span class="value">${escapeHtml(data.country)}</span></div>` : ''}
      ${data.product_interest ? `<div class="field"><span class="label">产品</span><span class="value">${escapeHtml(data.product_interest)}</span></div>` : ''}
      ${data.quantity ? `<div class="field"><span class="label">数量</span><span class="value">${escapeHtml(data.quantity)}</span></div>` : ''}
      <div class="field"><span class="label">留言</span><div class="message-box">${escapeHtml(data.message).replace(/\n/g, '<br>')}</div></div>
      <div class="field"><span class="label">时间</span><span class="value">${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</span></div>
    </div>
    <div class="footer"><p style="margin: 0;">此邮件由系统自动发送</p></div>
  </div>
</body>
</html>`;
}

/**
 * 发送评论通知邮件 (Mailchannels版本)
 */
export function buildCommentMailchannelsHTML(data: {
  id: number;
  news_title: string;
  author_name: string;
  content: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #fff; padding: 20px; border: 1px solid #e5e7eb; }
    .field { margin-bottom: 15px; }
    .label { font-weight: 600; color: #374151; }
    .message-box { background-color: #f3f4f6; padding: 15px; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h2 style="margin: 0;">💬 新评论待审核</h2></div>
    <div class="content">
      <p>文章《${escapeHtml(data.news_title)}》收到了一条新评论。</p>
      <div class="field"><span class="label">评论者：</span><span>${escapeHtml(data.author_name)}</span></div>
      <div class="field"><span class="label">评论内容：</span><div class="message-box">${escapeHtml(data.content)}</div></div>
      <div class="field"><span class="label">时间：</span><span>${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</span></div>
    </div>
  </div>
</body>
</html>`;
}
