/**
 * Reports Section Layout
 * Common layout for all report pages
 */

import React from 'react';

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
