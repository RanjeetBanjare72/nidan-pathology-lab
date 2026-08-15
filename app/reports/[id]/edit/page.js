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

  // =========================================================
  // LOAD REPORT
  // =========================================================

  useEffect(() => {
    if (reportId) {
      loadReport();
    }
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
        throw new Error("Report not found.");
      }

      console.log("========== EDIT REPORT ==========");
      console.log("FULL REPORT:", data);
      console.log("REPORT DATA:", data.report_data);

      setReport(data);

      let reportData = data.report_data || {};

      // Sometimes JSON can be stored as a string.
      if (typeof reportData === "string") {
        try {
          reportData = JSON.parse(reportData);
        } catch (e) {
          console.error("REPORT DATA JSON PARSE ERROR:", e);
          reportData = {};
        }
      }

      // -------------------------------------------------------
      // PATIENT
      // -------------------------------------------------------

      const savedPatient = findPatient(reportData, data);

      console.log("FOUND PATIENT:", savedPatient);

      setPatient({
        name:
          savedPatient?.name ??
          savedPatient?.patientName ??
          savedPatient?.patient_name ??
          "",

        patient_id:
          savedPatient?.id ??
          savedPatient?.patient_id ??
          savedPatient?.patientId ??
          "",

        age:
          savedPatient?.age ??
          savedPatient?.patientAge ??
          "",

        gender:
          savedPatient?.gender ??
          savedPatient?.sex ??
          savedPatient?.patientGender ??
          "",

        mobile:
          savedPatient?.mobile ??
          savedPatient?.phone ??
          savedPatient?.phoneNumber ??
          "",

        doctor:
          savedPatient?.doctor ??
          savedPatient?.referring_doctor ??
          savedPatient?.referringDoctor ??
          savedPatient?.refDoctor ??
          "",
      });

      // -------------------------------------------------------
      // RESULTS
      // -------------------------------------------------------

      const savedResults = findResults(reportData);

      console.log("FOUND RESULTS:", savedResults);

      setResults(
        savedResults &&
          typeof savedResults === "object" &&
          !Array.isArray(savedResults)
          ? savedResults
          : {}
      );

      // -------------------------------------------------------
      // TESTS
      // -------------------------------------------------------

      const savedTests = findTestCollection(reportData);

      console.log("FOUND TEST COLLECTION:", savedTests);

      let normalized = normalizeTests(savedTests);

      // -------------------------------------------------------
      // FALLBACK:
      // If selectedTests wasn't found, search the complete
      // report_data recursively.
      // -------------------------------------------------------

      if (normalized.length === 0) {
        normalized = discoverTests(reportData);

        console.log(
          "DISCOVERED TESTS:",
          normalized
        );
      }

      // -------------------------------------------------------
      // FALLBACK:
      // If results contain parameter keys but no test list,
      // construct editable parameters from those keys.
      // -------------------------------------------------------

      if (
        normalized.length === 0 &&
        Object.keys(savedResults || {}).length > 0
      ) {
        normalized = buildTestsFromResults(
          savedResults
        );

        console.log(
          "TESTS BUILT FROM RESULTS:",
          normalized
        );
      }

      setTests(normalized);
    } catch (error) {
      console.error(
        "LOAD REPORT ERROR:",
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

  // =========================================================
  // FIND PATIENT
  // =========================================================

  function findPatient(reportData, fullData) {
    const possible = [
      reportData?.patient,
      reportData?.patientData,
      reportData?.patient_info,
      reportData?.patientInformation,
      fullData?.patient,
    ];

    for (const item of possible) {
      if (
        item &&
        typeof item === "object" &&
        !Array.isArray(item)
      ) {
        return item;
      }
    }

    return {};
  }

  // =========================================================
  // FIND RESULTS
  // =========================================================

  function findResults(reportData) {
    const possible = [
      reportData?.results,
      reportData?.result,
      reportData?.testResults,
      reportData?.investigationResults,
      reportData?.investigation_results,
    ];

    for (const item of possible) {
      if (
        item &&
        typeof item === "object" &&
        !Array.isArray(item)
      ) {
        return item;
      }
    }

    // Recursive search
    const found = recursiveFindObject(
      reportData,
      [
        "results",
        "testResults",
        "investigationResults",
      ]
    );

    return found || {};
  }

  // =========================================================
  // FIND TEST COLLECTION
  // =========================================================

  function findTestCollection(reportData) {
    const possible = [
      reportData?.selectedTests,
      reportData?.tests,
      reportData?.investigations,
      reportData?.selected_tests,
      reportData?.investigationTests,
    ];

    for (const item of possible) {
      if (
        Array.isArray(item) &&
        item.length > 0
      ) {
        return item;
      }

      if (
        item &&
        typeof item === "object"
      ) {
        if (Array.isArray(item.tests)) {
          return item.tests;
        }

        if (Array.isArray(item.selectedTests)) {
          return item.selectedTests;
        }

        if (Array.isArray(item.investigations)) {
          return item.investigations;
        }
      }
    }

    // Recursive search for common collection names
    const found = recursiveFindArray(
      reportData,
      [
        "selectedTests",
        "selected_tests",
        "tests",
        "investigations",
        "investigationTests",
      ]
    );

    return found || [];
  }

  // =========================================================
  // RECURSIVE FIND ARRAY
  // =========================================================

  function recursiveFindArray(
    value,
    wantedKeys,
    depth = 0
  ) {
    if (depth > 10 || value == null) {
      return null;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const found = recursiveFindArray(
          item,
          wantedKeys,
          depth + 1
        );

        if (found) return found;
      }

      return null;
    }

    if (
      typeof value !== "object"
    ) {
      return null;
    }

    for (const key of Object.keys(value)) {
      const current = value[key];

      if (
        wantedKeys.includes(key) &&
        Array.isArray(current) &&
        current.length > 0
      ) {
        return current;
      }

      const found = recursiveFindArray(
        current,
        wantedKeys,
        depth + 1
      );

      if (found) return found;
    }

    return null;
  }

  // =========================================================
  // RECURSIVE FIND OBJECT
  // =========================================================

  function recursiveFindObject(
    value,
    wantedKeys,
    depth = 0
  ) {
    if (depth > 10 || value == null) {
      return null;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const found = recursiveFindObject(
          item,
          wantedKeys,
          depth + 1
        );

        if (found) return found;
      }

      return null;
    }

    if (
      typeof value !== "object"
    ) {
      return null;
    }

    for (const key of Object.keys(value)) {
      const current = value[key];

      if (
        wantedKeys.includes(key) &&
        current &&
        typeof current === "object" &&
        !Array.isArray(current)
      ) {
        return current;
      }

      const found = recursiveFindObject(
        current,
        wantedKeys,
        depth + 1
      );

      if (found) return found;
    }

    return null;
  }

  // =========================================================
  // NORMALIZE TESTS
  // =========================================================

  function normalizeTests(input) {
    if (!input) {
      return [];
    }

    let list = [];

    if (Array.isArray(input)) {
      list = input;
    } else if (
      typeof input === "object"
    ) {
      if (Array.isArray(input.selectedTests)) {
        list = input.selectedTests;
      } else if (Array.isArray(input.tests)) {
        list = input.tests;
      } else if (
        Array.isArray(input.investigations)
      ) {
        list = input.investigations;
      } else {
        list = [input];
      }
    }

    const output = [];

    list.forEach((test, index) => {
      if (!test) return;

      // -------------------------------------------------------
      // If test is a string
      // -------------------------------------------------------

      if (typeof test === "string") {
        output.push({
          id: `test-${index}`,
          name: test,
          tests: [],
          originalTest: test,
        });

        return;
      }

      let parameters = [];

      // Most common structures
      const parameterSources = [
        test.tests,
        test.parameters,
        test.items,
        test.investigations,
        test.fields,
        test.parametersList,
        test.testParameters,
        test.resultFields,
      ];

      for (
        const source of parameterSources
      ) {
        if (
          Array.isArray(source) &&
          source.length > 0
        ) {
          parameters = source;
          break;
        }
      }

      // -------------------------------------------------------
      // Some systems save parameter map as object
      // -------------------------------------------------------

      if (
        parameters.length === 0 &&
        test.parameters &&
        typeof test.parameters === "object" &&
        !Array.isArray(test.parameters)
      ) {
        parameters = Object.entries(
          test.parameters
        ).map(([key, value]) => ({
          id: key,
          name: key,
          result:
            typeof value === "object"
              ? value.result ??
                value.value ??
                ""
              : value,
          unit:
            typeof value === "object"
              ? value.unit || ""
              : "",
          range:
            typeof value === "object"
              ? value.range ||
                value.referenceRange ||
                ""
              : "",
        }));
      }

      // -------------------------------------------------------
      // Direct single parameter
      // -------------------------------------------------------

      if (
        parameters.length === 0 &&
        (
          test.parameter ||
          test.parameterName ||
          test.result !== undefined ||
          test.value !== undefined
        )
      ) {
        parameters = [
          {
            id:
              test.parameterId ||
              test.parameter_id ||
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
              test.units ||
              "",

            range:
              test.range ||
              test.referenceRange ||
              test.reference ||
              "",
          },
        ];
      }

      // -------------------------------------------------------
      // Normalize parameters
      // -------------------------------------------------------

      const normalizedParameters =
        parameters.map(
          (
            parameter,
            parameterIndex
          ) => {
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
                p.id ??
                p.parameterId ??
                p.parameter_id ??
                p.code ??
                `${index}-${parameterIndex}`,

              name:
                p.name ??
                p.parameterName ??
                p.parameter_name ??
                p.parameter ??
                p.title ??
                p.label ??
                "Investigation",

              unit:
                p.unit ??
                p.units ??
                "",

              range:
                p.range ??
                p.referenceRange ??
                p.reference_range ??
                p.reference ??
                p.normalRange ??
                (
                  p.min !== undefined &&
                  p.max !== undefined
                    ? `${p.min} - ${p.max}`
                    : ""
                ),

              result:
                p.result ??
                p.value ??
                p.resultValue ??
                "",
            };
          }
        );

      output.push({
        ...test,

        id:
          test.id ??
          test.testId ??
          test.test_id ??
          `test-${index}`,

        name:
          test.name ??
          test.testName ??
          test.test_name ??
          test.title ??
          test.label ??
          "Investigation",

        tests: normalizedParameters,
      });
    });

    return output;
  }

  // =========================================================
  // DISCOVER TESTS RECURSIVELY
  // =========================================================

  function discoverTests(reportData) {
    const candidates = [];

    function walk(value, depth = 0) {
      if (
        depth > 10 ||
        value == null
      ) {
        return;
      }

      if (Array.isArray(value)) {
        if (
          value.length > 0 &&
          value.some(
            (item) =>
              item &&
              typeof item === "object" &&
              (
                item.parameter ||
                item.parameterName ||
                item.parameters ||
                item.tests ||
                item.items ||
                item.fields
              )
          )
        ) {
          candidates.push(value);
        }

        value.forEach((item) =>
          walk(item, depth + 1)
        );

        return;
      }

      if (
        typeof value !== "object"
      ) {
        return;
      }

      Object.values(value).forEach(
        (child) =>
          walk(child, depth + 1)
      );
    }

    walk(reportData);

    // Try candidates from largest to smallest
    candidates.sort(
      (a, b) => b.length - a.length
    );

    for (const candidate of candidates) {
      const normalized =
        normalizeTests(candidate);

      if (
        normalized.some(
          (test) =>
            Array.isArray(test.tests) &&
            test.tests.length > 0
        )
      ) {
        return normalized;
      }
    }

    return [];
  }

  // =========================================================
  // BUILD TESTS FROM RESULTS
  // =========================================================

  function buildTestsFromResults(
    savedResults
  ) {
    const entries =
      Object.entries(savedResults);

    if (!entries.length) {
      return [];
    }

    const parameters = entries.map(
      ([key, value], index) => ({
        id: key,
        name: extractParameterName(key),
        result: value ?? "",
        value: value ?? "",
        unit: "",
        range: "",
      })
    );

    return [
      {
        id: "saved-results",
        name: "Investigation Results",
        tests: parameters,
      },
    ];
  }

  // =========================================================
  // EXTRACT PARAMETER NAME
  // =========================================================

  function extractParameterName(key) {
    if (!key) return "Investigation";

    const parts = String(key).split("-");

    if (parts.length >= 3) {
      return parts
        .slice(1, -1)
        .join("-");
    }

    return key;
  }

  // =========================================================
  // GET RESULT
  // =========================================================

  function getResultValue(
    test,
    parameter,
    testIndex,
    parameterIndex
  ) {
    const parameterId =
      parameter?.id ??
      parameter?.parameterId ??
      parameter?.parameter_id ??
      "";

    const parameterName =
      parameter?.name ??
      parameter?.parameterName ??
      parameter?.parameter ??
      "";

    const testId =
      test?.id ??
      test?.testId ??
      test?.test_id ??
      `test-${testIndex}`;

    const testName =
      test?.name ??
      test?.testName ??
      test?.test_name ??
      "";

    // Exact key used by your Report View
    const possibleKeys = [
      `${testId}-${parameterName}-${parameterIndex}`,

      `${testId}-${parameterName}`,

      `${testId}-${parameterId}`,

      parameterId,

      parameterName,

      `${testIndex}-${parameterIndex}`,

      `${testIndex}-${parameterName}`,

      `${testName}-${parameterName}`,

      `${testName}-${parameterId}`,
    ];

    for (
      const key of possibleKeys
    ) {
      if (
        key &&
        Object.prototype.hasOwnProperty.call(
          results,
          key
        )
      ) {
        return results[key];
      }
    }

    // Search results key by parameter name
    if (
      parameterName &&
      results &&
      typeof results === "object"
    ) {
      const matchingKey =
        Object.keys(results).find(
          (key) =>
            key
              .toLowerCase()
              .includes(
                String(
                  parameterName
                ).toLowerCase()
              )
        );

      if (matchingKey) {
        return results[matchingKey];
      }
    }

    // Saved directly in parameter
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

    if (
      parameter?.resultValue !== undefined &&
      parameter?.resultValue !== null
    ) {
      return parameter.resultValue;
    }

    return "";
  }

  // =========================================================
  // UPDATE PATIENT
  // =========================================================

  function updatePatient(
    field,
    value
  ) {
    setPatient((old) => ({
      ...old,
      [field]: value,
    }));
  }

  // =========================================================
  // UPDATE RESULT
  // =========================================================

  function updateResult(
    test,
    parameter,
    testIndex,
    parameterIndex,
    value
  ) {
    const testId =
      test?.id ??
      test?.testId ??
      test?.test_id ??
      `test-${testIndex}`;

    const parameterId =
      parameter?.id ??
      parameter?.parameterId ??
      parameter?.parameter_id ??
      "";

    const parameterName =
      parameter?.name ??
      parameter?.parameterName ??
      parameter?.parameter ??
      "";

    const primaryKey =
      `${testId}-${parameterName}-${parameterIndex}`;

    setResults((old) => ({
      ...old,

      [primaryKey]: value,

      ...(parameterId
        ? {
            [parameterId]: value,
          }
        : {}),

      ...(parameterName
        ? {
            [parameterName]: value,
          }
        : {}),
    }));

    // Also immediately update local parameter value
    setTests((oldTests) =>
      oldTests.map(
        (oldTest, ti) => {
          if (ti !== testIndex) {
            return oldTest;
          }

          return {
            ...oldTest,

            tests:
              Array.isArray(
                oldTest.tests
              )
                ? oldTest.tests.map(
                    (
                      oldParameter,
                      pi
                    ) => {
                      if (
                        pi !==
                        parameterIndex
                      ) {
                        return oldParameter;
                      }

                      return {
                        ...oldParameter,
                        result: value,
                        value: value,
                      };
                    }
                  )
                : oldTest.tests,
          };
        }
      )
    );
  }

  // =========================================================
  // PATIENT SAVE OBJECT
  // =========================================================

  function createUpdatedPatient(
    oldPatient
  ) {
    return {
      ...(oldPatient || {}),

      name: patient.name,
      patientName: patient.name,
      patient_name: patient.name,

      id: patient.patient_id,
      patient_id: patient.patient_id,
      patientId: patient.patient_id,

      age: patient.age,
      patientAge: patient.age,

      gender: patient.gender,
      sex: patient.gender,
      patientGender: patient.gender,

      mobile: patient.mobile,
      phone: patient.mobile,
      phoneNumber: patient.mobile,

      doctor: patient.doctor,
      referring_doctor: patient.doctor,
      referringDoctor: patient.doctor,
      refDoctor: patient.doctor,
    };
  }

  // =========================================================
  // SAVE CHANGES
  // =========================================================

  async function saveChanges() {
    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (!report) {
        throw new Error(
          "Report available nahi hai."
        );
      }

      let oldReportData =
        report.report_data || {};

      if (
        typeof oldReportData ===
        "string"
      ) {
        try {
          oldReportData =
            JSON.parse(oldReportData);
        } catch {
          oldReportData = {};
        }
      }

      // -------------------------------------------------------
      // OLD PATIENT
      // -------------------------------------------------------

      const oldPatient =
        oldReportData.patient ||
        oldReportData.patientData ||
        {};

      const updatedPatient =
        createUpdatedPatient(
          oldPatient
        );

      // -------------------------------------------------------
      // UPDATE PARAMETERS WITH CURRENT VALUES
      // -------------------------------------------------------

      const updatedTests =
        tests.map(
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

      // -------------------------------------------------------
      // IMPORTANT:
      // Keep existing report_data.
      // Do NOT delete unrelated data.
      // -------------------------------------------------------

      const updatedReportData = {
        ...oldReportData,

        patient:
          updatedPatient,

        // Keep normalized data for edit/view
        selectedTests:
          updatedTests,

        results: {
          ...(oldReportData.results ||
            oldReportData.result ||
            {}),
          ...results,
        },
      };

      console.log(
        "========== SAVING REPORT =========="
      );

      console.log(
        "UPDATED REPORT DATA:",
        updatedReportData
      );

      const {
        data,
        error,
      } = await supabase
        .from("reports")
        .update({
          report_data:
            updatedReportData,
        })
        .eq("id", reportId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(
        "SAVED REPORT:",
        data
      );

      setSuccessMessage(
        "Report successfully update ho gayi."
      );

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

  // =========================================================
  // CANCEL
  // =========================================================

  function cancelEdit() {
    router.push(
      `/reports/${reportId}`
    );
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main style={pageStyle}>
        <div
          style={loadingCardStyle}
        >
          <h3>
            Report loading...
          </h3>

          <p>
            Please wait.
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (!report) {
    return (
      <main style={pageStyle}>
        <div
          style={errorCardStyle}
        >
          <h2>
            Report nahi mili
          </h2>

          <p>
            {errorMessage ||
              "Report load nahi hui."}
          </p>

          <button
            onClick={() =>
              router.push(
                "/reports"
              )
            }
            style={secondaryButtonStyle}
          >
            ← Back to Reports
          </button>
        </div>
      </main>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main style={pageStyle}>
      {/* TOP BAR */}

      <div
        style={topBarStyle}
      >
        <div>
          <h2
            style={{
              margin: 0,
            }}
          >
            Edit Laboratory Report
          </h2>

          <div
            style={{
              fontSize: "12px",
              color: "#087f78",
              fontWeight: "700",
              marginTop: "3px",
            }}
          >
            NIDAN PATHOLOGY LAB
          </div>
        </div>

        <div
          style={actionGroupStyle}
        >
          <button
            onClick={cancelEdit}
            disabled={saving}
            style={
              secondaryButtonStyle
            }
          >
            ← Cancel
          </button>

          <button
            onClick={saveChanges}
            disabled={saving}
            style={
              primaryButtonStyle
            }
          >
            {saving
              ? "Saving..."
              : "💾 Save Changes"}
          </button>
        </div>
      </div>

      {/* ERROR */}

      {errorMessage && (
        <div
          style={
            errorMessageStyle
          }
        >
          <strong>
            Error:
          </strong>{" "}
          {errorMessage}
        </div>
      )}

      {/* SUCCESS */}

      {successMessage && (
        <div
          style={
            successMessageStyle
          }
        >
          {successMessage}
        </div>
      )}

      {/* PATIENT */}

      <section
        style={sectionStyle}
      >
        <SectionTitle>
          Patient Information
        </SectionTitle>

        <div
          style={
            patientGridStyle
          }
        >
          <InputField
            label="Patient Name"
            value={
              patient.name
            }
            onChange={(value) =>
              updatePatient(
                "name",
                value
              )
            }
          />

          <InputField
            label="Patient ID"
            value={
              patient.patient_id
            }
            onChange={(value) =>
              updatePatient(
                "patient_id",
                value
              )
            }
          />

          <InputField
            label="Age"
            value={
              patient.age
            }
            onChange={(value) =>
              updatePatient(
                "age",
                value
              )
            }
          />

          <InputField
            label="Gender / Sex"
            value={
              patient.gender
            }
            onChange={(value) =>
              updatePatient(
                "gender",
                value
              )
            }
          />

          <InputField
            label="Mobile"
            value={
              patient.mobile
            }
            onChange={(value) =>
              updatePatient(
                "mobile",
                value
              )
            }
          />

          <InputField
            label="Referring Doctor"
            value={
              patient.doctor
            }
            onChange={(value) =>
              updatePatient(
                "doctor",
                value
              )
            }
          />
        </div>
      </section>

      {/* INVESTIGATIONS */}

      <section
        style={sectionStyle}
      >
        <SectionTitle>
          Investigation Results
        </SectionTitle>

        {tests.length === 0 ? (
          <div
            style={emptyStyle}
          >
            <strong>
              No investigations found.
            </strong>

            <p>
              Saved report में
              investigation data
              नहीं मिला।
            </p>

            <p
              style={{
                fontSize: "12px",
                color: "#607d8b",
              }}
            >
              Browser console में
              "FOUND TEST COLLECTION"
              और "DISCOVERED TESTS"
              देखें।
            </p>
          </div>
        ) : (
          tests.map(
            (
              test,
              testIndex
            ) => (
              <div
                key={
                  test.id ||
                  `test-${testIndex}`
                }
                style={
                  testCardStyle
                }
              >
                <div
                  style={
                    testTitleStyle
                  }
                >
                  {test.name ||
                    test.testName ||
                    "Investigation"}
                </div>

                <div
                  style={{
                    overflowX:
                      "auto",
                    width: "100%",
                  }}
                >
                  <table
                    style={
                      tableStyle
                    }
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
                      test.tests
                        .length >
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
                            {test.name ||
                              "Investigation"}
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

      {/* BOTTOM SAVE */}

      <div
        style={{
          ...bottomBarStyle,
          marginBottom:
            "30px",
        }}
      >
        <button
          onClick={cancelEdit}
          disabled={saving}
          style={
            secondaryButtonStyle
          }
        >
          Cancel
        </button>

        <button
          onClick={saveChanges}
          disabled={saving}
          style={
            primaryButtonStyle
          }
        >
          {saving
            ? "Saving..."
            : "💾 Save Changes"}
        </button>
      </div>

      {/* DEBUG - HIDDEN */}

      <pre
        style={{
          display: "none",
        }}
      >
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
    </main>
  );
}

// ============================================================
// INPUT
// ============================================================

function InputField({
  label,
  value,
  onChange,
}) {
  return (
    <label
      style={
        inputLabelStyle
      }
    >
      <span>{label}</span>

      <input
        type="text"
        value={
          value ?? ""
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        style={
          inputStyle
        }
      />
    </label>
  );
}

// ============================================================
// SECTION TITLE
// ============================================================

function SectionTitle({
  children,
}) {
  return (
    <div
      style={
        sectionTitleStyle
      }
    >
      {children}
    </div>
  );
}

// ============================================================
// GET UNIT
// ============================================================

function getUnit(parameter) {
  return (
    parameter?.unit ??
    parameter?.units ??
    "-"
  );
}

// ============================================================
// GET REFERENCE
// ============================================================

function getReference(parameter) {
  if (!parameter) {
    return "-";
  }

  return (
    parameter.range ??
    parameter.referenceRange ??
    parameter.reference_range ??
    parameter.reference ??
    parameter.normalRange ??
    (
      parameter.min !==
        undefined &&
      parameter.max !==
        undefined
        ? `${parameter.min} - ${parameter.max}`
        : "-"
    )
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
  justifyContent:
    "space-between",
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
