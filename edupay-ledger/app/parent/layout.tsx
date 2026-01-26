import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Parent Portal - EduPay Ledger',
  description: 'View your child\'s fee status and payment history',
};

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
