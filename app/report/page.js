"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

/* =========================================================
   NIDAN PATHOLOGY LAB
   FINAL A4 PROFESSIONAL REPORT
   MULTI-PAGE PRINT VERSION
   SETTINGS INTEGRATED
   ========================================================= */

const SETTINGS_KEY = "nidanLabSettings";

const DEFAULT_SETTINGS = {
  labName: "NIDAN PATHOLOGY LAB",
  slogan: "Accurate Diagnosis • Trusted Care • Better Health",
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

/* =========================================================
   MAIN REPORT PAGE
   ========================================================= */

export default function ReportPage() {
  const router = useRouter();

  /* =======================================================
     STATE
     ======================================================= */

  const [patient, setPatient] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
  const [results, setResults] = useState({});
  const [reportNo, setReportNo] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  useEffect(() => {
    loadReport();
    loadSettings();

    const handleSettingsUpdate = (event) => {
      if (event?.detail) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...event.detail,
        });
      } else {
        loadSettings();
      }
    };

    const handleStorage = () => {
      loadSettings();
    };

    window.addEventListener(
      "nidan-settings-updated",
      handleSettingsUpdate
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "nidan-settings-updated",
        handleSettingsUpdate
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  /* =======================================================
     LOAD SETTINGS
     ======================================================= */

  function loadSettings() {
    try {
      const saved = localStorage.getItem(
        SETTINGS_KEY
      );

      if (saved) {
        const parsed = JSON.parse(saved);

        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
        });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error(
        "Report settings load error:",
        error
      );

      setSettings(DEFAULT_SETTINGS);
    }
  }

  /* =======================================================
     SAFE JSON STORAGE READER
     ======================================================= */

  function readJSON(keys) {
    for (const key of keys) {
      try {
        const value =
          localStorage.getItem(key);

        if (value) {
          return JSON.parse(value);
        }
      } catch (error) {
        console.log(
          "Storage read error:",
          key
        );
      }
    }

    return null;
  }

  /* =======================================================
     LOAD REPORT
     ======================================================= */

  function loadReport() {
    const p = readJSON([
      "nidanPatient",
      "patient",
      "currentPatient",
    ]);

    const tests = readJSON([
      "nidanSelectedTests",
      "selectedTests",
      "selected_tests",
    ]);

    const r = readJSON([
      "nidanResults",
      "results",
      "testResults",
    ]);

    setPatient(p || {});

    setSelectedTests(
      Array.isArray(tests)
        ? tests
        : []
    );

    setResults(r || {});

    let rn =
      localStorage.getItem(
        "nidanCurrentReportNo"
      );

    if (!rn) {
      rn =
        "NPL-" +
        Date.now()
          .toString()
          .slice(-8);

      localStorage.setItem(
        "nidanCurrentReportNo",
        rn
      );
    }

    setReportNo(rn);

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

    setLoaded(true);
  }

  /* =======================================================
     PATIENT DATA
     ======================================================= */

  const patientName =
    patient?.name ||
    patient?.patientName ||
    "Patient Name";

  const patientId =
    patient?.patientId ||
    patient?.id ||
    patient?.registrationNo ||
    "-";

  const age =
    patient?.age !== undefined &&
    patient?.age !== null &&
    patient?.age !== ""
      ? patient.age
      : "-";

  const gender =
    patient?.gender ||
    patient?.sex ||
    "-";

  const mobile =
    patient?.mobile ||
    patient?.mobileNumber ||
    patient?.phone ||
    "-";

  const referredBy =
    patient?.doctor ||
    patient?.referredBy ||
    patient?.refDoctor ||
    "Self";

  const collectionDate =
    patient?.sampleDate ||
    patient?.collectionDate ||
    reportDate;

  /* =======================================================
     NORMALIZE TEXT
     ======================================================= */

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[()]/g, "")
      .replace(/[-_/]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* =======================================================
     REFERENCE RANGES
     ======================================================= */

  function getReference(name) {
    const n = normalize(name);

    const sex =
      String(gender).toLowerCase();

    const isMale =
      sex === "male" ||
      sex === "m" ||
      sex === "man";

    /* ---------------- CBC ---------------- */

    if (
      n.includes("haemoglobin") ||
      n.includes("hemoglobin") ||
      n === "hb"
    ) {
      return isMale
        ? {
            range: "13 - 17",
            min: 13,
            max: 17,
            unit: "g/dL",
          }
        : {
            range: "12 - 15",
            min: 12,
            max: 15,
            unit: "g/dL",
          };
    }

    if (
      n.includes("total leucocyte") ||
      n.includes("total leukocyte") ||
      n.includes("total wbc") ||
      n === "tlc" ||
      n === "wbc" ||
      n.includes("white blood cell")
    ) {
      return {
        range: "4,000 - 11,000",
        min: 4000,
        max: 11000,
        unit: "/cumm",
      };
    }

    if (
      n === "neutrophils" ||
      n === "neutrophil"
    ) {
      return {
        range: "40 - 75",
        min: 40,
        max: 75,
        unit: "%",
      };
    }

    if (
      n === "lymphocytes" ||
      n === "lymphocyte"
    ) {
      return {
        range: "20 - 40",
        min: 20,
        max: 40,
        unit: "%",
      };
    }

    if (
      n === "eosinophils" ||
      n === "eosinophil"
    ) {
      return {
        range: "1 - 6",
        min: 1,
        max: 6,
        unit: "%",
      };
    }

    if (
      n === "monocytes" ||
      n === "monocyte"
    ) {
      return {
        range: "1 - 10",
        min: 1,
        max: 10,
        unit: "%",
      };
    }

    if (
      n === "basophils" ||
      n === "basophil"
    ) {
      return {
        range: "0 - 1",
        min: 0,
        max: 1,
        unit: "%",
      };
    }

    if (
      n === "rbc count" ||
      n === "rbc"
    ) {
      return isMale
        ? {
            range: "4.5 - 6.0",
            min: 4.5,
            max: 6,
            unit: "million/cumm",
          }
        : {
            range: "4.0 - 5.5",
            min: 4,
            max: 5.5,
            unit: "million/cumm",
          };
    }

    if (
      n.includes("pcv") ||
      n.includes("haematocrit") ||
      n.includes("hematocrit")
    ) {
      return isMale
        ? {
            range: "40 - 50",
            min: 40,
            max: 50,
            unit: "%",
          }
        : {
            range: "36 - 46",
            min: 36,
            max: 46,
            unit: "%",
          };
    }

    if (n === "mcv") {
      return {
        range: "80 - 100",
        min: 80,
        max: 100,
        unit: "fL",
      };
    }

    if (n === "mch") {
      return {
        range: "27 - 32",
        min: 27,
        max: 32,
        unit: "pg",
      };
    }

    if (n === "mchc") {
      return {
        range: "32 - 36",
        min: 32,
        max: 36,
        unit: "g/dL",
      };
    }

    if (
      n === "rdw cv" ||
      n === "rdw"
    ) {
      return {
        range: "11.5 - 14.5",
        min: 11.5,
        max: 14.5,
        unit: "%",
      };
    }

    if (
      n === "platelet count" ||
      n === "platelets" ||
      n === "platelet"
    ) {
      return {
        range: "1.5 - 4.5",
        min: 1.5,
        max: 4.5,
        unit: "Lac/cumm",
      };
    }

    if (n === "mpv") {
      return {
        range: "7.5 - 11.5",
        min: 7.5,
        max: 11.5,
        unit: "fL",
      };
    }

    if (n === "pdw") {
      return {
        range: "9 - 17",
        min: 9,
        max: 17,
        unit: "%",
      };
    }

    if (n === "pct") {
      return {
        range: "0.15 - 0.40",
        min: 0.15,
        max: 0.4,
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
        range: "0 - 15",
        min: 0,
        max: 15,
        unit: "mm/hr",
      };
    }

    /* ---------------- GLUCOSE ---------------- */

    if (
      n.includes(
        "fasting blood sugar"
      ) ||
      n === "fbs" ||
      n.includes("fasting glucose")
    ) {
      return {
        range: "70 - 99",
        min: 70,
        max: 99,
        unit: "mg/dL",
      };
    }

    if (
      n.includes("post prandial") ||
      n.includes("postprandial") ||
      n === "ppbs"
    ) {
      return {
        range: "70 - 140",
        min: 70,
        max: 140,
        unit: "mg/dL",
      };
    }

    if (
      n.includes(
        "random blood sugar"
      ) ||
      n === "rbs" ||
      n.includes("random glucose")
    ) {
      return {
        range: "70 - 140",
        min: 70,
        max: 140,
        unit: "mg/dL",
      };
    }

    if (
      n === "hba1c" ||
      n.includes("glycated hemoglobin")
    ) {
      return {
        range: "4.0 - 5.6",
        min: 4,
        max: 5.6,
        unit: "%",
      };
    }

    /* ---------------- KFT ---------------- */

    if (
      n === "urea" ||
      n === "blood urea"
    ) {
      return {
        range: "15 - 40",
        min: 15,
        max: 40,
        unit: "mg/dL",
      };
    }

    if (
      n === "creatinine" ||
      n === "serum creatinine"
    ) {
      return {
        range: "0.6 - 1.3",
        min: 0.6,
        max: 1.3,
        unit: "mg/dL",
      };
    }

    if (
      n === "uric acid" ||
      n === "serum uric acid"
    ) {
      return isMale
        ? {
            range: "3.4 - 7.0",
            min: 3.4,
            max: 7,
            unit: "mg/dL",
          }
        : {
            range: "2.4 - 6.0",
            min: 2.4,
            max: 6,
            unit: "mg/dL",
          };
    }

    /* ---------------- ELECTROLYTES ---------------- */

    if (
      n === "sodium" ||
      n === "serum sodium"
    ) {
      return {
        range: "135 - 145",
        min: 135,
        max: 145,
        unit: "mEq/L",
      };
    }

    if (
      n === "potassium" ||
      n === "serum potassium"
    ) {
      return {
        range: "3.5 - 5.1",
        min: 3.5,
        max: 5.1,
        unit: "mEq/L",
      };
    }

    if (
      n === "chloride" ||
      n === "serum chloride"
    ) {
      return {
        range: "98 - 107",
        min: 98,
        max: 107,
        unit: "mEq/L",
      };
    }

    /* ---------------- THYROID ---------------- */

    if (n === "tsh") {
      return {
        range: "0.4 - 4.0",
        min: 0.4,
        max: 4,
        unit: "µIU/mL",
      };
    }

    if (
      n === "free t3" ||
      n === "ft3"
    ) {
      return {
        range: "2.0 - 4.4",
        min: 2,
        max: 4.4,
        unit: "pg/mL",
      };
    }

    if (
      n === "free t4" ||
      n === "ft4"
    ) {
      return {
        range: "0.8 - 1.8",
        min: 0.8,
        max: 1.8,
        unit: "ng/dL",
      };
    }

    /* ---------------- LFT ---------------- */

    if (
      n.includes("sgot") ||
      n === "ast" ||
      n.includes("aspartate aminotransferase")
    ) {
      return {
        range: "Up to 40",
        min: 0,
        max: 40,
        unit: "U/L",
      };
    }

    if (
      n.includes("sgpt") ||
      n === "alt" ||
      n.includes("alanine aminotransferase")
    ) {
      return {
        range: "Up to 40",
        min: 0,
        max: 40,
        unit: "U/L",
      };
    }

    if (
      n.includes("alkaline phosphatase") ||
      n === "alp"
    ) {
      return {
        range: "44 - 147",
        min: 44,
        max: 147,
        unit: "U/L",
      };
    }

    if (
      n.includes("total bilirubin")
    ) {
      return {
        range: "0.2 - 1.2",
        min: 0.2,
        max: 1.2,
        unit: "mg/dL",
      };
    }

    if (
      n.includes("direct bilirubin")
    ) {
      return {
        range: "0.0 - 0.3",
        min: 0,
        max: 0.3,
        unit: "mg/dL",
      };
    }

    if (
      n.includes("total protein")
    ) {
      return {
        range: "6.0 - 8.3",
        min: 6,
        max: 8.3,
        unit: "g/dL",
      };
    }

    if (
      n.includes("albumin")
    ) {
      return {
        range: "3.5 - 5.0",
        min: 3.5,
        max: 5,
        unit: "g/dL",
      };
    }

    /* ---------------- LIPID ---------------- */

    if (
      n.includes("total cholesterol")
    ) {
      return {
        range: "< 200",
        min: 0,
        max: 200,
        unit: "mg/dL",
      };
    }

    if (
      n === "triglycerides" ||
      n === "triglyceride"
    ) {
      return {
        range: "< 150",
        min: 0,
        max: 150,
        unit: "mg/dL",
      };
    }

    if (
      n.includes("hdl cholesterol") ||
      n === "hdl"
    ) {
      return {
        range: "> 40",
        min: 40,
        max: null,
        unit: "mg/dL",
      };
    }

    if (
      n.includes("ldl cholesterol") ||
      n === "ldl"
    ) {
      return {
        range: "< 100",
        min: 0,
        max: 100,
        unit: "mg/dL",
      };
    }

    /* ---------------- OTHER ---------------- */

    if (
      n === "vitamin b12" ||
      n.includes("vit b12")
    ) {
      return {
        range: "200 - 900",
        min: 200,
        max: 900,
        unit: "pg/mL",
      };
    }

    if (
      n === "vitamin d" ||
      n.includes("25 oh vitamin d")
    ) {
      return {
        range: "30 - 100",
        min: 30,
        max: 100,
        unit: "ng/mL",
      };
    }

    return {
      range: "-",
      min: null,
      max: null,
      unit: "",
    };
  }

  /* =======================================================
     PARAMETER INFO
     ======================================================= */

  function parameterInfo(parameter) {
    if (
      typeof parameter === "string"
    ) {
      const ref =
        getReference(parameter);

      return {
        name: parameter,
        min: ref.min,
        max: ref.max,
        unit: ref.unit,
        range: ref.range,
      };
    }

    const name =
      parameter?.name ||
      parameter?.testName ||
      parameter?.investigation ||
      "Investigation";

    const ref =
      getReference(name);

    return {
      name,

      min:
        parameter?.min ??
        parameter?.minimum ??
        ref.min,

      max:
        parameter?.max ??
        parameter?.maximum ??
        ref.max,

      unit:
        parameter?.unit ||
        parameter?.units ||
        ref.unit,

      range:
        parameter?.range ||
        parameter?.referenceRange ||
        parameter?.reference ||
        ref.range,
    };
  }

  /* =======================================================
     RESULT FLAG
     ======================================================= */

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
      parameterInfo(parameter);

    const num = Number(
      String(value)
        .replace(/,/g, "")
        .replace(/%/g, "")
        .trim()
    );

    if (Number.isNaN(num)) {
      return "";
    }

    /*
     * Low
     */

    if (
      p.min !== null &&
      p.min !== undefined &&
      num < Number(p.min)
    ) {
      return "L";
    }

    /*
     * High
     */

    if (
      p.max !== null &&
      p.max !== undefined &&
      num > Number(p.max)
    ) {
      return "H";
    }

    return "";
  }

  /* =======================================================
     FIND RESULT
     ======================================================= */

  function getResult(
    test,
    parameter,
    index,
    testIndex
  ) {
    const testId =
      test?.id ||
      test?.testId ||
      `test-${testIndex}`;

    const name =
      typeof parameter === "string"
        ? parameter
        : parameter?.name ||
          parameter?.testName ||
          parameter?.investigation ||
          `parameter-${index}`;

    const keys = [
      `${testId}-${name}-${index}`,
      `${testId}-${name}`,
      `${testIndex}-${name}-${index}`,
      name,
      parameter?.id,
    ].filter(Boolean);

    for (const key of keys) {
      if (
        results &&
        Object.prototype.hasOwnProperty.call(
          results,
          key
        )
      ) {
        return results[key];
      }
    }

    if (
      parameter &&
      typeof parameter ===
        "object"
    ) {
      if (
        parameter.result !==
        undefined
      ) {
        return parameter.result;
      }

      if (
        parameter.value !==
        undefined
      ) {
        return parameter.value;
      }
    }

    return "";
  }

  /* =======================================================
     FINAL TEST DATA
     ======================================================= */

  const finalTests = useMemo(() => {
    if (
      !Array.isArray(selectedTests)
    ) {
      return [];
    }

    return selectedTests.map(
      (
        test,
        testIndex
      ) => {
        const parameters =
          test?.parameters ||
          test?.tests ||
          test?.items ||
          [];

        return {
          id:
            test?.id ||
            test?.testId ||
            `test-${testIndex}`,

          name:
            test?.name ||
            test?.testName ||
            "Laboratory Investigation",

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
                    const info =
                      parameterInfo(
                        parameter
                      );

                    const value =
                      getResult(
                        test,
                        parameter,
                        index,
                        testIndex
                      );

                    return {
                      ...info,

                      result:
                        value === null ||
                        value === undefined
                          ? ""
                          : value,

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
    gender,
  ]);

  /* =======================================================
     PRINT
     ======================================================= */

  function printReport() {
    window.print();
  }

  /* =======================================================
     NEW PATIENT
     ======================================================= */

  function newPatient() {
    const ok =
      window.confirm(
        "Current report clear karke New Patient start karein?"
      );

    if (!ok) {
      return;
    }

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

  /* =======================================================
     SETTINGS VALUES
     ======================================================= */

  const labName =
    settings.labName ||
    DEFAULT_SETTINGS.labName;

  const slogan =
    settings.slogan ||
    DEFAULT_SETTINGS.slogan;

  const labAddress =
    settings.labAddress || "";

  const labPhone =
    settings.phone || "";

  const labEmail =
    settings.email || "";

  const registrationNo =
    settings.registrationNo || "";

  const doctorName =
    settings.doctorName || "";

  const logo =
    settings.letterhead || "";

  /* =======================================================
     LOADING
     ======================================================= */

  if (!loaded) {
    return (
      <div className="loadingScreen">
        Loading Laboratory Report...
      </div>
    );
  }

  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <>
      {/* ===================================================
          SCREEN TOOLBAR
      =================================================== */}

      <div className="screenToolbar">
        <div className="toolbarLeft">
          <div className="smallLogo">
            {logo ? (
              <img
                src={logo}
                alt="Lab Logo"
              />
            ) : (
              "N"
            )}
          </div>

          <div>
            <strong>
              Final Laboratory Report
            </strong>

            <small>
              Report No: {reportNo}
            </small>
          </div>
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
            onClick={printReport}
          >
            🖨 Print / Save PDF
          </button>

          <button
            className="btn btnNew"
            onClick={newPatient}
          >
            + New Patient
          </button>
        </div>
      </div>

      {/* ===================================================
          REPORT PREVIEW
      =================================================== */}

      <div className="preview">
        <div className="a4Page">

          {/* =================================================
              HEADER
          ================================================= */}

          {settings.reportHeader !==
            false && (
            <>
              <header className="labHeader">
                <div className="brand">

                  {settings.showLogo !==
                    false && (
                    <div className="mainLogo">

                      {logo ? (
                        <img
                          src={logo}
                          alt={
                            labName +
                            " Logo"
                          }
                          className="uploadedLogo"
                        />
                      ) : (
                        <>
                          <span>
                            N
                          </span>

                          <div className="logoRay r1" />
                          <div className="logoRay r2" />
                          <div className="logoRay r3" />
                          <div className="logoRay r4" />
                        </>
                      )}

                    </div>
                  )}

                  <div className="brandText">
                    <h1>
                      {labName}
                    </h1>

                    <h2>
                      DIAGNOSTIC &amp;
                      PATHOLOGY LABORATORY
                    </h2>

                    {slogan && (
                      <p>
                        {slogan}
                      </p>
                    )}
                  </div>
                </div>

                <div className="headerRight">
                  <div className="reportLabel">
                    LABORATORY REPORT
                  </div>

                  {labPhone && (
                    <div>
                      ☎ {labPhone}
                    </div>
                  )}

                  {labEmail && (
                    <div>
                      ✉ {labEmail}
                    </div>
                  )}

                  {labAddress && (
                    <div>
                      📍 {labAddress}
                    </div>
                  )}

                  {registrationNo && (
                    <div>
                      Registration No:
                      {" "}
                      <b>
                        {registrationNo}
                      </b>
                    </div>
                  )}

                  {doctorName && (
                    <div>
                      Reporting Doctor:
                      {" "}
                      <b>
                        {doctorName}
                      </b>
                    </div>
                  )}

                  <div>
                    Report No:
                    {" "}
                    <b>
                      {reportNo}
                    </b>
                  </div>
                </div>
              </header>

              <div className="accentBar">
                <span />
                <b />
                <i />
              </div>
            </>
          )}

          {/* =================================================
              PATIENT INFORMATION
          ================================================= */}

          <section className="patientCard">
            <div className="sectionBar">
              <span className="circleP">
                P
              </span>

              PATIENT INFORMATION
            </div>

            <div className="patientGrid">
              <Info
                label="Patient Name"
                value={patientName}
                strong
              />

              <Info
                label="Patient ID"
                value={patientId}
              />

              <Info
                label="Age / Sex"
                value={`${age} / ${gender}`}
              />

              <Info
                label="Mobile"
                value={mobile}
              />

              <Info
                label="Referred By"
                value={referredBy}
              />

              <Info
                label="Collection Date"
                value={collectionDate}
              />

              <Info
                label="Report Date"
                value={reportDate}
              />

              <Info
                label="Report Status"
                value="FINAL"
                status
              />
            </div>
          </section>

          {/* =================================================
              TESTS
          ================================================= */}

          <main className="tests">

            {finalTests.length === 0 ? (
              <div className="noTest">
                No laboratory investigation
                available.
              </div>
            ) : (
              finalTests.map(
                (
                  test,
                  index
                ) => (
                  <TestSection
                    key={
                      test.id ||
                      index
                    }
                    test={test}
                    showReferenceRange={
                      settings.showReferenceRange !==
                      false
                    }
                    showFlag={
                      settings.showFlag !==
                      false
                    }
                  />
                )
              )
            )}

          </main>

          {/* =================================================
              SIGNATURES
          ================================================= */}

          <section className="signatures">

            <div className="signature">
              <div className="signatureBlank" />

              <strong>
                Lab Technician
              </strong>

              <small>
                {labName}
              </small>
            </div>

            <div className="signature">
              <div className="signatureBlank" />

              <strong>
                Authorized Signatory
              </strong>

              <small>
                {doctorName ||
                  "Signature & Seal"}
              </small>
            </div>

          </section>

          {/* =================================================
              NOTE
          ================================================= */}

          <div className="note">
            <b>Note:</b>{" "}
            Reference ranges may vary
            according to laboratory
            methodology, age and
            clinical condition.
            Results should be
            interpreted by a qualified
            healthcare professional.
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="footer">

            <strong>
              {labName}
            </strong>

            {slogan && (
              <span>
                {slogan}
              </span>
            )}

            <small>
              {labPhone &&
                `☎ ${labPhone}`}

              {labPhone &&
                labAddress &&
                " | "}

              {labAddress}

              {labEmail &&
                " | "}

              {labEmail}
            </small>

            <em>
              Final Laboratory Report
            </em>

          </footer>

        </div>
      </div>

      {/* ===================================================
          GLOBAL CSS
      =================================================== */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;

          background: #eef3f7;

          color: #172033;

          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        button {
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        /* ==================================================
           LOADING
        ================================================== */

        .loadingScreen {
          min-height: 100vh;

          display: flex;

          align-items: center;

          justify-content: center;

          background: #eef3f7;

          color: #667085;

          font-family:
            Arial,
            sans-serif;

          font-size: 14px;
        }

        /* ==================================================
           TOOLBAR
        ================================================== */

        .screenToolbar {
          width:
            calc(100% - 20px);

          max-width:
            1200px;

          margin:
            8px auto;

          padding:
            8px 12px;

          background:
            #ffffff;

          border:
            1px solid #dce4eb;

          border-radius:
            8px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            10px;

          box-shadow:
            0 2px 12px
            rgba(
              16,
              24,
              40,
              .06
            );
        }

        .toolbarLeft {
          display:
            flex;

          align-items:
            center;

          gap:
            8px;

          min-width:
            0;
        }

        .smallLogo {
          width:
            30px;

          height:
            30px;

          border-radius:
            8px;

          overflow:
            hidden;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          flex-shrink:
            0;

          color:
            #ffffff;

          font-weight:
            900;

          background:
            linear-gradient(
              135deg,
              #087f72,
              #0b6676
            );
        }

        .smallLogo img {
          width:
            100%;

          height:
            100%;

          object-fit:
            contain;

          background:
            #ffffff;
        }

        .toolbarLeft strong {
          display:
            block;

          font-size:
            12px;
        }

        .toolbarLeft small {
          display:
            block;

          margin-top:
            2px;

          font-size:
            7px;

          color:
            #667085;
        }

        .toolbarActions {
          display:
            flex;

          gap:
            6px;

          flex-wrap:
            wrap;
        }

        .btn {
          padding:
            7px 11px;

          border-radius:
            6px;

          background:
            #ffffff;

          font-size:
            8px;

          font-weight:
            800;

          cursor:
            pointer;
        }

        .btnEdit {
          border:
            1px solid #d0d5dd;

          color:
            #344054;
        }

        .btnPrint {
          border:
            1px solid #087f72;

          background:
            linear-gradient(
              135deg,
              #087f72,
              #0b6676
            );

          color:
            #ffffff;
        }

        .btnNew {
          border:
            1px solid #f2c4c4;

          color:
            #b42318;
        }

        /* ==================================================
           PREVIEW
        ================================================== */

        .preview {
          min-height:
            100vh;

          padding:
            14px 10px 40px;

          display:
            flex;

          justify-content:
            center;

          align-items:
            flex-start;

          background:
            linear-gradient(
              180deg,
              #eef3f7,
              #e7edf3
            );
        }

        /* ==================================================
           A4 PAGE
        ================================================== */

        .a4Page {
          position:
            relative;

          width:
            210mm;

          min-height:
            297mm;

          height:
            auto;

          max-height:
            none;

          padding:
            0 11mm 18mm;

          background:
            #ffffff;

          overflow:
            visible;

          box-shadow:
            0 14px 40px
            rgba(
              16,
              24,
              40,
              .15
            );
        }

        /* ==================================================
           HEADER
        ================================================== */

        .labHeader {
          min-height:
            35mm;

          padding-top:
            6mm;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            7mm;

          break-inside:
            avoid;

          page-break-inside:
            avoid;
        }

        .brand {
          display:
            flex;

          align-items:
            center;

          gap:
            4mm;

          min-width:
            0;
        }

        .mainLogo {
          position:
            relative;

          width:
            22mm;

          height:
            22mm;

          flex-shrink:
            0;

          border:
            1.5px solid #087f72;

          border-radius:
            50%;

          background:
            radial-gradient(
              circle,
              #ffffff 45%,
              #eefbf8 100%
            );

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          overflow:
            hidden;

          box-shadow:
            inset
            0 0 0 2px
            #d7f2ed;
        }

        .uploadedLogo {
          width:
            100%;

          height:
            100%;

          object-fit:
            contain;

          padding:
            2mm;

          background:
            #ffffff;

          border-radius:
            50%;
        }

        .mainLogo span {
          position:
            relative;

          z-index:
            2;

          color:
            #087f72;

          font-size:
            20px;

          font-weight:
            950;
        }

        .logoRay {
          position:
            absolute;

          width:
            14mm;

          height:
            .5px;

          background:
            #eabf43;
        }

        .r1 {
          transform:
            rotate(0deg);
        }

        .r2 {
          transform:
            rotate(45deg);
        }

        .r3 {
          transform:
            rotate(90deg);
        }

        .r4 {
          transform:
            rotate(135deg);
        }

        .brandText {
          min-width:
            0;
        }

        .brandText h1 {
          margin:
            0;

          font-size:
            21px;

          line-height:
            1;

          font-weight:
            950;

          letter-spacing:
            .2px;

          color:
            #101828;

          overflow-wrap:
            anywhere;
        }

        .brandText h2 {
          margin:
            2px 0 0;

          font-size:
            7px;

          letter-spacing:
            .8px;

          color:
            #087f72;

          font-weight:
            900;
        }

        .brandText p {
          margin:
            4px 0 0;

          font-size:
            6px;

          color:
            #667085;

          font-weight:
            700;

          overflow-wrap:
            anywhere;
        }

        .headerRight {
          width:
            67mm;

          text-align:
            right;

          color:
            #667085;

          font-size:
            5.7px;

          line-height:
            1.55;

          overflow-wrap:
            anywhere;
        }

        .reportLabel {
          display:
            inline-block;

          margin-bottom:
            2px;

          padding:
            2px 5px;

          border-radius:
            3px;

          background:
            #e9f8f5;

          color:
            #087f72;

          font-size:
            6px;

          font-weight:
            950;

          letter-spacing:
            .5px;
        }

        .accentBar {
          height:
            1.5px;

          display:
            flex;

          gap:
            2px;

          margin-bottom:
            4mm;
        }

        .accentBar span {
          flex:
            4;

          background:
            #087f72;
        }

        .accentBar b {
          flex:
            1;

          background:
            #eabf43;
        }

        .accentBar i {
          flex:
            6;

          background:
            #dce5ea;
        }

        /* ==================================================
           PATIENT CARD
        ================================================== */

        .patientCard {
          border:
            1px solid #d7e0e6;

          border-radius:
            4px;

          overflow:
            hidden;

          margin-bottom:
            4mm;

          break-inside:
            avoid;

          page-break-inside:
            avoid;
        }

        .sectionBar {
          height:
            6.5mm;

          padding:
            0 3mm;

          display:
            flex;

          align-items:
            center;

          gap:
            5px;

          background:
            linear-gradient(
              90deg,
              #087f72,
              #0c7180
            );

          color:
            #ffffff;

          font-size:
            6.5px;

          font-weight:
            950;

          letter-spacing:
            .6px;
        }

        .circleP {
          width:
            15px;

          height:
            15px;

          border-radius:
            50%;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          background:
            rgba(
              255,
              255,
              255,
              .18
            );

          font-size:
            6px;
        }

        .patientGrid {
          display:
            grid;

          grid-template-columns:
            repeat(
              4,
              1fr
            );
        }

        .infoCell {
          min-height:
            9mm;

          padding:
            2mm 3mm;

          border-right:
            1px solid #e3e8ed;

          border-bottom:
            1px solid #e3e8ed;
        }

        .infoCell:nth-child(4n) {
          border-right:
            0;
        }

        .infoCell:nth-last-child(-n + 4) {
          border-bottom:
            0;
        }

        .infoLabel {
          display:
            block;

          margin-bottom:
            1px;

          font-size:
            4.7px;

          color:
            #7a8796;

          font-weight:
            800;

          text-transform:
            uppercase;
        }

        .infoValue {
          display:
            block;

          font-size:
            6.4px;

          color:
            #172033;

          font-weight:
            700;

          overflow-wrap:
            anywhere;
        }

        .infoValue.strong {
          font-size:
            7px;

          font-weight:
            950;
        }

        .infoValue.status {
          color:
            #15803d;

          font-weight:
            950;
        }

        /* ==================================================
           TESTS
        ================================================== */

        .tests {
          display:
            flex;

          flex-direction:
            column;

          gap:
            3.5mm;
        }

        .testSection {
          break-inside:
            avoid;

          page-break-inside:
            avoid;

          margin-bottom:
            1mm;
        }

        .testHeader {
          display:
            flex;

          align-items:
            center;

          gap:
            2.5mm;

          margin-bottom:
            1.8mm;

          min-height:
            7mm;

          break-after:
            avoid;

          page-break-after:
            avoid;
        }

        .departmentTag {
          flex-shrink:
            0;

          padding:
            2.5px 6px;

          border-radius:
            3px;

          background:
            #e8f7f4;

          color:
            #087f72;

          font-size:
            5px;

          font-weight:
            950;

          letter-spacing:
            .6px;
        }

        .testTitleBox {
          flex:
            1;

          padding:
            2.2mm 3.5mm;

          border-left:
            3px solid #087f72;

          border-radius:
            3px;

          background:
            linear-gradient(
              90deg,
              #f0faf8,
              #ffffff
            );

          color:
            #101828;

          font-size:
            9.5px;

          font-weight:
            950;

          letter-spacing:
            .15px;
        }

        .testLine {
          width:
            18mm;

          height:
            1px;

          background:
            linear-gradient(
              90deg,
              #087f72,
              transparent
            );
        }

        /* ==================================================
           TABLE
        ================================================== */

        .labTable {
          width:
            100%;

          table-layout:
            fixed;

          border-collapse:
            separate;

          border-spacing:
            0;

          border:
            1px solid #cfd9e0;

          border-radius:
            4px;

          overflow:
            hidden;

          page-break-inside:
            auto;

          break-inside:
            auto;
        }

        .labTable thead {
          display:
            table-header-group;
        }

        .labTable tfoot {
          display:
            table-footer-group;
        }

        .labTable tr {
          break-inside:
            avoid;

          page-break-inside:
            avoid;
        }

        .labTable th {
          height:
            6.5mm;

          padding:
            1.3mm;

          background:
            linear-gradient(
              180deg,
              #eef5f7,
              #e3edf0
            );

          border-right:
            1px solid #d2dce2;

          border-bottom:
            1px solid #cbd6dc;

          color:
            #344054;

          font-size:
            5.1px;

          font-weight:
            950;

          text-transform:
            uppercase;

          text-align:
            center;

          letter-spacing:
            .2px;
        }

        .labTable th:last-child {
          border-right:
            0;
        }

        .labTable td {
          min-height:
            6.8mm;

          padding:
            1mm 1.8mm;

          border-right:
            1px solid #e1e7eb;

          border-bottom:
            1px solid #e5eaee;

          color:
            #273443;

          font-size:
            5.8px;

          vertical-align:
            middle;

          background:
            #ffffff;
        }

        .labTable tr:last-child td {
          border-bottom:
            0;
        }

        .labTable td:last-child {
          border-right:
            0;
        }

        .labTable tbody tr:nth-child(even) td {
          background:
            #fbfcfd;
        }

        .investigation {
          width:
            30%;
        }

        .flag {
          width:
            8%;

          text-align:
            center;
        }

        .result {
          width:
            19%;

          text-align:
            center;
        }

        .reference {
          width:
            28%;

          text-align:
            center;
        }

        .unit {
          width:
            15%;

          text-align:
            center;
        }

        .investigationText {
          font-size:
            6px;

          font-weight:
            800;

          color:
            #263445;

          overflow-wrap:
            anywhere;
        }

        /* ==================================================
           RESULT
        ================================================== */

        .resultBox {
          display:
            inline-flex;

          min-width:
            24mm;

          min-height:
            6mm;

          align-items:
            center;

          justify-content:
            center;

          padding:
            1mm 2.5mm;

          border-radius:
            3px;

          background:
            #f2f6f9;

          color:
            #101828;

          font-size:
            7.5px;

          font-weight:
            950;

          letter-spacing:
            .2px;

          overflow-wrap:
            anywhere;
        }

        .resultBox.abnormal {
          background:
            #fff1f0;

          border:
            1px solid #f5c8c5;

          color:
            #b42318;
        }

        .flagBadge {
          display:
            inline-flex;

          width:
            14px;

          height:
            14px;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            3px;

          font-size:
            5.5px;

          font-weight:
            950;
        }

        .flagHigh {
          color:
            #b42318;

          background:
            #fee4e2;

          border:
            1px solid #fecdca;
        }

        .flagLow {
          color:
            #175cd3;

          background:
            #eff8ff;

          border:
            1px solid #b2ddff;
        }

        .normalMark {
          color:
            #159957;

          font-size:
            10px;

          font-weight:
            900;
        }

        /* ==================================================
           SIGNATURE
        ================================================== */

        .signatures {
          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            30mm;

          margin-top:
            4.5mm;

          break-inside:
            avoid;

          page-break-inside:
            avoid;
        }

        .signature {
          text-align:
            center;

          min-height:
            10mm;

          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            flex-end;
        }

        .signatureBlank {
          height:
            5mm;

          width:
            100%;
        }

        .signature strong {
          display:
            block;

          font-size:
            6px;

          color:
            #172033;

          font-weight:
            800;
        }

        .signature small {
          display:
            block;

          margin-top:
            1px;

          font-size:
            4.5px;

          color:
            #667085;
        }

        /* ==================================================
           NOTE
        ================================================== */

        .note {
          margin-top:
            2.5mm;

          padding:
            1.8mm 2.5mm;

          border:
            1px solid #dbe3e8;

          border-radius:
            3px;

          background:
            #f8fafb;

          color:
            #667085;

          font-size:
            4.5px;

          line-height:
            1.35;

          break-inside:
            avoid;

          page-break-inside:
            avoid;
        }

        /* ==================================================
           FOOTER
        ================================================== */

        .footer {
          margin-top:
            6mm;

          min-height:
            12mm;

          padding:
            2.2mm 11mm;

          text-align:
            center;

          border-top:
            1px solid #dce4e8;

          background:
            linear-gradient(
              180deg,
              #f8fafb,
              #eef3f5
            );

          break-inside:
            avoid;

          page-break-inside:
            avoid;
        }

        .footer strong {
          display:
            block;

          color:
            #087f72;

          font-size:
            5.8px;

          font-weight:
            950;

          letter-spacing:
            .6px;
        }

        .footer span {
          display:
            block;

          margin-top:
            1px;

          color:
            #667085;

          font-size:
            3.8px;

          font-weight:
            700;

          overflow-wrap:
            anywhere;
        }

        .footer small {
          display:
            block;

          margin-top:
            1px;

          color:
            #98a2b3;

          font-size:
            3.4px;

          overflow-wrap:
            anywhere;
        }

        .footer em {
          display:
            block;

          margin-top:
            1mm;

          font-style:
            normal;

          color:
            #98a2b3;

          font-size:
            3.4px;
        }

        .noTest {
          padding:
            20mm;

          text-align:
            center;

          color:
            #667085;

          font-size:
            9px;
        }

        /* ==================================================
           MOBILE
        ================================================== */

        @media (max-width: 700px) {

          .screenToolbar {
            width:
              calc(100% - 10px);

            margin:
              5px;

            flex-direction:
              column;

            align-items:
              stretch;
          }

          .toolbarActions {
            display:
              grid;

            grid-template-columns:
              1fr 1fr;
          }

          .btnPrint {
            grid-column:
              span 2;
          }

          .preview {
            padding:
              8px 4px 25px;
          }

          .a4Page {
            width:
              calc(
                100vw - 8px
              );

            min-height:
              calc(
                (100vw - 8px)
                * 1.4142857
              );

            height:
              auto;

            max-height:
              none;

            padding-left:
              4.5mm;

            padding-right:
              4.5mm;

            padding-bottom:
              15mm;

            overflow:
              visible;
          }

          .labHeader {
            min-height:
              31mm;

            padding-top:
              5mm;

            gap:
              3mm;
          }

          .mainLogo {
            width:
              17mm;

            height:
              17mm;
          }

          .mainLogo span {
            font-size:
              15px;
          }

          .brand {
            gap:
              2.5mm;
          }

          .brandText h1 {
            font-size:
              13px;
          }

          .brandText h2 {
            font-size:
              4.2px;
          }

          .brandText p {
            font-size:
              3.7px;
          }

          .headerRight {
            width:
              40mm;

            font-size:
              3.7px;
          }

          .reportLabel {
            font-size:
              4px;
          }

          .patientGrid {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }

          .infoCell:nth-child(4n) {
            border-right:
              1px solid #e3e8ed;
          }

          .infoCell:nth-child(2n) {
            border-right:
              0;
          }

          .infoCell:nth-last-child(-n + 4) {
            border-bottom:
              1px solid #e3e8ed;
          }

          .infoCell:nth-last-child(-n + 2) {
            border-bottom:
              0;
          }

          .infoCell {
            min-height:
              8mm;

            padding:
              1.5mm 2mm;
          }

          .sectionBar {
            height:
              5.5mm;

            font-size:
              4.5px;
          }

          .circleP {
            width:
              11px;

            height:
              11px;

            font-size:
              5px;
          }

          .infoLabel {
            font-size:
              3.5px;
          }

          .infoValue {
            font-size:
              4.8px;
          }

          .infoValue.strong {
            font-size:
              5.2px;
          }

          .testHeader {
            min-height:
              6mm;

            margin-bottom:
              1.3mm;
          }

          .departmentTag {
            font-size:
              3.5px;
          }

          .testTitleBox {
            font-size:
              6.3px;

            padding:
              1.7mm 2mm;
          }

          .testLine {
            width:
              8mm;
          }

          .labTable th {
            height:
              5.3mm;

            padding:
              1mm;

            font-size:
              3.4px;
          }

          .labTable td {
            min-height:
              5.5mm;

            padding:
              .7mm 1mm;

            font-size:
              3.9px;
          }

          .investigationText {
            font-size:
              3.9px;
          }

          .resultBox {
            min-width:
              14mm;

            min-height:
              4.8mm;

            font-size:
              5.3px;
          }

          .flagBadge {
            width:
              11px;

            height:
              11px;

            font-size:
              4px;
          }

          .normalMark {
            font-size:
              7px;
          }

          .signatures {
            gap:
              15mm;

            margin-top:
              3mm;
          }

          .signatureBlank {
            height:
              4mm;
          }

          .signature strong {
            font-size:
              4px;
          }

          .signature small {
            font-size:
              3px;
          }

          .note {
            font-size:
              3px;

            margin-top:
              2mm;
          }

          .footer {
            min-height:
              10mm;

            padding:
              2mm 5mm;
          }

          .footer strong {
            font-size:
              4.5px;
          }

          .footer span {
            font-size:
              3px;
          }

          .footer small {
            font-size:
              2.5px;
          }

          .footer em {
            font-size:
              2.5px;
          }
        }

        /* ==================================================
           PRINT / PDF
        ================================================== */

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

            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;
          }

          .screenToolbar {
            display:
              none !important;
          }

          .preview {
            display:
              block !important;

            width:
              210mm !important;

            min-height:
              0 !important;

            padding:
              0 !important;

            margin:
              0 !important;

            background:
              #ffffff !important;
          }

          .a4Page {
            width:
              210mm !important;

            min-height:
              297mm !important;

            height:
              auto !important;

            max-height:
              none !important;

            margin:
              0 !important;

            padding:
              0 11mm 18mm !important;

            overflow:
              visible !important;

            box-shadow:
              none !important;

            page-break-after:
              auto !important;

            break-after:
              auto !important;

            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;
          }

          .labHeader {
            break-inside:
              avoid !important;

            page-break-inside:
              avoid !important;
          }

          .patientCard {
            break-inside:
              avoid !important;

            page-break-inside:
              avoid !important;
          }

          .testSection {
            break-inside:
              avoid !important;

            page-break-inside:
              avoid !important;
          }

          .testHeader {
            break-after:
              avoid !important;

            page-break-after:
              avoid !important;
          }

          .labTable {
            page-break-inside:
              auto !important;

            break-inside:
              auto !important;
          }

          .labTable thead {
            display:
              table-header-group !important;
          }

          .labTable tr {
            break-inside:
              avoid !important;

            page-break-inside:
              avoid !important;
          }

          .signatures {
            break-inside:
              avoid !important;

            page-break-inside:
              avoid !important;
          }

          .note {
            break-inside:
              avoid !important;

            page-break-inside:
              avoid !important;
          }

          .footer {
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

/* =========================================================
   INFO COMPONENT
   ========================================================= */

function Info({
  label,
  value,
  strong,
  status,
}) {
  return (
    <div className="infoCell">

      <span className="infoLabel">
        {label}
      </span>

      <span
        className={
          "infoValue " +
          (strong
            ? "strong "
            : "") +
          (status
            ? "status"
            : "")
        }
      >
        {value || "-"}
      </span>

    </div>
  );
}

/* =========================================================
   TEST SECTION
   ========================================================= */

function TestSection({
  test,
  showReferenceRange,
  showFlag,
}) {
  const parameters =
    Array.isArray(
      test?.parameters
    )
      ? test.parameters
      : [];

  return (
    <section className="testSection">

      {/* TEST HEADER */}

      <div className="testHeader">

        <span className="departmentTag">
          {String(
            test.category ||
              "PATHOLOGY"
          ).toUpperCase()}
        </span>

        <div className="testTitleBox">
          {test.name}
        </div>

        <span className="testLine" />

      </div>

      {/* RESULT TABLE */}

      <table className="labTable">

        <colgroup>

          <col className="investigation" />

          <col className="flag" />

          <col className="result" />

          <col className="reference" />

          <col className="unit" />

        </colgroup>

        <thead>
          <tr>

            <th>
              INVESTIGATION
            </th>

            <th>
              {showFlag
                ? "FLAG"
                : ""}
            </th>

            <th>
              RESULT
            </th>

            <th>
              {showReferenceRange
                ? "REFERENCE RANGE"
                : ""}
            </th>

            <th>
              UNIT
            </th>

          </tr>
        </thead>

        <tbody>

          {parameters.length === 0 ? (
            <tr>
              <td
                colSpan="5"
                style={{
                  textAlign:
                    "center",
                  color:
                    "#667085",
                  padding:
                    "5mm",
                }}
              >
                No parameters
                available.
              </td>
            </tr>
          ) : (
            parameters.map(
              (
                parameter,
                index
              ) => {

                const abnormal =
                  parameter.flag ===
                    "H" ||
                  parameter.flag ===
                    "L";

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
                      parameter.id ||
                      index
                    }
                  >

                    {/* INVESTIGATION */}

                    <td>
                      <span className="investigationText">
                        {parameter.name}
                      </span>
                    </td>

                    {/* FLAG */}

                    <td className="flag">

                      {showFlag ? (
                        parameter.flag ===
                        "H" ? (
                          <span className="flagBadge flagHigh">
                            H
                          </span>
                        ) : parameter.flag ===
                          "L" ? (
                          <span className="flagBadge flagLow">
                            L
                          </span>
                        ) : (
                          <span className="normalMark">
                            •
                          </span>
                        )
                      ) : null}

                    </td>

                    {/* RESULT */}

                    <td className="result">

                      <span
                        className={
                          "resultBox " +
                          (abnormal
                            ? "abnormal"
                            : "")
                        }
                      >
                        {value}
                      </span>

                    </td>

                    {/* REFERENCE */}

                    <td className="reference">

                      {showReferenceRange
                        ? parameter.range ||
                          "-"
                        : ""}

                    </td>

                    {/* UNIT */}

                    <td className="unit">

                      {parameter.unit ||
                        "-"}

                    </td>

                  </tr>
                );
              }
            )
          )}

        </tbody>

      </table>

    </section>
  );
}
