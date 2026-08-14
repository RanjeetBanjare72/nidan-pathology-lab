"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

const SETTINGS_KEY = "nidanLabSettings";

const DEFAULT_SETTINGS = {
  labName: "NIDAN PATHOLOGY LAB",
  slogan: "Accurate Diagnosis • Trusted Care • Better Health",
  labAddress:
    "Gram/Singhanpur, Tehsil Sarangarh, District Sarangarh-Bilaigarh, Chhattisgarh",
  phone: "7987580004, 8889325233",
  email: "",
  registrationNo: "",
  doctorName: "",
  letterhead: "",
  reportHeader: true,
  showLogo: true,
  showReferenceRange: true,
  showFlag: true,
};

/* =========================================================
   MASTER TESTS
========================================================= */

const MASTER_TESTS = [
  {
    id: "cbc",
    name: "Complete Blood Count (CBC)",
    short: "CBC",
    category: "HAEMATOLOGY",

    parameters: [
      {
        name: "Haemoglobin",
        aliases: ["Hemoglobin", "Hb"],
        unit: "g/dL",
        maleMin: 13,
        maleMax: 17,
        femaleMin: 12,
        femaleMax: 15,
        maleRange: "13 - 17",
        femaleRange: "12 - 15",
      },

      {
        name: "Total Leucocyte Count (TLC)",
        aliases: [
          "Total WBC Count",
          "WBC Count",
          "TLC",
          "Total Leukocyte Count",
        ],
        unit: "/cumm",
        min: 4000,
        max: 11000,
        range: "4,000 - 11,000",
      },

      {
        name: "Neutrophils",
        aliases: ["Neutrophil"],
        unit: "%",
        min: 40,
        max: 75,
        range: "40 - 75",
      },

      {
        name: "Lymphocytes",
        aliases: ["Lymphocyte"],
        unit: "%",
        min: 20,
        max: 40,
        range: "20 - 40",
      },

      {
        name: "Eosinophils",
        aliases: ["Eosinophil"],
        unit: "%",
        min: 1,
        max: 6,
        range: "1 - 6",
      },

      {
        name: "Monocytes",
        aliases: ["Monocyte"],
        unit: "%",
        min: 1,
        max: 10,
        range: "1 - 10",
      },

      {
        name: "Basophils",
        aliases: ["Basophil"],
        unit: "%",
        min: 0,
        max: 1,
        range: "0 - 1",
      },

      {
        name: "RBC Count",
        aliases: [
          "RBC",
          "Red Blood Cell Count",
          "Total RBC Count",
        ],
        unit: "million/cumm",
        maleMin: 4.5,
        maleMax: 6,
        femaleMin: 4,
        femaleMax: 5.5,
        maleRange: "4.5 - 6.0",
        femaleRange: "4.0 - 5.5",
      },

      {
        name: "PCV / Haematocrit",
        aliases: [
          "PCV",
          "Hematocrit",
          "Haematocrit",
          "PCV / Hematocrit",
        ],
        unit: "%",
        maleMin: 40,
        maleMax: 50,
        femaleMin: 36,
        femaleMax: 46,
        maleRange: "40 - 50",
        femaleRange: "36 - 46",
      },

      {
        name: "MCV",
        aliases: [],
        unit: "fL",
        min: 80,
        max: 100,
        range: "80 - 100",
      },

      {
        name: "MCH",
        aliases: [],
        unit: "pg",
        min: 27,
        max: 32,
        range: "27 - 32",
      },

      {
        name: "MCHC",
        aliases: [],
        unit: "g/dL",
        min: 32,
        max: 36,
        range: "32 - 36",
      },

      {
        name: "RDW-CV",
        aliases: ["RDW", "RDW CV"],
        unit: "%",
        min: 11.5,
        max: 14.5,
        range: "11.5 - 14.5",
      },

      {
        name: "Platelet Count",
        aliases: ["Platelets", "Total Platelet Count"],
        unit: "Lac/cumm",
        min: 1.5,
        max: 4.5,
        range: "1.5 - 4.5",
      },

      {
        name: "MPV",
        aliases: ["Mean Platelet Volume"],
        unit: "fL",
        min: 7.5,
        max: 11.5,
        range: "7.5 - 11.5",
      },

      {
        name: "PDW",
        aliases: ["Platelet Distribution Width"],
        unit: "%",
        min: 9,
        max: 17,
        range: "9 - 17",
      },

      {
        name: "PCT",
        aliases: ["Plateletcrit"],
        unit: "%",
        min: 0.15,
        max: 0.4,
        range: "0.15 - 0.40",
      },
    ],
  },

  {
    id: "esr",
    name: "Erythrocyte Sedimentation Rate (ESR)",
    short: "ESR",
    category: "HAEMATOLOGY",

    parameters: [
      {
        name: "ESR",
        aliases: ["Erythrocyte Sedimentation Rate"],
        unit: "mm/hr",
        maleMin: 0,
        maleMax: 15,
        femaleMin: 0,
        femaleMax: 20,
        maleRange: "0 - 15",
        femaleRange: "0 - 20",
      },
    ],
  },

  {
    id: "sugar",
    name: "Blood Glucose",
    short: "Blood Sugar",
    category: "BIOCHEMISTRY",

    parameters: [
      {
        name: "Fasting Blood Sugar",
        aliases: ["FBS", "Fasting Glucose", "Fasting Blood Glucose"],
        unit: "mg/dL",
        min: 70,
        max: 99,
        range: "70 - 99",
      },

      {
        name: "Post Prandial Blood Sugar",
        aliases: [
          "PPBS",
          "Post Prandial Glucose",
          "Postprandial Blood Sugar",
        ],
        unit: "mg/dL",
        min: 70,
        max: 140,
        range: "70 - 140",
      },

      {
        name: "Random Blood Sugar",
        aliases: [
          "RBS",
          "Random Glucose",
          "Random Blood Glucose",
        ],
        unit: "mg/dL",
        min: 70,
        max: 140,
        range: "70 - 140",
      },
    ],
  },

  {
    id: "kft",
    name: "Kidney Function Test",
    short: "KFT",
    category: "BIOCHEMISTRY",

    parameters: [
      {
        name: "Blood Urea",
        aliases: ["Urea", "Serum Urea"],
        unit: "mg/dL",
        min: 15,
        max: 40,
        range: "15 - 40",
      },

      {
        name: "Serum Creatinine",
        aliases: ["Creatinine"],
        unit: "mg/dL",
        min: 0.6,
        max: 1.3,
        range: "0.6 - 1.3",
      },

      {
        name: "Uric Acid",
        aliases: ["Serum Uric Acid"],
        unit: "mg/dL",
        maleMin: 3.4,
        maleMax: 7,
        femaleMin: 2.4,
        femaleMax: 6,
        maleRange: "3.4 - 7.0",
        femaleRange: "2.4 - 6.0",
      },

      {
        name: "Sodium",
        aliases: ["Serum Sodium", "Na+"],
        unit: "mEq/L",
        min: 135,
        max: 145,
        range: "135 - 145",
      },

      {
        name: "Potassium",
        aliases: ["Serum Potassium", "K+"],
        unit: "mEq/L",
        min: 3.5,
        max: 5.1,
        range: "3.5 - 5.1",
      },

      {
        name: "Chloride",
        aliases: ["Serum Chloride", "Cl-"],
        unit: "mEq/L",
        min: 98,
        max: 107,
        range: "98 - 107",
      },

      {
        name: "BUN",
        aliases: ["Blood Urea Nitrogen"],
        unit: "mg/dL",
        min: 7,
        max: 20,
        range: "7 - 20",
      },
    ],
  },

  {
    id: "lft",
    name: "Liver Function Test",
    short: "LFT",
    category: "BIOCHEMISTRY",

    parameters: [
      {
        name: "Total Bilirubin",
        aliases: ["Bilirubin Total", "Serum Bilirubin Total"],
        unit: "mg/dL",
        min: 0.2,
        max: 1.2,
        range: "0.2 - 1.2",
      },

      {
        name: "Direct Bilirubin",
        aliases: ["Bilirubin Direct"],
        unit: "mg/dL",
        min: 0,
        max: 0.3,
        range: "0 - 0.3",
      },

      {
        name: "Indirect Bilirubin",
        aliases: ["Bilirubin Indirect"],
        unit: "mg/dL",
        min: 0.2,
        max: 0.9,
        range: "0.2 - 0.9",
      },

      {
        name: "SGOT / AST",
        aliases: ["SGOT", "AST"],
        unit: "U/L",
        min: 0,
        max: 40,
        range: "Up to 40",
      },

      {
        name: "SGPT / ALT",
        aliases: ["SGPT", "ALT"],
        unit: "U/L",
        min: 0,
        max: 40,
        range: "Up to 40",
      },

      {
        name: "Alkaline Phosphatase",
        aliases: ["ALP"],
        unit: "U/L",
        min: 44,
        max: 147,
        range: "44 - 147",
      },

      {
        name: "Total Protein",
        aliases: ["Serum Total Protein"],
        unit: "g/dL",
        min: 6,
        max: 8.3,
        range: "6.0 - 8.3",
      },

      {
        name: "Albumin",
        aliases: ["Serum Albumin"],
        unit: "g/dL",
        min: 3.5,
        max: 5,
        range: "3.5 - 5.0",
      },

      {
        name: "Globulin",
        aliases: ["Serum Globulin"],
        unit: "g/dL",
        min: 2,
        max: 3.5,
        range: "2.0 - 3.5",
      },
    ],
  },

  {
    id: "lipid",
    name: "Lipid Profile",
    short: "Lipid Profile",
    category: "BIOCHEMISTRY",

    parameters: [
      {
        name: "Total Cholesterol",
        aliases: ["Cholesterol"],
        unit: "mg/dL",
        min: 0,
        max: 200,
        range: "< 200",
      },

      {
        name: "Triglycerides",
        aliases: ["TG"],
        unit: "mg/dL",
        min: 0,
        max: 150,
        range: "< 150",
      },

      {
        name: "HDL Cholesterol",
        aliases: ["HDL", "HDL-C"],
        unit: "mg/dL",
        min: 40,
        max: 100,
        range: "40 - 100",
      },

      {
        name: "LDL Cholesterol",
        aliases: ["LDL", "LDL-C"],
        unit: "mg/dL",
        min: 0,
        max: 100,
        range: "< 100",
      },

      {
        name: "VLDL Cholesterol",
        aliases: ["VLDL", "VLDL-C"],
        unit: "mg/dL",
        min: 5,
        max: 40,
        range: "5 - 40",
      },
    ],
  },

  {
    id: "hba1c",
    name: "HbA1c",
    short: "HbA1c",
    category: "BIOCHEMISTRY",

    parameters: [
      {
        name: "HbA1c",
        aliases: ["Glycated Hemoglobin", "Glycosylated Hemoglobin"],
        unit: "%",
        min: 4,
        max: 5.6,
        range: "4.0 - 5.6",
      },
    ],
  },

  {
    id: "thyroid",
    name: "Thyroid Profile",
    short: "Thyroid",
    category: "HORMONE",

    parameters: [
      {
        name: "T3",
        aliases: ["Triiodothyronine", "Total T3"],
        unit: "ng/dL",
        min: 80,
        max: 200,
        range: "80 - 200",
      },

      {
        name: "T4",
        aliases: ["Thyroxine", "Total T4"],
        unit: "µg/dL",
        min: 5.1,
        max: 14.1,
        range: "5.1 - 14.1",
      },

      {
        name: "TSH",
        aliases: ["Thyroid Stimulating Hormone"],
        unit: "µIU/mL",
        min: 0.4,
        max: 4,
        range: "0.4 - 4.0",
      },
    ],
  },
];

/* =========================================================
   BASIC HELPERS
========================================================= */

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[()[\]{}]/g, "")
    .replace(/[./_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function asObject(value) {
  if (!value) return {};

  if (
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return parsed;
      }
    } catch {
      return {};
    }
  }

  return {};
}

function asArray(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

/* =========================================================
   PATIENT
========================================================= */

function getGender(patient) {
  const value = normalizeText(
    patient?.gender ||
      patient?.sex ||
      patient?.patientGender ||
      ""
  );

  if (value === "male" || value === "m") {
    return "male";
  }

  if (value === "female" || value === "f") {
    return "female";
  }

  return "";
}

/* =========================================================
   MASTER TEST MATCH
========================================================= */

function findMasterTest(test) {
  if (!test) return null;

  const id = normalizeText(
    test?.id ||
      test?.testId ||
      test?.test_id ||
      ""
  );

  const name = normalizeText(
    test?.name ||
      test?.testName ||
      test?.short ||
      ""
  );

  return (
    MASTER_TESTS.find((master) => {
      const masterId = normalizeText(master.id);
      const masterName = normalizeText(master.name);
      const masterShort = normalizeText(master.short);

      return (
        id === masterId ||
        name === masterName ||
        name === masterShort ||
        (name.length > 3 &&
          masterName.includes(name)) ||
        (name.length > 3 &&
          name.includes(masterName))
      );
    }) || null
  );
}

function findMasterParameter(parameterName, test) {
  const target = normalizeText(parameterName);

  if (!target) return null;

  const search = (group) => {
    return group.parameters.find((parameter) => {
      const names = [
        parameter.name,
        ...(parameter.aliases || []),
      ].map(normalizeText);

      return names.some(
        (name) =>
          name === target ||
          (name.length > 3 &&
            target.length > 3 &&
            (name.includes(target) ||
              target.includes(name)))
      );
    });
  };

  const masterTest = findMasterTest(test);

  if (masterTest) {
    const match = search(masterTest);

    if (match) return match;
  }

  for (const group of MASTER_TESTS) {
    const match = search(group);

    if (match) return match;
  }

  return null;
}

/* =========================================================
   PARAMETER
========================================================= */

function getEffectiveParameter(parameter, test) {
  const parameterName =
    typeof parameter === "string"
      ? parameter
      : parameter?.name ||
        parameter?.testName ||
        parameter?.investigation ||
        parameter?.parameterName ||
        "";

  const master = findMasterParameter(
    parameterName,
    test
  );

  const saved =
    typeof parameter === "object" &&
    parameter
      ? parameter
      : {};

  if (!master) {
    return {
      ...saved,

      name:
        parameterName ||
        "Investigation",

      unit:
        saved.unit ||
        saved.units ||
        "",

      range:
        saved.range ||
        saved.referenceRange ||
        saved.reference ||
        "",

      min:
        saved.min ??
        saved.minimum ??
        null,

      max:
        saved.max ??
        saved.maximum ??
        null,
    };
  }

  return {
    ...master,
    ...saved,

    name:
      parameterName ||
      master.name,

    unit:
      saved.unit ||
      saved.units ||
      master.unit,

    range:
      saved.range ||
      saved.referenceRange ||
      saved.reference ||
      master.range,

    maleRange:
      saved.maleRange ||
      master.maleRange,

    femaleRange:
      saved.femaleRange ||
      master.femaleRange,

    min:
      saved.min ??
      saved.minimum ??
      master.min,

    max:
      saved.max ??
      saved.maximum ??
      master.max,

    maleMin:
      saved.maleMin ??
      master.maleMin,

    maleMax:
      saved.maleMax ??
      master.maleMax,

    femaleMin:
      saved.femaleMin ??
      master.femaleMin,

    femaleMax:
      saved.femaleMax ??
      master.femaleMax,
  };
}

/* =========================================================
   REFERENCE RANGE
========================================================= */

function getReferenceRange(
  parameter,
  patient,
  test
) {
  const p = getEffectiveParameter(
    parameter,
    test
  );

  const gender = getGender(patient);

  if (
    gender === "male" &&
    p.maleRange
  ) {
    return p.maleRange;
  }

  if (
    gender === "female" &&
    p.femaleRange
  ) {
    return p.femaleRange;
  }

  if (
    gender === "male" &&
    p.maleMin != null &&
    p.maleMax != null
  ) {
    return `${p.maleMin} - ${p.maleMax}`;
  }

  if (
    gender === "female" &&
    p.femaleMin != null &&
    p.femaleMax != null
  ) {
    return `${p.femaleMin} - ${p.femaleMax}`;
  }

  if (p.range) {
    return p.range;
  }

  if (
    p.min != null &&
    p.max != null
  ) {
    return `${p.min} - ${p.max}`;
  }

  return "-";
}

/* =========================================================
   HIGH / LOW FLAG
========================================================= */

function getLimits(
  parameter,
  patient,
  test
) {
  const p = getEffectiveParameter(
    parameter,
    test
  );

  const gender = getGender(patient);

  if (
    gender === "male" &&
    p.maleMin != null &&
    p.maleMax != null
  ) {
    return {
      min: Number(p.maleMin),
      max: Number(p.maleMax),
    };
  }

  if (
    gender === "female" &&
    p.femaleMin != null &&
    p.femaleMax != null
  ) {
    return {
      min: Number(p.femaleMin),
      max: Number(p.femaleMax),
    };
  }

  if (
    p.min != null &&
    p.max != null
  ) {
    return {
      min: Number(p.min),
      max: Number(p.max),
    };
  }

  return {
    min: null,
    max: null,
  };
}

function getFlag(
  value,
  parameter,
  patient,
  test
) {
  if (
    value === "" ||
    value == null
  ) {
    return "";
  }

  const numeric = Number(
    String(value)
      .replace(/,/g, "")
      .trim()
  );

  if (Number.isNaN(numeric)) {
    return "";
  }

  const {
    min,
    max,
  } = getLimits(
    parameter,
    patient,
    test
  );

  if (
    min != null &&
    numeric < min
  ) {
    return "L";
  }

  if (
    max != null &&
    numeric > max
  ) {
    return "H";
  }

  return "";
}

/* =========================================================
   REPORT DATA
========================================================= */

function getReportData(report) {
  return asObject(
    report?.report_data
  );
}

function getReportTests(report) {
  if (!report) return [];

  const data =
    getReportData(report);

  const candidates = [
    report.tests,
    report.selectedTests,
    report.reportTests,
    data.tests,
    data.selectedTests,
    data.reportTests,
  ];

  for (const candidate of candidates) {
    const arr = asArray(candidate);

    if (arr.length) {
      return arr;
    }
  }

  return [];
}

function getParameters(test) {
  if (!test) return [];

  const candidates = [
    test.parameters,
    test.tests,
    test.items,
    test.investigations,
  ];

  for (const candidate of candidates) {
    const arr = asArray(candidate);

    if (arr.length) {
      return arr;
    }
  }

  return [];
}

function getResultsObject(report) {
  const data =
    getReportData(report);

  const candidates = [
    report?.results,
    report?.testResults,
    data?.results,
    data?.testResults,
  ];

  for (const candidate of candidates) {
    const object =
      asObject(candidate);

    if (
      Object.keys(object).length
    ) {
      return object;
    }
  }

  return {};
}

/* =========================================================
   RESULT FINDER
========================================================= */

function getResult(
  report,
  test,
  parameter,
  index,
  testIndex
) {
  if (
    parameter &&
    typeof parameter === "object"
  ) {
    if (
      parameter.result != null &&
      parameter.result !== ""
    ) {
      return parameter.result;
    }

    if (
      parameter.value != null &&
      parameter.value !== ""
    ) {
      return parameter.value;
    }

    if (
      parameter.resultValue != null &&
      parameter.resultValue !== ""
    ) {
      return parameter.resultValue;
    }
  }

  const results =
    getResultsObject(report);

  const testId =
    test?.id ||
    test?.testId ||
    test?.test_id ||
    `test-${testIndex}`;

  const name =
    typeof parameter === "string"
      ? parameter
      : parameter?.name ||
        parameter?.testName ||
        parameter?.investigation ||
        parameter?.parameterName ||
        `parameter-${index}`;

  const parameterId =
    parameter?.id ||
    parameter?.parameterId ||
    "";

  const keys = [
    `${testId}-${name}-${index}`,
    `${testId}-${name}`,
    `${testId}-${parameterId}`,
    `${testIndex}-${name}-${index}`,
    `${testIndex}-${name}`,
    name,
    parameterId,
  ].filter(Boolean);

  for (const key of keys) {
    if (
      Object.prototype.hasOwnProperty.call(
        results,
        key
      )
    ) {
      return results[key];
    }
  }

  const targetName =
    normalizeText(name);

  const targetTest =
    normalizeText(
      test?.name ||
        test?.testName ||
        test?.short ||
        ""
    );

  for (
    const [key, value] of Object.entries(
      results
    )
  ) {
    const normalizedKey =
      normalizeText(key);

    if (
      targetName &&
      normalizedKey.includes(
        targetName
      ) &&
      (!targetTest ||
        normalizedKey.includes(
          targetTest
        ) ||
        normalizedKey.includes(
          normalizeText(testId)
        ))
    ) {
      return value;
    }
  }

  return "";
}

/* =========================================================
   BUILD PARAMETERS
========================================================= */

function buildParametersForTest(test) {
  const saved =
    getParameters(test);

  if (saved.length) {
    return saved;
  }

  const master =
    findMasterTest(test);

  return master?.parameters
    ? master.parameters.map(
        (p) => ({ ...p })
      )
    : [];
}

/* =========================================================
   PATIENT DATA
========================================================= */

function getPatient(report) {
  if (!report) return {};

  const data =
    getReportData(report);

  if (
    data.patient &&
    typeof data.patient === "object"
  ) {
    return data.patient;
  }

  if (
    report.patient &&
    typeof report.patient === "object"
  ) {
    return report.patient;
  }

  return {
    name:
      report.patient_name ||
      report.patientName ||
      report.name ||
      "",

    patientId:
      report.patient_id ||
      report.patientId ||
      report.registration_no ||
      report.registrationNo ||
      "",

    age:
      report.age ??
      report.patient_age ??
      "",

    gender:
      report.gender ||
      report.sex ||
      report.patient_gender ||
      "",

    mobile:
      report.mobile ||
      report.mobile_number ||
      report.mobileNumber ||
      report.phone ||
      "",

    doctor:
      report.doctor ||
      report.referred_by ||
      report.referredBy ||
      report.refDoctor ||
      "Self",

    sampleDate:
      report.sample_date ||
      report.sampleDate ||
      report.collection_date ||
      report.collectionDate ||
      "",

    collectionDate:
      report.collection_date ||
      report.collectionDate ||
      report.sample_date ||
      report.sampleDate ||
      "",
  };
}

function getPatientName(report) {
  const patient =
    getPatient(report);

  return (
    patient?.name ||
    patient?.patientName ||
    report?.patient_name ||
    "Patient Name"
  );
}

function getPatientId(report) {
  const patient =
    getPatient(report);

  return (
    patient?.patientId ||
    patient?.id ||
    patient?.registrationNo ||
    report?.patient_id ||
    report?.patientId ||
    "-"
  );
}

function getPatientAge(report) {
  const patient =
    getPatient(report);

  return patient?.age !== "" &&
    patient?.age != null
    ? patient.age
    : report?.age ??
        report?.patient_age ??
        "-";
}

function getPatientGenderValue(
  report
) {
  const patient =
    getPatient(report);

  return (
    patient?.gender ||
    patient?.sex ||
    report?.gender ||
    report?.sex ||
    "-"
  );
}

function getPatientMobile(report) {
  const patient =
    getPatient(report);

  return (
    patient?.mobile ||
    patient?.mobileNumber ||
    patient?.phone ||
    report?.mobile ||
    report?.mobile_number ||
    report?.phone ||
    "-"
  );
}

function getDoctor(report) {
  const patient =
    getPatient(report);

  return (
    patient?.doctor ||
    patient?.referredBy ||
    patient?.refDoctor ||
    report?.doctor ||
    report?.referred_by ||
    report?.referredBy ||
    "Self"
  );
}

function getCollectionDate(
  report
) {
  const patient =
    getPatient(report);

  return (
    patient?.sampleDate ||
    patient?.collectionDate ||
    report?.sample_date ||
    report?.sampleDate ||
    report?.collection_date ||
    report?.collectionDate ||
    formatDate(report?.created_at)
  );
}

function getReportDate(report) {
  const data =
    getReportData(report);

  return (
    data.reportDate ||
    data.report_date ||
    report?.report_date ||
    report?.reportDate ||
    report?.created_at ||
    ""
  );
}

/* =========================================================
   DATE
========================================================= */

function formatDate(value) {
  if (!value) return "-";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

/* =========================================================
   PREPARE TESTS
========================================================= */

function prepareTests(report) {
  const patient =
    getPatient(report);

  const savedTests =
    getReportTests(report);

  if (!savedTests.length) {
    return [];
  }

  return savedTests.map(
    (test, testIndex) => {
      const master =
        findMasterTest(test);

      const parameters =
        buildParametersForTest(
          test
        );

      return {
        id:
          test?.id ||
          test?.testId ||
          test?.test_id ||
          `test-${testIndex}`,

        name:
          test?.name ||
          test?.testName ||
          test?.short ||
          master?.name ||
          "Laboratory Investigation",

        category:
          test?.category ||
          test?.department ||
          master?.category ||
          "PATHOLOGY",

        parameters:
          parameters.map(
            (
              parameter,
              index
            ) => {
              const effective =
                getEffectiveParameter(
                  parameter,
                  test
                );

              const value =
                getResult(
                  report,
                  test,
                  parameter,
                  index,
                  testIndex
                );

              return {
                ...effective,

                result:
                  value == null
                    ? ""
                    : value,

                flag:
                  getFlag(
                    value,
                    effective,
                    patient,
                    test
                  ),

                range:
                  getReferenceRange(
                    effective,
                    patient,
                    test
                  ),
              };
            }
          ),
      };
    }
  );
}

/* =========================================================
   INFO COMPONENT
========================================================= */

function Info({
  label,
  value,
  strong,
  status,
}) {
  return (
    <div className="infoCell">
      <span className="infoLabel">
        {label}
      </span>

      <span
        className={`infoValue ${
          strong ? "strong" : ""
        } ${
          status ? "status" : ""
        }`}
      >
        {value || "-"}
      </span>
    </div>
  );
}

/* =========================================================
   TEST SECTION
========================================================= */

function TestSection({
  test,
  showReferenceRange = true,
  showFlag = true,
}) {
  return (
    <section className="testSection">

      <div className="testHeader">

        <span className="departmentTag">
          {String(
            test.category ||
              "PATHOLOGY"
          ).toUpperCase()}
        </span>

        <div className="testTitleBox">
          {test.name}
        </div>

        <span className="testLine" />

      </div>

      <table className="labTable">

        <colgroup>
          <col className="investigation" />
          <col className="flag" />
          <col className="result" />
          <col className="reference" />
          <col className="unit" />
        </colgroup>

        <thead>
          <tr>
            <th>INVESTIGATION</th>
            <th>
              {showFlag
                ? "FLAG"
                : ""}
            </th>
            <th>RESULT</th>
            <th>
              {showReferenceRange
                ? "REFERENCE RANGE"
                : ""}
            </th>
            <th>UNIT</th>
          </tr>
        </thead>

        <tbody>

          {(test.parameters || []).map(
            (
              parameter,
              index
            ) => {

              const abnormal =
                parameter.flag === "H" ||
                parameter.flag === "L";

              const value =
                parameter.result === "" ||
                parameter.result == null
                  ? "-"
                  : parameter.result;

              return (
                <tr
                  key={`${parameter.name}-${index}`}
                >

                  <td>
                    <span className="investigationText">
                      {parameter.name}
                    </span>
                  </td>

                  <td className="flag">

                    {showFlag ? (
                      parameter.flag ===
                      "H" ? (

                        <span className="flagBadge flagHigh">
                          H
                        </span>

                      ) : parameter.flag ===
                        "L" ? (

                        <span className="flagBadge flagLow">
                          L
                        </span>

                      ) : (

                        <span className="normalMark">
                          •
                        </span>

                      )
                    ) : null}

                  </td>

                  <td className="result">

                    <span
                      className={`resultBox ${
                        abnormal
                          ? "abnormal"
                          : ""
                      }`}
                    >
                      {value}
                    </span>

                  </td>

                  <td className="reference">

                    {showReferenceRange
                      ? parameter.range ||
                        "-"
                      : ""}

                  </td>

                  <td className="unit">
                    {parameter.unit ||
                      "-"}
                  </td>

                </tr>
              );
            }
          )}

        </tbody>

      </table>

    </section>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function ReportsPage() {

  const [reports, setReports] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedReport, setSelectedReport] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [searchText, setSearchText] =
    useState("");

  const [settings, setSettings] =
    useState(DEFAULT_SETTINGS);

  /* =======================================================
     LOAD
  ======================================================= */

  useEffect(() => {

    loadReports();
    loadSettings();

    const handleSettings = (
      event
    ) => {

      if (event?.detail) {

        setSettings({
          ...DEFAULT_SETTINGS,
          ...event.detail,
        });

      } else {

        loadSettings();

      }
    };

    const handleStorage = () => {
      loadSettings();
    };

    window.addEventListener(
      "nidan-settings-updated",
      handleSettings
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {

      window.removeEventListener(
        "nidan-settings-updated",
        handleSettings
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );

    };

  }, []);

  /* =======================================================
     SETTINGS
  ======================================================= */

  function loadSettings() {

    try {

      const saved =
        localStorage.getItem(
          SETTINGS_KEY
        );

      if (!saved) {

        setSettings(
          DEFAULT_SETTINGS
        );

        return;
      }

      const parsed =
        JSON.parse(saved);

      setSettings({
        ...DEFAULT_SETTINGS,
        ...parsed,
      });

    } catch {

      setSettings(
        DEFAULT_SETTINGS
      );

    }
  }

  /* =======================================================
     LOAD REPORTS FROM SUPABASE
  ======================================================= */

  async function loadReports() {

    try {

      setLoading(true);
      setMessage("");

      const {
        data,
        error,
      } = await supabase
        .from("reports")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (error) {

        console.error(
          "Reports load error:",
          error
        );

        setMessage(
          `Reports load nahi ho paaye: ${error.message}`
        );

        setReports([]);

        return;
      }

      setReports(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {

      console.error(
        "Reports exception:",
        error
      );

      setMessage(
        "Saved reports load karne me error aaya."
      );

      setReports([]);

    } finally {

      setLoading(false);

    }
  }

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredReports =
    useMemo(() => {

      const search =
        searchText
          .toLowerCase()
          .trim();

      if (!search) {
        return reports;
      }

      return reports.filter(
        (report) => {

          const patient =
            getPatientName(
              report
            ).toLowerCase();

          const reportNo =
            String(
              report?.report_no ||
                report?.reportNo ||
                ""
            ).toLowerCase();

          const patientId =
            String(
              getPatientId(
                report
              )
            ).toLowerCase();

          return (
            patient.includes(
              search
            ) ||
            reportNo.includes(
              search
            ) ||
            patientId.includes(
              search
            )
          );
        }
      );

    }, [
      reports,
      searchText,
    ]);

  /* =======================================================
     VIEW
  ======================================================= */

  function viewReport(report) {

    setSelectedReport(
      report
    );

    setTimeout(() => {

      document
        .getElementById(
          "saved-final-report"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

    }, 100);
  }

  /* =======================================================
     CLOSE
  ======================================================= */

  function closeReport() {
    setSelectedReport(null);
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function deleteReport(
    report
  ) {

    if (!report?.id) {

      alert(
        "Report ID nahi mila. Delete nahi kiya ja sakta."
      );

      return;
    }

    const reportNo =
      report?.report_no ||
      report?.reportNo ||
      "this report";

    const confirmDelete =
      window.confirm(
        `${reportNo} delete karna hai? Ye action undo nahi hoga.`
      );

    if (!confirmDelete) {
      return;
    }

    try {

      const {
        error,
      } = await supabase
        .from("reports")
        .delete()
        .eq(
          "id",
          report.id
        );

      if (error) {

        alert(
          `Report delete nahi hua: ${error.message}`
        );

        return;
      }

      setReports(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              report.id
          )
      );

      if (
        selectedReport?.id ===
        report.id
      ) {
        setSelectedReport(
          null
        );
      }

      alert(
        "Report successfully delete ho gaya."
      );

    } catch (error) {

      console.error(error);

      alert(
        "Report delete karne me error aaya."
      );

    }
  }

  /* =======================================================
     PRINT
  ======================================================= */

  function printReport(report) {

    setSelectedReport(
      report
    );

    setTimeout(() => {
      window.print();
    }, 500);
  }

  function printCurrentReport() {

    if (selectedReport) {
      window.print();
    }
  }

  /* =======================================================
     PREVIEW
  ======================================================= */

  const previewTests =
    useMemo(
      () =>
        selectedReport
          ? prepareTests(
              selectedReport
            )
          : [],
      [selectedReport]
    );

  /* =======================================================
     LAB SETTINGS
  ======================================================= */

  const labName =
    settings.labName ||
    DEFAULT_SETTINGS.labName;

  const slogan =
    settings.slogan ||
    DEFAULT_SETTINGS.slogan;

  const labAddress =
    settings.labAddress || "";

  const phone =
    settings.phone || "";

  const email =
    settings.email || "";

  const registrationNo =
    settings.registrationNo || "";

  const doctorName =
    settings.doctorName || "";

  const logo =
    settings.letterhead || "";

  /* =======================================================
     JSX
  ======================================================= */

  return (
    <>

      {/* ===================================================
          SAVED REPORTS LIST
      =================================================== */}

      <div className="savedReportsScreen">

        <div className="savedReportsHeader">

          <div>

            <h1>
              Saved Reports
            </h1>

            <p>
              {labName}
            </p>

          </div>

          <div className="savedHeaderControls">

            <input
              className="reportSearch"
              placeholder="Search patient / report no."
              value={searchText}
              onChange={(e) =>
                setSearchText(
                  e.target.value
                )
              }
            />

            <button
              className="refreshButton"
              onClick={loadReports}
              disabled={loading}
            >
              ↻ Refresh
            </button>

          </div>

        </div>

        {message && (
          <div className="reportMessage">
            {message}
          </div>
        )}

        <div className="reportsCard">

          {loading ? (

            <div className="loadingBox">

              <div className="loadingLogo">
                N+
              </div>

              <strong>
                Saved reports loading...
              </strong>

            </div>

          ) : filteredReports.length ===
            0 ? (

            <div className="emptyBox">

              <div>
                📄
              </div>

              <h2>
                No Saved Reports
              </h2>

              <p>
                Final report save hone ke
                baad yahan dikhai dega.
              </p>

            </div>

          ) : (

            <div className="reportsTableWrapper">

              <table className="reportsTable">

                <thead>

                  <tr>

                    <th>
                      Report No.
                    </th>

                    <th>
                      Patient
                    </th>

                    <th>
                      Tests
                    </th>

                    <th>
                      Parameters
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Saved Date
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredReports.map(
                    (report) => {

                      const tests =
                        getReportTests(
                          report
                        );

                      const parameterCount =
                        tests.reduce(
                          (
                            total,
                            test
                          ) =>
                            total +
                            buildParametersForTest(
                              test
                            ).length,
                          0
                        );

                      return (

                        <tr
                          key={
                            report.id ||
                            report.report_no ||
                            report.reportNo
                          }
                        >

                          <td>

                            <strong>
                              {report.report_no ||
                                report.reportNo ||
                                "-"}
                            </strong>

                          </td>

                          <td>

                            <strong>
                              {getPatientName(
                                report
                              )}
                            </strong>

                            <small className="patientIdSmall">
                              ID:{" "}
                              {getPatientId(
                                report
                              )}
                            </small>

                          </td>

                          <td>

                            {tests
                              .map(
                                (test) =>
                                  test?.short ||
                                  test?.name ||
                                  test?.testName
                              )
                              .filter(Boolean)
                              .join(", ") ||
                              "-"}

                          </td>

                          <td>

                            <span className="resultCount">
                              {parameterCount}
                            </span>

                          </td>

                          <td>

                            <span className="pendingStatus">
                              {String(
                                report.status ||
                                  "FINAL"
                              ).toUpperCase()}
                            </span>

                          </td>

                          <td>
                            {formatDate(
                              report.created_at
                            )}
                          </td>

                          <td>

                            <div className="actionButtons">

                              <button
                                className="viewButton"
                                onClick={() =>
                                  viewReport(
                                    report
                                  )
                                }
                              >
                                👁 View
                              </button>

                              <button
                                className="printButton"
                                onClick={() =>
                                  printReport(
                                    report
                                  )
                                }
                              >
                                🖨 Print
                              </button>

                              <button
                                className="deleteButton"
                                onClick={() =>
                                  deleteReport(
                                    report
                                  )
                                }
                              >
                                🗑 Delete
                              </button>

                            </div>

                          </td>

                        </tr>

                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

      {/* ===================================================
          FINAL REPORT PREVIEW
      =================================================== */}

      {selectedReport && (

        <div
          id="saved-final-report"
          className="savedFinalPreviewWrapper"
        >

          <div className="previewToolbar">

            <div>

              <strong>
                Final Laboratory Report
              </strong>

              <small>
                Report No:{" "}
                {selectedReport.report_no ||
                  selectedReport.reportNo ||
                  "-"}
              </small>

            </div>

            <div className="previewToolbarActions">

              <button
                className="previewPrint"
                onClick={
                  printCurrentReport
                }
              >
                🖨 Print / Save PDF
              </button>

              <button
                className="previewClose"
                onClick={
                  closeReport
                }
              >
                × Close
              </button>

            </div>

          </div>

          <div className="finalPreview">

            <div className="a4Page">

              {/* =========================================
                  HEADER
              ========================================= */}

              {settings.reportHeader !==
                false && (

                <>

                  <header className="labHeader">

                    <div className="brand">

                      {settings.showLogo !==
                        false && (

                        <div className="mainLogo">

                          {logo ? (

                            <img
                              src={logo}
                              alt={`${labName} Logo`}
                              className="uploadedLogo"
                            />

                          ) : (

                            <>

                              <span>
                                N
                              </span>

                              <div className="logoRay r1" />
                              <div className="logoRay r2" />
                              <div className="logoRay r3" />
                              <div className="logoRay r4" />

                            </>

                          )}

                        </div>

                      )}

                      <div className="brandText">

                        <h1>
                          {labName}
                        </h1>

                        <h2>
                          DIAGNOSTIC &amp;
                          PATHOLOGY
                          LABORATORY
                        </h2>

                        {slogan && (
                          <p>
                            {slogan}
                          </p>
                        )}

                      </div>

                    </div>

                    <div className="headerRight">

                      <div className="reportLabel">
                        LABORATORY REPORT
                      </div>

                      {phone && (
                        <div>
                          ☎ {phone}
                        </div>
                      )}

                      {email && (
                        <div>
                          ✉ {email}
                        </div>
                      )}

                      {labAddress && (
                        <div>
                          📍 {labAddress}
                        </div>
                      )}

                      {registrationNo && (
                        <div>
                          Registration No:{" "}
                          <b>
                            {registrationNo}
                          </b>
                        </div>
                      )}

                      {doctorName && (
                        <div>
                          Reporting Doctor:{" "}
                          <b>
                            {doctorName}
                          </b>
                        </div>
                      )}

                      <div>
                        Report No:{" "}
                        <b>
                          {selectedReport.report_no ||
                            selectedReport.reportNo ||
                            "-"}
                        </b>
                      </div>

                      <div>
                        Report Date:{" "}
                        <b>
                          {formatDate(
                            getReportDate(
                              selectedReport
                            )
                          )}
                        </b>
                      </div>

                    </div>

                  </header>

                  <div className="accentBar">
                    <span />
                    <b />
                    <i />
                  </div>

                </>

              )}

              {/* =========================================
                  PATIENT INFORMATION
              ========================================= */}

              <section className="patientCard">

                <div className="sectionBar">

                  <span className="circleP">
                    P
                  </span>

                  PATIENT INFORMATION

                </div>

                <div className="patientGrid">

                  <Info
                    label="Patient Name"
                    value={getPatientName(
                      selectedReport
                    )}
                    strong
                  />

                  <Info
                    label="Patient ID"
                    value={getPatientId(
                      selectedReport
                    )}
                  />

                  <Info
                    label="Age / Sex"
                    value={`${getPatientAge(
                      selectedReport
                    )} / ${getPatientGenderValue(
                      selectedReport
                    )}`}
                  />

                  <Info
                    label="Mobile"
                    value={getPatientMobile(
                      selectedReport
                    )}
                  />

                  <Info
                    label="Referred By"
                    value={getDoctor(
                      selectedReport
                    )}
                  />

                  <Info
                    label="Collection Date"
                    value={getCollectionDate(
                      selectedReport
                    )}
                  />

                  <Info
                    label="Report Date"
                    value={formatDate(
                      getReportDate(
                        selectedReport
                      )
                    )}
                  />

                  <Info
                    label="Report Status"
                    value="FINAL"
                    status
                  />

                </div>

              </section>

              {/* =========================================
                  TESTS
              ========================================= */}

              <main className="tests">

                {previewTests.length ===
                0 ? (

                  <div className="noTest">

                    <strong>
                      No laboratory
                      investigation
                      available.
                    </strong>

                    <small>
                      Saved report me
                      test data nahi mila.
                    </small>

                  </div>

                ) : (

                  previewTests.map(
                    (
                      test,
                      index
                    ) => (

                      <TestSection
                        key={
                          test.id ||
                          index
                        }
                        test={test}
                        showReferenceRange={
                          settings.showReferenceRange !==
                          false
                        }
                        showFlag={
                          settings.showFlag !==
                          false
                        }
                      />

                    )
                  )

                )}

              </main>

              {/* =========================================
                  SIGNATURE
              ========================================= */}

              <section className="signatures">

                <div className="signature">

                  <div className="signatureBlank" />

                  <strong>
                    Lab Technician
                  </strong>

                  <small>
                    {labName}
                  </small>

                </div>

                <div className="signature">

                  <div className="signatureBlank" />

                  <strong>
                    Authorized Signatory
                  </strong>

                  <small>
                    {doctorName ||
                      "Signature & Seal"}
                  </small>

                </div>

              </section>

              {/* =========================================
                  NOTE
              ========================================= */}

              <div className="note">

                <b>
                  Note:
                </b>{" "}

                Reference ranges may vary
                according to laboratory
                methodology, age and
                clinical condition.
                Results should be
                interpreted by a qualified
                healthcare professional.

              </div>

              {/* =========================================
                  FOOTER
              ========================================= */}

              <footer className="footer">

                <strong>
                  {labName}
                </strong>

                {slogan && (
                  <span>
                    {slogan}
                  </span>
                )}

                <small>

                  {phone &&
                    `☎ ${phone}`}

                  {phone &&
                    labAddress &&
                    " | "}

                  {labAddress}

                  {email &&
                    " | "}

                  {email}

                </small>

                <em>
                  Page 1 of 1
                </em>

              </footer>

            </div>

          </div>

        </div>

      )}

      {/* ===================================================
          CSS
      =================================================== */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #eef3f7;
          color: #172033;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        button,
        input {
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        /* ===============================================
           SAVED REPORTS
        =============================================== */

        .savedReportsScreen {
          min-height: 100vh;
          padding: 22px;
          background: #eef3f7;
        }

        .savedReportsHeader {
          max-width: 1400px;
          margin: 0 auto 16px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 15px;
        }

        .savedReportsHeader h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 900;
        }

        .savedReportsHeader p {
          margin: 4px 0 0;
          font-size: 11px;
          color: #667085;
          font-weight: 700;
        }

        .savedHeaderControls {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .reportSearch {
          width: 230px;
          height: 38px;

          padding: 0 12px;

          border: 1px solid #d8e0e7;
          border-radius: 7px;

          background: #fff;

          outline: none;

          font-size: 12px;
        }

        .reportSearch:focus {
          border-color: #087f72;
        }

        .refreshButton {
          height: 38px;
          padding: 0 14px;

          border: 1px solid #d8e0e7;
          border-radius: 7px;

          background: #fff;

          font-size: 12px;
          font-weight: 800;

          cursor: pointer;
        }

        .refreshButton:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .reportMessage {
          max-width: 1400px;
          margin: 0 auto 15px;

          padding: 12px;

          border: 1px solid #ffd591;

          background: #fff7e6;

          color: #8a5700;

          border-radius: 7px;

          font-size: 12px;
        }

        .reportsCard {
          max-width: 1400px;

          margin: 0 auto;

          background: #fff;

          border: 1px solid #dce4eb;

          border-radius: 10px;

          overflow: hidden;

          box-shadow:
            0 4px 18px
            rgba(
              16,
              24,
              40,
              0.07
            );
        }

        .reportsTableWrapper {
          width: 100%;
          overflow-x: auto;
        }

        .reportsTable {
          width: 100%;
          min-width: 1050px;

          border-collapse: collapse;
        }

        .reportsTable th {
          padding: 13px 12px;

          text-align: left;

          background: #f7f9fb;

          color: #667085;

          border-bottom:
            1px solid #e4e9ee;

          font-size: 10px;
          font-weight: 900;
        }

        .reportsTable td {
          padding: 14px 12px;

          border-bottom:
            1px solid #edf0f3;

          font-size: 11px;

          color: #344054;

          vertical-align: middle;
        }

        .reportsTable tbody tr:hover {
          background: #fbfdfe;
        }

        .patientIdSmall {
          display: block;

          margin-top: 3px;

          font-size: 8px;

          color: #98a2b3;
        }

        .resultCount {
          display: inline-flex;

          width: 25px;
          height: 25px;

          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #eff6fb;

          border: 1px solid #dbe8f0;

          color: #34536b;

          font-size: 9px;
          font-weight: 900;
        }

        .pendingStatus {
          display: inline-block;

          padding: 5px 9px;

          border-radius: 20px;

          background: #e9f9ef;

          color: #14783b;

          font-size: 9px;
          font-weight: 900;
        }

        .actionButtons {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }

        .actionButtons button {
          padding: 6px 8px;

          border-radius: 5px;

          background: #fff;

          font-size: 9px;
          font-weight: 800;

          cursor: pointer;
        }

        .viewButton {
          border: 1px solid #b9c8e7;
          color: #244c96;
        }

        .printButton {
          border: 1px solid #a8d7bd;
          color: #137340;
        }

        .deleteButton {
          border: 1px solid #efb6b6;
          color: #c33131;
        }

        /* ===============================================
           EMPTY / LOADING
        =============================================== */

        .loadingBox,
        .emptyBox {
          min-height: 280px;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          text-align: center;

          color: #667085;
        }

        .loadingLogo {
          width: 55px;
          height: 55px;

          display: flex;

          align-items: center;
          justify-content: center;

          margin-bottom: 12px;

          border-radius: 50%;

          color: #fff;

          background:
            linear-gradient(
              135deg,
              #087f72,
              #0b6676
            );

          font-weight: 900;
        }

        .emptyBox > div {
          font-size: 40px;
        }

        .emptyBox h2 {
          margin: 8px 0 3px;

          color: #344054;
        }

        .emptyBox p {
          margin: 0;

          font-size: 12px;
        }

        /* ===============================================
           PREVIEW
        =============================================== */

        .savedFinalPreviewWrapper {
          padding: 15px 10px 40px;

          background:
            linear-gradient(
              180deg,
              #eef3f7,
              #e7edf3
            );
        }

        .previewToolbar {
          width: calc(100% - 10px);
          max-width: 1200px;

          margin: 0 auto 10px;

          padding: 9px 12px;

          border:
            1px solid #dce4eb;

          border-radius: 8px;

          background: #fff;

          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 10px;

          box-shadow:
            0 2px 12px
            rgba(
              16,
              24,
              40,
              0.06
            );
        }

        .previewToolbar strong {
          display: block;
          font-size: 12px;
        }

        .previewToolbar small {
          display: block;

          margin-top: 2px;

          font-size: 7px;

          color: #667085;
        }

        .previewToolbarActions {
          display: flex;
          gap: 6px;
        }

        .previewToolbarActions button {
          padding: 7px 11px;

          border-radius: 6px;

          font-size: 8px;
          font-weight: 900;

          cursor: pointer;
        }

        .previewPrint {
          border: 1px solid #087f72;

          background:
            linear-gradient(
              135deg,
              #087f72,
              #0b6676
            );

          color: #fff;
        }

        .previewClose {
          border: 1px solid #d0d5dd;

          background: #fff;

          color: #344054;
        }

        .finalPreview {
          min-height: 100vh;

          padding: 10px;

          display: flex;

          justify-content: center;
        }

        /* ===============================================
           A4
        =============================================== */

        .a4Page {
          position: relative;

          width: 210mm;

          height: 297mm;

          min-height: 297mm;
          max-height: 297mm;

          padding:
            0 11mm 18mm;

          background: #fff;

          overflow: hidden;

          box-shadow:
            0 14px 40px
            rgba(
              16,
              24,
              40,
              0.15
            );
        }

        /* ===============================================
           HEADER
        =============================================== */

        .labHeader {
          height: 35mm;

          padding-top: 6mm;

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 7mm;
        }

        .brand {
          display: flex;

          align-items: center;

          gap: 4mm;

          min-width: 0;
        }

        .mainLogo {
          position: relative;

          width: 22mm;
          height: 22mm;

          flex-shrink: 0;

          border:
            1.5px solid #087f72;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              #fff 45%,
              #eefbf8 100%
            );

          display: flex;

          align-items: center;
          justify-content: center;

          overflow: hidden;

          box-shadow:
            inset 0 0 0 2px
            #d7f2ed;
        }

        .uploadedLogo {
          width: 100%;
          height: 100%;

          object-fit: contain;

          padding: 2mm;

          background: #fff;

          border-radius: 50%;
        }

        .mainLogo span {
          position: relative;

          z-index: 2;

          color: #087f72;

          font-size: 20px;

          font-weight: 950;
        }

        .logoRay {
          position: absolute;

          width: 14mm;
          height: 0.5px;

          background: #eabf43;
        }

        .r1 {
          transform: rotate(0deg);
        }

        .r2 {
          transform: rotate(45deg);
        }

        .r3 {
          transform: rotate(90deg);
        }

        .r4 {
          transform: rotate(135deg);
        }

        .brandText {
          min-width: 0;
        }

        .brandText h1 {
          margin: 0;

          font-size: 21px;

          line-height: 1;

          font-weight: 950;

          color: #101828;

          overflow-wrap: anywhere;
        }

        .brandText h2 {
          margin: 2px 0 0;

          font-size: 7px;

          letter-spacing: 0.8px;

          color: #087f72;

          font-weight: 900;
        }

        .brandText p {
          margin: 4px 0 0;

          font-size: 6px;

          color: #667085;

          font-weight: 700;

          overflow-wrap: anywhere;
        }

        .headerRight {
          width: 67mm;

          text-align: right;

          color: #667085;

          font-size: 5.7px;

          line-height: 1.55;

          overflow-wrap: anywhere;
        }

        .reportLabel {
          display: inline-block;

          margin-bottom: 2px;

          padding: 2px 5px;

          border-radius: 3px;

          background: #e9f8f5;

          color: #087f72;

          font-size: 6px;

          font-weight: 950;

          letter-spacing: 0.5px;
        }

        .accentBar {
          height: 1.5px;

          display: flex;

          gap: 2px;

          margin-bottom: 4mm;
        }

        .accentBar span {
          flex: 4;
          background: #087f72;
        }

        .accentBar b {
          flex: 1;
          background: #eabf43;
        }

        .accentBar i {
          flex: 6;
          background: #dce5ea;
        }

        /* ===============================================
           PATIENT
        =============================================== */

        .patientCard {
          border:
            1px solid #d7e0e6;

          border-radius: 4px;

          overflow: hidden;

          margin-bottom: 4mm;
        }

        .sectionBar {
          height: 6.5mm;

          padding: 0 3mm;

          display: flex;

          align-items: center;

          gap: 5px;

          background:
            linear-gradient(
              90deg,
              #087f72,
              #0c7180
            );

          color: #fff;

          font-size: 6.5px;

          font-weight: 950;

          letter-spacing: 0.6px;
        }

        .circleP {
          width: 15px;
          height: 15px;

          border-radius: 50%;

          display: flex;

          align-items: center;
          justify-content: center;

          background:
            rgba(
              255,
              255,
              255,
              0.18
            );

          font-size: 6px;
        }

        .patientGrid {
          display: grid;

          grid-template-columns:
            repeat(4, 1fr);
        }

        .infoCell {
          min-height: 9mm;

          padding: 2mm 3mm;

          border-right:
            1px solid #e3e8ed;

          border-bottom:
            1px solid #e3e8ed;
        }

        .infoCell:nth-child(4n) {
          border-right: 0;
        }

        .infoCell:nth-last-child(-n + 4) {
          border-bottom: 0;
        }

        .infoLabel {
          display: block;

          margin-bottom: 1px;

          font-size: 4.7px;

          color: #7a8796;

          font-weight: 800;

          text-transform: uppercase;
        }

        .infoValue {
          display: block;

          font-size: 6.4px;

          color: #172033;

          font-weight: 700;

          overflow-wrap: anywhere;
        }

        .infoValue.strong {
          font-size: 7px;

          font-weight: 950;
        }

        .infoValue.status {
          color: #15803d;

          font-weight: 950;
        }

        /* ===============================================
           TESTS
        =============================================== */

        .tests {
          display: flex;

          flex-direction: column;

          gap: 3.5mm;
        }

        .testSection {
          break-inside: avoid;

          page-break-inside: avoid;
        }

        .testHeader {
          display: flex;

          align-items: center;

          gap: 2.5mm;

          margin-bottom: 1.8mm;

          min-height: 7mm;
        }

        .departmentTag {
          flex-shrink: 0;

          padding: 2.5px 6px;

          border-radius: 3px;

          background: #e8f7f4;

          color: #087f72;

          font-size: 5px;

          font-weight: 950;

          letter-spacing: 0.6px;
        }

        .testTitleBox {
          flex: 1;

          padding:
            2.2mm 3.5mm;

          border-left:
            3px solid #087f72;

          border-radius: 3px;

          background:
            linear-gradient(
              90deg,
              #f0faf8,
              #fff
            );

          color: #101828;

          font-size: 9.5px;

          font-weight: 950;
        }

        .testLine {
          width: 18mm;

          height: 1px;

          background:
            linear-gradient(
              90deg,
              #087f72,
              transparent
            );
        }

        .labTable {
          width: 100%;

          table-layout: fixed;

          border-collapse: separate;

          border-spacing: 0;

          border:
            1px solid #cfd9e0;

          border-radius: 4px;

          overflow: hidden;
        }

        .labTable th {
          height: 6.5mm;

          padding: 1.3mm;

          background:
            linear-gradient(
              180deg,
              #eef5f7,
              #e3edf0
            );

          border-right:
            1px solid #d2dce2;

          border-bottom:
            1px solid #cbd6dc;

          color: #344054;

          font-size: 5.1px;

          font-weight: 950;

          text-transform: uppercase;

          text-align: center;
        }

        .labTable th:last-child {
          border-right: 0;
        }

        .labTable td {
          height: 6.8mm;

          padding:
            1mm 1.8mm;

          border-right:
            1px solid #e1e7eb;

          border-bottom:
            1px solid #e5eaee;

          color: #273443;

          font-size: 5.8px;

          vertical-align: middle;

          background: #fff;
        }

        .labTable tr:last-child td {
          border-bottom: 0;
        }

        .labTable td:last-child {
          border-right: 0;
        }

        .labTable tbody tr:nth-child(even) td {
          background: #fbfcfd;
        }

        .investigation {
          width: 30%;
        }

        .flag {
          width: 8%;

          text-align: center;
        }

        .result {
          width: 19%;

          text-align: center;
        }

        .reference {
          width: 28%;

          text-align: center;
        }

        .unit {
          width: 15%;

          text-align: center;
        }

        .investigationText {
          font-size: 6px;

          font-weight: 800;

          color: #263445;
        }

        .resultBox {
          display: inline-flex;

          min-width: 24mm;

          height: 6mm;

          align-items: center;

          justify-content: center;

          padding:
            1mm 2.5mm;

          border-radius: 3px;

          background: #f2f6f9;

          color: #101828;

          font-size: 7.5px;

          font-weight: 950;
        }

        .resultBox.abnormal {
          background: #fff1f0;

          border:
            1px solid #f5c8c5;

          color: #b42318;
        }

        .flagBadge {
          display: inline-flex;

          width: 14px;
          height: 14px;

          align-items: center;
          justify-content: center;

          border-radius: 3px;

          font-size: 5.5px;

          font-weight: 950;
        }

        .flagHigh {
          color: #b42318;

          background: #fee4e2;

          border:
            1px solid #fecdca;
        }

        .flagLow {
          color: #175cd3;

          background: #eff8ff;

          border:
            1px solid #b2ddff;
        }

        .normalMark {
          color: #159957;

          font-size: 10px;

          font-weight: 900;
        }

        /* ===============================================
           SIGNATURE
        =============================================== */

        .signatures {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 30mm;

          margin-top: 4.5mm;

          break-inside: avoid;

          page-break-inside: avoid;
        }

        .signature {
          text-align: center;

          min-height: 10mm;

          display: flex;

          flex-direction: column;

          align-items: center;

          justify-content: flex-end;
        }

        .signatureBlank {
          height: 5mm;
          width: 100%;
        }

        .signature strong {
          display: block;

          font-size: 6px;

          color: #172033;

          font-weight: 800;
        }

        .signature small {
          display: block;

          margin-top: 1px;

          font-size: 4.5px;

          color: #667085;
        }

        /* ===============================================
           NOTE
        =============================================== */

        .note {
          margin-top: 2.5mm;

          padding:
            1.8mm 2.5mm;

          border:
            1px solid #dbe3e8;

          border-radius: 3px;

          background: #f8fafb;

          color: #667085;

          font-size: 4.5px;

          line-height: 1.35;

          break-inside: avoid;

          page-break-inside: avoid;
        }

        /* ===============================================
           FOOTER
        =============================================== */

        .footer {
          position: absolute;

          left: 0;
          right: 0;

          bottom: 0;

          height: 12mm;

          padding:
            2.2mm 11mm;

          text-align: center;

          border-top:
            1px solid #dce4e8;

          background:
            linear-gradient(
              180deg,
              #f8fafb,
              #eef3f5
            );
        }

        .footer strong {
          display: block;

          color: #087f72;

          font-size: 5.8px;

          font-weight: 950;

          letter-spacing: 0.6px;
        }

        .footer span {
          display: block;

          margin-top: 1px;

          color: #667085;

          font-size: 3.8px;

          font-weight: 700;
        }

        .footer small {
          display: block;

          margin-top: 1px;

          color: #98a2b3;

          font-size: 3.4px;

          overflow-wrap: anywhere;
        }

        .footer em {
          position: absolute;

          right: 7mm;

          bottom: 3mm;

          font-style: normal;

          color: #98a2b3;

          font-size: 3.4px;
        }

        .noTest {
          padding: 20mm;

          text-align: center;

          color: #667085;

          font-size: 9px;
        }

        .noTest small {
          display: block;

          margin-top: 5px;

          color: #98a2b3;

          font-size: 6px;
        }

        /* ===============================================
           MOBILE
        =============================================== */

        @media (max-width: 700px) {

          .savedReportsScreen {
            padding: 12px 5px;
          }

          .savedReportsHeader {
            align-items: flex-start;

            flex-direction: column;
          }

          .savedReportsHeader h1 {
            font-size: 23px;
          }

          .savedHeaderControls {
            width: 100%;

            flex-direction: row;
          }

          .reportSearch {
            width: 100%;

            height: 34px;

            font-size: 10px;
          }

          .refreshButton {
            height: 34px;

            font-size: 10px;
          }

          .savedFinalPreviewWrapper {
            padding:
              8px 2px 25px;
          }

          .previewToolbar {
            width:
              calc(100% - 6px);

            margin:
              0 auto 7px;

            flex-direction: column;

            align-items: stretch;
          }

          .previewToolbarActions {
            display: grid;

            grid-template-columns:
              1fr 1fr;
          }

          .previewPrint {
            grid-column:
              span 2;
          }

          .finalPreview {
            padding:
              4px 0 20px;
          }

          .a4Page {
            width:
              calc(100vw - 8px);

            height:
              calc(
                (100vw - 8px)
                * 1.4142857
              );

            min-height:
              calc(
                (100vw - 8px)
                * 1.4142857
              );

            max-height:
              calc(
                (100vw - 8px)
                * 1.4142857
              );

            padding-left:
              4.5mm;

            padding-right:
              4.5mm;

            padding-bottom:
              15mm;
          }

          .labHeader {
            height: 31mm;

            padding-top: 5mm;

            gap: 3mm;
          }

          .mainLogo {
            width: 17mm;
            height: 17mm;
          }

          .mainLogo span {
            font-size: 15px;
          }

          .brand {
            gap: 2.5mm;
          }

          .brandText h1 {
            font-size: 13px;
          }

          .brandText h2 {
            font-size: 4.2px;
          }

          .brandText p {
            font-size: 3.7px;
          }

          .headerRight {
            width: 40mm;

            font-size: 3.7px;
          }

          .reportLabel {
            font-size: 4px;
          }

          .patientGrid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .infoCell:nth-child(4n) {
            border-right:
              1px solid #e3e8ed;
          }

          .infoCell:nth-child(2n) {
            border-right: 0;
          }

          .infoCell:nth-last-child(-n + 4) {
            border-bottom:
              1px solid #e3e8ed;
          }

          .infoCell:nth-last-child(-n + 2) {
            border-bottom: 0;
          }

          .infoCell {
            min-height: 8mm;

            padding:
              1.5mm 2mm;
          }

          .sectionBar {
            height: 5.5mm;

            font-size: 4.5px;
          }

          .circleP {
            width: 11px;
            height: 11px;

            font-size: 5px;
          }

          .infoLabel {
            font-size: 3.5px;
          }

          .infoValue {
            font-size: 4.8px;
          }

          .infoValue.strong {
            font-size: 5.2px;
          }

          .testHeader {
            min-height: 6mm;

            margin-bottom: 1.3mm;
          }

          .departmentTag {
            font-size: 3.5px;
          }

          .testTitleBox {
            font-size: 6.3px;

            padding:
              1.7mm 2mm;
          }

          .labTable th {
            height: 5.3mm;

            padding: 1mm;

            font-size: 3.4px;
          }

          .labTable td {
            height: 5.5mm;

            padding:
              0.7mm 1mm;

            font-size: 3.9px;
          }

          .investigationText {
            font-size: 3.9px;
          }

          .resultBox {
            min-width: 14mm;

            height: 4.8mm;

            font-size: 5.3px;
          }

          .flagBadge {
            width: 11px;
            height: 11px;

            font-size: 4px;
          }

          .normalMark {
            font-size: 7px;
          }

          .signatures {
            gap: 15mm;

            margin-top: 3mm;
          }

          .signatureBlank {
            height: 4mm;
          }

          .signature strong {
            font-size: 4px;
          }

          .signature small {
            font-size: 3px;
          }

          .note {
            font-size: 3px;

            margin-top: 2mm;
          }

          .footer {
            height: 10mm;

            padding:
              2mm 5mm;
          }

          .footer strong {
            font-size: 4.5px;
          }

          .footer span {
            font-size: 3px;
          }

          .footer small {
            font-size: 2.5px;
          }

          .footer em {
            font-size: 2.5px;
          }

        }

        /* ===============================================
           PRINT
        =============================================== */

        @media print {

          @page {
            size: A4 portrait;
            margin: 0;
          }

          html,
          body {
            width: 210mm !important;
            height: 297mm !important;

            margin: 0 !important;
            padding: 0 !important;

            background: #fff !important;

            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;
          }

          .savedReportsScreen,
          .previewToolbar {
            display: none !important;
          }

          .savedFinalPreviewWrapper {
            display: block !important;

            width: 210mm !important;

            height: 297mm !important;

            min-height: 297mm !important;

            padding: 0 !important;

            margin: 0 !important;

            background: #fff !important;
          }

          .finalPreview {
            display: block !important;

            width: 210mm !important;

            height: 297mm !important;

            min-height: 297mm !important;

            padding: 0 !important;

            margin: 0 !important;

            background: #fff !important;
          }

          .a4Page {
            width: 210mm !important;

            height: 297mm !important;

            min-height: 297mm !important;

            max-height: 297mm !important;

            margin: 0 !important;

            padding:
              0 11mm 18mm !important;

            box-shadow: none !important;

            overflow: hidden !important;

            page-break-after: always;

            break-after: page;

            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;
          }

          .testSection,
          .patientCard,
          .signatures,
          .note {
            break-inside: avoid !important;

            page-break-inside:
              avoid !important;
          }

        }

      `}</style>

    </>
  );
}
