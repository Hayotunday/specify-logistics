"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";

interface StockItem {
  merchantId: string;
  merchantName: string;
  productId: string;
  productName: string;
  price: number;
  stockAdded: number;
  stockDeducted: number;
  currentStock: number;
}

export default function MerchantStockCountPage() {
  const [data, setData] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMerchant, setFilterMerchant] = useState("all");
  const [merchants, setMerchants] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: merchantData }, { data: productData }, { data: approvedEntries }, { data: orderData }] =
        await Promise.all([
          supabase!.from("merchants").select("id, name").eq("approval_status", "approved").order("name"),
          supabase!.from("products").select("id, name, price, merchant_id").eq("approval_status", "approved").order("name"),
          supabase!
            .from("stock_entries")
            .select("product_id, quantity")
            .eq("status", "approved"),
          supabase!
            .from("orders")
            .select("items, fom_delivery_status, merchant")
            .eq("fom_delivery_status", "delivered"),
        ]);

      if (!merchantData || !productData) return;
      setMerchants(merchantData);

      // Build stock map: product_id -> total added
      const addedMap: Record<string, number> = {};
      for (const entry of approvedEntries || []) {
        addedMap[entry.product_id] = (addedMap[entry.product_id] || 0) + entry.quantity;
      }

      // Build deduction map from delivered orders' items
      const deductedMap: Record<string, number> = {};
      for (const order of orderData || []) {
        const merchantName = order.merchant;
        const merchant = merchantData.find((m: any) => m.name === merchantName);
        if (!merchant) continue;

        for (const item of (order.items as any[]) || []) {
          // Try to find matching product by name for this merchant
          const product = productData.find(
            (p: any) =>
              p.merchant_id === merchant.id &&
              p.name?.toLowerCase() === item.name?.toLowerCase(),
          );
          if (product) {
            deductedMap[product.id] =
              (deductedMap[product.id] || 0) + (item.quantity || 1);
          }
        }
      }

      // Build final stock list
      const stockItems: StockItem[] = productData.map((product: any) => {
        const merchant = merchantData.find((m: any) => m.id === product.merchant_id);
        const added = addedMap[product.id] || 0;
        const deducted = deductedMap[product.id] || 0;
        return {
          merchantId: product.merchant_id,
          merchantName: merchant?.name || "Unknown",
          productId: product.id,
          productName: product.name,
          price: product.price,
          stockAdded: added,
          stockDeducted: deducted,
          currentStock: added - deducted,
        };
      });

      setData(stockItems);
    } catch (err) {
      toast.error("Failed to load stock count");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(
    () =>
      filterMerchant === "all"
        ? data
        : data.filter((d) => d.merchantId === filterMerchant),
    [data, filterMerchant],
  );

  // Group by merchant
  const groupedByMerchant = useMemo(() => {
    const map: Record<string, StockItem[]> = {};
    for (const item of filtered) {
      if (!map[item.merchantId]) map[item.merchantId] = [];
      map[item.merchantId].push(item);
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Stock Count</h1>
          <p className="text-slate-500 mt-2">
            Real-time inventory calculated from approved stock additions minus delivered orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500 whitespace-nowrap">Filter:</label>
          <select
            className="h-9 rounded-md border border-input bg-white px-3 text-sm shadow-sm"
            value={filterMerchant}
            onChange={(e) => setFilterMerchant(e.target.value)}
          >
            <option value="all">All Merchants</option>
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <Card className="p-12 text-center border-0 shadow-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-slate-500">Computing stock levels...</p>
        </Card>
      ) : Object.keys(groupedByMerchant).length === 0 ? (
        <Card className="p-12 text-center border-0 shadow-sm">
          <p className="text-slate-500">No stock data available. Add products and approve stock entries first.</p>
        </Card>
      ) : (
        Object.values(groupedByMerchant).map((items) => (
          <Card key={items[0].merchantId} className="p-6 space-y-4 border-0 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">{items[0].merchantName}</h2>
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3 text-xs font-semibold text-slate-500">Product</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-500">Price</th>
                    <th className="text-right p-3 text-xs font-semibold text-slate-500">
                      <span className="flex items-center justify-end gap-1"><TrendingUp className="h-3 w-3 text-emerald-600" /> Added</span>
                    </th>
                    <th className="text-right p-3 text-xs font-semibold text-slate-500">
                      <span className="flex items-center justify-end gap-1"><TrendingDown className="h-3 w-3 text-red-500" /> Deducted</span>
                    </th>
                    <th className="text-right p-3 text-xs font-semibold text-slate-500">Current Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.productId} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-medium text-slate-900">{item.productName}</td>
                      <td className="p-3 text-slate-600 font-mono text-xs">₦{Number(item.price).toLocaleString()}</td>
                      <td className="p-3 text-right text-emerald-600 font-semibold">+{item.stockAdded}</td>
                      <td className="p-3 text-right text-red-500 font-semibold">-{item.stockDeducted}</td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.currentStock <= 0 ? "bg-red-100 text-red-700" : item.currentStock <= 10 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {item.currentStock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
