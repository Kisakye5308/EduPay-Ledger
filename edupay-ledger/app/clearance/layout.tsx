"use client";

import { AuthenticatedLayout } from "@/components/layouts/AuthenticatedLayout";

export default function ClearanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
