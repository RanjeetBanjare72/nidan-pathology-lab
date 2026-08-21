"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

function makeNo(prefix) {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${date}-${random}`;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [tests, setTests] = useState([]);
  const [bills, setBills] = useState([]);
  const [patientId, setPatientId] = useState("");
  const [selectedTests, setSelectedTests] = useState([]);
  const [priority, setPriority] = useState("Routine");
  const [search, setSearch] = useState("");
  const [testSearch, setTestSearch] = useState("");
  const [billId, setBillId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [p, t, b] = await Promise.all([
        supabase.from("patients").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("tests").select("*").eq("active", true).order("name"),
        supabase.from("bills").select("*").order("bill_date", { ascending: false }).limit(200),
      ]);
      const err = [p.error, t.error, b.error].find(Boolean);
      if (err) setMessage(err.message);
      setPatients(p.data || []);
      setTests(t.data || []);
      setBills(b.data || []);
      const saved = JSON.parse(localStorage.getItem("nidanPatient") || "null");
      const savedId = saved?.patient_id || saved?.patientId;
      if (savedId) setPatientId(String(savedId));
      setLoading(false);
    }
    load();
  }, []);

  const patient = patients.find((p) => String(p.patient_id) === String(patientId));
  const visiblePatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients.slice(0, 30);
    return patients.filter((p) => `${p.patient_id} ${p.name} ${p.mobile}`.toLowerCase().includes(q)).slice(0, 30);
  }, [patients, search]);
  const visibleTests = useMemo(() => {
    const q = testSearch.trim().toLowerCase();
    if (!q) return tests.slice(0, 80);
    return tests.filter((t) => `${t.name} ${t.short_name} ${t.category}`.toLowerCase().includes(q)).slice(0, 80);
  }, [tests, testSearch]);
  const patientBills = bills.filter((b) => String(b.patient_id) === String(patientId));

  function toggleTest(test) {
    setSelectedTests((current) => current.some((x) => String(x.id) === String(test.id))
      ? current.filter((x) => String(x.id) !== String(test.id))
      : [...current, test]);
  }

  async function createOrder(e) {
    e.preventDefault();
    setMessage("");
    if (!patient || !selectedTests.length) {
      setMessage("Patient aur kam se kam ek test select karein.");
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const visitNo = makeNo("NPL-VISIT");
      const { data: visit, error: visitError } = await supabase.from("visits").insert({
        patient_id: patient.patient_id,
        visit_no: visitNo,
        patient_name: patient.name,
        referring_doctor: patient.referring_doctor || patient.doctor || null,
        status: "Registered",
      }).select().single();
      if (visitError) throw visitError;

      const orderNo = makeNo("NPL-ORD");
      const { data: order, error: orderError } = await supabase.from("lab_orders").insert({
        order_no: orderNo,
        patient_id: patient.patient_id,
        visit_id: visit.id,
        bill_id: billId ? Number(billId) : null,
        priority,
        status: "Registered",
      }).select().single();
      if (orderError) throw orderError;

      const itemRows = selectedTests.map((t) => ({
        order_id: order.id,
        test_id: String(t.id),
        test_name: t.name,
        category: t.category || "Laboratory",
        sample_type: t.sample_type || "Blood",
        price: Number(t.price || 0),
        status: "Pending",
      }));
      const { error: itemError } = await supabase.from("lab_order_items").insert(itemRows);
      if (itemError) throw itemError;

      const sampleTypes = [...new Set(itemRows.map((x) => x.sample_type || "Blood"))];
      const sampleRows = sampleTypes.map((type) => ({
        order_id: order.id,
        sample_no: makeNo("NPL-SMP"),
        barcode: makeNo("NPL-BC"),
        sample_type: type,
        status: "Pending",
      }));
      const { error: sampleError } = await supabase.from("lab_samples").insert(sampleRows);
      if (sampleError) throw sampleError;

      localStorage.setItem("nidanCurrentOrder", JSON.stringify({ ...order, patient_name: patient.name }));
      setMessage(`Order ${orderNo} created successfully with ${selectedTests.length} test(s) and ${sampleRows.length} sample(s).`);
      setSelectedTests([]);
      setTimeout(() => router.push("/operations"), 500);
    } catch (err) {
      console.error(err);
      setMessage(err?.message || "Order create nahi hua.");
    } finally {
      setSaving(false);
    }
  }

  return <main style={{ minHeight: "100vh", background: "#f4f7f9", padding: 20, fontFamily: "Arial,sans-serif", color: "#17212b" }}>
    <div style={{ maxWidth: 1100, margin: "auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        <div><h1 style={{ margin: 0 }}>New Laboratory Order</h1><p style={{ margin: "5px 0", color: "#64748b" }}>Patient → Visit → Order → Tests → Sample</p></div>
        <div style={{ display: "flex", gap: 8 }}><button style={btn} onClick={() => router.push("/operations")}>Operations</button><button style={btn} onClick={() => router.push("/dashboard")}>Dashboard</button></div>
      </header>
      {message && <div style={{ ...card, background: "#fff7ed", color: "#9a3412" }}>{message}</div>}
      {loading ? <div style={card}>Loading master data...</div> : <form onSubmit={createOrder}>
        <section style={card}>
          <h3>1. Select Patient</h3>
          <input style={input} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient by ID, name or mobile" />
          <div style={{ display: "grid", gap: 6, marginTop: 10, maxHeight: 220, overflow: "auto" }}>
            {visiblePatients.map((p) => <button type="button" key={p.id} onClick={() => setPatientId(String(p.patient_id))} style={{ ...row, background: String(p.patient_id) === String(patientId) ? "#e7f7f3" : "#fff" }}><b>{p.patient_id}</b><span>{p.name || "-"}</span><small>{p.mobile || "No mobile"}</small></button>)}
          </div>
        </section>
        {patient && <section style={card}><h3>Patient Selected</h3><div style={{ fontSize: 14 }}><b>{patient.name}</b> • {patient.patient_id} • {patient.age ?? "-"} {patient.age_unit || "Years"} • {patient.gender || "-"}</div><div style={{ color: "#64748b", marginTop: 5 }}>{patient.mobile || "No mobile"}</div></section>}
        <section style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><h3 style={{ margin: 0 }}>2. Select Tests</h3><input style={{ ...input, maxWidth: 320 }} value={testSearch} onChange={(e) => setTestSearch(e.target.value)} placeholder="Search test" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 8, marginTop: 14 }}>
            {visibleTests.map((t) => { const active = selectedTests.some((x) => String(x.id) === String(t.id)); return <button type="button" key={t.id} onClick={() => toggleTest(t)} style={{ ...testCard, borderColor: active ? "#0f766e" : "#dbe4e8", background: active ? "#e7f7f3" : "#fff" }}><b>{active ? "✓ " : "＋ "}{t.name}</b><small>{t.category || "Laboratory"} • {t.sample_type || "Blood"}</small><strong>₹{Number(t.price || 0).toFixed(2)}</strong></button>; })}
          </div>
          <p style={{ color: "#64748b" }}>Selected: <b>{selectedTests.length}</b></p>
        </section>
        <section style={card}>
          <h3>3. Order Details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
            <label>Priority<select style={input} value={priority} onChange={(e) => setPriority(e.target.value)}><option>Routine</option><option>Urgent</option><option>STAT</option></select></label>
            <label>Optional Bill<select style={input} value={billId} onChange={(e) => setBillId(e.target.value)}><option value="">No bill linked</option>{patientBills.map((b) => <option key={b.id} value={b.id}>{b.bill_no} • ₹{Number(b.net_amount || 0).toFixed(2)} • {b.payment_status}</option>)}</select></label>
          </div>
        </section>
        <button disabled={saving} style={{ ...btn, background: "#087f68", color: "#fff", borderColor: "#087f68", width: "100%", padding: 14, fontSize: 15 }}>{saving ? "Creating Order..." : "Create Order + Generate Samples"}</button>
      </form>}
    </div>
  </main>;
}

const card = { background: "#fff", border: "1px solid #e1e8ed", borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 2px 10px rgba(0,0,0,.04)" };
const btn = { border: "1px solid #d5dee5", background: "#fff", borderRadius: 8, padding: "9px 13px", fontWeight: 700, cursor: "pointer" };
const input = { width: "100%", boxSizing: "border-box", padding: 10, border: "1px solid #d5dee5", borderRadius: 8, background: "#fff", marginTop: 5 };
const row = { border: "1px solid #e1e8ed", borderRadius: 8, padding: 10, display: "grid", gridTemplateColumns: "1fr 2fr 1fr", textAlign: "left", cursor: "pointer", gap: 8 };
const testCard = { border: "1px solid", borderRadius: 9, padding: 12, textAlign: "left", cursor: "pointer", display: "grid", gap: 5 };
