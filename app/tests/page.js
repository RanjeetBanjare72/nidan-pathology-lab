"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const CATEGORIES = ["All", "Hematology", "Biochemistry", "Serology", "Clinical Pathology", "Hormone", "Coagulation", "Microbiology", "Immunology", "Other"];

const ICONS = {
  Hematology: "🩸",
  Biochemistry: "🧪",
  Serology: "🧬",
  "Clinical Pathology": "🔬",
  Hormone: "🧬",
  Coagulation: "🩸",
  Microbiology: "🦠",
  Immunology: "🧬",
  Other: "🧪",
};

function normalizeTest(test, parameters, prices) {
  const params = parameters
    .filter((p) => String(p.test_id) === String(test.id) && p.active !== false)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .map((p) => ({
      id: p.id,
      name: p.parameter_name,
      unit: p.unit || "",
      min: p.min_value,
      max: p.max_value,
      range: p.reference_range || "",
      options: p.options || [],
      active: p.active !== false,
    }));

  const priceRow = prices.find(
    (p) => String(p.test_id) === String(test.id) && p.is_active !== false
  );

  return {
    ...test,
    short: test.short_name || test.name,
    category: test.category || "Other",
    price: Number(priceRow?.price ?? test.price ?? 0),
    icon: ICONS[test.category] || "🧪",
    tests: params,
  };
}

export default function TestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMaster() {
      setLoading(true);
      setError("");
      try {
        const [testRes, parameterRes, priceRes] = await Promise.all([
          supabase.from("tests").select("*").eq("active", true).order("name"),
          supabase.from("test_parameters").select("*").eq("active", true).order("sort_order"),
          supabase.from("test_prices").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        ]);
        if (testRes.error) throw testRes.error;
        if (parameterRes.error) throw parameterRes.error;
        const master = (testRes.data || []).map((t) => normalizeTest(t, parameterRes.data || [], priceRes.data || []));
        setTests(master);
        const saved = JSON.parse(localStorage.getItem("nidanSelectedTests") || "[]");
        const ids = Array.isArray(saved) ? saved.map((x) => String(x.id)) : [];
        setSelected(master.filter((x) => ids.includes(String(x.id))));
      } catch (e) {
        console.error(e);
        setError(e?.message || "Test Master load nahi ho paaya.");
      } finally {
        setLoading(false);
      }
    }
    loadMaster();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tests.filter((t) => {
      if (category !== "All" && t.category !== category) return false;
      if (!q) return true;
      return [t.name, t.short, t.category, ...(t.tests || []).map((p) => p.name)]
        .join(" ").toLowerCase().includes(q);
    });
  }, [tests, search, category]);

  const total = selected.reduce((sum, t) => sum + Number(t.price || 0), 0);
  const parameterCount = selected.reduce((sum, t) => sum + (t.tests?.length || 0), 0);

  function toggle(test) {
    setSelected((prev) => prev.some((x) => String(x.id) === String(test.id))
      ? prev.filter((x) => String(x.id) !== String(test.id))
      : [...prev, test]);
  }

  function continueBilling() {
    if (!selected.length) return alert("Kam se kam ek test select karein.");
    localStorage.removeItem("nidanResults");
    localStorage.setItem("nidanSelectedTests", JSON.stringify(selected));
    localStorage.setItem("nidanBillTotal", String(total));
    router.push("/billing");
  }

  return (
    <div className="labApp">
      <aside className="sidebar">
        <div className="brand"><div className="brandLogo">N+</div><div><h2>NIDAN</h2><p>PATHOLOGY LAB</p></div></div>
        <div className="menuLabel">MAIN MENU</div>
        {[['⌂','Dashboard','/'],['♙','Patients','/patients'],['🧪','Test Selection','/tests'],['₹','Billing','/billing'],['✎','Result Entry','/results'],['▤','Reports','/reports']].map(([icon,label,path]) => <button key={path} className={path === '/tests' ? 'menu active' : 'menu'} onClick={() => router.push(path)}><span>{icon}</span>{label}</button>)}
      </aside>
      <main className="mainArea">
        <header className="topbar"><div><h3>Test Selection</h3><p>Tests are loaded directly from Test Master</p></div><div className="topRight"><span className="statusDot"/>NIDAN Lab System</div></header>
        <div className="content">
          <div className="pageHeading"><div><div className="smallTitle">STEP 2 OF 5</div><h1>Select Laboratory Tests</h1><p>Test Master में जो active test/parameter है वही यहाँ उपलब्ध होगा.</p></div><button className="backBtn" onClick={() => router.push('/patients')}>← Back to Patient</button></div>
          <div className="steps"><div className="step"><span>✓</span><div>Patient<small>Registered</small></div></div><div className="step activeStep"><span>2</span><div>Tests<small>Select Tests</small></div></div><div className="step"><span>3</span><div>Billing<small>Create Bill</small></div></div><div className="step"><span>4</span><div>Results<small>Enter Results</small></div></div><div className="step"><span>5</span><div>Report<small>Print / PDF</small></div></div></div>
          <section className="testWorkspace">
            <div className="testSelectionPanel">
              <div className="testSearchBox"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔎 Search test or parameter..." /></div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>{CATEGORIES.map((c) => <button key={c} type="button" onClick={() => setCategory(c)} style={{border:category===c?'1px solid #0fa8a0':'1px solid #dce3ea',background:category===c?'#e8fbf9':'#fff',color:category===c?'#07877f':'#53606f',padding:'8px 13px',borderRadius:20,cursor:'pointer',fontWeight:700,fontSize:12}}>{c}</button>)}</div>
              {error && <div style={{padding:16,background:'#fff3f3',border:'1px solid #f0b4b4',borderRadius:10,color:'#a33'}}>Test Master error: {error}</div>}
              {loading ? <div style={{padding:50,textAlign:'center'}}>Loading Test Master…</div> : <><div className="sectionHeading"><div><h2>Available Tests</h2><p>{filtered.length} tests/profiles • database source</p></div></div><div className="testCards">{filtered.map((t) => { const active=selected.some(x=>String(x.id)===String(t.id)); return <button key={t.id} type="button" className={active?'testCard selectedTest':'testCard'} onClick={() => toggle(t)}><div className="testCardTop"><span className="testEmoji">{t.icon}</span><span className="testCheck">{active?'✓':'+'}</span></div><h3>{t.name}</h3><p>{t.short}</p><small>{t.category} • {t.tests.length} parameters</small><strong>₹{t.price.toFixed(2)}</strong></button>; })}</div></>}
            </div>
            <aside className="selectedTestsPanel"><h2>Selected Tests</h2><p>{selected.length} test(s) • {parameterCount} parameters</p>{selected.length===0?<div style={{padding:'25px 0',color:'#6b7280'}}>No test selected.</div>:selected.map(t=><div key={t.id} style={{display:'flex',justifyContent:'space-between',gap:10,padding:'10px 0',borderBottom:'1px solid #eee'}}><div><strong>{t.name}</strong><small style={{display:'block'}}>{t.tests.length} parameters</small></div><button type="button" onClick={() => toggle(t)}>×</button></div>)}<div style={{marginTop:20,fontWeight:800,fontSize:18}}>Total: ₹{total.toFixed(2)}</div><button type="button" onClick={continueBilling} disabled={!selected.length} style={{marginTop:15,width:'100%',padding:14,border:0,borderRadius:10,background:selected.length?'#0fa8a0':'#ccd4dc',color:'#fff',fontWeight:800,cursor:selected.length?'pointer':'not-allowed'}}>Continue to Billing →</button></aside>
          </section>
        </div>
      </main>
    </div>
  );
}
