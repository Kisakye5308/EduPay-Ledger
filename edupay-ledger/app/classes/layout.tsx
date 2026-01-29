"use client";

import { AuthenticatedLayout } from "@/components/layouts/AuthenticatedLayout";

export default function ClassesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
