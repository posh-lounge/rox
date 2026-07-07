"use client";
import React, { useState, useMemo } from "react";
import {
  Plus, Search, Edit2, Package, AlertTriangle,
  Filter, X, ChevronDown, ChevronLeft, ChevronRight,
  Loader2, Tag, Ruler, Hash,
} from "lucide-react";
import { useProducts, useAddProduct, useUpdateProduct, useProductCategories, Product } from "@/lib/api/v1/hooks";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const UNIT_TYPES = ["meter", "piece", "kg", "g", "liter"];
const ITEMS_PER_PAGE = 10;

// ─── Pagination ──────────────────────────────────────────────
function Pagination({ page, total, perPage, onChange }: { page: number; total: number; perPage: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
      <span className="text-xs text-white/30">
        Showing {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition">
          <ChevronLeft size={14} />
        </button>
        {pages.map(p => {
          const isEllipsis = totalPages > 7 && p !== 1 && p !== totalPages && Math.abs(p - page) > 2;
          if (isEllipsis && (p === 2 || p === totalPages - 1)) return <span key={p} className="text-white/20 text-xs w-6 text-center">…</span>;
          if (isEllipsis) return null;
          return (
            <button key={p} onClick={() => onChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition ${p === page ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white"}`}>
              {p}
            </button>
          );
        })}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Product Modal ───────────────────────────────────────────
function ProductModal({ product, categories, onClose }: { product?: Product | null; categories: Array<{ cat_id: number; cat_name: string }>; onClose: () => void }) {
  const addProduct    = useAddProduct();
  const updateProduct = useUpdateProduct();
  const isEdit        = !!product;

  const [form, setForm] = useState({
    product_name:    product?.product_name ?? "",
    category_id:     product?.category_id?.toString() ?? "",
    unit_type:       product?.unit_type ?? "piece",
    selling_price:   product?.selling_price?.toString() ?? "",
    low_stock_alert: product?.low_stock_alert?.toString() ?? "5",
    description:     product?.description ?? "",
    status:          product?.status ?? "active",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const isPending = addProduct.isPending || updateProduct.isPending;

  const handleSubmit = async () => {
    if (!form.product_name || !form.category_id || !form.selling_price) return;
    const payload = {
      ...form,
      category_id:     +form.category_id,
      selling_price:   +form.selling_price,
      low_stock_alert: +form.low_stock_alert,
      ...(isEdit ? { product_id: product!.product_id } : {}),
    };
    if (isEdit) await updateProduct.mutateAsync(payload);
    else        await addProduct.mutateAsync(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold">{isEdit ? "Edit Product" : "New Product"}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Product Name *</label>
            <input value={form.product_name} onChange={e => set("product_name", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
              placeholder="e.g. Blue Cotton Fabric" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Category *</label>
              <select value={form.category_id} onChange={e => set("category_id", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500">
                <option value="">Select...</option>
                {categories.map(c => <option key={c.cat_id} value={c.cat_id} className="bg-gray-900">{c.cat_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Unit Type *</label>
              <select value={form.unit_type} onChange={e => set("unit_type", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500">
                {UNIT_TYPES.map(u => <option key={u} value={u} className="bg-gray-900">{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Selling Price (RWF) *</label>
              <input type="number" value={form.selling_price} onChange={e => set("selling_price", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Low Stock Alert</label>
              <input type="number" value={form.low_stock_alert} onChange={e => set("low_stock_alert", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="5" />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none placeholder:text-white/20"
              placeholder="Optional description..." />
          </div>
          {isEdit && (
            <div>
              <label className="text-xs text-white/50 mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500">
                <option value="active" className="bg-gray-900">Active</option>
                <option value="inactive" className="bg-gray-900">Inactive</option>
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Cancel</button>
          <button onClick={handleSubmit} disabled={isPending}
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50">
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function ProductsPage() {
  const [search,    setSearch]    = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [modal,     setModal]     = useState<"add" | "edit" | null>(null);
  const [selected,  setSelected]  = useState<Product | null>(null);
  const [page,      setPage]      = useState(1);

  const { data: productsData, isLoading } = useProducts({ search, category_id: catFilter });
  const { data: catsData } = useProductCategories();

  const products   = productsData?.products ?? [];
  const categories = catsData?.categories ?? [];

  // Client-side pagination (products are already filtered by server search+category)
  const totalProducts  = products.length;
  const pagedProducts  = useMemo(() => products.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE), [products, page]);

  // Reset page when filters change
  const handleSearch    = (v: string) => { setSearch(v);    setPage(1); };
  const handleCatFilter = (v: string) => { setCatFilter(v); setPage(1); };

  const openEdit   = (p: Product) => { setSelected(p); setModal("edit"); };
  const closeModal = () => { setModal(null); setSelected(null); };
  const unitIcon   = (u: string) => u === "meter" ? <Ruler size={11} /> : <Hash size={11} />;

  // NOTE: current_quantity / low_stock_alert / capital_value can arrive from the
  // API as strings (common with JSON/decimal DB columns). Comparing strings with
  // <= / > does lexicographic comparison ("20" <= "5" is true!), which caused the
  // low-stock flag to misfire. Always coerce to Number(...) before comparing.
  const isLowStock = (p: Product) => {
    const qty = Number(p.current_quantity);
    const alert = Number(p.low_stock_alert);
    return qty <= alert && qty > 0;
  };
  const isOutOfStock = (p: Product) => Number(p.current_quantity) <= 0;

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg,#0d1020 0%,#141827 60%,#0f1628 100%)" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Products</h1>
            <p className="text-white/40 text-sm mt-0.5">Manage your inventory catalog</p>
          </div>
          <button onClick={() => setModal("add")}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-white text-sm font-medium shadow-lg shadow-indigo-500/20 transition">
            <Plus size={16} /> New Product
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={search} onChange={e => handleSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/30"
              placeholder="Search products..." />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <select value={catFilter} onChange={e => handleCatFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-white/70 text-sm focus:outline-none focus:border-indigo-500 appearance-none">
              <option value="" className="bg-gray-900">All Categories</option>
              {categories.map(c => <option key={c.cat_id} value={c.cat_id} className="bg-gray-900">{c.cat_name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>
        </div>

        {/* Stats row */}
        {!isLoading && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total Products", value: totalProducts, color: "text-white" },
              { label: "Low Stock",      value: products.filter(isLowStock).length, color: "text-amber-400" },
              { label: "Out of Stock",   value: products.filter(isOutOfStock).length, color: "text-red-400" },
              { label: "Capital Value",  value: `${products.reduce((s, p) => s + Number(p.capital_value), 0).toLocaleString()} RWF`, color: "text-emerald-400" },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {["Code", "Product", "Category", "Unit", "Stock", "Sell Price", "Capital", "Status", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array(ITEMS_PER_PAGE).fill(0).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {Array(9).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton height={16} baseColor="#1f2937" highlightColor="#374151" /></td>
                      ))}
                    </tr>
                  ))
                : pagedProducts.length === 0
                ? (
                    <tr><td colSpan={9} className="px-4 py-16 text-center text-white/30 text-sm">
                      <Package size={32} className="mx-auto mb-3 opacity-30" />
                      {search || catFilter ? "No products match your filters" : "No products found"}
                    </td></tr>
                  )
                : pagedProducts.map(p => {
                    const qty  = Number(p.current_quantity);
                    const isLow = isLowStock(p);
                    const isOut = isOutOfStock(p);
                    return (
                      <tr key={p.product_id} className="border-b border-white/5 hover:bg-white/3 transition group">
                        <td className="px-4 py-3 text-xs text-white/30 font-mono">{p.product_code}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-white">{p.product_name}</div>
                          {p.description && <div className="text-xs text-white/30 truncate max-w-[160px]">{p.description}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-xs text-white/50"><Tag size={11} />{p.cat_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-xs text-white/50">{unitIcon(p.unit_type)}{p.unit_type}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1 text-sm font-medium ${isOut ? "text-red-400" : isLow ? "text-amber-400" : "text-emerald-400"}`}>
                            {(isOut || isLow) && <AlertTriangle size={13} />}
                            {qty.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-white">{Number(p.selling_price).toLocaleString()} RWF</td>
                        <td className="px-4 py-3 text-sm text-emerald-400">{Number(p.capital_value).toLocaleString()} RWF</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-white/10 text-white/40"}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition opacity-0 group-hover:opacity-100">
                            <Edit2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
          <Pagination page={page} total={totalProducts} perPage={ITEMS_PER_PAGE} onChange={setPage} />
        </div>
      </div>

      {(modal === "add" || modal === "edit") && (
        <ProductModal product={selected} categories={categories} onClose={closeModal} />
      )}
    </div>
  );
}