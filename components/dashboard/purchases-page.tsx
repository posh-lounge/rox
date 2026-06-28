"use client";
import React, { useState } from "react";
import { Plus, X, Loader2, TrendingUp, Package, ChevronDown } from "lucide-react";
import { usePurchases, useAddPurchase, useProducts } from "@/lib/api/v1/hooks";
import Skeleton from "react-loading-skeleton";

function AddPurchaseModal({ onClose }: { onClose: () => void }) {
  const addPurchase = useAddPurchase();
  const { data: productsData } = useProducts({ status: "active" });
  const products = productsData?.products ?? [];
  const [form, setForm] = useState({
    product_id: "", quantity: "", unit_cost: "", supplier_name: "", notes: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const total = (+form.quantity || 0) * (+form.unit_cost || 0);

  const handleSubmit = async () => {
    if (!form.product_id || !form.quantity || !form.unit_cost) return;
    await addPurchase.mutateAsync({
      product_id: +form.product_id, quantity: +form.quantity,
      unit_cost: +form.unit_cost, supplier_name: form.supplier_name, notes: form.notes,
    } as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold">Add Stock Purchase</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Product *</label>
            <div className="relative">
              <select value={form.product_id} onChange={e => set("product_id", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none">
                <option value="" className="bg-gray-900">Select product...</option>
                {products.map(p => (
                  <option key={p.product_id} value={p.product_id} className="bg-gray-900">
                    {p.product_name} (Current: {p.current_quantity} {p.unit_type})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Quantity *</label>
              <input type="number" value={form.quantity} onChange={e => set("quantity", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Unit Cost (RWF) *</label>
              <input type="number" value={form.unit_cost} onChange={e => set("unit_cost", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="0" />
            </div>
          </div>
          {total > 0 && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3 flex justify-between">
              <span className="text-indigo-300 text-sm">Total Investment</span>
              <span className="text-indigo-300 font-bold">{total.toLocaleString()} RWF</span>
            </div>
          )}
          <div>
            <label className="text-xs text-white/50 mb-1 block">Supplier</label>
            <input value={form.supplier_name} onChange={e => set("supplier_name", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
              placeholder="Supplier name..." />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none placeholder:text-white/20"
              placeholder="Optional notes..." />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Cancel</button>
          <button onClick={handleSubmit} disabled={addPurchase.isPending}
            className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50">
            {addPurchase.isPending && <Loader2 size={14} className="animate-spin" />}
            Add Purchase
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PurchasesPage() {
  const [showModal, setShowModal] = useState(false);
  const [productFilter, setProductFilter] = useState<number | undefined>();
  const { data, isLoading } = usePurchases(productFilter);
  const { data: productsData } = useProducts({ status: "active" });
  const purchases = data?.purchases ?? [];
  const products  = productsData?.products ?? [];

  const totalInvested  = purchases.reduce((s, p) => s + +p.total_cost, 0);
  const remainingValue = purchases.reduce((s, p) => s + +p.remaining_quantity * +p.unit_cost, 0);

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg,#0d1020 0%,#141827 60%,#0f1628 100%)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Purchases</h1>
            <p className="text-white/40 text-sm mt-0.5">Stock restocking history with FIFO cost tracking</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-white text-sm font-medium shadow-lg shadow-indigo-500/20 transition">
            <Plus size={16} /> Add Purchase
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total Purchases", value: purchases.length, icon: <Package size={14} className="text-indigo-400" /> },
            { label: "Total Invested", value: `${totalInvested.toLocaleString()} RWF`, icon: <TrendingUp size={14} className="text-amber-400" /> },
            { label: "Remaining Capital", value: `${remainingValue.toLocaleString()} RWF`, icon: <TrendingUp size={14} className="text-emerald-400" /> },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">{s.icon}</div>
              <div>
                <p className="text-lg font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/40">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="mb-4">
          <div className="relative inline-block">
            <select value={productFilter ?? ""} onChange={e => setProductFilter(e.target.value ? +e.target.value : undefined)}
              className="bg-white/5 border border-white/10 rounded-xl pl-4 pr-8 py-2 text-white/70 text-sm focus:outline-none focus:border-indigo-500 appearance-none">
              <option value="" className="bg-gray-900">All Products</option>
              {products.map(p => <option key={p.product_id} value={p.product_id} className="bg-gray-900">{p.product_name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {["Ref","Product","Qty Purchased","Remaining","Unit Cost","Total Cost","% Used","Supplier","Date"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array(5).fill(0).map((_,i) => (
                    <tr key={i} className="border-b border-white/5">
                      {Array(9).fill(0).map((_,j) => <td key={j} className="px-4 py-3"><Skeleton height={14} baseColor="#1f2937" highlightColor="#374151" /></td>)}
                    </tr>
                  ))
                : purchases.length === 0
                ? <tr><td colSpan={9} className="px-4 py-16 text-center text-white/30 text-sm">No purchases recorded yet</td></tr>
                : purchases.map(p => {
                    const pctUsed = Math.round(((+p.quantity - +p.remaining_quantity) / +p.quantity) * 100);
                    return (
                      <tr key={p.purchase_id} className="border-b border-white/5 hover:bg-white/3 transition">
                        <td className="px-4 py-3 text-xs text-white/30 font-mono">{p.purchase_ref}</td>
                        <td className="px-4 py-3 text-sm text-white font-medium">{p.product_name ?? `Product #${p.product_id}`}</td>
                        <td className="px-4 py-3 text-sm text-white">{Number(p.quantity).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${+p.remaining_quantity <= 0 ? "text-red-400" : "text-emerald-400"}`}>
                            {Number(p.remaining_quantity).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-white">{Number(p.unit_cost).toLocaleString()} RWF</td>
                        <td className="px-4 py-3 text-sm text-indigo-300 font-medium">{Number(p.total_cost).toLocaleString()} RWF</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pctUsed}%` }} />
                            </div>
                            <span className="text-xs text-white/40">{pctUsed}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-white/50">{p.supplier_name || "—"}</td>
                        <td className="px-4 py-3 text-xs text-white/30">{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && <AddPurchaseModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
