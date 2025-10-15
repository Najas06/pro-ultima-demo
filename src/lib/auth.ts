import bcrypt from 'bcryptjs';
import { createClient } from '@/lib/supabase/client';
import type { AuthUser, LoginCredentials } from '@/types/auth';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Authenticate an admin user
 */
export async function authenticateAdmin(email: string, password: string): Promise<AuthUser | null> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      console.error('Admin not found:', error);
      return null;
    }

    const isValid = await verifyPassword(password, data.password_hash);
    
    if (!isValid) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: 'admin',
    };
  } catch (error) {
    console.error('Admin authentication error:', error);
    return null;
  }
}

/**
 * Authenticate a staff user using custom auth (password_hash)
 */
export async function authenticateStaff(email: string, password: string): Promise<AuthUser | null> {
  const supabase = createClient();
  
  try {
    // Fetch staff record by email
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (staffError || !staffData) {
      console.error('Staff not found:', staffError);
      return null;
    }

    // Verify password using password_hash
    const isValid = await verifyPassword(password, staffData.password_hash);
    
    if (!isValid) {
      console.error('Invalid password for staff:', email);
      return null;
    }

    // Update last login time
    await supabase
      .from('staff')
      .update({ last_login: new Date().toISOString() })
      .eq('id', staffData.id);

    return {
      id: staffData.id, // Staff table ID
      staffId: staffData.id,
      email: staffData.email,
      name: staffData.name,
      role: staffData.role, // Use actual role from database (project-manager, etc.)
      department: staffData.department,
      branch: staffData.branch,
      profileImage: staffData.profile_image_url || undefined,
    };
  } catch (error) {
    console.error('Staff authentication error:', error);
    return null;
  }
}

/**
 * Authenticate user (checks admin first, then staff)
 */
export async function authenticateUser(credentials: LoginCredentials): Promise<AuthUser | null> {
  // Try admin authentication first
  const admin = await authenticateAdmin(credentials.email, credentials.password);
  if (admin) {
    return admin;
  }

  // Try staff authentication
  const staff = await authenticateStaff(credentials.email, credentials.password);
  if (staff) {
    return staff;
  }

  return null;
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userJson = localStorage.getItem('auth_user');
    if (!userJson) return null;
    
    return JSON.parse(userJson) as AuthUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Save user to localStorage
 */
export function saveUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_user', JSON.stringify(user));
}

/**
 * Remove user from localStorage
 */
export function clearUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_user');
}

/**
 * Generate a random password
 */
export function generatePassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

