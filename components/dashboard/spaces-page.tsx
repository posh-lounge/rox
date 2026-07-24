"use client";
import React, { useState } from "react";
import {
  Plus, X, Loader2, AlertTriangle, Bell, Calendar,
  Phone, User, DollarSign, ChevronDown, Banknote,
  Smartphone, CreditCard, ArrowLeft, History,
  CheckCircle, XCircle, Clock, Home,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api/v1/fetchApi";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface Space { space_id:number;space_name:string;space_type:string;floor:string;price_per_period:number;billing_period:string;status:string;description:string;occupancy_id?:number;tenant_name?:string;tenant_phone?:string;tenant_email?:string;start_date?:string;next_payment_date?:string;agreed_price?:number;days_until_payment?:number;is_overdue?:number;total_occupancies?:number;total_collected?:number; }
interface Occupancy { occupancy_id:number;tenant_name:string;tenant_phone:string;tenant_email:string;start_date:string;end_date:string;agreed_price:number;billing_period:string;status:string;next_payment_date:string;created_at:string; }
interface SpacePayment { payment_id:number;amount:number;payment_method:string;payment_reference:string;period_covered_from:string;period_covered_to:string;tenant_name:string;created_at:string;firstname:string;lastname:string; }

const fmt = (n:number)=>`${Number(n).toLocaleString()} RWF`;
const BILLING_PERIODS = ['daily','weekly','monthly','yearly'];
const PAY_METHODS = [{id:'cash',label:'Cash',icon:<Banknote size={15}/>},{id:'momo',label:'MoMo',icon:<Smartphone size={15}/>},{id:'pos',label:'POS',icon:<CreditCard size={15}/>}] as const;
const STATUS_CARD:Record<string,string> = { available:'border-emerald-500/20 bg-emerald-500/5', occupied:'border-indigo-500/20 bg-indigo-500/5', maintenance:'border-amber-500/20 bg-amber-500/5' };
const STATUS_BADGE:Record<string,string> = { available:'bg-emerald-500/15 text-emerald-400', occupied:'bg-indigo-500/15 text-indigo-400', maintenance:'bg-amber-500/15 text-amber-400' };
const OCC_BADGE:Record<string,string> = { active:'bg-indigo-500/15 text-indigo-400', ended:'bg-white/10 text-white/50', evicted:'bg-red-500/15 text-red-400' };

const useSpaces   = (status?:string) => useQuery({ queryKey:['spaces',status], queryFn:()=>apiPost<{spaces:Space[]}>('/api/main/dashboard/fetch/fetch-spaces',{status}), refetchInterval:15000 });
const useSpaceDetail = (id:number|null) => useQuery({ queryKey:['space-detail',id], enabled:!!id, queryFn:()=>apiPost<{space:Space;current_occupancy:Occupancy|null;history:Occupancy[];payments:SpacePayment[]}>('/api/main/dashboard/fetch/fetch-spaces',{view:'detail',space_id:id}) });
const useSpaceMut = () => { const qc=useQueryClient(); return useMutation({ mutationFn:(d:Record<string,unknown>)=>apiPost('/api/main/dashboard/create/'+((d._endpoint as string)||'add-space'),{...d,_endpoint:undefined}), onSuccess:()=>{ qc.invalidateQueries({queryKey:['spaces']}); qc.invalidateQueries({queryKey:['space-detail']}); } }); };

// ─── Add Space Modal ─────────────────────────────────────────
function AddSpaceModal({ onClose }:{ onClose:()=>void }) {
  const [form,setForm]=useState({space_name:'',space_type:'Room',floor:'',price_per_period:'',billing_period:'monthly',description:''});
  const set=(k:string,v:string)=>setForm(f=>({...f,[k]:v}));
  const mut=useSpaceMut();
  const handle=async()=>{ if(!form.space_name||!form.price_per_period) return; await apiPost('/api/main/dashboard/create/add-space',{...form,price_per_period:+form.price_per_period}); mut.mutate({} as any); onClose(); };
  // Actually use a direct mutation
  const qc=useQueryClient();
  const directMut=useMutation({mutationFn:(d:Record<string,unknown>)=>apiPost('/api/main/dashboard/create/add-space',d),onSuccess:()=>{qc.invalidateQueries({queryKey:['spaces']});}});
  const realHandle=async()=>{ if(!form.space_name||!form.price_per_period) return; await directMut.mutateAsync({...form,price_per_period:+form.price_per_period}); onClose(); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold">Add New Space</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-white/50 mb-1 block">Space Name *</label>
              <input value={form.space_name} onChange={e=>set('space_name',e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20" placeholder="e.g. Room 101"/></div>
            <div><label className="text-xs text-white/50 mb-1 block">Type</label>
              <input value={form.space_type} onChange={e=>set('space_type',e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20" placeholder="Room / Office / Shop"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-white/50 mb-1 block">Floor</label>
              <input value={form.floor} onChange={e=>set('floor',e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20" placeholder="Ground / 1st..."/></div>
            <div><label className="text-xs text-white/50 mb-1 block">Billing Period</label>
              <div className="relative">
                <select value={form.billing_period} onChange={e=>set('billing_period',e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none capitalize">
                  {BILLING_PERIODS.map(b=><option key={b} value={b} className="bg-gray-900 capitalize">{b}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"/>
              </div>
            </div>
          </div>
          <div><label className="text-xs text-white/50 mb-1 block">Price per Period (RWF) *</label>
            <input type="number" value={form.price_per_period} onChange={e=>set('price_per_period',e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"/></div>
          <div><label className="text-xs text-white/50 mb-1 block">Description</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none placeholder:text-white/20" placeholder="Optional..."/></div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Cancel</button>
          <button onClick={realHandle} disabled={directMut.isPending} className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50">
            {directMut.isPending&&<Loader2 size={14} className="animate-spin"/>}Add Space
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Occupy Modal ─────────────────────────────────────────────
function OccupyModal({ space, onClose }:{ space:Space; onClose:()=>void }) {
  const qc=useQueryClient();
  const [form,setForm]=useState({tenant_name:'',tenant_phone:'',tenant_email:'',tenant_id_number:'',start_date:new Date().toISOString().split('T')[0],agreed_price:space.price_per_period?.toString()??'',billing_period:space.billing_period??'monthly',payment_method:'cash' as 'cash'|'momo'|'pos',payment_reference:'',notes:''});
  const set=(k:string,v:string)=>setForm(f=>({...f,[k]:v}));
  const mut=useMutation({mutationFn:(d:Record<string,unknown>)=>apiPost('/api/main/dashboard/create/add-occupancy',d),onSuccess:()=>{qc.invalidateQueries({queryKey:['spaces']});qc.invalidateQueries({queryKey:['space-detail']});}});
  const handle=async()=>{ if(!form.tenant_name||!form.agreed_price) return; await mut.mutateAsync({space_id:space.space_id,...form,agreed_price:+form.agreed_price}); onClose(); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div><h2 className="text-white font-semibold">Occupy {space.space_name}</h2><p className="text-xs text-white/40">{space.space_type}{space.floor?` · ${space.floor}`:''}</p></div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-white/50 mb-1 block">Tenant Name *</label><input value={form.tenant_name} onChange={e=>set('tenant_name',e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20" placeholder="Full name"/></div>
            <div><label className="text-xs text-white/50 mb-1 block">Phone</label><input value={form.tenant_phone} onChange={e=>set('tenant_phone',e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20" placeholder="07..."/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-white/50 mb-1 block">Email</label><input value={form.tenant_email} onChange={e=>set('tenant_email',e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20" placeholder="email@..."/></div>
            <div><label className="text-xs text-white/50 mb-1 block">National ID</label><input value={form.tenant_id_number} onChange={e=>set('tenant_id_number',e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20" placeholder="ID number"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-white/50 mb-1 block">Start Date</label><input type="date" value={form.start_date} onChange={e=>set('start_date',e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"/></div>
            <div><label className="text-xs text-white/50 mb-1 block">Billing Period</label>
              <div className="relative"><select value={form.billing_period} onChange={e=>set('billing_period',e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none capitalize">{BILLING_PERIODS.map(b=><option key={b} value={b} className="bg-gray-900 capitalize">{b}</option>)}</select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"/></div>
            </div>
          </div>
          <div><label className="text-xs text-white/50 mb-1 block">Agreed Price (RWF) *</label><input type="number" value={form.agreed_price} onChange={e=>set('agreed_price',e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"/></div>
          <div><label className="text-xs text-white/50 mb-2 block">Initial Payment Method</label>
            <div className="grid grid-cols-3 gap-2">{PAY_METHODS.map(m=><button key={m.id} onClick={()=>set('payment_method',m.id)} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm transition ${form.payment_method===m.id?'bg-indigo-500/20 border-indigo-500 text-indigo-300':'bg-white/5 border-white/10 text-white/50 hover:border-white/20'}`}>{m.icon}{m.label}</button>)}</div>
          </div>
          {form.payment_method!=='cash'&&<div><label className="text-xs text-white/50 mb-1 block">Payment Reference</label><input value={form.payment_reference} onChange={e=>set('payment_reference',e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20" placeholder="Transaction ID..."/></div>}
        </div>
        <div className="flex gap-3 px-6 pb-6 border-t border-white/10 pt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Cancel</button>
          <button onClick={handle} disabled={mut.isPending} className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50">
            {mut.isPending&&<Loader2 size={14} className="animate-spin"/>}Confirm Occupancy
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── Payment Modal (fixed) ───────────────────────────────────
function PaymentModal({
  space,
  occupancyId,
  onClose,
}: {
  space: Space;
  occupancyId?: number;   // <-- explicitly passed from current occupancy
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    amount: space.agreed_price?.toString() ?? "",
    payment_method: "cash" as "cash" | "momo" | "pos",
    payment_reference: "",
    period_covered_from: new Date().toISOString().split("T")[0],
    period_covered_to: "",
    notes: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mut = useMutation({
    mutationFn: (d: Record<string, unknown>) =>
      apiPost("/api/main/dashboard/create/add-space-payment", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spaces"] });
      qc.invalidateQueries({ queryKey: ["space-detail"] });
    },
  });

  const handle = async () => {
    if (!form.amount || !form.period_covered_to) return;
    // Use the passed occupancyId, fallback to space.occupancy_id (just in case)
    const occId = occupancyId ?? space.occupancy_id;
    if (!occId) {
      alert("No active occupancy found for this space.");
      return;
    }
    await mut.mutateAsync({
      space_id: space.space_id,
      occupancy_id: occId,
      ...form,
      amount: +form.amount,
    });
    onClose();
  };

  const isOverdue = space.is_overdue === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-white font-semibold">Record Payment</h2>
            <p className="text-xs text-white/40">
              {space.space_name} · {space.tenant_name}
              {isOverdue && <span className="text-red-400 ml-1">· Overdue</span>}
            </p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Amount (RWF)</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Period From</label>
              <input
                type="date"
                value={form.period_covered_from}
                onChange={(e) => set("period_covered_from", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Period To</label>
              <input
                type="date"
                value={form.period_covered_to}
                onChange={(e) => set("period_covered_to", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-2 block">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {PAY_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => set("payment_method", m.id)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm transition ${
                    form.payment_method === m.id
                      ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                      : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                  }`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          {form.payment_method !== "cash" && (
            <div>
              <label className="text-xs text-white/50 mb-1 block">Reference</label>
              <input
                value={form.payment_reference}
                onChange={(e) => set("payment_reference", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
                placeholder="Transaction ID..."
              />
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={mut.isPending || !form.period_covered_to}
            className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {mut.isPending && <Loader2 size={14} className="animate-spin" />}
            Record Payment
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── End Occupancy Confirmation ──────────────────────────────
function EndOccupancyModal({ space, onClose }:{ space:Space; onClose:()=>void }) {
  const qc=useQueryClient();
  const [reason,setReason]=useState<'ended'|'evicted'>('ended');
  const [endDate,setEndDate]=useState(new Date().toISOString().split('T')[0]);
  const mut=useMutation({mutationFn:(d:Record<string,unknown>)=>apiPost('/api/main/dashboard/update/end-occupancy',d),onSuccess:()=>{qc.invalidateQueries({queryKey:['spaces']});qc.invalidateQueries({queryKey:['space-detail']});}});
  const handle=async()=>{ await mut.mutateAsync({occupancy_id:space.occupancy_id,end_date:endDate,reason}); onClose(); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold">End Occupancy</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <p className="text-amber-300 text-sm font-medium">{space.space_name}</p>
            <p className="text-amber-300/70 text-xs mt-0.5">Tenant: {space.tenant_name}</p>
          </div>
          <div><label className="text-xs text-white/50 mb-1 block">End Date</label><input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"/></div>
          <div><label className="text-xs text-white/50 mb-2 block">Reason</label>
            <div className="grid grid-cols-2 gap-2">
              {[{v:'ended' as const,l:'Naturally Ended'},{v:'evicted' as const,l:'Evicted'}].map(r=>(
                <button key={r.v} onClick={()=>setReason(r.v)} className={`py-2.5 rounded-xl border text-sm transition ${reason===r.v?'bg-indigo-500/20 border-indigo-500 text-indigo-300':'bg-white/5 border-white/10 text-white/50 hover:border-white/20'}`}>{r.l}</button>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/30">The space will be marked as <span className="text-emerald-400">available</span> and can be re-occupied.</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Cancel</button>
          <button onClick={handle} disabled={mut.isPending} className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 ${reason==='evicted'?'bg-red-500 hover:bg-red-400':'bg-amber-500 hover:bg-amber-400'}`}>
            {mut.isPending&&<Loader2 size={14} className="animate-spin"/>}End Occupancy
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Space Detail View ───────────────────────────────────────
function SpaceDetailView({ spaceId, onBack }:{ spaceId:number; onBack:()=>void }) {
  const { data, isLoading } = useSpaceDetail(spaceId);
  const [modal, setModal]   = useState<'occupy'|'payment'|'end'|null>(null);

  const space   = data?.space;
  const current = data?.current_occupancy;
  const history = data?.history??[];
  const payments= data?.payments??[];

  if (isLoading) return <div className="min-h-screen p-6" style={{background:'linear-gradient(135deg,#0d1020 0%,#141827 60%,#0f1628 100%)'}}><div className="max-w-4xl mx-auto"><Skeleton count={8} height={32} baseColor="#1f2937" highlightColor="#374151" className="mb-2"/></div></div>;
  if (!space)    return null;

  const isOverdue = current && new Date(current.next_payment_date) < new Date();

  return (
    <div className="min-h-screen p-6" style={{background:'linear-gradient(135deg,#0d1020 0%,#141827 60%,#0f1628 100%)'}}>
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-5 transition"><ArrowLeft size={16}/> Back to spaces</button>

        {/* Space header */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{space.space_name}</h2>
              <p className="text-white/40 text-sm mt-0.5">{space.space_type}{space.floor?` · Floor: ${space.floor}`:''}</p>
              <div className="flex items-center gap-4 mt-3">
                <div><p className="text-xs text-white/40">Base Price</p><p className="text-sm font-medium text-white">{fmt(space.price_per_period)} / {space.billing_period}</p></div>
                <div><p className="text-xs text-white/40">Total Collected</p><p className="text-sm font-medium text-emerald-400">{fmt(space.total_collected??0)}</p></div>
                <div><p className="text-xs text-white/40">Total Occupancies</p><p className="text-sm font-medium text-white">{space.total_occupancies??0}</p></div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-sm px-3 py-1.5 rounded-full capitalize ${STATUS_BADGE[space.status]??'bg-white/10 text-white/40'}`}>{space.status}</span>
              <div className="flex gap-2">
                {space.status==='available'&&<button onClick={()=>setModal('occupy')} className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-white text-xs font-medium transition">+ Occupy</button>}
                {space.status==='occupied'&&current&&(
                  <>
                    <button onClick={()=>setModal('payment')} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${isOverdue?'bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30':'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'}`}>Record Payment</button>
                    <button onClick={()=>setModal('end')} className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 rounded-xl text-xs font-medium transition">End Occupancy</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Current tenant */}
        {current&&(
          <div className={`bg-white/5 border rounded-2xl p-5 mb-5 ${isOverdue?'border-red-500/30':'border-indigo-500/20'}`}>
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><User size={14} className="text-indigo-400"/> Current Tenant</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[{l:'Name',v:current.tenant_name},{l:'Phone',v:current.tenant_phone||'—'},{l:'Email',v:current.tenant_email||'—'},{l:'Move-in Date',v:current.start_date},{l:'Agreed Price',v:fmt(current.agreed_price)},{l:'Billing',v:current.billing_period},{l:'Next Payment',v:current.next_payment_date},{l:'Status',v:isOverdue?'⚠ Overdue':'On track'}].map(f=>(
                <div key={f.l}><p className="text-xs text-white/40">{f.l}</p><p className={`text-sm font-medium mt-0.5 ${f.l==='Status'&&isOverdue?'text-red-400':'text-white'}`}>{f.v}</p></div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-5">
          {/* Occupancy history */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2"><History size={13} className="text-white/40"/><h3 className="text-sm font-medium text-white">Occupancy History ({history.length})</h3></div>
            <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
              {history.length===0?<div className="py-10 text-center text-white/30 text-sm">No history yet</div>:
              history.map(h=>(
                <div key={h.occupancy_id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-white">{h.tenant_name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${OCC_BADGE[h.status]??'bg-white/10 text-white/40'}`}>{h.status}</span>
                  </div>
                  <p className="text-xs text-white/40">{h.start_date} → {h.end_date??'Present'}</p>
                  <p className="text-xs text-indigo-300 mt-0.5">{fmt(h.agreed_price)} / {h.billing_period}</p>
                  {h.tenant_phone&&<p className="text-xs text-white/30">{h.tenant_phone}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Payment history */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2"><CheckCircle size={13} className="text-emerald-400"/><h3 className="text-sm font-medium text-white">Payments ({payments.length})</h3></div>
              {payments.length>0&&<span className="text-xs text-emerald-400 font-medium">{fmt(payments.reduce((s,p)=>s+Number(p.amount),0))} total</span>}
            </div>
            <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
              {payments.length===0?<div className="py-10 text-center text-white/30 text-sm">No payments yet</div>:
              payments.map(p=>(
                <div key={p.payment_id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-emerald-400">{fmt(p.amount)}</p>
                    <p className="text-xs text-white/40">{p.tenant_name}</p>
                    <p className="text-xs text-white/30">{p.period_covered_from} → {p.period_covered_to}</p>
                    {(p.firstname||p.lastname)&&<p className="text-xs text-white/25">Received by: {p.firstname} {p.lastname}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-0.5 bg-white/10 text-white/50 rounded-full capitalize">{p.payment_method}</span>
                    <p className="text-xs text-white/30 mt-1">{new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {modal==='occupy'   &&space&&<OccupyModal   space={space} onClose={()=>setModal(null)}/>}
      {modal === "payment" && space && (
  <PaymentModal
    space={space}
    occupancyId={current?.occupancy_id}   // <-- pass the active occupancy ID
    onClose={() => setModal(null)}
  />
)}
      {modal==='end'      &&space&&<EndOccupancyModal space={space} onClose={()=>setModal(null)}/>}
    </div>
  );
}

// ─── Space Card ──────────────────────────────────────────────
function SpaceCard({ space, onClick }:{ space:Space; onClick:()=>void }) {
  const isOverdue = space.is_overdue===1;
  const isDueSoon = !isOverdue && (space.days_until_payment??99)<=7;
  return (
    <button onClick={onClick} className={`text-left p-5 rounded-2xl border transition hover:scale-[1.01] group flex flex-col gap-3 ${isOverdue?'border-red-500/30 bg-red-500/5':isDueSoon?'border-amber-500/30 bg-amber-500/5':STATUS_CARD[space.status]??'border-white/10 bg-white/5'}`}>
      <div className="flex items-start justify-between">
        <div><h3 className="text-white font-semibold group-hover:text-indigo-300 transition">{space.space_name}</h3>
          <p className="text-xs text-white/40 mt-0.5">{space.space_type}{space.floor?` · ${space.floor}`:''}</p></div>
        <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${STATUS_BADGE[space.status]??'bg-white/10 text-white/40'}`}>{space.status}</span>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-white">
        <DollarSign size={13} className="text-white/40"/>
        {fmt(space.price_per_period)}<span className="text-white/30 text-xs">/ {space.billing_period}</span>
      </div>
      {space.status==='occupied'&&space.tenant_name&&(
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1">
          <p className="text-xs text-white/70 flex items-center gap-1.5"><User size={11}/>{space.tenant_name}</p>
          {space.tenant_phone&&<p className="text-xs text-white/40 flex items-center gap-1.5"><Phone size={11}/>{space.tenant_phone}</p>}
          <p className={`text-xs flex items-center gap-1.5 ${isOverdue?'text-red-400':isDueSoon?'text-amber-400':'text-white/40'}`}>
            <Calendar size={11}/>Next: {space.next_payment_date}
            {isOverdue&&' ⚠ Overdue'}{isDueSoon&&!isOverdue&&` (${space.days_until_payment} days)`}
          </p>
        </div>
      )}
      {space.total_occupancies!==undefined&&space.total_occupancies>0&&(
        <p className="text-xs text-white/25">{space.total_occupancies} occupanc{space.total_occupancies===1?'y':'ies'} · {fmt(space.total_collected??0)} collected</p>
      )}
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function SpacesPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [modal,        setModal]        = useState<'add'|null>(null);
  const [detailId,     setDetailId]     = useState<number|null>(null);

  const { data, isLoading } = useSpaces(statusFilter||undefined);
  const spaces = (data?.spaces??[]) as Space[];

  if (detailId) return <SpaceDetailView spaceId={detailId} onBack={()=>setDetailId(null)}/>;

  const counts = { available:0, occupied:0, maintenance:0 };
  spaces.forEach(s=>{ if(s.status in counts) counts[s.status as keyof typeof counts]++; });
  const overdue  = spaces.filter(s=>s.is_overdue===1).length;
  const dueSoon  = spaces.filter(s=>s.is_overdue!==1&&(s.days_until_payment??99)<=7).length;

  return (
    <div className="min-h-screen p-6" style={{background:'linear-gradient(135deg,#0d1020 0%,#141827 60%,#0f1628 100%)'}}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Spaces</h1><p className="text-white/40 text-sm mt-0.5">Click any space to view history, payments and manage occupancy</p></div>
          <button onClick={()=>setModal('add')} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-white text-sm font-medium shadow-lg shadow-indigo-500/20 transition"><Plus size={16}/> Add Space</button>
        </div>
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[{l:'Total',v:spaces.length,c:'text-white'},{l:'Available',v:counts.available,c:'text-emerald-400'},{l:'Occupied',v:counts.occupied,c:'text-indigo-400'},{l:'Overdue',v:overdue,c:'text-red-400'},{l:'Due Soon',v:dueSoon,c:'text-amber-400'}].map(s=>(
            <div key={s.l} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3"><p className={`text-xl font-bold ${s.c}`}>{s.v}</p><p className="text-xs text-white/40 mt-0.5">{s.l}</p></div>
          ))}
        </div>
        <div className="flex gap-2 mb-6">
          {[{v:'',l:'All'},{v:'available',l:'Available'},{v:'occupied',l:'Occupied'},{v:'maintenance',l:'Maintenance'}].map(t=>(
            <button key={t.v} onClick={()=>setStatusFilter(t.v)} className={`px-4 py-1.5 rounded-xl text-sm transition ${statusFilter===t.v?'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300':'bg-white/5 border border-white/10 text-white/50 hover:border-white/20'}`}>{t.l}</button>
          ))}
        </div>
        {isLoading?(
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_,i)=><div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5"><Skeleton count={4} height={14} baseColor="#1f2937" highlightColor="#374151"/></div>)}
          </div>
        ):spaces.length===0?(
          <div className="py-20 text-center"><Home size={32} className="mx-auto mb-3 text-white/20"/><p className="text-white/40 text-sm">No spaces found.</p></div>
        ):(
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {spaces.map(s=><SpaceCard key={s.space_id} space={s} onClick={()=>setDetailId(s.space_id)}/>)}
          </div>
        )}
      </div>
      {modal==='add'&&<AddSpaceModal onClose={()=>setModal(null)}/>}
    </div>
  );
}
