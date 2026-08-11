"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ReportPage() {
  const router = useRouter();

  const [patient, setPatient] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
  const [results, setResults] = useState({});
  const [settings, setSettings] = useState({
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
  });

  const [reportDate, setReportDate] = useState("");
  const [reportNo, setReportNo] = useState("");
  const [saveStatus, setSaveStatus] = useState("loading");
  const [saveMessage, setSaveMessage] = useState("");

  const savingRef = useRef(false);
  const saveTimerRef = useRef(null);

  /* =====================================================
     LOAD DATA
  ===================================================== */

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

      setPatient(savedPatient || {});

      setSelectedTests(
        Array.isArray(savedTests) ? savedTests : []
      );

      setResults(savedResults || {});

      setSettings((prev) => ({
        ...prev,
        ...(savedSettings || {}),
      }));

      setReportDate(
        new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      );
    } catch (error) {
      console.error("REPORT LOAD ERROR:", error);
      setSaveStatus("error");
      setSaveMessage("Report data load nahi hua.");
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
      patient.gender || patient.sex || ""
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
    const age = parseFloat(patient.age);
    return Number.isNaN(age) ? null : age;
  }

  /* =====================================================
     DEFAULT REFERENCES
  ===================================================== */

  function getDefaultReference(parameterName) {
    const name = normalizeName(parameterName);
    const gender = getGender();
    const age = getAge();

    if (
      name === "hemoglobin" ||
      name === "haemoglobin" ||
      name === "hb"
    ) {
      if (age !== null && age < 12) {
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

    if (name === "rdw cv" || name === "rdw-cv") {
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
      name.includes("erythrocyte sedimentation")
    ) {
      return {
        min: 0,
        max: gender === "female" ? 20 : 15,
        unit: "mm/hr",
        range:
          gender === "female"
            ? "0 - 20"
            : "0 - 15",
      };
    }

    if (
      name.includes("fasting blood sugar") ||
      name === "fbs" ||
      name.includes("fasting glucose")
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
      name === "ppbs" ||
      name.includes("postprandial")
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
      name === "rbs" ||
      name.includes("random glucose")
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
      name.includes("alkaline phosphatase") ||
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

    if (name.includes("total cholesterol")) {
      return {
        min: 0,
        max: 200,
        unit: "mg/dL",
        range: "< 200",
      };
    }

    if (name.includes("triglyceride")) {
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

  function resolveParameter(parameter) {
    if (!parameter) {
      return {
        min: null,
        max: null,
        unit: "",
        range: "-",
      };
    }

    if (typeof parameter === "string") {
      const defaults =
        getDefaultReference(parameter);

      return {
        min: defaults?.min ?? null,
        max: defaults?.max ?? null,
        unit: defaults?.unit || "",
        range: defaults?.range || "-",
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

    if (!range) {
      if (
        min !== null &&
        min !== undefined &&
        max !== null &&
        max !== undefined
      ) {
        range = `${min} - ${max}`;
      } else if (
        max !== null &&
        max !== undefined
      ) {
        range = `< ${max}`;
      } else if (
        min !== null &&
        min !== undefined
      ) {
        range = `> ${min}`;
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
      typeof parameter === "string"
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
    if (typeof parameter === "string") {
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

  function getFlag(value, parameter) {
    if (
      value === "" ||
      value === undefined ||
      value === null
    ) {
      return "";
    }

    const resolved =
      resolveParameter(parameter);

    const cleanedValue = String(value)
      .replace(/,/g, "")
      .trim();

    const numericValue =
      Number(cleanedValue);

    if (Number.isNaN(numericValue)) {
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

  /* =====================================================
     CATEGORY
  ===================================================== */

  function getCategory(test) {
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
    if (!Array.isArray(tests)) {
      return [];
    }

    return tests.map((test, testIndex) => {
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
          Array.isArray(parameters)
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
                    resultData?.[key] ??
                    "";

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

                    result: value,

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
    });
  }

  /* =====================================================
     AUTO SAVE
  ===================================================== */

  useEffect(() => {
    if (
      !patient ||
      Object.keys(patient).length === 0 ||
      selectedTests.length === 0
    ) {
      return;
    }

    if (settings.autoSave === false) {
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current =
      setTimeout(() => {
        saveReportAutomatically();
      }, 500);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [
    patient,
    selectedTests,
    results,
    settings.autoSave,
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
      Object.keys(patient).length === 0 ||
      selectedTests.length === 0
    ) {
      return;
    }

    savingRef.current = true;

    try {
      setSaveStatus("saving");
      setSaveMessage("Report saving...");

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

        settings: {
          labName: settings.labName,
          labAddress: settings.labAddress,
          phone: settings.phone,
          email: settings.email,
          registrationNo:
            settings.registrationNo,
          doctorName:
            settings.doctorName,
        },
      };

      const {
        data: existingData,
        error: checkError,
      } = await supabase
        .from("reports")
        .select("id, report_no")
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

      if (existingData?.id) {
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
      } else {
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

  /* =====================================================
     PRINT
  ===================================================== */

  function printReport() {
    if (saveStatus === "saving") {
      alert(
        "Report abhi save ho raha hai. Ek moment wait karein."
      );
      return;
    }

    if (saveStatus === "error") {
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
    ].forEach((key) => {
      localStorage.removeItem(key);
    });

    router.push("/patients");
  }

  /* =====================================================
     REPORT DATA
  ===================================================== */

  const reportTests =
    buildReportTests(
      selectedTests,
      results
    );

  /* =====================================================
     PATIENT DATE
  ===================================================== */

  const sampleDate =
    patient.sampleDate ||
    patient.collectionDate ||
    reportDate ||
    "-";

  const patientName =
    patient.name ||
    patient.patientName ||
    "-";

  const patientId =
    patient.patientId ||
    patient.id ||
    "-";

  const patientGender =
    patient.gender ||
    patient.sex ||
    "-";

  const patientDoctor =
    patient.doctor ||
    patient.refDoctor ||
    patient.referringDoctor ||
    "-";

  const patientMobile =
    patient.mobile ||
    patient.mobileNumber ||
    "-";

  /* =====================================================
     UI
  ===================================================== */

  return (
    <>
      <div className="reportApp">

        {/* =================================================
            SCREEN TOOLBAR
        ================================================= */}

        <div className="screenToolbar">

          <div className="toolbarInfo">

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

            {saveStatus === "saving" && (
              <small className="saving">
                ● Saving report...
              </small>
            )}

            {saveStatus === "saved" && (
              <small className="saved">
                ✓ Saved to Reports
              </small>
            )}

            {saveStatus === "error" && (
              <small className="error">
                ⚠ {saveMessage}
              </small>
            )}

          </div>

          <div className="toolbarButtons">

            <button
              type="button"
              onClick={() =>
                router.push("/results")
              }
            >
              ← Edit Results
            </button>

            <button
              type="button"
              className="printButton"
              onClick={printReport}
            >
              🖨 Print / Save PDF
            </button>

            <button
              type="button"
              className="newButton"
              onClick={newPatient}
            >
              + New Patient
            </button>

          </div>

        </div>

        {/* =================================================
            A4 REPORT
        ================================================= */}

        <div className="reportPages">

          <div className="a4Page">

            {/* =================================================
                ORIGINAL LETTERHEAD
            ================================================= */}

            {settings.letterhead ? (
              <img
                className="letterheadBackground"
                src={settings.letterhead}
                alt="Laboratory Letterhead"
              />
            ) : (
              <div className="noLetterheadBackground">
                <div>
                  {settings.labName ||
                    "NIDAN PATHOLOGY LAB"}
                </div>

                <small>
                  Laboratory Letterhead
                </small>
              </div>
            )}

            {/* =================================================
                REPORT CONTENT AREA
            ================================================= */}

            <div className="reportContent">

              {/* PATIENT INFORMATION */}

              <section className="patientInformation">

                <div className="patientLeft">

                  <div className="patientName">
                    {patientName}
                  </div>

                  <div>
                    <b>Age/Sex:</b>{" "}
                    {patient.age || "-"}Y /
                    {patientGender}
                  </div>

                  <div>
                    <b>Referred By:</b>{" "}
                    {patientDoctor}
                  </div>

                  <div>
                    <b>Sample ID:</b>{" "}
                    {patientId}
                  </div>

                </div>

                <div className="patientMiddle">

                  <div>
                    <b>Patient ID</b>
                    <span>
                      {patientId}
                    </span>
                  </div>

                  <div>
                    <b>Mobile</b>
                    <span>
                      {patientMobile}
                    </span>
                  </div>

                </div>

                <div className="patientRight">

                  <div>
                    <b>Report ID</b>
                    <span>
                      {reportNo || "-"}
                    </span>
                  </div>

                  <div>
                    <b>Collection Date</b>
                    <span>
                      {sampleDate}
                    </span>
                  </div>

                  <div>
                    <b>Report Date</b>
                    <span>
                      {reportDate}
                    </span>
                  </div>

                </div>

              </section>

              {/* =================================================
                  TESTS
              ================================================= */}

              <section className="testsArea">

                {reportTests.length === 0 ? (

                  <div className="emptyReport">
                    No investigations selected.
                  </div>

                ) : (

                  reportTests.map(
                    (test, testIndex) => (

                      <section
                        className="testBlock"
                        key={
                          test.id ||
                          `test-${testIndex}`
                        }
                      >

                        <div className="departmentTitle">
                          {(
                            test.category ||
                            "PATHOLOGY"
                          ).toUpperCase()}
                        </div>

                        <div className="testTitle">
                          {test.name}
                        </div>

                        <table className="reportTable">

                          <thead>

                            <tr>

                              <th>
                                INVESTIGATION
                              </th>

                              {settings.showFlag !==
                                false && (
                                <th className="flagColumn">
                                  FLAG
                                </th>
                              )}

                              <th>
                                RESULT
                              </th>

                              {settings.showReferenceRange !==
                                false && (
                                <th>
                                  REF. RANGE
                                </th>
                              )}

                              <th>
                                UNIT
                              </th>

                            </tr>

                          </thead>

                          <tbody>

                            {test.parameters.map(
                              (
                                parameter,
                                index
                              ) => (

                                <tr
                                  key={`${test.id}-${index}`}
                                >

                                  <td className="investigationCell">

                                    {parameter.name}

                                  </td>

                                  {settings.showFlag !==
                                    false && (

                                    <td className="flagColumn">

                                      {parameter.flag && (
                                        <span
                                          className={
                                            parameter.flag ===
                                            "H"
                                              ? "high"
                                              : "low"
                                          }
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
                                        ? "result abnormal"
                                        : "result"
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

                                  {settings.showReferenceRange !==
                                    false && (

                                    <td className="reference">

                                      {
                                        parameter.referenceRange
                                      }

                                    </td>

                                  )}

                                  <td className="unit">

                                    {
                                      parameter.unit
                                    }

                                  </td>

                                </tr>

                              )
                            )}

                          </tbody>

                        </table>

                      </section>

                    )
                  )

                )}

              </section>

              {/* =================================================
                  INTERPRETATION
              ================================================= */}

              <section className="reportInterpretation">

                <strong>
                  Interpretation:
                </strong>

                <span>
                  Laboratory results should be
                  interpreted with relevant clinical
                  findings.
                </span>

              </section>

              {/* =================================================
                  SIGNATURE
              ================================================= */}

              <section className="signatureArea">

                <div className="signatureBox">

                  <div className="signatureLine"></div>

                  <strong>
                    Lab Technician
                  </strong>

                  <small>
                    {settings.labName ||
                      "NIDAN PATHOLOGY LAB"}
                  </small>

                </div>

                <div className="signatureBox">

                  <div className="signatureLine"></div>

                  <strong>
                    Authorized Signatory
                  </strong>

                  <small>
                    Signature & Seal
                  </small>

                </div>

              </section>

              {/* =================================================
                  NOTE
              ================================================= */}

              <div className="reportNote">

                <b>Note:</b>{" "}

                Reference intervals may vary
                according to laboratory method,
                age, sex and clinical circumstances.
                Laboratory results should be
                interpreted with relevant clinical
                findings.

              </div>

            </div>

          </div>

        </div>

      </div>

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
           SCREEN
        ===================================================== */

        .reportApp {
          min-height: 100vh;
          background: #eef2f7;
          padding: 14px;
        }

        .screenToolbar {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto 14px;
          min-height: 70px;
          padding: 12px 16px;
          background: #ffffff;
          border: 1px solid #e1e7ec;
          border-radius: 9px;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;

          box-shadow:
            0 3px 12px
            rgba(15, 23, 42, 0.07);
        }

        .toolbarInfo {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .toolbarInfo strong {
          font-size: 15px;
        }

        .toolbarInfo small {
          color: #64748b;
          font-size: 10px;
        }

        .saving {
          color: #b7791f !important;
          font-weight: 700;
        }

        .saved {
          color: #15803d !important;
          font-weight: 700;
        }

        .error {
          color: #dc2626 !important;
          font-weight: 700;
        }

        .toolbarButtons {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
        }

        .toolbarButtons button {
          min-height: 38px;
          padding: 7px 12px;
          border: 1px solid #d8e0e6;
          border-radius: 7px;
          background: #ffffff;
          color: #334155;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .toolbarButtons .printButton {
          background: #087f7d;
          border-color: #087f7d;
          color: white;
        }

        .toolbarButtons .newButton {
          color: #b91c1c;
        }

        /* =====================================================
           A4 SCREEN
        ===================================================== */

        .reportPages {
          width: 100%;
          display: flex;
          justify-content: center;
          padding-bottom: 30px;
        }

        .a4Page {
          position: relative;
          width: 210mm;
          height: 297mm;
          background: white;
          overflow: hidden;

          box-shadow:
            0 8px 30px
            rgba(15, 23, 42, 0.14);
        }

        /* =====================================================
           LETTERHEAD
        ===================================================== */

        .letterheadBackground {
          position: absolute;
          inset: 0;

          width: 100%;
          height: 100%;

          display: block;

          object-fit: fill;

          z-index: 1;

          pointer-events: none;
        }

        .noLetterheadBackground {
          position: absolute;
          inset: 0;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          color: #087f7d;
          font-size: 24px;
          font-weight: 900;

          background: white;

          z-index: 1;
        }

        .noLetterheadBackground small {
          margin-top: 6px;
          color: #64748b;
          font-size: 12px;
          font-weight: normal;
        }

        /* =====================================================
           IMPORTANT:
           REPORT CONTENT ONLY IN WHITE MIDDLE AREA
        ===================================================== */

        .reportContent {
          position: absolute;

          /*
             Header approx:
             0 - 74mm

             Footer approx:
             246 - 297mm

             Therefore report is placed
             only in middle white area.
          */

          top: 75mm;
          left: 12mm;
          right: 12mm;

          min-height: 155mm;

          z-index: 5;

          color: #111827;
        }

        /* =====================================================
           PATIENT INFORMATION
        ===================================================== */

        .patientInformation {
          width: 100%;

          display: grid;

          grid-template-columns:
            1.35fr
            1fr
            1.2fr;

          border-top: 1px solid #1f2937;
          border-bottom: 1px solid #cbd5e1;

          background: rgba(
            255,
            255,
            255,
            0.97
          );

          min-height: 28mm;
        }

        .patientLeft,
        .patientMiddle,
        .patientRight {
          padding: 6px 8px;

          font-size: 9px;

          line-height: 1.65;
        }

        .patientLeft {
          border-right: 1px solid #cbd5e1;
        }

        .patientMiddle {
          border-right: 1px solid #cbd5e1;
        }

        .patientName {
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 2px;
          text-transform: uppercase;
        }

        .patientMiddle div,
        .patientRight div {
          display: flex;
          gap: 6px;
          margin-bottom: 2px;
        }

        .patientMiddle b,
        .patientRight b {
          min-width: 70px;
          font-size: 8px;
        }

        .patientMiddle span,
        .patientRight span {
          font-size: 8.5px;
          word-break: break-word;
        }

        /* =====================================================
           TEST AREA
        ===================================================== */

        .testsArea {
          width: 100%;
          margin-top: 6mm;
        }

        .testBlock {
          width: 100%;
          margin-bottom: 5mm;

          page-break-inside: avoid;
          break-inside: avoid;
        }

        .departmentTitle {
          width: 100%;
          text-align: center;

          font-size: 8px;
          font-weight: 800;

          letter-spacing: 1px;

          color: #374151;

          margin-bottom: 1px;
        }

        .testTitle {
          width: 100%;

          text-align: center;

          font-size: 12px;

          line-height: 1.25;

          font-weight: 900;

          color: #111827;

          margin-bottom: 2.5mm;

          text-transform: uppercase;
        }

        /* =====================================================
           TABLE
        ===================================================== */

        .reportTable {
          width: 100%;

          border-collapse: collapse;

          table-layout: fixed;

          background: rgba(
            255,
            255,
            255,
            0.96
          );
        }

        .reportTable th {
          background: #f1f5f9;

          border: 1px solid #9ca3af;

          padding: 4px 5px;

          font-size: 7.5px;

          line-height: 1.2;

          text-align: left;

          font-weight: 800;

          color: #111827;

          text-transform: uppercase;
        }

        .reportTable td {
          border: 1px solid #d1d5db;

          padding: 4px 5px;

          min-height: 20px;

          font-size: 8.5px;

          line-height: 1.25;

          color: #111827;

          background: rgba(
            255,
            255,
            255,
            0.92
          );

          vertical-align: middle;

          word-break: break-word;
        }

        .reportTable th:nth-child(1),
        .reportTable td:nth-child(1) {
          width: 38%;
        }

        .reportTable th:nth-child(2),
        .reportTable td:nth-child(2) {
          width: 9%;
        }

        .reportTable th:nth-child(3),
        .reportTable td:nth-child(3) {
          width: 17%;
        }

        .reportTable th:nth-child(4),
        .reportTable td:nth-child(4) {
          width: 23%;
        }

        .reportTable th:nth-child(5),
        .reportTable td:nth-child(5) {
          width: 13%;
        }

        .investigationCell {
          font-weight: 500;
        }

        .flagColumn {
          text-align: center !important;
        }

        .result {
          text-align: center;
          font-weight: 600;
        }

        .abnormal {
          color: #b91c1c !important;
          font-weight: 900;
        }

        .reference {
          text-align: center;
          font-size: 7.5px !important;
        }

        .unit {
          text-align: center;
        }

        .high,
        .low {
          display: inline-flex;

          align-items: center;
          justify-content: center;

          min-width: 16px;
          height: 14px;

          border-radius: 3px;

          font-size: 7px;

          font-weight: 900;
        }

        .high {
          color: #b91c1c;
          background: #fee2e2;
        }

        .low {
          color: #1d4ed8;
          background: #dbeafe;
        }

        /* =====================================================
           INTERPRETATION
        ===================================================== */

        .reportInterpretation {
          margin-top: 4mm;

          padding: 5px 7px;

          border-top: 1px solid #1f2937;
          border-bottom: 1px solid #1f2937;

          background: rgba(
            255,
            255,
            255,
            0.94
          );

          display: flex;
          gap: 5px;

          font-size: 7.5px;
          line-height: 1.4;

          page-break-inside: avoid;
          break-inside: avoid;
        }

        .reportInterpretation strong {
          white-space: nowrap;
        }

        /* =====================================================
           SIGNATURE
        ===================================================== */

        .signatureArea {
          width: 100%;

          display: grid;

          grid-template-columns: 1fr 1fr;

          gap: 35mm;

          margin-top: 7mm;

          page-break-inside: avoid;
          break-inside: avoid;
        }

        .signatureBox {
          text-align: center;

          font-size: 8px;

          background: rgba(
            255,
            255,
            255,
            0.92
          );
        }

        .signatureLine {
          height: 8mm;

          border-bottom: 1px solid #374151;

          margin-bottom: 2mm;
        }

        .signatureBox strong {
          display: block;

          font-size: 8px;
        }

        .signatureBox small {
          display: block;

          margin-top: 1px;

          color: #64748b;

          font-size: 6.5px;
        }

        /* =====================================================
           NOTE
        ===================================================== */

        .reportNote {
          margin-top: 4mm;

          padding-top: 2mm;

          border-top: 1px solid #d1d5db;

          font-size: 6.5px;

          line-height: 1.4;

          color: #4b5563;

          background: rgba(
            255,
            255,
            255,
            0.88
          );

          page-break-inside: avoid;
          break-inside: avoid;
        }

        .reportNote b {
          color: #111827;
        }

        /* =====================================================
           EMPTY
        ===================================================== */

        .emptyReport {
          padding: 20px;

          text-align: center;

          border: 1px dashed #94a3b8;

          color: #64748b;

          background: rgba(
            255,
            255,
            255,
            0.95
          );
        }

        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 900px) {

          .reportApp {
            padding: 8px;
          }

          .screenToolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .toolbarButtons {
            display: grid;
            grid-template-columns:
              1fr 1.3fr 1fr;
          }

          .toolbarButtons button {
            width: 100%;
          }

          .reportPages {
            overflow-x: auto;
            justify-content: flex-start;
            padding: 5px;
          }

          /*
             Keep the A4 report at real A4 proportions.
             Do NOT squeeze the report.
          */

          .a4Page {
            flex: 0 0 210mm;
          }

        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 600px) {

          .reportApp {
            padding: 5px;
          }

          .screenToolbar {
            margin-bottom: 8px;
            padding: 10px;
          }

          .toolbarButtons {
            grid-template-columns: 1fr;
          }

          .toolbarButtons button {
            min-height: 40px;
          }

          /*
             IMPORTANT:
             Report remains A4.
             Browser can scroll horizontally instead
             of shrinking the report.
          */

          .reportPages {
            width: 100%;
            overflow-x: auto;
            justify-content: flex-start;
          }

          .a4Page {
            width: 210mm;
            height: 297mm;
            flex: 0 0 210mm;
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

            background: #ffffff !important;
          }

          body {
            overflow: visible !important;
          }

          .reportApp {
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;

            background: #ffffff !important;
          }

          .screenToolbar {
            display: none !important;
          }

          .reportPages {
            display: block !important;

            width: 210mm !important;

            margin: 0 !important;
            padding: 0 !important;

            overflow: visible !important;
          }

          .a4Page {
            width: 210mm !important;
            height: 297mm !important;

            margin: 0 !important;
            padding: 0 !important;

            box-shadow: none !important;

            overflow: hidden !important;

            page-break-after: always;

            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .letterheadBackground {
            display: block !important;

            width: 210mm !important;
            height: 297mm !important;

            object-fit: fill !important;

            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .reportContent {
            position: absolute !important;

            top: 75mm !important;

            left: 12mm !important;
            right: 12mm !important;

            min-height: 155mm !important;

            z-index: 5 !important;
          }

          .patientInformation,
          .reportTable,
          .reportInterpretation,
          .signatureArea,
          .reportNote {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .testBlock {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .reportTable tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .reportTable thead {
            display: table-header-group;
          }

        }

      `}</style>
    </>
  );
}
