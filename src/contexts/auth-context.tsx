'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authenticateUser, getCurrentUser, saveUser, clearUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';
import type { AuthUser, LoginCredentials, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const authenticatedUser = await authenticateUser(credentials);

      if (!authenticatedUser) {
        toast.error('Invalid email or password');
        return;
      }

      // Save user to state and localStorage
      setUser(authenticatedUser);
      saveUser(authenticatedUser);

      toast.success(`Welcome back, ${authenticatedUser.name}!`);

      // Simple navigation logic
      console.log('🔐 User authenticated:', authenticatedUser);
      console.log('🔐 User role:', authenticatedUser.role);
      
      if (authenticatedUser.role === 'admin') {
        console.log('🔐 Admin login - navigating to admin dashboard');
        window.location.href = '/admin/dashboard';
      } else {
        console.log('🔐 Staff login - navigating to staff dashboard');
        window.location.href = '/staff/dashboard';
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Set is_online to false if user is staff
      if (user?.role && user.role !== 'admin' && user.id) {
        const supabase = createClient();
        await supabase
          .from('staff')
          .update({ is_online: false })
          .eq('id', user.id);

        // Update attendance record for today
        const today = new Date().toISOString().split('T')[0];
        await supabase
          .from('attendance')
          .update({
            logout_time: new Date().toISOString(),
            status: 'logged_out',
          })
          .eq('staff_id', user.id)
          .eq('date', today);
      }

      setUser(null);
      clearUser();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const refreshUser = async () => {
    const storedUser = getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

