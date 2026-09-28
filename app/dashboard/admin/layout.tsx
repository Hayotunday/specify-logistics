"use client";

import ProtectedRoute from "@/components/protected-route";
import { UserRole } from "@/lib/types";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRoles={["admin"] as UserRole[]}>
      {children}
    </ProtectedRoute>
  );
}
