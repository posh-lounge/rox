"use client";
import React, { useState } from "react";
import {
  Plus, X, Loader2, Search, Edit3, Trash2, CreditCard,
  Smartphone, Banknote, CheckCircle, AlertTriangle,
  ShoppingBag, Package, ChevronRight, Users,
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

// ─── Hooks ───────────────────────────────────────────────────
const useOrders = () => useQuery({ queryKey:['orders'], queryFn:()=>apiPost<{orders:Order[]}>('/api/main/dashboard/create/order-action',{action:'list'}), refetchInterval:10000 });
const useOrderDetail = (id:number|null) => useQuery({ queryKey:['order',id], enabled:!!id, queryFn:()=>apiPost<{order:Order;items:OrderItem[];total:number}>('/api/main/dashboard/create/order-action',{action:'fetch_order',order_id:id}), refetchInterval:8000 });
const useAvailableStock = (orderId:number|null) => useQuery({ queryKey:['stock',orderId], queryFn:()=>apiPost<{products:Product[]}>('/api/main/dashboard/fetch/fetch-available-stock',{order_id:orderId}), refetchInterval:12000 });
const useOrderAction = () => { const qc=useQueryClient(); return useMutation({ mutationFn:(d:Record<string,unknown>)=>apiPost('/api/main/dashboard/create/order-action',d), onSuccess:(_,v:any)=>{ qc.invalidateQueries({queryKey:['orders']}); if(v.order_id||v.action) qc.invalidateQueries({queryKey:['order']}); qc.invalidateQueries({queryKey:['stock']}); } }); };
const useLoanSearch = (q:string) => useQuery({ queryKey:['loan-search',q], enabled:q.length>1, queryFn:()=>apiPost<{accounts:LoanAccount[]}>('/api/main/dashboard/create/loan-action',{action:'search',query:q}) });

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
            placeholder='e.g. "John Doe", "Walk-in 1", "Wholesale"' />
          <p className="text-xs text-white/30 mt-2">Give this order a name so you can identify the customer</p>
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
function QtyModal({ product, currentQty, maxQty, onConfirm, onClose, isLoading }:{ product:Product; currentQty:number; maxQty:number; onConfirm:(q:number)=>void; onClose:()=>void; isLoading:boolean; }) {
  const [input, setInput] = useState(currentQty>0?String(currentQty):"");
  const [err, setErr]     = useState("");
  const parsed  = parseFloat(input)||0;
  const isValid = parsed>0 && parsed<=maxQty;
  const onInput = (v:string) => { setInput(v); const n=parseFloat(v)||0; setErr(n>maxQty?`Only ${maxQty} ${product.unit_type} available`:""); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <p className="text-white font-semibold text-sm">{product.product_name}</p>
            <p className="text-white/40 text-xs">{maxQty} {product.unit_type} free · {Number(product.selling_price).toLocaleString()} RWF/{product.unit_type}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={16}/></button>
        </div>
        <div className="p-5">
          <input autoFocus type="number" value={input} onChange={e=>onInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&isValid&&onConfirm(parsed)}
            step={product.unit_type==='meter'?'0.1':'1'} min="0" max={maxQty}
            className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-2xl font-bold text-center focus:outline-none transition ${err?'border-red-500/60':isValid?'border-indigo-500':'border-white/10'}`}
            placeholder={product.unit_type==='meter'?'0.0':'0'} />
          {err&&<p className="text-xs text-red-400 mt-2 flex items-center gap-1"><AlertTriangle size={11}/>{err}</p>}
          <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${parsed>maxQty?'bg-red-500':parsed>maxQty*0.8?'bg-amber-500':'bg-indigo-500'}`} style={{width:`${Math.min(100,(parsed/maxQty)*100)}%`}}/>
          </div>
          <div className="flex justify-between text-xs text-white/20 mt-1"><span>0</span><span>{maxQty} {product.unit_type}</span></div>
          {isValid&&<div className="mt-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2.5 flex justify-between">
            <span className="text-indigo-300 text-sm">Subtotal</span>
            <span className="text-indigo-300 font-bold">{(parsed*product.selling_price).toLocaleString()} RWF</span>
          </div>}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition">Cancel</button>
          <button onClick={()=>onConfirm(parsed)} disabled={!isValid||isLoading}
            className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-40">
            {isLoading&&<Loader2 size={13} className="animate-spin"/>}{currentQty>0?'Update':'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Checkout Modal ──────────────────────────────────────────
function CheckoutModal({ order, items, total, onClose, onSuccess }:{ order:Order; items:OrderItem[]; total:number; onClose:()=>void; onSuccess:(ref:string,change:number)=>void; }) {
  const createSale = useCreateSale();
  const [method,  setMethod]   = useState<'cash'|'momo'|'pos'|'loan'>('cash');
  const [paid,    setPaid]     = useState('');
  const [discount,setDiscount] = useState('0');
  const [customer,setCustomer] = useState(order.order_name);
  const [phone,   setPhone]    = useState('');
  const [payRef,  setPayRef]   = useState('');
  const [loanQuery,setLoanQuery]=useState('');
  const [selectedLoan,setSelectedLoan]=useState<LoanAccount|null>(null);

  const { data: loanData } = useLoanSearch(loanQuery);
  const loanAccounts = loanData?.accounts ?? [];

  const disc    = parseFloat(discount)||0;
  const net     = total - disc;
  const paidAmt = parseFloat(paid)||0;
  const change  = Math.max(0, paidAmt - net);
  const canConfirm = method==='loan' ? !!selectedLoan : method==='cash' ? paidAmt>=net : true;

  const payMethods = [
    {id:'cash',label:'Cash',icon:<Banknote size={15}/>},
    {id:'momo',label:'MoMo',icon:<Smartphone size={15}/>},
    {id:'pos', label:'POS', icon:<CreditCard size={15}/>},
    {id:'loan',label:'Loan',icon:<ShoppingBag size={15}/>},
  ] as const;

  const handle = async () => {
    const res:any = await createSale.mutateAsync({
      order_id: order.order_id,
      items: items.map(i=>({product_id:i.product_id, quantity:i.quantity, unit_price:i.unit_price})),
      customer_name: customer||order.order_name,
      customer_phone: phone||null,
      payment_method: method,
      payment_reference: payRef||null,
      paid_amount: method==='cash'?paidAmt:net,
      discount_amount: disc,
      loan_id: method==='loan'?selectedLoan?.loan_id:null,
    });
    onSuccess(res.sale_ref, res.change_amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div><h2 className="text-white font-semibold">Checkout</h2><p className="text-xs text-white/40">{order.order_name}</p></div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Summary */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1.5">
            {items.map(i=>(
              <div key={i.item_id} className="flex justify-between text-sm">
                <span className="text-white/70">{i.product_name} × {i.quantity} {i.unit_type}</span>
                <span className="text-white font-medium">{Number(i.subtotal).toLocaleString()} RWF</span>
              </div>
            ))}
            <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
              <span className="text-white">Total</span>
              <span className="text-indigo-400">{net.toLocaleString()} RWF</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-white/40 mb-1 block">Customer Name</label>
              <input value={customer} onChange={e=>setCustomer(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"/></div>
            <div><label className="text-xs text-white/40 mb-1 block">Phone</label>
              <input value={phone} onChange={e=>setPhone(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20" placeholder="07..."/></div>
          </div>
          <div><label className="text-xs text-white/40 mb-1 block">Discount (RWF)</label>
            <input type="number" value={discount} onChange={e=>setDiscount(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"/></div>
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
                  <input value={loanQuery} onChange={e=>setLoanQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20" placeholder="Search by name or phone..."/>
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
          {(method==='momo'||method==='pos')&&(
            <div><label className="text-xs text-white/40 mb-1 block">{method==='momo'?'MoMo Transaction ID':'POS Receipt Number'}</label>
              <input value={payRef} onChange={e=>setPayRef(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-white/20" placeholder="Reference..."/></div>
          )}
          {method==='cash'&&(
            <>
              <div><label className="text-xs text-white/40 mb-1 block">Amount Received (RWF)</label>
                <input type="number" value={paid} onChange={e=>setPaid(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder={String(net)}/></div>
              {paidAmt>=net&&paidAmt>0&&(
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 flex justify-between">
                  <span className="text-emerald-300 text-sm">Change</span>
                  <span className="text-emerald-300 font-bold text-lg">{change.toLocaleString()} RWF</span>
                </div>
              )}
            </>
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

// ─── Success Modal ───────────────────────────────────────────
function SuccessModal({ saleRef,change,onClose }:{ saleRef:string;change:number;onClose:()=>void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4"><CheckCircle size={28} className="text-emerald-400"/></div>
        <h2 className="text-white font-bold text-xl mb-1">Sale Complete!</h2>
        <p className="text-white/40 text-sm mb-4">Ref: <span className="text-white font-mono">{saleRef}</span></p>
        {change>0&&<div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-4">
          <p className="text-emerald-300 text-sm">Change to give</p>
          <p className="text-emerald-300 font-bold text-2xl">{change.toLocaleString()} RWF</p>
        </div>}
        <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-medium transition">Done</button>
      </div>
    </div>
  );
}

// ─── Order Detail Panel ──────────────────────────────────────
function OrderPanel({ orderId, onClose }:{ orderId:number; onClose:()=>void }) {
  const { data, isLoading } = useOrderDetail(orderId);
  const { data: stockData } = useAvailableStock(orderId);
  const orderAction = useOrderAction();

  const order = data?.order;
  const items = (data?.items??[]) as OrderItem[];
  const total = data?.total??0;
  const products = (stockData?.products??[]) as Product[];

  const [search, setSearch]       = useState('');
  const [qtyModal, setQtyModal]   = useState<{product:Product;currentQty:number}|null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [success, setSuccess]     = useState<{sale_ref:string;change_amount:number}|null>(null);

  const filtered = products.filter(p=>
    !search||p.product_name.toLowerCase().includes(search.toLowerCase())
  ).slice(0,24);

  const itemQty = (pid:number) => items.find(i=>i.product_id===pid)?.quantity??0;
  const itemInOrder = items.find(i=>i.product_id===qtyModal?.product.product_id);

  const handleQtyConfirm = async (qty:number) => {
    if (!qtyModal) return;
    await orderAction.mutateAsync({ action:'add_item', order_id:orderId, product_id:qtyModal.product.product_id, quantity:qty });
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
          <button onClick={handleCancel} className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition" title="Cancel order"><Trash2 size={14}/></button>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition"><X size={14}/></button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: product search */}
        <div className="flex-1 overflow-y-auto p-3 border-r border-white/10">
          <div className="relative mb-3">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-white/20"/>
          </div>
          {isLoading?(
            <div className="grid grid-cols-2 gap-2">{Array(6).fill(0).map((_,i)=><div key={i} className="bg-white/5 rounded-xl p-3"><Skeleton height={40} baseColor="#1f2937" highlightColor="#374151"/></div>)}</div>
          ):(
            <div className="grid grid-cols-2 gap-2">
              {filtered.map(p=>{
                const inOrder = itemQty(p.product_id);
                const avail   = p.available_quantity;
                const isOut   = avail<=0 && inOrder===0;
                return (
                  <button key={p.product_id} onClick={()=>!isOut&&setQtyModal({product:p,currentQty:inOrder})} disabled={isOut}
                    className={`text-left p-3 rounded-xl border transition ${isOut?'opacity-40 cursor-not-allowed bg-white/3 border-white/5':inOrder>0?'bg-indigo-500/10 border-indigo-500/30 hover:border-indigo-500/50':'bg-white/5 border-white/10 hover:border-white/25'}`}>
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
          )}
        </div>

        {/* Right: order items */}
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
                  <button onClick={()=>{const p=products.find(x=>x.product_id===item.product_id); if(p) setQtyModal({product:p,currentQty:item.quantity});}}
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-white/8 border border-white/10 rounded-lg hover:border-indigo-500/40 transition">
                    <span className="text-xs font-bold text-white">{item.quantity}</span>
                    <Edit3 size={9} className="text-white/30"/>
                  </button>
                  <button onClick={()=>handleRemove(item.product_id)} className="p-1 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-400/10 transition"><Trash2 size={11}/></button>
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
              <button onClick={()=>setShowCheckout(true)} className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-white text-xs font-medium transition flex items-center justify-center gap-1.5">
                <CreditCard size={12}/> Checkout
              </button>
            </div>
          )}
        </div>
      </div>

      {qtyModal&&order&&(
        <QtyModal product={qtyModal.product} currentQty={qtyModal.currentQty}
          maxQty={qtyModal.product.available_quantity}
          isLoading={orderAction.isPending}
          onConfirm={handleQtyConfirm} onClose={()=>setQtyModal(null)}/>
      )}
      {showCheckout&&order&&(
        <CheckoutModal order={order} items={items} total={total}
          onClose={()=>setShowCheckout(false)}
          onSuccess={(ref,chg)=>{setShowCheckout(false);setSuccess({sale_ref:ref,change_amount:chg});}}/>
      )}
      {success&&<SuccessModal saleRef={success.sale_ref} change={success.change_amount} onClose={()=>{setSuccess(null);onClose();}}/>}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function CartPage() {
  const { data, isLoading } = useOrders();
  const orders = (data?.orders??[]) as Order[];
  const [activeOrderId, setActiveOrderId] = useState<number|null>(null);
  const [showNewOrder, setShowNewOrder]   = useState(false);
  const orderAction = useOrderAction();

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
                {orders.length>0&&<span className="text-xs bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded-full">{orders.length}</span>}
              </div>
            </div>
            <button onClick={()=>setShowNewOrder(true)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-white text-xs font-medium transition">
              <Plus size={14}/> New Order
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoading?(
              <div className="p-3 space-y-2">{Array(4).fill(0).map((_,i)=><Skeleton key={i} height={60} baseColor="#1f2937" highlightColor="#374151"/>)}</div>
            ):orders.length===0?(
              <div className="py-12 text-center">
                <ShoppingBag size={24} className="mx-auto mb-2 text-white/15"/>
                <p className="text-white/30 text-xs">No active orders</p>
                <p className="text-white/20 text-[10px] mt-0.5">Create one to start selling</p>
              </div>
            ):orders.map(o=>(
              <button key={o.order_id} onClick={()=>setActiveOrderId(o.order_id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border transition ${activeOrderId===o.order_id?'bg-indigo-500/15 border-indigo-500/40':'bg-white/3 border-white/5 hover:bg-white/5 hover:border-white/10'}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white truncate flex-1">{o.order_name}</p>
                  <ChevronRight size={13} className="text-white/30 shrink-0 ml-1"/>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-white/30">{o.item_count} item{o.item_count!==1?'s':''}</span>
                  <span className="text-xs font-medium text-indigo-300">{Number(o.total).toLocaleString()} RWF</span>
                </div>
                <p className="text-[10px] text-white/20 mt-0.5">{new Date(o.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Order detail ── */}
        <div className="flex-1 overflow-hidden">
          {activeOrderId?(
            <OrderPanel key={activeOrderId} orderId={activeOrderId} onClose={()=>setActiveOrderId(null)}/>
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
        <NewOrderModal onClose={()=>setShowNewOrder(false)} onCreated={(id)=>{setActiveOrderId(id);}}/>
      )}
    </div>
  );
}
