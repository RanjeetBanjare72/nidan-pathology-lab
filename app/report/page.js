"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ReportPage() {
  const router = useRouter();

  const [patient, setPatient] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
  const [results, setResults] = useState({});
  const [reportDate, setReportDate] = useState("");
  const [reportNo, setReportNo] = useState("");
  const [saveStatus, setSaveStatus] = useState("loading");
  const [saveMessage, setSaveMessage] = useState("");

  const savingRef = useRef(false);

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

      setPatient(savedPatient);
      setSelectedTests(savedTests);
      setResults(savedResults);

      setReportDate(
        new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      );
    } catch (error) {
      console.error("Report data loading error:", error);
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
     PATIENT GENDER
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
     PATIENT AGE
  ===================================================== */

  function getAge() {
    const age = parseFloat(patient.age);

    return Number.isNaN(age) ? null : age;
  }

  /* =====================================================
     DEFAULT REFERENCE DATABASE
  ===================================================== */

  function getDefaultReference(parameterName) {
    const name = normalizeName(parameterName);
    const gender = getGender();
    const age = getAge();

    /* CBC */

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

    /* ESR */

    if (
      name === "esr" ||
      name.includes("erythrocyte sedimentation")
    ) {
      return {
        min: 0,
        max: gender === "female" ? 20 : 15,
        unit: "mm/hr",
        range: gender === "female" ? "0 - 20" : "0 - 15",
      };
    }

    /* BLOOD SUGAR */

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

    /* KFT */

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

    /* LFT */

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

    /* LIPID */

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

    /* HBA1C */

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

    /* THYROID */

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
    if (!parameter || typeof parameter === "string") {
      return {
        min: null,
        max: null,
        unit: "",
        range: "-",
      };
    }

    const name =
      parameter.name ||
      parameter.testName ||
      parameter.investigation ||
      "";

    const defaults = getDefaultReference(name);

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

    if (!range || range === "-") {
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

  function parameterKey(testId, parameter, index) {
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

  function getParameterName(parameter, index) {
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

    const numericValue = Number(
      String(value).replace(/,/g, "")
    );

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
     BUILD REPORT DATA
  ===================================================== */

  function buildReportTests(
    tests,
    resultData
  ) {
    return tests.map((test) => {
      const parameters =
        test.tests ||
        test.parameters ||
        [];

      return {
        id: test.id,

        name:
          test.name ||
          test.testName ||
          test.short ||
          "Laboratory Test",

        category:
          getCategory(test),

        parameters:
          parameters.map(
            (parameter, index) => {
              const key =
                parameterKey(
                  test.id,
                  parameter,
                  index
                );

              const value =
                resultData[key] ?? "";

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
                  resolved.unit || "-",

                referenceRange:
                  resolved.range || "-",

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
          ),
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

    if (savingRef.current) {
      return;
    }

    async function saveReportAutomatically() {
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
          const { error } =
            await supabase
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

          if (error) {
            throw error;
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

    saveReportAutomatically();
  }, [
    patient,
    selectedTests,
    results,
  ]);

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
    ].forEach((key) =>
      localStorage.removeItem(key)
    );

    router.push("/patients");
  }

  const reportTests =
    buildReportTests(
      selectedTests,
      results
    );

  /* =====================================================
     UI
  ===================================================== */

  return (
    <>
      <div className="finalReportPage">

        {/* SCREEN TOOLBAR */}

        <div className="reportScreenToolbar">

          <div>
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
              <small className="savingText">
                ● Saving report...
              </small>
            )}

            {saveStatus === "saved" && (
              <small className="savedText">
                ✓ Saved to Reports
              </small>
            )}

            {saveStatus === "error" && (
              <small className="errorText">
                ⚠ {saveMessage}
              </small>
            )}
          </div>

          <div className="reportToolbarButtons">

            <button
              className="reportBackButton"
              onClick={() =>
                router.push("/results")
              }
            >
              ← Edit Results
            </button>

            <button
              className="reportPrintButton"
              onClick={printReport}
            >
              🖨 Print / Save PDF
            </button>

            <button
              className="reportNewButton"
              onClick={newPatient}
            >
              + New Patient
            </button>

          </div>

        </div>

        {/* PRINTABLE REPORT */}

        <main className="printableReport">

          {/* HEADER */}

          <header className="labReportHeader">

            <div className="reportLogo">
              N+
            </div>

            <div className="reportLabIdentity">

              <h1>
                NIDAN PATHOLOGY LAB
              </h1>

              <p className="reportTagline">
                Accurate • Reliable • Professional
              </p>

              <p>
                Clinical Pathology & Diagnostic Laboratory
              </p>

            </div>

            <div className="reportHeaderRight">

              <strong>
                LABORATORY REPORT
              </strong>

              <span>
                Report Date: {reportDate}
              </span>

              {reportNo && (
                <span>
                  {reportNo}
                </span>
              )}

            </div>

          </header>

          <div className="reportAccentLine" />

          {/* PATIENT INFORMATION */}

          <section className="reportPatientSection">

            <div className="reportSectionTitle">
              PATIENT INFORMATION
            </div>

            <div className="reportPatientGrid">

              <div>
                <span>Patient ID</span>
                <strong>
                  {patient.patientId ||
                    patient.id ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Patient Name</span>
                <strong>
                  {patient.name || "-"}
                </strong>
              </div>

              <div>
                <span>Age / Sex</span>
                <strong>
                  {patient.age || "-"} Years /{" "}
                  {patient.gender ||
                    patient.sex ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Mobile</span>
                <strong>
                  {patient.mobile ||
                    patient.mobileNumber ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Ref. Doctor</span>
                <strong>
                  {patient.doctor ||
                    patient.refDoctor ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Sample Date</span>
                <strong>
                  {patient.sampleDate ||
                    reportDate ||
                    "-"}
                </strong>
              </div>

            </div>

          </section>

          {/* TESTS */}

          <section className="investigationReport">

            {reportTests.length === 0 ? (

              <div className="reportEmpty">
                No investigations selected.
              </div>

            ) : (

              reportTests.map((test) => (

                <div
                  className="reportTestSection"
                  key={test.id}
                >

                  <div className="reportCategory">
                    {test.category?.toUpperCase()}
                  </div>

                  <div className="reportTestHeading">
                    {test.name}
                  </div>

                  <table className="finalReportTable">

                    <thead>
                      <tr>
                        <th>INVESTIGATION</th>
                        <th>RESULT</th>
                        <th>UNIT</th>
                        <th>REFERENCE RANGE</th>
                        <th>FLAG</th>
                      </tr>
                    </thead>

                    <tbody>

                      {test.parameters.map(
                        (parameter, index) => (

                          <tr
                            key={`${test.id}-${index}`}
                          >

                            <td>
                              <strong>
                                {parameter.name}
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
                                ""
                                ? parameter.result
                                : "-"}
                            </td>

                            <td>
                              {parameter.unit ||
                                "-"}
                            </td>

                            <td>
                              {parameter.referenceRange ||
                                "-"}
                            </td>

                            <td>
                              {parameter.flag && (
                                <span
                                  className={`reportFlag ${
                                    parameter.flag ===
                                    "H"
                                      ? "highFlag"
                                      : "lowFlag"
                                  }`}
                                >
                                  {parameter.flag}
                                </span>
                              )}
                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              ))

            )}

          </section>

          {/* SIGNATURE */}

          <section className="reportSignatureSection">

            <div className="reportSignatureBox">

              <div className="signatureSpace" />

              <strong>
                Lab Technician
              </strong>

              <span>
                NIDAN Pathology Lab
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

          {/* NOTE */}

          <section className="reportNotes">

            <strong>Note:</strong>

            <p>
              Reference intervals may vary according to
              laboratory method, age, sex and clinical
              circumstances. Laboratory results should be
              interpreted with relevant clinical findings.
            </p>

          </section>

          {/* FOOTER */}

          <footer className="reportFooter">

            <span>
              NIDAN PATHOLOGY LAB
            </span>

            <strong>
              *** END OF REPORT ***
            </strong>

            <span>
              Computer Generated Report
            </span>

          </footer>

        </main>

      </div>

      {/* =================================================
          CSS
      ================================================= */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #eef2f5;
          color: #172033;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .finalReportPage {
          min-height: 100vh;
          padding: 18px;
        }

        /* TOOLBAR */

        .reportScreenToolbar {
          max-width: 1100px;
          margin: 0 auto 16px;
          padding: 14px 18px;
          background: white;
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          gap: 15px;
          align-items: center;
          box-shadow: 0 2px 10px rgba(15,23,42,.06);
        }

        .reportScreenToolbar > div:first-child {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .reportScreenToolbar strong {
          font-size: 16px;
        }

        .reportScreenToolbar small {
          color: #64748b;
          font-size: 11px;
        }

        .reportToolbarButtons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .reportToolbarButtons button {
          border: none;
          border-radius: 7px;
          padding: 10px 13px;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
        }

        .reportBackButton {
          background: #f1f5f9;
          color: #334155;
        }

        .reportPrintButton {
          background: #0f9d9a;
          color: white;
        }

        .reportNewButton {
          background: #172033;
          color: white;
        }

        .savingText {
          color: #b7791f !important;
        }

        .savedText {
          color: #15803d !important;
        }

        .errorText {
          color: #dc2626 !important;
        }

        /* REPORT */

        .printableReport {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 14mm;
          background: white;
          box-shadow: 0 3px 20px rgba(15,23,42,.12);
        }

        /* HEADER */

        .labReportHeader {
          display: grid;
          grid-template-columns: 58px 1fr auto;
          gap: 12px;
          align-items: center;
        }

        .reportLogo {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          background: #0f9d9a;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 900;
        }

        .reportLabIdentity h1 {
          margin: 0;
          font-size: 22px;
          color: #172033;
        }

        .reportLabIdentity p {
          margin: 2px 0;
          font-size: 9px;
          color: #64748b;
        }

        .reportTagline {
          font-weight: 700;
          color: #0f9d9a !important;
        }

        .reportHeaderRight {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 3px;
          font-size: 9px;
          color: #475569;
        }

        .reportHeaderRight strong {
          color: #0f766e;
          font-size: 10px;
        }

        .reportAccentLine {
          height: 3px;
          background: #0f9d9a;
          margin: 10px 0 12px;
        }

        /* PATIENT */

        .reportPatientSection {
          border: 1px solid #dce4e8;
          margin-bottom: 14px;
        }

        .reportSectionTitle {
          background: #172033;
          color: white;
          padding: 6px 9px;
          font-size: 10px;
          font-weight: 800;
        }

        .reportPatientGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }

        .reportPatientGrid > div {
          min-height: 43px;
          padding: 7px 9px;
          border-right: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
        }

        .reportPatientGrid span {
          display: block;
          color: #64748b;
          font-size: 8px;
          margin-bottom: 3px;
        }

        .reportPatientGrid strong {
          display: block;
          color: #172033;
          font-size: 9px;
          word-break: break-word;
        }

        /* TEST */

        .reportTestSection {
          margin-bottom: 14px;
          page-break-inside: avoid;
        }

        .reportCategory {
          text-align: center;
          font-size: 9px;
          font-weight: 800;
          color: #475569;
          margin-bottom: 3px;
        }

        .reportTestHeading {
          padding: 7px 10px;
          background: #eaf7f6;
          border-left: 3px solid #0f9d9a;
          font-weight: 800;
          font-size: 11px;
          margin-bottom: 4px;
        }

        .finalReportTable {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .finalReportTable th {
          background: #f1f5f9;
          color: #334155;
          font-size: 8px;
          padding: 6px 5px;
          border: 1px solid #dce4e8;
          text-align: left;
        }

        .finalReportTable td {
          padding: 5px;
          border: 1px solid #e1e7eb;
          font-size: 8.5px;
          vertical-align: middle;
          word-break: break-word;
        }

        .finalReportTable th:nth-child(1),
        .finalReportTable td:nth-child(1) {
          width: 32%;
        }

        .finalReportTable th:nth-child(2),
        .finalReportTable td:nth-child(2) {
          width: 17%;
        }

        .finalReportTable th:nth-child(3),
        .finalReportTable td:nth-child(3) {
          width: 15%;
        }

        .finalReportTable th:nth-child(4),
        .finalReportTable td:nth-child(4) {
          width: 26%;
        }

        .finalReportTable th:nth-child(5),
        .finalReportTable td:nth-child(5) {
          width: 10%;
        }

        .normalResult {
          font-weight: 700;
        }

        .abnormalResult {
          font-weight: 800;
          color: #dc2626;
        }

        .reportFlag {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 19px;
          height: 17px;
          border-radius: 4px;
          font-size: 8px;
          font-weight: 900;
        }

        .highFlag {
          color: #b91c1c;
          background: #fee2e2;
        }

        .lowFlag {
          color: #1d4ed8;
          background: #dbeafe;
        }

        /* SIGNATURE */

        .reportSignatureSection {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          margin-top: 35px;
          page-break-inside: avoid;
        }

        .reportSignatureBox {
          text-align: center;
          display: flex;
          flex-direction: column;
          font-size: 9px;
        }

        .signatureSpace {
          height: 32px;
          border-bottom: 1px solid #64748b;
          margin-bottom: 5px;
        }

        .reportSignatureBox span {
          color: #64748b;
          margin-top: 2px;
        }

        /* NOTE */

        .reportNotes {
          margin-top: 22px;
          padding-top: 8px;
          border-top: 1px solid #dce4e8;
          font-size: 8px;
          color: #64748b;
        }

        .reportNotes p {
          display: inline;
          margin-left: 4px;
        }

        /* FOOTER */

        .reportFooter {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          border-top: 1px solid #dce4e8;
          margin-top: 12px;
          padding-top: 7px;
          font-size: 7px;
          color: #64748b;
        }

        .reportFooter strong {
          color: #0f766e;
        }

        .reportEmpty {
          text-align: center;
          padding: 30px;
          color: #64748b;
        }

        /* PRINT */

        @media print {

          @page {
            size: A4;
            margin: 0;
          }

          body {
            background: white !important;
          }

          .finalReportPage {
            padding: 0;
            background: white;
          }

          .reportScreenToolbar {
            display: none !important;
          }

          .printableReport {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 12mm;
            box-shadow: none;
          }

          .reportTestSection {
            page-break-inside: avoid;
          }

          .reportPatientSection {
            page-break-inside: avoid;
          }

          .reportSignatureSection {
            page-break-inside: avoid;
          }
        }

        /* MOBILE */

        @media (max-width: 900px) {

          .finalReportPage {
            padding: 8px;
          }

          .reportScreenToolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .reportToolbarButtons {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .reportToolbarButtons button {
            width: 100%;
          }

          .reportNewButton {
            grid-column: span 2;
          }

          .printableReport {
            width: 100%;
            min-height: auto;
            padding: 14px;
          }

          .labReportHeader {
            grid-template-columns: 45px 1fr;
          }

          .reportLogo {
            width: 42px;
            height: 42px;
            font-size: 18px;
          }

          .reportLabIdentity h1 {
            font-size: 17px;
          }

          .reportHeaderRight {
            grid-column: span 2;
            align-items: flex-start;
            margin-top: 5px;
          }

          .reportPatientGrid {
            grid-template-columns: 1fr 1fr;
          }

          .finalReportTable {
            min-width: 650px;
          }

          .reportTestSection {
            overflow-x: auto;
          }

          .reportSignatureSection {
            gap: 25px;
          }
        }

        @media (max-width: 500px) {

          .reportPatientGrid {
            grid-template-columns: 1fr;
          }

          .reportPatientGrid > div {
            border-right: none;
          }

          .reportToolbarButtons {
            grid-template-columns: 1fr;
          }

          .reportNewButton {
            grid-column: auto;
          }

          .reportLabIdentity h1 {
            font-size: 15px;
          }

          .reportSignatureSection {
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }

        }

      `}</style>
    </>
  );
}
