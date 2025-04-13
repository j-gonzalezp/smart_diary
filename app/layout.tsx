// app/layout.tsx
import React from 'react'
import { getCurrentUser } from '@/lib/actions/user.actions'
import AuthProvider from '@/components/AuthProvider'
import './globals.css'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const initialUser = await getCurrentUser();

  return (
    <html lang="en">
      <body>

        <AuthProvider initialUser={initialUser}>

          <main>
            {children}
          </main>
   
        </AuthProvider>
      </body>
    </html>
  );
}