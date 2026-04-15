import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { createInquiry } from '../lib/db/inquiries';
import { sendInquiryNotification } from '../lib/notifications';
import { verifyTurnstile } from '../lib/turnstile';

export const inquiry = defineAction({
  accept: 'form',
  input: z.object({
    companyName: z.string().min(2, '公司名称至少2个字符'),
    contactName: z.string().min(2, '联系人姓名至少2个字符'),
    email: z.string().email('请输入有效的邮箱地址'),
    phone: z.string().optional(),
    country: z.string().optional(),
    productInterest: z.string().optional(),
    quantity: z.string().optional(),
    message: z.string().min(10, '请详细描述您的需求（至少10个字符）'),
    attachments: z.string().optional(), // JSON字符串
    // Cloudflare Turnstile token
    cfTurnstileToken: z.string().min(1, '人机验证失败，请重试'),
    // Honeypot field for additional spam protection
    website: z.string().max(0).optional(),
  }),
  handler: async (input, context) => {
    const { env, request } = context.locals.runtime;

    // 1. Honeypot检测
    if (input.website && input.website.length > 0) {
      throw new ActionError({
        code: 'BAD_REQUEST',
        message: 'Invalid submission'
      });
    }

    // 2. Turnstile人机验证
    const clientIp = request.headers.get('CF-Connecting-IP') || undefined;
    const turnstileResult = await verifyTurnstile(
      input.cfTurnstileToken,
      env.TURNSTILE_SECRET_KEY,
      clientIp
    );

    if (!turnstileResult.success) {
      throw new ActionError({
        code: 'BAD_REQUEST',
        message: '人机验证失败，请刷新页面重试'
      });
    }

    try {
      // 解析附件
      let attachments: string[] = [];
      if (input.attachments) {
        try {
          attachments = JSON.parse(input.attachments);
        } catch {
          // 忽略解析错误
        }
      }

      // 保存到数据库
      const inquiryId = await createInquiry(env.DB, {
        company_name: input.companyName,
        contact_name: input.contactName,
        email: input.email,
        phone: input.phone,
        country: input.country,
        product_interest: input.productInterest,
        quantity: input.quantity,
        message: input.message,
        attachments: attachments.length > 0 ? JSON.stringify(attachments) : undefined
      });

      // 发送通知
      await sendInquiryNotification(env, {
        id: inquiryId,
        company_name: input.companyName,
        contact_name: input.contactName,
        email: input.email,
        phone: input.phone,
        country: input.country,
        product_interest: input.productInterest,
        quantity: input.quantity,
        message: input.message,
        attachments
      });

      return { success: true, inquiryId };
    } catch (error) {
      console.error('Inquiry submission error:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '提交失败，请稍后重试'
      });
    }
  }
});
