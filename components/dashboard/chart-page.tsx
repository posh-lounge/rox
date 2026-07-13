"use client";
import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  ArrowRight, ArrowDownLeft, Wallet, Smartphone, CreditCard,
  Plus, Loader2, X, ChevronLeft, ChevronRight, Pencil, Trash2,
  TrendingUp, TrendingDown, ArrowLeftRight, AlertCircle, CheckCircle2,
} from "lucide-react";
import {
  useAccounts, useAccountTransactions, useAccountAction,
  useLoanDetail, useLoanAction, AccountBalance, AccountTransaction,
} from "@/lib/api/v1/hooks";
import { toast } from "sonner";
import Skeleton from "react-loading-skeleton";

// ── helpers ───────────────────────────────────────────────────
const fmt  = (n: number) => `${Number(n ?? 0).toLocaleString()} RWF`;
const fmtS = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n/1_000).toFixed(0)}K` : String(Math.round(n));

const METHOD_META: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  cash: { icon: Wallet,      color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  momo: { icon: Smartphone,  color: "text-yellow-400",  bg: "bg-yellow-500/10",  border: "border-yellow-500/20"  },
  pos:  { icon: CreditCard,  color: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/20"     },
};

const PAYMENT_METHODS = ["cash","momo","pos"];

// ── Account Balance Card ──────────────────────────────────────
function BalanceCard({ b, selected, onClick }: { b: AccountBalance; selected: boolean; onClick: () => void }) {
  const meta = METHOD_META[b.method];
  const Icon = meta.icon;
  return (
    <button onClick={onClick}
      className={`w-full text-left rounded-2xl border p-5 transition ${selected ? "ring-2 ring-indigo-500 " + meta.bg + " " + meta.border : "bg-white/5 border-white/10 hover:border-white/20"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${meta.bg} border ${meta.border} flex items-center justify-center`}>
          <Icon size={18} className={meta.color}/>
        </div>
        <span className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>{b.label}</span>
      </div>
      <p className={`text-3xl font-extrabold ${b.balance >= 0 ? "text-white" : "text-red-400"}`}>{fmtS(b.balance)}</p>
      <p className="text-xs text-white/30 mt-0.5">RWF</p>
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-white/40">Income</span>
          <span className="text-emerald-400 font-medium">{fmt(b.income)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-white/40">Out</span>
          <span className="text-red-400 font-medium">{fmt(b.expenses + b.withdrawals + b.transfers_out)}</span>
        </div>
        {b.transfers_in > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-white/40">Transfers in</span>
            <span className="text-sky-400 font-medium">+{fmt(b.transfers_in)}</span>
          </div>
        )}
      </div>
    </button>
  );
}

// ── Modal shell ───────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1f35] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose}><X size={18} className="text-white/40 hover:text-white transition"/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const INPUT = "w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20";
const SELECT = `${INPUT} cursor-pointer`;

// ── Transfer Modal ────────────────────────────────────────────
function TransferModal({ onClose, balances }: { onClose: () => void; balances: AccountBalance[] }) {
  const [from,   setFrom]   = useState("cash");
  const [to,     setTo]     = useState("momo");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const acctAction = useAccountAction();

  const fromBalance = balances.find(b => b.method === from)?.balance ?? 0;

  const submit = async () => {
    if (!amount || +amount <= 0) { toast.error("Enter an amount"); return; }
    if (from === to)             { toast.error("Cannot transfer to same account"); return; }
    if (!reason.trim())          { toast.error("Reason is required"); return; }
    if (+amount > fromBalance)   { toast.error(`Insufficient balance in ${from.toUpperCase()} (${fmt(fromBalance)})`); return; }
    try {
      const res = await acctAction.mutateAsync({ action:"transfer", from_account:from, to_account:to, amount:+amount, reason }) as any;
      toast.success(res.message);
      onClose();
    } catch(e:any){ toast.error(e.message); }
  };

  return (
    <Modal title="Transfer Between Accounts" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-2 items-center">
          <div className="col-span-2">
            <label className="text-xs text-white/40 block mb-1.5">From</label>
            <select value={from} onChange={e=>setFrom(e.target.value)} className={SELECT}>
              {PAYMENT_METHODS.map(m=><option key={m} value={m} className="bg-[#1a1f35] capitalize">{m.toUpperCase()}</option>)}
            </select>
            <p className="text-[11px] text-white/30 mt-1">Balance: {fmt(fromBalance)}</p>
          </div>
          <div className="flex items-center justify-center pt-5">
            <ArrowRight size={18} className="text-white/30"/>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-white/40 block mb-1.5">To</label>
            <select value={to} onChange={e=>setTo(e.target.value)} className={SELECT}>
              {PAYMENT_METHODS.map(m=><option key={m} value={m} className="bg-[#1a1f35] capitalize">{m.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-1.5">Amount (RWF) *</label>
          <input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0" className={INPUT}/>
          {+amount > fromBalance && fromBalance > 0 && (
            <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11}/>Exceeds {from.toUpperCase()} balance</p>
          )}
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-1.5">Reason *</label>
          <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g. Convert MoMo to cash for expenses" className={INPUT}/>
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={onClose} className="flex-1 py-2.5 border border-white/10 text-white/50 rounded-xl text-sm font-medium hover:border-white/20 transition">Cancel</button>
        <button onClick={submit} disabled={acctAction.isPending}
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
          {acctAction.isPending ? <Loader2 size={14} className="animate-spin"/> : <ArrowRight size={14}/>}Transfer
        </button>
      </div>
    </Modal>
  );
}

// ── Withdraw Modal ────────────────────────────────────────────
function WithdrawModal({ onClose, balances }: { onClose: () => void; balances: AccountBalance[] }) {
  const [from,   setFrom]   = useState("cash");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [notes,  setNotes]  = useState("");
  const acctAction = useAccountAction();

  const fromBalance = balances.find(b => b.method === from)?.balance ?? 0;

  const submit = async () => {
    if (!amount || +amount <= 0) { toast.error("Enter an amount"); return; }
    if (!reason.trim())          { toast.error("Reason is required"); return; }
    if (+amount > fromBalance)   { toast.error(`Insufficient balance in ${from.toUpperCase()}`); return; }
    try {
      const res = await acctAction.mutateAsync({ action:"withdraw", from_account:from, amount:+amount, reason, notes }) as any;
      toast.success(res.message);
      onClose();
    } catch(e:any){ toast.error(e.message); }
  };

  return (
    <Modal title="Withdraw Funds" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-white/40 block mb-1.5">Account</label>
          <select value={from} onChange={e=>setFrom(e.target.value)} className={SELECT}>
            {PAYMENT_METHODS.map(m=>(
              <option key={m} value={m} className="bg-[#1a1f35]">
                {m.toUpperCase()} — {fmt(balances.find(b=>b.method===m)?.balance??0)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-1.5">Amount (RWF) *</label>
          <input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0" className={INPUT}/>
          {+amount > fromBalance && fromBalance > 0 && (
            <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11}/>Exceeds balance</p>
          )}
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-1.5">Reason *</label>
          <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g. Paid supplier, Personal withdrawal, Petty cash…" className={INPUT}/>
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-1.5">Notes (optional)</label>
          <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Additional details…" className={INPUT}/>
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={onClose} className="flex-1 py-2.5 border border-white/10 text-white/50 rounded-xl text-sm font-medium hover:border-white/20 transition">Cancel</button>
        <button onClick={submit} disabled={acctAction.isPending}
          className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
          {acctAction.isPending ? <Loader2 size={14} className="animate-spin"/> : <ArrowDownLeft size={14}/>}Withdraw
        </button>
      </div>
    </Modal>
  );
}

// ── Edit Loan Payment Modal ───────────────────────────────────
function EditLoanPaymentModal({ payment, onClose }: { payment: any; onClose: () => void }) {
  const [amount, setAmount] = useState(String(payment.amount));
  const [method, setMethod] = useState(payment.payment_method);
  const [ref,    setRef]    = useState(payment.payment_reference ?? "");
  const [notes,  setNotes]  = useState(payment.notes ?? "");
  const loanAction = useLoanAction();

  const save = async () => {
    if (!amount || +amount <= 0) { toast.error("Amount must be greater than 0"); return; }
    try {
      await loanAction.mutateAsync({ action:"edit_loan_payment", payment_id:payment.payment_id, amount:+amount, payment_method:method, payment_reference:ref||null, notes:notes||null });
      toast.success("Payment updated");
      onClose();
    } catch(e:any){ toast.error(e.message); }
  };

  return (
    <Modal title="Edit Loan Payment" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/40 block mb-1.5">Amount (RWF) *</label>
            <input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} className={INPUT}/>
          </div>
          <div>
            <label className="text-xs text-white/40 block mb-1.5">Method</label>
            <select value={method} onChange={e=>setMethod(e.target.value)} className={SELECT}>
              {PAYMENT_METHODS.map(m=><option key={m} value={m} className="bg-[#1a1f35] capitalize">{m.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-1.5">Reference</label>
          <input value={ref} onChange={e=>setRef(e.target.value)} placeholder="MoMo ID, receipt…" className={INPUT}/>
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-1.5">Notes</label>
          <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Optional note" className={INPUT}/>
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={onClose} className="flex-1 py-2.5 border border-white/10 text-white/50 rounded-xl text-sm font-medium hover:border-white/20 transition">Cancel</button>
        <button onClick={save} disabled={loanAction.isPending}
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
          {loanAction.isPending ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle2 size={14}/>}Save
        </button>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════
const PAGE_SIZE = 15;

export default function ChartOfAccountsPage() {
  const { data, isLoading } = useAccounts();
  const acctAction          = useAccountAction();

  const balances   = data?.balances    ?? [];
  const grandTotal = data?.grand_total ?? 0;
  const recentTxns = data?.recent_txns ?? [];

  const [selectedMethod, setSelectedMethod] = useState<string|null>(null);
  const [showTransfer,   setShowTransfer]   = useState(false);
  const [showWithdraw,   setShowWithdraw]   = useState(false);
  const [editPayment,    setEditPayment]    = useState<any|null>(null);
  const [delTxnId,       setDelTxnId]       = useState<number|null>(null);

  // Transactions list with pagination
  const { data: txnData } = useAccountTransactions(
    selectedMethod ? { account: selectedMethod } : {}
  );
  const txns = txnData?.transactions ?? [];
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(txns.length / PAGE_SIZE);
  const paginated  = txns.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const deleteTxn = async (id: number) => {
    try {
      await acctAction.mutateAsync({ action:"delete_transaction", txn_id:id });
      toast.success("Transaction deleted");
      setDelTxnId(null);
    } catch(e:any){ toast.error(e.message); }
  };

  // Chart: income breakdown by source per method
  const incomeChartData = balances.map(b => ({
    name: b.label,
    Sales: b.from_sales,
    Loans: b.from_loans,
    Spaces: b.from_spaces,
  }));

  const TXN_COLORS: Record<string, string> = {
    transfer:   "bg-sky-500/10 text-sky-400 border-sky-500/20",
    withdrawal: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="min-h-screen p-6" style={{ background:"linear-gradient(135deg,#0d1020 0%,#141827 60%,#0f1628 100%)" }}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Chart of Accounts</h1>
            <p className="text-white/40 text-sm mt-0.5">Real-time cash position across Cash, MoMo and POS</p>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>setShowTransfer(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:border-indigo-500/50 text-white rounded-xl text-sm font-semibold transition">
              <ArrowLeftRight size={15}/>Transfer
            </button>
            <button onClick={()=>setShowWithdraw(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition">
              <ArrowDownLeft size={15}/>Withdraw
            </button>
          </div>
        </div>

        {/* Total + 3 account cards */}
        <div className="grid grid-cols-4 gap-4">
          {/* Grand total */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Total Balance</p>
            {isLoading ? <Skeleton height={48} baseColor="#1f2937" highlightColor="#374151"/> : (
              <>
                <p className={`text-4xl font-extrabold mt-3 ${grandTotal >= 0 ? "text-white" : "text-red-400"}`}>{fmtS(grandTotal)}</p>
                <p className="text-sm text-white/30 mt-1">RWF across all accounts</p>
              </>
            )}
          </div>
          {/* Per-method cards */}
          {isLoading ? Array(3).fill(0).map((_,i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <Skeleton height={120} baseColor="#1f2937" highlightColor="#374151"/>
            </div>
          )) : balances.map(b => (
            <BalanceCard key={b.method} b={b}
              selected={selectedMethod === b.method}
              onClick={() => { setSelectedMethod(p => p === b.method ? null : b.method); setPage(1); }}/>
          ))}
        </div>

        {/* Income breakdown chart */}
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3 bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-white mb-4">Income Sources by Account</h3>
            {isLoading ? <Skeleton height={180} baseColor="#1f2937" highlightColor="#374151"/> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={incomeChartData} barGap={4}>
                  <XAxis dataKey="name" tick={{fontSize:12,fill:"#ffffff60"}} tickLine={false} axisLine={false}/>
                  <YAxis tickFormatter={fmtS} tick={{fontSize:10,fill:"#ffffff40"}} tickLine={false} axisLine={false}/>
                  <Tooltip contentStyle={{background:"#1f2937",border:"1px solid #ffffff15",borderRadius:12,fontSize:12}} formatter={(v:number)=>[fmt(v)]}/>
                  <Bar dataKey="Sales"  stackId="a" fill="#6366f1" radius={[0,0,0,0]}/>
                  <Bar dataKey="Loans"  stackId="a" fill="#10b981" radius={[0,0,0,0]}/>
                  <Bar dataKey="Spaces" stackId="a" fill="#f59e0b" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="flex items-center gap-5 mt-3 text-xs text-white/40 justify-center">
              {[{c:"#6366f1",l:"Sales"},{c:"#10b981",l:"Loan Repayments"},{c:"#f59e0b",l:"Space Rent"}].map(x=>(
                <span key={x.l} className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm inline-block" style={{backgroundColor:x.c}}/>{x.l}</span>
              ))}
            </div>
          </div>

          {/* Per-account detail breakdown */}
          <div className="col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-white mb-4">
              {selectedMethod ? `${selectedMethod.toUpperCase()} Breakdown` : "Select an account to see breakdown"}
            </h3>
            {!selectedMethod ? (
              <div className="flex items-center justify-center h-36 text-white/20 text-sm">Click a card above</div>
            ) : (() => {
              const b = balances.find(x => x.method === selectedMethod);
              if (!b) return null;
              return (
                <div className="space-y-3">
                  {[
                    { l:"Sales income",     v:b.from_sales,    c:"text-emerald-400", sign:"+" },
                    { l:"Loan repayments",  v:b.from_loans,    c:"text-emerald-400", sign:"+" },
                    { l:"Space rent",       v:b.from_spaces,   c:"text-yellow-400",  sign:"+" },
                    { l:"Expenses paid",    v:b.expenses,      c:"text-red-400",     sign:"−" },
                    { l:"Withdrawals",      v:b.withdrawals,   c:"text-red-400",     sign:"−" },
                    { l:"Transfers out",    v:b.transfers_out, c:"text-orange-400",  sign:"−" },
                    { l:"Transfers in",     v:b.transfers_in,  c:"text-sky-400",     sign:"+" },
                  ].map(row => (
                    <div key={row.l} className="flex justify-between text-sm">
                      <span className="text-white/50">{row.l}</span>
                      <span className={row.c}>{row.sign} {fmt(row.v)}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/10 pt-3 flex justify-between text-sm font-bold">
                    <span className="text-white">Balance</span>
                    <span className={b.balance >= 0 ? "text-white" : "text-red-400"}>{fmt(b.balance)}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Transactions table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h3 className="text-sm font-medium text-white">
              {selectedMethod ? `${selectedMethod.toUpperCase()} Transactions` : "All Transactions"} ({txns.length})
            </h3>
            {selectedMethod && (
              <button onClick={()=>setSelectedMethod(null)} className="text-xs text-white/40 hover:text-white transition">Show all</button>
            )}
          </div>
          <table className="w-full">
            <thead><tr className="border-b border-white/5 bg-white/3">
              {["When","Ref","Type","From","To","Amount","Reason","By",""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs text-white/40 font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-white/20 text-sm">No transactions yet</td></tr>
              ) : paginated.map((t: AccountTransaction) => (
                <tr key={t.txn_id} className="border-b border-white/5 hover:bg-white/3 transition group">
                  <td className="px-4 py-3 text-xs text-white/40 whitespace-nowrap">
                    {new Date(t.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-white/30">{t.txn_ref}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold capitalize ${TXN_COLORS[t.txn_type]}`}>
                      {t.txn_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-white uppercase">{t.from_account}</td>
                  <td className="px-4 py-3 text-xs text-white/50 uppercase">{t.to_account ?? "—"}</td>
                  <td className="px-4 py-3 text-sm font-bold text-red-400">{fmt(+t.amount)}</td>
                  <td className="px-4 py-3 text-sm text-white max-w-[180px] truncate">{t.reason}</td>
                  <td className="px-4 py-3 text-xs text-white/40">{t.firstname} {t.lastname}</td>
                  <td className="px-4 py-3">
                    <button onClick={()=>setDelTxnId(t.txn_id)}
                      className="opacity-0 group-hover:opacity-100 transition w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400">
                      <Trash2 size={12}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
              <p className="text-xs text-white/30">Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,txns.length)} of {txns.length}</p>
              <div className="flex items-center gap-1">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white disabled:opacity-30 transition"><ChevronLeft size={14}/></button>
                <span className="text-xs text-white/40 px-2">Page {page} of {totalPages}</span>
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white disabled:opacity-30 transition"><ChevronRight size={14}/></button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      {showTransfer && <TransferModal onClose={()=>setShowTransfer(false)} balances={balances}/>}
      {showWithdraw && <WithdrawModal onClose={()=>setShowWithdraw(false)} balances={balances}/>}
      {editPayment  && <EditLoanPaymentModal payment={editPayment} onClose={()=>setEditPayment(null)}/>}

      {/* Delete confirm */}
      {delTxnId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1f35] border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-400"/>
            </div>
            <h3 className="text-white font-bold mb-2">Delete transaction?</h3>
            <p className="text-white/40 text-sm mb-5">This will remove the transfer or withdrawal record. Account balances will update automatically.</p>
            <div className="flex gap-3">
              <button onClick={()=>setDelTxnId(null)} className="flex-1 py-2.5 border border-white/10 text-white/50 rounded-xl text-sm hover:border-white/20 transition">Cancel</button>
              <button onClick={()=>deleteTxn(delTxnId)} disabled={acctAction.isPending}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
                {acctAction.isPending && <Loader2 size={13} className="animate-spin"/>}Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
