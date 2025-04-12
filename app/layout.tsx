"use server"
import { getCurrentUser } from '@/lib/actions/user.actions';
import AuthProvider from '@/components/AuthProvider';
import React from 'react';
import Navbar from '@/components/Navbar';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser(); 

  return (
    <html lang="en">
      <body>
        <AuthProvider initialUser={user}>
          <Navbar/>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}