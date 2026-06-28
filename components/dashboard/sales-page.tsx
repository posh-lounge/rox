"use client";
import React, { useState } from "react";
import {
  Search, Calendar, Filter, ChevronDown, Eye, X,
  ShoppingBag, DollarSign, TrendingUp, CreditCard,
  Smartphone, Banknote,
} from "lucide-react";
import { useSales, useSale } from "@/lib/api/v1/hooks";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const fmtCurrency = (n: number) => `${Number(n).toLocaleString()} RWF`;

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote size={12} className="text-emerald-400" />,
  momo: <Smartphone size={12} className="text-indigo-400" />,
  pos:  <CreditCard size={12} className="text-amber-400" />,
};
const STATUS_COLORS: Record<string, string> = {
  completed: "bg-emerald-500/15 text-emerald-400",
  pending:   "bg-amber-500/15 text-amber-400",
  cancelled: "bg-red-500/15 text-red-400",
  loan:      "bg-blue-500/15 text-blue-400",
};

function SaleDetailModal({ saleId, onClose }: { saleId: number; onClose: () => void }) {
  const { data, isLoading } = useSale(saleId);
  const sale  = data?.sale;
  const items = data?.items ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-white font-semibold">Sale Detail</h2>
            {sale && <p className="text-xs text-white/40 font-mono mt-0.5">{sale.sale_ref}</p>}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {isLoading ? (
            <div className="space-y-3"><Skeleton count={6} height={20} baseColor="#1f2937" highlightColor="#374151" /></div>
          ) : sale ? (
            <>
              {/* Sale info grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Customer", value: sale.customer_name },
                  { label: "Phone", value: sale.customer_phone || "—" },
                  { label: "Payment", value: sale.payment_method.toUpperCase() },
                  { label: "Reference", value: sale.payment_reference || "—" },
                  { label: "Cashier", value: `${sale.firstname ?? ""} ${sale.lastname ?? ""}`.trim() || sale.created_by },
                  { label: "Date", value: new Date(sale.created_at).toLocaleString() },
                ].map(f => (
                  <div key={f.label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                    <p className="text-xs text-white/40">{f.label}</p>
                    <p className="text-sm text-white font-medium truncate">{f.value}</p>
                  </div>
                ))}
              </div>

              {/* Items */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-4">
                <div className="px-4 py-2 border-b border-white/10">
                  <p className="text-xs text-white/50 uppercase tracking-wide font-medium">Items Sold</p>
                </div>
                <div className="divide-y divide-white/5">
                  {items.map(item => (
                    <div key={item.item_id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm text-white font-medium">{(item as any).product_name ?? `Product #${item.product_id}`}</p>
                        <p className="text-xs text-white/40">{item.quantity} × {fmtCurrency(item.unit_price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white">{fmtCurrency(item.subtotal)}</p>
                        <p className="text-xs text-emerald-400">+{fmtCurrency(item.profit)} profit</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Subtotal</span>
                  <span className="text-white">{fmtCurrency(sale.total_amount)}</span>
                </div>
                {+sale.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-400">Discount</span>
                    <span className="text-amber-400">-{fmtCurrency(sale.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Paid</span>
                  <span className="text-white">{fmtCurrency(sale.paid_amount)}</span>
                </div>
                {+sale.change_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Change</span>
                    <span className="text-white">{fmtCurrency(sale.change_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2 border-t border-white/10">
                  <span className="text-white">Total</span>
                  <span className="text-indigo-300">{fmtCurrency(sale.total_amount)}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-white/30 text-sm text-center py-8">Sale not found</p>
          )}
        </div>
        <div className="px-6 pb-6 border-t border-white/10 pt-4">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function SalesPage() {
  const today    = new Date().toISOString().split("T")[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo, setDateTo]     = useState(today);
  const [status, setStatus]     = useState("");
  const [search, setSearch]     = useState("");
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data, isLoading } = useSales({ date_from: dateFrom, date_to: dateTo, status, search });
  const sales  = data?.sales ?? [];
  const totals = data?.totals;

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg,#0d1020 0%,#141827 60%,#0f1628 100%)" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Sales</h1>
          <p className="text-white/40 text-sm mt-0.5">All sales transactions</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/30 w-56"
              placeholder="Search ref, customer..." />
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={13} className="text-white/30" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
            <span className="text-white/30 text-xs">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="relative">
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-4 pr-8 py-2 text-white/70 text-sm focus:outline-none focus:border-indigo-500 appearance-none">
              <option value="" className="bg-gray-900">All Status</option>
              {["completed","pending","cancelled","loan"].map(s => (
                <option key={s} value={s} className="bg-gray-900 capitalize">{s}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>
          {/* Quick date filters */}
          <div className="flex gap-2 ml-auto">
            {[
              { label: "Today", from: today, to: today },
              { label: "This Month", from: firstDay, to: today },
            ].map(r => (
              <button key={r.label} onClick={() => { setDateFrom(r.from); setDateTo(r.to); }}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white hover:border-white/20 transition">
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        {!isLoading && totals && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <ShoppingBag size={14} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{totals.cnt}</p>
                <p className="text-xs text-white/40">Total Sales</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <DollarSign size={14} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-400">{fmtCurrency(totals.revenue)}</p>
                <p className="text-xs text-white/40">Total Revenue</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <TrendingUp size={14} className="text-amber-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-amber-400">{totals.cnt > 0 ? fmtCurrency(totals.revenue / totals.cnt) : "0 RWF"}</p>
                <p className="text-xs text-white/40">Avg Sale Value</p>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {["Ref","Customer","Items","Amount","Paid","Method","Status","By","Date",""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array(8).fill(0).map((_,i) => (
                    <tr key={i} className="border-b border-white/5">
                      {Array(10).fill(0).map((_,j) => <td key={j} className="px-4 py-3"><Skeleton height={14} baseColor="#1f2937" highlightColor="#374151" /></td>)}
                    </tr>
                  ))
                : sales.length === 0
                ? (
                    <tr><td colSpan={10} className="px-4 py-16 text-center">
                      <ShoppingBag size={28} className="mx-auto mb-3 text-white/20" />
                      <p className="text-white/30 text-sm">No sales in this period</p>
                    </td></tr>
                  )
                : sales.map(s => (
                    <tr key={s.sale_id} className="border-b border-white/5 hover:bg-white/3 transition group">
                      <td className="px-4 py-3 text-xs text-white/30 font-mono">{s.sale_ref}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-white">{s.customer_name}</p>
                        {s.customer_phone && <p className="text-xs text-white/30">{s.customer_phone}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">—</td>
                      <td className="px-4 py-3 text-sm font-medium text-white">{fmtCurrency(s.total_amount)}</td>
                      <td className="px-4 py-3 text-sm text-white/60">{fmtCurrency(s.paid_amount)}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-sm text-white/60 capitalize">
                          {PAYMENT_ICONS[s.payment_method]} {s.payment_method}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[s.status] ?? "bg-white/10 text-white/40"}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/40">
                        {s.firstname ? `${s.firstname} ${s.lastname ?? ""}`.trim() : s.created_by}
                      </td>
                      <td className="px-4 py-3 text-xs text-white/30">
                        {new Date(s.created_at).toLocaleDateString()}<br/>
                        <span className="text-white/20">{new Date(s.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setDetailId(s.sale_id)}
                          className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition opacity-0 group-hover:opacity-100">
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {detailId && <SaleDetailModal saleId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}
