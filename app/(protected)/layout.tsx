// Ejemplo en app/dashboard/layout.tsx (o page.tsx)
import { getCurrentUser } from '@/lib/actions/user.actions';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/sign-in'); 
  }

  return (
    <div>
      {/* Navbar específica del dashboard, etc. */}
      {children}
    </div>
  );
}