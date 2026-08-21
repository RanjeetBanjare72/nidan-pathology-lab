import { supabase } from "./supabase";
import {
  REPORT_STATUSES,
  canTransitionReportStatus,
  validateReportForVerification,
} from "./report-validation";

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
    patch.verified_by = context.actor || null;
  }
  if (nextStatus === REPORT_STATUSES.FINAL) {
    patch.finalized_at = now;
    patch.finalized_by = context.actor || null;
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

  await supabase.from("report_audit_log").insert({
    report_id: report.id,
    action: "status_change",
    from_status: currentStatus,
    to_status: nextStatus,
    actor: context.actor || null,
    details: context.details || {},
  });

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

export async function createReportRevision(report, reportData, actor, changeReason = "Correction") {
  if (!report?.id) throw new Error("Report ID is required.");
  if (report.status !== REPORT_STATUSES.FINAL) throw new Error("Only a Final report can create a controlled revision.");

  const nextRevision = Number(report.revision || 1) + 1;
  const { data, error } = await supabase
    .from("report_revisions")
    .insert({
      report_id: report.id,
      revision: nextRevision,
      status: REPORT_STATUSES.DRAFT,
      report_data: reportData || {},
      changed_by: actor || null,
      change_reason: changeReason,
    })
    .select("*")
    .single();

  if (error) throw error;

  await supabase.from("report_audit_log").insert({
    report_id: report.id,
    action: "revision_created",
    from_status: REPORT_STATUSES.FINAL,
    to_status: REPORT_STATUSES.DRAFT,
    actor: actor || null,
    details: { revision: nextRevision, change_reason: changeReason },
  });

  return data;
}
