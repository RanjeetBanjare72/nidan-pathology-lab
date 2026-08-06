"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

/* =========================================================
   NIDAN PATHOLOGY LAB
   SAVED REPORTS + PRINTABLE LAB REPORT
   app/reports/page.js
   ========================================================= */

/* =========================================================
   MASTER PATHOLOGY TEST LIBRARY
   ========================================================= */

const MASTER_TESTS = {
  cbc: {
    name: "COMPLETE BLOOD COUNT (CBC)",
    department: "HAEMATOLOGY",
    parameters: [
      { name: "Haemoglobin", unit: "g/dL", reference: "Male: 13-17 | Female: 12-15" },
      { name: "Total Leucocyte Count (TLC)", unit: "/cumm", reference: "4000-11000" },

      { name: "DIFFERENTIAL LEUCOCYTE COUNT", heading: true },

      { name: "Neutrophils", unit: "%", reference: "40-75" },
      { name: "Lymphocytes", unit: "%", reference: "20-40" },
      { name: "Eosinophils", unit: "%", reference: "1-6" },
      { name: "Monocytes", unit: "%", reference: "1-10" },
      { name: "Basophils", unit: "%", reference: "0-1" },

      { name: "RBC INDICES", heading: true },

      { name: "RBC Count", unit: "million/cumm", reference: "Male: 4.5-6.0 | Female: 4.0-5.5" },
      { name: "PCV / Haematocrit", unit: "%", reference: "Male: 40-50 | Female: 36-46" },
      { name: "MCV", unit: "fL", reference: "80-100" },
      { name: "MCH", unit: "pg", reference: "27-32" },
      { name: "MCHC", unit: "g/dL", reference: "32-36" },
      { name: "RDW-CV", unit: "%", reference: "11.5-14.5" },

      { name: "PLATELET INDICES", heading: true },

      { name: "Platelet Count", unit: "Lac/cumm", reference: "1.5-4.5" },
      { name: "MPV", unit: "fL", reference: "7.5-11.5" },
      { name: "PDW", unit: "%", reference: "9-17" },
      { name: "PCT", unit: "%", reference: "0.15-0.40" },
    ],
  },

  esr: {
    name: "ESR",
    department: "HAEMATOLOGY",
    parameters: [
      {
        name: "ESR (Westergren Method)",
        unit: "mm/1st hr",
        reference: "Male: 0-15 | Female: 0-20",
      },
    ],
  },

  bloodgroup: {
    name: "BLOOD GROUP",
    department: "HAEMATOLOGY",
    parameters: [
      { name: "ABO Blood Group", unit: "", reference: "" },
      { name: "Rh Type", unit: "", reference: "Positive / Negative" },
    ],
  },

  btct: {
    name: "BT / CT",
    department: "HAEMATOLOGY",
    parameters: [
      { name: "Bleeding Time (BT)", unit: "minutes", reference: "2-7" },
      { name: "Clotting Time (CT)", unit: "minutes", reference: "5-11" },
    ],
  },

  ptinr: {
    name: "PROTHROMBIN TIME (PT/INR)",
    department: "COAGULATION",
    parameters: [
      { name: "Prothrombin Time (PT)", unit: "sec", reference: "11-16" },
      { name: "Control PT", unit: "sec", reference: "Laboratory Control" },
      { name: "INR", unit: "", reference: "0.8-1.2" },
    ],
  },

  aptt: {
    name: "APTT",
    department: "COAGULATION",
    parameters: [
      {
        name: "Activated Partial Thromboplastin Time",
        unit: "sec",
        reference: "25-35",
      },
      {
        name: "Control",
        unit: "sec",
        reference: "Laboratory Control",
      },
    ],
  },

  lft: {
    name: "LIVER FUNCTION TEST (LFT)",
    department: "BIOCHEMISTRY",
    parameters: [
      { name: "Total Bilirubin", unit: "mg/dL", reference: "0.2-1.2" },
      { name: "Direct Bilirubin", unit: "mg/dL", reference: "0.0-0.3" },
      { name: "Indirect Bilirubin", unit: "mg/dL", reference: "0.2-0.9" },
      { name: "SGOT / AST", unit: "U/L", reference: "Up to 40" },
      { name: "SGPT / ALT", unit: "U/L", reference: "Up to 40" },
      { name: "Alkaline Phosphatase (ALP)", unit: "U/L", reference: "44-147" },
      { name: "Total Protein", unit: "g/dL", reference: "6.0-8.3" },
      { name: "Albumin", unit: "g/dL", reference: "3.5-5.2" },
      { name: "Globulin", unit: "g/dL", reference: "2.0-3.5" },
      { name: "A/G Ratio", unit: "", reference: "1.0-2.2" },
    ],
  },

  kft: {
    name: "KIDNEY FUNCTION TEST (KFT/RFT)",
    department: "BIOCHEMISTRY",
    parameters: [
      { name: "Blood Urea", unit: "mg/dL", reference: "15-40" },
      { name: "Serum Creatinine", unit: "mg/dL", reference: "0.6-1.3" },
      { name: "Uric Acid", unit: "mg/dL", reference: "Male: 3.4-7.0 | Female: 2.4-6.0" },
      { name: "Blood Urea Nitrogen (BUN)", unit: "mg/dL", reference: "7-20" },
      { name: "Sodium", unit: "mmol/L", reference: "135-145" },
      { name: "Potassium", unit: "mmol/L", reference: "3.5-5.1" },
      { name: "Chloride", unit: "mmol/L", reference: "98-107" },
    ],
  },

  lipid: {
    name: "LIPID PROFILE",
    department: "BIOCHEMISTRY",
    parameters: [
      { name: "Total Cholesterol", unit: "mg/dL", reference: "Desirable: <200" },
      { name: "Triglycerides", unit: "mg/dL", reference: "Normal: <150" },
      { name: "HDL Cholesterol", unit: "mg/dL", reference: "40-60" },
      { name: "LDL Cholesterol", unit: "mg/dL", reference: "Optimal: <100" },
      { name: "VLDL Cholesterol", unit: "mg/dL", reference: "5-40" },
      { name: "TC/HDL Ratio", unit: "", reference: "<5.0" },
      { name: "LDL/HDL Ratio", unit: "", reference: "<3.5" },
    ],
  },

  thyroid: {
    name: "THYROID PROFILE",
    department: "IMMUNOASSAY",
    parameters: [
      { name: "T3 (Triiodothyronine)", unit: "ng/dL", reference: "80-200" },
      { name: "T4 (Thyroxine)", unit: "µg/dL", reference: "5.0-12.0" },
      { name: "TSH", unit: "µIU/mL", reference: "0.4-4.5" },
    ],
  },

  thyroidft3ft4: {
    name: "THYROID PROFILE (FT3, FT4, TSH)",
    department: "IMMUNOASSAY",
    parameters: [
      { name: "FT3", unit: "pg/mL", reference: "2.0-4.4" },
      { name: "FT4", unit: "ng/dL", reference: "0.8-1.8" },
      { name: "TSH", unit: "µIU/mL", reference: "0.4-4.5" },
    ],
  },

  glucose: {
    name: "BLOOD GLUCOSE",
    department: "BIOCHEMISTRY",
    parameters: [
      { name: "Blood Glucose", unit: "mg/dL", reference: "Interpret according to fasting/random status" },
    ],
  },

  fbs: {
    name: "FASTING BLOOD SUGAR (FBS)",
    department: "BIOCHEMISTRY",
    parameters: [
      { name: "Fasting Blood Sugar", unit: "mg/dL", reference: "70-99" },
    ],
  },

  ppbs: {
    name: "POST PRANDIAL BLOOD SUGAR (PPBS)",
    department: "BIOCHEMISTRY",
    parameters: [
      { name: "Post Prandial Blood Sugar", unit: "mg/dL", reference: "<140" },
    ],
  },

  rbs: {
    name: "RANDOM BLOOD SUGAR (RBS)",
    department: "BIOCHEMISTRY",
    parameters: [
      { name: "Random Blood Sugar", unit: "mg/dL", reference: "70-140" },
    ],
  },

  hba1c: {
    name: "HbA1c",
    department: "BIOCHEMISTRY",
    parameters: [
      { name: "HbA1c", unit: "%", reference: "Normal: <5.7" },
      { name: "Estimated Average Glucose (eAG)", unit: "mg/dL", reference: "" },
    ],
  },

  uricacid: {
    name: "URIC ACID",
    department: "BIOCHEMISTRY",
    parameters: [
      { name: "Serum Uric Acid", unit: "mg/dL", reference: "Male: 3.4-7.0 | Female: 2.4-6.0" },
    ],
  },

  calcium: {
    name: "SERUM CALCIUM",
    department: "BIOCHEMISTRY",
    parameters: [
      { name: "Serum Calcium", unit: "mg/dL", reference: "8.5-10.5" },
    ],
  },

  electrolytes: {
    name: "SERUM ELECTROLYTES",
    department: "BIOCHEMISTRY",
    parameters: [
      { name: "Sodium (Na+)", unit: "mmol/L", reference: "135-145" },
      { name: "Potassium (K+)", unit: "mmol/L", reference: "3.5-5.1" },
      { name: "Chloride (Cl-)", unit: "mmol/L", reference: "98-107" },
    ],
  },

  ironprofile: {
    name: "IRON PROFILE",
    department: "BIOCHEMISTRY",
    parameters: [
      { name: "Serum Iron", unit: "µg/dL", reference: "60-170" },
      { name: "TIBC", unit: "µg/dL", reference: "240-450" },
      { name: "Transferrin Saturation", unit: "%", reference: "20-50" },
      { name: "Serum Ferritin", unit: "ng/mL", reference: "Lab/Age/Sex dependent" },
    ],
  },

  crp: {
    name: "C-REACTIVE PROTEIN (CRP)",
    department: "SEROLOGY",
    parameters: [
      { name: "C-Reactive Protein", unit: "mg/L", reference: "<6" },
    ],
  },

  rafactor: {
    name: "RA FACTOR",
    department: "SEROLOGY",
    parameters: [
      { name: "Rheumatoid Factor", unit: "IU/mL", reference: "<14" },
    ],
  },

  aso: {
    name: "ASO TITRE",
    department: "SEROLOGY",
    parameters: [
      { name: "ASO Titre", unit: "IU/mL", reference: "<200" },
    ],
  },

  widal: {
    name: "WIDAL TEST",
    department: "SEROLOGY",
    parameters: [
      { name: "S. Typhi O", unit: "Titre", reference: "Lab/Regional cut-off" },
      { name: "S. Typhi H", unit: "Titre", reference: "Lab/Regional cut-off" },
      { name: "S. Paratyphi AH", unit: "Titre", reference: "Lab/Regional cut-off" },
      { name: "S. Paratyphi BH", unit: "Titre", reference: "Lab/Regional cut-off" },
    ],
  },

  dengue: {
    name: "DENGUE PROFILE",
    department: "SEROLOGY",
    parameters: [
      { name: "Dengue NS1 Antigen", unit: "", reference: "Negative" },
      { name: "Dengue IgM", unit: "", reference: "Negative" },
      { name: "Dengue IgG", unit: "", reference: "Negative" },
    ],
  },

  malaria: {
    name: "MALARIA TEST",
    department: "PARASITOLOGY",
    parameters: [
      { name: "Malaria Parasite", unit: "", reference: "Not Detected" },
      { name: "P. falciparum", unit: "", reference: "Negative" },
      { name: "P. vivax", unit: "", reference: "Negative" },
    ],
  },

  hbsag: {
    name: "HBsAg",
    department: "SEROLOGY",
    parameters: [
      { name: "HBsAg", unit: "", reference: "Non-Reactive" },
    ],
  },

  hiv: {
    name: "HIV 1 & 2",
    department: "SEROLOGY",
    parameters: [
      { name: "HIV 1 & 2", unit: "", reference: "Non-Reactive" },
    ],
  },

  hcv: {
    name: "ANTI-HCV",
    department: "SEROLOGY",
    parameters: [
      { name: "Anti-HCV", unit: "", reference: "Non-Reactive" },
    ],
  },

  vdrl: {
    name: "VDRL",
    department: "SEROLOGY",
    parameters: [
      { name: "VDRL", unit: "", reference: "Non-Reactive" },
    ],
  },

  urine: {
    name: "URINE ROUTINE & MICROSCOPY",
    department: "CLINICAL PATHOLOGY",
    parameters: [
      { name: "PHYSICAL EXAMINATION", heading: true },

      { name: "Colour", unit: "", reference: "Pale Yellow" },
      { name: "Appearance", unit: "", reference: "Clear" },
      { name: "Specific Gravity", unit: "", reference: "1.005-1.030" },

      { name: "CHEMICAL EXAMINATION", heading: true },

      { name: "pH", unit: "", reference: "4.5-8.0" },
      { name: "Protein / Albumin", unit: "", reference: "Negative" },
      { name: "Sugar / Glucose", unit: "", reference: "Negative" },
      { name: "Ketone Bodies", unit: "", reference: "Negative" },
      { name: "Bile Salt", unit: "", reference: "Negative" },
      { name: "Bile Pigment", unit: "", reference: "Negative" },
      { name: "Blood", unit: "", reference: "Negative" },

      { name: "MICROSCOPIC EXAMINATION", heading: true },

      { name: "Pus Cells", unit: "/HPF", reference: "0-5" },
      { name: "Epithelial Cells", unit: "/HPF", reference: "0-5" },
      { name: "RBC", unit: "/HPF", reference: "0-2" },
      { name: "Casts", unit: "/LPF", reference: "Nil" },
      { name: "Crystals", unit: "", reference: "Nil" },
      { name: "Bacteria", unit: "", reference: "Nil" },
      { name: "Yeast Cells", unit: "", reference: "Nil" },
    ],
  },

  stool: {
    name: "STOOL ROUTINE & MICROSCOPY",
    department: "CLINICAL PATHOLOGY",
    parameters: [
      { name: "Colour", unit: "", reference: "Brown" },
      { name: "Consistency", unit: "", reference: "Formed" },
      { name: "Mucus", unit: "", reference: "Absent" },
      { name: "Blood", unit: "", reference: "Absent" },
      { name: "Pus Cells", unit: "/HPF", reference: "Nil / Few" },
      { name: "RBC", unit: "/HPF", reference: "Nil" },
      { name: "Ova", unit: "", reference: "Not Seen" },
      { name: "Cyst", unit: "", reference: "Not Seen" },
      { name: "Parasite", unit: "", reference: "Not Seen" },
    ],
  },

  pregnancy: {
    name: "URINE PREGNANCY TEST",
    department: "CLINICAL PATHOLOGY",
    parameters: [
      { name: "Urine Pregnancy Test", unit: "", reference: "Negative" },
    ],
  },

  semen: {
    name: "SEMEN ANALYSIS",
    department: "CLINICAL PATHOLOGY",
    parameters: [
      { name: "Volume", unit: "mL", reference: "≥1.4" },
      { name: "Colour / Appearance", unit: "", reference: "Grey-opalescent" },
      { name: "Liquefaction Time", unit: "minutes", reference: "Within 60" },
      { name: "pH", unit: "", reference: "≥7.2" },
      { name: "Sperm Concentration", unit: "million/mL", reference: "≥16" },
      { name: "Total Sperm Number", unit: "million/ejaculate", reference: "≥39" },
      { name: "Total Motility", unit: "%", reference: "≥42" },
      { name: "Progressive Motility", unit: "%", reference: "≥30" },
      { name: "Normal Forms", unit: "%", reference: "≥4" },
      { name: "Pus Cells", unit: "/HPF", reference: "Few / Nil" },
    ],
  },
};

/* =========================================================
   HELPER FUNCTIONS
   ========================================================= */

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

function getMasterTest(testName) {
  const n = normalizeText(testName);

  if (!n) return null;

  if (
    n.includes("completebloodcount") ||
    n === "cbc" ||
    n.includes("completehaemogram") ||
    n.includes("completehemogram")
  )
    return MASTER_TESTS.cbc;

  if (n === "esr" || n.includes("erythrocytesedimentation"))
    return MASTER_TESTS.esr;

  if (n.includes("bloodgroup") || n.includes("abogroup"))
    return MASTER_TESTS.bloodgroup;

  if (n.includes("bleedingtime") || n.includes("clottingtime") || n === "btct")
    return MASTER_TESTS.btct;

  if (n.includes("ptinr") || n.includes("prothrombintime"))
    return MASTER_TESTS.ptinr;

  if (n.includes("aptt") || n.includes("activatedpartial"))
    return MASTER_TESTS.aptt;

  if (
    n === "lft" ||
    n.includes("liverfunction") ||
    n.includes("liverprofile")
  )
    return MASTER_TESTS.lft;

  if (
    n === "kft" ||
    n === "rft" ||
    n.includes("kidneyfunction") ||
    n.includes("renalfunction")
  )
    return MASTER_TESTS.kft;

  if (n.includes("lipidprofile") || n === "lipid")
    return MASTER_TESTS.lipid;

  if (
    n.includes("ft3") ||
    n.includes("ft4") ||
    n.includes("freethyroid")
  )
    return MASTER_TESTS.thyroidft3ft4;

  if (
    n.includes("thyroidprofile") ||
    n.includes("thyroidfunction") ||
    n === "tft"
  )
    return MASTER_TESTS.thyroid;

  if (n.includes("fasting") || n === "fbs")
    return MASTER_TESTS.fbs;

  if (
    n.includes("postprandial") ||
    n.includes("postmeal") ||
    n === "ppbs"
  )
    return MASTER_TESTS.ppbs;

  if (n.includes("randomblood") || n === "rbs")
    return MASTER_TESTS.rbs;

  if (n.includes("hba1c") || n.includes("glycated"))
    return MASTER_TESTS.hba1c;

  if (n.includes("bloodglucose") || n.includes("bloodsugar"))
    return MASTER_TESTS.glucose;

  if (n.includes("uricacid"))
    return MASTER_TESTS.uricacid;

  if (n.includes("calcium"))
    return MASTER_TESTS.calcium;

  if (
    n.includes("electrolyte") ||
    (n.includes("sodium") && n.includes("potassium"))
  )
    return MASTER_TESTS.electrolytes;

  if (n.includes("ironprofile") || n.includes("ironstud"))
    return MASTER_TESTS.ironprofile;

  if (n === "crp" || n.includes("creactiveprotein"))
    return MASTER_TESTS.crp;

  if (
    n.includes("rafactor") ||
    n.includes("rheumatoidfactor")
  )
    return MASTER_TESTS.rafactor;

  if (n.includes("aso"))
    return MASTER_TESTS.aso;

  if (n.includes("widal") || n.includes("typhoid"))
    return MASTER_TESTS.widal;

  if (n.includes("dengue"))
    return MASTER_TESTS.dengue;

  if (n.includes("malaria"))
    return MASTER_TESTS.malaria;

  if (n.includes("hbsag") || n.includes("hepatitisbsurface"))
    return MASTER_TESTS.hbsag;

  if (n === "hiv" || n.includes("hiv1") || n.includes("hiv2"))
    return MASTER_TESTS.hiv;

  if (n.includes("hcv"))
    return MASTER_TESTS.hcv;

  if (n.includes("vdrl"))
    return MASTER_TESTS.vdrl;

  if (
    n.includes("urineroutine") ||
    n.includes("urinemicroscopy") ||
    n.includes("urineexamination") ||
    n === "urine"
  )
    return MASTER_TESTS.urine;

  if (
    n.includes("stoolroutine") ||
    n.includes("stoolmicroscopy") ||
    n.includes("stoolexamination") ||
    n === "stool"
  )
    return MASTER_TESTS.stool;

  if (
    n.includes("pregnancy") ||
    n.includes("upt")
  )
    return MASTER_TESTS.pregnancy;

  if (n.includes("semen"))
    return MASTER_TESTS.semen;

  return null;
}

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("en-IN");
  } catch {
    return String(value);
  }
}

function getPatientDetails(report) {
  const patient = report?.report_data?.patient || {};

  return {
    id:
      patient.id ||
      patient.patientId ||
      report?.patient_id ||
      "-",

    name:
      patient.name ||
      patient.patientName ||
      "-",

    age:
      patient.age ??
      "-",

    gender:
      patient.gender ||
      patient.sex ||
      "-",

    mobile:
      patient.mobile ||
      patient.phone ||
      "-",

    doctor:
      patient.doctor ||
      patient.refDoctor ||
      patient.referring_doctor ||
      "-",

    sampleDate:
      patient.sampleDate ||
      patient.sample_date ||
      report?.created_at ||
      "-",
  };
}

function getSelectedTests(report) {
  const data = report?.report_data || {};

  const possible =
    data.selectedTests ||
    data.selected_tests ||
    data.tests ||
    data.investigations ||
    [];

  return Array.isArray(possible) ? possible : [];
}

function getTestName(test) {
  if (typeof test === "string") return test;

  return (
    test?.name ||
    test?.testName ||
    test?.test_name ||
    test?.title ||
    test?.investigation ||
    "Investigation"
  );
}

function getParameters(test) {
  if (!test || typeof test === "string") {
    const master = getMasterTest(test);
    return master?.parameters || [];
  }

  const saved =
    test.tests ||
    test.parameters ||
    test.testParameters ||
    test.test_parameters ||
    test.items ||
    [];

  if (Array.isArray(saved) && saved.length > 0) {
    return saved;
  }

  const master = getMasterTest(getTestName(test));
  return master?.parameters || [];
}

function getDepartment(test) {
  return (
    test?.department ||
    test?.category ||
    getMasterTest(getTestName(test))?.department ||
    ""
  );
}

function getReference(parameter) {
  if (!parameter) return "-";

  return (
    parameter.reference ||
    parameter.referenceRange ||
    parameter.reference_range ||
    parameter.range ||
    parameter.normalRange ||
    (
      parameter.min !== undefined &&
      parameter.max !== undefined
        ? `${parameter.min} - ${parameter.max}`
        : "-"
    )
  );
}

function getUnit(parameter) {
  return (
    parameter?.unit ||
    parameter?.units ||
    "-"
  );
}

function getParameterName(parameter) {
  return (
    parameter?.name ||
    parameter?.parameterName ||
    parameter?.parameter_name ||
    parameter?.testName ||
    parameter?.label ||
    "-"
  );
}

function findValueInObject(obj, possibleKeys) {
  if (!obj || typeof obj !== "object") return undefined;

  for (const key of possibleKeys) {
    if (key === undefined || key === null || key === "") continue;

    if (
      Object.prototype.hasOwnProperty.call(obj, key) &&
      obj[key] !== undefined &&
      obj[key] !== null &&
      obj[key] !== ""
    ) {
      return obj[key];
    }
  }

  const normalizedKeys = possibleKeys
    .filter(Boolean)
    .map((x) => normalizeText(x));

  for (const [key, value] of Object.entries(obj)) {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      normalizedKeys.includes(normalizeText(key))
    ) {
      return value;
    }
  }

  return undefined;
}

function getResultValue(report, test, parameter, testIndex, parameterIndex) {
  const reportData = report?.report_data || {};
  const results =
    reportData.results ||
    reportData.testResults ||
    reportData.test_results ||
    {};

  const testName = getTestName(test);
  const parameterName = getParameterName(parameter);

  const possibleKeys = [
    parameter?.id,
    parameter?.parameter_id,
    parameter?.key,

    `${test?.id}-${parameterName}-${parameterIndex}`,
    `${test?.id}-${parameter?.id}`,
    `${testIndex}-${parameterIndex}`,

    parameterName,
    normalizeText(parameterName),

    `${testName}-${parameterName}`,
    normalizeText(`${testName}-${parameterName}`),
  ];

  let value = findValueInObject(results, possibleKeys);

  if (value !== undefined) return value;

  if (test?.results && typeof test.results === "object") {
    value = findValueInObject(test.results, possibleKeys);
    if (value !== undefined) return value;
  }

  if (
    parameter?.result !== undefined &&
    parameter?.result !== null &&
    parameter?.result !== ""
  ) {
    return parameter.result;
  }

  if (
    parameter?.value !== undefined &&
    parameter?.value !== null &&
    parameter?.value !== ""
  ) {
    return parameter.value;
  }

  return "";
}

function getTestNames(report) {
  const tests = getSelectedTests(report);

  if (!tests.length) return "-";

  return tests
    .map((test) => getTestName(test))
    .filter(Boolean)
    .join(", ");
}

function getNumericValue(value) {
  if (value === null || value === undefined) return null;

  const cleaned = String(value)
    .replace(/,/g, "")
    .match(/-?\d+(\.\d+)?/);

  if (!cleaned) return null;

  const number = Number(cleaned[0]);

  return Number.isFinite(number) ? number : null;
}

function getFlag(value, parameter) {
  const number = getNumericValue(value);

  if (number === null) return "";

  const min =
    parameter?.min !== undefined
      ? Number(parameter.min)
      : null;

  const max =
    parameter?.max !== undefined
      ? Number(parameter.max)
      : null;

  if (min !== null && Number.isFinite(min) && number < min) {
    return "L";
  }

  if (max !== null && Number.isFinite(max) && number > max) {
    return "H";
  }

  return "";
}

/* =========================================================
   MAIN PAGE
   ========================================================= */

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReports(data || []);
    } catch (error) {
      console.error("Reports load error:", error);

      setErrorMessage(
        error?.message ||
        "Reports load nahi ho paayi."
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteReport(report) {
    const confirmed = window.confirm(
      `Kya aap ${report?.report_no || "is report"} ko delete karna chahte hain?`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", report.id);

      if (error) throw error;

      setReports((current) =>
        current.filter((item) => item.id !== report.id)
      );

      if (selectedReport?.id === report.id) {
        setSelectedReport(null);
      }

      alert("Report successfully delete ho gayi.");
    } catch (error) {
      console.error("Delete report error:", error);

      alert(
        "Report delete nahi hui: " +
        (error?.message || "Unknown error")
      );
    }
  }

  function printReport(report) {
    setSelectedReport(report);

    setTimeout(() => {
      window.print();
    }, 400);
  }

  const selectedPatient =
    selectedReport
      ? getPatientDetails(selectedReport)
      : null;

  return (
    <main style={pageStyle}>

      {/* =========================
          SCREEN HEADER
          ========================= */}

      <div className="noPrint">
        <div style={topBarStyle}>
          <div>
            <h1 style={{ margin: 0 }}>
              Saved Reports
            </h1>

            <p
              style={{
                marginTop: "6px",
                color: "#666",
              }}
            >
              NIDAN PATHOLOGY LAB
            </p>
          </div>

          <button
            onClick={loadReports}
            style={buttonStyle}
          >
            🔄 Refresh
          </button>
        </div>

        {loading && (
          <div style={messageStyle}>
            Reports loading...
          </div>
        )}

        {!loading && errorMessage && (
          <div style={messageStyle}>
            <strong>Report load nahi hui.</strong>
            <div>{errorMessage}</div>
          </div>
        )}

        {!loading &&
          !errorMessage &&
          reports.length === 0 && (
            <div style={messageStyle}>
              <h3>No Saved Reports</h3>
              <p>
                Abhi Supabase me koi saved report
                nahi mili.
              </p>
            </div>
          )}

        {!loading &&
          !errorMessage &&
          reports.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={listTableStyle}>
                <thead>
                  <tr>
                    <th style={listThStyle}>
                      Report No.
                    </th>

                    <th style={listThStyle}>
                      Patient
                    </th>

                    <th style={listThStyle}>
                      Tests
                    </th>

                    <th style={listThStyle}>
                      Status
                    </th>

                    <th style={listThStyle}>
                      Saved Date
                    </th>

                    <th style={listThStyle}>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {reports.map((report) => {
                    const patient =
                      getPatientDetails(report);

                    return (
                      <tr key={report.id}>
                        <td style={listTdStyle}>
                          {report.report_no || "-"}
                        </td>

                        <td style={listTdStyle}>
                          {patient.name}
                        </td>

                        <td style={listTdStyle}>
                          {getTestNames(report)}
                        </td>

                        <td style={listTdStyle}>
                          {report.status || "completed"}
                        </td>

                        <td style={listTdStyle}>
                          {formatDate(report.created_at)}
                        </td>

                        <td style={listTdStyle}>
                          <div style={actionStyle}>
                            <button
                              onClick={() =>
                                setSelectedReport(report)
                              }
                              style={smallButtonStyle}
                            >
                              👁 View
                            </button>

                            <button
                              onClick={() =>
                                printReport(report)
                              }
                              style={smallButtonStyle}
                            >
                              🖨 Print
                            </button>

                            <button
                              onClick={() =>
                                deleteReport(report)
                              }
                              style={deleteButtonStyle}
                            >
                              🗑 Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        {/* =========================
            REPORT PREVIEW
            ========================= */}

        {selectedReport && selectedPatient && (
          <div style={previewBoxStyle}>
            <div style={previewHeaderStyle}>
              <div>
                <h2 style={{ margin: 0 }}>
                  Report Preview
                </h2>

                <strong>
                  {selectedReport.report_no || "-"}
                </strong>
              </div>

              <button
                onClick={() =>
                  setSelectedReport(null)
                }
                style={buttonStyle}
              >
                ✕ Close
              </button>
            </div>

            <ReportContent
              report={selectedReport}
              patient={selectedPatient}
            />

            <div style={previewActionsStyle}>
              <button
                onClick={() =>
                  printReport(selectedReport)
                }
                style={buttonStyle}
              >
                🖨 Print / Save PDF
              </button>

              <button
                onClick={() =>
                  deleteReport(selectedReport)
                }
                style={deleteButtonStyle}
              >
                🗑 Delete Report
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================
          PRINT ONLY REPORT
          ========================= */}

      {selectedReport && selectedPatient && (
        <div className="printOnly">
          <ReportContent
            report={selectedReport}
            patient={selectedPatient}
          />
        </div>
      )}

      <style jsx global>{`
        .printOnly {
          display: none;
        }

        @media print {
          .noPrint {
            display: none !important;
          }

          .printOnly {
            display: block !important;
          }

          html,
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          @page {
            size: A4;
            margin: 8mm;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </main>
  );
}

/* =========================================================
   REPORT CONTENT
   ========================================================= */

function ReportContent({ report, patient }) {
  const selectedTests = getSelectedTests(report);

  return (
    <div style={reportPaperStyle}>

      {/* =========================
          LAB HEADER
          ========================= */}

      <div style={labHeaderStyle}>
        <h1 style={labNameStyle}>
          NIDAN PATHOLOGY LAB
        </h1>

        <div style={subtitleStyle}>
          Fully Computerised Clinical Pathology
          & Diagnostic Laboratory
        </div>

        <div style={reportTitleStyle}>
          LABORATORY REPORT
        </div>
      </div>

      {/* =========================
          PATIENT INFORMATION
          ========================= */}

      <table style={patientTableStyle}>
        <tbody>
          <tr>
            <td style={patientCellStyle}>
              <strong>Report No:</strong>{" "}
              {report.report_no || "-"}
            </td>

            <td style={patientCellStyle}>
              <strong>Patient ID:</strong>{" "}
              {patient.id}
            </td>
          </tr>

          <tr>
            <td style={patientCellStyle}>
              <strong>Patient Name:</strong>{" "}
              {patient.name}
            </td>

            <td style={patientCellStyle}>
              <strong>Age / Sex:</strong>{" "}
              {patient.age} / {patient.gender}
            </td>
          </tr>

          <tr>
            <td style={patientCellStyle}>
              <strong>Mobile:</strong>{" "}
              {patient.mobile}
            </td>

            <td style={patientCellStyle}>
              <strong>Ref. Doctor:</strong>{" "}
              {patient.doctor}
            </td>
          </tr>

          <tr>
            <td style={patientCellStyle}>
              <strong>Sample Date:</strong>{" "}
              {formatDate(patient.sampleDate)}
            </td>

            <td style={patientCellStyle}>
              <strong>Report Date:</strong>{" "}
              {formatDate(report.created_at)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* =========================
          TEST RESULTS
          ========================= */}

      <div style={{ marginTop: "18px" }}>
        {selectedTests.length === 0 ? (
          <div style={messageStyle}>
            No investigations found in saved
            report.
          </div>
        ) : (
          selectedTests.map((test, testIndex) => {
            const testName = getTestName(test);
            const master = getMasterTest(testName);

            const parameters =
              getParameters(test);

            const displayName =
              master?.name ||
              testName ||
              "INVESTIGATION";

            const department =
              getDepartment(test);

            return (
              <section
                key={
                  test?.id ||
                  `${testName}-${testIndex}`
                }
                style={testSectionStyle}
              >
                {department && (
                  <div style={departmentStyle}>
                    {department}
                  </div>
                )}

                <h2 style={testTitleStyle}>
                  {displayName}
                </h2>

                {parameters.length === 0 ? (
                  <div style={messageStyle}>
                    Is test ke parameters saved nahi
                    mile.
                  </div>
                ) : (
                  <table style={resultTableStyle}>
                    <thead>
                      <tr>
                        <th style={investigationThStyle}>
                          INVESTIGATION
                        </th>

                        <th style={flagThStyle}>
                          FLAG
                        </th>

                        <th style={resultThStyle}>
                          RESULT
                        </th>

                        <th style={unitThStyle}>
                          UNIT
                        </th>

                        <th style={referenceThStyle}>
                          REFERENCE RANGE
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {parameters.map(
                        (parameter, parameterIndex) => {
                          if (parameter?.heading) {
                            return (
                              <tr
                                key={`heading-${parameterIndex}`}
                              >
                                <td
                                  colSpan={5}
                                  style={groupHeadingStyle}
                                >
                                  {parameter.name}
                                </td>
                              </tr>
                            );
                          }

                          const value =
                            getResultValue(
                              report,
                              test,
                              parameter,
                              testIndex,
                              parameterIndex
                            );

                          const flag =
                            getFlag(
                              value,
                              parameter
                            );

                          return (
                            <tr
                              key={
                                parameter?.id ||
                                `${getParameterName(
                                  parameter
                                )}-${parameterIndex}`
                              }
                            >
                              <td
                                style={
                                  investigationTdStyle
                                }
                              >
                                {getParameterName(
                                  parameter
                                )}
                              </td>

                              <td
                                style={{
                                  ...flagTdStyle,
                                  fontWeight: flag
                                    ? "700"
                                    : "400",
                                }}
                              >
                                {flag}
                              </td>

                              <td
                                style={
                                  resultTdStyle
                                }
                              >
                                <strong>
                                  {value !== ""
                                    ? String(value)
                                    : "-"}
                                </strong>
                              </td>

                              <td
                                style={
                                  normalTdStyle
                                }
                              >
                                {getUnit(
                                  parameter
                                )}
                              </td>

                              <td
                                style={
                                  normalTdStyle
                                }
                              >
                                {getReference(
                                  parameter
                                )}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                )}
              </section>
            );
          })
        )}
      </div>

      {/* =========================
          NOTE
          ========================= */}

      <div style={noteStyle}>
        <strong>Note:</strong>{" "}
        Reference intervals may vary according
        to age, sex, methodology and laboratory
        standards. Results should be interpreted
        with clinical findings.
      </div>

      {/* =========================
          SIGNATURE
          ========================= */}

      <div style={signatureStyle}>
        <div>
          <strong>Lab Technician</strong>
          <br />
          <span>NIDAN Pathology Lab</span>
        </div>

        <div style={{ textAlign: "right" }}>
          <strong>Authorized Signatory</strong>
          <br />
          <span>Signature & Seal</span>
        </div>
      </div>

      <div style={footerStyle}>
        Computer Generated Laboratory Report
      </div>
    </div>
  );
}

/* =========================================================
   STYLES
   ========================================================= */

const pageStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "24px 16px",
  fontFamily:
    "Arial, Helvetica, sans-serif",
};

const topBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "24px",
};

const buttonStyle = {
  padding: "10px 16px",
  cursor: "pointer",
  borderRadius: "8px",
  border: "1px solid #888",
  background: "#fff",
  fontSize: "14px",
};

const smallButtonStyle = {
  padding: "7px 10px",
  cursor: "pointer",
  borderRadius: "6px",
  border: "1px solid #888",
  background: "#fff",
  whiteSpace: "nowrap",
};

const deleteButtonStyle = {
  padding: "7px 10px",
  cursor: "pointer",
  borderRadius: "6px",
  border: "1px solid #b33",
  background: "#fff",
  whiteSpace: "nowrap",
};

const messageStyle = {
  padding: "16px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  margin: "10px 0",
};

const listTableStyle = {
  width: "100%",
  minWidth: "900px",
  borderCollapse: "collapse",
};

const listThStyle = {
  textAlign: "left",
  padding: "10px",
  borderBottom: "2px solid #ddd",
  background: "#f5f5f5",
};

const listTdStyle = {
  padding: "10px",
  borderBottom: "1px solid #ddd",
  verticalAlign: "top",
};

const actionStyle = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap",
};

const previewBoxStyle = {
  marginTop: "30px",
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "20px",
};

const previewHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const previewActionsStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "20px",
};

const reportPaperStyle = {
  maxWidth: "850px",
  margin: "0 auto",
  background: "#fff",
  color: "#111",
  padding: "26px",
  boxSizing: "border-box",
};

const labHeaderStyle = {
  textAlign: "center",
  borderBottom: "2px solid #222",
  paddingBottom: "12px",
  marginBottom: "14px",
};

const labNameStyle = {
  margin: "0 0 5px",
  fontSize: "28px",
  fontWeight: "800",
};

const subtitleStyle = {
  fontSize: "14px",
  marginBottom: "8px",
};

const reportTitleStyle = {
  fontSize: "14px",
  fontWeight: "700",
  letterSpacing: "1px",
};

const patientTableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
};

const patientCellStyle = {
  width: "50%",
  padding: "7px 8px",
  borderBottom: "1px solid #ddd",
  verticalAlign: "top",
};

const testSectionStyle = {
  marginBottom: "24px",
  pageBreakInside: "avoid",
};

const departmentStyle = {
  textAlign: "center",
  fontWeight: "700",
  fontSize: "13px",
  marginBottom: "2px",
};

const testTitleStyle = {
  textAlign: "center",
  fontSize: "16px",
  margin: "0 0 8px",
  paddingBottom: "5px",
  borderBottom: "1px solid #333",
};

const resultTableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "12px",
};

const commonTh = {
  padding: "7px 5px",
  borderTop: "1px solid #333",
  borderBottom: "1px solid #333",
  background: "#f3f3f3",
  fontWeight: "700",
};

const investigationThStyle = {
  ...commonTh,
  textAlign: "left",
  width: "36%",
};

const flagThStyle = {
  ...commonTh,
  textAlign: "center",
  width: "7%",
};

const resultThStyle = {
  ...commonTh,
  textAlign: "center",
  width: "15%",
};

const unitThStyle = {
  ...commonTh,
  textAlign: "center",
  width: "15%",
};

const referenceThStyle = {
  ...commonTh,
  textAlign: "center",
  width: "27%",
};

const investigationTdStyle = {
  padding: "6px 5px",
  borderBottom: "1px solid #ddd",
  textAlign: "left",
};

const flagTdStyle = {
  padding: "6px 4px",
  borderBottom: "1px solid #ddd",
  textAlign: "center",
};

const resultTdStyle = {
  padding: "6px 5px",
  borderBottom: "1px solid #ddd",
  textAlign: "center",
};

const normalTdStyle = {
  padding: "6px 5px",
  borderBottom: "1px solid #ddd",
  textAlign: "center",
};

const groupHeadingStyle = {
  padding: "7px 5px 4px",
  fontWeight: "700",
  borderBottom: "1px solid #ddd",
  textAlign: "left",
};

const noteStyle = {
  marginTop: "20px",
  paddingTop: "10px",
  borderTop: "1px solid #aaa",
  fontSize: "11px",
  lineHeight: "1.5",
};

const signatureStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "30px",
  marginTop: "55px",
  fontSize: "12px",
};

const footerStyle = {
  borderTop: "1px solid #aaa",
  marginTop: "30px",
  paddingTop: "10px",
  textAlign: "center",
  fontSize: "11px",
};
