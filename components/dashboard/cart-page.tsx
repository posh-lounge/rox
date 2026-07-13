"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Plus, X, Loader2, Search, Edit3, Trash2, CreditCard,
  Smartphone, Banknote, CheckCircle, AlertTriangle,
  ShoppingBag, Package, ChevronRight, Users,
  ChevronLeft,
} from "lucide-react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { apiPost } from "@/lib/api/v1/fetchApi";
import { useCreateSale } from "@/lib/api/v1/hooks";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// ─── Types ───────────────────────────────────────────────────
interface Order { order_id:number; order_ref:string; order_name:string; status:string; item_count:number; total:number; created_at:string; firstname?:string; lastname?:string; }
interface OrderItem { item_id:number; order_id:number; product_id:number; product_name:string; unit_type:string; quantity:number; unit_price:number; subtotal:number; max_quantity:number; current_quantity:number; }
interface Product { product_id:number; product_name:string; unit_type:string; selling_price:number; available_quantity:number; current_quantity:number; low_stock_alert:number; cat_name:string; reserved_in_orders:number; }
interface LoanAccount { loan_id:number; account_ref:string; customer_name:string; customer_phone:string; balance:number; }

const PRODUCTS_PER_PAGE = 10;
const ORDERS_PER_PAGE   = 10;

// ─── Hooks ───────────────────────────────────────────────────
const useOrders         = () => useQuery({ queryKey:['orders'], queryFn:()=>apiPost<{orders:Order[]}>('/api/main/dashboard/create/order-action',{action:'list'}), refetchInterval:10000 });
const useOrderDetail    = (id:number|null) => useQuery({ queryKey:['order',id], enabled:!!id, queryFn:()=>apiPost<{order:Order;items:OrderItem[];total:number}>('/api/main/dashboard/create/order-action',{action:'fetch_order',order_id:id}), refetchInterval:8000 });
const useAvailableStock = (orderId:number|null) => useQuery({ queryKey:['available-stock',orderId], queryFn:()=>apiPost<{products:Product[]}>('/api/main/dashboard/fetch/fetch-available-stock',{order_id:orderId}), refetchInterval:12000 });
const useOrderAction    = () => { const qc=useQueryClient(); return useMutation({ mutationFn:(d:Record<string,unknown>)=>apiPost('/api/main/dashboard/create/order-action',d), onSuccess:(_,v:any)=>{ qc.invalidateQueries({queryKey:['orders']}); if(v.order_id||v.action) qc.invalidateQueries({queryKey:['order']}); qc.invalidateQueries({queryKey:['available-stock']}); } }); };
const useLoanSearch     = (q:string) => useQuery({ queryKey:['loan-search',q], enabled:q.length>1, queryFn:()=>apiPost<{accounts:LoanAccount[]}>('/api/main/dashboard/create/loan-action',{action:'search',query:q}) });

// ─── Mini Pagination ─────────────────────────────────────────
function Pagination({ page, total, perPage, onChange }:{ page:number; total:number; perPage:number; onChange:(p:number)=>void }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1 pt-3">
      <button onClick={()=>onChange(page-1)} disabled={page===1}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition">
        <ChevronLeft size={13}/>
      </button>
      {Array.from({length:totalPages},(_,i)=>i+1).map(p=>{
        const isEllipsis = totalPages>5 && p!==1 && p!==totalPages && Math.abs(p-page)>1;
        if (isEllipsis && (p===2||p===totalPages-1)) return <span key={p} className="text-white/20 text-xs w-5 text-center">…</span>;
        if (isEllipsis) return null;
        return (
          <button key={p} onClick={()=>onChange(p)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition ${p===page?'bg-indigo-500 text-white':'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}`}>
            {p}
          </button>
        );
      })}
      <button onClick={()=>onChange(page+1)} disabled={page===totalPages}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition">
        <ChevronRight size={13}/>
      </button>
      <span className="text-[10px] text-white/20 ml-1">{page}/{totalPages}</span>
    </div>
  );
}

// ─── New Order Modal ─────────────────────────────────────────
function NewOrderModal({ onClose, onCreated }:{ onClose:()=>void; onCreated:(id:number,name:string)=>void }) {
  const orderAction = useOrderAction();
  const [name, setName] = useState("");
  const handle = async () => {
    if (!name.trim()) return;
    const res:any = await orderAction.mutateAsync({ action:'create', order_name:name.trim() });
    onCreated(res.order_id, res.order_name);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-white font-semibold">New Order</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={16}/></button>
        </div>
        <div className="p-5">
          <label className="text-xs text-white/50 mb-2 block">Order Label</label>
          <input autoFocus value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handle()}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
            placeholder='e.g. "John Doe", "Walk-in 1", "Wholesale"'/>
          <p className="text-xs text-white/30 mt-2">Give this order a name to identify the customer</p>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Cancel</button>
          <button onClick={handle} disabled={!name.trim()||orderAction.isPending}
            className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-40">
            {orderAction.isPending&&<Loader2 size={13} className="animate-spin"/>} Create Order
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Qty Modal ───────────────────────────────────────────────
function QtyModal({ product, currentQty, currentPrice, maxQty, onConfirm, onClose, isLoading }:{
  product:Product; currentQty:number; currentPrice?:number;
  maxQty:number; onConfirm:(q:number, price:number)=>void;
  onClose:()=>void; isLoading:boolean;
}) {
  const listedPrice = product.selling_price;
  const [input,      setInput]      = useState(currentQty>0?String(currentQty):"");
  const [priceInput, setPriceInput] = useState(String(currentPrice??listedPrice));
  const [err,        setErr]        = useState("");

  const parsed      = parseFloat(input)||0;
  const parsedPrice = parseFloat(priceInput)||0;
  const isValid     = parsed>0 && parsed<=maxQty && parsedPrice>0;
  const subtotal    = parsed * parsedPrice;
  const isCustom    = parsedPrice !== listedPrice;

  const onQtyInput = (v:string) => {
    setInput(v);
    const n=parseFloat(v)||0;
    setErr(n>maxQty?`Only ${maxQty} ${product.unit_type} available`:"");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <p className="text-white font-semibold text-sm">{product.product_name}</p>
            <p className="text-white/40 text-xs">{maxQty} {product.unit_type} free</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={16}/></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Quantity */}
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">Quantity ({product.unit_type})</label>
            <input autoFocus type="number" value={input} onChange={e=>onQtyInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&isValid&&onConfirm(parsed,parsedPrice)}
              step={product.unit_type==="meter"?"0.1":"1"} min="0" max={maxQty}
              className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-2xl font-bold text-center focus:outline-none transition ${err?"border-red-500/60":parsed>0&&parsed<=maxQty?"border-indigo-500":"border-white/10"}`}
              placeholder={product.unit_type==="meter"?"0.0":"0"}/>
            {err&&<p className="text-xs text-red-400 mt-1.5 flex items-center gap-1"><AlertTriangle size={11}/>{err}</p>}
            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${parsed>maxQty?"bg-red-500":parsed>maxQty*0.8?"bg-amber-500":"bg-indigo-500"}`} style={{width:`${Math.min(100,(parsed/maxQty)*100)}%`}}/>
            </div>
            <div className="flex justify-between text-xs text-white/20 mt-1"><span>0</span><span>{maxQty} {product.unit_type}</span></div>
          </div>

          {/* Custom price */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-white/40">Price per {product.unit_type} (RWF)</label>
              <div className="flex items-center gap-2">
                {isCustom&&<span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Custom</span>}
                <span className="text-[10px] text-white/25">Listed: {Number(listedPrice).toLocaleString()}</span>
              </div>
            </div>
            <div className="relative">
              <input type="number" value={priceInput} onChange={e=>setPriceInput(e.target.value)} min="0"
                className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none transition ${isCustom?"border-amber-500/50 focus:border-amber-500":"border-white/10 focus:border-indigo-500"}`}
                placeholder="0"/>
              {isCustom&&(
                <button onClick={()=>setPriceInput(String(listedPrice))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 hover:text-white/70 transition underline">
                  reset
                </button>
              )}
            </div>
            {isCustom&&listedPrice>0&&parsedPrice<listedPrice&&(
              <p className="text-[10px] text-amber-400 mt-1">↓ {Math.round((1-parsedPrice/listedPrice)*100)}% below listed price</p>
            )}
            {isCustom&&parsedPrice>listedPrice&&(
              <p className="text-[10px] text-emerald-400 mt-1">↑ {Math.round((parsedPrice/listedPrice-1)*100)}% above listed price</p>
            )}
          </div>

          {/* Subtotal preview */}
          {isValid&&(
            <div className={`rounded-xl px-4 py-2.5 flex justify-between border ${isCustom?"bg-amber-500/10 border-amber-500/20":"bg-indigo-500/10 border-indigo-500/20"}`}>
              <span className={`text-sm ${isCustom?"text-amber-300":"text-indigo-300"}`}>Subtotal</span>
              <span className={`font-bold ${isCustom?"text-amber-300":"text-indigo-300"}`}>{subtotal.toLocaleString()} RWF</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Cancel</button>
          <button onClick={()=>onConfirm(parsed,parsedPrice)} disabled={!isValid||isLoading}
            className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-40">
            {isLoading&&<Loader2 size={13} className="animate-spin"/>}{currentQty>0?"Update":"Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Checkout Modal ───────────────────────────────────────────
// No "Amount Received" input. Customer pays exactly what they owe.
// paid_amount = net is set by the backend automatically.
function CheckoutModal({ order, items, total, onClose, onSuccess }:{ order:Order; items:OrderItem[]; total:number; onClose:()=>void; onSuccess:(ref:string)=>void; }) {
  const createSale = useCreateSale();
  const [method,       setMethod]      = useState<'cash'|'momo'|'pos'|'loan'>('cash');
  const [discount,     setDiscount]    = useState('0');
  const [customer,     setCustomer]    = useState(order.order_name);
  const [phone,        setPhone]       = useState('');
  const [payRef,       setPayRef]      = useState('');
  const [loanQuery,    setLoanQuery]   = useState('');
  const [selectedLoan, setSelectedLoan]= useState<LoanAccount|null>(null);

  const { data: loanData } = useLoanSearch(loanQuery);
  const loanAccounts = loanData?.accounts ?? [];

  const disc       = parseFloat(discount)||0;
  const net        = total - disc;
  const canConfirm = method==='loan' ? !!selectedLoan : net > 0;

  const payMethods = [
    {id:'cash', label:'Cash', icon:<Banknote  size={15}/>},
    {id:'momo', label:'MoMo', icon:<Smartphone size={15}/>},
    {id:'pos',  label:'POS',  icon:<CreditCard size={15}/>},
    {id:'loan', label:'Loan', icon:<ShoppingBag size={15}/>},
  ] as const;

  const handle = async () => {
    await createSale.mutateAsync({
      order_id:          order.order_id,
      items:             items.map(i=>({product_id:i.product_id,quantity:i.quantity,unit_price:i.unit_price})),
      customer_name:     customer||order.order_name,
      customer_phone:    phone||null,
      payment_method:    method,
      payment_reference: payRef||null,
      discount_amount:   disc,
      loan_id:           method==='loan'?selectedLoan?.loan_id:null,
      // paid_amount intentionally omitted — backend always sets it to net
    });
    onSuccess(order.order_ref);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div><h2 className="text-white font-semibold">Checkout</h2><p className="text-xs text-white/40">{order.order_name}</p></div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">

          {/* Order summary */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1.5">
            {items.map(i=>(
              <div key={i.item_id} className="flex justify-between text-sm">
                <span className="text-white/70">{i.product_name} × {i.quantity} {i.unit_type}</span>
                <span className="text-white font-medium">{Number(i.subtotal).toLocaleString()} RWF</span>
              </div>
            ))}
            {disc>0&&(
              <div className="flex justify-between text-sm text-red-400">
                <span>Discount</span><span>− {disc.toLocaleString()} RWF</span>
              </div>
            )}
            <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
              <span className="text-white">Amount Due</span>
              <span className="text-indigo-400 text-lg">{net.toLocaleString()} RWF</span>
            </div>
          </div>

          {/* Customer details */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-white/40 mb-1 block">Customer Name</label>
              <input value={customer} onChange={e=>setCustomer(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"/></div>
            <div><label className="text-xs text-white/40 mb-1 block">Phone</label>
              <input value={phone} onChange={e=>setPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
                placeholder="07..."/></div>
          </div>

          {/* Discount */}
          <div><label className="text-xs text-white/40 mb-1 block">Discount (RWF)</label>
            <input type="number" min="0" value={discount} onChange={e=>setDiscount(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"/></div>

          {/* Payment method */}
          <div>
            <label className="text-xs text-white/40 mb-2 block">Payment Method</label>
            <div className="grid grid-cols-4 gap-2">
              {payMethods.map(m=>(
                <button key={m.id} onClick={()=>{setMethod(m.id);setSelectedLoan(null);}}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition ${method===m.id?'bg-indigo-500/20 border-indigo-500 text-indigo-300':'bg-white/5 border-white/10 text-white/50 hover:border-white/20'}`}>
                  {m.icon}{m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loan account picker */}
          {method==='loan'&&(
            <div>
              <label className="text-xs text-white/40 mb-1 block">Search Loan Account</label>
              {selectedLoan?(
                <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-4 py-3">
                  <div><p className="text-sm font-medium text-white">{selectedLoan.customer_name}</p>
                    <p className="text-xs text-white/40">{selectedLoan.customer_phone} · Balance: {Number(selectedLoan.balance).toLocaleString()} RWF</p></div>
                  <button onClick={()=>setSelectedLoan(null)} className="text-white/40 hover:text-white"><X size={14}/></button>
                </div>
              ):(
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
                  <input value={loanQuery} onChange={e=>setLoanQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
                    placeholder="Search by name or phone..."/>
                  {loanAccounts.length>0&&(
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-white/10 rounded-xl overflow-hidden z-10 shadow-xl">
                      {loanAccounts.map(a=>(
                        <button key={a.loan_id} onClick={()=>{setSelectedLoan(a);setLoanQuery('');}}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition text-left">
                          <div><p className="text-sm text-white">{a.customer_name}</p><p className="text-xs text-white/40">{a.customer_phone}</p></div>
                          <span className="text-xs text-amber-400">{Number(a.balance).toLocaleString()} RWF owed</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-white/30 mt-1">The full amount will be added to this account's debt</p>
            </div>
          )}

          {/* MoMo / POS reference */}
          {(method==='momo'||method==='pos')&&(
            <div><label className="text-xs text-white/40 mb-1 block">{method==='momo'?'MoMo Transaction ID':'POS Receipt Number'}</label>
              <input value={payRef} onChange={e=>setPayRef(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20"
                placeholder="Reference (optional)..."/></div>
          )}

          {/* Cash — show exact amount to collect, no input needed */}
          {method==='cash'&&(
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-emerald-300 text-sm font-medium">Collect from customer</span>
              <span className="text-emerald-300 font-bold text-xl">{net.toLocaleString()} RWF</span>
            </div>
          )}

        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Cancel</button>
          <button onClick={handle} disabled={createSale.isPending||!canConfirm}
            className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-40">
            {createSale.isPending&&<Loader2 size={14} className="animate-spin"/>}Confirm Sale
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Success Modal ────────────────────────────────────────────
// No change display — payment is always exact
function SuccessModal({ saleRef, onClose }:{ saleRef:string; onClose:()=>void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-emerald-400"/>
        </div>
        <h2 className="text-white font-bold text-xl mb-1">Sale Complete!</h2>
        <p className="text-white/40 text-sm mb-6">Ref: <span className="text-white font-mono">{saleRef}</span></p>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-medium transition">Done</button>
      </div>
    </div>
  );
}

// ─── Order Detail Panel ───────────────────────────────────────
function OrderPanel({ orderId, onClose }:{ orderId:number; onClose:()=>void }) {
  const { data, isLoading } = useOrderDetail(orderId);
  const { data: stockData } = useAvailableStock(orderId);
  const orderAction = useOrderAction();

  const order    = data?.order;
  const items    = (data?.items??[]) as OrderItem[];
  const total    = data?.total??0;
  const products = (stockData?.products??[]) as Product[];

  const [search,       setSearch]      = useState('');
  const [productPage,  setProductPage] = useState(1);
  const [qtyModal,     setQtyModal]    = useState<{product:Product;currentQty:number;currentPrice?:number}|null>(null);
  const [showCheckout, setShowCheckout]= useState(false);
  const [success,      setSuccess]     = useState<string|null>(null);

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const s = search.toLowerCase();
    return products.filter(p => p.product_name.toLowerCase().includes(s) || p.cat_name?.toLowerCase().includes(s));
  }, [search, products]);

  useEffect(() => { setProductPage(1); }, [search]);

  const totalProductPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const pagedProducts = filteredProducts.slice(
    (productPage - 1) * PRODUCTS_PER_PAGE,
    productPage * PRODUCTS_PER_PAGE
  );

  const itemQty = (pid:number) => items.find(i=>i.product_id===pid)?.quantity??0;

  const handleQtyConfirm = async (qty:number, price:number) => {
    if (!qtyModal) return;
    await orderAction.mutateAsync({ action:'add_item', order_id:orderId, product_id:qtyModal.product.product_id, quantity:qty, unit_price:price });
    setQtyModal(null);
  };

  const handleRemove = (pid:number) => orderAction.mutate({ action:'remove_item', order_id:orderId, product_id:pid });

  const handleCancel = async () => {
    if (!confirm('Cancel this order? All reserved stock will be released.')) return;
    await orderAction.mutateAsync({ action:'cancel', order_id:orderId });
    onClose();
  };

  if (!order && !isLoading) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div>
          <p className="text-white font-semibold text-sm">{order?.order_name??'Loading...'}</p>
          <p className="text-white/30 text-xs font-mono">{order?.order_ref}</p>
        </div>
        <div className="flex items-center gap-2">
          {items.length>0&&(
            <button onClick={()=>setShowCheckout(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-white text-xs font-medium transition">
              <CreditCard size={13}/> Checkout
            </button>
          )}
          <button onClick={handleCancel} className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition" title="Cancel order">
            <Trash2 size={14}/>
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition">
            <X size={14}/>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: product grid ── */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-white/10">
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-white/20"/>
            </div>
          </div>

          {!isLoading&&filteredProducts.length>0&&(
            <div className="px-3 pt-2 flex items-center justify-between">
              <span className="text-[10px] text-white/25">
                {filteredProducts.length} product{filteredProducts.length!==1?'s':''}
                {search&&` matching "${search}"`}
              </span>
              {totalProductPages>1&&(
                <span className="text-[10px] text-white/25">Page {productPage} of {totalProductPages}</span>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3">
            {isLoading?(
              <div className="grid grid-cols-2 gap-2">
                {Array(6).fill(0).map((_,i)=>(
                  <div key={i} className="bg-white/5 rounded-xl p-3"><Skeleton height={56} baseColor="#1f2937" highlightColor="#374151"/></div>
                ))}
              </div>
            ):filteredProducts.length===0?(
              <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                <Package size={22} className="text-white/15 mb-2"/>
                <p className="text-white/30 text-xs">{search?`No products match "${search}"`:'No products available'}</p>
                {search&&<button onClick={()=>setSearch('')} className="text-indigo-400 text-xs mt-2 hover:text-indigo-300 transition">Clear search</button>}
              </div>
            ):(
              <>
                <div className="grid grid-cols-2 gap-2">
                  {pagedProducts.map(p=>{
                    const inOrder = itemQty(p.product_id);
                    const avail   = p.available_quantity;
                    const isOut   = avail<=0 && inOrder===0;
                    return (
                      <button key={p.product_id}
                        onClick={()=>!isOut&&setQtyModal({product:p,currentQty:inOrder,currentPrice:items.find(i=>i.product_id===p.product_id)?.unit_price})}
                        disabled={isOut}
                        className={`text-left p-3 rounded-xl border transition ${
                          isOut?'opacity-40 cursor-not-allowed bg-white/3 border-white/5':
                          inOrder>0?'bg-indigo-500/10 border-indigo-500/30 hover:border-indigo-500/50':
                          'bg-white/5 border-white/10 hover:border-white/25'
                        }`}>
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-[9px] text-white/30 uppercase tracking-wide leading-tight">{p.cat_name}</span>
                          {inOrder>0&&<span className="text-[9px] bg-indigo-500/30 text-indigo-300 px-1 py-0.5 rounded-full">{inOrder}</span>}
                        </div>
                        <p className="text-xs font-medium text-white leading-tight line-clamp-2 mb-1.5">{p.product_name}</p>
                        <div className="flex items-end justify-between">
                          <span className={`text-[10px] ${avail<=0?'text-red-400':avail<=p.low_stock_alert?'text-amber-400':'text-white/30'}`}>
                            {isOut?'Out of stock':`${avail} free`}
                          </span>
                          <span className="text-xs font-bold text-indigo-300">{Number(p.selling_price).toLocaleString()}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <Pagination page={productPage} total={filteredProducts.length} perPage={PRODUCTS_PER_PAGE} onChange={setProductPage}/>
              </>
            )}
          </div>
        </div>

        {/* ── Right: order items ── */}
        <div className="w-52 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {items.length===0?(
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <Package size={22} className="text-white/15 mb-2"/>
                <p className="text-white/30 text-xs">No items yet</p>
                <p className="text-white/20 text-[10px] mt-0.5">Click products to add</p>
              </div>
            ):items.map(item=>(
              <div key={item.item_id} className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{item.product_name}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{Number(item.unit_price).toLocaleString()} RWF/{item.unit_type}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={()=>{const p=products.find(x=>x.product_id===item.product_id); if(p) setQtyModal({product:p,currentQty:item.quantity,currentPrice:item.unit_price});}}
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-white/8 border border-white/10 rounded-lg hover:border-indigo-500/40 transition">
                    <span className="text-xs font-bold text-white">{item.quantity}</span>
                    <Edit3 size={9} className="text-white/30"/>
                  </button>
                  <button onClick={()=>handleRemove(item.product_id)} className="p-1 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-400/10 transition">
                    <Trash2 size={11}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
          {items.length>0&&(
            <div className="p-3 border-t border-white/10">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/50">Total</span>
                <span className="text-white font-bold">{Number(total).toLocaleString()} RWF</span>
              </div>
              <button onClick={()=>setShowCheckout(true)}
                className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-white text-xs font-medium transition flex items-center justify-center gap-1.5">
                <CreditCard size={12}/> Checkout
              </button>
            </div>
          )}
        </div>
      </div>

      {qtyModal&&order&&(
        <QtyModal
          product={qtyModal.product}
          currentQty={qtyModal.currentQty}
          currentPrice={qtyModal.currentPrice}
          maxQty={qtyModal.product.available_quantity}
          isLoading={orderAction.isPending}
          onConfirm={handleQtyConfirm}
          onClose={()=>setQtyModal(null)}/>
      )}
      {showCheckout&&order&&(
        <CheckoutModal
          order={order} items={items} total={total}
          onClose={()=>setShowCheckout(false)}
          onSuccess={(ref)=>{setShowCheckout(false);setSuccess(ref);}}/>
      )}
      {success&&(
        <SuccessModal
          saleRef={success}
          onClose={()=>{setSuccess(null);onClose();}}/>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function CartPage() {
  const { data, isLoading } = useOrders();
  const orders = (data?.orders??[]) as Order[];

  const [activeOrderId, setActiveOrderId] = useState<number|null>(null);
  const [showNewOrder,  setShowNewOrder]  = useState(false);
  const [orderPage,     setOrderPage]     = useState(1);
  const [orderSearch,   setOrderSearch]   = useState('');

  const filteredOrders = useMemo(() => {
    if (!orderSearch) return orders;
    const s = orderSearch.toLowerCase();
    return orders.filter(o => o.order_name.toLowerCase().includes(s));
  }, [orders, orderSearch]);

  const totalOrderPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const pagedOrders = filteredOrders.slice(
    (orderPage - 1) * ORDERS_PER_PAGE,
    orderPage * ORDERS_PER_PAGE
  );

  const handleOrderSearch = (v:string) => { setOrderSearch(v); setOrderPage(1); };

  return (
    <div className="min-h-screen flex flex-col" style={{background:'linear-gradient(135deg,#0d1020 0%,#141827 60%,#0f1628 100%)'}}>
      <div className="flex flex-1 overflow-hidden" style={{height:'calc(100vh - 64px)'}}>

        {/* ── Orders sidebar ── */}
        <div className="w-64 shrink-0 flex flex-col border-r border-white/10">
          <div className="px-4 py-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-white/60"/>
                <h1 className="text-sm font-semibold text-white">Active Orders</h1>
                {orders.length>0&&(
                  <span className="text-xs bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded-full">{orders.length}</span>
                )}
              </div>
            </div>
            <button onClick={()=>setShowNewOrder(true)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-white text-xs font-medium transition">
              <Plus size={14}/> New Order
            </button>
          </div>

          {orders.length > ORDERS_PER_PAGE && (
            <div className="px-3 pt-3">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30"/>
                <input value={orderSearch} onChange={e=>handleOrderSearch(e.target.value)}
                  placeholder="Search orders..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-3 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-white/20"/>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoading?(
              <div className="p-3 space-y-2">
                {Array(4).fill(0).map((_,i)=><Skeleton key={i} height={60} baseColor="#1f2937" highlightColor="#374151"/>)}
              </div>
            ):filteredOrders.length===0?(
              <div className="py-12 text-center">
                <ShoppingBag size={24} className="mx-auto mb-2 text-white/15"/>
                <p className="text-white/30 text-xs">{orderSearch?`No orders match "${orderSearch}"`:'No active orders'}</p>
                <p className="text-white/20 text-[10px] mt-0.5">{!orderSearch&&'Create one to start selling'}</p>
                {orderSearch&&<button onClick={()=>handleOrderSearch('')} className="text-indigo-400 text-xs mt-2 hover:text-indigo-300 transition">Clear</button>}
              </div>
            ):(
              <>
                {pagedOrders.map(o=>(
                  <button key={o.order_id} onClick={()=>setActiveOrderId(o.order_id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition ${
                      activeOrderId===o.order_id
                        ?'bg-indigo-500/15 border-indigo-500/40'
                        :'bg-white/3 border-white/5 hover:bg-white/5 hover:border-white/10'
                    }`}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white truncate flex-1">{o.order_name}</p>
                      <ChevronRight size={13} className="text-white/30 shrink-0 ml-1"/>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-white/30">{o.item_count} item{o.item_count!==1?'s':''}</span>
                      <span className="text-xs font-medium text-indigo-300">{Number(o.total).toLocaleString()} RWF</span>
                    </div>
                    <p className="text-[10px] text-white/20 mt-0.5">
                      {new Date(o.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                    </p>
                  </button>
                ))}
                <Pagination page={orderPage} total={filteredOrders.length} perPage={ORDERS_PER_PAGE} onChange={setOrderPage}/>
              </>
            )}
          </div>
        </div>

        {/* ── Order detail panel ── */}
        <div className="flex-1 overflow-hidden">
          {activeOrderId?(
            <OrderPanel
              key={activeOrderId}
              orderId={activeOrderId}
              onClose={()=>setActiveOrderId(null)}/>
          ):(
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-4">
                <ShoppingBag size={32} className="text-white/20"/>
              </div>
              <p className="text-white/40 text-sm font-medium mb-1">Select an order to manage it</p>
              <p className="text-white/20 text-xs mb-6">or create a new order to start selling</p>
              <button onClick={()=>setShowNewOrder(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-white text-sm font-medium transition">
                <Plus size={16}/> Create New Order
              </button>
            </div>
          )}
        </div>
      </div>

      {showNewOrder&&(
        <NewOrderModal
          onClose={()=>setShowNewOrder(false)}
          onCreated={(id)=>{setActiveOrderId(id);}}/>
      )}
    </div>
  );
}
