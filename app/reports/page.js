"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

/* =========================================================
   NIDAN PATHOLOGY LAB
   SAVED REPORTS PAGE
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
        aliases: [
          "Total WBC Count",
          "WBC Count",
          "TLC",
          "Total Leukocyte Count",
        ],
        unit: "/cumm",
        min: 4000,
        max: 11000,
        range: "4000 - 11000",
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
        maleMax: 6.0,
        femaleMin: 4.0,
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
        aliases: [
          "Platelets",
          "Total Platelet Count",
        ],
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
        aliases: [
          "Platelet Distribution Width",
        ],
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
        aliases: [
          "Erythrocyte Sedimentation Rate",
        ],
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
        aliases: [
          "FBS",
          "Fasting Glucose",
          "Fasting Blood Glucose",
        ],
        unit: "mg/dL",
        min: 70,
        max: 100,
        range: "70 - 100",
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
        max: 45,
        range: "15 - 45",
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
        maleMax: 7.0,
        femaleMin: 2.4,
        femaleMax: 6.0,
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
        aliases: [
          "Serum Potassium",
          "K+",
        ],
        unit: "mEq/L",
        min: 3.5,
        max: 5.1,
        range: "3.5 - 5.1",
      },
      {
        name: "Chloride",
        aliases: [
          "Serum Chloride",
          "Cl-",
        ],
        unit: "mEq/L",
        min: 98,
        max: 107,
        range: "98 - 107",
      },
      {
        name: "BUN",
        aliases: [
          "Blood Urea Nitrogen",
        ],
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
        aliases: [
          "Bilirubin Total",
          "Serum Bilirubin Total",
        ],
        unit: "mg/dL",
        min: 0.2,
        max: 1.2,
        range: "0.2 - 1.2",
      },
      {
        name: "Direct Bilirubin",
        aliases: [
          "Bilirubin Direct",
        ],
        unit: "mg/dL",
        min: 0,
        max: 0.3,
        range: "0 - 0.3",
      },
      {
        name: "Indirect Bilirubin",
        aliases: [
          "Bilirubin Indirect",
        ],
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
        range: "0 - 40",
      },
      {
        name: "SGPT / ALT",
        aliases: ["SGPT", "ALT"],
        unit: "U/L",
        min: 0,
        max: 40,
        range: "0 - 40",
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
        aliases: [
          "Serum Total Protein",
        ],
        unit: "g/dL",
        min: 6.0,
        max: 8.3,
        range: "6.0 - 8.3",
      },
      {
        name: "Albumin",
        aliases: ["Serum Albumin"],
        unit: "g/dL",
        min: 3.5,
        max: 5.0,
        range: "3.5 - 5.0",
      },
      {
        name: "Globulin",
        aliases: ["Serum Globulin"],
        unit: "g/dL",
        min: 2.0,
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
        aliases: [
          "Glycated Hemoglobin",
          "Glycosylated Hemoglobin",
        ],
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
        aliases: [
          "Triiodothyronine",
          "Total T3",
        ],
        unit: "ng/dL",
        min: 80,
        max: 200,
        range: "80 - 200",
      },
      {
        name: "T4",
        aliases: [
          "Thyroxine",
          "Total T4",
        ],
        unit: "µg/dL",
        min: 5.1,
        max: 14.1,
        range: "5.1 - 14.1",
      },
      {
        name: "TSH",
        aliases: [
          "Thyroid Stimulating Hormone",
        ],
        unit: "µIU/mL",
        min: 0.4,
        max: 4.0,
        range: "0.4 - 4.0",
      },
    ],
  },
];

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[./_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getPatientGender(patient) {
  const gender = normalizeText(
    patient?.gender ||
      patient?.sex ||
      patient?.patientGender ||
      ""
  );

  if (
    gender === "male" ||
    gender === "m" ||
    gender.startsWith("male ")
  ) {
    return "male";
  }

  if (
    gender === "female" ||
    gender === "f" ||
    gender.startsWith("female ")
  ) {
    return "female";
  }

  return "";
}

function findMasterTest(test) {
  if (!test) return null;

  const testId = normalizeText(test.id);
  const testName = normalizeText(
    test.name ||
      test.testName ||
      test.short ||
      ""
  );

  return (
    MASTER_TESTS.find((master) => {
      const masterId = normalizeText(master.id);
      const masterName = normalizeText(master.name);
      const masterShort = normalizeText(
        master.short
      );

      return (
        (testId && testId === masterId) ||
        (testName &&
          (testName === masterName ||
            testName === masterShort ||
            masterName.includes(testName) ||
            testName.includes(masterName)))
      );
    }) || null
  );
}

function findMasterParameter(
  parameterName,
  test = null
) {
  const target = normalizeText(parameterName);

  if (!target) return null;

  const matchesParameter = (parameter) => {
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
  };

  const masterTest = findMasterTest(test);

  if (masterTest) {
    const match =
      masterTest.parameters.find(
        matchesParameter
      );

    if (match) return match;
  }

  for (const group of MASTER_TESTS) {
    const match =
      group.parameters.find(
        matchesParameter
      );

    if (match) return match;
  }

  return null;
}

function getEffectiveParameter(
  parameter,
  test
) {
  const parameterName =
    parameter?.name ||
    parameter?.testName ||
    parameter?.investigation ||
    "";

  const master =
    findMasterParameter(
      parameterName,
      test
    );

  if (!master) {
    return {
      ...parameter,
      name:
        parameterName ||
        "Investigation",
    };
  }

  return {
    ...master,
    ...parameter,

    name:
      parameterName ||
      master.name,

    unit:
      parameter?.unit ||
      parameter?.units ||
      master.unit ||
      "",

    range:
      parameter?.range ||
      master.range,

    maleRange:
      parameter?.maleRange ||
      master.maleRange,

    femaleRange:
      parameter?.femaleRange ||
      master.femaleRange,

    min:
      parameter?.min ??
      master.min,

    max:
      parameter?.max ??
      master.max,

    maleMin:
      parameter?.maleMin ??
      master.maleMin,

    maleMax:
      parameter?.maleMax ??
      master.maleMax,

    femaleMin:
      parameter?.femaleMin ??
      master.femaleMin,

    femaleMax:
      parameter?.femaleMax ??
      master.femaleMax,
  };
}

function getReferenceRange(
  parameter,
  patient,
  test
) {
  const p = getEffectiveParameter(
    parameter,
    test
  );

  const gender =
    getPatientGender(patient);

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

  return (
    p.referenceRange ||
    p.reference ||
    "-"
  );
}

function getLimits(
  parameter,
  patient,
  test
) {
  const p = getEffectiveParameter(
    parameter,
    test
  );

  const gender =
    getPatientGender(patient);

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

  const numericValue = Number(
    String(value).replace(/,/g, "").trim()
  );

  if (Number.isNaN(numericValue)) {
    return "";
  }

  const { min, max } =
    getLimits(
      parameter,
      patient,
      test
    );

  if (
    min !== null &&
    !Number.isNaN(min) &&
    numericValue < min
  ) {
    return "L";
  }

  if (
    max !== null &&
    !Number.isNaN(max) &&
    numericValue > max
  ) {
    return "H";
  }

  return "";
}

function formatDate(value) {
  if (!value) return "-";

  try {
    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return value;
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  } catch {
    return value;
  }
}

function getPatientName(report) {
  return (
    report?.report_data?.patient
      ?.name ||
    report?.patient_name ||
    "-"
  );
}

function getReportTests(report) {
  const data =
    report?.report_data || {};

  if (
    Array.isArray(data.reportTests) &&
    data.reportTests.length > 0
  ) {
    return data.reportTests;
  }

  if (
    Array.isArray(
      data.selectedTests
    )
  ) {
    return data.selectedTests;
  }

  return [];
}
/* =========================================================
   REPORT DATA HELPERS
========================================================= */

function getTestParameters(test) {
  if (Array.isArray(test?.parameters)) {
    return test.parameters;
  }

  if (Array.isArray(test?.tests)) {
    return test.tests;
  }

  return [];
}

function getResultValue(
  report,
  test,
  parameter,
  index
) {
  if (
    parameter?.result !== undefined &&
    parameter?.result !== null
  ) {
    return parameter.result;
  }

  if (
    parameter?.value !== undefined &&
    parameter?.value !== null
  ) {
    return parameter.value;
  }

  const results =
    report?.report_data?.results || {};

  const parameterName =
    parameter?.name ||
    parameter?.testName ||
    parameter?.investigation ||
    "";

  const possibleKeys = [
    `${test?.id}-${parameterName}-${index}`,
    `${test?.id}-${parameter?.name}-${index}`,
  ];

  for (const key of possibleKeys) {
    if (
      Object.prototype.hasOwnProperty.call(
        results,
        key
      )
    ) {
      return results[key];
    }
  }

  return "";
}

function getTestDisplayName(test) {
  return (
    test?.name ||
    test?.testName ||
    test?.short ||
    "Laboratory Test"
  );
}

function getTestCategory(test) {
  const master =
    findMasterTest(test);

  return (
    test?.category ||
    master?.category ||
    ""
  );
}

function getParameterDisplayName(
  parameter,
  test
) {
  const effective =
    getEffectiveParameter(
      parameter,
      test
    );

  return (
    effective?.name ||
    "Investigation"
  );
}

function getParameterUnit(
  parameter,
  test
) {
  const effective =
    getEffectiveParameter(
      parameter,
      test
    );

  return (
    effective?.unit ||
    effective?.units ||
    "-"
  );
}

/* =========================================================
   MAIN SAVED REPORTS PAGE
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

      setReports(data || []);
    } catch (error) {
      console.error(
        "Reports load exception:",
        error
      );

      setMessage(
        "Saved reports load karne me error aaya."
      );
    } finally {
      setLoading(false);
    }
  }

  function viewReport(report) {
    setSelectedReport(report);

    setTimeout(() => {
      const element =
        document.getElementById(
          "saved-report-preview"
        );

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  }

  function closeReport() {
    setSelectedReport(null);
  }

  async function deleteReport(report) {
    const reportNo =
      report?.report_no ||
      "this report";

    const confirmed =
      window.confirm(
        `${reportNo} delete karna hai? Ye action undo nahi hoga.`
      );

    if (!confirmed) return;

    try {
      const { error } =
        await supabase
          .from("reports")
          .delete()
          .eq("id", report.id);

      if (error) {
        console.error(
          "Delete report error:",
          error
        );

        alert(
          "Report delete nahi hua: " +
            error.message
        );

        return;
      }

      if (
        selectedReport?.id ===
        report.id
      ) {
        setSelectedReport(null);
      }

      setReports((previous) =>
        previous.filter(
          (item) =>
            item.id !== report.id
        )
      );

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

  function printSelectedReport(report) {
    setSelectedReport(report);

    setTimeout(() => {
      window.print();
    }, 300);
  }

  function printCurrentPreview() {
    if (!selectedReport) return;

    window.print();
  }

  const previewData =
    selectedReport?.report_data ||
    {};

  const previewPatient =
    previewData?.patient || {};

  const previewTests =
    selectedReport
      ? getReportTests(
          selectedReport
        )
      : [];

  const previewReportDate =
    previewData?.reportDate ||
    selectedReport?.created_at ||
    "";

  return (
    <div className="savedReportsPage">
      {/* ===============================================
          SAVED REPORTS LIST
      =============================================== */}

      <section className="savedReportsHeader">
        <div>
          <h1>Saved Reports</h1>

          <p>
            NIDAN PATHOLOGY LAB
          </p>
        </div>

        <button
          className="refreshReportsButton"
          onClick={loadReports}
          disabled={loading}
        >
          ↻{" "}
          {loading
            ? "Loading..."
            : "Refresh"}
        </button>
      </section>

      {message && (
        <div className="reportMessage">
          {message}
        </div>
      )}

      <section className="savedReportsCard">
        {loading ? (
          <div className="reportsLoading">
            <div className="loadingCircle">
              N+
            </div>

            <strong>
              Saved reports loading...
            </strong>
          </div>
        ) : reports.length === 0 ? (
          <div className="noSavedReports">
            <div>📄</div>

            <h2>
              No Saved Reports
            </h2>

            <p>
              Final report save hone ke
              baad yahan दिखाई देगा.
            </p>
          </div>
        ) : (
          <div className="savedTableWrapper">
            <table className="savedReportsTable">
              <thead>
                <tr>
                  <th>Report No.</th>
                  <th>Patient</th>
                  <th>Tests</th>
                  <th>Status</th>
                  <th>Saved Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {reports.map(
                  (report) => {
                    const tests =
                      getReportTests(
                        report
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
                              "-"}
                          </strong>
                        </td>

                        <td>
                          {getPatientName(
                            report
                          )}
                        </td>

                        <td>
                          {tests.length >
                          0
                            ? tests
                                .map(
                                  (
                                    test
                                  ) =>
                                    test.short ||
                                    test.name ||
                                    test.testName
                                )
                                .filter(
                                  Boolean
                                )
                                .join(", ")
                            : "-"}
                        </td>

                        <td>
                          <span className="completedStatus">
                            {report.status ||
                              "completed"}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            report.created_at
                          )}
                        </td>

                        <td>
                          <div className="savedReportActions">
                            <button
                              className="viewReportButton"
                              onClick={() =>
                                viewReport(
                                  report
                                )
                              }
                            >
                              👁 View
                            </button>

                            <button
                              className="printSavedButton"
                              onClick={() =>
                                printSelectedReport(
                                  report
                                )
                              }
                            >
                              🖨 Print
                            </button>

                            <button
                              className="deleteSavedButton"
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
      </section>

      {/* ===============================================
          REPORT PREVIEW
      =============================================== */}

      {selectedReport && (
        <section
          className="savedReportPreviewSection"
          id="saved-report-preview"
        >
          <div className="previewTopBar">
            <div>
              <h2>
                Report Preview
              </h2>

              <strong>
                {selectedReport.report_no ||
                  "-"}
              </strong>
            </div>

            <button
              className="closePreviewButton"
              onClick={closeReport}
            >
              × Close
            </button>
          </div>

          {/* ===========================================
              PRINTABLE SAVED REPORT
          =========================================== */}

          <main className="savedPrintableReport">
            {/* HEADER */}

            <header className="savedLabHeader">
              <div className="savedLogo">
                N+
              </div>

              <div className="savedLabIdentity">
                <h1>
                  NIDAN PATHOLOGY LAB
                </h1>

                <p className="savedTagline">
                  Accurate • Reliable •
                  Professional
                </p>

                <p>
                  Clinical Pathology &
                  Diagnostic Laboratory
                </p>
              </div>

              <div className="savedHeaderRight">
                <strong>
                  LABORATORY REPORT
                </strong>

                <span>
                  Report Date:{" "}
                  {formatDate(
                    previewReportDate
                  )}
                </span>
              </div>
            </header>

            <div className="savedAccentLine" />

            {/* LAB DETAILS */}

            <section className="savedLabDetails">
              <span>
                📍 Address:
                ______________________
              </span>

              <span>
                ☎ Mobile:
                ______________
              </span>

              <span>
                ✉ Email:
                ______________
              </span>
            </section>

            {/* PATIENT INFO */}

            <section className="savedPatientSection">
              <div className="savedSectionTitle">
                PATIENT INFORMATION
              </div>

              <div className="savedPatientGrid">
                <div>
                  <span>
                    Patient ID
                  </span>

                  <strong>
                    {previewPatient.patientId ||
                      previewPatient.id ||
                      selectedReport.patient_id ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Patient Name
                  </span>

                  <strong>
                    {previewPatient.name ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Age / Sex
                  </span>

                  <strong>
                    {previewPatient.age ||
                      "-"}{" "}
                    Years /{" "}
                    {previewPatient.gender ||
                      previewPatient.sex ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Mobile
                  </span>

                  <strong>
                    {previewPatient.mobile ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Ref. Doctor
                  </span>

                  <strong>
                    {previewPatient.doctor ||
                      previewPatient.refDoctor ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Sample Date
                  </span>

                  <strong>
                    {previewPatient.sampleDate ||
                      formatDate(
                        selectedReport.created_at
                      )}
                  </strong>
                </div>
              </div>
            </section>

            {/* ===========================================
                TEST RESULTS
            =========================================== */}

            <section className="savedInvestigationReport">
              {previewTests.length ===
              0 ? (
                <div className="savedReportEmpty">
                  No investigation data
                  available.
                </div>
              ) : (
                previewTests.map(
                  (test, testIndex) => {
                    const parameters =
                      getTestParameters(
                        test
                      );

                    const category =
                      getTestCategory(
                        test
                      );

                    return (
                      <div
                        className="savedTestSection"
                        key={
                          test.id ||
                          `${getTestDisplayName(
                            test
                          )}-${testIndex}`
                        }
                      >
                        {category && (
                          <div className="savedCategory">
                            {category}
                          </div>
                        )}

                        <div className="savedTestHeading">
                          {getTestDisplayName(
                            test
                          )}
                        </div>

                        <table className="savedFinalReportTable">
                          <thead>
                            <tr>
                              <th>
                                INVESTIGATION
                              </th>

                              <th>
                                RESULT
                              </th>

                              <th>
                                UNIT
                              </th>

                              <th>
                                REFERENCE
                                RANGE
                              </th>

                              <th>
                                FLAG
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {parameters.map(
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
                                  getResultValue(
                                    selectedReport,
                                    test,
                                    parameter,
                                    index
                                  );

                                const flag =
                                  getFlag(
                                    value,
                                    effective,
                                    previewPatient,
                                    test
                                  );

                                const reference =
                                  getReferenceRange(
                                    effective,
                                    previewPatient,
                                    test
                                  );

                                const unit =
                                  getParameterUnit(
                                    effective,
                                    test
                                  );

                                return (
                                  <tr
                                    key={`${test.id}-${index}-${getParameterDisplayName(
                                      effective,
                                      test
                                    )}`}
                                  >
                                    <td>
                                      {getParameterDisplayName(
                                        effective,
                                        test
                                      )}
                                    </td>

                                    <td
                                      className={
                                        flag
                                          ? "savedAbnormalResult"
                                          : "savedNormalResult"
                                      }
                                    >
                                      {value !==
                                        "" &&
                                      value !==
                                        null &&
                                      value !==
                                        undefined
                                        ? value
                                        : "-"}
                                    </td>

                                    <td>
                                      {unit}
                                    </td>

                                    <td>
                                      {reference}
                                    </td>

                                    <td>
                                      {flag && (
                                        <span
                                          className={
                                            flag ===
                                            "H"
                                              ? "savedFlag savedFlagHigh"
                                              : "savedFlag savedFlagLow"
                                          }
                                        >
                                          {
                                            flag
                                          }
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
                    );
                  }
                )
              )}
            </section>

            {/* REMARKS */}

            <section className="savedRemarks">
              <strong>
                Remarks:
              </strong>

              <div className="savedRemarksLine">
                ______________________________________
              </div>
            </section>

            {/* SIGNATURE */}

            <section className="savedSignatureSection">
              <div className="savedSignatureBox">
                <div className="savedSignatureSpace" />

                <strong>
                  Lab Technician
                </strong>

                <span>
                  NIDAN Pathology Lab
                </span>
              </div>

              <div className="savedSignatureBox">
                <div className="savedSignatureSpace" />

                <strong>
                  Authorized Signatory
                </strong>

                <span>
                  Signature & Seal
                </span>
              </div>
            </section>

            {/* NOTE */}

            <section className="savedNotes">
              <strong>
                Note:
              </strong>

              <p>
                Reference intervals may
                vary according to
                laboratory method, age,
                sex and clinical
                circumstances.
                Laboratory results
                should be interpreted
                with relevant clinical
                findings.
              </p>
            </section>

            {/* FOOTER */}

            <footer className="savedReportFooter">
              <span>
                NIDAN PATHOLOGY LAB
              </span>

              <strong>
                *** END OF REPORT ***
              </strong>

              <span>
                Computer Generated
                Report
              </span>
            </footer>
          </main>

          {/* PREVIEW ACTIONS */}

          <div className="previewBottomActions">
            <button
              className="previewPrintButton"
              onClick={
                printCurrentPreview
              }
            >
              🖨 Print / Save PDF
            </button>

            <button
              className="previewDeleteButton"
              onClick={() =>
                deleteReport(
                  selectedReport
                )
              }
            >
              🗑 Delete Report
            </button>
          </div>
        </section>
      )}

      {/* PART 3 CSS YAHAN SE CONTINUE HOGA */}
      <style jsx global>{`
        /* =================================================
           SAVED REPORTS PAGE
        ================================================= */

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .savedReportsPage {
          min-height: 100vh;
          background: #f5f7fb;
          padding: 28px;
          color: #172033;
          font-family: Arial, Helvetica, sans-serif;
        }

        /* =================================================
           TOP HEADER
        ================================================= */

        .savedReportsHeader {
          max-width: 1400px;
          margin: 0 auto 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .savedReportsHeader h1 {
          margin: 0;
          font-size: 30px;
          font-weight: 800;
          color: #172033;
        }

        .savedReportsHeader p {
          margin: 6px 0 0;
          color: #697386;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .refreshReportsButton {
          border: 1px solid #d6dce8;
          background: #ffffff;
          color: #172033;
          border-radius: 9px;
          padding: 11px 17px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }

        .refreshReportsButton:hover {
          background: #f0f4fa;
        }

        .refreshReportsButton:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* =================================================
           MESSAGE
        ================================================= */

        .reportMessage {
          max-width: 1400px;
          margin: 0 auto 18px;
          background: #fff7e6;
          border: 1px solid #ffd591;
          border-radius: 10px;
          padding: 14px 16px;
          color: #8a5700;
          font-size: 14px;
        }

        /* =================================================
           REPORT LIST CARD
        ================================================= */

        .savedReportsCard {
          max-width: 1400px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #e2e7f0;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(28, 39, 60, 0.05);
        }

        .savedTableWrapper {
          width: 100%;
          overflow-x: auto;
        }

        .savedReportsTable {
          width: 100%;
          min-width: 950px;
          border-collapse: collapse;
        }

        .savedReportsTable thead {
          background: #f7f9fc;
        }

        .savedReportsTable th {
          padding: 15px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 800;
          color: #596579;
          letter-spacing: 0.4px;
          border-bottom: 1px solid #e3e8f0;
          white-space: nowrap;
        }

        .savedReportsTable td {
          padding: 16px;
          border-bottom: 1px solid #edf0f5;
          font-size: 14px;
          color: #273246;
          vertical-align: middle;
        }

        .savedReportsTable tbody tr:hover {
          background: #fafcff;
        }

        .savedReportsTable tbody tr:last-child td {
          border-bottom: none;
        }

        .completedStatus {
          display: inline-block;
          background: #e9f9ef;
          color: #14783b;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: capitalize;
        }

        /* =================================================
           ACTION BUTTONS
        ================================================= */

        .savedReportActions {
          display: flex;
          gap: 7px;
          align-items: center;
          flex-wrap: wrap;
        }

        .savedReportActions button {
          border-radius: 7px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          background: #ffffff;
          white-space: nowrap;
        }

        .viewReportButton {
          border: 1px solid #b9c8e7;
          color: #244c96;
        }

        .printSavedButton {
          border: 1px solid #a8d7bd;
          color: #137340;
        }

        .deleteSavedButton {
          border: 1px solid #efb6b6;
          color: #c33131;
        }

        .viewReportButton:hover {
          background: #eef4ff;
        }

        .printSavedButton:hover {
          background: #edf9f2;
        }

        .deleteSavedButton:hover {
          background: #fff1f1;
        }

        /* =================================================
           LOADING / EMPTY
        ================================================= */

        .reportsLoading,
        .noSavedReports {
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 30px;
          color: #697386;
        }

        .loadingCircle {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: #1f5fae;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 18px;
          margin-bottom: 15px;
        }

        .noSavedReports > div {
          font-size: 42px;
          margin-bottom: 8px;
        }

        .noSavedReports h2 {
          margin: 5px 0;
          color: #273246;
        }

        .noSavedReports p {
          margin: 4px 0;
        }

        /* =================================================
           PREVIEW SECTION
        ================================================= */

        .savedReportPreviewSection {
          max-width: 1100px;
          margin: 35px auto 0;
          background: #ffffff;
          border: 1px solid #e0e5ed;
          border-radius: 14px;
          padding: 20px;
          box-shadow: 0 5px 25px rgba(20, 30, 50, 0.08);
        }

        .previewTopBar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding-bottom: 18px;
          margin-bottom: 18px;
          border-bottom: 1px solid #e5e9f0;
        }

        .previewTopBar h2 {
          margin: 0 0 5px;
          font-size: 22px;
        }

        .previewTopBar strong {
          color: #647087;
          font-size: 13px;
        }

        .closePreviewButton {
          border: 1px solid #d5dbe6;
          background: #ffffff;
          padding: 9px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
        }

        /* =================================================
           PRINTABLE REPORT PAPER
        ================================================= */

        .savedPrintableReport {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          background: #ffffff;
          color: #111111;
          padding: 25px 30px;
          border: 1px solid #dce1e8;
          font-family: Arial, Helvetica, sans-serif;
        }

        /* =================================================
           LAB HEADER
        ================================================= */

        .savedLabHeader {
          display: grid;
          grid-template-columns: 80px 1fr 190px;
          gap: 18px;
          align-items: center;
        }

        .savedLogo {
          width: 65px;
          height: 65px;
          border-radius: 12px;
          background: #145da0;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
          font-weight: 900;
        }

        .savedLabIdentity h1 {
          margin: 0;
          font-size: 27px;
          line-height: 1.1;
          color: #124f8f;
          font-weight: 900;
        }

        .savedLabIdentity p {
          margin: 4px 0 0;
          font-size: 12px;
          color: #3f4856;
        }

        .savedLabIdentity .savedTagline {
          font-weight: 700;
          color: #1671b8;
          margin-top: 6px;
        }

        .savedHeaderRight {
          text-align: right;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .savedHeaderRight strong {
          font-size: 13px;
          color: #124f8f;
        }

        .savedHeaderRight span {
          font-size: 11px;
          color: #555;
        }

        .savedAccentLine {
          height: 3px;
          margin: 15px 0 10px;
          background: #145da0;
        }

        /* =================================================
           LAB CONTACT DETAILS
        ================================================= */

        .savedLabDetails {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px 20px;
          font-size: 10px;
          color: #454545;
          padding: 5px 0 12px;
          border-bottom: 1px solid #d5d5d5;
        }

        /* =================================================
           PATIENT INFORMATION
        ================================================= */

        .savedPatientSection {
          margin-top: 15px;
          border: 1px solid #ccd5df;
        }

        .savedSectionTitle {
          background: #eef5fb;
          color: #124f8f;
          font-size: 12px;
          font-weight: 900;
          padding: 8px 10px;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #ccd5df;
        }

        .savedPatientGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }

        .savedPatientGrid > div {
          min-height: 55px;
          padding: 9px 11px;
          border-right: 1px solid #e1e5ea;
          border-bottom: 1px solid #e1e5ea;
        }

        .savedPatientGrid > div:nth-child(3n) {
          border-right: none;
        }

        .savedPatientGrid > div:nth-last-child(-n + 3) {
          border-bottom: none;
        }

        .savedPatientGrid span {
          display: block;
          font-size: 9px;
          font-weight: 700;
          color: #717b89;
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        .savedPatientGrid strong {
          display: block;
          font-size: 12px;
          color: #111;
          word-break: break-word;
        }

        /* =================================================
           INVESTIGATION REPORT
        ================================================= */

        .savedInvestigationReport {
          margin-top: 18px;
        }

        .savedTestSection {
          margin-bottom: 22px;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .savedCategory {
          text-align: center;
          font-size: 10px;
          font-weight: 800;
          color: #6a7480;
          margin-bottom: 4px;
          letter-spacing: 0.7px;
        }

        .savedTestHeading {
          text-align: center;
          background: #eef5fb;
          border: 1px solid #cbd6e2;
          border-bottom: none;
          padding: 8px 10px;
          font-size: 13px;
          font-weight: 900;
          color: #124f8f;
          text-transform: uppercase;
        }

        .savedFinalReportTable {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 11px;
        }

        .savedFinalReportTable th {
          background: #f5f7fa;
          border: 1px solid #cdd4dd;
          padding: 7px 6px;
          font-size: 9px;
          font-weight: 900;
          text-align: center;
        }

        .savedFinalReportTable th:first-child {
          width: 29%;
          text-align: left;
        }

        .savedFinalReportTable th:nth-child(2) {
          width: 14%;
        }

        .savedFinalReportTable th:nth-child(3) {
          width: 15%;
        }

        .savedFinalReportTable th:nth-child(4) {
          width: 30%;
        }

        .savedFinalReportTable th:nth-child(5) {
          width: 12%;
        }

        .savedFinalReportTable td {
          border: 1px solid #d6dbe2;
          padding: 7px 6px;
          vertical-align: middle;
          text-align: center;
          word-break: break-word;
        }

        .savedFinalReportTable td:first-child {
          text-align: left;
          font-weight: 600;
        }

        .savedNormalResult {
          font-weight: 800;
          color: #111;
        }

        .savedAbnormalResult {
          font-weight: 900;
          color: #c51f1f;
        }

        .savedFlag {
          display: inline-flex;
          width: 24px;
          height: 24px;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 10px;
          font-weight: 900;
        }

        .savedFlagHigh {
          background: #ffe4e4;
          color: #bd1f1f;
        }

        .savedFlagLow {
          background: #fff0d8;
          color: #a35d00;
        }

        .savedReportEmpty {
          padding: 25px;
          text-align: center;
          border: 1px dashed #bbc3cd;
          color: #6b7480;
        }

        /* =================================================
           REMARKS
        ================================================= */

        .savedRemarks {
          margin-top: 18px;
          display: flex;
          gap: 10px;
          align-items: center;
          font-size: 11px;
        }

        .savedRemarksLine {
          flex: 1;
          border-bottom: 1px solid #888;
          color: transparent;
        }

        /* =================================================
           SIGNATURE
        ================================================= */

        .savedSignatureSection {
          display: flex;
          justify-content: space-between;
          gap: 40px;
          margin-top: 45px;
        }

        .savedSignatureBox {
          width: 210px;
          text-align: center;
          font-size: 11px;
        }

        .savedSignatureSpace {
          height: 40px;
          border-bottom: 1px solid #555;
          margin-bottom: 7px;
        }

        .savedSignatureBox strong {
          display: block;
          margin-bottom: 3px;
        }

        .savedSignatureBox span {
          color: #626262;
          font-size: 10px;
        }

        /* =================================================
           NOTES
        ================================================= */

        .savedNotes {
          margin-top: 25px;
          border-top: 1px solid #aaa;
          padding-top: 9px;
          font-size: 9px;
          line-height: 1.45;
          color: #4e4e4e;
        }

        .savedNotes strong {
          color: #222;
        }

        .savedNotes p {
          display: inline;
          margin: 0 0 0 4px;
        }

        /* =================================================
           REPORT FOOTER
        ================================================= */

        .savedReportFooter {
          border-top: 1px solid #aaa;
          margin-top: 16px;
          padding-top: 9px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          font-size: 8px;
          color: #5e5e5e;
        }

        .savedReportFooter strong {
          color: #222;
        }

        /* =================================================
           PREVIEW BOTTOM BUTTONS
        ================================================= */

        .previewBottomActions {
          max-width: 900px;
          margin: 18px auto 0;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .previewPrintButton,
        .previewDeleteButton {
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .previewPrintButton {
          background: #145da0;
          color: white;
          border: 1px solid #145da0;
        }

        .previewDeleteButton {
          background: white;
          color: #c52c2c;
          border: 1px solid #e3a8a8;
        }

        /* =================================================
           TABLET
        ================================================= */

        @media (max-width: 900px) {
          .savedReportsPage {
            padding: 18px 12px;
          }

          .savedPrintableReport {
            padding: 20px 16px;
          }

          .savedLabHeader {
            grid-template-columns: 65px 1fr;
          }

          .savedHeaderRight {
            grid-column: 1 / -1;
            text-align: left;
            flex-direction: row;
            justify-content: space-between;
            border-top: 1px solid #ddd;
            padding-top: 8px;
          }

          .savedPatientGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .savedPatientGrid > div {
            border-right: 1px solid #e1e5ea !important;
            border-bottom: 1px solid #e1e5ea !important;
          }

          .savedPatientGrid > div:nth-child(2n) {
            border-right: none !important;
          }

          .savedPatientGrid > div:nth-last-child(-n + 2) {
            border-bottom: none !important;
          }
        }

        /* =================================================
           MOBILE
        ================================================= */

        @media (max-width: 600px) {
          .savedReportsPage {
            padding: 14px 8px;
          }

          .savedReportsHeader {
            align-items: flex-start;
          }

          .savedReportsHeader h1 {
            font-size: 24px;
          }

          .refreshReportsButton {
            padding: 9px 11px;
          }

          .savedReportPreviewSection {
            padding: 8px;
            border-radius: 9px;
          }

          .previewTopBar {
            padding: 8px 4px 14px;
          }

          .savedPrintableReport {
            padding: 14px 8px;
            border: none;
          }

          .savedLabHeader {
            grid-template-columns: 52px 1fr;
            gap: 10px;
          }

          .savedLogo {
            width: 48px;
            height: 48px;
            font-size: 19px;
            border-radius: 8px;
          }

          .savedLabIdentity h1 {
            font-size: 19px;
          }

          .savedLabIdentity p {
            font-size: 9px;
          }

          .savedHeaderRight {
            font-size: 9px;
          }

          .savedHeaderRight strong {
            font-size: 10px;
          }

          .savedHeaderRight span {
            font-size: 9px;
          }

          .savedLabDetails {
            font-size: 8px;
          }

          .savedPatientGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .savedPatientGrid > div {
            padding: 7px;
            min-height: 48px;
          }

          .savedPatientGrid span {
            font-size: 7px;
          }

          .savedPatientGrid strong {
            font-size: 9px;
          }

          .savedTestHeading {
            font-size: 10px;
            padding: 6px;
          }

          .savedCategory {
            font-size: 8px;
          }

          .savedFinalReportTable {
            font-size: 8px;
          }

          .savedFinalReportTable th {
            padding: 5px 2px;
            font-size: 6.5px;
          }

          .savedFinalReportTable td {
            padding: 5px 2px;
          }

          .savedFlag {
            width: 18px;
            height: 18px;
            font-size: 8px;
          }

          .savedSignatureSection {
            gap: 25px;
            margin-top: 35px;
          }

          .savedSignatureBox {
            width: 45%;
            font-size: 8px;
          }

          .savedSignatureBox span {
            font-size: 7px;
          }

          .savedNotes {
            font-size: 7px;
          }

          .savedReportFooter {
            font-size: 6px;
          }

          .previewBottomActions {
            justify-content: stretch;
          }

          .previewPrintButton,
          .previewDeleteButton {
            flex: 1;
          }
        }

        /* =================================================
           PRINT / SAVE PDF
        ================================================= */

        @media print {
          @page {
            size: A4 portrait;
            margin: 7mm;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .savedReportPreviewSection,
          .savedReportPreviewSection * {
            visibility: visible !important;
          }

          .savedReportPreviewSection {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }

          .previewTopBar,
          .previewBottomActions {
            display: none !important;
          }

          .savedPrintableReport {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }

          .savedTestSection {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .savedFinalReportTable {
            break-inside: auto;
          }

          .savedFinalReportTable tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .savedSignatureSection,
          .savedNotes,
          .savedReportFooter {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
