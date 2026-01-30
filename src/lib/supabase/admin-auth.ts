import { cookies } from 'next/headers';
import { createSupabaseAdmin } from './server';
import crypto from 'crypto';

const supabase = createSupabaseAdmin();

// ============================================================
// Session Management
// ============================================================

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// In-memory CSRF store (OK for serverless since each request gets fresh context;
// CSRF validation happens within the same request lifecycle via cookies)
const csrfTokens = new Map<string, { token: string; expires: number }>();

export function storeCsrfToken(sessionId: string, token: string): void {
  csrfTokens.set(sessionId, {
    token,
    expires: Date.now() + 30 * 60 * 1000, // 30 min
  });
}

export function validateCsrfToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  if (!stored || stored.token !== token || Date.now() > stored.expires) {
    csrfTokens.delete(sessionId);
    return false;
  }
  csrfTokens.delete(sessionId); // one-time use
  return true;
}

// ============================================================
// Supabase Auth Operations
// ============================================================

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function getAdminUser(userId: string) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, display_name, role, is_active, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateAdminUser(userId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('admin_users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id, email, display_name, name, role, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
}

export async function updatePassword(userId: string, newPassword: string) {
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });
  if (error) throw error;
  return data;
}

// ============================================================
// Session CRUD
// ============================================================

export async function createSession(sessionData: {
  id: string;
  user_id: string;
  expires_at: string;
  ip_address: string;
  user_agent: string;
  last_activity: string;
}) {
  const { data, error } = await supabase
    .from('admin_sessions')
    .insert(sessionData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSession(sessionId: string) {
  const { data, error } = await supabase
    .from('admin_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) return null;
  return data;
}

export async function deleteSession(sessionId: string) {
  await supabase.from('admin_sessions').delete().eq('id', sessionId);
}

export async function updateSessionActivity(sessionId: string) {
  await supabase
    .from('admin_sessions')
    .update({ last_activity: new Date().toISOString() })
    .eq('id', sessionId);
}

export async function cleanExpiredSessions() {
  await supabase
    .from('admin_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString());
}

// ============================================================
// Admin User Management
// ============================================================

export async function getAdminUsers() {
  const { data: adminUsers, error } = await supabase
    .from('admin_users')
    .select('id, email, display_name, role, is_active, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const userIds = (adminUsers || []).map((u) => u.id);
  const { data: sessions } = await supabase
    .from('admin_sessions')
    .select('user_id, created_at')
    .in('user_id', userIds)
    .order('created_at', { ascending: false });

  const lastLoginMap: Record<string, string> = {};
  (sessions || []).forEach((s) => {
    if (!lastLoginMap[s.user_id]) lastLoginMap[s.user_id] = s.created_at;
  });

  return (adminUsers || []).map((user) => ({
    id: user.id,
    email: user.email,
    name: user.display_name || user.email,
    role: user.role || 'admin',
    isActive: user.is_active,
    createdAt: user.created_at,
    lastLogin: lastLoginMap[user.id] || null,
  }));
}

export async function inviteAdmin(email: string, role: string = 'admin') {
  // Check if user already exists
  const { data: existing } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) throw new Error('該電子郵件已存在於系統中');

  // Create auth user
  const tempPassword = crypto.randomBytes(16).toString('hex');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { invited_at: new Date().toISOString(), role },
  });
  if (authError) throw authError;

  // Create admin_users record
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .insert({
      id: authData.user.id,
      email,
      role,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (adminError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw adminError;
  }

  return adminUser;
}

export async function updateAdminUserDetails(userId: string, updates: { role?: string; isActive?: boolean }) {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.role !== undefined) updateData.role = updates.role;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  const { data, error } = await supabase
    .from('admin_users')
    .update(updateData)
    .eq('id', userId)
    .select('id, email, display_name, role, is_active, created_at, updated_at')
    .single();

  if (error) throw error;

  if (updates.isActive === false) {
    await supabase.from('admin_sessions').delete().eq('user_id', userId);
  }

  return {
    id: data.id,
    email: data.email,
    name: data.display_name || data.email,
    role: data.role,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// ============================================================
// Token Management (invitation & password reset)
// ============================================================

export async function createInvitationToken(email: string, role: string, invitedBy: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48);

  const { data, error } = await supabase
    .from('admin_tokens')
    .insert({ token, type: 'invitation', email, role, expires_at: expiresAt.toISOString(), created_by: invitedBy })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function validateInvitationToken(token: string) {
  const { data } = await supabase
    .from('admin_tokens')
    .select('*')
    .eq('token', token)
    .eq('type', 'invitation')
    .gt('expires_at', new Date().toISOString())
    .is('used_at', null)
    .single();

  return data;
}

export async function acceptInvitation(token: string, password: string) {
  const tokenData = await validateInvitationToken(token);
  if (!tokenData) throw new Error('Invalid or expired invitation token');

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: tokenData.email,
    password,
    email_confirm: true,
  });
  if (authError) throw authError;

  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .insert({
      id: authData.user.id,
      email: tokenData.email,
      role: tokenData.role || 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (adminError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw adminError;
  }

  await supabase.from('admin_tokens').update({ used_at: new Date().toISOString(), user_id: authData.user.id }).eq('token', token);

  return { user: adminUser, authData };
}

export async function createPasswordResetToken(email: string) {
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, email, display_name')
    .eq('email', email)
    .eq('is_active', true)
    .single();

  if (!adminUser) return null;

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  const { data, error } = await supabase
    .from('admin_tokens')
    .insert({ token, type: 'password_reset', email, user_id: adminUser.id, expires_at: expiresAt.toISOString() })
    .select()
    .single();

  if (error) throw error;
  return { token: data.token, user: adminUser };
}

export async function validatePasswordResetToken(token: string) {
  const { data } = await supabase
    .from('admin_tokens')
    .select('*')
    .eq('token', token)
    .eq('type', 'password_reset')
    .gt('expires_at', new Date().toISOString())
    .is('used_at', null)
    .single();

  return data;
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  const tokenData = await validatePasswordResetToken(token);
  if (!tokenData) throw new Error('Invalid or expired reset token');

  await updatePassword(tokenData.user_id, newPassword);
  await supabase.from('admin_tokens').update({ used_at: new Date().toISOString() }).eq('token', token);

  try {
    await updateAdminUser(tokenData.user_id, { last_password_change: new Date().toISOString() });
  } catch {
    // Column may not exist
  }

  return await getAdminUser(tokenData.user_id);
}

// ============================================================
// Middleware Helper: Authenticate Admin from Request
// ============================================================

export async function authenticateAdmin(request: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin-session')?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await getSession(sessionToken);
  if (!session) return null;

  if (new Date(session.expires_at) < new Date()) {
    await deleteSession(sessionToken);
    return null;
  }

  const adminUser = await getAdminUser(session.user_id);
  if (!adminUser || !adminUser.is_active) {
    await deleteSession(sessionToken);
    return null;
  }

  // Update activity in background (don't await)
  updateSessionActivity(sessionToken).catch(() => {});

  return {
    id: adminUser.id,
    email: adminUser.email,
    name: adminUser.display_name || adminUser.email,
    display_name: adminUser.display_name,
    role: adminUser.role || 'admin',
    created_at: adminUser.created_at,
    updated_at: adminUser.updated_at,
  };
}
