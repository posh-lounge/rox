"use client";
import React, { useState } from "react";
import {
  Plus, X, Loader2, Home, AlertTriangle, Bell, CheckCircle,
  Calendar, Phone, User, DollarSign, ChevronDown, Banknote, Smartphone, CreditCard,
} from "lucide-react";
import { useSpaces, useAddSpace, useAddOccupancy, useAddSpacePayment, Space } from "@/lib/api/v1/hooks";
import Skeleton from "react-loading-skeleton";

const STATUS_COLORS: Record<string, string> = {
  available:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  occupied:    "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  maintenance: "bg-amber-500/15 text-amber-400 border-amber-500/20",
};

const BILLING_PERIODS = ["daily", "weekly", "monthly", "yearly"];
const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", icon: <Banknote size={15} /> },
  { id: "momo", label: "MoMo", icon: <Smartphone size={15} /> },
  { id: "pos",  label: "POS",  icon: <CreditCard size={15} /> },
] as const;

// ─── Add Space Modal ─────────────────────────────────────────
function AddSpaceModal({ onClose }: { onClose: () => void }) {
  const addSpace = useAddSpace();
  const [form, setForm] = useState({ space_name: "", space_type: "Room", floor: "", price_per_period: "", billing_period: "monthly", description: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async () => {
    if (!form.space_name || !form.price_per_period) return;
    await addSpace.mutateAsync({ ...form, price_per_period: +form.price_per_period } as any);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold">Add New Space</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Space Name *</label>
              <input value={form.space_name} onChange={e => set("space_name", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
                placeholder="e.g. Room 101" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Type</label>
              <input value={form.space_type} onChange={e => set("space_type", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
                placeholder="Room / Office / Shop" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Floor</label>
              <input value={form.floor} onChange={e => set("floor", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
                placeholder="Ground / 1st / 2nd" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Billing Period</label>
              <div className="relative">
                <select value={form.billing_period} onChange={e => set("billing_period", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none capitalize">
                  {BILLING_PERIODS.map(b => <option key={b} value={b} className="bg-gray-900 capitalize">{b}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Price per Period (RWF) *</label>
            <input type="number" value={form.price_per_period} onChange={e => set("price_per_period", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="0" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none placeholder:text-white/20"
              placeholder="Optional description..." />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Cancel</button>
          <button onClick={handleSubmit} disabled={addSpace.isPending}
            className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50">
            {addSpace.isPending && <Loader2 size={14} className="animate-spin" />} Add Space
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Occupy Space Modal ──────────────────────────────────────
function OccupyModal({ space, onClose }: { space: Space; onClose: () => void }) {
  const addOccupancy = useAddOccupancy();
  const [form, setForm] = useState({
    tenant_name: "", tenant_phone: "", tenant_email: "", tenant_id_number: "",
    start_date: new Date().toISOString().split("T")[0],
    agreed_price: space.price_per_period?.toString() ?? "",
    billing_period: space.billing_period ?? "monthly",
    payment_method: "cash" as "cash" | "momo" | "pos",
    payment_reference: "", notes: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async () => {
    if (!form.tenant_name || !form.agreed_price) return;
    await addOccupancy.mutateAsync({ space_id: space.space_id, ...form, agreed_price: +form.agreed_price });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-white font-semibold">Occupy {space.space_name}</h2>
            <p className="text-xs text-white/40">{space.space_type} · {space.floor}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Tenant Name *</label>
              <input value={form.tenant_name} onChange={e => set("tenant_name", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
                placeholder="Full name" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Phone</label>
              <input value={form.tenant_phone} onChange={e => set("tenant_phone", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
                placeholder="07..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Email</label>
              <input value={form.tenant_email} onChange={e => set("tenant_email", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
                placeholder="email@..." />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">National ID / Passport</label>
              <input value={form.tenant_id_number} onChange={e => set("tenant_id_number", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
                placeholder="ID number" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Billing Period</label>
              <div className="relative">
                <select value={form.billing_period} onChange={e => set("billing_period", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none capitalize">
                  {BILLING_PERIODS.map(b => <option key={b} value={b} className="bg-gray-900 capitalize">{b}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Agreed Price (RWF) *</label>
            <input type="number" value={form.agreed_price} onChange={e => set("agreed_price", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-2 block">Initial Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(m => (
                <button key={m.id} onClick={() => set("payment_method", m.id)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm transition ${
                    form.payment_method === m.id
                      ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                      : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                  }`}>
                  {m.icon}{m.label}
                </button>
              ))}
            </div>
          </div>
          {form.payment_method !== "cash" && (
            <div>
              <label className="text-xs text-white/50 mb-1 block">Payment Reference</label>
              <input value={form.payment_reference} onChange={e => set("payment_reference", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
                placeholder="Transaction ID / receipt..." />
            </div>
          )}
          <div>
            <label className="text-xs text-white/50 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none placeholder:text-white/20"
              placeholder="Optional notes..." />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6 border-t border-white/10 pt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Cancel</button>
          <button onClick={handleSubmit} disabled={addOccupancy.isPending}
            className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50">
            {addOccupancy.isPending && <Loader2 size={14} className="animate-spin" />} Confirm Occupancy
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Space Card ──────────────────────────────────────────────
function SpaceCard({ space, onOccupy, onPayment }: { space: Space; onOccupy: () => void; onPayment: () => void }) {
  const isOverdue = space.is_overdue === 1;
  const isDueSoon = !isOverdue && (space.days_until_payment ?? 99) <= 7;

  return (
    <div className={`bg-white/5 border rounded-2xl p-5 flex flex-col gap-4 ${
      isOverdue ? "border-red-500/30" : isDueSoon ? "border-amber-500/30" : "border-white/10"
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-white font-semibold">{space.space_name}</h3>
          <p className="text-xs text-white/40 mt-0.5">{space.space_type}{space.floor ? ` · ${space.floor}` : ""}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_COLORS[space.status] ?? "bg-white/10 text-white/40"}`}>
          {space.status}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-white">
          <DollarSign size={13} className="text-white/40" />
          {Number(space.price_per_period).toLocaleString()} RWF
          <span className="text-white/30 text-xs">/ {space.billing_period}</span>
        </div>
      </div>

      {space.status === "occupied" && space.tenant_name && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <User size={13} className="text-white/40" />{space.tenant_name}
          </div>
          {space.tenant_phone && (
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Phone size={11} />{space.tenant_phone}
            </div>
          )}
          <div className={`flex items-center gap-2 text-xs ${isOverdue ? "text-red-400" : isDueSoon ? "text-amber-400" : "text-white/40"}`}>
            <Calendar size={11} />
            Next payment: {space.next_payment_date}
            {isOverdue && <AlertTriangle size={11} className="text-red-400" />}
            {isDueSoon && !isOverdue && <Bell size={11} className="text-amber-400" />}
          </div>
          {isOverdue && <p className="text-xs text-red-400 font-medium">⚠ Payment overdue!</p>}
          {isDueSoon && !isOverdue && <p className="text-xs text-amber-400">Due in {space.days_until_payment} days</p>}
        </div>
      )}

      <div className="mt-auto">
        {space.status === "available" ? (
          <button onClick={onOccupy}
            className="w-full py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm hover:bg-indigo-500/30 transition">
            + Occupy Space
          </button>
        ) : space.status === "occupied" ? (
          <button onClick={onPayment}
            className={`w-full py-2 rounded-xl text-sm transition ${
              isOverdue
                ? "bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30"
                : isDueSoon
                ? "bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30"
                : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
            }`}>
            Record Payment
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ─── Record Payment Modal ────────────────────────────────────
function PaymentModal({ space, onClose }: { space: Space; onClose: () => void }) {
  const addPayment = useAddSpacePayment();
  const [form, setForm] = useState({
    amount: space.agreed_price?.toString() ?? "",
    payment_method: "cash" as "cash" | "momo" | "pos",
    payment_reference: "",
    period_covered_from: new Date().toISOString().split("T")[0],
    period_covered_to: "",
    notes: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async () => {
    if (!form.amount || !form.period_covered_from || !form.period_covered_to) return;
    await addPayment.mutateAsync({ space_id: space.space_id, occupancy_id: space.occupancy_id, ...form, amount: +form.amount });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-white font-semibold">Record Payment</h2>
            <p className="text-xs text-white/40">{space.space_name} · {space.tenant_name}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Amount (RWF)</label>
            <input type="number" value={form.amount} onChange={e => set("amount", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Period From</label>
              <input type="date" value={form.period_covered_from} onChange={e => set("period_covered_from", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Period To</label>
              <input type="date" value={form.period_covered_to} onChange={e => set("period_covered_to", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-2 block">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(m => (
                <button key={m.id} onClick={() => set("payment_method", m.id)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm transition ${
                    form.payment_method === m.id ? "bg-indigo-500/20 border-indigo-500 text-indigo-300" : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                  }`}>{m.icon}{m.label}
                </button>
              ))}
            </div>
          </div>
          {form.payment_method !== "cash" && (
            <div>
              <label className="text-xs text-white/50 mb-1 block">Reference</label>
              <input value={form.payment_reference} onChange={e => set("payment_reference", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
                placeholder="Transaction / Receipt ID..." />
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Cancel</button>
          <button onClick={handleSubmit} disabled={addPayment.isPending}
            className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50">
            {addPayment.isPending && <Loader2 size={14} className="animate-spin" />} Record Payment
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function SpacesPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal]   = useState<"add" | "occupy" | "payment" | null>(null);
  const [selected, setSelected] = useState<Space | null>(null);

  const { data, isLoading } = useSpaces(statusFilter || undefined);
  const spaces = data?.spaces ?? [];

  const counts = { available: 0, occupied: 0, maintenance: 0 };
  spaces.forEach(s => { if (s.status in counts) counts[s.status as keyof typeof counts]++; });
  const overdue  = spaces.filter(s => s.is_overdue === 1).length;
  const dueSoon  = spaces.filter(s => s.is_overdue !== 1 && (s.days_until_payment ?? 99) <= 7).length;

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg,#0d1020 0%,#141827 60%,#0f1628 100%)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Spaces</h1>
            <p className="text-white/40 text-sm mt-0.5">Room and space management</p>
          </div>
          <button onClick={() => setModal("add")}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-white text-sm font-medium shadow-lg shadow-indigo-500/20 transition">
            <Plus size={16} /> Add Space
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total", value: spaces.length, color: "text-white" },
            { label: "Available", value: counts.available, color: "text-emerald-400" },
            { label: "Occupied", value: counts.occupied, color: "text-indigo-400" },
            { label: "Overdue", value: overdue, color: "text-red-400" },
            { label: "Due Soon", value: dueSoon, color: "text-amber-400" },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-6">
          {[{ v: "", l: "All" }, { v: "available", l: "Available" }, { v: "occupied", l: "Occupied" }, { v: "maintenance", l: "Maintenance" }].map(t => (
            <button key={t.v} onClick={() => setStatusFilter(t.v)}
              className={`px-4 py-1.5 rounded-xl text-sm transition ${
                statusFilter === t.v ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300" : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
              }`}>{t.l}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_,i) => <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5"><Skeleton count={4} height={14} baseColor="#1f2937" highlightColor="#374151" /></div>)}
          </div>
        ) : spaces.length === 0 ? (
          <div className="py-20 text-center">
            <Home size={32} className="mx-auto mb-3 text-white/20" />
            <p className="text-white/40 text-sm">No spaces found. Add your first space.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {spaces.map(s => (
              <SpaceCard key={s.space_id} space={s}
                onOccupy={() => { setSelected(s); setModal("occupy"); }}
                onPayment={() => { setSelected(s); setModal("payment"); }} />
            ))}
          </div>
        )}
      </div>

      {modal === "add"     && <AddSpaceModal onClose={() => setModal(null)} />}
      {modal === "occupy"  && selected && <OccupyModal space={selected} onClose={() => { setModal(null); setSelected(null); }} />}
      {modal === "payment" && selected && <PaymentModal space={selected} onClose={() => { setModal(null); setSelected(null); }} />}
    </div>
  );
}
