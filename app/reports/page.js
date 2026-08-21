"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { createReportRevision, finalizeReport, verifyReport } from "../../lib/report-lifecycle";

const LAB = {
  name: "NIDAN PATHOLOGY LAB",
  subtitle: "DIAGNOSTIC & PATHOLOGY LABORATORY",
  phone: "7987580004, 8889325233",
  address: "Gram/Singhanpur, Tehsil Sarangarh, District Sarangarh-Bilaigarh, Chhattisgarh",
};

function normalizeStatus(status) {
  const s = String(status || "draft").toLowerCase();
  if (s === "final" || s === "released") return "final";
  if (s === "verified" || s === "ready") return "verified";
  return "draft";
}
function statusLabel(status) { return { draft: "DRAFT", verified: "VERIFIED", final: "FINAL" }[status] || "DRAFT"; }
function reportData(report) { return report?.report_data && typeof report.report_data === "object" ? report.report_data : {}; }
function patient(report) {
  const p = reportData(report).patient;
  if (p && typeof p === "object") return p;
  return { name: report?.patient_name || "", patientId: report?.patient_number || report?.patient_id || "", age: report?.age || "", gender: report?.gender || "", mobile: report?.mobile || "", doctor: report?.doctor || report?.referring_doctor || "Self", collectionDate: report?.sample_date || "" };
}
function testsOf(report) { const d = reportData(report); const candidates = [d.tests, d.selectedTests, d.reportTests, report?.tests]; return candidates.find((x) => Array.isArray(x) && x.length) || []; }
function paramsOf(test) { const p = test?.parameters || test?.tests || test?.items || test?.investigations; return Array.isArray(p) ? p : []; }
function resultsOf(report) { const d = reportData(report); if (d.results && typeof d.results === "object" && !Array.isArray(d.results)) return d.results; if (report?.results && typeof report.results === "object" && !Array.isArray(report.results)) return report.results; return {}; }
function valueOf(results, test, p, pi, ti) {
  const tid = test?.id || test?.testId || test?.test_id || `test-${ti}`;
  const pn = p?.name || p?.parameterName || p?.parameter_name || p?.investigation || "";
  const keys = [p?.id, p?.parameterId, p?.parameter_id, `${tid}-${pn}-${pi}`, `${tid}-${pn}`, pn].filter(Boolean);
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(results, k) && results[k] !== "") return results[k];
  if (p && typeof p === "object" && p.result !== undefined && p.result !== "") return p.result;
  if (p && typeof p === "object" && p.value !== undefined && p.value !== "") return p.value;
  return "";
}
function limits(p, gender) { const g = String(gender || "").toLowerCase(); if ((g === "male" || g === "m") && p?.maleMin != null && p?.maleMax != null) return [Number(p.maleMin), Number(p.maleMax)]; if ((g === "female" || g === "f") && p?.femaleMin != null && p?.femaleMax != null) return [Number(p.femaleMin), Number(p.femaleMax)]; if (p?.min != null && p?.max != null) return [Number(p.min), Number(p.max)]; return [null, null]; }
function flag(value, p, gender) { if (value === "" || value == null) return ""; const n = Number(String(value).replace(/,/g, "")); if (!Number.isFinite(n)) return ""; const [min, max] = limits(p, gender); if (min != null && n < min) return "L"; if (max != null && n > max) return "H"; return ""; }
function ref(p, gender) { const g = String(gender || "").toLowerCase(); if ((g === "male" || g === "m") && p?.maleRange) return p.maleRange; if ((g === "female" || g === "f") && p?.femaleRange) return p.femaleRange; return p?.range || p?.referenceRange || p?.reference || (p?.min != null && p?.max != null ? `${p.min} - ${p.max}` : "-"); }
function fmtDate(v) { if (!v) return "-"; const d = new Date(v); return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }); }

export default function ReportsPage() {
  const [reports, setReports] = useState([]), [selected, setSelected] = useState(null), [search, setSearch] = useState(""), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  async function loadReports() { setLoading(true); const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false }); if (error) setMessage(error.message); else setReports(data || []); setLoading(false); }
  useEffect(() => { loadReports(); }, []);
  const filtered = useMemo(() => { const q = search.toLowerCase().trim(); if (!q) return reports; return reports.filter((r) => `${r.report_no || ""} ${patient(r).name || ""} ${patient(r).patientId || ""}`.toLowerCase().includes(q)); }, [reports, search]);
  function replaceReport(data) { setSelected(data); setReports((old) => old.map((r) => r.id === data.id ? data : r)); }

  async function verifySelected() {
    if (!selected) return; setBusy(true); setMessage("");
    try {
      const updated = await verifyReport(selected, { patient: patient(selected), selectedTests: testsOf(selected), results: resultsOf(selected), actor: null });
      replaceReport(updated);
    } catch (e) { setMessage(e?.message || "Report verification failed."); } finally { setBusy(false); }
  }

  async function finalizeSelected() {
    if (!selected) return; setBusy(true); setMessage("");
    try { replaceReport(await finalizeReport(selected, null)); }
    catch (e) { setMessage(e?.message || "Report finalization failed."); }
    finally { setBusy(false); }
  }

  async function createRevision() {
    if (!selected || normalizeStatus(selected.status) !== "final") return; setBusy(true); setMessage("");
    try {
      const revision = await createReportRevision(selected, reportData(selected), null, "Controlled correction");
      const { data, error } = await supabase.from("reports").select("*").eq("id", selected.id).single();
      if (error) throw error;
      replaceReport(data);
      setMessage(`Controlled revision R${revision.revision_no} created. Report is now DRAFT.`);
    } catch (e) { setMessage(e?.message || "Controlled revision failed."); }
    finally { setBusy(false); }
  }

  return <main className="reportsPage"><style jsx>{`
    .reportsPage{min-height:100vh;background:#f3f7f9;color:#17212b;padding:20px;font-family:Arial,sans-serif}.top,.previewHead{display:flex;justify-content:space-between;align-items:center;gap:12px}.top{margin-bottom:16px}.brand h1{margin:0;font-size:24px}.brand p{margin:4px 0;color:#64748b;font-size:12px}.controls,.actions{display:flex;gap:8px;flex-wrap:wrap}.controls input{padding:11px 13px;border:1px solid #d8e1e7;border-radius:8px;min-width:240px}.btn{border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:10px 14px;cursor:pointer;font-weight:700}.btn:disabled{opacity:.6;cursor:not-allowed}.primary{background:#008f86;color:#fff;border-color:#008f86}.dark{background:#0b3340;color:#fff;border-color:#0b3340}.warn{background:#fff7ed;border-color:#fed7aa}.card{background:#fff;border:1px solid #e3eaee;border-radius:12px;box-shadow:0 3px 12px #0b33400d;overflow:hidden}.tableWrap{overflow:auto}.table,.reportTable{width:100%;border-collapse:collapse;font-size:12px}.table th{background:#f7fafb;text-align:left;color:#52606d;font-size:10px;padding:12px;border-bottom:1px solid #e5e7eb}.table td{padding:12px;border-bottom:1px solid #edf1f3}.status{display:inline-block;padding:5px 8px;border-radius:999px;font-size:10px;font-weight:800}.draft{background:#fff7ed;color:#c2410c}.verified{background:#eff6ff;color:#1d4ed8}.final{background:#ecfdf5;color:#15803d}.preview{margin-top:20px;padding:18px}.previewHead{border-bottom:2px solid #0f8f86;padding-bottom:12px}.lab h2{margin:0}.lab p{margin:3px 0;font-size:11px;color:#64748b}.info{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#dce5e8;margin:16px 0}.info>div{background:#fff;padding:10px}.label{font-size:9px;color:#64748b;text-transform:uppercase}.value{font-weight:700;font-size:12px}.section{margin-top:16px}.section h3{background:#eaf7f5;padding:9px;margin:0;font-size:14px}.reportTable th,.reportTable td{padding:8px;border:1px solid #dbe4e7}.reportTable th{background:#f5f8f9}.abnormal{font-weight:800;color:#dc2626}.locked{margin-bottom:12px;padding:9px;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:8px;color:#166534;font-weight:700}.msg{margin:10px 0;padding:10px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;color:#9a3412;font-size:12px}@media(max-width:700px){.top,.previewHead{flex-direction:column;align-items:stretch}.controls{flex-direction:column}.controls input{min-width:0}.info{grid-template-columns:repeat(2,1fr)}}@media print{.top,.table,.msg,.previewHead .actions{display:none!important}.reportsPage{padding:0;background:#fff}.preview{box-shadow:none;border:0;margin:0}}
  `}</style>
    <div className="top"><div className="brand"><h1>Saved Reports</h1><p>{LAB.name} • Phase 3 Report Lifecycle</p></div><div className="controls"><input placeholder="Search patient / report no." value={search} onChange={(e)=>setSearch(e.target.value)}/><button className="btn" onClick={loadReports}>↻ Refresh</button></div></div>
    {message && <div className="msg">{message}</div>}
    <div className="card"><div className="tableWrap"><table className="table"><thead><tr><th>REPORT NO.</th><th>PATIENT</th><th>TESTS</th><th>STATUS</th><th>DATE</th><th>ACTIONS</th></tr></thead><tbody>{loading ? <tr><td colSpan="6">Loading…</td></tr> : filtered.map((r)=><tr key={r.id}><td><b>{r.report_no}</b></td><td><b>{patient(r).name || r.patient_name}</b><br/><small>{patient(r).patientId || r.patient_id || "-"}</small></td><td>{testsOf(r).map(t=>t?.short || t?.name || t?.testName).filter(Boolean).join(", ") || r.test_name || "-"}</td><td><span className={`status ${normalizeStatus(r.status)}`}>{statusLabel(normalizeStatus(r.status))}</span></td><td>{fmtDate(r.created_at)}</td><td><div className="actions"><button className="btn" onClick={()=>setSelected(r)}>View</button><button className="btn primary" onClick={()=>setSelected(r)}>Lifecycle</button></div></td></tr>)}</tbody></table></div></div>
    {selected && <section className="card preview"><div className="previewHead"><div className="lab"><h2>{LAB.name}</h2><p>{LAB.subtitle}</p><p>☎ {LAB.phone} • 📍 {LAB.address}</p></div><div className="actions"><button className="btn" onClick={()=>window.print()}>🖨 Print / PDF</button>{normalizeStatus(selected.status)==="draft" && <button className="btn primary" disabled={busy} onClick={verifySelected}>✓ Verify Report</button>}{normalizeStatus(selected.status)==="verified" && <button className="btn dark" disabled={busy} onClick={finalizeSelected}>🔒 Finalize Report</button>}{normalizeStatus(selected.status)==="final" && <button className="btn warn" disabled={busy} onClick={createRevision}>✏️ Controlled Revision</button>}</div></div>
      <div className="info"><div><span className="label">Patient</span><div className="value">{patient(selected).name || "-"}</div></div><div><span className="label">Patient ID</span><div className="value">{patient(selected).patientId || selected.patient_id || "-"}</div></div><div><span className="label">Age / Gender</span><div className="value">{patient(selected).age || "-"} / {patient(selected).gender || "-"}</div></div><div><span className="label">Report Status</span><div className={`status ${normalizeStatus(selected.status)}`}>{statusLabel(normalizeStatus(selected.status))}</div></div></div>
      {normalizeStatus(selected.status)==="final" && <div className="locked">🔒 FINAL REPORT LOCKED — changes require a controlled revision.</div>}
      {testsOf(selected).map((t,ti)=><div className="section" key={ti}><h3>{t?.name || t?.testName || "Laboratory Investigation"}</h3><table className="reportTable"><thead><tr><th>INVESTIGATION</th><th>RESULT</th><th>UNIT</th><th>REFERENCE RANGE</th><th>FLAG</th></tr></thead><tbody>{paramsOf(t).map((p,pi)=>{const v=valueOf(resultsOf(selected),t,p,pi,ti);const f=flag(v,p,patient(selected).gender);return <tr key={pi}><td>{p?.name || p?.parameterName || p?.parameter_name || "-"}</td><td className={f?"abnormal":""}>{v || "-"}</td><td>{p?.unit || p?.units || "-"}</td><td>{ref(p,patient(selected).gender)}</td><td>{f || "•"}</td></tr>})}</tbody></table></div>)}</section>}
  </main>;
}
