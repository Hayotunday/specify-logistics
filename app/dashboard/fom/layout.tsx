"use client";

import ProtectedRoute from "@/components/protected-route";
import { UserRole } from "@/lib/types";

export default function FOMLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={["fom"] as UserRole[]}>
      {children}
    </ProtectedRoute>
  );
}
