"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { supabase } from "../../lib/supabase";

/* =========================================================
   NIDAN PATHOLOGY LAB
   SAVED REPORTS + VIEW + EDIT + PRINT + DELETE

   FEATURES
   ---------------------------------------------------------
   1. Saved Reports
   2. Search
   3. Dashboard Back
   4. View Report
   5. Edit Patient Details
   6. Edit Test Results
   7. Save Edited Report to Supabase
   8. Print / Save PDF
   9. Delete Report
   10. A4 Professional Report
   11. Mobile Responsive
   12. Multiple saved-data formats supported

   SUPPORTED TEST DATA:
   report.tests
   report.selectedTests
   report.reportTests
   report.report_data.tests
   report.report_data.selectedTests
   report.report_data.reportTests

   SUPPORTED RESULTS:
   report.results
   report.testResults
   report.report_data.results
   report.report_data.testResults
   parameter.result
   parameter.value

   SUPPORTED PATIENT:
   report.patient
   report.report_data.patient
   top-level Supabase columns
   ========================================================= */


/* =========================================================
   DASHBOARD ROUTE
   ---------------------------------------------------------
   अगर आपका Dashboard /dashboard पर है:
   const DASHBOARD_ROUTE = "/dashboard";

   अगर Dashboard आपकी website के home "/" पर है:
   const DASHBOARD_ROUTE = "/";
   ========================================================= */

const DASHBOARD_ROUTE = "/dashboard";


/* =========================================================
   LAB INFORMATION
   ========================================================= */

const LAB = {
  name:
    "NIDAN PATHOLOGY LAB",

  subtitle:
    "DIAGNOSTIC & PATHOLOGY LABORATORY",

  slogan:
    "Accurate Diagnosis • Trusted Care • Better Health",

  phone:
    "7987580004, 8889325233",

  address:
    "Gram/Singhanpur, Tehsil Sarangarh, District Sarangarh-Bilaigarh, Chhattisgarh",
};


/* =========================================================
   MASTER TEST DATABASE
   ========================================================= */

const MASTER_TESTS = [

  /* =======================================================
     CBC
     ======================================================= */

  {
    id: "cbc",

    name:
      "Complete Blood Count (CBC)",

    short: "CBC",

    category:
      "HAEMATOLOGY",

    parameters: [

      {
        name:
          "Haemoglobin",

        aliases: [
          "Hemoglobin",
          "Hb",
        ],

        unit:
          "g/dL",

        maleMin: 13,
        maleMax: 17,

        femaleMin: 12,
        femaleMax: 15,

        maleRange:
          "13 - 17",

        femaleRange:
          "12 - 15",
      },

      {
        name:
          "Total Leucocyte Count (TLC)",

        aliases: [
          "Total WBC Count",
          "WBC Count",
          "TLC",
          "Total Leukocyte Count",
        ],

        unit:
          "/cumm",

        min:
          4000,

        max:
          11000,

        range:
          "4,000 - 11,000",
      },

      {
        name:
          "Neutrophils",

        aliases: [
          "Neutrophil",
        ],

        unit:
          "%",

        min:
          40,

        max:
          75,

        range:
          "40 - 75",
      },

      {
        name:
          "Lymphocytes",

        aliases: [
          "Lymphocyte",
        ],

        unit:
          "%",

        min:
          20,

        max:
          40,

        range:
          "20 - 40",
      },

      {
        name:
          "Eosinophils",

        aliases: [
          "Eosinophil",
        ],

        unit:
          "%",

        min:
          1,

        max:
          6,

        range:
          "1 - 6",
      },

      {
        name:
          "Monocytes",

        aliases: [
          "Monocyte",
        ],

        unit:
          "%",

        min:
          1,

        max:
          10,

        range:
          "1 - 10",
      },

      {
        name:
          "Basophils",

        aliases: [
          "Basophil",
        ],

        unit:
          "%",

        min:
          0,

        max:
          1,

        range:
          "0 - 1",
      },

      {
        name:
          "RBC Count",

        aliases: [
          "RBC",
          "Red Blood Cell Count",
          "Total RBC Count",
        ],

        unit:
          "million/cumm",

        maleMin:
          4.5,

        maleMax:
          6.0,

        femaleMin:
          4.0,

        femaleMax:
          5.5,

        maleRange:
          "4.5 - 6.0",

        femaleRange:
          "4.0 - 5.5",
      },

      {
        name:
          "PCV / Haematocrit",

        aliases: [
          "PCV",
          "Hematocrit",
          "Haematocrit",
          "PCV / Hematocrit",
        ],

        unit:
          "%",

        maleMin:
          40,

        maleMax:
          50,

        femaleMin:
          36,

        femaleMax:
          46,

        maleRange:
          "40 - 50",

        femaleRange:
          "36 - 46",
      },

      {
        name:
          "MCV",

        aliases: [],

        unit:
          "fL",

        min:
          80,

        max:
          100,

        range:
          "80 - 100",
      },

      {
        name:
          "MCH",

        aliases: [],

        unit:
          "pg",

        min:
          27,

        max:
          32,

        range:
          "27 - 32",
      },

      {
        name:
          "MCHC",

        aliases: [],

        unit:
          "g/dL",

        min:
          32,

        max:
          36,

        range:
          "32 - 36",
      },

      {
        name:
          "RDW-CV",

        aliases: [
          "RDW",
          "RDW CV",
        ],

        unit:
          "%",

        min:
          11.5,

        max:
          14.5,

        range:
          "11.5 - 14.5",
      },

      {
        name:
          "Platelet Count",

        aliases: [
          "Platelets",
          "Total Platelet Count",
        ],

        unit:
          "Lac/cumm",

        min:
          1.5,

        max:
          4.5,

        range:
          "1.5 - 4.5",
      },

      {
        name:
          "MPV",

        aliases: [
          "Mean Platelet Volume",
        ],

        unit:
          "fL",

        min:
          7.5,

        max:
          11.5,

        range:
          "7.5 - 11.5",
      },

      {
        name:
          "PDW",

        aliases: [
          "Platelet Distribution Width",
        ],

        unit:
          "%",

        min:
          9,

        max:
          17,

        range:
          "9 - 17",
      },

      {
        name:
          "PCT",

        aliases: [
          "Plateletcrit",
        ],

        unit:
          "%",

        min:
          0.15,

        max:
          0.40,

        range:
          "0.15 - 0.40",
      },
    ],
  },


  /* =======================================================
     ESR
     ======================================================= */

  {
    id:
      "esr",

    name:
      "Erythrocyte Sedimentation Rate (ESR)",

    short:
      "ESR",

    category:
      "HAEMATOLOGY",

    parameters: [

      {
        name:
          "ESR",

        aliases: [
          "Erythrocyte Sedimentation Rate",
        ],

        unit:
          "mm/hr",

        maleMin:
          0,

        maleMax:
          15,

        femaleMin:
          0,

        femaleMax:
          20,

        maleRange:
          "0 - 15",

        femaleRange:
          "0 - 20",
      },
    ],
  },


  /* =======================================================
     BLOOD SUGAR
     ======================================================= */

  {
    id:
      "sugar",

    name:
      "Blood Glucose",

    short:
      "Blood Sugar",

    category:
      "BIOCHEMISTRY",

    parameters: [

      {
        name:
          "Fasting Blood Sugar",

        aliases: [
          "FBS",
          "Fasting Glucose",
          "Fasting Blood Glucose",
        ],

        unit:
          "mg/dL",

        min:
          70,

        max:
          99,

        range:
          "70 - 99",
      },

      {
        name:
          "Post Prandial Blood Sugar",

        aliases: [
          "PPBS",
          "Post Prandial Glucose",
          "Postprandial Blood Sugar",
        ],

        unit:
          "mg/dL",

        min:
          70,

        max:
          140,

        range:
          "70 - 140",
      },

      {
        name:
          "Random Blood Sugar",

        aliases: [
          "RBS",
          "Random Glucose",
          "Random Blood Glucose",
        ],

        unit:
          "mg/dL",

        min:
          70,

        max:
          140,

        range:
          "70 - 140",
      },
    ],
  },


  /* =======================================================
     KFT
     ======================================================= */

  {
    id:
      "kft",

    name:
      "Kidney Function Test",

    short:
      "KFT",

    category:
      "BIOCHEMISTRY",

    parameters: [

      {
        name:
          "Blood Urea",

        aliases: [
          "Urea",
          "Serum Urea",
        ],

        unit:
          "mg/dL",

        min:
          15,

        max:
          40,

        range:
          "15 - 40",
      },

      {
        name:
          "Serum Creatinine",

        aliases: [
          "Creatinine",
        ],

        unit:
          "mg/dL",

        min:
          0.6,

        max:
          1.3,

        range:
          "0.6 - 1.3",
      },

      {
        name:
          "Uric Acid",

        aliases: [
          "Serum Uric Acid",
        ],

        unit:
          "mg/dL",

        maleMin:
          3.4,

        maleMax:
          7.0,

        femaleMin:
          2.4,

        femaleMax:
          6.0,

        maleRange:
          "3.4 - 7.0",

        femaleRange:
          "2.4 - 6.0",
      },

      {
        name:
          "Sodium",

        aliases: [
          "Serum Sodium",
          "Na+",
        ],

        unit:
          "mEq/L",

        min:
          135,

        max:
          145,

        range:
          "135 - 145",
      },

      {
        name:
          "Potassium",

        aliases: [
          "Serum Potassium",
          "K+",
        ],

        unit:
          "mEq/L",

        min:
          3.5,

        max:
          5.1,

        range:
          "3.5 - 5.1",
      },

      {
        name:
          "Chloride",

        aliases: [
          "Serum Chloride",
          "Cl-",
        ],

        unit:
          "mEq/L",

        min:
          98,

        max:
          107,

        range:
          "98 - 107",
      },

      {
        name:
          "BUN",

        aliases: [
          "Blood Urea Nitrogen",
        ],

        unit:
          "mg/dL",

        min:
          7,

        max:
          20,

        range:
          "7 - 20",
      },
    ],
  },


  /* =======================================================
     LFT
     ======================================================= */

  {
    id:
      "lft",

    name:
      "Liver Function Test",

    short:
      "LFT",

    category:
      "BIOCHEMISTRY",

    parameters: [

      {
        name:
          "Total Bilirubin",

        aliases: [
          "Bilirubin Total",
          "Serum Bilirubin Total",
        ],

        unit:
          "mg/dL",

        min:
          0.2,

        max:
          1.2,

        range:
          "0.2 - 1.2",
      },

      {
        name:
          "Direct Bilirubin",

        aliases: [
          "Bilirubin Direct",
        ],

        unit:
          "mg/dL",

        min:
          0,

        max:
          0.3,

        range:
          "0 - 0.3",
      },

      {
        name:
          "Indirect Bilirubin",

        aliases: [
          "Bilirubin Indirect",
        ],

        unit:
          "mg/dL",

        min:
          0.2,

        max:
          0.9,

        range:
          "0.2 - 0.9",
      },

      {
        name:
          "SGOT / AST",

        aliases: [
          "SGOT",
          "AST",
        ],

        unit:
          "U/L",

        min:
          0,

        max:
          40,

        range:
          "Up to 40",
      },

      {
        name:
          "SGPT / ALT",

        aliases: [
          "SGPT",
          "ALT",
        ],

        unit:
          "U/L",

        min:
          0,

        max:
          40,

        range:
          "Up to 40",
      },

      {
        name:
          "Alkaline Phosphatase",

        aliases: [
          "ALP",
        ],

        unit:
          "U/L",

        min:
          44,

        max:
          147,

        range:
          "44 - 147",
      },

      {
        name:
          "Total Protein",

        aliases: [
          "Serum Total Protein",
        ],

        unit:
          "g/dL",

        min:
          6,

        max:
          8.3,

        range:
          "6.0 - 8.3",
      },

      {
        name:
          "Albumin",

        aliases: [
          "Serum Albumin",
        ],

        unit:
          "g/dL",

        min:
          3.5,

        max:
          5,

        range:
          "3.5 - 5.0",
      },

      {
        name:
          "Globulin",

        aliases: [
          "Serum Globulin",
        ],

        unit:
          "g/dL",

        min:
          2,

        max:
          3.5,

        range:
          "2.0 - 3.5",
      },
    ],
  },


  /* =======================================================
     LIPID
     ======================================================= */

  {
    id:
      "lipid",

    name:
      "Lipid Profile",

    short:
      "Lipid Profile",

    category:
      "BIOCHEMISTRY",

    parameters: [

      {
        name:
          "Total Cholesterol",

        aliases: [
          "Cholesterol",
        ],

        unit:
          "mg/dL",

        min:
          0,

        max:
          200,

        range:
          "< 200",
      },

      {
        name:
          "Triglycerides",

        aliases: [
          "TG",
        ],

        unit:
          "mg/dL",

        min:
          0,

        max:
          150,

        range:
          "< 150",
      },

      {
        name:
          "HDL Cholesterol",

        aliases: [
          "HDL",
          "HDL-C",
        ],

        unit:
          "mg/dL",

        min:
          40,

        max:
          100,

        range:
          "40 - 100",
      },

      {
        name:
          "LDL Cholesterol",

        aliases: [
          "LDL",
          "LDL-C",
        ],

        unit:
          "mg/dL",

        min:
          0,

        max:
          100,

        range:
          "< 100",
      },

      {
        name:
          "VLDL Cholesterol",

        aliases: [
          "VLDL",
          "VLDL-C",
        ],

        unit:
          "mg/dL",

        min:
          5,

        max:
          40,

        range:
          "5 - 40",
      },
    ],
  },


  /* =======================================================
     HBA1C
     ======================================================= */

  {
    id:
      "hba1c",

    name:
      "HbA1c",

    short:
      "HbA1c",

    category:
      "BIOCHEMISTRY",

    parameters: [

      {
        name:
          "HbA1c",

        aliases: [
          "Glycated Hemoglobin",
          "Glycosylated Hemoglobin",
        ],

        unit:
          "%",

        min:
          4,

        max:
          5.6,

        range:
          "4.0 - 5.6",
      },
    ],
  },


  /* =======================================================
     THYROID
     ======================================================= */

  {
    id:
      "thyroid",

    name:
      "Thyroid Profile",

    short:
      "Thyroid",

    category:
      "HORMONE",

    parameters: [

      {
        name:
          "T3",

        aliases: [
          "Triiodothyronine",
          "Total T3",
        ],

        unit:
          "ng/dL",

        min:
          80,

        max:
          200,

        range:
          "80 - 200",
      },

      {
        name:
          "T4",

        aliases: [
          "Thyroxine",
          "Total T4",
        ],

        unit:
          "µg/dL",

        min:
          5.1,

        max:
          14.1,

        range:
          "5.1 - 14.1",
      },

      {
        name:
          "TSH",

        aliases: [
          "Thyroid Stimulating Hormone",
        ],

        unit:
          "µIU/mL",

        min:
          0.4,

        max:
          4,

        range:
          "0.4 - 4.0",
      },
    ],
  },
];


/* =========================================================
   NORMALIZE TEXT
   ========================================================= */

function normalizeText(value) {

  return String(value || "")
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[./_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

}


/* =========================================================
   GENDER
   ========================================================= */

function getGender(patient) {

  const value =
    normalizeText(
      patient?.gender ||
      patient?.sex ||
      patient?.patientGender ||
      ""
    );

  if (
    value === "male" ||
    value === "m"
  ) {
    return "male";
  }

  if (
    value === "female" ||
    value === "f"
  ) {
    return "female";
  }

  return "";

}


/* =========================================================
   FIND MASTER TEST
   ========================================================= */

function findMasterTest(test) {

  if (!test) {
    return null;
  }

  const id =
    normalizeText(
      test?.id ||
      test?.testId ||
      test?.test_id ||
      ""
    );

  const name =
    normalizeText(
      test?.name ||
      test?.testName ||
      test?.short ||
      ""
    );

  return (
    MASTER_TESTS.find(
      (master) => {

        const masterId =
          normalizeText(
            master.id
          );

        const masterName =
          normalizeText(
            master.name
          );

        const masterShort =
          normalizeText(
            master.short
          );

        return (
          id === masterId ||
          name === masterName ||
          name === masterShort ||
          (
            name.length > 3 &&
            masterName.includes(
              name
            )
          ) ||
          (
            name.length > 3 &&
            name.includes(
              masterName
            )
          )
        );

      }
    ) || null
  );

}


/* =========================================================
   FIND MASTER PARAMETER
   ========================================================= */

function findMasterParameter(
  parameterName,
  test
) {

  const target =
    normalizeText(
      parameterName
    );

  if (!target) {
    return null;
  }

  const masterTest =
    findMasterTest(test);

  if (masterTest) {

    const match =
      masterTest.parameters.find(
        (parameter) => {

          const names = [
            parameter.name,
            ...(parameter.aliases || []),
          ].map(
            normalizeText
          );

          return names.some(
            (name) =>
              name === target ||
              (
                name.length > 3 &&
                target.length > 3 &&
                (
                  name.includes(
                    target
                  ) ||
                  target.includes(
                    name
                  )
                )
              )
          );

        }
      );

    if (match) {
      return match;
    }

  }

  for (
    const group of MASTER_TESTS
  ) {

    const match =
      group.parameters.find(
        (parameter) => {

          const names = [
            parameter.name,
            ...(parameter.aliases || []),
          ].map(
            normalizeText
          );

          return names.some(
            (name) =>
              name === target ||
              (
                name.length > 3 &&
                target.length > 3 &&
                (
                  name.includes(
                    target
                  ) ||
                  target.includes(
                    name
                  )
                )
              )
          );

        }
      );

    if (match) {
      return match;
    }

  }

  return null;

}


/* =========================================================
   EFFECTIVE PARAMETER
   ========================================================= */

function getEffectiveParameter(
  parameter,
  test
) {

  const parameterName =
    typeof parameter === "string"
      ? parameter
      : (
          parameter?.name ||
          parameter?.testName ||
          parameter?.investigation ||
          parameter?.parameterName ||
          ""
        );

  const master =
    findMasterParameter(
      parameterName,
      test
    );

  if (!master) {

    return {

      ...(typeof parameter === "object"
        ? parameter
        : {}),

      name:
        parameterName ||
        "Investigation",

      unit:
        typeof parameter === "object"
          ? (
              parameter?.unit ||
              parameter?.units ||
              ""
            )
          : "",

      range:
        typeof parameter === "object"
          ? (
              parameter?.range ||
              parameter?.referenceRange ||
              parameter?.reference ||
              ""
            )
          : "",

    };

  }

  return {

    ...master,

    ...(typeof parameter === "object"
      ? parameter
      : {}),

    name:
      parameterName ||
      master.name,

    unit:
      typeof parameter === "object"
        ? (
            parameter?.unit ||
            parameter?.units ||
            master.unit
          )
        : master.unit,

    range:
      typeof parameter === "object"
        ? (
            parameter?.range ||
            parameter?.referenceRange ||
            parameter?.reference ||
            master.range
          )
        : master.range,

    maleRange:
      typeof parameter === "object"
        ? (
            parameter?.maleRange ||
            master.maleRange
          )
        : master.maleRange,

    femaleRange:
      typeof parameter === "object"
        ? (
            parameter?.femaleRange ||
            master.femaleRange
          )
        : master.femaleRange,

    min:
      typeof parameter === "object"
        ? (
            parameter?.min ??
            parameter?.minimum ??
            master.min
          )
        : master.min,

    max:
      typeof parameter === "object"
        ? (
            parameter?.max ??
            parameter?.maximum ??
            master.max
          )
        : master.max,

    maleMin:
      typeof parameter === "object"
        ? (
            parameter?.maleMin ??
            master.maleMin
          )
        : master.maleMin,

    maleMax:
      typeof parameter === "object"
        ? (
            parameter?.maleMax ??
            master.maleMax
          )
        : master.maleMax,

    femaleMin:
      typeof parameter === "object"
        ? (
            parameter?.femaleMin ??
            master.femaleMin
          )
        : master.femaleMin,

    femaleMax:
      typeof parameter === "object"
        ? (
            parameter?.femaleMax ??
            master.femaleMax
          )
        : master.femaleMax,

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

  const p =
    getEffectiveParameter(
      parameter,
      test
    );

  const gender =
    getGender(patient);

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
    p.maleMin !== undefined &&
    p.maleMax !== undefined
  ) {
    return `${p.maleMin} - ${p.maleMax}`;
  }

  if (
    gender === "female" &&
    p.femaleMin !== undefined &&
    p.femaleMax !== undefined
  ) {
    return `${p.femaleMin} - ${p.femaleMax}`;
  }

  if (p.range) {
    return p.range;
  }

  if (
    p.min !== undefined &&
    p.max !== undefined
  ) {
    return `${p.min} - ${p.max}`;
  }

  return "-";

}


/* =========================================================
   LIMITS
   ========================================================= */

function getLimits(
  parameter,
  patient,
  test
) {

  const p =
    getEffectiveParameter(
      parameter,
      test
    );

  const gender =
    getGender(patient);

  if (
    gender === "male" &&
    p.maleMin !== undefined &&
    p.maleMax !== undefined
  ) {

    return {
      min:
        Number(p.maleMin),

      max:
        Number(p.maleMax),
    };

  }

  if (
    gender === "female" &&
    p.femaleMin !== undefined &&
    p.femaleMax !== undefined
  ) {

    return {
      min:
        Number(p.femaleMin),

      max:
        Number(p.femaleMax),
    };

  }

  if (
    p.min !== undefined &&
    p.max !== undefined
  ) {

    return {
      min:
        Number(p.min),

      max:
        Number(p.max),
    };

  }

  return {
    min: null,
    max: null,
  };

}


/* =========================================================
   FLAG
   ========================================================= */

function getFlag(
  value,
  parameter,
  patient,
  test
) {

  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const numeric =
    Number(
      String(value)
        .replace(/,/g, "")
        .trim()
    );

  if (
    Number.isNaN(numeric)
  ) {
    return "";
  }

  const {
    min,
    max,
  } =
    getLimits(
      parameter,
      patient,
      test
    );

  if (
    min !== null &&
    numeric < min
  ) {
    return "L";
  }

  if (
    max !== null &&
    numeric > max
  ) {
    return "H";
  }

  return "";

}


/* =========================================================
   GET REPORT DATA
   ========================================================= */

function getReportData(report) {

  if (
    report?.report_data &&
    typeof report.report_data === "object"
  ) {
    return report.report_data;
  }

  return {};

}


/* =========================================================
   GET REPORT TESTS
   ========================================================= */

function getReportTests(report) {

  if (!report) {
    return [];
  }

  const data =
    report?.report_data || {};


  if (
    Array.isArray(report?.tests) &&
    report.tests.length > 0
  ) {
    return report.tests;
  }


  if (
    Array.isArray(report?.selectedTests) &&
    report.selectedTests.length > 0
  ) {
    return report.selectedTests;
  }


  if (
    Array.isArray(report?.reportTests) &&
    report.reportTests.length > 0
  ) {
    return report.reportTests;
  }


  if (
    Array.isArray(data?.tests) &&
    data.tests.length > 0
  ) {
    return data.tests;
  }


  if (
    Array.isArray(data?.selectedTests) &&
    data.selectedTests.length > 0
  ) {
    return data.selectedTests;
  }


  if (
    Array.isArray(data?.reportTests) &&
    data.reportTests.length > 0
  ) {
    return data.reportTests;
  }


  return [];

}


/* =========================================================
   GET PARAMETERS
   ========================================================= */

function getParameters(test) {

  if (!test) {
    return [];
  }


  if (
    Array.isArray(test?.parameters) &&
    test.parameters.length
  ) {
    return test.parameters;
  }


  if (
    Array.isArray(test?.tests) &&
    test.tests.length
  ) {
    return test.tests;
  }


  if (
    Array.isArray(test?.items) &&
    test.items.length
  ) {
    return test.items;
  }


  if (
    Array.isArray(test?.investigations) &&
    test.investigations.length
  ) {
    return test.investigations;
  }


  return [];

}


/* =========================================================
   GET RESULTS OBJECT
   ========================================================= */

function getResultsObject(report) {

  if (!report) {
    return {};
  }

  const data =
    report?.report_data || {};


  if (
    report?.results &&
    typeof report.results === "object"
  ) {
    return report.results;
  }


  if (
    report?.testResults &&
    typeof report.testResults === "object"
  ) {
    return report.testResults;
  }


  if (
    data?.results &&
    typeof data.results === "object"
  ) {
    return data.results;
  }


  if (
    data?.testResults &&
    typeof data.testResults === "object"
  ) {
    return data.testResults;
  }


  return {};

}


/* =========================================================
   GET RESULT
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


  const results =
    getResultsObject(report);


  if (
    !results ||
    typeof results !== "object"
  ) {
    return "";
  }


  const testId =
    test?.id ||
    test?.testId ||
    test?.test_id ||
    `test-${testIndex}`;


  const name =
    typeof parameter === "string"
      ? parameter
      : (
          parameter?.name ||
          parameter?.testName ||
          parameter?.investigation ||
          parameter?.parameterName ||
          `parameter-${index}`
        );


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


  for (
    const key of keys
  ) {

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
    const [
      key,
      value,
    ] of Object.entries(results)
  ) {

    const normalizedKey =
      normalizeText(key);


    if (
      normalizedKey.includes(
        targetName
      ) &&
      (
        !targetTest ||
        normalizedKey.includes(
          targetTest
        ) ||
        normalizedKey.includes(
          normalizeText(testId)
        )
      )
    ) {

      return value;

    }

  }


  return "";

}


/* =========================================================
   BUILD PARAMETERS
   ========================================================= */

function buildParametersForTest(
  test
) {

  const savedParameters =
    getParameters(test);


  if (
    savedParameters.length > 0
  ) {
    return savedParameters;
  }


  const master =
    findMasterTest(test);


  if (
    !master ||
    !Array.isArray(
      master.parameters
    )
  ) {
    return [];
  }


  return master.parameters.map(
    (parameter) => ({
      ...parameter,
    })
  );

}


/* =========================================================
   GET PATIENT
   ========================================================= */

function getPatient(report) {

  if (!report) {
    return {};
  }

  const data =
    report?.report_data || {};


  if (
    data?.patient &&
    typeof data.patient === "object"
  ) {
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
      report?.refDoctor ||
      "Self",

    sampleDate:
      report?.sample_date ||
      report?.sampleDate ||
      report?.collection_date ||
      report?.collectionDate ||
      "",

    collectionDate:
      report?.collection_date ||
      report?.collectionDate ||
      report?.sample_date ||
      report?.sampleDate ||
      "",

  };

}


/* =========================================================
   PATIENT HELPERS
   ========================================================= */

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

  if (
    patient?.age !== undefined &&
    patient?.age !== null &&
    patient?.age !== ""
  ) {
    return patient.age;
  }

  return (
    report?.age ??
    report?.patient_age ??
    "-"
  );

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


/* =========================================================
   DATE
   ========================================================= */

function formatDate(value) {

  if (!value) {
    return "-";
  }

  try {

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
        day:
          "2-digit",

        month:
          "2-digit",

        year:
          "numeric",
      }
    );

  } catch {

    return String(value);

  }

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
    formatDate(
      report?.created_at
    )
  );

}


function getReportDate(report) {

  const data =
    report?.report_data || {};

  return (
    data?.reportDate ||
    data?.report_date ||
    report?.report_date ||
    report?.reportDate ||
    report?.created_at ||
    ""
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


  if (
    !Array.isArray(savedTests) ||
    savedTests.length === 0
  ) {
    return [];
  }


  return savedTests.map(
    (
      test,
      testIndex
    ) => {

      const master =
        findMasterTest(test);


      const parameters =
        buildParametersForTest(
          test
        );


      const testName =
        test?.name ||
        test?.testName ||
        test?.short ||
        master?.name ||
        "Laboratory Investigation";


      return {

        id:
          test?.id ||
          test?.testId ||
          test?.test_id ||
          `test-${testIndex}`,

        name:
          testName,

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
                  value === null ||
                  value === undefined
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
        className={
          "infoValue " +
          (
            strong
              ? "strong "
              : ""
          ) +
          (
            status
              ? "status"
              : ""
          )
        }
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
}) {

  return (

    <section
      className="testSection"
    >

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

            <th>
              INVESTIGATION
            </th>

            <th>
              FLAG
            </th>

            <th>
              RESULT
            </th>

            <th>
              REFERENCE RANGE
            </th>

            <th>
              UNIT
            </th>

          </tr>

        </thead>


        <tbody>

          {(test.parameters || [])
            .map(
              (
                parameter,
                index
              ) => {

                const abnormal =
                  parameter.flag ===
                    "H" ||
                  parameter.flag ===
                    "L";


                const value =
                  parameter.result === "" ||
                  parameter.result === null ||
                  parameter.result === undefined
                    ? "-"
                    : parameter.result;


                return (

                  <tr
                    key={
                      `${parameter.name}-${index}`
                    }
                  >

                    <td>

                      <span className="investigationText">

                        {parameter.name}

                      </span>

                    </td>


                    <td className="flag">

                      {parameter.flag ===
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

                      )}

                    </td>


                    <td className="result">

                      <span
                        className={
                          "resultBox " +
                          (
                            abnormal
                              ? "abnormal"
                              : ""
                          )
                        }
                      >

                        {value}

                      </span>

                    </td>


                    <td className="reference">

                      {parameter.range ||
                        "-"}

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

  const router =
    useRouter();


  const [reports, setReports] =
    useState([]);


  const [loading, setLoading] =
    useState(true);


  const [selectedReport, setSelectedReport] =
    useState(null);


  const [editingReport, setEditingReport] =
    useState(null);


  const [savingEdit, setSavingEdit] =
    useState(false);


  const [message, setMessage] =
    useState("");


  const [searchText, setSearchText] =
    useState("");


  const [editForm, setEditForm] =
    useState({

      patientName:
        "",

      patientId:
        "",

      age:
        "",

      gender:
        "",

      mobile:
        "",

      doctor:
        "",

      results:
        {},

    });


  /* =======================================================
     LOAD
     ======================================================= */

  useEffect(() => {

    loadReports();

  }, []);


  /* =======================================================
     LOAD REPORTS
     ======================================================= */

  async function loadReports() {

    try {

      setLoading(true);

      setMessage("");


      const {
        data,
        error,
      } =
        await supabase
          .from("reports")
          .select("*")
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );


      if (error) {

        console.error(
          "Reports load error:",
          error
        );

        setMessage(
          "Reports load nahi ho paaye: " +
          error.message
        );

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

    } finally {

      setLoading(false);

    }

  }


  /* =======================================================
     DASHBOARD
     ======================================================= */

  function goToDashboard() {

    router.push(
      DASHBOARD_ROUTE
    );

  }


  /* =======================================================
     SEARCH
     ======================================================= */

  const filteredReports =
    useMemo(
      () => {

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

      },
      [
        reports,
        searchText,
      ]
    );


  /* =======================================================
     VIEW
     ======================================================= */

  function viewReport(report) {

    setEditingReport(
      null
    );

    setSelectedReport(
      report
    );


    setTimeout(() => {

      document
        .getElementById(
          "saved-final-report"
        )
        ?.scrollIntoView({
          behavior:
            "smooth",

          block:
            "start",
        });

    }, 100);

  }


  /* =======================================================
     CLOSE VIEW
     ======================================================= */

  function closeReport() {

    setSelectedReport(
      null
    );

  }


  /* =======================================================
     START EDIT
     ======================================================= */

  function startEditReport(
    report
  ) {

    if (!report) {
      return;
    }


    const patient =
      getPatient(
        report
      );


    const tests =
      prepareTests(
        report
      );


    const resultMap = {};


    tests.forEach(
      (
        test,
        testIndex
      ) => {

        (
          test.parameters ||
          []
        ).forEach(
          (
            parameter,
            parameterIndex
          ) => {

            const key =
              `${testIndex}-${parameterIndex}`;


            resultMap[key] =
              parameter.result ??
              "";

          }
        );

      }
    );


    setSelectedReport(
      null
    );


    setEditingReport(
      report
    );


    setEditForm({

      patientName:
        patient?.name ||
        patient?.patientName ||
        "",

      patientId:
        patient?.patientId ||
        patient?.id ||
        "",

      age:
        patient?.age ??
        "",

      gender:
        patient?.gender ||
        patient?.sex ||
        "",

      mobile:
        patient?.mobile ||
        patient?.mobileNumber ||
        patient?.phone ||
        "",

      doctor:
        patient?.doctor ||
        patient?.referredBy ||
        patient?.refDoctor ||
        "",

      results:
        resultMap,

    });


    setTimeout(() => {

      document
        .getElementById(
          "edit-report-form"
        )
        ?.scrollIntoView({
          behavior:
            "smooth",

          block:
            "start",
        });

    }, 100);

  }


  /* =======================================================
     UPDATE EDIT FIELD
     ======================================================= */

  function updateEditField(
    field,
    value
  ) {

    setEditForm(
      (previous) => ({

        ...previous,

        [field]:
          value,

      })
    );

  }


  /* =======================================================
     UPDATE RESULT
     ======================================================= */

  function updateEditResult(
    testIndex,
    parameterIndex,
    value
  ) {

    const key =
      `${testIndex}-${parameterIndex}`;


    setEditForm(
      (previous) => ({

        ...previous,

        results: {

          ...previous.results,

          [key]:
            value,

        },

      })
    );

  }


  /* =======================================================
     CANCEL EDIT
     ======================================================= */

  function cancelEdit() {

    setEditingReport(
      null
    );


    setEditForm({

      patientName:
        "",

      patientId:
        "",

      age:
        "",

      gender:
        "",

      mobile:
        "",

      doctor:
        "",

      results:
        {},

    });

  }


  /* =======================================================
     SAVE EDITED REPORT
     ======================================================= */

  async function saveEditedReport() {

    if (
      !editingReport?.id
    ) {

      alert(
        "Report ID nahi mila."
      );

      return;
    }


    try {

      setSavingEdit(
        true
      );


      const oldData =
        getReportData(
          editingReport
        );


      const oldTests =
        getReportTests(
          editingReport
        );


      if (
        !Array.isArray(
          oldTests
        ) ||
        oldTests.length === 0
      ) {

        alert(
          "Is report me test data nahi mila."
        );

        return;

      }


      /* -----------------------------------------------
         UPDATED PATIENT
         ----------------------------------------------- */

      const oldPatient =
        getPatient(
          editingReport
        );


      const updatedPatient = {

        ...oldPatient,

        name:
          editForm.patientName,

        patientName:
          editForm.patientName,

        patientId:
          editForm.patientId,

        age:
          editForm.age,

        gender:
          editForm.gender,

        mobile:
          editForm.mobile,

        doctor:
          editForm.doctor,

      };


      /* -----------------------------------------------
         UPDATED TESTS
         ----------------------------------------------- */

      const updatedTests =
        oldTests.map(
          (
            test,
            testIndex
          ) => {

            const originalParameters =
              buildParametersForTest(
                test
              );


            const updatedParameters =
              originalParameters.map(
                (
                  parameter,
                  parameterIndex
                ) => {

                  const key =
                    `${testIndex}-${parameterIndex}`;


                  const newValue =
                    editForm
                      .results[key];


                  return {

                    ...parameter,

                    result:
                      newValue ??
                      "",

                  };

                }
              );


            return {

              ...test,

              parameters:
                updatedParameters,

            };

          }
        );


      /* -----------------------------------------------
         UPDATED RESULTS OBJECT
         ----------------------------------------------- */

      const updatedResults =
        {};


      updatedTests.forEach(
        (
          test,
          testIndex
        ) => {

          (
            test.parameters ||
            []
          ).forEach(
            (
              parameter,
              parameterIndex
            ) => {

              const key =
                `${testIndex}-${parameterIndex}`;


              updatedResults[key] =
                parameter.result ??
                "";

            }
          );

        }
      );


      /* -----------------------------------------------
         UPDATED REPORT DATA
         ----------------------------------------------- */

      const updatedReportData = {

        ...oldData,

        patient:
          updatedPatient,

        tests:
          updatedTests,

        results:
          updatedResults,

        updatedAt:
          new Date().toISOString(),

      };


      /* -----------------------------------------------
         SUPABASE UPDATE
         ----------------------------------------------- */

      const {
        data,
        error,
      } =
        await supabase
          .from("reports")
          .update({

            report_data:
              updatedReportData,

          })
          .eq(
            "id",
            editingReport.id
          )
          .select()
          .single();


      if (error) {

        console.error(
          "Update report error:",
          error
        );

        alert(
          "Report update nahi hua:\n" +
          error.message
        );

        return;

      }


      /* -----------------------------------------------
         UPDATE LOCAL LIST
         ----------------------------------------------- */

      const updatedLocalReport = {

        ...(data ||
          editingReport),

        report_data:
          updatedReportData,

      };


      setReports(
        (previous) =>
          previous.map(
            (item) =>
              item.id ===
              editingReport.id
                ? updatedLocalReport
                : item
          )
      );


      setEditingReport(
        null
      );


      setEditForm({

        patientName:
          "",

        patientId:
          "",

        age:
          "",

        gender:
          "",

        mobile:
          "",

        doctor:
          "",

        results:
          {},

      });


      alert(
        "✅ Report successfully update ho gaya."
      );


    } catch (error) {

      console.error(
        "Save edit exception:",
        error
      );

      alert(
        "Report update karte waqt error aaya."
      );


    } finally {

      setSavingEdit(
        false
      );

    }

  }


  /* =======================================================
     DELETE
     ======================================================= */

  async function deleteReport(
    report
  ) {

    if (!report) {
      return;
    }


    const reportNo =
      report?.report_no ||
      report?.reportNo ||
      "this report";


    const confirmed =
      window.confirm(
        `${reportNo} delete karna hai? Ye action undo nahi hoga.`
      );


    if (!confirmed) {
      return;
    }


    try {

      const {
        error,
      } =
        await supabase
          .from("reports")
          .delete()
          .eq(
            "id",
            report.id
          );


      if (error) {

        console.error(
          "Delete error:",
          error
        );

        alert(
          "Report delete nahi hua:\n" +
          error.message
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


      if (
        editingReport?.id ===
        report.id
      ) {

        setEditingReport(
          null
        );

      }


      alert(
        "Report successfully delete ho gaya."
      );


    } catch (error) {

      console.error(
        "Delete exception:",
        error
      );

      alert(
        "Report delete karne me error aaya."
      );

    }

  }


  /* =======================================================
     PRINT
     ======================================================= */

  function printReport(
    report
  ) {

    setEditingReport(
      null
    );

    setSelectedReport(
      report
    );


    setTimeout(() => {

      window.print();

    }, 600);

  }


  function printCurrentReport() {

    if (
      !selectedReport
    ) {
      return;
    }


    window.print();

  }


  /* =======================================================
     PREVIEW TESTS
     ======================================================= */

  const previewTests =
    useMemo(
      () => {

        if (
          !selectedReport
        ) {
          return [];
        }


        return prepareTests(
          selectedReport
        );

      },
      [
        selectedReport,
      ]
    );


  const previewReportDate =
    selectedReport
      ? getReportDate(
          selectedReport
        )
      : "";


  /* =======================================================
     EDIT TESTS
     ======================================================= */

  const editTests =
    useMemo(
      () => {

        if (
          !editingReport
        ) {
          return [];
        }


        return prepareTests(
          editingReport
        );

      },
      [
        editingReport,
      ]
    );


  /* =======================================================
     UI
     ======================================================= */

  return (
    <>

      {/* =================================================
          SAVED REPORTS SCREEN
          ================================================= */}

      <div
        className="savedReportsScreen"
      >

        {/* HEADER */}

        <div
          className="savedReportsHeader"
        >

          <div
            className="savedTitleArea"
          >

            <button
              className="dashboardBackButton"
              onClick={
                goToDashboard
              }
            >
              🔙 Dashboard
            </button>


            <div>

              <h1>
                Saved Reports
              </h1>

              <p>
                {LAB.name}
              </p>

            </div>

          </div>


          <div
            className="savedHeaderControls"
          >

            <input
              className="reportSearch"
              placeholder="Search patient / report no."
              value={
                searchText
              }
              onChange={
                (event) =>
                  setSearchText(
                    event.target.value
                  )
              }
            />


            <button
              className="refreshButton"
              onClick={
                loadReports
              }
              disabled={
                loading
              }
            >
              ↻ Refresh
            </button>

          </div>

        </div>


        {/* MESSAGE */}

        {message && (

          <div
            className="reportMessage"
          >
            {message}
          </div>

        )}


        {/* REPORT TABLE */}

        <div
          className="reportsCard"
        >

          {loading ? (

            <div
              className="loadingBox"
            >

              <div
                className="loadingLogo"
              >
                N+
              </div>

              <strong>
                Saved reports loading...
              </strong>

            </div>

          ) : filteredReports.length === 0 ? (

            <div
              className="emptyBox"
            >

              <div>
                📄
              </div>

              <h2>
                No Saved Reports
              </h2>

              <p>
                Final report save hone ke baad
                yahan दिखाई देगा.
              </p>

            </div>

          ) : (

            <div
              className="reportsTableWrapper"
            >

              <table
                className="reportsTable"
              >

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
                              {getPatientName(
                                report
                              )}
                            </strong>

                            <small
                              className="patientIdSmall"
                            >
                              ID:{" "}
                              {getPatientId(
                                report
                              )}
                            </small>

                          </td>


                          <td>

                            {tests
                              .map(
                                (
                                  test
                                ) =>
                                  test?.short ||
                                  test?.name ||
                                  test?.testName
                              )
                              .filter(
                                Boolean
                              )
                              .join(
                                ", "
                              ) ||
                              "-"}

                          </td>


                          <td>

                            <span
                              className="resultCount"
                            >
                              {parameterCount}
                            </span>

                          </td>


                          <td>

                            <span
                              className="pendingStatus"
                            >
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

                            <div
                              className="actionButtons"
                            >

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
                                className="editButton"
                                onClick={() =>
                                  startEditReport(
                                    report
                                  )
                                }
                              >
                                ✏️ Edit
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


      {/* =================================================
          EDIT REPORT
          ================================================= */}

      {editingReport && (

        <div
          id="edit-report-form"
          className="editReportWrapper"
        >

          <div
            className="editReportCard"
          >

            {/* EDIT HEADER */}

            <div
              className="editHeader"
            >

              <div>

                <h2>
                  ✏️ Edit Laboratory Report
                </h2>

                <p>

                  Report No:{" "}

                  <strong>
                    {editingReport.report_no ||
                      editingReport.reportNo ||
                      "-"}
                  </strong>

                </p>

              </div>


              <button
                className="editBackButton"
                onClick={
                  cancelEdit
                }
              >
                🔙 Back to Reports
              </button>

            </div>


            {/* PATIENT */}

            <div
              className="editSectionTitle"
            >
              Patient Information
            </div>


            <div
              className="editPatientGrid"
            >

              <div
                className="editField"
              >

                <label>
                  Patient Name
                </label>

                <input
                  value={
                    editForm.patientName
                  }
                  onChange={
                    (event) =>
                      updateEditField(
                        "patientName",
                        event.target.value
                      )
                  }
                />

              </div>


              <div
                className="editField"
              >

                <label>
                  Patient ID
                </label>

                <input
                  value={
                    editForm.patientId
                  }
                  onChange={
                    (event) =>
                      updateEditField(
                        "patientId",
                        event.target.value
                      )
                  }
                />

              </div>


              <div
                className="editField"
              >

                <label>
                  Age
                </label>

                <input
                  value={
                    editForm.age
                  }
                  onChange={
                    (event) =>
                      updateEditField(
                        "age",
                        event.target.value
                      )
                  }
                />

              </div>


              <div
                className="editField"
              >

                <label>
                  Gender
                </label>

                <select
                  value={
                    editForm.gender
                  }
                  onChange={
                    (event) =>
                      updateEditField(
                        "gender",
                        event.target.value
                      )
                  }
                >

                  <option value="">
                    Select
                  </option>

                  <option value="Male">
                    Male
                  </option>

                  <option value="Female">
                    Female
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>


              <div
                className="editField"
              >

                <label>
                  Mobile
                </label>

                <input
                  value={
                    editForm.mobile
                  }
                  onChange={
                    (event) =>
                      updateEditField(
                        "mobile",
                        event.target.value
                      )
                  }
                />

              </div>


              <div
                className="editField"
              >

                <label>
                  Referred By
                </label>

                <input
                  value={
                    editForm.doctor
                  }
                  onChange={
                    (event) =>
                      updateEditField(
                        "doctor",
                        event.target.value
                      )
                  }
                />

              </div>

            </div>


            {/* TEST RESULTS */}

            <div
              className="editSectionTitle"
            >
              Test Results
            </div>


            {editTests.length === 0 ? (

              <div
                className="editNoTests"
              >
                Is report me editable test data nahi mila.
              </div>

            ) : (

              editTests.map(
                (
                  test,
                  testIndex
                ) => (

                  <div
                    className="editTestCard"
                    key={
                      test.id ||
                      testIndex
                    }
                  >

                    <div
                      className="editTestTitle"
                    >

                      <span>

                        {String(
                          test.category ||
                          "PATHOLOGY"
                        ).toUpperCase()}

                      </span>

                      <strong>
                        {test.name}
                      </strong>

                    </div>


                    <div
                      className="editResultsTable"
                    >

                      <div
                        className="editResultsHeader"
                      >

                        <span>
                          Investigation
                        </span>

                        <span>
                          Result
                        </span>

                        <span>
                          Unit
                        </span>

                        <span>
                          Reference
                        </span>

                      </div>


                      {(test.parameters || [])
                        .map(
                          (
                            parameter,
                            parameterIndex
                          ) => {

                            const key =
                              `${testIndex}-${parameterIndex}`;


                            return (

                              <div
                                className="editResultRow"
                                key={
                                  `${parameter.name}-${parameterIndex}`
                                }
                              >

                                <span
                                  className="editParameterName"
                                >
                                  {parameter.name}
                                </span>


                                <input
                                  className="editResultInput"
                                  value={
                                    editForm.results[
                                      key
                                    ] ?? ""
                                  }
                                  onChange={
                                    (event) =>
                                      updateEditResult(
                                        testIndex,
                                        parameterIndex,
                                        event.target.value
                                      )
                                  }
                                />


                                <span>
                                  {parameter.unit ||
                                    "-"}
                                </span>


                                <span>
                                  {parameter.range ||
                                    "-"}
                                </span>

                              </div>

                            );

                          }
                        )}

                    </div>

                  </div>

                )
              )

            )}


            {/* EDIT ACTIONS */}

            <div
              className="editActions"
            >

              <button
                className="cancelEditButton"
                onClick={
                  cancelEdit
                }
                disabled={
                  savingEdit
                }
              >
                ✕ Cancel
              </button>


              <button
                className="saveEditButton"
                onClick={
                  saveEditedReport
                }
                disabled={
                  savingEdit
                }
              >

                {savingEdit
                  ? "Saving..."
                  : "💾 Save Changes"}

              </button>

            </div>

          </div>

        </div>

      )}


      {/* =================================================
          VIEW FINAL REPORT
          ================================================= */}

      {selectedReport && (

        <div
          id="saved-final-report"
          className="savedFinalPreviewWrapper"
        >

          {/* PREVIEW TOOLBAR */}

          <div
            className="previewToolbar"
          >

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


            <div
              className="previewToolbarActions"
            >

              <button
                className="previewEdit"
                onClick={() =>
                  startEditReport(
                    selectedReport
                  )
                }
              >
                ✏️ Edit
              </button>


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


          {/* A4 */}

          <div
            className="finalPreview"
          >

            <div
              className="a4Page"
            >

              {/* HEADER */}

              <header
                className="labHeader"
              >

                <div
                  className="brand"
                >

                  <div
                    className="mainLogo"
                  >

                    <span>
                      N
                    </span>

                    <div
                      className="logoRay r1"
                    />

                    <div
                      className="logoRay r2"
                    />

                    <div
                      className="logoRay r3"
                    />

                    <div
                      className="logoRay r4"
                    />

                  </div>


                  <div
                    className="brandText"
                  >

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


                <div
                  className="headerRight"
                >

                  <div
                    className="reportLabel"
                  >
                    LABORATORY REPORT
                  </div>


                  <div>
                    ☎ {LAB.phone}
                  </div>


                  <div>
                    📍 {LAB.address}
                  </div>


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
                        previewReportDate
                      )}
                    </b>
                  </div>

                </div>

              </header>


              <div
                className="accentBar"
              >

                <span />

                <b />

                <i />

              </div>


              {/* PATIENT */}

              <section
                className="patientCard"
              >

                <div
                  className="sectionBar"
                >

                  <span
                    className="circleP"
                  >
                    P
                  </span>

                  PATIENT INFORMATION

                </div>


                <div
                  className="patientGrid"
                >

                  <Info
                    label="Patient Name"
                    value={
                      getPatientName(
                        selectedReport
                      )
                    }
                    strong
                  />


                  <Info
                    label="Patient ID"
                    value={
                      getPatientId(
                        selectedReport
                      )
                    }
                  />


                  <Info
                    label="Age / Sex"
                    value={
                      `${getPatientAge(
                        selectedReport
                      )} / ${getPatientGenderValue(
                        selectedReport
                      )}`
                    }
                  />


                  <Info
                    label="Mobile"
                    value={
                      getPatientMobile(
                        selectedReport
                      )
                    }
                  />


                  <Info
                    label="Referred By"
                    value={
                      getDoctor(
                        selectedReport
                      )
                    }
                  />


                  <Info
                    label="Collection Date"
                    value={
                      getCollectionDate(
                        selectedReport
                      )
                    }
                  />


                  <Info
                    label="Report Date"
                    value={
                      formatDate(
                        previewReportDate
                      )
                    }
                  />


                  <Info
                    label="Report Status"
                    value="FINAL"
                    status
                  />

                </div>

              </section>


              {/* TESTS */}

              <main
                className="tests"
              >

                {previewTests.length === 0 ? (

                  <div
                    className="noTest"
                  >

                    <strong>
                      No laboratory investigation available.
                    </strong>

                    <small>
                      Saved report me test data nahi mila.
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
                        test={
                          test
                        }
                      />

                    )
                  )

                )}

              </main>


              {/* SIGNATURES */}

              <section
                className="signatures"
              >

                <div
                  className="signature"
                >

                  <div
                    className="signatureBlank"
                  />

                  <strong>
                    Lab Technician
                  </strong>

                  <small>
                    {LAB.name}
                  </small>

                </div>


                <div
                  className="signature"
                >

                  <div
                    className="signatureBlank"
                  />

                  <strong>
                    Authorized Signatory
                  </strong>

                  <small>
                    Signature &amp; Seal
                  </small>

                </div>

              </section>


              {/* NOTE */}

              <div
                className="note"
              >

                <b>
                  Note:
                </b>{" "}

                Reference ranges may vary according
                to laboratory methodology, age and
                clinical condition. Results should
                be interpreted by a qualified
                healthcare professional.

              </div>


              {/* FOOTER */}

              <footer
                className="footer"
              >

                <strong>
                  {LAB.name}
                </strong>

                <span>
                  {LAB.slogan}
                </span>

                <small>
                  ☎ {LAB.phone}
                  &nbsp; | &nbsp;
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


      {/* =================================================
          CSS
          ================================================= */}

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
        input,
        select {
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }


        /* =================================================
           SAVED REPORTS
        ================================================= */

        .savedReportsScreen {
          min-height: 100vh;

          padding: 22px;

          background: #eef3f7;
        }


        .savedReportsHeader {
          max-width: 1400px;

          margin:
            0 auto 16px;

          display: flex;

          align-items: center;

          justify-content:
            space-between;

          gap: 15px;
        }


        .savedTitleArea {
          display: flex;

          align-items: center;

          gap: 12px;
        }


        .savedReportsHeader h1 {
          margin: 0;

          font-size: 28px;

          font-weight: 900;
        }


        .savedReportsHeader p {
          margin:
            4px 0 0;

          font-size: 11px;

          color: #667085;

          font-weight: 700;

          letter-spacing: .5px;
        }


        /* =================================================
           DASHBOARD BUTTON
        ================================================= */

        .dashboardBackButton {
          height: 38px;

          padding:
            0 12px;

          border:
            1px solid #cbd8df;

          border-radius: 7px;

          background: #ffffff;

          color: #344054;

          font-size: 11px;

          font-weight: 900;

          cursor: pointer;

          white-space: nowrap;

          transition:
            .2s ease;
        }


        .dashboardBackButton:hover {
          background: #087f72;

          color: #ffffff;

          border-color:
            #087f72;
        }


        /* =================================================
           HEADER CONTROLS
        ================================================= */

        .savedHeaderControls {
          display: flex;

          gap: 8px;

          align-items: center;
        }


        .reportSearch {
          width: 230px;

          height: 38px;

          padding:
            0 12px;

          border:
            1px solid #d8e0e7;

          border-radius: 7px;

          background: #ffffff;

          outline: none;

          font-size: 12px;
        }


        .reportSearch:focus {
          border-color:
            #087f72;
        }


        .refreshButton {
          height: 38px;

          padding:
            0 14px;

          border:
            1px solid #d8e0e7;

          border-radius: 7px;

          background: #ffffff;

          font-size: 12px;

          font-weight: 800;

          cursor: pointer;
        }


        .refreshButton:disabled {
          opacity: .6;

          cursor:
            not-allowed;
        }


        .reportMessage {
          max-width: 1400px;

          margin:
            0 auto 15px;

          padding: 12px;

          border:
            1px solid #ffd591;

          background:
            #fff7e6;

          color:
            #8a5700;

          border-radius: 7px;

          font-size: 12px;
        }


        /* =================================================
           REPORT CARD
        ================================================= */

        .reportsCard {
          max-width: 1400px;

          margin: 0 auto;

          background:
            #ffffff;

          border:
            1px solid #dce4eb;

          border-radius: 10px;

          overflow: hidden;

          box-shadow:
            0 4px 18px
            rgba(
              16,
              24,
              40,
              .07
            );
        }


        .reportsTableWrapper {
          width: 100%;

          overflow-x:
            auto;

          -webkit-overflow-scrolling:
            touch;
        }


        .reportsTable {
          width: 100%;

          min-width:
            1050px;

          border-collapse:
            collapse;
        }


        .reportsTable th {
          padding:
            13px 12px;

          text-align:
            left;

          background:
            #f7f9fb;

          color:
            #667085;

          border-bottom:
            1px solid #e4e9ee;

          font-size:
            10px;

          font-weight:
            900;
        }


        .reportsTable td {
          padding:
            14px 12px;

          border-bottom:
            1px solid #edf0f3;

          font-size:
            11px;

          color:
            #344054;

          vertical-align:
            middle;
        }


        .reportsTable tbody tr:hover {
          background:
            #fbfdfe;
        }


        .patientIdSmall {
          display:
            block;

          margin-top:
            3px;

          font-size:
            8px;

          color:
            #98a2b3;
        }


        .resultCount {
          display:
            inline-flex;

          width:
            25px;

          height:
            25px;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            50%;

          background:
            #eff6fb;

          border:
            1px solid #dbe8f0;

          color:
            #34536b;

          font-size:
            9px;

          font-weight:
            900;
        }


        .pendingStatus {
          display:
            inline-block;

          padding:
            5px 9px;

          border-radius:
            20px;

          background:
            #e9f9ef;

          color:
            #14783b;

          font-size:
            9px;

          font-weight:
            900;

          text-transform:
            uppercase;
        }


        /* =================================================
           ACTION BUTTONS
        ================================================= */

        .actionButtons {
          display:
            flex;

          gap:
            5px;

          flex-wrap:
            wrap;
        }


        .actionButtons button {
          padding:
            6px 8px;

          border-radius:
            5px;

          background:
            #ffffff;

          font-size:
            9px;

          font-weight:
            800;

          cursor:
            pointer;

          white-space:
            nowrap;
        }


        .viewButton {
          border:
            1px solid #b9c8e7;

          color:
            #244c96;
        }


        .viewButton:hover {
          background:
            #f2f6ff;
        }


        .editButton {
          border:
            1px solid #e4c96d;

          color:
            #8a6700;

          background:
            #fffdf3 !important;
        }


        .editButton:hover {
          background:
            #fff7d6 !important;
        }


        .printButton {
          border:
            1px solid #a8d7bd;

          color:
            #137340;
        }


        .printButton:hover {
          background:
            #f0fff5;
        }


        .deleteButton {
          border:
            1px solid #efb6b6;

          color:
            #c33131;
        }


        .deleteButton:hover {
          background:
            #fff5f5;
        }


        /* =================================================
           LOADING / EMPTY
        ================================================= */

        .loadingBox,
        .emptyBox {
          min-height:
            280px;

          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            center;

          text-align:
            center;

          color:
            #667085;
        }


        .loadingLogo {
          width:
            55px;

          height:
            55px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          margin-bottom:
            12px;

          border-radius:
            50%;

          color:
            #ffffff;

          background:
            linear-gradient(
              135deg,
              #087f72,
              #0b6676
            );

          font-weight:
            900;
        }


        .emptyBox > div {
          font-size:
            40px;
        }


        .emptyBox h2 {
          margin:
            8px 0 3px;

          color:
            #344054;
        }


        .emptyBox p {
          margin: 0;

          font-size:
            12px;
        }


        /* =================================================
           EDIT REPORT
        ================================================= */

        .editReportWrapper {
          max-width:
            1400px;

          margin:
            18px auto;

          padding: 0;
        }


        .editReportCard {
          background:
            #ffffff;

          border:
            1px solid #dce4eb;

          border-radius:
            10px;

          overflow:
            hidden;

          box-shadow:
            0 4px 18px
            rgba(
              16,
              24,
              40,
              .08
            );
        }


        .editHeader {
          padding:
            16px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            12px;

          background:
            linear-gradient(
              135deg,
              #087f72,
              #0b6676
            );

          color:
            #ffffff;
        }


        .editHeader h2 {
          margin: 0;

          font-size:
            18px;

          font-weight:
            950;
        }


        .editHeader p {
          margin:
            4px 0 0;

          font-size:
            10px;

          opacity:
            .9;
        }


        .editBackButton {
          height:
            35px;

          padding:
            0 12px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .5
            );

          border-radius:
            6px;

          background:
            rgba(
              255,
              255,
              255,
              .12
            );

          color:
            #ffffff;

          font-size:
            10px;

          font-weight:
            900;

          cursor:
            pointer;
        }


        .editSectionTitle {
          margin:
            16px 16px 10px;

          padding-bottom:
            7px;

          border-bottom:
            2px solid #e6ecef;

          color:
            #087f72;

          font-size:
            12px;

          font-weight:
            950;

          text-transform:
            uppercase;
        }


        .editPatientGrid {
          padding:
            0 16px;

          display:
            grid;

          grid-template-columns:
            repeat(
              3,
              1fr
            );

          gap:
            12px;
        }


        .editField {
          display:
            flex;

          flex-direction:
            column;

          gap:
            5px;
        }


        .editField label {
          color:
            #667085;

          font-size:
            9px;

          font-weight:
            900;

          text-transform:
            uppercase;
        }


        .editField input,
        .editField select {
          width:
            100%;

          height:
            38px;

          padding:
            0 10px;

          border:
            1px solid #d0d9df;

          border-radius:
            6px;

          background:
            #ffffff;

          color:
            #172033;

          font-size:
            11px;

          outline:
            none;
        }


        .editField input:focus,
        .editField select:focus {
          border-color:
            #087f72;

          box-shadow:
            0 0 0 2px
            rgba(
              8,
              127,
              114,
              .08
            );
        }


        /* =================================================
           EDIT TEST
        ================================================= */

        .editTestCard {
          margin:
            0 16px 14px;

          border:
            1px solid #dce4e8;

          border-radius:
            7px;

          overflow:
            hidden;
        }


        .editTestTitle {
          padding:
            10px;

          display:
            flex;

          align-items:
            center;

          gap:
            8px;

          background:
            #f5faf9;

          border-bottom:
            1px solid #dce8e5;
        }


        .editTestTitle span {
          padding:
            4px 7px;

          border-radius:
            3px;

          background:
            #e3f5f1;

          color:
            #087f72;

          font-size:
            7px;

          font-weight:
            950;
        }


        .editTestTitle strong {
          color:
            #172033;

          font-size:
            11px;

          font-weight:
            950;
        }


        .editResultsTable {
          width:
            100%;
        }


        .editResultsHeader,
        .editResultRow {
          display:
            grid;

          grid-template-columns:
            2fr 1fr .8fr 1.3fr;

          align-items:
            center;
        }


        .editResultsHeader {
          min-height:
            34px;

          padding:
            0 10px;

          background:
            #f7f9fb;

          color:
            #667085;

          font-size:
            8px;

          font-weight:
            950;

          text-transform:
            uppercase;
        }


        .editResultRow {
          min-height:
            45px;

          padding:
            6px 10px;

          border-top:
            1px solid #edf1f3;

          color:
            #344054;

          font-size:
            9px;
        }


        .editParameterName {
          font-weight:
            800;
        }


        .editResultInput {
          width:
            100%;

          height:
            31px;

          padding:
            0 8px;

          border:
            1px solid #cfd9df;

          border-radius:
            5px;

          background:
            #ffffff;

          font-size:
            10px;

          font-weight:
            800;

          outline:
            none;
        }


        .editResultInput:focus {
          border-color:
            #087f72;
        }


        .editNoTests {
          margin:
            0 16px 16px;

          padding:
            20px;

          text-align:
            center;

          border:
            1px dashed #cbd5dc;

          border-radius:
            7px;

          color:
            #667085;

          font-size:
            11px;
        }


        /* =================================================
           EDIT ACTIONS
        ================================================= */

        .editActions {
          padding:
            16px;

          display:
            flex;

          justify-content:
            flex-end;

          gap:
            8px;

          border-top:
            1px solid #e5eaee;

          background:
            #fafcfd;
        }


        .cancelEditButton,
        .saveEditButton {
          height:
            38px;

          padding:
            0 16px;

          border-radius:
            6px;

          font-size:
            10px;

          font-weight:
            950;

          cursor:
            pointer;
        }


        .cancelEditButton {
          border:
            1px solid #d0d5dd;

          background:
            #ffffff;

          color:
            #344054;
        }


        .saveEditButton {
          border:
            1px solid #087f72;

          background:
            linear-gradient(
              135deg,
              #087f72,
              #0b6676
            );

          color:
            #ffffff;
        }


        .saveEditButton:disabled,
        .cancelEditButton:disabled {
          opacity:
            .6;

          cursor:
            not-allowed;
        }


        /* =================================================
           PREVIEW
        ================================================= */

        .savedFinalPreviewWrapper {
          padding:
            15px 10px 40px;

          background:
            linear-gradient(
              180deg,
              #eef3f7,
              #e7edf3
            );
        }


        .previewToolbar {
          width:
            calc(
              100% - 10px
            );

          max-width:
            1200px;

          margin:
            0 auto 10px;

          padding:
            9px 12px;

          border:
            1px solid #dce4eb;

          border-radius:
            8px;

          background:
            #ffffff;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            10px;

          box-shadow:
            0 2px 12px
            rgba(
              16,
              24,
              40,
              .06
            );
        }


        .previewToolbar strong {
          display:
            block;

          font-size:
            12px;
        }


        .previewToolbar small {
          display:
            block;

          margin-top:
            2px;

          font-size:
            7px;

          color:
            #667085;
        }


        .previewToolbarActions {
          display:
            flex;

          gap:
            6px;
        }


        .previewToolbarActions button {
          padding:
            7px 11px;

          border-radius:
            6px;

          font-size:
            8px;

          font-weight:
            900;

          cursor:
            pointer;
        }


        .previewEdit {
          border:
            1px solid #e4c96d;

          background:
            #fffdf3;

          color:
            #8a6700;
        }


        .previewPrint {
          border:
            1px solid #087f72;

          background:
            linear-gradient(
              135deg,
              #087f72,
              #0b6676
            );

          color:
            #ffffff;
        }


        .previewClose {
          border:
            1px solid #d0d5dd;

          background:
            #ffffff;

          color:
            #344054;
        }


        .finalPreview {
          min-height:
            100vh;

          padding:
            10px;

          display:
            flex;

          justify-content:
            center;
        }


        /* =================================================
           A4
        ================================================= */

        .a4Page {
          position:
            relative;

          width:
            210mm;

          height:
            297mm;

          min-height:
            297mm;

          max-height:
            297mm;

          padding:
            0 11mm 18mm;

          background:
            #ffffff;

          overflow:
            hidden;

          box-shadow:
            0 14px 40px
            rgba(
              16,
              24,
              40,
              .15
            );
        }


        /* =================================================
           HEADER
        ================================================= */

        .labHeader {
          height:
            35mm;

          padding-top:
            6mm;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            7mm;
        }


        .brand {
          display:
            flex;

          align-items:
            center;

          gap:
            4mm;
        }


        .mainLogo {
          position:
            relative;

          width:
            22mm;

          height:
            22mm;

          flex-shrink:
            0;

          border:
            1.5px solid #087f72;

          border-radius:
            50%;

          background:
            radial-gradient(
              circle,
              #ffffff 45%,
              #eefbf8 100%
            );

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          box-shadow:
            inset
            0 0 0 2px
            #d7f2ed;
        }


        .mainLogo span {
          position:
            relative;

          z-index:
            2;

          color:
            #087f72;

          font-size:
            20px;

          font-weight:
            950;
        }


        .logoRay {
          position:
            absolute;

          width:
            14mm;

          height:
            .5px;

          background:
            #eabf43;
        }


        .r1 {
          transform:
            rotate(0deg);
        }


        .r2 {
          transform:
            rotate(45deg);
        }


        .r3 {
          transform:
            rotate(90deg);
        }


        .r4 {
          transform:
            rotate(135deg);
        }


        .brandText h1 {
          margin:
            0;

          font-size:
            21px;

          line-height:
            1;

          font-weight:
            950;

          letter-spacing:
            .2px;

          color:
            #101828;
        }


        .brandText h2 {
          margin:
            2px 0 0;

          font-size:
            7px;

          letter-spacing:
            .8px;

          color:
            #087f72;

          font-weight:
            900;
        }


        .brandText p {
          margin:
            4px 0 0;

          font-size:
            6px;

          color:
            #667085;

          font-weight:
            700;
        }


        .headerRight {
          width:
            67mm;

          text-align:
            right;

          color:
            #667085;

          font-size:
            5.7px;

          line-height:
            1.55;
        }


        .reportLabel {
          display:
            inline-block;

          margin-bottom:
            2px;

          padding:
            2px 5px;

          border-radius:
            3px;

          background:
            #e9f8f5;

          color:
            #087f72;

          font-size:
            6px;

          font-weight:
            950;

          letter-spacing:
            .5px;
        }


        .accentBar {
          height:
            1.5px;

          display:
            flex;

          gap:
            2px;

          margin-bottom:
            4mm;
        }


        .accentBar span {
          flex:
            4;

          background:
            #087f72;
        }


        .accentBar b {
          flex:
            1;

          background:
            #eabf43;
        }


        .accentBar i {
          flex:
            6;

          background:
            #dce5ea;
        }


        /* =================================================
           PATIENT
        ================================================= */

        .patientCard {
          border:
            1px solid #d7e0e6;

          border-radius:
            4px;

          overflow:
            hidden;

          margin-bottom:
            4mm;
        }


        .sectionBar {
          height:
            6.5mm;

          padding:
            0 3mm;

          display:
            flex;

          align-items:
            center;

          gap:
            5px;

          background:
            linear-gradient(
              90deg,
              #087f72,
              #0c7180
            );

          color:
            #ffffff;

          font-size:
            6.5px;

          font-weight:
            950;

          letter-spacing:
            .6px;
        }


        .circleP {
          width:
            15px;

          height:
            15px;

          border-radius:
            50%;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          background:
            rgba(
              255,
              255,
              255,
              .18
            );

          font-size:
            6px;
        }


        .patientGrid {
          display:
            grid;

          grid-template-columns:
            repeat(
              4,
              1fr
            );
        }


        .infoCell {
          min-height:
            9mm;

          padding:
            2mm 3mm;

          border-right:
            1px solid #e3e8ed;

          border-bottom:
            1px solid #e3e8ed;
        }


        .infoCell:nth-child(4n) {
          border-right:
            0;
        }


        .infoCell:nth-last-child(-n + 4) {
          border-bottom:
            0;
        }


        .infoLabel {
          display:
            block;

          margin-bottom:
            1px;

          font-size:
            4.7px;

          color:
            #7a8796;

          font-weight:
            800;

          text-transform:
            uppercase;
        }


        .infoValue {
          display:
            block;

          font-size:
            6.4px;

          color:
            #172033;

          font-weight:
            700;

          overflow-wrap:
            anywhere;
        }


        .infoValue.strong {
          font-size:
            7px;

          font-weight:
            950;
        }


        .infoValue.status {
          color:
            #15803d;

          font-weight:
            950;
        }


        /* =================================================
           TESTS
        ================================================= */

        .tests {
          display:
            flex;

          flex-direction:
            column;

          gap:
            3.5mm;
        }


        .testSection {
          break-inside:
            avoid;

          page-break-inside:
            avoid;
        }


        .testHeader {
          display:
            flex;

          align-items:
            center;

          gap:
            2.5mm;

          margin-bottom:
            1.8mm;

          min-height:
            7mm;
        }


        .departmentTag {
          flex-shrink:
            0;

          padding:
            2.5px 6px;

          border-radius:
            3px;

          background:
            #e8f7f4;

          color:
            #087f72;

          font-size:
            5px;

          font-weight:
            950;

          letter-spacing:
            .6px;
        }


        .testTitleBox {
          flex:
            1;

          padding:
            2.2mm 3.5mm;

          border-left:
            3px solid #087f72;

          border-radius:
            3px;

          background:
            linear-gradient(
              90deg,
              #f0faf8,
              #ffffff
            );

          color:
            #101828;

          font-size:
            9.5px;

          font-weight:
            950;

          letter-spacing:
            .15px;
        }


        .testLine {
          width:
            18mm;

          height:
            1px;

          background:
            linear-gradient(
              90deg,
              #087f72,
              transparent
            );
        }


        /* =================================================
           TABLE
        ================================================= */

        .labTable {
          width:
            100%;

          table-layout:
            fixed;

          border-collapse:
            separate;

          border-spacing:
            0;

          border:
            1px solid #cfd9e0;

          border-radius:
            4px;

          overflow:
            hidden;
        }


        .labTable th {
          height:
            6.5mm;

          padding:
            1.3mm;

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

          color:
            #344054;

          font-size:
            5.1px;

          font-weight:
            950;

          text-transform:
            uppercase;

          text-align:
            center;

          letter-spacing:
            .2px;
        }


        .labTable th:last-child {
          border-right:
            0;
        }


        .labTable td {
          height:
            6.8mm;

          padding:
            1mm 1.8mm;

          border-right:
            1px solid #e1e7eb;

          border-bottom:
            1px solid #e5eaee;

          color:
            #273443;

          font-size:
            5.8px;

          vertical-align:
            middle;

          background:
            #ffffff;
        }


        .labTable tr:last-child td {
          border-bottom:
            0;
        }


        .labTable td:last-child {
          border-right:
            0;
        }


        .labTable tbody tr:nth-child(even) td {
          background:
            #fbfcfd;
        }


        .investigation {
          width:
            30%;
        }


        .flag {
          width:
            8%;

          text-align:
            center;
        }


        .result {
          width:
            19%;

          text-align:
            center;
        }


        .reference {
          width:
            28%;

          text-align:
            center;
        }


        .unit {
          width:
            15%;

          text-align:
            center;
        }


        .investigationText {
          font-size:
            6px;

          font-weight:
            800;

          color:
            #263445;
        }


        /* =================================================
           RESULT
        ================================================= */

        .resultBox {
          display:
            inline-flex;

          min-width:
            24mm;

          height:
            6mm;

          align-items:
            center;

          justify-content:
            center;

          padding:
            1mm 2.5mm;

          border-radius:
            3px;

          background:
            #f2f6f9;

          color:
            #101828;

          font-size:
            7.5px;

          font-weight:
            950;

          letter-spacing:
            .2px;
        }


        .resultBox.abnormal {
          background:
            #fff1f0;

          border:
            1px solid #f5c8c5;

          color:
            #b42318;
        }


        .flagBadge {
          display:
            inline-flex;

          width:
            14px;

          height:
            14px;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            3px;

          font-size:
            5.5px;

          font-weight:
            950;
        }


        .flagHigh {
          color:
            #b42318;

          background:
            #fee4e2;

          border:
            1px solid #fecdca;
        }


        .flagLow {
          color:
            #175cd3;

          background:
            #eff8ff;

          border:
            1px solid #b2ddff;
        }


        .normalMark {
          color:
            #159957;

          font-size:
            10px;

          font-weight:
            900;
        }


        /* =================================================
           SIGNATURE
        ================================================= */

        .signatures {
          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            30mm;

          margin-top:
            4.5mm;

          break-inside:
            avoid;

          page-break-inside:
            avoid;
        }


        .signature {
          text-align:
            center;

          min-height:
            10mm;

          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            flex-end;
        }


        .signatureBlank {
          height:
            5mm;

          width:
            100%;
        }


        .signature strong {
          display:
            block;

          font-size:
            6px;

          color:
            #172033;

          font-weight:
            800;
        }


        .signature small {
          display:
            block;

          margin-top:
            1px;

          font-size:
            4.5px;

          color:
            #667085;
        }


        /* =================================================
           NOTE
        ================================================= */

        .note {
          margin-top:
            2.5mm;

          padding:
            1.8mm 2.5mm;

          border:
            1px solid #dbe3e8;

          border-radius:
            3px;

          background:
            #f8fafb;

          color:
            #667085;

          font-size:
            4.5px;

          line-height:
            1.35;

          break-inside:
            avoid;

          page-break-inside:
            avoid;
        }


        /* =================================================
           FOOTER
        ================================================= */

        .footer {
          position:
            absolute;

          left:
            0;

          right:
            0;

          bottom:
            0;

          height:
            12mm;

          padding:
            2.2mm 11mm;

          text-align:
            center;

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
          display:
            block;

          color:
            #087f72;

          font-size:
            5.8px;

          font-weight:
            950;

          letter-spacing:
            .6px;
        }


        .footer span {
          display:
            block;

          margin-top:
            1px;

          color:
            #667085;

          font-size:
            3.8px;

          font-weight:
            700;
        }


        .footer small {
          display:
            block;

          margin-top:
            1px;

          color:
            #98a2b3;

          font-size:
            3.4px;
        }


        .footer em {
          position:
            absolute;

          right:
            7mm;

          bottom:
            3mm;

          font-style:
            normal;

          color:
            #98a2b3;

          font-size:
            3.4px;
        }


        .noTest {
          padding:
            20mm;

          text-align:
            center;

          color:
            #667085;

          font-size:
            9px;
        }


        .noTest small {
          display:
            block;

          margin-top:
            5px;

          color:
            #98a2b3;

          font-size:
            6px;
        }


        /* =================================================
           MOBILE
        ================================================= */

        @media (max-width: 700px) {

          .savedReportsScreen {
            padding:
              12px 5px;
          }


          .savedReportsHeader {
            align-items:
              flex-start;

            flex-direction:
              column;
          }


          .savedTitleArea {
            width:
              100%;

            align-items:
              flex-start;
          }


          .dashboardBackButton {
            height:
              32px;

            padding:
              0 8px;

            font-size:
              9px;
          }


          .savedReportsHeader h1 {
            font-size:
              23px;
          }


          .savedHeaderControls {
            width:
              100%;

            flex-direction:
              row;

            align-items:
              center;
          }


          .reportSearch {
            flex:
              1;

            width:
              auto;

            height:
              34px;

            font-size:
              10px;
          }


          .refreshButton {
            height:
              34px;

            font-size:
              10px;

            padding:
              0 10px;
          }


          .reportsTable {
            min-width:
              1050px;
          }


          .reportsTable th,
          .reportsTable td {
            font-size:
              8px;

            padding:
              9px 7px;
          }


          .actionButtons {
            flex-wrap:
              nowrap;
          }


          .actionButtons button {
            font-size:
              8px;

            padding:
              5px 7px;
          }


          /* EDIT */

          .editReportWrapper {
            margin:
              10px 5px;
          }


          .editHeader {
            padding:
              12px;

            align-items:
              flex-start;

            flex-direction:
              column;
          }


          .editHeader h2 {
            font-size:
              15px;
          }


          .editBackButton {
            width:
              100%;
          }


          .editPatientGrid {
            grid-template-columns:
              1fr;

            padding:
              0 10px;
          }


          .editSectionTitle {
            margin:
              14px 10px 9px;
          }


          .editTestCard {
            margin:
              0 10px 12px;
          }


          .editTestTitle {
            align-items:
              flex-start;

            flex-direction:
              column;
          }


          .editResultsTable {
            overflow-x:
              auto;

            -webkit-overflow-scrolling:
              touch;
          }


          .editResultsHeader,
          .editResultRow {
            min-width:
              650px;
          }


          .editActions {
            padding:
              10px;

            position:
              sticky;

            bottom:
              0;

            z-index:
              20;
          }


          .cancelEditButton,
          .saveEditButton {
            flex:
              1;
          }


          /* PREVIEW */

          .savedFinalPreviewWrapper {
            padding:
              8px 2px 25px;
          }


          .previewToolbar {
            width:
              calc(
                100% - 6px
              );

            margin:
              0 auto 7px;

            flex-direction:
              column;

            align-items:
              stretch;
          }


          .previewToolbarActions {
            display:
              grid;

            grid-template-columns:
              1fr 1fr;
          }


          .previewEdit {
            grid-column:
              span 2;
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
              calc(
                100vw - 8px
              );

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
            height:
              31mm;

            padding-top:
              5mm;

            gap:
              3mm;
          }


          .mainLogo {
            width:
              17mm;

            height:
              17mm;
          }


          .mainLogo span {
            font-size:
              15px;
          }


          .brand {
            gap:
              2.5mm;
          }


          .brandText h1 {
            font-size:
              13px;
          }


          .brandText h2 {
            font-size:
              4.2px;
          }


          .brandText p {
            font-size:
              3.7px;
          }


          .headerRight {
            width:
              40mm;

            font-size:
              3.7px;
          }


          .reportLabel {
            font-size:
              4px;
          }


          .patientGrid {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }


          .infoCell:nth-child(4n) {
            border-right:
              1px solid #e3e8ed;
          }


          .infoCell:nth-child(2n) {
            border-right:
              0;
          }


          .infoCell:nth-last-child(-n + 4) {
            border-bottom:
              1px solid #e3e8ed;
          }


          .infoCell:nth-last-child(-n + 2) {
            border-bottom:
              0;
          }


          .infoCell {
            min-height:
              8mm;

            padding:
              1.5mm 2mm;
          }


          .sectionBar {
            height:
              5.5mm;

            font-size:
              4.5px;
          }


          .circleP {
            width:
              11px;

            height:
              11px;

            font-size:
              5px;
          }


          .infoLabel {
            font-size:
              3.5px;
          }


          .infoValue {
            font-size:
              4.8px;
          }


          .infoValue.strong {
            font-size:
              5.2px;
          }


          .testHeader {
            min-height:
              6mm;

            margin-bottom:
              1.3mm;
          }


          .departmentTag {
            font-size:
              3.5px;
          }


          .testTitleBox {
            font-size:
              6.3px;

            padding:
              1.7mm 2mm;
          }


          .labTable th {
            height:
              5.3mm;

            padding:
              1mm;

            font-size:
              3.4px;
          }


          .labTable td {
            height:
              5.5mm;

            padding:
              .7mm 1mm;

            font-size:
              3.9px;
          }


          .investigationText {
            font-size:
              3.9px;
          }


          .resultBox {
            min-width:
              14mm;

            height:
              4.8mm;

            font-size:
              5.3px;
          }


          .flagBadge {
            width:
              11px;

            height:
              11px;

            font-size:
              4px;
          }


          .normalMark {
            font-size:
              7px;
          }


          .signatures {
            gap:
              15mm;

            margin-top:
              3mm;
          }


          .signatureBlank {
            height:
              4mm;
          }


          .signature strong {
            font-size:
              4px;
          }


          .signature small {
            font-size:
              3px;
          }


          .note {
            font-size:
              3px;

            margin-top:
              2mm;
          }


          .footer {
            height:
              10mm;

            padding:
              2mm 5mm;
          }


          .footer strong {
            font-size:
              4.5px;
          }


          .footer span {
            font-size:
              3px;
          }


          .footer small {
            font-size:
              2.5px;
          }


          .footer em {
            font-size:
              2.5px;
          }

        }


        /* =================================================
           PRINT
        ================================================= */

        @media print {

          @page {
            size:
              A4 portrait;

            margin:
              0;
          }


          html,
          body {
            width:
              210mm !important;

            height:
              297mm !important;

            margin:
              0 !important;

            padding:
              0 !important;

            background:
              #ffffff !important;

            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;
          }


          .savedReportsScreen {
            display:
              none !important;
          }


          .editReportWrapper {
            display:
              none !important;
          }


          .previewToolbar {
            display:
              none !important;
          }


          .savedFinalPreviewWrapper {
            display:
              block !important;

            width:
              210mm !important;

            height:
              297mm !important;

            min-height:
              297mm !important;

            padding:
              0 !important;

            margin:
              0 !important;

            background:
              #ffffff !important;
          }


          .finalPreview {
            display:
              block !important;

            width:
              210mm !important;

            height:
              297mm !important;

            min-height:
              297mm !important;

            padding:
              0 !important;

            margin:
              0 !important;

            background:
              #ffffff !important;
          }


          .a4Page {
            width:
              210mm !important;

            height:
              297mm !important;

            min-height:
              297mm !important;

            max-height:
              297mm !important;

            margin:
              0 !important;

            padding:
              0 11mm 18mm !important;

            box-shadow:
              none !important;

            overflow:
              hidden !important;

            page-break-after:
              always;

            break-after:
              page;

            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;
          }


          .testSection {
            break-inside:
              avoid !important;

            page-break-inside:
              avoid !important;
          }


          .patientCard,
          .signatures,
          .note {
            break-inside:
              avoid !important;

            page-break-inside:
              avoid !important;
          }

        }

      `}</style>

    </>
  );

}
