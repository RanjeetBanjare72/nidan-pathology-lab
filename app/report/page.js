"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

/* =========================================================
   NIDAN PATHOLOGY LAB
   PROFESSIONAL A4 REPORT PAGE

   IMPORTANT:
   - Settings page stores letterhead in:
     nidanLabSettings
   - Letterhead is used as FULL A4 background.
   - Report content is placed only in the middle area.
   ========================================================= */


/* =========================================================
   DEFAULT SETTINGS
   ========================================================= */

const DEFAULT_SETTINGS = {
  labName: "NIDAN PATHOLOGY LAB",
  labAddress: "",
  phone: "",
  email: "",
  registrationNo: "",
  doctorName: "",

  letterhead: "",

  reportHeader: true,
  showLogo: true,
  showReferenceRange: true,
  showFlag: true,
  autoSave: true,
};


/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function ReportPage() {
  const router = useRouter();

  /* =======================================================
     STATE
     ======================================================= */

  const [patient, setPatient] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
  const [results, setResults] = useState({});

  const [reportDate, setReportDate] = useState("");
  const [reportNo, setReportNo] = useState("");

  const [saveStatus, setSaveStatus] = useState("loading");
  const [saveMessage, setSaveMessage] = useState("");

  const [settings, setSettings] =
    useState(DEFAULT_SETTINGS);

  const [settingsLoaded, setSettingsLoaded] =
    useState(false);

  const savingRef = useRef(false);
  const saveTimerRef = useRef(null);


  /* =======================================================
     LOAD DATA
     ======================================================= */

  useEffect(() => {
    try {
      const savedPatient =
        JSON.parse(
          localStorage.getItem(
            "nidanPatient"
          ) || "{}"
        );

      const savedTests =
        JSON.parse(
          localStorage.getItem(
            "nidanSelectedTests"
          ) || "[]"
        );

      const savedResults =
        JSON.parse(
          localStorage.getItem(
            "nidanResults"
          ) || "{}"
        );

      const savedSettings =
        JSON.parse(
          localStorage.getItem(
            "nidanLabSettings"
          ) || "{}"
        );

      setPatient(
        savedPatient || {}
      );

      setSelectedTests(
        Array.isArray(savedTests)
          ? savedTests
          : []
      );

      setResults(
        savedResults || {}
      );

      setSettings({
        ...DEFAULT_SETTINGS,
        ...(savedSettings || {}),
      });

      setReportDate(
        new Date().toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }
        )
      );

    } catch (error) {
      console.error(
        "REPORT DATA LOAD ERROR:",
        error
      );

      setSaveStatus("error");

      setSaveMessage(
        "Report data load nahi hua."
      );
    } finally {
      setSettingsLoaded(true);
    }
  }, []);


  /* =======================================================
     NORMALIZE NAME
     ======================================================= */

  function normalizeName(name = "") {
    return String(name)
      .toLowerCase()
      .replace(/[()]/g, "")
      .replace(/[./_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }


  /* =======================================================
     GENDER
     ======================================================= */

  function getGender() {
    const gender =
      String(
        patient.gender ||
          patient.sex ||
          ""
      )
        .trim()
        .toLowerCase();

    if (
      gender === "male" ||
      gender === "m" ||
      gender === "पुरुष"
    ) {
      return "male";
    }

    if (
      gender === "female" ||
      gender === "f" ||
      gender === "महिला"
    ) {
      return "female";
    }

    return "";
  }


  /* =======================================================
     AGE
     ======================================================= */

  function getAge() {
    const age =
      parseFloat(
        patient.age
      );

    return Number.isNaN(age)
      ? null
      : age;
  }


  /* =======================================================
     DEFAULT REFERENCE DATABASE
     ======================================================= */

  function getDefaultReference(
    parameterName
  ) {
    const name =
      normalizeName(
        parameterName
      );

    const gender =
      getGender();

    const age =
      getAge();


    /* ================= CBC ================= */

    if (
      name === "hemoglobin" ||
      name === "haemoglobin" ||
      name === "hb"
    ) {
      if (
        age !== null &&
        age < 12
      ) {
        return {
          min: 11,
          max: 15,
          unit: "g/dL",
          range: "11 - 15",
        };
      }

      if (
        gender === "female"
      ) {
        return {
          min: 12,
          max: 15,
          unit: "g/dL",
          range: "12 - 15",
        };
      }

      return {
        min: 13,
        max: 17,
        unit: "g/dL",
        range: "13 - 17",
      };
    }


    if (
      name.includes(
        "total leucocyte"
      ) ||
      name.includes(
        "total leukocyte"
      ) ||
      name === "tlc" ||
      name.includes("wbc")
    ) {
      return {
        min: 4000,
        max: 11000,
        unit: "/cumm",
        range: "4000 - 11000",
      };
    }


    if (
      name === "neutrophils"
    ) {
      return {
        min: 40,
        max: 75,
        unit: "%",
        range: "40 - 75",
      };
    }


    if (
      name === "lymphocytes"
    ) {
      return {
        min: 20,
        max: 40,
        unit: "%",
        range: "20 - 40",
      };
    }


    if (
      name === "eosinophils"
    ) {
      return {
        min: 1,
        max: 6,
        unit: "%",
        range: "1 - 6",
      };
    }


    if (
      name === "monocytes"
    ) {
      return {
        min: 1,
        max: 10,
        unit: "%",
        range: "1 - 10",
      };
    }


    if (
      name === "basophils"
    ) {
      return {
        min: 0,
        max: 1,
        unit: "%",
        range: "0 - 1",
      };
    }


    if (
      name === "rbc count" ||
      name === "total rbc count"
    ) {
      if (
        gender === "female"
      ) {
        return {
          min: 4.0,
          max: 5.5,
          unit: "million/cumm",
          range: "4.0 - 5.5",
        };
      }

      return {
        min: 4.5,
        max: 6.0,
        unit: "million/cumm",
        range: "4.5 - 6.0",
      };
    }


    if (
      name.includes("pcv") ||
      name.includes("haematocrit") ||
      name.includes("hematocrit")
    ) {
      if (
        gender === "female"
      ) {
        return {
          min: 36,
          max: 46,
          unit: "%",
          range: "36 - 46",
        };
      }

      return {
        min: 40,
        max: 50,
        unit: "%",
        range: "40 - 50",
      };
    }


    if (
      name === "mcv"
    ) {
      return {
        min: 80,
        max: 100,
        unit: "fL",
        range: "80 - 100",
      };
    }


    if (
      name === "mch"
    ) {
      return {
        min: 27,
        max: 32,
        unit: "pg",
        range: "27 - 32",
      };
    }


    if (
      name === "mchc"
    ) {
      return {
        min: 32,
        max: 36,
        unit: "g/dL",
        range: "32 - 36",
      };
    }


    if (
      name === "rdw cv" ||
      name === "rdw-cv"
    ) {
      return {
        min: 11.5,
        max: 14.5,
        unit: "%",
        range: "11.5 - 14.5",
      };
    }


    if (
      name === "platelet count" ||
      name === "platelets"
    ) {
      return {
        min: 1.5,
        max: 4.5,
        unit: "Lac/cumm",
        range: "1.5 - 4.5",
      };
    }


    if (
      name === "mpv"
    ) {
      return {
        min: 7.5,
        max: 11.5,
        unit: "fL",
        range: "7.5 - 11.5",
      };
    }


    if (
      name === "pdw"
    ) {
      return {
        min: 9,
        max: 17,
        unit: "%",
        range: "9 - 17",
      };
    }


    if (
      name === "pct"
    ) {
      return {
        min: 0.15,
        max: 0.4,
        unit: "%",
        range: "0.15 - 0.40",
      };
    }


    /* ================= ESR ================= */

    if (
      name === "esr" ||
      name.includes(
        "erythrocyte sedimentation"
      )
    ) {
      return {
        min: 0,
        max:
          gender === "female"
            ? 20
            : 15,
        unit: "mm/hr",
        range:
          gender === "female"
            ? "0 - 20"
            : "0 - 15",
      };
    }


    /* ================= BLOOD SUGAR ================= */

    if (
      name.includes(
        "fasting blood sugar"
      ) ||
      name === "fbs" ||
      name.includes(
        "fasting glucose"
      )
    ) {
      return {
        min: 70,
        max: 99,
        unit: "mg/dL",
        range: "70 - 99",
      };
    }


    if (
      name.includes(
        "post prandial"
      ) ||
      name === "ppbs" ||
      name.includes(
        "postprandial"
      )
    ) {
      return {
        min: 70,
        max: 140,
        unit: "mg/dL",
        range: "70 - 140",
      };
    }


    if (
      name.includes(
        "random blood sugar"
      ) ||
      name === "rbs" ||
      name.includes(
        "random glucose"
      )
    ) {
      return {
        min: 70,
        max: 140,
        unit: "mg/dL",
        range: "70 - 140",
      };
    }


    /* ================= KFT ================= */

    if (
      name === "blood urea" ||
      name === "urea"
    ) {
      return {
        min: 15,
        max: 40,
        unit: "mg/dL",
        range: "15 - 40",
      };
    }


    if (
      name === "serum creatinine" ||
      name === "creatinine"
    ) {
      return {
        min: 0.6,
        max: 1.3,
        unit: "mg/dL",
        range: "0.6 - 1.3",
      };
    }


    if (
      name === "uric acid"
    ) {
      return gender === "female"
        ? {
            min: 2.4,
            max: 6.0,
            unit: "mg/dL",
            range: "2.4 - 6.0",
          }
        : {
            min: 3.4,
            max: 7.0,
            unit: "mg/dL",
            range: "3.4 - 7.0",
          };
    }


    if (
      name === "sodium"
    ) {
      return {
        min: 135,
        max: 145,
        unit: "mEq/L",
        range: "135 - 145",
      };
    }


    if (
      name === "potassium"
    ) {
      return {
        min: 3.5,
        max: 5.1,
        unit: "mEq/L",
        range: "3.5 - 5.1",
      };
    }


    if (
      name === "chloride"
    ) {
      return {
        min: 98,
        max: 107,
        unit: "mEq/L",
        range: "98 - 107",
      };
    }


    if (
      name === "bun"
    ) {
      return {
        min: 7,
        max: 20,
        unit: "mg/dL",
        range: "7 - 20",
      };
    }


    /* ================= LFT ================= */

    if (
      name === "total bilirubin"
    ) {
      return {
        min: 0.2,
        max: 1.2,
        unit: "mg/dL",
        range: "0.2 - 1.2",
      };
    }


    if (
      name === "direct bilirubin"
    ) {
      return {
        min: 0,
        max: 0.3,
        unit: "mg/dL",
        range: "0 - 0.3",
      };
    }


    if (
      name.includes("sgot") ||
      name === "ast"
    ) {
      return {
        min: 0,
        max: 40,
        unit: "U/L",
        range: "Up to 40",
      };
    }


    if (
      name.includes("sgpt") ||
      name === "alt"
    ) {
      return {
        min: 0,
        max: 40,
        unit: "U/L",
        range: "Up to 40",
      };
    }


    if (
      name.includes(
        "alkaline phosphatase"
      ) ||
      name === "alp"
    ) {
      return {
        min: 44,
        max: 147,
        unit: "U/L",
        range: "44 - 147",
      };
    }


    if (
      name === "total protein"
    ) {
      return {
        min: 6.0,
        max: 8.3,
        unit: "g/dL",
        range: "6.0 - 8.3",
      };
    }


    if (
      name === "albumin"
    ) {
      return {
        min: 3.5,
        max: 5.0,
        unit: "g/dL",
        range: "3.5 - 5.0",
      };
    }


    if (
      name === "globulin"
    ) {
      return {
        min: 2.0,
        max: 3.5,
        unit: "g/dL",
        range: "2.0 - 3.5",
      };
    }


    /* ================= LIPID ================= */

    if (
      name.includes(
        "total cholesterol"
      )
    ) {
      return {
        min: 0,
        max: 200,
        unit: "mg/dL",
        range: "< 200",
      };
    }


    if (
      name.includes(
        "triglyceride"
      )
    ) {
      return {
        min: 0,
        max: 150,
        unit: "mg/dL",
        range: "< 150",
      };
    }


    if (
      name.includes("hdl")
    ) {
      return {
        min: 40,
        max: null,
        unit: "mg/dL",
        range: "> 40",
      };
    }


    if (
      name.includes("ldl")
    ) {
      return {
        min: 0,
        max: 100,
        unit: "mg/dL",
        range: "< 100",
      };
    }


    if (
      name.includes("vldl")
    ) {
      return {
        min: 5,
        max: 40,
        unit: "mg/dL",
        range: "5 - 40",
      };
    }


    /* ================= HBA1C ================= */

    if (
      name === "hba1c" ||
      name.includes("glycated")
    ) {
      return {
        min: 4,
        max: 5.6,
        unit: "%",
        range: "4.0 - 5.6",
      };
    }


    /* ================= THYROID ================= */

    if (
      name === "t3"
    ) {
      return {
        min: 80,
        max: 200,
        unit: "ng/dL",
        range: "80 - 200",
      };
    }


    if (
      name === "t4"
    ) {
      return {
        min: 5,
        max: 12,
        unit: "µg/dL",
        range: "5 - 12",
      };
    }


    if (
      name === "tsh"
    ) {
      return {
        min: 0.4,
        max: 4.0,
        unit: "µIU/mL",
        range: "0.4 - 4.0",
      };
    }


    return null;
  }


  /* =======================================================
     RESOLVE PARAMETER
     ======================================================= */

  function resolveParameter(
    parameter
  ) {
    if (!parameter) {
      return {
        min: null,
        max: null,
        unit: "",
        range: "-",
      };
    }


    if (
      typeof parameter ===
      "string"
    ) {
      const defaults =
        getDefaultReference(
          parameter
        );

      return {
        min:
          defaults?.min ??
          null,

        max:
          defaults?.max ??
          null,

        unit:
          defaults?.unit ||
          "",

        range:
          defaults?.range ||
          "-",
      };
    }


    const name =
      parameter.name ||
      parameter.testName ||
      parameter.investigation ||
      "";


    const defaults =
      getDefaultReference(
        name
      );


    let min =
      parameter.min;

    let max =
      parameter.max;


    let unit =
      parameter.unit ||
      parameter.units ||
      defaults?.unit ||
      "";


    let range =
      parameter.range ||
      parameter.referenceRange ||
      parameter.reference ||
      defaults?.range ||
      "";


    if (
      (
        min === undefined ||
        min === null ||
        min === ""
      ) &&
      defaults
    ) {
      min =
        defaults.min;
    }


    if (
      (
        max === undefined ||
        max === null ||
        max === ""
      ) &&
      defaults
    ) {
      max =
        defaults.max;
    }


    if (
      !range ||
      range === "-"
    ) {
      if (
        min !== null &&
        min !== undefined &&
        max !== null &&
        max !== undefined
      ) {
        range =
          `${min} - ${max}`;
      } else if (
        max !== null &&
        max !== undefined
      ) {
        range =
          `< ${max}`;
      } else if (
        min !== null &&
        min !== undefined
      ) {
        range =
          `> ${min}`;
      } else {
        range = "-";
      }
    }


    return {
      ...parameter,

      min,
      max,

      unit,

      range,
    };
  }


  /* =======================================================
     PARAMETER KEY
     ======================================================= */

  function parameterKey(
    testId,
    parameter,
    index
  ) {
    const name =
      typeof parameter ===
      "string"
        ? parameter
        : parameter?.name ||
          parameter?.testName ||
          parameter?.investigation ||
          `parameter-${index}`;

    return `${testId}-${name}-${index}`;
  }


  /* =======================================================
     PARAMETER NAME
     ======================================================= */

  function getParameterName(
    parameter,
    index
  ) {
    if (
      typeof parameter ===
      "string"
    ) {
      return parameter;
    }


    return (
      parameter?.name ||
      parameter?.testName ||
      parameter?.investigation ||
      `Investigation ${index + 1}`
    );
  }


  /* =======================================================
     FLAG
     ======================================================= */

  function getFlag(
    value,
    parameter
  ) {
    if (
      value === "" ||
      value === undefined ||
      value === null
    ) {
      return "";
    }


    const resolved =
      resolveParameter(
        parameter
      );


    const cleanedValue =
      String(value)
        .replace(/,/g, "")
        .trim();


    const numericValue =
      Number(
        cleanedValue
      );


    if (
      Number.isNaN(
        numericValue
      )
    ) {
      return "";
    }


    if (
      resolved.min !== null &&
      resolved.min !== undefined &&
      resolved.min !== ""
    ) {
      if (
        numericValue <
        Number(
          resolved.min
        )
      ) {
        return "L";
      }
    }


    if (
      resolved.max !== null &&
      resolved.max !== undefined &&
      resolved.max !== ""
    ) {
      if (
        numericValue >
        Number(
          resolved.max
        )
      ) {
        return "H";
      }
    }


    return "";
  }


  /* =======================================================
     CATEGORY
     ======================================================= */

  function getCategory(
    test
  ) {
    return (
      test?.category ||
      test?.department ||
      "PATHOLOGY"
    );
  }


  /* =======================================================
     BUILD REPORT TESTS
     ======================================================= */

  function buildReportTests(
    tests,
    resultData
  ) {
    if (
      !Array.isArray(tests)
    ) {
      return [];
    }


    return tests.map(
      (
        test,
        testIndex
      ) => {

        const parameters =
          test?.tests ||
          test?.parameters ||
          [];


        const testId =
          test?.id ??
          test?.testId ??
          `test-${testIndex}`;


        return {
          id: testId,

          name:
            test?.name ||
            test?.testName ||
            test?.short ||
            "Laboratory Test",

          category:
            getCategory(test),

          parameters:
            Array.isArray(
              parameters
            )
              ? parameters.map(
                  (
                    parameter,
                    index
                  ) => {

                    const key =
                      parameterKey(
                        testId,
                        parameter,
                        index
                      );


                    const value =
                      resultData?.[
                        key
                      ] ??
                      "";


                    const resolved =
                      resolveParameter(
                        parameter
                      );


                    return {
                      name:
                        getParameterName(
                          parameter,
                          index
                        ),

                      result:
                        value,

                      unit:
                        resolved.unit ||
                        "-",

                      referenceRange:
                        resolved.range ||
                        "-",

                      min:
                        resolved.min,

                      max:
                        resolved.max,

                      flag:
                        getFlag(
                          value,
                          parameter
                        ),
                    };
                  }
                )
              : [],
        };
      }
    );
  }


  /* =======================================================
     REPORT TEST DATA
     ======================================================= */

  const reportTests =
    useMemo(
      () =>
        buildReportTests(
          selectedTests,
          results
        ),
      [
        selectedTests,
        results,
        patient.gender,
        patient.sex,
        patient.age,
      ]
    );


  /* =======================================================
     PAGINATION

     Large tests are split intelligently so that:
     - content does not overlap footer
     - tables remain readable
     - every page gets letterhead
     ======================================================= */

  function paginateTests(
    tests
  ) {
    const pages = [];

    let currentPage = [];

    let currentRows = 0;

    const FIRST_PAGE_ROWS = 18;
    const OTHER_PAGE_ROWS = 25;


    function pageLimit() {
      return pages.length === 0
        ? FIRST_PAGE_ROWS
        : OTHER_PAGE_ROWS;
    }


    tests.forEach(
      (test) => {

        const params =
          Array.isArray(
            test.parameters
          )
            ? test.parameters
            : [];


        if (
          params.length === 0
        ) {

          const testRows = 1;

          if (
            currentRows +
              testRows >
            pageLimit() &&
            currentPage.length
          ) {
            pages.push(
              currentPage
            );

            currentPage = [];

            currentRows = 0;
          }


          currentPage.push(
            test
          );

          currentRows +=
            testRows;

          return;
        }


        let start = 0;


        while (
          start <
          params.length
        ) {

          const remaining =
            params.length -
            start;

          const available =
            pageLimit() -
            currentRows -
            2;


          if (
            available <= 0 &&
            currentPage.length
          ) {
            pages.push(
              currentPage
            );

            currentPage = [];

            currentRows = 0;

            continue;
          }


          const take =
            Math.min(
              remaining,
              Math.max(
                1,
                available
              )
            );


          const partParams =
            params.slice(
              start,
              start + take
            );


          const part = {
            ...test,

            id:
              `${test.id}-part-${start}`,

            parameters:
              partParams,

            isSplit:
              params.length >
              take,
          };


          currentPage.push(
            part
          );

          currentRows +=
            take + 2;

          start += take;


          if (
            start <
              params.length
          ) {

            pages.push(
              currentPage
            );

            currentPage = [];

            currentRows = 0;
          }
        }
      }
    );


    if (
      currentPage.length
    ) {
      pages.push(
        currentPage
      );
    }


    return pages.length
      ? pages
      : [[]];
  }


  const reportPages =
    useMemo(
      () =>
        paginateTests(
          reportTests
        ),
      [reportTests]
    );


  /* =======================================================
     PATIENT DISPLAY VALUES
     ======================================================= */

  const patientId =
    patient.patientId ||
    patient.id ||
    "-";


  const patientName =
    patient.name ||
    patient.patientName ||
    "-";


  const patientAge =
    patient.age ||
    "-";


  const patientGender =
    patient.gender ||
    patient.sex ||
    "-";


  const patientMobile =
    patient.mobile ||
    patient.mobileNumber ||
    patient.phone ||
    "-";


  const patientDoctor =
    patient.doctor ||
    patient.refDoctor ||
    patient.referredBy ||
    "-";


  const sampleDate =
    patient.sampleDate ||
    patient.collectionDate ||
    reportDate ||
    "-";


  /* =======================================================
     REPORT NUMBER
     ======================================================= */

  useEffect(() => {

    const existing =
      localStorage.getItem(
        "nidanCurrentReportNo"
      );

    if (existing) {
      setReportNo(
        existing
      );
    }

  }, []);


  /* =======================================================
     AUTO SAVE
     ======================================================= */

  useEffect(() => {

    if (
      !settingsLoaded
    ) {
      return;
    }


    if (
      settings.autoSave ===
      false
    ) {
      return;
    }


    if (
      !patient ||
      Object.keys(
        patient
      ).length === 0
    ) {
      return;
    }


    if (
      selectedTests.length ===
      0
    ) {
      return;
    }


    if (
      saveTimerRef.current
    ) {
      clearTimeout(
        saveTimerRef.current
      );
    }


    saveTimerRef.current =
      setTimeout(
        () => {
          saveReportAutomatically();
        },
        500
      );


    return () => {

      if (
        saveTimerRef.current
      ) {
        clearTimeout(
          saveTimerRef.current
        );
      }

    };

  }, [
    patient,
    selectedTests,
    results,
    settingsLoaded,
    settings.autoSave,
  ]);


  /* =======================================================
     SAVE REPORT
     ======================================================= */

  async function saveReportAutomatically() {

    if (
      savingRef.current
    ) {
      return;
    }


    if (
      !patient ||
      Object.keys(
        patient
      ).length === 0 ||
      selectedTests.length ===
        0
    ) {
      return;
    }


    savingRef.current =
      true;


    try {

      setSaveStatus(
        "saving"
      );

      setSaveMessage(
        "Report saving..."
      );


      const currentPatientId =
        patient.patientId ||
        patient.id ||
        "";


      if (
        !currentPatientId
      ) {
        throw new Error(
          "Patient ID nahi mila."
        );
      }


      const storedPatient =
        localStorage.getItem(
          "nidanCurrentReportPatient"
        );


      let existingReportNo =
        localStorage.getItem(
          "nidanCurrentReportNo"
        );


      if (
        storedPatient !==
        String(
          currentPatientId
        )
      ) {

        localStorage.removeItem(
          "nidanCurrentReportNo"
        );

        existingReportNo =
          null;
      }


      const generatedReportNo =
        existingReportNo ||
        `RPT-${Date.now()}`;


      const reportTestsData =
        buildReportTests(
          selectedTests,
          results
        );


      const reportPayload = {
        patient: {
          ...patient,

          patientId:
            currentPatientId,
        },

        selectedTests,

        results,

        reportTests:
          reportTestsData,

        reportDate:
          new Date().toISOString(),

        reportNo:
          generatedReportNo,

        settings: {
          labName:
            settings.labName,

          labAddress:
            settings.labAddress,

          phone:
            settings.phone,

          email:
            settings.email,

          doctorName:
            settings.doctorName,

          showReferenceRange:
            settings.showReferenceRange,

          showFlag:
            settings.showFlag,
        },
      };


      /* ==============================================
         CHECK EXISTING REPORT
         ============================================== */

      const {
        data: existingData,
        error: checkError,
      } = await supabase
        .from("reports")
        .select(
          "id, report_no"
        )
        .eq(
          "report_no",
          generatedReportNo
        )
        .maybeSingle();


      if (
        checkError
      ) {
        console.error(
          "Existing report check error:",
          checkError
        );
      }


      /* ==============================================
         UPDATE
         ============================================== */

      if (
        existingData?.id
      ) {

        const {
          error:
            updateError,
        } =
          await supabase
            .from(
              "reports"
            )
            .update({
              patient_id:
                currentPatientId,

              status:
                "completed",

              report_data:
                reportPayload,
            })
            .eq(
              "id",
              existingData.id
            );


        if (
          updateError
        ) {
          throw updateError;
        }

      }


      /* ==============================================
         INSERT
         ============================================== */

      else {

        const {
          error:
            insertError,
        } =
          await supabase
            .from(
              "reports"
            )
            .insert([
              {
                report_no:
                  generatedReportNo,

                patient_id:
                  currentPatientId,

                status:
                  "completed",

                report_data:
                  reportPayload,
              },
            ]);


        if (
          insertError
        ) {
          throw insertError;
        }

      }


      /* ==============================================
         LOCAL STORAGE
         ============================================== */

      localStorage.setItem(
        "nidanCurrentReportNo",
        generatedReportNo
      );


      localStorage.setItem(
        "nidanCurrentReportPatient",
        String(
          currentPatientId
        )
      );


      setReportNo(
        generatedReportNo
      );


      setSaveStatus(
        "saved"
      );


      setSaveMessage(
        "Report saved successfully"
      );

    } catch (error) {

      console.error(
        "AUTO REPORT SAVE ERROR:",
        error
      );


      setSaveStatus(
        "error"
      );


      setSaveMessage(
        error?.message ||
          "Report save nahi hua."
      );

    } finally {

      savingRef.current =
        false;

    }
  }


  /* =======================================================
     PRINT
     ======================================================= */

  function printReport() {

    if (
      saveStatus ===
      "saving"
    ) {

      alert(
        "Report abhi save ho raha hai. Ek moment wait karein."
      );

      return;
    }


    if (
      saveStatus ===
      "error"
    ) {

      const proceed =
        window.confirm(
          "Report database me save nahi hua hai.\n\nKya phir bhi Print / PDF karna hai?"
        );


      if (!proceed) {
        return;
      }
    }


    window.print();
  }


  /* =======================================================
     NEW PATIENT
     ======================================================= */

  function newPatient() {

    const confirmNew =
      window.confirm(
        "New patient start karna hai? Current patient data clear ho jayega."
      );


    if (
      !confirmNew
    ) {
      return;
    }


    [
      "nidanPatient",
      "nidanSelectedTests",
      "nidanResults",
      "nidanBillTotal",
      "nidanCurrentReportNo",
      "nidanCurrentReportPatient",
    ].forEach(
      (key) => {
        localStorage.removeItem(
          key
        );
      }
    );


    router.push(
      "/patients"
    );
  }


  /* =======================================================
     SETTINGS / LETTERHEAD
     ======================================================= */

  const hasLetterhead =
    Boolean(
      settings.letterhead
    );


  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <>
      <div className="reportApp">

        {/* =================================================
            SCREEN TOOLBAR
        ================================================= */}

        <div className="screenToolbar">

          <div className="toolbarInfo">

            <strong>
              Final Laboratory Report
            </strong>

            <span>
              Professional A4 report
              preview
            </span>

            {reportNo && (
              <span>
                Report No:{" "}
                {reportNo}
              </span>
            )}

            {saveStatus ===
              "saving" && (
              <span className="saving">
                ● Saving report...
              </span>
            )}

            {saveStatus ===
              "saved" && (
              <span className="saved">
                ✓ Saved to Reports
              </span>
            )}

            {saveStatus ===
              "error" && (
              <span className="saveError">
                ⚠ {saveMessage}
              </span>
            )}

          </div>


          <div className="toolbarButtons">

            <button
              type="button"
              className="backButton"
              onClick={() =>
                router.push(
                  "/results"
                )
              }
            >
              ← Edit Results
            </button>


            <button
              type="button"
              className="printButton"
              onClick={
                printReport
              }
            >
              🖨 Print / Save PDF
            </button>


            <button
              type="button"
              className="newButton"
              onClick={
                newPatient
              }
            >
              + New Patient
            </button>

          </div>

        </div>


        {/* =================================================
            REPORT PAGES
        ================================================= */}

        <div className="reportPages">

          {reportPages.map(
            (
              pageTests,
              pageIndex
            ) => (

              <section
                className="a4Page"
                key={
                  `page-${pageIndex}`
                }
              >

                {/* =========================================
                    LETTERHEAD BACKGROUND
                ========================================= */}

                {hasLetterhead ? (

                  <img
                    className="letterheadBackground"
                    src={
                      settings.letterhead
                    }
                    alt=""
                  />

                ) : (

                  <div className="fallbackLetterhead">

                    <div className="fallbackLogo">
                      N+
                    </div>

                    <div>
                      <h1>
                        {settings.labName ||
                          "NIDAN PATHOLOGY LAB"}
                      </h1>

                      <p>
                        Clinical Pathology &
                        Diagnostic Laboratory
                      </p>

                      {settings.labAddress && (
                        <p>
                          {
                            settings.labAddress
                          }
                        </p>
                      )}

                      {settings.phone && (
                        <p>
                          Phone:{" "}
                          {settings.phone}
                        </p>
                      )}

                    </div>

                  </div>
                )}


                {/* =========================================
                    REPORT CONTENT
                ========================================= */}

                <div className="reportContent">

                  {/* =======================================
                      PATIENT INFORMATION
                  ======================================= */}

                  <section className="patientInformation">

                    <div className="patientColumn">

                      <div className="patientName">
                        {patientName}
                      </div>

                      <div className="patientLine">
                        <b>
                          Age/Sex:
                        </b>

                        <span>
                          {patientAge}Y /{" "}
                          {patientGender}
                        </span>
                      </div>

                      <div className="patientLine">
                        <b>
                          Referred By:
                        </b>

                        <span>
                          {patientDoctor}
                        </span>
                      </div>

                      <div className="patientLine">
                        <b>
                          Sample ID:
                        </b>

                        <span>
                          {patientId}
                        </span>
                      </div>

                    </div>


                    <div className="patientColumn">

                      <div className="patientLine">
                        <b>
                          Patient ID:
                        </b>

                        <span>
                          {patientId}
                        </span>
                      </div>

                      <div className="patientLine">
                        <b>
                          Mobile:
                        </b>

                        <span>
                          {patientMobile}
                        </span>
                      </div>

                      <div className="patientLine">
                        <b>
                          Lab:
                        </b>

                        <span>
                          {settings.labName ||
                            "NIDAN PATHOLOGY LAB"}
                        </span>
                      </div>

                    </div>


                    <div className="patientColumn">

                      <div className="patientLine">
                        <b>
                          Report ID:
                        </b>

                        <span>
                          {reportNo ||
                            "-"}
                        </span>
                      </div>

                      <div className="patientLine">
                        <b>
                          Collection:
                        </b>

                        <span>
                          {sampleDate}
                        </span>
                      </div>

                      <div className="patientLine">
                        <b>
                          Report Date:
                        </b>

                        <span>
                          {reportDate}
                        </span>
                      </div>

                    </div>

                  </section>


                  {/* =======================================
                      TESTS
                  ======================================= */}

                  <section className="testsArea">

                    {pageTests.length ===
                    0 ? (

                      <div className="emptyReport">
                        No investigations
                        selected.
                      </div>

                    ) : (

                      pageTests.map(
                        (
                          test,
                          testIndex
                        ) => (

                          <section
                            className="testBlock"
                            key={
                              `${test.id}-${pageIndex}-${testIndex}`
                            }
                          >

                            <div className="departmentTitle">
                              {(
                                test.category ||
                                "PATHOLOGY"
                              ).toUpperCase()}
                            </div>


                            <div className="testTitle">
                              {test.name}
                            </div>


                            <table className="reportTable">

                              <thead>

                                <tr>

                                  <th>
                                    INVESTIGATION
                                  </th>

                                  {settings.showFlag !==
                                    false && (
                                    <th className="center">
                                      FLAG
                                    </th>
                                  )}

                                  <th className="center">
                                    RESULT
                                  </th>

                                  {settings.showReferenceRange !==
                                    false && (
                                    <th className="center">
                                      REFERENCE RANGE
                                    </th>
                                  )}

                                  <th className="center">
                                    UNIT
                                  </th>

                                </tr>

                              </thead>


                              <tbody>

                                {test.parameters
                                  ?.length ===
                                0 ? (

                                  <tr>

                                    <td
                                      colSpan={
                                        5
                                      }
                                      className="noParameter"
                                    >
                                      No parameters
                                      available
                                    </td>

                                  </tr>

                                ) : (

                                  test.parameters.map(
                                    (
                                      parameter,
                                      parameterIndex
                                    ) => {

                                      const isAbnormal =
                                        Boolean(
                                          parameter.flag
                                        );


                                      return (
                                        <tr
                                          key={
                                            `${test.id}-parameter-${parameterIndex}`
                                          }
                                        >

                                          <td className="investigation">
                                            {
                                              parameter.name
                                            }
                                          </td>


                                          {settings.showFlag !==
                                            false && (
                                            <td className="flagCell">

                                              {isAbnormal ? (
                                                <span
                                                  className={
                                                    parameter.flag ===
                                                    "H"
                                                      ? "flag high"
                                                      : "flag low"
                                                  }
                                                >
                                                  {
                                                    parameter.flag
                                                  }
                                                </span>
                                              ) : (
                                                ""
                                              )}

                                            </td>
                                          )}


                                          <td
                                            className={
                                              isAbnormal
                                                ? "result abnormal"
                                                : "result"
                                            }
                                          >
                                            {parameter.result !==
                                              "" &&
                                            parameter.result !==
                                              null &&
                                            parameter.result !==
                                              undefined
                                              ? parameter.result
                                              : "-"}
                                          </td>


                                          {settings.showReferenceRange !==
                                            false && (
                                            <td className="reference">
                                              {
                                                parameter.referenceRange
                                              }
                                            </td>
                                          )}


                                          <td className="unit">
                                            {
                                              parameter.unit
                                            }
                                          </td>

                                        </tr>
                                      );
                                    }
                                  )

                                )}

                              </tbody>

                            </table>

                          </section>
                        )
                      )

                    )}

                  </section>


                  {/* =======================================
                      LAST PAGE INFORMATION
                  ======================================= */}

                  {pageIndex ===
                    reportPages.length -
                      1 && (

                    <>

                      {/* =================================
                          SIGNATURE
                      ================================= */}

                      <section className="signatureArea">

                        <div className="signatureBox">

                          <div className="signatureLine"></div>

                          <strong>
                            Lab Technician
                          </strong>

                          <small>
                            {settings.labName ||
                              "NIDAN PATHOLOGY LAB"}
                          </small>

                        </div>


                        <div className="signatureBox">

                          <div className="signatureLine"></div>

                          <strong>
                            Authorized Signatory
                          </strong>

                          <small>
                            Signature & Seal
                          </small>

                        </div>

                      </section>


                      {/* =================================
                          NOTE
                      ================================= */}

                      <section className="reportNote">

                        <strong>
                          Note:
                        </strong>

                        <span>
                          {" "}
                          Reference intervals may
                          vary according to
                          laboratory method,
                          age, sex and clinical
                          circumstances.
                          Laboratory results should
                          be interpreted with
                          relevant clinical findings.
                        </span>

                      </section>

                    </>
                  )}

                </div>

              </section>
            )
          )}

        </div>

      </div>


      {/* =====================================================
          COMPLETE CSS
      ===================================================== */}

      <style jsx global>{`

        /* ===================================================
           GLOBAL
           =================================================== */

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }


        html {
          margin: 0;
          padding: 0;
        }


        body {
          margin: 0;
          padding: 0;

          background:
            #eef2f7;

          color:
            #111827;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          overflow-x:
            hidden;
        }


        button {
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }


        /* ===================================================
           APP
           =================================================== */

        .reportApp {
          width: 100%;
          min-height: 100vh;

          padding:
            14px;

          background:
            #eef2f7;
        }


        /* ===================================================
           SCREEN TOOLBAR
           =================================================== */

        .screenToolbar {
          width: 100%;
          max-width: 1180px;

          min-height:
            68px;

          margin:
            0 auto 14px;

          padding:
            11px 16px;

          background:
            #ffffff;

          border:
            1px solid #e2e8f0;

          border-radius:
            10px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            15px;

          box-shadow:
            0 3px 14px
            rgba(
              15,
              23,
              42,
              0.07
            );

          position:
            sticky;

          top:
            8px;

          z-index:
            100;
        }


        .toolbarInfo {
          display:
            flex;

          flex-direction:
            column;

          gap:
            2px;

          min-width:
            0;
        }


        .toolbarInfo strong {
          font-size:
            15px;

          color:
            #172033;
        }


        .toolbarInfo span {
          font-size:
            9px;

          color:
            #64748b;
        }


        .toolbarInfo .saving {
          color:
            #b7791f;

          font-weight:
            700;
        }


        .toolbarInfo .saved {
          color:
            #15803d;

          font-weight:
            700;
        }


        .toolbarInfo .saveError {
          color:
            #dc2626;

          font-weight:
            700;
        }


        .toolbarButtons {
          display:
            flex;

          align-items:
            center;

          justify-content:
            flex-end;

          gap:
            7px;

          flex-shrink:
            0;
        }


        .toolbarButtons button {
          min-height:
            38px;

          padding:
            8px 12px;

          border-radius:
            7px;

          border:
            1px solid #dbe3ea;

          background:
            #ffffff;

          color:
            #334155;

          cursor:
            pointer;

          font-size:
            10px;

          font-weight:
            800;

          white-space:
            nowrap;
        }


        .toolbarButtons button:hover {
          opacity:
            0.88;
        }


        .printButton {
          background:
            #087f7d !important;

          border-color:
            #087f7d !important;

          color:
            #ffffff !important;
        }


        .newButton {
          color:
            #b91c1c !important;
        }


        /* ===================================================
           REPORT PAGES
           =================================================== */

        .reportPages {
          width:
            100%;

          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          gap:
            20px;
        }


        /* ===================================================
           EXACT A4 PAGE
           =================================================== */

        .a4Page {
          position:
            relative;

          width:
            210mm;

          height:
            297mm;

          flex:
            0 0 auto;

          background:
            #ffffff;

          overflow:
            hidden;

          box-shadow:
            0 8px 32px
            rgba(
              15,
              23,
              42,
              0.14
            );
        }


        /* ===================================================
           LETTERHEAD BACKGROUND

           VERY IMPORTANT:
           Letterhead is NOT placed inside report flow.
           It is a background layer.
           =================================================== */

        .letterheadBackground {
          position:
            absolute;

          inset:
            0;

          width:
            210mm;

          height:
            297mm;

          display:
            block;

          object-fit:
            fill;

          z-index:
            1;

          pointer-events:
            none;

          user-select:
            none;
        }


        /* ===================================================
           FALLBACK LETTERHEAD
           Used only if no image uploaded.
           =================================================== */

        .fallbackLetterhead {
          position:
            absolute;

          left:
            0;

          top:
            0;

          width:
            210mm;

          height:
            62mm;

          padding:
            12mm;

          display:
            flex;

          align-items:
            center;

          gap:
            10mm;

          border-bottom:
            1.2px solid #222;

          background:
            #ffffff;

          z-index:
            1;
        }


        .fallbackLogo {
          width:
            18mm;

          height:
            18mm;

          border-radius:
            5mm;

          background:
            #087f7d;

          color:
            white;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          font-size:
            18px;

          font-weight:
            900;
        }


        .fallbackLetterhead h1 {
          margin:
            0;

          font-size:
            22px;

          color:
            #087f7d;
        }


        .fallbackLetterhead p {
          margin:
            2px 0 0;

          font-size:
            9px;

          color:
            #475569;
        }


        /* ===================================================
           REPORT CONTENT

           This is the key fix.

           Content starts after letterhead header
           and ends before letterhead footer.
           =================================================== */

        .reportContent {
          position:
            absolute;

          top:
            58mm;

          left:
            11mm;

          right:
            11mm;

          bottom:
            57mm;

          z-index:
            5;

          width:
            auto;

          color:
            #111827;
        }


        /* ===================================================
           PATIENT INFORMATION
           =================================================== */

        .patientInformation {
          width:
            100%;

          min-height:
            23mm;

          display:
            grid;

          grid-template-columns:
            1.25fr 1fr 1fr;

          background:
            rgba(
              255,
              255,
              255,
              0.96
            );

          border-top:
            1.2px solid #222;

          border-bottom:
            1px solid #aeb7c2;
        }


        .patientColumn {
          min-width:
            0;

          padding:
            5px 8px;

          border-right:
            1px solid #aeb7c2;
        }


        .patientColumn:last-child {
          border-right:
            0;
        }


        .patientName {
          font-size:
            11px;

          font-weight:
            900;

          text-transform:
            uppercase;

          margin-bottom:
            2px;

          line-height:
            1.25;
        }


        .patientLine {
          display:
            flex;

          align-items:
            flex-start;

          gap:
            5px;

          margin-bottom:
            2px;

          font-size:
            8.5px;

          line-height:
            1.3;
        }


        .patientLine b {
          min-width:
            62px;

          font-weight:
            800;

          color:
            #111827;
        }


        .patientLine span {
          min-width:
            0;

          word-break:
            break-word;

          color:
            #1f2937;
        }


        /* ===================================================
           TEST AREA
           =================================================== */

        .testsArea {
          width:
            100%;

          margin-top:
            4.5mm;
        }


        .testBlock {
          width:
            100%;

          margin-bottom:
            4mm;

          page-break-inside:
            avoid;

          break-inside:
            avoid;
        }


        /* ===================================================
           DEPARTMENT
           =================================================== */

        .departmentTitle {
          width:
            100%;

          text-align:
            center;

          font-size:
            8px;

          line-height:
            1.1;

          font-weight:
            900;

          letter-spacing:
            1px;

          color:
            #374151;

          margin-bottom:
            1px;

          text-transform:
            uppercase;
        }


        /* ===================================================
           TEST NAME
           =================================================== */

        .testTitle {
          width:
            100%;

          text-align:
            center;

          font-size:
            11px;

          line-height:
            1.2;

          font-weight:
            900;

          color:
            #111827;

          margin-bottom:
            2mm;

          text-transform:
            uppercase;
        }


        /* ===================================================
           REPORT TABLE
           =================================================== */

        .reportTable {
          width:
            100%;

          border-collapse:
            collapse;

          table-layout:
            fixed;

          background:
            rgba(
              255,
              255,
              255,
              0.97
            );
        }


        .reportTable th {
          height:
            7mm;

          padding:
            3px 4px;

          border:
            1px solid #9ca6b2;

          background:
            #edf2f7;

          color:
            #111827;

          font-size:
            7.5px;

          line-height:
            1.15;

          font-weight:
            900;

          text-align:
            left;

          vertical-align:
            middle;

          text-transform:
            uppercase;
        }


        .reportTable td {
          height:
            4.7mm;

          padding:
            2.5px 4px;

          border:
            1px solid #c7ced6;

          background:
            rgba(
              255,
              255,
              255,
              0.94
            );

          color:
            #111827;

          font-size:
            8.2px;

          line-height:
            1.1;

          vertical-align:
            middle;

          word-break:
            break-word;

          overflow-wrap:
            anywhere;
        }


        /* ===================================================
           TABLE WIDTHS

           With all 5 columns:
           Investigation 38%
           Flag            8%
           Result         15%
           Reference      27%
           Unit           12%
           =================================================== */

        .reportTable th:nth-child(1),
        .reportTable td:nth-child(1) {
          width:
            38%;
        }


        .reportTable th:nth-child(2),
        .reportTable td:nth-child(2) {
          width:
            8%;
        }


        .reportTable th:nth-child(3),
        .reportTable td:nth-child(3) {
          width:
            15%;
        }


        .reportTable th:nth-child(4),
        .reportTable td:nth-child(4) {
          width:
            27%;
        }


        .reportTable th:nth-child(5),
        .reportTable td:nth-child(5) {
          width:
            12%;
        }


        /* ===================================================
           CENTER
           =================================================== */

        .center {
          text-align:
            center !important;
        }


        .investigation {
          text-align:
            left;

          font-weight:
            600;
        }


        .flagCell {
          text-align:
            center !important;
        }


        .result {
          text-align:
            center;

          font-weight:
            700;

          font-size:
            8.4px !important;
        }


        .result.abnormal {
          color:
            #b91c1c !important;

          font-weight:
            900;
        }


        .reference {
          text-align:
            center;

          font-size:
            7px !important;

          color:
            #374151;

          line-height:
            1.15 !important;
        }


        .unit {
          text-align:
            center;

          font-size:
            7.5px !important;
        }


        /* ===================================================
           FLAGS
           =================================================== */

        .flag {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          min-width:
            15px;

          height:
            14px;

          padding:
            1px 4px;

          border-radius:
            3px;

          font-size:
            7px;

          font-weight:
            900;

          line-height:
            1;
        }


        .flag.high {
          background:
            #fee2e2;

          color:
            #b91c1c;
        }


        .flag.low {
          background:
            #dbeafe;

          color:
            #1d4ed8;
        }


        .noParameter {
          text-align:
            center !important;

          color:
            #64748b !important;

          padding:
            8px !important;
        }


        /* ===================================================
           EMPTY
           =================================================== */

        .emptyReport {
          width:
            100%;

          padding:
            20px;

          border:
            1px dashed #94a3b8;

          text-align:
            center;

          color:
            #64748b;

          background:
            rgba(
              255,
              255,
              255,
              0.95
            );
        }


        /* ===================================================
           SIGNATURE
           =================================================== */

        .signatureArea {
          width:
            100%;

          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          column-gap:
            45mm;

          margin-top:
            7mm;

          page-break-inside:
            avoid;

          break-inside:
            avoid;
        }


        .signatureBox {
          text-align:
            center;

          background:
            rgba(
              255,
              255,
              255,
              0.94
            );

          font-size:
            8px;

          color:
            #111827;
        }


        .signatureLine {
          width:
            100%;

          height:
            8mm;

          border-bottom:
            1px solid #374151;

          margin-bottom:
            1.5mm;
        }


        .signatureBox strong {
          display:
            block;

          font-size:
            8px;

          font-weight:
            800;
        }


        .signatureBox small {
          display:
            block;

          margin-top:
            1px;

          color:
            #64748b;

          font-size:
            6.5px;
        }


        /* ===================================================
           NOTE
           =================================================== */

        .reportNote {
          width:
            100%;

          margin-top:
            3.5mm;

          padding-top:
            2mm;

          border-top:
            1px solid #9ca3af;

          background:
            rgba(
              255,
              255,
              255,
              0.94
            );

          color:
            #4b5563;

          font-size:
            6.5px;

          line-height:
            1.35;

          page-break-inside:
            avoid;

          break-inside:
            avoid;
        }


        .reportNote strong {
          color:
            #111827;
        }


        /* ===================================================
           TABLET
           =================================================== */

        @media (max-width: 900px) {

          .reportApp {
            padding:
              8px;
          }


          .screenToolbar {
            position:
              static;

            flex-direction:
              column;

            align-items:
              flex-start;
          }


          .toolbarButtons {
            width:
              100%;

            display:
              grid;

            grid-template-columns:
              1fr 1.2fr 1fr;
          }


          .toolbarButtons button {
            width:
              100%;
          }


          .reportPages {
            align-items:
              center;

            overflow-x:
              auto;

            padding-bottom:
              20px;
          }


          .a4Page {
            transform-origin:
              top center;
          }

        }


        /* ===================================================
           MOBILE SCREEN PREVIEW

           Important:
           We scale ONLY screen preview.
           Print remains exact A4.
           =================================================== */

        @media (max-width: 600px) {

          .reportApp {
            padding:
              5px;

            background:
              #e9eef5;
          }


          .screenToolbar {
            margin-bottom:
              8px;

            padding:
              10px;

            border-radius:
              8px;
          }


          .toolbarInfo strong {
            font-size:
              14px;
          }


          .toolbarInfo span {
            font-size:
              8px;
          }


          .toolbarButtons {
            grid-template-columns:
              1fr;
          }


          .toolbarButtons button {
            min-height:
              40px;
          }


          .reportPages {
            width:
              100%;

            overflow:
              hidden;

            gap:
              12px;
          }


          /*
             Keep A4 proportional.
             Browser scales the page visually.
          */

          .a4Page {
            width:
              100%;

            height:
              auto;

            aspect-ratio:
              210 / 297;

            max-width:
              100%;

            box-shadow:
              0 4px 18px
              rgba(
                15,
                23,
                42,
                0.12
              );
          }


          .letterheadBackground {
            width:
              100%;

            height:
              100%;

            object-fit:
              fill;
          }


          /*
             Content uses percentage dimensions
             on mobile preview.
          */

          .reportContent {
            top:
              19.53%;

            left:
              5.24%;

            right:
              5.24%;

            bottom:
              19.19%;
          }


          .patientInformation {
            min-height:
              auto;
          }


          .patientColumn {
            padding:
              3px 4px;
          }


          .patientName {
            font-size:
              6.5px;
          }


          .patientLine {
            gap:
              2px;

            margin-bottom:
              1px;

            font-size:
              5px;
          }


          .patientLine b {
            min-width:
              34px;
          }


          .testsArea {
            margin-top:
              2.5%;
          }


          .testBlock {
            margin-bottom:
              2%;
          }


          .departmentTitle {
            font-size:
              5px;
          }


          .testTitle {
            font-size:
              6.5px;

            margin-bottom:
              1%;
          }


          .reportTable th {
            height:
              auto;

            padding:
              1.5px 2px;

            font-size:
              4.3px;
          }


          .reportTable td {
            height:
              auto;

            padding:
              1.3px 2px;

            font-size:
              4.7px;
          }


          .result {
            font-size:
              4.8px !important;
          }


          .reference {
            font-size:
              4px !important;
          }


          .unit {
            font-size:
              4.2px !important;
          }


          .flag {
            min-width:
              9px;

            height:
              8px;

            padding:
              1px 2px;

            font-size:
              4px;
          }


          .signatureArea {
            margin-top:
              3%;

            column-gap:
              12%;
          }


          .signatureLine {
            height:
              4%;
          }


          .signatureBox {
            font-size:
              4.5px;
          }


          .signatureBox strong {
            font-size:
              4.5px;
          }


          .signatureBox small {
            font-size:
              3.7px;
          }


          .reportNote {
            margin-top:
              2%;

            padding-top:
              1%;

            font-size:
              3.8px;
          }
        }


        /* ===================================================
           PRINT
           =================================================== */

        @media print {

          html,
          body {
            width:
              210mm !important;

            margin:
              0 !important;

            padding:
              0 !important;

            background:
              #ffffff !important;

            overflow:
              visible !important;
          }


          body {
            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;
          }


          .reportApp {
            width:
              210mm !important;

            margin:
              0 !important;

            padding:
              0 !important;

            background:
              #ffffff !important;
          }


          .screenToolbar {
            display:
              none !important;
          }


          .reportPages {
            display:
              block !important;

            width:
              210mm !important;

            margin:
              0 !important;

            padding:
              0 !important;

            gap:
              0 !important;
          }


          .a4Page {
            position:
              relative !important;

            width:
              210mm !important;

            height:
              297mm !important;

            margin:
              0 !important;

            padding:
              0 !important;

            box-shadow:
              none !important;

            overflow:
              hidden !important;

            page-break-after:
              always !important;

            break-after:
              page !important;

            print-color-adjust:
              exact !important;

            -webkit-print-color-adjust:
              exact !important;
          }


          .a4Page:last-child {
            page-break-after:
              auto !important;

            break-after:
              auto !important;
          }


          .letterheadBackground {
            position:
              absolute !important;

            left:
              0 !important;

            top:
              0 !important;

            width:
              210mm !important;

            height:
              297mm !important;

            object-fit:
              fill !important;

            z-index:
              1 !important;

            display:
              block !important;

            print-color-adjust:
              exact !important;

            -webkit-print-color-adjust:
              exact !important;
          }


          .fallbackLetterhead {
            position:
              absolute !important;

            width:
              210mm !important;

            height:
              62mm !important;
          }


          .reportContent {
            position:
              absolute !important;

            top:
              58mm !important;

            left:
              11mm !important;

            right:
              11mm !important;

            bottom:
              57mm !important;

            z-index:
              5 !important;

            width:
              auto !important;

            background:
              transparent !important;
          }


          .patientInformation {
            width:
              100% !important;

            background:
              rgba(
                255,
                255,
                255,
                0.96
              ) !important;
          }


          .reportTable {
            width:
              100% !important;

            table-layout:
              fixed !important;

            border-collapse:
              collapse !important;
          }


          .reportTable th,
          .reportTable td {
            print-color-adjust:
              exact !important;

            -webkit-print-color-adjust:
              exact !important;
          }


          .testBlock {
            page-break-inside:
              avoid !important;

            break-inside:
              avoid !important;
          }


          .reportTable tr {
            page-break-inside:
              avoid !important;

            break-inside:
              avoid !important;
          }


          .reportTable thead {
            display:
              table-header-group;
          }


          .signatureArea,
          .reportNote {
            page-break-inside:
              avoid !important;

            break-inside:
              avoid !important;
          }

        }

      `}</style>
    </>
  );
}
