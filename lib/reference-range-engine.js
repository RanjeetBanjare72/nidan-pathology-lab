// Centralized reference-range fallback. Database values should take precedence.

function normalize(name = "") {
  return String(name).toLowerCase().replace(/[()]/g, "").replace(/[./_-]/g, " ").replace(/\s+/g, " ").trim();
}

export const STANDARD_REFERENCE_RANGES = {
  "neutrophils": { min: 40, max: 75, unit: "%", range: "40 - 75" },
  "lymphocytes": { min: 20, max: 40, unit: "%", range: "20 - 40" },
  "eosinophils": { min: 1, max: 6, unit: "%", range: "1 - 6" },
  "monocytes": { min: 2, max: 10, unit: "%", range: "2 - 10" },
  "basophils": { min: 0, max: 2, unit: "%", range: "0 - 2" },
  "mcv": { min: 80, max: 100, unit: "fL", range: "80 - 100" },
  "mch": { min: 27, max: 32, unit: "pg", range: "27 - 32" },
  "mchc": { min: 32, max: 36, unit: "g/dL", range: "32 - 36" },
  "rdw cv": { min: 11.5, max: 14.5, unit: "%", range: "11.5 - 14.5" },
  "mpv": { min: 7.5, max: 11.5, unit: "fL", range: "7.5 - 11.5" },
  "esr": { min: 0, max: 15, unit: "mm/hr", range: "0 - 15" },
  "fbs": { min: 70, max: 99, unit: "mg/dL", range: "70 - 99" },
  "ppbs": { min: 70, max: 140, unit: "mg/dL", range: "70 - 140" },
  "rbs": { min: 70, max: 140, unit: "mg/dL", range: "70 - 140" },
  "blood urea": { min: 15, max: 45, unit: "mg/dL", range: "15 - 45" },
  "urea": { min: 15, max: 45, unit: "mg/dL", range: "15 - 45" },
  "creatinine": { min: 0.6, max: 1.3, unit: "mg/dL", range: "0.6 - 1.3" },
  "serum creatinine": { min: 0.6, max: 1.3, unit: "mg/dL", range: "0.6 - 1.3" },
  "sodium": { min: 135, max: 145, unit: "mmol/L", range: "135 - 145" },
  "potassium": { min: 3.5, max: 5.1, unit: "mmol/L", range: "3.5 - 5.1" },
  "chloride": { min: 98, max: 106, unit: "mmol/L", range: "98 - 106" },
  "total bilirubin": { min: 0.2, max: 1.2, unit: "mg/dL", range: "0.2 - 1.2" },
  "direct bilirubin": { min: 0, max: 0.3, unit: "mg/dL", range: "0.0 - 0.3" },
  "indirect bilirubin": { min: 0.2, max: 0.9, unit: "mg/dL", range: "0.2 - 0.9" },
  "total protein": { min: 6, max: 8.3, unit: "g/dL", range: "6.0 - 8.3" },
  "albumin": { min: 3.5, max: 5, unit: "g/dL", range: "3.5 - 5.0" },
  "globulin": { min: 2, max: 3.5, unit: "g/dL", range: "2.0 - 3.5" },
  "albumin globulin ratio": { min: 1, max: 2.5, unit: "Ratio", range: "1.0 - 2.5" },
  "total cholesterol": { min: 0, max: 200, unit: "mg/dL", range: "< 200" },
  "triglycerides": { min: 0, max: 150, unit: "mg/dL", range: "< 150" },
  "ldl": { min: 0, max: 100, unit: "mg/dL", range: "< 100" },
  "vldl": { min: 5, max: 40, unit: "mg/dL", range: "5 - 40" },
  "hba1c": { min: 4, max: 5.6, unit: "%", range: "4.0 - 5.6" },
  "tsh": { min: 0.4, max: 4, unit: "µIU/mL", range: "0.4 - 4.0" },
};

export function resolveReferenceRange(name, databaseRange = null) {
  if (databaseRange && (databaseRange.reference_range || databaseRange.range || databaseRange.min_value != null || databaseRange.max_value != null)) {
    return {
      min: databaseRange.min_value ?? databaseRange.min ?? null,
      max: databaseRange.max_value ?? databaseRange.max ?? null,
      unit: databaseRange.unit || "",
      range: databaseRange.reference_range || databaseRange.range || "-",
      source: "database",
    };
  }
  const fallback = STANDARD_REFERENCE_RANGES[normalize(name)];
  return fallback ? { ...fallback, source: "standard-fallback" } : null;
}
