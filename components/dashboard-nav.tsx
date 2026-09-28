"use client";

import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LogOut,
  Package,
  Warehouse,
  DollarSign,
  Users,
  Settings,
  MessageSquare,
  Zap,
  Home,
  TrendingUp,
  Layers,
  Store,
  BarChart3,
  ClipboardList,
  Archive,
  Bike,
  AlertTriangle,
} from "lucide-react";
import { ROLE_LABELS } from "@/lib/types";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

/**
 * Role-based sidebar navigation
 * Shows different menu items based on user role
 */
interface DashboardNavProps {
  className?: string;
}

export default function DashboardNav({ className }: DashboardNavProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("[Dashboard Nav] Sign out error:", error);
      setIsSigningOut(false);
    }
  };

  // Define role-specific menu items
  const getMenuItems = () => {
    const baseItems = [
      {
        label: "Orders",
        href: `/dashboard/${user.role}/orders`,
        icon: Package,
      },
    ];

    const roleMenus: Record<string, typeof baseItems> = {
      customer_service: [
        {
          label: "Home",
          href: `/dashboard/${user.role}/`,
          icon: Home,
        },
        {
          label: "Orders",
          href: `/dashboard/${user.role}/orders`,
          icon: Package,
        },
        // {
        //   label: "Progress Report",
        //   href: `/dashboard/${user.role}/progress`,
        //   icon: BarChart3,
        // },
        {
          label: "Breakdown",
          href: `/dashboard/${user.role}/breakdown`,
          icon: ClipboardList,
        },
        {
          label: "Merchant Dashboard",
          href: "/merchant/login",
          icon: Store,
        },
      ],
      warehouse: [
        {
          label: "Warehouse",
          href: `/dashboard/${user.role}/`,
          icon: Warehouse,
        },
        {
          label: "Inventory",
          href: `/dashboard/${user.role}/inventory`,
          icon: Package,
        },
        {
          label: "Out-of-Stock",
          href: `/dashboard/${user.role}/out-of-stock`,
          icon: AlertTriangle,
        },
        {
          label: "Breakdown",
          href: `/dashboard/${user.role}/breakdown`,
          icon: ClipboardList,
        },
        {
          label: "Merchant Dashboard",
          href: "/merchant/login",
          icon: Store,
        },
      ],
      fom: [
        {
          label: "Home",
          href: `/dashboard/${user.role}/`,
          icon: Home,
        },
        {
          label: "Orders",
          href: `/dashboard/${user.role}/orders`,
          icon: Package,
        },
        {
          label: "Rider Payments",
          href: `/dashboard/${user.role}/rider-payments`,
          icon: Bike,
        },
      ],
      accounting: [
        {
          label: "Overview",
          href: `/dashboard/${user.role}/`,
          icon: Home,
        },
        {
          label: "Invoices",
          href: `/dashboard/${user.role}/invoices`,
          icon: DollarSign,
        },
        {
          label: "Payments",
          href: `/dashboard/${user.role}/payments`,
          icon: DollarSign,
        },
        {
          label: "Rider Payments",
          href: `/dashboard/${user.role}/rider-payments`,
          icon: Bike,
        },
      ],
      admin: [
        {
          label: "Overview",
          href: `/dashboard/${user.role}/`,
          icon: Package,
        },
        {
          label: "Orders",
          href: `/dashboard/${user.role}/orders`,
          icon: TrendingUp,
        },
        {
          label: "Rider Payments",
          href: `/dashboard/${user.role}/rider-payments`,
          icon: Bike,
        },
        {
          label: "Users",
          href: `/dashboard/${user.role}/users`,
          icon: Users,
        },
        {
          label: "Settings",
          href: `/dashboard/${user.role}/settings`,
          icon: Settings,
        },
        {
          label: "Merchant Dashboard",
          href: "/merchant/login",
          icon: Store,
        },
      ],
    };

    // If role has a specific menu, return it, otherwise fall back to baseItems
    return roleMenus[user.role] || baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <aside
      className={cn(
        "w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full",
        className,
      )}
    >
      {/* Logo Section */}
      <div className="border-b border-sidebar-border p-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center shadow-xs">
            <Image
              src="/specify_logistics.jpeg"
              alt="Specify Logistics Logo"
              width={36}
              height={36}
              className="object-contain rounded-md"
            />
          </div>
          <div className="flex-1">
            <h2 className="font-extrabold text-sidebar-foreground tracking-tight text-base">SPECIFY</h2>
            <p className="text-[10px] text-orange-400 font-semibold tracking-wider uppercase -mt-0.5">Logistics Limited</p>
          </div>
        </Link>
      </div>

      {/* User Info Section */}
      <div className="border-b border-sidebar-border p-4 bg-sidebar-primary/10">
        <p className="text-xs text-sidebar-foreground/60 uppercase tracking-wide">
          {ROLE_LABELS[user.role]}
        </p>
        <p className="text-sm font-medium text-sidebar-foreground truncate">
          {user.displayName}
        </p>
        <p className="text-xs text-sidebar-foreground/60 truncate">
          {user.email}
        </p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const normalizedPathname = pathname?.replace(/\/$/, "") || "";
          const normalizedHref = item.href.replace(/\/$/, "");
          const isActive = normalizedPathname === normalizedHref;

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-sidebar-foreground rounded-md",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive &&
                    "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Sign Out Section */}
      <div className="border-t border-sidebar-border p-4 space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 border-sidebar-border"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="h-5 w-5" />
          <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
        </Button>
      </div>
    </aside>
  );
}
