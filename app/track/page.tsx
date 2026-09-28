"use client";

import { useState } from "react";
import { fetchTrackedOrder } from "@/lib/api";
import { Order } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  ShoppingBag,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Building,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency, formatDateDisplay } from "@/lib/utils";

export default function PublicOrderTrackingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const result = await fetchTrackedOrder(searchQuery);
      setOrder(result);
      if (!result) {
        setError("No order found matching your search. Please verify your Order ID.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while tracking the order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate order progress step (1-4)
  const getProgressStep = (order: Order) => {
    const fomStatus = order.fom_delivery_status || order.wh_delivery_status;
    if (fomStatus === "delivered") return 4;
    if (fomStatus === "shipped" || order.rider_name || order.rider) return 3;
    if (order.inventory_status === "packed" || order.status === "warehouse" || order.status === "fom") return 2;
    return 1;
  };

  const getStatusBadge = (order: Order) => {
    const fomStatus = order.fom_delivery_status || order.wh_delivery_status;
    if (fomStatus === "delivered") {
      return <Badge className="bg-emerald-600 text-white font-semibold text-xs px-3 py-1">Delivered</Badge>;
    }
    if (fomStatus === "returned") {
      return <Badge className="bg-orange-500 text-white font-semibold text-xs px-3 py-1">Returned</Badge>;
    }
    if (fomStatus === "failed") {
      return <Badge className="bg-red-600 text-white font-semibold text-xs px-3 py-1">Delivery Failed</Badge>;
    }
    if (fomStatus === "shipped" || order.rider_name || order.rider) {
      return <Badge className="bg-blue-600 text-white font-semibold text-xs px-3 py-1">Out for Delivery</Badge>;
    }
    if (order.inventory_status === "out-of-stock") {
      return <Badge className="bg-amber-600 text-white font-semibold text-xs px-3 py-1">Out of Stock</Badge>;
    }
    if (order.inventory_status === "packed") {
      return <Badge className="bg-purple-600 text-white font-semibold text-xs px-3 py-1">Packed & Ready</Badge>;
    }
    return <Badge className="bg-orange-500 text-white font-semibold text-xs px-3 py-1">Order Received</Badge>;
  };

  const currentStep = order ? getProgressStep(order) : 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md">
              <Image
                src="/specify_logistics.jpeg"
                alt="Specify Logistics Logo"
                width={36}
                height={36}
                className="object-contain rounded-md"
              />
            </div>
            <div>
              <span className="font-extrabold text-xl text-white tracking-tight">SPECIFY</span>
              <span className="text-[10px] text-orange-400 block -mt-1 font-bold uppercase tracking-wider">Logistics Tracking</span>
            </div>
          </div>
          <Link href="/login">
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
              Staff Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
        {/* Tracking Banner & Search Form */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
            Track Your <span className="text-orange-500">Order</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
            Enter your Order ID (e.g. <code className="bg-slate-900 text-orange-400 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-800">#3a8f9c12</code>) to get live status updates on your delivery.
          </p>

          <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Enter Order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 rounded-xl focus:border-orange-500 focus:ring-orange-500 text-base shadow-inner"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="h-12 px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Track</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Error / Not Found Message */}
        {error && (
          <Card className="bg-red-950/40 border-red-900/60 p-6 text-center text-red-200 rounded-2xl max-w-xl mx-auto mb-8 shadow-lg">
            <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-2" />
            <h3 className="font-semibold text-base">Order Not Found</h3>
            <p className="text-xs text-red-300/80 mt-1">{error}</p>
          </Card>
        )}

        {/* Order Details Result */}
        {order && (
          <div className="space-y-6">
            {/* Live Progress Bar */}
            <Card className="bg-slate-900/90 border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Order ID</span>
                    {getStatusBadge(order)}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white font-mono mt-1">
                    #{order.id.split("-")[0].toUpperCase()}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Placed On</span>
                  <span className="text-sm font-medium text-slate-200">
                    {formatDateDisplay(new Date(order.created_at))}
                  </span>
                </div>
              </div>

              {/* Step Progress Tracker */}
              <div className="relative py-4 mb-4">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -translate-y-1/2 z-0 hidden md:block" />
                <div
                  className="absolute top-1/2 left-0 h-1 bg-orange-500 -translate-y-1/2 z-0 transition-all duration-500 hidden md:block"
                  style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
                  {/* Step 1 */}
                  <div className="flex md:flex-col items-center gap-4 md:gap-2 text-left md:text-center">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                        currentStep >= 1
                          ? "bg-orange-500 text-white ring-4 ring-orange-500/20 shadow-lg shadow-orange-500/20"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">1. Order Confirmed</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Order received</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex md:flex-col items-center gap-4 md:gap-2 text-left md:text-center">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                        currentStep >= 2
                          ? "bg-orange-500 text-white ring-4 ring-orange-500/20 shadow-lg shadow-orange-500/20"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">2. Warehouse</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {order.inventory_status === "packed"
                          ? "Packed & ready"
                          : order.inventory_status === "out-of-stock"
                          ? "Out of stock"
                          : "Processing"}
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex md:flex-col items-center gap-4 md:gap-2 text-left md:text-center">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                        currentStep >= 3
                          ? "bg-orange-500 text-white ring-4 ring-orange-500/20 shadow-lg shadow-orange-500/20"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">3. Out for Delivery</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {order.rider_name || order.rider ? `Assigned: ${order.rider_name || order.rider}` : "In dispatch queue"}
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex md:flex-col items-center gap-4 md:gap-2 text-left md:text-center">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                        currentStep >= 4
                          ? "bg-orange-500 text-white ring-4 ring-orange-500/20 shadow-lg shadow-orange-500/20"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">4. Delivery Completed</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {order.delivered_at
                          ? formatDateDisplay(new Date(order.delivered_at))
                          : "Awaiting final delivery"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Order Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Delivery Details */}
              <Card className="bg-slate-900/80 border-slate-800 p-6 rounded-2xl">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                  <MapPin className="h-4 w-4 text-orange-400" />
                  <span>Delivery Details</span>
                </h3>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">Recipient Name</span>
                    <span className="font-medium text-slate-200">{order.customer_name || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Delivery Address</span>
                    <span className="font-medium text-slate-200">{order.delivery_address || "N/A"}</span>
                  </div>
                  {order.landmark && (
                    <div>
                      <span className="text-xs text-slate-500 block">Landmark</span>
                      <span className="font-medium text-orange-400">{order.landmark}</span>
                    </div>
                  )}
                  {order.merchant && (
                    <div>
                      <span className="text-xs text-slate-500 block">Merchant Store</span>
                      <span className="font-medium text-slate-200 flex items-center gap-1.5 mt-0.5">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        {order.merchant}
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Items & Summary */}
              <Card className="bg-slate-900/80 border-slate-800 p-6 rounded-2xl">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                  <ShoppingBag className="h-4 w-4 text-orange-400" />
                  <span>Order Items</span>
                </h3>

                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm py-1.5 border-b border-slate-800/60 last:border-none">
                        <span className="text-slate-300 font-medium">{item.name}</span>
                        <span className="text-xs font-mono bg-slate-800 text-orange-400 px-2 py-0.5 rounded">
                          x{item.quantity}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">No item details recorded</span>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-center font-semibold text-base">
                  <span className="text-slate-300">Total Amount</span>
                  <span className="text-orange-400 font-mono text-lg">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Specify Lagos Logistics. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-emerald-400 transition-colors">
              Staff Portal
            </Link>
            <Link href="/track" className="hover:text-emerald-400 transition-colors">
              Track Order
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
