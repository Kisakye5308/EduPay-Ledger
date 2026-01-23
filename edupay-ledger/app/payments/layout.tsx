'use client';

import React from 'react';
import { Sidebar } from '@/components/navigation/Sidebar';
import { TopNav } from '@/components/navigation/TopNav';
import { MobileNav } from '@/components/navigation/MobileNav';

export default function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        <TopNav />
        <main className="flex-1 pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
