"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  REPORT_STATUSES,
  validateReportForVerification,
  canTransitionReportStatus,
} from "../../lib/report-validation";

export default function ReportLifecycleActions({
  report,
  selectedTests = [],
  results = {},
  onUpdated,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const status = String(report?.status || REPORT_STATUSES.DRAFT).toLowerCase();
  const validation = validateReportForVerification({
    patient: report?.patient || report?.report_data?.patient,
    selectedTests,
    results,
  });

  async function transition(nextStatus) {
    setError("");
    if (!report?.id || busy) return;

    if (!canTransitionReportStatus(status, nextStatus, validation)) {
      setError(
        nextStatus === REPORT_STATUSES.VERIFIED
          ? validation.errors.join(" ") || "Report verification is not allowed."
          : "This report cannot make that status transition."
      );
      return;
    }

    setBusy(true);
    try {
      const patch = { status: nextStatus };
      if (nextStatus === REPORT_STATUSES.VERIFIED) patch.verified_at = new Date().toISOString();
      if (nextStatus === REPORT_STATUSES.FINAL) patch.finalized_at = new Date().toISOString();

      const { data, error: updateError } = await supabase
        .from("reports")
        .update(patch)
        .eq("id", report.id)
        .select("*")
        .single();

      if (updateError) throw updateError;
      onUpdated?.(data);
    } catch (e) {
      setError(e?.message || "Report status update failed.");
    } finally {
      setBusy(false);
    }
  }

  if (status === REPORT_STATUSES.FINAL) {
    return (
      <div className="reportLifecycle final">
        <span>🔒 FINAL REPORT — LOCKED</span>
        {error && <small>{error}</small>}
      </div>
    );
  }

  return (
    <div className="reportLifecycle">
      <span className={`lifecycleBadge ${status}`}>{status.toUpperCase()}</span>
      {status === REPORT_STATUSES.DRAFT && (
        <button type="button" disabled={busy} onClick={() => transition(REPORT_STATUSES.VERIFIED)}>
          {busy ? "Verifying…" : "✓ Verify Report"}
        </button>
      )}
      {status === REPORT_STATUSES.VERIFIED && (
        <button type="button" disabled={busy} onClick={() => transition(REPORT_STATUSES.FINAL)}>
          {busy ? "Finalizing…" : "🔒 Finalize Report"}
        </button>
      )}
      {error && <small className="lifecycleError">{error}</small>}
    </div>
  );
}
