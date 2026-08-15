"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

export default function EditReportPage() {
  const params = useParams();
  const router = useRouter();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [patient, setPatient] = useState({
    name: "",
    age: "",
    gender: "",
    mobile: "",
    doctor: "",
    patient_id: "",
  });

  const [tests, setTests] = useState([]);
  const [results, setResults] = useState({});


  /* =====================================================
     LOAD REPORT
  ===================================================== */

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

      if (error) {
        throw error;
      }

      console.log("EDIT REPORT:", data);

      setReport(data);

      const reportData =
        data?.report_data || {};

      /* ================================================
         PATIENT
      ================================================ */

      const savedPatient =
        reportData?.patient ||
        data?.patient ||
        {};

      setPatient({
        name:
          savedPatient?.name ||
          savedPatient?.patientName ||
          data?.patient_name ||
          "",

        age:
          savedPatient?.age ??
          data?.age ??
          "",

        gender:
          savedPatient?.gender ||
          savedPatient?.sex ||
          data?.gender ||
          "",

        mobile:
          savedPatient?.mobile ||
          savedPatient?.mobileNumber ||
          data?.mobile ||
          "",

        doctor:
          savedPatient?.doctor ||
          savedPatient?.referring_doctor ||
          data?.doctor ||
          "",

        patient_id:
          savedPatient?.id ||
          savedPatient?.patient_id ||
          savedPatient?.patientId ||
          data?.patient_id ||
          "",
      });


      /* ================================================
         TESTS
      ================================================ */

      const savedTests =
        Array.isArray(
          reportData?.tests
        )
          ? reportData.tests
          : Array.isArray(
              reportData?.selectedTests
            )
          ? reportData.selectedTests
          : Array.isArray(
              reportData?.reportTests
            )
          ? reportData.reportTests
          : Array.isArray(
              data?.tests
            )
          ? data.tests
          : Array.isArray(
              data?.selectedTests
            )
          ? data.selectedTests
          : [];

      setTests(savedTests);


      /* ================================================
         RESULTS
      ================================================ */

      const savedResults =
        reportData?.results &&
        typeof reportData.results === "object"
          ? reportData.results
          : {};

      setResults(savedResults);

    } catch (error) {

      console.error(
        "Edit report load error:",
        error
      );

      setErrorMessage(
        error?.message ||
        "Report load nahi hui."
      );

    } finally {

      setLoading(false);

    }
  }


  /* =====================================================
     GET PARAMETERS
  ===================================================== */

  function getParameters(test) {
    if (!test) {
      return [];
    }

    if (
      Array.isArray(test.parameters)
    ) {
      return test.parameters;
    }

    if (
      Array.isArray(test.tests)
    ) {
      return test.tests;
    }

    if (
      Array.isArray(test.items)
    ) {
      return test.items;
    }

    if (
      Array.isArray(test.investigations)
    ) {
      return test.investigations;
    }

    return [];
  }


  /* =====================================================
     PARAMETER NAME
  ===================================================== */

  function getParameterName(parameter) {
    if (
      typeof parameter === "string"
    ) {
      return parameter;
    }

    return (
      parameter?.name ||
      parameter?.parameterName ||
      parameter?.parameter_name ||
      parameter?.testName ||
      parameter?.test_name ||
      parameter?.investigation ||
      parameter?.title ||
      ""
    );
  }


  /* =====================================================
     TEST ID
  ===================================================== */

  function getTestId(
    test,
    testIndex
  ) {
    return (
      test?.id ||
      test?.testId ||
      test?.test_id ||
      test?.code ||
      `test-${testIndex}`
    );
  }


  /* =====================================================
     GET EXISTING RESULT
  ===================================================== */

  function getExistingResult(
    test,
    parameter,
    parameterIndex,
    testIndex
  ) {
    const testId =
      getTestId(
        test,
        testIndex
      );

    const parameterName =
      getParameterName(
        parameter
      );

    const parameterId =
      parameter?.id ||
      parameter?.parameterId ||
      parameter?.parameter_id ||
      "";

    const keys = [
      parameterId,

      `${testId}-${parameterName}-${parameterIndex}`,

      `${testId}-${parameterName}`,

      `${testId}-${parameterId}`,

      `${testIndex}-${parameterName}-${parameterIndex}`,

      `${testIndex}-${parameterName}`,

      `${testIndex}_${parameterIndex}`,

      `${testIndex}-${parameterIndex}`,

      parameterName,
    ].filter(Boolean);


    for (
      const key of keys
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          results,
          key
        )
      ) {
        return results[key];
      }
    }


    /* Parameter's own saved value */

    if (
      parameter?.result !== undefined &&
      parameter?.result !== null
    ) {
      return parameter.result;
    }

    if (
      parameter?.value !== undefined &&
      parameter?.value !== null
    ) {
      return parameter.value;
    }

    return "";
  }


  /* =====================================================
     CHANGE RESULT
  ===================================================== */

  function updateResult(
    test,
    parameter,
    parameterIndex,
    testIndex,
    value
  ) {
    const testId =
      getTestId(
        test,
        testIndex
      );

    const parameterName =
      getParameterName(
        parameter
      );

    const parameterId =
      parameter?.id ||
      parameter?.parameterId ||
      parameter?.parameter_id ||
      "";

    /*
     Primary key format used by report page
    */

    const key =
      `${testId}-${parameterName}-${parameterIndex}`;

    setResults(
      (previous) => ({
        ...previous,

        [key]: value,

        /*
         Also store parameter ID
         when available.
        */

        ...(parameterId
          ? {
              [parameterId]:
                value,
            }
          : {}),
      })
    );
  }


  /* =====================================================
     SAVE REPORT
  ===================================================== */

  async function saveReport() {
    try {
      setSaving(true);
      setErrorMessage("");

      const oldData =
        report?.report_data || {};

      const newReportData = {
        ...oldData,

        patient: {
          ...(oldData?.patient || {}),

          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          mobile: patient.mobile,
          doctor: patient.doctor,
          patient_id:
            patient.patient_id,
        },

        /*
         Preserve original selected tests.
        */

        selectedTests:
          oldData?.selectedTests ||
          tests,

        /*
         Also keep tests.
        */

        tests: tests,

        /*
         UPDATED RESULTS
        */

        results: results,
      };


      const { error } =
        await supabase
          .from("reports")
          .update({
            report_data:
              newReportData,
          })
          .eq(
            "id",
            params.id
          );


      if (error) {
        throw error;
      }


      alert(
        "Report successfully update ho gayi."
      );


      /*
       Return to report view
      */

      router.push(
        `/reports/${encodeURIComponent(
          params.id
        )}`
      );

      router.refresh();

    } catch (error) {

      console.error(
        "Save report error:",
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


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main style={pageStyle}>

        <div style={cardStyle}>

          <h2>
            Report loading...
          </h2>

          <p>
            Saved report load ho rahi hai.
          </p>

        </div>

      </main>
    );
  }


  /* =====================================================
     ERROR
  ===================================================== */

  if (
    errorMessage ||
    !report
  ) {
    return (
      <main style={pageStyle}>

        <div style={cardStyle}>

          <h2>
            Report nahi mili
          </h2>

          <p>
            {errorMessage}
          </p>

          <button
            onClick={() =>
              router.push(
                "/reports"
              )
            }
            style={buttonStyle}
          >
            ← Back to Reports
          </button>

        </div>

      </main>
    );
  }


  /* =====================================================
     UI
  ===================================================== */

  return (
    <main style={pageStyle}>

      {/* HEADER */}

      <div style={headerStyle}>

        <div>

          <h1 style={titleStyle}>
            Edit Laboratory Report
          </h1>

          <p style={subtitleStyle}>
            NIDAN PATHOLOGY LAB
          </p>

        </div>


        <div
          style={{
            display: "flex",
            gap: "8px",
          }}
        >

          <button
            onClick={() =>
              router.push(
                `/reports/${encodeURIComponent(
                  params.id
                )}`
              )
            }
            style={buttonStyle}
          >
            ← Cancel
          </button>


          <button
            onClick={saveReport}
            disabled={saving}
            style={saveButtonStyle}
          >
            {saving
              ? "Saving..."
              : "💾 Save Changes"}
          </button>

        </div>

      </div>


      {/* ERROR */}

      {errorMessage && (
        <div style={errorStyle}>
          {errorMessage}
        </div>
      )}


      {/* PATIENT */}

      <section style={sectionStyle}>

        <h2 style={sectionTitleStyle}>
          Patient Information
        </h2>


        <div style={gridStyle}>

          <Field
            label="Patient Name"
            value={patient.name}
            onChange={(value) =>
              setPatient({
                ...patient,
                name: value,
              })
            }
          />


          <Field
            label="Patient ID"
            value={patient.patient_id}
            onChange={(value) =>
              setPatient({
                ...patient,
                patient_id: value,
              })
            }
          />


          <Field
            label="Age"
            value={patient.age}
            onChange={(value) =>
              setPatient({
                ...patient,
                age: value,
              })
            }
          />


          <Field
            label="Gender / Sex"
            value={patient.gender}
            onChange={(value) =>
              setPatient({
                ...patient,
                gender: value,
              })
            }
          />


          <Field
            label="Mobile"
            value={patient.mobile}
            onChange={(value) =>
              setPatient({
                ...patient,
                mobile: value,
              })
            }
          />


          <Field
            label="Referring Doctor"
            value={patient.doctor}
            onChange={(value) =>
              setPatient({
                ...patient,
                doctor: value,
              })
            }
          />

        </div>

      </section>


      {/* TESTS */}

      <section style={sectionStyle}>

        <h2 style={sectionTitleStyle}>
          Investigation Results
        </h2>


        {tests.length === 0 ? (

          <div
            style={{
              padding: "30px",
              textAlign: "center",
              color: "#667085",
            }}
          >
            No investigations available.
          </div>

        ) : (

          tests.map(
            (
              test,
              testIndex
            ) => {

              const parameters =
                getParameters(
                  test
                );

              const testName =
                test?.name ||
                test?.testName ||
                test?.test_name ||
                test?.title ||
                "Investigation";

              return (

                <div
                  key={
                    getTestId(
                      test,
                      testIndex
                    )
                  }
                  style={{
                    marginBottom:
                      "30px",
                  }}
                >

                  <h3
                    style={{
                      margin:
                        "0 0 12px",
                      padding:
                        "10px 12px",
                      background:
                        "#e9f7f4",
                      color:
                        "#087f72",
                      borderLeft:
                        "4px solid #087f72",
                    }}
                  >
                    {testName}
                  </h3>


                  {parameters.length === 0 ? (

                    <div
                      style={{
                        border:
                          "1px solid #ddd",
                        padding: "15px",
                      }}
                    >

                      <Field
                        label="Result"
                        value={
                          getExistingResult(
                            test,
                            test,
                            0,
                            testIndex
                          )
                        }
                        onChange={(value) =>
                          updateResult(
                            test,
                            test,
                            0,
                            testIndex,
                            value
                          )
                        }
                      />

                    </div>

                  ) : (

                    <div
                      style={{
                        overflowX:
                          "auto",
                      }}
                    >

                      <table
                        style={tableStyle}
                      >

                        <thead>

                          <tr>

                            <th
                              style={thStyle}
                            >
                              Investigation
                            </th>

                            <th
                              style={thStyle}
                            >
                              Result
                            </th>

                            <th
                              style={thStyle}
                            >
                              Unit
                            </th>

                            <th
                              style={thStyle}
                            >
                              Reference Range
                            </th>

                          </tr>

                        </thead>


                        <tbody>

                          {parameters.map(
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

                              const name =
                                getParameterName(
                                  parameter
                                );

                              const unit =
                                parameter?.unit ||
                                parameter?.units ||
                                "-";

                              const reference =
                                parameter?.range ||
                                parameter?.referenceRange ||
                                parameter?.reference ||
                                (
                                  parameter?.min !== undefined &&
                                  parameter?.max !== undefined
                                )
                                  ? `${parameter.min} - ${parameter.max}`
                                  : "-";

                              return (

                                <tr
                                  key={
                                    `${name}-${parameterIndex}`
                                  }
                                >

                                  <td
                                    style={tdStyle}
                                  >
                                    <strong>
                                      {name ||
                                        "-"}
                                    </strong>
                                  </td>


                                  <td
                                    style={tdStyle}
                                  >

                                    <input
                                      value={
                                        value ??
                                        ""
                                      }
                                      onChange={(e) =>
                                        updateResult(
                                          test,
                                          parameter,
                                          parameterIndex,
                                          testIndex,
                                          e.target.value
                                        )
                                      }
                                      style={
                                        resultInputStyle
                                      }
                                      placeholder="Enter result"
                                    />

                                  </td>


                                  <td
                                    style={tdStyle}
                                  >
                                    {unit}
                                  </td>


                                  <td
                                    style={tdStyle}
                                  >
                                    {reference}
                                  </td>

                                </tr>

                              );
                            }
                          )}

                        </tbody>

                      </table>

                    </div>

                  )}

                </div>

              );
            }
          )

        )}

      </section>


      {/* SAVE BOTTOM */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "flex-end",
          gap: "10px",
          marginTop: "20px",
        }}
      >

        <button
          onClick={() =>
            router.push(
              `/reports/${encodeURIComponent(
                params.id
              )}`
            )
          }
          style={buttonStyle}
        >
          Cancel
        </button>


        <button
          onClick={saveReport}
          disabled={saving}
          style={saveButtonStyle}
        >
          {saving
            ? "Saving..."
            : "💾 Save Changes"}
        </button>

      </div>


    </main>
  );
}


/* =========================================================
   FIELD COMPONENT
========================================================= */

function Field({
  label,
  value,
  onChange,
}) {
  return (
    <div>

      <label
        style={{
          display: "block",
          marginBottom: "5px",
          fontSize: "12px",
          fontWeight: "700",
          color: "#344054",
        }}
      >
        {label}
      </label>

      <input
        value={
          value ?? ""
        }
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        style={{
          width: "100%",
          padding: "10px 12px",
          border:
            "1px solid #cfd8e3",
          borderRadius: "6px",
          outline: "none",
          fontSize: "13px",
          background: "white",
        }}
      />

    </div>
  );
}


/* =========================================================
   STYLES
========================================================= */

const pageStyle = {
  minHeight: "100vh",
  padding: "20px",
  background: "#eef3f8",
};

const cardStyle = {
  maxWidth: "500px",
  margin: "50px auto",
  padding: "30px",
  background: "white",
  borderRadius: "10px",
  boxShadow:
    "0 5px 25px rgba(0,0,0,.08)",
};

const headerStyle = {
  maxWidth: "1000px",
  margin: "0 auto 15px",
  padding: "15px",
  background: "white",
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent:
    "space-between",
  gap: "15px",
  flexWrap: "wrap",
  boxShadow:
    "0 2px 10px rgba(0,0,0,.05)",
};

const titleStyle = {
  margin: 0,
  fontSize: "20px",
  color: "#172033",
};

const subtitleStyle = {
  margin: "4px 0 0",
  fontSize: "12px",
  color: "#087f72",
  fontWeight: "700",
};

const sectionStyle = {
  maxWidth: "1000px",
  margin: "0 auto 15px",
  padding: "20px",
  background: "white",
  borderRadius: "8px",
  boxShadow:
    "0 2px 10px rgba(0,0,0,.05)",
};

const sectionTitleStyle = {
  margin:
    "0 0 18px",
  paddingBottom:
    "10px",
  borderBottom:
    "2px solid #087f72",
  color: "#087f72",
  fontSize: "17px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(220px,1fr))",
  gap: "15px",
};

const buttonStyle = {
  padding: "10px 15px",
  border:
    "1px solid #b7c1cc",
  borderRadius: "6px",
  background: "white",
  cursor: "pointer",
  fontWeight: "700",
};

const saveButtonStyle = {
  padding: "10px 18px",
  border: "1px solid #087f72",
  borderRadius: "6px",
  background: "#087f72",
  color: "white",
  cursor: "pointer",
  fontWeight: "800",
};

const errorStyle = {
  maxWidth: "1000px",
  margin: "0 auto 15px",
  padding: "12px",
  borderRadius: "6px",
  background: "#fff1f0",
  border:
    "1px solid #f5c8c5",
  color: "#b42318",
};

const tableStyle = {
  width: "100%",
  borderCollapse:
    "collapse",
};

const thStyle = {
  padding: "10px",
  border:
    "1px solid #d5dde5",
  background: "#eef5f7",
  textAlign: "left",
  fontSize: "12px",
};

const tdStyle = {
  padding: "9px",
  border:
    "1px solid #dfe5ea",
  fontSize: "12px",
};

const resultInputStyle = {
  width: "100%",
  minWidth: "100px",
  padding: "8px",
  border:
    "1px solid #c8d2dc",
  borderRadius: "5px",
  fontSize: "13px",
  fontWeight: "700",
  background: "#fffdf5",
};
