"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowRight, ShieldCheck, User } from "lucide-react";
import Image from "next/image";
import {
  createMerchantSession,
  type MerchantRole,
} from "@/lib/merchant-session";
import { useMerchantSession } from "@/components/merchant-session-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MerchantLoginPage() {
  const router = useRouter();
  const {
    role: activeRole,
    loading: sessionLoading,
    hasNormalDashboardSession,
    refreshMerchantSession,
  } = useMerchantSession();
  const [role, setRole] = useState<MerchantRole | null>(null);
  const [accessKey, setAccessKey] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionLoading && activeRole) {
      router.replace(
        activeRole === "admin" ? "/merchant/approvals" : "/merchant/stock",
      );
    }
  }, [activeRole, router, sessionLoading]);

  const handleLogin = async () => {
    if (!role) return;

    if (role !== "guest" && !accessKey) {
      toast.error("Access key is required for this role");
      return;
    }

    setLoading(true);
    try {
      await createMerchantSession(role, accessKey);
      await refreshMerchantSession();
      toast.success(`Logged in as ${role.toUpperCase()}`);
      router.push(role === "admin" ? "/merchant/approvals" : "/merchant/stock");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to verify merchant access. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-white p-2 flex items-center justify-center shadow-md border border-slate-200">
            <Image
              src="/specify_logistics.jpeg"
              alt="Specify Logistics Logo"
              width={52}
              height={52}
              className="rounded-xl object-contain"
            />
          </div>
        </div>
        <h2 className="mt-5 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Specify Merchant Dashboard
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600 font-medium">
          Select your operational role to continue
        </p>
      </div>

      <div className="mt-8 w-full flex flex-col justify-center items-center">
        <Card className="py-8 px-4 sm:shadow sm:rounded-lg sm:px-10 border-0 shadow-xl">
          {!role ? (
            <div className="flex flex-wrap justify-center gap-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Button
                variant="outline"
                className="size-44 shrink-0 flex-col justify-center gap-4 rounded-2xl border-2 text-lg font-medium shadow-sm transition-all duration-200 hover:-translate-y-1 hover:text-primary/50 hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg active:translate-y-0"
                onClick={() => setRole("admin")}
              >
                <ShieldCheck className="size-12 text-primary" />
                Admin / Manager
              </Button>
              <Button
                variant="outline"
                className="size-44 shrink-0 flex-col justify-center gap-4 rounded-2xl border-2 text-lg font-medium shadow-sm transition-all duration-200 hover:-translate-y-1 hover:text-amber-500/50 hover:border-amber-500/50 hover:bg-amber-500/5 hover:shadow-lg active:translate-y-0"
                onClick={() => setRole("warehouse")}
              >
                <ShieldCheck className="size-12 text-amber-600" />
                Warehouse Staff
              </Button>
              <Button
                variant="outline"
                className="size-44 shrink-0 flex-col justify-center gap-4 rounded-2xl border-2 text-lg font-medium shadow-sm transition-all duration-200 hover:-translate-y-1 hover:text-blue-500/50 hover:border-blue-500/50 hover:bg-blue-500/5 hover:shadow-lg active:translate-y-0"
                onClick={() => setRole("customer_service")}
              >
                <ShieldCheck className="size-12 text-blue-600" />
                Customer Service
              </Button>
              <Button
                variant="outline"
                className="size-44 shrink-0 flex-col justify-center gap-4 rounded-2xl border-2 text-lg font-medium shadow-sm transition-all duration-200 hover:-translate-y-1 hover:text-slate-500/50 hover:border-slate-500/50 hover:bg-slate-500/5 hover:shadow-lg active:translate-y-0"
                onClick={() => setRole("guest")}
              >
                <User className="size-12 text-slate-500" />
                Guest Access
              </Button>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold capitalize">
                    {role} Login
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {role === "guest"
                      ? "Guest actions are submitted for administrator approval."
                      : "Enter the access key assigned to your dashboard account."}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRole(null);
                    setAccessKey("");
                  }}
                >
                  Change Role
                </Button>
              </div>

              {role !== "guest" && (
                <div className="space-y-2">
                  <Label htmlFor="accessKey">Access Key</Label>
                  <Input
                    id="accessKey"
                    type="password"
                    placeholder="Enter access key..."
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    autoFocus
                  />
                </div>
              )}

              <Button
                className="w-full h-12 text-base font-medium"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Continue <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
        <div className="mt-6 text-center">
          <Button
            variant="link"
            className="text-sm text-slate-500"
            onClick={() => router.push("/dashboard")}
          >
            &larr; Back to Main Dashboard
          </Button>
        </div>
      </div>
      <AlertDialog open={!sessionLoading && !hasNormalDashboardSession}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Main dashboard login required</AlertDialogTitle>
            <AlertDialogDescription>
              Sign in to the main Specify dashboard first, then return here to
              enter the merchant access key assigned to your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => router.push("/login")}>
              Go to main dashboard login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
