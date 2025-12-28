export interface Env {
  // D1 Database
  DB: D1Database;
  
  // R2 Storage
  R2: R2Bucket;
  
  // Environment variables
  ENVIRONMENT: string;
  SITE_NAME: string;
  SITE_URL: string;
  
  // Secrets (set via wrangler secret put)
  ADMIN_PASSWORD: string;
  LIBRARY_PASSWORD: string;
}

export interface RequestContext {
  ip: string;
  userAgent: string;
  url: URL;
}

export interface Document {
  id: string;
  title: string;
  description: string;
  category: string;
  filename: string;
  upload_date: string;
  file_size: number;
}

export interface SecurityLog {
  id?: number;
  timestamp: string;
  ip: string;
  event: string;
  details: string;
}

export interface AuthContext {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMember: boolean;
  error?: string;
}
