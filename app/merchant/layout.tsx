"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Store,
  Archive,
  BarChart3,
  CheckSquare,
  LogOut,
  Menu,
  User,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import {
  MerchantSessionProvider,
  useMerchantSession,
} from "@/components/merchant-session-provider";

function MerchantLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, loading, hasNormalDashboardSession, signOutMerchant } =
    useMerchantSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (
      !loading &&
      pathname !== "/merchant/login" &&
      (!role || !hasNormalDashboardSession)
    ) {
      router.replace("/merchant/login");
    }
  }, [hasNormalDashboardSession, loading, pathname, role, router]);

  // Don't show layout for the login page
  if (pathname === "/merchant/login") {
    return <>{children}</>;
  }

  // If no role but not on login page, wait for redirect
  if (loading || !role) return null;

  const handleLogout = async () => {
    await signOutMerchant();
    toast.success("Logged out of Merchant Dashboard");
    router.push("/merchant/login");
  };

  const navItems = [
    {
      label: "Stock Addition",
      href: "/merchant/stock",
      icon: Archive,
      roles: ["admin", "warehouse", "customer_service", "guest"],
    },
    {
      label: "Merchants & Products",
      href: "/merchant/merchants",
      icon: Store,
      roles: ["admin", "warehouse", "guest"],
    },
    {
      label: "Stock Count",
      href: "/merchant/stock-count",
      icon: BarChart3,
      roles: ["admin", "warehouse", "customer_service", "guest"],
    },
    {
      label: "Pending Approvals",
      href: "/merchant/approvals",
      icon: CheckSquare,
      roles: ["admin", "warehouse", "customer_service"],
    },
    {
      label: "User Access",
      href: "/merchant/users",
      icon: Users,
      roles: ["admin"],
    },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800">
            <div className="rounded-lg bg-white p-1 shadow-sm">
              <Image
                src="/specify_logistics.jpeg"
                alt="Specify Logistics Logo"
                width={32}
                height={32}
                className="rounded-md object-contain"
              />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight">Specify Merchant</h1>
              <p className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">{role} Access</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 ${isActive ? "text-primary-foreground" : "text-slate-400"}`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
            <div className="mt-4 pt-4 border-t border-slate-800 text-center">
              <Button
                variant="link"
                className="text-xs text-slate-500 hover:text-slate-300"
                onClick={() => router.push("/dashboard")}
              >
                &larr; Back to Main Dashboard
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 lg:justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
              {role === "guest" ? (
                <User className="h-4 w-4 text-slate-600" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-primary" />
              )}
              <span className="text-sm font-semibold capitalize text-slate-700">
                {role} Mode
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MerchantSessionProvider>
      <MerchantLayoutContent>{children}</MerchantLayoutContent>
    </MerchantSessionProvider>
  );
}
