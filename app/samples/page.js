"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

function barcodePattern(value = "") {
  const bits = Array.from(String(value)).flatMap((ch, i) => {
    const n = ch.charCodeAt(0) + i * 17;
    return [1, 0, 1, 1, 0, 0, 1, (n >> 0) & 1, 0, (n >> 1) & 1, 1, (n >> 2) & 1, 0, 1];
  });
  return [1, 0, 1, 0, 1, 1, 1, ...bits, 1, 1, 0, 1, 0, 1, 1];
}

function Barcode({ value }) {
  const bits = barcodePattern(value);
  return (
    <svg className="barcodeSvg" viewBox={`0 0 ${bits.length} 46`} role="img" aria-label={`Barcode ${value}`}>
      {bits.map((bit, i) => bit ? <rect key={i} x={i} y="0" width="1" height="34" /> : null)}
      <text x={bits.length / 2} y="44" textAnchor="middle" fontSize="6" fontFamily="monospace">{value}</text>
    </svg>
  );
}

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
    if (!sample.barcode) patch.barcode = sample.sample_no;
    if (status === "Collected") patch.collected_at = now;
    if (status === "Received") patch.received_at = now;

    const { error } = await supabase.from("lab_samples").update(patch).eq("id", sample.id);
    if (error) {
      setMessage(error.message);
      setBusy("");
      return;
    }

    const orderStatus = {
      Collected: "Sample Collected",
      Received: "Processing",
      Processing: "Processing",
      Completed: "Ready",
    }[status];

    if (orderStatus && sample.order_id) {
      await supabase.from("lab_orders").update({
        status: orderStatus,
        ...(status === "Collected" ? { sample_collected_at: now } : {}),
      }).eq("id", sample.order_id);
    }

    setMessage(`✓ ${sample.sample_no} → ${status}`);
    setBusy("");
    await loadSamples();
  }

  function printBarcode(sample) {
    const value = sample.barcode || sample.sample_no || String(sample.id);
    const patient = sample.lab_orders?.patients?.name || "Unknown patient";
    const pattern = barcodePattern(value);
    const bars = pattern.map((bit, i) => bit ? `<rect x="${i}" y="0" width="1" height="34"/>` : "").join("");
    const w = window.open("", "_blank", "width=560,height=420");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${escapeHtml(value)}</title><style>@page{size:58mm 40mm;margin:2mm}body{font-family:Arial;text-align:center;margin:0;padding:6px}.lab{font-size:10px;font-weight:800}.code{width:100%;height:48px}.meta{font-size:9px;margin-top:2px}.value{font:700 11px monospace;letter-spacing:1px}</style></head><body><div class="lab">NIDAN PATHOLOGY LAB</div><svg class="code" viewBox="0 0 ${pattern.length} 40" preserveAspectRatio="none">${bars}<text x="${pattern.length / 2}" y="39" text-anchor="middle" font-size="6" font-family="monospace">${escapeHtml(value)}</text></svg><div class="meta">Patient: ${escapeHtml(patient)}</div><div class="meta">Sample: ${escapeHtml(sample.sample_no || "-")} · ${escapeHtml(sample.sample_type || "Sample")}</div><script>window.print()</script></body></html>`);
    w.document.close();
  }

  return (
    <main className="samplesPage">
      <div className="samplesShell">
        <header className="samplesHeader">
          <div><b>NIDAN — Sample Collection</b><small>Collection · Receiving · Barcode · Order Tracking</small></div>
          <span>🧪 LAB OPERATIONS</span>
        </header>

        <div className="samplesSearch">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search sample / barcode / patient / order" />
          <span>{filtered.length} sample{filtered.length === 1 ? "" : "s"}</span>
        </div>

        {message && <div className="samplesMessage">{message}</div>}

        <section className="samplesList">
          {loading ? <div className="empty">Loading samples…</div> : filtered.length === 0 ? <div className="empty">No samples found.</div> : filtered.map((s) => (
            <article key={s.id} className="sampleCard">
              <div className="sampleTop">
                <div>
                  <b>{s.sample_no}</b>
                  <div className="patient">{s.lab_orders?.patients?.name || "Unknown patient"} · {s.lab_orders?.order_no || "-"}</div>
                  <div className="muted">Type: {s.sample_type || "-"} · Barcode: {s.barcode || s.sample_no || "-"}</div>
                </div>
                <strong className={`status status-${String(s.status || "Pending").toLowerCase().replace(/\s+/g, "-")}`}>{s.status || "Pending"}</strong>
              </div>

              <div className="barcodePreview"><Barcode value={s.barcode || s.sample_no || String(s.id)} /></div>

              <div className="sampleActions">
                <button onClick={() => printBarcode(s)}>🖨 Print Barcode</button>
                {!['Collected', 'Received', 'Processing', 'Completed'].includes(s.status) && <button className="primary" disabled={busy === s.id} onClick={() => updateSample(s, "Collected")}>✓ Collect Sample</button>}
                {s.status === "Collected" && <button className="blue" disabled={busy === s.id} onClick={() => updateSample(s, "Received")}>✓ Mark Received</button>}
                {s.status === "Received" && <button className="purple" disabled={busy === s.id} onClick={() => updateSample(s, "Processing")}>▶ Processing</button>}
                {s.status === "Processing" && <button className="green" disabled={busy === s.id} onClick={() => updateSample(s, "Completed")}>✓ Completed</button>}
              </div>
            </article>
          ))}
        </section>
      </div>

      <style jsx>{`
        .samplesPage{min-height:100vh;background:#f3f7f9;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#172033}.samplesShell{max-width:1200px;margin:auto}.samplesHeader{background:#082c3d;color:#fff;padding:18px 20px;border-radius:14px;display:flex;justify-content:space-between;gap:16px;align-items:center}.samplesHeader b{display:block;font-size:18px}.samplesHeader small{display:block;font-size:11px;opacity:.78;margin-top:5px}.samplesSearch{background:#fff;border:1px solid #e1e8ed;border-radius:12px;margin-top:14px;padding:12px;display:flex;gap:12px;align-items:center}.samplesSearch input{flex:1;border:1px solid #d5dee7;border-radius:9px;padding:12px;font-size:14px;outline:none}.samplesSearch span{font-size:12px;color:#64748b;white-space:nowrap}.samplesMessage{background:#eafaf5;border:1px solid #bfe9dc;color:#126c5d;padding:11px 13px;border-radius:10px;margin-top:12px;font-size:12px}.samplesList{display:grid;gap:12px;margin-top:14px}.sampleCard,.empty{background:#fff;border:1px solid #e1e8ed;border-radius:14px;padding:16px;box-shadow:0 4px 18px rgba(15,23,42,.04)}.sampleTop{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.sampleTop b{font-size:16px}.patient{font-size:12px;margin-top:5px}.muted{font-size:11px;color:#64748b;margin-top:4px}.status{font-size:11px;padding:6px 9px;border-radius:999px;background:#eef2f6}.status-collected{background:#e9f7f1;color:#08745f}.status-received,.status-processing{background:#eef4ff;color:#2554a3}.status-completed{background:#eaf8ee;color:#23703a}.barcodePreview{border-top:1px dashed #dbe3e9;border-bottom:1px dashed #dbe3e9;margin:14px 0;padding:10px 0;max-width:360px}.barcodeSvg{width:100%;height:58px;display:block}.barcodeSvg rect{fill:#0b1720}.sampleActions{display:flex;gap:8px;flex-wrap:wrap}.sampleActions button{border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:9px 12px;font-weight:700;cursor:pointer}.sampleActions .primary{background:#0f9e90;color:#fff;border-color:#0f9e90}.sampleActions .blue{background:#2563eb;color:#fff;border-color:#2563eb}.sampleActions .purple{background:#7c3aed;color:#fff;border-color:#7c3aed}.sampleActions .green{background:#059669;color:#fff;border-color:#059669}.sampleActions button:disabled{opacity:.55;cursor:not-allowed}@media(max-width:640px){.samplesPage{padding:10px}.samplesHeader{padding:14px;align-items:flex-start}.samplesHeader span{display:none}.samplesSearch{display:block}.samplesSearch span{display:block;margin-top:7px}.sampleTop{display:block}.status{display:inline-block;margin-top:10px}.barcodePreview{max-width:100%}}
      `}</style>
    </main>
  );
}
