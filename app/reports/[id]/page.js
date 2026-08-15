"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

/* =========================================================
   NIDAN PATHOLOGY LAB
   SAVED REPORT VIEW PAGE

   FILE:
   app/reports/[id]/page.js

   FEATURES:
   ✓ Loads report from Supabase
   ✓ Supports multiple saved test structures
   ✓ Supports selectedTests / tests / reportTests
   ✓ Supports parameters / tests / items / investigations
   ✓ Correctly reads report_data.results
   ✓ Prevents old parameter.result from overriding edited value
   ✓ Result matching by exact key
   ✓ Result matching by parameter ID
   ✓ Result matching by parameter name
   ✓ Patient information
   ✓ H / L flags
   ✓ Reference ranges
   ✓ Edit Report
   ✓ Print / Save PDF
   ✓ Dashboard button
   ✓ Back to Reports
   ✓ Mobile responsive
========================================================= */


/* =========================================================
   LAB INFORMATION
========================================================= */

const LAB = {
  name: "NIDAN PATHOLOGY LAB",
  subtitle: "Clinical Pathology & Diagnostic Laboratory",
  phone: "7987580004, 8889325233",
  address:
    "Gram/Singhanpur, Tehsil Sarangarh, District Sarangarh-Bilaigarh, Chhattisgarh",
};


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
    typeof report.report_data === "object"
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

  if (
    data?.patient &&
    typeof data.patient === "object"
  ) {
    return data.patient;
  }

  if (
    report?.patient &&
    typeof report.patient === "object"
  ) {
    return report.patient;
  }

  return {
    id:
      report?.patient_id ||
      report?.patientId ||
      "",

    patient_id:
      report?.patient_id ||
      report?.patientId ||
      "",

    name:
      report?.patient_name ||
      report?.patientName ||
      report?.name ||
      "",

    age:
      report?.age ??
      report?.patient_age ??
      "",

    gender:
      report?.gender ||
      report?.sex ||
      report?.patient_gender ||
      "",

    mobile:
      report?.mobile ||
      report?.mobile_number ||
      report?.mobileNumber ||
      report?.phone ||
      "",

    doctor:
      report?.doctor ||
      report?.referring_doctor ||
      report?.referred_by ||
      report?.referredBy ||
      "",

    collectionDate:
      report?.collection_date ||
      report?.collectionDate ||
      report?.sample_date ||
      report?.sampleDate ||
      "",
  };
}


/* =========================================================
   GET TESTS
========================================================= */

function getTests(report) {
  if (!report) {
    return [];
  }

  const data = getReportData(report);

  const possibleTests = [
    data?.tests,
    data?.selectedTests,
    data?.reportTests,

    report?.tests,
    report?.selectedTests,
    report?.reportTests,
  ];

  for (const tests of possibleTests) {
    if (
      Array.isArray(tests) &&
      tests.length > 0
    ) {
      return tests;
    }
  }

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

function getParameters(test) {
  if (!test) {
    return [];
  }

  const possibleParameters = [
    test?.parameters,
    test?.tests,
    test?.items,
    test?.investigations,
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
   GET RESULTS OBJECT
========================================================= */

function getResults(report) {
  const data = getReportData(report);

  /*
   IMPORTANT:
   report_data.results is the primary saved result source.
  */

  if (
    data?.results &&
    typeof data.results === "object" &&
    !Array.isArray(data.results)
  ) {
    return data.results;
  }

  if (
    report?.results &&
    typeof report.results === "object" &&
    !Array.isArray(report.results)
  ) {
    return report.results;
  }

  if (
    data?.testResults &&
    typeof data.testResults === "object"
  ) {
    return data.testResults;
  }

  if (
    report?.testResults &&
    typeof report.testResults === "object"
  ) {
    return report.testResults;
  }

  return {};
}


/* =========================================================
   GET TEST ID
========================================================= */

function getTestId(test, testIndex) {
  return (
    test?.id ||
    test?.testId ||
    test?.test_id ||
    test?.code ||
    `test-${testIndex}`
  );
}


/* =========================================================
   GET TEST NAME
========================================================= */

function getTestName(test) {
  return (
    test?.name ||
    test?.testName ||
    test?.test_name ||
    test?.short ||
    test?.title ||
    "Laboratory Investigation"
  );
}


/* =========================================================
   GET PARAMETER NAME
========================================================= */

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
    "";

  return [
    /* Parameter ID */
    parameterId,

    /* Common combinations */
    `${testId}-${parameterName}-${parameterIndex}`,
    `${testId}-${parameterName}`,
    `${testId}-${parameterId}`,

    `${testIndex}-${parameterName}-${parameterIndex}`,
    `${testIndex}-${parameterName}`,

    `${testIndex}_${parameterIndex}`,
    `${testIndex}-${parameterIndex}`,
    `${testIndex}.${parameterIndex}`,

    `${testName}-${parameterName}`,
    `${testName}_${parameterName}`,

    /* Plain parameter name */
    parameterName,
  ].filter(Boolean);
}


/* =========================================================
   GET RESULT

   IMPORTANT:
   Saved report_data.results gets priority.
   Old parameter.result is only fallback.
========================================================= */

function getResult(
  report,
  test,
  parameter,
  parameterIndex,
  testIndex
) {
  const results =
    getResults(report);

  const keys =
    getResultKeys(
      test,
      parameter,
      parameterIndex,
      testIndex
    );


  /* =======================================================
     1. EXACT RESULT KEY
  ======================================================= */

  for (const key of keys) {
    if (
      Object.prototype.hasOwnProperty.call(
        results,
        key
      )
    ) {
      const value =
        results[key];

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


  /* =======================================================
     2. NORMALIZED KEY MATCH
  ======================================================= */

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
      ] of Object.entries(results)
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


  /* =======================================================
     3. PARTIAL NAME MATCH
  ======================================================= */

  if (target) {
    for (
      const [
        key,
        value,
      ] of Object.entries(results)
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


  /* =======================================================
     4. TEST LEVEL RESULTS
  ======================================================= */

  const testResults =
    test?.results;

  if (
    testResults &&
    typeof testResults === "object"
  ) {
    for (const key of keys) {
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

    if (target) {
      for (
        const [
          key,
          value,
        ] of Object.entries(testResults)
      ) {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          if (
            normalizeText(key) === target
          ) {
            return value;
          }
        }
      }
    }
  }


  /* =======================================================
     5. PARAMETER RESULT FALLBACK
  ======================================================= */

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
   GET UNIT
========================================================= */

function getUnit(parameter) {
  if (
    typeof parameter === "string"
  ) {
    return "";
  }

  return (
    parameter?.unit ||
    parameter?.units ||
    ""
  );
}


/* =========================================================
   GET REFERENCE
========================================================= */

function getReference(
  parameter,
  patient
) {
  if (
    typeof parameter === "string"
  ) {
    return "-";
  }

  const gender =
    normalizeText(
      patient?.gender ||
      patient?.sex ||
      ""
    );

  if (
    gender === "male" ||
    gender === "m"
  ) {
    if (
      parameter?.maleRange
    ) {
      return parameter.maleRange;
    }

    if (
      parameter?.maleMin !== undefined &&
      parameter?.maleMax !== undefined
    ) {
      return `${parameter.maleMin} - ${parameter.maleMax}`;
    }
  }

  if (
    gender === "female" ||
    gender === "f"
  ) {
    if (
      parameter?.femaleRange
    ) {
      return parameter.femaleRange;
    }

    if (
      parameter?.femaleMin !== undefined &&
      parameter?.femaleMax !== undefined
    ) {
      return `${parameter.femaleMin} - ${parameter.femaleMax}`;
    }
  }

  if (
    parameter?.range
  ) {
    return parameter.range;
  }

  if (
    parameter?.referenceRange
  ) {
    return parameter.referenceRange;
  }

  if (
    parameter?.reference
  ) {
    return parameter.reference;
  }

  if (
    parameter?.min !== undefined &&
    parameter?.max !== undefined
  ) {
    return `${parameter.min} - ${parameter.max}`;
  }

  if (
    parameter?.minimum !== undefined &&
    parameter?.maximum !== undefined
  ) {
    return `${parameter.minimum} - ${parameter.maximum}`;
  }

  return "-";
}


/* =========================================================
   GET NUMERIC LIMITS
========================================================= */

function getLimits(
  parameter,
  patient
) {
  if (
    !parameter ||
    typeof parameter !== "object"
  ) {
    return {
      min: null,
      max: null,
    };
  }

  const gender =
    normalizeText(
      patient?.gender ||
      patient?.sex ||
      ""
    );

  if (
    (
      gender === "male" ||
      gender === "m"
    ) &&
    parameter.maleMin !== undefined &&
    parameter.maleMax !== undefined
  ) {
    return {
      min: Number(
        parameter.maleMin
      ),
      max: Number(
        parameter.maleMax
      ),
    };
  }

  if (
    (
      gender === "female" ||
      gender === "f"
    ) &&
    parameter.femaleMin !== undefined &&
    parameter.femaleMax !== undefined
  ) {
    return {
      min: Number(
        parameter.femaleMin
      ),
      max: Number(
        parameter.femaleMax
      ),
    };
  }

  if (
    parameter.min !== undefined &&
    parameter.max !== undefined
  ) {
    return {
      min: Number(
        parameter.min
      ),
      max: Number(
        parameter.max
      ),
    };
  }

  if (
    parameter.minimum !== undefined &&
    parameter.maximum !== undefined
  ) {
    return {
      min: Number(
        parameter.minimum
      ),
      max: Number(
        parameter.maximum
      ),
    };
  }

  return {
    min: null,
    max: null,
  };
}


/* =========================================================
   FLAG
========================================================= */

function getFlag(
  value,
  parameter,
  patient
) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const numeric =
    Number(
      String(value)
        .replace(/,/g, "")
        .trim()
    );

  if (
    Number.isNaN(numeric)
  ) {
    return "";
  }

  const {
    min,
    max,
  } =
    getLimits(
      parameter,
      patient
    );

  if (
    min !== null &&
    numeric < min
  ) {
    return "L";
  }

  if (
    max !== null &&
    numeric > max
  ) {
    return "H";
  }

  return "";
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(value) {
  if (!value) {
    return "-";
  }

  try {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  } catch {
    return String(value);
  }
}


/* =========================================================
   GET REPORT DATE
========================================================= */

function getReportDate(report) {
  const data =
    getReportData(report);

  return (
    data?.reportDate ||
    data?.report_date ||
    report?.reportDate ||
    report?.report_date ||
    report?.created_at ||
    ""
  );
}


/* =========================================================
   TEST CATEGORY
========================================================= */

function getTestCategory(test) {
  return (
    test?.category ||
    test?.department ||
    test?.section ||
    "PATHOLOGY"
  );
}


/* =========================================================
   PARAMETER ROW DATA
========================================================= */

function buildParameterRows(
  report,
  test,
  testIndex
) {
  const patient =
    getPatient(report);

  const parameters =
    getParameters(test);


  /* =======================================================
     PARAMETERS AVAILABLE
  ======================================================= */

  if (
    parameters.length > 0
  ) {
    return parameters.map(
      (
        parameter,
        index
      ) => {

        const value =
          getResult(
            report,
            test,
            parameter,
            index,
            testIndex
          );

        const reference =
          getReference(
            parameter,
            patient
          );

        const unit =
          getUnit(parameter);

        const flag =
          getFlag(
            value,
            parameter,
            patient
          );

        return {

          name:
            getParameterName(
              parameter
            ) || "-",

          result:
            value === null ||
            value === undefined ||
            value === ""
              ? "-"
              : value,

          unit:
            unit || "-",

          reference,

          flag,

        };

      }
    );
  }


  /* =======================================================
     SINGLE INVESTIGATION FALLBACK
  ======================================================= */

  const singleName =
    test?.parameter ||
    test?.investigation ||
    test?.parameterName ||
    test?.name ||
    "-";

  const value =
    getResult(
      report,
      test,
      test,
      0,
      testIndex
    );

  return [

    {

      name:
        singleName,

      result:
        value === null ||
        value === undefined ||
        value === ""
          ? "-"
          : value,

      unit:
        test?.unit ||
        test?.units ||
        "-",

      reference:
        test?.range ||
        test?.referenceRange ||
        test?.reference ||
        "-",

      flag:
        getFlag(
          value,
          test,
          patient
        ),

    },

  ];
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function SavedReportViewPage() {

  const params =
    useParams();

  const router =
    useRouter();


  /* =======================================================
     REPORT
  ======================================================= */

  const [
    report,
    setReport,
  ] = useState(null);


  /* =======================================================
     LOADING
  ======================================================= */

  const [
    loading,
    setLoading,
  ] = useState(true);


  /* =======================================================
     ERROR
  ======================================================= */

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  /* =======================================================
     LOAD REPORT
  ======================================================= */

  useEffect(() => {

    if (params?.id) {
      loadReport();
    }

  }, [params?.id]);


  async function loadReport() {

    try {

      setLoading(true);

      setErrorMessage("");


      const {
        data,
        error,
      } =
        await supabase
          .from("reports")
          .select("*")
          .eq(
            "id",
            params.id
          )
          .single();


      if (error) {
        throw error;
      }


      console.log(
        "NIDAN REPORT LOADED:",
        data
      );


      console.log(
        "REPORT DATA:",
        data?.report_data
      );


      console.log(
        "SAVED TESTS:",
        getTests(data)
      );


      console.log(
        "SAVED RESULTS:",
        getResults(data)
      );


      setReport(data);

    }

    catch (error) {

      console.error(
        "Report load error:",
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
     PATIENT
  ======================================================= */

  const patient =
    useMemo(() => {

      return getPatient(report);

    }, [report]);


  /* =======================================================
     TESTS
  ======================================================= */

  const tests =
    useMemo(() => {

      return getTests(report);

    }, [report]);


  /* =======================================================
     RESULTS
  ======================================================= */

  const results =
    useMemo(() => {

      return getResults(report);

    }, [report]);


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {

    return (

      <main className="loadingPage">

        <div className="loadingCard">

          <div className="loadingLogo">
            N+
          </div>

          <h2>
            Report loading...
          </h2>

          <p>
            Saved laboratory report load
            ho rahi hai.
          </p>

        </div>

      </main>

    );

  }


  /* =======================================================
     ERROR
  ======================================================= */

  if (
    errorMessage ||
    !report
  ) {

    return (

      <main className="errorPage">

        <div className="errorCard">

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
          >
            ← Back to Reports
          </button>

        </div>

      </main>

    );

  }


  /* =======================================================
     PATIENT VALUES
  ======================================================= */

  const patientName =
    patient?.name ||
    patient?.patientName ||
    patient?.patient_name ||
    report?.patient_name ||
    report?.patientName ||
    "-";


  const patientId =
    patient?.id ||
    patient?.patient_id ||
    patient?.patientId ||
    report?.patient_id ||
    report?.patientId ||
    "-";


  const patientAge =
    patient?.age ??
    report?.age ??
    report?.patient_age ??
    "-";


  const patientGender =
    patient?.gender ||
    patient?.sex ||
    report?.gender ||
    report?.sex ||
    "-";


  const patientMobile =
    patient?.mobile ||
    patient?.mobileNumber ||
    patient?.mobile_number ||
    patient?.phone ||
    report?.mobile ||
    report?.mobile_number ||
    "-";


  const referringDoctor =
    patient?.doctor ||
    patient?.referring_doctor ||
    patient?.referringDoctor ||
    patient?.referred_by ||
    patient?.referredBy ||
    report?.doctor ||
    report?.referring_doctor ||
    report?.referred_by ||
    "-";


  const reportNumber =
    report?.report_no ||
    report?.reportNo ||
    "-";


  const reportDate =
    getReportDate(report);


  /* =======================================================
     DASHBOARD
  ======================================================= */

  function goToDashboard() {

    router.push(
      "/dashboard"
    );

  }


  /* =======================================================
     EDIT REPORT
  ======================================================= */

  function editReport() {

    if (!report?.id) {

      alert(
        "Report ID nahi mila."
      );

      return;

    }


    router.push(
      `/reports/${encodeURIComponent(
        report.id
      )}/edit`
    );

  }


  /* =======================================================
     PRINT
  ======================================================= */

  function printReport() {

    window.print();

  }


  /* =======================================================
     UI
  ======================================================= */

  return (

    <main className="page">


      {/* =================================================
          ACTION BAR
      ================================================= */}

      <div className="actionBar no-print">


        {/* LEFT BUTTONS */}

        <div className="actionLeft">


          {/* DASHBOARD */}

          <button
            onClick={
              goToDashboard
            }
            className="dashboardButton"
          >
            🏠 Dashboard
          </button>


          {/* BACK TO REPORTS */}

          <button
            onClick={() =>
              router.push(
                "/reports"
              )
            }
            className="backButton"
          >
            ← Back to Reports
          </button>

        </div>


        {/* RIGHT BUTTONS */}

        <div className="actionRight">


          {/* EDIT */}

          <button
            onClick={
              editReport
            }
            className="editButton"
          >
            ✏️ Edit Report
          </button>


          {/* PRINT */}

          <button
            onClick={
              printReport
            }
            className="printButton"
          >
            🖨 Print / Save PDF
          </button>

        </div>

      </div>


      {/* =================================================
          REPORT A4
      ================================================= */}

      <div className="reportPage">


        {/* =================================================
            HEADER
        ================================================= */}

        <header className="labHeader">


          <div className="brandArea">


            <div className="logo">

              <span>
                N
              </span>

              <i className="ray ray1" />
              <i className="ray ray2" />
              <i className="ray ray3" />
              <i className="ray ray4" />

            </div>


            <div className="brandText">

              <h1>
                {LAB.name}
              </h1>

              <h2>
                {LAB.subtitle}
              </h2>

              <p>
                Accurate Diagnosis • Trusted Care • Better Health
              </p>

            </div>

          </div>


          <div className="headerInfo">

            <span className="reportBadge">
              LABORATORY REPORT
            </span>


            <div>
              ☎ {LAB.phone}
            </div>


            <div>
              📍 {LAB.address}
            </div>


            <div>
              Report No:
              <strong>
                {" "}
                {reportNumber}
              </strong>
            </div>


            <div>
              Report Date:
              <strong>
                {" "}
                {formatDate(
                  reportDate
                )}
              </strong>
            </div>

          </div>

        </header>


        {/* ACCENT */}

        <div className="accent">

          <span />
          <b />
          <i />

        </div>


        {/* =================================================
            PATIENT INFORMATION
        ================================================= */}

        <section className="patientSection">


          <div className="sectionTitle">

            <span>
              P
            </span>

            PATIENT INFORMATION

          </div>


          <div className="patientGrid">


            <Info
              label="Patient Name"
              value={
                patientName
              }
              strong
            />


            <Info
              label="Patient ID"
              value={
                patientId
              }
            />


            <Info
              label="Age / Sex"
              value={
                `${patientAge} / ${patientGender}`
              }
            />


            <Info
              label="Mobile"
              value={
                patientMobile
              }
            />


            <Info
              label="Referred By"
              value={
                referringDoctor
              }
            />


            <Info
              label="Collection Date"
              value={
                patient?.collectionDate ||
                patient?.collection_date ||
                patient?.sampleDate ||
                patient?.sample_date ||
                "-"
              }
            />


            <Info
              label="Report Date"
              value={
                formatDate(
                  reportDate
                )
              }
            />


            <Info
              label="Report Status"
              value="FINAL"
              status
            />

          </div>

        </section>


        {/* =================================================
            TEST RESULTS
        ================================================= */}

        <section className="testsArea">


          {tests.length === 0 ? (

            <div className="noInvestigations">

              <div className="noIcon">
                ⚠
              </div>


              <strong>
                No investigations available.
              </strong>


              <p>
                Saved report में test data नहीं मिला।
              </p>


              <small>
                Report ID: {report?.id || "-"}
              </small>

            </div>

          ) : (

            tests.map(
              (
                test,
                testIndex
              ) => {

                const rows =
                  buildParameterRows(
                    report,
                    test,
                    testIndex
                  );


                return (

                  <section
                    key={
                      getTestId(
                        test,
                        testIndex
                      )
                    }
                    className="testSection"
                  >


                    {/* TEST TITLE */}

                    <div className="testTitle">


                      <span className="department">

                        {String(
                          getTestCategory(
                            test
                          )
                        ).toUpperCase()}

                      </span>


                      <strong>
                        {getTestName(
                          test
                        )}
                      </strong>


                      <i />

                    </div>


                    {/* TEST TABLE */}

                    <table className="resultTable">


                      <colgroup>

                        <col className="colInvestigation" />

                        <col className="colFlag" />

                        <col className="colResult" />

                        <col className="colReference" />

                        <col className="colUnit" />

                      </colgroup>


                      <thead>

                        <tr>

                          <th>
                            INVESTIGATION
                          </th>

                          <th>
                            FLAG
                          </th>

                          <th>
                            RESULT
                          </th>

                          <th>
                            REFERENCE RANGE
                          </th>

                          <th>
                            UNIT
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {rows.map(
                          (
                            row,
                            index
                          ) => (

                            <tr
                              key={
                                `${getTestId(
                                  test,
                                  testIndex
                                )}-${row.name}-${index}`
                              }
                            >


                              <td className="investigationCell">
                                {row.name}
                              </td>


                              <td className="flagCell">


                                {row.flag ===
                                "H" ? (

                                  <span className="flag high">
                                    H
                                  </span>

                                ) : row.flag ===
                                  "L" ? (

                                  <span className="flag low">
                                    L
                                  </span>

                                ) : (

                                  <span className="normalDot">
                                    •
                                  </span>

                                )}

                              </td>


                              <td className="resultCell">

                                <span
                                  className={
                                    "resultValue " +
                                    (
                                      row.flag
                                        ? "abnormal"
                                        : ""
                                    )
                                  }
                                >
                                  {row.result}
                                </span>

                              </td>


                              <td className="referenceCell">
                                {row.reference}
                              </td>


                              <td className="unitCell">
                                {row.unit}
                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </section>

                );

              }
            )

          )}

        </section>


        {/* =================================================
            SIGNATURE
        ================================================= */}

        <section className="signatures">


          <div className="signature">

            <div className="signatureSpace" />

            <strong>
              Lab Technician
            </strong>

            <small>
              NIDAN Pathology Lab
            </small>

          </div>


          <div className="signature right">

            <div className="signatureSpace" />

            <strong>
              Authorized Signatory
            </strong>

            <small>
              Signature &amp; Seal
            </small>

          </div>

        </section>


        {/* =================================================
            NOTE
        ================================================= */}

        <div className="note">

          <strong>
            Note:
          </strong>{" "}

          Reference ranges may vary according
          to laboratory methodology, age and
          clinical condition. Results should
          be interpreted by a qualified
          healthcare professional.

        </div>


        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="footer">

          <strong>
            NIDAN PATHOLOGY LAB
          </strong>


          <span>
            {LAB.subtitle}
          </span>


          <small>
            ☎ {LAB.phone}
            &nbsp; | &nbsp;
            {LAB.address}
          </small>


          <em>
            Computer Generated Laboratory Report
          </em>

        </footer>

      </div>


      {/* =================================================
          CSS
      ================================================= */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }


        html,
        body {
          margin: 0;
          padding: 0;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          background: #eef3f8;

          color: #172033;
        }


        button {
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }


        /* ===============================================
           LOADING
        =============================================== */

        .loadingPage,
        .errorPage {
          min-height: 100vh;

          display: flex;

          align-items: center;

          justify-content: center;

          padding: 20px;

          background: #eef3f8;
        }


        .loadingCard,
        .errorCard {
          width: 100%;

          max-width: 450px;

          padding: 35px;

          background: white;

          border-radius: 12px;

          text-align: center;

          box-shadow:
            0 8px 30px
            rgba(0,0,0,.08);
        }


        .loadingLogo {
          width: 60px;
          height: 60px;

          margin: 0 auto 15px;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 50%;

          color: white;

          background:
            linear-gradient(
              135deg,
              #087f72,
              #0b6676
            );

          font-weight: 900;

          font-size: 22px;
        }


        .loadingCard h2,
        .errorCard h2 {
          margin: 0 0 8px;

          font-size: 20px;
        }


        .loadingCard p,
        .errorCard p {
          margin: 0 0 20px;

          color: #667085;

          font-size: 13px;
        }


        .errorCard button {
          padding: 10px 18px;

          border:
            1px solid #087f72;

          border-radius: 6px;

          background: white;

          color: #087f72;

          font-weight: 800;

          cursor: pointer;
        }


        /* ===============================================
           MAIN PAGE
        =============================================== */

        .page {
          min-height: 100vh;

          padding: 14px 10px 40px;

          background:
            linear-gradient(
              180deg,
              #eef3f8,
              #e7edf3
            );
        }


        /* ===============================================
           ACTION BAR
        =============================================== */

        .actionBar {
          width: 100%;

          max-width: 1200px;

          margin: 0 auto 12px;

          padding: 8px 10px;

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 10px;

          background: white;

          border:
            1px solid #dce4eb;

          border-radius: 7px;

          box-shadow:
            0 2px 10px
            rgba(16,24,40,.05);
        }


        /* ===============================================
           LEFT ACTION BUTTONS
        =============================================== */

        .actionLeft {
          display: flex;

          align-items: center;

          gap: 7px;

          flex-wrap: wrap;
        }


        /* ===============================================
           RIGHT ACTION BUTTONS
        =============================================== */

        .actionRight {
          display: flex;

          gap: 7px;

          flex-wrap: wrap;
        }


        /* ===============================================
           ALL ACTION BUTTONS
        =============================================== */

        .dashboardButton,
        .backButton,
        .editButton,
        .printButton {

          padding:
            7px 12px;

          border-radius:
            6px;

          font-size:
            9px;

          font-weight:
            900;

          cursor:
            pointer;

          white-space:
            nowrap;

        }


        /* ===============================================
           DASHBOARD BUTTON
        =============================================== */

        .dashboardButton {

          background:
            #e9f8f5;

          border:
            1px solid #087f72;

          color:
            #087f72;

        }


        .dashboardButton:hover {

          background:
            #d9f2ed;

        }


        /* ===============================================
           BACK BUTTON
        =============================================== */

        .backButton {

          background:
            white;

          border:
            1px solid #b9c8e7;

          color:
            #244c96;

        }


        .backButton:hover {

          background:
            #f5f8ff;

        }


        /* ===============================================
           EDIT BUTTON
        =============================================== */

        .editButton {

          background:
            #fffdf4;

          border:
            1px solid #e4c979;

          color:
            #8a6500;

        }


        .editButton:hover {

          background:
            #fff8dd;

        }


        /* ===============================================
           PRINT BUTTON
        =============================================== */

        .printButton {

          background:
            linear-gradient(
              135deg,
              #087f72,
              #0b6676
            );

          border:
            1px solid #087f72;

          color:
            white;

        }


        .printButton:hover {

          opacity:
            .92;

        }


        /* ===============================================
           A4 REPORT
        =============================================== */

        .reportPage {

          position:
            relative;

          width:
            210mm;

          min-height:
            297mm;

          height:
            297mm;

          max-height:
            297mm;

          margin:
            0 auto;

          padding:
            0 11mm 17mm;

          background:
            white;

          overflow:
            hidden;

          box-shadow:
            0 12px 35px
            rgba(16,24,40,.14);

        }


        /* ===============================================
           HEADER
        =============================================== */

        .labHeader {

          height:
            35mm;

          padding-top:
            6mm;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            8mm;

        }


        .brandArea {

          display:
            flex;

          align-items:
            center;

          gap:
            4mm;

        }


        .logo {

          position:
            relative;

          width:
            22mm;

          height:
            22mm;

          flex-shrink:
            0;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border:
            1.5px solid #087f72;

          border-radius:
            50%;

          background:
            radial-gradient(
              circle,
              white 45%,
              #effbf8 100%
            );

          box-shadow:
            inset 0 0 0 2px #d7f2ed;

        }


        .logo span {

          position:
            relative;

          z-index:
            2;

          color:
            #087f72;

          font-size:
            20px;

          font-weight:
            950;

        }


        .ray {

          position:
            absolute;

          width:
            14mm;

          height:
            .5px;

          background:
            #eabf43;

        }


        .ray1 {
          transform:
            rotate(0deg);
        }


        .ray2 {
          transform:
            rotate(45deg);
        }


        .ray3 {
          transform:
            rotate(90deg);
        }


        .ray4 {
          transform:
            rotate(135deg);
        }


        .brandText h1 {

          margin:
            0;

          color:
            #101828;

          font-size:
            21px;

          line-height:
            1;

          font-weight:
            950;

        }


        .brandText h2 {

          margin:
            3px 0 0;

          color:
            #087f72;

          font-size:
            7px;

          letter-spacing:
            .8px;

          font-weight:
            900;

        }


        .brandText p {

          margin:
            4px 0 0;

          color:
            #667085;

          font-size:
            5.5px;

          font-weight:
            700;

        }


        .headerInfo {

          width:
            68mm;

          text-align:
            right;

          color:
            #667085;

          font-size:
            5.5px;

          line-height:
            1.55;

        }


        .reportBadge {

          display:
            inline-block;

          margin-bottom:
            2px;

          padding:
            2px 5px;

          border-radius:
            3px;

          background:
            #e9f8f5;

          color:
            #087f72;

          font-size:
            5.8px;

          font-weight:
            950;

          letter-spacing:
            .5px;

        }


        .accent {

          height:
            1.5px;

          display:
            flex;

          gap:
            2px;

          margin-bottom:
            4mm;

        }


        .accent span {

          flex:
            4;

          background:
            #087f72;

        }


        .accent b {

          flex:
            1;

          background:
            #eabf43;

        }


        .accent i {

          flex:
            6;

          background:
            #dce5ea;

        }


        /* ===============================================
           PATIENT
        =============================================== */

        .patientSection {

          margin-bottom:
            4mm;

          border:
            1px solid #d7e0e6;

          border-radius:
            4px;

          overflow:
            hidden;

        }


        .sectionTitle {

          height:
            6.5mm;

          padding:
            0 3mm;

          display:
            flex;

          align-items:
            center;

          gap:
            5px;

          background:
            linear-gradient(
              90deg,
              #087f72,
              #0c7180
            );

          color:
            white;

          font-size:
            6.5px;

          font-weight:
            950;

          letter-spacing:
            .6px;

        }


        .sectionTitle span {

          width:
            15px;

          height:
            15px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            50%;

          background:
            rgba(
              255,
              255,
              255,
              .18
            );

          font-size:
            6px;

        }


        .patientGrid {

          display:
            grid;

          grid-template-columns:
            repeat(4,1fr);

        }


        .infoCell {

          min-height:
            9mm;

          padding:
            2mm 3mm;

          border-right:
            1px solid #e3e8ed;

          border-bottom:
            1px solid #e3e8ed;

        }


        .infoCell:nth-child(4n) {

          border-right:
            0;

        }


        .infoCell:nth-last-child(-n+4) {

          border-bottom:
            0;

        }


        .infoLabel {

          display:
            block;

          margin-bottom:
            1px;

          color:
            #7a8796;

          font-size:
            4.7px;

          font-weight:
            800;

          text-transform:
            uppercase;

        }


        .infoValue {

          display:
            block;

          color:
            #172033;

          font-size:
            6.4px;

          font-weight:
            700;

          overflow-wrap:
            anywhere;

        }


        .infoValue.strong {

          font-size:
            7px;

          font-weight:
            950;

        }


        .infoValue.status {

          color:
            #15803d;

          font-weight:
            950;

        }


        /* ===============================================
           TEST AREA
        =============================================== */

        .testsArea {

          display:
            flex;

          flex-direction:
            column;

          gap:
            3.5mm;

        }


        .testSection {

          break-inside:
            avoid;

          page-break-inside:
            avoid;

        }


        .testTitle {

          min-height:
            7mm;

          margin-bottom:
            1.8mm;

          display:
            flex;

          align-items:
            center;

          gap:
            2.5mm;

        }


        .department {

          flex-shrink:
            0;

          padding:
            2.5px 6px;

          border-radius:
            3px;

          background:
            #e8f7f4;

          color:
            #087f72;

          font-size:
            5px;

          font-weight:
            950;

          letter-spacing:
            .6px;

        }


        .testTitle strong {

          flex:
            1;

          padding:
            2.2mm 3.5mm;

          border-left:
            3px solid #087f72;

          border-radius:
            3px;

          background:
            linear-gradient(
              90deg,
              #f0faf8,
              white
            );

          color:
            #101828;

          font-size:
            9.5px;

          font-weight:
            950;

        }


        .testTitle i {

          width:
            18mm;

          height:
            1px;

          background:
            linear-gradient(
              90deg,
              #087f72,
              transparent
            );

        }


        /* ===============================================
           RESULT TABLE
        =============================================== */

        .resultTable {

          width:
            100%;

          table-layout:
            fixed;

          border-collapse:
            separate;

          border-spacing:
            0;

          border:
            1px solid #cfd9e0;

          border-radius:
            4px;

          overflow:
            hidden;

        }


        .resultTable th {

          height:
            6.5mm;

          padding:
            1.3mm;

          background:
            linear-gradient(
              180deg,
              #eef5f7,
              #e3edf0
            );

          color:
            #344054;

          border-right:
            1px solid #d2dce2;

          border-bottom:
            1px solid #cbd6dc;

          text-align:
            center;

          font-size:
            5.1px;

          font-weight:
            950;

        }


        .resultTable th:last-child {

          border-right:
            0;

        }


        .resultTable td {

          height:
            6.8mm;

          padding:
            1mm 1.8mm;

          color:
            #273443;

          border-right:
            1px solid #e1e7eb;

          border-bottom:
            1px solid #e5eaee;

          font-size:
            5.8px;

          vertical-align:
            middle;

        }


        .resultTable tr:last-child td {

          border-bottom:
            0;

        }


        .resultTable td:last-child {

          border-right:
            0;

        }


        .resultTable tbody tr:nth-child(even) td {

          background:
            #fbfcfd;

        }


        .colInvestigation {
          width:
            30%;
        }


        .colFlag {
          width:
            8%;
        }


        .colResult {
          width:
            19%;
        }


        .colReference {
          width:
            28%;
        }


        .colUnit {
          width:
            15%;
        }


        .investigationCell {

          font-size:
            6px !important;

          font-weight:
            800;

        }


        .flagCell,
        .resultCell,
        .referenceCell,
        .unitCell {

          text-align:
            center;

        }


        .resultValue {

          display:
            inline-flex;

          min-width:
            24mm;

          height:
            6mm;

          padding:
            1mm 2.5mm;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            3px;

          background:
            #f2f6f9;

          color:
            #101828;

          font-size:
            7.5px;

          font-weight:
            950;

        }


        .resultValue.abnormal {

          background:
            #fff1f0;

          border:
            1px solid #f5c8c5;

          color:
            #b42318;

        }


        .flag {

          display:
            inline-flex;

          width:
            14px;

          height:
            14px;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            3px;

          font-size:
            5.5px;

          font-weight:
            950;

        }


        .flag.high {

          color:
            #b42318;

          background:
            #fee4e2;

          border:
            1px solid #fecdca;

        }


        .flag.low {

          color:
            #175cd3;

          background:
            #eff8ff;

          border:
            1px solid #b2ddff;

        }


        .normalDot {

          color:
            #159957;

          font-size:
            10px;

          font-weight:
            900;

        }


        /* ===============================================
           NO INVESTIGATION
        =============================================== */

        .noInvestigations {

          padding:
            18mm 10mm;

          text-align:
            center;

          color:
            #667085;

          border:
            1px dashed #cfd9e0;

          border-radius:
            5px;

          background:
            #fafcfd;

        }


        .noIcon {

          margin-bottom:
            4px;

          font-size:
            22px;

        }


        .noInvestigations strong {

          display:
            block;

          color:
            #344054;

          font-size:
            10px;

        }


        .noInvestigations p {

          margin:
            5px 0;

          font-size:
            7px;

        }


        .noInvestigations small {

          font-size:
            5px;

          color:
            #98a2b3;

        }


        /* ===============================================
           SIGNATURE
        =============================================== */

        .signatures {

          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            30mm;

          margin-top:
            4.5mm;

          break-inside:
            avoid;

          page-break-inside:
            avoid;

        }


        .signature {

          text-align:
            center;

          min-height:
            10mm;

          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            flex-end;

        }


        .signature.right {

          text-align:
            center;

        }


        .signatureSpace {

          height:
            5mm;

          width:
            100%;

        }


        .signature strong {

          font-size:
            6px;

        }


        .signature small {

          margin-top:
            1px;

          color:
            #667085;

          font-size:
            4.5px;

        }


        /* ===============================================
           NOTE
        =============================================== */

        .note {

          margin-top:
            2.5mm;

          padding:
            1.8mm 2.5mm;

          border:
            1px solid #dbe3e8;

          border-radius:
            3px;

          background:
            #f8fafb;

          color:
            #667085;

          font-size:
            4.5px;

          line-height:
            1.35;

          break-inside:
            avoid;

          page-break-inside:
            avoid;

        }


        .note strong {

          color:
            #344054;

        }


        /* ===============================================
           FOOTER
        =============================================== */

        .footer {

          position:
            absolute;

          left:
            0;

          right:
            0;

          bottom:
            0;

          height:
            12mm;

          padding:
            2.2mm 11mm;

          text-align:
            center;

          border-top:
            1px solid #dce4e8;

          background:
            linear-gradient(
              180deg,
              #f8fafb,
              #eef3f5
            );

        }


        .footer strong {

          display:
            block;

          color:
            #087f72;

          font-size:
            5.8px;

          font-weight:
            950;

          letter-spacing:
            .6px;

        }


        .footer span {

          display:
            block;

          margin-top:
            1px;

          color:
            #667085;

          font-size:
            3.8px;

        }


        .footer small {

          display:
            block;

          margin-top:
            1px;

          color:
            #98a2b3;

          font-size:
            3.4px;

        }


        .footer em {

          display:
            block;

          margin-top:
            1px;

          color:
            #98a2b3;

          font-size:
            3.4px;

          font-style:
            normal;

        }


        /* ===============================================
           MOBILE
        =============================================== */

        @media (max-width: 700px) {


          .page {

            padding:
              8px 2px 25px;

          }


          .actionBar {

            flex-direction:
              column;

            align-items:
              stretch;

            padding:
              7px;

          }


          .actionLeft,
          .actionRight {

            width:
              100%;

          }


          .actionLeft {

            display:
              grid;

            grid-template-columns:
              1fr 1fr;

          }


          .actionRight {

            display:
              grid;

            grid-template-columns:
              1fr 1fr;

          }


          .dashboardButton,
          .backButton,
          .editButton,
          .printButton {

            width:
              100%;

            font-size:
              8px;

          }


          .printButton {

            grid-column:
              span 2;

          }


          .reportPage {

            width:
              calc(100vw - 8px);

            height:
              calc(
                (100vw - 8px)
                * 1.4142857
              );

            min-height:
              calc(
                (100vw - 8px)
                * 1.4142857
              );

            max-height:
              calc(
                (100vw - 8px)
                * 1.4142857
              );

            padding-left:
              4.5mm;

            padding-right:
              4.5mm;

            padding-bottom:
              15mm;

          }


          .labHeader {

            height:
              31mm;

            padding-top:
              5mm;

            gap:
              3mm;

          }


          .logo {

            width:
              17mm;

            height:
              17mm;

          }


          .logo span {

            font-size:
              15px;

          }


          .brandArea {

            gap:
              2.5mm;

          }


          .brandText h1 {

            font-size:
              13px;

          }


          .brandText h2 {

            font-size:
              4.2px;

          }


          .brandText p {

            font-size:
              3.5px;

          }


          .headerInfo {

            width:
              40mm;

            font-size:
              3.7px;

          }


          .reportBadge {

            font-size:
              4px;

          }


          .patientGrid {

            grid-template-columns:
              repeat(2,1fr);

          }


          .infoCell:nth-child(4n) {

            border-right:
              1px solid #e3e8ed;

          }


          .infoCell:nth-child(2n) {

            border-right:
              0;

          }


          .infoCell:nth-last-child(-n+4) {

            border-bottom:
              1px solid #e3e8ed;

          }


          .infoCell:nth-last-child(-n+2) {

            border-bottom:
              0;

          }


          .infoCell {

            min-height:
              8mm;

            padding:
              1.5mm 2mm;

          }


          .sectionTitle {

            height:
              5.5mm;

            font-size:
              4.5px;

          }


          .sectionTitle span {

            width:
              11px;

            height:
              11px;

            font-size:
              5px;

          }


          .infoLabel {

            font-size:
              3.5px;

          }


          .infoValue {

            font-size:
              4.8px;

          }


          .infoValue.strong {

            font-size:
              5.2px;

          }


          .testTitle {

            min-height:
              6mm;

            margin-bottom:
              1.3mm;

          }


          .department {

            font-size:
              3.5px;

          }


          .testTitle strong {

            font-size:
              6.3px;

            padding:
              1.7mm 2mm;

          }


          .resultTable th {

            height:
              5.3mm;

            padding:
              1mm;

            font-size:
              3.4px;

          }


          .resultTable td {

            height:
              5.5mm;

            padding:
              .7mm 1mm;

            font-size:
              3.9px;

          }


          .investigationCell {

            font-size:
              3.9px !important;

          }


          .resultValue {

            min-width:
              14mm;

            height:
              4.8mm;

            font-size:
              5.3px;

          }


          .flag {

            width:
              11px;

            height:
              11px;

            font-size:
              4px;

          }


          .normalDot {

            font-size:
              7px;

          }


          .signatures {

            gap:
              15mm;

            margin-top:
              3mm;

          }


          .signatureSpace {

            height:
              4mm;

          }


          .signature strong {

            font-size:
              4px;

          }


          .signature small {

            font-size:
              3px;

          }


          .note {

            margin-top:
              2mm;

            font-size:
              3px;

          }


          .footer {

            height:
              10mm;

            padding:
              2mm 5mm;

          }


          .footer strong {

            font-size:
              4.5px;

          }


          .footer span {

            font-size:
              3px;

          }


          .footer small,
          .footer em {

            font-size:
              2.5px;

          }

        }


        /* ===============================================
           PRINT
        =============================================== */

        @media print {


          @page {

            size:
              A4 portrait;

            margin:
              0;

          }


          html,
          body {

            width:
              210mm !important;

            height:
              297mm !important;

            margin:
              0 !important;

            padding:
              0 !important;

            background:
              white !important;

            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;

          }


          .no-print {

            display:
              none !important;

          }


          .page {

            width:
              210mm !important;

            height:
              297mm !important;

            min-height:
              297mm !important;

            padding:
              0 !important;

            margin:
              0 !important;

            background:
              white !important;

          }


          .reportPage {

            width:
              210mm !important;

            height:
              297mm !important;

            min-height:
              297mm !important;

            max-height:
              297mm !important;

            margin:
              0 !important;

            padding:
              0 11mm 17mm !important;

            box-shadow:
              none !important;

            overflow:
              hidden !important;

            page-break-after:
              always;

            break-after:
              page;

            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;

          }


          .testSection,
          .patientSection,
          .signatures,
          .note {

            break-inside:
              avoid !important;

            page-break-inside:
              avoid !important;

          }

        }

      `}</style>

    </main>

  );
}


/* =========================================================
   INFO COMPONENT
========================================================= */

function Info({
  label,
  value,
  strong = false,
  status = false,
}) {

  return (

    <div className="infoCell">

      <span className="infoLabel">
        {label}
      </span>


      <span
        className={
          "infoValue " +
          (strong
            ? "strong "
            : "") +
          (status
            ? "status"
            : "")
        }
      >
        {value || "-"}
      </span>

    </div>

  );

}
