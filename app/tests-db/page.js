"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const CATEGORIES = ["All", "Hematology", "Biochemistry", "Serology", "Clinical Pathology", "Hormone", "Coagulation", "Microbiology", "Immunology", "Other"];

function priceFor(test, prices) {
  const row = prices.find((p) => String(p.test_id) === String(test.id) && p.is_active !== false);
  return Number(row?.price ?? test.price ?? 0);
}

export default function DatabaseTestSelectionPage() {
  const router = useRouter();
  const [tests, setTests] = useState([]);
  const [prices, setPrices] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError("");
      try {
        const [testsRes, pricesRes, paramsRes] = await Promise.all([
          supabase.from("tests").select("*").eq("active", true).order("name"),
          supabase.from("test_prices").select("*"),
          supabase.from("test_parameters").select("*").eq("active", true).order("sort_order"),
        ]);
        if (testsRes.error) throw testsRes.error;
        if (pricesRes.error) throw pricesRes.error;
        if (paramsRes.error) throw paramsRes.error;
        if (cancelled) return;
        setTests(testsRes.data || []); setPrices(pricesRes.data || []); setParameters(paramsRes.data || []);
        const saved = JSON.parse(localStorage.getItem("nidanSelectedTests") || "[]");
        const ids = new Set(Array.isArray(saved) ? saved.map((x) => String(x.id)) : []);
        setSelected((testsRes.data || []).filter((t) => ids.has(String(t.id))));
      } catch (e) { if (!cancelled) setError(e?.message || "Tests load nahi ho paaye."); }
      finally { if (!cancelled) setLoading(false); }
    }
    load(); return () => { cancelled = true; };
  }, []);

  const parameterMap = useMemo(() => {
    const map = new Map();
    for (const p of parameters) {
      const key = String(p.test_id); if (!map.has(key)) map.set(key, []);
      map.get(key).push({ id:p.id, name:p.parameter_name, parameter_name:p.parameter_name, unit:p.unit||"", min:p.min_value, max:p.max_value, min_value:p.min_value, max_value:p.max_value, range:p.reference_range||"", reference_range:p.reference_range||"", options:p.options||[], sort_order:p.sort_order||1, active:p.active!==false });
    }
    return map;
  }, [parameters]);

  const catalog = useMemo(() => tests.map((test) => ({ ...test, price:priceFor(test,prices), short:test.short_name||test.name, icon:"🧪", tests:parameterMap.get(String(test.id))||[] })), [tests,prices,parameterMap]);
  const filtered = useMemo(() => { const q=search.trim().toLowerCase(); return catalog.filter(t => (category==="All"||t.category===category) && (!q || t.name.toLowerCase().includes(q) || String(t.short||"").toLowerCase().includes(q) || String(t.category||"").toLowerCase().includes(q) || t.tests.some(p=>p.name.toLowerCase().includes(q)))); }, [catalog,search,category]);
  function toggle(test){ setSelected(old=>old.some(x=>String(x.id)===String(test.id))?old.filter(x=>String(x.id)!==String(test.id)):[...old,test]); }
  function continueBilling(){ if(!selected.length)return alert("Kam se kam ek test select karein."); localStorage.removeItem("nidanResults"); localStorage.setItem("nidanSelectedTests",JSON.stringify(selected)); localStorage.setItem("nidanBillTotal",String(selected.reduce((s,t)=>s+Number(t.price||0),0))); router.push("/billing"); }
  const total=selected.reduce((s,t)=>s+Number(t.price||0),0), parameterCount=selected.reduce((s,t)=>s+t.tests.length,0);
  return <div style={{minHeight:"100vh",background:"#f5f8fb",color:"#17212b",fontFamily:"Arial,sans-serif"}}><header style={{background:"#fff",borderBottom:"1px solid #e4e9ef",padding:"18px 24px",display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",position:"sticky",top:0,zIndex:10}}><div><div style={{fontSize:12,fontWeight:800,color:"#0b8f88",letterSpacing:1}}>NIDAN PATHOLOGY LAB</div><h1 style={{margin:"4px 0 0",fontSize:24}}>Select Laboratory Tests</h1><div style={{color:"#687582",fontSize:13}}>Live Test Master • Supabase database</div></div><button onClick={()=>router.push("/")} style={{border:"1px solid #d6dee7",background:"#fff",borderRadius:9,padding:"10px 14px",fontWeight:700}}>Dashboard</button></header><main style={{maxWidth:1250,margin:"0 auto",padding:24}}><div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search test or parameter..." style={{flex:"1 1 320px",minWidth:240,border:"1px solid #d6dee7",borderRadius:10,padding:"12px 14px",background:"#fff"}}/>{CATEGORIES.map(c=><button key={c} onClick={()=>setCategory(c)} style={{border:`1px solid ${category===c?"#0b9d95":"#d6dee7"}`,background:category===c?"#e8fbf9":"#fff",color:category===c?"#087f79":"#52606d",borderRadius:18,padding:"8px 12px",fontWeight:700}}>{c}</button>)}</div>{error&&<div style={{background:"#fff0f0",border:"1px solid #f0b7b7",color:"#a21d1d",padding:14,borderRadius:10,marginBottom:16}}>Database error: {error}</div>}{loading?<div style={{background:"#fff",borderRadius:12,padding:40,textAlign:"center"}}>Loading Test Master…</div>:<div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 330px",gap:18}}><section style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:14}}>{filtered.map(test=>{const active=selected.some(x=>String(x.id)===String(test.id));return <button key={test.id} onClick={()=>toggle(test)} style={{textAlign:"left",border:`2px solid ${active?"#0b9d95":"#e1e7ed"}`,background:"#fff",borderRadius:14,padding:17,cursor:"pointer",boxShadow:active?"0 5px 18px rgba(0,120,120,.12)":"0 2px 8px rgba(20,40,60,.04)"}}><div style={{display:"flex",justifyContent:"space-between",gap:10}}><strong style={{fontSize:16}}>{test.name}</strong><span style={{fontWeight:800,color:"#0b8f88"}}>{active?"✓":"+"}</span></div><div style={{color:"#6b7785",fontSize:12,marginTop:6}}>{test.category||"Other"} • {test.tests.length} parameters</div><div style={{marginTop:12,fontWeight:800}}>₹{test.price.toFixed(2)}</div></button>})}{!filtered.length&&<div style={{gridColumn:"1/-1",background:"#fff",borderRadius:12,padding:40,textAlign:"center"}}>No active test found.</div>}</section><aside style={{background:"#fff",border:"1px solid #e1e7ed",borderRadius:14,padding:18,height:"fit-content",position:"sticky",top:100}}><div style={{fontSize:12,fontWeight:800,color:"#71808d"}}>SELECTED</div><div style={{fontSize:30,fontWeight:900}}>{selected.length}</div><div style={{color:"#71808d",marginBottom:14}}>{parameterCount} parameters</div><div style={{maxHeight:330,overflow:"auto"}}>{selected.map(t=><div key={t.id} style={{padding:"9px 0",borderBottom:"1px solid #edf0f3",display:"flex",justifyContent:"space-between",gap:8}}><span>{t.name}</span><strong>₹{Number(t.price).toFixed(0)}</strong></div>)}</div><div style={{display:"flex",justifyContent:"space-between",padding:"15px 0",fontSize:18,fontWeight:900}}><span>Total</span><span>₹{total.toFixed(2)}</span></div><button onClick={continueBilling} style={{width:"100%",border:0,background:"#087f79",color:"#fff",borderRadius:10,padding:"13px 15px",fontWeight:800,cursor:"pointer"}}>Continue to Billing →</button></aside></div>}</main></div>;
}
