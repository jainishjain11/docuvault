/**
 * DocuVault - Auth Context
 * Manages authentication state. Supports demo mode and Cognito.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../demo/demoStore';
import { demoLogin, demoLogout } from '../demo/demoStore';
import { cognitoLogin } from '../auth/cognito';

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true' || !import.meta.env.VITE_API_URL;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsAdmin: () => Promise<void>;
  logout: () => void;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      if (IS_DEMO) {
        const stored = localStorage.getItem('docuvault_demo_user');
        if (stored) {
          const parsedUser = JSON.parse(stored);
          // Re-sync with demo store
          if (parsedUser.isAdmin) {
            demoLogin('admin');
          } else {
            demoLogin('student');
          }
          setUser(parsedUser);
        }
      } else {
        // Real Cognito: check for stored token/user
        const storedUser = localStorage.getItem('docuvault_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
    } catch {
      localStorage.removeItem('docuvault_demo_user');
      localStorage.removeItem('docuvault_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (IS_DEMO) {
      // Demo mode: any email with "admin" logs in as admin
      const role = email.toLowerCase().includes('admin') ? 'admin' : 'student';
      const loggedInUser = demoLogin(role);
      setUser(loggedInUser);
      localStorage.setItem('docuvault_demo_user', JSON.stringify(loggedInUser));
      return;
    }

    // Real AWS Cognito authentication
    const session = await cognitoLogin(email, password);
    const liveUser: User = {
      userId: session.userId,
      email: session.email,
      name: session.name,
      isAdmin: session.isAdmin,
    };
    localStorage.setItem('docuvault_token', session.idToken);
    localStorage.setItem('docuvault_user', JSON.stringify(liveUser));
    setUser(liveUser);
  }, []);

  const loginAsAdmin = useCallback(async () => {
    if (IS_DEMO) {
      const adminUser = demoLogin('admin');
      setUser(adminUser);
      localStorage.setItem('docuvault_demo_user', JSON.stringify(adminUser));
      return;
    }
    throw new Error('Admin login requires Cognito configuration');
  }, []);

  const logout = useCallback(() => {
    if (IS_DEMO) {
      demoLogout();
      localStorage.removeItem('docuvault_demo_user');
    } else {
      localStorage.removeItem('docuvault_token');
      localStorage.removeItem('docuvault_user');
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginAsAdmin, logout, isDemo: IS_DEMO }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
