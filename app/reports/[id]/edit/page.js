"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

export default function EditLaboratoryReportPage() {
  const params = useParams();
  const router = useRouter();

  const reportId = useMemo(() => {
    if (!params?.id) return "";
    return Array.isArray(params.id) ? params.id[0] : params.id;
  }, [params]);

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

  // ---------------------------------------------------------
  // LOAD REPORT
  // ---------------------------------------------------------

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
        throw new Error("Report not found");
      }

      console.log("EDIT PAGE - FULL REPORT:", data);
      console.log("EDIT PAGE - REPORT DATA:", data.report_data);

      setReport(data);

      const reportData = data.report_data || {};

      // -----------------------------------------------------
      // PATIENT DATA
      // -----------------------------------------------------

      const savedPatient =
        reportData.patient ||
        reportData.patientData ||
        data.patient ||
        {};

      const normalizedPatient = {
        name:
          savedPatient.name ||
          savedPatient.patientName ||
          savedPatient.patient_name ||
          "",

        patient_id:
          savedPatient.id ||
          savedPatient.patient_id ||
          savedPatient.patientId ||
          "",

        age:
          savedPatient.age ??
          savedPatient.patientAge ??
          "",

        gender:
          savedPatient.gender ||
          savedPatient.sex ||
          savedPatient.patientGender ||
          "",

        mobile:
          savedPatient.mobile ||
          savedPatient.phone ||
          savedPatient.phoneNumber ||
          "",

        doctor:
          savedPatient.doctor ||
          savedPatient.referring_doctor ||
          savedPatient.referringDoctor ||
          savedPatient.refDoctor ||
          "",
      };

      setPatient(normalizedPatient);

      // -----------------------------------------------------
      // RESULTS
      // -----------------------------------------------------

      const savedResults =
        reportData.results ||
        reportData.result ||
        reportData.testResults ||
        {};

      setResults(
        savedResults && typeof savedResults === "object"
          ? savedResults
          : {}
      );

      // -----------------------------------------------------
      // TESTS
      // -----------------------------------------------------

      const savedTests =
        reportData.selectedTests ||
        reportData.tests ||
        reportData.investigations ||
        [];

      const normalizedTests = normalizeTests(savedTests);

      console.log(
        "EDIT PAGE - NORMALIZED TESTS:",
        normalizedTests
      );

      setTests(normalizedTests);
    } catch (error) {
      console.error("LOAD REPORT ERROR:", error);

      setErrorMessage(
        error?.message ||
          "Report load nahi hui."
      );
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------
  // NORMALIZE TESTS
  // ---------------------------------------------------------

  function normalizeTests(input) {
    if (!input) {
      return [];
    }

    let list = [];

    // Array
    if (Array.isArray(input)) {
      list = input;
    }

    // Object containing selectedTests
    else if (
      typeof input === "object" &&
      Array.isArray(input.selectedTests)
    ) {
      list = input.selectedTests;
    }

    // Object containing tests
    else if (
      typeof input === "object" &&
      Array.isArray(input.tests)
    ) {
      list = input.tests;
    }

    // Single test object
    else if (typeof input === "object") {
      list = [input];
    }

    return list.map((test, index) => {
      // -----------------------------------------------------
      // TEST PARAMETER ARRAY
      // -----------------------------------------------------

      let parameters = [];

      if (Array.isArray(test?.tests)) {
        parameters = test.tests;
      } else if (Array.isArray(test?.parameters)) {
        parameters = test.parameters;
      } else if (Array.isArray(test?.items)) {
        parameters = test.items;
      } else if (Array.isArray(test?.investigations)) {
        parameters = test.investigations;
      } else if (Array.isArray(test?.fields)) {
        parameters = test.fields;
      }

      // -----------------------------------------------------
      // SOME DATA MAY STORE ONE PARAMETER DIRECTLY
      // -----------------------------------------------------

      if (
        parameters.length === 0 &&
        (
          test?.parameter ||
          test?.parameterName ||
          test?.result !== undefined ||
          test?.value !== undefined
        )
      ) {
        parameters = [
          {
            id:
              test.parameterId ||
              test.id ||
              `parameter-${index}`,

            name:
              test.parameter ||
              test.parameterName ||
              test.name ||
              "Investigation",

            result:
              test.result ??
              test.value ??
              "",

            value:
              test.value ??
              test.result ??
              "",

            unit:
              test.unit ||
              "",

            range:
              test.range ||
              test.referenceRange ||
              test.reference ||
              "",
          },
        ];
      }

      // -----------------------------------------------------
      // NORMALIZE EVERY PARAMETER
      // -----------------------------------------------------

      parameters = parameters.map(
        (parameter, parameterIndex) => {
          if (
            typeof parameter === "string"
          ) {
            return {
              id: `${index}-${parameterIndex}`,
              name: parameter,
              unit: "",
              range: "",
              result: "",
            };
          }

          const p = parameter || {};

          return {
            ...p,

            id:
              p.id ||
              p.parameterId ||
              p.parameter_id ||
              `${index}-${parameterIndex}`,

            name:
              p.name ||
              p.parameterName ||
              p.parameter_name ||
              p.parameter ||
              "Investigation",

            unit:
              p.unit ||
              p.units ||
              "",

            range:
              p.range ||
              p.referenceRange ||
              p.reference_range ||
              p.reference ||
              (
                p.min !== undefined &&
                p.max !== undefined
                  ? `${p.min} - ${p.max}`
                  : ""
              ),

            result:
              p.result ??
              p.value ??
              "",
          };
        }
      );

      return {
        ...test,

        id:
          test?.id ||
          test?.testId ||
          `test-${index}`,

        name:
          test?.name ||
          test?.testName ||
          test?.test_name ||
          test?.title ||
          "Investigation",

        tests: parameters,
      };
    });
  }

  // ---------------------------------------------------------
  // FIND EXISTING RESULT
  // ---------------------------------------------------------

  function getResultValue(
    test,
    parameter,
    testIndex,
    parameterIndex
  ) {
    const parameterId =
      parameter?.id ||
      parameter?.parameterId ||
      parameter?.parameter_id ||
      "";

    const testId =
      test?.id ||
      test?.testId ||
      `test-${testIndex}`;

    const parameterName =
      parameter?.name ||
      parameter?.parameterName ||
      parameter?.parameter ||
      "";

    const possibleKeys = [
      `${testId}-${parameterName}-${parameterIndex}`,

      `${testId}-${parameterId}`,

      parameterId,

      parameterName,

      `${testIndex}-${parameterIndex}`,

      `${testIndex}-${parameterName}`,

      `${test?.name || test?.testName}-${parameterName}`,
    ];

    for (const key of possibleKeys) {
      if (
        key &&
        results &&
        Object.prototype.hasOwnProperty.call(
          results,
          key
        )
      ) {
        return results[key];
      }
    }

    // Saved result directly inside parameter
    if (parameter?.result !== undefined) {
      return parameter.result;
    }

    if (parameter?.value !== undefined) {
      return parameter.value;
    }

    return "";
  }

  // ---------------------------------------------------------
  // UPDATE PATIENT
  // ---------------------------------------------------------

  function updatePatient(field, value) {
    setPatient((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // ---------------------------------------------------------
  // UPDATE RESULT
  // ---------------------------------------------------------

  function updateResult(
    test,
    parameter,
    testIndex,
    parameterIndex,
    value
  ) {
    const testId =
      test?.id ||
      test?.testId ||
      `test-${testIndex}`;

    const parameterId =
      parameter?.id ||
      parameter?.parameterId ||
      parameter?.parameter_id ||
      "";

    const parameterName =
      parameter?.name ||
      parameter?.parameterName ||
      parameter?.parameter ||
      "";

    // Keep the same key format used by the Report View
    const primaryKey =
      `${testId}-${parameterName}-${parameterIndex}`;

    setResults((previous) => ({
      ...previous,

      [primaryKey]: value,

      // Also maintain parameter ID key
      ...(parameterId
        ? {
            [parameterId]: value,
          }
        : {}),
    }));
  }

  // ---------------------------------------------------------
  // GET REFERENCE
  // ---------------------------------------------------------

  function getReference(parameter) {
    if (!parameter) return "-";

    if (parameter.range) {
      return parameter.range;
    }

    if (parameter.referenceRange) {
      return parameter.referenceRange;
    }

    if (parameter.reference_range) {
      return parameter.reference_range;
    }

    if (parameter.reference) {
      return parameter.reference;
    }

    if (
      parameter.min !== undefined &&
      parameter.max !== undefined
    ) {
      return `${parameter.min} - ${parameter.max}`;
    }

    return "-";
  }

  // ---------------------------------------------------------
  // GET UNIT
  // ---------------------------------------------------------

  function getUnit(parameter) {
    return (
      parameter?.unit ||
      parameter?.units ||
      "-"
    );
  }

  // ---------------------------------------------------------
  // SAVE CHANGES
  // ---------------------------------------------------------

  async function saveChanges() {
    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (!report) {
        throw new Error("Report available nahi hai.");
      }

      // -----------------------------------------------------
      // CREATE UPDATED PATIENT OBJECT
      // -----------------------------------------------------

      const oldReportData =
        report.report_data || {};

      const oldPatient =
        oldReportData.patient ||
        oldReportData.patientData ||
        {};

      const updatedPatient = {
        ...oldPatient,

        name: patient.name,

        patientName: patient.name,

        id: patient.patient_id,

        patient_id: patient.patient_id,

        patientId: patient.patient_id,

        age: patient.age,

        gender: patient.gender,

        sex: patient.gender,

        mobile: patient.mobile,

        phone: patient.mobile,

        doctor: patient.doctor,

        referring_doctor: patient.doctor,

        referringDoctor: patient.doctor,
      };

      // -----------------------------------------------------
      // UPDATE PARAMETERS TOO
      // -----------------------------------------------------
      //
      // This is important because some reports may have saved
      // values inside parameter objects rather than results.
      //

      const updatedTests = tests.map(
        (test, testIndex) => {
          const updatedParameters =
            Array.isArray(test.tests)
              ? test.tests.map(
                  (
                    parameter,
                    parameterIndex
                  ) => {
                    const value =
                      getResultValue(
                        test,
                        parameter,
                        testIndex,
                        parameterIndex
                      );

                    return {
                      ...parameter,

                      result: value,

                      value: value,
                    };
                  }
                )
              : [];

          return {
            ...test,

            tests: updatedParameters,
          };
        }
      );

      // -----------------------------------------------------
      // KEEP ALL OLD REPORT DATA
      // -----------------------------------------------------

      const updatedReportData = {
        ...oldReportData,

        patient: updatedPatient,

        selectedTests: updatedTests,

        results: results,
      };

      console.log(
        "UPDATING REPORT DATA:",
        updatedReportData
      );

      // -----------------------------------------------------
      // SUPABASE UPDATE
      // -----------------------------------------------------

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
        "REPORT UPDATED:",
        data
      );

      setSuccessMessage(
        "Report successfully update ho gayi."
      );

      // Small delay so user can see success
      setTimeout(() => {
        router.push(`/reports/${reportId}`);
        router.refresh();
      }, 500);
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

  // ---------------------------------------------------------
  // CANCEL
  // ---------------------------------------------------------

  function cancelEdit() {
    router.push(`/reports/${reportId}`);
  }

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingCardStyle}>
          <h3>Report loading...</h3>
          <p>Please wait.</p>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------
  // ERROR
  // ---------------------------------------------------------

  if (errorMessage && !report) {
    return (
      <main style={pageStyle}>
        <div style={errorCardStyle}>
          <h2>Report nahi mili</h2>

          <p>{errorMessage}</p>

          <button
            onClick={() => router.push("/reports")}
            style={buttonStyle}
          >
            ← Back to Reports
          </button>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------
  // PAGE
  // ---------------------------------------------------------

  return (
    <main style={pageStyle}>
      {/* =====================================================
          TOP BAR
      ====================================================== */}

      <div style={topBarStyle}>
        <div>
          <h2 style={{ margin: 0 }}>
            Edit Laboratory Report
          </h2>

          <div
            style={{
              fontSize: "12px",
              color: "#0d746d",
              marginTop: "3px",
              fontWeight: "600",
            }}
          >
            NIDAN PATHOLOGY LAB
          </div>
        </div>

        <div style={actionGroupStyle}>
          <button
            onClick={cancelEdit}
            disabled={saving}
            style={secondaryButtonStyle}
          >
            ← Cancel
          </button>

          <button
            onClick={saveChanges}
            disabled={saving}
            style={primaryButtonStyle}
          >
            {saving
              ? "Saving..."
              : "💾 Save Changes"}
          </button>
        </div>
      </div>

      {/* =====================================================
          MESSAGES
      ====================================================== */}

      {errorMessage && (
        <div style={errorMessageStyle}>
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      {successMessage && (
        <div style={successMessageStyle}>
          {successMessage}
        </div>
      )}

      {/* =====================================================
          PATIENT INFORMATION
      ====================================================== */}

      <section style={sectionStyle}>
        <SectionTitle>
          Patient Information
        </SectionTitle>

        <div style={patientGridStyle}>
          <InputField
            label="Patient Name"
            value={patient.name}
            onChange={(value) =>
              updatePatient("name", value)
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
              updatePatient("age", value)
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
      ====================================================== */}

      <section style={sectionStyle}>
        <SectionTitle>
          Investigation Results
        </SectionTitle>

        {tests.length === 0 ? (
          <div style={emptyStyle}>
            <strong>
              No investigations found.
            </strong>

            <p>
              Saved report में test data नहीं मिला।
            </p>
          </div>
        ) : (
          tests.map(
            (test, testIndex) => (
              <div
                key={
                  test.id ||
                  `test-${testIndex}`
                }
                style={testCardStyle}
              >
                {/* TEST TITLE */}

                <div style={testTitleStyle}>
                  {test.name ||
                    test.testName ||
                    "Investigation"}
                </div>

                {/* TEST TABLE */}

                <div
                  style={{
                    overflowX: "auto",
                    width: "100%",
                  }}
                >
                  <table
                    style={tableStyle}
                  >
                    <thead>
                      <tr>
                        <th
                          style={
                            headStyle
                          }
                        >
                          Investigation
                        </th>

                        <th
                          style={{
                            ...headStyle,
                            minWidth:
                              "220px",
                          }}
                        >
                          Result
                        </th>

                        <th
                          style={
                            headStyle
                          }
                        >
                          Unit
                        </th>

                        <th
                          style={
                            headStyle
                          }
                        >
                          Reference Range
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {Array.isArray(
                        test.tests
                      ) &&
                      test.tests.length >
                        0 ? (
                        test.tests.map(
                          (
                            parameter,
                            parameterIndex
                          ) => {
                            const value =
                              getResultValue(
                                test,
                                parameter,
                                testIndex,
                                parameterIndex
                              );

                            return (
                              <tr
                                key={
                                  parameter.id ||
                                  `${testIndex}-${parameterIndex}`
                                }
                              >
                                <td
                                  style={
                                    cellStyle
                                  }
                                >
                                  <strong>
                                    {parameter.name ||
                                      parameter.parameterName ||
                                      parameter.parameter ||
                                      "-"}
                                  </strong>
                                </td>

                                <td
                                  style={
                                    cellStyle
                                  }
                                >
                                  <input
                                    type="text"
                                    value={
                                      value ??
                                      ""
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateResult(
                                        test,
                                        parameter,
                                        testIndex,
                                        parameterIndex,
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    placeholder="Enter result"
                                    style={
                                      resultInputStyle
                                    }
                                  />
                                </td>

                                <td
                                  style={
                                    cellStyle
                                  }
                                >
                                  {getUnit(
                                    parameter
                                  )}
                                </td>

                                <td
                                  style={
                                    cellStyle
                                  }
                                >
                                  {getReference(
                                    parameter
                                  )}
                                </td>
                              </tr>
                            );
                          }
                        )
                      ) : (
                        <tr>
                          <td
                            style={
                              cellStyle
                            }
                          >
                            {test.parameter ||
                              test.name ||
                              "-"}
                          </td>

                          <td
                            style={
                              cellStyle
                            }
                          >
                            <input
                              type="text"
                              value={
                                getResultValue(
                                  test,
                                  test,
                                  testIndex,
                                  0
                                ) ?? ""
                              }
                              onChange={(
                                event
                              ) =>
                                updateResult(
                                  test,
                                  test,
                                  testIndex,
                                  0,
                                  event.target
                                    .value
                                )
                              }
                              placeholder="Enter result"
                              style={
                                resultInputStyle
                              }
                            />
                          </td>

                          <td
                            style={
                              cellStyle
                            }
                          >
                            {test.unit ||
                              "-"}
                          </td>

                          <td
                            style={
                              cellStyle
                            }
                          >
                            {test.range ||
                              test.referenceRange ||
                              "-"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )
        )}
      </section>

      {/* =====================================================
          BOTTOM SAVE BAR
      ====================================================== */}

      <div
        style={{
          ...bottomBarStyle,
          marginBottom: "30px",
        }}
      >
        <button
          onClick={cancelEdit}
          disabled={saving}
          style={secondaryButtonStyle}
        >
          Cancel
        </button>

        <button
          onClick={saveChanges}
          disabled={saving}
          style={primaryButtonStyle}
        >
          {saving
            ? "Saving..."
            : "💾 Save Changes"}
        </button>
      </div>

      {/* =====================================================
          DEBUG INFO
          Hidden in normal UI, useful in browser console
      ====================================================== */}

      <div
        style={{
          display: "none",
        }}
      >
        <pre>
          {JSON.stringify(
            {
              reportId,
              patient,
              tests,
              results,
            },
            null,
            2
          )}
        </pre>
      </div>
    </main>
  );
}

// ============================================================
// INPUT COMPONENT
// ============================================================

function InputField({
  label,
  value,
  onChange,
}) {
  return (
    <label style={inputLabelStyle}>
      <span>{label}</span>

      <input
        type="text"
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={inputStyle}
      />
    </label>
  );
}

// ============================================================
// SECTION TITLE
// ============================================================

function SectionTitle({ children }) {
  return (
    <div style={sectionTitleStyle}>
      {children}
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const pageStyle = {
  minHeight: "100vh",
  background: "#eef4f7",
  padding: "14px",
  boxSizing: "border-box",
  fontFamily:
    "Arial, Helvetica, sans-serif",
  color: "#263238",
};

const topBarStyle = {
  maxWidth: "1100px",
  margin: "0 auto 12px",
  background: "#ffffff",
  borderRadius: "8px",
  padding: "12px 14px",
  boxShadow:
    "0 2px 8px rgba(0,0,0,0.08)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const actionGroupStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const sectionStyle = {
  maxWidth: "1100px",
  margin: "0 auto 12px",
  background: "#ffffff",
  borderRadius: "8px",
  padding: "14px",
  boxShadow:
    "0 2px 8px rgba(0,0,0,0.07)",
};

const sectionTitleStyle = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#147c75",
  borderBottom:
    "2px solid #147c75",
  paddingBottom: "8px",
  marginBottom: "14px",
};

const patientGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
};

const inputLabelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  fontSize: "12px",
  fontWeight: "600",
  color: "#4d5a60",
};

const inputStyle = {
  width: "100%",
  minHeight: "40px",
  boxSizing: "border-box",
  border:
    "1px solid #cfd8dc",
  borderRadius: "5px",
  padding: "8px 10px",
  fontSize: "14px",
  outline: "none",
  background: "#ffffff",
};

const resultInputStyle = {
  width: "100%",
  minHeight: "36px",
  boxSizing: "border-box",
  border:
    "1px solid #cfd8dc",
  borderRadius: "4px",
  padding: "7px 9px",
  fontSize: "14px",
  background: "#fffdf5",
};

const testCardStyle = {
  marginBottom: "18px",
  border:
    "1px solid #d9e2e5",
  borderRadius: "6px",
  overflow: "hidden",
};

const testTitleStyle = {
  background: "#e3f3f1",
  borderLeft:
    "4px solid #147c75",
  padding: "10px 12px",
  fontWeight: "700",
  color: "#176e68",
  fontSize: "15px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "650px",
};

const headStyle = {
  padding: "9px 8px",
  border:
    "1px solid #d5dee2",
  background: "#edf4f6",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: "700",
  color: "#263238",
};

const cellStyle = {
  padding: "8px",
  border:
    "1px solid #dce3e6",
  verticalAlign: "middle",
  fontSize: "12px",
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: "5px",
  background: "#087f78",
  color: "#ffffff",
  padding: "9px 15px",
  fontWeight: "700",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  border:
    "1px solid #b8c4c8",
  borderRadius: "5px",
  background: "#ffffff",
  color: "#263238",
  padding: "9px 15px",
  fontWeight: "600",
  cursor: "pointer",
};

const buttonStyle = {
  border:
    "1px solid #b8c4c8",
  borderRadius: "5px",
  background: "#ffffff",
  padding: "9px 15px",
  cursor: "pointer",
};

const bottomBarStyle = {
  maxWidth: "1100px",
  margin: "0 auto",
  background: "#ffffff",
  borderRadius: "8px",
  padding: "12px",
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
  boxShadow:
    "0 2px 8px rgba(0,0,0,0.07)",
};

const loadingCardStyle = {
  maxWidth: "600px",
  margin: "50px auto",
  background: "#ffffff",
  padding: "30px",
  borderRadius: "8px",
  textAlign: "center",
};

const errorCardStyle = {
  maxWidth: "600px",
  margin: "50px auto",
  background: "#ffffff",
  padding: "30px",
  borderRadius: "8px",
};

const emptyStyle = {
  padding: "20px",
  border:
    "1px dashed #b9c7cb",
  borderRadius: "6px",
  background: "#f8fbfc",
};

const errorMessageStyle = {
  maxWidth: "1100px",
  margin: "0 auto 12px",
  padding: "10px 12px",
  borderRadius: "6px",
  background: "#fdecec",
  border:
    "1px solid #efb7b7",
  color: "#a32626",
  fontSize: "13px",
};

const successMessageStyle = {
  maxWidth: "1100px",
  margin: "0 auto 12px",
  padding: "10px 12px",
  borderRadius: "6px",
  background: "#e9f8f1",
  border:
    "1px solid #a9ddc3",
  color: "#176b46",
  fontSize: "13px",
};
