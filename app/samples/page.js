"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SamplesPage() {
  const [samples, setSamples] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function loadSamples() {
    setLoading(true);
    const { data, error } = await supabase
      .from("lab_samples")
      .select("id,sample_no,barcode,sample_type,status,collected_at,received_at,order_id,lab_orders(order_no,patient_id,priority,patients(name,patient_id))")
      .order("created_at", { ascending: false });
    if (error) setMessage(error.message);
    else setSamples(data || []);
    setLoading(false);
  }

  useEffect(() => { loadSamples(); }, []);

  const filtered = useMemo(() => samples.filter((s) => {
    const text = [s.sample_no, s.barcode, s.sample_type, s.status, s.lab_orders?.order_no, s.lab_orders?.patients?.name, s.lab_orders?.patients?.patient_id].join(" ").toLowerCase();
    return text.includes(query.toLowerCase());
  }), [samples, query]);

  async function updateSample(sample, status) {
    setBusy(sample.id);
    setMessage("");
    const now = new Date().toISOString();
    const patch = { status };
    if (status === "Collected") patch.collected_at = now;
    if (status === "Received") patch.received_at = now;
    const { error } = await supabase.from("lab_samples").update(patch).eq("id", sample.id);
    if (error) setMessage(error.message);
    else setMessage(`✓ ${sample.sample_no} → ${status}`);
    setBusy("");
    await loadSamples();
  }

  function printBarcode(sample) {
    const w = window.open("", "_blank", "width=500,height=300");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${sample.sample_no}</title><style>body{font-family:Arial;text-align:center;padding:30px}.code{font:700 28px monospace;letter-spacing:3px;border:2px solid #111;padding:15px;display:inline-block}.small{font-size:12px;margin-top:10px}</style></head><body><h2>NIDAN PATHOLOGY LAB</h2><div class="code">${sample.barcode || sample.sample_no}</div><div class="small">Sample: ${sample.sample_no} · ${sample.sample_type || "Sample"}</div><div class="small">Order: ${sample.lab_orders?.order_no || "-"}</div><script>window.print()</script></body></html>`);
    w.document.close();
  }

  return <main style={{minHeight:"100vh",background:"#f1f5f9",padding:"24px",fontFamily:"Arial,Helvetica,sans-serif",color:"#172033"}}>
    <div style={{maxWidth:1200,margin:"auto"}}>
      <header style={{background:"#092437",color:"white",padding:"18px 20px",borderRadius:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><b style={{fontSize:18}}>NIDAN — Sample Collection</b><div style={{fontSize:11,opacity:.8,marginTop:4}}>Collection · Receiving · Barcode</div></div><span>🧪 LAB OPERATIONS</span></header>
      <div style={{background:"white",padding:16,marginTop:14,borderRadius:12,border:"1px solid #e5eaf0"}}><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search sample / barcode / patient / order" style={{width:"100%",padding:12,border:"1px solid #d6dee8",borderRadius:8}}/></div>
      {message && <div style={{background:"#e9fbf5",padding:12,borderRadius:8,marginTop:12,fontSize:12}}>{message}</div>}
      <section style={{marginTop:14,display:"grid",gap:12}}>{loading ? <div style={{background:"white",padding:25,borderRadius:12}}>Loading samples…</div> : filtered.length===0 ? <div style={{background:"white",padding:25,borderRadius:12}}>No samples found.</div> : filtered.map((s)=><article key={s.id} style={{background:"white",padding:16,borderRadius:12,border:"1px solid #e5eaf0"}}><div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><b>{s.sample_no}</b><div style={{fontSize:12,marginTop:5}}>{s.lab_orders?.patients?.name || "Unknown patient"} · {s.lab_orders?.order_no || "-"}</div><div style={{fontSize:11,color:"#64748b",marginTop:4}}>Type: {s.sample_type || "-"} · Barcode: {s.barcode || "-"}</div></div><b>{s.status || "Pending"}</b></div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}><button onClick={()=>printBarcode(s)} style={{padding:"9px 12px",borderRadius:7,border:"1px solid #cbd5e1",background:"white"}}>🖨️ Print Barcode</button>{s.status!=="Collected"&&s.status!=="Received"&&s.status!=="Processing"&&s.status!=="Completed"&&<button disabled={busy===s.id} onClick={()=>updateSample(s,"Collected")} style={{padding:"9px 12px",border:0,borderRadius:7,background:"#0f9e90",color:"white"}}>✓ Collect Sample</button>}{s.status==="Collected"&&<button disabled={busy===s.id} onClick={()=>updateSample(s,"Received")} style={{padding:"9px 12px",border:0,borderRadius:7,background:"#2563eb",color:"white"}}>✓ Mark Received</button>}{s.status==="Received"&&<button disabled={busy===s.id} onClick={()=>updateSample(s,"Processing")} style={{padding:"9px 12px",border:0,borderRadius:7,background:"#7c3aed",color:"white"}}>▶ Processing</button>}{s.status==="Processing"&&<button disabled={busy===s.id} onClick={()=>updateSample(s,"Completed")} style={{padding:"9px 12px",border:0,borderRadius:7,background:"#059669",color:"white"}}>✓ Completed</button>}</div></article>)}</section>
    </div>
  </main>;
}
