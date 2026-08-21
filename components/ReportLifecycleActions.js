"use client";

import { useState } from "react";
import { REPORT_STATUSES, validateReportForVerification } from "../lib/report-validation";
import { finalizeReport, verifyReport } from "../lib/report-lifecycle";

const LABELS = {
  [REPORT_STATUSES.DRAFT]: "DRAFT",
  [REPORT_STATUSES.VERIFIED]: "VERIFIED",
  [REPORT_STATUSES.FINAL]: "FINAL",
};

export default function ReportLifecycleActions({ report, patient, selectedTests = [], results = {}, actor = null, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const status = String(report?.status || REPORT_STATUSES.DRAFT).toLowerCase();

  async function verify() {
    setBusy(true);
    setError("");
    try {
      const validation = validateReportForVerification({ patient, selectedTests, results });
      if (!validation.valid) {
        setError(validation.errors.slice(0, 8).join(" "));
        return;
      }
      const updated = await verifyReport(report, { patient, selectedTests, results, actor });
      onChanged?.(updated);
    } catch (e) {
      setError(e?.message || "Report verification failed.");
    } finally {
      setBusy(false);
    }
  }

  async function finalize() {
    setBusy(true);
    setError("");
    try {
      const updated = await finalizeReport(report, actor);
      onChanged?.(updated);
    } catch (e) {
      setError(e?.message || "Report finalization failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="reportLifecycleActions">
      <span className={`reportStatus reportStatus-${status}`}>{LABELS[status] || status.toUpperCase()}</span>
      {status === REPORT_STATUSES.DRAFT && <button type="button" disabled={busy} onClick={verify}>{busy ? "Verifying…" : "✓ Verify Report"}</button>}
      {status === REPORT_STATUSES.VERIFIED && <button type="button" disabled={busy} onClick={finalize}>{busy ? "Finalizing…" : "🔒 Finalize Report"}</button>}
      {status === REPORT_STATUSES.FINAL && <span className="reportLocked">🔒 Final report locked</span>}
      {error && <small className="reportLifecycleError" role="alert">{error}</small>}
    </div>
  );
}
