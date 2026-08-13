"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

/*
==============================================================
 NIDAN PATHOLOGY LAB
 NEW PROFESSIONAL REPORT ENGINE
 --------------------------------------------------------------
 ✓ NO LETTERHEAD
 ✓ Modern A4 Laboratory Report
 ✓ Mobile Responsive Preview
 ✓ Print / Save PDF
 ✓ Multi-page
 ✓ Patient information
 ✓ Test-wise sections
 ✓ H / L flags
 ✓ Reference ranges
 ✓ Supabase auto-save
 ✓ Existing localStorage workflow compatible
==============================================================
*/

const DEFAULT_SETTINGS = {
  labName: "NIDAN PATHOLOGY LAB",
  labAddress:
    "Pathology & Diagnostic Laboratory",
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

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    loadReportData();
  }, []);

  function readJSON(keys) {
    for (const key of keys) {
      try {
        const value =
          localStorage.getItem(key);

        if (!value) continue;

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

      const savedReportNo =
        localStorage.getItem(
          "nidanCurrentReportNo"
        );

      if (savedReportNo) {
        setReportNo(savedReportNo);
      }
    } catch (error) {
      console.error(
        "REPORT LOAD ERROR:",
        error
      );
    }
  }

  /* =========================================================
     HELPERS
  ========================================================= */

  function normalizeName(value = "") {
    return String(value)
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

  /* =========================================================
     REFERENCE RANGE DATABASE
  ========================================================= */

  function getDefaultReference(
    parameterName
  ) {
    const name =
      normalizeName(parameterName);

    const gender = getGender();

    const ranges = {
      hemoglobin:
        gender === "female"
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
            },

      "total leucocyte count": {
        min: 4000,
        max: 11000,
        unit: "/cumm",
        range: "4,000 - 11,000",
      },

      "total leukocyte count": {
        min: 4000,
        max: 11000,
        unit: "/cumm",
        range: "4,000 - 11,000",
      },

      neutrophils: {
        min: 40,
        max: 75,
        unit: "%",
        range: "40 - 75",
      },

      lymphocytes: {
        min: 20,
        max: 40,
        unit: "%",
        range: "20 - 40",
      },

      eosinophils: {
        min: 1,
        max: 6,
        unit: "%",
        range: "1 - 6",
      },

      monocytes: {
        min: 1,
        max: 10,
        unit: "%",
        range: "1 - 10",
      },

      basophils: {
        min: 0,
        max: 1,
        unit: "%",
        range: "0 - 1",
      },

      "rbc count":
        gender === "female"
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
            },

      "pcv hematocrit":
        gender === "female"
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
            },

      mcv: {
        min: 80,
        max: 100,
        unit: "fL",
        range: "80 - 100",
      },

      mch: {
        min: 27,
        max: 32,
        unit: "pg",
        range: "27 - 32",
      },

      mchc: {
        min: 32,
        max: 36,
        unit: "g/dL",
        range: "32 - 36",
      },

      "rdw cv": {
        min: 11.5,
        max: 14.5,
        unit: "%",
        range: "11.5 - 14.5",
      },

      "platelet count": {
        min: 1.5,
        max: 4.5,
        unit: "Lac/cumm",
        range: "1.5 - 4.5",
      },

      platelets: {
        min: 1.5,
        max: 4.5,
        unit: "Lac/cumm",
        range: "1.5 - 4.5",
      },

      mpv: {
        min: 7.5,
        max: 11.5,
        unit: "fL",
        range: "7.5 - 11.5",
      },

      pdw: {
        min: 9,
        max: 17,
        unit: "%",
        range: "9 - 17",
      },

      pct: {
        min: 0.15,
        max: 0.4,
        unit: "%",
        range: "0.15 - 0.40",
      },

      esr: {
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
      },

      fbs: {
        min: 70,
        max: 99,
        unit: "mg/dL",
        range: "70 - 99",
      },

      "fasting blood sugar": {
        min: 70,
        max: 99,
        unit: "mg/dL",
        range: "70 - 99",
      },

      ppbs: {
        min: 70,
        max: 140,
        unit: "mg/dL",
        range: "70 - 140",
      },

      "post prandial blood sugar": {
        min: 70,
        max: 140,
        unit: "mg/dL",
        range: "70 - 140",
      },

      rbs: {
        min: 70,
        max: 140,
        unit: "mg/dL",
        range: "70 - 140",
      },

      "random blood sugar": {
        min: 70,
        max: 140,
        unit: "mg/dL",
        range: "70 - 140",
      },

      urea: {
        min: 15,
        max: 40,
        unit: "mg/dL",
        range: "15 - 40",
      },

      "blood urea": {
        min: 15,
        max: 40,
        unit: "mg/dL",
        range: "15 - 40",
      },

      creatinine: {
        min: 0.6,
        max: 1.3,
        unit: "mg/dL",
        range: "0.6 - 1.3",
      },

      "serum creatinine": {
        min: 0.6,
        max: 1.3,
        unit: "mg/dL",
        range: "0.6 - 1.3",
      },

      "uric acid":
        gender === "female"
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
            },

      sodium: {
        min: 135,
        max: 145,
        unit: "mEq/L",
        range: "135 - 145",
      },

      potassium: {
        min: 3.5,
        max: 5.1,
        unit: "mEq/L",
        range: "3.5 - 5.1",
      },

      "total bilirubin": {
        min: 0.2,
        max: 1.2,
        unit: "mg/dL",
        range: "0.2 - 1.2",
      },

      "direct bilirubin": {
        min: 0,
        max: 0.3,
        unit: "mg/dL",
        range: "0 - 0.3",
      },

      ast: {
        min: 0,
        max: 40,
        unit: "U/L",
        range: "Up to 40",
      },

      alt: {
        min: 0,
        max: 40,
        unit: "U/L",
        range: "Up to 40",
      },

      "total cholesterol": {
        min: 0,
        max: 200,
        unit: "mg/dL",
        range: "< 200",
      },

      triglycerides: {
        min: 0,
        max: 150,
        unit: "mg/dL",
        range: "< 150",
      },

      hdl: {
        min: 40,
        max: null,
        unit: "mg/dL",
        range: "> 40",
      },

      ldl: {
        min: 0,
        max: 100,
        unit: "mg/dL",
        range: "< 100",
      },

      tsh: {
        min: 0.4,
        max: 4,
        unit: "µIU/mL",
        range: "0.40 - 4.00",
      },

      t3: {
        min: 80,
        max: 200,
        unit: "ng/dL",
        range: "80 - 200",
      },

      t4: {
        min: 5,
        max: 12,
        unit: "µg/dL",
        range: "5 - 12",
      },
    };

    if (ranges[name]) {
      return ranges[name];
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
      name.includes("pcv") ||
      name.includes("hematocrit") ||
      name.includes("haematocrit")
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

    if (
      name.includes("wbc") ||
      name.includes(
        "total leucocyte"
      ) ||
      name.includes(
        "total leukocyte"
      )
    ) {
      return {
        min: 4000,
        max: 11000,
        unit: "/cumm",
        range: "4,000 - 11,000",
      };
    }

    return null;
  }

  /* =========================================================
     PARAMETER RESOLUTION
  ========================================================= */

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
      parameter?.units ||
      "";

    let range =
      parameter?.range ||
      parameter?.referenceRange ||
      parameter?.reference ||
      "";

    if (
      min === undefined ||
      min === null ||
      min === ""
    ) {
      min =
        defaults?.min ?? null;
    }

    if (
      max === undefined ||
      max === null ||
      max === ""
    ) {
      max =
        defaults?.max ?? null;
    }

    if (!unit) {
      unit =
        defaults?.unit || "";
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

    if (
      Number.isNaN(numeric)
    ) {
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

  /* =========================================================
     BUILD REPORT DATA
  ========================================================= */

  function buildReportTests() {
    if (
      !Array.isArray(
        selectedTests
      )
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
                      results?.[key] ??
                      "";

                    const resolved =
                      resolveParameter(
                        parameter
                      );

                    return {
                      name,

                      result: value,

                      unit:
                        resolved.unit ||
                        "-",

                      referenceRange:
                        resolved.range ||
                        "-",

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
      () =>
        buildReportTests(),
      [
        selectedTests,
        results,
        patient?.gender,
        patient?.sex,
        patient?.age,
      ]
    );

  /* =========================================================
     SMART PAGINATION
  ========================================================= */

  function paginateTests(tests) {
    if (!tests.length) {
      return [[]];
    }

    /*
      Approximately 28-30 normal rows
      per A4 page.
    */

    const maxRows = 25;

    const pages = [];
    let current = [];
    let rowsUsed = 0;

    for (const test of tests) {
      const rows =
        Math.max(
          1,
          test.parameters?.length || 0
        );

      /*
        Test heading + table header
        consumes approximately 3 rows.
      */

      const cost = rows + 3;

      if (
        current.length &&
        rowsUsed + cost >
          maxRows
      ) {
        pages.push(current);
        current = [];
        rowsUsed = 0;
      }

      /*
        Very large test
      */

      if (
        rows > maxRows - 3
      ) {
        const chunks = [];

        const chunkSize =
          maxRows - 4;

        const params =
          test.parameters || [];

        for (
          let i = 0;
          i < params.length;
          i += chunkSize
        ) {
          chunks.push({
            ...test,
            id:
              `${test.id}-${i}`,
            parameters:
              params.slice(
                i,
                i + chunkSize
              ),
          });
        }

        for (
          let i = 0;
          i < chunks.length;
          i++
        ) {
          if (
            current.length
          ) {
            pages.push(current);
            current = [];
            rowsUsed = 0;
          }

          if (
            i <
            chunks.length - 1
          ) {
            pages.push([
              chunks[i],
            ]);
          } else {
            current = [
              chunks[i],
            ];

            rowsUsed =
              chunks[i]
                .parameters
                .length + 3;
          }
        }

        continue;
      }

      current.push(test);
      rowsUsed += cost;
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

  /* =========================================================
     AUTO SAVE
  ========================================================= */

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
      setTimeout(() => {
        saveReport();
      }, 900);

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
          `NIDAN-${Date.now()}`;

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

      const { data: existing } =
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
              status: "completed",
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
                status: "completed",
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
        "SAVE REPORT ERROR:",
        error
      );

      setSaveStatus("error");

      setSaveMessage(
        error?.message ||
          "Report save failed"
      );
    }
  }

  /* =========================================================
     BUTTONS
  ========================================================= */

  function printReport() {
    window.print();
  }

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
    ].forEach((key) => {
      localStorage.removeItem(key);
    });

    router.push("/patients");
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <main className="reportApp">

        {/* =================================================
            TOP TOOLBAR
        ================================================= */}

        <div className="toolbar">

          <div className="toolbarLeft">

            <div className="toolbarTitle">
              Final Laboratory Report
            </div>

            <div className="toolbarSub">
              NIDAN Pathology Lab •
              Professional A4 Report
            </div>

            {reportNo && (
              <div className="toolbarReport">
                Report No: {reportNo}
              </div>
            )}

            {saveStatus ===
              "saving" && (
              <div className="saveSaving">
                ● Saving...
              </div>
            )}

            {saveStatus ===
              "saved" && (
              <div className="saveSuccess">
                ✓ Saved to Reports
              </div>
            )}

            {saveStatus ===
              "error" && (
              <div className="saveError">
                ⚠ {saveMessage}
              </div>
            )}

          </div>

          <div className="toolbarActions">

            <button
              className="btn btnEdit"
              onClick={() =>
                router.push(
                  "/results"
                )
              }
            >
              ← Edit Results
            </button>

            <button
              className="btn btnPrint"
              onClick={
                printReport
              }
            >
              🖨 Print / Save PDF
            </button>

            <button
              className="btn btnNew"
              onClick={
                newPatient
              }
            >
              + New Patient
            </button>

          </div>

        </div>

        {/* =================================================
            STATUS BAR
        ================================================= */}

        <div className="designStatus">
          <span>
            ✓ Professional Report
          </span>

          <span>
            ✓ A4 Portrait
          </span>

          <span>
            ✓ Letterhead Disabled
          </span>

          <span>
            ✓ Print Optimized
          </span>
        </div>

        {/* =================================================
            REPORT PAGES
        ================================================= */}

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

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #eef2f7;
          color: #172033;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        body {
          overflow-x: hidden;
        }

        /* =====================================================
           APP
        ===================================================== */

        .reportApp {
          min-height: 100vh;
          padding: 14px;
          background:
            linear-gradient(
              180deg,
              #eef3f8 0%,
              #f5f7fa 100%
            );
        }

        /* =====================================================
           TOOLBAR
        ===================================================== */

        .toolbar {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto 8px;

          padding: 12px 15px;

          background: #ffffff;

          border: 1px solid #dce4ec;
          border-radius: 10px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 15px;

          box-shadow:
            0 4px 18px
            rgba(
              15,
              23,
              42,
              .07
            );
        }

        .toolbarLeft {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .toolbarTitle {
          font-size: 15px;
          font-weight: 900;
          color: #172033;
        }

        .toolbarSub {
          font-size: 8px;
          color: #718096;
        }

        .toolbarReport {
          font-size: 8px;
          font-weight: 700;
          color: #526174;
        }

        .saveSaving,
        .saveSuccess,
        .saveError {
          font-size: 8px;
          font-weight: 800;
        }

        .saveSaving {
          color: #b7791f;
        }

        .saveSuccess {
          color: #198754;
        }

        .saveError {
          color: #dc3545;
        }

        .toolbarActions {
          display: flex;
          gap: 6px;
        }

        .btn {
          border-radius: 6px;
          min-height: 34px;
          padding: 7px 12px;
          font-size: 9px;
          font-weight: 800;
          cursor: pointer;
          background: white;
        }

        .btnEdit {
          border:
            1px solid #ccd5df;
          color: #334155;
        }

        .btnPrint {
          border:
            1px solid #087f7d;
          color: white;
          background:
            linear-gradient(
              135deg,
              #087f7d,
              #0b9b91
            );
        }

        .btnNew {
          border:
            1px solid #f1b5b5;
          color: #c53030;
        }

        /* =====================================================
           STATUS
        ===================================================== */

        .designStatus {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto 12px;

          min-height: 28px;

          padding: 5px 12px;

          background: #ffffff;

          border:
            1px solid #dce4ec;

          border-radius: 7px;

          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;

          gap: 20px;

          font-size: 8px;
          font-weight: 800;

          color: #147d74;
        }

        /* =====================================================
           PAGE CONTAINER
        ===================================================== */

        .pagesContainer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        /* =====================================================
           A4 SHEET
        ===================================================== */

        .reportSheet {
          position: relative;

          width:
            min(
              210mm,
              calc(100vw - 28px)
            );

          min-height: 297mm;

          background: #ffffff;

          box-shadow:
            0 10px 35px
            rgba(
              15,
              23,
              42,
              .14
            );

          overflow: hidden;

          display: flex;
          flex-direction: column;
        }

        /* =====================================================
           HEADER
        ===================================================== */

        .labHeader {
          flex-shrink: 0;

          padding:
            9mm 10mm 5mm;

          background:
            linear-gradient(
              135deg,
              #ffffff 0%,
              #f7fbfb 100%
            );

          border-bottom:
            2px solid #087f7d;
        }

        .headerTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .brandArea {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .brandMark {
          width: 18mm;
          height: 18mm;

          flex-shrink: 0;

          border-radius: 50%;

          border:
            2px solid #087f7d;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            linear-gradient(
              135deg,
              #e9fffc,
              #ffffff
            );

          color: #087f7d;

          font-size: 8px;
          font-weight: 900;

          text-align: center;
          line-height: 1.1;
        }

        .labName {
          font-size: 21px;
          font-weight: 950;
          letter-spacing: .4px;
          color: #123b49;
        }

        .labTagline {
          margin-top: 2px;
          font-size: 8px;
          font-weight: 800;
          color: #58717a;
        }

        .headerRight {
          text-align: right;
          font-size: 7px;
          line-height: 1.5;
          color: #526174;
        }

        .headerRight strong {
          display: block;
          color: #087f7d;
          font-size: 8px;
        }

        .headerBottom {
          margin-top: 6px;

          display: flex;
          justify-content: space-between;

          gap: 10px;

          font-size: 6.5px;
          color: #526174;
        }

        .headerAccent {
          height: 3px;
          width: 100%;
          margin-top: 5px;

          background:
            linear-gradient(
              90deg,
              #087f7d 0%,
              #35b7ad 55%,
              #d8eeee 100%
            );
        }

        /* =====================================================
           REPORT TITLE
        ===================================================== */

        .reportHeading {
          flex-shrink: 0;

          padding:
            5mm 10mm 3mm;

          display: flex;
          align-items: center;
          justify-content: space-between;

          border-bottom:
            1px solid #e1e7ed;
        }

        .reportHeadingLeft {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .headingIcon {
          width: 9mm;
          height: 9mm;

          border-radius: 5px;

          background: #e7f7f5;
          color: #087f7d;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 11px;
          font-weight: 900;
        }

        .headingTitle {
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .5px;
          color: #172033;
        }

        .headingSub {
          margin-top: 1px;
          font-size: 6.5px;
          color: #718096;
        }

        .finalBadge {
          padding:
            2mm 4mm;

          border-radius: 20px;

          background: #e9f8ef;
          color: #178449;

          border:
            1px solid #b9e5c8;

          font-size: 6.5px;
          font-weight: 900;
        }

        /* =====================================================
           PATIENT CARD
        ===================================================== */

        .content {
          flex: 1;

          display: flex;
          flex-direction: column;

          padding:
            4mm 10mm 5mm;
        }

        .patientCard {
          flex-shrink: 0;

          border:
            1px solid #cbd6df;

          border-radius: 6px;

          overflow: hidden;

          background: #ffffff;

          box-shadow:
            0 2px 6px
            rgba(
              15,
              23,
              42,
              .035
            );
        }

        .patientCardTitle {
          padding:
            2.5mm 3mm;

          background:
            #f3f7f9;

          border-bottom:
            1px solid #dbe3e9;

          font-size: 6.5px;

          font-weight: 900;

          letter-spacing:
            .7px;

          color: #526174;

          text-transform: uppercase;
        }

        .patientGrid {
          display: grid;

          grid-template-columns:
            1.45fr
            1fr
            1fr;
        }

        .patientColumn {
          padding:
            3mm 3.5mm;

          border-right:
            1px solid #e0e6eb;

          min-width: 0;
        }

        .patientColumn:last-child {
          border-right: 0;
        }

        .patientItem {
          display: grid;

          grid-template-columns:
            32mm 1fr;

          gap: 2mm;

          margin-bottom:
            2mm;

          font-size: 6.7px;

          line-height: 1.25;
        }

        .patientItem:last-child {
          margin-bottom: 0;
        }

        .patientLabel {
          font-weight: 800;
          color: #687789;
        }

        .patientValue {
          font-weight: 800;
          color: #172033;

          min-width: 0;

          overflow-wrap:
            anywhere;
        }

        /* =====================================================
           TEST AREA
        ===================================================== */

        .testsArea {
          flex: 1;

          display: flex;
          flex-direction: column;

          gap: 4mm;

          margin-top: 5mm;
        }

        .testCard {
          break-inside: avoid;
          page-break-inside: avoid;

          border:
            1px solid #cfd8df;

          border-radius: 5px;

          overflow: hidden;

          background: #ffffff;
        }

        .testCardHeader {
          display: flex;

          align-items: center;
          justify-content: space-between;

          padding:
            2.5mm 3mm;

          background:
            linear-gradient(
              90deg,
              #edf8f7,
              #f7fafb
            );

          border-bottom:
            1px solid #d4e0e4;
        }

        .testCategory {
          font-size: 5.5px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #087f7d;
        }

        .testName {
          margin-top: 1px;

          font-size: 9px;
          font-weight: 950;

          color: #172033;
        }

        .testIndex {
          width: 7mm;
          height: 7mm;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #ffffff;

          border:
            1px solid #b8d9d6;

          color: #087f7d;

          font-size: 6px;
          font-weight: 900;
        }

        /* =====================================================
           TABLE
        ===================================================== */

        .reportTable {
          width: 100%;

          border-collapse: collapse;

          table-layout: fixed;
        }

        .reportTable th {
          padding:
            2.1mm 1.5mm;

          border-bottom:
            1px solid #c8d2da;

          background:
            #f7f9fb;

          color: #59687a;

          font-size: 5.7px;

          font-weight: 950;

          text-transform:
            uppercase;

          letter-spacing:
            .25px;

          text-align: center;
        }

        .reportTable td {
          padding:
            1.9mm 1.5mm;

          border-bottom:
            1px solid #e2e7ec;

          color: #263445;

          background: #ffffff;

          font-size: 6.8px;

          line-height: 1.2;

          vertical-align: middle;

          overflow-wrap:
            anywhere;
        }

        .reportTable tbody tr:last-child td {
          border-bottom: 0;
        }

        .investigation {
          width: 31%;
          text-align: left !important;
          font-weight: 700;
        }

        .flagColumn {
          width: 8%;
          text-align: center !important;
        }

        .resultColumn {
          width: 17%;
          text-align: center !important;
        }

        .referenceColumn {
          width: 29%;
          text-align: center !important;
        }

        .unitColumn {
          width: 15%;
          text-align: center !important;
        }

        .normalResult {
          text-align: center !important;
          font-weight: 850 !important;
          color: #172033 !important;
        }

        .abnormalResult {
          text-align: center !important;
          font-weight: 950 !important;
          color: #c62828 !important;
        }

        /* =====================================================
           FLAGS
        ===================================================== */

        .flagBadge {
          display: inline-flex;

          min-width: 14px;
          height: 13px;

          align-items: center;
          justify-content: center;

          border-radius: 4px;

          font-size: 6px;
          font-weight: 950;
        }

        .flagHigh {
          color: #b42318;
          background: #ffebe8;
          border:
            1px solid #f5c2bd;
        }

        .flagLow {
          color: #175cd3;
          background: #eff8ff;
          border:
            1px solid #b9dcff;
        }

        /* =====================================================
           EMPTY REPORT
        ===================================================== */

        .emptyReport {
          padding: 25mm 10mm;

          text-align: center;

          color: #718096;

          font-size: 10px;
        }

        /* =====================================================
           SIGNATURE AREA
        ===================================================== */

        .signatureSection {
          flex-shrink: 0;

          margin-top: 5mm;

          padding-top: 3mm;

          border-top:
            1px solid #d9e1e7;

          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 35mm;
        }

        .signatureBox {
          text-align: center;
        }

        .signatureSpace {
          height: 10mm;

          border-bottom:
            1px solid #65727e;

          margin-bottom: 2mm;
        }

        .signatureTitle {
          font-size: 6.5px;
          font-weight: 900;
          color: #263445;
        }

        .signatureSub {
          margin-top: 1px;

          font-size: 5.5px;
          color: #718096;
        }

        /* =====================================================
           NOTE
        ===================================================== */

        .reportNote {
          margin-top: 3mm;

          padding:
            2.5mm 3mm;

          border:
            1px solid #e0e6eb;

          border-radius: 4px;

          background:
            #f8fafc;

          font-size: 5.5px;

          line-height: 1.35;

          color: #667085;
        }

        .reportNote strong {
          color: #475467;
        }

        /* =====================================================
           FOOTER
        ===================================================== */

        .reportFooter {
          flex-shrink: 0;

          min-height: 17mm;

          padding:
            3mm 10mm;

          background:
            linear-gradient(
              180deg,
              #f7fafb,
              #edf2f5
            );

          border-top:
            1px solid #d7e0e5;

          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 10px;
        }

        .footerLab {
          font-size: 7px;
          font-weight: 950;
          color: #087f7d;
        }

        .footerText {
          margin-top: 1px;
          font-size: 5.2px;
          color: #718096;
        }

        .footerRight {
          text-align: right;

          font-size: 5.5px;

          color: #667085;
        }

        /* =====================================================
           PAGE NUMBER
        ===================================================== */

        .pageNumber {
          position: absolute;

          right: 7mm;
          bottom: 4mm;

          font-size: 5.5px;

          color: #667085;

          z-index: 20;
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (
          max-width: 700px
        ) {

          .reportApp {
            padding: 5px;
          }

          .toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .toolbarActions {
            display: grid;

            grid-template-columns:
              1fr 1fr;
          }

          .btnPrint {
            grid-column:
              span 2;
          }

          .designStatus {
            gap: 8px;
            font-size: 6px;
          }

          .reportSheet {
            width:
              calc(100vw - 10px);

            min-height:
              calc(
                (100vw - 10px)
                * 1.4142
              );
          }

          .labHeader {
            padding:
              5mm 6mm 3mm;
          }

          .brandMark {
            width: 12mm;
            height: 12mm;
            font-size: 5px;
          }

          .labName {
            font-size: 14px;
          }

          .labTagline {
            font-size: 5.5px;
          }

          .headerRight {
            font-size: 4.5px;
          }

          .headerRight strong {
            font-size: 5px;
          }

          .headerBottom {
            font-size: 4.5px;
          }

          .content {
            padding:
              3mm 5mm 4mm;
          }

          .patientGrid {
            grid-template-columns:
              1fr 1fr;
          }

          .patientColumn:nth-child(2) {
            border-right: 0;
          }

          .patientColumn:nth-child(3) {
            grid-column:
              span 2;

            border-top:
              1px solid #e0e6eb;

            border-right: 0;
          }

          .patientItem {
            grid-template-columns:
              22mm 1fr;

            font-size: 5px;
          }

          .patientCardTitle {
            font-size: 5px;
          }

          .testName {
            font-size: 7px;
          }

          .testCategory {
            font-size: 4.5px;
          }

          .reportTable th {
            font-size: 4.3px;
            padding:
              1.5mm 1mm;
          }

          .reportTable td {
            font-size: 5px;
            padding:
              1.4mm 1mm;
          }

          .signatureSection {
            gap: 15mm;
          }

          .reportNote {
            font-size: 4.2px;
          }

          .footerLab {
            font-size: 5px;
          }

          .footerText,
          .footerRight {
            font-size: 4px;
          }

        }

        /* =====================================================
           PRINT
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

            background:
              #ffffff !important;
          }

          body {
            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;

            overflow: visible !important;
          }

          .reportApp {
            width: 210mm !important;

            margin: 0 !important;
            padding: 0 !important;

            background:
              #ffffff !important;
          }

          .toolbar,
          .designStatus {
            display: none !important;
          }

          .pagesContainer {
            display: block;

            width: 210mm;

            margin: 0;
            padding: 0;
          }

          .reportSheet {
            width: 210mm !important;
            height: 297mm !important;

            min-height: 297mm !important;
            max-height: 297mm !important;

            margin: 0 !important;

            box-shadow: none !important;

            overflow: hidden !important;

            page-break-after:
              always;

            break-after:
              page;
          }

          .reportSheet:last-child {
            page-break-after:
              auto;

            break-after:
              auto;
          }

          .testCard,
          .patientCard,
          .signatureSection,
          .reportNote {
            break-inside:
              avoid !important;

            page-break-inside:
              avoid !important;
          }

          .reportTable {
            border-collapse:
              collapse !important;
          }

          .labHeader,
          .reportHeading,
          .patientCardTitle,
          .testCardHeader,
          .reportTable th,
          .reportFooter,
          .reportNote,
          .flagBadge {
            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;
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

  const tests =
    Array.isArray(pageTests)
      ? pageTests
      : [];

  return (
    <section className="reportSheet">

      {/* =====================================================
          PROFESSIONAL HEADER
      ===================================================== */}

      <header className="labHeader">

        <div className="headerTop">

          <div className="brandArea">

            <div className="brandMark">
              NIDAN
              <br />
              LAB
            </div>

            <div>
              <div className="labName">
                {labSettings?.labName ||
                  "NIDAN PATHOLOGY LAB"}
              </div>

              <div className="labTagline">
                Advanced Pathology & Diagnostic Laboratory
              </div>
            </div>

          </div>

          <div className="headerRight">

            <strong>
              LABORATORY REPORT
            </strong>

            {labSettings?.phone && (
              <div>
                Tel:{" "}
                {labSettings.phone}
              </div>
            )}

            {labSettings?.email && (
              <div>
                {labSettings.email}
              </div>
            )}

          </div>

        </div>

        <div className="headerBottom">

          <span>
            {labSettings?.labAddress ||
              "Accurate • Reliable • Professional Diagnostic Services"}
          </span>

          <span>
            Computerised Laboratory Report
          </span>

        </div>

        <div className="headerAccent" />

      </header>

      {/* =====================================================
          REPORT TITLE
      ===================================================== */}

      <div className="reportHeading">

        <div className="reportHeadingLeft">

          <div className="headingIcon">
            +
          </div>

          <div>
            <div className="headingTitle">
              FINAL LABORATORY REPORT
            </div>

            <div className="headingSub">
              Diagnostic investigation report
            </div>
          </div>

        </div>

        <div className="finalBadge">
          FINAL REPORT
        </div>

      </div>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="content">

        {/* ===================================================
            PATIENT CARD
        =================================================== */}

        <div className="patientCard">

          <div className="patientCardTitle">
            Patient & Specimen Information
          </div>

          <div className="patientGrid">

            {/* COLUMN 1 */}

            <div className="patientColumn">

              <div className="patientItem">
                <span className="patientLabel">
                  Patient Name
                </span>

                <span className="patientValue">
                  {patientName}
                </span>
              </div>

              <div className="patientItem">
                <span className="patientLabel">
                  Age / Sex
                </span>

                <span className="patientValue">
                  {age} Years /{" "}
                  {gender}
                </span>
              </div>

              <div className="patientItem">
                <span className="patientLabel">
                  Referred By
                </span>

                <span className="patientValue">
                  {doctor}
                </span>
              </div>

              <div className="patientItem">
                <span className="patientLabel">
                  Patient ID
                </span>

                <span className="patientValue">
                  {patientId}
                </span>
              </div>

            </div>

            {/* COLUMN 2 */}

            <div className="patientColumn">

              <div className="patientItem">
                <span className="patientLabel">
                  Mobile
                </span>

                <span className="patientValue">
                  {mobile}
                </span>
              </div>

              <div className="patientItem">
                <span className="patientLabel">
                  Sample ID
                </span>

                <span className="patientValue">
                  {patient?.sampleId ||
                    patientId}
                </span>
              </div>

              <div className="patientItem">
                <span className="patientLabel">
                  Collection
                </span>

                <span className="patientValue">
                  {sampleDate}
                </span>
              </div>

            </div>

            {/* COLUMN 3 */}

            <div className="patientColumn">

              <div className="patientItem">
                <span className="patientLabel">
                  Report No
                </span>

                <span className="patientValue">
                  {reportNo || "-"}
                </span>
              </div>

              <div className="patientItem">
                <span className="patientLabel">
                  Report Date
                </span>

                <span className="patientValue">
                  {reportDate || "-"}
                </span>
              </div>

              <div className="patientItem">
                <span className="patientLabel">
                  Laboratory
                </span>

                <span className="patientValue">
                  {labSettings?.labName ||
                    "NIDAN PATHOLOGY LAB"}
                </span>
              </div>

            </div>

          </div>

        </div>

        {/* ===================================================
            TESTS
        =================================================== */}

        <div className="testsArea">

          {tests.length === 0 ? (
            <div className="emptyReport">
              No laboratory investigation selected.
            </div>
          ) : (
            tests.map(
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
                    className="testCard"
                    key={
                      test.id ||
                      testIndex
                    }
                  >

                    <div className="testCardHeader">

                      <div>

                        <div className="testCategory">
                          {String(
                            test.category ||
                              "PATHOLOGY"
                          ).toUpperCase()}
                        </div>

                        <div className="testName">
                          {test.name}
                        </div>

                      </div>

                      <div className="testIndex">
                        {String(
                          testIndex + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </div>

                    </div>

                    <table className="reportTable">

                      <colgroup>

                        <col className="investigation" />

                        {showFlag && (
                          <col className="flagColumn" />
                        )}

                        <col className="resultColumn" />

                        {showReference && (
                          <col className="referenceColumn" />
                        )}

                        <col className="unitColumn" />

                      </colgroup>

                      <thead>

                        <tr>

                          <th className="investigation">
                            Investigation
                          </th>

                          {showFlag && (
                            <th className="flagColumn">
                              Flag
                            </th>
                          )}

                          <th className="resultColumn">
                            Result
                          </th>

                          {showReference && (
                            <th className="referenceColumn">
                              Reference Range
                            </th>
                          )}

                          <th className="unitColumn">
                            Unit
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

                            const value =
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
                                key={
                                  `${test.id}-${index}`
                                }
                              >

                                <td className="investigation">
                                  {
                                    parameter.name
                                  }
                                </td>

                                {showFlag && (
                                  <td className="flagColumn">

                                    {parameter.flag ? (
                                      <span
                                        className={
                                          parameter.flag ===
                                          "H"
                                            ? "flagBadge flagHigh"
                                            : "flagBadge flagLow"
                                        }
                                      >
                                        {
                                          parameter.flag
                                        }
                                      </span>
                                    ) : (
                                      "—"
                                    )}

                                  </td>
                                )}

                                <td
                                  className={
                                    abnormal
                                      ? "abnormalResult"
                                      : "normalResult"
                                  }
                                >
                                  {value}
                                </td>

                                {showReference && (
                                  <td className="referenceColumn">
                                    {
                                      parameter.referenceRange ||
                                      "-"
                                    }
                                  </td>
                                )}

                                <td className="unitColumn">
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
            )
          )}

        </div>

        {/* ===================================================
            SIGNATURE
        =================================================== */}

        <div className="signatureSection">

          <div className="signatureBox">

            <div className="signatureSpace" />

            <div className="signatureTitle">
              LAB TECHNICIAN
            </div>

            <div className="signatureSub">
              {labSettings?.labName ||
                "NIDAN PATHOLOGY LAB"}
            </div>

          </div>

          <div className="signatureBox">

            <div className="signatureSpace" />

            <div className="signatureTitle">
              AUTHORIZED SIGNATORY
            </div>

            <div className="signatureSub">
              Signature & Laboratory Seal
            </div>

          </div>

        </div>

        {/* ===================================================
            NOTE
        =================================================== */}

        <div className="reportNote">

          <strong>
            Important Note:
          </strong>{" "}
          Reference intervals are laboratory
          method dependent and may vary with
          age, sex and clinical circumstances.
          Results should be interpreted together
          with relevant clinical findings.

        </div>

      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="reportFooter">

        <div>

          <div className="footerLab">
            {labSettings?.labName ||
              "NIDAN PATHOLOGY LAB"}
          </div>

          <div className="footerText">
            Professional Pathology & Diagnostic Services
          </div>

        </div>

        <div className="footerRight">
          Computerised Report
          <br />
          Please retain this report for your records.
        </div>

      </footer>

      {/* =====================================================
          PAGE NUMBER
      ===================================================== */}

      {totalPages > 1 && (
        <div className="pageNumber">
          Page {pageIndex + 1} of{" "}
          {totalPages}
        </div>
      )}

    </section>
  );
}
