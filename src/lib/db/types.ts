// Database types and utilities

export interface Inquiry {
  id: number;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  country?: string;
  product_interest?: string;
  quantity?: string;
  message: string;
  attachments?: string;
  status: 'pending' | 'contacted' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface News {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  author: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  news_id: number;
  parent_id?: number;
  author_name: string;
  author_email?: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
}
