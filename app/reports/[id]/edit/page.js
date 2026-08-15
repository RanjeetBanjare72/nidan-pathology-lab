"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

/*
  NIDAN PATHOLOGY LAB
  Universal Edit Report Page

  This page tries to support different report_data structures:
  - selectedTests
  - tests
  - investigations
  - reportTests
  - parameters
  - test.parameters
  - test.tests
  - test.items
  - test.fields
  - results
  - testResults
  - patient
  - patientData

  It also supports report_data being stored as JSON string.
*/

export default function EditLaboratoryReportPage() {
  const params = useParams();
  const router = useRouter();

  const reportId = useMemo(() => {
    if (!params?.id) return "";

    return Array.isArray(params.id)
      ? params.id[0]
      : String(params.id);
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
        throw new Error("Report not found.");
      }

      console.log("====================================");
      console.log("NIDAN EDIT - COMPLETE REPORT");
      console.log(data);
      console.log("====================================");

      setReport(data);

      // -------------------------------------------------------
      // Parse report_data
      // -------------------------------------------------------

      const reportData = parseJSON(
        data.report_data
      );

      console.log(
        "NIDAN EDIT - REPORT DATA:",
        reportData
      );

      // -------------------------------------------------------
      // PATIENT
      // -------------------------------------------------------

      const foundPatient =
        findPatient(
          data,
          reportData
        );

      console.log(
        "NIDAN EDIT - FOUND PATIENT:",
        foundPatient
      );

      setPatient(
        normalizePatient(
          foundPatient
        )
      );

      // -------------------------------------------------------
      // RESULTS
      // -------------------------------------------------------

      const foundResults =
        findResults(
          data,
          reportData
        );

      console.log(
        "NIDAN EDIT - FOUND RESULTS:",
        foundResults
      );

      setResults(foundResults);

      // -------------------------------------------------------
      // TESTS
      // -------------------------------------------------------

      const foundTests =
        findAllTests(
          data,
          reportData
        );

      console.log(
        "===================================="
      );

      console.log(
        "NIDAN EDIT - FOUND TEST COLLECTION:"
      );

      console.log(foundTests);

      console.log(
        "===================================="
      );

      const normalizedTests =
        normalizeTestCollection(
          foundTests
        );

      console.log(
        "NIDAN EDIT - NORMALIZED TESTS:",
        normalizedTests
      );

      setTests(normalizedTests);

      // -------------------------------------------------------
      // If result keys exist but test values aren't connected,
      // inject result values into parameters.
      // -------------------------------------------------------

      const testsWithValues =
        attachResultsToTests(
          normalizedTests,
          foundResults
        );

      setTests(testsWithValues);

      // -------------------------------------------------------
      // If nothing found, print complete JSON in console.
      // -------------------------------------------------------

      if (
        testsWithValues.length === 0
      ) {
        console.warn(
          "NIDAN EDIT: No tests detected."
        );

        console.warn(
          "OPEN BROWSER CONSOLE AND CHECK COMPLETE REPORT JSON."
        );
      }
    } catch (error) {
      console.error(
        "NIDAN EDIT LOAD ERROR:",
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
  // SAFE JSON PARSER
  // =========================================================

  function parseJSON(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return {};
    }

    if (
      typeof value === "object"
    ) {
      return value;
    }

    if (
      typeof value === "string"
    ) {
      const text =
        value.trim();

      if (!text) {
        return {};
      }

      try {
        return JSON.parse(text);
      } catch {
        return value;
      }
    }

    return value;
  }

  // =========================================================
  // NORMALIZE PATIENT
  // =========================================================

  function normalizePatient(p) {
    const patientData =
      parseJSON(p) || {};

    return {
      name:
        firstValue(
          patientData.name,
          patientData.patientName,
          patientData.patient_name,
          patientData.fullName,
          patientData.full_name
        ) || "",

      patient_id:
        firstValue(
          patientData.patient_id,
          patientData.patientId,
          patientData.patientID,
          patientData.id,
          patientData.registrationNo,
          patientData.registration_no
        ) || "",

      age:
        firstValue(
          patientData.age,
          patientData.patientAge,
          patientData.patient_age
        ) ?? "",

      gender:
        firstValue(
          patientData.gender,
          patientData.sex,
          patientData.patientGender,
          patientData.patient_gender
        ) || "",

      mobile:
        firstValue(
          patientData.mobile,
          patientData.phone,
          patientData.phoneNumber,
          patientData.phone_number,
          patientData.contact
        ) || "",

      doctor:
        firstValue(
          patientData.doctor,
          patientData.referring_doctor,
          patientData.referringDoctor,
          patientData.refDoctor,
          patientData.doctorName,
          patientData.doctor_name
        ) || "",
    };
  }

  // =========================================================
  // FIRST VALUE
  // =========================================================

  function firstValue(...values) {
    for (const value of values) {
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        return value;
      }
    }

    return "";
  }

  // =========================================================
  // FIND PATIENT
  // =========================================================

  function findPatient(
    root,
    reportData
  ) {
    const directCandidates = [
      reportData?.patient,
      reportData?.patientData,
      reportData?.patient_info,
      reportData?.patientInformation,
      reportData?.patientDetails,

      root?.patient,
      root?.patientData,
      root?.patient_info,
      root?.patientInformation,
      root?.patientDetails,
    ];

    for (
      const candidate of directCandidates
    ) {
      if (
        isPatientObject(candidate)
      ) {
        return parseJSON(candidate);
      }
    }

    const recursive =
      recursivelyFind(
        root,
        (value) =>
          isPatientObject(value)
      );

    return recursive || {};
  }

  // =========================================================
  // PATIENT DETECTOR
  // =========================================================

  function isPatientObject(value) {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      return false;
    }

    const keys =
      Object.keys(value).map(
        (k) => k.toLowerCase()
      );

    const hasName =
      keys.includes("name") ||
      keys.includes("patientname") ||
      keys.includes("patient_name") ||
      keys.includes("fullname") ||
      keys.includes("full_name");

    const hasAge =
      keys.includes("age") ||
      keys.includes("patientage") ||
      keys.includes("patient_age");

    const hasGender =
      keys.includes("gender") ||
      keys.includes("sex") ||
      keys.includes("patientgender");

    return (
      hasName &&
      (hasAge || hasGender)
    );
  }

  // =========================================================
  // FIND RESULTS
  // =========================================================

  function findResults(
    root,
    reportData
  ) {
    const candidates = [
      reportData?.results,
      reportData?.result,
      reportData?.testResults,
      reportData?.test_results,
      reportData?.investigationResults,
      reportData?.investigation_results,

      root?.results,
      root?.result,
      root?.testResults,
      root?.test_results,
    ];

    for (
      const candidate of candidates
    ) {
      const parsed =
        parseJSON(candidate);

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return {
          ...parsed,
        };
      }
    }

    // Search recursively
    const found =
      recursivelyFind(
        root,
        (value, key) => {
          if (
            !key ||
            !value ||
            typeof value !==
              "object" ||
            Array.isArray(value)
          ) {
            return false;
          }

          const k =
            String(key).toLowerCase();

          return (
            k === "results" ||
            k === "result" ||
            k === "testresults" ||
            k === "test_results" ||
            k ===
              "investigationresults"
          );
        }
      );

    if (
      found &&
      typeof found === "object"
    ) {
      return found;
    }

    return {};
  }

  // =========================================================
  // FIND ALL TESTS
  // =========================================================

  function findAllTests(
    root,
    reportData
  ) {
    // -------------------------------------------------------
    // First: known locations
    // -------------------------------------------------------

    const knownCandidates = [
      reportData?.selectedTests,
      reportData?.selected_tests,

      reportData?.tests,
      reportData?.test,

      reportData?.investigations,
      reportData?.investigation,

      reportData?.reportTests,
      reportData?.report_tests,

      reportData?.testData,
      reportData?.test_data,

      root?.selectedTests,
      root?.selected_tests,

      root?.tests,
      root?.test,

      root?.investigations,
      root?.investigation,

      root?.reportTests,
      root?.report_tests,
    ];

    for (
      const candidate of knownCandidates
    ) {
      const parsed =
        parseJSON(candidate);

      const extracted =
        convertCandidateToTests(
          parsed
        );

      if (
        extracted.length > 0
      ) {
        console.log(
          "NIDAN EDIT - TESTS FOUND FROM KNOWN LOCATION:",
          extracted
        );

        return extracted;
      }
    }

    // -------------------------------------------------------
    // Second: recursively discover arrays
    // -------------------------------------------------------

    const discovered = [];

    recursivelyWalk(
      root,
      (value, key, path) => {
        if (
          !Array.isArray(value)
        ) {
          return;
        }

        const converted =
          convertCandidateToTests(
            value
          );

        if (
          converted.length > 0
        ) {
          discovered.push({
            path,
            tests: converted,
          });
        }
      }
    );

    console.log(
      "NIDAN EDIT - DISCOVERED TEST COLLECTIONS:",
      discovered
    );

    if (
      discovered.length > 0
    ) {
      // Prefer collection having most parameters
      discovered.sort(
        (a, b) =>
          countParameters(
            b.tests
          ) -
          countParameters(
            a.tests
          )
      );

      return discovered[0].tests;
    }

    // -------------------------------------------------------
    // Third: recursively search for single test object
    // -------------------------------------------------------

    const singleTests = [];

    recursivelyWalk(
      root,
      (value) => {
        if (
          isTestObject(value)
        ) {
          singleTests.push(value);
        }
      }
    );

    if (
      singleTests.length > 0
    ) {
      return singleTests;
    }

    return [];
  }

  // =========================================================
  // CONVERT CANDIDATE TO TESTS
  // =========================================================

  function convertCandidateToTests(
    candidate
  ) {
    if (!candidate) {
      return [];
    }

    if (
      typeof candidate ===
        "object" &&
      !Array.isArray(candidate)
    ) {
      // Object wrapping an array
      const possibleArrays = [
        candidate.selectedTests,
        candidate.selected_tests,
        candidate.tests,
        candidate.investigations,
        candidate.items,
        candidate.data,
      ];

      for (
        const arr of possibleArrays
      ) {
        if (
          Array.isArray(arr)
        ) {
          return convertCandidateToTests(
            arr
          );
        }
      }

      // Single test object
      if (
        isTestObject(candidate)
      ) {
        return [candidate];
      }

      return [];
    }

    if (
      !Array.isArray(candidate)
    ) {
      return [];
    }

    // Empty
    if (
      candidate.length === 0
    ) {
      return [];
    }

    // Array of test objects
    const testObjects =
      candidate.filter(
        (item) =>
          isTestObject(item)
      );

    if (
      testObjects.length > 0
    ) {
      return testObjects;
    }

    // Array of parameters
    const parameterObjects =
      candidate.filter(
        (item) =>
          isParameterObject(item)
      );

    if (
      parameterObjects.length >=
      1
    ) {
      return [
        {
          id: "auto-cbc-test",
          name:
            inferTestName(
              candidate
            ),
          tests:
            parameterObjects,
        },
      ];
    }

    return [];
  }

  // =========================================================
  // TEST DETECTOR
  // =========================================================

  function isTestObject(
    value
  ) {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      return false;
    }

    const nested =
      value.tests ||
      value.parameters ||
      value.items ||
      value.fields ||
      value.investigations;

    if (
      Array.isArray(nested) &&
      nested.length > 0
    ) {
      return true;
    }

    const keys =
      Object.keys(value).map(
        (k) => k.toLowerCase()
      );

    const hasTestName =
      keys.includes("testname") ||
      keys.includes("test_name") ||
      keys.includes("testid") ||
      keys.includes("test_id") ||
      keys.includes("investigation") ||
      keys.includes("title");

    const hasName =
      keys.includes("name");

    return (
      hasTestName ||
      (
        hasName &&
        (
          keys.includes("result") ||
          keys.includes("value") ||
          keys.includes("unit") ||
          keys.includes("range")
        )
      )
    );
  }

  // =========================================================
  // PARAMETER DETECTOR
  // =========================================================

  function isParameterObject(
    value
  ) {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      return false;
    }

    const keys =
      Object.keys(value).map(
        (k) => k.toLowerCase()
      );

    const hasName =
      keys.includes("name") ||
      keys.includes("parameter") ||
      keys.includes("parametername") ||
      keys.includes("parameter_name");

    const hasResult =
      keys.includes("result") ||
      keys.includes("value") ||
      keys.includes("unit") ||
      keys.includes("range") ||
      keys.includes("reference") ||
      keys.includes("referencerange") ||
      keys.includes("reference_range");

    return (
      hasName &&
      hasResult
    );
  }

  // =========================================================
  // NORMALIZE TEST COLLECTION
  // =========================================================

  function normalizeTestCollection(
    input
  ) {
    if (
      !Array.isArray(input)
    ) {
      return [];
    }

    return input.map(
      (test, testIndex) => {
        const parsed =
          parseJSON(test) || {};

        let parameters = [];

        if (
          Array.isArray(
            parsed.tests
          )
        ) {
          parameters =
            parsed.tests;
        } else if (
          Array.isArray(
            parsed.parameters
          )
        ) {
          parameters =
            parsed.parameters;
        } else if (
          Array.isArray(
            parsed.items
          )
        ) {
          parameters =
            parsed.items;
        } else if (
          Array.isArray(
            parsed.fields
          )
        ) {
          parameters =
            parsed.fields;
        } else if (
          Array.isArray(
            parsed.investigations
          )
        ) {
          parameters =
            parsed.investigations;
        } else if (
          isParameterObject(parsed)
        ) {
          parameters = [
            parsed,
          ];
        }

        const normalizedParameters =
          parameters.map(
            (
              parameter,
              parameterIndex
            ) =>
              normalizeParameter(
                parameter,
                testIndex,
                parameterIndex
              )
          );

        return {
          ...parsed,

          id:
            parsed.id ||
            parsed.testId ||
            parsed.test_id ||
            `test-${testIndex}`,

          name:
            parsed.name ||
            parsed.testName ||
            parsed.test_name ||
            parsed.title ||
            parsed.investigation ||
            "Investigation",

          tests:
            normalizedParameters,
        };
      }
    );
  }

  // =========================================================
  // NORMALIZE PARAMETER
  // =========================================================

  function normalizeParameter(
    parameter,
    testIndex,
    parameterIndex
  ) {
    const p =
      parseJSON(parameter) || {};

    return {
      ...p,

      id:
        p.id ||
        p.parameterId ||
        p.parameter_id ||
        `parameter-${testIndex}-${parameterIndex}`,

      name:
        p.name ||
        p.parameterName ||
        p.parameter_name ||
        p.parameter ||
        `Parameter ${parameterIndex + 1}`,

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

  // =========================================================
  // ATTACH RESULTS TO TESTS
  // =========================================================

  function attachResultsToTests(
    testCollection,
    resultObject
  ) {
    return testCollection.map(
      (test, testIndex) => {
        const updatedParameters =
          Array.isArray(
            test.tests
          )
            ? test.tests.map(
                (
                  parameter,
                  parameterIndex
                ) => {
                  const value =
                    findResultForParameter(
                      test,
                      parameter,
                      testIndex,
                      parameterIndex,
                      resultObject
                    );

                  return {
                    ...parameter,

                    result:
                      value !==
                        undefined &&
                      value !== null
                        ? value
                        : parameter.result ??
                          "",
                  };
                }
              )
            : [];

        return {
          ...test,
          tests:
            updatedParameters,
        };
      }
    );
  }

  // =========================================================
  // FIND RESULT FOR PARAMETER
  // =========================================================

  function findResultForParameter(
    test,
    parameter,
    testIndex,
    parameterIndex,
    resultObject
  ) {
    if (
      !resultObject ||
      typeof resultObject !==
        "object"
    ) {
      return parameter.result ?? "";
    }

    const testId =
      test?.id ||
      test?.testId ||
      test?.test_id ||
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

    const testName =
      test?.name ||
      test?.testName ||
      test?.test_name ||
      "";

    const possibleKeys = [
      `${testId}-${parameterName}-${parameterIndex}`,

      `${testId}-${parameterId}`,

      `${testId}_${parameterName}`,

      `${testName}-${parameterName}`,

      `${testName}_${parameterName}`,

      `${testIndex}-${parameterIndex}`,

      `${testIndex}-${parameterName}`,

      parameterId,

      parameterName,

      parameter?.parameter_id,

      parameter?.parameterId,
    ].filter(Boolean);

    for (
      const key of possibleKeys
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          resultObject,
          key
        )
      ) {
        return resultObject[key];
      }
    }

    // Case-insensitive key search
    const resultKeys =
      Object.keys(
        resultObject
      );

    for (
      const possibleKey of possibleKeys
    ) {
      const foundKey =
        resultKeys.find(
          (key) =>
            String(key)
              .toLowerCase() ===
            String(
              possibleKey
            ).toLowerCase()
        );

      if (
        foundKey !== undefined
      ) {
        return resultObject[
          foundKey
        ];
      }
    }

    // Parameter's own saved value
    if (
      parameter?.result !==
      undefined
    ) {
      return parameter.result;
    }

    if (
      parameter?.value !==
      undefined
    ) {
      return parameter.value;
    }

    return "";
  }

  // =========================================================
  // GET RESULT VALUE FROM STATE
  // =========================================================

  function getResultValue(
    test,
    parameter,
    testIndex,
    parameterIndex
  ) {
    const found =
      findResultForParameter(
        test,
        parameter,
        testIndex,
        parameterIndex,
        results
      );

    if (
      found !== undefined &&
      found !== null
    ) {
      return found;
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
    setPatient(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
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
      test?.id ||
      test?.testId ||
      test?.test_id ||
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

    const testName =
      test?.name ||
      test?.testName ||
      test?.test_name ||
      "";

    const keys = [
      `${testId}-${parameterName}-${parameterIndex}`,

      `${testId}-${parameterId}`,

      `${testId}_${parameterName}`,

      `${testName}-${parameterName}`,

      `${testName}_${parameterName}`,

      `${testIndex}-${parameterIndex}`,

      `${testIndex}-${parameterName}`,

      parameterId,

      parameterName,
    ].filter(Boolean);

    setResults(
      (previous) => {
        const updated = {
          ...previous,
        };

        keys.forEach(
          (key) => {
            updated[key] =
              value;
          }
        );

        return updated;
      }
    );

    // Also immediately update parameter object
    setTests(
      (previous) =>
        previous.map(
          (
            currentTest,
            currentTestIndex
          ) => {
            if (
              currentTestIndex !==
              testIndex
            ) {
              return currentTest;
            }

            return {
              ...currentTest,

              tests:
                currentTest.tests.map(
                  (
                    currentParameter,
                    currentParameterIndex
                  ) => {
                    if (
                      currentParameterIndex !==
                      parameterIndex
                    ) {
                      return currentParameter;
                    }

                    return {
                      ...currentParameter,

                      result:
                        value,

                      value:
                        value,
                    };
                  }
                ),
            };
          }
        )
    );
  }

  // =========================================================
  // REFERENCE
  // =========================================================

  function getReference(
    parameter
  ) {
    if (!parameter) {
      return "-";
    }

    return (
      parameter.range ||
      parameter.referenceRange ||
      parameter.reference_range ||
      parameter.reference ||
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

  // =========================================================
  // UNIT
  // =========================================================

  function getUnit(
    parameter
  ) {
    return (
      parameter?.unit ||
      parameter?.units ||
      "-"
    );
  }

  // =========================================================
  // SAVE
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

      const oldReportData =
        parseJSON(
          report.report_data
        );

      // -------------------------------------------------------
      // PATIENT UPDATE
      // -------------------------------------------------------

      const oldPatient =
        findPatient(
          report,
          oldReportData
        );

      const updatedPatient = {
        ...oldPatient,

        name:
          patient.name,

        patientName:
          patient.name,

        patient_name:
          patient.name,

        id:
          patient.patient_id,

        patient_id:
          patient.patient_id,

        patientId:
          patient.patient_id,

        age:
          patient.age,

        patientAge:
          patient.age,

        gender:
          patient.gender,

        sex:
          patient.gender,

        mobile:
          patient.mobile,

        phone:
          patient.mobile,

        phoneNumber:
          patient.mobile,

        doctor:
          patient.doctor,

        referring_doctor:
          patient.doctor,

        referringDoctor:
          patient.doctor,
      };

      // -------------------------------------------------------
      // FINAL TEST DATA
      // -------------------------------------------------------

      const updatedTests =
        tests.map(
          (test, testIndex) => {
            const updatedParameters =
              Array.isArray(
                test.tests
              )
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

                        result:
                          value,

                        value:
                          value,
                      };
                    }
                  )
                : [];

            return {
              ...test,

              tests:
                updatedParameters,
            };
          }
        );

      // -------------------------------------------------------
      // FINAL RESULTS
      // -------------------------------------------------------

      const finalResults = {
        ...(oldReportData?.results ||
          {}),
        ...results,
      };

      // -------------------------------------------------------
      // PRESERVE ALL OLD DATA
      // -------------------------------------------------------

      const updatedReportData = {
        ...oldReportData,

        patient:
          updatedPatient,

        patientData:
          updatedPatient,

        selectedTests:
          updatedTests,

        tests:
          updatedTests,

        results:
          finalResults,
      };

      console.log(
        "===================================="
      );

      console.log(
        "NIDAN EDIT - SAVING REPORT"
      );

      console.log(
        updatedReportData
      );

      console.log(
        "===================================="
      );

      // -------------------------------------------------------
      // UPDATE SUPABASE
      // -------------------------------------------------------

      const {
        data,
        error,
      } = await supabase
        .from("reports")
        .update({
          report_data:
            updatedReportData,
        })
        .eq(
          "id",
          reportId
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(
        "NIDAN EDIT - SAVED:",
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
        "NIDAN EDIT SAVE ERROR:",
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
          style={
            loadingCardStyle
          }
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

  if (
    errorMessage &&
    !report
  ) {
    return (
      <main style={pageStyle}>
        <div
          style={
            errorCardStyle
          }
        >
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
            style={
              secondaryButtonStyle
            }
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
              marginTop: "3px",
              fontWeight: "700",
            }}
          >
            NIDAN PATHOLOGY LAB
          </div>
        </div>

        <div
          style={
            actionGroupStyle
          }
        >
          <button
            onClick={
              cancelEdit
            }
            disabled={saving}
            style={
              secondaryButtonStyle
            }
          >
            ← Cancel
          </button>

          <button
            onClick={
              saveChanges
            }
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

      {/* MESSAGES */}

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

      {/* TESTS */}

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

            <p
              style={{
                marginBottom: 0,
              }}
            >
              Saved report में
              investigation data
              नहीं मिला।
            </p>

            <p
              style={{
                fontSize: "11px",
                color: "#68777d",
              }}
            >
              Browser console में
              <b>
                NIDAN EDIT
              </b>{" "}
              search करके detected
              data देखें।
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
                      {test.tests
                        ?.length >
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
                            colSpan="4"
                            style={
                              cellStyle
                            }
                          >
                            No parameters found
                            for this
                            investigation.
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

      {/* BOTTOM BUTTONS */}

      <div
        style={{
          ...bottomBarStyle,
          marginBottom:
            "30px",
        }}
      >
        <button
          onClick={
            cancelEdit
          }
          disabled={saving}
          style={
            secondaryButtonStyle
          }
        >
          Cancel
        </button>

        <button
          onClick={
            saveChanges
          }
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
    </main>
  );
}

// ============================================================
// RECURSIVE SEARCH
// ============================================================

function recursivelyFind(
  root,
  matcher
) {
  let found = null;

  function walk(
    value,
    key = ""
  ) {
    if (found !== null) {
      return;
    }

    if (
      value === null ||
      value === undefined
    ) {
      return;
    }

    if (
      typeof value !==
        "object"
    ) {
      return;
    }

    try {
      if (
        matcher(
          value,
          key
        )
      ) {
        found =
          value;
        return;
      }
    } catch {}

    if (
      Array.isArray(value)
    ) {
      for (
        const item of value
      ) {
        walk(
          item,
          key
        );

        if (
          found !== null
        ) {
          return;
        }
      }
    } else {
      for (
        const childKey of Object.keys(
          value
        )
      ) {
        walk(
          value[childKey],
          childKey
        );

        if (
          found !== null
        ) {
          return;
        }
      }
    }
  }

  walk(root);

  return found;
}

// ============================================================
// RECURSIVE WALK
// ============================================================

function recursivelyWalk(
  root,
  callback,
  path = "root",
  visited = new Set()
) {
  if (
    root === null ||
    root === undefined
  ) {
    return;
  }

  if (
    typeof root !==
    "object"
  ) {
    return;
  }

  if (
    visited.has(root)
  ) {
    return;
  }

  visited.add(root);

  callback(
    root,
    "",
    path
  );

  if (
    Array.isArray(root)
  ) {
    root.forEach(
      (item, index) => {
        recursivelyWalk(
          item,
          callback,
          `${path}[${index}]`,
          visited
        );
      }
    );
  } else {
    Object.keys(
      root
    ).forEach(
      (key) => {
        recursivelyWalk(
          root[key],
          callback,
          `${path}.${key}`,
          visited
        );
      }
    );
  }
}

// ============================================================
// COUNT PARAMETERS
// ============================================================

function countParameters(
  tests
) {
  return tests.reduce(
    (total, test) =>
      total +
      (
        Array.isArray(
          test?.tests
        )
          ? test.tests.length
          : 0
      ),
    0
  );
}

// ============================================================
// INFER TEST NAME
// ============================================================

function inferTestName(
  parameters
) {
  if (
    !Array.isArray(
      parameters
    )
  ) {
    return "Investigation";
  }

  for (
    const parameter of parameters
  ) {
    if (
      parameter?.testName
    ) {
      return parameter.testName;
    }

    if (
      parameter?.test_name
    ) {
      return parameter.test_name;
    }

    if (
      parameter?.groupName
    ) {
      return parameter.groupName;
    }

    if (
      parameter?.group_name
    ) {
      return parameter.group_name;
    }

    if (
      parameter?.category
    ) {
      return parameter.category;
    }
  }

  return "Investigation";
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
    <label
      style={
        inputLabelStyle
      }
    >
      <span>
        {label}
      </span>

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
// STYLES
// ============================================================

const pageStyle = {
  minHeight:
    "100vh",
  background:
    "#eef4f7",
  padding:
    "14px",
  boxSizing:
    "border-box",
  fontFamily:
    "Arial, Helvetica, sans-serif",
  color:
    "#263238",
};

const topBarStyle = {
  maxWidth:
    "1100px",
  margin:
    "0 auto 12px",
  background:
    "#ffffff",
  borderRadius:
    "8px",
  padding:
    "12px 14px",
  boxShadow:
    "0 2px 8px rgba(0,0,0,0.08)",
  display:
    "flex",
  justifyContent:
    "space-between",
  alignItems:
    "center",
  gap:
    "10px",
  flexWrap:
    "wrap",
};

const actionGroupStyle = {
  display:
    "flex",
  gap:
    "8px",
  flexWrap:
    "wrap",
};

const sectionStyle = {
  maxWidth:
    "1100px",
  margin:
    "0 auto 12px",
  background:
    "#ffffff",
  borderRadius:
    "8px",
  padding:
    "14px",
  boxShadow:
    "0 2px 8px rgba(0,0,0,0.07)",
};

const sectionTitleStyle = {
  fontSize:
    "16px",
  fontWeight:
    "700",
  color:
    "#147c75",
  borderBottom:
    "2px solid #147c75",
  paddingBottom:
    "8px",
  marginBottom:
    "14px",
};

const patientGridStyle = {
  display:
    "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap:
    "12px",
};

const inputLabelStyle = {
  display:
    "flex",
  flexDirection:
    "column",
  gap:
    "5px",
  fontSize:
    "12px",
  fontWeight:
    "600",
  color:
    "#4d5a60",
};

const inputStyle = {
  width:
    "100%",
  minHeight:
    "40px",
  boxSizing:
    "border-box",
  border:
    "1px solid #cfd8dc",
  borderRadius:
    "5px",
  padding:
    "8px 10px",
  fontSize:
    "14px",
  outline:
    "none",
  background:
    "#ffffff",
};

const resultInputStyle = {
  width:
    "100%",
  minHeight:
    "36px",
  boxSizing:
    "border-box",
  border:
    "1px solid #cfd8dc",
  borderRadius:
    "4px",
  padding:
    "7px 9px",
  fontSize:
    "14px",
  background:
    "#fffdf5",
};

const testCardStyle = {
  marginBottom:
    "18px",
  border:
    "1px solid #d9e2e5",
  borderRadius:
    "6px",
  overflow:
    "hidden",
};

const testTitleStyle = {
  background:
    "#e3f3f1",
  borderLeft:
    "4px solid #147c75",
  padding:
    "10px 12px",
  fontWeight:
    "700",
  color:
    "#176e68",
  fontSize:
    "15px",
};

const tableStyle = {
  width:
    "100%",
  borderCollapse:
    "collapse",
  minWidth:
    "650px",
};

const headStyle = {
  padding:
    "9px 8px",
  border:
    "1px solid #d5dee2",
  background:
    "#edf4f6",
  textAlign:
    "left",
  fontSize:
    "11px",
  fontWeight:
    "700",
  color:
    "#263238",
};

const cellStyle = {
  padding:
    "8px",
  border:
    "1px solid #dce3e6",
  verticalAlign:
    "middle",
  fontSize:
    "12px",
};

const primaryButtonStyle = {
  border:
    "none",
  borderRadius:
    "5px",
  background:
    "#087f78",
  color:
    "#ffffff",
  padding:
    "9px 15px",
  fontWeight:
    "700",
  cursor:
    "pointer",
};

const secondaryButtonStyle = {
  border:
    "1px solid #b8c4c8",
  borderRadius:
    "5px",
  background:
    "#ffffff",
  color:
    "#263238",
  padding:
    "9px 15px",
  fontWeight:
    "600",
  cursor:
    "pointer",
};

const bottomBarStyle = {
  maxWidth:
    "1100px",
  margin:
    "0 auto",
  background:
    "#ffffff",
  borderRadius:
    "8px",
  padding:
    "12px",
  display:
    "flex",
  justifyContent:
    "flex-end",
  gap:
    "8px",
  boxShadow:
    "0 2px 8px rgba(0,0,0,0.07)",
};

const loadingCardStyle = {
  maxWidth:
    "600px",
  margin:
    "50px auto",
  background:
    "#ffffff",
  padding:
    "30px",
  borderRadius:
    "8px",
  textAlign:
    "center",
};

const errorCardStyle = {
  maxWidth:
    "600px",
  margin:
    "50px auto",
  background:
    "#ffffff",
  padding:
    "30px",
  borderRadius:
    "8px",
};

const emptyStyle = {
  padding:
    "20px",
  border:
    "1px dashed #b9c7cb",
  borderRadius:
    "6px",
  background:
    "#f8fbfc",
};

const errorMessageStyle = {
  maxWidth:
    "1100px",
  margin:
    "0 auto 12px",
  padding:
    "10px 12px",
  borderRadius:
    "6px",
  background:
    "#fdecec",
  border:
    "1px solid #efb7b7",
  color:
    "#a32626",
  fontSize:
    "13px",
};

const successMessageStyle = {
  maxWidth:
    "1100px",
  margin:
    "0 auto 12px",
  padding:
    "10px 12px",
  borderRadius:
    "6px",
  background:
    "#e9f8f1",
  border:
    "1px solid #a9ddc3",
  color:
    "#176b46",
  fontSize:
    "13px",
};
