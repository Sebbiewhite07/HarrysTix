import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API helper function
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Important for sessions
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await apiRequest('/api/auth/me');
        setUser({
          ...user,
          joinDate: new Date(user.joinDate),
          membershipExpiry: user.membershipExpiry ? new Date(user.membershipExpiry) : undefined,
        });
      } catch (error) {
        // User not logged in
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signup = async (email: string, password: string, name: string): Promise<void> => {
    const { user } = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    setUser({
      ...user,
      joinDate: new Date(user.joinDate),
      membershipExpiry: user.membershipExpiry ? new Date(user.membershipExpiry) : undefined,
    });
  };

  const login = async (email: string, password: string): Promise<void> => {
    const { user } = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setUser({
      ...user,
      joinDate: new Date(user.joinDate),
      membershipExpiry: user.membershipExpiry ? new Date(user.membershipExpiry) : undefined,
    });
  };

  const logout = async (): Promise<void> => {
    await apiRequest('/api/auth/logout', {
      method: 'POST',
    });
    setUser(null);
  };

  const value = {
    user,
    login,
    signup,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};