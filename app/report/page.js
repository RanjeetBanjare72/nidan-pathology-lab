"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

/* ============================================================
   NIDAN PATHOLOGY LAB
   ORIGINAL BUILT-IN A4 REPORT
   NO LETTERHEAD SYSTEM
============================================================ */

const LAB = {
  name: "NIDAN PATHOLOGY LAB",
  subtitle: "Diagnostic & Pathology Laboratory",
  address:
    "Laboratory Investigation & Diagnostic Services",
  phone: "",
  email: "",
};

/* ============================================================
   MAIN PAGE
============================================================ */

export default function ReportPage() {
  const router = useRouter();

  const [patient, setPatient] = useState({});
  const [selectedTests, setSelectedTests] =
    useState([]);
  const [results, setResults] = useState({});
  const [reportNo, setReportNo] =
    useState("");
  const [reportDate, setReportDate] =
    useState("");

  const [saveStatus, setSaveStatus] =
    useState("loading");

  const [saveMessage, setSaveMessage] =
    useState("");

  /* ==========================================================
     DATE
  ========================================================== */

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

  /* ==========================================================
     LOCAL STORAGE
  ========================================================== */

  function getJSON(keys) {
    if (
      typeof window === "undefined"
    ) {
      return null;
    }

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

  /* ==========================================================
     LOAD
  ========================================================== */

  useEffect(() => {
    loadReport();
  }, []);

  function loadReport() {
    try {
      const patientData = getJSON([
        "nidanPatient",
        "patient",
        "currentPatient",
      ]);

      const testsData = getJSON([
        "nidanSelectedTests",
        "selectedTests",
        "selected_tests",
      ]);

      const resultData = getJSON([
        "nidanResults",
        "results",
        "testResults",
      ]);

      setPatient(
        patientData || {}
      );

      setSelectedTests(
        Array.isArray(testsData)
          ? testsData
          : []
      );

      setResults(
        resultData || {}
      );

      setReportDate(
        formatDate(new Date())
      );

      let savedReportNo =
        localStorage.getItem(
          "nidanCurrentReportNo"
        );

      if (!savedReportNo) {
        savedReportNo =
          `RPT-${Date.now()}`;

        localStorage.setItem(
          "nidanCurrentReportNo",
          savedReportNo
        );
      }

      setReportNo(
        savedReportNo
      );
    } catch (error) {
      console.error(error);

      setSaveStatus("error");
      setSaveMessage(
        "Report data load failed"
      );
    }
  }

  /* ==========================================================
     NORMALIZE
  ========================================================== */

  function normalizeName(value = "") {
    return String(value)
      .toLowerCase()
      .replace(/[()]/g, "")
      .replace(/[._/-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* ==========================================================
     GENDER
  ========================================================== */

  function getGender() {
    const gender = String(
      patient?.gender ||
        patient?.sex ||
        ""
    )
      .toLowerCase()
      .trim();

    if (
      gender === "male" ||
      gender === "m" ||
      gender === "पुरुष"
    ) {
      return "male";
    }

    if (
      gender === "female" ||
      gender === "f" ||
      gender === "महिला"
    ) {
      return "female";
    }

    return "";
  }

  /* ==========================================================
     REFERENCE RANGES
  ========================================================== */

  function getReference(name) {
    const n =
      normalizeName(name);

    const gender =
      getGender();

    if (
      n === "hemoglobin" ||
      n === "haemoglobin" ||
      n === "hb"
    ) {
      return gender === "female"
        ? {
            min: 12,
            max: 15,
            range: "12 - 15",
            unit: "g/dL",
          }
        : {
            min: 13,
            max: 17,
            range: "13 - 17",
            unit: "g/dL",
          };
    }

    if (
      n === "total leucocyte count tlc" ||
      n === "total leucocyte count" ||
      n === "total leukocyte count" ||
      n === "tlc" ||
      n.includes("wbc")
    ) {
      return {
        min: 4000,
        max: 11000,
        range: "4000 - 11000",
        unit: "/cumm",
      };
    }

    if (
      n === "neutrophils" ||
      n === "neutrophil"
    ) {
      return {
        min: 40,
        max: 75,
        range: "40 - 75",
        unit: "%",
      };
    }

    if (
      n === "lymphocytes" ||
      n === "lymphocyte"
    ) {
      return {
        min: 20,
        max: 40,
        range: "20 - 40",
        unit: "%",
      };
    }

    if (
      n === "eosinophils" ||
      n === "eosinophil"
    ) {
      return {
        min: 1,
        max: 6,
        range: "1 - 6",
        unit: "%",
      };
    }

    if (
      n === "monocytes" ||
      n === "monocyte"
    ) {
      return {
        min: 1,
        max: 10,
        range: "1 - 10",
        unit: "%",
      };
    }

    if (
      n === "basophils" ||
      n === "basophil"
    ) {
      return {
        min: 0,
        max: 1,
        range: "0 - 1",
        unit: "%",
      };
    }

    if (
      n === "rbc count" ||
      n === "rbc"
    ) {
      return gender === "female"
        ? {
            min: 4,
            max: 5.5,
            range: "4.0 - 5.5",
            unit: "million/cumm",
          }
        : {
            min: 4.5,
            max: 6,
            range: "4.5 - 6.0",
            unit: "million/cumm",
          };
    }

    if (
      n.includes("pcv") ||
      n.includes("haematocrit") ||
      n.includes("hematocrit")
    ) {
      return gender === "female"
        ? {
            min: 36,
            max: 46,
            range: "36 - 46",
            unit: "%",
          }
        : {
            min: 40,
            max: 50,
            range: "40 - 50",
            unit: "%",
          };
    }

    if (n === "mcv") {
      return {
        min: 80,
        max: 100,
        range: "80 - 100",
        unit: "fL",
      };
    }

    if (n === "mch") {
      return {
        min: 27,
        max: 32,
        range: "27 - 32",
        unit: "pg",
      };
    }

    if (n === "mchc") {
      return {
        min: 32,
        max: 36,
        range: "32 - 36",
        unit: "g/dL",
      };
    }

    if (
      n === "rdw cv" ||
      n === "rdw-cv"
    ) {
      return {
        min: 11.5,
        max: 14.5,
        range: "11.5 - 14.5",
        unit: "%",
      };
    }

    if (
      n === "platelet count" ||
      n === "platelets"
    ) {
      return {
        min: 1.5,
        max: 4.5,
        range: "1.5 - 4.5",
        unit: "Lac/cumm",
      };
    }

    if (n === "mpv") {
      return {
        min: 7.5,
        max: 11.5,
        range: "7.5 - 11.5",
        unit: "fL",
      };
    }

    if (n === "pdw") {
      return {
        min: 9,
        max: 17,
        range: "9 - 17",
        unit: "%",
      };
    }

    if (n === "pct") {
      return {
        min: 0.15,
        max: 0.4,
        range: "0.15 - 0.40",
        unit: "%",
      };
    }

    if (
      n === "esr" ||
      n.includes(
        "erythrocyte sedimentation"
      )
    ) {
      return {
        min: 0,
        max:
          gender === "female"
            ? 20
            : 15,
        range:
          gender === "female"
            ? "0 - 20"
            : "0 - 15",
        unit: "mm/hr",
      };
    }

    if (
      n.includes(
        "fasting blood sugar"
      ) ||
      n === "fbs"
    ) {
      return {
        min: 70,
        max: 99,
        range: "70 - 99",
        unit: "mg/dL",
      };
    }

    if (
      n.includes("post prandial") ||
      n === "ppbs"
    ) {
      return {
        min: 70,
        max: 140,
        range: "70 - 140",
        unit: "mg/dL",
      };
    }

    if (
      n.includes(
        "random blood sugar"
      ) ||
      n === "rbs"
    ) {
      return {
        min: 70,
        max: 140,
        range: "70 - 140",
        unit: "mg/dL",
      };
    }

    if (
      n === "blood urea" ||
      n === "urea"
    ) {
      return {
        min: 15,
        max: 40,
        range: "15 - 40",
        unit: "mg/dL",
      };
    }

    if (
      n === "serum creatinine" ||
      n === "creatinine"
    ) {
      return {
        min: 0.6,
        max: 1.3,
        range: "0.6 - 1.3",
        unit: "mg/dL",
      };
    }

    if (n === "uric acid") {
      return gender === "female"
        ? {
            min: 2.4,
            max: 6,
            range: "2.4 - 6.0",
            unit: "mg/dL",
          }
        : {
            min: 3.4,
            max: 7,
            range: "3.4 - 7.0",
            unit: "mg/dL",
          };
    }

    if (n === "sodium") {
      return {
        min: 135,
        max: 145,
        range: "135 - 145",
        unit: "mEq/L",
      };
    }

    if (n === "potassium") {
      return {
        min: 3.5,
        max: 5.1,
        range: "3.5 - 5.1",
        unit: "mEq/L",
      };
    }

    if (
      n === "total bilirubin"
    ) {
      return {
        min: 0.2,
        max: 1.2,
        range: "0.2 - 1.2",
        unit: "mg/dL",
      };
    }

    if (
      n === "direct bilirubin"
    ) {
      return {
        min: 0,
        max: 0.3,
        range: "0 - 0.3",
        unit: "mg/dL",
      };
    }

    if (
      n.includes("sgot") ||
      n === "ast"
    ) {
      return {
        min: 0,
        max: 40,
        range: "Up to 40",
        unit: "U/L",
      };
    }

    if (
      n.includes("sgpt") ||
      n === "alt"
    ) {
      return {
        min: 0,
        max: 40,
        range: "Up to 40",
        unit: "U/L",
      };
    }

    if (
      n.includes(
        "total cholesterol"
      )
    ) {
      return {
        min: 0,
        max: 200,
        range: "< 200",
        unit: "mg/dL",
      };
    }

    if (
      n.includes("triglyceride")
    ) {
      return {
        min: 0,
        max: 150,
        range: "< 150",
        unit: "mg/dL",
      };
    }

    if (n.includes("hdl")) {
      return {
        min: 40,
        max: null,
        range: "> 40",
        unit: "mg/dL",
      };
    }

    if (n.includes("ldl")) {
      return {
        min: 0,
        max: 100,
        range: "< 100",
        unit: "mg/dL",
      };
    }

    if (n === "tsh") {
      return {
        min: 0.4,
        max: 4,
        range: "0.4 - 4.0",
        unit: "µIU/mL",
      };
    }

    if (n === "t3") {
      return {
        min: 80,
        max: 200,
        range: "80 - 200",
        unit: "ng/dL",
      };
    }

    if (n === "t4") {
      return {
        min: 5,
        max: 12,
        range: "5 - 12",
        unit: "µg/dL",
      };
    }

    return {
      min: null,
      max: null,
      range: "-",
      unit: "",
    };
  }

  /* ==========================================================
     RESOLVE PARAMETER
  ========================================================== */

  function resolveParameter(
    parameter
  ) {
    const name =
      typeof parameter ===
      "string"
        ? parameter
        : parameter?.name ||
          parameter?.testName ||
          parameter?.investigation ||
          "";

    const defaultRef =
      getReference(name);

    const min =
      parameter?.min ??
      defaultRef.min;

    const max =
      parameter?.max ??
      defaultRef.max;

    const unit =
      parameter?.unit ||
      parameter?.units ||
      defaultRef.unit;

    const range =
      parameter?.range ||
      parameter?.referenceRange ||
      parameter?.reference ||
      defaultRef.range;

    return {
      name,
      min,
      max,
      unit,
      range,
    };
  }

  /* ==========================================================
     FLAG
  ========================================================== */

  function getFlag(
    value,
    parameter
  ) {
    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return "";
    }

    const p =
      resolveParameter(
        parameter
      );

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

  /* ==========================================================
     BUILD TEST DATA
  ========================================================== */

  const reportTests =
    useMemo(() => {

      if (
        !Array.isArray(
          selectedTests
        )
      ) {
        return [];
      }

      return selectedTests.map(
        (
          test,
          testIndex
        ) => {

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
              Array.isArray(
                parameters
              )
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

                        result:
                          value,

                        unit:
                          resolved.unit ||
                          "-",

                        range:
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
    }, [
      selectedTests,
      results,
      patient?.gender,
      patient?.sex,
    ]);

  /* ==========================================================
     AUTO SAVE
  ========================================================== */

  useEffect(() => {

    if (
      !patient ||
      Object.keys(patient)
        .length === 0
    ) {
      return;
    }

    if (
      selectedTests.length === 0
    ) {
      return;
    }

    const timer =
      setTimeout(() => {
        saveReport();
      }, 1000);

    return () =>
      clearTimeout(timer);

  }, [
    patient,
    selectedTests,
    results,
  ]);

  /* ==========================================================
     SAVE REPORT
  ========================================================== */

  async function saveReport() {

    try {

      setSaveStatus(
        "saving"
      );

      const patientId =
        patient?.patientId ||
        patient?.id;

      if (!patientId) {

        setSaveStatus(
          "error"
        );

        setSaveMessage(
          "Patient ID nahi mila."
        );

        return;
      }

      let currentReportNo =
        reportNo;

      if (!currentReportNo) {

        currentReportNo =
          `RPT-${Date.now()}`;

        setReportNo(
          currentReportNo
        );

        localStorage.setItem(
          "nidanCurrentReportNo",
          currentReportNo
        );
      }

      const reportData = {
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
        error:
          findError,
      } =
        await supabase
          .from("reports")
          .select("id")
          .eq(
            "report_no",
            currentReportNo
          )
          .maybeSingle();

      if (findError) {
        throw findError;
      }

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
                reportData,
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
                  reportData,
              },
            ]);

        if (error) {
          throw error;
        }
      }

      setSaveStatus(
        "saved"
      );

      setSaveMessage(
        "Saved to Reports"
      );

    } catch (error) {

      console.error(
        "SAVE REPORT ERROR:",
        error
      );

      setSaveStatus(
        "error"
      );

      setSaveMessage(
        error?.message ||
          "Report save failed"
      );
    }
  }

  /* ==========================================================
     PRINT
  ========================================================== */

  function printReport() {
    window.print();
  }

  /* ==========================================================
     NEW PATIENT
  ========================================================== */

  function newPatient() {

    const ok =
      window.confirm(
        "Current report clear karke New Patient start karein?"
      );

    if (!ok) return;

    localStorage.removeItem(
      "nidanPatient"
    );

    localStorage.removeItem(
      "nidanSelectedTests"
    );

    localStorage.removeItem(
      "nidanResults"
    );

    localStorage.removeItem(
      "nidanCurrentReportNo"
    );

    router.push(
      "/patients"
    );
  }

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const pages =
    useMemo(() => {

      if (
        reportTests.length === 0
      ) {
        return [[]];
      }

      const result = [];

      let current = [];

      let rows = 0;

      for (
        const test of reportTests
      ) {

        const testRows =
          Math.max(
            1,
            test.parameters
              ?.length || 0
          );

        /*
          A4 page capacity.
          Patient information + header
          already have fixed space.
        */

        if (
          current.length > 0 &&
          rows + testRows + 3 >
            27
        ) {

          result.push(
            current
          );

          current = [];

          rows = 0;
        }

        current.push(
          test
        );

        rows +=
          testRows + 3;
      }

      if (
        current.length
      ) {
        result.push(
          current
        );
      }

      return result;

    }, [reportTests]);

  /* ==========================================================
     PATIENT
  ========================================================== */

  const patientName =
    patient?.name ||
    patient?.patientName ||
    "-";

  const patientId =
    patient?.patientId ||
    patient?.id ||
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

  const referredBy =
    patient?.doctor ||
    patient?.refDoctor ||
    patient?.referredBy ||
    "-";

  const collectionDate =
    patient?.collectionDate ||
    patient?.sampleDate ||
    reportDate ||
    "-";

  /* ==========================================================
     RETURN
  ========================================================== */

  return (
    <>
      <div className="reportApp">

        {/* ==================================================
            TOP TOOLBAR
        ================================================== */}

        <div className="toolbar">

          <div className="reportInfo">

            <strong>
              Final Laboratory Report
            </strong>

            <span>
              Professional A4 Report Preview
            </span>

            <span>
              Report No:{" "}
              {reportNo}
            </span>

            {saveStatus ===
              "saving" && (
              <b className="saving">
                ● Saving report...
              </b>
            )}

            {saveStatus ===
              "saved" && (
              <b className="saved">
                ✓ Saved to Reports
              </b>
            )}

            {saveStatus ===
              "error" && (
              <b className="error">
                ⚠ {saveMessage}
              </b>
            )}

          </div>

          <div className="buttons">

            <button
              onClick={() =>
                router.push(
                  "/results"
                )
              }
              className="editButton"
            >
              ← Edit Results
            </button>

            <button
              onClick={
                printReport
              }
              className="printButton"
            >
              🖨 Print / Save PDF
            </button>

            <button
              onClick={
                newPatient
              }
              className="newButton"
            >
              + New Patient
            </button>

          </div>

        </div>

        {/* ==================================================
            PAGES
        ================================================== */}

        <div className="pages">

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
                patientName={
                  patientName
                }
                patientId={
                  patientId
                }
                age={age}
                gender={gender}
                mobile={mobile}
                referredBy={
                  referredBy
                }
                collectionDate={
                  collectionDate
                }
                reportNo={
                  reportNo
                }
                reportDate={
                  reportDate
                }
                isLastPage={
                  pageIndex ===
                  pages.length - 1
                }
              />

            )
          )}

        </div>

      </div>

      {/* ======================================================
          CSS
      ====================================================== */}

      <style jsx global>{`

        * {
          box-sizing:
            border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background:
            #eef2f7;
          color:
            #111827;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        body {
          overflow-x:
            hidden;
        }

        /* ================================================
           APP
        ================================================ */

        .reportApp {
          min-height:
            100vh;

          padding:
            12px;

          background:
            #eef2f7;
        }

        /* ================================================
           TOOLBAR
        ================================================ */

        .toolbar {
          width:
            100%;

          max-width:
            1180px;

          margin:
            0 auto 10px;

          padding:
            10px 14px;

          background:
            #ffffff;

          border:
            1px solid #dbe3eb;

          border-radius:
            8px;

          display:
            flex;

          justify-content:
            space-between;

          align-items:
            center;

          gap:
            15px;

          box-shadow:
            0 2px 12px
            rgba(
              15,
              23,
              42,
              .07
            );
        }

        .reportInfo {
          display:
            flex;

          flex-direction:
            column;

          gap:
            2px;
        }

        .reportInfo strong {
          font-size:
            14px;
        }

        .reportInfo span {
          font-size:
            8px;

          color:
            #64748b;
        }

        .saving {
          font-size:
            8px;

          color:
            #b45309;
        }

        .saved {
          font-size:
            8px;

          color:
            #15803d;
        }

        .error {
          font-size:
            8px;

          color:
            #dc2626;
        }

        .buttons {
          display:
            flex;

          gap:
            6px;
        }

        .buttons button {
          min-height:
            34px;

          padding:
            7px 12px;

          border-radius:
            6px;

          font-size:
            9px;

          font-weight:
            700;

          cursor:
            pointer;

          background:
            #ffffff;
        }

        .editButton {
          border:
            1px solid #cbd5e1;

          color:
            #334155;
        }

        .printButton {
          border:
            1px solid #087f7d;

          background:
            #087f7d !important;

          color:
            #ffffff;
        }

        .newButton {
          border:
            1px solid #fecaca;

          color:
            #dc2626;
        }

        /* ================================================
           PAGES
        ================================================ */

        .pages {
          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          gap:
            18px;
        }

        /* ================================================
           A4 SHEET
        ================================================ */

        .reportSheet {
          position:
            relative;

          width:
            min(
              210mm,
              calc(100vw - 24px)
            );

          height:
            297mm;

          background:
            #ffffff;

          overflow:
            hidden;

          box-shadow:
            0 8px 28px
            rgba(
              15,
              23,
              42,
              .15
            );
        }

        /* ================================================
           BUILT-IN HEADER
        ================================================ */

        .labHeader {
          position:
            absolute;

          top:
            0;

          left:
            0;

          right:
            0;

          height:
            30mm;

          padding:
            8mm 10mm 4mm;

          background:
            #ffffff;

          border-bottom:
            1px solid #222;

          z-index:
            5;
        }

        .labName {
          color:
            #0f4c5c;

          font-size:
            21px;

          font-weight:
            900;

          letter-spacing:
            .3px;
        }

        .labSubtitle {
          margin-top:
            1.5mm;

          color:
            #334155;

          font-size:
            8px;

          font-weight:
            700;
        }

        .labAddress {
          margin-top:
            2mm;

          color:
            #475569;

          font-size:
            6.8px;
        }

        .headerLine {
          height:
            2px;

          margin-top:
            3mm;

          background:
            #087f7d;
        }

        /* ================================================
           CONTENT
        ================================================ */

        .content {
          position:
            absolute;

          top:
            33mm;

          left:
            10mm;

          right:
            10mm;

          bottom:
            28mm;

          overflow:
            hidden;

          display:
            flex;

          flex-direction:
            column;

          z-index:
            4;
        }

        /* ================================================
           PATIENT
        ================================================ */

        .patientBox {
          width:
            100%;

          display:
            grid;

          grid-template-columns:
            1.35fr 1fr 1fr;

          border:
            1px solid #475569;

          background:
            #ffffff;

          flex-shrink:
            0;

          margin-bottom:
            4mm;
        }

        .patientColumn {
          padding:
            3mm;

          border-right:
            1px solid #cbd5e1;

          min-width:
            0;
        }

        .patientColumn:last-child {
          border-right:
            0;
        }

        .patientLine {
          display:
            flex;

          gap:
            3px;

          margin-bottom:
            1.5px;

          font-size:
            7px;

          line-height:
            1.25;
        }

        .patientLabel {
          font-weight:
            800;

          white-space:
            nowrap;
        }

        .patientValue {
          min-width:
            0;

          overflow-wrap:
            anywhere;
        }

        /* ================================================
           TEST AREA
        ================================================ */

        .testArea {
          flex:
            1;

          min-height:
            0;

          overflow:
            hidden;

          display:
            flex;

          flex-direction:
            column;

          gap:
            4mm;
        }

        .testBlock {
          width:
            100%;

          flex-shrink:
            0;

          break-inside:
            avoid;

          page-break-inside:
            avoid;
        }

        .category {
          text-align:
            center;

          font-size:
            6.5px;

          color:
            #475569;

          font-weight:
            900;

          letter-spacing:
            .8px;

          margin-bottom:
            1px;
        }

        .testTitle {
          text-align:
            center;

          font-size:
            9px;

          font-weight:
            900;

          margin-bottom:
            2mm;

          line-height:
            1.1;
        }

        /* ================================================
           TABLE
        ================================================ */

        .reportTable {
          width:
            100%;

          border-collapse:
            collapse;

          table-layout:
            fixed;

          background:
            #ffffff;
        }

        .reportTable th {
          padding:
            1.5mm 1mm;

          border:
            1px solid #9aa5b1;

          background:
            #edf2f7;

          text-align:
            center;

          font-size:
            6.4px;

          font-weight:
            900;

          line-height:
            1.1;
        }

        .reportTable td {
          padding:
            1.2mm 1.3mm;

          border:
            1px solid #c7d0d9;

          font-size:
            7px;

          line-height:
            1.15;

          height:
            5mm;

          vertical-align:
            middle;

          overflow-wrap:
            anywhere;
        }

        .investigation {
          width:
            32%;

          text-align:
            left !important;
        }

        .flagColumn {
          width:
            8%;

          text-align:
            center !important;
        }

        .resultColumn {
          width:
            16%;

          text-align:
            center !important;
        }

        .referenceColumn {
          width:
            29%;

          text-align:
            center !important;
        }

        .unitColumn {
          width:
            15%;

          text-align:
            center !important;
        }

        .normal {
          text-align:
            center;

          font-weight:
            700;
        }

        .abnormal {
          text-align:
            center;

          font-weight:
            900;

          color:
            #c62828;
        }

        .flagCell {
          text-align:
            center !important;
        }

        .flag {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          min-width:
            15px;

          height:
            13px;

          border-radius:
            3px;

          font-size:
            6px;

          font-weight:
            900;
        }

        .flagHigh {
          color:
            #b91c1c;

          background:
            #fee2e2;
        }

        .flagLow {
          color:
            #1d4ed8;

          background:
            #dbeafe;
        }

        /* ================================================
           SIGNATURE
        ================================================ */

        .signatureArea {
          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            35mm;

          margin-top:
            5mm;

          flex-shrink:
            0;

          background:
            #ffffff;

          break-inside:
            avoid;

          page-break-inside:
            avoid;
        }

        .signature {
          text-align:
            center;

          font-size:
            7px;
        }

        .signatureLine {
          height:
            7mm;

          border-bottom:
            1px solid #333;

          margin-bottom:
            2mm;
        }

        .signature strong {
          display:
            block;

          font-size:
            7px;
        }

        .signature span {
          display:
            block;

          font-size:
            6px;

          color:
            #64748b;

          margin-top:
            1px;
        }

        /* ================================================
           NOTE
        ================================================ */

        .note {
          margin-top:
            2mm;

          padding-top:
            2mm;

          border-top:
            1px solid #9ca3af;

          font-size:
            5.5px;

          color:
            #475569;

          line-height:
            1.25;

          flex-shrink:
            0;
        }

        /* ================================================
           FOOTER
        ================================================ */

        .labFooter {
          position:
            absolute;

          left:
            0;

          right:
            0;

          bottom:
            0;

          height:
            18mm;

          background:
            #f8fafc;

          border-top:
            1px solid #cbd5e1;

          display:
            flex;

          flex-direction:
            column;

          justify-content:
            center;

          align-items:
            center;

          z-index:
            5;
        }

        .labFooter strong {
          font-size:
            8px;

          color:
            #0f4c5c;
        }

        .labFooter span {
          margin-top:
            1.5mm;

          font-size:
            5.8px;

          color:
            #64748b;
        }

        /* ================================================
           PAGE NUMBER
        ================================================ */

        .pageNumber {
          position:
            absolute;

          right:
            7mm;

          bottom:
            4mm;

          z-index:
            20;

          font-size:
            6px;

          color:
            #64748b;
        }

        /* ================================================
           MOBILE
        ================================================ */

        @media (
          max-width: 700px
        ) {

          .reportApp {
            padding:
              5px;
          }

          .toolbar {
            flex-direction:
              column;

            align-items:
              stretch;
          }

          .buttons {
            display:
              grid;

            grid-template-columns:
              1fr 1fr;
          }

          .buttons button {
            width:
              100%;
          }

          .printButton {
            grid-column:
              span 2;
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

          .labName {
            font-size:
              14px;
          }

          .labSubtitle {
            font-size:
              6px;
          }

          .labAddress {
            font-size:
              5px;
          }

          .patientLine {
            font-size:
              5px;
          }

          .reportTable th {
            font-size:
              4.5px;
          }

          .reportTable td {
            font-size:
              5px;
          }

          .testTitle {
            font-size:
              7px;
          }

          .category {
            font-size:
              5px;
          }
        }

        /* ================================================
           PRINT
        ================================================ */

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

            margin:
              0 !important;

            padding:
              0 !important;

            background:
              #ffffff !important;
          }

          body {
            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;
          }

          .reportApp {
            width:
              210mm;

            padding:
              0 !important;

            margin:
              0 !important;

            background:
              #ffffff !important;
          }

          .toolbar {
            display:
              none !important;
          }

          .pages {
            width:
              210mm;

            display:
              block;

            margin:
              0;

            padding:
              0;
          }

          .reportSheet {
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

            box-shadow:
              none !important;

            overflow:
              hidden !important;

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

          .labHeader,
          .labFooter,
          .reportTable th {
            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;
          }

          .testBlock,
          .patientBox,
          .signatureArea,
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

/* ============================================================
   REPORT SHEET
============================================================ */

function ReportSheet({
  pageTests,
  pageIndex,
  totalPages,

  patientName,
  patientId,
  age,
  gender,
  mobile,
  referredBy,

  collectionDate,
  reportNo,
  reportDate,

  isLastPage,
}) {
  return (
    <div className="reportSheet">

      {/* ======================================================
          BUILT-IN HEADER
          NO LETTERHEAD
      ====================================================== */}

      <div className="labHeader">

        <div className="labName">
          {LAB.name}
        </div>

        <div className="labSubtitle">
          {LAB.subtitle}
        </div>

        <div className="labAddress">
          {LAB.address}
          {LAB.phone
            ? ` | ${LAB.phone}`
            : ""}
          {LAB.email
            ? ` | ${LAB.email}`
            : ""}
        </div>

        <div className="headerLine" />

      </div>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="content">

        {/* ====================================================
            PATIENT INFORMATION
        ==================================================== */}

        <div className="patientBox">

          <div className="patientColumn">

            <div className="patientLine">

              <span className="patientLabel">
                Patient Name:
              </span>

              <span className="patientValue">
                {patientName}
              </span>

            </div>

            <div className="patientLine">

              <span className="patientLabel">
                Age / Sex:
              </span>

              <span className="patientValue">
                {age} Years /{" "}
                {gender}
              </span>

            </div>

            <div className="patientLine">

              <span className="patientLabel">
                Referred By:
              </span>

              <span className="patientValue">
                {referredBy}
              </span>

            </div>

            <div className="patientLine">

              <span className="patientLabel">
                Sample ID:
              </span>

              <span className="patientValue">
                {patientId}
              </span>

            </div>

          </div>

          <div className="patientColumn">

            <div className="patientLine">

              <span className="patientLabel">
                Patient ID:
              </span>

              <span className="patientValue">
                {patientId}
              </span>

            </div>

            <div className="patientLine">

              <span className="patientLabel">
                Mobile:
              </span>

              <span className="patientValue">
                {mobile}
              </span>

            </div>

            <div className="patientLine">

              <span className="patientLabel">
                Lab:
              </span>

              <span className="patientValue">
                {LAB.name}
              </span>

            </div>

          </div>

          <div className="patientColumn">

            <div className="patientLine">

              <span className="patientLabel">
                Report ID:
              </span>

              <span className="patientValue">
                {reportNo}
              </span>

            </div>

            <div className="patientLine">

              <span className="patientLabel">
                Collection:
              </span>

              <span className="patientValue">
                {collectionDate}
              </span>

            </div>

            <div className="patientLine">

              <span className="patientLabel">
                Report Date:
              </span>

              <span className="patientValue">
                {reportDate}
              </span>

            </div>

          </div>

        </div>

        {/* ====================================================
            TESTS
        ==================================================== */}

        <div className="testArea">

          {pageTests.map(
            (
              test,
              testIndex
            ) => (

              <section
                className="testBlock"
                key={
                  test.id ||
                  testIndex
                }
              >

                <div className="category">
                  {String(
                    test.category ||
                      "PATHOLOGY"
                  ).toUpperCase()}
                </div>

                <div className="testTitle">
                  {test.name}
                </div>

                <table className="reportTable">

                  <colgroup>

                    <col className="investigation" />

                    <col className="flagColumn" />

                    <col className="resultColumn" />

                    <col className="referenceColumn" />

                    <col className="unitColumn" />

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

                        const result =
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

                            <td>
                              {
                                parameter.name
                              }
                            </td>

                            <td className="flagCell">

                              {parameter.flag ? (

                                <span
                                  className={
                                    parameter.flag ===
                                    "H"
                                      ? "flag flagHigh"
                                      : "flag flagLow"
                                  }
                                >
                                  {
                                    parameter.flag
                                  }
                                </span>

                              ) : null}

                            </td>

                            <td
                              className={
                                abnormal
                                  ? "abnormal"
                                  : "normal"
                              }
                            >
                              {result}
                            </td>

                            <td>
                              {
                                parameter.range ||
                                "-"
                              }
                            </td>

                            <td>
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

            )
          )}

        </div>

        {/* ====================================================
            SIGNATURE
        ==================================================== */}

        {isLastPage && (

          <>

            <div className="signatureArea">

              <div className="signature">

                <div className="signatureLine" />

                <strong>
                  Lab Technician
                </strong>

                <span>
                  {LAB.name}
                </span>

              </div>

              <div className="signature">

                <div className="signatureLine" />

                <strong>
                  Authorized Signatory
                </strong>

                <span>
                  Signature & Seal
                </span>

              </div>

            </div>

            <div className="note">

              <strong>
                Note:
              </strong>{" "}
              The laboratory results should
              be interpreted in conjunction
              with relevant clinical findings
              and other investigations.

            </div>

          </>

        )}

      </div>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <div className="labFooter">

        <strong>
          {LAB.name}
        </strong>

        <span>
          Computerised Laboratory Report •
          Please retain this report for
          future reference.
        </span>

      </div>

      {/* ======================================================
          PAGE NUMBER
      ====================================================== */}

      {totalPages > 1 && (

        <div className="pageNumber">
          Page{" "}
          {pageIndex + 1}{" "}
          of{" "}
          {totalPages}
        </div>

      )}

    </div>
  );
}
