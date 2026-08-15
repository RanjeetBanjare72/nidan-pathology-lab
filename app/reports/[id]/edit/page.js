"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function EditLaboratoryReportPage() {
  const params = useParams();
  const router = useRouter();

  const reportId = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  const [report, setReport] = useState(null);

  const [patient, setPatient] = useState({
    name: "",
    patient_id: "",
    age: "",
    gender: "",
    mobile: "",
    doctor: "",
  });

  const [tests, setTests] = useState([]);
  const [results, setResults] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /* =========================================================
     LOAD SAVED REPORT
  ========================================================= */

  useEffect(() => {
    if (!reportId) return;

    loadReport();
  }, [reportId]);

  async function loadReport() {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("Report nahi mili.");
      }

      console.log("FULL SAVED REPORT:", data);

      setReport(data);

      const reportData =
        data?.report_data &&
        typeof data.report_data === "object"
          ? data.report_data
          : {};

      /* =====================================================
         PATIENT DATA
      ===================================================== */

      const savedPatient =
        reportData?.patient &&
        typeof reportData.patient === "object"
          ? reportData.patient
          : {};

      setPatient({
        name:
          savedPatient?.name ??
          savedPatient?.patientName ??
          "",

        patient_id:
          savedPatient?.id ??
          savedPatient?.patient_id ??
          savedPatient?.patientId ??
          "",

        age:
          savedPatient?.age ??
          "",

        gender:
          savedPatient?.gender ??
          savedPatient?.sex ??
          "",

        mobile:
          savedPatient?.mobile ??
          savedPatient?.mobileNumber ??
          "",

        doctor:
          savedPatient?.doctor ??
          savedPatient?.referring_doctor ??
          savedPatient?.referringDoctor ??
          "",
      });

      /* =====================================================
         IMPORTANT:
         SAME ARRAY USED BY SAVED REPORT VIEW
      ===================================================== */

      let savedTests = [];

      if (Array.isArray(reportData?.selectedTests)) {
        savedTests = reportData.selectedTests;
      } else if (Array.isArray(reportData?.tests)) {
        savedTests = reportData.tests;
      } else if (Array.isArray(reportData?.reportTests)) {
        savedTests = reportData.reportTests;
      } else if (Array.isArray(data?.tests)) {
        savedTests = data.tests;
      }

      console.log("SAVED TESTS:", savedTests);

      setTests(savedTests);

      /* =====================================================
         SAVED RESULT VALUES
      ===================================================== */

      const savedResults =
        reportData?.results &&
        typeof reportData.results === "object"
          ? reportData.results
          : {};

      console.log("SAVED RESULTS:", savedResults);

      setResults(savedResults);
    } catch (error) {
      console.error("LOAD REPORT ERROR:", error);

      setErrorMessage(
        error?.message || "Report load nahi hui."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     GET TEST ID
  ========================================================= */

  function getTestId(test, testIndex) {
    return (
      test?.id ??
      test?.testId ??
      test?.test_id ??
      test?.code ??
      `test-${testIndex}`
    );
  }

  /* =========================================================
     GET PARAMETER NAME
  ========================================================= */

  function getParameterName(parameter) {
    return (
      parameter?.name ??
      parameter?.parameterName ??
      parameter?.parameter_name ??
      parameter?.testName ??
      parameter?.test_name ??
      parameter?.investigation ??
      parameter?.title ??
      ""
    );
  }

  /* =========================================================
     GET PARAMETER ID
  ========================================================= */

  function getParameterId(parameter) {
    return (
      parameter?.id ??
      parameter?.parameterId ??
      parameter?.parameter_id ??
      ""
    );
  }

  /* =========================================================
     GET REFERENCE RANGE
  ========================================================= */

  function getReferenceRange(parameter) {
    if (parameter?.range !== undefined) {
      return parameter.range;
    }

    if (parameter?.referenceRange !== undefined) {
      return parameter.referenceRange;
    }

    if (parameter?.reference !== undefined) {
      return parameter.reference;
    }

    if (
      parameter?.min !== undefined &&
      parameter?.max !== undefined
    ) {
      return `${parameter.min} - ${parameter.max}`;
    }

    return "-";
  }

  /* =========================================================
     GET EXISTING RESULT
     
     This is the most important function.
     It tries all common key formats.
  ========================================================= */

  function getExistingResult(
    test,
    parameter,
    parameterIndex,
    testIndex
  ) {
    const testId = getTestId(
      test,
      testIndex
    );

    const parameterName =
      getParameterName(parameter);

    const parameterId =
      getParameterId(parameter);

    /* =====================================================
       EXACT KEY USED BY REPORT VIEW PAGE

       `${test.id}-${parameter.name}-${i}`
    ===================================================== */

    const exactKey =
      `${testId}-${parameterName}-${parameterIndex}`;

    if (
      Object.prototype.hasOwnProperty.call(
        results,
        exactKey
      )
    ) {
      return results[exactKey];
    }

    /* =====================================================
       OTHER POSSIBLE KEY FORMATS
    ===================================================== */

    const possibleKeys = [
      parameterId,

      `${testId}-${parameterName}`,

      `${testId}-${parameterId}`,

      `${testIndex}-${parameterName}-${parameterIndex}`,

      `${testIndex}-${parameterName}`,

      `${testIndex}-${parameterIndex}`,

      `${testIndex}_${parameterIndex}`,

      parameterName,
    ].filter(
      (key) =>
        key !== undefined &&
        key !== null &&
        key !== ""
    );

    for (const key of possibleKeys) {
      if (
        Object.prototype.hasOwnProperty.call(
          results,
          key
        )
      ) {
        return results[key];
      }
    }

    /* =====================================================
       RESULT STORED INSIDE PARAMETER
    ===================================================== */

    if (
      parameter?.result !== undefined &&
      parameter?.result !== null &&
      parameter?.result !== ""
    ) {
      return parameter.result;
    }

    if (
      parameter?.value !== undefined &&
      parameter?.value !== null &&
      parameter?.value !== ""
    ) {
      return parameter.value;
    }

    return "";
  }

  /* =========================================================
     UPDATE RESULT
  ========================================================= */

  function updateResult(
    test,
    parameter,
    parameterIndex,
    testIndex,
    value
  ) {
    const testId = getTestId(
      test,
      testIndex
    );

    const parameterName =
      getParameterName(parameter);

    /*
      IMPORTANT:
      Keep exactly the same key used by
      the report view page.
    */

    const key =
      `${testId}-${parameterName}-${parameterIndex}`;

    setResults((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  /* =========================================================
     PATIENT INPUT CHANGE
  ========================================================= */

  function updatePatient(field, value) {
    setPatient((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  /* =========================================================
     SAVE CHANGES
  ========================================================= */

  async function saveChanges() {
    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (!reportId) {
        throw new Error(
          "Report ID nahi mila."
        );
      }

      if (!report) {
        throw new Error(
          "Report data available nahi hai."
        );
      }

      /* =====================================================
         CREATE UPDATED PATIENT OBJECT
      ===================================================== */

      const updatedPatient = {
        ...(report?.report_data?.patient || {}),

        name: patient.name,
        patientName: patient.name,

        id: patient.patient_id,
        patient_id: patient.patient_id,
        patientId: patient.patient_id,

        age: patient.age,

        gender: patient.gender,
        sex: patient.gender,

        mobile: patient.mobile,
        mobileNumber: patient.mobile,

        doctor: patient.doctor,
        referring_doctor: patient.doctor,
        referringDoctor: patient.doctor,
      };

      /* =====================================================
         KEEP EXISTING REPORT DATA
      ===================================================== */

      const oldReportData =
        report?.report_data &&
        typeof report.report_data === "object"
          ? report.report_data
          : {};

      /* =====================================================
         UPDATED REPORT DATA
         
         selectedTests is preserved.
         results gets edited values.
      ===================================================== */

      const updatedReportData = {
        ...oldReportData,

        patient: updatedPatient,

        selectedTests: tests,

        results: results,
      };

      console.log(
        "UPDATED REPORT DATA:",
        updatedReportData
      );

      /* =====================================================
         UPDATE SUPABASE
      ===================================================== */

      const { data, error } = await supabase
        .from("reports")
        .update({
          report_data: updatedReportData,
        })
        .eq("id", reportId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(
        "UPDATED REPORT:",
        data
      );

      setReport(data);

      setSuccessMessage(
        "Report successfully update ho gayi."
      );

      /*
        Short delay so user can see success.
      */

      setTimeout(() => {
        router.push(
          `/reports/${reportId}`
        );

        router.refresh();
      }, 700);
    } catch (error) {
      console.error(
        "SAVE REPORT ERROR:",
        error
      );

      setErrorMessage(
        error?.message ||
        "Report save nahi hui."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingCardStyle}>
          <div style={spinnerStyle}></div>

          <h3>
            Report loading...
          </h3>

          <p>
            Saved report data load ho raha hai.
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (errorMessage || !report) {
    return (
      <main style={pageStyle}>
        <div style={errorCardStyle}>
          <h2>
            Report nahi mili
          </h2>

          <p>
            {errorMessage ||
              "Report available nahi hai."}
          </p>

          <button
            onClick={() =>
              router.push("/reports")
            }
            style={primaryButtonStyle}
          >
            ← Back to Reports
          </button>
        </div>
      </main>
    );
  }

  /* =========================================================
     REPORT UI
  ========================================================= */

  return (
    <main style={pageStyle}>
      {/* =====================================================
          TOP HEADER
      ===================================================== */}

      <div style={topBarStyle}>
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              color: "#172033",
            }}
          >
            Edit Laboratory Report
          </h2>

          <div
            style={{
              fontSize: "12px",
              color: "#168477",
              fontWeight: 600,
              marginTop: "3px",
            }}
          >
            NIDAN PATHOLOGY LAB
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() =>
              router.push(
                `/reports/${reportId}`
              )
            }
            style={secondaryButtonStyle}
            disabled={saving}
          >
            ← Cancel
          </button>

          <button
            onClick={saveChanges}
            style={saveButtonStyle}
            disabled={saving}
          >
            {saving
              ? "⏳ Saving..."
              : "💾 Save Changes"}
          </button>
        </div>
      </div>

      {/* =====================================================
          SUCCESS MESSAGE
      ===================================================== */}

      {successMessage && (
        <div style={successStyle}>
          ✓ {successMessage}
        </div>
      )}

      {/* =====================================================
          ERROR MESSAGE
      ===================================================== */}

      {errorMessage && (
        <div style={dangerStyle}>
          ⚠ {errorMessage}
        </div>
      )}

      {/* =====================================================
          PATIENT INFORMATION
      ===================================================== */}

      <section style={cardStyle}>
        <SectionTitle>
          Patient Information
        </SectionTitle>

        <div style={formGridStyle}>
          <InputField
            label="Patient Name"
            value={patient.name}
            onChange={(value) =>
              updatePatient(
                "name",
                value
              )
            }
          />

          <InputField
            label="Patient ID"
            value={patient.patient_id}
            onChange={(value) =>
              updatePatient(
                "patient_id",
                value
              )
            }
          />

          <InputField
            label="Age"
            value={patient.age}
            onChange={(value) =>
              updatePatient(
                "age",
                value
              )
            }
          />

          <InputField
            label="Gender / Sex"
            value={patient.gender}
            onChange={(value) =>
              updatePatient(
                "gender",
                value
              )
            }
          />

          <InputField
            label="Mobile"
            value={patient.mobile}
            onChange={(value) =>
              updatePatient(
                "mobile",
                value
              )
            }
          />

          <InputField
            label="Referring Doctor"
            value={patient.doctor}
            onChange={(value) =>
              updatePatient(
                "doctor",
                value
              )
            }
          />
        </div>
      </section>

      {/* =====================================================
          INVESTIGATION RESULTS
      ===================================================== */}

      <section style={cardStyle}>
        <SectionTitle>
          Investigation Results
        </SectionTitle>

        {tests.length === 0 ? (
          <div
            style={{
              padding: "25px",
              textAlign: "center",
              color: "#666",
            }}
          >
            No investigations available.
          </div>
        ) : (
          tests.map(
            (test, testIndex) => {
              const parameters =
                Array.isArray(
                  test?.tests
                )
                  ? test.tests
                  : [];

              return (
                <div
                  key={
                    test?.id ??
                    test?.testId ??
                    `test-${testIndex}`
                  }
                  style={{
                    marginBottom:
                      "28px",
                  }}
                >
                  {/* TEST TITLE */}

                  <div
                    style={{
                      background:
                        "#e8f6f3",
                      borderLeft:
                        "4px solid #168477",
                      padding:
                        "9px 12px",
                      marginBottom:
                        "8px",
                    }}
                  >
                    <strong
                      style={{
                        color:
                          "#126c62",
                        fontSize:
                          "16px",
                      }}
                    >
                      {test?.name ||
                        test?.testName ||
                        test?.title ||
                        "Investigation"}
                    </strong>
                  </div>

                  <div
                    style={{
                      overflowX:
                        "auto",
                    }}
                  >
                    <table
                      style={
                        resultsTableStyle
                      }
                    >
                      <thead>
                        <tr>
                          <th
                            style={
                              tableHeadStyle
                            }
                          >
                            Investigation
                          </th>

                          <th
                            style={
                              tableHeadStyle
                            }
                          >
                            Result
                          </th>

                          <th
                            style={
                              tableHeadStyle
                            }
                          >
                            Unit
                          </th>

                          <th
                            style={
                              tableHeadStyle
                            }
                          >
                            Reference Range
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {parameters.length >
                        0 ? (
                          parameters.map(
                            (
                              parameter,
                              parameterIndex
                            ) => {
                              const value =
                                getExistingResult(
                                  test,
                                  parameter,
                                  parameterIndex,
                                  testIndex
                                );

                              const parameterName =
                                getParameterName(
                                  parameter
                                );

                              const reference =
                                getReferenceRange(
                                  parameter
                                );

                              return (
                                <tr
                                  key={`${getTestId(
                                    test,
                                    testIndex
                                  )}-${parameterName}-${parameterIndex}`}
                                >
                                  <td
                                    style={
                                      tableCellStyle
                                    }
                                  >
                                    <strong>
                                      {parameterName ||
                                        "-"}
                                    </strong>
                                  </td>

                                  <td
                                    style={
                                      tableCellStyle
                                    }
                                  >
                                    <input
                                      type="text"
                                      value={
                                        value ??
                                        ""
                                      }
                                      placeholder="Enter result"
                                      onChange={(
                                        event
                                      ) =>
                                        updateResult(
                                          test,
                                          parameter,
                                          parameterIndex,
                                          testIndex,
                                          event
                                            .target
                                            .value
                                        )
                                      }
                                      style={
                                        resultInputStyle
                                      }
                                    />
                                  </td>

                                  <td
                                    style={
                                      tableCellStyle
                                    }
                                  >
                                    {parameter?.unit ||
                                      parameter?.units ||
                                      "-"}
                                  </td>

                                  <td
                                    style={
                                      tableCellStyle
                                    }
                                  >
                                    {reference}
                                  </td>
                                </tr>
                              );
                            }
                          )
                        ) : (
                          <SingleTestRow
                            test={test}
                            testIndex={
                              testIndex
                            }
                            value={getExistingResult(
                              test,
                              test,
                              0,
                              testIndex
                            )}
                            onChange={(
                              value
                            ) =>
                              updateResult(
                                test,
                                test,
                                0,
                                testIndex,
                                value
                              )
                            }
                          />
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

      {/* =====================================================
          BOTTOM SAVE
      ===================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "flex-end",
          gap: "8px",
          marginTop: "15px",
          marginBottom: "40px",
        }}
      >
        <button
          onClick={() =>
            router.push(
              `/reports/${reportId}`
            )
          }
          style={secondaryButtonStyle}
          disabled={saving}
        >
          Cancel
        </button>

        <button
          onClick={saveChanges}
          style={saveButtonStyle}
          disabled={saving}
        >
          {saving
            ? "⏳ Saving..."
            : "💾 Save Changes"}
        </button>
      </div>

      {/* =====================================================
          GLOBAL RESPONSIVE CSS
      ===================================================== */}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          background: #eef3f8;
        }

        input {
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

        @media (max-width: 700px) {
          .edit-form-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

/* ============================================================
   INPUT FIELD
============================================================ */

function InputField({
  label,
  value,
  onChange,
}) {
  return (
    <div>
      <label
        style={labelStyle}
      >
        {label}
      </label>

      <input
        type="text"
        value={value ?? ""}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        style={textInputStyle}
      />
    </div>
  );
}

/* ============================================================
   SECTION TITLE
============================================================ */

function SectionTitle({
  children,
}) {
  return (
    <div
      style={{
        borderBottom:
          "2px solid #168477",
        paddingBottom: "8px",
        marginBottom: "15px",
        color: "#126c62",
        fontWeight: 700,
        fontSize: "15px",
      }}
    >
      {children}
    </div>
  );
}

/* ============================================================
   SINGLE TEST ROW
   For tests that don't have test.tests[]
============================================================ */

function SingleTestRow({
  test,
  value,
  onChange,
}) {
  const name =
    test?.parameter ||
    test?.parameterName ||
    test?.name ||
    test?.testName ||
    "-";

  const unit =
    test?.unit ||
    test?.units ||
    "-";

  const reference =
    test?.range ||
    test?.referenceRange ||
    test?.reference ||
    "-";

  return (
    <tr>
      <td
        style={tableCellStyle}
      >
        <strong>
          {name}
        </strong>
      </td>

      <td
        style={tableCellStyle}
      >
        <input
          type="text"
          value={value ?? ""}
          placeholder="Enter result"
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          style={
            resultInputStyle
          }
        />
      </td>

      <td
        style={tableCellStyle}
      >
        {unit}
      </td>

      <td
        style={tableCellStyle}
      >
        {reference}
      </td>
    </tr>
  );
}

/* ============================================================
   STYLES
============================================================ */

const pageStyle = {
  minHeight: "100vh",
  background: "#eef3f8",
  padding: "15px",
  color: "#172033",
};

const topBarStyle = {
  maxWidth: "1100px",
  margin: "0 auto 12px",
  background: "#ffffff",
  borderRadius: "8px",
  padding: "12px 14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
  boxShadow:
    "0 2px 10px rgba(0,0,0,0.08)",
};

const cardStyle = {
  maxWidth: "1100px",
  margin: "0 auto 14px",
  background: "#ffffff",
  borderRadius: "8px",
  padding: "15px",
  boxShadow:
    "0 2px 10px rgba(0,0,0,0.07)",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: "12px",
};

const labelStyle = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  color: "#374151",
  marginBottom: "5px",
};

const textInputStyle = {
  width: "100%",
  height: "38px",
  padding: "8px 10px",
  border:
    "1px solid #cfd6df",
  borderRadius: "5px",
  background: "#ffffff",
  fontSize: "13px",
  outline: "none",
};

const resultInputStyle = {
  width: "100%",
  minWidth: "130px",
  height: "34px",
  padding: "7px 9px",
  border:
    "1px solid #cfd6df",
  borderRadius: "4px",
  background: "#fffdf5",
  fontSize: "13px",
  fontWeight: 500,
  outline: "none",
};

const resultsTableStyle = {
  width: "100%",
  minWidth: "650px",
  borderCollapse: "collapse",
};

const tableHeadStyle = {
  padding: "9px 8px",
  border:
    "1px solid #d8e0e6",
  background: "#edf4f6",
  textAlign: "left",
  fontSize: "11px",
  color: "#263238",
};

const tableCellStyle = {
  padding: "7px 8px",
  border:
    "1px solid #d8e0e6",
  verticalAlign: "middle",
  fontSize: "12px",
  color: "#303840",
};

const primaryButtonStyle = {
  padding: "9px 14px",
  border: "none",
  borderRadius: "5px",
  background: "#168477",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 600,
};

const secondaryButtonStyle = {
  padding: "9px 14px",
  border:
    "1px solid #b8c2cc",
  borderRadius: "5px",
  background: "#ffffff",
  color: "#263238",
  cursor: "pointer",
  fontWeight: 600,
};

const saveButtonStyle = {
  padding: "9px 15px",
  border: "none",
  borderRadius: "5px",
  background: "#087f73",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 700,
};

const successStyle = {
  maxWidth: "1100px",
  margin: "0 auto 12px",
  padding: "10px 12px",
  borderRadius: "6px",
  background: "#e7f7ef",
  border:
    "1px solid #9bd8b6",
  color: "#17663c",
  fontSize: "13px",
  fontWeight: 600,
};

const dangerStyle = {
  maxWidth: "1100px",
  margin: "0 auto 12px",
  padding: "10px 12px",
  borderRadius: "6px",
  background: "#fff0f0",
  border:
    "1px solid #efb0b0",
  color: "#a52828",
  fontSize: "13px",
};

const loadingCardStyle = {
  maxWidth: "500px",
  margin: "100px auto",
  background: "#ffffff",
  padding: "30px",
  borderRadius: "10px",
  textAlign: "center",
  boxShadow:
    "0 3px 15px rgba(0,0,0,0.08)",
};

const errorCardStyle = {
  maxWidth: "500px",
  margin: "80px auto",
  background: "#ffffff",
  padding: "30px",
  borderRadius: "10px",
  boxShadow:
    "0 3px 15px rgba(0,0,0,0.08)",
};

const spinnerStyle = {
  width: "32px",
  height: "32px",
  border:
    "4px solid #d9eeee",
  borderTop:
    "4px solid #168477",
  borderRadius: "50%",
  margin: "0 auto 15px",
};
