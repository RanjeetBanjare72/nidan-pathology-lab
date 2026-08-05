"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function SavedReportViewPage() {
  const params = useParams();
  const router = useRouter();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (params?.id) {
      loadReport();
    }
  }, [params?.id]);

  async function loadReport() {
    try {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) throw error;

      setReport(data);
    } catch (error) {
      console.error(error);
      setErrorMessage("Report load nahi hui.");
    } finally {
      setLoading(false);
    }
  }

  function getPatient() {
    return report?.report_data?.patient || {};
  }

  function getTests() {
    const tests = report?.report_data?.selectedTests;
    return Array.isArray(tests) ? tests : [];
  }

  if (loading) {
    return <div style={{ padding: "30px" }}>Report loading...</div>;
  }

  if (errorMessage || !report) {
    return (
      <div style={{ padding: "30px" }}>
        <h2>Report nahi mili</h2>
        <p>{errorMessage}</p>

        <button onClick={() => router.push("/reports")}>
          ← Back to Reports
        </button>
      </div>
    );
  }

  const patient = getPatient();
  const tests = getTests();
const results = report?.report_data?.results || {};

  return (
    <main
      style={{
        background: "#eef3f8",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      {/* ACTION BAR */}

      <div
        className="no-print"
        style={{
          maxWidth: "900px",
          margin: "0 auto 15px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => router.push("/reports")}
          style={buttonStyle}
        >
          ← Back to Reports
        </button>

        <button
          onClick={() => window.print()}
          style={buttonStyle}
        >
          🖨 Print / Save PDF
        </button>
      </div>

      {/* REPORT */}

      <div
        style={{
          maxWidth: "850px",
          margin: "auto",
          background: "white",
          padding: "35px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            borderBottom: "2px solid #222",
            paddingBottom: "15px",
          }}
        >
          <h1 style={{ margin: 0 }}>
            NIDAN PATHOLOGY LAB
          </h1>

          <div>
            Clinical Pathology & Diagnostic Laboratory
          </div>

          <strong>LABORATORY REPORT</strong>
        </div>

        {/* PATIENT DETAILS */}

        <div style={{ marginTop: "20px" }}>
          <table style={tableStyle}>
            <tbody>
              <tr>
                <td style={cellStyle}>
                  <strong>Report No:</strong>{" "}
                  {report.report_no || "-"}
                </td>

                <td style={cellStyle}>
                  <strong>Patient ID:</strong>{" "}
                  {patient.id ||
                    patient.patient_id ||
                    "-"}
                </td>
              </tr>

              <tr>
                <td style={cellStyle}>
                  <strong>Patient:</strong>{" "}
                  {patient.name ||
                    patient.patientName ||
                    "-"}
                </td>

                <td style={cellStyle}>
                  <strong>Age / Sex:</strong>{" "}
                  {patient.age || "-"} /{" "}
                  {patient.gender || "-"}
                </td>
              </tr>

              <tr>
                <td style={cellStyle}>
                  <strong>Mobile:</strong>{" "}
                  {patient.mobile || "-"}
                </td>

                <td style={cellStyle}>
                  <strong>Ref. Doctor:</strong>{" "}
                  {patient.doctor ||
                    patient.referring_doctor ||
                    "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TEST RESULTS */}

        <div style={{ marginTop: "25px" }}>
          {tests.length === 0 ? (
            <p>No investigations available.</p>
          ) : (
            tests.map((test, index) => (
              <div
                key={index}
                style={{ marginBottom: "25px" }}
              >
                <h3
                  style={{
                    borderBottom: "1px solid #333",
                    paddingBottom: "5px",
                  }}
                >
                  {test.name ||
                    test.testName ||
                    "Investigation"}
                </h3>

                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={headStyle}>
                        INVESTIGATION
                      </th>

                      <th style={headStyle}>
                        RESULT
                      </th>

                      <th style={headStyle}>
                        UNIT
                      </th>

                      <th style={headStyle}>
                        REFERENCE RANGE
                      </th>
                    </tr>
                  </thead>

                  <tbody>
  {Array.isArray(test.tests) && test.tests.length > 0 ? (
    test.tests.map((parameter, i) => {
      const key = `${test.id}-${parameter.name}-${i}`;

      const value =
        results[key] ??
        results[parameter.id] ??
        parameter.result ??
        parameter.value ??
        "";

      const reference =
        parameter.range ||
        parameter.referenceRange ||
        parameter.reference ||
        (parameter.min !== undefined && parameter.max !== undefined
          ? `${parameter.min} - ${parameter.max}`
          : "-");

      return (
        <tr key={key}>
          <td style={cellStyle}>
            {parameter.name || "-"}
          </td>

          <td style={cellStyle}>
            <strong>{value !== "" ? value : "-"}</strong>
          </td>

          <td style={cellStyle}>
            {parameter.unit || "-"}
          </td>

          <td style={cellStyle}>
            {reference}
          </td>
        </tr>
      );
    })
  ) : (
    <tr>
      <td style={cellStyle}>
        {test.parameter || test.name || "-"}
      </td>

      <td style={cellStyle}>
        {test.result ?? test.value ?? "-"}
      </td>

      <td style={cellStyle}>
        {test.unit || "-"}
      </td>

      <td style={cellStyle}>
        {test.range || test.referenceRange || "-"}
      </td>
    </tr>
  )}
</tbody>
                </table>
              </div>
            ))
          )}
        </div>

        {/* SIGNATURE */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "70px",
          }}
        >
          <div>
            <strong>Lab Technician</strong>
            <br />
            NIDAN Pathology Lab
          </div>

          <div style={{ textAlign: "right" }}>
            <strong>Authorized Signatory</strong>
            <br />
            Signature & Seal
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "45px",
            fontSize: "12px",
          }}
        >
          Computer Generated Laboratory Report
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
          }

          main {
            padding: 0 !important;
            background: white !important;
          }
        }
      `}</style>
    </main>
  );
}

const buttonStyle = {
  padding: "10px 16px",
  border: "1px solid #aaa",
  borderRadius: "6px",
  background: "white",
  cursor: "pointer",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const cellStyle = {
  padding: "10px",
  borderBottom: "1px solid #ddd",
  verticalAlign: "top",
};

const headStyle = {
  padding: "10px",
  border: "1px solid #bbb",
  textAlign: "left",
  background: "#f4f4f4",
};
