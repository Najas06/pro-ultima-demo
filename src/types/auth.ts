export type UserRole = 'admin' | 'staff';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  staffId?: string; // Only for staff users
  jobRole?: string; // Job role from database (technician, manager, etc.) - only for staff users
  department?: string; // Only for staff users
  branch?: string; // Only for staff users
  profileImage?: string; // Profile image URL
}

export interface Admin {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface StaffWithAuth extends Staff {
  password_hash?: string;
  is_active?: boolean;
  last_login?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  branch?: string;
  phone?: string;
  profile_image_url?: string | null;
  employee_id?: string;
  created_at: string;
  updated_at: string;
}

