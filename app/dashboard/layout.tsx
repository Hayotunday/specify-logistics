"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import DashboardNav from "@/components/dashboard-nav";
import ProtectedRoute from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-background relative">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 border-r border-border bg-card shrink-0">
          <DashboardNav />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden h-full">
          {/* Header */}
          <header className="border-b border-border bg-card h-16 flex items-center px-4 sm:px-6">
            <div className="flex items-center justify-between w-full gap-4">
              <div className="flex items-center gap-3">
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      aria-label="Open navigation menu"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0">
                    <SheetHeader className="px-4 py-4 border-b border-border">
                      <SheetTitle>Navigation</SheetTitle>
                      <SheetDescription>
                        Browse dashboard sections.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="h-full overflow-y-auto">
                      <DashboardNav className="w-full" />
                    </div>
                  </SheetContent>
                </Sheet>
                <h1 className="text-xl font-semibold text-foreground">
                  Specify
                </h1>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-6">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
