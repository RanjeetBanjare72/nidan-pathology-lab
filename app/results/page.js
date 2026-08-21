"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

/*
 * NIDAN Result Engine
 *
 * Calculated parameters are derived automatically from entered values.
 * The engine never guesses a missing input and never overwrites a manually
 * entered primary result. Calculated fields are read-only in the UI.
 * Always verify calculated results against the laboratory SOP/analyzer.
 */

function normalize(name = "") {
  return String(name)
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[./_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function num(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function round(value, digits = 2) {
  if (!Number.isFinite(value)) return "";
  const factor = 10 ** digits;
  return String(Math.round((value + Number.EPSILON) * factor) / factor);
}

function parameterName(p) {
  return p?.name || p?.testName || p?.investigation || "";
}

function keyFor(testId, p, index) {
  return `${testId}-${parameterName(p)}-${index}`;
}

function isCalculatedParameter(name = "") {
  const n = normalize(name);
  return [
    "mch",
    "mchc",
    "aec",
    "absolute eosinophil count",
    "anc",
    "absolute neutrophil count",
    "alc",
    "absolute lymphocyte count",
    "nlr",
    "neutrophil lymphocyte ratio",
    "p l ratio",
    "plateletcrit",
    "pct",
    "mentzer index",
    "globulin",
    "a g ratio",
    "albumin globulin ratio",
    "indirect bilirubin",
    "ast alt ratio",
    "sgot sgpt ratio",
    "vldl",
    "ldl",
    "non hdl cholesterol",
    "tc hdl ratio",
    "cholesterol hdl ratio",
    "eag",
    "estimated average glucose",
    "egfr",
    "estimated gfr",
    "total sperm count",
    "total sperm concentration",
  ].includes(n);
  return n;
}

function referenceFor(name, genderValue) {
  const n = normalize(name);
  const g = String(genderValue || "").toLowerCase();
  const female = ["female", "f", "महिला"].includes(g);
  const refs = {
    neutrophils: [40, 75, "%", "40 - 75"],
    lymphocytes: [20, 40, "%", "20 - 40"],
    eosinophils: [1, 6, "%", "1 - 6"],
    monocytes: [1, 10, "%", "1 - 10"],
    basophils: [0, 1, "%", "0 - 1"],
    mcv: [80, 100, "fL", "80 - 100"],
    mch: [27, 32, "pg", "27 - 32"],
    mchc: [32, 36, "g/dL", "32 - 36"],
    "rdw cv": [11.5, 14.5, "%", "11.5 - 14.5"],
    mpv: [7.5, 11.5, "fL", "7.5 - 11.5"],
    pdw: [9, 17, "%", "9 - 17"],
    pct: [0.15, 0.4, "%", "0.15 - 0.40"],
    fbs: [70, 99, "mg/dL", "70 - 99"],
    ppbs: [70, 140, "mg/dL", "70 - 140"],
    rbs: [70, 140, "mg/dL", "70 - 140"],
    urea: [15, 40, "mg/dL", "15 - 40"],
    creatinine: [0.6, 1.3, "mg/dL", "0.6 - 1.3"],
    sodium: [135, 145, "mEq/L", "135 - 145"],
    potassium: [3.5, 5.1, "mEq/L", "3.5 - 5.1"],
    chloride: [98, 107, "mEq/L", "98 - 107"],
    bun: [7, 20, "mg/dL", "7 - 20"],
    "total bilirubin": [0.2, 1.2, "mg/dL", "0.2 - 1.2"],
    "direct bilirubin": [0, 0.3, "mg/dL", "0 - 0.3"],
    ast: [0, 40, "U/L", "Up to 40"],
    alt: [0, 40, "U/L", "Up to 40"],
    alp: [44, 147, "U/L", "44 - 147"],
    "total protein": [6, 8.3, "g/dL", "6.0 - 8.3"],
    albumin: [3.5, 5, "g/dL", "3.5 - 5.0"],
    globulin: [2, 3.5, "g/dL", "2.0 - 3.5"],
    triglycerides: [0, 150, "mg/dL", "< 150"],
    ldl: [0, 100, "mg/dL", "< 100"],
    vldl: [5, 40, "mg/dL", "5 - 40"],
    hba1c: [4, 5.6, "%", "4.0 - 5.6"],
    t3: [80, 200, "ng/dL", "80 - 200"],
    t4: [5, 12, "µg/dL", "5 - 12"],
    tsh: [0.4, 4, "µIU/mL", "0.4 - 4.0"],
  };

  if (["hemoglobin", "haemoglobin", "hb"].includes(n)) {
    return female ? [12, 15, "g/dL", "12 - 15"] : [13, 17, "g/dL", "13 - 17"];
  }
  if (n.includes("total leucocyte") || n.includes("total leukocyte") || n === "tlc" || n.includes("wbc")) return [4000, 11000, "/cumm", "4000 - 11000"];
  if (["rbc count", "total rbc count"].includes(n)) return female ? [4, 5.5, "million/cumm", "4.0 - 5.5"] : [4.5, 6, "million/cumm", "4.5 - 6.0"];
  if (n.includes("pcv") || n.includes("haematocrit") || n.includes("hematocrit")) return female ? [36, 46, "%", "36 - 46"] : [40, 50, "%", "40 - 50"];
  if (n === "platelet count" || n === "platelets") return [1.5, 4.5, "Lac/cumm", "1.5 - 4.5"];
  if (n === "uric acid") return female ? [2.4, 6, "mg/dL", "2.4 - 6.0"] : [3.4, 7, "mg/dL", "3.4 - 7.0"];
  if (n === "esr") return [0, female ? 20 : 15, "mm/hr", `0 - ${female ? 20 : 15}`];
  if (n.includes("total cholesterol")) return [0, 200, "mg/dL", "< 200"];
  if (n.includes("hdl")) return [40, null, "mg/dL", "> 40"];
  if (n.includes("hba1c") || n.includes("glycated")) return refs.hba1c;
  if (n.includes("sgot") || n === "ast") return refs.ast;
  if (n.includes("sgpt") || n === "alt") return refs.alt;
  if (n.includes("alkaline phosphatase") || n === "alp") return refs.alp;
  if (n === "blood urea" || n === "urea") return refs.urea;
  if (n === "serum creatinine" || n === "creatinine") return refs.creatinine;
  return refs[n] || null;
}

function resolveParameter(p, genderValue) {
  const d = referenceFor(parameterName(p), genderValue);
  const min = p?.min ?? d?.[0] ?? null;
  const max = p?.max ?? d?.[1] ?? null;
  const unit = p?.unit || p?.units || d?.[2] || "";
  let range = p?.range || p?.reference || p?.referenceRange || d?.[3] || "";
  if (!range && min != null && max != null) range = `${min} - ${max}`;
  if (!range && max != null) range = `< ${max}`;
  if (!range && min != null) range = `> ${min}`;
  return { ...p, min, max, unit, range: range || "-" };
}

function findValue(selectedTests, values, names) {
  const wanted = names.map(normalize);
  for (const test of selectedTests) {
    const params = test.tests || test.parameters || [];
    for (let i = 0; i < params.length; i++) {
      const n = normalize(parameterName(params[i]));
      if (!wanted.some((w) => n === w || n.includes(w))) continue;
      const v = num(values[keyFor(test.id, params[i], i)]);
      if (v !== null) return v;
    }
  }
  return null;
}

function calculateValue(name, values, selectedTests, patient) {
  const n = normalize(name);
  const hb = findValue(selectedTests, values, ["hemoglobin", "haemoglobin", "hb"]);
  const rbc = findValue(selectedTests, values, ["rbc count", "total rbc count"]);
  const hct = findValue(selectedTests, values, ["pcv hematocrit", "pcv haematocrit", "hematocrit", "haematocrit", "pcv"]);
  const tlc = findValue(selectedTests, values, ["total leucocyte count", "total leukocyte count", "tlc", "wbc"]);
  const neut = findValue(selectedTests, values, ["neutrophils", "neutrophil"]);
  const lymph = findValue(selectedTests, values, ["lymphocytes", "lymphocyte"]);
  const eos = findValue(selectedTests, values, ["eosinophils", "eosinophil"]);
  const plateletsLac = findValue(selectedTests, values, ["platelet count", "platelets"]);
  const mpv = findValue(selectedTests, values, ["mpv"]);
  const totalProtein = findValue(selectedTests, values, ["total protein"]);
  const albumin = findValue(selectedTests, values, ["albumin"]);
  const totalBili = findValue(selectedTests, values, ["total bilirubin"]);
  const directBili = findValue(selectedTests, values, ["direct bilirubin"]);
  const ast = findValue(selectedTests, values, ["ast", "sgot"]);
  const alt = findValue(selectedTests, values, ["alt", "sgpt"]);
  const tc = findValue(selectedTests, values, ["total cholesterol"]);
  const hdl = findValue(selectedTests, values, ["hdl"]);
  const tg = findValue(selectedTests, values, ["triglycerides", "triglyceride"]);
  const a1c = findValue(selectedTests, values, ["hba1c", "glycated hemoglobin"]);
  const creat = findValue(selectedTests, values, ["serum creatinine", "creatinine"]);
  const age = num(patient?.age);
  const sex = String(patient?.gender || patient?.sex || "").toLowerCase();

  if (n === "mch" && hb !== null && rbc > 0) return round((hb * 10) / rbc, 2);
  if (n === "mchc" && hb !== null && hct > 0) return round((hb * 100) / hct, 2);
  if (["aec", "absolute eosinophil count"].includes(n) && tlc !== null && eos !== null) return round((tlc * eos) / 100, 0);
  if (["anc", "absolute neutrophil count"].includes(n) && tlc !== null && neut !== null) return round((tlc * neut) / 100, 0);
  if (["alc", "absolute lymphocyte count"].includes(n) && tlc !== null && lymph !== null) return round((tlc * lymph) / 100, 0);
  if (["nlr", "neutrophil lymphocyte ratio"].includes(n) && neut !== null && lymph > 0) return round(neut / lymph, 2);
  if (["mentzer index"].includes(n) && rbc > 0 && findValue(selectedTests, values, ["mcv"]) !== null) return round(findValue(selectedTests, values, ["mcv"]) / rbc, 2);
  if (["pct", "plateletcrit"].includes(n) && plateletsLac !== null && mpv !== null) return round(((plateletsLac * 100) * mpv) / 10000, 2);
  if (n === "globulin" && totalProtein !== null && albumin !== null) return round(totalProtein - albumin, 2);
  if (["a g ratio", "albumin globulin ratio"].includes(n) && albumin !== null && totalProtein !== null && totalProtein - albumin > 0) return round(albumin / (totalProtein - albumin), 2);
  if (n === "indirect bilirubin" && totalBili !== null && directBili !== null) return round(totalBili - directBili, 2);
  if (["ast alt ratio", "sgot sgpt ratio"].includes(n) && ast !== null && alt > 0) return round(ast / alt, 2);
  if (n === "vldl" && tg !== null && tg >= 0 && tg < 400) return round(tg / 5, 2);
  if (n === "ldl" && tc !== null && hdl !== null && tg !== null && tg < 400) return round(tc - hdl - tg / 5, 2);
  if (n === "non hdl cholesterol" && tc !== null && hdl !== null) return round(tc - hdl, 2);
  if (["tc hdl ratio", "cholesterol hdl ratio"].includes(n) && tc !== null && hdl > 0) return round(tc / hdl, 2);
  if (["eag", "estimated average glucose"].includes(n) && a1c !== null) return round(28.7 * a1c - 46.7, 0);
  if (["egfr", "estimated gfr"].includes(n) && creat !== null && age !== null && age > 0 && ["male", "female", "m", "f"].includes(sex)) {
    const female = sex === "female" || sex === "f";
    const k = female ? 0.7 : 0.9;
    const alpha = female ? -0.241 : -0.302;
    const minPart = Math.min(creat / k, 1) ** alpha;
    const maxPart = Math.max(creat / k, 1) ** -1.2;
    const sexFactor = female ? 1.012 : 1;
    return round(142 * minPart * maxPart * (0.9938 ** age) * sexFactor, 0);
  }
  return null;
}

function calculateAll(values, selectedTests, patient) {
  const next = { ...values };
  for (const test of selectedTests) {
    const params = test.tests || test.parameters || [];
    for (let i = 0; i < params.length; i++) {
      const name = parameterName(params[i]);
      if (!isCalculatedParameter(name)) continue;
      const calculated = calculateValue(name, next, selectedTests, patient);
      const key = keyFor(test.id, params[i], i);
      if (calculated !== null && calculated !== "") next[key] = calculated;
      else if (next[key] !== undefined && next[key] !== "") delete next[key];
    }
  }
  return next;
}

export default function ResultsPage() {
  const router = useRouter();
  const [patient, setPatient] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
  const [results, setResults] = useState({});
  const [activeTest, setActiveTest] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("nidanPatient") || "{}");
      const t = JSON.parse(localStorage.getItem("nidanSelectedTests") || "[]");
      const r = JSON.parse(localStorage.getItem("nidanResults") || "{}");
      const safeTests = Array.isArray(t) ? t : [];
      setPatient(p && typeof p === "object" ? p : {});
      setSelectedTests(safeTests);
      setResults(calculateAll(r && typeof r === "object" ? r : {}, safeTests, p || {}));
      if (safeTests.length) setActiveTest(String(safeTests[0].id));
    } catch (e) {
      console.error("NIDAN Result Load Error", e);
    }
  }, []);

  const currentTest = useMemo(() => selectedTests.find((t) => String(t.id) === String(activeTest)), [selectedTests, activeTest]);
  const currentParameters = currentTest ? currentTest.tests || currentTest.parameters || [] : [];

  function updateResult(testId, p, index, value) {
    const name = parameterName(p);
    if (isCalculatedParameter(name)) return;
    const key = keyFor(testId, p, index);
    setResults((old) => calculateAll({ ...old, [key]: value }, selectedTests, patient));
  }

  function getFlag(value, p) {
    if (value === "" || value == null) return "";
    const r = resolveParameter(p, patient?.gender || patient?.sex);
    const n = num(value);
    if (n === null) return "";
    if (r.min != null && n < Number(r.min)) return "LOW";
    if (r.max != null && n > Number(r.max)) return "HIGH";
    if (r.min != null || r.max != null) return "NORMAL";
    return "";
  }

  function getOptions(p) {
    if (Array.isArray(p?.options) && p.options.length) return p.options;
    const n = normalize(parameterName(p));
    if (n.includes("hiv") || n.includes("hbsag") || n.includes("hcv")) return ["Non-Reactive", "Reactive"];
    if (n === "albumin" || n === "sugar") return ["Nil", "Trace", "+", "++", "+++", "++++"];
    if (n === "colour" || n === "color") return ["Pale Yellow", "Yellow", "Dark Yellow", "Straw", "Colourless", "Other"];
    if (n === "appearance") return ["Clear", "Slightly Turbid", "Turbid"];
    return [];
  }

  function buildReportData(realPatientId = null) {
    return {
      patient_id: realPatientId || null,
      patient_number: patient?.patientId || patient?.patient_id_number || patient?.patient_number || patient?.patientNumber || patient?.number || "",
      patient_name: patient?.name || "",
      age: patient?.age ?? null,
      gender: patient?.gender || patient?.sex || "",
      referring_doctor: patient?.doctor || patient?.refDoctor || patient?.referring_doctor || "",
      tests: selectedTests.map((t) => ({
        id: t.id,
        name: t.name || t.short || "",
        short: t.short || t.name || "",
        category: t.category || "",
        price: t.price || t.rate || 0,
        parameters: t.tests || t.parameters || [],
      })),
      results,
      status: "Pending",
    };
  }

  async function resolveRealPatientId() {
    const saved = localStorage.getItem("nidanDatabasePatientId");
    const directIds = [saved, patient?.id, patient?.patient_id, patient?.databaseId, patient?.database_id].filter(Boolean);
    for (const id of [...new Set(directIds.map(String))]) {
      try {
        const { data, error } = await supabase.from("patients").select("id").eq("id", id).maybeSingle();
        if (!error && data?.id) {
          localStorage.setItem("nidanDatabasePatientId", String(data.id));
          return data.id;
        }
      } catch {}
    }
    const numbers = [patient?.patientId, patient?.patient_id_number, patient?.patient_number, patient?.patientNumber, patient?.number].filter(Boolean).map(String);
    for (const column of ["patient_id", "patient_number", "registration_no", "registration_number", "patient_no", "number"]) {
      for (const value of [...new Set(numbers)]) {
        try {
          const { data, error } = await supabase.from("patients").select("id").eq(column, value).limit(1).maybeSingle();
          if (!error && data?.id) {
            localStorage.setItem("nidanDatabasePatientId", String(data.id));
            return data.id;
          }
        } catch {}
      }
    }
    return null;
  }

  async function saveReportToSupabase() {
    const realPatientId = await resolveRealPatientId();
    const report = buildReportData(realPatientId);
    let existing = null;
    if (realPatientId) {
      const found = await supabase.from("reports").select("*").eq("patient_id", realPatientId).order("created_at", { ascending: false }).limit(1);
      if (!found.error && found.data?.length) existing = found.data[0];
    }
    if (existing?.id) {
      const { data, error } = await supabase.from("reports").update({ ...report, updated_at: new Date().toISOString() }).eq("id", existing.id).select().single();
      if (error) throw error;
      if (data?.id) localStorage.setItem("nidanReportId", String(data.id));
      return data;
    }
    const { data, error } = await supabase.from("reports").insert([report]).select().single();
    if (error) throw error;
    if (data?.id) localStorage.setItem("nidanReportId", String(data.id));
    if (realPatientId) localStorage.setItem("nidanDatabasePatientId", String(realPatientId));
    return data;
  }

  async function saveResults(showMessage = true) {
    if (saving) return false;
    setSaving(true);
    try {
      const calculated = calculateAll(results, selectedTests, patient);
      setResults(calculated);
      localStorage.setItem("nidanResults", JSON.stringify(calculated));
      localStorage.setItem("nidanPatient", JSON.stringify(patient));
      localStorage.setItem("nidanSelectedTests", JSON.stringify(selectedTests));
      let report;
      try {
        report = await saveReportToSupabase();
      } catch (error) {
        localStorage.setItem("nidanPendingReport", JSON.stringify({ ...buildReportData(null), results: calculated, savedAt: new Date().toISOString() }));
        alert("Result local me save ho gaya, lekin Supabase report save nahi hui.\n\n" + error.message);
        return false;
      }
      localStorage.setItem("nidanPendingReport", JSON.stringify({ ...buildReportData(report?.patient_id || null), results: calculated, reportId: report?.id || localStorage.getItem("nidanReportId"), savedAt: new Date().toISOString() }));
      if (showMessage) {
        setSavedMessage("✓ Results saved — Calculations updated");
        setTimeout(() => setSavedMessage(""), 2500);
      }
      return true;
    } catch (error) {
      alert("Result save nahi ho paya.\n\n" + error.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  function missingResults() {
    const missing = [];
    selectedTests.forEach((test) => {
      const params = test.tests || test.parameters || [];
      params.forEach((p, i) => {
        const value = results[keyFor(test.id, p, i)];
        if (value == null || String(value).trim() === "") missing.push({ test: test.short || test.name || "Test", parameter: parameterName(p) || "Parameter" });
      });
    });
    return missing;
  }

  async function continueReport() {
    if (!selectedTests.length) return alert("Koi test selected nahi hai.");
    const missing = missingResults();
    if (missing.length) {
      const text = missing.slice(0, 5).map((x) => `${x.test}: ${x.parameter}`).join("\n");
      const more = missing.length > 5 ? `\nAur ${missing.length - 5} result blank hain.` : "";
      if (!window.confirm(`${missing.length} result blank hain:\n\n${text}${more}\n\nKya phir bhi Final Report banana hai?`)) return;
    }
    const ok = await saveResults(false);
    if (ok) router.push("/report");
  }

  function previousTest() {
    const index = selectedTests.findIndex((t) => String(t.id) === String(activeTest));
    if (index > 0) setActiveTest(String(selectedTests[index - 1].id));
  }

  async function nextTest() {
    const index = selectedTests.findIndex((t) => String(t.id) === String(activeTest));
    if (index >= 0 && index < selectedTests.length - 1) setActiveTest(String(selectedTests[index + 1].id));
    else await continueReport();
  }

  const totalParameters = selectedTests.reduce((n, t) => n + (t.tests || t.parameters || []).length, 0);
  const completedResults = selectedTests.reduce((total, t) => total + (t.tests || t.parameters || []).filter((p, i) => {
    const v = results[keyFor(t.id, p, i)];
    return v != null && String(v).trim() !== "";
  }).length, 0);
  const progress = totalParameters ? Math.round((completedResults / totalParameters) * 100) : 0;
  const currentIndex = selectedTests.findIndex((t) => String(t.id) === String(activeTest));

  const renderInput = (p, i) => {
    const key = keyFor(currentTest.id, p, i);
    const value = results[key] ?? "";
    const calculated = isCalculatedParameter(parameterName(p));
    const options = getOptions(p);
    if (options.length) {
      return <select value={value} onChange={(e) => updateResult(currentTest.id, p, i, e.target.value)} disabled={calculated}><option value="">Select</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
    }
    return <input value={value} onChange={(e) => updateResult(currentTest.id, p, i, e.target.value)} placeholder={calculated ? "Auto calculated" : "Enter result"} readOnly={calculated} className={calculated ? "calculated" : ""} />;
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><div className="logo">N+</div><div><b>NIDAN</b><small>PATHOLOGY LAB</small></div></div>
        <div className="label">MAIN MENU</div>
        {[["⌂","Dashboard","/"],["+","New Patient","/new-patient"],["♙","Patients","/patients"],["🧪","Test Selection","/tests"],["₹","Billing","/billing"],["✎","Result Entry",null],["▤","Reports","/reports"]].map(([icon,name,path]) => <button key={name} className={`menu ${!path ? "active" : ""}`} onClick={() => path && router.push(path)}><span>{icon}</span>{name}</button>)}
        <div className="label manage">MANAGEMENT</div>
        {[["⚙","Test Master","/test-master"],["♟","Doctors","/doctors"],["⚙","Settings","/settings"]].map(([icon,name,path]) => <button key={name} className="menu" onClick={() => router.push(path)}><span>{icon}</span>{name}</button>)}
      </aside>

      <main className="main">
        <header className="top"><div><b>Result Entry</b><small>Automatic laboratory calculation engine enabled</small></div><span className="online">● NIDAN Lab System</span></header>
        <div className="content">
          <div className="heading"><div><em>STEP 4 OF 5</em><h1>Laboratory Results</h1><p>Primary values enter karein — supported calculated values automatically fill hongi.</p></div><button className="back" onClick={() => router.push("/billing")}>← Back to Billing</button></div>

          <div className="calcBanner"><b>⚡ Auto Calculation ON</b><span>MCH, MCHC, ANC, ALC, AEC, NLR, PCT, Globulin, A/G, bilirubin, lipid calculations and other supported formulas update automatically.</span></div>

          <div className="steps">{["Patient","Tests","Billing","Results","Report"].map((x,i) => <div key={x} className={`step ${i === 3 ? "current" : ""}`}><span>{i < 3 ? "✓" : i + 1}</span><div>{x}<small>{i === 3 ? "Enter Results" : i === 4 ? "Print / PDF" : "Completed"}</small></div></div>)}</div>

          <div className="patient"><div><small>PATIENT ID</small><b>{patient?.patientId || patient?.patient_id_number || patient?.patient_number || patient?.number || patient?.id || "-"}</b></div><div><small>PATIENT NAME</small><b>{patient?.name || "-"}</b></div><div><small>AGE / SEX</small><b>{patient?.age || "-"} / {patient?.gender || patient?.sex || "-"}</b></div><div><small>REF. DOCTOR</small><b>{patient?.doctor || patient?.refDoctor || patient?.referring_doctor || "-"}</b></div></div>

          <div className="progressBox"><div><div><b>Result Progress</b><small>{completedResults} of {totalParameters} parameters entered</small></div><strong>{progress}%</strong></div><div className="track"><div style={{width: `${progress}%`}} /></div></div>
          {savedMessage && <div className="saved">{savedMessage}</div>}

          <div className="workspace">
            <aside className="testNav"><b>Selected Tests</b>{selectedTests.map((t,i) => <button key={t.id} className={`navTest ${String(activeTest) === String(t.id) ? "selected" : ""}`} onClick={() => setActiveTest(String(t.id))}><span>{i+1}</span><div><b>{t.short || t.name}</b><small>{(t.tests || t.parameters || []).length} parameters</small></div></button>)}</aside>

            <section className="card">
              {!currentTest ? <div className="empty"><h2>No Test Selected</h2><button onClick={() => router.push("/tests")}>Select Tests</button></div> : <>
                <div className="cardHead"><div><em>INVESTIGATION</em><h2>{currentTest.name || currentTest.short}</h2><p>Enter primary results. Calculated parameters are automatic.</p></div><span>{currentParameters.length} Parameters</span></div>
                <div className="desktopTable"><table><thead><tr><th>INVESTIGATION</th><th>RESULT</th><th>UNIT</th><th>REFERENCE RANGE</th><th>FLAG</th></tr></thead><tbody>
                  {currentParameters.map((p,i) => {
                    const value = results[keyFor(currentTest.id,p,i)] ?? "";
                    const r = resolveParameter(p, patient?.gender || patient?.sex);
                    const flag = getFlag(value,p);
                    const calculated = isCalculatedParameter(parameterName(p));
                    return <tr key={keyFor(currentTest.id,p,i)} className={calculated ? "calcRow" : ""}><td><b>{parameterName(p) || "Investigation"}</b>{calculated && <small className="autoTag">AUTO</small>}</td><td>{renderInput(p,i)}</td><td>{r.unit || "-"}</td><td>{r.range || "-"}</td><td>{flag && <span className={`flag ${flag.toLowerCase()}`}>{flag}</span>}</td></tr>;
                  })}
                </tbody></table></div>

                <div className="mobileParams">{currentParameters.map((p,i) => {
                  const value = results[keyFor(currentTest.id,p,i)] ?? "";
                  const r = resolveParameter(p, patient?.gender || patient?.sex);
                  const flag = getFlag(value,p);
                  const calculated = isCalculatedParameter(parameterName(p));
                  return <div className={`param ${calculated ? "calcRow" : ""}`} key={keyFor(currentTest.id,p,i)}><b className="paramName"><span>{i+1}</span>{parameterName(p)} {calculated && <small className="autoTag">AUTO</small>}</b>{renderInput(p,i)}<div className="info"><div><small>Unit</small><b>{r.unit || "-"}</b></div><div><small>Reference</small><b>{r.range || "-"}</b></div><div><small>Flag</small><b>{flag || "-"}</b></div></div></div>;
                })}</div>

                <div className="footer"><button onClick={previousTest} disabled={currentIndex <= 0}>← Previous Test</button><div><button className="save" onClick={() => saveResults(true)} disabled={saving}>{saving ? "Saving..." : "Save Results"}</button><button className="next" onClick={nextTest} disabled={saving}>{currentIndex === selectedTests.length-1 ? "Final Report →" : "Next Test →"}</button></div></div>
              </>}
            </section>
          </div>

          <div className="bottom"><div><b>Results ready?</b><small>Save results and create final laboratory report.</small></div><button onClick={continueReport} disabled={saving}>{saving ? "Saving..." : "Generate Final Report →"}</button></div>
        </div>
      </main>

      <style jsx global>{`
        *{box-sizing:border-box}html,body{margin:0;padding:0;background:#f1f5f9;color:#172033;font-family:Arial,Helvetica,sans-serif}button,input,select{font:inherit}button{cursor:pointer}button:disabled{opacity:.55;cursor:not-allowed}.app{min-height:100vh;display:grid;grid-template-columns:230px minmax(0,1fr)}.sidebar{background:#092437;color:#fff;padding:18px 12px;min-height:100vh;position:sticky;top:0}.brand{display:flex;gap:10px;align-items:center;padding:2px 6px 22px}.logo{width:40px;height:40px;border-radius:10px;background:#10a6a3;display:grid;place-items:center;font-weight:900}.brand b{display:block}.brand small{display:block;color:#94a8b6;font-size:7px;letter-spacing:.6px;margin-top:3px}.label{margin:4px 8px 10px;color:#78909f;font-size:8px;font-weight:800;letter-spacing:1.5px}.manage{margin-top:22px}.menu{width:100%;min-height:42px;border:0;border-radius:7px;background:transparent;color:#cbd5df;text-align:left;padding:10px 11px;margin-bottom:4px;font-size:12px;font-weight:600}.menu span{display:inline-flex;width:22px;justify-content:center;margin-right:8px}.menu:hover,.menu.active{background:#12465e;color:#fff}.menu.active{box-shadow:inset 3px 0 #10a6a3}.main{min-width:0}.top{min-height:72px;background:#fff;border-bottom:1px solid #e2e8f0;padding:13px 24px;display:flex;justify-content:space-between;align-items:center}.top b{display:block;font-size:16px}.top small{display:block;color:#718096;margin-top:3px}.online{font-size:11px;color:#0f8f7e}.content{padding:22px 24px 45px;max-width:1500px;margin:auto}.heading{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:18px}.heading em,.cardHead em{font-size:9px;font-weight:900;letter-spacing:2px;color:#0c9184;font-style:normal}.heading h1{margin:5px 0;font-size:26px}.heading p,.cardHead p{margin:0;color:#718096;font-size:12px}.back{border:1px solid #d6dee8;background:#fff;border-radius:8px;padding:10px 14px}.calcBanner{display:flex;align-items:center;gap:12px;background:#e8fbf7;border:1px solid #b7ebe2;color:#0b665d;border-radius:10px;padding:12px 15px;margin-bottom:16px;font-size:12px}.calcBanner b{white-space:nowrap}.steps{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;background:#fff;border:1px solid #e5eaf0;border-radius:12px;padding:12px;margin-bottom:14px}.step{display:flex;align-items:center;gap:8px;color:#718096;font-size:11px}.step>span{width:25px;height:25px;border-radius:50%;display:grid;place-items:center;background:#edf2f7;font-weight:800}.step.current{color:#087f73;font-weight:800}.step.current>span{background:#0f9e90;color:#fff}.step small{display:block;color:#9aa7b5;font-size:8px;font-weight:400}.patient{display:grid;grid-template-columns:repeat(4,1fr);background:#fff;border:1px solid #e5eaf0;border-radius:10px;overflow:hidden;margin-bottom:14px}.patient>div{padding:11px 13px;border-right:1px solid #e5eaf0}.patient>div:last-child{border-right:0}.patient small{display:block;color:#82909e;font-size:8px;font-weight:800;letter-spacing:.8px}.patient b{display:block;margin-top:4px;font-size:12px}.progressBox,.bottom{background:#fff;border:1px solid #e5eaf0;border-radius:10px;padding:14px 16px;margin-bottom:14px}.progressBox>div:first-child{display:flex;justify-content:space-between}.progressBox b{font-size:12px}.progressBox small{display:block;color:#8793a0;font-size:9px;margin-top:3px}.progressBox strong{color:#0c8d81}.track{height:7px;background:#edf2f7;border-radius:20px;overflow:hidden;margin-top:9px}.track>div{height:100%;background:#0d9b8e;border-radius:20px}.saved{background:#e9fbf5;border:1px solid #b8eadb;color:#087b6e;border-radius:8px;padding:10px;margin-bottom:14px;font-size:12px;font-weight:700}.workspace{display:grid;grid-template-columns:225px minmax(0,1fr);gap:14px}.testNav,.card{background:#fff;border:1px solid #e5eaf0;border-radius:12px}.testNav{padding:13px;height:max-content}.testNav>b{font-size:12px;display:block;margin-bottom:9px}.navTest{width:100%;display:flex;gap:9px;text-align:left;background:#fff;border:1px solid transparent;border-radius:8px;padding:9px;margin-bottom:5px}.navTest.selected{background:#ecfbf8;border-color:#aee4db}.navTest>span{width:24px;height:24px;border-radius:7px;background:#edf2f7;display:grid;place-items:center;font-weight:800;color:#526170}.navTest.selected>span{background:#0f9e90;color:#fff}.navTest b{display:block;font-size:11px}.navTest small{display:block;color:#8b98a5;font-size:8px;margin-top:2px}.card{min-width:0;overflow:hidden}.cardHead{padding:17px 19px;border-bottom:1px solid #e5eaf0;display:flex;justify-content:space-between;gap:15px}.cardHead h2{margin:4px 0;font-size:18px}.cardHead>span{background:#edf8f6;color:#087e72;border-radius:20px;padding:7px 10px;height:max-content;font-size:10px;font-weight:800;white-space:nowrap}.desktopTable{overflow:auto}.desktopTable table{width:100%;border-collapse:collapse;min-width:760px}.desktopTable th{background:#edf6f7;color:#29404d;font-size:9px;letter-spacing:.8px;padding:10px 9px;text-align:left}.desktopTable td{border-top:1px solid #e6ebef;padding:8px 9px;font-size:10px;vertical-align:middle}.desktopTable td:first-child{width:28%}.desktopTable td b{font-size:10px}.desktopTable input,.desktopTable select{width:100%;min-width:80px;border:1px solid #d5dfe7;border-radius:6px;background:#fff;padding:7px 8px;font-size:10px}.desktopTable input:focus,.desktopTable select:focus{outline:2px solid #c5eee8;border-color:#0b9c8e}.desktopTable .calculated{background:#f0faf8;border-color:#79cfc4;color:#075f58;font-weight:800}.calcRow td:first-child{background:#f8fffd}.autoTag{display:inline-block;margin-left:6px;background:#d8f5ef;color:#087d71;border-radius:4px;padding:2px 4px;font-size:6px;font-weight:900;vertical-align:middle}.flag{display:inline-block;padding:3px 5px;border-radius:4px;font-size:7px;font-weight:900}.flag.low{background:#e1f0fb;color:#1971b5}.flag.high{background:#fde7e7;color:#c0392b}.flag.normal{color:#14916f}.mobileParams{display:none}.footer{display:flex;justify-content:space-between;gap:10px;padding:13px;border-top:1px solid #e5eaf0}.footer button{border:1px solid #d5dfe7;background:#fff;border-radius:7px;padding:9px 12px;font-size:10px}.footer .save{margin-right:7px}.footer .next{background:#0d8f83;color:#fff;border-color:#0d8f83}.bottom{display:flex;justify-content:space-between;align-items:center;margin-top:14px}.bottom b{display:block;font-size:12px}.bottom small{display:block;color:#7c8996;font-size:9px;margin-top:3px}.bottom>button{border:0;border-radius:8px;background:#0d8f83;color:#fff;padding:11px 15px;font-size:11px;font-weight:800}.empty{padding:50px;text-align:center}.empty button{background:#0d8f83;color:#fff;border:0;border-radius:8px;padding:10px 14px}
        @media(max-width:900px){.app{grid-template-columns:1fr}.sidebar{display:none}.content{padding:14px 10px 35px}.top{padding:11px 14px}.heading{align-items:flex-start}.heading h1{font-size:21px}.heading p{font-size:10px}.calcBanner{align-items:flex-start;flex-direction:column;gap:4px}.steps{overflow:auto;display:flex}.step{min-width:120px}.patient{grid-template-columns:repeat(2,1fr)}.patient>div:nth-child(2){border-right:0}.workspace{display:block}.testNav{display:flex;overflow:auto;gap:6px;margin-bottom:10px;padding:8px}.testNav>b{display:none}.navTest{min-width:155px;margin:0}.desktopTable{display:none}.mobileParams{display:block}.param{padding:12px;border-top:1px solid #e7edf1}.paramName{display:block;font-size:11px;margin-bottom:8px}.paramName>span{display:inline-grid;place-items:center;width:20px;height:20px;background:#edf2f7;border-radius:5px;margin-right:7px;font-size:9px}.param input,.param select{width:100%;padding:10px;border:1px solid #d5dfe7;border-radius:7px;background:#fff}.param .calculated{background:#f0faf8;border-color:#79cfc4;color:#075f58;font-weight:800}.info{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}.info>div{background:#f7f9fb;border-radius:6px;padding:7px}.info small{display:block;color:#8a96a2;font-size:7px}.info b{font-size:9px}.footer{padding:10px;position:sticky;bottom:0;background:#fff}.bottom{align-items:flex-start;gap:10px}.bottom>button{white-space:nowrap}.online{display:none}}
      `}</style>
    </div>
  );
}
