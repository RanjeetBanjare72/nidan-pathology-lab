"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/* =========================================================
   NIDAN PATHOLOGY LAB
   RESULT ENTRY PAGE
   MOBILE + DESKTOP RESPONSIVE VERSION
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
      (test) => String(test.id) === String(activeTest)
    );
  }, [selectedTests, activeTest]);

  /* =========================================================
     PATIENT AGE
     ========================================================= */

  function getPatientAge() {
    const age = parseFloat(patient.age);

    if (Number.isNaN(age)) {
      return null;
    }

    return age;
  }

  /* =========================================================
     PATIENT GENDER
     ========================================================= */

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
     ========================================================= */

  function getDefaultReference(parameterName) {
    const name = normalizeParameterName(parameterName);

    const gender = getPatientGender();
    const age = getPatientAge();

    /* ================= CBC ================= */

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

    if (name === "rdw cv") {
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

    /* ================= BLOOD SUGAR ================= */

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

    /* ================= LIPID ================= */

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

  /* =========================================================
     RESOLVE PARAMETER
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
     FLAG
     ========================================================= */

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
     OPTIONS
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
     SAVE RESULTS
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
     MISSING RESULTS
     ========================================================= */

  function getMissingResults() {
    const missing = [];

    selectedTests.forEach((test) => {
      const parameters =
        test.tests ||
        test.parameters ||
        [];

      parameters.forEach(
        (parameter, index) => {
          const key =
            getParameterKey(
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

    const missing =
      getMissingResults();

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

      const proceed =
        window.confirm(
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
        (test) =>
          String(test.id) ===
          String(activeTest)
      );

    if (
      index >= 0 &&
      index <
        selectedTests.length - 1
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
        (test) =>
          String(test.id) ===
          String(activeTest)
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
                value !==
                  undefined &&
                value !== null &&
                String(value).trim() !==
                  ""
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

  const currentParameters =
    currentTest
      ? currentTest.tests ||
        currentTest.parameters ||
        []
      : [];

  /* =========================================================
     UI
     ========================================================= */

  return (
    <>
      <div className="labApp resultPageApp">

        {/* =================================================
            SIDEBAR
            ================================================= */}

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
              router.push(
                "/patients"
              )
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
              router.push(
                "/billing"
              )
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
              router.push(
                "/reports"
              )
            }
          >
            <span>▤</span>
            Reports
          </button>
        </aside>

        {/* =================================================
            MAIN
            ================================================= */}

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
                  Selected tests ke
                  results enter karein.
                </p>
              </div>

              <button
                className="backBtn"
                onClick={() =>
                  router.push(
                    "/billing"
                  )
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

            {/* PATIENT CARD */}

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
                  {patient.name ||
                    "-"}
                </strong>
              </div>

              <div>
                <small>
                  AGE / SEX
                </small>

                <strong>
                  {patient.age ||
                    "-"}{" "}
                  /{" "}
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
              <div className="progressTop">
                <div>
                  <strong>
                    Result Progress
                  </strong>

                  <small>
                    {completedResults}{" "}
                    of{" "}
                    {totalParameters}{" "}
                    parameters entered
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
              <div className="savedMessage">
                {savedMessage}
              </div>
            )}

            {/* =================================================
                SELECTED TESTS
                MOBILE FRIENDLY
                ================================================= */}

            <div className="selectedTestsMobile">
              <div className="mobileSectionTitle">
                Selected Tests
              </div>

              <div className="mobileTestScroller">
                {selectedTests.map(
                  (test, index) => {
                    const parameters =
                      test.tests ||
                      test.parameters ||
                      [];

                    return (
                      <button
                        key={test.id}
                        className={
                          String(
                            activeTest
                          ) ===
                          String(
                            test.id
                          )
                            ? "mobileTestButton active"
                            : "mobileTestButton"
                        }
                        onClick={() =>
                          setActiveTest(
                            test.id
                          )
                        }
                      >
                        <span>
                          {index + 1}
                        </span>

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
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* =================================================
                WORKSPACE
                ================================================= */}

            <div className="resultWorkspace">

              {/* DESKTOP TEST NAV */}

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
                    (
                      test,
                      index
                    ) => {
                      const parameters =
                        test.tests ||
                        test.parameters ||
                        [];

                      return (
                        <button
                          key={
                            test.id
                          }
                          className={
                            String(
                              activeTest
                            ) ===
                            String(
                              test.id
                            )
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
                            {index +
                              1}
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
                      Test Selection page
                      se investigation
                      select karein.
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
                          {currentTest.name ||
                            currentTest.short}
                        </h2>

                        <p>
                          Enter patient
                          laboratory
                          results.
                        </p>
                      </div>

                      <div className="parameterBadge">
                        {
                          currentParameters.length
                        }{" "}
                        Parameters
                      </div>
                    </div>

                    {/* =================================================
                        DESKTOP TABLE
                        ================================================= */}

                    <div className="resultTableWrapper desktopResultTable">
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
                          {currentParameters.map(
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
                                <tr
                                  key={
                                    key
                                  }
                                >
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
                                    {
                                      resolved.unit ||
                                      "-"
                                    }
                                  </td>

                                  <td>
                                    {
                                      resolved.range ||
                                      "-"
                                    }
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

                    {/* =================================================
                        MOBILE PARAMETER CARDS
                        ================================================= */}

                    <div className="mobileParameterList">

                      {currentParameters.map(
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
                            <div
                              className="mobileParameterCard"
                              key={
                                key
                              }
                            >

                              {/* PARAMETER NAME */}

                              <div className="mobileParameterName">
                                <span>
                                  {index +
                                    1}
                                </span>

                                <strong>
                                  {
                                    parameterName
                                  }
                                </strong>
                              </div>

                              {/* RESULT */}

                              <div className="mobileField">
                                <label>
                                  Result
                                </label>

                                {options.length >
                                0 ? (
                                  <select
                                    className="mobileResultInput"
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
                                      Select result
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
                                    className="mobileResultInput"
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
                              </div>

                              {/* UNIT + RANGE */}

                              <div className="mobileInfoGrid">

                                <div>
                                  <small>
                                    Unit
                                  </small>

                                  <strong>
                                    {
                                      resolved.unit ||
                                      "-"
                                    }
                                  </strong>
                                </div>

                                <div>
                                  <small>
                                    Reference Range
                                  </small>

                                  <strong>
                                    {
                                      resolved.range ||
                                      "-"
                                    }
                                  </strong>
                                </div>

                                <div>
                                  <small>
                                    Flag
                                  </small>

                                  <strong>
                                    {flag ? (
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
                                    ) : (
                                      "-"
                                    )}
                                  </strong>
                                </div>

                              </div>

                            </div>
                          );
                        }
                      )}

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
                              String(
                                test.id
                              ) ===
                              String(
                                activeTest
                              )
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
                              String(
                                test.id
                              ) ===
                              String(
                                activeTest
                              )
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

      {/* =========================================================
          RESPONSIVE CSS
          ========================================================= */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          overflow-x: hidden;
        }

        /* ==========================================
           MAIN RESULT WORKSPACE
           ========================================== */

        .resultWorkspace {
          width: 100%;
          min-width: 0;
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr);
          gap: 18px;
          align-items: start;
        }

        .resultEntryCard {
          min-width: 0;
          width: 100%;
          overflow: hidden;
        }

        .resultTableWrapper {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .resultTable {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .resultTable th,
        .resultTable td {
          padding: 12px 10px;
          vertical-align: middle;
          word-break: break-word;
        }

        .resultTable th:nth-child(1),
        .resultTable td:nth-child(1) {
          width: 27%;
        }

        .resultTable th:nth-child(2),
        .resultTable td:nth-child(2) {
          width: 21%;
        }

        .resultTable th:nth-child(3),
        .resultTable td:nth-child(3) {
          width: 15%;
        }

        .resultTable th:nth-child(4),
        .resultTable td:nth-child(4) {
          width: 24%;
        }

        .resultTable th:nth-child(5),
        .resultTable td:nth-child(5) {
          width: 13%;
        }

        .resultInput {
          width: 100%;
          min-width: 120px;
          min-height: 42px;
          padding: 9px 10px;
          border: 1px solid #d6dde5;
          border-radius: 8px;
          background: #ffffff;
          font-size: 14px;
          outline: none;
        }

        .resultInput:focus {
          border-color: #0f9d9a;
          box-shadow: 0 0 0 3px rgba(15,157,154,.10);
        }

        /* ==========================================
           PATIENT CARD
           ========================================== */

        .resultPatientCard {
          width: 100%;
          min-width: 0;
        }

        .resultProgressCard {
          width: 100%;
        }

        .progressTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .savedMessage {
          margin-bottom: 14px;
          padding: 12px 16px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 10px;
          color: #047857;
          font-weight: 600;
        }

        /* ==========================================
           MOBILE SELECTED TESTS
           ========================================== */

        .selectedTestsMobile {
          display: none;
        }

        /* ==========================================
           MOBILE PARAMETER LIST
           ========================================== */

        .mobileParameterList {
          display: none;
        }

        /* ==========================================
           MOBILE
           ========================================== */

        @media (max-width: 900px) {

          .resultWorkspace {
            grid-template-columns: 1fr;
          }

          .testResultNav {
            display: none !important;
          }

          .selectedTestsMobile {
            display: block;
            width: 100%;
            margin-bottom: 14px;
            padding: 14px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
          }

          .mobileSectionTitle {
            font-size: 14px;
            font-weight: 800;
            color: #172033;
            margin-bottom: 10px;
          }

          .mobileTestScroller {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding-bottom: 4px;
            -webkit-overflow-scrolling: touch;
          }

          .mobileTestButton {
            flex: 0 0 auto;
            min-width: 125px;
            padding: 10px 12px;
            border: 1px solid #dce4e8;
            background: #ffffff;
            border-radius: 10px;
            text-align: left;
            display: flex;
            flex-direction: column;
            gap: 3px;
          }

          .mobileTestButton span {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: #edf4f4;
            color: #087f7d;
            font-weight: 800;
            font-size: 12px;
          }

          .mobileTestButton strong {
            font-size: 13px;
            color: #182233;
          }

          .mobileTestButton small {
            color: #718096;
            font-size: 11px;
          }

          .mobileTestButton.active {
            border-color: #0f9d9a;
            background: #effcfb;
          }

          /* Hide desktop table on mobile */

          .desktopResultTable {
            display: none !important;
          }

          /* Show parameter cards */

          .mobileParameterList {
            display: block;
            width: 100%;
            padding: 12px;
          }

          .mobileParameterCard {
            width: 100%;
            padding: 14px;
            margin-bottom: 12px;
            border: 1px solid #e1e7eb;
            border-radius: 12px;
            background: #ffffff;
            box-shadow: 0 2px 8px rgba(15,23,42,.04);
          }

          .mobileParameterName {
            display: flex;
            align-items: center;
            gap: 9px;
            margin-bottom: 13px;
          }

          .mobileParameterName span {
            flex: 0 0 auto;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: #e9f8f7;
            color: #087f7d;
            font-size: 12px;
            font-weight: 800;
          }

          .mobileParameterName strong {
            color: #172033;
            font-size: 14px;
            line-height: 1.35;
          }

          .mobileField {
            width: 100%;
            margin-bottom: 12px;
          }

          .mobileField label {
            display: block;
            margin-bottom: 6px;
            font-size: 12px;
            font-weight: 700;
            color: #64748b;
          }

          .mobileResultInput {
            width: 100%;
            height: 46px;
            padding: 10px 12px;
            border: 1px solid #cfd8df;
            border-radius: 9px;
            background: #ffffff;
            color: #111827;
            font-size: 15px;
            outline: none;
          }

          .mobileResultInput:focus {
            border-color: #0f9d9a;
            box-shadow: 0 0 0 3px rgba(15,157,154,.10);
          }

          .mobileInfoGrid {
            display: grid;
            grid-template-columns: 1fr 1.5fr 0.8fr;
            gap: 8px;
            width: 100%;
          }

          .mobileInfoGrid > div {
            min-width: 0;
            padding: 9px;
            background: #f8fafc;
            border-radius: 8px;
          }

          .mobileInfoGrid small {
            display: block;
            margin-bottom: 4px;
            color: #64748b;
            font-size: 10px;
            font-weight: 700;
          }

          .mobileInfoGrid strong {
            display: block;
            color: #172033;
            font-size: 12px;
            line-height: 1.3;
            word-break: break-word;
          }

          /* ======================================
             RESULT FOOTER
             ====================================== */

          .resultFooter {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 12px;
          }

          .resultFooterRight {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            width: 100%;
          }

          .secondaryResultBtn,
          .saveResultBtn,
          .nextResultBtn {
            min-height: 44px;
            width: 100%;
          }

          .resultBottomActions {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .generateReportBtn {
            width: 100%;
            min-height: 46px;
          }

        }

        /* ==========================================
           SMALL MOBILE
           ========================================== */

        @media (max-width: 600px) {

          .resultPageApp {
            width: 100%;
            overflow-x: hidden;
          }

          .mainArea {
            width: 100%;
            min-width: 0;
          }

          .content {
            width: 100%;
            max-width: 100%;
            padding-left: 10px !important;
            padding-right: 10px !important;
          }

          .topbar {
            width: 100%;
          }

          .pageHeading {
            width: 100%;
          }

          .pageHeading h1 {
            font-size: 24px !important;
            line-height: 1.15;
          }

          .pageHeading p {
            font-size: 12px;
          }

          .backBtn {
            width: 100%;
            margin-top: 8px;
          }

          /* Steps become horizontal scroll */

          .steps {
            width: 100%;
            overflow-x: auto;
            display: flex !important;
            gap: 8px;
            padding-bottom: 5px;
          }

          .step {
            flex: 0 0 105px;
            min-width: 105px;
          }

          /* Patient information */

          .resultPatientCard {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }

          .resultPatientCard > div {
            min-width: 0;
            padding: 10px !important;
          }

          .resultPatientCard strong {
            font-size: 12px !important;
            word-break: break-word;
          }

          .resultPatientCard small {
            font-size: 9px !important;
          }

          /* Progress */

          .progressTop {
            align-items: flex-start;
          }

          .progressNumber {
            font-size: 20px;
          }

          /* Result card */

          .resultEntryCard {
            width: 100%;
            max-width: 100%;
          }

          .resultCardHeader {
            padding: 14px !important;
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: flex-start !important;
          }

          .resultCardHeader h2 {
            font-size: 20px !important;
            line-height: 1.25;
            word-break: break-word;
          }

          .parameterBadge {
            align-self: flex-start;
          }

          /* Parameter cards */

          .mobileParameterList {
            padding: 10px 8px;
          }

          .mobileParameterCard {
            padding: 13px 11px;
          }

          .mobileInfoGrid {
            grid-template-columns: 1fr 1.25fr;
          }

          .mobileInfoGrid > div:last-child {
            grid-column: span 2;
          }

          .mobileInfoGrid strong {
            font-size: 12px;
          }

          /* Buttons */

          .resultFooterRight {
            grid-template-columns: 1fr;
          }

          .secondaryResultBtn,
          .saveResultBtn,
          .nextResultBtn {
            font-size: 13px;
          }

          .resultBottomActions {
            padding: 14px !important;
          }

          .resultBottomActions strong {
            font-size: 14px;
          }

          .resultBottomActions p {
            font-size: 11px;
          }

        }

        /* ==========================================
           VERY SMALL PHONES
           ========================================== */

        @media (max-width: 380px) {

          .resultPatientCard {
            grid-template-columns: 1fr !important;
          }

          .mobileTestButton {
            min-width: 115px;
          }

          .mobileParameterName strong {
            font-size: 13px;
          }

          .mobileResultInput {
            height: 44px;
            font-size: 14px;
          }

        }
        /* ==========================================
   MOBILE FULL WIDTH FIX
   ========================================== */

@media (max-width: 900px) {

  .resultPageApp {
    display: block !important;
    width: 100% !important;
  }

  .resultPageApp .sidebar {
    display: none !important;
  }

  .resultPageApp .mainArea {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
  }

  .resultPageApp .content {
    width: 100% !important;
    max-width: 100% !important;
  }

  .resultWorkspace {
    display: block !important;
    width: 100% !important;
  }

  .resultEntryCard {
    width: 100% !important;
    max-width: 100% !important;
  }

  .mobileParameterList {
    width: 100% !important;
  }

  .mobileParameterCard {
    width: 100% !important;
  }

}

      `}</style>
    </>
  );
}
