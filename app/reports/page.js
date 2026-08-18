"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

/* =========================================================
   NIDAN PATHOLOGY LAB
   app/reports/page.js
   SAVED REPORTS + FINAL REPORT + PRINT/PDF
   ========================================================= */

const ROUTES = {
  dashboard: "/dashboard",
};

const LAB = {
  name: "NIDAN PATHOLOGY LAB",
  subtitle: "DIAGNOSTIC & PATHOLOGY LABORATORY",
  slogan: "Accurate Diagnosis • Trusted Care • Better Health",
  phone: "7987580004, 8889325233",
  address:
    "Gram/Singhanpur, Tehsil Sarangarh, District Sarangarh-Bilaigarh, Chhattisgarh",
};

/* =========================================================
   MASTER TEST DATABASE
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
        aliases: ["Total WBC Count", "WBC Count", "TLC"],
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
        aliases: ["RBC", "Red Blood Cell Count"],
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
        aliases: ["PCV", "Hematocrit", "Haematocrit"],
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
        aliases: ["FBS", "Fasting Glucose"],
        unit: "mg/dL",
        min: 70,
        max: 99,
        range: "70 - 99",
      },
      {
        name: "Post Prandial Blood Sugar",
        aliases: ["PPBS", "Post Prandial Glucose"],
        unit: "mg/dL",
        min: 70,
        max: 140,
        range: "70 - 140",
      },
      {
        name: "Random Blood Sugar",
        aliases: ["RBS", "Random Glucose"],
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
        aliases: ["Bilirubin Total"],
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
        aliases: ["Glycated Hemoglobin"],
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
   HELPERS
   ========================================================= */

function norm(v) {
  return String(v ?? "")
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[./_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dateText(value) {
  if (!value) return "-";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return String(value);
  }

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function reportData(report) {
  return report?.report_data &&
    typeof report.report_data === "object"
    ? report.report_data
    : {};
}

function patientData(report) {
  const data = reportData(report);

  if (data.patient && typeof data.patient === "object") {
    return data.patient;
  }

  if (
    report?.patient &&
    typeof report.patient === "object"
  ) {
    return report.patient;
  }

  return {
    name:
      report?.patient_name ||
      report?.patientName ||
      report?.name ||
      "",
    patientId:
      report?.patient_id ||
      report?.patientId ||
      report?.registration_no ||
      report?.registrationNo ||
      "",
    age:
      report?.age ??
      report?.patient_age ??
      "",
    gender:
      report?.gender ||
      report?.sex ||
      report?.patient_gender ||
      "",
    mobile:
      report?.mobile ||
      report?.mobile_number ||
      report?.mobileNumber ||
      report?.phone ||
      "",
    doctor:
      report?.doctor ||
      report?.referred_by ||
      report?.referredBy ||
      "Self",
    collectionDate:
      report?.collection_date ||
      report?.collectionDate ||
      report?.sample_date ||
      report?.sampleDate ||
      "",
  };
}

function patientName(report) {
  const p = patientData(report);

  return (
    p.name ||
    p.patientName ||
    report?.patient_name ||
    "Patient Name"
  );
}

function patientId(report) {
  const p = patientData(report);

  return (
    p.patientId ||
    p.id ||
    report?.patient_id ||
    report?.patientId ||
    "-"
  );
}

function patientAge(report) {
  const p = patientData(report);

  return p.age ??
    report?.age ??
    report?.patient_age ??
    "-";
}

function patientGender(report) {
  const p = patientData(report);

  return (
    p.gender ||
    p.sex ||
    report?.gender ||
    report?.sex ||
    "-"
  );
}

function patientMobile(report) {
  const p = patientData(report);

  return (
    p.mobile ||
    p.mobileNumber ||
    p.phone ||
    report?.mobile ||
    report?.mobile_number ||
    report?.phone ||
    "-"
  );
}

function doctorName(report) {
  const p = patientData(report);

  return (
    p.doctor ||
    p.referredBy ||
    p.referred_by ||
    report?.doctor ||
    report?.referred_by ||
    report?.referredBy ||
    "Self"
  );
}

function collectionDate(report) {
  const p = patientData(report);

  return (
    p.collectionDate ||
    p.sampleDate ||
    report?.collection_date ||
    report?.collectionDate ||
    report?.sample_date ||
    report?.sampleDate ||
    dateText(report?.created_at)
  );
}

function genderKey(report) {
  const g = norm(patientGender(report));

  if (g === "male" || g === "m") return "male";
  if (g === "female" || g === "f") return "female";

  return "";
}

function findMasterTest(test) {
  if (!test) return null;

  const id = norm(
    test.id ||
      test.testId ||
      test.test_id
  );

  const name = norm(
    test.name ||
      test.testName ||
      test.short
  );

  return (
    MASTER_TESTS.find((m) => {
      const mid = norm(m.id);
      const mn = norm(m.name);
      const ms = norm(m.short);

      return (
        id === mid ||
        name === mn ||
        name === ms ||
        (name.length > 3 && mn.includes(name)) ||
        (name.length > 3 && name.includes(mn))
      );
    }) || null
  );
}

function findMasterParameter(name, test) {
  const target = norm(name);

  if (!target) return null;

  const masterTest = findMasterTest(test);

  const search = (master) => {
    if (!master) return null;

    return (
      master.parameters.find((p) => {
        const names = [
          p.name,
          ...(p.aliases || []),
        ].map(norm);

        return names.some(
          (n) =>
            n === target ||
            (n.length > 3 &&
              target.length > 3 &&
              (n.includes(target) ||
                target.includes(n)))
        );
      }) || null
    );
  };

  return (
    search(masterTest) ||
    MASTER_TESTS.map(search).find(Boolean) ||
    null
  );
}

function effectiveParameter(parameter, test) {
  const name =
    typeof parameter === "string"
      ? parameter
      : parameter?.name ||
        parameter?.testName ||
        parameter?.investigation ||
        parameter?.parameterName ||
        "";

  const master = findMasterParameter(name, test);

  return {
    ...(master || {}),
    ...(typeof parameter === "object"
      ? parameter
      : {}),
    name: name || master?.name || "Investigation",
    unit:
      parameter?.unit ||
      parameter?.units ||
      master?.unit ||
      "",
    range:
      parameter?.range ||
      parameter?.referenceRange ||
      parameter?.reference ||
      master?.range ||
      "",
    maleRange:
      parameter?.maleRange ||
      master?.maleRange,
    femaleRange:
      parameter?.femaleRange ||
      master?.femaleRange,
    min:
      parameter?.min ??
      parameter?.minimum ??
      master?.min,
    max:
      parameter?.max ??
      parameter?.maximum ??
      master?.max,
    maleMin:
      parameter?.maleMin ??
      master?.maleMin,
    maleMax:
      parameter?.maleMax ??
      master?.maleMax,
    femaleMin:
      parameter?.femaleMin ??
      master?.femaleMin,
    femaleMax:
      parameter?.femaleMax ??
      master?.femaleMax,
  };
}

function referenceRange(parameter, report, test) {
  const p = effectiveParameter(parameter, test);
  const gender = genderKey(report);

  if (gender === "male") {
    if (p.maleRange) return p.maleRange;

    if (
      p.maleMin !== undefined &&
      p.maleMax !== undefined
    ) {
      return `${p.maleMin} - ${p.maleMax}`;
    }
  }

  if (gender === "female") {
    if (p.femaleRange) return p.femaleRange;

    if (
      p.femaleMin !== undefined &&
      p.femaleMax !== undefined
    ) {
      return `${p.femaleMin} - ${p.femaleMax}`;
    }
  }

  if (p.range) return p.range;

  if (
    p.min !== undefined &&
    p.max !== undefined
  ) {
    return `${p.min} - ${p.max}`;
  }

  return "-";
}

function limits(parameter, report, test) {
  const p = effectiveParameter(parameter, test);
  const gender = genderKey(report);

  if (
    gender === "male" &&
    p.maleMin !== undefined &&
    p.maleMax !== undefined
  ) {
    return {
      min: Number(p.maleMin),
      max: Number(p.maleMax),
    };
  }

  if (
    gender === "female" &&
    p.femaleMin !== undefined &&
    p.femaleMax !== undefined
  ) {
    return {
      min: Number(p.femaleMin),
      max: Number(p.femaleMax),
    };
  }

  if (
    p.min !== undefined &&
    p.max !== undefined
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

function flagValue(value, parameter, report, test) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const number = Number(
    String(value)
      .replace(/,/g, "")
      .trim()
  );

  if (Number.isNaN(number)) return "";

  const { min, max } = limits(
    parameter,
    report,
    test
  );

  if (min !== null && number < min) {
    return "L";
  }

  if (max !== null && number > max) {
    return "H";
  }

  return "";
}

function reportTests(report) {
  const data = reportData(report);

  const candidates = [
    report?.tests,
    report?.selectedTests,
    report?.reportTests,
    data?.tests,
    data?.selectedTests,
    data?.reportTests,
  ];

  return (
    candidates.find(
      (x) => Array.isArray(x) && x.length
    ) || []
  );
}

function testParameters(test) {
  if (!test) return [];

  const saved = [
    test.parameters,
    test.tests,
    test.items,
    test.investigations,
  ];

  const found = saved.find(
    (x) => Array.isArray(x) && x.length
  );

  if (found) return found;

  const master = findMasterTest(test);

  return master?.parameters || [];
}

/* =========================================================
   RESULT READING
   ========================================================= */

function resultsObject(report) {
  const data = reportData(report);

  if (
    data.results &&
    typeof data.results === "object" &&
    !Array.isArray(data.results)
  ) {
    return data.results;
  }

  if (
    report?.results &&
    typeof report.results === "object" &&
    !Array.isArray(report.results)
  ) {
    return report.results;
  }

  if (
    data.testResults &&
    typeof data.testResults === "object"
  ) {
    return data.testResults;
  }

  if (
    report?.testResults &&
    typeof report.testResults === "object"
  ) {
    return report.testResults;
  }

  return {};
}

function resultKeys(test, parameter, pi, ti) {
  const testId =
    test?.id ||
    test?.testId ||
    test?.test_id ||
    `test-${ti}`;

  const testName =
    test?.name ||
    test?.testName ||
    test?.short ||
    "";

  const name =
    typeof parameter === "string"
      ? parameter
      : parameter?.name ||
        parameter?.testName ||
        parameter?.investigation ||
        parameter?.parameterName ||
        `parameter-${pi}`;

  const parameterId =
    parameter?.id ||
    parameter?.parameterId ||
    parameter?.parameter_id ||
    "";

  return [
    parameterId,
    `${testId}-${name}-${pi}`,
    `${testId}-${name}`,
    `${testId}-${parameterId}`,
    `${ti}-${name}-${pi}`,
    `${ti}-${name}`,
    `${ti}_${pi}`,
    `${ti}-${pi}`,
    `${ti}.${pi}`,
    `${testName}-${name}`,
    `${testName}_${name}`,
    name,
  ].filter(Boolean);
}

function getResult(
  report,
  test,
  parameter,
  pi,
  ti
) {
  const results = resultsObject(report);
  const keys = resultKeys(
    test,
    parameter,
    pi,
    ti
  );

  /* 1. Exact key */
  for (const key of keys) {
    if (
      Object.prototype.hasOwnProperty.call(
        results,
        key
      )
    ) {
      const value = results[key];

      if (
        value !== "" &&
        value !== null &&
        value !== undefined
      ) {
        return value;
      }
    }
  }

  const name =
    typeof parameter === "string"
      ? parameter
      : parameter?.name ||
        parameter?.testName ||
        parameter?.investigation ||
        parameter?.parameterName ||
        "";

  const target = norm(name);

  /* 2. Exact normalized key */
  for (const [key, value] of Object.entries(
    results
  )) {
    if (
      value !== "" &&
      value !== null &&
      value !== undefined &&
      norm(key) === target
    ) {
      return value;
    }
  }

  /* 3. Partial key */
  if (target) {
    for (const [key, value] of Object.entries(
      results
    )) {
      const nk = norm(key);

      if (
        value !== "" &&
        value !== null &&
        value !== undefined &&
        (nk.includes(target) ||
          target.includes(nk))
      ) {
        return value;
      }
    }
  }

  /* 4. Test result object */
  if (
    test?.results &&
    typeof test.results === "object"
  ) {
    for (const key of keys) {
      if (
        Object.prototype.hasOwnProperty.call(
          test.results,
          key
        )
      ) {
        const value = test.results[key];

        if (
          value !== "" &&
          value !== null &&
          value !== undefined
        ) {
          return value;
        }
      }
    }

    for (const [key, value] of Object.entries(
      test.results
    )) {
      if (
        value !== "" &&
        value !== null &&
        value !== undefined &&
        norm(key) === target
      ) {
        return value;
      }
    }
  }

  /* 5. Old parameter fallback */
  if (
    parameter &&
    typeof parameter === "object"
  ) {
    if (
      parameter.result !== undefined &&
      parameter.result !== null &&
      parameter.result !== ""
    ) {
      return parameter.result;
    }

    if (
      parameter.value !== undefined &&
      parameter.value !== null &&
      parameter.value !== ""
    ) {
      return parameter.value;
    }

    if (
      parameter.resultValue !== undefined &&
      parameter.resultValue !== null &&
      parameter.resultValue !== ""
    ) {
      return parameter.resultValue;
    }
  }

  return "";
}

function prepareTests(report) {
  return reportTests(report).map(
    (test, ti) => {
      const master = findMasterTest(test);

      const name =
        test?.name ||
        test?.testName ||
        test?.short ||
        master?.name ||
        "Laboratory Investigation";

      const parameters =
        testParameters(test).map(
          (parameter, pi) => {
            const p = effectiveParameter(
              parameter,
              test
            );

            const result = getResult(
              report,
              test,
              parameter,
              pi,
              ti
            );

            return {
              ...p,
              result,
              flag: flagValue(
                result,
                p,
                report,
                test
              ),
              range: referenceRange(
                p,
                report,
                test
              ),
            };
          }
        );

      return {
        ...test,
        id:
          test?.id ||
          test?.testId ||
          `test-${ti}`,
        name,
        category:
          test?.category ||
          test?.department ||
          master?.category ||
          "PATHOLOGY",
        parameters,
      };
    }
  );
}

/* =========================================================
   UI COMPONENTS
   ========================================================= */

function Info({ label, value, strong }) {
  return (
    <div className="infoCell">
      <span className="infoLabel">
        {label}
      </span>

      <span
        className={
          strong
            ? "infoValue strong"
            : "infoValue"
        }
      >
        {value || "-"}
      </span>
    </div>
  );
}

function TestSection({ test }) {
  return (
    <section className="testSection">
      <div className="testHeader">
        <span className="departmentTag">
          {String(
            test.category || "PATHOLOGY"
          ).toUpperCase()}
        </span>

        <h3 className="testTitle">
          {test.name}
        </h3>
      </div>

      <div className="tableScroll">
        <table className="labTable">
          <colgroup>
            <col className="colInvestigation" />
            <col className="colResult" />
            <col className="colUnit" />
            <col className="colReference" />
            <col className="colFlag" />
          </colgroup>

          <thead>
            <tr>
              <th>INVESTIGATION</th>
              <th>RESULT</th>
              <th>UNIT</th>
              <th>REFERENCE RANGE</th>
              <th>FLAG</th>
            </tr>
          </thead>

          <tbody>
            {(test.parameters || []).map(
              (p, index) => {
                const abnormal =
                  p.flag === "H" ||
                  p.flag === "L";

                const value =
                  p.result === "" ||
                  p.result === null ||
                  p.result === undefined
                    ? "-"
                    : p.result;

                return (
                  <tr key={`${p.name}-${index}`}>
                    <td className="investigationCell">
                      {p.name}
                    </td>

                    <td className="resultCell">
                      <span
                        className={
                          abnormal
                            ? "resultValue abnormal"
                            : "resultValue"
                        }
                      >
                        {value}
                      </span>
                    </td>

                    <td className="unitCell">
                      {p.unit || "-"}
                    </td>

                    <td className="referenceCell">
                      {p.range || "-"}
                    </td>

                    <td className="flagCell">
                      {p.flag === "H" ? (
                        <span className="flag high">
                          H
                        </span>
                      ) : p.flag === "L" ? (
                        <span className="flag low">
                          L
                        </span>
                      ) : (
                        <span className="normalDot">
                          •
                        </span>
                      )}
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* =========================================================
   MAIN PAGE
   ========================================================= */

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] =
    useState(null);
  const [searchText, setSearchText] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      setLoading(true);
      setMessage("");

      const { data, error } =
        await supabase
          .from("reports")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        console.error(error);
        setMessage(
          "Reports load nahi ho paaye: " +
            error.message
        );
        return;
      }

      setReports(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(error);
      setMessage(
        "Saved reports load karne me error aaya."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredReports = useMemo(() => {
    const search =
      searchText.toLowerCase().trim();

    if (!search) return reports;

    return reports.filter((report) => {
      const patient =
        patientName(report).toLowerCase();

      const reportNo = String(
        report?.report_no ||
          report?.reportNo ||
          ""
      ).toLowerCase();

      const id = String(
        patientId(report)
      ).toLowerCase();

      return (
        patient.includes(search) ||
        reportNo.includes(search) ||
        id.includes(search)
      );
    });
  }, [reports, searchText]);

  function viewReport(report) {
    setSelectedReport(report);

    setTimeout(() => {
      document
        .getElementById("saved-final-report")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  }

  function editReport(report) {
    if (!report?.id) {
      alert("Report ID nahi mila.");
      return;
    }

    window.location.href =
      `/reports/${encodeURIComponent(
        report.id
      )}`;
  }

  function backToDashboard() {
    if (
      typeof window !== "undefined" &&
      window.history.length > 1
    ) {
      window.history.back();
      return;
    }

    window.location.href =
      ROUTES.dashboard;
  }

  function closeReport() {
    setSelectedReport(null);
  }

  async function deleteReport(report) {
    if (!report?.id) return;

    const no =
      report.report_no ||
      report.reportNo ||
      "this report";

    if (
      !window.confirm(
        `${no} delete karna hai? Ye action undo nahi hoga.`
      )
    ) {
      return;
    }

    try {
      const { error } =
        await supabase
          .from("reports")
          .delete()
          .eq("id", report.id);

      if (error) {
        alert(
          "Report delete nahi hua: " +
            error.message
        );
        return;
      }

      setReports((old) =>
        old.filter(
          (x) => x.id !== report.id
        )
      );

      if (
        selectedReport?.id === report.id
      ) {
        setSelectedReport(null);
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

  function printReport(report) {
    setSelectedReport(report);

    setTimeout(() => {
      window.print();
    }, 400);
  }

  const previewTests = useMemo(() => {
    return selectedReport
      ? prepareTests(selectedReport)
      : [];
  }, [selectedReport]);

  const reportDate = selectedReport
    ? selectedReport?.report_date ||
      selectedReport?.reportDate ||
      reportData(selectedReport)?.reportDate ||
      selectedReport?.created_at
    : "";

  return (
    <>
      {/* =====================================================
          SAVED REPORTS
          ===================================================== */}

      <div className="savedReportsScreen">
        <div className="savedReportsHeader">
          <div className="titleArea">
            <button
              className="backButton"
              onClick={backToDashboard}
            >
              ← Dashboard
            </button>

            <div>
              <h1>Saved Reports</h1>
              <p>NIDAN PATHOLOGY LAB</p>
            </div>
          </div>

          <div className="headerControls">
            <input
              className="searchInput"
              placeholder="Search patient / report no."
              value={searchText}
              onChange={(e) =>
                setSearchText(e.target.value)
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
          <div className="message">
            {message}
          </div>
        )}

        <div className="reportsCard">
          {loading ? (
            <div className="loading">
              <div className="loadingLogo">
                N+
              </div>
              <strong>
                Saved reports loading...
              </strong>
            </div>
          ) : filteredReports.length ===
            0 ? (
            <div className="empty">
              <div className="emptyIcon">
                📄
              </div>
              <h2>No Saved Reports</h2>
              <p>
                Final report save hone ke baad
                yahan दिखाई देगा.
              </p>
            </div>
          ) : (
            <div className="reportsScroll">
              <table className="reportsTable">
                <thead>
                  <tr>
                    <th>REPORT NO.</th>
                    <th>PATIENT</th>
                    <th>TESTS</th>
                    <th>PARAMETERS</th>
                    <th>STATUS</th>
                    <th>SAVED DATE</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReports.map(
                    (report) => {
                      const tests =
                        reportTests(report);

                      const parameterCount =
                        tests.reduce(
                          (total, test) =>
                            total +
                            testParameters(test)
                              .length,
                          0
                        );

                      return (
                        <tr
                          key={
                            report.id ||
                            report.report_no
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
                              {patientName(report)}
                            </strong>

                            <small>
                              ID:{" "}
                              {patientId(report)}
                            </small>
                          </td>

                          <td>
                            {tests
                              .map(
                                (t) =>
                                  t?.short ||
                                  t?.name ||
                                  t?.testName
                              )
                              .filter(Boolean)
                              .join(", ") || "-"}
                          </td>

                          <td>
                            <span className="count">
                              {parameterCount}
                            </span>
                          </td>

                          <td>
                            <span className="status">
                              {String(
                                report.status ||
                                  "FINAL"
                              ).toUpperCase()}
                            </span>
                          </td>

                          <td>
                            {dateText(
                              report.created_at
                            )}
                          </td>

                          <td>
                            <div className="actions">
                              <button
                                className="viewBtn"
                                onClick={() =>
                                  viewReport(report)
                                }
                              >
                                👁 View
                              </button>

                              <button
                                className="editBtn"
                                onClick={() =>
                                  editReport(report)
                                }
                              >
                                ✏️ Edit
                              </button>

                              <button
                                className="printBtn"
                                onClick={() =>
                                  printReport(report)
                                }
                              >
                                🖨 Print
                              </button>

                              <button
                                className="deleteBtn"
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

      {/* =====================================================
          FINAL REPORT
          ===================================================== */}

      {selectedReport && (
        <div
          id="saved-final-report"
          className="previewWrapper"
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

            <div className="previewActions">
              <button
                onClick={backToDashboard}
                className="toolBack"
              >
                ← Dashboard
              </button>

              <button
                onClick={() =>
                  editReport(selectedReport)
                }
                className="toolEdit"
              >
                ✏️ Edit
              </button>

              <button
                onClick={() =>
                  window.print()
                }
                className="toolPrint"
              >
                🖨 Print / Save PDF
              </button>

              <button
                onClick={closeReport}
                className="toolClose"
              >
                × Close
              </button>
            </div>
          </div>

          <div className="a4Container">
            <div className="a4Page">
              {/* HEADER */}
              <header className="labHeader">
                <div className="brand">
                  <div className="logo">
                    N
                  </div>

                  <div className="brandText">
                    <h1>
                      {LAB.name}
                    </h1>

                    <h2>
                      {LAB.subtitle}
                    </h2>

                    <p>
                      {LAB.slogan}
                    </p>
                  </div>
                </div>

                <div className="headerRight">
                  <b className="reportTag">
                    LABORATORY REPORT
                  </b>

                  <span>
                    ☎ {LAB.phone}
                  </span>

                  <span>
                    📍 {LAB.address}
                  </span>

                  <span>
                    Report No:{" "}
                    <b>
                      {selectedReport.report_no ||
                        selectedReport.reportNo ||
                        "-"}
                    </b>
                  </span>

                  <span>
                    Report Date:{" "}
                    <b>
                      {dateText(reportDate)}
                    </b>
                  </span>
                </div>
              </header>

              <div className="accentLine">
                <i />
                <b />
                <span />
              </div>

              {/* PATIENT INFORMATION */}
              <section className="patientCard">
                <div className="sectionTitle">
                  <span>P</span>
                  PATIENT INFORMATION
                </div>

                <div className="patientGrid">
                  <Info
                    label="Patient Name"
                    value={patientName(
                      selectedReport
                    )}
                    strong
                  />

                  <Info
                    label="Patient ID"
                    value={patientId(
                      selectedReport
                    )}
                  />

                  <Info
                    label="Age / Sex"
                    value={`${patientAge(
                      selectedReport
                    )} / ${patientGender(
                      selectedReport
                    )}`}
                  />

                  <Info
                    label="Mobile"
                    value={patientMobile(
                      selectedReport
                    )}
                  />

                  <Info
                    label="Referred By"
                    value={doctorName(
                      selectedReport
                    )}
                  />

                  <Info
                    label="Collection Date"
                    value={collectionDate(
                      selectedReport
                    )}
                  />

                  <Info
                    label="Report Date"
                    value={dateText(
                      reportDate
                    )}
                  />

                  <Info
                    label="Report Status"
                    value="FINAL"
                    strong
                  />
                </div>
              </section>

              {/* TESTS */}
              <main className="tests">
                {previewTests.length === 0 ? (
                  <div className="noTest">
                    <strong>
                      No laboratory investigation
                      available.
                    </strong>

                    <span>
                      Saved report me test data
                      nahi mila.
                    </span>
                  </div>
                ) : (
                  previewTests.map(
                    (test, index) => (
                      <TestSection
                        key={
                          test.id || index
                        }
                        test={test}
                      />
                    )
                  )
                )}
              </main>

              {/* SIGNATURE */}
              <section className="signatures">
                <div>
                  <div className="signLine" />
                  <strong>
                    Lab Technician
                  </strong>
                  <small>
                    NIDAN PATHOLOGY LAB
                  </small>
                </div>

                <div>
                  <div className="signLine" />
                  <strong>
                    Authorized Signatory
                  </strong>
                  <small>
                    Signature &amp; Seal
                  </small>
                </div>
              </section>

              {/* NOTE */}
              <div className="note">
                <b>Note:</b> Reference ranges
                may vary according to laboratory
                methodology, age and clinical
                condition. Results should be
                interpreted by a qualified
                healthcare professional.
              </div>

              {/* FOOTER */}
              <footer className="footer">
                <strong>
                  {LAB.name}
                </strong>

                <span>
                  {LAB.slogan}
                </span>

                <small>
                  ☎ {LAB.phone} &nbsp; | &nbsp;
                  {LAB.address}
                </small>

                <em>
                  Page 1 of 1
                </em>
              </footer>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          CSS
          ===================================================== */}

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
          font-family: inherit;
        }

        /* =====================================================
           SAVED REPORTS SCREEN
           ===================================================== */

        .savedReportsScreen {
          min-height: 100vh;
          padding: 22px;
          background: #eef3f7;
        }

        .savedReportsHeader {
          max-width: 1450px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .titleArea {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .backButton {
          height: 38px;
          padding: 0 14px;
          border: 1px solid #087f72;
          border-radius: 7px;
          background: #fff;
          color: #087f72;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
        }

        .backButton:hover {
          background: #eaf8f5;
        }

        .savedReportsHeader h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 900;
        }

        .savedReportsHeader p {
          margin: 4px 0 0;
          color: #667085;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .headerControls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .searchInput {
          width: 260px;
          height: 38px;
          padding: 0 12px;
          border: 1px solid #d8e0e7;
          border-radius: 7px;
          background: #fff;
          outline: none;
          font-size: 12px;
        }

        .searchInput:focus {
          border-color: #087f72;
        }

        .refreshButton {
          height: 38px;
          padding: 0 15px;
          border: 1px solid #d8e0e7;
          border-radius: 7px;
          background: #fff;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .message {
          max-width: 1450px;
          margin: 0 auto 15px;
          padding: 12px;
          border: 1px solid #ffd591;
          border-radius: 7px;
          background: #fff7e6;
          color: #8a5700;
          font-size: 12px;
        }

        .reportsCard {
          max-width: 1450px;
          margin: auto;
          overflow: hidden;
          border: 1px solid #dce4eb;
          border-radius: 10px;
          background: #fff;
          box-shadow:
            0 4px 18px
            rgba(16, 24, 40, 0.07);
        }

        .reportsScroll {
          width: 100%;
          overflow-x: auto;
        }

        .reportsTable {
          width: 100%;
          min-width: 1100px;
          border-collapse: collapse;
        }

        .reportsTable th {
          padding: 13px 12px;
          background: #f7f9fb;
          border-bottom: 1px solid #e4e9ee;
          color: #667085;
          font-size: 10px;
          font-weight: 900;
          text-align: left;
          white-space: nowrap;
        }

        .reportsTable td {
          padding: 14px 12px;
          border-bottom: 1px solid #edf0f3;
          color: #344054;
          font-size: 11px;
          vertical-align: middle;
        }

        .reportsTable tbody tr:hover {
          background: #fbfdfe;
        }

        .reportsTable td small {
          display: block;
          margin-top: 3px;
          color: #98a2b3;
          font-size: 8px;
        }

        .count {
          width: 26px;
          height: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #dbe8f0;
          border-radius: 50%;
          background: #eff6fb;
          color: #34536b;
          font-size: 9px;
          font-weight: 900;
        }

        .status {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 20px;
          background: #e9f9ef;
          color: #14783b;
          font-size: 9px;
          font-weight: 900;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .actions button {
          padding: 6px 8px;
          border-radius: 5px;
          background: #fff;
          font-size: 9px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .viewBtn {
          border: 1px solid #b9c8e7;
          color: #244c96;
        }

        .editBtn {
          border: 1px solid #e4c979;
          color: #8a6500;
        }

        .printBtn {
          border: 1px solid #a8d7bd;
          color: #137340;
        }

        .deleteBtn {
          border: 1px solid #efb6b6;
          color: #c33131;
        }

        .loading,
        .empty {
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
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            #087f72,
            #0b6676
          );
          color: #fff;
          font-weight: 900;
        }

        .emptyIcon {
          font-size: 40px;
        }

        .empty h2 {
          margin: 8px 0 3px;
          color: #344054;
        }

        .empty p {
          margin: 0;
          font-size: 12px;
        }

        /* =====================================================
           PREVIEW
           ===================================================== */

        .previewWrapper {
          padding: 15px 10px 40px;
          background: #e8eef3;
        }

        .previewToolbar {
          width: calc(100% - 10px);
          max-width: 1200px;
          margin: 0 auto 10px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border: 1px solid #dce4eb;
          border-radius: 8px;
          background: #fff;
          box-shadow:
            0 2px 12px
            rgba(16, 24, 40, 0.06);
        }

        .previewToolbar strong {
          display: block;
          font-size: 12px;
        }

        .previewToolbar small {
          display: block;
          margin-top: 3px;
          color: #667085;
          font-size: 8px;
        }

        .previewActions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 6px;
        }

        .previewActions button {
          padding: 7px 11px;
          border-radius: 6px;
          font-size: 8px;
          font-weight: 900;
          cursor: pointer;
        }

        .toolBack {
          border: 1px solid #b9c8e7;
          background: #fff;
          color: #244c96;
        }

        .toolEdit {
          border: 1px solid #e4c979;
          background: #fffdf4;
          color: #8a6500;
        }

        .toolPrint {
          border: 1px solid #087f72;
          background: #087f72;
          color: #fff;
        }

        .toolClose {
          border: 1px solid #d0d5dd;
          background: #fff;
          color: #344054;
        }

        .a4Container {
          display: flex;
          justify-content: center;
          padding: 10px;
        }

        /* =====================================================
           A4 PAGE
           ===================================================== */

        .a4Page {
          position: relative;
          width: 210mm;
          min-height: 297mm;
          padding: 0 11mm 18mm;
          overflow: visible;
          background: #fff;
          box-shadow:
            0 14px 40px
            rgba(16, 24, 40, 0.15);
        }

        .labHeader {
          min-height: 35mm;
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
        }

        .logo {
          width: 22mm;
          height: 22mm;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #087f72;
          border-radius: 50%;
          background: #f0faf8;
          color: #087f72;
          font-size: 22px;
          font-weight: 950;
        }

        .brandText h1 {
          margin: 0;
          color: #101828;
          font-size: 21px;
          font-weight: 950;
        }

        .brandText h2 {
          margin: 3px 0 0;
          color: #087f72;
          font-size: 7px;
          letter-spacing: 0.8px;
        }

        .brandText p {
          margin: 4px 0 0;
          color: #667085;
          font-size: 6px;
        }

        .headerRight {
          width: 67mm;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          color: #667085;
          font-size: 5.7px;
          line-height: 1.45;
          text-align: right;
        }

        .reportTag {
          margin-bottom: 2px;
          padding: 3px 6px;
          border-radius: 3px;
          background: #e9f8f5;
          color: #087f72;
          font-size: 6px;
          letter-spacing: 0.5px;
        }

        .accentLine {
          height: 2px;
          margin-bottom: 4mm;
          display: flex;
          gap: 2px;
        }

        .accentLine i {
          flex: 4;
          background: #087f72;
        }

        .accentLine b {
          flex: 1;
          background: #eabf43;
        }

        .accentLine span {
          flex: 6;
          background: #dce5ea;
        }

        /* =====================================================
           PATIENT
           ===================================================== */

        .patientCard {
          margin-bottom: 4mm;
          overflow: hidden;
          border: 1px solid #d7e0e6;
          border-radius: 4px;
        }

        .sectionTitle {
          height: 6.5mm;
          padding: 0 3mm;
          display: flex;
          align-items: center;
          gap: 6px;
          background: #087f72;
          color: #fff;
          font-size: 6.5px;
          font-weight: 950;
          letter-spacing: 0.6px;
        }

        .sectionTitle span {
          width: 15px;
          height: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.18);
        }

        .patientGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }

        .infoCell {
          min-height: 9mm;
          padding: 2mm 3mm;
          border-right: 1px solid #e3e8ed;
          border-bottom: 1px solid #e3e8ed;
        }

        .infoCell:nth-child(4n) {
          border-right: 0;
        }

        .infoCell:nth-last-child(-n + 4) {
          border-bottom: 0;
        }

        .infoLabel {
          display: block;
          margin-bottom: 2px;
          color: #7a8796;
          font-size: 4.7px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .infoValue {
          display: block;
          color: #172033;
          font-size: 6.4px;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .infoValue.strong {
          font-size: 7px;
          font-weight: 950;
        }

        /* =====================================================
           TEST SECTION
           ===================================================== */

        .tests {
          display: flex;
          flex-direction: column;
          gap: 4mm;
        }

        .testSection {
          width: 100%;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .testHeader {
          min-height: 7mm;
          margin-bottom: 1.8mm;
          display: flex;
          align-items: center;
          gap: 2.5mm;
        }

        .departmentTag {
          flex-shrink: 0;
          padding: 3px 6px;
          border-radius: 3px;
          background: #e8f7f4;
          color: #087f72;
          font-size: 5px;
          font-weight: 950;
          letter-spacing: 0.6px;
        }

        .testTitle {
          flex: 1;
          margin: 0;
          padding: 2.2mm 3.5mm;
          border-left: 3px solid #087f72;
          border-radius: 3px;
          background: #f0faf8;
          color: #101828;
          font-size: 9.5px;
          font-weight: 950;
        }

        /* =====================================================
           IMPORTANT TABLE LAYOUT FIX
           ===================================================== */

        .tableScroll {
          width: 100%;
          overflow: visible;
        }

        .labTable {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          border: 1px solid #cfd9e0;
          border-radius: 4px;
        }

        .labTable th {
          height: 7mm;
          padding: 1.3mm 1.5mm;
          background: #e9f1f4;
          border-right: 1px solid #d2dce2;
          border-bottom: 1px solid #cbd6dc;
          color: #344054;
          font-size: 5.2px;
          font-weight: 950;
          text-align: center;
          letter-spacing: 0.2px;
        }

        .labTable td {
          min-height: 7mm;
          padding: 1.3mm 1.8mm;
          border-right: 1px solid #e1e7eb;
          border-bottom: 1px solid #e5eaee;
          color: #273443;
          font-size: 5.8px;
          vertical-align: middle;
          background: #fff;
        }

        .labTable tr:nth-child(even) td {
          background: #fbfcfd;
        }

        .labTable tr:last-child td {
          border-bottom: 0;
        }

        .labTable th:last-child,
        .labTable td:last-child {
          border-right: 0;
        }

        /*
          Investigation = largest area
          Result = clear separate area
          Unit = separate
          Reference = readable
          Flag = small
        */

        .colInvestigation {
          width: 35%;
        }

        .colResult {
          width: 20%;
        }

        .colUnit {
          width: 14%;
        }

        .colReference {
          width: 23%;
        }

        .colFlag {
          width: 8%;
        }

        .investigationCell {
          padding-left: 3mm !important;
          color: #1f2937 !important;
          font-size: 6.2px !important;
          font-weight: 800 !important;
          text-align: left !important;
        }

        .resultCell {
          text-align: center !important;
        }

        .unitCell {
          text-align: center !important;
          font-weight: 700 !important;
        }

        .referenceCell {
          text-align: center !important;
          font-weight: 700 !important;
          white-space: nowrap;
        }

        .flagCell {
          text-align: center !important;
        }

        .resultValue {
          min-width: 24mm;
          min-height: 6mm;
          padding: 1mm 2.5mm;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 3px;
          background: #f2f6f9;
          color: #101828;
          font-size: 7.5px;
          font-weight: 950;
        }

        .resultValue.abnormal {
          border: 1px solid #f5c8c5;
          background: #fff1f0;
          color: #b42318;
        }

        .flag {
          width: 15px;
          height: 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 3px;
          font-size: 6px;
          font-weight: 950;
        }

        .flag.high {
          border: 1px solid #fecdca;
          background: #fee4e2;
          color: #b42318;
        }

        .flag.low {
          border: 1px solid #b2ddff;
          background: #eff8ff;
          color: #175cd3;
        }

        .normalDot {
          color: #159957;
          font-size: 11px;
          font-weight: 900;
        }

        /* =====================================================
           SIGNATURE
           ===================================================== */

        .signatures {
          margin-top: 5mm;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30mm;
          break-inside: avoid;
        }

        .signatures > div {
          text-align: center;
        }

        .signLine {
          width: 55mm;
          height: 7mm;
          margin: auto;
          border-bottom: 1px solid #667085;
        }

        .signatures strong {
          display: block;
          margin-top: 2px;
          font-size: 6px;
        }

        .signatures small {
          display: block;
          margin-top: 1px;
          color: #667085;
          font-size: 4.5px;
        }

        /* =====================================================
           NOTE
           ===================================================== */

        .note {
          margin-top: 3mm;
          padding: 2mm 2.5mm;
          border: 1px solid #dbe3e8;
          border-radius: 3px;
          background: #f8fafb;
          color: #667085;
          font-size: 4.6px;
          line-height: 1.4;
          break-inside: avoid;
        }

        /* =====================================================
           FOOTER
           ===================================================== */

        .footer {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          min-height: 12mm;
          padding: 2.2mm 11mm;
          border-top: 1px solid #dce4e8;
          background: #f4f7f8;
          text-align: center;
        }

        .footer strong {
          display: block;
          color: #087f72;
          font-size: 5.8px;
        }

        .footer span {
          display: block;
          margin-top: 1px;
          color: #667085;
          font-size: 3.8px;
        }

        .footer small {
          display: block;
          margin-top: 1px;
          color: #98a2b3;
          font-size: 3.4px;
        }

        .footer em {
          position: absolute;
          right: 7mm;
          bottom: 3mm;
          color: #98a2b3;
          font-size: 3.4px;
          font-style: normal;
        }

        .noTest {
          padding: 20mm;
          text-align: center;
          color: #667085;
          font-size: 9px;
        }

        .noTest span {
          display: block;
          margin-top: 5px;
          font-size: 6px;
          color: #98a2b3;
        }

        /* =====================================================
           MOBILE
           ===================================================== */

        @media (max-width: 700px) {
          .savedReportsScreen {
            padding: 12px 5px;
          }

          .savedReportsHeader {
            align-items: flex-start;
            flex-direction: column;
          }

          .titleArea {
            width: 100%;
            align-items: flex-start;
            flex-direction: column;
          }

          .savedReportsHeader h1 {
            font-size: 23px;
          }

          .headerControls {
            width: 100%;
          }

          .searchInput {
            flex: 1;
            width: auto;
          }

          .actions {
            flex-direction: column;
          }

          .actions button {
            width: 100%;
          }

          .previewWrapper {
            padding: 8px 2px 25px;
          }

          .previewToolbar {
            width: calc(100% - 6px);
            flex-direction: column;
            align-items: stretch;
          }

          .previewActions {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .previewActions button {
            width: 100%;
          }

          .toolPrint {
            grid-column: span 2;
          }

          .a4Container {
            padding: 3px 0 20px;
          }

          .a4Page {
            width: calc(100vw - 8px);
            min-height: calc(
              (100vw - 8px) * 1.4142857
            );
            padding-left: 4.5mm;
            padding-right: 4.5mm;
            padding-bottom: 15mm;
          }

          .labHeader {
            min-height: 31mm;
            padding-top: 5mm;
            gap: 3mm;
          }

          .logo {
            width: 17mm;
            height: 17mm;
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

          .reportTag {
            font-size: 4px;
          }

          .patientGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .infoCell:nth-child(4n) {
            border-right: 1px solid #e3e8ed;
          }

          .infoCell:nth-child(2n) {
            border-right: 0;
          }

          .infoCell:nth-last-child(-n + 4) {
            border-bottom: 1px solid #e3e8ed;
          }

          .infoCell:nth-last-child(-n + 2) {
            border-bottom: 0;
          }

          .infoCell {
            min-height: 8mm;
            padding: 1.5mm 2mm;
          }

          .sectionTitle {
            height: 5.5mm;
            font-size: 4.5px;
          }

          .sectionTitle span {
            width: 11px;
            height: 11px;
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

          .testTitle {
            font-size: 6.3px;
            padding: 1.7mm 2mm;
          }

          .labTable th {
            height: 5.5mm;
            padding: 1mm;
            font-size: 3.4px;
          }

          .labTable td {
            min-height: 5.7mm;
            padding: 0.8mm 1mm;
            font-size: 3.9px;
          }

          .investigationCell {
            padding-left: 1.5mm !important;
            font-size: 3.9px !important;
          }

          .resultValue {
            min-width: 14mm;
            min-height: 4.8mm;
            padding: 0.7mm 1.5mm;
            font-size: 5.3px;
          }

          .referenceCell {
            font-size: 3.7px !important;
          }

          .unitCell {
            font-size: 3.7px !important;
          }

          .flag {
            width: 11px;
            height: 11px;
            font-size: 4px;
          }

          .normalDot {
            font-size: 7px;
          }

          .signatures {
            gap: 15mm;
            margin-top: 3mm;
          }

          .signLine {
            width: 35mm;
            height: 4mm;
          }

          .signatures strong {
            font-size: 4px;
          }

          .signatures small {
            font-size: 3px;
          }

          .note {
            font-size: 3px;
            margin-top: 2mm;
          }

          .footer {
            min-height: 10mm;
            padding: 2mm 5mm;
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

        /* =====================================================
           PRINT / SAVE PDF
           ===================================================== */

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html,
          body {
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .savedReportsScreen,
          .previewToolbar {
            display: none !important;
          }

          .previewWrapper {
            display: block !important;
            width: 210mm !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
          }

          .a4Container {
            display: block !important;
            width: 210mm !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .a4Page {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 0 11mm 18mm !important;
            box-shadow: none !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .testSection,
          .patientCard,
          .signatures,
          .note {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </>
  );
}
