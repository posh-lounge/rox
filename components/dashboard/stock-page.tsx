"use client";
import React, { useState } from "react";
import {
  Plus, X, Loader2, AlertTriangle, CheckCircle,
  ClipboardList, ChevronDown, Lock, Unlock,
} from "lucide-react";
import { useStockSessions, useStockAction, useProducts } from "@/lib/api/v1/hooks";
import Skeleton from "react-loading-skeleton";

function RecordEntriesModal({
  sessionId, entryType, onClose,
}: { sessionId: number; entryType: "opening" | "closing"; onClose: () => void }) {
  const { data: productsData } = useProducts({ status: "active" });
  const stockAction = useStockAction();
  const products = productsData?.products ?? [];
  const [entries, setEntries] = useState<Record<number, { qty: string; notes: string }>>({});

  const setEntry = (id: number, field: "qty" | "notes", value: string) =>
    setEntries(e => ({ ...e, [id]: { ...e[id], qty: e[id]?.qty ?? "", notes: e[id]?.notes ?? "", [field]: value } }));

  const handleSubmit = async () => {
    const payload = products
      .filter(p => entries[p.product_id]?.qty !== undefined && entries[p.product_id]?.qty !== "")
      .map(p => ({
        product_id: p.product_id,
        recorded_quantity: +entries[p.product_id].qty,
        notes: entries[p.product_id]?.notes ?? "",
      }));
    if (!payload.length) return;
    await stockAction.mutateAsync({ action: "record", session_id: sessionId, entry_type: entryType, entries: payload });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-white font-semibold capitalize">{entryType} Stock Count</h2>
            <p className="text-xs text-white/40">Enter physically counted quantities for each product</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-3">
          {products.map(p => (
            <div key={p.product_id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{p.product_name}</p>
                <p className="text-xs text-white/40">System: {Number(p.current_quantity).toLocaleString()} {p.unit_type}</p>
              </div>
              <input type="number" placeholder="Counted qty"
                value={entries[p.product_id]?.qty ?? ""}
                onChange={e => setEntry(p.product_id, "qty", e.target.value)}
                className="w-28 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500 text-center" />
              <input placeholder="Note (if any)"
                value={entries[p.product_id]?.notes ?? ""}
                onChange={e => setEntry(p.product_id, "notes", e.target.value)}
                className="w-40 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20" />
              {entries[p.product_id]?.qty !== undefined && entries[p.product_id]?.qty !== "" && (() => {
                const diff = +entries[p.product_id].qty - +p.current_quantity;
                if (diff === 0) return <CheckCircle size={16} className="text-emerald-400 shrink-0" />;
                return <span className={`text-xs font-medium shrink-0 ${diff < 0 ? "text-red-400" : "text-amber-400"}`}>{diff > 0 ? "+" : ""}{diff}</span>;
              })()}
            </div>
          ))}
        </div>
        <div className="flex gap-3 px-6 pb-6 border-t border-white/10 pt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Cancel</button>
          <button onClick={handleSubmit} disabled={stockAction.isPending}
            className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50">
            {stockAction.isPending && <Loader2 size={14} className="animate-spin" />}
            Save {entryType} Count
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StockPage() {
  const [modal, setModal]   = useState<{ sessionId: number; type: "opening" | "closing" } | null>(null);
  const [viewSession, setViewSession] = useState<number | null>(null);
  const stockAction = useStockAction();
  const { data, isLoading } = useStockSessions(viewSession ?? undefined);
  const sessions = data?.sessions ?? [];
  const entries  = data?.entries ?? [];

  const handleOpen = async () => {
    await stockAction.mutateAsync({ action: "open" });
  };
  const handleClose = async (sessionId: number) => {
    await stockAction.mutateAsync({ action: "close", session_id: sessionId });
  };

  const today = new Date().toISOString().split("T")[0];
  const todaySession = sessions.find(s => s.session_date === today);
  const openSession  = sessions.find(s => s.status === "open");

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg,#0d1020 0%,#141827 60%,#0f1628 100%)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Stock Management</h1>
            <p className="text-white/40 text-sm mt-0.5">Opening & closing stock counts with discrepancy tracking</p>
          </div>
          <div className="flex gap-3">
            {openSession ? (
              <>
                <button onClick={() => setModal({ sessionId: openSession.session_id, type: "closing" })}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 rounded-xl text-amber-300 text-sm font-medium transition">
                  <ClipboardList size={15} /> Close Count
                </button>
                <button onClick={() => handleClose(openSession.session_id)} disabled={stockAction.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 rounded-xl text-red-300 text-sm font-medium transition">
                  <Lock size={15} /> Close Session
                </button>
              </>
            ) : (
              <button onClick={handleOpen} disabled={!!todaySession || stockAction.isPending}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-white text-sm font-medium shadow-lg shadow-indigo-500/20 transition disabled:opacity-50">
                {stockAction.isPending ? <Loader2 size={14} className="animate-spin" /> : <Unlock size={15} />}
                {todaySession ? "Session Closed Today" : "Open Today's Session"}
              </button>
            )}
            {openSession && (
              <button onClick={() => setModal({ sessionId: openSession.session_id, type: "opening" })}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white text-sm font-medium transition">
                <ClipboardList size={15} /> Record Opening Count
              </button>
            )}
          </div>
        </div>

        {openSession && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-5 py-3 mb-6 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <p className="text-sm text-indigo-300">Active session: <span className="font-medium">{openSession.session_date}</span></p>
            <span className="text-indigo-300/50 text-xs">Opened by {openSession.opened_by_name}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Session list */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <h3 className="text-sm font-medium text-white">Stock Sessions</h3>
            </div>
            {isLoading ? (
              <div className="p-5 space-y-3">{Array(4).fill(0).map((_,i) => <Skeleton key={i} height={48} baseColor="#1f2937" highlightColor="#374151" />)}</div>
            ) : sessions.length === 0 ? (
              <div className="py-12 text-center text-white/30 text-sm">No sessions yet. Open today's session to begin.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {sessions.map(s => (
                  <button key={s.session_id} onClick={() => setViewSession(viewSession === s.session_id ? null : s.session_id)}
                    className={`w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/3 transition text-left ${viewSession === s.session_id ? "bg-white/5" : ""}`}>
                    <div>
                      <p className="text-sm font-medium text-white">{s.session_date}</p>
                      <p className="text-xs text-white/40 mt-0.5">{s.entry_count} entries · opened by {s.opened_by_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {s.missing_count > 0 && (
                        <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                          <AlertTriangle size={10} /> {s.missing_count} missing
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === "open" ? "bg-emerald-500/15 text-emerald-400" : "bg-white/10 text-white/40"}`}>
                        {s.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Entry details */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <h3 className="text-sm font-medium text-white">
                {viewSession ? `Entries for Session #${viewSession}` : "Select a session to view entries"}
              </h3>
            </div>
            {!viewSession ? (
              <div className="py-12 text-center text-white/30 text-sm">Click a session to view its entries</div>
            ) : entries.length === 0 ? (
              <div className="py-12 text-center text-white/30 text-sm">No entries recorded for this session</div>
            ) : (
              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                {entries.map(e => {
                  const isNeg = e.variance < 0;
                  const isPos = e.variance > 0;
                  return (
                    <div key={e.entry_id} className={`px-5 py-3 flex items-center gap-4 ${isNeg ? "bg-red-500/5" : ""}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{e.product_name}</p>
                        <p className="text-xs text-white/40 capitalize">{e.entry_type} count</p>
                      </div>
                      <div className="text-right text-xs text-white/50">
                        <p>System: {Number(e.system_quantity).toLocaleString()} {e.unit_type}</p>
                        <p>Counted: {Number(e.recorded_quantity).toLocaleString()} {e.unit_type}</p>
                      </div>
                      <div className={`text-sm font-bold w-16 text-right ${isNeg ? "text-red-400" : isPos ? "text-amber-400" : "text-emerald-400"}`}>
                        {isPos ? "+" : ""}{Number(e.variance).toLocaleString()}
                      </div>
                      {isNeg && <AlertTriangle size={14} className="text-red-400 shrink-0" />}
                      {!isNeg && !isPos && <CheckCircle size={14} className="text-emerald-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {modal && (
        <RecordEntriesModal sessionId={modal.sessionId} entryType={modal.type} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
