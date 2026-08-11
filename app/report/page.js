"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

/* =========================================================
   DEFAULT SETTINGS
========================================================= */

const DEFAULT_SETTINGS = {
  labName: "NIDAN PATHOLOGY LAB",
  labAddress: "",
  phone: "",
  email: "",
  registrationNo: "",
  doctorName: "",

  letterhead: "",

  reportHeader: true,
  showLogo: true,
  showReferenceRange: true,
  showFlag: true,
  autoSave: true,
};

export default function ReportPage() {
  const router = useRouter();

  /* =======================================================
     STATE
  ======================================================= */

  const [patient, setPatient] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
  const [results, setResults] = useState({});
  const [reportDate, setReportDate] = useState("");
  const [reportNo, setReportNo] = useState("");

  const [saveStatus, setSaveStatus] = useState("loading");
  const [saveMessage, setSaveMessage] = useState("");

  const [labSettings, setLabSettings] =
    useState(DEFAULT_SETTINGS);

  const [settingsLoaded, setSettingsLoaded] =
    useState(false);

  const savingRef = useRef(false);
  const saveTimerRef = useRef(null);

  /* =======================================================
     LOAD REPORT DATA + SETTINGS
  ======================================================= */

  useEffect(() => {
    try {
      const savedPatient = JSON.parse(
        localStorage.getItem("nidanPatient") || "{}"
      );

      const savedTests = JSON.parse(
        localStorage.getItem("nidanSelectedTests") || "[]"
      );

      const savedResults = JSON.parse(
        localStorage.getItem("nidanResults") || "{}"
      );

      const savedSettings = JSON.parse(
        localStorage.getItem("nidanLabSettings") || "{}"
      );

      setPatient(savedPatient);

      setSelectedTests(
        Array.isArray(savedTests)
          ? savedTests
          : []
      );

      setResults(savedResults || {});

      setLabSettings({
        ...DEFAULT_SETTINGS,
        ...(savedSettings || {}),
      });

      setReportDate(
        new Date().toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }
        )
      );

      setSettingsLoaded(true);

    } catch (error) {
      console.error(
        "REPORT DATA LOAD ERROR:",
        error
      );

      setSaveStatus("error");

      setSaveMessage(
        "Report data load nahi hua."
      );

      setSettingsLoaded(true);
    }
  }, []);

  /* =======================================================
     NORMALIZE NAME
  ======================================================= */

  function normalizeName(name = "") {
    return String(name)
      .toLowerCase()
      .replace(/[()]/g, "")
      .replace(/[./_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* =======================================================
     GENDER
  ======================================================= */

  function getGender() {
    const gender = String(
      patient.gender ||
        patient.sex ||
        ""
    )
      .trim()
      .toLowerCase();

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

  /* =======================================================
     AGE
  ======================================================= */

  function getAge() {
    const age = parseFloat(
      patient.age
    );

    return Number.isNaN(age)
      ? null
      : age;
  }

  /* =======================================================
     DEFAULT REFERENCE DATABASE
  ======================================================= */

  function getDefaultReference(
    parameterName
  ) {
    const name =
      normalizeName(parameterName);

    const gender = getGender();
    const age = getAge();

    /* ================= CBC ================= */

    if (
      name === "hemoglobin" ||
      name === "haemoglobin" ||
      name === "hb"
    ) {
      if (
        age !== null &&
        age < 12
      ) {
        return {
          min: 11,
          max: 15,
          unit: "g/dL",
          range: "11 - 15",
        };
      }

      if (gender === "female") {
        return {
          min: 12,
          max: 15,
          unit: "g/dL",
          range: "12 - 15",
        };
      }

      return {
        min: 13,
        max: 17,
        unit: "g/dL",
        range: "13 - 17",
      };
    }

    if (
      name.includes(
        "total leucocyte"
      ) ||
      name.includes(
        "total leukocyte"
      ) ||
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
      name === "neutrophils"
    ) {
      return {
        min: 40,
        max: 75,
        unit: "%",
        range: "40 - 75",
      };
    }

    if (
      name === "lymphocytes"
    ) {
      return {
        min: 20,
        max: 40,
        unit: "%",
        range: "20 - 40",
      };
    }

    if (
      name === "eosinophils"
    ) {
      return {
        min: 1,
        max: 6,
        unit: "%",
        range: "1 - 6",
      };
    }

    if (
      name === "monocytes"
    ) {
      return {
        min: 1,
        max: 10,
        unit: "%",
        range: "1 - 10",
      };
    }

    if (
      name === "basophils"
    ) {
      return {
        min: 0,
        max: 1,
        unit: "%",
        range: "0 - 1",
      };
    }

    if (
      name === "rbc count" ||
      name === "total rbc count"
    ) {
      if (gender === "female") {
        return {
          min: 4.0,
          max: 5.5,
          unit: "million/cumm",
          range: "4.0 - 5.5",
        };
      }

      return {
        min: 4.5,
        max: 6.0,
        unit: "million/cumm",
        range: "4.5 - 6.0",
      };
    }

    if (
      name.includes("pcv") ||
      name.includes(
        "haematocrit"
      ) ||
      name.includes(
        "hematocrit"
      )
    ) {
      if (gender === "female") {
        return {
          min: 36,
          max: 46,
          unit: "%",
          range: "36 - 46",
        };
      }

      return {
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

    /* ================= ESR ================= */

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

    /* ================= SUGAR ================= */

    if (
      name.includes(
        "fasting blood sugar"
      ) ||
      name === "fbs" ||
      name.includes(
        "fasting glucose"
      )
    ) {
      return {
        min: 70,
        max: 99,
        unit: "mg/dL",
        range: "70 - 99",
      };
    }

    if (
      name.includes(
        "post prandial"
      ) ||
      name === "ppbs" ||
      name.includes(
        "postprandial"
      )
    ) {
      return {
        min: 70,
        max: 140,
        unit: "mg/dL",
        range: "70 - 140",
      };
    }

    if (
      name.includes(
        "random blood sugar"
      ) ||
      name === "rbs" ||
      name.includes(
        "random glucose"
      )
    ) {
      return {
        min: 70,
        max: 140,
        unit: "mg/dL",
        range: "70 - 140",
      };
    }

    /* ================= KFT ================= */

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
      name ===
        "serum creatinine" ||
      name === "creatinine"
    ) {
      return {
        min: 0.6,
        max: 1.3,
        unit: "mg/dL",
        range: "0.6 - 1.3",
      };
    }

    if (
      name === "uric acid"
    ) {
      return gender === "female"
        ? {
            min: 2.4,
            max: 6.0,
            unit: "mg/dL",
            range: "2.4 - 6.0",
          }
        : {
            min: 3.4,
            max: 7.0,
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

    if (name === "chloride") {
      return {
        min: 98,
        max: 107,
        unit: "mEq/L",
        range: "98 - 107",
      };
    }

    if (name === "bun") {
      return {
        min: 7,
        max: 20,
        unit: "mg/dL",
        range: "7 - 20",
      };
    }

    /* ================= LFT ================= */

    if (
      name === "total bilirubin"
    ) {
      return {
        min: 0.2,
        max: 1.2,
        unit: "mg/dL",
        range: "0.2 - 1.2",
      };
    }

    if (
      name === "direct bilirubin"
    ) {
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
      name.includes(
        "alkaline phosphatase"
      ) ||
      name === "alp"
    ) {
      return {
        min: 44,
        max: 147,
        unit: "U/L",
        range: "44 - 147",
      };
    }

    if (
      name === "total protein"
    ) {
      return {
        min: 6.0,
        max: 8.3,
        unit: "g/dL",
        range: "6.0 - 8.3",
      };
    }

    if (name === "albumin") {
      return {
        min: 3.5,
        max: 5.0,
        unit: "g/dL",
        range: "3.5 - 5.0",
      };
    }

    if (name === "globulin") {
      return {
        min: 2.0,
        max: 3.5,
        unit: "g/dL",
        range: "2.0 - 3.5",
      };
    }

    /* ================= LIPID ================= */

    if (
      name.includes(
        "total cholesterol"
      )
    ) {
      return {
        min: 0,
        max: 200,
        unit: "mg/dL",
        range: "< 200",
      };
    }

    if (
      name.includes(
        "triglyceride"
      )
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

    if (
      name.includes("vldl")
    ) {
      return {
        min: 5,
        max: 40,
        unit: "mg/dL",
        range: "5 - 40",
      };
    }

    /* ================= HBA1C ================= */

    if (
      name === "hba1c" ||
      name.includes("glycated")
    ) {
      return {
        min: 4,
        max: 5.6,
        unit: "%",
        range: "4.0 - 5.6",
      };
    }

    /* ================= THYROID ================= */

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

    if (name === "tsh") {
      return {
        min: 0.4,
        max: 4.0,
        unit: "µIU/mL",
        range: "0.4 - 4.0",
      };
    }

    return null;
  }

  /* =======================================================
     RESOLVE PARAMETER
  ======================================================= */

  function resolveParameter(
    parameter
  ) {
    if (!parameter) {
      return {
        min: null,
        max: null,
        unit: "",
        range: "-",
      };
    }

    if (
      typeof parameter ===
      "string"
    ) {
      const defaults =
        getDefaultReference(
          parameter
        );

      return {
        min:
          defaults?.min ??
          null,

        max:
          defaults?.max ??
          null,

        unit:
          defaults?.unit ||
          "",

        range:
          defaults?.range ||
          "-",
      };
    }

    const name =
      parameter.name ||
      parameter.testName ||
      parameter.investigation ||
      "";

    const defaults =
      getDefaultReference(name);

    let min = parameter.min;
    let max = parameter.max;

    let unit =
      parameter.unit ||
      parameter.units ||
      defaults?.unit ||
      "";

    let range =
      parameter.range ||
      parameter.referenceRange ||
      parameter.reference ||
      defaults?.range ||
      "";

    if (
      (min === undefined ||
        min === null ||
        min === "") &&
      defaults
    ) {
      min = defaults.min;
    }

    if (
      (max === undefined ||
        max === null ||
        max === "") &&
      defaults
    ) {
      max = defaults.max;
    }

    if (
      !range ||
      range === "-"
    ) {
      if (
        min !== null &&
        min !== undefined &&
        max !== null &&
        max !== undefined
      ) {
        range =
          `${min} - ${max}`;
      } else if (
        max !== null &&
        max !== undefined
      ) {
        range =
          `< ${max}`;
      } else if (
        min !== null &&
        min !== undefined
      ) {
        range =
          `> ${min}`;
      } else {
        range = "-";
      }
    }

    return {
      ...parameter,
      min,
      max,
      unit,
      range,
    };
  }

  /* =======================================================
     PARAMETER KEY
  ======================================================= */

  function parameterKey(
    testId,
    parameter,
    index
  ) {
    const name =
      typeof parameter ===
      "string"
        ? parameter
        : parameter?.name ||
          parameter?.testName ||
          parameter?.investigation ||
          `parameter-${index}`;

    return `${testId}-${name}-${index}`;
  }

  /* =======================================================
     PARAMETER NAME
  ======================================================= */

  function getParameterName(
    parameter,
    index
  ) {
    if (
      typeof parameter ===
      "string"
    ) {
      return parameter;
    }

    return (
      parameter?.name ||
      parameter?.testName ||
      parameter?.investigation ||
      `Investigation ${
        index + 1
      }`
    );
  }

  /* =======================================================
     FLAG
  ======================================================= */

  function getFlag(
    value,
    parameter
  ) {
    if (
      value === "" ||
      value === undefined ||
      value === null
    ) {
      return "";
    }

    const resolved =
      resolveParameter(
        parameter
      );

    const cleanedValue =
      String(value)
        .replace(/,/g, "")
        .trim();

    const numericValue =
      Number(cleanedValue);

    if (
      Number.isNaN(
        numericValue
      )
    ) {
      return "";
    }

    if (
      resolved.min !== null &&
      resolved.min !== undefined &&
      resolved.min !== ""
    ) {
      if (
        numericValue <
        Number(resolved.min)
      ) {
        return "L";
      }
    }

    if (
      resolved.max !== null &&
      resolved.max !== undefined &&
      resolved.max !== ""
    ) {
      if (
        numericValue >
        Number(resolved.max)
      ) {
        return "H";
      }
    }

    return "";
  }

  /* =======================================================
     CATEGORY
  ======================================================= */

  function getCategory(test) {
    return (
      test?.category ||
      test?.department ||
      "PATHOLOGY"
    );
  }

  /* =======================================================
     BUILD REPORT TESTS
  ======================================================= */

  function buildReportTests(
    tests,
    resultData
  ) {
    if (
      !Array.isArray(tests)
    ) {
      return [];
    }

    return tests.map(
      (
        test,
        testIndex
      ) => {
        const parameters =
          test?.tests ||
          test?.parameters ||
          [];

        const testId =
          test?.id ??
          test?.testId ??
          `test-${testIndex}`;

        return {
          id: testId,

          name:
            test?.name ||
            test?.testName ||
            test?.short ||
            "Laboratory Test",

          category:
            getCategory(test),

          parameters:
            Array.isArray(
              parameters
            )
              ? parameters.map(
                  (
                    parameter,
                    index
                  ) => {
                    const key =
                      parameterKey(
                        testId,
                        parameter,
                        index
                      );

                    const value =
                      resultData?.[
                        key
                      ] ?? "";

                    const resolved =
                      resolveParameter(
                        parameter
                      );

                    return {
                      name:
                        getParameterName(
                          parameter,
                          index
                        ),

                      result:
                        value,

                      unit:
                        resolved.unit ||
                        "-",

                      referenceRange:
                        resolved.range ||
                        "-",

                      min:
                        resolved.min,

                      max:
                        resolved.max,

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

  /* =======================================================
     AUTO SAVE
  ======================================================= */

  useEffect(() => {
    if (
      !patient ||
      Object.keys(patient)
        .length === 0 ||
      selectedTests.length === 0
    ) {
      return;
    }

    if (
      !labSettings.autoSave
    ) {
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(
        saveTimerRef.current
      );
    }

    saveTimerRef.current =
      setTimeout(() => {
        saveReportAutomatically();
      }, 500);

    return () => {
      if (
        saveTimerRef.current
      ) {
        clearTimeout(
          saveTimerRef.current
        );
      }
    };
  }, [
    patient,
    selectedTests,
    results,
    labSettings.autoSave,
  ]);

  /* =======================================================
     SAVE REPORT
  ======================================================= */

  async function saveReportAutomatically() {
    if (savingRef.current) {
      return;
    }

    if (
      !patient ||
      Object.keys(patient)
        .length === 0 ||
      selectedTests.length === 0
    ) {
      return;
    }

    savingRef.current = true;

    try {
      setSaveStatus("saving");

      setSaveMessage(
        "Report saving..."
      );

      const patientId =
        patient.patientId ||
        patient.id ||
        "";

      if (!patientId) {
        throw new Error(
          "Patient ID nahi mila."
        );
      }

      const currentPatientId =
        localStorage.getItem(
          "nidanCurrentReportPatient"
        );

      let existingReportNo =
        localStorage.getItem(
          "nidanCurrentReportNo"
        );

      if (
        currentPatientId !==
        String(patientId)
      ) {
        localStorage.removeItem(
          "nidanCurrentReportNo"
        );

        existingReportNo = null;
      }

      const generatedReportNo =
        existingReportNo ||
        `RPT-${Date.now()}`;

      setReportNo(
        generatedReportNo
      );

      const reportTests =
        buildReportTests(
          selectedTests,
          results
        );

      const reportPayload = {
        patient: {
          ...patient,
          patientId,
        },

        selectedTests,

        results,

        reportTests,

        reportDate:
          new Date().toISOString(),

        reportNo:
          generatedReportNo,
      };

      /* CHECK EXISTING */

      const {
        data: existingData,
        error: checkError,
      } = await supabase
        .from("reports")
        .select(
          "id, report_no"
        )
        .eq(
          "report_no",
          generatedReportNo
        )
        .maybeSingle();

      if (checkError) {
        console.error(
          "Existing report check error:",
          checkError
        );
      }

      /* UPDATE */

      if (
        existingData?.id
      ) {
        const {
          error: updateError,
        } = await supabase
          .from("reports")
          .update({
            patient_id:
              patientId,

            status:
              "completed",

            report_data:
              reportPayload,
          })
          .eq(
            "id",
            existingData.id
          );

        if (updateError) {
          throw updateError;
        }
      }

      /* INSERT */

      else {
        const {
          error: insertError,
        } = await supabase
          .from("reports")
          .insert([
            {
              report_no:
                generatedReportNo,

              patient_id:
                patientId,

              status:
                "completed",

              report_data:
                reportPayload,
            },
          ]);

        if (insertError) {
          throw insertError;
        }
      }

      localStorage.setItem(
        "nidanCurrentReportNo",
        generatedReportNo
      );

      localStorage.setItem(
        "nidanCurrentReportPatient",
        String(patientId)
      );

      setReportNo(
        generatedReportNo
      );

      setSaveStatus("saved");

      setSaveMessage(
        "Report saved successfully"
      );

    } catch (error) {
      console.error(
        "AUTO REPORT SAVE ERROR:",
        error
      );

      setSaveStatus("error");

      setSaveMessage(
        error?.message ||
          "Report save nahi hua."
      );

    } finally {
      savingRef.current = false;
    }
  }

  /* =======================================================
     PRINT
  ======================================================= */

  function printReport() {
    if (
      saveStatus ===
      "saving"
    ) {
      alert(
        "Report abhi save ho raha hai. Ek moment wait karein."
      );

      return;
    }

    if (
      saveStatus ===
      "error"
    ) {
      const proceed =
        window.confirm(
          "Report database me save nahi hua hai.\n\nKya phir bhi Print / PDF karna hai?"
        );

      if (!proceed) {
        return;
      }
    }

    window.print();
  }

  /* =======================================================
     NEW PATIENT
  ======================================================= */

  function newPatient() {
    const confirmNew =
      window.confirm(
        "New patient start karna hai? Current patient data clear ho jayega."
      );

    if (!confirmNew) {
      return;
    }

    [
      "nidanPatient",
      "nidanSelectedTests",
      "nidanResults",
      "nidanBillTotal",
      "nidanCurrentReportNo",
      "nidanCurrentReportPatient",
    ].forEach(
      (key) => {
        localStorage.removeItem(
          key
        );
      }
    );

    router.push(
      "/patients"
    );
  }

  /* =======================================================
     REPORT DATA
  ======================================================= */

  const reportTests =
    buildReportTests(
      selectedTests,
      results
    );

  /* =======================================================
     LOADING
  ======================================================= */

  if (!settingsLoaded) {
    return (
      <div className="reportLoading">
        Loading Laboratory Report...
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <div className="finalReportPage">

        {/* =================================================
            SCREEN TOOLBAR
        ================================================= */}

        <div className="reportScreenToolbar">

          <div className="reportToolbarInfo">

            <strong>
              Final Laboratory Report
            </strong>

            <small>
              Review report before printing or saving PDF
            </small>

            {reportNo && (
              <small>
                Report No: {reportNo}
              </small>
            )}

            {saveStatus ===
              "saving" && (
              <small className="savingText">
                ● Saving report...
              </small>
            )}

            {saveStatus ===
              "saved" && (
              <small className="savedText">
                ✓ Saved to Reports
              </small>
            )}

            {saveStatus ===
              "error" && (
              <small className="errorText">
                ⚠ {saveMessage}
              </small>
            )}

          </div>

          <div className="reportToolbarButtons">

            <button
              type="button"
              className="reportBackButton"
              onClick={() =>
                router.push(
                  "/results"
                )
              }
            >
              ← Edit Results
            </button>

            <button
              type="button"
              className="reportPrintButton"
              onClick={
                printReport
              }
            >
              🖨 Print / Save PDF
            </button>

            <button
              type="button"
              className="reportNewButton"
              onClick={
                newPatient
              }
            >
              + New Patient
            </button>

          </div>

        </div>

        {/* =================================================
            A4 REPORT
        ================================================= */}

        <main
          className={
            labSettings.letterhead
              ? "printableReport hasLetterhead"
              : "printableReport"
          }
        >

          {/* =================================================
              ORIGINAL LETTERHEAD
          ================================================= */}

          {labSettings.letterhead && (
            <img
              src={
                labSettings.letterhead
              }
              alt="Laboratory Letterhead"
              className="letterheadImage"
            />
          )}

          {/* =================================================
              REPORT CONTENT
          ================================================= */}

          <div
            className={
              labSettings.letterhead
                ? "reportContent letterheadContent"
                : "reportContent"
            }
          >

            {/* =================================================
                NORMAL HEADER
                ONLY IF LETTERHEAD NOT AVAILABLE
            ================================================= */}

            {!labSettings.letterhead &&
              labSettings.reportHeader && (
                <>
                  <header className="normalLabHeader">

                    {labSettings.showLogo && (
                      <div className="reportLogo">
                        N+
                      </div>
                    )}

                    <div className="normalLabIdentity">

                      <h1>
                        {labSettings.labName ||
                          "NIDAN PATHOLOGY LAB"}
                      </h1>

                      <p className="reportTagline">
                        Accurate • Reliable • Professional
                      </p>

                      <p>
                        Clinical Pathology &
                        Diagnostic Laboratory
                      </p>

                    </div>

                    <div className="reportHeaderRight">

                      <strong>
                        LABORATORY REPORT
                      </strong>

                      <span>
                        Report Date:{" "}
                        {reportDate || "-"}
                      </span>

                      {reportNo && (
                        <span>
                          {reportNo}
                        </span>
                      )}

                    </div>

                  </header>

                  <div className="reportAccentLine" />
                </>
              )}

            {/* =================================================
                PATIENT INFORMATION
            ================================================= */}

            <section className="reportPatientSection">

              <div className="reportSectionTitle">
                PATIENT INFORMATION
              </div>

              <div className="reportPatientGrid">

                <div>
                  <span>
                    PATIENT ID
                  </span>

                  <strong>
                    {patient.patientId ||
                      patient.id ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    PATIENT NAME
                  </span>

                  <strong>
                    {patient.name ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    AGE / SEX
                  </span>

                  <strong>
                    {patient.age ||
                      "-"}{" "}
                    Years /{" "}
                    {patient.gender ||
                      patient.sex ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    MOBILE
                  </span>

                  <strong>
                    {patient.mobile ||
                      patient.mobileNumber ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    REF. DOCTOR
                  </span>

                  <strong>
                    {patient.doctor ||
                      patient.refDoctor ||
                      patient.referringDoctor ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    SAMPLE DATE
                  </span>

                  <strong>
                    {patient.sampleDate ||
                      reportDate ||
                      "-"}
                  </strong>
                </div>

              </div>

            </section>

            {/* =================================================
                INVESTIGATIONS
            ================================================= */}

            <section className="investigationReport">

              {reportTests.length ===
              0 ? (

                <div className="reportEmpty">
                  No investigations selected.
                </div>

              ) : (

                reportTests.map(
                  (
                    test,
                    testIndex
                  ) => (

                    <section
                      className="reportTestSection"
                      key={
                        test.id ||
                        `report-test-${testIndex}`
                      }
                    >

                      <div className="reportCategory">
                        {(
                          test.category ||
                          "PATHOLOGY"
                        ).toUpperCase()}
                      </div>

                      <div className="reportTestHeading">
                        {test.name}
                      </div>

                      <div className="reportTableWrapper">

                        <table className="finalReportTable">

                          <thead>

                            <tr>

                              <th>
                                INVESTIGATION
                              </th>

                              {labSettings.showFlag && (
                                <th>
                                  FLAG
                                </th>
                              )}

                              <th>
                                RESULT
                              </th>

                              {labSettings.showReferenceRange && (
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

                            {test.parameters
                              .length ===
                            0 ? (

                              <tr>

                                <td
                                  colSpan={
                                    labSettings.showFlag &&
                                    labSettings.showReferenceRange
                                      ? 5
                                      : 3
                                  }
                                  className="noParameter"
                                >
                                  No parameters available
                                </td>

                              </tr>

                            ) : (

                              test.parameters.map(
                                (
                                  parameter,
                                  index
                                ) => (

                                  <tr
                                    key={`${test.id}-${index}`}
                                  >

                                    <td>
                                      <strong>
                                        {
                                          parameter.name
                                        }
                                      </strong>
                                    </td>

                                    {labSettings.showFlag && (
                                      <td className="flagCell">

                                        {parameter.flag && (
                                          <span
                                            className={`reportFlag ${
                                              parameter.flag ===
                                              "H"
                                                ? "highFlag"
                                                : "lowFlag"
                                            }`}
                                          >
                                            {
                                              parameter.flag
                                            }
                                          </span>
                                        )}

                                      </td>
                                    )}

                                    <td
                                      className={
                                        parameter.flag
                                          ? "abnormalResult"
                                          : "normalResult"
                                      }
                                    >
                                      {parameter.result !==
                                        "" &&
                                      parameter.result !==
                                        null &&
                                      parameter.result !==
                                        undefined
                                        ? parameter.result
                                        : "-"}
                                    </td>

                                    {labSettings.showReferenceRange && (
                                      <td>
                                        {
                                          parameter.referenceRange
                                        }
                                      </td>
                                    )}

                                    <td>
                                      {
                                        parameter.unit
                                      }
                                    </td>

                                  </tr>

                                )
                              )

                            )}

                          </tbody>

                        </table>

                      </div>

                    </section>

                  )
                )

              )}

            </section>

            {/* =================================================
                SIGNATURE
            ================================================= */}

            <section className="reportSignatureSection">

              <div className="reportSignatureBox">

                <div className="signatureSpace" />

                <strong>
                  Lab Technician
                </strong>

                <span>
                  {labSettings.labName ||
                    "NIDAN PATHOLOGY LAB"}
                </span>

              </div>

              <div className="reportSignatureBox">

                <div className="signatureSpace" />

                <strong>
                  Authorized Signatory
                </strong>

                <span>
                  Signature & Seal
                </span>

              </div>

            </section>

            {/* =================================================
                NOTE
            ================================================= */}

            <section className="reportNotes">

              <strong>
                Note:
              </strong>

              <p>
                Reference intervals may vary
                according to laboratory method,
                age, sex and clinical circumstances.
                Laboratory results should be
                interpreted with relevant clinical
                findings.
              </p>

            </section>

            {/* =================================================
                NORMAL FOOTER
                ONLY WITHOUT LETTERHEAD
            ================================================= */}

            {!labSettings.letterhead && (
              <footer className="reportFooter">

                <span>
                  {labSettings.labName ||
                    "NIDAN PATHOLOGY LAB"}
                </span>

                <strong>
                  *** END OF REPORT ***
                </strong>

                <span>
                  Computer Generated Report
                </span>

              </footer>
            )}

          </div>

        </main>

      </div>

      {/* =====================================================
          COMPLETE CSS
      ===================================================== */}

      <style jsx global>{`

        /* =====================================================
           GLOBAL
        ===================================================== */

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #f1f5f9;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        body {
          overflow-x: hidden;
        }

        button {
          font-family: inherit;
        }

        /* =====================================================
           LOADING
        ===================================================== */

        .reportLoading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;

          background: #f1f5f9;

          color: #64748b;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size: 14px;
        }

        /* =====================================================
           MAIN PAGE
        ===================================================== */

        .finalReportPage {
          width: 100%;
          min-height: 100vh;

          padding: 18px;

          background: #f1f5f9;
        }

        /* =====================================================
           SCREEN TOOLBAR
        ===================================================== */

        .reportScreenToolbar {
          width: 100%;
          max-width: 1180px;

          min-height: 72px;

          margin:
            0 auto 18px;

          padding:
            13px 18px;

          background: #ffffff;

          border:
            1px solid #e2e8f0;

          border-radius: 10px;

          display: flex;

          align-items: center;

          justify-content:
            space-between;

          gap: 18px;

          box-shadow:
            0 3px 12px
            rgba(
              15,
              23,
              42,
              0.07
            );
        }

        .reportToolbarInfo {
          min-width: 0;

          display: flex;

          flex-direction: column;

          gap: 3px;
        }

        .reportToolbarInfo strong {
          font-size: 16px;
          color: #172033;
        }

        .reportToolbarInfo small {
          font-size: 10px;
          color: #64748b;
        }

        .reportToolbarButtons {
          display: flex;

          align-items: center;

          justify-content:
            flex-end;

          gap: 8px;

          flex-shrink: 0;
        }

        .reportToolbarButtons button {
          min-height: 40px;

          padding:
            8px 13px;

          border-radius: 8px;

          border:
            1px solid #d8e0e7;

          background: #ffffff;

          color: #334155;

          font-size: 11px;

          font-weight: 700;

          cursor: pointer;

          white-space: nowrap;
        }

        .reportBackButton {
          background: #ffffff;
        }

        .reportPrintButton {
          background: #087f7d !important;

          color: #ffffff !important;

          border-color:
            #087f7d !important;
        }

        .reportNewButton {
          color: #dc2626 !important;
        }

        .savingText {
          color:
            #b7791f !important;

          font-weight: 700;
        }

        .savedText {
          color:
            #15803d !important;

          font-weight: 700;
        }

        .errorText {
          color:
            #dc2626 !important;

          font-weight: 700;
        }

        /* =====================================================
           A4 PAPER

           EXACT A4 RATIO
        ===================================================== */

        .printableReport {

          position: relative;

          width: 210mm;

          height: 297mm;

          min-height: 297mm;

          margin: 0 auto;

          background:
            #ffffff;

          overflow: hidden;

          box-shadow:
            0 8px 30px
            rgba(
              15,
              23,
              42,
              0.12
            );
        }

        /* =====================================================
           LETTERHEAD IMAGE

           Original uploaded image is preserved.
        ===================================================== */

        .letterheadImage {

          position: absolute;

          left: 0;
          top: 0;

          width: 100%;
          height: 100%;

          display: block;

          object-fit: fill;

          z-index: 0;

          pointer-events: none;

          user-select: none;

          print-color-adjust:
            exact;

          -webkit-print-color-adjust:
            exact;
        }

        /* =====================================================
           REPORT CONTENT

           IMPORTANT:
           Content sits between the
           original letterhead header
           and original letterhead footer.
        ===================================================== */

        .reportContent {

          position: relative;

          z-index: 2;

          width: 100%;

          height: 100%;

          padding:
            12mm;
        }

        .letterheadContent {

          /*
             Header area of uploaded
             letterhead.

             Report starts below
             original header.
          */

          padding-top: 31%;

          /*
             Keep content away from
             left/right edge.
          */

          padding-left: 8%;

          padding-right: 8%;

          /*
             Footer area reserved
             for original letterhead.
          */

          padding-bottom: 18%;
        }

        /* =====================================================
           NORMAL HEADER
        ===================================================== */

        .normalLabHeader {

          display: grid;

          grid-template-columns:
            50px
            minmax(0,1fr)
            auto;

          align-items: center;

          gap: 12px;
        }

        .reportLogo {

          width: 50px;
          height: 50px;

          border-radius: 10px;

          background:
            #087f7d;

          color:
            #ffffff;

          display: flex;

          align-items: center;

          justify-content: center;

          font-size: 21px;

          font-weight: 900;
        }

        .normalLabIdentity {
          min-width: 0;
        }

        .normalLabIdentity h1 {

          margin: 0;

          font-size: 22px;

          color:
            #087f7d;

          line-height: 1.15;
        }

        .normalLabIdentity p {

          margin:
            3px 0 0;

          font-size: 9px;

          color:
            #475569;
        }

        .reportTagline {
          font-weight: 700;
        }

        .reportHeaderRight {

          display: flex;

          flex-direction: column;

          align-items: flex-end;

          gap: 3px;

          text-align: right;
        }

        .reportHeaderRight strong {

          font-size: 10px;

          color:
            #087f7d;
        }

        .reportHeaderRight span {

          font-size: 8px;

          color:
            #64748b;
        }

        .reportAccentLine {

          width: 100%;

          height: 3px;

          margin:
            9px 0 12px;

          background:
            #087f7d;

          border-radius: 3px;
        }

        /* =====================================================
           PATIENT INFORMATION
        ===================================================== */

        .reportPatientSection {

          width: 100%;

          margin-top: 0;

          margin-bottom: 10px;

          border:
            1px solid #aebdc7;

          border-radius: 3px;

          overflow: hidden;

          background:
            rgba(
              255,
              255,
              255,
              0.96
            );

          page-break-inside:
            avoid;

          break-inside:
            avoid;
        }

        .reportSectionTitle {

          padding:
            6px 8px;

          background:
            rgba(
              232,
              248,
              247,
              0.97
            );

          border-left:
            4px solid #087f7d;

          color:
            #087f7d;

          font-size: 8px;

          font-weight: 900;

          letter-spacing:
            0.45px;
        }

        .reportPatientGrid {

          display: grid;

          grid-template-columns:
            repeat(3,1fr);
        }

        .reportPatientGrid > div {

          min-height: 39px;

          padding:
            6px 8px;

          border-right:
            1px solid #d4dde3;

          border-bottom:
            1px solid #d4dde3;

          background:
            rgba(
              255,
              255,
              255,
              0.93
            );
        }

        .reportPatientGrid
        > div:nth-child(3n) {

          border-right: 0;
        }

        .reportPatientGrid
        > div:nth-last-child(-n+3) {

          border-bottom: 0;
        }

        .reportPatientGrid span {

          display: block;

          margin-bottom: 2px;

          font-size: 6.3px;

          line-height: 1.2;

          color:
            #64748b;

          font-weight: 800;
        }

        .reportPatientGrid strong {

          display: block;

          font-size: 8px;

          line-height: 1.25;

          color:
            #172033;

          word-break:
            break-word;
        }

        /* =====================================================
           INVESTIGATION
        ===================================================== */

        .investigationReport {

          width: 100%;
        }

        .reportTestSection {

          width: 100%;

          margin-bottom: 9px;

          page-break-inside:
            avoid;

          break-inside:
            avoid;
        }

        .reportCategory {

          margin-bottom: 2px;

          text-align: center;

          font-size: 6.5px;

          color:
            #64748b;

          font-weight: 900;

          letter-spacing:
            0.6px;
        }

        .reportTestHeading {

          padding:
            6px 8px;

          background:
            rgba(
              239,
              245,
              248,
              0.97
            );

          border:
            1px solid #c3cfd6;

          border-left:
            4px solid #087f7d;

          color:
            #172033;

          font-size: 8.5px;

          line-height: 1.2;

          font-weight: 900;

          text-transform:
            uppercase;
        }

        /* =====================================================
           TABLE
        ===================================================== */

        .reportTableWrapper {

          width: 100%;

          overflow: visible;
        }

        .finalReportTable {

          width: 100%;

          border-collapse:
            collapse;

          table-layout:
            fixed;

          background:
            rgba(
              255,
              255,
              255,
              0.96
            );
        }

        .finalReportTable th {

          padding:
            5px 4px;

          border:
            1px solid #aebbc4;

          background:
            rgba(
              228,
              235,
              239,
              0.98
            );

          color:
            #263442;

          font-size: 6.4px;

          line-height: 1.15;

          font-weight: 900;

          text-align: center;

          vertical-align: middle;
        }

        .finalReportTable td {

          padding:
            5px 4px;

          border:
            1px solid #c7d1d7;

          background:
            rgba(
              255,
              255,
              255,
              0.94
            );

          color:
            #172033;

          font-size: 7.6px;

          line-height: 1.25;

          vertical-align: middle;

          overflow-wrap:
            anywhere;

          word-break:
            normal;
        }

        /* =====================================================
           TABLE WIDTHS

           With FLAG + REFERENCE RANGE
        ===================================================== */

        .finalReportTable
        th:nth-child(1),
        .finalReportTable
        td:nth-child(1) {

          width: 31%;

          text-align:
            left;
        }

        .finalReportTable
        th:nth-child(2),
        .finalReportTable
        td:nth-child(2) {

          width: 9%;

          text-align:
            center;
        }

        .finalReportTable
        th:nth-child(3),
        .finalReportTable
        td:nth-child(3) {

          width: 16%;

          text-align:
            center;
        }

        .finalReportTable
        th:nth-child(4),
        .finalReportTable
        td:nth-child(4) {

          width: 29%;

          text-align:
            center;
        }

        .finalReportTable
        th:nth-child(5),
        .finalReportTable
        td:nth-child(5) {

          width: 15%;

          text-align:
            center;
        }

        /* =====================================================
           RESULT
        ===================================================== */

        .normalResult {

          text-align:
            center !important;

          font-weight:
            700;
        }

        .abnormalResult {

          text-align:
            center !important;

          color:
            #c62828 !important;

          font-weight:
            900;
        }

        /* =====================================================
           FLAG
        ===================================================== */

        .flagCell {

          text-align:
            center !important;
        }

        .reportFlag {

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          min-width:
            17px;

          min-height:
            15px;

          padding:
            2px 4px;

          border-radius:
            3px;

          font-size:
            6px;

          font-weight:
            900;
        }

        .highFlag {

          background:
            #fee2e2;

          color:
            #b91c1c;
        }

        .lowFlag {

          background:
            #dbeafe;

          color:
            #1d4ed8;
        }

        /* =====================================================
           EMPTY
        ===================================================== */

        .reportEmpty {

          padding:
            20px;

          text-align:
            center;

          color:
            #64748b;

          border:
            1px dashed #cbd5e1;

          background:
            rgba(
              255,
              255,
              255,
              0.95
            );
        }

        .noParameter {

          padding:
            10px !important;

          text-align:
            center !important;

          color:
            #64748b !important;
        }

        /* =====================================================
           SIGNATURE
        ===================================================== */

        .reportSignatureSection {

          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 55px;

          margin-top: 15px;

          page-break-inside:
            avoid;

          break-inside:
            avoid;
        }

        .reportSignatureBox {

          text-align:
            center;

          font-size:
            7.5px;

          color:
            #334155;

          background:
            rgba(
              255,
              255,
              255,
              0.88
            );
        }

        .signatureSpace {

          height:
            23px;

          margin-bottom:
            3px;

          border-bottom:
            1px solid #64748b;
        }

        .reportSignatureBox strong {

          display:
            block;

          font-size:
            7.5px;
        }

        .reportSignatureBox span {

          display:
            block;

          margin-top:
            1px;

          color:
            #64748b;

          font-size:
            6.5px;
        }

        /* =====================================================
           NOTE
        ===================================================== */

        .reportNotes {

          margin-top:
            9px;

          padding-top:
            5px;

          border-top:
            1px solid #cbd5e1;

          color:
            #64748b;

          font-size:
            6.2px;

          line-height:
            1.35;

          background:
            rgba(
              255,
              255,
              255,
              0.84
            );

          page-break-inside:
            avoid;

          break-inside:
            avoid;
        }

        .reportNotes strong {

          color:
            #334155;
        }

        .reportNotes p {

          margin:
            2px 0 0;
        }

        /* =====================================================
           NORMAL FOOTER
        ===================================================== */

        .reportFooter {

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            10px;

          margin-top:
            10px;

          padding-top:
            6px;

          border-top:
            1px solid #dbe3ea;

          font-size:
            6.5px;

          color:
            #64748b;
        }

        .reportFooter strong {

          color:
            #087f7d;
        }

        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 900px) {

          .finalReportPage {

            padding:
              8px;
          }

          .reportScreenToolbar {

            flex-direction:
              column;

            align-items:
              flex-start;

            position:
              relative;
          }

          .reportToolbarInfo {

            width:
              100%;
          }

          .reportToolbarButtons {

            width:
              100%;

            display:
              grid;

            grid-template-columns:
              repeat(3,1fr);
          }

          .reportToolbarButtons button {

            width:
              100%;
          }

          .printableReport {

            width:
              100%;

            height:
              auto;

            min-height:
              0;

            aspect-ratio:
              210 / 297;
          }

          .reportContent {

            height:
              100%;
          }

          .letterheadContent {

            padding-top:
              31%;

            padding-left:
              7%;

            padding-right:
              7%;

            padding-bottom:
              18%;
          }
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 600px) {

          .finalReportPage {

            padding:
              5px;

            background:
              #eef2f7;
          }

          .reportScreenToolbar {

            margin-bottom:
              7px;

            padding:
              10px;

            border-radius:
              8px;
          }

          .reportToolbarInfo strong {

            font-size:
              14px;
          }

          .reportToolbarInfo small {

            font-size:
              8.5px;
          }

          .reportToolbarButtons {

            display:
              grid;

            grid-template-columns:
              1fr;

            gap:
              6px;
          }

          .reportToolbarButtons button {

            min-height:
              40px;

            font-size:
              10px;
          }

          .printableReport {

            width:
              100%;

            height:
              auto;

            min-height:
              0;

            aspect-ratio:
              210 / 297;

            box-shadow:
              0 3px 14px
              rgba(
                15,
                23,
                42,
                0.12
              );
          }

          /*
             Letterhead header takes
             approximately 30% of page.
          */

          .letterheadContent {

            padding-top:
              30.5%;

            padding-left:
              6.5%;

            padding-right:
              6.5%;

            padding-bottom:
              18%;
          }

          .reportPatientSection {

            margin-bottom:
              7px;
          }

          .reportSectionTitle {

            padding:
              5px 6px;

            font-size:
              6.5px;
          }

          .reportPatientGrid > div {

            min-height:
              31px;

            padding:
              4px 5px;
          }

          .reportPatientGrid span {

            font-size:
              5px;
          }

          .reportPatientGrid strong {

            font-size:
              6.3px;
          }

          .reportTestSection {

            margin-bottom:
              6px;
          }

          .reportCategory {

            font-size:
              5px;

            margin-bottom:
              1px;
          }

          .reportTestHeading {

            padding:
              4px 5px;

            font-size:
              6.5px;
          }

          .finalReportTable th {

            padding:
              3px 2px;

            font-size:
              4.6px;
          }

          .finalReportTable td {

            padding:
              3px 2px;

            font-size:
              5.8px;

            line-height:
              1.15;
          }

          .reportFlag {

            min-width:
              13px;

            min-height:
              11px;

            padding:
              1px 3px;

            font-size:
              4.8px;
          }

          .reportSignatureSection {

            gap:
              18px;

            margin-top:
              9px;
          }

          .reportSignatureBox {

            font-size:
              5.8px;
          }

          .signatureSpace {

            height:
              18px;
          }

          .reportSignatureBox strong {

            font-size:
              5.8px;
          }

          .reportSignatureBox span {

            font-size:
              5px;
          }

          .reportNotes {

            margin-top:
              6px;

            padding-top:
              3px;

            font-size:
              4.8px;

            line-height:
              1.25;
          }

          .reportFooter {

            font-size:
              5px;
          }
        }

        /* =====================================================
           VERY SMALL PHONE
        ===================================================== */

        @media (max-width: 380px) {

          .letterheadContent {

            padding-top:
              30%;

            padding-left:
              6%;

            padding-right:
              6%;

            padding-bottom:
              18%;
          }

          .reportPatientGrid > div {

            min-height:
              29px;
          }

          .finalReportTable th {

            font-size:
              4.2px;
          }

          .finalReportTable td {

            font-size:
              5.3px;
          }
        }

        /* =====================================================
           PRINT / SAVE PDF
        ===================================================== */

        @media print {

          @page {

            size:
              A4;

            margin:
              0;
          }

          html,
          body {

            width:
              210mm;

            height:
              297mm;

            min-height:
              297mm;

            margin:
              0 !important;

            padding:
              0 !important;

            background:
              #ffffff !important;
          }

          body {

            overflow:
              visible !important;
          }

          .finalReportPage {

            width:
              210mm;

            height:
              297mm;

            min-height:
              297mm;

            margin:
              0 !important;

            padding:
              0 !important;

            background:
              #ffffff !important;
          }

          .reportScreenToolbar {

            display:
              none !important;
          }

          .printableReport {

            position:
              relative !important;

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
              0 !important;

            overflow:
              hidden !important;

            background:
              #ffffff !important;

            box-shadow:
              none !important;

            page-break-after:
              always;
          }

          /* =================================================
             ORIGINAL LETTERHEAD
          ================================================= */

          .letterheadImage {

            position:
              absolute !important;

            left:
              0 !important;

            top:
              0 !important;

            width:
              210mm !important;

            height:
              297mm !important;

            object-fit:
              fill !important;

            display:
              block !important;

            z-index:
              0 !important;

            print-color-adjust:
              exact !important;

            -webkit-print-color-adjust:
              exact !important;
          }

          /* =================================================
             REPORT CONTENT
          ================================================= */

          .reportContent {

            position:
              relative !important;

            z-index:
              2 !important;

            width:
              210mm !important;

            height:
              297mm !important;

            min-height:
              297mm !important;

            padding:
              12mm !important;
          }

          .letterheadContent {

            /*
               ORIGINAL LETTERHEAD HEADER
            */

            padding-top:
              31% !important;

            /*
               CONTENT WIDTH
            */

            padding-left:
              8% !important;

            padding-right:
              8% !important;

            /*
               ORIGINAL LETTERHEAD FOOTER
            */

            padding-bottom:
              18% !important;
          }

          /* =================================================
             PRINT SIZES
          ================================================= */

          .reportPatientGrid span {

            font-size:
              6.3px !important;
          }

          .reportPatientGrid strong {

            font-size:
              8px !important;
          }

          .reportSectionTitle {

            font-size:
              8px !important;
          }

          .reportTestHeading {

            font-size:
              8.5px !important;
          }

          .reportCategory {

            font-size:
              6.5px !important;
          }

          .finalReportTable th {

            font-size:
              6.4px !important;

            padding:
              5px 4px !important;
          }

          .finalReportTable td {

            font-size:
              7.6px !important;

            padding:
              5px 4px !important;
          }

          .reportFlag {

            font-size:
              6px !important;
          }

          .reportSignatureBox {

            font-size:
              7.5px !important;
          }

          .reportNotes {

            font-size:
              6.2px !important;
          }

          /* =================================================
             AVOID PAGE BREAK
          ================================================= */

          .reportPatientSection,
          .reportTestSection,
          .reportSignatureSection,
          .reportNotes {

            page-break-inside:
              avoid !important;

            break-inside:
              avoid !important;
          }

          .finalReportTable tr {

            page-break-inside:
              avoid !important;

            break-inside:
              avoid !important;
          }

          .finalReportTable thead {

            display:
              table-header-group;
          }

          /* =================================================
             KEEP COLORS
          ================================================= */

          .letterheadImage,
          .reportPatientSection,
          .reportPatientGrid > div,
          .reportTestHeading,
          .finalReportTable,
          .finalReportTable th,
          .finalReportTable td,
          .reportFlag {

            print-color-adjust:
              exact !important;

            -webkit-print-color-adjust:
              exact !important;
          }
        }

      `}</style>
    </>
  );
}
