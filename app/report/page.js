"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

/*
============================================================
 NIDAN PATHOLOGY LAB
 PREMIUM REPORT ENGINE v2
 -----------------------------------------------------------
 - No uploaded letterhead
 - Modern professional A4 report
 - Compact layout
 - Mobile preview
 - Print / Save PDF
 - Supabase save
 - Existing localStorage compatible
============================================================
*/

const DEFAULT_SETTINGS = {
  labName: "NIDAN PATHOLOGY LAB",
  labAddress: "",
  phone: "",
  email: "",
  doctorName: "",
  autoSave: true,
  showFlag: true,
  showReferenceRange: true,
};

export default function ReportPage() {
  const router = useRouter();

  const [patient, setPatient] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
  const [results, setResults] = useState({});
  const [labSettings, setLabSettings] =
    useState(DEFAULT_SETTINGS);

  const [reportDate, setReportDate] = useState("");
  const [reportNo, setReportNo] = useState("");

  const [saveStatus, setSaveStatus] =
    useState("loading");

  const [saveMessage, setSaveMessage] =
    useState("");

  /* ========================================================
     LOAD DATA
  ======================================================== */

  useEffect(() => {
    loadReportData();
  }, []);

  async function loadReportData() {
    try {
      const patientData = readJSON([
        "nidanPatient",
        "patient",
        "currentPatient",
      ]);

      const testsData = readJSON([
        "nidanSelectedTests",
        "selectedTests",
        "selected_tests",
      ]);

      const resultData = readJSON([
        "nidanResults",
        "results",
        "testResults",
      ]);

      const settingsData = readJSON([
        "nidanLabSettings",
        "labSettings",
        "settings",
      ]);

      setPatient(patientData || {});

      setSelectedTests(
        Array.isArray(testsData)
          ? testsData
          : []
      );

      setResults(resultData || {});

      setLabSettings({
        ...DEFAULT_SETTINGS,
        ...(settingsData || {}),
      });

      setReportDate(
        formatDate(new Date())
      );

      const savedNo =
        localStorage.getItem(
          "nidanCurrentReportNo"
        );

      if (savedNo) {
        setReportNo(savedNo);
      }
    } catch (error) {
      console.error(
        "REPORT LOAD ERROR",
        error
      );
    }
  }

  function readJSON(keys) {
    for (const key of keys) {
      const value =
        localStorage.getItem(key);

      if (!value) continue;

      try {
        return JSON.parse(value);
      } catch {
        continue;
      }
    }

    return null;
  }

  function formatDate(date) {
    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  /* ========================================================
     NORMALIZE
  ======================================================== */

  function normalizeName(name = "") {
    return String(name)
      .toLowerCase()
      .replace(/[()]/g, "")
      .replace(/[./_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getGender() {
    const value = String(
      patient?.gender ||
        patient?.sex ||
        ""
    )
      .trim()
      .toLowerCase();

    if (
      ["male", "m", "पुरुष"].includes(
        value
      )
    ) {
      return "male";
    }

    if (
      ["female", "f", "महिला"].includes(
        value
      )
    ) {
      return "female";
    }

    return "";
  }

  /* ========================================================
     REFERENCE RANGES
  ======================================================== */

  function getDefaultReference(
    parameterName
  ) {
    const name =
      normalizeName(parameterName);

    const gender = getGender();

    if (
      ["hemoglobin", "haemoglobin", "hb"].includes(
        name
      )
    ) {
      return gender === "female"
        ? {
            min: 12,
            max: 15,
            unit: "g/dL",
            range: "12 - 15",
          }
        : {
            min: 13,
            max: 17,
            unit: "g/dL",
            range: "13 - 17",
          };
    }

    if (
      name.includes("total leucocyte") ||
      name.includes("total leukocyte") ||
      name === "tlc" ||
      name.includes("wbc")
    ) {
      return {
        min: 4000,
        max: 11000,
        unit: "/cumm",
        range: "4000 - 11000",
      };
    }

    if (
      name === "neutrophils" ||
      name === "neutrophil"
    ) {
      return {
        min: 40,
        max: 75,
        unit: "%",
        range: "40 - 75",
      };
    }

    if (
      name === "lymphocytes" ||
      name === "lymphocyte"
    ) {
      return {
        min: 20,
        max: 40,
        unit: "%",
        range: "20 - 40",
      };
    }

    if (
      name === "eosinophils" ||
      name === "eosinophil"
    ) {
      return {
        min: 1,
        max: 6,
        unit: "%",
        range: "1 - 6",
      };
    }

    if (
      name === "monocytes" ||
      name === "monocyte"
    ) {
      return {
        min: 1,
        max: 10,
        unit: "%",
        range: "1 - 10",
      };
    }

    if (
      name === "basophils" ||
      name === "basophil"
    ) {
      return {
        min: 0,
        max: 1,
        unit: "%",
        range: "0 - 1",
      };
    }

    if (name === "rbc count") {
      return gender === "female"
        ? {
            min: 4,
            max: 5.5,
            unit: "million/cumm",
            range: "4.0 - 5.5",
          }
        : {
            min: 4.5,
            max: 6,
            unit: "million/cumm",
            range: "4.5 - 6.0",
          };
    }

    if (
      name.includes("pcv") ||
      name.includes("haematocrit") ||
      name.includes("hematocrit")
    ) {
      return gender === "female"
        ? {
            min: 36,
            max: 46,
            unit: "%",
            range: "36 - 46",
          }
        : {
            min: 40,
            max: 50,
            unit: "%",
            range: "40 - 50",
          };
    }

    if (name === "mcv") {
      return {
        min: 80,
        max: 100,
        unit: "fL",
        range: "80 - 100",
      };
    }

    if (name === "mch") {
      return {
        min: 27,
        max: 32,
        unit: "pg",
        range: "27 - 32",
      };
    }

    if (name === "mchc") {
      return {
        min: 32,
        max: 36,
        unit: "g/dL",
        range: "32 - 36",
      };
    }

    if (
      name === "rdw cv" ||
      name === "rdw-cv"
    ) {
      return {
        min: 11.5,
        max: 14.5,
        unit: "%",
        range: "11.5 - 14.5",
      };
    }

    if (
      name === "platelet count" ||
      name === "platelets"
    ) {
      return {
        min: 1.5,
        max: 4.5,
        unit: "Lac/cumm",
        range: "1.5 - 4.5",
      };
    }

    if (name === "mpv") {
      return {
        min: 7.5,
        max: 11.5,
        unit: "fL",
        range: "7.5 - 11.5",
      };
    }

    if (name === "pdw") {
      return {
        min: 9,
        max: 17,
        unit: "%",
        range: "9 - 17",
      };
    }

    if (name === "pct") {
      return {
        min: 0.15,
        max: 0.4,
        unit: "%",
        range: "0.15 - 0.40",
      };
    }

    if (
      name === "esr" ||
      name.includes(
        "erythrocyte sedimentation"
      )
    ) {
      return {
        min: 0,
        max:
          gender === "female"
            ? 20
            : 15,
        unit: "mm/hr",
        range:
          gender === "female"
            ? "0 - 20"
            : "0 - 15",
      };
    }

    if (
      name.includes("fasting blood sugar") ||
      name === "fbs"
    ) {
      return {
        min: 70,
        max: 99,
        unit: "mg/dL",
        range: "70 - 99",
      };
    }

    if (
      name.includes("post prandial") ||
      name === "ppbs"
    ) {
      return {
        min: 70,
        max: 140,
        unit: "mg/dL",
        range: "70 - 140",
      };
    }

    if (
      name.includes("random blood sugar") ||
      name === "rbs"
    ) {
      return {
        min: 70,
        max: 140,
        unit: "mg/dL",
        range: "70 - 140",
      };
    }

    if (
      name === "blood urea" ||
      name === "urea"
    ) {
      return {
        min: 15,
        max: 40,
        unit: "mg/dL",
        range: "15 - 40",
      };
    }

    if (
      name === "serum creatinine" ||
      name === "creatinine"
    ) {
      return {
        min: 0.6,
        max: 1.3,
        unit: "mg/dL",
        range: "0.6 - 1.3",
      };
    }

    if (name === "uric acid") {
      return gender === "female"
        ? {
            min: 2.4,
            max: 6,
            unit: "mg/dL",
            range: "2.4 - 6.0",
          }
        : {
            min: 3.4,
            max: 7,
            unit: "mg/dL",
            range: "3.4 - 7.0",
          };
    }

    if (name === "sodium") {
      return {
        min: 135,
        max: 145,
        unit: "mEq/L",
        range: "135 - 145",
      };
    }

    if (name === "potassium") {
      return {
        min: 3.5,
        max: 5.1,
        unit: "mEq/L",
        range: "3.5 - 5.1",
      };
    }

    if (name === "total bilirubin") {
      return {
        min: 0.2,
        max: 1.2,
        unit: "mg/dL",
        range: "0.2 - 1.2",
      };
    }

    if (name === "direct bilirubin") {
      return {
        min: 0,
        max: 0.3,
        unit: "mg/dL",
        range: "0 - 0.3",
      };
    }

    if (
      name.includes("sgot") ||
      name === "ast"
    ) {
      return {
        min: 0,
        max: 40,
        unit: "U/L",
        range: "Up to 40",
      };
    }

    if (
      name.includes("sgpt") ||
      name === "alt"
    ) {
      return {
        min: 0,
        max: 40,
        unit: "U/L",
        range: "Up to 40",
      };
    }

    if (
      name.includes("total cholesterol")
    ) {
      return {
        min: 0,
        max: 200,
        unit: "mg/dL",
        range: "< 200",
      };
    }

    if (
      name.includes("triglyceride")
    ) {
      return {
        min: 0,
        max: 150,
        unit: "mg/dL",
        range: "< 150",
      };
    }

    if (name.includes("hdl")) {
      return {
        min: 40,
        max: null,
        unit: "mg/dL",
        range: "> 40",
      };
    }

    if (name.includes("ldl")) {
      return {
        min: 0,
        max: 100,
        unit: "mg/dL",
        range: "< 100",
      };
    }

    if (name === "tsh") {
      return {
        min: 0.4,
        max: 4,
        unit: "µIU/mL",
        range: "0.4 - 4.0",
      };
    }

    if (name === "t3") {
      return {
        min: 80,
        max: 200,
        unit: "ng/dL",
        range: "80 - 200",
      };
    }

    if (name === "t4") {
      return {
        min: 5,
        max: 12,
        unit: "µg/dL",
        range: "5 - 12",
      };
    }

    return null;
  }

  /* ========================================================
     PARAMETER
  ======================================================== */

  function resolveParameter(parameter) {
    const name =
      typeof parameter === "string"
        ? parameter
        : parameter?.name ||
          parameter?.testName ||
          parameter?.investigation ||
          "";

    const defaults =
      getDefaultReference(name);

    if (
      typeof parameter === "string"
    ) {
      return {
        name,
        min:
          defaults?.min ?? null,
        max:
          defaults?.max ?? null,
        unit:
          defaults?.unit || "",
        range:
          defaults?.range || "-",
      };
    }

    let min = parameter?.min;
    let max = parameter?.max;

    let unit =
      parameter?.unit ||
      parameter?.units;

    let range =
      parameter?.range ||
      parameter?.referenceRange ||
      parameter?.reference;

    if (
      min === undefined ||
      min === null ||
      min === ""
    ) {
      min = defaults?.min ?? null;
    }

    if (
      max === undefined ||
      max === null ||
      max === ""
    ) {
      max = defaults?.max ?? null;
    }

    if (!unit) {
      unit = defaults?.unit || "";
    }

    if (!range) {
      if (
        min !== null &&
        max !== null
      ) {
        range = `${min} - ${max}`;
      } else if (
        max !== null
      ) {
        range = `< ${max}`;
      } else if (
        min !== null
      ) {
        range = `> ${min}`;
      } else {
        range = "-";
      }
    }

    return {
      ...parameter,
      name,
      min,
      max,
      unit,
      range,
    };
  }

  function getFlag(value, parameter) {
    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return "";
    }

    const p =
      resolveParameter(parameter);

    const numeric = Number(
      String(value)
        .replace(/,/g, "")
        .trim()
    );

    if (Number.isNaN(numeric)) {
      return "";
    }

    if (
      p.min !== null &&
      p.min !== undefined &&
      numeric < Number(p.min)
    ) {
      return "L";
    }

    if (
      p.max !== null &&
      p.max !== undefined &&
      numeric > Number(p.max)
    ) {
      return "H";
    }

    return "";
  }

  /* ========================================================
     BUILD REPORT
  ======================================================== */

  function buildReportTests() {
    if (
      !Array.isArray(selectedTests)
    ) {
      return [];
    }

    return selectedTests.map(
      (test, testIndex) => {
        const testId =
          test?.id ??
          test?.testId ??
          `test-${testIndex}`;

        const parameters =
          test?.tests ||
          test?.parameters ||
          [];

        return {
          id: testId,

          name:
            test?.name ||
            test?.testName ||
            "Laboratory Test",

          category:
            test?.category ||
            test?.department ||
            "PATHOLOGY",

          parameters:
            Array.isArray(parameters)
              ? parameters.map(
                  (
                    parameter,
                    index
                  ) => {
                    const name =
                      typeof parameter ===
                      "string"
                        ? parameter
                        : parameter?.name ||
                          parameter?.testName ||
                          parameter?.investigation ||
                          `Investigation ${
                            index + 1
                          }`;

                    const key =
                      `${testId}-${name}-${index}`;

                    const value =
                      results?.[key] ?? "";

                    const resolved =
                      resolveParameter(
                        parameter
                      );

                    return {
                      name,
                      result: value,
                      unit:
                        resolved.unit || "-",
                      referenceRange:
                        resolved.range || "-",
                      flag:
                        getFlag(
                          value,
                          parameter
                        ),
                    };
                  }
                )
              : [],
        };
      }
    );
  }

  const reportTests =
    useMemo(
      () => buildReportTests(),
      [
        selectedTests,
        results,
        patient.gender,
        patient.sex,
        patient.age,
      ]
    );

  /* ========================================================
     PAGINATION
  ======================================================== */

  function paginateTests(tests) {
    if (!tests.length) {
      return [[]];
    }

    /*
      Compact A4 layout.
      Each page has approximately
      34-36 table rows.
    */

    const maxRows = 34;

    const pages = [];

    let current = [];
    let rowsUsed = 0;

    for (const test of tests) {
      const count =
        Math.max(
          1,
          test.parameters?.length || 0
        );

      const testCost =
        count + 3;

      if (
        current.length &&
        rowsUsed + testCost >
          maxRows
      ) {
        pages.push(current);

        current = [];
        rowsUsed = 0;
      }

      /*
        Large test:
        split parameters.
      */

      if (
        testCost > maxRows
      ) {
        const rows =
          test.parameters || [];

        for (
          let i = 0;
          i < rows.length;
          i += maxRows - 3
        ) {
          const chunk =
            rows.slice(
              i,
              i + maxRows - 3
            );

          pages.push([
            {
              ...test,
              id: `${test.id}-${i}`,
              parameters: chunk,
            },
          ]);
        }

        continue;
      }

      current.push(test);
      rowsUsed += testCost;
    }

    if (current.length) {
      pages.push(current);
    }

    return pages;
  }

  const pages =
    useMemo(
      () =>
        paginateTests(
          reportTests
        ),
      [reportTests]
    );

  /* ========================================================
     AUTO SAVE
  ======================================================== */

  useEffect(() => {
    if (
      !patient ||
      Object.keys(patient).length === 0
    ) {
      return;
    }

    if (!selectedTests.length) {
      return;
    }

    if (
      labSettings.autoSave === false
    ) {
      return;
    }

    const timer =
      setTimeout(
        saveReport,
        900
      );

    return () =>
      clearTimeout(timer);
  }, [
    patient,
    selectedTests,
    results,
    labSettings.autoSave,
  ]);

  async function saveReport() {
    try {
      setSaveStatus("saving");

      const patientId =
        patient?.patientId ||
        patient?.id;

      if (!patientId) {
        setSaveStatus("error");

        setSaveMessage(
          "Patient ID nahi mila."
        );

        return;
      }

      let currentReportNo =
        localStorage.getItem(
          "nidanCurrentReportNo"
        );

      if (!currentReportNo) {
        currentReportNo =
          `RPT-${Date.now()}`;

        localStorage.setItem(
          "nidanCurrentReportNo",
          currentReportNo
        );
      }

      setReportNo(
        currentReportNo
      );

      const payload = {
        patient,
        selectedTests,
        results,
        reportTests,
        reportNo:
          currentReportNo,
        reportDate:
          new Date().toISOString(),
      };

      const {
        data: existing,
      } =
        await supabase
          .from("reports")
          .select("id")
          .eq(
            "report_no",
            currentReportNo
          )
          .maybeSingle();

      if (existing?.id) {
        const { error } =
          await supabase
            .from("reports")
            .update({
              patient_id:
                patientId,
              status:
                "completed",
              report_data:
                payload,
            })
            .eq(
              "id",
              existing.id
            );

        if (error) {
          throw error;
        }
      } else {
        const { error } =
          await supabase
            .from("reports")
            .insert([
              {
                report_no:
                  currentReportNo,
                patient_id:
                  patientId,
                status:
                  "completed",
                report_data:
                  payload,
              },
            ]);

        if (error) {
          throw error;
        }
      }

      setSaveStatus("saved");

      setSaveMessage(
        "Saved to Reports"
      );
    } catch (error) {
      console.error(
        "SAVE REPORT ERROR",
        error
      );

      setSaveStatus("error");

      setSaveMessage(
        error?.message ||
          "Report save failed"
      );
    }
  }

  /* ========================================================
     PRINT
  ======================================================== */

  function printReport() {
    window.print();
  }

  /* ========================================================
     NEW PATIENT
  ======================================================== */

  function newPatient() {
    const ok =
      window.confirm(
        "Current report clear karke New Patient start karein?"
      );

    if (!ok) return;

    [
      "nidanPatient",
      "nidanSelectedTests",
      "nidanResults",
      "nidanCurrentReportNo",
    ].forEach((key) =>
      localStorage.removeItem(
        key
      )
    );

    router.push("/patients");
  }

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <>
      <main className="reportApp">

        {/* ==================================================
            TOOLBAR
        ================================================== */}

        <div className="reportToolbar">

          <div className="toolbarLeft">

            <div className="toolbarIcon">
              N
            </div>

            <div>
              <strong>
                Final Laboratory Report
              </strong>

              <small>
                Premium A4 Report Preview
              </small>

              {reportNo && (
                <small>
                  Report No: {reportNo}
                </small>
              )}

              {saveStatus ===
                "saving" && (
                <small className="saving">
                  ● Saving...
                </small>
              )}

              {saveStatus ===
                "saved" && (
                <small className="saved">
                  ✓ Saved to Reports
                </small>
              )}

              {saveStatus ===
                "error" && (
                <small className="saveError">
                  ⚠ {saveMessage}
                </small>
              )}
            </div>
          </div>

          <div className="toolbarButtons">

            <button
              className="editBtn"
              onClick={() =>
                router.push(
                  "/results"
                )
              }
            >
              ← Edit Results
            </button>

            <button
              className="printBtn"
              onClick={
                printReport
              }
            >
              🖨 Print / Save PDF
            </button>

            <button
              className="newBtn"
              onClick={
                newPatient
              }
            >
              + New Patient
            </button>

          </div>

        </div>

        {/* ==================================================
            STATUS BAR
        ================================================== */}

        <div className="statusBar">
          <span>
            ✓ Premium Report Layout
          </span>

          <span>
            ✓ A4 Ready
          </span>

          <span>
            ✓ Letterhead Disabled
          </span>

          <span>
            ✓ Print Optimized
          </span>
        </div>

        {/* ==================================================
            PAGES
        ================================================== */}

        <div className="pagesContainer">

          {pages.map(
            (
              pageTests,
              pageIndex
            ) => (
              <ReportSheet
                key={
                  pageIndex
                }
                pageTests={
                  pageTests
                }
                pageIndex={
                  pageIndex
                }
                totalPages={
                  pages.length
                }
                patient={
                  patient
                }
                reportDate={
                  reportDate
                }
                reportNo={
                  reportNo
                }
                labSettings={
                  labSettings
                }
              />
            )
          )}

        </div>
      </main>

      {/* ====================================================
          GLOBAL CSS
      ==================================================== */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #edf2f7;
          color: #172033;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        body {
          overflow-x: hidden;
        }

        /* ==================================================
           APP
        ================================================== */

        .reportApp {
          min-height: 100vh;
          padding: 12px;
          background:
            linear-gradient(
              180deg,
              #eef3f8 0%,
              #e7edf4 100%
            );
        }

        /* ==================================================
           TOOLBAR
        ================================================== */

        .reportToolbar {
          max-width: 1180px;
          margin: 0 auto 7px;

          min-height: 58px;

          padding:
            8px 12px;

          background: #ffffff;

          border:
            1px solid #d9e2ec;

          border-radius: 10px;

          display: flex;

          align-items: center;

          justify-content:
            space-between;

          gap: 12px;

          box-shadow:
            0 4px 15px
            rgba(
              15,
              23,
              42,
              .07
            );
        }

        .toolbarLeft {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toolbarIcon {
          width: 31px;
          height: 31px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 8px;

          background:
            linear-gradient(
              135deg,
              #0f766e,
              #0e7490
            );

          color: #ffffff;

          font-size: 15px;
          font-weight: 900;
        }

        .toolbarLeft strong {
          display: block;
          font-size: 12px;
          color: #111827;
        }

        .toolbarLeft small {
          display: block;
          margin-top: 1px;
          font-size: 7px;
          color: #64748b;
        }

        .saving {
          color: #b45309 !important;
          font-weight: 800;
        }

        .saved {
          color: #15803d !important;
          font-weight: 800;
        }

        .saveError {
          color: #dc2626 !important;
          font-weight: 800;
        }

        .toolbarButtons {
          display: flex;
          gap: 6px;
        }

        .toolbarButtons button {
          min-height: 32px;

          padding:
            6px 11px;

          border-radius: 6px;

          font-size: 8px;
          font-weight: 800;

          cursor: pointer;

          background: #ffffff;
        }

        .editBtn {
          border:
            1px solid #cbd5e1;

          color: #334155;
        }

        .printBtn {
          border:
            1px solid #0f766e;

          color: #ffffff;

          background:
            linear-gradient(
              135deg,
              #0f766e,
              #0e7490
            ) !important;
        }

        .newBtn {
          border:
            1px solid #fecaca;

          color: #dc2626;
        }

        /* ==================================================
           STATUS
        ================================================== */

        .statusBar {
          max-width: 1180px;
          margin: 0 auto 10px;

          min-height: 25px;

          display: flex;
          justify-content: center;
          align-items: center;

          gap: 25px;

          padding: 5px 10px;

          border:
            1px solid #b7ead5;

          border-radius: 6px;

          background:
            #effcf6;

          color: #087f5b;

          font-size: 7px;
          font-weight: 800;
        }

        /* ==================================================
           PAGES
        ================================================== */

        .pagesContainer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
        }

        /* ==================================================
           A4
        ================================================== */

        .reportSheet {
          position: relative;

          width:
            min(
              210mm,
              calc(100vw - 24px)
            );

          height: 297mm;

          background: #ffffff;

          overflow: hidden;

          box-shadow:
            0 12px 35px
            rgba(
              15,
              23,
              42,
              .16
            );
        }

        /* ==================================================
           HEADER
        ================================================== */

        .reportHeader {
          position: absolute;

          top: 0;
          left: 0;
          right: 0;

          height: 29mm;

          padding:
            7mm 9mm 0;

          background:
            linear-gradient(
              180deg,
              #ffffff 0%,
              #fbfdff 100%
            );

          border-bottom:
            1px solid #d7e1ea;

          z-index: 5;
        }

        .headerTop {
          display: flex;
          justify-content:
            space-between;

          align-items: center;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .brandMark {
          width: 13mm;
          height: 13mm;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #ffffff;

          font-size: 17px;
          font-weight: 900;

          background:
            linear-gradient(
              135deg,
              #0f766e,
              #155e75
            );

          border:
            2px solid #d7f3ee;

          box-shadow:
            0 2px 6px
            rgba(
              15,
              118,
              110,
              .18
            );
        }

        .brandText h1 {
          margin: 0;

          font-size: 19px;

          line-height: 1;

          font-weight: 900;

          letter-spacing:
            .4px;

          color: #123b4a;
        }

        .brandText p {
          margin:
            3px 0 0;

          font-size: 6.5px;

          font-weight: 700;

          letter-spacing:
            .3px;

          color: #64748b;
        }

        .reportLabel {
          text-align: right;
        }

        .reportLabel strong {
          display: block;

          font-size: 7px;

          letter-spacing:
            1px;

          color: #0f766e;
        }

        .reportLabel span {
          display: block;

          margin-top: 2px;

          font-size: 6px;

          color: #64748b;
        }

        .headerLine {
          height: 1.5px;

          margin-top: 5mm;

          background:
            linear-gradient(
              90deg,
              #0f766e 0%,
              #0e7490 65%,
              #dce8ef 100%
            );
        }

        /* ==================================================
           CONTENT
        ================================================== */

        .reportContent {
          position: absolute;

          left: 8.5mm;
          right: 8.5mm;

          top: 32mm;
          bottom: 17mm;

          overflow: hidden;

          z-index: 4;
        }

        /* ==================================================
           PATIENT CARD
        ================================================== */

        .patientCard {
          width: 100%;

          border:
            1px solid #ccd8e3;

          border-radius: 5px;

          overflow: hidden;

          background: #ffffff;

          box-shadow:
            0 2px 5px
            rgba(
              15,
              23,
              42,
              .04
            );

          margin-bottom: 4mm;
        }

        .patientCardTitle {
          height: 6mm;

          display: flex;

          align-items: center;

          padding:
            0 3mm;

          background:
            linear-gradient(
              90deg,
              #f0fdfa,
              #f8fafc
            );

          border-bottom:
            1px solid #d7e3ea;

          font-size: 6px;

          font-weight: 900;

          letter-spacing:
            .7px;

          color: #0f766e;
        }

        .patientGrid {
          display: grid;

          grid-template-columns:
            1.35fr
            1fr
            1fr;
        }

        .patientColumn {
          min-width: 0;

          padding:
            2.5mm 3mm;

          border-right:
            1px solid #e1e8ef;
        }

        .patientColumn:last-child {
          border-right: 0;
        }

        .patientRow {
          display: flex;

          gap: 3px;

          margin-bottom: 1.6mm;

          font-size: 6.5px;

          line-height: 1.2;
        }

        .patientRow:last-child {
          margin-bottom: 0;
        }

        .patientLabel {
          min-width: 25mm;

          font-weight: 800;

          color: #475569;
        }

        .patientValue {
          min-width: 0;

          font-weight: 600;

          color: #172033;

          overflow-wrap:
            anywhere;
        }

        /* ==================================================
           TEST AREA
        ================================================== */

        .testArea {
          display: flex;

          flex-direction: column;

          gap: 3.5mm;

          overflow: hidden;
        }

        .testBlock {
          width: 100%;

          break-inside: avoid;
          page-break-inside: avoid;
        }

        .testHeading {
          display: flex;

          align-items: center;

          gap: 5px;

          margin-bottom: 1.5mm;
        }

        .testHeadingLine {
          flex: 1;

          height: 1px;

          background:
            #dce5ec;
        }

        .testHeadingCenter {
          min-width: 45mm;

          text-align: center;
        }

        .testDepartment {
          font-size: 5.5px;

          font-weight: 900;

          letter-spacing:
            1px;

          color: #0f766e;

          text-transform:
            uppercase;
        }

        .testName {
          margin-top: 1px;

          font-size: 9px;

          font-weight: 900;

          color: #182230;

          line-height: 1.15;
        }

        /* ==================================================
           TABLE
        ================================================== */

        .reportTable {
          width: 100%;

          border-collapse:
            separate;

          border-spacing: 0;

          table-layout: fixed;

          overflow: hidden;

          border:
            1px solid #cbd6e0;

          border-radius: 4px;

          background: #ffffff;
        }

        .reportTable th {
          height: 6mm;

          padding:
            1.2mm 1.3mm;

          border-right:
            1px solid #d1dbe4;

          border-bottom:
            1px solid #c6d2dc;

          background:
            #edf4f7;

          color: #34495e;

          font-size: 6px;

          font-weight: 900;

          text-align: center;

          letter-spacing:
            .2px;

          line-height: 1.1;
        }

        .reportTable th:last-child {
          border-right: 0;
        }

        .reportTable td {
          min-height: 5mm;

          padding:
            1.15mm 1.4mm;

          border-right:
            1px solid #dce3e9;

          border-bottom:
            1px solid #e0e6eb;

          background: #ffffff;

          color: #263341;

          font-size: 6.7px;

          line-height: 1.2;

          vertical-align:
            middle;

          overflow-wrap:
            anywhere;
        }

        .reportTable tr:last-child td {
          border-bottom: 0;
        }

        .reportTable td:last-child {
          border-right: 0;
        }

        .investigationCol {
          width: 31%;
        }

        .flagCol {
          width: 8%;
        }

        .resultCol {
          width: 17%;
        }

        .referenceCol {
          width: 29%;
        }

        .unitCol {
          width: 15%;
        }

        .resultCell {
          text-align: center;

          font-weight: 800;
        }

        .normalResult {
          color: #172033;
        }

        .abnormalResult {
          color: #c62828 !important;

          font-weight: 900;
        }

        .flagCell {
          text-align: center;
        }

        .flagBadge {
          display: inline-flex;

          width: 15px;
          height: 13px;

          align-items: center;
          justify-content: center;

          border-radius: 3px;

          font-size: 6px;

          font-weight: 900;
        }

        .flagHigh {
          color: #b91c1c;

          background: #fee2e2;

          border:
            1px solid #fecaca;
        }

        .flagLow {
          color: #1d4ed8;

          background: #dbeafe;

          border:
            1px solid #bfdbfe;
        }

        .center {
          text-align: center;
        }

        /* ==================================================
           SIGNATURE
        ================================================== */

        .signatureArea {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 30mm;

          margin-top: 7mm;

          break-inside: avoid;
          page-break-inside: avoid;
        }

        .signatureBox {
          text-align: center;
        }

        .signatureLine {
          height: 7mm;

          border-bottom:
            1px solid #6b7280;

          margin-bottom: 2mm;
        }

        .signatureBox strong {
          display: block;

          font-size: 6.5px;

          color: #263341;
        }

        .signatureBox span {
          display: block;

          margin-top: 1px;

          font-size: 5.5px;

          color: #64748b;
        }

        /* ==================================================
           NOTE
        ================================================== */

        .reportNote {
          margin-top: 3mm;

          padding:
            2mm 2.5mm;

          border:
            1px solid #dce5ec;

          border-radius: 3px;

          background:
            #f8fafc;

          color: #64748b;

          font-size: 5.2px;

          line-height: 1.35;
        }

        .reportNote strong {
          color: #334155;
        }

        /* ==================================================
           FOOTER
        ================================================== */

        .reportFooter {
          position: absolute;

          left: 0;
          right: 0;
          bottom: 0;

          height: 15mm;

          display: flex;

          flex-direction:
            column;

          justify-content:
            center;

          align-items:
            center;

          background:
            linear-gradient(
              180deg,
              #f8fafc,
              #f1f5f9
            );

          border-top:
            1px solid #d9e2ea;

          z-index: 6;
        }

        .footerBrand {
          font-size: 7px;

          font-weight: 900;

          letter-spacing:
            .6px;

          color: #0f766e;
        }

        .footerInfo {
          margin-top: 1px;

          font-size: 5.2px;

          color: #64748b;

          text-align: center;
        }

        .pageNo {
          position: absolute;

          right: 7mm;
          bottom: 5mm;

          font-size: 5.5px;

          color: #64748b;
        }

        /* ==================================================
           MOBILE
        ================================================== */

        @media (
          max-width: 700px
        ) {

          .reportApp {
            padding: 5px;
          }

          .reportToolbar {
            flex-direction:
              column;

            align-items:
              stretch;
          }

          .toolbarButtons {
            display: grid;

            grid-template-columns:
              1fr 1fr;
          }

          .toolbarButtons button {
            width: 100%;
          }

          .printBtn {
            grid-column:
              span 2;
          }

          .statusBar {
            gap: 8px;

            flex-wrap: wrap;

            font-size: 6px;
          }

          .reportSheet {
            width:
              calc(100vw - 10px);

            height:
              calc(
                (100vw - 10px)
                * 1.4142857
              );
          }

          .brandMark {
            width: 10mm;
            height: 10mm;
            font-size: 12px;
          }

          .brandText h1 {
            font-size: 12px;
          }

          .brandText p {
            font-size: 4.5px;
          }

          .reportLabel strong {
            font-size: 5px;
          }

          .reportLabel span {
            font-size: 4.5px;
          }

          .patientRow {
            font-size: 4.5px;
          }

          .patientLabel {
            min-width: 18mm;
          }

          .patientCardTitle {
            font-size: 4.5px;
          }

          .testDepartment {
            font-size: 4px;
          }

          .testName {
            font-size: 6.5px;
          }

          .reportTable th {
            font-size: 4px;
          }

          .reportTable td {
            font-size: 4.6px;
          }

          .signatureBox strong {
            font-size: 4.8px;
          }

          .signatureBox span {
            font-size: 4px;
          }

          .reportNote {
            font-size: 3.8px;
          }

          .footerBrand {
            font-size: 5px;
          }

          .footerInfo {
            font-size: 3.7px;
          }
        }

        /* ==================================================
           PRINT
        ================================================== */

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

            background:
              #ffffff !important;
          }

          body {
            overflow: visible !important;

            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;
          }

          .reportApp {
            width: 210mm !important;

            padding: 0 !important;
            margin: 0 !important;

            background:
              #ffffff !important;
          }

          .reportToolbar,
          .statusBar {
            display: none !important;
          }

          .pagesContainer {
            width: 210mm !important;

            display: block !important;

            margin: 0 !important;
            padding: 0 !important;
          }

          .reportSheet {
            width: 210mm !important;
            height: 297mm !important;

            min-height: 297mm !important;
            max-height: 297mm !important;

            margin: 0 !important;

            box-shadow: none !important;

            overflow: hidden !important;

            page-break-after: always;

            break-after: page;
          }

          .reportSheet:last-child {
            page-break-after: auto;

            break-after: auto;
          }

          .reportHeader,
          .reportFooter,
          .patientCard,
          .reportTable,
          .reportTable th,
          .reportTable td,
          .reportNote {
            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;
          }

          .testBlock,
          .patientCard,
          .signatureArea,
          .reportNote {
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

/* ============================================================
   REPORT SHEET
============================================================ */

function ReportSheet({
  pageTests,
  pageIndex,
  totalPages,
  patient,
  reportDate,
  reportNo,
  labSettings,
}) {
  const patientId =
    patient?.patientId ||
    patient?.id ||
    "-";

  const patientName =
    patient?.name ||
    patient?.patientName ||
    "-";

  const age =
    patient?.age ??
    "-";

  const gender =
    patient?.gender ||
    patient?.sex ||
    "-";

  const mobile =
    patient?.mobile ||
    patient?.mobileNumber ||
    "-";

  const doctor =
    patient?.doctor ||
    patient?.refDoctor ||
    patient?.referredBy ||
    labSettings?.doctorName ||
    "-";

  const sampleDate =
    patient?.sampleDate ||
    reportDate ||
    "-";

  const labName =
    labSettings?.labName ||
    "NIDAN PATHOLOGY LAB";

  const pageTestsSafe =
    Array.isArray(pageTests)
      ? pageTests
      : [];

  return (
    <div className="reportSheet">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="reportHeader">

        <div className="headerTop">

          <div className="brand">

            <div className="brandMark">
              N
            </div>

            <div className="brandText">

              <h1>
                {labName}
              </h1>

              <p>
                DIAGNOSTIC & PATHOLOGY LABORATORY
              </p>

            </div>

          </div>

          <div className="reportLabel">

            <strong>
              LABORATORY REPORT
            </strong>

            <span>
              Computerised Diagnostic Report
            </span>

          </div>

        </div>

        <div className="headerLine" />

      </header>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="reportContent">

        {/* ==================================================
            PATIENT INFORMATION
        ================================================== */}

        <section className="patientCard">

          <div className="patientCardTitle">
            PATIENT INFORMATION
          </div>

          <div className="patientGrid">

            {/* COLUMN 1 */}

            <div className="patientColumn">

              <div className="patientRow">
                <span className="patientLabel">
                  Patient Name
                </span>

                <span className="patientValue">
                  {patientName}
                </span>
              </div>

              <div className="patientRow">
                <span className="patientLabel">
                  Age / Sex
                </span>

                <span className="patientValue">
                  {age} Years / {gender}
                </span>
              </div>

              <div className="patientRow">
                <span className="patientLabel">
                  Referred By
                </span>

                <span className="patientValue">
                  {doctor}
                </span>
              </div>

              <div className="patientRow">
                <span className="patientLabel">
                  Sample ID
                </span>

                <span className="patientValue">
                  {patientId}
                </span>
              </div>

            </div>

            {/* COLUMN 2 */}

            <div className="patientColumn">

              <div className="patientRow">
                <span className="patientLabel">
                  Patient ID
                </span>

                <span className="patientValue">
                  {patientId}
                </span>
              </div>

              <div className="patientRow">
                <span className="patientLabel">
                  Mobile
                </span>

                <span className="patientValue">
                  {mobile}
                </span>
              </div>

              <div className="patientRow">
                <span className="patientLabel">
                  Laboratory
                </span>

                <span className="patientValue">
                  {labName}
                </span>
              </div>

              <div className="patientRow">
                <span className="patientLabel">
                  Report No
                </span>

                <span className="patientValue">
                  {reportNo || "-"}
                </span>
              </div>

            </div>

            {/* COLUMN 3 */}

            <div className="patientColumn">

              <div className="patientRow">
                <span className="patientLabel">
                  Collection
                </span>

                <span className="patientValue">
                  {sampleDate}
                </span>
              </div>

              <div className="patientRow">
                <span className="patientLabel">
                  Report Date
                </span>

                <span className="patientValue">
                  {reportDate || "-"}
                </span>
              </div>

              <div className="patientRow">
                <span className="patientLabel">
                  Status
                </span>

                <span
                  className="patientValue"
                  style={{
                    color:
                      "#15803d",
                  }}
                >
                  FINAL
                </span>
              </div>

            </div>

          </div>

        </section>

        {/* ==================================================
            TESTS
        ================================================== */}

        <div className="testArea">

          {pageTestsSafe.map(
            (
              test,
              testIndex
            ) => {

              const showFlag =
                labSettings?.showFlag !==
                false;

              const showReference =
                labSettings?.showReferenceRange !==
                false;

              return (
                <section
                  className="testBlock"
                  key={
                    test.id ||
                    testIndex
                  }
                >

                  <div className="testHeading">

                    <div className="testHeadingLine" />

                    <div className="testHeadingCenter">

                      <div className="testDepartment">
                        {String(
                          test.category ||
                            "PATHOLOGY"
                        ).toUpperCase()}
                      </div>

                      <div className="testName">
                        {test.name}
                      </div>

                    </div>

                    <div className="testHeadingLine" />

                  </div>

                  <table className="reportTable">

                    <colgroup>

                      <col className="investigationCol" />

                      {showFlag && (
                        <col className="flagCol" />
                      )}

                      <col className="resultCol" />

                      {showReference && (
                        <col className="referenceCol" />
                      )}

                      <col className="unitCol" />

                    </colgroup>

                    <thead>

                      <tr>

                        <th>
                          INVESTIGATION
                        </th>

                        {showFlag && (
                          <th>
                            FLAG
                          </th>
                        )}

                        <th>
                          RESULT
                        </th>

                        {showReference && (
                          <th>
                            REFERENCE RANGE
                          </th>
                        )}

                        <th>
                          UNIT
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {(
                        test.parameters ||
                        []
                      ).map(
                        (
                          parameter,
                          index
                        ) => {

                          const abnormal =
                            Boolean(
                              parameter.flag
                            );

                          const displayResult =
                            parameter.result ===
                              "" ||
                            parameter.result ===
                              null ||
                            parameter.result ===
                              undefined
                              ? "-"
                              : parameter.result;

                          return (
                            <tr
                              key={`${test.id}-${index}`}
                            >

                              <td>
                                {
                                  parameter.name
                                }
                              </td>

                              {showFlag && (
                                <td className="flagCell">

                                  {parameter.flag ? (
                                    <span
                                      className={`flagBadge ${
                                        parameter.flag ===
                                        "H"
                                          ? "flagHigh"
                                          : "flagLow"
                                      }`}
                                    >
                                      {
                                        parameter.flag
                                      }
                                    </span>
                                  ) : (
                                    ""
                                  )}

                                </td>
                              )}

                              <td
                                className={`resultCell ${
                                  abnormal
                                    ? "abnormalResult"
                                    : "normalResult"
                                }`}
                              >
                                {
                                  displayResult
                                }
                              </td>

                              {showReference && (
                                <td className="center">
                                  {
                                    parameter.referenceRange
                                  }
                                </td>
                              )}

                              <td className="center">
                                {
                                  parameter.unit ||
                                  "-"
                                }
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
          )}

        </div>

        {/* ==================================================
            SIGNATURE
        ================================================== */}

        <section className="signatureArea">

          <div className="signatureBox">

            <div className="signatureLine" />

            <strong>
              Lab Technician
            </strong>

            <span>
              {labName}
            </span>

          </div>

          <div className="signatureBox">

            <div className="signatureLine" />

            <strong>
              Authorized Signatory
            </strong>

            <span>
              Signature & Seal
            </span>

          </div>

        </section>

        {/* ==================================================
            NOTE
        ================================================== */}

        <div className="reportNote">

          <strong>
            Note:
          </strong>{" "}
          Reference intervals may vary according
          to laboratory method, age, sex and
          clinical circumstances. Results should
          be interpreted along with relevant
          clinical findings.

        </div>

      </div>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer className="reportFooter">

        <div className="footerBrand">
          {labName}
        </div>

        <div className="footerInfo">
          {labSettings?.labAddress ||
            "Diagnostic & Pathology Laboratory"}
          {labSettings?.phone
            ? `  •  ${labSettings.phone}`
            : ""}
          {labSettings?.email
            ? `  •  ${labSettings.email}`
            : ""}
        </div>

        <div className="pageNo">
          Page {pageIndex + 1} of{" "}
          {totalPages}
        </div>

      </footer>

    </div>
  );
}
