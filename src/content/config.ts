import { defineCollection, z } from 'astro:content';

// 产品内容集合
const products = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    images: z.array(z.string()).default([]),
    specSheet: z.string().optional(),
    features: z.array(z.string()).default([]),
    specifications: z.array(z.object({
      name: z.string(),
      value: z.string(),
    })).default([]),
    price: z.string().optional(),
    moq: z.string().optional(),
    leadTime: z.string().optional(),
    published: z.boolean().default(true),
    order: z.number().default(0),
  }),
});

// 新闻/博客内容集合
const news = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string().default('Admin'),
    coverImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().default('Company News'),
    published: z.boolean().default(true),
    publishDate: z.coerce.date(),
    order: z.number().default(0),
  }),
});

// 站点全局设置（Keystatic singleton）
const settings = defineCollection({
  type: 'data',
  schema: z.object({
    companyName: z.string().default('Company'),
    companySlogan: z.string().default(''),
    logo: z.string().optional(),
    favicon: z.string().optional(),
    phone: z.string().default(''),
    whatsapp: z.string().default(''),
    email: z.string().default(''),
    address: z.string().default(''),
    workingHours: z.string().default('Mon - Fri, 9:00 - 18:00 (UTC+8)'),
    socialLinks: z.array(z.object({
      platform: z.string(),
      url: z.string(),
      icon: z.string().default(''),
    })).default([]),
    siteTitle: z.string().default('Company - B2B Solutions'),
    siteDescription: z.string().default(''),
    ogImage: z.string().optional(),
    googleAnalyticsId: z.string().default(''),
    googleSiteVerification: z.string().default(''),
    businessLicense: z.string().default(''),
    establishedYear: z.number().default(2010),
    employeeCount: z.string().default(''),
    annualRevenue: z.string().default(''),
    mainMarkets: z.array(z.string()).default([]),
    certifications: z.array(z.string()).default([]),
    copyrightText: z.string().default(''),
    footerLinks: z.array(z.object({
      label: z.string(),
      url: z.string(),
    })).default([]),
    privacyPolicyEffectiveDate: z.object({
      year: z.number(),
      month: z.number(),
      day: z.number(),
    }).default({ year: 2025, month: 1, day: 1 }),
    termsEffectiveDate: z.object({
      year: z.number(),
      month: z.number(),
      day: z.number(),
    }).default({ year: 2025, month: 1, day: 1 }),
  }),
});

export const collections = { products, news, settings };
