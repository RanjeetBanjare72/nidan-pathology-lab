"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

/* =====================================================
   DEFAULT SETTINGS
===================================================== */

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

  const [patient, setPatient] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
  const [results, setResults] = useState({});

  const [reportDate, setReportDate] = useState("");
  const [reportNo, setReportNo] = useState("");

  const [saveStatus, setSaveStatus] =
    useState("loading");

  const [saveMessage, setSaveMessage] =
    useState("");

  /* =====================================================
     LAB SETTINGS
  ===================================================== */

  const [labSettings, setLabSettings] =
    useState(DEFAULT_SETTINGS);

  const savingRef = useRef(false);
  const saveTimerRef = useRef(null);

  /* =====================================================
     LOAD REPORT DATA
  ===================================================== */

  useEffect(() => {
    try {
      const savedPatient = JSON.parse(
        localStorage.getItem(
          "nidanPatient"
        ) || "{}"
      );

      const savedTests = JSON.parse(
        localStorage.getItem(
          "nidanSelectedTests"
        ) || "[]"
      );

      const savedResults = JSON.parse(
        localStorage.getItem(
          "nidanResults"
        ) || "{}"
      );

      /* ================= SETTINGS ================= */

      const savedSettings = JSON.parse(
        localStorage.getItem(
          "nidanLabSettings"
        ) || "{}"
      );

      setPatient(
        savedPatient || {}
      );

      setSelectedTests(
        Array.isArray(savedTests)
          ? savedTests
          : []
      );

      setResults(
        savedResults || {}
      );

      setLabSettings({
        ...DEFAULT_SETTINGS,
        ...(savedSettings || {}),
      });

      /* ================= DATE ================= */

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
    } catch (error) {
      console.error(
        "REPORT DATA LOAD ERROR:",
        error
      );

      setSaveStatus("error");

      setSaveMessage(
        "Report data load nahi hua."
      );
    }
  }, []);

  /* =====================================================
     NORMALIZE NAME
  ===================================================== */

  function normalizeName(name = "") {
    return String(name)
      .toLowerCase()
      .replace(/[()]/g, "")
      .replace(/[./_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* =====================================================
     GENDER
  ===================================================== */

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

  /* =====================================================
     AGE
  ===================================================== */

  function getAge() {
    const age = parseFloat(
      patient.age
    );

    return Number.isNaN(age)
      ? null
      : age;
  }

  /* =====================================================
     DEFAULT REFERENCE DATABASE
  ===================================================== */

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

    if (name === "neutrophils") {
      return {
        min: 40,
        max: 75,
        unit: "%",
        range: "40 - 75",
      };
    }

    if (name === "lymphocytes") {
      return {
        min: 20,
        max: 40,
        unit: "%",
        range: "20 - 40",
      };
    }

    if (name === "eosinophils") {
      return {
        min: 1,
        max: 6,
        unit: "%",
        range: "1 - 6",
      };
    }

    if (name === "monocytes") {
      return {
        min: 1,
        max: 10,
        unit: "%",
        range: "1 - 10",
      };
    }

    if (name === "basophils") {
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
      name.includes("haematocrit") ||
      name.includes("hematocrit")
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

    /* ================= BLOOD SUGAR ================= */

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

    if (name === "total protein") {
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

    if (name.includes("vldl")) {
      return {
        min: 5,
        max: 40,
        unit: "mg/dL",
        range: "5 - 40",
      };
    }

    /* ================= HbA1c ================= */

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

  /* =====================================================
     RESOLVE PARAMETER
  ===================================================== */

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
      getDefaultReference(
        name
      );

    let min =
      parameter.min;

    let max =
      parameter.max;

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

  /* =====================================================
     PARAMETER KEY
  ===================================================== */

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

  /* =====================================================
     PARAMETER NAME
  ===================================================== */

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
      `Investigation ${index + 1}`
    );
  }

  /* =====================================================
     FLAG
  ===================================================== */

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
        Number(
          resolved.min
        )
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
        Number(
          resolved.max
        )
      ) {
        return "H";
      }
    }

    return "";
  }

  /* =====================================================
     CATEGORY
  ===================================================== */

  function getCategory(
    test
  ) {
    return (
      test?.category ||
      test?.department ||
      "PATHOLOGY"
    );
  }

  /* =====================================================
     BUILD REPORT TESTS
  ===================================================== */

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

        return {
          id:
            test?.id ??
            test?.testId ??
            `test-${testIndex}`,

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
                        test?.id ??
                          test?.testId ??
                          `test-${testIndex}`,
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

  /* =====================================================
     AUTO SAVE
  ===================================================== */

  useEffect(() => {
    if (
      !patient ||
      Object.keys(
        patient
      ).length === 0 ||
      selectedTests.length === 0
    ) {
      return;
    }

    if (
      labSettings.autoSave ===
      false
    ) {
      return;
    }

    if (
      saveTimerRef.current
    ) {
      clearTimeout(
        saveTimerRef.current
      );
    }

    saveTimerRef.current =
      setTimeout(() => {
        saveReportAutomatically();
      }, 400);

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

  /* =====================================================
     SAVE REPORT
  ===================================================== */

  async function saveReportAutomatically() {
    if (savingRef.current) {
      return;
    }

    if (
      !patient ||
      Object.keys(
        patient
      ).length === 0 ||
      selectedTests.length === 0
    ) {
      return;
    }

    savingRef.current = true;

    try {
      setSaveStatus(
        "saving"
      );

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

        existingReportNo =
          null;
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

      /* ================= CHECK ================= */

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

      /* ================= UPDATE ================= */

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

      /* ================= INSERT ================= */

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

      /* ================= LOCAL STORAGE ================= */

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

      setSaveStatus(
        "saved"
      );

      setSaveMessage(
        "Report saved successfully"
      );
    } catch (error) {
      console.error(
        "AUTO REPORT SAVE ERROR:",
        error
      );

      setSaveStatus(
        "error"
      );

      setSaveMessage(
        error?.message ||
          "Report save nahi hua."
      );
    } finally {
      savingRef.current =
        false;
    }
  }

  /* =====================================================
     PRINT
  ===================================================== */

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

  /* =====================================================
     NEW PATIENT
  ===================================================== */

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

  /* =====================================================
     REPORT DATA
  ===================================================== */

  const reportTests =
    buildReportTests(
      selectedTests,
      results
    );

  const hasLetterhead =
    Boolean(
      labSettings?.letterhead
    );

  /* =====================================================
     UI
  ===================================================== */

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
              Review report before printing
              or saving PDF
            </small>

            {reportNo && (
              <small>
                Report No:{" "}
                {reportNo}
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
                ⚠{" "}
                {saveMessage}
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
            hasLetterhead
              ? "printableReport printableWithLetterhead"
              : "printableReport"
          }
        >

          {/* =================================================
              LETTERHEAD BACKGROUND
          ================================================= */}

          {hasLetterhead && (
            <div
              className="letterheadBackground"
              style={{
                backgroundImage: `url("${labSettings.letterhead}")`,
              }}
            />
          )}

          {/* =================================================
              REPORT CONTENT
          ================================================= */}

          <div className="reportContent">

            {/* =================================================
                DEFAULT HEADER
            ================================================= */}

            {!hasLetterhead &&
              labSettings.reportHeader && (
                <>
                  <header className="defaultLabHeader">

                    {labSettings.showLogo && (
                      <div className="reportLogo">
                        N+
                      </div>
                    )}

                    <div className="reportLabIdentity">

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

                      {labSettings.labAddress && (
                        <p>
                          {
                            labSettings.labAddress
                          }
                        </p>
                      )}

                      {(
                        labSettings.phone ||
                        labSettings.email
                      ) && (
                        <p>
                          {labSettings.phone &&
                            `Phone: ${labSettings.phone}`}

                          {labSettings.phone &&
                            labSettings.email &&
                            "  |  "}

                          {labSettings.email &&
                            `Email: ${labSettings.email}`}
                        </p>
                      )}

                    </div>

                    <div className="reportHeaderRight">

                      <strong>
                        LABORATORY REPORT
                      </strong>

                      <span>
                        Report Date:{" "}
                        {reportDate ||
                          "-"}
                      </span>

                      {labSettings.registrationNo && (
                        <span>
                          Reg. No:{" "}
                          {
                            labSettings.registrationNo
                          }
                        </span>
                      )}

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
                    Patient ID
                  </span>

                  <strong>
                    {patient.patientId ||
                      patient.id ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Patient Name
                  </span>

                  <strong>
                    {patient.name ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Age / Sex
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
                    Mobile
                  </span>

                  <strong>
                    {patient.mobile ||
                      patient.mobileNumber ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Ref. Doctor
                  </span>

                  <strong>
                    {patient.doctor ||
                      patient.refDoctor ||
                      labSettings.doctorName ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Sample Date
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

                              <th>
                                RESULT
                              </th>

                              <th>
                                UNIT
                              </th>

                              {labSettings.showReferenceRange && (
                                <th>
                                  REFERENCE RANGE
                                </th>
                              )}

                              {labSettings.showFlag && (
                                <th>
                                  FLAG
                                </th>
                              )}

                            </tr>

                          </thead>

                          <tbody>

                            {test.parameters
                              .length ===
                            0 ? (

                              <tr>

                                <td
                                  colSpan={
                                    3 +
                                    (labSettings.showReferenceRange
                                      ? 1
                                      : 0) +
                                    (labSettings.showFlag
                                      ? 1
                                      : 0)
                                  }
                                  className="noParameter"
                                >
                                  No parameters
                                  available
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

                                    <td>
                                      {
                                        parameter.unit
                                      }
                                    </td>

                                    {labSettings.showReferenceRange && (
                                      <td>
                                        {
                                          parameter.referenceRange
                                        }
                                      </td>
                                    )}

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
                    "NIDAN Pathology Lab"}
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
                age, sex and clinical
                circumstances. Laboratory
                results should be interpreted
                with relevant clinical findings.
              </p>

            </section>

            {/* =================================================
                FOOTER WHEN NO LETTERHEAD
            ================================================= */}

            {!hasLetterhead && (
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

        html {
          margin: 0;
          padding: 0;
        }

        body {
          margin: 0;
          padding: 0;
          background: #f1f5f9;
          color: #172033;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          overflow-x: hidden;
        }

        button {
          font-family: inherit;
        }

        /* =====================================================
           MAIN PAGE
        ===================================================== */

        .finalReportPage {
          width: 100%;
          min-height: 100vh;
          background: #f1f5f9;
          padding: 18px;
          padding-bottom: 40px;
        }

        /* =====================================================
           TOOLBAR
        ===================================================== */

        .reportScreenToolbar {
          width: 100%;
          max-width: 1180px;
          min-height: 76px;
          margin: 0 auto 18px;
          padding: 14px 20px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 20px;

          position: sticky;
          top: 0;

          z-index: 50;

          box-shadow:
            0 3px 12px
            rgba(15, 23, 42, 0.07);
        }

        .reportToolbarInfo {
          min-width: 0;

          display: flex;
          flex-direction: column;

          gap: 3px;
        }

        .reportToolbarInfo strong {
          font-size: 17px;
          line-height: 1.2;
          color: #172033;
        }

        .reportToolbarInfo small {
          color: #64748b;
          font-size: 11px;
          line-height: 1.3;
        }

        .reportToolbarButtons {
          display: flex;
          align-items: center;
          justify-content: flex-end;

          gap: 8px;
          flex-wrap: wrap;

          flex-shrink: 0;
        }

        .reportToolbarButtons button {
          min-height: 40px;

          padding: 9px 14px;

          border-radius: 8px;

          border: 1px solid #dbe3ea;

          cursor: pointer;

          font-size: 12px;
          font-weight: 700;

          white-space: nowrap;

          transition:
            opacity 0.2s ease,
            transform 0.1s ease;
        }

        .reportToolbarButtons button:hover {
          opacity: 0.9;
        }

        .reportToolbarButtons button:active {
          transform:
            translateY(1px);
        }

        .reportBackButton {
          background: #ffffff;
          color: #334155;
        }

        .reportPrintButton {
          background: #087f7d;
          border-color:
            #087f7d !important;
          color: #ffffff;
        }

        .reportNewButton {
          background: #ffffff;
          color: #dc2626;
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
           A4 REPORT
        ===================================================== */

        .printableReport {
          position: relative;

          width: 210mm;
          min-height: 297mm;

          margin: 0 auto;

          background: #ffffff;

          box-shadow:
            0 8px 30px
            rgba(15, 23, 42, 0.12);

          overflow: hidden;
        }

        /* =====================================================
           LETTERHEAD BACKGROUND
           
           Full A4 image:
           Header = top
           Footer = bottom
        ===================================================== */

        .letterheadBackground {
          position: absolute;

          inset: 0;

          width: 100%;
          height: 100%;

          background-repeat: no-repeat;

          background-position:
            center center;

          background-size:
            100% 100%;

          pointer-events: none;

          z-index: 0;
        }

        /* =====================================================
           CONTENT AREA WITH LETTERHEAD
           
           Top padding reserves header.
           Bottom padding reserves footer.
        ===================================================== */

        .printableWithLetterhead
        .reportContent {

          position: relative;

          z-index: 2;

          min-height: 297mm;

          /*
             IMPORTANT:
             These values reserve space for
             letterhead header and footer.
          */

          padding-top: 48mm;

          padding-left: 13mm;

          padding-right: 13mm;

          padding-bottom: 30mm;
        }

        /* =====================================================
           DEFAULT CONTENT WITHOUT LETTERHEAD
        ===================================================== */

        .printableReport:not(
          .printableWithLetterhead
        )
        .reportContent {

          position: relative;

          z-index: 2;

          min-height: 297mm;

          padding: 14mm;
        }

        /* =====================================================
           DEFAULT LAB HEADER
        ===================================================== */

        .defaultLabHeader {
          display: grid;

          grid-template-columns:
            58px
            minmax(0, 1fr)
            auto;

          align-items: center;

          gap: 12px;
        }

        .reportLogo {
          width: 52px;
          height: 52px;

          border-radius: 12px;

          background:
            #087f7d;

          color: #ffffff;

          display: flex;

          align-items: center;
          justify-content: center;

          font-size: 22px;
          font-weight: 900;

          line-height: 1;
        }

        .reportLabIdentity {
          min-width: 0;
        }

        .reportLabIdentity h1 {
          margin: 0;

          font-size: 22px;
          line-height: 1.15;

          color:
            #087f7d;

          letter-spacing:
            0.3px;

          word-break:
            break-word;
        }

        .reportLabIdentity p {
          margin:
            3px 0 0;

          font-size: 9px;

          line-height: 1.35;

          color:
            #475569;
        }

        .reportLabIdentity
        .reportTagline {
          font-size: 10px;

          font-weight: 700;

          color:
            #334155;
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
            10px 0 12px;

          background:
            #087f7d;

          border-radius: 3px;
        }

        /* =====================================================
           PATIENT SECTION
        ===================================================== */

        .reportPatientSection {
          margin-top: 4px;

          margin-bottom: 14px;

          border:
            1px solid #dbe3ea;

          border-radius: 6px;

          overflow: hidden;

          background:
            rgba(255,255,255,0.96);
        }

        .reportSectionTitle {
          padding:
            7px 9px;

          background:
            #f0fdfa;

          border-left:
            3px solid #087f7d;

          color:
            #087f7d;

          font-size: 10px;

          font-weight: 800;

          letter-spacing:
            0.4px;
        }

        .reportPatientGrid {
          display: grid;

          grid-template-columns:
            repeat(3, 1fr);
        }

        .reportPatientGrid > div {
          min-width: 0;

          min-height: 43px;

          padding:
            7px 9px;

          border-right:
            1px solid #e2e8f0;

          border-bottom:
            1px solid #e2e8f0;

          background:
            rgba(255,255,255,0.94);
        }

        .reportPatientGrid >
        div:nth-child(3n) {
          border-right: 0;
        }

        .reportPatientGrid >
        div:nth-last-child(-n + 3) {
          border-bottom: 0;
        }

        .reportPatientGrid span {
          display: block;

          margin-bottom: 3px;

          font-size: 8px;

          line-height: 1.2;

          color:
            #64748b;

          font-weight: 600;
        }

        .reportPatientGrid strong {
          display: block;

          font-size: 9px;

          line-height: 1.3;

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

          margin-top: 14px;
        }

        .reportTestSection {
          width: 100%;

          margin-bottom: 15px;

          page-break-inside:
            avoid;

          break-inside:
            avoid;
        }

        .reportCategory {
          width: 100%;

          margin-bottom: 3px;

          text-align: center;

          color:
            #64748b;

          font-size: 8px;

          font-weight: 800;

          letter-spacing:
            0.5px;
        }

        .reportTestHeading {
          padding:
            7px 9px;

          background:
            rgba(248,250,252,0.96);

          border:
            1px solid #dbe3ea;

          border-left:
            3px solid #087f7d;

          color:
            #172033;

          font-size: 10px;

          font-weight: 800;

          text-transform:
            uppercase;
        }

        .reportTableWrapper {
          width: 100%;

          overflow-x:
            auto;

          -webkit-overflow-scrolling:
            touch;
        }

        .finalReportTable {
          width: 100%;

          border-collapse:
            collapse;

          table-layout:
            fixed;

          background:
            rgba(255,255,255,0.97);
        }

        .finalReportTable th {
          padding:
            6px 5px;

          background:
            #eef2f7;

          border:
            1px solid #cfd8df;

          color:
            #334155;

          font-size:
            7.5px;

          line-height:
            1.2;

          font-weight:
            800;

          text-align:
            center;

          vertical-align:
            middle;
        }

        .finalReportTable td {
          padding:
            6px 5px;

          border:
            1px solid #dbe3ea;

          color:
            #172033;

          font-size:
            8.5px;

          line-height:
            1.3;

          vertical-align:
            middle;

          word-break:
            break-word;

          overflow-wrap:
            anywhere;
        }

        .finalReportTable th:nth-child(1),
        .finalReportTable td:nth-child(1) {
          width: 30%;

          text-align:
            left;
        }

        .finalReportTable th:nth-child(2),
        .finalReportTable td:nth-child(2) {
          width: 17%;

          text-align:
            center;
        }

        .finalReportTable th:nth-child(3),
        .finalReportTable td:nth-child(3) {
          width: 15%;

          text-align:
            center;
        }

        .finalReportTable th:nth-child(4),
        .finalReportTable td:nth-child(4) {
          width: 26%;

          text-align:
            center;
        }

        .finalReportTable th:nth-child(5),
        .finalReportTable td:nth-child(5) {
          width: 12%;

          text-align:
            center;
        }

        .normalResult {
          font-weight:
            600;
        }

        .abnormalResult {
          font-weight:
            800;

          color:
            #dc2626 !important;
        }

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
            22px;

          min-height:
            18px;

          padding:
            2px 5px;

          border-radius:
            4px;

          font-size:
            8px;

          font-weight:
            900;

          line-height:
            1;
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

        .noParameter {
          padding:
            12px !important;

          text-align:
            center !important;

          color:
            #64748b !important;
        }

        .reportEmpty {
          padding:
            30px;

          text-align:
            center;

          color:
            #64748b;

          border:
            1px dashed #cbd5e1;

          border-radius:
            6px;

          background:
            rgba(255,255,255,0.95);
        }

        /* =====================================================
           SIGNATURE
        ===================================================== */

        .reportSignatureSection {
          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            60px;

          margin-top:
            30px;

          page-break-inside:
            avoid;

          break-inside:
            avoid;
        }

        .reportSignatureBox {
          text-align:
            center;

          font-size:
            9px;

          color:
            #334155;

          background:
            rgba(255,255,255,0.90);
        }

        .signatureSpace {
          height:
            34px;

          margin-bottom:
            5px;

          border-bottom:
            1px solid #64748b;
        }

        .reportSignatureBox strong,
        .reportSignatureBox span {
          display:
            block;
        }

        .reportSignatureBox span {
          margin-top:
            2px;

          color:
            #64748b;

          font-size:
            8px;
        }

        /* =====================================================
           NOTES
        ===================================================== */

        .reportNotes {
          margin-top:
            18px;

          padding-top:
            8px;

          border-top:
            1px solid #e2e8f0;

          color:
            #64748b;

          font-size:
            8px;

          line-height:
            1.5;

          page-break-inside:
            avoid;

          break-inside:
            avoid;

          background:
            rgba(255,255,255,0.90);
        }

        .reportNotes strong {
          color:
            #334155;
        }

        .reportNotes p {
          margin:
            3px 0 0;
        }

        /* =====================================================
           FOOTER WITHOUT LETTERHEAD
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
            16px;

          padding-top:
            8px;

          border-top:
            1px solid #dbe3ea;

          color:
            #64748b;

          font-size:
            7.5px;

          line-height:
            1.3;

          page-break-inside:
            avoid;
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
              10px;
          }

          .reportScreenToolbar {
            position:
              static;

            align-items:
              flex-start;

            flex-direction:
              column;

            padding:
              13px;
          }

          .reportToolbarInfo {
            width:
              100%;
          }

          .reportToolbarButtons {
            width:
              100%;

            justify-content:
              stretch;
          }

          .reportToolbarButtons button {
            flex:
              1 1 auto;
          }

          .printableReport {
            width:
              100%;

            min-height:
              auto;
          }

          .printableReport:not(
            .printableWithLetterhead
          )
          .reportContent {

            padding:
              20px;
          }

          /*
             Mobile/tablet letterhead:
             keep A4 ratio and content space.
          */

          .printableWithLetterhead
          .reportContent {

            min-height:
              297mm;

            padding-top:
              48mm;

            padding-left:
              20px;

            padding-right:
              20px;

            padding-bottom:
              30mm;
          }

          .defaultLabHeader {
            grid-template-columns:
              48px
              minmax(0, 1fr);
          }

          .reportLogo {
            width:
              44px;

            height:
              44px;

            font-size:
              19px;
          }

          .reportHeaderRight {
            grid-column:
              1 / -1;

            align-items:
              flex-start;

            text-align:
              left;

            padding-top:
              7px;

            border-top:
              1px solid #e2e8f0;
          }

          .reportPatientGrid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .reportPatientGrid >
          div:nth-child(3n) {
            border-right:
              1px solid #e2e8f0;
          }

          .reportPatientGrid >
          div:nth-child(2n) {
            border-right:
              0;
          }

          .reportPatientGrid >
          div:nth-last-child(-n + 3) {
            border-bottom:
              1px solid #e2e8f0;
          }

          .reportPatientGrid >
          div:nth-last-child(-n + 2) {
            border-bottom:
              0;
          }

          .finalReportTable {
            min-width:
              620px;
          }

          .reportSignatureSection {
            gap:
              25px;
          }
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 600px) {

          .finalReportPage {
            padding:
              6px;

            padding-bottom:
              20px;
          }

          .reportScreenToolbar {
            width:
              100%;

            margin-bottom:
              8px;

            padding:
              12px;

            border-radius:
              8px;
          }

          .reportToolbarInfo strong {
            font-size:
              16px;
          }

          .reportToolbarInfo small {
            font-size:
              10px;
          }

          .reportToolbarButtons {
            display:
              grid;

            grid-template-columns:
              1fr;

            width:
              100%;

            gap:
              7px;
          }

          .reportToolbarButtons button {
            width:
              100%;

            min-height:
              44px;
          }

          .printableReport {
            width:
              100%;

            margin:
              0 auto;

            box-shadow:
              0 3px 14px
              rgba(15, 23, 42, 0.09);
          }

          .printableReport:not(
            .printableWithLetterhead
          )
          .reportContent {

            padding:
              14px 10px;
          }

          .printableWithLetterhead
          .reportContent {

            min-height:
              297mm;

            padding-top:
              45mm;

            padding-left:
              10px;

            padding-right:
              10px;

            padding-bottom:
              28mm;
          }

          .defaultLabHeader {
            grid-template-columns:
              42px
              minmax(0, 1fr);

            gap:
              9px;
          }

          .reportLogo {
            width:
              40px;

            height:
              40px;

            border-radius:
              9px;

            font-size:
              17px;
          }

          .reportLabIdentity h1 {
            font-size:
              16px;

            letter-spacing:
              0;
          }

          .reportLabIdentity p {
            font-size:
              7px;
          }

          .reportLabIdentity
          .reportTagline {
            font-size:
              8px;
          }

          .reportHeaderRight {
            grid-column:
              1 / -1;

            padding-top:
              6px;
          }

          .reportHeaderRight strong {
            font-size:
              9px;
          }

          .reportHeaderRight span {
            font-size:
              8px;
          }

          .reportAccentLine {
            margin:
              8px 0 10px;
          }

          .reportSectionTitle {
            font-size:
              9px;

            padding:
              7px 8px;
          }

          .reportPatientGrid {
            grid-template-columns:
              1fr 1fr;
          }

          .reportPatientGrid > div {
            min-height:
              42px;

            padding:
              7px;
          }

          .reportPatientGrid span {
            font-size:
              7px;
          }

          .reportPatientGrid strong {
            font-size:
              8px;
          }

          .reportCategory {
            font-size:
              7.5px;
          }

          .reportTestHeading {
            font-size:
              9px;

            padding:
              7px;
          }

          .finalReportTable {
            min-width:
              620px;
          }

          .finalReportTable th,
          .finalReportTable td {
            padding:
              5px 4px;

            font-size:
              7px;
          }

          .reportSignatureSection {
            grid-template-columns:
              1fr 1fr;

            gap:
              15px;

            margin-top:
              22px;
          }

          .reportSignatureBox {
            font-size:
              8px;
          }

          .signatureSpace {
            height:
              28px;
          }

          .reportSignatureBox span {
            font-size:
              7px;
          }

          .reportNotes {
            font-size:
              7px;
          }

          .reportFooter {
            flex-direction:
              column;

            justify-content:
              center;

            text-align:
              center;

            gap:
              4px;

            font-size:
              7px;
          }
        }

        /* =====================================================
           VERY SMALL PHONE
        ===================================================== */

        @media (max-width: 380px) {

          .printableReport:not(
            .printableWithLetterhead
          )
          .reportContent {

            padding:
              10px 7px;
          }

          .printableWithLetterhead
          .reportContent {

            padding-top:
              42mm;

            padding-left:
              7px;

            padding-right:
              7px;

            padding-bottom:
              26mm;
          }

          .reportLabIdentity h1 {
            font-size:
              14px;
          }

          .reportPatientGrid {
            grid-template-columns:
              1fr;
          }

          .reportPatientGrid > div {
            border-right:
              0 !important;

            border-bottom:
              1px solid #e2e8f0 !important;
          }

          .reportPatientGrid >
          div:last-child {
            border-bottom:
              0 !important;
          }

          .finalReportTable {
            min-width:
              590px;
          }

          .finalReportTable th,
          .finalReportTable td {
            padding:
              4px 3px;

            font-size:
              6.5px;
          }

          .reportSignatureSection {
            gap:
              10px;
          }
        }

        /* =====================================================
           PRINT / PDF
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

            min-height:
              297mm;

            margin:
              0;

            padding:
              0;

            background:
              #ffffff !important;
          }

          .reportScreenToolbar {
            display:
              none !important;
          }

          /* ================================
             A4 REPORT
          ================================= */

          .printableReport {
            position:
              relative !important;

            width:
              210mm !important;

            min-height:
              297mm !important;

            height:
              297mm !important;

            margin:
              0 !important;

            padding:
              0 !important;

            background:
              #ffffff !important;

            box-shadow:
              none !important;

            overflow:
              hidden !important;
          }

          /* ================================
             LETTERHEAD IMAGE
          ================================= */

          .letterheadBackground {
            position:
              absolute !important;

            inset:
              0 !important;

            width:
              210mm !important;

            height:
              297mm !important;

            background-repeat:
              no-repeat !important;

            background-position:
              center center !important;

            background-size:
              100% 100% !important;

            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;
          }

          /* ================================
             REPORT CONTENT
          ================================= */

          .printableWithLetterhead
          .reportContent {

            position:
              relative !important;

            z-index:
              2 !important;

            width:
              210mm !important;

            min-height:
              297mm !important;

            height:
              297mm !important;

            /*
              Letterhead header space
            */

            padding-top:
              48mm !important;

            padding-left:
              13mm !important;

            padding-right:
              13mm !important;

            /*
              Letterhead footer space
            */

            padding-bottom:
              30mm !important;
          }

          .printableReport:not(
            .printableWithLetterhead
          )
          .reportContent {

            position:
              relative !important;

            z-index:
              2 !important;

            min-height:
              297mm !important;

            padding:
              12mm 13mm !important;
          }

          /* ================================
             TABLE
          ================================= */

          .reportTableWrapper {
            overflow:
              visible !important;
          }

          .finalReportTable {
            width:
              100% !important;

            min-width:
              0 !important;
          }

          .finalReportTable tr {
            page-break-inside:
              avoid;

            break-inside:
              avoid;
          }

          .finalReportTable thead {
            display:
              table-header-group;
          }

          /* ================================
             KEEP SECTIONS TOGETHER
          ================================= */

          .reportPatientSection,
          .reportTestSection,
          .reportSignatureSection,
          .reportNotes,
          .reportFooter {
            page-break-inside:
              avoid;

            break-inside:
              avoid;
          }

          /* ================================
             PRINT COLORS
          ================================= */

          .reportFlag,
          .highFlag,
          .lowFlag {
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
