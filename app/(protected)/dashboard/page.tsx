// src/app/dashboard/page.tsx (o src/app/auth-test/page.tsx)
'use client'

import { useAuth } from '@/components/AuthProvider'

export default function ProtectedPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading session...</div>
  }

  if (!user) {
    return <div>Error: User not found. Please sign in.</div>
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Welcome, {user.fullName}!</h1>
        <p className="text-gray-600 mt-1">Your Diary Dashboard</p>
      </header>
    </div>
  )
}
