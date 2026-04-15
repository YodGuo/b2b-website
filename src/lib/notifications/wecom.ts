interface WecomMessage {
  msgtype: 'text' | 'markdown';
  text?: { content: string };
  markdown?: { content: string };
}

export async function sendWecomMessage(env: Env, message: WecomMessage) {
  const response = await fetch(env.WECOM_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('WeCom API error:', error);
    throw new Error(`WeCom API error: ${response.statusText}`);
  }

  return response.json();
}

export function formatInquiryWecomMessage(data: {
  id: number;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  country?: string;
  product_interest?: string;
  quantity?: string;
  message: string;
}): WecomMessage {
  const lines = [
    '## 📋 新询价通知',
    '',
    `**编号:** #${data.id}`,
    `**公司:** ${data.company_name}`,
    `**联系人:** ${data.contact_name}`,
    `**邮箱:** ${data.email}`,
  ];

  if (data.phone) {
    lines.push(`**电话:** ${data.phone}`);
  }

  if (data.country) {
    lines.push(`**国家:** ${data.country}`);
  }

  if (data.product_interest) {
    lines.push(`**产品:** ${data.product_interest}`);
  }

  if (data.quantity) {
    lines.push(`**数量:** ${data.quantity}`);
  }

  lines.push('');
  lines.push(`**留言:**`);
  lines.push(`> ${data.message.substring(0, 300)}${data.message.length > 300 ? '...' : ''}`);
  lines.push('');
  lines.push(`⏰ ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);

  return {
    msgtype: 'markdown',
    markdown: { content: lines.join('\n') }
  };
}

export function formatCommentWecomMessage(data: {
  id: number;
  news_title: string;
  author_name: string;
  content: string;
}): WecomMessage {
  const lines = [
    '## 💬 新评论待审核',
    '',
    `**文章:** ${data.news_title}`,
    `**评论者:** ${data.author_name}`,
    '',
    `**内容:**`,
    `> ${data.content.substring(0, 200)}${data.content.length > 200 ? '...' : ''}`,
    '',
    `⏰ ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
  ];

  return {
    msgtype: 'markdown',
    markdown: { content: lines.join('\n') }
  };
}
