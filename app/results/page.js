"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/* =========================================================
   NIDAN PATHOLOGY LAB
   ADVANCED RESULT ENTRY PAGE
   ========================================================= */

export default function ResultsPage() {
  const router = useRouter();

  const [patient, setPatient] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
  const [results, setResults] = useState({});
  const [activeTest, setActiveTest] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  /* =========================================================
     LOAD DATA
     ========================================================= */

  useEffect(() => {
    try {
      const patientData = JSON.parse(
        localStorage.getItem("nidanPatient") || "{}"
      );

      const testData = JSON.parse(
        localStorage.getItem("nidanSelectedTests") || "[]"
      );

      const resultData = JSON.parse(
        localStorage.getItem("nidanResults") || "{}"
      );

      setPatient(patientData);
      setSelectedTests(testData);
      setResults(resultData);

      if (testData.length > 0) {
        setActiveTest(testData[0].id);
      }
    } catch (error) {
      console.error("Result page load error:", error);
    }
  }, []);

  /* =========================================================
     CURRENT TEST
     ========================================================= */

  const currentTest = useMemo(() => {
    return selectedTests.find(
      (test) => test.id === activeTest
    );
  }, [selectedTests, activeTest]);

  /* =========================================================
     PATIENT AGE / GENDER
     ========================================================= */

  function getPatientAge() {
    const age = parseFloat(patient.age);

    if (Number.isNaN(age)) {
      return null;
    }

    return age;
  }

  function getPatientGender() {
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

  /* =========================================================
     PARAMETER NAME NORMALIZER
     ========================================================= */

  function normalizeParameterName(name = "") {
    return String(name)
      .toLowerCase()
      .replace(/[()]/g, "")
      .replace(/[./_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* =========================================================
     DEFAULT REFERENCE DATABASE
     Used only when parameter itself does not contain
     min/max/range/reference information.
     ========================================================= */

  function getDefaultReference(parameterName) {
    const name = normalizeParameterName(parameterName);

    const gender = getPatientGender();
    const age = getPatientAge();

    /* -------------------------
       CBC
       ------------------------- */

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

    /* -------------------------
       ESR
       ------------------------- */

    if (
      name === "esr" ||
      name.includes("erythrocyte sedimentation")
    ) {
      if (gender === "female") {
        return {
          min: 0,
          max: 20,
          unit: "mm/hr",
          range: "0 - 20",
        };
      }

      return {
        min: 0,
        max: 15,
        unit: "mm/hr",
        range: "0 - 15",
      };
    }

    /* -------------------------
       BLOOD SUGAR
       ------------------------- */

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

    /* -------------------------
       KFT
       ------------------------- */

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
      if (gender === "female") {
        return {
          min: 2.4,
          max: 6.0,
          unit: "mg/dL",
          range: "2.4 - 6.0",
        };
      }

      return {
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

    /* -------------------------
       LFT
       ------------------------- */

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

    /* -------------------------
       LIPID PROFILE
       ------------------------- */

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

    /* -------------------------
       HBA1C
       ------------------------- */

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

    /* -------------------------
       THYROID
       ------------------------- */

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

  /* =========================================================
     RESOLVE PARAMETER
     IMPORTANT:
     Explicit data from tests/page.js gets priority.
     ========================================================= */

  function resolveParameter(parameter) {
    const defaultData = getDefaultReference(
      parameter.name ||
        parameter.testName ||
        parameter.investigation ||
        ""
    );

    let min = parameter.min;

    let max = parameter.max;

    let unit =
      parameter.unit ||
      parameter.units ||
      defaultData?.unit ||
      "";

    let range =
      parameter.range ||
      parameter.reference ||
      parameter.referenceRange ||
      "";

    if (
      (min === undefined ||
        min === null ||
        min === "") &&
      defaultData
    ) {
      min = defaultData.min;
    }

    if (
      (max === undefined ||
        max === null ||
        max === "") &&
      defaultData
    ) {
      max = defaultData.max;
    }

    if (!range && defaultData) {
      range = defaultData.range;
    }

    if (!range) {
      if (
        min !== undefined &&
        min !== null &&
        min !== "" &&
        max !== undefined &&
        max !== null &&
        max !== ""
      ) {
        range = `${min} - ${max}`;
      } else if (
        max !== undefined &&
        max !== null &&
        max !== ""
      ) {
        range = `< ${max}`;
      } else if (
        min !== undefined &&
        min !== null &&
        min !== ""
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

  /* =========================================================
     RESULT KEY
     ========================================================= */

  function getParameterKey(
    testId,
    parameter,
    index
  ) {
    const name =
      parameter.name ||
      parameter.testName ||
      parameter.investigation ||
      `parameter-${index}`;

    return `${testId}-${name}-${index}`;
  }

  /* =========================================================
     UPDATE RESULT
     ========================================================= */

  function updateResult(
    testId,
    parameter,
    index,
    value
  ) {
    const key = getParameterKey(
      testId,
      parameter,
      index
    );

    setResults((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  /* =========================================================
     FLAG CALCULATION
     ========================================================= */

  function getFlag(value, parameter) {
    if (
      value === "" ||
      value === undefined ||
      value === null
    ) {
      return "";
    }

    const resolved = resolveParameter(parameter);

    const numericValue = Number(
      String(value).replace(/,/g, "")
    );

    if (Number.isNaN(numericValue)) {
      return "";
    }

    const hasMin =
      resolved.min !== undefined &&
      resolved.min !== null &&
      resolved.min !== "";

    const hasMax =
      resolved.max !== undefined &&
      resolved.max !== null &&
      resolved.max !== "";

    if (hasMin) {
      const min = Number(resolved.min);

      if (
        !Number.isNaN(min) &&
        numericValue < min
      ) {
        return "LOW";
      }
    }

    if (hasMax) {
      const max = Number(resolved.max);

      if (
        !Number.isNaN(max) &&
        numericValue > max
      ) {
        return "HIGH";
      }
    }

    if (hasMin || hasMax) {
      return "NORMAL";
    }

    return "";
  }

  /* =========================================================
     TEXT / SELECT PARAMETERS
     ========================================================= */

  function getOptions(parameter) {
    if (
      Array.isArray(parameter.options) &&
      parameter.options.length > 0
    ) {
      return parameter.options;
    }

    const name = normalizeParameterName(
      parameter.name || ""
    );

    if (
      name.includes("hiv") ||
      name.includes("hbsag") ||
      name.includes("hcv")
    ) {
      return [
        "Non-Reactive",
        "Reactive",
      ];
    }

    if (
      name === "albumin" ||
      name === "sugar"
    ) {
      return [
        "Nil",
        "Trace",
        "+",
        "++",
        "+++",
        "++++",
      ];
    }

    if (
      name === "colour" ||
      name === "color"
    ) {
      return [
        "Pale Yellow",
        "Yellow",
        "Dark Yellow",
        "Straw",
        "Colourless",
        "Other",
      ];
    }

    if (name === "appearance") {
      return [
        "Clear",
        "Slightly Turbid",
        "Turbid",
      ];
    }

    return [];
  }

  /* =========================================================
     REFERENCE RANGE
     ========================================================= */

  function getReference(parameter) {
    const resolved = resolveParameter(parameter);

    return resolved.range || "-";
  }

  /* =========================================================
     UNIT
     ========================================================= */

  function getUnit(parameter) {
    const resolved = resolveParameter(parameter);

    return resolved.unit || "-";
  }

  /* =========================================================
     SAVE
     ========================================================= */

  function saveResults(showAlert = true) {
    try {
      localStorage.setItem(
        "nidanResults",
        JSON.stringify(results)
      );

      if (showAlert) {
        setSavedMessage(
          "✓ Results saved successfully"
        );

        setTimeout(() => {
          setSavedMessage("");
        }, 2500);
      }

      return true;
    } catch (error) {
      console.error(
        "Result save error:",
        error
      );

      alert("Results save nahi ho paye.");

      return false;
    }
  }

  /* =========================================================
     CHECK MISSING RESULTS
     ========================================================= */

  function getMissingResults() {
    const missing = [];

    selectedTests.forEach((test) => {
      const parameters =
        test.tests || test.parameters || [];

      parameters.forEach(
        (parameter, index) => {
          const key = getParameterKey(
            test.id,
            parameter,
            index
          );

          const value = results[key];

          if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
          ) {
            missing.push({
              test:
                test.short ||
                test.name ||
                "Test",

              parameter:
                parameter.name ||
                parameter.testName ||
                "Parameter",
            });
          }
        }
      );
    });

    return missing;
  }

  /* =========================================================
     FINAL REPORT
     ========================================================= */

  function continueReport() {
    if (selectedTests.length === 0) {
      alert(
        "Koi test selected nahi hai."
      );
      return;
    }

    const missing = getMissingResults();

    if (missing.length > 0) {
      const preview = missing
        .slice(0, 5)
        .map(
          (item) =>
            `${item.test}: ${item.parameter}`
        )
        .join("\n");

      const more =
        missing.length > 5
          ? `\nAur ${
              missing.length - 5
            } result blank hain.`
          : "";

      const proceed = window.confirm(
        `${missing.length} result blank hain:\n\n${preview}${more}\n\nKya phir bhi Final Report banana hai?`
      );

      if (!proceed) {
        return;
      }
    }

    saveResults(false);

    router.push("/report");
  }

  /* =========================================================
     NEXT TEST
     ========================================================= */

  function nextTest() {
    const index =
      selectedTests.findIndex(
        (test) => test.id === activeTest
      );

    if (
      index >= 0 &&
      index < selectedTests.length - 1
    ) {
      setActiveTest(
        selectedTests[index + 1].id
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      continueReport();
    }
  }

  /* =========================================================
     PREVIOUS TEST
     ========================================================= */

  function previousTest() {
    const index =
      selectedTests.findIndex(
        (test) => test.id === activeTest
      );

    if (index > 0) {
      setActiveTest(
        selectedTests[index - 1].id
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  /* =========================================================
     PARAMETER COUNTS
     ========================================================= */

  const totalParameters =
    selectedTests.reduce(
      (total, test) =>
        total +
        (
          test.tests ||
          test.parameters ||
          []
        ).length,
      0
    );

  const completedResults =
    selectedTests.reduce(
      (total, test) => {
        const parameters =
          test.tests ||
          test.parameters ||
          [];

        const completed =
          parameters.filter(
            (parameter, index) => {
              const key =
                getParameterKey(
                  test.id,
                  parameter,
                  index
                );

              const value =
                results[key];

              return (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
              );
            }
          ).length;

        return total + completed;
      },
      0
    );

  const progress =
    totalParameters > 0
      ? Math.round(
          (completedResults /
            totalParameters) *
            100
        )
      : 0;

  /* =========================================================
     UI
     ========================================================= */

  return (
    <div className="labApp">
      {/* SIDEBAR */}

      <aside className="sidebar">
        <div className="brand">
          <div className="brandLogo">
            N+
          </div>

          <div>
            <h2>NIDAN</h2>
            <p>PATHOLOGY LAB</p>
          </div>
        </div>

        <div className="menuLabel">
          MAIN MENU
        </div>

        <button
          className="menu"
          onClick={() =>
            router.push("/")
          }
        >
          <span>⌂</span>
          Dashboard
        </button>

        <button
          className="menu"
          onClick={() =>
            router.push("/patients")
          }
        >
          <span>♙</span>
          Patients
        </button>

        <button
          className="menu"
          onClick={() =>
            router.push("/tests")
          }
        >
          <span>🧪</span>
          Test Selection
        </button>

        <button
          className="menu"
          onClick={() =>
            router.push("/billing")
          }
        >
          <span>₹</span>
          Billing
        </button>

        <button className="menu active">
          <span>✎</span>
          Result Entry
        </button>

        <button
          className="menu"
          onClick={() =>
            router.push("/reports")
          }
        >
          <span>▤</span>
          Reports
        </button>
      </aside>

      {/* MAIN */}

      <main className="mainArea">
        <header className="topbar">
          <div>
            <h3>Result Entry</h3>

            <p>
              Enter laboratory
              investigation results
            </p>
          </div>

          <div className="topRight">
            <span className="statusDot" />
            NIDAN Lab System
          </div>
        </header>

        <div className="content">
          {/* PAGE HEADING */}

          <div className="pageHeading">
            <div>
              <div className="smallTitle">
                STEP 4 OF 5
              </div>

              <h1>
                Laboratory Results
              </h1>

              <p>
                Selected tests ke results
                enter karein.
              </p>
            </div>

            <button
              className="backBtn"
              onClick={() =>
                router.push("/billing")
              }
            >
              ← Back to Billing
            </button>
          </div>

          {/* STEPS */}

          <div className="steps">
            <div className="step">
              <span>✓</span>

              <div>
                Patient
                <small>
                  Registered
                </small>
              </div>
            </div>

            <div className="step">
              <span>✓</span>

              <div>
                Tests
                <small>
                  Selected
                </small>
              </div>
            </div>

            <div className="step">
              <span>✓</span>

              <div>
                Billing
                <small>
                  Completed
                </small>
              </div>
            </div>

            <div className="step activeStep">
              <span>4</span>

              <div>
                Results
                <small>
                  Enter Results
                </small>
              </div>
            </div>

            <div className="step">
              <span>5</span>

              <div>
                Report
                <small>
                  Print / PDF
                </small>
              </div>
            </div>
          </div>

          {/* PATIENT */}

          <div className="resultPatientCard">
            <div>
              <small>
                PATIENT ID
              </small>

              <strong>
                {patient.patientId ||
                  patient.id ||
                  "-"}
              </strong>
            </div>

            <div>
              <small>
                PATIENT NAME
              </small>

              <strong>
                {patient.name || "-"}
              </strong>
            </div>

            <div>
              <small>
                AGE / SEX
              </small>

              <strong>
                {patient.age || "-"} /{" "}
                {patient.gender ||
                  patient.sex ||
                  "-"}
              </strong>
            </div>

            <div>
              <small>
                REF. DOCTOR
              </small>

              <strong>
                {patient.doctor ||
                  patient.refDoctor ||
                  "-"}
              </strong>
            </div>
          </div>

          {/* PROGRESS */}

          <div className="resultProgressCard">
            <div>
              <div>
                <strong>
                  Result Progress
                </strong>

                <small>
                  {completedResults} of{" "}
                  {totalParameters} parameters
                  entered
                </small>
              </div>

              <strong className="progressNumber">
                {progress}%
              </strong>
            </div>

            <div className="progressTrack">
              <div
                className="progressFill"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>

          {/* SAVE MESSAGE */}

          {savedMessage && (
            <div
              style={{
                marginBottom: "14px",
                padding: "12px 16px",
                background: "#ecfdf5",
                border:
                  "1px solid #a7f3d0",
                borderRadius: "10px",
                color: "#047857",
                fontWeight: "600",
              }}
            >
              {savedMessage}
            </div>
          )}

          {/* WORKSPACE */}

          <div className="resultWorkspace">
            {/* TEST NAVIGATION */}

            <aside className="testResultNav">
              <div className="resultNavHeading">
                Selected Tests
              </div>

              {selectedTests.length ===
              0 ? (
                <div className="noSelectedTests">
                  No tests selected.
                </div>
              ) : (
                selectedTests.map(
                  (test, index) => {
                    const parameters =
                      test.tests ||
                      test.parameters ||
                      [];

                    return (
                      <button
                        key={test.id}
                        className={
                          activeTest ===
                          test.id
                            ? "resultTestButton activeResultTest"
                            : "resultTestButton"
                        }
                        onClick={() =>
                          setActiveTest(
                            test.id
                          )
                        }
                      >
                        <span className="testNumber">
                          {index + 1}
                        </span>

                        <div>
                          <strong>
                            {test.short ||
                              test.name}
                          </strong>

                          <small>
                            {
                              parameters.length
                            }{" "}
                            parameters
                          </small>
                        </div>
                      </button>
                    );
                  }
                )
              )}
            </aside>

            {/* RESULT CARD */}

            <section className="resultEntryCard">
              {!currentTest ? (
                <div className="emptyResultPage">
                  <div>🧪</div>

                  <h2>
                    No Test Selected
                  </h2>

                  <p>
                    Test Selection page se
                    investigation select
                    karein.
                  </p>

                  <button
                    className="continueBtn"
                    onClick={() =>
                      router.push(
                        "/tests"
                      )
                    }
                  >
                    Select Tests
                  </button>
                </div>
              ) : (
                <>
                  {/* TEST HEADER */}

                  <div className="resultCardHeader">
                    <div>
                      <div className="smallTitle">
                        INVESTIGATION
                      </div>

                      <h2>
                        {currentTest.name}
                      </h2>

                      <p>
                        Enter patient
                        laboratory results.
                      </p>
                    </div>

                    <div className="parameterBadge">
                      {(
                        currentTest.tests ||
                        currentTest.parameters ||
                        []
                      ).length}{" "}
                      Parameters
                    </div>
                  </div>

                  {/* TABLE */}

                  <div className="resultTableWrapper">
                    <table className="resultTable">
                      <thead>
                        <tr>
                          <th>
                            Investigation
                          </th>

                          <th>
                            Result
                          </th>

                          <th>
                            Unit
                          </th>

                          <th>
                            Reference Range
                          </th>

                          <th>
                            Flag
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {(
                          currentTest.tests ||
                          currentTest.parameters ||
                          []
                        ).map(
                          (
                            parameter,
                            index
                          ) => {
                            const key =
                              getParameterKey(
                                currentTest.id,
                                parameter,
                                index
                              );

                            const value =
                              results[key] ??
                              "";

                            const resolved =
                              resolveParameter(
                                parameter
                              );

                            const flag =
                              getFlag(
                                value,
                                parameter
                              );

                            const options =
                              getOptions(
                                parameter
                              );

                            const parameterName =
                              parameter.name ||
                              parameter.testName ||
                              parameter.investigation ||
                              "Investigation";

                            return (
                              <tr key={key}>
                                <td>
                                  <strong>
                                    {
                                      parameterName
                                    }
                                  </strong>
                                </td>

                                <td>
                                  {options.length >
                                  0 ? (
                                    <select
                                      className="resultInput"
                                      value={
                                        value
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        updateResult(
                                          currentTest.id,
                                          parameter,
                                          index,
                                          e
                                            .target
                                            .value
                                        )
                                      }
                                    >
                                      <option value="">
                                        Select
                                      </option>

                                      {options.map(
                                        (
                                          option
                                        ) => (
                                          <option
                                            key={
                                              option
                                            }
                                            value={
                                              option
                                            }
                                          >
                                            {
                                              option
                                            }
                                          </option>
                                        )
                                      )}
                                    </select>
                                  ) : (
                                    <input
                                      className="resultInput"
                                      type="text"
                                      inputMode={
                                        resolved.min !==
                                          undefined ||
                                        resolved.max !==
                                          undefined
                                          ? "decimal"
                                          : "text"
                                      }
                                      placeholder="Enter result"
                                      value={
                                        value
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        updateResult(
                                          currentTest.id,
                                          parameter,
                                          index,
                                          e
                                            .target
                                            .value
                                        )
                                      }
                                    />
                                  )}
                                </td>

                                <td>
                                  {getUnit(
                                    parameter
                                  )}
                                </td>

                                <td>
                                  {getReference(
                                    parameter
                                  )}
                                </td>

                                <td>
                                  {flag && (
                                    <span
                                      className={`resultFlag ${
                                        flag ===
                                        "HIGH"
                                          ? "flagHigh"
                                          : flag ===
                                            "LOW"
                                          ? "flagLow"
                                          : "flagNormal"
                                      }`}
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

                  {/* FOOTER */}

                  <div className="resultFooter">
                    <button
                      className="secondaryResultBtn"
                      onClick={
                        previousTest
                      }
                      disabled={
                        selectedTests.findIndex(
                          (test) =>
                            test.id ===
                            activeTest
                        ) === 0
                      }
                    >
                      ← Previous Test
                    </button>

                    <div className="resultFooterRight">
                      <button
                        className="saveResultBtn"
                        onClick={() =>
                          saveResults(
                            true
                          )
                        }
                      >
                        Save Results
                      </button>

                      <button
                        className="nextResultBtn"
                        onClick={
                          nextTest
                        }
                      >
                        {selectedTests.findIndex(
                          (test) =>
                            test.id ===
                            activeTest
                        ) ===
                        selectedTests.length -
                          1
                          ? "Final Report →"
                          : "Next Test →"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>

          {/* BOTTOM */}

          <div className="resultBottomActions">
            <div>
              <strong>
                Results ready?
              </strong>

              <p>
                Save results and create
                final laboratory report.
              </p>
            </div>

            <button
              className="generateReportBtn"
              onClick={
                continueReport
              }
            >
              Generate Final Report →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
