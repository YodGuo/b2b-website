-- ============================================
-- B2B Website Database Schema
-- Version: 1.0
-- Created: 2025-04-14
-- ============================================

-- 询价表
CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    country TEXT,
    product_interest TEXT,
    quantity TEXT,
    message TEXT NOT NULL,
    attachments TEXT,  -- JSON数组存储R2文件URL
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'contacted', 'closed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 新闻文章表
CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    cover_image TEXT,
    author TEXT DEFAULT 'Admin',
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    news_id INTEGER NOT NULL,
    parent_id INTEGER,  -- 用于回复功能
    author_name TEXT NOT NULL,
    author_email TEXT,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);
CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at);
CREATE INDEX IF NOT EXISTS idx_comments_news_id ON comments(news_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- 插入示例新闻数据
INSERT INTO news (slug, title, content, excerpt, author, published_at) VALUES
('welcome-to-our-website', '欢迎访问我们的网站', '<p>感谢您访问我们的B2B平台。我们致力于为您提供最优质的产品和服务。</p><p>如有任何疑问，请随时联系我们。</p>', '感谢您访问我们的B2B平台，我们致力于为您提供最优质的产品和服务。', 'Admin', datetime('now', '-7 days')),
('industry-trends-2025', '2025年行业趋势展望', '<p>随着全球经济的持续发展，B2B行业正在经历深刻的变革。</p><p>数字化转型、可持续发展、供应链优化将成为今年的关键词。</p>', '2025年B2B行业趋势展望：数字化转型、可持续发展、供应链优化。', 'Admin', datetime('now', '-3 days'));
