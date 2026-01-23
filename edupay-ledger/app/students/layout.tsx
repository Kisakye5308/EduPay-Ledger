'use client';

import React from 'react';
import { Sidebar, MobileNav } from '@/components/navigation/Sidebar';
import { TopNav } from '@/components/navigation/TopNav';

export default function StudentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          userName="Sarah Namuli"
          userRole="Head Bursar"
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopNav
          currentTerm="TERM 1"
          currentYear={2024}
          userName="Sarah Namuli"
        />
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <MobileNav />
    </div>
  );
}
