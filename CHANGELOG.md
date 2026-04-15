# Changelog

All notable changes to this project will be documented in this file.

## [1.6.1] - 2026-04-14

### Changed
- **README 同步 v1.6.0 变更**:
  - 功能总览：SEO 行补充动态 OG/Twitter Card/GA/站点验证，新增「B2B 转化」行
  - 项目结构：+ContactWidget.astro、+settings.ts、+404.astro、config.ts 说明更新
  - BaseLayout 说明更新：动态 settings + SEO meta + OG + GA + ContactWidget
  - 自定义指南：新增 WhatsApp 号码配置行

## [1.6.0] - 2026-04-14

### Added
- **动态全局设置（Keystatic CMS）**: 硬编码配置抽离至 settings 集合，支持后台可视化编辑
  - `src/content/config.ts`: 新增 `settings` 集合（companyName、logo、whatsapp、socialLinks、GA 等 20+ 字段）
  - `src/lib/settings.ts`: `getSettings()` 工具函数（构建时读取 settings，SSR 回退默认值）
  - `src/layouts/BaseLayout.astro`: 接受 `settings` prop，动态生成 og:title/og:description/canonical/GA
  - `src/components/common/Header.astro`: 动态读取 companyName、logo、whatsapp，新增 WhatsApp 快捷按钮
  - `src/components/common/Footer.astro`: 动态读取 companyName、slogan、socialLinks、copyrightText、footerLinks
  - 10 个页面全部适配 `settings={settings}` prop 传递
- **SEO 增强**: 动态 Open Graph + Twitter Card + Google Analytics + Google Site Verification
- **ContactWidget 悬浮组件**: 全站右下角 WhatsApp 浮动按钮 + 返回顶部按钮
- **404 错误页面**: 专业 404 页面（返回首页 + 联系支持 + 热门页面推荐）
- **社交矩阵**: Footer 支持 LinkedIn/Facebook/Twitter/Instagram/YouTube/WeChat/Alibaba 动态图标

### Changed
- `BaseLayout.astro`: title 格式改为 `{title} | {siteName}`，新增 og:image/twitter:card 等完整 meta

### Verified
- `npm run build` ✅ (exit code 0, 12 pages indexed — 新增 /404)

## [1.5.2] - 2026-04-14

### Changed
- **README 同步 v1.5.0 ~ v1.5.1 变更**:
  - 功能总览：后台管理 + 安全行改为 Better Auth
  - 架构图：KV 节点移除「管理员会话」，安全防护层改为 Better Auth
  - 域名架构：cms.xxxx.com 说明改为「Better Auth 认证」
  - 技术栈：会话存储改为「KV（API 缓存）+ D1（Better Auth session）」，认证行改为 Better Auth
  - 项目结构：auth.ts 说明更新，新增 `auth/[...all].ts`、`admin/seed.ts`、`002_better_auth.sql`、`seed-admin.ts`
  - 环境变量：`ADMIN_PASSWORD` + `ADMIN_COOKIE_SECRET` → `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL`
  - 快速开始：新增「第 4 步：创建管理员账号」（seed 脚本 + API 调用）
  - 认证流程图：完全重写为 Better Auth 流程
  - 数据库结构：3 表 → 7 表（新增 user、session、account、verification）
  - 常用命令：新增 `db:migrate:auth`、`seed:admin`
  - 自定义指南：新增「认证配置」行

## [1.5.1] - 2026-04-14

### Changed
- **Better Auth 升级为 D1 数据库模式**: 从 stateless 改为 D1 + Drizzle ORM 持久化存储
  - `src/lib/auth.ts`: 工厂函数 `createAuth(db)` + Drizzle 适配器（provider: sqlite）
  - `src/pages/api/auth/[...all].ts`: 从 `locals.runtime.env.DB` 获取 D1 实例
  - `src/pages/admin/login.astro`: `getServerSession(request, db)` 传入 D1
  - `src/pages/admin/index.astro`: `isAuthenticated(request, db)` 传入 D1
  - `astro.config.mjs`: vite external 添加 better-auth、drizzle-orm 等依赖

### Added
- **D1 迁移**: `schema/migrations/002_better_auth.sql`（user、session、account、verification 四表 + 索引）
- **管理员 Seed 端点**: `src/pages/api/admin/seed.ts`（POST，Bearer Token 鉴权，调用 Better Auth signUpEmail）
- **Seed 脚本**: `scripts/seed-admin.ts`（交互式输入 email/password/name，调用 seed API）
- **npm scripts**: `db:migrate:auth`、`db:migrate:auth:remote`、`seed:admin`
- **依赖**: `drizzle-orm`、`@better-auth/drizzle-adapter`

### Verified
- `npm run build` ✅ (exit code 0, 11 pages indexed)

## [1.5.0] - 2026-04-14

### Changed
- **引入 Better Auth（Stateless 模式）**: 替代自研 sessionId + KV 认证
  - `src/lib/auth.ts`: 完全重写，使用 Better Auth stateless session（JWE 加密 cookie，无数据库依赖）
  - 新建 `src/pages/api/auth/[...all].ts`: Better Auth catch-all handler（/api/auth/*）
  - `src/pages/admin/login.astro`: 重写为 email + password 登录（调用 /api/auth/sign-in/email）
  - `src/pages/admin/index.astro`: 认证检查改用 `isAuthenticated(request)`，注销改用 /api/auth/sign-out
  - `src/env.d.ts`: `ADMIN_PASSWORD` + `ADMIN_COOKIE_SECRET` → `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL`
  - `.dev.vars.example`: 更新认证环境变量说明
  - `package.json`: 新增 `better-auth` 依赖

### Removed
- 自研认证代码：`verifyPassword`、`createSession`、`signSessionId`、`validateAuthCookie`、`parseCookies`、`createLogoutResponse` 等 250 行代码
- 环境变量：`ADMIN_PASSWORD`、`ADMIN_COOKIE_SECRET`

### Added
- Better Auth API 端点：`/api/auth/sign-in/email`、`/api/auth/sign-out`、`/api/auth/get-session`

### Verified
- `npm run build` ✅ (exit code 0, 11 pages indexed)

## [1.4.3] - 2026-04-14

### Changed
- **README 同步 v1.4.0 ~ v1.4.2 变更**:
  - 功能总览：SEO 行补充 Product/FAQPage/BreadcrumbList JSON-LD，新增「缓存」行（KV 缓存层）
  - 架构图：KV 节点补充「API 缓存」说明
  - 项目结构：新增 `cache.ts`、`faq.astro`
  - 搜索提示按钮：新增 FAQ
  - 自定义指南：新增缓存 TTL、FAQ 内容

## [1.4.2] - 2026-04-14

### Changed
- **Header 导航添加 FAQ 链接**: 导航栏新增 FAQ 入口（位于 About Us 和 Contact 之间）
  - `src/components/common/Header.astro`: navItems 数组添加 `{ href: '/faq', label: 'FAQ' }`

### Verified
- `npm run build` ✅ (exit code 0, 11 pages indexed)

## [1.4.1] - 2026-04-14

### Added
- **Product JSON-LD 增强**: 产品详情页结构化数据补充 brand、offers、image 数组、additionalProperty 等字段
  - `src/pages/products/[...slug].astro`: 新增 brand、url、keywords、offers（priceCurrency/availability/eligibleQuantity）、additionalProperty（技术规格）
- **FAQ 页面 + FAQPage JSON-LD**: 新建 FAQ 页面，包含 8 条常见问答 + BreadcrumbList 结构化数据
  - 新建 `src/pages/faq.astro`: FAQ 页面（details/summary 手风琴组件）+ FAQPage JSON-LD + BreadcrumbList JSON-LD

### Verified
- `npm run build` ✅ (exit code 0, 11 pages indexed — 新增 /faq)

## [1.4.0] - 2026-04-14

### Added
- **KV 缓存层**: 通用缓存工具 + 新闻评论缓存，减少 D1 查询
  - 新建 `src/lib/cache.ts`: `getCache`、`setCache`、`deleteCache`、`invalidateNamespace`、`withCache`
  - `src/pages/news/[slug].astro`: 评论列表 + 评论计数使用 KV 缓存（5 分钟 TTL）
  - `src/actions/comment.ts`: 提交评论后自动清除对应文章缓存
  - `src/pages/admin/index.astro`: 审核评论后自动清除对应文章缓存

### Verified
- `npm run build` ✅ (exit code 0, 10 pages indexed)

## [1.3.6] - 2026-04-14

### Changed
- **README 同步 Worker 部署模式**: 部署方式从 Cloudflare Pages 改为 Cloudflare Workers
  - 开头描述：`Cloudflare Pages（免费计划）` → `Cloudflare Workers`
  - 技术栈：`Cloudflare Pages + Workers` → `Cloudflare Workers（wrangler deploy 一键部署）`
  - CI/CD：`GitHub Actions → Cloudflare Pages` → `GitHub Actions → wrangler deploy`
  - 部署章节：新增「方式一：一键部署」为推荐方式，GitHub Actions 降为方式二
  - 常用命令：新增 `deploy` 和 `deploy:preview` 脚本

## [1.3.5] - 2026-04-14

### Changed
- **Cloudflare Worker 部署模式**: `astro.config.mjs` adapter 添加 `runtime: { mode: 'advanced' }`，支持 `wrangler deploy` 一键部署
- **package.json**: 添加 `deploy` 脚本 (`astro build && wrangler deploy`)，清理重复项

### Verified
- `npm run build` ✅ (exit code 0, 10 pages indexed)

## [1.3.4] - 2026-04-14

### Fixed
- **CommentList.astro 构建失败**: frontmatter 中的 JSX 函数组件改为 Astro 模板语法（Astro 不支持 frontmatter 内 JSX）
- **SearchModal 导入路径**: `Header.astro` 改为直接导入 `.tsx` 文件（`import { SearchModal } from './SearchModal'`），消除 "Astro component with hydration directive" 警告
- **Pagefind 构建时缺失**: `astro.config.mjs` 添加 `build.rollupOptions.external` 排除 `/pagefind/pagefind.js`
- **backup.ts prerender 警告**: 添加 `export const prerender = false` 标记为 SSR 端点

### Verified
- `npm install` ✅ (730 packages)
- `npm run build` ✅ (exit code 0, 10 pages indexed by Pagefind)

## [1.3.3] - 2026-04-14

### Changed
- **README 全面更新**: 反映 v1.2.0 ~ v1.3.2 全部变更
  - 新增 Architecture Diagram（Cloudflare Edge 架构图 + 安全防护层清单）
  - 新增管理后台认证流程图（sessionId + KV + HMAC-SHA256）
  - 新增 D1 自动备份流程图
  - 功能总览：新增数据备份、合规、MIME Magic Bytes、隐私确认
  - 技术栈：Resend 升为主通道、新增 KV 会话存储、安全行、认证行更新
  - 项目结构：补充 `utils/html.ts`、`dlq-consumer.ts`、`cron/backup.ts`、`robots.txt.ts`
  - 环境变量表：新增 `CRON_SECRET`、`GITHUB_OWNER`、`GITHUB_REPO`、`GITHUB_BRANCH`
  - Queue 流程图：移除 Mailchannels，新增 DLQ → Telegram 告警
  - 自定义指南：新增 CSP 策略、备份频率

## [1.3.2] - 2026-04-14

### Changed
- `.dev.vars.example` 补充 4 个新增环境变量：`CRON_SECRET`、`GITHUB_OWNER`、`GITHUB_REPO`、`GITHUB_BRANCH`
- `.dev.vars.example` 更新 Resend 说明（Mailchannels 已停止免费服务，Resend 升为主通道）

## [1.3.1] - 2026-04-14

### Changed
- **React 组件 hydration 优化**: 非关键组件 `client:load` → `client:idle`，减少首屏 JS 阻塞
  - `BaseLayout.astro`: `LegalConsentModal` → `client:idle`（弹窗不阻塞首屏内容）
  - `news/[slug].astro`: `CommentForm` → `client:idle`（评论区在页面下方，非首屏）
  - 保留 `client:load`: `SearchModal`（⌘K 快捷键需尽早绑定）、`InquiryForm`（联系页唯一交互）

## [1.3.0] - 2026-04-14

### Added
- **DLQ 消费者 + Telegram 告警**: 死信队列消息自动发送 Telegram 告警，避免通知静默丢失
  - 新建 `src/lib/queue/dlq-consumer.ts`: DLQ handler + 告警格式化
  - `wrangler.jsonc`: 添加 `b2b-notifications-dlq` consumer 配置
- **CSP 响应头**: 添加 Content-Security-Policy，限制资源加载来源
  - `public/_headers`: CSP 策略（允许 'self' + Turnstile + https 图片）
- **JSON-LD 结构化数据增强**:
  - 首页: 新增 `WebSite` + `SearchAction` schema（配合 Pagefind）
  - 新闻页: `Article` → `NewsArticle`，新增 `publisher` + `mainEntityOfPage`
  - 所有 JSON-LD URL 改用 `Astro.site` 动态生成（消除硬编码域名）
- **询价表单隐私复选框**: 提交前必须勾选 Privacy Policy + Terms & Conditions
  - `src/components/forms/InquiryForm.tsx`: 新增 `privacyAccepted` 状态 + 必选复选框
- **MIME Magic Bytes 校验**: 上传文件二次验证，防止扩展名伪造
  - `src/lib/storage/r2.ts`: 新增 `validateMagicBytes()`，支持 JPEG/PNG/GIF/WebP/PDF/ZIP/RAR

## [1.2.0] - 2026-04-14

### Security
- **Cookie 明文密码 → sessionId + KV**: Cookie 不再包含密码明文，改用随机 UUID sessionId + HMAC 签名，会话存储在 Cloudflare KV（7 天 TTL）
  - `src/lib/auth.ts`: 完全重写，新增 `createSession`、`getSession`、`deleteSession`、`parseCookies`
  - `src/pages/admin/login.astro`: 更新登录/注销调用
  - `src/pages/admin/index.astro`: 更新认证检查/注销调用
- **邮件模板 XSS 防护**: 所有用户输入字段添加 HTML 实体转义
  - 新建 `src/lib/utils/html.ts`: `escapeHtml()` 工具函数
  - `src/lib/notifications/email.ts`: 所有用户输入包裹 `escapeHtml()`
  - `src/lib/notifications/mailchannels.ts`: 所有用户输入包裹 `escapeHtml()`
- **上传端点添加 Turnstile 鉴权**: `/api/upload` 新增 Turnstile 人机验证，无 token 返回 400
  - `src/pages/api/upload.ts`: 添加 `verifyTurnstile` 调用

### Fixed
- **Keystatic 环境感知切换**: 生产环境（`CF_PAGES=1`）自动切换为 GitHub 模式，本地保持 local 模式
  - `keystatic.config.ts`: 支持 `GITHUB_OWNER`、`GITHUB_REPO`、`GITHUB_BRANCH` 环境变量
- **Mailchannels 移除**: Mailchannels 已停止免费服务，邮件通道直接使用 Resend
  - `src/lib/queue/consumer.ts`: 移除 Mailchannels fallback，简化为 Resend 直连
- **域名占位符 → 环境变量**: `astro.config.mjs` site 从 `PUBLIC_SITE_URL` 读取，robots.txt 改为动态生成
  - `astro.config.mjs`: `site: process.env.PUBLIC_SITE_URL || 'https://yourdomain.com'`
  - 删除 `public/robots.txt`，新建 `src/pages/robots.txt.ts`（动态生成，使用 `Astro.site`）
- **GDPR 弹窗添加拒绝选项**: 新增 "Necessary Only" 按钮，consent 数据记录同意级别
  - `src/components/common/LegalConsentModal.tsx`: 双按钮 + `ConsentData` 接口

### Added
- **D1 数据库自动备份**: Cron Trigger 每天凌晨 3 点自动备份到 R2，自动清理 30 天前备份
  - 新建 `src/pages/api/cron/backup.ts`: D1 导出 + R2 上传 + 自动清理
  - `wrangler.jsonc`: 添加 `triggers.crons: ["0 3 * * *"]`
  - `src/env.d.ts`: 新增 `CRON_SECRET` 类型声明
- **HTML 转义工具**: 新建 `src/lib/utils/html.ts`（`escapeHtml` + `escapeAttr`）

## [1.1.0] - 2026-04-14

### Added
- **Pagefind static search**: Build-time search index with zero runtime cost
  - `astro-pagefind` integration in `astro.config.mjs`
  - `SearchModal.tsx`: React search component with keyboard shortcuts (⌘K/Ctrl+K), debounce, result navigation (↑↓ Enter Esc)
  - Search button in Header (desktop + mobile) with ⌘K shortcut badge
  - Self-managed open/close state via `toggle-search` CustomEvent
  - Body scroll lock when modal is open
- **Keystatic settings singleton**: Site-wide configuration in CMS admin
  - Company info (name, slogan, logo, favicon)
  - Contact info (phone, WhatsApp, email, address, working hours)
  - Social media links (LinkedIn, Facebook, Twitter/X, Instagram, YouTube, WeChat, Weibo, Alibaba, Made-in-China, Global Sources)
  - SEO settings (title, description, OG image, Google Analytics, site verification)
  - Business info (license, established year, employees, revenue, markets, certifications)
  - Footer settings (copyright, quick links)
  - Legal page effective dates
  - Default data at `src/content/settings/index.md`

### Changed
- `SearchModal.tsx`: Refactored from props-based to self-managed state (no `isOpen`/`onClose` props needed)
- `Header.astro`: Search buttons dispatch `toggle-search` CustomEvent; ⌘K shortcut moved to React component
- `keystatic.config.ts`: Added `singleton` import and `singletons.settings` configuration
- `routing.ts`: `requireCmsHost()` now returns 404 instead of 301 redirect (security: don't expose CMS domain)

### Security
- **Domain isolation**: Public domain accessing `/admin/*` now returns 404 (previously 301 redirect to CMS domain)
  - Prevents exposing `cms.xxxx.com` hostname to attackers
  - True domain separation for admin panel protection

## [1.0.0] - 2026-04-14

### Added
- **Project initialization**: Astro 5 + React 18 + Tailwind CSS 3 B2B website
- **Inquiry system**: Form submission with file upload to R2, Turnstile CAPTCHA, Honeypot anti-spam
- **Comment system**: News article comments with admin moderation (approve/reject)
- **Multi-channel notifications**: Cloudflare Queue async processing (producer-consumer pattern)
  - Mailchannels (free, primary) + Resend (fallback) email
  - Telegram Bot + WeChat Work webhook
  - Dead letter queue (b2b-notifications-dlq) with 3 retries
- **Media storage**: Cloudflare R2 with Public Access + custom domain + Referer hotlink protection
- **Content management**: Keystatic CMS (visual Markdown editor, local/GitHub mode)
- **Admin panel**: Password + HMAC-SHA256 signed Cookie authentication (Chinese UI)
  - Comment moderation dashboard
  - Inquiry management dashboard
  - Content management link to Keystatic
- **Domain separation**: xxxx.com (public) / cms.xxxx.com (admin) / media.xxxx.com (R2)
  - Domain routing guard (404 for unauthorized access, no domain exposure)
- **Legal compliance**: Privacy Policy + Terms & Conditions
  - First-visit consent modal (localStorage persistence)
  - Full legal text accessible from modal
- **SEO**: Sitemap (i18n en-US) + JSON-LD structured data + robots.txt
- **CI/CD**: GitHub Actions auto-deploy to Cloudflare Pages + infrastructure setup workflow
- **Database**: Cloudflare D1 with inquiries, comments, news tables

### Pages (English)
- Homepage with hero, features, stats, CTA
- Products listing with category filter + detail pages (3 sample products)
- News listing with category filter + detail pages with comments (2 sample articles)
- About Us with company story, values, stats
- Contact page with inquiry form
- Privacy Policy (full legal text)
- Terms & Conditions (full legal text)

### Pages (Chinese - Admin only)
- Admin login page
- Admin dashboard (comment moderation + inquiry management)

### Configuration
- `wrangler.jsonc`: Cloudflare Worker bindings (D1, R2, KV, Queue, dual-domain routes)
- `astro.config.mjs`: Hybrid rendering, Cloudflare adapter, integrations
- `keystatic.config.ts`: Products + News content schemas (English labels)
- `tailwind.config.mjs`: Custom colors, fonts, container
- `.dev.vars.example`: 15 environment variables documented
- `.github/workflows/deploy.yml`: Auto-deploy + infrastructure init

### Technical Stack
| Layer | Technology |
|-------|-----------|
| Framework | Astro 5 (static + on-demand SSR) |
| UI | React 18 + Tailwind CSS 3 |
| Deployment | Cloudflare Pages + Workers |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 (Public Access + custom domain) |
| Queue | Cloudflare Queue (producer-consumer, DLQ) |
| CAPTCHA | Cloudflare Turnstile |
| Email | Mailchannels (free) → Resend (fallback) |
| IM | Telegram Bot + WeChat Work Webhook |
| CMS | Keystatic (local/GitHub mode) |
| Auth | HMAC-SHA256 signed Cookie |
| CI/CD | GitHub Actions |

### File Structure
```
b2b-website/
├── src/
│   ├── actions/          # Astro Actions (inquiry, comment)
│   ├── components/       # React/Astro components
│   ├── content/          # Markdown content (products, news)
│   ├── layouts/          # BaseLayout with legal consent modal
│   ├── lib/              # Auth, routing, turnstile, db, notifications, queue, storage
│   ├── pages/            # All page routes
│   └── styles/           # Global CSS
├── schema/migrations/    # D1 database schema
├── public/               # Static assets
├── keystatic.config.ts   # CMS configuration
├── astro.config.mjs      # Astro configuration
├── wrangler.jsonc        # Cloudflare Worker configuration
└── .github/workflows/    # CI/CD
```
