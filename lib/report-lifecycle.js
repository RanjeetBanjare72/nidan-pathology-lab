import { supabase } from "./supabase";
import {
  REPORT_STATUSES,
  canTransitionReportStatus,
  validateReportForVerification,
} from "./report-validation";

function normalizeActor(actor) {
  return actor || null;
}

async function syncOrderLifecycle(report, nextStatus, now) {
  if (!report?.order_id) return;

  const orderPatch = {};
  const itemStatus = nextStatus === REPORT_STATUSES.FINAL ? "released" : "verified";

  if (nextStatus === REPORT_STATUSES.VERIFIED) {
    orderPatch.status = "verified";
    orderPatch.verified_at = now;
  }

  if (nextStatus === REPORT_STATUSES.FINAL) {
    orderPatch.status = "released";
    orderPatch.released_at = now;
  }

  if (Object.keys(orderPatch).length > 0) {
    const { error } = await supabase
      .from("lab_orders")
      .update(orderPatch)
      .eq("id", report.order_id);
    if (error) throw error;
  }

  const { error: itemError } = await supabase
    .from("lab_order_items")
    .update({ status: itemStatus, updated_at: now })
    .eq("order_id", report.order_id)
    .in("status", ["pending", "result_entered", "verified", "released"]);

  if (itemError) throw itemError;
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
    patch.report_status = "Verified";
  }

  if (nextStatus === REPORT_STATUSES.FINAL) {
    patch.finalized_at = now;
    patch.finalized_by = normalizeActor(context.actor);
    patch.released_at = now;
    patch.report_status = "Released";
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

  await syncOrderLifecycle(report, nextStatus, now);

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
  if (String(report.status).toLowerCase() !== REPORT_STATUSES.FINAL) {
    throw new Error("Only a Final report can create a controlled revision.");
  }

  const { data: latest, error: latestError } = await supabase
    .from("report_revisions")
    .select("revision_no")
    .eq("report_id", report.id)
    .order("revision_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) throw latestError;

  const requestedRevision = Number(latest?.revision_no || 0) + 1;

  const { data, error } = await supabase
    .from("report_revisions")
    .insert({
      report_id: report.id,
      revision_no: requestedRevision,
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

  const actualRevision = Number(data.revision_no);

  const { error: reportUpdateError } = await supabase
    .from("reports")
    .update({
      status: REPORT_STATUSES.DRAFT,
      report_status: "Pending",
      revision_number: actualRevision,
      finalized_at: null,
      finalized_by: null,
      released_at: null,
    })
    .eq("id", report.id)
    .eq("status", REPORT_STATUSES.FINAL);

  if (reportUpdateError) throw reportUpdateError;

  if (report?.order_id) {
    const { error: orderError } = await supabase
      .from("lab_orders")
      .update({ status: "in_progress", released_at: null })
      .eq("id", report.order_id);
    if (orderError) throw orderError;

    const { error: itemError } = await supabase
      .from("lab_order_items")
      .update({ status: "result_entered", updated_at: new Date().toISOString() })
      .eq("order_id", report.order_id);
    if (itemError) throw itemError;
  }

  const { error: auditError } = await supabase.from("report_audit_log").insert({
    report_id: report.id,
    action: "revised",
    from_status: REPORT_STATUSES.FINAL,
    to_status: REPORT_STATUSES.DRAFT,
    revision_number: actualRevision,
    actor_id: normalizeActor(actor),
    details: {
      change_reason: changeReason,
      revision_no: actualRevision,
    },
  });

  if (auditError) throw auditError;
  return data;
}
