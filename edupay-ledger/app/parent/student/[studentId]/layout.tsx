import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fee Status - Parent Portal',
  description: 'View your child\'s fee status and payment history',
};

export default function ParentStudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
