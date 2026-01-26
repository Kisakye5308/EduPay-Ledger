import React from 'react';

export default function StudentDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No additional layout wrapper needed - parent students/layout.tsx provides navigation
  return <>{children}</>;
}
