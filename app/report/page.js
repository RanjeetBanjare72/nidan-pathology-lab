"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

/*
===========================================================
 NIDAN PATHOLOGY LAB
 PROFESSIONAL A4 FINAL REPORT
-----------------------------------------------------------
 IMPORTANT:
 - Letterhead comes from localStorage:
   nidanLabSettings.letterhead
 - Complete letterhead image is used as A4 background.
 - Header + watermark + footer remain together.
 - Normal CBC stays on one page.
 - Only genuinely long reports are split.
 - Print / Save PDF is A4.
===========================================================
*/

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

export default function ReportPage() {
  const router = useRouter();

  const [patient, setPatient] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
  const [results, setResults] = useState({});
  const [reportDate, setReportDate] = useState("");
  const [reportNo, setReportNo] = useState("");
  const [saveStatus, setSaveStatus] = useState("loading");
  const [saveMessage, setSaveMessage] = useState("");
  const [labSettings, setLabSettings] =
    useState(DEFAULT_SETTINGS);

  const savingRef = useRef(false);
  const saveTimerRef = useRef(null);

  /* =====================================================
     LOAD ALL REPORT DATA
  ===================================================== */

  useEffect(() => {
    try {
      const savedPatient = JSON.parse(
        localStorage.getItem("nidanPatient") || "{}"
      );

      const savedTests = JSON.parse(
        localStorage.getItem(
          "nidanSelectedTests"
        ) || "[]"
      );

      const savedResults = JSON.parse(
        localStorage.getItem(
          "nidanResults"
        ) || "{}"
      );

      const savedSettings = JSON.parse(
        localStorage.getItem(
          "nidanLabSettings"
        ) || "{}"
      );

      setPatient(savedPatient || {});

      setSelectedTests(
        Array.isArray(savedTests)
          ? savedTests
          : []
      );

      setResults(
        savedResults || {}
      );

      setLabSettings({
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
    }
  }, []);

  /* =====================================================
     NORMALIZE
  ===================================================== */

  function normalizeName(name = "") {
    return String(name)
      .toLowerCase()
      .replace(/[()]/g, "")
      .replace(/[./_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* =====================================================
     GENDER
  ===================================================== */

  function getGender() {
    const gender = String(
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

  /* =====================================================
     AGE
  ===================================================== */

  function getAge() {
    const age = parseFloat(
      patient.age
    );

    return Number.isNaN(age)
      ? null
      : age;
  }

  /* =====================================================
     DEFAULT REFERENCE DATABASE
  ===================================================== */

  function getDefaultReference(
    parameterName
  ) {
    const name =
      normalizeName(parameterName);

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
      name === "neutrophils" ||
      name === "neutrophil"
    ) {
      return {
        min: 40,
        max: 75,
        unit: "%",
        range: "40 - 75",
      };
    }

    if (
      name === "lymphocytes" ||
      name === "lymphocyte"
    ) {
      return {
        min: 20,
        max: 40,
        unit: "%",
        range: "20 - 40",
      };
    }

    if (
      name === "eosinophils" ||
      name === "eosinophil"
    ) {
      return {
        min: 1,
        max: 6,
        unit: "%",
        range: "1 - 6",
      };
    }

    if (
      name === "monocytes" ||
      name === "monocyte"
    ) {
      return {
        min: 1,
        max: 10,
        unit: "%",
        range: "1 - 10",
      };
    }

    if (
      name === "basophils" ||
      name === "basophil"
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

    if (name === "mcv") {
      return {
        min: 80,
        max: 100,
        unit: "fL",
        range: "80 - 100",
      };
    }

    if (name === "mch") {
      return {
        min: 27,
        max: 32,
        unit: "pg",
        range: "27 - 32",
      };
    }

    if (name === "mchc") {
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
      name === "rdw sd" ||
      name === "rdw-sd"
    ) {
      return {
        min: 35,
        max: 56,
        unit: "fL",
        range: "35 - 56",
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

    if (name === "mpv") {
      return {
        min: 7.5,
        max: 11.5,
        unit: "fL",
        range: "7.5 - 11.5",
      };
    }

    if (name === "pdw") {
      return {
        min: 9,
        max: 17,
        unit: "%",
        range: "9 - 17",
      };
    }

    if (name === "pct") {
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

    /* ================= SUGAR ================= */

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

    /* ================= HbA1c ================= */

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

    if (name === "t3") {
      return {
        min: 80,
        max: 200,
        unit: "ng/dL",
        range: "80 - 200",
      };
    }

    if (name === "t4") {
      return {
        min: 5,
        max: 12,
        unit: "µg/dL",
        range: "5 - 12",
      };
    }

    if (name === "tsh") {
      return {
        min: 0.4,
        max: 4.0,
        unit: "µIU/mL",
        range: "0.4 - 4.0",
      };
    }

    return null;
  }

  /* =====================================================
     RESOLVE PARAMETER
  ===================================================== */

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
      min = defaults.min;
    }

    if (
      (
        max === undefined ||
        max === null ||
        max === ""
      ) &&
      defaults
    ) {
      max = defaults.max;
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

  /* =====================================================
     PARAMETER KEY
  ===================================================== */

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

  /* =====================================================
     PARAMETER NAME
  ===================================================== */

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
      `Investigation ${
        index + 1
      }`
    );
  }

  /* =====================================================
     FLAG
  ===================================================== */

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
      Number(cleanedValue);

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

  /* =====================================================
     CATEGORY
  ===================================================== */

  function getCategory(
    test
  ) {
    return (
      test?.category ||
      test?.department ||
      "PATHOLOGY"
    );
  }

  /* =====================================================
     BUILD REPORT TESTS
  ===================================================== */

  function buildReportTests(
    tests,
    resultData
  ) {
    if (
      !Array.isArray(
        tests
      )
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

  /* =====================================================
     PAGINATION
     
     IMPORTANT:
     CBC normal size = stays on ONE page.
     Long tests only = split.
  ===================================================== */

  function paginateTests(
    tests
  ) {
    const pages = [];

    let currentPage = [];
    let currentRows = 0;

    /*
      Report content area is intentionally large.

      One normal CBC:
      ~17-20 rows

      Limit:
      23 row units

      Therefore PCT will NOT be sent
      alone to page 2.
    */

    const MAX_ROWS = 23;

    function pushPage() {
      if (
        currentPage.length > 0
      ) {
        pages.push(
          currentPage
        );
      }

      currentPage = [];
      currentRows = 0;
    }

    tests.forEach(
      (test) => {
        const params =
          Array.isArray(
            test.parameters
          )
            ? test.parameters
            : [];

        /*
          1 = category
          1 = test title
          1 = table header
        */
        const overhead = 3;

        const fullCost =
          params.length +
          overhead;

        /*
          Normal test fits.
        */
        if (
          fullCost <=
          MAX_ROWS
        ) {
          if (
            currentRows > 0 &&
            currentRows +
              fullCost >
              MAX_ROWS
          ) {
            pushPage();
          }

          currentPage.push({
            ...test,
            parameters: params,
            continuation: false,
          });

          currentRows +=
            fullCost;

          return;
        }

        /*
          Very large test:
          split only when necessary.
        */

        let start = 0;

        while (
          start <
          params.length
        ) {
          const available =
            MAX_ROWS -
            currentRows -
            overhead;

          if (
            available <= 0
          ) {
            pushPage();
            continue;
          }

          const count =
            Math.min(
              available,
              params.length -
                start
            );

          currentPage.push({
            ...test,

            id:
              `${test.id}-part-${start}`,

            parameters:
              params.slice(
                start,
                start + count
              ),

            continuation:
              start > 0,
          });

          currentRows +=
            count +
            overhead;

          start += count;

          if (
            start <
            params.length
          ) {
            pushPage();
          }
        }
      }
    );

    if (
      currentPage.length > 0
    ) {
      pages.push(
        currentPage
      );
    }

    return pages.length
      ? pages
      : [[]];
  }

  /* =====================================================
     AUTO SAVE
  ===================================================== */

  useEffect(() => {
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

    if (
      labSettings.autoSave ===
      false
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
    labSettings.autoSave,
  ]);

  /* =====================================================
     SAVE REPORT
  ===================================================== */

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

      const patientId =
        patient.patientId ||
        patient.id ||
        "";

      if (!patientId) {
        throw new Error(
          "Patient ID nahi mila."
        );
      }

      const currentPatientId =
        localStorage.getItem(
          "nidanCurrentReportPatient"
        );

      let existingReportNo =
        localStorage.getItem(
          "nidanCurrentReportNo"
        );

      if (
        currentPatientId !==
        String(patientId)
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

      setReportNo(
        generatedReportNo
      );

      const reportTests =
        buildReportTests(
          selectedTests,
          results
        );

      const reportPayload = {
        patient: {
          ...patient,
          patientId,
        },

        selectedTests,

        results,

        reportTests,

        reportDate:
          new Date().toISOString(),

        reportNo:
          generatedReportNo,
      };

      const {
        data: existingData,
        error: checkError,
      } =
        await supabase
          .from("reports")
          .select(
            "id, report_no"
          )
          .eq(
            "report_no",
            generatedReportNo
          )
          .maybeSingle();

      if (checkError) {
        console.error(
          "Existing report check error:",
          checkError
        );
      }

      if (
        existingData?.id
      ) {
        const {
          error:
            updateError,
        } =
          await supabase
            .from("reports")
            .update({
              patient_id:
                patientId,

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
      } else {
        const {
          error:
            insertError,
        } =
          await supabase
            .from("reports")
            .insert([
              {
                report_no:
                  generatedReportNo,

                patient_id:
                  patientId,

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

      localStorage.setItem(
        "nidanCurrentReportNo",
        generatedReportNo
      );

      localStorage.setItem(
        "nidanCurrentReportPatient",
        String(patientId)
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

  /* =====================================================
     PRINT
  ===================================================== */

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

  /* =====================================================
     NEW PATIENT
  ===================================================== */

  function newPatient() {
    const confirmNew =
      window.confirm(
        "New patient start karna hai? Current patient data clear ho jayega."
      );

    if (!confirmNew) {
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

  /* =====================================================
     REPORT DATA
  ===================================================== */

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
      ]
    );

  const reportPages =
    useMemo(
      () =>
        paginateTests(
          reportTests
        ),
      [reportTests]
    );

  const letterhead =
    labSettings.letterhead;

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <>
      <div className="reportApp">

        {/* =================================================
            SCREEN TOOLBAR
        ================================================= */}

        <div className="reportToolbar">

          <div className="toolbarInfo">

            <strong>
              Final Laboratory Report
            </strong>

            <small>
              Professional A4 report preview
            </small>

            {reportNo && (
              <small>
                Report No:{" "}
                {reportNo}
              </small>
            )}

            {saveStatus ===
              "saving" && (
              <small className="saving">
                ● Saving report...
              </small>
            )}

            {saveStatus ===
              "saved" && (
              <small className="saved">
                ✓ Saved to Reports
              </small>
            )}

            {saveStatus ===
              "error" && (
              <small className="error">
                ⚠ {saveMessage}
              </small>
            )}

          </div>

          <div className="toolbarButtons">

            <button
              type="button"
              className="backBtn"
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
              className="printBtn"
              onClick={
                printReport
              }
            >
              🖨 Print / Save PDF
            </button>

            <button
              type="button"
              className="newBtn"
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

        <div className="pagesContainer">

          {reportPages.map(
            (
              pageTests,
              pageIndex
            ) => (
              <ReportSheet
                key={
                  `page-${pageIndex}`
                }
                pageTests={
                  pageTests
                }
                pageIndex={
                  pageIndex
                }
                totalPages={
                  reportPages.length
                }
                patient={
                  patient
                }
                reportDate={
                  reportDate
                }
                reportNo={
                  reportNo
                }
                labSettings={
                  labSettings
                }
              />
            )
          )}

        </div>

      </div>

      {/* =====================================================
          GLOBAL CSS
      ===================================================== */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #eef2f6;
          color: #111827;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        body {
          overflow-x: hidden;
        }

        button {
          font-family: inherit;
        }

        /* =================================================
           APP
        ================================================= */

        .reportApp {
          width: 100%;
          min-height: 100vh;
          padding: 14px;
          background: #eef2f6;
        }

        /* =================================================
           TOOLBAR
        ================================================= */

        .reportToolbar {
          width: 100%;
          max-width: 1180px;
          min-height: 72px;

          margin: 0 auto 14px;

          padding: 12px 16px;

          background: #ffffff;

          border: 1px solid #dce3e9;

          border-radius: 10px;

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 15px;

          position: sticky;

          top: 8px;

          z-index: 100;

          box-shadow:
            0 4px 16px
            rgba(
              15,
              23,
              42,
              0.08
            );
        }

        .toolbarInfo {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .toolbarInfo strong {
          font-size: 16px;
          color: #172033;
        }

        .toolbarInfo small {
          font-size: 10px;
          color: #64748b;
        }

        .toolbarInfo .saving {
          color: #b7791f;
          font-weight: 700;
        }

        .toolbarInfo .saved {
          color: #15803d;
          font-weight: 700;
        }

        .toolbarInfo .error {
          color: #dc2626;
          font-weight: 700;
        }

        .toolbarButtons {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
        }

        .toolbarButtons button {
          min-height: 38px;
          padding: 8px 13px;

          border-radius: 7px;

          font-size: 11px;

          font-weight: 800;

          cursor: pointer;

          white-space: nowrap;
        }

        .backBtn {
          border: 1px solid #d8e0e7;
          background: #ffffff;
          color: #334155;
        }

        .printBtn {
          border: 1px solid #087f7d;
          background: #087f7d;
          color: #ffffff;
        }

        .newBtn {
          border: 1px solid #fecaca;
          background: #ffffff;
          color: #dc2626;
        }

        /* =================================================
           PAGES CONTAINER
        ================================================= */

        .pagesContainer {
          width: 100%;

          display: flex;

          flex-direction: column;

          align-items: center;

          gap: 20px;
        }

        /* =================================================
           A4 SHEET
        ================================================= */

        .reportSheet {
          position: relative;

          width: min(
            210mm,
            calc(100vw - 28px)
          );

          aspect-ratio:
            210 / 297;

          background:
            #ffffff;

          overflow: hidden;

          box-shadow:
            0 8px 28px
            rgba(
              15,
              23,
              42,
              0.15
            );
        }

        /* =================================================
           COMPLETE LETTERHEAD BACKGROUND
           
           THIS IS THE IMPORTANT FIX.

           The uploaded image is NOT placed
           inside the report content.

           It remains as the complete A4
           background, preserving:
           - original header
           - original watermark
           - original footer
        ================================================= */

        .letterheadBackground {
          position: absolute;

          inset: 0;

          width: 100%;

          height: 100%;

          display: block;

          object-fit: fill;

          z-index: 0;

          pointer-events: none;

          user-select: none;
        }

        /* =================================================
           FALLBACK HEADER
           
           Used only when no letterhead
           has been uploaded.
        ================================================= */

        .fallbackLetterhead {
          position: absolute;

          inset: 0;

          z-index: 0;

          background:
            #ffffff;
        }

        .fallbackHeader {
          position: absolute;

          left: 8%;

          right: 8%;

          top: 3%;

          height: 15%;

          border-bottom:
            2px solid #222;

          display: flex;

          align-items: center;

          gap: 12px;
        }

        .fallbackLogo {
          width: 52px;

          height: 52px;

          border-radius: 50%;

          background: #087f7d;

          color: #ffffff;

          display: flex;

          align-items: center;

          justify-content: center;

          font-size: 24px;

          font-weight: 900;
        }

        .fallbackLab h1 {
          margin: 0;

          color: #b91c1c;

          font-size: 25px;

          line-height: 1.1;
        }

        .fallbackLab p {
          margin: 4px 0 0;

          color: #111827;

          font-size: 11px;
        }

        .fallbackFooter {
          position: absolute;

          left: 0;

          right: 0;

          bottom: 0;

          height: 12%;

          background:
            linear-gradient(
              145deg,
              #075985,
              #0284c7
            );

          color: #ffffff;

          display: flex;

          align-items: center;

          justify-content: center;

          text-align: center;

          padding: 10px;

          font-size: 10px;

          font-weight: 800;
        }

        /* =================================================
           REPORT CONTENT AREA
           
           IMPORTANT:
           Content stays between the original
           letterhead header and footer.
        ================================================= */

        .sheetContent {
          position: absolute;

          z-index: 5;

          top: 42.5%;

          left: 8.2%;

          right: 8.2%;

          bottom: 16.5%;

          overflow: hidden;

          display: flex;

          flex-direction: column;
        }

        /*
          We use a second layout wrapper so that
          patient information and report tables
          remain completely readable over the
          light watermark.
        */

        .reportContentInner {
          width: 100%;

          height: 100%;

          display: flex;

          flex-direction: column;

          min-height: 0;
        }

        /* =================================================
           PATIENT INFORMATION
        ================================================= */

        .patientBox {
          width: 100%;

          background:
            rgba(
              255,
              255,
              255,
              0.97
            );

          border-top:
            1px solid #222;

          border-bottom:
            1px solid #9ca3af;

          display: grid;

          grid-template-columns:
            1.2fr 1fr 1fr;

          flex-shrink: 0;

          margin-bottom: 8px;
        }

        .patientColumn {
          min-width: 0;

          padding:
            5px 7px;

          border-right:
            1px solid #cbd5e1;
        }

        .patientColumn:last-child {
          border-right: 0;
        }

        .patientLine {
          display: flex;

          gap: 4px;

          align-items:
            flex-start;

          margin-bottom: 3px;

          font-size: 7.4px;

          line-height: 1.25;

          color: #111827;
        }

        .patientLine:last-child {
          margin-bottom: 0;
        }

        .patientLabel {
          font-weight: 800;

          white-space: nowrap;
        }

        .patientValue {
          min-width: 0;

          overflow-wrap:
            anywhere;

          font-weight: 500;
        }

        /* =================================================
           TEST AREA
        ================================================= */

        .testArea {
          width: 100%;

          flex: 1;

          min-height: 0;

          overflow: hidden;

          display: flex;

          flex-direction: column;

          gap: 6px;
        }

        .testBlock {
          width: 100%;

          background:
            rgba(
              255,
              255,
              255,
              0.97
            );

          page-break-inside:
            avoid;

          break-inside:
            avoid;

          flex-shrink: 0;
        }

        .testCategory {
          text-align: center;

          color: #475569;

          font-size: 6.7px;

          line-height: 1.1;

          font-weight: 900;

          letter-spacing:
            0.6px;

          margin:
            1px 0 1px;

          text-transform:
            uppercase;
        }

        .testTitle {
          text-align: center;

          color: #111827;

          font-size: 9px;

          line-height: 1.2;

          font-weight: 900;

          margin-bottom: 3px;

          text-transform:
            uppercase;
        }

        /* =================================================
           TABLE
        ================================================= */

        .reportTable {
          width: 100%;

          border-collapse:
            collapse;

          table-layout:
            fixed;

          background:
            rgba(
              255,
              255,
              255,
              0.98
            );
        }

        .reportTable th {
          height: 17px;

          padding:
            3px 4px;

          border:
            1px solid #9aa5b1;

          background:
            #edf2f7;

          color:
            #111827;

          font-size: 6.4px;

          line-height: 1.1;

          font-weight: 900;

          text-align: center;

          vertical-align:
            middle;

          text-transform:
            uppercase;
        }

        .reportTable td {
          min-height: 15px;

          padding:
            3px 4px;

          border:
            1px solid #c7d0d9;

          background:
            rgba(
              255,
              255,
              255,
              0.96
            );

          color:
            #111827;

          font-size: 7px;

          line-height: 1.15;

          vertical-align:
            middle;

          overflow-wrap:
            anywhere;
        }

        .reportTable th:nth-child(1),
        .reportTable td:nth-child(1) {
          width: 31%;

          text-align: left;
        }

        .reportTable th:nth-child(2),
        .reportTable td:nth-child(2) {
          width: 10%;

          text-align: center;
        }

        .reportTable th:nth-child(3),
        .reportTable td:nth-child(3) {
          width: 16%;

          text-align: center;
        }

        .reportTable th:nth-child(4),
        .reportTable td:nth-child(4) {
          width: 28%;

          text-align: center;
        }

        .reportTable th:nth-child(5),
        .reportTable td:nth-child(5) {
          width: 15%;

          text-align: center;
        }

        .parameterName {
          font-weight:
            600;
        }

        .resultNormal {
          text-align:
            center;

          font-weight:
            700;
        }

        .resultAbnormal {
          text-align:
            center;

          font-weight:
            900;

          color:
            #c62828 !important;
        }

        .flagCell {
          text-align:
            center !important;
        }

        .flagBadge {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          min-width: 15px;

          height: 12px;

          padding:
            1px 4px;

          border-radius:
            3px;

          font-size:
            6px;

          font-weight:
            900;
        }

        .highFlag {
          color:
            #b91c1c;

          background:
            #fee2e2;
        }

        .lowFlag {
          color:
            #1d4ed8;

          background:
            #dbeafe;
        }

        .noParameter {
          text-align:
            center !important;

          color:
            #64748b !important;

          padding:
            7px !important;
        }

        /* =================================================
           SIGNATURE AREA
        ================================================= */

        .signatureArea {
          width: 100%;

          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 60px;

          margin-top: auto;

          padding-top: 7px;

          flex-shrink: 0;

          background:
            rgba(
              255,
              255,
              255,
              0.90
            );

          page-break-inside:
            avoid;

          break-inside:
            avoid;
        }

        .signatureBox {
          text-align:
            center;

          color:
            #111827;

          font-size:
            7px;
        }

        .signatureLine {
          width: 100%;

          height: 17px;

          border-bottom:
            1px solid #374151;

          margin-bottom:
            3px;
        }

        .signatureBox strong {
          display:
            block;

          font-size:
            7px;
        }

        .signatureBox span {
          display:
            block;

          margin-top:
            1px;

          color:
            #64748b;

          font-size:
            6px;
        }

        /* =================================================
           NOTE
        ================================================= */

        .reportNote {
          margin-top:
            5px;

          padding:
            3px 5px;

          border-top:
            1px solid #9ca3af;

          background:
            rgba(
              255,
              255,
              255,
              0.90
            );

          color:
            #475569;

          font-size:
            5.8px;

          line-height:
            1.3;

          flex-shrink:
            0;
        }

        .reportNote strong {
          color:
            #111827;
        }

        /* =================================================
           PAGE NUMBER
        ================================================= */

        .pageNumber {
          position: absolute;

          right: 8mm;

          bottom: 5mm;

          z-index: 10;

          font-size: 7px;

          font-weight: 700;

          color: #475569;

          background:
            rgba(
              255,
              255,
              255,
              0.65
            );

          padding:
            2px 4px;

          border-radius:
            3px;
        }

        /* =================================================
           EMPTY
        ================================================= */

        .emptyReport {
          width: 100%;

          padding:
            20px;

          text-align:
            center;

          background:
            rgba(
              255,
              255,
              255,
              0.97
            );

          border:
            1px solid #cbd5e1;

          color:
            #64748b;

          font-size:
            10px;
        }

        /* =================================================
           MOBILE SCREEN
        ================================================= */

        @media (max-width: 700px) {

          .reportApp {
            padding:
              7px;
          }

          .reportToolbar {
            position:
              static;

            margin-bottom:
              9px;

            padding:
              10px;

            flex-direction:
              column;

            align-items:
              stretch;

            gap:
              8px;
          }

          .toolbarButtons {
            display:
              grid;

            grid-template-columns:
              1fr 1fr;

            width:
              100%;

            gap:
              6px;
          }

          .toolbarButtons button {
            width:
              100%;

            min-height:
              40px;

            padding:
              7px 5px;

            font-size:
              9px;
          }

          .toolbarButtons
          .printBtn {
            grid-column:
              span 2;
          }

          .reportSheet {
            width:
              calc(100vw - 14px);

            box-shadow:
              0 4px 16px
              rgba(
                15,
                23,
                42,
                0.13
              );
          }

          .sheetContent {
            top:
              42.5%;

            left:
              8.2%;

            right:
              8.2%;

            bottom:
              16.5%;
          }

          .patientBox {
            grid-template-columns:
              1.2fr 1fr 1fr;
          }

          .patientColumn {
            padding:
              4px 5px;
          }

          .patientLine {
            font-size:
              5.8px;

            margin-bottom:
              2px;
          }

          .testCategory {
            font-size:
              5.5px;
          }

          .testTitle {
            font-size:
              7px;
          }

          .reportTable th {
            height:
              14px;

            padding:
              2px 2px;

            font-size:
              4.8px;
          }

          .reportTable td {
            min-height:
              12px;

            padding:
              2px;

            font-size:
              5.2px;
          }

          .signatureArea {
            gap:
              25px;

            padding-top:
              5px;
          }

          .signatureBox {
            font-size:
              5.5px;
          }

          .signatureBox strong {
            font-size:
              5.5px;
          }

          .signatureBox span {
            font-size:
              4.8px;
          }

          .reportNote {
            font-size:
              4.5px;

            padding:
              2px 3px;
          }

        }

        /* =================================================
           PRINT
        ================================================= */

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
              210mm;

            margin:
              0 !important;

            padding:
              0 !important;

            background:
              #ffffff !important;
          }

          body {
            overflow:
              visible !important;

            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;
          }

          .reportApp {
            width:
              210mm;

            margin:
              0 !important;

            padding:
              0 !important;

            background:
              #ffffff !important;
          }

          .reportToolbar {
            display:
              none !important;
          }

          .pagesContainer {
            display:
              block;

            width:
              210mm;

            margin:
              0;

            padding:
              0;

            gap:
              0;
          }

          .reportSheet {
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
              0 !important;

            box-shadow:
              none !important;

            overflow:
              hidden !important;

            page-break-after:
              always;

            break-after:
              page;

            background:
              #ffffff !important;
          }

          .reportSheet:last-child {
            page-break-after:
              auto;

            break-after:
              auto;
          }

          .letterheadBackground {
            display:
              block !important;

            width:
              100% !important;

            height:
              100% !important;

            object-fit:
              fill !important;
          }

          .fallbackLetterhead {
            display:
              block !important;
          }

          .sheetContent {
            position:
              absolute !important;

            top:
              42.5% !important;

            left:
              8.2% !important;

            right:
              8.2% !important;

            bottom:
              16.5% !important;

            overflow:
              hidden !important;
          }

          .reportTable {
            width:
              100% !important;

            border-collapse:
              collapse !important;
          }

          .reportTable thead {
            display:
              table-header-group;
          }

          .reportTable tr {
            page-break-inside:
              avoid;

            break-inside:
              avoid;
          }

          .testBlock {
            page-break-inside:
              avoid;

            break-inside:
              avoid;
          }

          .signatureArea,
          .reportNote,
          .patientBox {
            page-break-inside:
              avoid;

            break-inside:
              avoid;
          }

          .pageNumber {
            display:
              block;
          }

          .reportTable th,
          .reportTable td,
          .patientBox,
          .reportNote,
          .signatureArea {
            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;
          }
        }

      `}</style>
    </>
  );
}

/* =========================================================
   REPORT SHEET COMPONENT
========================================================= */

function ReportSheet({
  pageTests,
  pageIndex,
  totalPages,
  patient,
  reportDate,
  reportNo,
  labSettings,
}) {
  const letterhead =
    labSettings?.letterhead || "";

  const patientId =
    patient?.patientId ||
    patient?.id ||
    "-";

  const patientName =
    patient?.name ||
    "-";

  const age =
    patient?.age ||
    "-";

  const gender =
    patient?.gender ||
    patient?.sex ||
    "-";

  const mobile =
    patient?.mobile ||
    patient?.mobileNumber ||
    "-";

  const doctor =
    patient?.doctor ||
    patient?.refDoctor ||
    patient?.referredBy ||
    labSettings?.doctorName ||
    "-";

  const sampleDate =
    patient?.sampleDate ||
    reportDate ||
    "-";

  const labName =
    labSettings?.labName ||
    "NIDAN PATHOLOGY LAB";

  const hasTests =
    Array.isArray(pageTests) &&
    pageTests.length > 0;

  return (
    <div className="reportSheet">

      {/* =================================================
          COMPLETE ORIGINAL LETTERHEAD
      ================================================= */}

      {letterhead ? (
        <img
          className="letterheadBackground"
          src={letterhead}
          alt=""
          draggable="false"
        />
      ) : (
        <div className="fallbackLetterhead">

          <div className="fallbackHeader">

            <div className="fallbackLogo">
              N+
            </div>

            <div className="fallbackLab">

              <h1>
                {labName}
              </h1>

              <p>
                Clinical Pathology &
                Diagnostic Laboratory
              </p>

            </div>

          </div>

          <div className="fallbackFooter">
            {labSettings?.phone
              ? `Contact: ${labSettings.phone}`
              : "Laboratory Report"}
          </div>

        </div>
      )}

      {/* =================================================
          REPORT CONTENT
      ================================================= */}

      <div className="sheetContent">

        <div className="reportContentInner">

          {/* =================================================
              PATIENT INFORMATION
          ================================================= */}

          <section className="patientBox">

            <div className="patientColumn">

              <div className="patientLine">
                <span className="patientLabel">
                  Patient Name:
                </span>

                <span className="patientValue">
                  {patientName}
                </span>
              </div>

              <div className="patientLine">
                <span className="patientLabel">
                  Age / Sex:
                </span>

                <span className="patientValue">
                  {age} Years /{" "}
                  {gender}
                </span>
              </div>

              <div className="patientLine">
                <span className="patientLabel">
                  Referred By:
                </span>

                <span className="patientValue">
                  {doctor}
                </span>
              </div>

              <div className="patientLine">
                <span className="patientLabel">
                  Sample ID:
                </span>

                <span className="patientValue">
                  {patientId}
                </span>
              </div>

            </div>

            <div className="patientColumn">

              <div className="patientLine">
                <span className="patientLabel">
                  Patient ID:
                </span>

                <span className="patientValue">
                  {patientId}
                </span>
              </div>

              <div className="patientLine">
                <span className="patientLabel">
                  Mobile:
                </span>

                <span className="patientValue">
                  {mobile}
                </span>
              </div>

              <div className="patientLine">
                <span className="patientLabel">
                  Lab:
                </span>

                <span className="patientValue">
                  {labName}
                </span>
              </div>

            </div>

            <div className="patientColumn">

              <div className="patientLine">
                <span className="patientLabel">
                  Report ID:
                </span>

                <span className="patientValue">
                  {reportNo || "-"}
                </span>
              </div>

              <div className="patientLine">
                <span className="patientLabel">
                  Collection:
                </span>

                <span className="patientValue">
                  {sampleDate}
                </span>
              </div>

              <div className="patientLine">
                <span className="patientLabel">
                  Report Date:
                </span>

                <span className="patientValue">
                  {reportDate || "-"}
                </span>
              </div>

            </div>

          </section>

          {/* =================================================
              TESTS
          ================================================= */}

          <div className="testArea">

            {!hasTests ? (
              <div className="emptyReport">
                No investigations selected.
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
                      test.id ||
                      `${pageIndex}-${testIndex}`
                    }
                  >

                    <div className="testCategory">
                      {(
                        test.category ||
                        "PATHOLOGY"
                      ).toUpperCase()}
                    </div>

                    <div className="testTitle">

                      {test.name}

                      {test.continuation
                        ? " (CONTINUED)"
                        : ""}

                    </div>

                    <table className="reportTable">

                      <thead>

                        <tr>

                          <th>
                            Investigation
                          </th>

                          {labSettings?.showFlag !==
                            false && (
                            <th>
                              Flag
                            </th>
                          )}

                          <th>
                            Result
                          </th>

                          {labSettings?.showReferenceRange !==
                            false && (
                            <th>
                              Reference Range
                            </th>
                          )}

                          <th>
                            Unit
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {test.parameters?.length ===
                        0 ? (
                          <tr>
                            <td
                              colSpan={
                                labSettings?.showFlag !==
                                  false &&
                                labSettings?.showReferenceRange !==
                                  false
                                  ? 5
                                  : 3
                              }
                              className="noParameter"
                            >
                              No parameters available
                            </td>
                          </tr>
                        ) : (
                          test.parameters.map(
                            (
                              parameter,
                              parameterIndex
                            ) => (
                              <tr
                                key={`${test.id}-${parameterIndex}`}
                              >

                                <td>
                                  <span className="parameterName">
                                    {
                                      parameter.name
                                    }
                                  </span>
                                </td>

                                {labSettings?.showFlag !==
                                  false && (
                                  <td className="flagCell">

                                    {parameter.flag ? (
                                      <span
                                        className={`flagBadge ${
                                          parameter.flag ===
                                          "H"
                                            ? "highFlag"
                                            : "lowFlag"
                                        }`}
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
                                    parameter.flag
                                      ? "resultAbnormal"
                                      : "resultNormal"
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

                                {labSettings?.showReferenceRange !==
                                  false && (
                                  <td>
                                    {
                                      parameter.referenceRange
                                    }
                                  </td>
                                )}

                                <td>
                                  {
                                    parameter.unit
                                  }
                                </td>

                              </tr>
                            )
                          )
                        )}

                      </tbody>

                    </table>

                  </section>
                )
              )
            )}

          </div>

          {/* =================================================
              SIGNATURE
          ================================================= */}

          <section className="signatureArea">

            <div className="signatureBox">

              <div className="signatureLine" />

              <strong>
                Lab Technician
              </strong>

              <span>
                {labName}
              </span>

            </div>

            <div className="signatureBox">

              <div className="signatureLine" />

              <strong>
                Authorized Signatory
              </strong>

              <span>
                Signature & Seal
              </span>

            </div>

          </section>

          {/* =================================================
              NOTE
          ================================================= */}

          <div className="reportNote">

            <strong>
              Note:
            </strong>{" "}

            Reference intervals may vary according
            to laboratory method, age, sex and
            clinical circumstances. Laboratory
            results should be interpreted with
            relevant clinical findings.

          </div>

        </div>

      </div>

      {/* =================================================
          PAGE NUMBER
      ================================================= */}

      {totalPages > 1 && (
        <div className="pageNumber">
          {pageIndex + 1} /{" "}
          {totalPages}
        </div>
      )}

    </div>
  );
}
