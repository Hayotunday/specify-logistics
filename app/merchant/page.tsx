"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useMerchantSession } from "@/components/merchant-session-provider";

export default function MerchantIndex() {
  const router = useRouter();
  const { role, loading } = useMerchantSession();

  useEffect(() => {
    if (loading) return;
    if (!role) {
      router.replace("/merchant/login");
    } else if (role === "admin") {
      router.replace("/merchant/approvals");
    } else {
      router.replace("/merchant/stock");
    }
  }, [loading, role, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
