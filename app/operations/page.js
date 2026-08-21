"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const ORDER_STEPS = ["Registered", "Sample Collected", "Processing", "Ready", "Verified", "Released"];
const SAMPLE_STEPS = ["Pending", "Collected", "Received", "Processing", "Completed"];

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
function dateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function OperationsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [samples, setSamples] = useState([]);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("orders");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [paymentForm, setPaymentForm] = useState({ billId: "", amount: "", mode: "Cash", reference: "" });

  async function load() {
    setLoading(true);
    setMessage("");
    const [o, s, b, p] = await Promise.all([
      supabase.from("lab_orders").select("*").order("ordered_at", { ascending: false }).limit(100),
      supabase.from("lab_samples").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("bills").select("*").order("bill_date", { ascending: false }).limit(100),
      supabase.from("bill_payments").select("*").order("paid_at", { ascending: false }).limit(100),
    ]);
    const firstError = [o.error, s.error, b.error, p.error].find(Boolean);
    if (firstError) setMessage(firstError.message);
    setOrders(o.data || []); setSamples(s.data || []); setBills(b.data || []); setPayments(p.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateOrder(id, status) {
    setBusy(`order-${id}`); setMessage("");
    const patch = { status };
    if (status === "Sample Collected") patch.sample_collected_at = new Date().toISOString();
    if (status === "Verified") patch.verified_at = new Date().toISOString();
    if (status === "Released") patch.released_at = new Date().toISOString();
    const { error } = await supabase.from("lab_orders").update(patch).eq("id", id);
    if (error) setMessage(error.message); else setOrders(x => x.map(o => o.id === id ? { ...o, ...patch } : o));
    setBusy("");
  }

  async function updateSample(id, status) {
    setBusy(`sample-${id}`); setMessage("");
    const patch = { status };
    if (status === "Collected") patch.collected_at = new Date().toISOString();
    if (status === "Received") patch.received_at = new Date().toISOString();
    const { error } = await supabase.from("lab_samples").update(patch).eq("id", id);
    if (error) setMessage(error.message); else setSamples(x => x.map(s => s.id === id ? { ...s, ...patch } : s));
    setBusy("");
  }

  async function addPayment(e) {
    e.preventDefault();
    const bill = bills.find(b => String(b.id) === String(paymentForm.billId));
    const amount = Number(paymentForm.amount);
    if (!bill || !Number.isFinite(amount) || amount <= 0) { setMessage("Bill aur valid payment amount select karein."); return; }
    if (amount > Number(bill.balance || 0)) { setMessage("Payment balance se zyada nahi ho sakta."); return; }
    setBusy("payment"); setMessage("");
    const { error } = await supabase.from("bill_payments").insert({ bill_id: bill.id, amount, payment_mode: paymentForm.mode, reference_no: paymentForm.reference || null, lab_id: bill.lab_id || null });
    if (error) setMessage(error.message); else { setMessage(`Payment ${money(amount)} saved.`); setPaymentForm({ billId: "", amount: "", mode: "Cash", reference: "" }); await load(); }
    setBusy("");
  }

  const q = search.trim().toLowerCase();
  const visibleOrders = useMemo(() => orders.filter(o => `${o.order_no} ${o.patient_id} ${o.status} ${o.priority}`.toLowerCase().includes(q)), [orders, q]);
  const visibleSamples = useMemo(() => samples.filter(s => `${s.sample_no} ${s.barcode} ${s.sample_type} ${s.status}`.toLowerCase().includes(q)), [samples, q]);
  const visibleBills = useMemo(() => bills.filter(b => `${b.bill_no} ${b.patient_name} ${b.patient_id} ${b.payment_status}`.toLowerCase().includes(q)), [bills, q]);
  const pendingPayments = bills.filter(b => Number(b.balance || 0) > 0).length;

  return <main className="page"><style jsx>{`
    .page{min-height:100vh;background:#f4f7f9;color:#17212b;font-family:Arial,sans-serif;padding:20px}.wrap{max-width:1250px;margin:auto}.head{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}.head h1{margin:0;font-size:25px}.sub{color:#64748b;font-size:12px;margin-top:4px}.btn{border:1px solid #d5dee5;background:#fff;border-radius:8px;padding:9px 13px;font-weight:700;cursor:pointer}.btn.primary{background:#087f68;color:#fff;border-color:#087f68}.btn:disabled{opacity:.55}.search{width:100%;box-sizing:border-box;margin:16px 0;padding:12px;border:1px solid #d5dee5;border-radius:9px}.tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.tab.active{background:#0b3340;color:#fff;border-color:#0b3340}.card{background:#fff;border:1px solid #e1e8ed;border-radius:12px;padding:16px;margin-bottom:16px;box-shadow:0 2px 10px rgba(0,0,0,.04)}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}.stat{background:#fff;border:1px solid #e1e8ed;border-radius:10px;padding:14px}.stat b{font-size:22px}.label{font-size:10px;color:#64748b;text-transform:uppercase}.tableWrap{overflow:auto}.table{width:100%;border-collapse:collapse;min-width:780px;font-size:12px}.table th,.table td{padding:10px;border-bottom:1px solid #edf1f3;text-align:left}.table th{background:#f7fafb;font-size:10px;color:#64748b}.badge{display:inline-block;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:800;background:#eef6ff}.danger{color:#b91c1c}.steps{display:flex;gap:4px;flex-wrap:wrap}.step{border:1px solid #dbe4e8;border-radius:999px;background:#fff;padding:6px 9px;font-size:10px;cursor:pointer}.step.current{background:#e7f7f3;border-color:#8bd2c4;color:#056857;font-weight:800}.form{display:grid;grid-template-columns:2fr 1fr 1fr 2fr auto;gap:8px;align-items:end}.form label{font-size:10px;color:#64748b;font-weight:700}.form input,.form select{width:100%;box-sizing:border-box;padding:10px;border:1px solid #d5dee5;border-radius:8px;background:#fff}.empty{padding:25px;text-align:center;color:#64748b}@media(max-width:800px){.stats{grid-template-columns:repeat(2,1fr)}.form{grid-template-columns:1fr 1fr}.form button{grid-column:1/-1}}
  `}</style>
  <div className="wrap">
    <div className="head"><div><h1>Laboratory Operations</h1><div className="sub">NIDAN PATHOLOGY LAB • Phase 4</div></div><div style={{display:"flex",gap:8}}><button className="btn" onClick={() => router.push("/dashboard")}>Dashboard</button><button className="btn" onClick={load}>↻ Refresh</button></div></div>
    <input className="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order, patient, sample, bill or status..." />
    {message && <div className="card" style={{background:"#fff7ed",color:"#9a3412"}}>{message}</div>}
    <div className="stats"><div className="stat"><div className="label">Active Orders</div><b>{orders.filter(o=>!['Released','Cancelled'].includes(o.status)).length}</b></div><div className="stat"><div className="label">Samples In Process</div><b>{samples.filter(s=>['Received','Processing'].includes(s.status)).length}</b></div><div className="stat"><div className="label">Pending Bills</div><b>{pendingPayments}</b></div><div className="stat"><div className="label">Payments Recorded</div><b>{payments.length}</b></div></div>
    <div className="tabs"><button className={`btn tab ${tab==='orders'?'active':''}`} onClick={()=>setTab('orders')}>🧾 Orders</button><button className={`btn tab ${tab==='samples'?'active':''}`} onClick={()=>setTab('samples')}>🧪 Samples</button><button className={`btn tab ${tab==='billing'?'active':''}`} onClick={()=>setTab('billing')}>₹ Payments</button></div>

    {tab==='orders' && <div className="card"><h3>Order / Report Workflow</h3>{loading?<div className="empty">Loading...</div>:visibleOrders.length===0?<div className="empty">No laboratory orders found.</div>:<div className="tableWrap"><table className="table"><thead><tr><th>ORDER</th><th>PATIENT</th><th>PRIORITY</th><th>STATUS</th><th>ORDERED</th></tr></thead><tbody>{visibleOrders.map(o=><tr key={o.id}><td><b>{o.order_no||`#${o.id}`}</b></td><td>{o.patient_id||"-"}</td><td><span className="badge">{o.priority||"Routine"}</span></td><td><div className="steps">{ORDER_STEPS.map(s=><button key={s} className={`step ${o.status===s?'current':''}`} disabled={busy===`order-${o.id}`} onClick={()=>updateOrder(o.id,s)}>{s}</button>)}</div></td><td>{dateTime(o.ordered_at)}</td></tr>)}</tbody></table></div>}</div>}

    {tab==='samples' && <div className="card"><h3>Sample / Specimen Workflow</h3>{loading?<div className="empty">Loading...</div>:visibleSamples.length===0?<div className="empty">No samples found.</div>:<div className="tableWrap"><table className="table"><thead><tr><th>SAMPLE</th><th>BARCODE</th><th>TYPE</th><th>STATUS</th><th>COLLECTED</th></tr></thead><tbody>{visibleSamples.map(s=><tr key={s.id}><td><b>{s.sample_no||`#${s.id}`}</b></td><td>{s.barcode||"-"}</td><td>{s.sample_type||"-"}</td><td><div className="steps">{SAMPLE_STEPS.map(x=><button key={x} className={`step ${s.status===x?'current':''}`} disabled={busy===`sample-${s.id}`} onClick={()=>updateSample(s.id,x)}>{x}</button>)}</div></td><td>{dateTime(s.collected_at)}</td></tr>)}</tbody></table></div>}</div>}

    {tab==='billing' && <><div className="card"><h3>Record Payment</h3><form className="form" onSubmit={addPayment}><label>Bill<select value={paymentForm.billId} onChange={e=>setPaymentForm({...paymentForm,billId:e.target.value})}><option value="">Select bill</option>{visibleBills.filter(b=>Number(b.balance||0)>0).map(b=><option key={b.id} value={b.id}>{b.bill_no} • {b.patient_name||b.patient_id} • Balance {money(b.balance)}</option>)}</select></label><label>Amount<input type="number" min="0.01" step="0.01" value={paymentForm.amount} onChange={e=>setPaymentForm({...paymentForm,amount:e.target.value})} /></label><label>Mode<select value={paymentForm.mode} onChange={e=>setPaymentForm({...paymentForm,mode:e.target.value})}><option>Cash</option><option>UPI</option><option>Card</option><option>Bank Transfer</option></select></label><label>Reference<input value={paymentForm.reference} onChange={e=>setPaymentForm({...paymentForm,reference:e.target.value})} placeholder="Optional UTR / receipt ref" /></label><button className="btn primary" disabled={busy==='payment'}>Save Payment</button></form></div><div className="card"><h3>Bills & Payment Status</h3>{visibleBills.length===0?<div className="empty">No bills found.</div>:<div className="tableWrap"><table className="table"><thead><tr><th>BILL</th><th>PATIENT</th><th>NET</th><th>PAID</th><th>BALANCE</th><th>STATUS</th><th>DATE</th></tr></thead><tbody>{visibleBills.map(b=><tr key={b.id}><td><b>{b.bill_no}</b></td><td>{b.patient_name||b.patient_id||"-"}</td><td>{money(b.net_amount)}</td><td>{money(b.paid_amount ?? b.paid)}</td><td className={Number(b.balance)>0?'danger':''}>{money(b.balance)}</td><td><span className="badge">{b.payment_status||"Unpaid"}</span></td><td>{dateTime(b.bill_date)}</td></tr>)}</tbody></table></div>}</div></>}
  </div></main>;
}
