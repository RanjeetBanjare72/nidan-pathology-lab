"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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

      if (error) {
        throw error;
      }

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

  function getTestNames(report) {
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

  return (
    <main
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "24px 16px",
      }}
    >
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
          style={{
            padding: "10px 16px",
            cursor: "pointer",
            borderRadius: "8px",
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {loading && <p>Reports loading...</p>}

      {!loading && errorMessage && (
        <div
          style={{
            padding: "16px",
            border: "1px solid #ddd",
            borderRadius: "10px",
          }}
        >
          <strong>Report load nahi hui.</strong>
          <p>{errorMessage}</p>
        </div>
      )}

      {!loading && !errorMessage && reports.length === 0 && (
        <div
          style={{
            padding: "30px",
            textAlign: "center",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h3>No Saved Reports</h3>
          <p>Abhi Supabase me koi saved report nahi mili.</p>
        </div>
      )}

      {!loading && !errorMessage && reports.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "750px",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Report No.</th>
                <th style={thStyle}>Patient</th>
                <th style={thStyle}>Tests</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Saved Date</th>
              </tr>
            </thead>

            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td style={tdStyle}>{report.report_no || "-"}</td>

                  <td style={tdStyle}>{getPatientName(report)}</td>

                  <td style={tdStyle}>{getTestNames(report)}</td>

                  <td style={tdStyle}>
                    {report.status || "completed"}
                  </td>

                  <td style={tdStyle}>
                    {formatDate(report.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
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
