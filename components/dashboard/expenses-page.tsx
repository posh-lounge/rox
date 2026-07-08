"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
} from "recharts";
import {
  Plus, Search, Pencil, Trash2, Loader2, X, ChevronLeft, ChevronRight, Receipt,
} from "lucide-react";
import { useExpenses, useExpenseCategories, useExpenseAction, Expense } from "@/lib/api/v1/hooks";
import { toast } from "sonner";
import Skeleton from "react-loading-skeleton";

// ── helpers ───────────────────────────────────────────────────
const fmtCurrency = (n: number) => `${Number(n ?? 0).toLocaleString()} RWF`;
const today     = () => new Date().toISOString().split("T")[0];
const firstDay  = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
};

const PAYMENT_METHODS = ["cash","momo","bank_transfer","card","cheque","other"];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

// ── Modal ─────────────────────────────────────────────────────
type ModalMode = "create" | "edit" | null;
interface FormState {
  expense_id?: number;
  cat_id: string;
  title: string;
  amount: string;
  expense_date: string;
  payment_method: string;
  payment_reference: string;
  vendor: string;
  notes: string;
}
const EMPTY_FORM: FormState = {
  cat_id: "10", title: "", amount: "", expense_date: today(),
  payment_method: "cash", payment_reference: "", vendor: "", notes: "",
};

function ExpenseModal({
  mode, form, setForm, categories, onClose, onSave, loading,
}: {
  mode: ModalMode;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  categories: Array<{ cat_id: number; cat_name: string; color: string }>;
  onClose: () => void;
  onSave: () => void;
  loading: boolean;
}) {
  if (!mode) return null;
  const f = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1f35] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{mode === "create" ? "Add Expense" : "Edit Expense"}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition"><X size={18}/></button>
        </div>

        <div className="space-y-3">
          {/* Category + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 block mb-1">Category</label>
              <select value={form.cat_id} onChange={f("cat_id")}
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer">
                {categories.map(c => <option key={c.cat_id} value={c.cat_id} className="bg-[#1a1f35]">{c.cat_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Date *</label>
              <input type="date" value={form.expense_date} onChange={f("expense_date")}
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"/>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs text-white/40 block mb-1">Description *</label>
            <input value={form.title} onChange={f("title")} placeholder="e.g. Monthly rent – January 2026"
              className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500"/>
          </div>

          {/* Amount + Vendor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 block mb-1">Amount (RWF) *</label>
              <input type="number" min="0" step="any" value={form.amount} onChange={f("amount")} placeholder="0"
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500"/>
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Vendor / Paid to</label>
              <input value={form.vendor} onChange={f("vendor")} placeholder="Landlord, Utilities…"
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500"/>
            </div>
          </div>

          {/* Payment method + reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 block mb-1">Payment Method</label>
              <select value={form.payment_method} onChange={f("payment_method")}
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer capitalize">
                {PAYMENT_METHODS.map(m => <option key={m} value={m} className="bg-[#1a1f35] capitalize">{m.replace("_"," ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Reference / Receipt #</label>
              <input value={form.payment_reference} onChange={f("payment_reference")} placeholder="Optional"
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500"/>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-white/40 block mb-1">Notes</label>
            <textarea value={form.notes} onChange={f("notes") as any} rows={2} placeholder="Optional note…"
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500 resize-none"/>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-white/10 text-white/50 rounded-xl text-sm font-medium hover:border-white/20 hover:text-white transition">
            Cancel
          </button>
          <button onClick={onSave} disabled={loading || !form.title || !form.amount || !form.expense_date}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin"/> : null}
            {mode === "create" ? "Add Expense" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete confirm ────────────────────────────────────────────
function DeleteConfirm({ expense, onConfirm, onClose, loading }: { expense: Expense; onConfirm: () => void; onClose: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1f35] border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-4"><Trash2 size={20} className="text-red-400"/></div>
        <h3 className="text-white font-bold mb-2">Delete Expense?</h3>
        <p className="text-white/40 text-sm mb-5">"{expense.title}" — {fmtCurrency(expense.amount)}<br/>This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-white/10 text-white/50 rounded-xl text-sm hover:border-white/20 hover:text-white transition">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
            {loading && <Loader2 size={13} className="animate-spin"/>}Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ExpensesPage() {
  const [dateFrom, setDateFrom] = useState(firstDay());
  const [dateTo,   setDateTo]   = useState(today());
  const [catFilter, setCatFilter] = useState<number|null>(null);
  const [search,   setSearch]   = useState("");

  const [modal,    setModal]    = useState<ModalMode>(null);
  const [form,     setForm]     = useState<FormState>(EMPTY_FORM);
  const [delTarget, setDelTarget] = useState<Expense|null>(null);

  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: catData }       = useExpenseCategories();
  const { data, isLoading }     = useExpenses({ date_from: dateFrom, date_to: dateTo, cat_id: catFilter, search });
  const expAction               = useExpenseAction();

  const categories = catData?.categories ?? [];
  const expenses   = data?.expenses     ?? [];
  const byCategory = data?.by_category  ?? [];
  const total      = data?.total        ?? 0;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(expenses.length / pageSize));
  const paginated  = useMemo(() => expenses.slice((page-1)*pageSize, page*pageSize), [expenses, page, pageSize]);
  useEffect(() => { setPage(1); }, [dateFrom, dateTo, catFilter, search, pageSize]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);

  // ── Open modals ───────────────────────────────────────────
  const openCreate = () => { setForm({ ...EMPTY_FORM, expense_date: today() }); setModal("create"); };
  const openEdit   = (e: Expense) => {
    setForm({
      expense_id: e.expense_id, cat_id: String(e.cat_id), title: e.title,
      amount: String(e.amount), expense_date: e.expense_date,
      payment_method: e.payment_method, payment_reference: e.payment_reference ?? "",
      vendor: e.vendor ?? "", notes: e.notes ?? "",
    });
    setModal("edit");
  };

  // ── Save ──────────────────────────────────────────────────
  const save = async () => {
    try {
      if (modal === "create") {
        await expAction.mutateAsync({ action: "create", ...form, cat_id: +form.cat_id, amount: +form.amount });
        toast.success("Expense recorded");
      } else {
        await expAction.mutateAsync({ action: "update", ...form, cat_id: +form.cat_id, amount: +form.amount });
        toast.success("Expense updated");
      }
      setModal(null);
    } catch (e: any) { toast.error(e.message); }
  };

  // ── Delete ────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!delTarget) return;
    try {
      await expAction.mutateAsync({ action: "delete", expense_id: delTarget.expense_id });
      toast.success("Deleted");
      setDelTarget(null);
    } catch (e: any) { toast.error(e.message); }
  };

  const CHART_COLORS = ["#6366f1","#f59e0b","#3b82f6","#10b981","#ef4444","#8b5cf6","#f97316","#14b8a6","#ec4899","#64748b"];

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg,#0d1020 0%,#141827 60%,#0f1628 100%)" }}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Expenses</h1>
            <p className="text-white/40 text-sm mt-0.5">Track rent, utilities and all operational costs</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition">
            <Plus size={16}/>Add Expense
          </button>
        </div>

        {/* Filters */}
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
          {/* Quick ranges */}
          <div className="flex gap-2">
            {[
              { label:"Today",      from: today(),    to: today() },
              { label:"This Month", from: firstDay(), to: today() },
              { label:"This Year",  from: `${new Date().getFullYear()}-01-01`, to: today() },
            ].map(r=>(
              <button key={r.label} onClick={()=>{setDateFrom(r.from);setDateTo(r.to);}}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white hover:border-white/20 transition">
                {r.label}
              </button>
            ))}
          </div>
          {/* Category chips */}
          <div className="flex gap-1.5 flex-wrap ml-auto">
            <button onClick={()=>setCatFilter(null)} className={`px-3 py-1 rounded-lg text-xs transition ${!catFilter?'bg-indigo-500 text-white':'bg-white/5 text-white/40 hover:text-white border border-white/10'}`}>All</button>
            {categories.map(c=>(
              <button key={c.cat_id} onClick={()=>setCatFilter(catFilter===c.cat_id?null:c.cat_id)}
                className={`px-3 py-1 rounded-lg text-xs transition ${catFilter===c.cat_id?'text-white':'bg-white/5 text-white/40 hover:text-white border border-white/10'}`}
                style={catFilter===c.cat_id?{backgroundColor:c.color}:undefined}>
                {c.cat_name}
              </button>
            ))}
          </div>
        </div>

        {/* KPI + Chart row */}
        <div className="grid grid-cols-4 gap-4">
          {/* Total card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
            <p className="text-xs text-white/40">Total Expenses</p>
            {isLoading ? <Skeleton height={36} baseColor="#1f2937" highlightColor="#374151"/> :
              <p className="text-3xl font-bold text-red-400 mt-2">{fmtCurrency(total)}</p>}
            <p className="text-xs text-white/25 mt-1">{expenses.length} entries</p>
          </div>

          {/* By category bar */}
          <div className="col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-white mb-3">By Category</h3>
            {isLoading ? <Skeleton height={120} baseColor="#1f2937" highlightColor="#374151"/> :
              byCategory.length===0 ? <div className="h-24 flex items-center justify-center text-white/20 text-sm">No data</div> : (
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={byCategory} layout="vertical" margin={{left:60,right:20}}>
                  <XAxis type="number" tick={{fontSize:10,fill:"#ffffff30"}} tickLine={false} axisLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}K`}/>
                  <YAxis type="category" dataKey="cat_name" tick={{fontSize:11,fill:"#ffffff60"}} tickLine={false} axisLine={false} width={60}/>
                  <Tooltip contentStyle={{background:"#1f2937",border:"1px solid #ffffff15",borderRadius:10,fontSize:12}} formatter={(v:number)=>[fmtCurrency(v),"Total"]}/>
                  <Bar dataKey="total" radius={4}>
                    {byCategory.map((c:any,i:number)=><Cell key={i} fill={c.color??CHART_COLORS[i%CHART_COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-white mb-3">Distribution</h3>
            {isLoading ? <Skeleton height={120} baseColor="#1f2937" highlightColor="#374151"/> :
              byCategory.length===0 ? <div className="h-24 flex items-center justify-center text-white/20 text-sm">No data</div> : (
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={byCategory} dataKey="total" nameKey="cat_name" cx="50%" cy="50%" outerRadius={50} label={false}>
                    {byCategory.map((c:any,i:number)=><Cell key={i} fill={c.color??CHART_COLORS[i%CHART_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{background:"#1f2937",border:"1px solid #ffffff15",borderRadius:10,fontSize:11}} formatter={(v:number)=>[fmtCurrency(v)]}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-medium text-white">Expense Entries</h3>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
                  className="h-8 pl-8 pr-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500 w-44"/>
              </div>
              {/* Page size */}
              {!isLoading && expenses.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/30">Rows</span>
                  <select value={pageSize} onChange={e=>setPageSize(+e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/70 focus:outline-none focus:border-indigo-500">
                    {PAGE_SIZE_OPTIONS.map(s=><option key={s} value={s} className="bg-[#141827]">{s}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Date","Ref","Category","Description","Vendor","Amount","Method",""].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array(5).fill(0).map((_,i)=>(
                <tr key={i} className="border-b border-white/5">
                  {Array(8).fill(0).map((_,j)=><td key={j} className="px-4 py-3"><Skeleton height={14} baseColor="#1f2937" highlightColor="#374151"/></td>)}
                </tr>
              )) : expenses.length===0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center">
                  <Receipt size={28} className="mx-auto mb-2 text-white/10"/>
                  <p className="text-white/30 text-sm">No expenses in this period</p>
                </td></tr>
              ) : paginated.map((e)=>(
                <tr key={e.expense_id} className="border-b border-white/5 hover:bg-white/3 transition group">
                  <td className="px-4 py-3 text-xs text-white/50 whitespace-nowrap">
                    {new Date(e.expense_date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-white/30">{e.expense_ref}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{backgroundColor:`${e.color}22`,color:e.color,border:`1px solid ${e.color}44`}}>
                      {e.cat_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white font-medium max-w-[200px] truncate">{e.title}</td>
                  <td className="px-4 py-3 text-xs text-white/40">{e.vendor??'—'}</td>
                  <td className="px-4 py-3 text-sm font-bold text-red-400">{fmtCurrency(+e.amount)}</td>
                  <td className="px-4 py-3 text-xs text-white/40 capitalize">{e.payment_method.replace("_"," ")}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={()=>openEdit(e)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-indigo-500/20 hover:text-indigo-300 transition">
                        <Pencil size={12}/>
                      </button>
                      <button onClick={()=>setDelTarget(e)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400 transition">
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {!isLoading && expenses.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
              <p className="text-xs text-white/30">
                Showing {expenses.length===0?0:(page-1)*pageSize+1}–{Math.min(page*pageSize,expenses.length)} of {expenses.length}
              </p>
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

      {/* Modals */}
      <ExpenseModal mode={modal} form={form} setForm={setForm} categories={categories} onClose={()=>setModal(null)} onSave={save} loading={expAction.isPending}/>
      {delTarget && <DeleteConfirm expense={delTarget} onConfirm={confirmDelete} onClose={()=>setDelTarget(null)} loading={expAction.isPending}/>}
    </div>
  );
}
