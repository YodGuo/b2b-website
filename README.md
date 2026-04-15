# B2B 独立站

基于 Astro 5 构建的 B2B 企业官网，部署在 Cloudflare Workers，具备询价系统、新闻评论、多渠道通知、可视化 CMS、静态搜索等完整功能。

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/YodGuo/infups)

> ⚠️ 一键部署前，请先 Fork 仓库并配置所需的环境变量和 Cloudflare 资源（D1、R2、KV、Queue）。详见[快速开始](#快速开始)。

## 功能总览

| 功能 | 说明 |
|------|------|
| 询价系统 | 表单提交 + 文件上传至 R2 + Turnstile 人机验证 + Honeypot 防垃圾 + 隐私政策确认 |
| 评论系统 | 新闻文章评论 + 管理员审核机制 |
| 多渠道通知 | Cloudflare Queue 异步处理，Resend 邮件 + Telegram + 企业微信 |
| 媒体存储 | R2 Public Access + 自定义域名 + Referer 防盗链 + MIME Magic Bytes 校验 |
| 内容管理 | Keystatic 可视化 CMS（环境感知 local/github 模式），Markdown/Markdoc 驱动 |
| 站点配置 | CMS 后台统一管理公司信息、联系方式、SEO、社交媒体等全局设置 |
| 静态搜索 | Pagefind 构建时索引，零运行时成本，支持 ⌘K 快捷键 |
| 后台管理 | 评论审核、询价处理，Better Auth（email + password，D1 持久化，JWE 加密 Cookie） |
| SEO | Sitemap（i18n）+ JSON-LD（Organization/WebSite/NewsArticle/Product/FAQPage/BreadcrumbList）+ 动态 OG/Twitter Card + GA + 站点验证 |
| B2B 转化 | WhatsApp 悬浮按钮（Header 快捷入口 + 全站右下角浮动）+ 返回顶部 + 专业 404 页面 |
| 安全 | Better Auth · XSS 防护 · CSP 响应头 · Turnstile · Honeypot · 域名隔离 · Magic Bytes · GDPR 合规 |
| 缓存 | KV 缓存层（评论列表 5 分钟 TTL，写操作自动失效） |
| 数据备份 | D1 数据库每日自动备份至 R2，30 天自动清理 |
| 合规 | GDPR 弹窗（Accept All / Necessary Only）· Privacy Policy · Terms & Conditions |

## 架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Cloudflare Edge Network                      │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  xxxx.com    │  │ cms.xxxx.com │  │media.xxxx.com│              │
│  │  (前台网站)   │  │  (后台管理)   │  │  (R2 媒体)   │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                      │
│         │    ┌────────────┴────────────┐     │                      │
│         └────┤   Cloudflare Worker      │─────┘                    │
│              │   (Astro SSR + API)      │                           │
│              └────────────┬────────────┘                           │
│                           │                                         │
│         ┌─────────────────┼─────────────────┐                      │
│         │                 │                 │                      │
│         ▼                 ▼                 ▼                      │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐                  │
│  │  D1 (SQLite)│   │  R2 Bucket │   │ KV Session │                  │
│  │  询价/评论  │   │  媒体/备份  │   │  API 缓存   │                  │
│  │             │   │             │   │             │                  │
│  └────────────┘   └────────────┘   └────────────┘                  │
│                                                                     │
│              ┌──────────────────────────┐                           │
│              │  Cloudflare Queue         │                           │
│              │  b2b-notifications       │                           │
│              └────────────┬─────────────┘                           │
│                           │                                         │
│         ┌─────────────────┼─────────────────┐                      │
│         ▼                 ▼                 ▼                      │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐                  │
│  │  Resend    │   │ Telegram   │   │  企业微信   │                  │
│  │  邮件通知   │   │  Bot 通知   │   │  Webhook   │                  │
│  └────────────┘   └────────────┘   └────────────┘                  │
│                           │                                         │
│              ┌────────────┴─────────────┐                           │
│              │  b2b-notifications-dlq   │                           │
│              │  (死信队列 → Telegram告警)│                           │
│              └──────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘

                          安全防护层
┌─────────────────────────────────────────────────────────────────────┐
│  ✓ Better Auth（email + password，D1 持久化，JWE 加密 Cookie）              │
│  ✓ Content-Security-Policy 响应头                                   │
│  ✓ HTML 实体转义（邮件模板 XSS 防护）                               │
│  ✓ MIME Magic Bytes 校验（上传文件类型验证）                         │
│  ✓ Turnstile 人机验证（表单 + 上传端点）                             │
│  ✓ Honeypot 隐藏字段（表单防垃圾）                                   │
│  ✓ 域名隔离（前台访问 /admin/* → 404，不暴露后台域名）                │
│  ✓ GDPR 合规弹窗（Accept All / Necessary Only）                     │
│  ✓ D1 每日自动备份至 R2（Cron Trigger，30天自动清理）                 │
└─────────────────────────────────────────────────────────────────────┘
```

## 域名架构

```
xxxx.com          前台 — 产品展示、新闻、询价、评论
cms.xxxx.com      后台 — 管理面板、Keystatic CMS（Better Auth 认证）
media.xxxx.com    媒体 — R2 公开访问（防盗链）
```

前台与后台共享同一个 Cloudflare Worker，通过 `src/lib/routing.ts` 中的域名守卫分发请求：

- 访问 `xxxx.com/admin/*` → 返回 404（不暴露后台域名，安全隔离）
- 访问 `cms.xxxx.com/admin/*` → 正常响应（需登录认证）
- R2 资源通过 `media.xxxx.com` 自定义域名公开访问，Referer 白名单防盗链

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Astro 5（hybrid 渲染：静态为主 + 按需 SSR） |
| UI | React 18 + Tailwind CSS 3 |
| 部署 | Cloudflare Workers（`wrangler deploy` 一键部署） |
| 数据库 | Cloudflare D1（SQLite） |
| 对象存储 | Cloudflare R2（Public Access + 自定义域名） |
| 会话存储 | Cloudflare KV（API 缓存） + D1（Better Auth session） |
| 消息队列 | Cloudflare Queue（生产者-消费者，死信队列 + Telegram 告警） |
| 人机验证 | Cloudflare Turnstile |
| 邮件 | Resend（主通道） |
| 即时通讯 | Telegram Bot API + 企业微信 Webhook |
| CMS | Keystatic（环境感知：local 模式开发 / GitHub 模式生产） |
| 搜索 | Pagefind（构建时索引，零运行时成本） |
| 认证 | Better Auth（email + password，D1 + Drizzle ORM，JWE 加密 Cookie，7 天过期） |
| 安全 | CSP · XSS 转义 · Magic Bytes · Honeypot · 域名隔离 · GDPR |
| CI/CD | GitHub Actions → `wrangler deploy` |

## 项目结构

```
b2b-website/
├── src/
│   ├── actions/                 # Astro Actions（服务端表单处理）
│   │   ├── inquiry.ts           #   询价 → DB 入库 + Queue 通知
│   │   └── comment.ts           #   评论 → DB 入库 + Queue 通知
│   ├── components/
│   │   ├── common/              #   Header / Footer / SearchModal / ContactWidget / TurnstileWidget
│   │   │   ├── SearchModal.tsx  #     Pagefind 搜索弹窗（⌘K 快捷键）
│   │   │   ├── ContactWidget.astro # 全站悬浮组件（WhatsApp + 返回顶部）
│   │   │   └── LegalConsentModal.tsx # 法律条款首次访问弹窗（GDPR 双按钮）
│   │   ├── forms/               #   InquiryForm（React，含文件上传 + 隐私复选框）
│   │   └── comments/            #   CommentForm / CommentList
│   ├── content/                 # Markdown 内容集合
│   │   ├── config.ts            #   Zod schema 定义（products + news + settings）
│   │   ├── products/            #   产品 Markdown 文件
│   │   ├── news/                #   新闻 Markdown 文件
│   │   └── settings/            #   站点全局配置（Keystatic singleton，20+ 字段）
│   │       └── index.md         #     公司信息、联系方式、SEO、社交媒体等
│   ├── layouts/
│   │   └── BaseLayout.astro     #   全局布局（动态 settings + SEO meta + OG + GA + ContactWidget）
│   ├── lib/
│   │   ├── auth.ts              #   Better Auth（D1 + Drizzle ORM，工厂函数 createAuth）
│   │   ├── cache.ts             #   KV 缓存工具（get/set/delete/withCache）
│   │   ├── settings.ts          #   全局设置加载工具（getSettings，构建时读取 CMS）
│   │   ├── routing.ts           #   域名路由守卫（requireCmsHost → 404）
│   │   ├── turnstile.ts         #   Turnstile 服务端验证
│   │   ├── utils/
│   │   │   └── html.ts          #     HTML 实体转义工具（XSS 防护）
│   │   ├── db/                  #   D1 数据库操作层
│   │   │   ├── types.ts         #     TypeScript 类型定义
│   │   │   ├── inquiries.ts     #     询价 CRUD
│   │   │   ├── comments.ts      #     评论 CRUD + 审核
│   │   │   └── news.ts          #     新闻查询
│   │   ├── notifications/       #   通知服务
│   │   │   ├── index.ts         #     统一入口 → Queue 生产者
│   │   │   ├── email.ts         #     Resend 邮件（主通道，XSS 转义）
│   │   │   ├── mailchannels.ts  #     Mailchannels（已停止服务，保留备用）
│   │   │   ├── telegram.ts      #     Telegram Bot
│   │   │   └── wecom.ts         #     企业微信 Webhook
│   │   ├── queue/               #   Cloudflare Queue
│   │   │   ├── producer.ts      #     生产者（消息投递）
│   │   │   ├── consumer.ts      #     消费者 Worker（Resend + Telegram + 企业微信）
│   │   │   └── dlq-consumer.ts  #     死信队列消费者（Telegram 告警）
│   │   └── storage/
│   │       └── r2.ts            #   R2 操作 + presigned URL + 防盗链 + Magic Bytes 校验
│   ├── pages/
│   │   ├── index.astro          #   首页（Organization + WebSite JSON-LD）
│   │   ├── about.astro          #   关于我们
│   │   ├── faq.astro            #   FAQ（FAQPage + BreadcrumbList JSON-LD）
│   │   ├── contact.astro        #   联系我们（询价表单）
│   │   ├── 404.astro            #   404 错误页面（返回首页 + 联系支持）
│   │   ├── privacy.astro        #   隐私政策
│   │   ├── terms.astro          #   服务条款
│   │   ├── robots.txt.ts        #   动态 robots.txt（Astro.site）
│   │   ├── products/            #   产品列表 + 详情页
│   │   ├── news/                #   新闻列表 + 详情页（NewsArticle JSON-LD + 评论）
│   │   ├── admin/               #   后台管理（仅 cms.xxxx.com）
│   │   │   ├── login.astro      #     登录页
│   │   │   └── index.astro      #     管理面板（评论审核 + 询价处理）
│   │   └── api/
│   │       ├── auth/[...all].ts  #   Better Auth catch-all handler（/api/auth/*）
│   │       ├── admin/seed.ts     #   管理员 Seed 端点（Bearer Token 鉴权）
│   │       ├── upload.ts        #   文件上传 API（Turnstile + Magic Bytes 校验）
│   │       └── cron/
│   │           └── backup.ts    #   D1 自动备份（Cron Trigger → R2）
│   ├── styles/global.css        #   全局样式 + Tailwind 组件类
│   └── env.d.ts                 #   Cloudflare Env 类型声明
├── schema/migrations/           # D1 数据库迁移文件
│   ├── 001_initial.sql          #   业务表（inquiries、comments、news）
│   └── 002_better_auth.sql      #   认证表（user、session、account、verification）
├── scripts/
│   └── seed-admin.ts            #   管理员 Seed 脚本（交互式创建管理员账号）
├── public/                      #   静态资源（favicon、_headers、_redirects）
├── keystatic.config.ts          # Keystatic CMS 配置（环境感知 + settings singleton）
├── astro.config.mjs             # Astro 框架配置（pagefind + 环境变量 site）
├── wrangler.jsonc               # Cloudflare Worker 配置（Cron + DLQ consumer）
├── tailwind.config.mjs          # Tailwind CSS 配置
├── tsconfig.json                # TypeScript 配置
└── .github/workflows/deploy.yml # CI/CD（自动部署 + 基础设施初始化）
```

## 快速开始

### 前置要求

- Node.js >= 20
- npm >= 10
- Cloudflare 账户（免费计划即可）

### 1. 克隆并安装

```bash
git clone <your-repo-url> b2b-website
cd b2b-website
npm install
```

### 2. 配置环境变量

```bash
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars`，填入实际值。完整变量列表：

| 变量 | 必填 | 说明 |
|------|------|------|
| `BETTER_AUTH_SECRET` | 是 | Better Auth 密钥（至少 32 位随机字符串，用于加密和签名） |
| `BETTER_AUTH_URL` | 是 | Better Auth 基础 URL（当前站点完整 URL，如 `https://cms.xxxx.com`） |
| `TURNSTILE_SECRET_KEY` | 是 | Turnstile 服务端密钥 |
| `ADMIN_EMAIL` | 是 | 接收通知的管理员邮箱 |
| `RESEND_API_KEY` | 是 | Resend API 密钥（主邮件通道） |
| `CRON_SECRET` | 是 | D1 自动备份端点鉴权密钥 |
| `TELEGRAM_BOT_TOKEN` | 否 | Telegram Bot Token |
| `TELEGRAM_CHAT_ID` | 否 | Telegram 群组/频道 ID |
| `WECOM_WEBHOOK_URL` | 否 | 企业微信机器人 Webhook 地址 |
| `R2_ACCESS_KEY_ID` | 是 | R2 API 访问密钥 |
| `R2_SECRET_ACCESS_KEY` | 是 | R2 API 密钥 |
| `R2_ACCOUNT_ID` | 是 | Cloudflare 账户 ID |
| `R2_BUCKET` | 是 | R2 存储桶名称（默认 `b2b-media`） |
| `PUBLIC_SITE_URL` | 是 | 前台完整 URL |
| `CMS_SITE_URL` | 是 | 后台完整 URL |
| `R2_PUBLIC_DOMAIN` | 是 | R2 公开访问域名 |
| `PUBLIC_TURNSTILE_SITE_KEY` | 是 | Turnstile 前端 Site Key |
| `GITHUB_OWNER` | 否 | Keystatic GitHub 模式仓库所有者 |
| `GITHUB_REPO` | 否 | Keystatic GitHub 模式仓库名 |
| `GITHUB_BRANCH` | 否 | Keystatic GitHub 模式分支（默认 `main`） |

### 3. 初始化 Cloudflare 资源

```bash
# 登录 Cloudflare
npx wrangler login

# 一键创建所有资源
npx wrangler d1 create b2b-db          # D1 数据库
npx wrangler r2 bucket create b2b-media # R2 存储桶
npx wrangler kv namespace create SESSION # KV 会话存储
npm run r2:public                       # 开启 R2 公开访问
npm run r2:domain                       # 绑定 R2 自定义域名
npm run queue:create                    # 创建通知队列
npm run queue:create-dlq                # 创建死信队列
npm run db:migrate                      # 执行本地数据库迁移（001 + 002）
```

> 将 `wrangler d1 create` 输出的 `database_id` 填入 `wrangler.jsonc`。

### 4. 创建管理员账号

```bash
# 启动开发服务器（另一个终端）
npm run dev

# 运行 seed 脚本（交互式输入邮箱和密码）
npm run seed:admin
```

> 或直接调用 API：`curl -X POST https://cms.xxxx.com/api/admin/seed -H "Authorization: Bearer YOUR_SECRET" -d '{"email":"admin@xxx.com","password":"yourpassword"}'`

### 5. 本地开发

```bash
npm run dev
# 访问 http://localhost:4321
```

### 6. 构建 & 预览

```bash
npm run build
npm run preview
```

## 部署

### 方式一：一键部署（推荐）

```bash
npm run deploy
# 等同于: astro build && wrangler deploy
```

> 首次部署前，确保 `wrangler.jsonc` 中的 `database_id`、`kv id` 等资源 ID 已正确填写。

### 方式二：GitHub Actions 自动部署

**配置 GitHub Secrets：**

| Secret | 说明 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API 令牌（需 Workers/D1/R2/Queue/KV 权限） |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID |
| `RESEND_API_KEY` | Resend API 密钥 |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token |
| `TELEGRAM_CHAT_ID` | Telegram 群组 ID |
| `WECOM_WEBHOOK_URL` | 企业微信 Webhook |

**工作流说明：**

- `deploy` — 推送到 `main` 分支自动触发：`astro build && wrangler deploy`
- `setup-infra` — 手动触发（`workflow_dispatch`）：一键创建 D1、R2、Queue 等全部基础设施

**首次部署步骤：**

1. 配置上述 GitHub Secrets
2. 在 GitHub Actions 页面手动触发 `setup-infra` workflow
3. 将创建的资源 ID 填入 `wrangler.jsonc`（`database_id`、`kv id`）
4. 推送代码，自动部署

### 方式三：本地手动部署

```bash
npm run build
npx wrangler deploy
```

## 架构详解

### Cloudflare Queue 通知流程

```
用户提交询价/评论
        │
        ▼
   Astro Action          ← 表单验证 + Turnstile + Honeypot + 隐私确认
   (src/actions/)            DB 入库
        │
        ▼
   Queue Producer         ← NOTIFICATION_QUEUE.send()
   (producer.ts)
        │
        ▼
   Cloudflare Queue       ← 消息缓冲，解耦通知发送
   b2b-notifications
        │
        ▼
   Queue Consumer         ← Worker 自动消费
   (consumer.ts)              max_batch_size: 10
                               max_batch_timeout: 5s
        │
        ├──► Resend (主邮件通道)
        ├──► Telegram Bot
        └──► 企业微信 Webhook
        │
        ▼
   失败处理: 重试 3 次 → 死信队列 b2b-notifications-dlq
                              │
                              ▼
                    DLQ Consumer → Telegram 告警
```

### 管理后台认证流程（Better Auth）

```
用户访问 cms.xxxx.com/admin/login
        │
        ▼
   输入 email + password
        │
        ▼
   POST /api/auth/sign-in/email
        │
        ▼
   Better Auth 验证（D1 + Drizzle ORM）
        │
        ▼ (成功)
   创建 session（存入 D1 session 表）
        │
        ▼
   Set-Cookie: better-auth.session_token（JWE 加密）
               HttpOnly; Secure; SameSite=Lax; Max-Age=604800
        │
        ▼
   后续请求 → Better Auth 验证 Cookie + 查询 D1 session → 放行/拒绝
        │
        ▼ (注销)
   POST /api/auth/sign-out → 删除 D1 session + 清除 Cookie
```

### R2 媒体存储 & 防盗链

**上传流程：**

```
前端 → POST /api/upload（Turnstile 验证 + Referer 校验）
     → MIME Magic Bytes 二次校验
     → 生成 R2 Presigned URL
     → 前端直传 R2（不经过 Worker，节省带宽）
     → 返回公开访问 URL: https://media.xxxx.com/uploads/xxx.jpg
```

**防盗链策略（双层）：**

1. **代码层** — `src/lib/storage/r2.ts` 的 `isRefererAllowed()` 校验上传请求来源
2. **Cloudflare 层**（推荐）— 为 `media.xxxx.com` 配置 Transform Rules 或 WAF Custom Rules，阻止非白名单 Referer 访问

### D1 自动备份

```
Cron Trigger (每天 03:00 UTC)
        │
        ▼
   GET /api/cron/backup (Bearer Token 鉴权)
        │
        ├──► 导出 inquiries + comments 全量数据
        ├──► 上传 JSON 到 R2: backups/d1-YYYY-MM-DD.json
        └──► 清理 30 天前的备份文件
```

### 内容管理（Keystatic CMS）

**产品字段：** 名称、描述、分类、标签、封面图、图片库、规格书、特点、技术规格（键值对）、价格说明、MOQ、交货周期、发布状态、排序

**新闻字段：** 标题、摘要、作者、封面图、标签、分类（公司动态/行业洞察/产品更新/技术分享）、发布日期、发布状态、排序

**站点设置（Settings Singleton）：**

| 分类 | 字段 |
|------|------|
| 公司信息 | 名称、标语、Logo、Favicon |
| 联系方式 | 电话、WhatsApp、邮箱、地址、工作时间 |
| 社交媒体 | LinkedIn、Facebook、Twitter/X、Instagram、YouTube、微信、微博、Alibaba、Made-in-China、Global Sources |
| SEO | 站点标题、描述、OG 图片、Google Analytics ID、站点验证 |
| 业务信息 | 营业执照、成立年份、员工数、年营收、主要出口市场、资质认证 |
| 页脚 | 版权文本、快捷链接 |
| 法律 | 隐私政策/服务条款生效日期 |

**存储模式（环境感知自动切换）：**
- 开发环境：`local` 模式（直接读写文件系统）
- 生产环境：`github` 模式（`CF_PAGES=1` 环境变量时自动启用，通过 GitHub API 读写仓库）

### 静态搜索（Pagefind）

**特性：**
- 构建时生成搜索索引，零运行时成本
- 支持产品、新闻、页面全文搜索
- 键盘快捷键：⌘K / Ctrl+K 打开搜索
- 结果导航：↑↓ 选择、Enter 打开、Esc 关闭
- 搜索提示按钮（Products、News、FAQ、About、Contact）

**实现：**
- `astro-pagefind` 集成（`astro.config.mjs`）
- `SearchModal.tsx`：React 搜索组件，自管理状态
- `Header.astro`：搜索按钮 + `toggle-search` CustomEvent

## 数据库结构

D1 数据库包含 7 张表：

**业务表**（`schema/migrations/001_initial.sql`）：

| 表 | 用途 | 主要字段 |
|----|------|----------|
| `inquiries` | 询价记录 | company_name, contact_name, email, phone, country, product_interest, quantity, message, attachments, status |
| `comments` | 文章评论 | news_id, parent_id, author_name, author_email, content, status, ip_address |
| `news` | 新闻文章（同步 Content Collections） | title, slug, content, author, cover_image, published |

**认证表**（`schema/migrations/002_better_auth.sql`）：

| 表 | 用途 | 主要字段 |
|----|------|----------|
| `user` | 用户 | id, name, email, emailVerified, image, createdAt, updatedAt |
| `session` | 会话 | id, token, userId, expiresAt, ipAddress, userAgent |
| `account` | 账户（OAuth） | id, accountId, providerId, userId, password |
| `verification` | 验证 | id, identifier, value, expiresAt |

## 常用命令

```bash
# 开发
npm run dev                # 启动本地开发服务器
npm run build              # 生产构建
npm run preview            # 预览构建结果

# 部署
npm run deploy             # 一键部署（build + wrangler deploy）
npm run deploy:preview     # 部署到 preview 环境

# 数据库
npm run db:migrate         # 本地 D1 迁移（001 + 002）
npm run db:migrate:remote  # 远程 D1 迁移
npm run db:migrate:auth    # 仅迁移认证表（002）
npm run seed:admin         # 创建管理员账号（需先启动 dev server）

# Cloudflare Queue
npm run queue:create       # 创建通知队列
npm run queue:create-dlq   # 创建死信队列
npm run queue:list         # 查看队列列表
npm run queue:purge        # 清空队列消息

# R2 存储
npm run r2:public          # 开启 R2 公开访问
npm run r2:domain          # 绑定 R2 自定义域名

# 工具
npm run types              # 生成 Cloudflare 类型声明
npm run keystatic:setup    # 初始化 Keystatic GitHub 模式
```

## 自定义指南

| 需求 | 修改位置 |
|------|----------|
| 品牌信息（名称/Logo/联系方式） | Keystatic CMS → Site Settings |
| 社交媒体链接 | Keystatic CMS → Site Settings → Social Media Links |
| SEO（标题/描述/Google Analytics） | Keystatic CMS → Site Settings → SEO Settings |
| WhatsApp 号码 | Keystatic CMS → Site Settings → Contact（自动显示 Header 按钮 + 悬浮组件） |
| 网站图标 | Keystatic CMS → Site Settings → Favicon |
| 配色/字体 | `tailwind.config.mjs` |
| 全局样式 | `src/styles/global.css` |
| 添加产品/新闻 | Keystatic CMS 或 `src/content/products/`、`src/content/news/` |
| 通知渠道 | `src/lib/notifications/` 目录下对应文件 |
| 域名 | `wrangler.jsonc`（routes）、`src/lib/routing.ts`（CMS_HOSTNAMES） |
| SEO 结构化数据 | 各页面 `.astro` 文件中的 JSON-LD script |
| 认证配置 | `src/lib/auth.ts`（Better Auth 工厂函数） |
| CSP 策略 | `public/_headers` |
| 备份频率 | `wrangler.jsonc`（triggers.crons） |
| 缓存 TTL | `src/lib/cache.ts`（默认 300 秒） |
| FAQ 内容 | `src/pages/faq.astro` |

## 许可证

MIT
