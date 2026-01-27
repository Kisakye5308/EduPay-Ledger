import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Exam Clearance | EduPay Ledger',
  description: 'Manage student exam clearance status',
};

export default function ClearanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
