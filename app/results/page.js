"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/* =========================================================
   NIDAN PATHOLOGY LAB
   RESULT ENTRY PAGE
   app/results/page.js

   Features:
   - Patient details
   - Selected test navigation
   - Numeric + text results
   - Automatic HIGH / LOW / NORMAL flags
   - Male / Female reference support
   - String + object parameter compatibility
   - Result progress
   - LocalStorage save
   - Final report navigation
   ========================================================= */

export default function ResultsPage() {
  const router = useRouter();

  const [patient, setPatient] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
  const [results, setResults] = useState({});
  const [activeTest, setActiveTest] = useState("");
  const [loaded, setLoaded] = useState(false);

  /* =======================================================
     LOAD SAVED DATA
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

      setPatient(savedPatient || {});
      setSelectedTests(
        Array.isArray(savedTests) ? savedTests : []
      );

      setResults(
        savedResults &&
          typeof savedResults === "object" &&
          !Array.isArray(savedResults)
          ? savedResults
          : {}
      );

      if (
        Array.isArray(savedTests) &&
        savedTests.length > 0
      ) {
        setActiveTest(savedTests[0]?.id || "");
      }
    } catch (error) {
      console.error(
        "Result page data load error:",
        error
      );

      setPatient({});
      setSelectedTests([]);
      setResults({});
    } finally {
      setLoaded(true);
    }
  }, []);

  /* =======================================================
     BASIC HELPERS
     ======================================================= */

  function normalizeText(value) {
    return String(value ?? "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "");
  }

  function getParameterName(parameter) {
    if (typeof parameter === "string") {
      return parameter;
    }

    return (
      parameter?.name ||
      parameter?.parameterName ||
      parameter?.parameter_name ||
      parameter?.testName ||
      parameter?.label ||
      "Investigation"
    );
  }

  function getParameterKey(
    testId,
    parameter,
    index
  ) {
    const parameterName =
      getParameterName(parameter);

    return `${testId}-${parameterName}-${index}`;
  }

  function getPatientSex() {
    const value = String(
      patient?.gender ||
        patient?.sex ||
        ""
    )
      .trim()
      .toLowerCase();

    if (
      value === "male" ||
      value === "m" ||
      value.startsWith("male")
    ) {
      return "male";
    }

    if (
      value === "female" ||
      value === "f" ||
      value.startsWith("female")
    ) {
      return "female";
    }

    return "";
  }

  function getNumericValue(value) {
    if (
      value === "" ||
      value === undefined ||
      value === null
    ) {
      return null;
    }

    const cleaned = String(value)
      .replace(/,/g, "")
      .trim();

    if (!cleaned) return null;

    /*
      Strict numeric check.
      "Positive", "Negative", "1:80" etc.
      numeric result nahi maane jayenge.
    */

    if (!/^-?\d+(\.\d+)?$/.test(cleaned)) {
      return null;
    }

    const number = Number(cleaned);

    return Number.isFinite(number)
      ? number
      : null;
  }

  /* =======================================================
     MASTER FALLBACK PARAMETER INFORMATION

     Current Tests page me agar parameters sirf strings hain,
     tab bhi unit/reference/result entry useful rahega.

     IMPORTANT:
     Ye software defaults hain.
     Production use me apne laboratory method/analyser ke
     validated reference intervals ke according configure karein.
     ======================================================= */

  function getFallbackParameter(parameterName) {
    const name = normalizeText(parameterName);

    const library = {
      hemoglobin: {
        unit: "g/dL",
        maleMin: 13,
        maleMax: 17,
        femaleMin: 12,
        femaleMax: 15,
        maleReference: "13 - 17",
        femaleReference: "12 - 15",
      },

      haemoglobin: {
        unit: "g/dL",
        maleMin: 13,
        maleMax: 17,
        femaleMin: 12,
        femaleMax: 15,
        maleReference: "13 - 17",
        femaleReference: "12 - 15",
      },

      rbccount: {
        unit: "million/cumm",
        maleMin: 4.5,
        maleMax: 6.0,
        femaleMin: 4.0,
        femaleMax: 5.5,
        maleReference: "4.5 - 6.0",
        femaleReference: "4.0 - 5.5",
      },

      totalwbccount: {
        unit: "/cumm",
        min: 4000,
        max: 11000,
        reference: "4000 - 11000",
      },

      totalleucocytecount: {
        unit: "/cumm",
        min: 4000,
        max: 11000,
        reference: "4000 - 11000",
      },

      plateletcount: {
        unit: "Lac/cumm",
        min: 1.5,
        max: 4.5,
        reference: "1.5 - 4.5",
      },

      pcvhematocrit: {
        unit: "%",
        maleMin: 40,
        maleMax: 50,
        femaleMin: 36,
        femaleMax: 46,
        maleReference: "40 - 50",
        femaleReference: "36 - 46",
      },

      pcvhaematocrit: {
        unit: "%",
        maleMin: 40,
        maleMax: 50,
        femaleMin: 36,
        femaleMax: 46,
        maleReference: "40 - 50",
        femaleReference: "36 - 46",
      },

      mcv: {
        unit: "fL",
        min: 80,
        max: 100,
        reference: "80 - 100",
      },

      mch: {
        unit: "pg",
        min: 27,
        max: 32,
        reference: "27 - 32",
      },

      mchc: {
        unit: "g/dL",
        min: 32,
        max: 36,
        reference: "32 - 36",
      },

      rdwcv: {
        unit: "%",
        min: 11.5,
        max: 14.5,
        reference: "11.5 - 14.5",
      },

      neutrophils: {
        unit: "%",
        min: 40,
        max: 75,
        reference: "40 - 75",
      },

      lymphocytes: {
        unit: "%",
        min: 20,
        max: 40,
        reference: "20 - 40",
      },

      monocytes: {
        unit: "%",
        min: 1,
        max: 10,
        reference: "1 - 10",
      },

      eosinophils: {
        unit: "%",
        min: 1,
        max: 6,
        reference: "1 - 6",
      },

      basophils: {
        unit: "%",
        min: 0,
        max: 1,
        reference: "0 - 1",
      },

      esr: {
        unit: "mm/1st hr",
        maleMin: 0,
        maleMax: 15,
        femaleMin: 0,
        femaleMax: 20,
        maleReference: "0 - 15",
        femaleReference: "0 - 20",
      },

      fastingbloodsugar: {
        unit: "mg/dL",
        min: 70,
        max: 99,
        reference: "70 - 99",
      },

      postprandialbloodsugar: {
        unit: "mg/dL",
        max: 140,
        reference: "< 140",
      },

      randombloodsugar: {
        unit: "mg/dL",
        min: 70,
        max: 140,
        reference: "70 - 140",
      },

      bloodurea: {
        unit: "mg/dL",
        min: 15,
        max: 40,
        reference: "15 - 40",
      },

      serumcreatinine: {
        unit: "mg/dL",
        min: 0.6,
        max: 1.3,
        reference: "0.6 - 1.3",
      },

      uricacid: {
        unit: "mg/dL",
        maleMin: 3.4,
        maleMax: 7.0,
        femaleMin: 2.4,
        femaleMax: 6.0,
        maleReference: "3.4 - 7.0",
        femaleReference: "2.4 - 6.0",
      },

      sodium: {
        unit: "mmol/L",
        min: 135,
        max: 145,
        reference: "135 - 145",
      },

      potassium: {
        unit: "mmol/L",
        min: 3.5,
        max: 5.1,
        reference: "3.5 - 5.1",
      },

      chloride: {
        unit: "mmol/L",
        min: 98,
        max: 107,
        reference: "98 - 107",
      },

      bun: {
        unit: "mg/dL",
        min: 7,
        max: 20,
        reference: "7 - 20",
      },

      totalbilirubin: {
        unit: "mg/dL",
        min: 0.2,
        max: 1.2,
        reference: "0.2 - 1.2",
      },

      directbilirubin: {
        unit: "mg/dL",
        min: 0,
        max: 0.3,
        reference: "0.0 - 0.3",
      },

      indirectbilirubin: {
        unit: "mg/dL",
        min: 0.2,
        max: 0.9,
        reference: "0.2 - 0.9",
      },

      sgotast: {
        unit: "U/L",
        max: 40,
        reference: "Up to 40",
      },

      sgptalt: {
        unit: "U/L",
        max: 40,
        reference: "Up to 40",
      },

      alkalinephosphatase: {
        unit: "U/L",
        min: 44,
        max: 147,
        reference: "44 - 147",
      },

      totalprotein: {
        unit: "g/dL",
        min: 6.0,
        max: 8.3,
        reference: "6.0 - 8.3",
      },

      albumin: {
        unit: "g/dL",
        min: 3.5,
        max: 5.2,
        reference: "3.5 - 5.2",
      },

      globulin: {
        unit: "g/dL",
        min: 2.0,
        max: 3.5,
        reference: "2.0 - 3.5",
      },

      totalcholesterol: {
        unit: "mg/dL",
        max: 200,
        reference: "Desirable: < 200",
      },

      triglycerides: {
        unit: "mg/dL",
        max: 150,
        reference: "Normal: < 150",
      },

      hdlcholesterol: {
        unit: "mg/dL",
        min: 40,
        max: 60,
        reference: "40 - 60",
      },

      ldlcholesterol: {
        unit: "mg/dL",
        max: 100,
        reference: "Optimal: < 100",
      },

      vldlcholesterol: {
        unit: "mg/dL",
        min: 5,
        max: 40,
        reference: "5 - 40",
      },

      hba1c: {
        unit: "%",
        max: 5.6,
        reference: "Normal: < 5.7",
      },

      t3: {
        unit: "ng/dL",
        min: 80,
        max: 200,
        reference: "80 - 200",
      },

      t4: {
        unit: "µg/dL",
        min: 5,
        max: 12,
        reference: "5.0 - 12.0",
      },

      tsh: {
        unit: "µIU/mL",
        min: 0.4,
        max: 4.5,
        reference: "0.4 - 4.5",
      },

      colour: {
        unit: "",
        reference: "Pale Yellow",
      },

      appearance: {
        unit: "",
        reference: "Clear",
      },

      reactionph: {
        unit: "",
        min: 4.5,
        max: 8,
        reference: "4.5 - 8.0",
      },

      specificgravity: {
        unit: "",
        min: 1.005,
        max: 1.03,
        reference: "1.005 - 1.030",
      },

      puscells: {
        unit: "/HPF",
        reference: "0 - 5",
      },

      epithelialcells: {
        unit: "/HPF",
        reference: "0 - 5",
      },

      rbc: {
        unit: "/HPF",
        reference: "0 - 2",
      },

      crystals: {
        unit: "",
        reference: "Nil",
      },

      styphio: {
        unit: "Titre",
        reference: "Lab / Regional cut-off",
      },

      styphih: {
        unit: "Titre",
        reference: "Lab / Regional cut-off",
      },

      styphiah: {
        unit: "Titre",
        reference: "Lab / Regional cut-off",
      },

      styphibh: {
        unit: "Titre",
        reference: "Lab / Regional cut-off",
      },
    };

    return library[name] || {};
  }

  /* =======================================================
     MERGE SAVED PARAMETER WITH FALLBACK INFORMATION
     ======================================================= */

  function getParameterInfo(parameter) {
    const parameterName =
      getParameterName(parameter);

    const fallback =
      getFallbackParameter(parameterName);

    if (
      !parameter ||
      typeof parameter === "string"
    ) {
      return {
        name: parameterName,
        ...fallback,
      };
    }

    /*
      Saved test data ko priority di gayi hai.
      Fallback sirf missing fields fill karega.
    */

    return {
      name: parameterName,
      ...fallback,
      ...parameter,
    };
  }

  /* =======================================================
     UNIT
     ======================================================= */

  function getUnit(parameter) {
    const info = getParameterInfo(parameter);

    return (
      info.unit ||
      info.units ||
      "-"
    );
  }

  /* =======================================================
     REFERENCE LIMITS
     ======================================================= */

  function getLimits(parameter) {
    const info = getParameterInfo(parameter);
    const sex = getPatientSex();

    if (sex === "male") {
      return {
        min:
          info.maleMin ??
          info.male_min ??
          info.min,

        max:
          info.maleMax ??
          info.male_max ??
          info.max,
      };
    }

    if (sex === "female") {
      return {
        min:
          info.femaleMin ??
          info.female_min ??
          info.min,

        max:
          info.femaleMax ??
          info.female_max ??
          info.max,
      };
    }

    return {
      min: info.min,
      max: info.max,
    };
  }

  /* =======================================================
     REFERENCE RANGE DISPLAY
     ======================================================= */

  function getReference(parameter) {
    const info = getParameterInfo(parameter);
    const sex = getPatientSex();

    if (sex === "male") {
      const maleReference =
        info.maleReference ||
        info.male_reference;

      if (maleReference) {
        return maleReference;
      }
    }

    if (sex === "female") {
      const femaleReference =
        info.femaleReference ||
        info.female_reference;

      if (femaleReference) {
        return femaleReference;
      }
    }

    if (info.range) {
      return info.range;
    }

    if (info.reference) {
      return info.reference;
    }

    if (info.referenceRange) {
      return info.referenceRange;
    }

    if (info.reference_range) {
      return info.reference_range;
    }

    const { min, max } =
      getLimits(parameter);

    const hasMin =
      min !== undefined &&
      min !== null &&
      min !== "";

    const hasMax =
      max !== undefined &&
      max !== null &&
      max !== "";

    if (hasMin && hasMax) {
      return `${min} - ${max}`;
    }

    if (hasMax) {
      return `≤ ${max}`;
    }

    if (hasMin) {
      return `≥ ${min}`;
    }

    return "-";
  }

  /* =======================================================
     HIGH / LOW / NORMAL FLAG
     ======================================================= */

  function getFlag(value, parameter) {
    const numericValue =
      getNumericValue(value);

    if (numericValue === null) {
      return "";
    }

    const { min, max } =
      getLimits(parameter);

    const hasMin =
      min !== undefined &&
      min !== null &&
      min !== "" &&
      Number.isFinite(Number(min));

    const hasMax =
      max !== undefined &&
      max !== null &&
      max !== "" &&
      Number.isFinite(Number(max));

    if (
      hasMin &&
      numericValue < Number(min)
    ) {
      return "LOW";
    }

    if (
      hasMax &&
      numericValue > Number(max)
    ) {
      return "HIGH";
    }

    if (hasMin || hasMax) {
      return "NORMAL";
    }

    return "";
  }

  /* =======================================================
     RESULT INPUT TYPE / SUGGESTIONS
     ======================================================= */

  function getResultSuggestions(parameter) {
    const name = normalizeText(
      getParameterName(parameter)
    );

    if (name === "colour") {
      return [
        "Pale Yellow",
        "Yellow",
        "Dark Yellow",
        "Red",
      ];
    }

    if (name === "appearance") {
      return [
        "Clear",
        "Slightly Turbid",
        "Turbid",
      ];
    }

    if (
      name === "albumin" ||
      name === "sugar" ||
      name.includes("protein")
    ) {
      return [
        "Negative",
        "Trace",
        "+",
        "++",
        "+++",
        "++++",
      ];
    }

    if (
      name === "crystals"
    ) {
      return [
        "Nil",
        "Calcium Oxalate",
        "Uric Acid",
        "Triple Phosphate",
      ];
    }

    return [];
  }

  /* =======================================================
     UPDATE RESULT
     ======================================================= */

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

  /* =======================================================
     ACTIVE TEST
     ======================================================= */

  const currentTest = useMemo(() => {
    return selectedTests.find(
      (test) => test?.id === activeTest
    );
  }, [selectedTests, activeTest]);

  /* =======================================================
     TOTAL PARAMETERS
     ======================================================= */

  const totalParameters = useMemo(() => {
    return selectedTests.reduce(
      (total, test) => {
        const parameters =
          Array.isArray(test?.tests)
            ? test.tests
            : Array.isArray(test?.parameters)
            ? test.parameters
            : [];

        return total + parameters.length;
      },
      0
    );
  }, [selectedTests]);

  /* =======================================================
     COMPLETED PARAMETERS

     Sirf selected tests ke current result keys count honge.
     Purane patient ke stale localStorage values count nahi honge.
     ======================================================= */

  const completedResults = useMemo(() => {
    let count = 0;

    selectedTests.forEach((test) => {
      const parameters =
        Array.isArray(test?.tests)
          ? test.tests
          : Array.isArray(test?.parameters)
          ? test.parameters
          : [];

      parameters.forEach(
        (parameter, index) => {
          const key = getParameterKey(
            test.id,
            parameter,
            index
          );

          const value = results[key];

          if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
          ) {
            count += 1;
          }
        }
      );
    });

    return count;
  }, [selectedTests, results]);

  const progressPercentage =
    totalParameters > 0
      ? Math.round(
          (completedResults /
            totalParameters) *
            100
        )
      : 0;

  /* =======================================================
     SAVE RESULTS
     ======================================================= */

  function saveResults(showAlert = true) {
    try {
      localStorage.setItem(
        "nidanResults",
        JSON.stringify(results)
      );

      if (showAlert) {
        alert(
          "Results successfully saved."
        );
      }

      return true;
    } catch (error) {
      console.error(
        "Result save error:",
        error
      );

      alert(
        "Results save nahi ho paaye."
      );

      return false;
    }
  }

  /* =======================================================
     FINAL REPORT
     ======================================================= */

  function continueReport() {
    if (selectedTests.length === 0) {
      alert(
        "Koi test selected nahi hai."
      );
      return;
    }

    const saved = saveResults(false);

    if (!saved) return;

    router.push("/report");
  }

  /* =======================================================
     TEST NAVIGATION
     ======================================================= */

  function nextTest() {
    const index =
      selectedTests.findIndex(
        (test) =>
          test?.id === activeTest
      );

    if (
      index >= 0 &&
      index <
        selectedTests.length - 1
    ) {
      setActiveTest(
        selectedTests[index + 1]?.id ||
          ""
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  function previousTest() {
    const index =
      selectedTests.findIndex(
        (test) =>
          test?.id === activeTest
      );

    if (index > 0) {
      setActiveTest(
        selectedTests[index - 1]?.id ||
          ""
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  const activeIndex =
    selectedTests.findIndex(
      (test) => test?.id === activeTest
    );

  /* =======================================================
     LOADING
     ======================================================= */

  if (!loaded) {
    return (
      <div
        style={{
          padding: "40px",
          fontFamily: "Arial",
        }}
      >
        Loading laboratory results...
      </div>
    );
  }

  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <div className="labApp">

      {/* ===================================================
          SIDEBAR
          =================================================== */}

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

      {/* ===================================================
          MAIN AREA
          =================================================== */}

      <main className="mainArea">

        <header className="topbar">

          <div>
            <h3>Result Entry</h3>

            <p>
              Enter laboratory investigation
              results
            </p>
          </div>

          <div className="topRight">
            <span className="statusDot"></span>
            NIDAN Lab System
          </div>

        </header>

        <div className="content">

          {/* =================================================
              PAGE HEADING
              ================================================= */}

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

          {/* =================================================
              STEPS
              ================================================= */}

          <div className="steps">

            <div className="step">
              <span>✓</span>

              <div>
                Patient
                <small>Registered</small>
              </div>
            </div>

            <div className="step">
              <span>✓</span>

              <div>
                Tests
                <small>Selected</small>
              </div>
            </div>

            <div className="step">
              <span>✓</span>

              <div>
                Billing
                <small>Completed</small>
              </div>
            </div>

            <div className="step activeStep">
              <span>4</span>

              <div>
                Results
                <small>Enter Results</small>
              </div>
            </div>

            <div className="step">
              <span>5</span>

              <div>
                Report
                <small>Print / PDF</small>
              </div>
            </div>

          </div>

          {/* =================================================
              PATIENT CARD
              ================================================= */}

          <div className="resultPatientCard">

            <div>
              <small>PATIENT ID</small>

              <strong>
                {patient.patientId ||
                  patient.id ||
                  "-"}
              </strong>
            </div>

            <div>
              <small>PATIENT NAME</small>

              <strong>
                {patient.name || "-"}
              </strong>
            </div>

            <div>
              <small>AGE / SEX</small>

              <strong>
                {patient.age || "-"} /{" "}
                {patient.gender ||
                  patient.sex ||
                  "-"}
              </strong>
            </div>

            <div>
              <small>REF. DOCTOR</small>

              <strong>
                {patient.doctor ||
                  patient.refDoctor ||
                  "-"}
              </strong>
            </div>

          </div>

          {/* =================================================
              PROGRESS
              ================================================= */}

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
                {progressPercentage}%
              </strong>

            </div>

            <div className="progressTrack">

              <div
                className="progressFill"
                style={{
                  width: `${Math.min(
                    progressPercentage,
                    100
                  )}%`,
                }}
              />

            </div>

          </div>

          {/* =================================================
              WORKSPACE
              ================================================= */}

          <div className="resultWorkspace">

            {/* ===============================================
                TEST NAVIGATION
                =============================================== */}

            <aside className="testResultNav">

              <div className="resultNavHeading">
                Selected Tests
              </div>

              {selectedTests.length === 0 ? (
                <div className="noSelectedTests">
                  No tests selected.
                </div>
              ) : (
                selectedTests.map(
                  (test, index) => {

                    const parameters =
                      Array.isArray(
                        test?.tests
                      )
                        ? test.tests
                        : Array.isArray(
                            test?.parameters
                          )
                        ? test.parameters
                        : [];

                    return (
                      <button
                        key={
                          test?.id ||
                          `test-${index}`
                        }
                        className={
                          activeTest ===
                          test?.id
                            ? "resultTestButton activeResultTest"
                            : "resultTestButton"
                        }
                        onClick={() =>
                          setActiveTest(
                            test?.id
                          )
                        }
                      >
                        <span className="testNumber">
                          {index + 1}
                        </span>

                        <div>
                          <strong>
                            {test?.short ||
                              test?.name ||
                              "Test"}
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

            {/* ===============================================
                RESULT ENTRY
                =============================================== */}

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
                      router.push("/tests")
                    }
                  >
                    Select Tests
                  </button>

                </div>

              ) : (

                <>

                  {/* =========================================
                      TEST HEADER
                      ========================================= */}

                  <div className="resultCardHeader">

                    <div>

                      <div className="smallTitle">
                        INVESTIGATION
                      </div>

                      <h2>
                        {currentTest.name ||
                          currentTest.short ||
                          "Laboratory Test"}
                      </h2>

                      <p>
                        Enter patient laboratory
                        results.
                      </p>

                    </div>

                    <div className="parameterBadge">
                      {Array.isArray(
                        currentTest.tests
                      )
                        ? currentTest.tests
                            .length
                        : Array.isArray(
                            currentTest.parameters
                          )
                        ? currentTest
                            .parameters.length
                        : 0}{" "}
                      Parameters
                    </div>

                  </div>

                  {/* =========================================
                      RESULT TABLE
                      ========================================= */}

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

                        {(Array.isArray(
                          currentTest.tests
                        )
                          ? currentTest.tests
                          : Array.isArray(
                              currentTest.parameters
                            )
                          ? currentTest.parameters
                          : []
                        ).map(
                          (
                            parameter,
                            index
                          ) => {

                            const parameterName =
                              getParameterName(
                                parameter
                              );

                            const key =
                              getParameterKey(
                                currentTest.id,
                                parameter,
                                index
                              );

                            const value =
                              results[key] ??
                              "";

                            const flag =
                              getFlag(
                                value,
                                parameter
                              );

                            const suggestions =
                              getResultSuggestions(
                                parameter
                              );

                            const dataListId =
                              `result-options-${normalizeText(
                                currentTest.id
                              )}-${index}`;

                            return (
                              <tr key={key}>

                                {/* INVESTIGATION */}

                                <td>
                                  <strong>
                                    {
                                      parameterName
                                    }
                                  </strong>
                                </td>

                                {/* RESULT */}

                                <td>

                                  <input
                                    className="resultInput"
                                    type="text"
                                    inputMode={
                                      suggestions.length >
                                      0
                                        ? "text"
                                        : "decimal"
                                    }
                                    list={
                                      suggestions.length >
                                      0
                                        ? dataListId
                                        : undefined
                                    }
                                    placeholder="Enter result"
                                    value={value}
                                    onChange={(
                                      event
                                    ) =>
                                      updateResult(
                                        currentTest.id,
                                        parameter,
                                        index,
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                  />

                                  {suggestions.length >
                                    0 && (
                                    <datalist
                                      id={
                                        dataListId
                                      }
                                    >
                                      {suggestions.map(
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
                                          />
                                        )
                                      )}
                                    </datalist>
                                  )}

                                </td>

                                {/* UNIT */}

                                <td>
                                  {getUnit(
                                    parameter
                                  )}
                                </td>

                                {/* REFERENCE */}

                                <td>
                                  {getReference(
                                    parameter
                                  )}
                                </td>

                                {/* FLAG */}

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
                                      {flag}
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

                  {/* =========================================
                      TEST FOOTER
                      ========================================= */}

                  <div className="resultFooter">

                    <button
                      className="secondaryResultBtn"
                      onClick={
                        previousTest
                      }
                      disabled={
                        activeIndex <= 0
                      }
                    >
                      ← Previous Test
                    </button>

                    <div className="resultFooterRight">

                      <button
                        className="saveResultBtn"
                        onClick={() =>
                          saveResults(true)
                        }
                      >
                        Save Results
                      </button>

                      {activeIndex <
                      selectedTests.length -
                        1 ? (
                        <button
                          className="nextResultBtn"
                          onClick={
                            nextTest
                          }
                        >
                          Next Test →
                        </button>
                      ) : (
                        <button
                          className="nextResultBtn"
                          onClick={
                            continueReport
                          }
                        >
                          Final Report →
                        </button>
                      )}

                    </div>

                  </div>

                </>

              )}

            </section>

          </div>

          {/* =================================================
              BOTTOM ACTION
              ================================================= */}

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
              onClick={continueReport}
            >
              Generate Final Report →
            </button>

          </div>

        </div>

      </main>

    </div>
  );
}
