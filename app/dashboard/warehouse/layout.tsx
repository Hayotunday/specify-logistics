"use client";

import ProtectedRoute from "@/components/protected-route";
import { UserRole } from "@/lib/types";

export default function WarehouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRoles={["warehouse"] as UserRole[]}>
      {children}
    </ProtectedRoute>
  );
}
