"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Receipt, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useReport, ReportData } from "@/lib/api/v1/hooks";
import Skeleton from "react-loading-skeleton";

// ── helpers ───────────────────────────────────────────────────
const fmtCurrency = (n: number) =>
  `${Number(n ?? 0).toLocaleString()} RWF`;
const fmtShort = (n: number) =>
  n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n/1_000).toFixed(1)}K` : String(Math.round(n));

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#3b82f6"];

// ── KPI card ─────────────────────────────────────────────────
function KPI({
  label, value, sub, color = "text-white", icon: Icon, positive,
}: {
  label: string; value: string; sub?: string; color?: string;
  icon?: React.ElementType; positive?: boolean;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40">{label}</p>
        {positive !== undefined && (
          positive
            ? <ArrowUpRight size={14} className="text-emerald-400"/>
            : <ArrowDownRight size={14} className="text-red-400"/>
        )}
      </div>
      <p className={`text-2xl font-bold leading-none ${color}`}>{value}</p>
      {sub && <p className="text-xs text-white/25">{sub}</p>}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <h3 className="text-sm font-semibold text-white">{children}</h3>
      <div className="flex-1 h-px bg-white/5"/>
    </div>
  );
}

export default function ReportsPage() {
  const todayStr  = new Date().toISOString().split("T")[0];
  const firstDay  = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo,   setDateTo]   = useState(todayStr);
  const [groupBy,  setGroupBy]  = useState("day");

  const { data, isLoading } = useReport({ date_from: dateFrom, date_to: dateTo, group_by: groupBy });

  const d = data as ReportData | undefined;

  const summary      = d?.summary;
  const timeSeries   = d?.time_series   ?? [];
  const byProduct    = d?.by_product    ?? [];
  const byPayment    = d?.by_payment    ?? [];
  const expByCat     = d?.expenses_by_category ?? [];
  const expRows      = d?.expense_rows  ?? [];
  const purchByProd  = d?.purchases_by_product ?? [];
  const capital      = d?.capital;

  // ── Product table pagination ──────────────────────────────
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(byProduct.length / pageSize));
  const paginatedProducts = useMemo(() => byProduct.slice((page-1)*pageSize, page*pageSize), [byProduct, page, pageSize]);
  useEffect(() => { setPage(1); }, [dateFrom, dateTo, groupBy, pageSize]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);
  const startIdx = byProduct.length===0 ? 0 : (page-1)*pageSize+1;
  const endIdx   = Math.min(page*pageSize, byProduct.length);

  const QUICK_RANGES = [
    { label:"Today",      from: todayStr,                          to: todayStr },
    { label:"This Week",  from: (() => { const d=new Date(); d.setDate(d.getDate()-d.getDay()); return d.toISOString().split("T")[0]; })(), to: todayStr },
    { label:"This Month", from: firstDay,                         to: todayStr },
    { label:"This Year",  from: `${new Date().getFullYear()}-01-01`, to: todayStr },
  ];

  return (
    <div className="min-h-screen p-6" style={{ background:"linear-gradient(135deg,#0d1020 0%,#141827 60%,#0f1628 100%)" }}>
      <div className="max-w-7xl mx-auto space-y-7">

        {/* ── Header ─────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & P&L</h1>
          <p className="text-white/40 text-sm mt-0.5">Sales, purchases, expenses and net profit</p>
        </div>

        {/* ── Filters ────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-white/40">From</label>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"/>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-white/40">To</label>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"/>
          </div>
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {["day","week","month"].map(g=>(
              <button key={g} onClick={()=>setGroupBy(g)}
                className={`px-3 py-1 rounded-lg text-xs capitalize transition ${groupBy===g?"bg-indigo-500 text-white":"text-white/40 hover:text-white"}`}>
                {g}
              </button>
            ))}
          </div>
          <div className="flex gap-2 ml-auto flex-wrap">
            {QUICK_RANGES.map(r=>(
              <button key={r.label} onClick={()=>{setDateFrom(r.from);setDateTo(r.to);}}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white hover:border-white/20 transition">
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── P&L SUMMARY ────────────────────────────────────── */}
        <div>
          <SectionHeader>Profit & Loss Summary</SectionHeader>

          {/* Income vs Expenses overview */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* Income block */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5"><TrendingUp size={12}/>Income</p>
              {isLoading ? <Skeleton count={2} height={20} baseColor="#1f2937" highlightColor="#374151"/> : (
                <>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-white/40">Sales Revenue</span>
                    <span className="text-sm font-bold text-white">{fmtCurrency(summary?.total_revenue??0)}</span>
                  </div>
                  <div className="border-t border-emerald-500/20 pt-2 flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-emerald-300">Total Income</span>
                    <span className="text-lg font-extrabold text-emerald-300">{fmtCurrency(summary?.total_revenue??0)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Expenses block */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 space-y-3">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5"><TrendingDown size={12}/>Expenses</p>
              {isLoading ? <Skeleton count={3} height={18} baseColor="#1f2937" highlightColor="#374151"/> : (
                <>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-white/40">Stock Purchases</span>
                    <span className="text-sm font-medium text-white">{fmtCurrency(summary?.total_purchase_cost??0)}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-white/40">Operational Costs</span>
                    <span className="text-sm font-medium text-white">{fmtCurrency(summary?.total_op_expenses??0)}</span>
                  </div>
                  <div className="border-t border-red-500/20 pt-2 flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-red-300">Total Expenses</span>
                    <span className="text-lg font-extrabold text-red-300">{fmtCurrency(summary?.total_all_expenses??0)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Net Profit block */}
            <div className={`rounded-2xl p-5 space-y-3 ${(summary?.net_profit??0)>=0?"bg-indigo-500/5 border border-indigo-500/20":"bg-red-900/10 border border-red-500/30"}`}>
              <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Net Profit</p>
              {isLoading ? <Skeleton height={48} baseColor="#1f2937" highlightColor="#374151"/> : (
                <>
                  <p className={`text-3xl font-extrabold ${(summary?.net_profit??0)>=0?"text-indigo-300":"text-red-400"}`}>
                    {fmtCurrency(summary?.net_profit??0)}
                  </p>
                  <div className="space-y-1.5 text-xs border-t border-white/10 pt-2">
                    <div className="flex justify-between"><span className="text-white/40">Gross profit (revenue − COGS)</span><span className="text-emerald-400">{fmtCurrency(summary?.gross_profit??0)}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Gross margin</span><span className="text-white/60">{summary?.gross_margin_pct??0}%</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Net margin</span><span className={(summary?.net_margin_pct??0)>=0?"text-indigo-300":"text-red-400"}>{summary?.net_margin_pct??0}%</span></div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {isLoading ? Array(6).fill(0).map((_,i)=><div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5"><Skeleton height={36} baseColor="#1f2937" highlightColor="#374151"/></div>) : (
              <>
                <KPI label="Total Sales"     value={String(summary?.total_sales??0)} color="text-white"/>
                <KPI label="Revenue"         value={fmtCurrency(summary?.total_revenue??0)} color="text-indigo-300"/>
                <KPI label="COGS"            value={fmtCurrency(summary?.cogs??0)} color="text-white/60"/>
                <KPI label="Purchases"       value={fmtCurrency(summary?.total_purchase_cost??0)} color="text-amber-300"/>
                <KPI label="Op. Expenses"    value={fmtCurrency(summary?.total_op_expenses??0)} color="text-red-400"/>
                <KPI label="Stock Capital"   value={fmtCurrency(capital?.remaining_capital??0)} color="text-emerald-400" sub="Unsold inventory"/>
              </>
            )}
          </div>
        </div>

        {/* ── TIME SERIES CHART ───────────────────────────────── */}
        <div>
          <SectionHeader>Revenue vs Expenses Over Time</SectionHeader>
          <div className="grid grid-cols-3 gap-4">
            {/* Main chart */}
            <div className="col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5">
              {isLoading ? <Skeleton height={200} baseColor="#1f2937" highlightColor="#374151"/> : (
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={timeSeries}>
                    <XAxis dataKey="period" tick={{fontSize:10,fill:"#ffffff40"}} tickLine={false} axisLine={false}/>
                    <YAxis tickFormatter={fmtShort} tick={{fontSize:10,fill:"#ffffff40"}} tickLine={false} axisLine={false}/>
                    <Tooltip
                      contentStyle={{background:"#1f2937",border:"1px solid #ffffff15",borderRadius:12,fontSize:12}}
                      formatter={(v:number,name:string)=>[fmtCurrency(v),name]}/>
                    <Area type="monotone" dataKey="revenue"   fill="#6366f120" stroke="#6366f1" strokeWidth={2} name="Revenue"   dot={false}/>
                    <Line type="monotone" dataKey="total_out" stroke="#ef4444"  strokeWidth={1.5} name="All Expenses" dot={false} strokeDasharray="4 2"/>
                    <Line type="monotone" dataKey="net_profit" stroke="#10b981" strokeWidth={2}   name="Net Profit"   dot={false}/>
                  </ComposedChart>
                </ResponsiveContainer>
              )}
              <div className="flex items-center gap-5 mt-3 text-xs text-white/40 justify-center">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-indigo-400 inline-block rounded"/>Revenue</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-400 inline-block rounded" style={{borderTop:'1px dashed #ef4444'}}/>All Expenses</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-400 inline-block rounded"/>Net Profit</span>
              </div>
            </div>

            {/* Payment method pie */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-xs font-medium text-white mb-3">By Payment Method</p>
              {isLoading ? <Skeleton height={180} baseColor="#1f2937" highlightColor="#374151"/> : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={byPayment} dataKey="revenue" nameKey="payment_method" cx="50%" cy="50%" outerRadius={65}
                      label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {byPayment.map((_:any,i:number)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip formatter={(v:number)=>fmtCurrency(v)} contentStyle={{background:"#1f2937",border:"1px solid #ffffff15",borderRadius:12,fontSize:12}}/>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ── EXPENSES BREAKDOWN ──────────────────────────────── */}
        {(!isLoading && (expByCat.length > 0 || expRows.length > 0)) && (
          <div>
            <SectionHeader>Operational Expenses Breakdown</SectionHeader>
            <div className="grid grid-cols-3 gap-4">
              {/* By category */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-xs font-medium text-white mb-3">By Category</p>
                <div className="space-y-2.5">
                  {expByCat.map((c:any,i:number)=>(
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:c.color??COLORS[i%COLORS.length]}}/>
                      <span className="text-xs text-white/60 flex-1 truncate">{c.cat_name}</span>
                      <span className="text-xs font-semibold text-white">{fmtCurrency(c.total)}</span>
                      <span className="text-[10px] text-white/30">{c.cnt}×</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
                  <span className="text-xs text-white/40">Total</span>
                  <span className="text-xs font-bold text-red-400">{fmtCurrency(summary?.total_op_expenses??0)}</span>
                </div>
              </div>

              {/* Recent expense rows */}
              <div className="col-span-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-white/5 bg-white/3">
                    {["Date","Category","Description","Vendor","Amount"].map(h=>(
                      <th key={h} className="px-4 py-2.5 text-left text-xs text-white/40 font-medium">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {expRows.slice(0,8).map((e:any,i:number)=>(
                      <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition">
                        <td className="px-4 py-2.5 text-xs text-white/40 whitespace-nowrap">{new Date(e.expense_date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</td>
                        <td className="px-4 py-2.5"><span className="text-[10px] px-2 py-0.5 rounded-full" style={{backgroundColor:`${e.color}22`,color:e.color}}>{e.cat_name}</span></td>
                        <td className="px-4 py-2.5 text-xs text-white max-w-[160px] truncate">{e.title}</td>
                        <td className="px-4 py-2.5 text-xs text-white/40">{e.vendor??'—'}</td>
                        <td className="px-4 py-2.5 text-xs font-bold text-red-400">{fmtCurrency(+e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {expRows.length > 8 && <p className="px-4 py-2 text-xs text-white/30 text-center">+{expRows.length-8} more — see Expenses page for full list</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── PURCHASES BREAKDOWN ─────────────────────────────── */}
        {(!isLoading && purchByProd.length > 0) && (
          <div>
            <SectionHeader>Stock Purchases in Period</SectionHeader>
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-white/5 bg-white/3">
                  {["Product","Unit","Qty Purchased","Total Cost","Avg Unit Cost"].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {purchByProd.map((p:any,i:number)=>(
                    <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition">
                      <td className="px-4 py-3 text-sm font-medium text-white">{p.product_name}</td>
                      <td className="px-4 py-3 text-xs text-white/40">{p.unit_type}</td>
                      <td className="px-4 py-3 text-sm text-white">{Number(p.qty_purchased).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-bold text-amber-300">{fmtCurrency(p.total_cost)}</td>
                      <td className="px-4 py-3 text-xs text-white/40">{fmtCurrency(Math.round(p.avg_unit_cost))}/unit</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/10 bg-white/3">
                    <td colSpan={3} className="px-4 py-3 text-xs text-white/40 font-semibold">Total</td>
                    <td className="px-4 py-3 text-sm font-extrabold text-amber-300">{fmtCurrency(summary?.total_purchase_cost??0)}</td>
                    <td/>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ── PRODUCT PERFORMANCE ─────────────────────────────── */}
        <div>
          <SectionHeader>Product Sales Performance</SectionHeader>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Product Performance</h3>
              {!isLoading && byProduct.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/30">Rows</span>
                  <select value={pageSize} onChange={e=>setPageSize(Number(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/70 focus:outline-none focus:border-indigo-500">
                    {PAGE_SIZE_OPTIONS.map(s=><option key={s} value={s} className="bg-[#141827]">{s}</option>)}
                  </select>
                </div>
              )}
            </div>
            <table className="w-full">
              <thead><tr className="border-b border-white/5">
                {["Product","Unit","Qty Sold","Revenue","Cost","Profit","Margin %"].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {isLoading ? Array(5).fill(0).map((_,i)=>(
                  <tr key={i} className="border-b border-white/5">
                    {Array(7).fill(0).map((_,j)=><td key={j} className="px-4 py-3"><Skeleton height={14} baseColor="#1f2937" highlightColor="#374151"/></td>)}
                  </tr>
                )) : byProduct.length===0
                  ? <tr><td colSpan={7} className="px-4 py-12 text-center text-white/30 text-sm">No sales in this period</td></tr>
                  : paginatedProducts.map((p:any,i:number)=>(
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
                          <div className="h-full bg-emerald-500 rounded-full" style={{width:`${Math.min(100,p.margin_pct)}%`}}/>
                        </div>
                        <span className={`text-xs font-medium ${p.margin_pct>=30?"text-emerald-400":p.margin_pct>=10?"text-amber-400":"text-red-400"}`}>
                          {p.margin_pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!isLoading && byProduct.length > 0 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
                <p className="text-xs text-white/30">Showing {startIdx}–{endIdx} of {byProduct.length}</p>
                <div className="flex items-center gap-1">
                  <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition disabled:opacity-30">
                    <ChevronLeft size={14}/>
                  </button>
                  <span className="text-xs text-white/50 px-2">Page {page} of {totalPages}</span>
                  <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition disabled:opacity-30">
                    <ChevronRight size={14}/>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
