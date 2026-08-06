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

  // --------------------------------------------------
  // LOAD REPORT DATA
  // --------------------------------------------------

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

      const date = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      setReportDate(date);
    } catch (error) {
      console.error("Report data loading error:", error);
      setSaveStatus("error");
      setSaveMessage("Report data load nahi hua.");
    }
  }, []);

  // --------------------------------------------------
  // PARAMETER KEY
  // --------------------------------------------------

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

  // --------------------------------------------------
  // PARAMETER NAME
  // --------------------------------------------------

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

  // --------------------------------------------------
  // UNIT
  // --------------------------------------------------

  function getUnit(parameter) {
    if (typeof parameter === "string") {
      return "";
    }

    return parameter?.unit || parameter?.units || "";
  }

  // --------------------------------------------------
  // REFERENCE RANGE
  // --------------------------------------------------

  function referenceRange(parameter) {
    if (!parameter || typeof parameter === "string") {
      return "-";
    }

    if (parameter.range) {
      return parameter.range;
    }

    if (parameter.referenceRange) {
      return parameter.referenceRange;
    }

    if (parameter.reference) {
      return parameter.reference;
    }

    if (
      parameter.min !== undefined &&
      parameter.min !== null &&
      parameter.min !== "" &&
      parameter.max !== undefined &&
      parameter.max !== null &&
      parameter.max !== ""
    ) {
      return `${parameter.min} - ${parameter.max}`;
    }

    return "-";
  }

  // --------------------------------------------------
  // FLAG
  // --------------------------------------------------

  function getFlag(value, parameter) {
    if (
      value === "" ||
      value === undefined ||
      value === null ||
      !parameter ||
      typeof parameter === "string"
    ) {
      return "";
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return "";
    }

    if (
      parameter.min !== undefined &&
      parameter.min !== null &&
      parameter.min !== ""
    ) {
      const min = Number(parameter.min);

      if (!Number.isNaN(min) && numericValue < min) {
        return "L";
      }
    }

    if (
      parameter.max !== undefined &&
      parameter.max !== null &&
      parameter.max !== ""
    ) {
      const max = Number(parameter.max);

      if (!Number.isNaN(max) && numericValue > max) {
        return "H";
      }
    }

    return "";
  }

  // --------------------------------------------------
  // TEST CATEGORY
  // --------------------------------------------------

  function getCategory(test) {
    return (
      test?.category ||
      test?.department ||
      "PATHOLOGY"
    );
  }

  // --------------------------------------------------
  // CREATE REPORT TEST DATA
  // --------------------------------------------------

  function buildReportTests(tests, resultData) {
    return tests.map((test) => {
      const parameters =
        test.tests || test.parameters || [];

      return {
        id: test.id,

        name:
          test.name ||
          test.testName ||
          test.short ||
          "Laboratory Test",

        short:
          test.short ||
          test.name ||
          "Test",

        category: getCategory(test),

        parameters: parameters.map(
          (parameter, index) => {
            const key = parameterKey(
              test.id,
              parameter,
              index
            );

            const value = resultData[key] ?? "";

            return {
              name: getParameterName(
                parameter,
                index
              ),

              result: value,

              unit: getUnit(parameter),

              referenceRange:
                referenceRange(parameter),

              min:
                typeof parameter === "object"
                  ? parameter?.min ?? null
                  : null,

              max:
                typeof parameter === "object"
                  ? parameter?.max ?? null
                  : null,

              flag: getFlag(
                value,
                parameter
              ),
            };
          }
        ),
      };
    });
  }

  // --------------------------------------------------
  // AUTO SAVE REPORT
  // --------------------------------------------------

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

        // --------------------------------------------
        // CHECK CURRENT REPORT SESSION
        // --------------------------------------------

        const currentPatientId =
          localStorage.getItem(
            "nidanCurrentReportPatient"
          );

        let existingReportNo =
          localStorage.getItem(
            "nidanCurrentReportNo"
          );

        // New patient means new report
        if (currentPatientId !== patientId) {
          localStorage.removeItem(
            "nidanCurrentReportNo"
          );

          existingReportNo = null;
        }

        // --------------------------------------------
        // CREATE REPORT NUMBER
        // --------------------------------------------

        const generatedReportNo =
          existingReportNo ||
          `RPT-${Date.now()}`;

        setReportNo(generatedReportNo);

        // --------------------------------------------
        // CREATE COMPLETE TEST DATA
        // --------------------------------------------

        const reportTests =
          buildReportTests(
            selectedTests,
            results
          );

        // --------------------------------------------
        // REPORT PAYLOAD
        // --------------------------------------------

        const reportPayload = {
          patient: {
            ...patient,
            patientId: patientId,
          },

          selectedTests,

          results,

          reportTests,

          reportDate:
            new Date().toISOString(),

          reportNo:
            generatedReportNo,
        };

        // --------------------------------------------
        // CHECK IF REPORT ALREADY EXISTS
        // --------------------------------------------

        const { data: existingData, error: checkError } =
          await supabase
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

        // --------------------------------------------
        // UPDATE EXISTING REPORT
        // --------------------------------------------

        if (existingData?.id) {
          const { error: updateError } =
            await supabase
              .from("reports")
              .update({
                patient_id: patientId,
                status: "completed",
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

          localStorage.setItem(
            "nidanCurrentReportNo",
            generatedReportNo
          );

          localStorage.setItem(
            "nidanCurrentReportPatient",
            patientId
          );

          setSaveStatus("saved");
          setSaveMessage(
            "Report saved successfully"
          );

          return;
        }

        // --------------------------------------------
        // INSERT NEW REPORT
        // --------------------------------------------

        const { data, error } =
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
            ])
            .select();

        if (error) {
          throw error;
        }

        console.log(
          "Report saved:",
          data
        );

        // --------------------------------------------
        // SAVE REPORT SESSION
        // --------------------------------------------

        localStorage.setItem(
          "nidanCurrentReportNo",
          generatedReportNo
        );

        localStorage.setItem(
          "nidanCurrentReportPatient",
          patientId
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

  // --------------------------------------------------
  // PRINT
  // --------------------------------------------------

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

  // --------------------------------------------------
  // NEW PATIENT
  // --------------------------------------------------

  function newPatient() {
    const confirmNew =
      window.confirm(
        "New patient start karna hai? Current patient data clear ho jayega."
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

    localStorage.removeItem(
      "nidanCurrentReportNo"
    );

    localStorage.removeItem(
      "nidanCurrentReportPatient"
    );

    router.push("/patients");
  }

  // --------------------------------------------------
  // REPORT DISPLAY TESTS
  // --------------------------------------------------

  const reportTests =
    buildReportTests(
      selectedTests,
      results
    );

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="finalReportPage">

      {/* ==========================================
          SCREEN TOOLBAR
      ========================================== */}

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
            <small
              style={{
                color: "#b7791f",
                fontWeight: "600",
              }}
            >
              ● Saving report...
            </small>
          )}

          {saveStatus === "saved" && (
            <small
              style={{
                color: "#15803d",
                fontWeight: "600",
              }}
            >
              ✓ Saved to Reports
            </small>
          )}

          {saveStatus === "error" && (
            <small
              style={{
                color: "#dc2626",
                fontWeight: "600",
              }}
            >
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

      {/* ==========================================
          PRINTABLE REPORT
      ========================================== */}

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

        {/* LAB DETAILS */}

        <section className="reportLabDetails">

          <span>
            📍 Address: ______________________
          </span>

          <span>
            ☎ Mobile: ______________
          </span>

          <span>
            ✉ Email: ______________
          </span>

        </section>

        {/* ==========================================
            PATIENT INFORMATION
        ========================================== */}

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
                {patient.mobile || "-"}
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
                  "-"}
              </strong>
            </div>

          </div>

        </section>

        {/* ==========================================
            TEST REPORT
        ========================================== */}

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

                {test.category && (
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: "11px",
                      fontWeight: "600",
                      marginBottom: "4px",
                    }}
                  >
                    {test.category.toUpperCase()}
                  </div>
                )}

                <div className="reportTestHeading">
                  {test.name}
                </div>

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

                    {test.parameters.map(
                      (parameter, index) => (

                        <tr
                          key={`${test.id}-${parameter.name}-${index}`}
                        >

                          <td>
                            {parameter.name}
                          </td>

                          <td
                            className={
                              parameter.flag
                                ? "abnormalResult"
                                : "normalResult"
                            }
                          >
                            {parameter.result !== ""
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

                              <span className="reportFlag">
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

        {/* ==========================================
            REMARKS
        ========================================== */}

        <section className="reportRemarks">

          <strong>
            Remarks:
          </strong>

          <div className="remarksLine">
            ________________________________________________
          </div>

        </section>

        {/* ==========================================
            SIGNATURE
        ========================================== */}

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

        {/* ==========================================
            NOTE
        ========================================== */}

        <section className="reportNotes">

          <strong>
            Note:
          </strong>

          <p>
            Reference intervals may vary according to
            laboratory method, age, sex and clinical
            circumstances. Laboratory results should be
            interpreted with relevant clinical findings.
          </p>

        </section>

        {/* ==========================================
            FOOTER
        ========================================== */}

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
  );
}
