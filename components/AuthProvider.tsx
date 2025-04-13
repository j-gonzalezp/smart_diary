// components/AuthProvider.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { UserProfileDocument } from '@/lib/types'

interface AuthContextType {
  user: UserProfileDocument | null
  setUser: React.Dispatch<React.SetStateAction<UserProfileDocument | null>>
  isLoading: boolean
  checkSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export default function AuthProvider({
  initialUser,
  children
}: {
  initialUser: UserProfileDocument | null
  children: ReactNode
}) {
  const [user, setUser] = useState<UserProfileDocument | null>(initialUser)
  const [isLoading, setIsLoading] = useState<boolean>(!initialUser)

  const checkSession = useCallback(async () => {
    if (!initialUser) {
      setIsLoading(false)
    }
  }, [initialUser])

  useEffect(() => {
    if (!initialUser) {
      checkSession()
    } else {
      setIsLoading(false)
    }
  }, [initialUser, checkSession])

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, checkSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
