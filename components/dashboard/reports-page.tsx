"use client";
import React, { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, DollarSign, ShoppingBag, BarChart2, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useReport } from "@/lib/api/v1/hooks";
import Skeleton from "react-loading-skeleton";

const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6"];

const fmtCurrency = (n: number) => `${Number(n).toLocaleString()} RWF`;
const fmtShort = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n);

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

function StatCard({ label, value, sub, color = "text-white" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
      <p className={`text-2xl font-bold ${color} leading-none`}>{value}</p>
      <p className="text-xs text-white/40 mt-1">{label}</p>
      {sub && <p className="text-xs text-white/25 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const today    = new Date().toISOString().split("T")[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo, setDateTo]     = useState(today);
  const [groupBy, setGroupBy]   = useState("day");

  const { data, isLoading } = useReport({ date_from: dateFrom, date_to: dateTo, group_by: groupBy });

  const summary    = (data as any)?.summary ?? {};
  const timeSeries = (data as any)?.time_series ?? [];
  const byProduct  = (data as any)?.by_product ?? [];
  const byPayment  = (data as any)?.by_payment ?? [];
  const capital    = (data as any)?.capital ?? {};

  const margin = summary.total_revenue > 0
    ? ((summary.total_profit / summary.total_revenue) * 100).toFixed(1)
    : "0.0";

  // --- Pagination state for Product Performance table ---
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.max(1, Math.ceil(byProduct.length / pageSize));

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return byProduct.slice(start, start + pageSize);
  }, [byProduct, page, pageSize]);

  // Reset to page 1 whenever the underlying data set changes (new filters, new page size)
  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, groupBy, pageSize]);

  // Clamp page if data shrinks below current page (e.g. after refetch)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const startIdx = byProduct.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, byProduct.length);

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg,#0d1020 0%,#141827 60%,#0f1628 100%)" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Reports</h1>
            <p className="text-white/40 text-sm mt-0.5">Sales, profit, and inventory analysis</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-white/40">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-white/40">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {["day","week","month"].map(g => (
              <button key={g} onClick={() => setGroupBy(g)}
                className={`px-3 py-1 rounded-lg text-xs capitalize transition ${groupBy === g ? "bg-indigo-500 text-white" : "text-white/40 hover:text-white"}`}>
                {g}
              </button>
            ))}
          </div>
          {/* Quick ranges */}
          <div className="flex gap-2 ml-auto">
            {[
              { label: "Today", from: today, to: today },
              { label: "This Week", from: (() => { const d = new Date(); d.setDate(d.getDate()-d.getDay()); return d.toISOString().split("T")[0]; })(), to: today },
              { label: "This Month", from: firstDay, to: today },
              { label: "This Year", from: `${new Date().getFullYear()}-01-01`, to: today },
            ].map(r => (
              <button key={r.label} onClick={() => { setDateFrom(r.from); setDateTo(r.to); }}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white hover:border-white/20 transition">
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-5 gap-3 mb-6">
            {Array(5).fill(0).map((_,i) => <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5"><Skeleton height={40} baseColor="#1f2937" highlightColor="#374151" /></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <StatCard label="Total Sales" value={String(summary.total_sales ?? 0)} color="text-white" />
            <StatCard label="Revenue" value={fmtCurrency(summary.total_revenue ?? 0)} color="text-indigo-300" />
            <StatCard label="Cost of Goods" value={fmtCurrency(summary.total_cost ?? 0)} color="text-white/70" />
            <StatCard label="Gross Profit" value={fmtCurrency(summary.total_profit ?? 0)} color="text-emerald-400" sub={`${margin}% margin`} />
            <StatCard label="Stock Capital" value={fmtCurrency(capital.remaining_capital ?? 0)} color="text-amber-400" sub="Unsold inventory" />
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Revenue + Profit time series */}
          <div className="col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-white mb-4">Revenue vs Profit</h3>
            {isLoading ? <Skeleton height={180} baseColor="#1f2937" highlightColor="#374151" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={timeSeries}>
                  <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#ffffff40" }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "#ffffff40" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #ffffff15", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => [fmtCurrency(v)]} />
                  <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} name="Revenue" />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={false} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Payment method breakdown */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-white mb-4">By Payment Method</h3>
            {isLoading ? <Skeleton height={180} baseColor="#1f2937" highlightColor="#374151" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={byPayment} dataKey="revenue" nameKey="payment_method" cx="50%" cy="50%" outerRadius={65} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                    labelLine={false} fontSize={10}>
                    {byPayment.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtCurrency(v)} contentStyle={{ background: "#1f2937", border: "1px solid #ffffff15", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Product breakdown table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Product Performance</h3>
            {!isLoading && byProduct.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/30">Rows</span>
                <select
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/70 focus:outline-none focus:border-indigo-500"
                >
                  {PAGE_SIZE_OPTIONS.map(size => (
                    <option key={size} value={size} className="bg-[#141827]">{size}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Product","Unit","Qty Sold","Revenue","Cost","Profit","Margin %"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array(5).fill(0).map((_,i) => (
                    <tr key={i} className="border-b border-white/5">
                      {Array(7).fill(0).map((_,j) => <td key={j} className="px-4 py-3"><Skeleton height={14} baseColor="#1f2937" highlightColor="#374151" /></td>)}
                    </tr>
                  ))
                : byProduct.length === 0
                ? <tr><td colSpan={7} className="px-4 py-12 text-center text-white/30 text-sm">No sales in this period</td></tr>
                : paginatedProducts.map((p: any, i: number) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition">
                      <td className="px-4 py-3 text-sm font-medium text-white">{p.product_name}</td>
                      <td className="px-4 py-3 text-xs text-white/40">{p.unit_type}</td>
                      <td className="px-4 py-3 text-sm text-white">{Number(p.qty_sold).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-indigo-300">{fmtCurrency(p.revenue)}</td>
                      <td className="px-4 py-3 text-sm text-white/60">{fmtCurrency(p.cost)}</td>
                      <td className="px-4 py-3 text-sm text-emerald-400 font-medium">{fmtCurrency(p.profit)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, p.margin_pct)}%` }} />
                          </div>
                          <span className={`text-xs font-medium ${p.margin_pct >= 30 ? "text-emerald-400" : p.margin_pct >= 10 ? "text-amber-400" : "text-red-400"}`}>
                            {p.margin_pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {/* Pagination controls */}
          {!isLoading && byProduct.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
              <p className="text-xs text-white/30">
                Showing {startIdx}–{endIdx} of {byProduct.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition disabled:opacity-30 disabled:hover:text-white/50 disabled:hover:border-white/10"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-white/50 px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition disabled:opacity-30 disabled:hover:text-white/50 disabled:hover:border-white/10"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}