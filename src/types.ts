export interface Env {
  // D1 Database
  DB: D1Database;
  
  // R2 Storage
  R2: R2Bucket;
  
  // Environment variables
  ENVIRONMENT: string;
  DEV_MODE?: string; // "true" to disable caching for testing
  SITE_NAME: string;
  SITE_URL: string;
  SECRETARY_EMAIL: string; // Email address for form submission notifications
  RESEND_API_KEY: string; // Resend API key for sending emails
  
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

/**
 * User roles in the system
 * Roles have hierarchical permissions for access control
 * 
 * super_admin: Can manage admin accounts, full system access
 * admin: Can manage members and content, but not other admins
 * member: Can download member-only documents, view extended metadata
 */
export type UserRole = 'super_admin' | 'admin' | 'member';

/**
 * User record from the database
 * Represents a lodge member with access to the system
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_active: boolean;
}

/**
 * Input for creating a new user
 * All fields required except role (defaults to 'member')
 */
export interface CreateUserInput {
  email: string;
  name: string;
  role?: UserRole;
}

/**
 * Input for updating an existing user
 * All fields optional - only provided fields will be updated
 */
export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: UserRole;
  is_active?: boolean;
}

/**
 * User session record
 * Represents an active user authentication session
 */
export interface UserSession {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

/**
 * Query options for listing users
 * Supports filtering and pagination
 */
export interface UserListOptions {
  role?: UserRole;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}
