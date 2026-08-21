import { supabase } from "./supabase";
import {
  REPORT_STATUSES,
  canTransitionReportStatus,
  validateReportForVerification,
} from "./report-validation";

function normalizeActor(actor) {
  return actor || null;
}

export async function transitionReport(report, nextStatus, context = {}) {
  const currentStatus = report?.status || REPORT_STATUSES.DRAFT;
  const validation = context.validation || { valid: true, errors: [] };

  if (nextStatus === REPORT_STATUSES.VERIFIED && !context.validation) {
    throw new Error("Report validation is required before verification.");
  }

  if (!canTransitionReportStatus(currentStatus, nextStatus, validation)) {
    throw new Error(`Invalid report status transition: ${currentStatus} → ${nextStatus}`);
  }

  const now = new Date().toISOString();
  const patch = { status: nextStatus };

  if (nextStatus === REPORT_STATUSES.VERIFIED) {
    patch.verified_at = now;
    patch.verified_by = normalizeActor(context.actor);
  }

  if (nextStatus === REPORT_STATUSES.FINAL) {
    patch.finalized_at = now;
    patch.finalized_by = normalizeActor(context.actor);
  }

  const { data, error } = await supabase
    .from("reports")
    .update(patch)
    .eq("id", report.id)
    .eq("status", currentStatus)
    .select("*")
    .single();

  if (error) throw error;
  if (!data) throw new Error("Report was changed by another session. Reload and try again.");

  const action =
    nextStatus === REPORT_STATUSES.VERIFIED
      ? "verified"
      : nextStatus === REPORT_STATUSES.FINAL
        ? "finalized"
        : "reopened";

  const { error: auditError } = await supabase.from("report_audit_log").insert({
    report_id: report.id,
    action,
    from_status: currentStatus,
    to_status: nextStatus,
    revision_number: Number(report.revision_number || 1),
    actor_id: normalizeActor(context.actor),
    details: context.details || {},
  });

  if (auditError) throw auditError;

  return data;
}

export async function verifyReport(report, payload) {
  const validation = validateReportForVerification(payload);
  if (!validation.valid) {
    const error = new Error(validation.errors.join(" "));
    error.validationErrors = validation.errors;
    throw error;
  }

  return transitionReport(report, REPORT_STATUSES.VERIFIED, {
    ...payload,
    validation,
  });
}

export async function finalizeReport(report, actor) {
  return transitionReport(report, REPORT_STATUSES.FINAL, { actor });
}

export async function createReportRevision(
  report,
  reportData,
  actor,
  changeReason = "Correction"
) {
  if (!report?.id) throw new Error("Report ID is required.");
  if (report.status !== REPORT_STATUSES.FINAL) {
    throw new Error("Only a Final report can create a controlled revision.");
  }

  // The production database uses revision_no (not revision).
  // Read the latest revision atomically enough for normal UI use and retry
  // safely if another session created the same revision first.
  const { data: latest, error: latestError } = await supabase
    .from("report_revisions")
    .select("revision_no")
    .eq("report_id", report.id)
    .order("revision_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) throw latestError;

  const nextRevision = Number(latest?.revision_no || 0) + 1;

  const { data, error } = await supabase
    .from("report_revisions")
    .insert({
      report_id: report.id,
      revision_no: nextRevision,
      action: "update",
      snapshot: reportData || {},
      user_id: normalizeActor(actor),
      lab_id: report?.lab_id || null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("A newer controlled revision was already created. Please refresh the report and try again.");
    }
    throw error;
  }

  // Keep the report's current revision number in sync with the revision log.
  const { error: reportUpdateError } = await supabase
    .from("reports")
    .update({ revision_number: nextRevision })
    .eq("id", report.id);

  if (reportUpdateError) throw reportUpdateError;

  const { error: auditError } = await supabase.from("report_audit_log").insert({
    report_id: report.id,
    action: "revised",
    from_status: REPORT_STATUSES.FINAL,
    to_status: REPORT_STATUSES.DRAFT,
    revision_number: nextRevision,
    actor_id: normalizeActor(actor),
    details: {
      change_reason: changeReason,
      revision_no: nextRevision,
    },
  });

  if (auditError) throw auditError;

  return data;
}
