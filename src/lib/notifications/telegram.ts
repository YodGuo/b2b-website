export async function sendTelegramMessage(env: Env, message: string) {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Telegram API error:', error);
    throw new Error(`Telegram API error: ${response.statusText}`);
  }

  return response.json();
}

export function formatInquiryTelegramMessage(data: {
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
  const lines = [
    '📋 <b>新询价通知</b>',
    '',
    `<b>编号:</b> #${data.id}`,
    `<b>公司:</b> ${escapeHtml(data.company_name)}`,
    `<b>联系人:</b> ${escapeHtml(data.contact_name)}`,
    `<b>邮箱:</b> <code>${escapeHtml(data.email)}</code>`,
  ];

  if (data.phone) {
    lines.push(`<b>电话:</b> ${escapeHtml(data.phone)}`);
  }

  if (data.country) {
    lines.push(`<b>国家:</b> ${escapeHtml(data.country)}`);
  }

  if (data.product_interest) {
    lines.push(`<b>产品:</b> ${escapeHtml(data.product_interest)}`);
  }

  if (data.quantity) {
    lines.push(`<b>数量:</b> ${escapeHtml(data.quantity)}`);
  }

  lines.push('');
  lines.push(`<b>留言:</b>`);
  lines.push(escapeHtml(data.message.substring(0, 500)) + (data.message.length > 500 ? '...' : ''));
  lines.push('');
  lines.push(`⏰ ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);

  return lines.join('\n');
}

export function formatCommentTelegramMessage(data: {
  id: number;
  news_title: string;
  author_name: string;
  content: string;
}): string {
  const lines = [
    '💬 <b>新评论待审核</b>',
    '',
    `<b>文章:</b> ${escapeHtml(data.news_title)}`,
    `<b>评论者:</b> ${escapeHtml(data.author_name)}`,
    '',
    `<b>内容:</b>`,
    escapeHtml(data.content.substring(0, 300)) + (data.content.length > 300 ? '...' : ''),
    '',
    `⏰ ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
  ];

  return lines.join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
