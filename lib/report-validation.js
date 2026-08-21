export const REPORT_STATUSES = {
  DRAFT: "draft",
  VERIFIED: "verified",
  FINAL: "final",
};

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

export function validateReportForVerification({ patient, selectedTests = [], results = {} }) {
  const errors = [];

  if (!patient?.name?.trim()) errors.push("Patient name is required.");
  if (!patient?.gender) errors.push("Patient gender is required.");
  if (!selectedTests.length) errors.push("At least one test must be selected.");

  for (const test of selectedTests) {
    const parameters = test.parameters || test.tests || [];
    for (const parameter of parameters) {
      if (parameter.calculated || parameter.is_calculated) continue;
      const key = String(parameter.id ?? parameter.parameter_id ?? parameter.name ?? "");
      if (!key) continue;
      if (!hasValue(results[key])) {
        errors.push(`${test.name || "Test"}: ${parameter.name || parameter.parameter_name || key} result is required.`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function canTransitionReportStatus(currentStatus, nextStatus, validation = { valid: true }) {
  if (currentStatus === REPORT_STATUSES.FINAL) return false;
  if (nextStatus === REPORT_STATUSES.VERIFIED) return validation.valid;
  if (nextStatus === REPORT_STATUSES.FINAL) return currentStatus === REPORT_STATUSES.VERIFIED;
  return nextStatus === REPORT_STATUSES.DRAFT;
}

export function normalizeReportStatus(status) {
  return Object.values(REPORT_STATUSES).includes(status) ? status : REPORT_STATUSES.DRAFT;
}
