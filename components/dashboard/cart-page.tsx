"use client";
import React, { useState } from "react";
import {
  ShoppingCart, Trash2, X, CreditCard, Smartphone,
  Banknote, Search, Loader2, CheckCircle, Edit3,
  AlertTriangle, Package,
} from "lucide-react";
import { useCart, useCartAction, useCreateSale } from "@/lib/api/v1/hooks";
import { apiPost } from "@/lib/api/v1/fetchApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Skeleton from "react-loading-skeleton";
import {Modal} from "@/components/ui/modal";
// ─── Types ───────────────────────────────────────────────────
interface AvailableProduct {
  product_id: number;
  product_name: string;
  unit_type: string;
  selling_price: number;
  current_quantity: number;
  available_quantity: number;
  low_stock_alert: number;
  cat_name: string;
  image_url: string | null;
}
interface CartItem {
  cart_id: number;
  product_id: number;
  product_name: string;
  unit_type: string;
  current_quantity: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  max_quantity: number;
  image_url: string | null;
}

// ─── Hook: available stock (accounts for all carts) ──────────
const useAvailableProducts = (search: string) =>
  useQuery({
    queryKey: ["available-stock"],
    queryFn: () =>
      apiPost<{ products: AvailableProduct[] }>(
        "/api/main/dashboard/fetch/fetch-available-stock",
        {}
      ),
    refetchInterval: 15000, // refresh every 15s so stock stays live
  });

// ─── Quantity Input Modal ─────────────────────────────────────
// Used both when clicking a product (add) and clicking cart item (edit)
function QtyModal({
  product,
  currentQty,   // qty already in this cart for this product (0 if adding new)
  maxQty,       // hard ceiling (available_quantity for this cart session)
  onConfirm,
  onClose,
  isLoading,
}: {
  product: { product_name: string; unit_type: string; selling_price: number };
  currentQty: number;
  maxQty: number;
  onConfirm: (qty: number) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [input, setInput] = useState(currentQty > 0 ? String(currentQty) : "");
  const [error, setError] = useState("");

  const parsed  = parseFloat(input) || 0;
  const isValid = parsed > 0 && parsed <= maxQty;
  const subtotal = parsed * product.selling_price;

  const handleConfirm = () => {
    if (!isValid) {
      setError(
        parsed <= 0
          ? "Enter a quantity greater than 0"
          : `Maximum available: ${maxQty} ${product.unit_type}`
      );
      return;
    }
    onConfirm(parsed);
  };

  const handleInput = (v: string) => {
    setInput(v);
    setError("");
    const n = parseFloat(v) || 0;
    if (n > maxQty) setError(`Only ${maxQty} ${product.unit_type} available`);
    else if (n < 0) setError("Quantity cannot be negative");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h3 className="text-white font-semibold text-sm leading-tight">
              {product.product_name}
            </h3>
            <p className="text-white/40 text-xs mt-0.5">
              {maxQty} {product.unit_type} available ·{" "}
              {Number(product.selling_price).toLocaleString()} RWF/{product.unit_type}
            </p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <label className="text-xs text-white/50 mb-2 block">
            Quantity ({product.unit_type})
          </label>
          <input
            autoFocus
            type="number"
            value={input}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleConfirm()}
            step={product.unit_type === "meter" ? "0.1" : "1"}
            min="0"
            max={maxQty}
            className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-xl font-bold text-center focus:outline-none transition
              ${error ? "border-red-500/60" : isValid ? "border-indigo-500" : "border-white/10"}`}
            placeholder={`e.g. ${product.unit_type === "meter" ? "2.5" : "1"}`}
          />

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-400 mt-2">
              <AlertTriangle size={11} /> {error}
            </p>
          )}

          {/* Stock bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-white/30 mb-1">
              <span>0</span>
              <span>{maxQty} {product.unit_type} max</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  parsed > maxQty ? "bg-red-500" : parsed > maxQty * 0.8 ? "bg-amber-500" : "bg-indigo-500"
                }`}
                style={{ width: `${Math.min(100, (parsed / maxQty) * 100)}%` }}
              />
            </div>
          </div>

          {/* Subtotal preview */}
          {isValid && (
            <div className="mt-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2.5 flex justify-between">
              <span className="text-indigo-300 text-sm">Subtotal</span>
              <span className="text-indigo-300 font-bold">{subtotal.toLocaleString()} RWF</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isLoading && <Loader2 size={13} className="animate-spin" />}
            {currentQty > 0 ? "Update" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Checkout Modal ──────────────────────────────────────────
function CheckoutModal({
  items,
  total,
  onClose,
  onSuccess,
}: {
  items: CartItem[];
  total: number;
  onClose: () => void;
  onSuccess: (r: { sale_ref: string; change_amount: number }) => void;
}) {
  const createSale = useCreateSale();
  const cartAction = useCartAction();

  const [method, setMethod]     = useState<"cash" | "momo" | "pos">("cash");
  const [paid, setPaid]         = useState("");
  const [discount, setDiscount] = useState("0");
  const [customer, setCustomer] = useState("");
  const [phone, setPhone]       = useState("");
  const [payRef, setPayRef]     = useState("");

  const discountAmt = parseFloat(discount) || 0;
  const net         = total - discountAmt;
  const paidAmt     = parseFloat(paid) || 0;
  const change      = Math.max(0, paidAmt - net);
  const canConfirm  = method !== "cash" || paidAmt >= net;

  const payMethods = [
    { id: "cash", label: "Cash",  icon: <Banknote size={16} /> },
    { id: "momo", label: "MoMo",  icon: <Smartphone size={16} /> },
    { id: "pos",  label: "POS",   icon: <CreditCard size={16} /> },
  ] as const;

  const handleCheckout = async () => {
    const res = await createSale.mutateAsync({
      items: items.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
      customer_name:     customer || "Walk-in Customer",
      customer_phone:    phone || null,
      payment_method:    method,
      payment_reference: payRef || null,
      paid_amount:       method === "cash" ? paidAmt : net,
      discount_amount:   discountAmt,
    });
    await cartAction.mutateAsync({ action: "clear" });
    onSuccess({ sale_ref: res.sale_ref, change_amount: res.change_amount });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold">Checkout</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Order summary */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
            {items.map(i => (
              <div key={i.cart_id} className="flex justify-between text-sm">
                <span className="text-white/70">{i.product_name} × {i.quantity} {i.unit_type}</span>
                <span className="text-white font-medium">{Number(i.subtotal).toLocaleString()} RWF</span>
              </div>
            ))}
            <div className="border-t border-white/10 pt-2 flex justify-between text-base font-bold">
              <span className="text-white">Total</span>
              <span className="text-indigo-400">{net.toLocaleString()} RWF</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Customer Name</label>
              <input value={customer} onChange={e => setCustomer(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
                placeholder="Walk-in Customer" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
                placeholder="07..." />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1 block">Discount (RWF)</label>
            <input type="number" value={discount} onChange={e => setDiscount(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="0" />
          </div>

          <div>
            <label className="text-xs text-white/40 mb-2 block">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {payMethods.map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-medium transition ${
                    method === m.id
                      ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                      : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                  }`}>
                  {m.icon}{m.label}
                </button>
              ))}
            </div>
          </div>

          {method !== "cash" && (
            <div>
              <label className="text-xs text-white/40 mb-1 block">
                {method === "momo" ? "MoMo Transaction ID" : "POS Receipt Number"}
              </label>
              <input value={payRef} onChange={e => setPayRef(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
                placeholder="Reference..." />
            </div>
          )}

          {method === "cash" && (
            <>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Amount Received (RWF)</label>
                <input type="number" value={paid} onChange={e => setPaid(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder={String(net)} />
              </div>
              {paidAmt >= net && paidAmt > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 flex justify-between">
                  <span className="text-emerald-300 text-sm">Change</span>
                  <span className="text-emerald-300 font-bold text-lg">{change.toLocaleString()} RWF</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">
            Cancel
          </button>
          <button onClick={handleCheckout} disabled={createSale.isPending || !canConfirm}
            className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-40">
            {createSale.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            Confirm Sale
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Success Modal ───────────────────────────────────────────
function SuccessModal({ saleRef, change, onClose }: { saleRef: string; change: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-emerald-400" />
        </div>
        <h2 className="text-white font-bold text-xl mb-1">Sale Complete!</h2>
        <p className="text-white/40 text-sm mb-4">
          Ref: <span className="text-white font-mono">{saleRef}</span>
        </p>
        {change > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-emerald-300 text-sm">Change to give</p>
            <p className="text-emerald-300 font-bold text-2xl">{change.toLocaleString()} RWF</p>
          </div>
        )}
        <button onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-medium transition">
          New Sale
        </button>
      </div>
    </div>
  );
}

// ─── Cart Item Row ───────────────────────────────────────────
function CartItemRow({
  item,
  onEdit,
  onRemove,
}: {
  item: CartItem;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const isOverLimit = item.quantity > item.max_quantity;

  return (
    <div className={`flex items-center gap-3 py-3 border-b border-white/5 last:border-0 ${isOverLimit ? "opacity-70" : ""}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{item.product_name}</p>
        <p className="text-xs text-white/40 mt-0.5">
          {Number(item.unit_price).toLocaleString()} RWF / {item.unit_type}
        </p>
        {isOverLimit && (
          <p className="text-xs text-red-400 flex items-center gap-1 mt-0.5">
            <AlertTriangle size={10} /> Exceeds available stock
          </p>
        )}
      </div>

      {/* Quantity badge — click to edit */}
      <button
        onClick={onEdit}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/8 border border-white/10 rounded-lg hover:border-indigo-500/50 hover:bg-indigo-500/10 transition group"
      >
        <span className={`text-sm font-bold ${isOverLimit ? "text-red-400" : "text-white"}`}>
          {item.quantity}
        </span>
        <span className="text-xs text-white/40">{item.unit_type}</span>
        <Edit3 size={11} className="text-white/20 group-hover:text-indigo-400 transition" />
      </button>

      <div className="text-right min-w-[80px]">
        <p className="text-sm font-medium text-white">{Number(item.subtotal).toLocaleString()}</p>
        <p className="text-xs text-white/30">RWF</p>
      </div>

      <button
        onClick={onRemove}
        className="p-1.5 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-400/10 transition"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ─── Main Cart Page ──────────────────────────────────────────
export default function CartPage() {
  const [search, setSearch]           = useState("");
  const [qtyModal, setQtyModal]       = useState<{ product: AvailableProduct; currentQty: number; maxQty: number } | null>(null);
  const [editModal, setEditModal]     = useState<{ item: CartItem } | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [success, setSuccess]         = useState<{ sale_ref: string; change_amount: number } | null>(null);

  const { data: availData, isLoading: productsLoading } = useAvailableProducts(search);
  const { data: cartData, isLoading: cartLoading }      = useCart();
  const cartAction = useCartAction();

  const allProducts = availData?.products ?? [];
  const items       = (cartData?.items ?? []) as CartItem[];
  const cartTotal   = cartData?.total ?? 0;
  const cartCount   = cartData?.count ?? 0;

  // Filter products for the grid
  const filtered = allProducts
    .filter(p =>
      !search ||
      p.product_name.toLowerCase().includes(search.toLowerCase()) ||
      p.cat_name?.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 30);

  // How much of this product is already in MY cart
  const myCartQty = (productId: number) =>
    items.find(i => i.product_id === productId)?.quantity ?? 0;

  // Open the add modal for a product
  const openAddModal = (p: AvailableProduct) => {
    const inCart = myCartQty(p.product_id);
    // available_quantity from server already excludes OTHER carts,
    // but we need to allow the user to go up to available + what they already have in their own cart
    // because the server reserves = other carts only.
    const maxForThisCart = p.available_quantity; // server already handles this
    if (maxForThisCart <= 0 && inCart === 0) return; // truly out of stock
    setQtyModal({ product: p, currentQty: inCart, maxQty: maxForThisCart });
  };

  const handleQtyConfirm = async (qty: number) => {
    if (!qtyModal) return;
    await cartAction.mutateAsync({ action: "add", product_id: qtyModal.product.product_id, quantity: qty });
    setQtyModal(null);
  };

  const handleEditConfirm = async (qty: number) => {
    if (!editModal) return;
    await cartAction.mutateAsync({ action: "update", product_id: editModal.item.product_id, quantity: qty });
    setEditModal(null);
  };

  const handleRemove = (productId: number) =>
    cartAction.mutate({ action: "remove", product_id: productId });

  const hasOverLimit = items.some(i => i.quantity > i.max_quantity);

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg,#0d1020 0%,#141827 60%,#0f1628 100%)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Sales Cart</h1>
          <p className="text-white/40 text-sm mt-0.5">Click a product to set quantity and add to cart</p>
        </div>

        <div className="flex gap-6 items-start">
          {/* ── Product grid ── */}
          <div className="flex-1 min-w-0">
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/30"
                placeholder="Search products..." />
            </div>

            {productsLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {Array(9).fill(0).map((_,i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <Skeleton height={12} width="40%" className="mb-2" baseColor="#1f2937" highlightColor="#374151" />
                    <Skeleton height={18} width="80%" className="mb-2" baseColor="#1f2937" highlightColor="#374151" />
                    <Skeleton height={12} width="60%" baseColor="#1f2937" highlightColor="#374151" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <Package size={28} className="mx-auto mb-2 text-white/15" />
                <p className="text-white/30 text-sm">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map(p => {
                  const inCart    = myCartQty(p.product_id);
                  const avail     = p.available_quantity;
                  const isOut     = avail <= 0 && inCart === 0;
                  const isFullyInCart = avail <= 0 && inCart > 0; // all stock is in MY cart

                  return (
                    <button
                      key={p.product_id}
                      onClick={() => !isOut && openAddModal(p)}
                      disabled={isOut}
                      className={`text-left p-4 rounded-2xl border transition group ${
                        isOut
                          ? "opacity-40 cursor-not-allowed bg-white/3 border-white/5"
                          : inCart > 0
                          ? "bg-indigo-500/10 border-indigo-500/30 hover:border-indigo-500/60"
                          : "bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/8"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-[10px] text-white/30 font-medium uppercase tracking-wide">{p.cat_name}</span>
                        {inCart > 0 && (
                          <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded-full font-medium">
                            {inCart} in cart
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-white leading-tight line-clamp-2 mb-3">
                        {p.product_name}
                      </p>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className={`text-xs font-medium ${
                            avail <= 0 ? "text-red-400" :
                            avail <= p.low_stock_alert ? "text-amber-400" : "text-white/40"
                          }`}>
                            {isOut ? "Out of stock" :
                             isFullyInCart ? "All in your cart" :
                             `${avail} ${p.unit_type} free`}
                          </p>
                          {p.current_quantity > avail && !isOut && (
                            <p className="text-[10px] text-white/20 mt-0.5">
                              {p.current_quantity} total · {p.current_quantity - avail} reserved
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-bold text-indigo-300">
                          {Number(p.selling_price).toLocaleString()}
                          <span className="text-xs text-indigo-300/50 font-normal"> RWF</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Cart panel ── */}
          <div className="w-80 shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={16} className="text-white/60" />
                  <span className="text-sm font-medium text-white">Cart</span>
                  {cartCount > 0 && (
                    <span className="text-xs bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded-full font-medium">
                      {cartCount}
                    </span>
                  )}
                </div>
                {cartCount > 0 && (
                  <button
                    onClick={() => cartAction.mutate({ action: "clear" })}
                    className="text-xs text-red-400/50 hover:text-red-400 transition flex items-center gap-1"
                  >
                    <Trash2 size={11} /> Clear
                  </button>
                )}
              </div>

              {cartLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_,i) => (
                    <Skeleton key={i} height={50} baseColor="#1f2937" highlightColor="#374151" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="py-10 text-center">
                  <ShoppingCart size={28} className="mx-auto mb-2 text-white/15" />
                  <p className="text-white/30 text-sm">Cart is empty</p>
                  <p className="text-white/20 text-xs mt-0.5">Click a product to add it</p>
                </div>
              ) : (
                <>
                  <div className="max-h-96 overflow-y-auto pr-1">
                    {items.map(item => (
                      <CartItemRow
                        key={item.cart_id}
                        item={item}
                        onEdit={() => setEditModal({ item })}
                        onRemove={() => handleRemove(item.product_id)}
                      />
                    ))}
                  </div>

                  {hasOverLimit && (
                    <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 flex items-start gap-2">
                      <AlertTriangle size={13} className="text-red-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-red-400">Some items exceed available stock. Update quantities to proceed.</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between mb-4">
                      <span className="text-sm text-white/60">Total</span>
                      <span className="text-lg font-bold text-white">{cartTotal.toLocaleString()} RWF</span>
                    </div>
                    <button
                      onClick={() => setShowCheckout(true)}
                      disabled={hasOverLimit || items.length === 0}
                      className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-white font-medium transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <CreditCard size={16} /> Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quantity modal — adding from product grid */}
      {qtyModal && (
        <QtyModal
          product={qtyModal.product}
          currentQty={qtyModal.currentQty}
          maxQty={qtyModal.maxQty}
          isLoading={cartAction.isPending}
          onConfirm={handleQtyConfirm}
          onClose={() => setQtyModal(null)}
        />
      )}

      {/* Quantity modal — editing from cart */}
      {editModal && (() => {
        const prod = allProducts.find(p => p.product_id === editModal.item.product_id);
        if (!prod) return null;
        return (
          <QtyModal
            product={prod}
            currentQty={editModal.item.quantity}
            maxQty={prod.available_quantity}
            isLoading={cartAction.isPending}
            onConfirm={handleEditConfirm}
            onClose={() => setEditModal(null)}
          />
        );
      })()}

      {showCheckout && items.length > 0 && (
        <CheckoutModal
          items={items}
          total={cartTotal}
          onClose={() => setShowCheckout(false)}
          onSuccess={r => { setShowCheckout(false); setSuccess(r); }}
        />
      )}

      {success && (
        <SuccessModal
          saleRef={success.sale_ref}
          change={success.change_amount}
          onClose={() => setSuccess(null)}
        />
      )}
    </div>
  );
}
