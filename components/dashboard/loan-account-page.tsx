"use client";
import React, { useState } from "react";
import {
  Plus, X, Loader2, Search, User, Phone, CreditCard,
  Smartphone, Banknote, ChevronRight, AlertCircle,
  CheckCircle, Clock, ArrowLeft, ShoppingBag,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api/v1/fetchApi";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface LoanAccount { loan_id:number; account_ref:string; customer_name:string; customer_phone:string; customer_email:string; total_debt:number; total_paid:number; balance:number; status:string; created_at:string; sale_count:number; payment_count:number; }
interface LoanSale { sale_id:number; sale_ref:string; total_amount:number; discount_amount:number; status:string; created_at:string; firstname:string; lastname:string; }
interface LoanPayment { payment_id:number; amount:number; payment_method:string; payment_reference:string; notes:string; received_by:string; created_at:string; firstname:string; lastname:string; }

const fmt = (n:number) => `${Number(n).toLocaleString()} RWF`;

const useAccounts = () => useQuery({ queryKey:['loan-accounts'], queryFn:()=>apiPost<{accounts:LoanAccount[]}>('/api/main/dashboard/create/loan-action',{action:'list'}) });
const useDetail   = (id:number|null) => useQuery({ queryKey:['loan-detail',id], enabled:!!id, queryFn:()=>apiPost<{account:LoanAccount;sales:LoanSale[];payments:LoanPayment[]}>('/api/main/dashboard/create/loan-action',{action:'detail',loan_id:id}) });
const useLoanMutation = () => { const qc=useQueryClient(); return useMutation({ mutationFn:(d:Record<string,unknown>)=>apiPost('/api/main/dashboard/create/loan-action',d), onSuccess:()=>{ qc.invalidateQueries({queryKey:['loan-accounts']}); qc.invalidateQueries({queryKey:['loan-detail']}); } }); };

// ─── Create Account Modal ────────────────────────────────────
function CreateModal({ onClose }:{ onClose:()=>void }) {
  const mut = useLoanMutation();
  const [form,setForm]=useState({customer_name:'',customer_phone:'',customer_email:'',notes:''});
  const set=(k:string,v:string)=>setForm(f=>({...f,[k]:v}));
  const handle=async()=>{ if(!form.customer_name.trim()) return; await mut.mutateAsync({action:'create',...form}); onClose(); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold">New Loan Account</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="text-xs text-white/50 mb-1 block">Customer Name *</label>
            <input value={form.customer_name} onChange={e=>set('customer_name',e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20" placeholder="Full name"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-white/50 mb-1 block">Phone</label>
              <input value={form.customer_phone} onChange={e=>set('customer_phone',e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20" placeholder="07..."/></div>
            <div><label className="text-xs text-white/50 mb-1 block">Email</label>
              <input value={form.customer_email} onChange={e=>set('customer_email',e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20" placeholder="email@..."/></div>
          </div>
          <div><label className="text-xs text-white/50 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none placeholder:text-white/20" placeholder="Optional notes..."/></div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Cancel</button>
          <button onClick={handle} disabled={!form.customer_name.trim()||mut.isPending}
            className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-40">
            {mut.isPending&&<Loader2 size={14} className="animate-spin"/>}Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Record Payment Modal ────────────────────────────────────
function PaymentModal({ account, onClose }:{ account:LoanAccount; onClose:()=>void }) {
  const mut = useLoanMutation();
  const [form,setForm]=useState({amount:String(account.balance>0?account.balance:''),payment_method:'cash',payment_reference:'',notes:''});
  const set=(k:string,v:string)=>setForm(f=>({...f,[k]:v}));
  const handle=async()=>{
    if(!form.amount||parseFloat(form.amount)<=0) return;
    await mut.mutateAsync({action:'record_payment',loan_id:account.loan_id,...form,amount:parseFloat(form.amount)});
    onClose();
  };
  const payMethods=[{id:'cash',label:'Cash',icon:<Banknote size={15}/>},{id:'momo',label:'MoMo',icon:<Smartphone size={15}/>},{id:'pos',label:'POS',icon:<CreditCard size={15}/>}] as const;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div><h2 className="text-white font-semibold">Record Payment</h2>
            <p className="text-xs text-white/40">{account.customer_name} · Balance: {fmt(account.balance)}</p></div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="text-xs text-white/50 mb-1 block">Amount (RWF)</label>
            <input type="number" value={form.amount} onChange={e=>set('amount',e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"/></div>
          <div><label className="text-xs text-white/50 mb-2 block">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {payMethods.map(m=>(
                <button key={m.id} onClick={()=>set('payment_method',m.id)}
                  className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-sm transition ${form.payment_method===m.id?'bg-indigo-500/20 border-indigo-500 text-indigo-300':'bg-white/5 border-white/10 text-white/50 hover:border-white/20'}`}>
                  {m.icon}{m.label}
                </button>
              ))}
            </div>
          </div>
          {form.payment_method!=='cash'&&<div><label className="text-xs text-white/50 mb-1 block">Reference</label>
            <input value={form.payment_reference} onChange={e=>set('payment_reference',e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20" placeholder="Transaction ID..."/></div>}
          <div><label className="text-xs text-white/50 mb-1 block">Notes</label>
            <input value={form.notes} onChange={e=>set('notes',e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20" placeholder="Optional..."/></div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Cancel</button>
          <button onClick={handle} disabled={mut.isPending||!form.amount}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-40">
            {mut.isPending&&<Loader2 size={14} className="animate-spin"/>}Record Payment
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Account Detail ──────────────────────────────────────────
function AccountDetail({ accountId, onBack }:{ accountId:number; onBack:()=>void }) {
  const { data, isLoading } = useDetail(accountId);
  const mut = useLoanMutation();
  const [showPayment, setShowPayment] = useState(false);

  const account  = data?.account;
  const sales    = data?.sales??[];
  const payments = data?.payments??[];

  if (isLoading) return <div className="p-6"><Skeleton count={8} height={24} baseColor="#1f2937" highlightColor="#374151" className="mb-2"/></div>;
  if (!account)  return null;

  const balance     = account.balance??((account.total_debt)-(account.total_paid));
  const pct         = account.total_debt>0?Math.min(100,(account.total_paid/account.total_debt)*100):0;
  const isSettled   = account.status==='settled'||balance<=0;
  const STATUS_COLORS:Record<string,string> = { active:'bg-amber-500/15 text-amber-400', settled:'bg-emerald-500/15 text-emerald-400', suspended:'bg-red-500/15 text-red-400' };

  return (
    <div className="min-h-screen p-6" style={{background:'linear-gradient(135deg,#0d1020 0%,#141827 60%,#0f1628 100%)'}}>
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-5 transition"><ArrowLeft size={16}/> Back to accounts</button>

        {/* Header card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">{account.customer_name}</h2>
              <p className="text-white/40 text-sm font-mono mt-0.5">{account.account_ref}</p>
              <div className="flex items-center gap-4 mt-2">
                {account.customer_phone&&<span className="flex items-center gap-1.5 text-sm text-white/50"><Phone size={12}/>{account.customer_phone}</span>}
                {account.customer_email&&<span className="text-sm text-white/50">{account.customer_email}</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-3 py-1 rounded-full capitalize ${STATUS_COLORS[account.status]??'bg-white/10 text-white/40'}`}>{account.status}</span>
              {!isSettled&&(
                <button onClick={()=>setShowPayment(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 rounded-xl text-white text-sm font-medium transition">
                  <Plus size={14}/> Record Payment
                </button>
              )}
              {account.status==='active'&&isSettled&&(
                <button onClick={()=>mut.mutate({action:'update_status',loan_id:account.loan_id,status:'settled'})} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white/60 text-sm hover:bg-white/10 transition">Mark Settled</button>
              )}
            </div>
          </div>

          {/* Debt progress */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div><p className="text-xs text-white/40 mb-1">Total Debt</p><p className="text-xl font-bold text-red-400">{fmt(account.total_debt)}</p></div>
            <div><p className="text-xs text-white/40 mb-1">Total Paid</p><p className="text-xl font-bold text-emerald-400">{fmt(account.total_paid)}</p></div>
            <div><p className="text-xs text-white/40 mb-1">Remaining Balance</p><p className={`text-xl font-bold ${balance<=0?'text-emerald-400':'text-amber-400'}`}>{fmt(Math.max(0,balance))}</p></div>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${isSettled?'bg-emerald-500':'bg-amber-500'}`} style={{width:`${pct}%`}}/>
          </div>
          <p className="text-xs text-white/30 mt-1">{pct.toFixed(0)}% repaid</p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Sales attached */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
              <ShoppingBag size={13} className="text-white/40"/>
              <h3 className="text-sm font-medium text-white">Attached Sales ({sales.length})</h3>
            </div>
            <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
              {sales.length===0?(
                <div className="py-10 text-center text-white/30 text-sm">No sales yet</div>
              ):sales.map(s=>(
                <div key={s.sale_id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white font-mono">{s.sale_ref}</p>
                    <p className="text-xs text-white/40">{new Date(s.created_at).toLocaleString()}</p>
                    {(s.firstname||s.lastname)&&<p className="text-xs text-white/30">Sold by: {s.firstname} {s.lastname}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-indigo-300">{fmt(s.total_amount)}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${s.status==='loan'?'bg-amber-500/15 text-amber-400':'bg-emerald-500/15 text-emerald-400'}`}>{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
            {sales.length>0&&(
              <div className="px-5 py-3 border-t border-white/10 flex justify-between">
                <span className="text-xs text-white/40">Total from sales</span>
                <span className="text-sm font-bold text-white">{fmt(sales.reduce((s,x)=>s+Number(x.total_amount),0))}</span>
              </div>
            )}
          </div>

          {/* Payment history */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
              <CheckCircle size={13} className="text-emerald-400"/>
              <h3 className="text-sm font-medium text-white">Payment History ({payments.length})</h3>
            </div>
            <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
              {payments.length===0?(
                <div className="py-10 text-center text-white/30 text-sm">No payments received yet</div>
              ):payments.map(p=>(
                <div key={p.payment_id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-emerald-400">+{fmt(p.amount)}</p>
                    <p className="text-xs text-white/40">{new Date(p.created_at).toLocaleString()}</p>
                    {(p.firstname||p.lastname)&&<p className="text-xs text-white/30">Received by: {p.firstname} {p.lastname}</p>}
                    {p.payment_reference&&<p className="text-xs text-white/30">Ref: {p.payment_reference}</p>}
                    {p.notes&&<p className="text-xs text-white/20 italic">{p.notes}</p>}
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-white/10 text-white/50 rounded-full capitalize">{p.payment_method}</span>
                </div>
              ))}
            </div>
            {payments.length>0&&(
              <div className="px-5 py-3 border-t border-white/10 flex justify-between">
                <span className="text-xs text-white/40">Total payments</span>
                <span className="text-sm font-bold text-emerald-400">{fmt(payments.reduce((s,p)=>s+Number(p.amount),0))}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {showPayment&&account&&<PaymentModal account={{...account,balance:Math.max(0,balance)}} onClose={()=>setShowPayment(false)}/>}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function LoanAccountsPage() {
  const { data, isLoading } = useAccounts();
  const accounts = (data?.accounts??[]) as LoanAccount[];
  const [showCreate, setShowCreate] = useState(false);
  const [search,     setSearch]     = useState('');
  const [detailId,   setDetailId]   = useState<number|null>(null);

  if (detailId) return <AccountDetail accountId={detailId} onBack={()=>setDetailId(null)}/>;

  const filtered = accounts.filter(a=>
    !search||a.customer_name.toLowerCase().includes(search.toLowerCase())||a.customer_phone?.includes(search)||a.account_ref.includes(search)
  );
  const totalDebt = accounts.reduce((s,a)=>s+Number(a.total_debt),0);
  const totalPaid = accounts.reduce((s,a)=>s+Number(a.total_paid),0);
  const totalBalance = totalDebt - totalPaid;
  const STATUS_COLORS:Record<string,string> = { active:'bg-amber-500/15 text-amber-400 border-amber-500/20', settled:'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', suspended:'bg-red-500/15 text-red-400 border-red-500/20' };

  return (
    <div className="min-h-screen p-6" style={{background:'linear-gradient(135deg,#0d1020 0%,#141827 60%,#0f1628 100%)'}}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Loan Accounts</h1>
            <p className="text-white/40 text-sm mt-0.5">Track customer credit and debt repayment</p></div>
          <button onClick={()=>setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-white text-sm font-medium shadow-lg shadow-indigo-500/20 transition">
            <Plus size={16}/> New Account
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            {label:'Accounts',value:accounts.length,color:'text-white'},
            {label:'Total Owed',value:fmt(totalDebt),color:'text-red-400'},
            {label:'Total Received',value:fmt(totalPaid),color:'text-emerald-400'},
            {label:'Outstanding',value:fmt(totalBalance),color:'text-amber-400'},
          ].map(s=>(
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/30"
            placeholder="Search by name, phone, ref..."/>
        </div>

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-white/10">
              {['Account','Phone','Total Debt','Paid','Balance','Sales','Status',''].map(h=>(
                <th key={h} className="px-5 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {isLoading?Array(5).fill(0).map((_,i)=>(
                <tr key={i} className="border-b border-white/5">
                  {Array(8).fill(0).map((_,j)=><td key={j} className="px-5 py-4"><Skeleton height={16} baseColor="#1f2937" highlightColor="#374151"/></td>)}
                </tr>
              )):filtered.length===0?(
                <tr><td colSpan={8} className="px-5 py-16 text-center">
                  <User size={28} className="mx-auto mb-3 text-white/20"/>
                  <p className="text-white/30 text-sm">{search?'No accounts match your search':'No loan accounts yet'}</p>
                </td></tr>
              ):filtered.map(a=>{
                const balance = Number(a.total_debt)-Number(a.total_paid);
                const pct     = a.total_debt>0?Math.min(100,(a.total_paid/a.total_debt)*100):0;
                return (
                  <tr key={a.loan_id} className="border-b border-white/5 hover:bg-white/3 transition group cursor-pointer" onClick={()=>setDetailId(a.loan_id)}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-white">{a.customer_name}</p>
                      <p className="text-xs text-white/30 font-mono">{a.account_ref}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-white/60">{a.customer_phone||'—'}</td>
                    <td className="px-5 py-4 text-sm font-medium text-red-400">{fmt(a.total_debt)}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-emerald-400">{fmt(a.total_paid)}</p>
                      <div className="w-16 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{width:`${pct}%`}}/>
                      </div>
                    </td>
                    <td className="px-5 py-4"><span className={`text-sm font-bold ${balance<=0?'text-emerald-400':'text-amber-400'}`}>{fmt(Math.max(0,balance))}</span></td>
                    <td className="px-5 py-4 text-sm text-white/50">{a.sale_count}</td>
                    <td className="px-5 py-4"><span className={`text-xs px-2.5 py-1 rounded-full border capitalize ${STATUS_COLORS[a.status]??'bg-white/10 text-white/40 border-white/10'}`}>{a.status}</span></td>
                    <td className="px-5 py-4"><ChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition"/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {showCreate&&<CreateModal onClose={()=>setShowCreate(false)}/>}
    </div>
  );
}
