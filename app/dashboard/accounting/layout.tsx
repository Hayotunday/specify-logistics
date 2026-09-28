"use client";

import ProtectedRoute from "@/components/protected-route";
import { UserRole } from "@/lib/types";

export default function AccountingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRoles={["accounting"] as UserRole[]}>
      {children}
    </ProtectedRoute>
  );
}
