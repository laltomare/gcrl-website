/**
 * User Management Routes
 * ======================
 * 
 * Handles all user management routes in the admin panel.
 * Provides full CRUD operations for managing lodge members.
 * 
 * Routes:
 * GET  /admin/users              - List all users with filtering
 * GET  /admin/users/:id          - View user details
 * GET  /admin/users/new          - Create user form
 * POST /admin/users              - Create user (submit)
 * GET  /admin/users/:id/edit     - Edit user form
 * POST /admin/users/:id          - Update user (submit)
 * POST /admin/users/:id/delete   - Delete user
 * POST /admin/users/:id/activate - Activate user
 * POST /admin/users/:id/deactivate - Deactivate user
 * POST /admin/users/:id/sessions/:sessionId/delete - Revoke session
 * POST /admin/users/:id/sessions/delete-all - Revoke all sessions
 * 
 * Security:
 * - All routes require admin authentication
 * - Role-based access control enforced
 * - CSRF protection via session tokens
 * - Input sanitization on all inputs
 * 
 * @author Lawrence Altomare
 * @created January 3, 2026
 */

import { Env } from '../types';
import { 
  createUser, 
  getUserById, 
  listUsers, 
  updateUser, 
  deleteUser,
  getUserSessions
} from '../lib/users';
import {
  deleteUserSessions,
  deleteSession
} from '../lib/user-sessions';
import {
  UsersListPage,
  UserDetailPage,
  CreateUserFormPage,
  EditUserFormPage
} from '../lib/pages/users';
import { sanitizeInput } from '../lib/sanitize';

/**
 * Handle user list page
 * GET /admin/users
 */
export async function handleUsersList(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const params = new URLSearchParams(url.search);

    // Parse filters
    const filters: any = {};
    if (params.get('role')) {
      filters.role = params.get('role');
    }
    if (params.get('status') === 'active') {
      filters.is_active = true;
    } else if (params.get('status') === 'inactive') {
      filters.is_active = false;
    }

    // Fetch users
    const users = await listUsers(env.DB, filters);

    // Render page
    const html = UsersListPage(users, filters);
    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    });
  } catch (error) {
    console.error('Error loading users list:', error);
    return new Response('Error loading users', { status: 500 });
  }
}

/**
 * Handle user detail page
 * GET /admin/users/:id
 */
export async function handleUserDetail(request: Request, env: Env, userId: string): Promise<Response> {
  try {
    // Fetch user
    const user = await getUserById(env.DB, userId);
    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    // Fetch user sessions
    const sessions = await getUserSessions(env.DB, userId);

    // Render page
    const html = UserDetailPage(user, sessions);
    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    });
  } catch (error) {
    console.error('Error loading user detail:', error);
    return new Response('Error loading user', { status: 500 });
  }
}

/**
 * Handle create user form
 * GET /admin/users/new
 */
export async function handleCreateUserForm(): Promise<Response> {
  const html = CreateUserFormPage();
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

/**
 * Handle create user submission
 * POST /admin/users
 */
export async function handleCreateUser(request: Request, env: Env): Promise<Response> {
  try {
    const formData = await request.formData();
    const email = sanitizeInput(formData.get('email') as string);
    const name = sanitizeInput(formData.get('name') as string);
    const role = sanitizeInput(formData.get('role') as string);

    // Validate
    if (!email || !name || !role) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Create user
    const user = await createUser(env.DB, {
      email,
      name,
      role: role as any,
    });

    // Redirect to user detail page
    return Response.redirect(`${request.url}/${user.id}`, 302);
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Return to form with error
    return new Response(error.message || 'Error creating user', { status: 400 });
  }
}

/**
 * Handle edit user form
 * GET /admin/users/:id/edit
 */
export async function handleEditUserForm(request: Request, env: Env, userId: string): Promise<Response> {
  try {
    // Fetch user
    const user = await getUserById(env.DB, userId);
    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    // Render page
    const html = EditUserFormPage(user);
    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    });
  } catch (error) {
    console.error('Error loading edit form:', error);
    return new Response('Error loading edit form', { status: 500 });
  }
}

/**
 * Handle update user submission
 * POST /admin/users/:id
 */
export async function handleUpdateUser(request: Request, env: Env, userId: string): Promise<Response> {
  try {
    const formData = await request.formData();
    const email = sanitizeInput(formData.get('email') as string);
    const name = sanitizeInput(formData.get('name') as string);
    const role = sanitizeInput(formData.get('role') as string);
    const isActive = formData.get('is_active') === '1';

    // Build update object
    const updateData: any = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    updateData.is_active = isActive;

    // Update user
    const user = await updateUser(env.DB, userId, updateData);
    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    // Redirect to user detail page
    return Response.redirect(new URL(request.url).pathname.replace('/edit', ''), 302);
  } catch (error: any) {
    console.error('Error updating user:', error);
    return new Response(error.message || 'Error updating user', { status: 400 });
  }
}

/**
 * Handle delete user
 * POST /admin/users/:id/delete
 */
export async function handleDeleteUser(request: Request, env: Env, userId: string): Promise<Response> {
  try {
    // Check if user exists
    const user = await getUserById(env.DB, userId);
    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    // Delete user (sessions will cascade)
    await deleteUser(env.DB, userId);

    // Redirect to users list
    const url = new URL(request.url);
    const listUrl = url.pathname.replace(/\/users\/.*/, '/users');
    return Response.redirect(listUrl, 302);
  } catch (error) {
    console.error('Error deleting user:', error);
    return new Response('Error deleting user', { status: 500 });
  }
}

/**
 * Handle activate user
 * POST /admin/users/:id/activate
 */
export async function handleActivateUser(request: Request, env: Env, userId: string): Promise<Response> {
  try {
    await updateUser(env.DB, userId, { is_active: true });

    // Redirect to user detail page
    const url = new URL(request.url);
    const detailUrl = url.pathname.replace('/activate', '');
    return Response.redirect(detailUrl, 302);
  } catch (error) {
    console.error('Error activating user:', error);
    return new Response('Error activating user', { status: 500 });
  }
}

/**
 * Handle deactivate user
 * POST /admin/users/:id/deactivate
 */
export async function handleDeactivateUser(request: Request, env: Env, userId: string): Promise<Response> {
  try {
    await updateUser(env.DB, userId, { is_active: false });

    // Redirect to user detail page
    const url = new URL(request.url);
    const detailUrl = url.pathname.replace('/deactivate', '');
    return Response.redirect(detailUrl, 302);
  } catch (error) {
    console.error('Error deactivating user:', error);
    return new Response('Error deactivating user', { status: 500 });
  }
}

/**
 * Handle revoke single session
 * POST /admin/users/:id/sessions/:sessionId/delete
 */
export async function handleRevokeSession(request: Request, env: Env, userId: string, sessionId: string): Promise<Response> {
  try {
    // Note: We're deleting by session ID, but our deleteSession function uses token
    // We need to fetch the session first to get the token
    const sessions = await getUserSessions(env.DB, userId);
    const session = sessions.find(s => s.id === sessionId);

    if (!session) {
      return new Response('Session not found', { status: 404 });
    }

    await deleteSession(env.DB, session.token);

    // Redirect to user detail page
    const url = new URL(request.url);
    const detailUrl = url.pathname.replace(/\/sessions\/.*/, '');
    return Response.redirect(detailUrl, 302);
  } catch (error) {
    console.error('Error revoking session:', error);
    return new Response('Error revoking session', { status: 500 });
  }
}

/**
 * Handle revoke all sessions
 * POST /admin/users/:id/sessions/delete-all
 */
export async function handleRevokeAllSessions(request: Request, env: Env, userId: string): Promise<Response> {
  try {
    await deleteUserSessions(env.DB, userId);

    // Redirect to user detail page
    const url = new URL(request.url);
    const detailUrl = url.pathname.replace(/\/sessions\/.*/, '');
    return Response.redirect(detailUrl, 302);
  } catch (error) {
    console.error('Error revoking all sessions:', error);
    return new Response('Error revoking sessions', { status: 500 });
  }
}
