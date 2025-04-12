
'use client';
import React, { createContext, useContext, ReactNode } from 'react';
import { User } from '@/lib/types'; 

interface AuthContextType {
  user: User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ initialUser, children }: { initialUser: User, children: ReactNode }) {


  return (
    
    <AuthContext.Provider value={{ user: initialUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
