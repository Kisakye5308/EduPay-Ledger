'use client';

import React from 'react';
import { Sidebar, MobileNav } from '@/components/navigation/Sidebar';
import { TopNav } from '@/components/navigation/TopNav';

export default function DashboardLayout({
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
          userAvatar="https://lh3.googleusercontent.com/aida-public/AB6AXuAhDE0Y1tEQafugj80YoUn4E85cLQQC1fKJVPIf1KYUXDYEgEzekVoCd-aPBE7xgkxegiHoaF_xbMZnXdLzkCNpjbLM4FR3ArGQQVinEXCMn4xYIAlHY0TyeyhNG5uTAiA_3Dm5hJ51HYOT4oM68aiXRb7fhWHNKhErGKbCc8sHVqjusmVBM0TfBh5JcqAEjPhFUi4HR34YvDnRm4JDof_7xxlVcRzjANDUcWFLhfzoHC5CZNb40cj8Y-5I6_483XSFUb3oc9MaPjI"
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopNav
          currentTerm="TERM 1"
          currentYear={2024}
          userName="Sarah Namuli"
          userAvatar="https://lh3.googleusercontent.com/aida-public/AB6AXuAhDE0Y1tEQafugj80YoUn4E85cLQQC1fKJVPIf1KYUXDYEgEzekVoCd-aPBE7xgkxegiHoaF_xbMZnXdLzkCNpjbLM4FR3ArGQQVinEXCMn4xYIAlHY0TyeyhNG5uTAiA_3Dm5hJ51HYOT4oM68aiXRb7fhWHNKhErGKbCc8sHVqjusmVBM0TfBh5JcqAEjPhFUi4HR34YvDnRm4JDof_7xxlVcRzjANDUcWFLhfzoHC5CZNb40cj8Y-5I6_483XSFUb3oc9MaPjI"
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
