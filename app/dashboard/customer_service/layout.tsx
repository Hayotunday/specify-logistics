"use client";

import ProtectedRoute from "@/components/protected-route";
import { UserRole } from "@/lib/types";

export default function CustomerServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRoles={["customer_service"] as UserRole[]}>
      {children}
    </ProtectedRoute>
  );
}
