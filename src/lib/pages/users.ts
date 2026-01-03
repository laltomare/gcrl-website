/**
 * User Management Page Components
 * ===============================
 * 
 * Provides HTML components for user management in the admin panel.
 * Includes list views, detail views, and forms for creating/editing users.
 * 
 * Components:
 * - UsersListPage: Display all users with filtering
 * - UserDetailPage: Show individual user details
 * - CreateUserFormPage: Form to create new user
 * - EditUserFormPage: Form to edit existing user
 * 
 * Features:
 * - Responsive design
 * - Role-based display
 * - Status indicators (active/inactive)
 * - Action buttons with confirmation
 * - Filter by role and status
 * 
 * @author Lawrence Altomare
 * @created January 3, 2026
 */

import { BasePage } from './base';
import { HTML } from './base';
import { User, UserSession, UserRole } from '../../types';

/**
 * Format a date for display
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get badge CSS class for user role
 */
function getRoleBadgeClass(role: UserRole): string {
  const classes: Record<UserRole, string> = {
    admin: 'bg-purple-100 text-purple-800',
    secretary: 'bg-blue-100 text-blue-800',
    member: 'bg-green-100 text-green-800',
    guest: 'bg-gray-100 text-gray-800',
  };
  return classes[role] || classes.member;
}

/**
 * Get badge CSS class for active status
 */
function getStatusBadgeClass(isActive: boolean): string {
  return isActive
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800';
}

/**
 * Users List Page Component
 * Displays all users in a table with filtering and actions
 */
export function UsersListPage(
  users: User[],
  filters?: { role?: UserRole; is_active?: boolean }
): string {
  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const memberCount = users.filter(u => u.role === 'member').length;

  return BasePage({
    title: 'User Management',
    content: `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">User Management</h1>
            <p class="text-gray-600 mt-1">Manage lodge members and their access</p>
          </div>
          <a href="/admin/users/new" 
             class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Add User
          </a>
        </div>

        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="text-sm font-medium text-gray-600">Total Users</div>
            <div class="text-3xl font-bold text-gray-900 mt-2">${totalUsers}</div>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <div class="text-sm font-medium text-gray-600">Active Users</div>
            <div class="text-3xl font-bold text-green-600 mt-2">${activeUsers}</div>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <div class="text-sm font-medium text-gray-600">Admins</div>
            <div class="text-3xl font-bold text-purple-600 mt-2">${adminCount}</div>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <div class="text-sm font-medium text-gray-600">Members</div>
            <div class="text-3xl font-bold text-blue-600 mt-2">${memberCount}</div>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex flex-wrap gap-4 items-center">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
              <select onchange="window.location.href = this.value" 
                      class="border border-gray-300 rounded-lg px-3 py-2">
                <option value="/admin/users">All Roles</option>
                <option value="/admin/users?role=admin" ${filters?.role === 'admin' ? 'selected' : ''}>Admin</option>
                <option value="/admin/users?role=secretary" ${filters?.role === 'secretary' ? 'selected' : ''}>Secretary</option>
                <option value="/admin/users?role=member" ${filters?.role === 'member' ? 'selected' : ''}>Member</option>
                <option value="/admin/users?role=guest" ${filters?.role === 'guest' ? 'selected' : ''}>Guest</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select onchange="window.location.href = this.value"
                      class="border border-gray-300 rounded-lg px-3 py-2">
                <option value="/admin/users">All Status</option>
                <option value="/admin/users?status=active" ${filters?.is_active === true ? 'selected' : ''}>Active</option>
                <option value="/admin/users?status=inactive" ${filters?.is_active === false ? 'selected' : ''}>Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Users Table -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${users.length === 0 ? `
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                    No users found. ${filters ? 'Try adjusting your filters or ' : ''}<a href="/admin/users/new" class="text-blue-600 hover:underline">create a new user</a>.
                  </td>
                </tr>
              ` : users.map(user => `
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${HTML.escape(user.name)}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${HTML.escape(user.email)}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}">
                      ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(user.is_active)}">
                      ${user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(user.last_login)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex gap-2">
                      <a href="/admin/users/${user.id}" class="text-blue-600 hover:text-blue-900">View</a>
                      <a href="/admin/users/${user.id}/edit" class="text-indigo-600 hover:text-indigo-900">Edit</a>
                      ${user.is_active ? `
                        <form method="POST" action="/admin/users/${user.id}/deactivate" class="inline">
                          <button type="submit" 
                                  onclick="return confirm('Deactivate ${HTML.escape(user.name)}?')"
                                  class="text-red-600 hover:text-red-900 ml-2">Deactivate</button>
                        </form>
                      ` : `
                        <form method="POST" action="/admin/users/${user.id}/activate" class="inline">
                          <button type="submit" class="text-green-600 hover:text-green-900 ml-2">Activate</button>
                        </form>
                      `}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Back to Dashboard -->
        <div class="mt-6">
          <a href="/admin/dashboard" class="text-gray-600 hover:text-gray-900">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    `,
  });
}

/**
 * User Detail Page Component
 * Shows detailed information about a specific user
 */
export function UserDetailPage(user: User, sessions: UserSession[]): string {
  const activeSessionsCount = sessions.length;

  return BasePage({
    title: `User: ${user.name}`,
    content: `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
          <div>
            <a href="/admin/users" class="text-gray-600 hover:text-gray-900 mb-2 inline-block">← Back to Users</a>
            <h1 class="text-3xl font-bold text-gray-900">${HTML.escape(user.name)}</h1>
            <p class="text-gray-600 mt-1">${HTML.escape(user.email)}</p>
          </div>
          <div class="flex gap-2">
            <a href="/admin/users/${user.id}/edit"
               class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium">
              Edit User
            </a>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- User Information -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
            <dl class="space-y-4">
              <div>
                <dt class="text-sm font-medium text-gray-500">User ID</dt>
                <dd class="text-sm text-gray-900 font-mono mt-1">${user.id}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Name</dt>
                <dd class="text-sm text-gray-900 mt-1">${HTML.escape(user.name)}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Email</dt>
                <dd class="text-sm text-gray-900 mt-1">${HTML.escape(user.email)}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Role</dt>
                <dd class="mt-1">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}">
                    ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Status</dt>
                <dd class="mt-1">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(user.is_active)}">
                    ${user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Member Since</dt>
                <dd class="text-sm text-gray-900 mt-1">${formatDate(user.created_at)}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd class="text-sm text-gray-900 mt-1">${formatDate(user.updated_at)}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Last Login</dt>
                <dd class="text-sm text-gray-900 mt-1">${formatDate(user.last_login)}</dd>
              </div>
            </dl>
          </div>

          <!-- Sessions -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold text-gray-900">Active Sessions</h2>
              <span class="text-sm text-gray-600">${activeSessionsCount} active</span>
            </div>
            
            ${activeSessionsCount === 0 ? `
              <p class="text-gray-500 text-sm py-8 text-center">No active sessions</p>
            ` : `
              <div class="space-y-3">
                ${sessions.map(session => `
                  <div class="border border-gray-200 rounded-lg p-3">
                    <div class="flex justify-between items-start">
                      <div>
                        <div class="text-sm font-medium text-gray-900 font-mono">
                          ${session.token.substring(0, 8)}...
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                          Created: ${formatDate(session.created_at)}
                        </div>
                        <div class="text-xs text-gray-500">
                          Expires: ${formatDate(session.expires_at)}
                        </div>
                      </div>
                      <form method="POST" action="/admin/users/${user.id}/sessions/${session.id}/delete" class="inline">
                        <button type="submit"
                                onclick="return confirm('Revoke this session?')"
                                class="text-sm text-red-600 hover:text-red-900">
                          Revoke
                        </button>
                      </form>
                    </div>
                  </div>
                `).join('')}
              </div>
              
              <div class="mt-4 pt-4 border-t border-gray-200">
                <form method="POST" action="/admin/users/${user.id}/sessions/delete-all"
                      onsubmit="return confirm('Revoke ALL sessions for ${HTML.escape(user.name)}? This will force them to logout everywhere.');">
                  <button type="submit" class="text-sm text-red-600 hover:text-red-900 font-medium">
                    Revoke All Sessions
                  </button>
                </form>
              </div>
            `}
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="bg-white rounded-lg shadow p-6 border border-red-200">
          <h2 class="text-lg font-semibold text-red-900 mb-2">Danger Zone</h2>
          <p class="text-sm text-gray-600 mb-4">
            Irreversible and destructive actions. Proceed with caution.
          </p>
          <form method="POST" action="/admin/users/${user.id}/delete"
                onsubmit="return confirm('PERMANENTLY DELETE ${HTML.escape(user.name)}? This action cannot be undone and will cascade to delete all sessions.');">
            <button type="submit" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium">
              Delete User
            </button>
          </form>
        </div>
      </div>
    `,
  });
}

/**
 * Create User Form Page Component
 * Form to create a new user
 */
export function CreateUserFormPage(): string {
  return BasePage({
    title: 'Create New User',
    content: `
      <div class="max-w-2xl">
        <!-- Header -->
        <div class="mb-6">
          <a href="/admin/users" class="text-gray-600 hover:text-gray-900 mb-2 inline-block">← Back to Users</a>
          <h1 class="text-3xl font-bold text-gray-900">Create New User</h1>
          <p class="text-gray-600 mt-1">Add a new lodge member to the system</p>
        </div>

        <!-- Form -->
        <div class="bg-white rounded-lg shadow p-6">
          <form method="POST" action="/admin/users" class="space-y-6">
            <!-- Name -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">
                Full Name <span class="text-red-500">*</span>
              </label>
              <input type="text"
                     id="name"
                     name="name"
                     required
                     class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                     placeholder="Worshipful Brother John Doe">
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                Email Address <span class="text-red-500">*</span>
              </label>
              <input type="email"
                     id="email"
                     name="email"
                     required
                     class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                     placeholder="brother@example.com">
              <p class="text-xs text-gray-500 mt-1">
                A login invitation will be sent to this email
              </p>
            </div>

            <!-- Role -->
            <div>
              <label for="role" class="block text-sm font-medium text-gray-700">
                Role <span class="text-red-500">*</span>
              </label>
              <select id="role"
                      name="role"
                      required
                      class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="member" selected>Member - Standard access</option>
                <option value="guest">Guest - Limited access</option>
                <option value="secretary">Secretary - Can manage requests</option>
                <option value="admin">Admin - Full access</option>
              </select>
              <p class="text-xs text-gray-500 mt-1">
                Select the appropriate permission level
              </p>
            </div>

            <!-- Submit Button -->
            <div class="flex gap-3 pt-4">
              <button type="submit"
                      class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
                Create User
              </button>
              <a href="/admin/users"
                 class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium inline-block">
                Cancel
              </a>
            </div>
          </form>
        </div>
      </div>
    `,
  });
}

/**
 * Edit User Form Page Component
 * Form to edit an existing user
 */
export function EditUserFormPage(user: User): string {
  return BasePage({
    title: `Edit User: ${user.name}`,
    content: `
      <div class="max-w-2xl">
        <!-- Header -->
        <div class="mb-6">
          <a href="/admin/users/${user.id}" class="text-gray-600 hover:text-gray-900 mb-2 inline-block">← Back to User</a>
          <h1 class="text-3xl font-bold text-gray-900">Edit User</h1>
          <p class="text-gray-600 mt-1">Update user information and permissions</p>
        </div>

        <!-- Form -->
        <div class="bg-white rounded-lg shadow p-6">
          <form method="POST" action="/admin/users/${user.id}" class="space-y-6">
            <!-- Name -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">
                Full Name <span class="text-red-500">*</span>
              </label>
              <input type="text"
                     id="name"
                     name="name"
                     required
                     value="${HTML.escape(user.name)}"
                     class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500">
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                Email Address <span class="text-red-500">*</span>
              </label>
              <input type="email"
                     id="email"
                     name="email"
                     required
                     value="${HTML.escape(user.email)}"
                     class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500">
            </div>

            <!-- Role -->
            <div>
              <label for="role" class="block text-sm font-medium text-gray-700">
                Role <span class="text-red-500">*</span>
              </label>
              <select id="role"
                      name="role"
                      required
                      class="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="member" ${user.role === 'member' ? 'selected' : ''}>Member</option>
                <option value="guest" ${user.role === 'guest' ? 'selected' : ''}>Guest</option>
                <option value="secretary" ${user.role === 'secretary' ? 'selected' : ''}>Secretary</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
              </select>
            </div>

            <!-- Status -->
            <div>
              <label class="flex items-center">
                <input type="checkbox"
                       name="is_active"
                       value="1"
                       ${user.is_active ? 'checked' : ''}
                       class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                <span class="ml-2 text-sm font-medium text-gray-700">Active User</span>
              </label>
              <p class="text-xs text-gray-500 mt-1 ml-6">
                Uncheck to deactivate user (they will not be able to login)
              </p>
            </div>

            <!-- Submit Button -->
            <div class="flex gap-3 pt-4 border-t border-gray-200">
              <button type="submit"
                      class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
                Update User
              </button>
              <a href="/admin/users/${user.id}"
                 class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium inline-block">
                Cancel
              </a>
            </div>
          </form>
        </div>

        <!-- Additional Actions -->
        <div class="bg-white rounded-lg shadow p-6 mt-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Additional Actions</h2>
          <div class="space-y-3">
            ${user.is_active ? `
              <form method="POST" action="/admin/users/${user.id}/deactivate" class="inline">
                <button type="submit"
                        onclick="return confirm('Deactivate ${HTML.escape(user.name)}?')"
                        class="text-red-600 hover:text-red-900 font-medium">
                  Deactivate User
                </button>
              </form>
            ` : `
              <form method="POST" action="/admin/users/${user.id}/activate" class="inline">
                <button type="submit" class="text-green-600 hover:text-green-900 font-medium">
                  Activate User
                </button>
              </form>
            `}
          </div>
        </div>
      </div>
    `,
  });
}
