"use client";
import React from "react";
import Link from "next/link";
import {
  TrendingUp, AlertTriangle, Bell, Package, DollarSign,
  ShoppingBag, BarChart2, Home, AlertCircle, ArrowRight,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useDashboard } from "@/lib/api/v1/hooks";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const fmtCurrency = (n: number) => `${Number(n).toLocaleString()} RWF`;

function KPICard({ label, value, sub, icon, color = "text-white" }: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; color?: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <p className={`text-2xl font-bold leading-none ${color}`}>{value}</p>
        <p className="text-xs text-white/40 mt-1">{label}</p>
        {sub && <p className="text-xs text-white/25 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  const todaySales      = data?.today_sales;
  const monthSales      = data?.month_sales;
  const monthProfit     = data?.month_profit;
  const topProducts     = data?.top_products ?? [];
  const lowStock        = data?.low_stock ?? [];
  const stockIssues     = data?.stock_issues ?? [];
  const spaceReminders  = data?.space_reminders ?? [];
  const overdueSpaces   = data?.overdue_spaces ?? [];
  const weeklyChart     = data?.weekly_chart ?? [];
  const capital         = data?.capital;
  const spaceSummary    = data?.space_summary ?? [];

  const issueCount      = stockIssues.length + overdueSpaces.length;

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg,#0d1020 0%,#141827 60%,#0f1628 100%)" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
            <p className="text-white/40 text-sm mt-0.5">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          {issueCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertCircle size={15} />
              {issueCount} issue{issueCount > 1 ? "s" : ""} need attention
            </div>
          )}
        </div>

        {/* KPI Row */}
        {isLoading ? (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {Array(4).fill(0).map((_,i) => <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5"><Skeleton height={50} baseColor="#1f2937" highlightColor="#374151" /></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <KPICard label="Today's Revenue" value={fmtCurrency(todaySales?.revenue ?? 0)}
              sub={`${todaySales?.cnt ?? 0} sales`} color="text-indigo-300"
              icon={<DollarSign size={18} className="text-indigo-400" />} />
            <KPICard label="Monthly Revenue" value={fmtCurrency(monthSales?.revenue ?? 0)}
              sub={`${monthSales?.cnt ?? 0} total sales`} color="text-white"
              icon={<ShoppingBag size={18} className="text-white/60" />} />
            <KPICard label="Monthly Profit" value={fmtCurrency(monthProfit?.profit ?? 0)}
              color="text-emerald-400"
              icon={<TrendingUp size={18} className="text-emerald-400" />} />
            <KPICard label="Stock Capital" value={fmtCurrency(capital?.total_capital ?? 0)}
              sub="Unsold inventory value" color="text-amber-400"
              icon={<Package size={18} className="text-amber-400" />} />
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Weekly sales chart */}
          <div className="col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-white mb-4">Last 7 Days Revenue</h3>
            {isLoading ? <Skeleton height={160} baseColor="#1f2937" highlightColor="#374151" /> : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyChart} barSize={28}>
                  <XAxis dataKey="sale_date"
                    tickFormatter={d => new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                    tick={{ fontSize: 11, fill: "#ffffff40" }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={n => n >= 1000 ? `${(n/1000).toFixed(0)}K` : String(n)}
                    tick={{ fontSize: 11, fill: "#ffffff40" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #ffffff15", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => [fmtCurrency(v), "Revenue"]} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Space status + reminders */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-white mb-3">Spaces</h3>
            {isLoading ? <Skeleton count={3} height={32} baseColor="#1f2937" highlightColor="#374151" className="mb-2" /> : (
              <>
                <div className="space-y-2 mb-4">
                  {spaceSummary.map((s: any) => (
                    <div key={s.status} className="flex items-center justify-between">
                      <span className="text-xs text-white/50 capitalize">{s.status}</span>
                      <span className={`text-sm font-semibold ${s.status === "available" ? "text-emerald-400" : s.status === "occupied" ? "text-indigo-400" : "text-amber-400"}`}>{s.cnt}</span>
                    </div>
                  ))}
                </div>
                {overdueSpaces.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-2">
                    <p className="text-xs text-red-400 font-medium mb-1.5 flex items-center gap-1"><AlertTriangle size={11} /> Overdue Payments</p>
                    {overdueSpaces.slice(0,3).map((s: any) => (
                      <p key={s.occupancy_id} className="text-xs text-red-300/80 truncate">{s.space_name} · {s.tenant_name}</p>
                    ))}
                  </div>
                )}
                {spaceReminders.filter((s: any) => !s.is_overdue).length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                    <p className="text-xs text-amber-400 font-medium mb-1.5 flex items-center gap-1"><Bell size={11} /> Due This Week</p>
                    {spaceReminders.filter((s: any) => !s.is_overdue).slice(0,3).map((s: any) => (
                      <p key={s.occupancy_id} className="text-xs text-amber-300/80 truncate">{s.space_name} · {s.next_payment_date}</p>
                    ))}
                  </div>
                )}
                <Link href="/dashboard/spaces" className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition mt-3">
                  View all spaces <ArrowRight size={11} />
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Top 5 products */}
          <div className="col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white">Top Selling Products (This Month)</h3>
              <Link href="/dashboard/reports" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                Full report <ArrowRight size={11} />
              </Link>
            </div>
            {isLoading ? <Skeleton count={5} height={36} baseColor="#1f2937" highlightColor="#374151" className="mb-2" /> :
            topProducts.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">No sales this month yet</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p: any, i: number) => {
                  const maxQty = topProducts[0]?.total_qty ?? 1;
                  const pct = Math.round((p.total_qty / maxQty) * 100);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-white/20 w-4 text-right">{i+1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white truncate">{p.product_name}</span>
                          <span className="text-xs text-emerald-400 shrink-0 ml-2">{fmtCurrency(p.total_profit)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-white/30 shrink-0">{Number(p.total_qty).toLocaleString()} {p.unit_type}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Alerts column */}
          <div className="space-y-4">
            {/* Low stock */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-amber-400" /> Low Stock
                </h3>
                <Link href="/dashboard/products" className="text-xs text-indigo-400 hover:text-indigo-300"><ArrowRight size={11} /></Link>
              </div>
              {isLoading ? <Skeleton count={3} height={24} baseColor="#1f2937" highlightColor="#374151" className="mb-1" /> :
              lowStock.length === 0 ? (
                <p className="text-white/30 text-xs">All stock levels OK</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {lowStock.map((p: any) => (
                    <div key={p.product_id} className="flex items-center justify-between">
                      <span className="text-xs text-white/70 truncate flex-1">{p.product_name}</span>
                      <span className={`text-xs font-medium shrink-0 ml-2 ${+p.current_quantity <= 0 ? "text-red-400" : "text-amber-400"}`}>
                        {Number(p.current_quantity).toLocaleString()} {p.unit_type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stock discrepancies */}
            <div className={`bg-white/5 border rounded-2xl p-5 ${stockIssues.length > 0 ? "border-red-500/20" : "border-white/10"}`}>
              <h3 className="text-sm font-medium text-white flex items-center gap-1.5 mb-3">
                <AlertCircle size={13} className={stockIssues.length > 0 ? "text-red-400" : "text-white/30"} />
                Stock Discrepancies
              </h3>
              {isLoading ? <Skeleton count={2} height={24} baseColor="#1f2937" highlightColor="#374151" /> :
              stockIssues.length === 0 ? (
                <p className="text-white/30 text-xs">No discrepancies found</p>
              ) : (
                <div className="space-y-2">
                  {stockIssues.slice(0,4).map((e: any) => (
                    <div key={e.entry_id} className="flex items-center justify-between">
                      <span className="text-xs text-white/70 truncate flex-1">{e.product_name}</span>
                      <span className="text-xs font-medium text-red-400 shrink-0 ml-2">
                        {Number(e.variance).toLocaleString()} {e.unit_type}
                      </span>
                    </div>
                  ))}
                  <Link href="/dashboard/stock" className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition mt-1">
                    View all <ArrowRight size={11} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
