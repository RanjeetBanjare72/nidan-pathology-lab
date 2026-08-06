"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

/* =========================================================
   NIDAN PATHOLOGY LAB
   FINAL LABORATORY REPORT
   app/report/page.js
   ========================================================= */

export default function ReportPage() {
  const router = useRouter();

  const [patient, setPatient] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
  const [results, setResults] = useState({});
  const [reportDate, setReportDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedReportNo, setSavedReportNo] = useState("");

  /* =========================================================
     LOAD LOCAL DATA
     ========================================================= */

  useEffect(() => {
    try {
      const storedPatient = JSON.parse(
        localStorage.getItem("nidanPatient") || "{}"
      );

      const storedTests = JSON.parse(
        localStorage.getItem("nidanSelectedTests") || "[]"
      );

      const storedResults = JSON.parse(
        localStorage.getItem("nidanResults") || "{}"
      );

      setPatient(storedPatient);
      setSelectedTests(
        Array.isArray(storedTests) ? storedTests : []
      );
      setResults(
        storedResults &&
          typeof storedResults === "object"
          ? storedResults
          : {}
      );

      setReportDate(
        new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      );
    } catch (error) {
      console.error("Report data error:", error);
    }
  }, []);

  /* =========================================================
     NORMALIZE TEXT
     ========================================================= */

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  /* =========================================================
     PATIENT GENDER
     ========================================================= */

  function getPatientGender() {
    const gender = normalizeText(
      patient.gender || patient.sex || ""
    );

    if (
      gender === "male" ||
      gender === "m" ||
      gender.includes("male")
    ) {
      return "male";
    }

    if (
      gender === "female" ||
      gender === "f" ||
      gender.includes("female")
    ) {
      return "female";
    }

    return "";
  }

  /* =========================================================
     PARAMETER KEY
     SAME AS RESULTS PAGE
     ========================================================= */

  function parameterKey(testId, parameter, index) {
    return `${testId}-${parameter.name}-${index}`;
  }

  /* =========================================================
     NUMERIC VALUE
     ========================================================= */

  function numericValue(value) {
    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return null;
    }

    const match = String(value)
      .replace(/,/g, "")
      .match(/-?\d+(\.\d+)?/);

    if (!match) return null;

    const number = Number(match[0]);

    return Number.isFinite(number)
      ? number
      : null;
  }

  /* =========================================================
     GET GENDER SPECIFIC MIN/MAX
     ========================================================= */

  function getLimits(parameter) {
    const gender = getPatientGender();

    let min = parameter?.min;
    let max = parameter?.max;

    if (gender === "male") {
      min =
        parameter?.maleMin ??
        parameter?.male_min ??
        parameter?.minMale ??
        parameter?.min_male ??
        min;

      max =
        parameter?.maleMax ??
        parameter?.male_max ??
        parameter?.maxMale ??
        parameter?.max_male ??
        max;
    }

    if (gender === "female") {
      min =
        parameter?.femaleMin ??
        parameter?.female_min ??
        parameter?.minFemale ??
        parameter?.min_female ??
        min;

      max =
        parameter?.femaleMax ??
        parameter?.female_max ??
        parameter?.maxFemale ??
        parameter?.max_female ??
        max;
    }

    const parsedMin =
      min !== undefined &&
      min !== null &&
      min !== ""
        ? Number(min)
        : null;

    const parsedMax =
      max !== undefined &&
      max !== null &&
      max !== ""
        ? Number(max)
        : null;

    return {
      min:
        parsedMin !== null &&
        Number.isFinite(parsedMin)
          ? parsedMin
          : null,

      max:
        parsedMax !== null &&
        Number.isFinite(parsedMax)
          ? parsedMax
          : null,
    };
  }

  /* =========================================================
     SEX SPECIFIC REFERENCE RANGE
     ========================================================= */

  function referenceRange(parameter) {
    if (!parameter) return "-";

    const gender = getPatientGender();

    /*
      Direct gender-specific range properties
    */

    if (gender === "male") {
      const maleRange =
        parameter.maleRange ||
        parameter.male_range ||
        parameter.referenceMale ||
        parameter.reference_male;

      if (maleRange) {
        return String(maleRange);
      }
    }

    if (gender === "female") {
      const femaleRange =
        parameter.femaleRange ||
        parameter.female_range ||
        parameter.referenceFemale ||
        parameter.reference_female;

      if (femaleRange) {
        return String(femaleRange);
      }
    }

    /*
      min/max based gender ranges
    */

    const limits = getLimits(parameter);

    const hasGenderLimits =
      (gender === "male" &&
        (
          parameter.maleMin !== undefined ||
          parameter.maleMax !== undefined ||
          parameter.male_min !== undefined ||
          parameter.male_max !== undefined
        )) ||
      (gender === "female" &&
        (
          parameter.femaleMin !== undefined ||
          parameter.femaleMax !== undefined ||
          parameter.female_min !== undefined ||
          parameter.female_max !== undefined
        ));

    if (
      hasGenderLimits &&
      limits.min !== null &&
      limits.max !== null
    ) {
      return `${limits.min} - ${limits.max}`;
    }

    /*
      Existing range/reference text
    */

    const savedReference =
      parameter.range ||
      parameter.reference ||
      parameter.referenceRange ||
      parameter.reference_range ||
      parameter.normalRange ||
      "";

    if (savedReference) {
      const text = String(savedReference);

      /*
        Example:
        Male: 13-17 | Female: 12-15
      */

      if (gender === "male") {
        const maleMatch = text.match(
          /male\s*:\s*([^|;]+)/i
        );

        if (maleMatch) {
          return maleMatch[1].trim();
        }
      }

      if (gender === "female") {
        const femaleMatch = text.match(
          /female\s*:\s*([^|;]+)/i
        );

        if (femaleMatch) {
          return femaleMatch[1].trim();
        }
      }

      return text;
    }

    /*
      Standard min/max
    */

    if (
      limits.min !== null &&
      limits.max !== null
    ) {
      return `${limits.min} - ${limits.max}`;
    }

    if (limits.min !== null) {
      return `≥ ${limits.min}`;
    }

    if (limits.max !== null) {
      return `≤ ${limits.max}`;
    }

    return "-";
  }

  /* =========================================================
     FLAG
     ========================================================= */

  function getFlag(value, parameter) {
    const number = numericValue(value);

    if (number === null) {
      return "";
    }

    const { min, max } = getLimits(parameter);

    if (
      min !== null &&
      number < min
    ) {
      return "L";
    }

    if (
      max !== null &&
      number > max
    ) {
      return "H";
    }

    return "";
  }

  /* =========================================================
     GET RESULT
     ========================================================= */

  function getResult(test, parameter, index) {
    const key = parameterKey(
      test.id,
      parameter,
      index
    );

    if (
      results[key] !== undefined &&
      results[key] !== null
    ) {
      return results[key];
    }

    if (
      parameter.result !== undefined &&
      parameter.result !== null
    ) {
      return parameter.result;
    }

    if (
      parameter.value !== undefined &&
      parameter.value !== null
    ) {
      return parameter.value;
    }

    return "";
  }

  /* =========================================================
     REPORT TEST DATA
     FOR SUPABASE / SAVED REPORTS
     ========================================================= */

  const reportTests = useMemo(() => {
    return selectedTests.map((test) => ({
      id: test.id,

      name:
        test.name ||
        test.testName ||
        test.short ||
        "Test",

      short:
        test.short ||
        test.name ||
        "",

      department:
        test.department ||
        test.category ||
        "",

      parameters: (
        test.tests ||
        test.parameters ||
        []
      ).map((parameter, index) => {
        const value = getResult(
          test,
          parameter,
          index
        );

        return {
          ...parameter,

          name:
            parameter.name ||
            parameter.testName ||
            parameter.investigation ||
            "Investigation",

          result: value,

          value: value,

          unit:
            parameter.unit ||
            parameter.units ||
            "",

          reference:
            referenceRange(parameter),

          referenceRange:
            referenceRange(parameter),

          flag:
            getFlag(value, parameter),
        };
      }),
    }));
  }, [selectedTests, results, patient]);

  /* =========================================================
     REPORT NUMBER
     ========================================================= */

  function createReportNumber() {
    return `RPT-${Date.now()}`;
  }

  /* =========================================================
     SAVE REPORT
     ========================================================= */

  async function saveReport() {
    if (saving) {
      return null;
    }

    if (selectedTests.length === 0) {
      alert("Koi investigation selected nahi hai.");
      return null;
    }

    /*
      Already saved in this page session.
      Prevent duplicate Supabase reports.
    */

    if (savedReportNo) {
      return savedReportNo;
    }

    try {
      setSaving(true);

      const reportNo =
        createReportNumber();

      const reportPayload = {
        patient,

        selectedTests,

        selected_tests: selectedTests,

        results,

        reportTests,

        report_tests: reportTests,

        reportDate,

        patientGender:
          getPatientGender(),
      };

      const { error } = await supabase
        .from("reports")
        .insert([
          {
            report_no: reportNo,

            patient_id:
              patient.patientId ||
              patient.id ||
              null,

            status: "completed",

            report_data:
              reportPayload,
          },
        ]);

      if (error) {
        throw error;
      }

      setSavedReportNo(reportNo);

      return reportNo;
    } catch (error) {
      console.error(
        "Report save error:",
        error
      );

      alert(
        "Report save nahi hua: " +
          (error?.message ||
            "Unknown error")
      );

      return null;
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     PRINT REPORT
     ========================================================= */

  async function printReport() {
    const reportNo =
      await saveReport();

    if (!reportNo) {
      return;
    }

    setTimeout(() => {
      window.print();
    }, 250);
  }

  /* =========================================================
     NEW PATIENT
     ========================================================= */

  function newPatient() {
    const confirmNew =
      window.confirm(
        "New patient start karna hai? Current patient, tests aur results clear ho jayenge."
      );

    if (!confirmNew) {
      return;
    }

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
      "nidanBillTotal"
    );

    router.push("/patients");
  }

  /* =========================================================
     REPORT UI
     ========================================================= */

  return (
    <div className="finalReportPage">

      {/* ===============================================
          SCREEN TOOLBAR
          =============================================== */}

      <div className="reportScreenToolbar noPrint">
        <div>
          <strong>
            Final Laboratory Report
          </strong>

          <small>
            Review report before printing or
            saving PDF
          </small>
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
            disabled={saving}
            onClick={printReport}
          >
            {saving
              ? "Saving..."
              : "🖨 Print / Save PDF"}
          </button>

          <button
            className="reportNewButton"
            onClick={newPatient}
          >
            + New Patient
          </button>
        </div>
      </div>

      {/* ===============================================
          PRINTABLE REPORT
          =============================================== */}

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
              Clinical Pathology & Diagnostic
              Laboratory
            </p>
          </div>

          <div className="reportHeaderRight">
            <strong>
              LABORATORY REPORT
            </strong>

            <span>
              Report Date: {reportDate}
            </span>

            {savedReportNo && (
              <span>
                {savedReportNo}
              </span>
            )}
          </div>
        </header>

        <div className="reportAccentLine" />

        {/* ===============================================
            LAB CONTACT
            =============================================== */}

        <section className="reportLabDetails">
          <span>
            📍 Address:
            __________________________
          </span>

          <span>
            ☎ Mobile:
            ________________
          </span>

          <span>
            ✉ Email:
            ________________
          </span>
        </section>

        {/* ===============================================
            PATIENT INFORMATION
            =============================================== */}

        <section className="reportPatientSection">
          <div className="reportSectionTitle">
            PATIENT INFORMATION
          </div>

          <div className="reportPatientGrid">

            <div>
              <span>PATIENT ID</span>

              <strong>
                {patient.patientId ||
                  patient.id ||
                  "-"}
              </strong>
            </div>

            <div>
              <span>PATIENT NAME</span>

              <strong>
                {patient.name || "-"}
              </strong>
            </div>

            <div>
              <span>AGE / SEX</span>

              <strong>
                {patient.age || "-"} Years /{" "}
                {patient.gender ||
                  patient.sex ||
                  "-"}
              </strong>
            </div>

            <div>
              <span>MOBILE</span>

              <strong>
                {patient.mobile ||
                  patient.phone ||
                  "-"}
              </strong>
            </div>

            <div>
              <span>REF. DOCTOR</span>

              <strong>
                {patient.doctor ||
                  patient.refDoctor ||
                  patient.referring_doctor ||
                  "-"}
              </strong>
            </div>

            <div>
              <span>SAMPLE DATE</span>

              <strong>
                {patient.sampleDate ||
                  patient.sample_date ||
                  "-"}
              </strong>
            </div>

          </div>
        </section>

        {/* ===============================================
            TEST REPORTS
            =============================================== */}

        <section className="investigationReport">

          {selectedTests.length === 0 ? (
            <div className="reportEmpty">
              No investigations selected.
            </div>
          ) : (
            selectedTests.map(
              (test, testIndex) => {
                const parameters =
                  test.tests ||
                  test.parameters ||
                  [];

                return (
                  <div
                    className="reportTestSection"
                    key={
                      test.id ||
                      `test-${testIndex}`
                    }
                  >

                    {/* TEST NAME */}

                    <div className="reportTestHeading">
                      {test.name ||
                        test.short ||
                        "INVESTIGATION"}
                    </div>

                    {/* RESULT TABLE */}

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

                            <th>
                              REFERENCE RANGE
                            </th>

                            <th>
                              FLAG
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {parameters.map(
                            (
                              parameter,
                              index
                            ) => {
                              /*
                                Optional heading support
                              */

                              if (
                                parameter?.heading
                              ) {
                                return (
                                  <tr
                                    key={`heading-${index}`}
                                    className="reportGroupHeading"
                                  >
                                    <td colSpan={5}>
                                      {
                                        parameter.name
                                      }
                                    </td>
                                  </tr>
                                );
                              }

                              const key =
                                parameterKey(
                                  test.id,
                                  parameter,
                                  index
                                );

                              const value =
                                getResult(
                                  test,
                                  parameter,
                                  index
                                );

                              const flag =
                                getFlag(
                                  value,
                                  parameter
                                );

                              return (
                                <tr key={key}>

                                  <td>
                                    {parameter.name ||
                                      parameter.testName ||
                                      "-"}
                                  </td>

                                  <td
                                    className={
                                      flag
                                        ? "abnormalResult"
                                        : "normalResult"
                                    }
                                  >
                                    <strong>
                                      {value !==
                                        ""
                                        ? String(
                                            value
                                          )
                                        : "-"}
                                    </strong>
                                  </td>

                                  <td>
                                    {parameter.unit ||
                                      parameter.units ||
                                      "-"}
                                  </td>

                                  <td>
                                    {referenceRange(
                                      parameter
                                    )}
                                  </td>

                                  <td>
                                    {flag && (
                                      <span
                                        className={
                                          flag ===
                                          "H"
                                            ? "reportFlag reportFlagHigh"
                                            : "reportFlag reportFlagLow"
                                        }
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
                  </div>
                );
              }
            )
          )}

        </section>

        {/* ===============================================
            REMARKS
            =============================================== */}

        <section className="reportRemarks">
          <strong>
            Remarks:
          </strong>

          <div className="remarksLine">
            ________________________________________________
          </div>
        </section>

        {/* ===============================================
            SIGNATURE
            =============================================== */}

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

        {/* ===============================================
            NOTES
            =============================================== */}

        <section className="reportNotes">
          <strong>
            Note:
          </strong>

          <p>
            Reference intervals may vary
            according to laboratory method,
            age, sex and clinical
            circumstances. Laboratory results
            should be interpreted with relevant
            clinical findings.
          </p>
        </section>

        {/* ===============================================
            FOOTER
            =============================================== */}

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

      {/* ===============================================
          PAGE SPECIFIC CSS
          =============================================== */}

      <style jsx global>{`

        .finalReportPage {
          min-height: 100vh;
          background: #eef3f7;
          padding: 24px;
          font-family: Arial, Helvetica, sans-serif;
          color: #172033;
        }

        .reportScreenToolbar {
          max-width: 1100px;
          margin: 0 auto 20px;
          background: white;
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          box-shadow: 0 3px 15px rgba(0,0,0,0.08);
        }

        .reportScreenToolbar > div:first-child {
          display: flex;
          flex-direction: column;
        }

        .reportScreenToolbar strong {
          font-size: 16px;
        }

        .reportScreenToolbar small {
          margin-top: 4px;
          color: #777;
        }

        .reportToolbarButtons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .reportToolbarButtons button {
          padding: 10px 14px;
          border-radius: 7px;
          border: 1px solid #d7dde4;
          cursor: pointer;
          font-weight: 600;
          background: white;
        }

        .reportPrintButton {
          background: #0fa7a0 !important;
          color: white;
          border-color: #0fa7a0 !important;
        }

        .reportNewButton {
          background: #172033 !important;
          color: white;
          border-color: #172033 !important;
        }

        .reportToolbarButtons button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .printableReport {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          background: white;
          padding: 38px 42px;
          box-sizing: border-box;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .labReportHeader {
          display: grid;
          grid-template-columns: 70px 1fr auto;
          gap: 16px;
          align-items: center;
        }

        .reportLogo {
          width: 58px;
          height: 58px;
          background: #0fa7a0;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          font-size: 22px;
          font-weight: 800;
        }

        .reportLabIdentity h1 {
          margin: 0;
          font-size: 25px;
          color: #172033;
        }

        .reportLabIdentity p {
          margin: 3px 0 0;
          font-size: 11px;
          color: #667085;
        }

        .reportTagline {
          color: #0b8e88 !important;
          font-weight: 700;
        }

        .reportHeaderRight {
          text-align: right;
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-size: 10px;
        }

        .reportHeaderRight strong {
          color: #0b8e88;
        }

        .reportAccentLine {
          height: 4px;
          background: #0fa7a0;
          margin: 15px 0 8px;
        }

        .reportLabDetails {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 10px;
          font-size: 9px;
          padding: 6px 0 12px;
        }

        .reportPatientSection {
          border: 1px solid #d9dee5;
          margin-top: 5px;
        }

        .reportSectionTitle {
          background: #172033;
          color: white;
          padding: 8px 10px;
          font-size: 10px;
          font-weight: 700;
        }

        .reportPatientGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }

        .reportPatientGrid > div {
          padding: 9px 10px;
          border-right: 1px solid #e3e6ea;
          border-bottom: 1px solid #e3e6ea;
          display: flex;
          flex-direction: column;
          min-height: 40px;
        }

        .reportPatientGrid span {
          color: #8a929d;
          font-size: 8px;
          margin-bottom: 5px;
        }

        .reportPatientGrid strong {
          font-size: 10px;
        }

        .investigationReport {
          margin-top: 20px;
        }

        .reportTestSection {
          margin-bottom: 22px;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .reportTestHeading {
          background: #edf9f8;
          color: #087f79;
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 700;
          border-left: 4px solid #0fa7a0;
        }

        .reportTableWrapper {
          width: 100%;
          overflow-x: auto;
        }

        .finalReportTable {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 9px;
        }

        .finalReportTable th {
          background: #f5f7f9;
          padding: 8px 7px;
          text-align: left;
          font-size: 8px;
          color: #667085;
          border-bottom: 1px solid #dfe3e8;
        }

        .finalReportTable td {
          padding: 7px;
          border-bottom: 1px solid #e8ebee;
          vertical-align: middle;
          word-break: break-word;
        }

        .finalReportTable th:nth-child(1),
        .finalReportTable td:nth-child(1) {
          width: 30%;
        }

        .finalReportTable th:nth-child(2),
        .finalReportTable td:nth-child(2) {
          width: 15%;
        }

        .finalReportTable th:nth-child(3),
        .finalReportTable td:nth-child(3) {
          width: 15%;
        }

        .finalReportTable th:nth-child(4),
        .finalReportTable td:nth-child(4) {
          width: 30%;
        }

        .finalReportTable th:nth-child(5),
        .finalReportTable td:nth-child(5) {
          width: 10%;
          text-align: center;
        }

        .normalResult {
          color: #172033;
        }

        .abnormalResult {
          color: #e24a5a;
          font-weight: 700;
        }

        .reportFlag {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 20px;
          padding: 0 5px;
          border-radius: 5px;
          font-size: 8px;
          font-weight: 700;
        }

        .reportFlagHigh {
          background: #fdecef;
          color: #d9344b;
        }

        .reportFlagLow {
          background: #fff4dc;
          color: #b77900;
        }

        .reportGroupHeading td {
          background: #f6f8fa;
          font-weight: 700;
          color: #172033;
        }

        .reportEmpty {
          padding: 25px;
          text-align: center;
          border: 1px solid #ddd;
        }

        .reportRemarks {
          margin-top: 18px;
          border: 1px solid #dfe3e8;
          padding: 12px;
          font-size: 9px;
        }

        .remarksLine {
          margin-top: 12px;
          color: #999;
        }

        .reportSignatureSection {
          display: flex;
          justify-content: space-between;
          gap: 50px;
          margin-top: 45px;
        }

        .reportSignatureBox {
          width: 200px;
          text-align: center;
          font-size: 9px;
        }

        .signatureSpace {
          height: 30px;
          border-bottom: 1px solid #555;
          margin-bottom: 7px;
        }

        .reportSignatureBox span {
          display: block;
          color: #777;
          margin-top: 2px;
        }

        .reportNotes {
          margin-top: 25px;
          background: #f7f8fa;
          padding: 8px 10px;
          display: flex;
          gap: 5px;
          font-size: 7px;
          line-height: 1.5;
        }

        .reportNotes p {
          margin: 0;
        }

        .reportFooter {
          margin-top: 12px;
          padding-top: 9px;
          border-top: 2px solid #0fa7a0;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 7px;
          color: #777;
        }

        .reportFooter strong {
          color: #0b8e88;
        }

        /* =========================================
           MOBILE
           ========================================= */

        @media (max-width: 700px) {

          .finalReportPage {
            padding: 10px;
          }

          .reportScreenToolbar {
            padding: 12px;
            align-items: flex-start;
            flex-direction: column;
          }

          .reportToolbarButtons {
            width: 100%;
          }

          .reportToolbarButtons button {
            flex: 1;
            min-width: 110px;
          }

          .printableReport {
            padding: 20px 14px;
          }

          .labReportHeader {
            grid-template-columns: 50px 1fr;
          }

          .reportLogo {
            width: 45px;
            height: 45px;
            font-size: 17px;
          }

          .reportLabIdentity h1 {
            font-size: 17px;
          }

          .reportHeaderRight {
            grid-column: 1 / -1;
            text-align: left;
            flex-direction: row;
            justify-content: space-between;
            flex-wrap: wrap;
          }

          .reportLabDetails {
            grid-template-columns: 1fr;
          }

          .reportPatientGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .finalReportTable {
            min-width: 620px;
          }

          .reportSignatureSection {
            gap: 20px;
          }

          .reportSignatureBox {
            width: 45%;
          }

          .reportFooter {
            flex-direction: column;
            align-items: center;
          }
        }

        /* =========================================
           PRINT A4
           ========================================= */

        @media print {

          @page {
            size: A4 portrait;
            margin: 7mm;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .noPrint,
          .reportScreenToolbar {
            display: none !important;
          }

          .finalReportPage {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .printableReport {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 5mm !important;
            box-shadow: none !important;
          }

          .reportTableWrapper {
            overflow: visible !important;
          }

          .finalReportTable {
            min-width: 0 !important;
            width: 100% !important;
          }

          .reportTestSection {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .finalReportTable tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .reportPatientSection {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .reportSignatureSection {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

      `}</style>

    </div>
  );
}
