import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
  storage: {
    // 环境感知：Cloudflare Pages 生产环境自动切换为 GitHub 模式
    kind: process.env.CF_PAGES === '1' ? 'github' : 'local',
    // GitHub 模式配置（生产环境自动启用）
    ...(process.env.CF_PAGES === '1' ? {
      repo: {
        owner: process.env.GITHUB_OWNER || 'your-github-username',
        name: process.env.GITHUB_REPO || 'b2b-website',
      },
      branch: process.env.GITHUB_BRANCH || 'main',
    } : {}),
  },

  collections: {
    // Products collection
    products: collection({
      label: 'Products',
      slugField: 'title',
      path: 'src/content/products/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Product Name', validation: { isRequired: true } } }),
        description: fields.text({ label: 'Product Description', validation: { isRequired: true } }),
        category: fields.text({ label: 'Product Category', defaultValue: 'Uncategorized' }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: 'Tag',
        }),
        coverImage: fields.image({ label: 'Cover Image', directory: 'public/images/products', publicPath: '/images/products' }),
        images: fields.array(fields.image({ label: 'Product Image', directory: 'public/images/products', publicPath: '/images/products' }), {
          label: 'Product Gallery',
          itemLabel: 'Image',
        }),
        specSheet: fields.url({ label: 'Spec Sheet Download URL' }),
        features: fields.array(fields.text({ label: 'Feature' }), {
          label: 'Product Features',
          itemLabel: 'Feature',
        }),
        specifications: fields.array(fields.object({
          name: fields.text({ label: 'Parameter Name' }),
          value: fields.text({ label: 'Parameter Value' }),
        }), {
          label: 'Technical Specifications',
          itemLabel: 'Specification Item',
        }),
        price: fields.text({ label: 'Price Description' }),
        moq: fields.text({ label: 'Minimum Order Quantity' }),
        leadTime: fields.text({ label: 'Lead Time' }),
        published: fields.checkbox({ label: 'Published', defaultValue: true }),
        order: fields.integer({ label: 'Sort Order', defaultValue: 0 }),
        content: fields.markdoc({ label: 'Product Details' }),
      },
    }),

    // News collection
    news: collection({
      label: 'News',
      slugField: 'title',
      path: 'src/content/news/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title', validation: { isRequired: true } } }),
        description: fields.text({ label: 'Summary', validation: { isRequired: true } }),
        author: fields.text({ label: 'Author', defaultValue: 'Admin' }),
        coverImage: fields.image({ label: 'Cover Image', directory: 'public/images/news', publicPath: '/images/news' }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: 'Tag',
        }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Company News', value: 'Company News' },
            { label: 'Industry Insights', value: 'Industry Insights' },
            { label: 'Product Updates', value: 'Product Updates' },
            { label: 'Technical Articles', value: 'Technical Articles' },
          ],
          defaultValue: 'Company News',
        }),
        published: fields.checkbox({ label: 'Published', defaultValue: true }),
        publishDate: fields.date({ label: 'Publish Date', validation: { isRequired: true } }),
        order: fields.integer({ label: 'Sort Order', defaultValue: 0 }),
        content: fields.markdoc({ label: 'Article Content' }),
      },
    }),
  },

  singletons: {
    // Site-wide settings
    settings: singleton({
      label: 'Site Settings',
      path: 'src/content/settings',
      schema: {
        // Company Info
        companyName: fields.text({ label: 'Company Name', defaultValue: 'Company' }),
        companySlogan: fields.text({ label: 'Company Slogan / Tagline', defaultValue: '' }),
        logo: fields.image({ label: 'Company Logo', directory: 'public/images/brand', publicPath: '/images/brand' }),
        favicon: fields.image({ label: 'Favicon', directory: 'public/images/brand', publicPath: '/images/brand' }),

        // Contact Information
        phone: fields.text({ label: 'Phone Number', defaultValue: '' }),
        whatsapp: fields.text({ label: 'WhatsApp Number', defaultValue: '' }),
        email: fields.text({ label: 'Contact Email', defaultValue: '' }),
        address: fields.text({ label: 'Company Address', defaultValue: '' }),
        workingHours: fields.text({ label: 'Working Hours', defaultValue: 'Mon - Fri, 9:00 - 18:00 (UTC+8)' }),

        // Social Media
        socialLinks: fields.array(fields.object({
          platform: fields.select({
            label: 'Platform',
            options: [
              { label: 'LinkedIn', value: 'linkedin' },
              { label: 'Facebook', value: 'facebook' },
              { label: 'Twitter / X', value: 'twitter' },
              { label: 'Instagram', value: 'instagram' },
              { label: 'YouTube', value: 'youtube' },
              { label: 'WeChat', value: 'wechat' },
              { label: 'Weibo', value: 'weibo' },
              { label: 'Alibaba', value: 'alibaba' },
              { label: 'Made-in-China', value: 'made-in-china' },
              { label: 'Global Sources', value: 'global-sources' },
              { label: 'Other', value: 'other' },
            ],
            defaultValue: 'linkedin',
          }),
          url: fields.url({ label: 'Profile URL' }),
          icon: fields.text({ label: 'Custom Icon Class (optional)', defaultValue: '' }),
        }), {
          label: 'Social Media Links',
          itemLabel: 'Social Link',
        }),

        // SEO Settings
        siteTitle: fields.text({ label: 'Default Site Title', defaultValue: 'Company - B2B Solutions' }),
        siteDescription: fields.text({ label: 'Default Site Description', defaultValue: '' }),
        ogImage: fields.image({ label: 'Default OG Image', directory: 'public/images/brand', publicPath: '/images/brand' }),
        googleAnalyticsId: fields.text({ label: 'Google Analytics ID (G-XXXXXXX)', defaultValue: '' }),
        googleSiteVerification: fields.text({ label: 'Google Site Verification', defaultValue: '' }),

        // Business Info
        businessLicense: fields.text({ label: 'Business License Number', defaultValue: '' }),
        establishedYear: fields.integer({ label: 'Year Established', defaultValue: 2010 }),
        employeeCount: fields.text({ label: 'Employee Count', defaultValue: '' }),
        annualRevenue: fields.text({ label: 'Annual Revenue Range', defaultValue: '' }),
        mainMarkets: fields.array(fields.text({ label: 'Market' }), {
          label: 'Main Export Markets',
          itemLabel: 'Market',
        }),
        certifications: fields.array(fields.text({ label: 'Certification' }), {
          label: 'Certifications (ISO, CE, etc.)',
          itemLabel: 'Certification',
        }),

        // Footer Settings
        copyrightText: fields.text({ label: 'Copyright Text', defaultValue: '' }),
        footerLinks: fields.array(fields.object({
          label: fields.text({ label: 'Link Label' }),
          url: fields.url({ label: 'Link URL' }),
        }), {
          label: 'Footer Quick Links',
          itemLabel: 'Link',
        }),

        // Legal Pages
        privacyPolicyEffectiveDate: fields.date({ label: 'Privacy Policy Effective Date', defaultValue: { year: 2025, month: 1, day: 1 } }),
        termsEffectiveDate: fields.date({ label: 'Terms & Conditions Effective Date', defaultValue: { year: 2025, month: 1, day: 1 } }),
      },
    }),
  },
});
