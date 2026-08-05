"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ReportPage() {
  const router = useRouter();

  const [patient, setPatient] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
  const [results, setResults] = useState({});
  const [reportDate, setReportDate] = useState("");

  useEffect(() => {
    try {
      setPatient(
        JSON.parse(localStorage.getItem("nidanPatient") || "{}")
      );

      setSelectedTests(
        JSON.parse(
          localStorage.getItem("nidanSelectedTests") || "[]"
        )
      );

      setResults(
        JSON.parse(localStorage.getItem("nidanResults") || "{}")
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

  function parameterKey(testId, parameter, index) {
    return `${testId}-${parameter.name}-${index}`;
  }

  function referenceRange(parameter) {
    if (parameter.range) return parameter.range;

    if (
      parameter.min !== undefined &&
      parameter.max !== undefined
    ) {
      return `${parameter.min} - ${parameter.max}`;
    }

    return parameter.reference || "-";
  }

  function getFlag(value, parameter) {
    if (
      value === "" ||
      value === undefined ||
      value === null
    ) {
      return "";
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) return "";

    const min = Number(parameter.min);
    const max = Number(parameter.max);

    if (
      parameter.min !== undefined &&
      parameter.min !== "" &&
      !Number.isNaN(min) &&
      numericValue < min
    ) {
      return "L";
    }

    if (
      parameter.max !== undefined &&
      parameter.max !== "" &&
      !Number.isNaN(max) &&
      numericValue > max
    ) {
      return "H";
    }

    return "";
  }

  async function printReport() {
  try {
    const reportTests = selectedTests.map((test) => ({
  id: test.id,
  name: test.name || test.testName || "Test",
  parameters: (test.tests || test.parameters || []).map(
    (parameter, index) => {
      const key = parameterKey(test.id, parameter, index);

      return {
        name:
          parameter.name ||
          parameter.testName ||
          parameter.investigation ||
          "Investigation",

        result: results[key] ?? "",

        unit:
          parameter.unit ||
          parameter.units ||
          "",

        referenceRange:
          referenceRange(parameter),

        min:
          parameter.min ?? null,

        max:
          parameter.max ?? null,
      };
    }
  ),
}));

const reportPayload = {
  patient: patient,
  selectedTests: selectedTests,
  results: results,
  reportTests: reportTests,
  reportDate: reportDate,
};

    const { error } = await supabase
      .from("reports")
      .insert([
        {
          report_no: `RPT-${Date.now()}`,
          patient_id: patient.patientId || patient.id,
          status: "completed",
          report_data: reportPayload,
        },
      ]);

    if (error) {
      console.error("Report save error:", error);
      alert("Report save nahi hua: " + error.message);
      return;
    }

    alert("Report successfully saved.");
    window.print();
  } catch (error) {
    console.error("Report save error:", error);
    alert("Report save karne me error aaya.");
  }
}

  function newPatient() {
    const confirmNew = window.confirm(
      "New patient start karna hai? Current patient data clear ho jayega."
    );

    if (!confirmNew) return;

    localStorage.removeItem("nidanPatient");
    localStorage.removeItem("nidanSelectedTests");
    localStorage.removeItem("nidanResults");

    router.push("/patients");
  }

  return (
    <div className="finalReportPage">
      {/* SCREEN TOOLBAR */}

      <div className="reportScreenToolbar">
        <div>
          <strong>Final Laboratory Report</strong>
          <small>
            Review report before printing or saving PDF
          </small>
        </div>

        <div className="reportToolbarButtons">
          <button
            className="reportBackButton"
            onClick={() => router.push("/results")}
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
            <h1>NIDAN PATHOLOGY LAB</h1>

            <p className="reportTagline">
              Accurate • Reliable • Professional
            </p>

            <p>
              Clinical Pathology & Diagnostic Laboratory
            </p>
          </div>

          <div className="reportHeaderRight">
            <strong>LABORATORY REPORT</strong>
            <span>Report Date: {reportDate}</span>
          </div>
        </header>

        <div className="reportAccentLine"></div>

        {/* LAB DETAILS */}

        <section className="reportLabDetails">
          <span>
            📍 Address: ______________________________
          </span>

          <span>
            ☎ Mobile: __________________
          </span>

          <span>
            ✉ Email: __________________
          </span>
        </section>

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
                {patient.gender || patient.sex || "-"}
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
                {patient.sampleDate || "-"}
              </strong>
            </div>
          </div>
        </section>

        {/* TEST REPORTS */}

        <section className="investigationReport">
          {selectedTests.length === 0 ? (
            <div className="reportEmpty">
              No investigations selected.
            </div>
          ) : (
            selectedTests.map((test) => (
              <div
                className="reportTestSection"
                key={test.id}
              >
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
                    {test.tests?.map(
                      (parameter, index) => {
                        const key = parameterKey(
                          test.id,
                          parameter,
                          index
                        );

                        const value =
                          results[key] ?? "";

                        const flag = getFlag(
                          value,
                          parameter
                        );

                        return (
                          <tr key={key}>
                            <td>
                              {parameter.name}
                            </td>

                            <td
                              className={
                                flag
                                  ? "abnormalResult"
                                  : "normalResult"
                              }
                            >
                              {value || "-"}
                            </td>

                            <td>
                              {parameter.unit || "-"}
                            </td>

                            <td>
                              {referenceRange(
                                parameter
                              )}
                            </td>

                            <td>
                              {flag && (
                                <span className="reportFlag">
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
            ))
          )}
        </section>

        {/* REMARK */}

        <section className="reportRemarks">
          <strong>Remarks:</strong>

          <div className="remarksLine">
            ________________________________________________
          </div>
        </section>

        {/* SIGNATURE */}

        <section className="reportSignatureSection">
          <div className="reportSignatureBox">
            <div className="signatureSpace"></div>

            <strong>Lab Technician</strong>

            <span>
              NIDAN Pathology Lab
            </span>
          </div>

          <div className="reportSignatureBox">
            <div className="signatureSpace"></div>

            <strong>
              Authorized Signatory
            </strong>

            <span>
              Signature & Seal
            </span>
          </div>
        </section>

        {/* NOTES */}

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
  );
}
