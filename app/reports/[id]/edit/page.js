"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

/* =========================================================
   NIDAN PATHOLOGY LAB
   EDIT LABORATORY REPORT PAGE

   FILE:
   app/reports/[id]/edit/page.js

   IMPORTANT FIX:
   - Reads report_data.results
   - Reads report_data.tests
   - Reads report_data.selectedTests
   - Reads report_data.reportTests
   - Reads report_data.investigations
   - Reads report_data.testResults
   - Reads nested parameters/tests/items/investigations
   - Matches saved result by:
       1. Exact key
       2. Parameter ID
       3. Parameter name
       4. Normalized name
       5. Partial name
       6. Test-level results
       7. parameter.result
       8. parameter.value
   - Preserves old report data
   - Updates both results and parameter values
========================================================= */


/* =========================================================
   NORMALIZE TEXT
========================================================= */

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[./_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


/* =========================================================
   GET REPORT DATA
========================================================= */

function getReportData(report) {
  if (
    report?.report_data &&
    typeof report.report_data === "object" &&
    !Array.isArray(report.report_data)
  ) {
    return report.report_data;
  }

  return {};
}


/* =========================================================
   GET PATIENT
========================================================= */

function getPatient(report) {
  const data = getReportData(report);

  const savedPatient =
    data?.patient ||
    data?.patientData ||
    data?.patient_info ||
    data?.patientInfo ||
    report?.patient ||
    {};

  return {
    ...savedPatient,

    name:
      savedPatient?.name ||
      savedPatient?.patientName ||
      savedPatient?.patient_name ||
      report?.patient_name ||
      report?.patientName ||
      report?.name ||
      "",

    patient_id:
      savedPatient?.id ||
      savedPatient?.patient_id ||
      savedPatient?.patientId ||
      report?.patient_id ||
      report?.patientId ||
      "",

    age:
      savedPatient?.age ??
      savedPatient?.patientAge ??
      report?.age ??
      report?.patient_age ??
      "",

    gender:
      savedPatient?.gender ||
      savedPatient?.sex ||
      savedPatient?.patientGender ||
      report?.gender ||
      report?.sex ||
      "",

    mobile:
      savedPatient?.mobile ||
      savedPatient?.phone ||
      savedPatient?.phoneNumber ||
      savedPatient?.mobile_number ||
      report?.mobile ||
      report?.phone ||
      "",

    doctor:
      savedPatient?.doctor ||
      savedPatient?.referring_doctor ||
      savedPatient?.referringDoctor ||
      savedPatient?.refDoctor ||
      savedPatient?.referred_by ||
      savedPatient?.referredBy ||
      report?.doctor ||
      report?.referring_doctor ||
      report?.referred_by ||
      "",

    collectionDate:
      savedPatient?.collectionDate ||
      savedPatient?.collection_date ||
      savedPatient?.sampleDate ||
      savedPatient?.sample_date ||
      report?.collection_date ||
      report?.collectionDate ||
      report?.sample_date ||
      report?.sampleDate ||
      "",
  };
}


/* =========================================================
   GET TEST COLLECTION
========================================================= */

function getSavedTests(report) {
  const data = getReportData(report);

  const possibleTests = [
    data?.tests,
    data?.selectedTests,
    data?.reportTests,
    data?.investigations,
    data?.report_tests,

    report?.tests,
    report?.selectedTests,
    report?.reportTests,
    report?.investigations,
    report?.report_tests,
  ];

  for (const item of possibleTests) {
    if (
      Array.isArray(item) &&
      item.length > 0
    ) {
      return item;
    }
  }

  // Object containing selectedTests
  if (
    data?.tests &&
    typeof data.tests === "object" &&
    Array.isArray(data.tests.selectedTests)
  ) {
    return data.tests.selectedTests;
  }

  // Object containing tests
  if (
    data?.tests &&
    typeof data.tests === "object" &&
    Array.isArray(data.tests.tests)
  ) {
    return data.tests.tests;
  }

  // Object containing investigations
  if (
    data?.investigations &&
    typeof data.investigations === "object" &&
    Array.isArray(data.investigations.tests)
  ) {
    return data.investigations.tests;
  }

  // Single test
  if (
    data?.test &&
    typeof data.test === "object"
  ) {
    return [data.test];
  }

  if (
    report?.test &&
    typeof report.test === "object"
  ) {
    return [report.test];
  }

  return [];
}


/* =========================================================
   GET PARAMETERS FROM TEST
========================================================= */

function getParametersFromTest(test) {
  if (!test) {
    return [];
  }

  const possibleParameters = [
    test?.tests,
    test?.parameters,
    test?.items,
    test?.investigations,
    test?.fields,
    test?.parametersList,
    test?.testParameters,
  ];

  for (const parameters of possibleParameters) {
    if (
      Array.isArray(parameters) &&
      parameters.length > 0
    ) {
      return parameters;
    }
  }

  return [];
}


/* =========================================================
   NORMALIZE TESTS
========================================================= */

function normalizeTests(input) {
  if (!input) {
    return [];
  }

  let list = [];

  if (Array.isArray(input)) {
    list = input;
  }

  else if (
    typeof input === "object" &&
    Array.isArray(input.selectedTests)
  ) {
    list = input.selectedTests;
  }

  else if (
    typeof input === "object" &&
    Array.isArray(input.tests)
  ) {
    list = input.tests;
  }

  else if (
    typeof input === "object" &&
    Array.isArray(input.investigations)
  ) {
    list = input.investigations;
  }

  else if (typeof input === "object") {
    list = [input];
  }

  return list.map((test, testIndex) => {

    let parameters =
      getParametersFromTest(test);

    /*
     Single parameter/test structure
    */

    if (
      parameters.length === 0 &&
      (
        test?.parameter ||
        test?.parameterName ||
        test?.parameter_name ||
        test?.result !== undefined ||
        test?.value !== undefined ||
        test?.resultValue !== undefined
      )
    ) {
      parameters = [
        {
          id:
            test?.parameterId ||
            test?.parameter_id ||
            test?.id ||
            `parameter-${testIndex}`,

          name:
            test?.parameter ||
            test?.parameterName ||
            test?.parameter_name ||
            test?.name ||
            test?.testName ||
            "Investigation",

          result:
            test?.result ??
            test?.value ??
            test?.resultValue ??
            "",

          value:
            test?.value ??
            test?.result ??
            test?.resultValue ??
            "",

          unit:
            test?.unit ||
            test?.units ||
            "",

          range:
            test?.range ||
            test?.referenceRange ||
            test?.reference_range ||
            test?.reference ||
            "",

          min:
            test?.min,

          max:
            test?.max,

          maleRange:
            test?.maleRange,

          femaleRange:
            test?.femaleRange,

          maleMin:
            test?.maleMin,

          maleMax:
            test?.maleMax,

          femaleMin:
            test?.femaleMin,

          femaleMax:
            test?.femaleMax,
        },
      ];
    }

    /*
     Normalize every parameter
    */

    const normalizedParameters =
      parameters.map(
        (parameter, parameterIndex) => {

          if (
            typeof parameter === "string"
          ) {
            return {
              id:
                `${testIndex}-${parameterIndex}`,

              name:
                parameter,

              unit:
                "",

              range:
                "",

              result:
                "",

              value:
                "",
            };
          }

          const p =
            parameter || {};

          return {
            ...p,

            id:
              p.id ||
              p.parameterId ||
              p.parameter_id ||
              p.code ||
              `${testIndex}-${parameterIndex}`,

            name:
              p.name ||
              p.parameterName ||
              p.parameter_name ||
              p.parameter ||
              p.testName ||
              p.test_name ||
              p.investigation ||
              p.investigationName ||
              p.title ||
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
              p.resultValue ??
              "",

            value:
              p.value ??
              p.result ??
              p.resultValue ??
              "",
          };
        }
      );

    return {
      ...test,

      id:
        test?.id ||
        test?.testId ||
        test?.test_id ||
        test?.code ||
        `test-${testIndex}`,

      name:
        test?.name ||
        test?.testName ||
        test?.test_name ||
        test?.short ||
        test?.title ||
        "Investigation",

      tests:
        normalizedParameters,
    };
  });
}


/* =========================================================
   GET RESULTS OBJECT
========================================================= */

function getSavedResults(report) {
  const data = getReportData(report);

  if (
    data?.results &&
    typeof data.results === "object" &&
    !Array.isArray(data.results)
  ) {
    return data.results;
  }

  if (
    data?.testResults &&
    typeof data.testResults === "object" &&
    !Array.isArray(data.testResults)
  ) {
    return data.testResults;
  }

  if (
    data?.result &&
    typeof data.result === "object" &&
    !Array.isArray(data.result)
  ) {
    return data.result;
  }

  if (
    report?.results &&
    typeof report.results === "object" &&
    !Array.isArray(report.results)
  ) {
    return report.results;
  }

  if (
    report?.testResults &&
    typeof report.testResults === "object" &&
    !Array.isArray(report.testResults)
  ) {
    return report.testResults;
  }

  return {};
}


/* =========================================================
   TEST ID
========================================================= */

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


/* =========================================================
   TEST NAME
========================================================= */

function getTestName(test) {
  return (
    test?.name ||
    test?.testName ||
    test?.test_name ||
    test?.short ||
    test?.title ||
    "Investigation"
  );
}


/* =========================================================
   PARAMETER NAME
========================================================= */

function getParameterName(
  parameter
) {
  if (
    typeof parameter === "string"
  ) {
    return parameter;
  }

  return (
    parameter?.name ||
    parameter?.parameterName ||
    parameter?.parameter_name ||
    parameter?.parameter ||
    parameter?.testName ||
    parameter?.test_name ||
    parameter?.investigation ||
    parameter?.investigationName ||
    parameter?.title ||
    ""
  );
}


/* =========================================================
   RESULT KEYS
========================================================= */

function getResultKeys(
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

  const testName =
    getTestName(test);

  const parameterName =
    getParameterName(
      parameter
    );

  const parameterId =
    parameter?.id ||
    parameter?.parameterId ||
    parameter?.parameter_id ||
    parameter?.code ||
    "";

  return [
    /*
     Parameter ID
    */
    parameterId,

    /*
     Primary format
    */
    `${testId}-${parameterName}-${parameterIndex}`,

    /*
     Other formats
    */
    `${testId}-${parameterName}`,

    `${testId}-${parameterId}`,

    `${testIndex}-${parameterName}-${parameterIndex}`,

    `${testIndex}-${parameterName}`,

    `${testIndex}_${parameterIndex}`,

    `${testIndex}-${parameterIndex}`,

    `${testIndex}.${parameterIndex}`,

    `${testName}-${parameterName}`,

    `${testName}_${parameterName}`,

    /*
     Plain parameter name
    */
    parameterName,
  ].filter(Boolean);
}


/* =========================================================
   GET RESULT VALUE
   MAIN FIX
========================================================= */

function getResultValue(
  test,
  parameter,
  testIndex,
  parameterIndex,
  savedResults
) {
  const resultsObject =
    savedResults &&
    typeof savedResults === "object" &&
    !Array.isArray(savedResults)
      ? savedResults
      : {};

  const keys =
    getResultKeys(
      test,
      parameter,
      parameterIndex,
      testIndex
    );


  /* -------------------------------------------------------
     1. EXACT KEY
  ------------------------------------------------------- */

  for (
    const key of keys
  ) {
    if (
      Object.prototype.hasOwnProperty.call(
        resultsObject,
        key
      )
    ) {
      const value =
        resultsObject[key];

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return value;
      }

      /*
       Zero is a valid laboratory result
      */

      if (value === 0) {
        return value;
      }
    }
  }


  /* -------------------------------------------------------
     2. NORMALIZED KEY MATCH
  ------------------------------------------------------- */

  const parameterName =
    getParameterName(
      parameter
    );

  const target =
    normalizeText(
      parameterName
    );

  if (target) {

    for (
      const [
        key,
        value,
      ] of Object.entries(
        resultsObject
      )
    ) {

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {

        const normalizedKey =
          normalizeText(key);

        if (
          normalizedKey === target
        ) {
          return value;
        }

      }

    }

  }


  /* -------------------------------------------------------
     3. PARTIAL NAME MATCH
  ------------------------------------------------------- */

  if (target) {

    for (
      const [
        key,
        value,
      ] of Object.entries(
        resultsObject
      )
    ) {

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {

        const normalizedKey =
          normalizeText(key);

        if (
          normalizedKey.includes(target) ||
          target.includes(normalizedKey)
        ) {
          return value;
        }

      }

    }

  }


  /* -------------------------------------------------------
     4. TEST LEVEL RESULTS
  ------------------------------------------------------- */

  const testResults =
    test?.results;

  if (
    testResults &&
    typeof testResults === "object" &&
    !Array.isArray(testResults)
  ) {

    for (
      const key of keys
    ) {

      if (
        Object.prototype.hasOwnProperty.call(
          testResults,
          key
        )
      ) {

        const value =
          testResults[key];

        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          return value;
        }

        if (value === 0) {
          return value;
        }

      }

    }


    /*
     Normalized test result
    */

    if (target) {

      for (
        const [
          key,
          value,
        ] of Object.entries(
          testResults
        )
      ) {

        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {

          if (
            normalizeText(key) ===
            target
          ) {
            return value;
          }

        }

      }

    }

  }


  /* -------------------------------------------------------
     5. PARAMETER RESULT
     LAST FALLBACK
  ------------------------------------------------------- */

  if (
    parameter &&
    typeof parameter === "object"
  ) {

    if (
      parameter.result !== undefined &&
      parameter.result !== null &&
      parameter.result !== ""
    ) {
      return parameter.result;
    }

    if (
      parameter.value !== undefined &&
      parameter.value !== null &&
      parameter.value !== ""
    ) {
      return parameter.value;
    }

    if (
      parameter.resultValue !== undefined &&
      parameter.resultValue !== null &&
      parameter.resultValue !== ""
    ) {
      return parameter.resultValue;
    }

  }


  return "";
}


/* =========================================================
   REFERENCE
========================================================= */

function getReference(
  parameter
) {
  if (!parameter) {
    return "-";
  }

  if (
    parameter.range
  ) {
    return parameter.range;
  }

  if (
    parameter.referenceRange
  ) {
    return parameter.referenceRange;
  }

  if (
    parameter.reference_range
  ) {
    return parameter.reference_range;
  }

  if (
    parameter.reference
  ) {
    return parameter.reference;
  }

  if (
    parameter.min !== undefined &&
    parameter.max !== undefined
  ) {
    return `${parameter.min} - ${parameter.max}`;
  }

  if (
    parameter.minimum !== undefined &&
    parameter.maximum !== undefined
  ) {
    return `${parameter.minimum} - ${parameter.maximum}`;
  }

  if (
    parameter.maleRange
  ) {
    return parameter.maleRange;
  }

  if (
    parameter.femaleRange
  ) {
    return parameter.femaleRange;
  }

  return "-";
}


/* =========================================================
   UNIT
========================================================= */

function getUnit(
  parameter
) {
  if (
    !parameter ||
    typeof parameter === "string"
  ) {
    return "-";
  }

  return (
    parameter.unit ||
    parameter.units ||
    "-"
  );
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function EditLaboratoryReportPage() {

  const params =
    useParams();

  const router =
    useRouter();


  /* =======================================================
     REPORT ID
  ======================================================= */

  const reportId =
    useMemo(() => {

      if (!params?.id) {
        return "";
      }

      return Array.isArray(params.id)
        ? params.id[0]
        : params.id;

    }, [params]);


  /* =======================================================
     STATES
  ======================================================= */

  const [
    report,
    setReport,
  ] = useState(null);

  const [
    patient,
    setPatient,
  ] = useState({
    name: "",
    patient_id: "",
    age: "",
    gender: "",
    mobile: "",
    doctor: "",
  });

  const [
    tests,
    setTests,
  ] = useState([]);

  const [
    results,
    setResults,
  ] = useState({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  /* =======================================================
     LOAD REPORT
  ======================================================= */

  useEffect(() => {

    if (!reportId) {
      return;
    }

    loadReport();

  }, [reportId]);


  async function loadReport() {

    try {

      setLoading(true);

      setErrorMessage("");

      setSuccessMessage("");


      const {
        data,
        error,
      } =
        await supabase
          .from("reports")
          .select("*")
          .eq(
            "id",
            reportId
          )
          .single();


      if (error) {
        throw error;
      }


      if (!data) {
        throw new Error(
          "Report not found"
        );
      }


      console.log(
        "================================"
      );

      console.log(
        "EDIT PAGE - FULL REPORT",
        data
      );

      console.log(
        "EDIT PAGE - REPORT DATA",
        data?.report_data
      );


      /* ---------------------------------------------------
         REPORT
      --------------------------------------------------- */

      setReport(data);


      /* ---------------------------------------------------
         REPORT DATA
      --------------------------------------------------- */

      const reportData =
        getReportData(data);


      /* ---------------------------------------------------
         PATIENT
      --------------------------------------------------- */

      const savedPatient =
        getPatient(data);


      setPatient({
        name:
          savedPatient.name || "",

        patient_id:
          savedPatient.patient_id || "",

        age:
          savedPatient.age ?? "",

        gender:
          savedPatient.gender || "",

        mobile:
          savedPatient.mobile || "",

        doctor:
          savedPatient.doctor || "",
      });


      /* ---------------------------------------------------
         RESULTS
      --------------------------------------------------- */

      const savedResults =
        getSavedResults(data);


      console.log(
        "EDIT PAGE - SAVED RESULTS",
        savedResults
      );

      console.log(
        "EDIT PAGE - SAVED RESULT KEYS",
        Object.keys(savedResults)
      );


      setResults(
        savedResults
      );


      /* ---------------------------------------------------
         TESTS
      --------------------------------------------------- */

      const savedTests =
        getSavedTests(data);


      console.log(
        "EDIT PAGE - RAW TESTS",
        savedTests
      );


      const normalizedTests =
        normalizeTests(
          savedTests
        );


      console.log(
        "EDIT PAGE - NORMALIZED TESTS",
        normalizedTests
      );


      setTests(
        normalizedTests
      );


      console.log(
        "================================"
      );

    }

    catch (error) {

      console.error(
        "LOAD REPORT ERROR:",
        error
      );

      setErrorMessage(
        error?.message ||
        "Report load nahi hui."
      );

    }

    finally {

      setLoading(false);

    }

  }


  /* =======================================================
     UPDATE PATIENT
  ======================================================= */

  function updatePatient(
    field,
    value
  ) {

    setPatient(
      previous => ({
        ...previous,
        [field]: value,
      })
    );

  }


  /* =======================================================
     UPDATE RESULT
  ======================================================= */

  function updateResult(
    test,
    parameter,
    testIndex,
    parameterIndex,
    value
  ) {

    const testId =
      getTestId(
        test,
        testIndex
      );

    const parameterId =
      parameter?.id ||
      parameter?.parameterId ||
      parameter?.parameter_id ||
      parameter?.code ||
      "";

    const parameterName =
      getParameterName(
        parameter
      );


    /*
     Primary key.
     This matches Saved Report View.
    */

    const primaryKey =
      `${testId}-${parameterName}-${parameterIndex}`;


    setResults(
      previous => ({

        ...previous,

        /*
         Primary
        */
        [primaryKey]:
          value,

        /*
         Parameter ID
        */
        ...(parameterId
          ? {
              [parameterId]:
                value,
            }
          : {}),

        /*
         Other compatible keys
        */
        [`${testId}-${parameterName}`]:
          value,

        [`${testIndex}-${parameterName}-${parameterIndex}`]:
          value,

      })
    );

  }


  /* =======================================================
     SAVE CHANGES
  ======================================================= */

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


      /* ---------------------------------------------------
         OLD REPORT DATA
      --------------------------------------------------- */

      const oldReportData =
        getReportData(report);


      /* ---------------------------------------------------
         OLD PATIENT
      --------------------------------------------------- */

      const oldPatient =
        oldReportData?.patient ||
        oldReportData?.patientData ||
        oldReportData?.patient_info ||
        oldReportData?.patientInfo ||
        {};


      /* ---------------------------------------------------
         UPDATED PATIENT
      --------------------------------------------------- */

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

        gender:
          patient.gender,

        sex:
          patient.gender,

        mobile:
          patient.mobile,

        phone:
          patient.mobile,

        mobileNumber:
          patient.mobile,

        doctor:
          patient.doctor,

        referring_doctor:
          patient.doctor,

        referringDoctor:
          patient.doctor,

        refDoctor:
          patient.doctor,

      };


      /* ---------------------------------------------------
         UPDATED TESTS
      --------------------------------------------------- */

      const updatedTests =
        tests.map(
          (
            test,
            testIndex
          ) => {

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
                          parameterIndex,
                          results
                        );


                      return {

                        ...parameter,

                        result:
                          value,

                        value:
                          value,

                        resultValue:
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


      /* ---------------------------------------------------
         UPDATED REPORT DATA
         PRESERVE EVERYTHING ELSE
      --------------------------------------------------- */

      const updatedReportData = {

        ...oldReportData,

        /*
         Updated patient
        */
        patient:
          updatedPatient,

        /*
         Keep selectedTests
        */
        selectedTests:
          updatedTests,

        /*
         Also keep tests in sync
        */
        tests:
          updatedTests,

        /*
         Keep reportTests if old report had it
        */
        ...(Array.isArray(
          oldReportData?.reportTests
        )
          ? {
              reportTests:
                updatedTests,
            }
          : {}),

        /*
         Keep investigations if old report had it
        */
        ...(Array.isArray(
          oldReportData?.investigations
        )
          ? {
              investigations:
                updatedTests,
            }
          : {}),

        /*
         Updated result object
        */
        results:
          results,

      };


      console.log(
        "================================"
      );

      console.log(
        "UPDATING REPORT DATA",
        updatedReportData
      );

      console.log(
        "UPDATED TESTS",
        updatedTests
      );

      console.log(
        "UPDATED RESULTS",
        results
      );

      console.log(
        "================================"
      );


      /* ---------------------------------------------------
         SUPABASE UPDATE
      --------------------------------------------------- */

      const {
        data,
        error,
      } =
        await supabase
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
        "REPORT UPDATED SUCCESSFULLY",
        data
      );


      setReport(data);


      setSuccessMessage(
        "Report successfully update ho gayi."
      );


      /*
       Navigate after short delay
      */

      setTimeout(() => {

        router.push(
          `/reports/${encodeURIComponent(
            reportId
          )}`
        );

        router.refresh();

      }, 700);

    }

    catch (error) {

      console.error(
        "SAVE REPORT ERROR:",
        error
      );

      setErrorMessage(
        error?.message ||
        "Report save nahi hui."
      );

    }

    finally {

      setSaving(false);

    }

  }


  /* =======================================================
     CANCEL
  ======================================================= */

  function cancelEdit() {

    router.push(
      `/reports/${encodeURIComponent(
        reportId
      )}`
    );

  }


  /* =======================================================
     LOADING
  ======================================================= */

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


  /* =======================================================
     ERROR
  ======================================================= */

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
              buttonStyle
            }
          >
            ← Back to Reports
          </button>

        </div>

      </main>

    );

  }


  /* =======================================================
     PAGE
  ======================================================= */

  return (

    <main style={pageStyle}>


      {/* ===================================================
          TOP BAR
      =================================================== */}

      <div
        style={
          topBarStyle
        }
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
              color: "#0d746d",
              marginTop: "3px",
              fontWeight: "600",
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
            disabled={
              saving
            }
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
            disabled={
              saving
            }
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


      {/* ===================================================
          MESSAGES
      =================================================== */}

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


      {/* ===================================================
          PATIENT INFORMATION
      =================================================== */}

      <section
        style={
          sectionStyle
        }
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
            onChange={
              value =>
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
            onChange={
              value =>
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
            onChange={
              value =>
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
            onChange={
              value =>
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
            onChange={
              value =>
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
            onChange={
              value =>
                updatePatient(
                  "doctor",
                  value
                )
            }
          />

        </div>

      </section>


      {/* ===================================================
          INVESTIGATION RESULTS
      =================================================== */}

      <section
        style={
          sectionStyle
        }
      >

        <SectionTitle>
          Investigation Results
        </SectionTitle>


        {tests.length === 0 ? (

          <div
            style={
              emptyStyle
            }
          >

            <strong>
              No investigations found.
            </strong>

            <p>
              Saved report में test data नहीं मिला।
            </p>

            <small
              style={{
                color: "#78909c",
              }}
            >
              Report ID:{" "}
              {reportId}
            </small>

          </div>

        ) : (

          tests.map(
            (
              test,
              testIndex
            ) => (

              <div
                key={
                  getTestId(
                    test,
                    testIndex
                  )
                }
                style={
                  testCardStyle
                }
              >

                {/* TEST TITLE */}

                <div
                  style={
                    testTitleStyle
                  }
                >
                  {getTestName(
                    test
                  )}
                </div>


                {/* TABLE */}

                <div
                  style={{
                    overflowX:
                      "auto",
                    width:
                      "100%",
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
                                parameterIndex,
                                results
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
                                    {
                                      getParameterName(
                                        parameter
                                      ) ||
                                      "-"
                                    }
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
                                    onChange={
                                      event =>
                                        updateResult(
                                          test,
                                          parameter,
                                          testIndex,
                                          parameterIndex,
                                          event.target.value
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
                            {getParameterName(
                              test
                            ) ||
                              getTestName(
                                test
                              ) ||
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
                                  0,
                                  results
                                ) ?? ""
                              }
                              onChange={
                                event =>
                                  updateResult(
                                    test,
                                    test,
                                    testIndex,
                                    0,
                                    event.target.value
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
                              test
                            )}
                          </td>


                          <td
                            style={
                              cellStyle
                            }
                          >
                            {getReference(
                              test
                            )}
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


      {/* ===================================================
          BOTTOM SAVE BAR
      =================================================== */}

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
          disabled={
            saving
          }
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
          disabled={
            saving
          }
          style={
            primaryButtonStyle
          }
        >
          {saving
            ? "Saving..."
            : "💾 Save Changes"}
        </button>

      </div>


      {/* ===================================================
          DEBUG - HIDDEN
      =================================================== */}

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


/* =========================================================
   INPUT FIELD
========================================================= */

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
        onChange={
          event =>
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


/* =========================================================
   SECTION TITLE
========================================================= */

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


/* =========================================================
   STYLES
========================================================= */

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


const buttonStyle = {

  border:
    "1px solid #b8c4c8",

  borderRadius:
    "5px",

  background:
    "#ffffff",

  padding:
    "9px 15px",

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
