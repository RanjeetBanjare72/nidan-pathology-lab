"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReports(data || []);
    } catch (error) {
      console.error("Reports load error:", error);
      setErrorMessage(error.message || "Reports load nahi ho paayi.");
    } finally {
      setLoading(false);
    }
  }

  function getPatientName(report) {
    return (
      report?.report_data?.patient?.name ||
      report?.report_data?.patient?.patientName ||
      "-"
    );
  }

  function getPatientDetails(report) {
    const patient = report?.report_data?.patient || {};

    return {
      id: patient.patientId || patient.id || report?.patient_id || "-",
      name: patient.name || patient.patientName || "-",
      age: patient.age || "-",
      gender: patient.gender || patient.sex || "-",
      mobile: patient.mobile || patient.phone || "-",
      doctor: patient.doctor || patient.refDoctor || "-",
      sampleDate: patient.sampleDate || "-",
    };
  }

  function getTestsNames(report) {
    const tests = report?.report_data?.selectedTests;

    if (!Array.isArray(tests) || tests.length === 0) {
      return "-";
    }

    return tests
      .map((test) => test?.name || test?.testName || "")
      .filter(Boolean)
      .join(", ");
  }

  function formatDate(value) {
    if (!value) return "-";

    try {
      return new Date(value).toLocaleString("en-IN");
    } catch {
      return value;
    }
  }

  async function deleteReport(report) {
    const confirmDelete = window.confirm(
      `Kya aap ${report.report_no || "is report"} ko delete karna chahte hain?`
    );

    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", report.id);

      if (error) throw error;

      setReports((currentReports) =>
        currentReports.filter((item) => item.id !== report.id)
      );

      if (selectedReport?.id === report.id) {
        setSelectedReport(null);
      }

      alert("Report successfully delete ho gayi.");
    } catch (error) {
      console.error("Delete report error:", error);
      alert("Report delete nahi hui: " + error.message);
    }
  }

  function printReport(report) {
    setSelectedReport(report);

    setTimeout(() => {
      window.print();
    }, 300);
  }

  const patient = selectedReport
    ? getPatientDetails(selectedReport)
    : null;

  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "24px 16px",
      }}
    >
      <div className="noPrint">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ margin: 0 }}>Saved Reports</h1>

            <p style={{ marginTop: "6px", color: "#666" }}>
              NIDAN PATHOLOGY LAB
            </p>
          </div>

          <button
            onClick={loadReports}
            style={buttonStyle}
          >
            🔄 Refresh
          </button>
        </div>

        {loading && <p>Reports loading...</p>}

        {!loading && errorMessage && (
          <div style={messageStyle}>
            <strong>Report load nahi hui.</strong>
            <p>{errorMessage}</p>
          </div>
        )}

        {!loading &&
          !errorMessage &&
          reports.length === 0 && (
            <div style={messageStyle}>
              <h3>No Saved Reports</h3>
              <p>Abhi Supabase me koi saved report nahi mili.</p>
            </div>
          )}

        {!loading &&
          !errorMessage &&
          reports.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "950px",
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>Report No.</th>
                    <th style={thStyle}>Patient</th>
                    <th style={thStyle}>Tests</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Saved Date</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td style={tdStyle}>
                        {report.report_no || "-"}
                      </td>

                      <td style={tdStyle}>
                        {getPatientName(report)}
                      </td>

                      <td style={tdStyle}>
                        {getTestsNames(report)}
                      </td>

                      <td style={tdStyle}>
                        {report.status || "completed"}
                      </td>

                      <td style={tdStyle}>
                        {formatDate(report.created_at)}
                      </td>

                      <td style={tdStyle}>
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            onClick={() => {
  window.location.href = `/reports/${report.id}`;
}}
                            style={smallButtonStyle}
                          >
                            👁 View
                          </button>

                          <button
                            onClick={() => printReport(report)}
                            style={smallButtonStyle}
                          >
                            🖨 Print
                          </button>

                          <button
                            onClick={() => deleteReport(report)}
                            style={deleteButtonStyle}
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        {selectedReport && patient && (
          <div
            style={{
              marginTop: "30px",
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2 style={{ marginTop: 0 }}>
                  Report Preview
                </h2>

                <strong>
                  {selectedReport.report_no || "-"}
                </strong>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                style={buttonStyle}
              >
                ✕ Close
              </button>
            </div>

            <ReportContent
              report={selectedReport}
              patient={patient}
            />

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => printReport(selectedReport)}
                style={buttonStyle}
              >
                🖨 Print / Save PDF
              </button>

              <button
                onClick={() => deleteReport(selectedReport)}
                style={deleteButtonStyle}
              >
                🗑 Delete Report
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedReport && patient && (
        <div className="printOnly">
          <ReportContent
            report={selectedReport}
            patient={patient}
          />
        </div>
      )}

      <style jsx global>{`
        .printOnly {
          display: none;
        }

        @media print {
          .noPrint {
            display: none !important;
          }

          .printOnly {
            display: block !important;
          }

          body {
            background: white !important;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>
    </main>
  );
}

function ReportContent({ report, patient }) {
  const selectedTests =
    report?.report_data?.selectedTests || [];

  const results =
    report?.report_data?.results || {};

  return (
    <div
      style={{
        background: "#fff",
        color: "#111",
        padding: "20px",
      }}
    >
      <div
        style={{
          textAlign: "center",
          borderBottom: "2px solid #222",
          paddingBottom: "12px",
          marginBottom: "16px",
        }}
      >
        <h1 style={{ margin: "0 0 5px" }}>
          NIDAN PATHOLOGY LAB
        </h1>

        <div>
          Clinical Pathology & Diagnostic Laboratory
        </div>

        <strong>LABORATORY REPORT</strong>
      </div>

      <table style={infoTableStyle}>
        <tbody>
          <tr>
            <td style={infoCellStyle}>
              <strong>Report No:</strong>{" "}
              {report.report_no || "-"}
            </td>

            <td style={infoCellStyle}>
              <strong>Patient ID:</strong>{" "}
              {patient.id}
            </td>
          </tr>

          <tr>
            <td style={infoCellStyle}>
              <strong>Patient:</strong>{" "}
              {patient.name}
            </td>

            <td style={infoCellStyle}>
              <strong>Age / Sex:</strong>{" "}
              {patient.age} / {patient.gender}
            </td>
          </tr>

          <tr>
            <td style={infoCellStyle}>
              <strong>Mobile:</strong>{" "}
              {patient.mobile}
            </td>

            <td style={infoCellStyle}>
              <strong>Ref. Doctor:</strong>{" "}
              {patient.doctor}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: "20px" }}>
        {selectedTests.length === 0 ? (
          <p>No investigations found.</p>
        ) : (
          selectedTests.map((test, testIndex) => (
            <div
              key={test.id || testIndex}
              style={{ marginBottom: "24px" }}
            >
              <h3
                style={{
                  borderBottom: "1px solid #333",
                  paddingBottom: "6px",
                }}
              >
                {test.name ||
                  test.testName ||
                  "Investigation"}
              </h3>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th style={reportThStyle}>
                      INVESTIGATION
                    </th>
                    <th style={reportThStyle}>
                      RESULT
                    </th>
                    <th style={reportThStyle}>
                      UNIT
                    </th>
                    <th style={reportThStyle}>
                      REFERENCE RANGE
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {(test.tests || []).map(
                    (parameter, index) => {
                      const key =
                        `${test.id}-${parameter.name}-${index}`;

                      const value =
                        results[key] ??
                        results[parameter.id] ??
                        "";

                      const reference =
                        parameter.reference ||
                        parameter.referenceRange ||
                        (parameter.min !== undefined &&
                        parameter.max !== undefined
                          ? `${parameter.min} - ${parameter.max}`
                          : "-");

                      return (
                        <tr key={key}>
                          <td style={reportTdStyle}>
                            {parameter.name || "-"}
                          </td>

                          <td style={reportTdStyle}>
                            <strong>
                              {value || "-"}
                            </strong>
                          </td>

                          <td style={reportTdStyle}>
                            {parameter.unit || "-"}
                          </td>

                          <td style={reportTdStyle}>
                            {reference}
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
      </div>

      <div
        style={{
          marginTop: "50px",
          display: "flex",
          justifyContent: "space-between",
          gap: "30px",
        }}
      >
        <div>
          <strong>Lab Technician</strong>
          <p>NIDAN Pathology Lab</p>
        </div>

        <div style={{ textAlign: "right" }}>
          <strong>Authorized Signatory</strong>
          <p>Signature & Seal</p>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid #aaa",
          marginTop: "30px",
          paddingTop: "10px",
          textAlign: "center",
          fontSize: "12px",
        }}
      >
        Computer Generated Laboratory Report
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "2px solid #ddd",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #ddd",
  verticalAlign: "top",
};

const buttonStyle = {
  padding: "10px 16px",
  cursor: "pointer",
  borderRadius: "8px",
  border: "1px solid #888",
  background: "#fff",
};

const smallButtonStyle = {
  padding: "7px 10px",
  cursor: "pointer",
  borderRadius: "6px",
  border: "1px solid #888",
  background: "#fff",
  whiteSpace: "nowrap",
};

const deleteButtonStyle = {
  padding: "7px 10px",
  cursor: "pointer",
  borderRadius: "6px",
  border: "1px solid #b33",
  background: "#fff",
  whiteSpace: "nowrap",
};

const messageStyle = {
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "10px",
};

const infoTableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const infoCellStyle = {
  padding: "8px",
  borderBottom: "1px solid #ddd",
};

const reportThStyle = {
  textAlign: "left",
  padding: "8px",
  border: "1px solid #999",
  fontSize: "12px",
};

const reportTdStyle = {
  padding: "8px",
  border: "1px solid #aaa",
  fontSize: "13px",
};
