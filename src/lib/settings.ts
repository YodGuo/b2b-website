/**
 * 全局设置加载工具
 * 在页面 frontmatter 中调用，获取 settings 数据并传给 BaseLayout
 *
 * 注意：getCollection 仅在构建时可用
 * SSR 页面会使用默认值（settings 通过 props 传递）
 */
import { getCollection } from 'astro:content';

export interface SiteSettings {
  companyName: string;
  companySlogan: string;
  logo?: string;
  favicon?: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  workingHours: string;
  socialLinks: Array<{ platform: string; url: string; icon?: string }>;
  siteTitle: string;
  siteDescription: string;
  ogImage?: string;
  googleAnalyticsId: string;
  googleSiteVerification: string;
  copyrightText: string;
  footerLinks: Array<{ label: string; url: string }>;
  establishedYear: number;
  employeeCount: string;
  annualRevenue: string;
  mainMarkets: string[];
  certifications: string[];
  businessLicense: string;
}

const defaults: SiteSettings = {
  companyName: 'Company',
  companySlogan: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  workingHours: 'Mon - Fri, 9:00 - 18:00 (UTC+8)',
  socialLinks: [],
  siteTitle: 'Company - B2B Solutions',
  siteDescription: '',
  googleAnalyticsId: '',
  googleSiteVerification: '',
  copyrightText: 'Company',
  footerLinks: [],
  establishedYear: 2010,
  employeeCount: '',
  annualRevenue: '',
  mainMarkets: [],
  certifications: [],
  businessLicense: '',
};

export async function getSettings(): Promise<SiteSettings> {
  try {
    const collection = await getCollection('settings');
    if (collection && collection.length > 0) {
      return { ...defaults, ...(collection[0].data as Partial<SiteSettings>) };
    }
  } catch {
    // SSR 环境中 getCollection 不可用，使用默认值
  }
  return defaults;
}
