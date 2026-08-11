"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

/* =========================================================
   NIDAN PATHOLOGY LAB
   COMPLETE RESULT ENTRY PAGE

   FIXES:
   1. Blank result can be saved
   2. Pending report is created in Supabase
   3. Existing pending report is updated
   4. Duplicate report protection
   5. LocalStorage backup
   6. Result editing
   7. Reference range
   8. HIGH / LOW / NORMAL flag
   9. Mobile + Desktop
   ========================================================= */

export default function ResultsPage() {
  const router = useRouter();

  const [patient, setPatient] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
  const [results, setResults] = useState({});
  const [activeTest, setActiveTest] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [saving, setSaving] = useState(false);

  /* =========================================================
     LOAD DATA
     ========================================================= */

  useEffect(() => {
    try {
      const patientData = JSON.parse(
        localStorage.getItem("nidanPatient") || "{}"
      );

      const testData = JSON.parse(
        localStorage.getItem("nidanSelectedTests") || "[]"
      );

      const resultData = JSON.parse(
        localStorage.getItem("nidanResults") || "{}"
      );

      setPatient(
        patientData &&
          typeof patientData === "object"
          ? patientData
          : {}
      );

      setSelectedTests(
        Array.isArray(testData)
          ? testData
          : []
      );

      setResults(
        resultData &&
          typeof resultData === "object"
          ? resultData
          : {}
      );

      if (
        Array.isArray(testData) &&
        testData.length > 0
      ) {
        setActiveTest(
          testData[0].id
        );
      }
    } catch (error) {
      console.error(
        "Result page load error:",
        error
      );
    }
  }, []);

  /* =========================================================
     CURRENT TEST
     ========================================================= */

  const currentTest = useMemo(() => {
    return selectedTests.find(
      (test) =>
        String(test.id) ===
        String(activeTest)
    );
  }, [
    selectedTests,
    activeTest,
  ]);

  /* =========================================================
     AGE
     ========================================================= */

  function getPatientAge() {
    const age = parseFloat(
      patient?.age
    );

    if (Number.isNaN(age)) {
      return null;
    }

    return age;
  }

  /* =========================================================
     GENDER
     ========================================================= */

  function getPatientGender() {
    const gender = String(
      patient?.gender ||
        patient?.sex ||
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

  /* =========================================================
     NORMALIZE
     ========================================================= */

  function normalizeParameterName(
    name = ""
  ) {
    return String(name)
      .toLowerCase()
      .replace(/[()]/g, "")
      .replace(/[./_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* =========================================================
     DEFAULT REFERENCE DATABASE
     ========================================================= */

  function getDefaultReference(
    parameterName
  ) {
    const name =
      normalizeParameterName(
        parameterName
      );

    const gender =
      getPatientGender();

    const age =
      getPatientAge();

    /* CBC */

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
          min: 4,
          max: 5.5,
          unit: "million/cumm",
          range: "4.0 - 5.5",
        };
      }

      return {
        min: 4.5,
        max: 6,
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
      name === "rdw cv"
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

    /* ESR */

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

    /* BLOOD SUGAR */

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

    /* KFT */

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
      if (
        gender === "female"
      ) {
        return {
          min: 2.4,
          max: 6,
          unit: "mg/dL",
          range: "2.4 - 6.0",
        };
      }

      return {
        min: 3.4,
        max: 7,
        unit: "mg/dL",
        range: "3.4 - 7.0",
      };
    }

    if (name === "sodium") {
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

    if (name === "bun") {
      return {
        min: 7,
        max: 20,
        unit: "mg/dL",
        range: "7 - 20",
      };
    }

    /* LFT */

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
        min: 6,
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
        max: 5,
        unit: "g/dL",
        range: "3.5 - 5.0",
      };
    }

    if (
      name === "globulin"
    ) {
      return {
        min: 2,
        max: 3.5,
        unit: "g/dL",
        range: "2.0 - 3.5",
      };
    }

    /* LIPID */

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

    /* HbA1c */

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

    /* THYROID */

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
        max: 4,
        unit: "µIU/mL",
        range: "0.4 - 4.0",
      };
    }

    return null;
  }

  /* =========================================================
     RESOLVE PARAMETER
     ========================================================= */

  function resolveParameter(
    parameter
  ) {
    const parameterName =
      parameter?.name ||
      parameter?.testName ||
      parameter?.investigation ||
      "";

    const defaultData =
      getDefaultReference(
        parameterName
      );

    let min =
      parameter?.min;

    let max =
      parameter?.max;

    let unit =
      parameter?.unit ||
      parameter?.units ||
      defaultData?.unit ||
      "";

    let range =
      parameter?.range ||
      parameter?.reference ||
      parameter?.referenceRange ||
      "";

    if (
      (
        min === undefined ||
        min === null ||
        min === ""
      ) &&
      defaultData
    ) {
      min = defaultData.min;
    }

    if (
      (
        max === undefined ||
        max === null ||
        max === ""
      ) &&
      defaultData
    ) {
      max = defaultData.max;
    }

    if (
      !range &&
      defaultData
    ) {
      range =
        defaultData.range;
    }

    if (!range) {
      if (
        min !== undefined &&
        min !== null &&
        min !== "" &&
        max !== undefined &&
        max !== null &&
        max !== ""
      ) {
        range =
          `${min} - ${max}`;
      } else if (
        max !== undefined &&
        max !== null &&
        max !== ""
      ) {
        range =
          `< ${max}`;
      } else if (
        min !== undefined &&
        min !== null &&
        min !== ""
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

  /* =========================================================
     RESULT KEY
     ========================================================= */

  function getParameterKey(
    testId,
    parameter,
    index
  ) {
    const name =
      parameter?.name ||
      parameter?.testName ||
      parameter?.investigation ||
      `parameter-${index}`;

    return `${testId}-${name}-${index}`;
  }

  /* =========================================================
     UPDATE RESULT
     ========================================================= */

  function updateResult(
    testId,
    parameter,
    index,
    value
  ) {
    const key =
      getParameterKey(
        testId,
        parameter,
        index
      );

    setResults(
      (previous) => ({
        ...previous,
        [key]: value,
      })
    );
  }

  /* =========================================================
     FLAG
     ========================================================= */

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

    const numericValue =
      Number(
        String(value)
          .replace(/,/g, "")
      );

    if (
      Number.isNaN(
        numericValue
      )
    ) {
      return "";
    }

    const hasMin =
      resolved.min !==
        undefined &&
      resolved.min !==
        null &&
      resolved.min !== "";

    const hasMax =
      resolved.max !==
        undefined &&
      resolved.max !==
        null &&
      resolved.max !== "";

    if (hasMin) {
      const min =
        Number(
          resolved.min
        );

      if (
        !Number.isNaN(min) &&
        numericValue < min
      ) {
        return "LOW";
      }
    }

    if (hasMax) {
      const max =
        Number(
          resolved.max
        );

      if (
        !Number.isNaN(max) &&
        numericValue > max
      ) {
        return "HIGH";
      }
    }

    if (
      hasMin ||
      hasMax
    ) {
      return "NORMAL";
    }

    return "";
  }

  /* =========================================================
     OPTIONS
     ========================================================= */

  function getOptions(
    parameter
  ) {
    if (
      Array.isArray(
        parameter?.options
      ) &&
      parameter.options.length >
        0
    ) {
      return parameter.options;
    }

    const name =
      normalizeParameterName(
        parameter?.name ||
          ""
      );

    if (
      name.includes("hiv") ||
      name.includes("hbsag") ||
      name.includes("hcv")
    ) {
      return [
        "Non-Reactive",
        "Reactive",
      ];
    }

    if (
      name === "albumin" ||
      name === "sugar"
    ) {
      return [
        "Nil",
        "Trace",
        "+",
        "++",
        "+++",
        "++++",
      ];
    }

    if (
      name === "colour" ||
      name === "color"
    ) {
      return [
        "Pale Yellow",
        "Yellow",
        "Dark Yellow",
        "Straw",
        "Colourless",
        "Other",
      ];
    }

    if (
      name === "appearance"
    ) {
      return [
        "Clear",
        "Slightly Turbid",
        "Turbid",
      ];
    }

    return [];
  }

  /* =========================================================
     BUILD REPORT DATA
     ========================================================= */

  function buildReportData() {
    const patientId =
      patient?.id ||
      patient?.patient_id ||
      null;

    const patientNumber =
      patient?.patientId ||
      patient?.patient_id_number ||
      patient?.number ||
      patient?.id ||
      "";

    const tests =
      selectedTests.map(
        (test) => ({
          id: test.id,
          name:
            test.name ||
            test.short ||
            "",
          short:
            test.short ||
            test.name ||
            "",
          category:
            test.category ||
            "",
          price:
            test.price ||
            test.rate ||
            0,
          parameters:
            test.tests ||
            test.parameters ||
            [],
        })
      );

    return {
      patient_id:
        patientId,

      patient_number:
        patientNumber,

      patient_name:
        patient?.name ||
        "",

      age:
        patient?.age ??
        null,

      gender:
        patient?.gender ||
        patient?.sex ||
        "",

      referring_doctor:
        patient?.doctor ||
        patient?.refDoctor ||
        patient?.referring_doctor ||
        "",

      tests:
        tests,

      results:
        results,

      status:
        "Pending",
    };
  }

  /* =========================================================
     SAVE REPORT TO SUPABASE
     ========================================================= */

  async function saveReportToSupabase() {
    const report =
      buildReportData();

    const databasePatientId =
      report.patient_id;

    /*
      अगर patient database ID available है,
      तो उसी patient की latest report check होगी.
    */

    if (
      databasePatientId
    ) {
      const {
        data: existing,
        error: findError,
      } = await supabase
        .from("reports")
        .select("*")
        .eq(
          "patient_id",
          databasePatientId
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1);

      if (
        findError
      ) {
        console.warn(
          "Report search:",
          findError.message
        );
      }

      if (
        existing &&
        existing.length > 0
      ) {
        const existingReport =
          existing[0];

        const {
          data: updated,
          error:
            updateError,
        } = await supabase
          .from("reports")
          .update({
            patient_number:
              report.patient_number,

            patient_name:
              report.patient_name,

            age:
              report.age,

            gender:
              report.gender,

            referring_doctor:
              report.referring_doctor,

            tests:
              report.tests,

            results:
              report.results,

            status:
              "Pending",

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            existingReport.id
          )
          .select()
          .single();

        if (
          updateError
        ) {
          throw updateError;
        }

        localStorage.setItem(
          "nidanReportId",
          String(
            updated?.id ||
              existingReport.id
          )
        );

        return updated;
      }
    }

    /*
      NEW REPORT
    */

    const {
      data,
      error,
    } = await supabase
      .from("reports")
      .insert([
        report,
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data?.id) {
      localStorage.setItem(
        "nidanReportId",
        String(data.id)
      );
    }

    return data;
  }

  /* =========================================================
     SAVE RESULTS
     ========================================================= */

  async function saveResults(
    showMessage = true
  ) {
    if (saving) {
      return false;
    }

    setSaving(true);

    try {
      /*
        ALWAYS save result locally.
      */

      localStorage.setItem(
        "nidanResults",
        JSON.stringify(
          results
        )
      );

      /*
        Save current patient/tests too.
      */

      localStorage.setItem(
        "nidanPatient",
        JSON.stringify(
          patient
        )
      );

      localStorage.setItem(
        "nidanSelectedTests",
        JSON.stringify(
          selectedTests
        )
      );

      /*
        SUPABASE REPORT
      */

      let reportData = null;

      try {
        reportData =
          await saveReportToSupabase();
      } catch (
        supabaseError
      ) {
        console.error(
          "Supabase report error:",
          supabaseError
        );

        /*
          Local pending backup
          रहेगा.
        */

        localStorage.setItem(
          "nidanPendingReport",
          JSON.stringify({
            ...buildReportData(),
            savedAt:
              new Date().toISOString(),
          })
        );

        alert(
          "Result local में save हो गया, लेकिन Supabase report save नहीं हुई.\n\n" +
            supabaseError.message
        );

        return false;
      }

      /*
        LOCAL PENDING BACKUP
      */

      localStorage.setItem(
        "nidanPendingReport",
        JSON.stringify({
          ...buildReportData(),
          reportId:
            reportData?.id ||
            localStorage.getItem(
              "nidanReportId"
            ),
          savedAt:
            new Date().toISOString(),
        })
      );

      /*
        SUCCESS
      */

      if (showMessage) {
        setSavedMessage(
          "✓ Results saved — Report Pending"
        );

        setTimeout(
          () => {
            setSavedMessage(
              ""
            );
          },
          3000
        );
      }

      return true;
    } catch (error) {
      console.error(
        "Result save error:",
        error
      );

      alert(
        "Result save नहीं हो पाया.\n\n" +
          error.message
      );

      return false;
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     MISSING RESULTS
     ========================================================= */

  function getMissingResults() {
    const missing = [];

    selectedTests.forEach(
      (test) => {
        const parameters =
          test.tests ||
          test.parameters ||
          [];

        parameters.forEach(
          (
            parameter,
            index
          ) => {
            const key =
              getParameterKey(
                test.id,
                parameter,
                index
              );

            const value =
              results[key];

            if (
              value ===
                undefined ||
              value === null ||
              String(value).trim() ===
                ""
            ) {
              missing.push({
                test:
                  test.short ||
                  test.name ||
                  "Test",

                parameter:
                  parameter?.name ||
                  parameter?.testName ||
                  parameter?.investigation ||
                  "Parameter",
              });
            }
          }
        );
      }
    );

    return missing;
  }

  /* =========================================================
     FINAL REPORT
     ========================================================= */

  async function continueReport() {
    if (
      selectedTests.length ===
      0
    ) {
      alert(
        "Koi test selected nahi hai."
      );
      return;
    }

    const missing =
      getMissingResults();

    if (
      missing.length > 0
    ) {
      const preview =
        missing
          .slice(0, 5)
          .map(
            (item) =>
              `${item.test}: ${item.parameter}`
          )
          .join("\n");

      const more =
        missing.length > 5
          ? `\nAur ${
              missing.length - 5
            } result blank hain.`
          : "";

      const proceed =
        window.confirm(
          `${missing.length} result blank hain:\n\n${preview}${more}\n\nKya phir bhi Final Report banana hai?`
        );

      if (!proceed) {
        return;
      }
    }

    const saved =
      await saveResults(
        false
      );

    if (!saved) {
      return;
    }

    router.push(
      "/report"
    );
  }

  /* =========================================================
     NEXT TEST
     ========================================================= */

  async function nextTest() {
    const index =
      selectedTests.findIndex(
        (test) =>
          String(test.id) ===
          String(activeTest)
      );

    if (
      index >= 0 &&
      index <
        selectedTests.length - 1
    ) {
      setActiveTest(
        selectedTests[
          index + 1
        ].id
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      await continueReport();
    }
  }

  /* =========================================================
     PREVIOUS TEST
     ========================================================= */

  function previousTest() {
    const index =
      selectedTests.findIndex(
        (test) =>
          String(test.id) ===
          String(activeTest)
      );

    if (index > 0) {
      setActiveTest(
        selectedTests[
          index - 1
        ].id
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  /* =========================================================
     COUNTS
     ========================================================= */

  const totalParameters =
    selectedTests.reduce(
      (
        total,
        test
      ) =>
        total +
        (
          test.tests ||
          test.parameters ||
          []
        ).length,
      0
    );

  const completedResults =
    selectedTests.reduce(
      (
        total,
        test
      ) => {
        const parameters =
          test.tests ||
          test.parameters ||
          [];

        const completed =
          parameters.filter(
            (
              parameter,
              index
            ) => {
              const key =
                getParameterKey(
                  test.id,
                  parameter,
                  index
                );

              const value =
                results[key];

              return (
                value !==
                  undefined &&
                value !== null &&
                String(
                  value
                ).trim() !== ""
              );
            }
          ).length;

        return (
          total + completed
        );
      },
      0
    );

  const progress =
    totalParameters > 0
      ? Math.round(
          (completedResults /
            totalParameters) *
            100
        )
      : 0;

  const currentParameters =
    currentTest
      ? currentTest.tests ||
        currentTest.parameters ||
        []
      : [];

  const currentIndex =
    selectedTests.findIndex(
      (test) =>
        String(test.id) ===
        String(activeTest)
    );

  /* =========================================================
     UI
     ========================================================= */

  return (
    <>
      <div className="resultPageApp">

        {/* SIDEBAR */}

        <aside className="resultSidebar">

          <div className="resultBrand">
            <div className="resultBrandLogo">
              N+
            </div>

            <div>
              <h2>NIDAN</h2>
              <p>
                PATHOLOGY LAB
              </p>
            </div>
          </div>

          <div className="resultMenuLabel">
            MAIN MENU
          </div>

          <button
            className="resultMenu"
            onClick={() =>
              router.push("/")
            }
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className="resultMenu"
            onClick={() =>
              router.push(
                "/new-patient"
              )
            }
          >
            <span>+</span>
            New Patient
          </button>

          <button
            className="resultMenu"
            onClick={() =>
              router.push(
                "/patients"
              )
            }
          >
            <span>♙</span>
            Patients
          </button>

          <button
            className="resultMenu"
            onClick={() =>
              router.push(
                "/tests"
              )
            }
          >
            <span>🧪</span>
            Test Selection
          </button>

          <button
            className="resultMenu"
            onClick={() =>
              router.push(
                "/billing"
              )
            }
          >
            <span>₹</span>
            Billing
          </button>

          <button className="resultMenu resultMenuActive">
            <span>✎</span>
            Result Entry
          </button>

          <button
            className="resultMenu"
            onClick={() =>
              router.push(
                "/reports"
              )
            }
          >
            <span>▤</span>
            Reports
          </button>

          <div className="resultMenuLabel managementLabel">
            MANAGEMENT
          </div>

          <button
            className="resultMenu"
            onClick={() =>
              router.push(
                "/test-master"
              )
            }
          >
            <span>⚙</span>
            Test Master
          </button>

          <button
            className="resultMenu"
            onClick={() =>
              router.push(
                "/doctors"
              )
            }
          >
            <span>♟</span>
            Doctors
          </button>

          <button
            className="resultMenu"
            onClick={() =>
              router.push(
                "/settings"
              )
            }
          >
            <span>⚙</span>
            Settings
          </button>

        </aside>

        {/* MAIN */}

        <main className="resultMain">

          {/* TOPBAR */}

          <header className="resultTopbar">

            <div>
              <h3>
                Result Entry
              </h3>

              <p>
                Enter laboratory
                investigation results
              </p>
            </div>

            <div className="resultSystemStatus">
              <span />
              NIDAN Lab System
            </div>

          </header>

          <div className="resultContent">

            {/* HEADING */}

            <div className="resultPageHeading">

              <div>
                <div className="resultSmallTitle">
                  STEP 4 OF 5
                </div>

                <h1>
                  Laboratory Results
                </h1>

                <p>
                  Selected tests ke
                  results enter karein.
                </p>
              </div>

              <button
                className="resultBackButton"
                onClick={() =>
                  router.push(
                    "/billing"
                  )
                }
              >
                ← Back to Billing
              </button>

            </div>

            {/* STEPS */}

            <div className="resultSteps">

              <div className="resultStep">
                <span>✓</span>
                <div>
                  Patient
                  <small>
                    Registered
                  </small>
                </div>
              </div>

              <div className="resultStep">
                <span>✓</span>
                <div>
                  Tests
                  <small>
                    Selected
                  </small>
                </div>
              </div>

              <div className="resultStep">
                <span>✓</span>
                <div>
                  Billing
                  <small>
                    Completed
                  </small>
                </div>
              </div>

              <div className="resultStep resultStepActive">
                <span>4</span>
                <div>
                  Results
                  <small>
                    Enter Results
                  </small>
                </div>
              </div>

              <div className="resultStep">
                <span>5</span>
                <div>
                  Report
                  <small>
                    Print / PDF
                  </small>
                </div>
              </div>

            </div>

            {/* PATIENT */}

            <div className="resultPatientCard">

              <div>
                <small>
                  PATIENT ID
                </small>

                <strong>
                  {patient?.patientId ||
                    patient?.patient_id ||
                    patient?.id ||
                    "-"}
                </strong>
              </div>

              <div>
                <small>
                  PATIENT NAME
                </small>

                <strong>
                  {patient?.name ||
                    "-"}
                </strong>
              </div>

              <div>
                <small>
                  AGE / SEX
                </small>

                <strong>
                  {patient?.age ||
                    "-"}{" "}
                  /{" "}
                  {patient?.gender ||
                    patient?.sex ||
                    "-"}
                </strong>
              </div>

              <div>
                <small>
                  REF. DOCTOR
                </small>

                <strong>
                  {patient?.doctor ||
                    patient?.refDoctor ||
                    patient?.referring_doctor ||
                    "-"}
                </strong>
              </div>

            </div>

            {/* PROGRESS */}

            <div className="resultProgressCard">

              <div className="resultProgressTop">

                <div>
                  <strong>
                    Result Progress
                  </strong>

                  <small>
                    {completedResults}{" "}
                    of{" "}
                    {totalParameters}{" "}
                    parameters entered
                  </small>
                </div>

                <strong className="resultProgressNumber">
                  {progress}%
                </strong>

              </div>

              <div className="resultProgressTrack">
                <div
                  className="resultProgressFill"
                  style={{
                    width:
                      `${progress}%`,
                  }}
                />
              </div>

            </div>

            {/* SAVE MESSAGE */}

            {savedMessage && (
              <div className="resultSavedMessage">
                {savedMessage}
              </div>
            )}

            {/* MOBILE TESTS */}

            <div className="mobileSelectedTests">

              <div className="mobileSelectedTitle">
                Selected Tests
              </div>

              <div className="mobileTestScroller">

                {selectedTests.map(
                  (
                    test,
                    index
                  ) => {

                    const parameters =
                      test.tests ||
                      test.parameters ||
                      [];

                    const active =
                      String(
                        activeTest
                      ) ===
                      String(
                        test.id
                      );

                    return (
                      <button
                        key={
                          test.id
                        }
                        className={
                          active
                            ? "mobileTestButton mobileTestActive"
                            : "mobileTestButton"
                        }
                        onClick={() =>
                          setActiveTest(
                            test.id
                          )
                        }
                      >
                        <span>
                          {index + 1}
                        </span>

                        <strong>
                          {test.short ||
                            test.name}
                        </strong>

                        <small>
                          {
                            parameters.length
                          }{" "}
                          parameters
                        </small>
                      </button>
                    );
                  }
                )}

              </div>

            </div>

            {/* WORKSPACE */}

            <div className="resultWorkspace">

              {/* TEST NAV */}

              <aside className="desktopTestNav">

                <div className="desktopTestNavTitle">
                  Selected Tests
                </div>

                {selectedTests.length ===
                0 ? (
                  <div className="noSelectedTests">
                    No tests selected.
                  </div>
                ) : (
                  selectedTests.map(
                    (
                      test,
                      index
                    ) => {

                      const parameters =
                        test.tests ||
                        test.parameters ||
                        [];

                      const active =
                        String(
                          activeTest
                        ) ===
                        String(
                          test.id
                        );

                      return (
                        <button
                          key={
                            test.id
                          }
                          className={
                            active
                              ? "desktopTestButton desktopTestButtonActive"
                              : "desktopTestButton"
                          }
                          onClick={() =>
                            setActiveTest(
                              test.id
                            )
                          }
                        >
                          <span className="desktopTestNumber">
                            {index + 1}
                          </span>

                          <div>
                            <strong>
                              {test.short ||
                                test.name}
                            </strong>

                            <small>
                              {
                                parameters.length
                              }{" "}
                              parameters
                            </small>
                          </div>
                        </button>
                      );
                    }
                  )
                )}

              </aside>

              {/* RESULT CARD */}

              <section className="resultEntryCard">

                {!currentTest ? (

                  <div className="emptyResultPage">

                    <div className="emptyIcon">
                      🧪
                    </div>

                    <h2>
                      No Test Selected
                    </h2>

                    <p>
                      Test Selection
                      page se
                      investigation
                      select karein.
                    </p>

                    <button
                      className="resultContinueButton"
                      onClick={() =>
                        router.push(
                          "/tests"
                        )
                      }
                    >
                      Select Tests
                    </button>

                  </div>

                ) : (

                  <>

                    {/* TEST HEADER */}

                    <div className="resultCardHeader">

                      <div>

                        <div className="resultSmallTitle">
                          INVESTIGATION
                        </div>

                        <h2>
                          {currentTest.name ||
                            currentTest.short}
                        </h2>

                        <p>
                          Enter patient
                          laboratory
                          results.
                        </p>

                      </div>

                      <div className="parameterBadge">
                        {
                          currentParameters.length
                        }{" "}
                        Parameters
                      </div>

                    </div>

                    {/* DESKTOP TABLE */}

                    <div className="desktopResultTable">

                      <table className="resultTable">

                        <thead>

                          <tr>
                            <th>
                              INVESTIGATION
                            </th>

                            <th>
                              RESULT
                            </th>

                            <th>
                              UNIT
                            </th>

                            <th>
                              REFERENCE RANGE
                            </th>

                            <th>
                              FLAG
                            </th>
                          </tr>

                        </thead>

                        <tbody>

                          {currentParameters.map(
                            (
                              parameter,
                              index
                            ) => {

                              const key =
                                getParameterKey(
                                  currentTest.id,
                                  parameter,
                                  index
                                );

                              const value =
                                results[
                                  key
                                ] ?? "";

                              const resolved =
                                resolveParameter(
                                  parameter
                                );

                              const flag =
                                getFlag(
                                  value,
                                  parameter
                                );

                              const options =
                                getOptions(
                                  parameter
                                );

                              const parameterName =
                                parameter?.name ||
                                parameter?.testName ||
                                parameter?.investigation ||
                                "Investigation";

                              return (
                                <tr
                                  key={
                                    key
                                  }
                                >

                                  <td className="investigationCell">
                                    <strong>
                                      {
                                        parameterName
                                      }
                                    </strong>
                                  </td>

                                  <td className="resultCell">

                                    {options.length >
                                    0 ? (

                                      <select
                                        className="resultInput"
                                        value={
                                          value
                                        }
                                        onChange={(
                                          e
                                        ) =>
                                          updateResult(
                                            currentTest.id,
                                            parameter,
                                            index,
                                            e.target.value
                                          )
                                        }
                                      >

                                        <option value="">
                                          Select
                                        </option>

                                        {options.map(
                                          (
                                            option
                                          ) => (
                                            <option
                                              key={
                                                option
                                              }
                                              value={
                                                option
                                              }
                                            >
                                              {
                                                option
                                              }
                                            </option>
                                          )
                                        )}

                                      </select>

                                    ) : (

                                      <input
                                        className="resultInput"
                                        type="text"
                                        inputMode={
                                          resolved.min !==
                                            undefined ||
                                          resolved.max !==
                                            undefined
                                            ? "decimal"
                                            : "text"
                                        }
                                        placeholder="Enter result"
                                        value={
                                          value
                                        }
                                        onChange={(
                                          e
                                        ) =>
                                          updateResult(
                                            currentTest.id,
                                            parameter,
                                            index,
                                            e.target.value
                                          )
                                        }
                                      />

                                    )}

                                  </td>

                                  <td className="unitCell">
                                    {
                                      resolved.unit ||
                                      "-"
                                    }
                                  </td>

                                  <td className="referenceCell">
                                    {
                                      resolved.range ||
                                      "-"
                                    }
                                  </td>

                                  <td className="flagCell">

                                    {flag && (
                                      <span
                                        className={`resultFlag ${
                                          flag ===
                                          "HIGH"
                                            ? "flagHigh"
                                            : flag ===
                                              "LOW"
                                            ? "flagLow"
                                            : "flagNormal"
                                        }`}
                                      >
                                        {
                                          flag
                                        }
                                      </span>
                                    )}

                                  </td>

                                </tr>
                              );
                            }
                          )}

                        </tbody>

                      </table>

                    </div>

                    {/* MOBILE */}

                    <div className="mobileParameterList">

                      {currentParameters.map(
                        (
                          parameter,
                          index
                        ) => {

                          const key =
                            getParameterKey(
                              currentTest.id,
                              parameter,
                              index
                            );

                          const value =
                            results[
                              key
                            ] ?? "";

                          const resolved =
                            resolveParameter(
                              parameter
                            );

                          const flag =
                            getFlag(
                              value,
                              parameter
                            );

                          const options =
                            getOptions(
                              parameter
                            );

                          const parameterName =
                            parameter?.name ||
                            parameter?.testName ||
                            parameter?.investigation ||
                            "Investigation";

                          return (
                            <div
                              className="mobileParameterCard"
                              key={
                                key
                              }
                            >

                              <div className="mobileParameterName">

                                <span>
                                  {index + 1}
                                </span>

                                <strong>
                                  {
                                    parameterName
                                  }
                                </strong>

                              </div>

                              <div className="mobileField">

                                <label>
                                  Result
                                </label>

                                {options.length >
                                0 ? (

                                  <select
                                    className="mobileResultInput"
                                    value={
                                      value
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      updateResult(
                                        currentTest.id,
                                        parameter,
                                        index,
                                        e.target.value
                                      )
                                    }
                                  >

                                    <option value="">
                                      Select result
                                    </option>

                                    {options.map(
                                      (
                                        option
                                      ) => (
                                        <option
                                          key={
                                            option
                                          }
                                          value={
                                            option
                                          }
                                        >
                                          {
                                            option
                                          }
                                        </option>
                                      )
                                    )}

                                  </select>

                                ) : (

                                  <input
                                    className="mobileResultInput"
                                    type="text"
                                    inputMode={
                                      resolved.min !==
                                        undefined ||
                                      resolved.max !==
                                        undefined
                                        ? "decimal"
                                        : "text"
                                    }
                                    placeholder="Enter result"
                                    value={
                                      value
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      updateResult(
                                        currentTest.id,
                                        parameter,
                                        index,
                                        e.target.value
                                      )
                                    }
                                  />

                                )}

                              </div>

                              <div className="mobileInfoGrid">

                                <div>
                                  <small>
                                    Unit
                                  </small>

                                  <strong>
                                    {
                                      resolved.unit ||
                                      "-"
                                    }
                                  </strong>
                                </div>

                                <div>
                                  <small>
                                    Reference
                                  </small>

                                  <strong>
                                    {
                                      resolved.range ||
                                      "-"
                                    }
                                  </strong>
                                </div>

                                <div>
                                  <small>
                                    Flag
                                  </small>

                                  <strong>

                                    {flag ? (
                                      <span
                                        className={`resultFlag ${
                                          flag ===
                                          "HIGH"
                                            ? "flagHigh"
                                            : flag ===
                                              "LOW"
                                            ? "flagLow"
                                            : "flagNormal"
                                        }`}
                                      >
                                        {
                                          flag
                                        }
                                      </span>
                                    ) : (
                                      "-"
                                    )}

                                  </strong>
                                </div>

                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>

                    {/* FOOTER */}

                    <div className="resultFooter">

                      <button
                        className="secondaryResultButton"
                        onClick={
                          previousTest
                        }
                        disabled={
                          currentIndex <=
                          0
                        }
                      >
                        ← Previous Test
                      </button>

                      <div className="resultFooterRight">

                        <button
                          className="saveResultButton"
                          onClick={() =>
                            saveResults(
                              true
                            )
                          }
                          disabled={
                            saving
                          }
                        >
                          {saving
                            ? "Saving..."
                            : "Save Results"}
                        </button>

                        <button
                          className="nextResultButton"
                          onClick={
                            nextTest
                          }
                          disabled={
                            saving
                          }
                        >
                          {currentIndex ===
                          selectedTests.length -
                            1
                            ? "Final Report →"
                            : "Next Test →"}
                        </button>

                      </div>

                    </div>

                  </>
                )}

              </section>

            </div>

            {/* BOTTOM */}

            <div className="resultBottomActions">

              <div>
                <strong>
                  Results ready?
                </strong>

                <p>
                  Save results and create
                  final laboratory report.
                </p>
              </div>

              <button
                className="generateReportButton"
                onClick={
                  continueReport
                }
                disabled={
                  saving
                }
              >
                Generate Final Report →
              </button>

            </div>

          </div>

        </main>

      </div>

      {/* =========================================================
          CSS
          ========================================================= */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          min-width: 0;
          overflow-x: hidden;
        }

        body {
          background: #f1f5f9;
          color: #172033;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        button,
        input,
        select {
          font-family: inherit;
        }

        button {
          cursor: pointer;
        }

        button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        /* APP */

        .resultPageApp {
          width: 100%;
          min-height: 100vh;

          display: grid;

          grid-template-columns:
            230px
            minmax(0, 1fr);

          background: #f1f5f9;

          overflow-x: hidden;
        }

        /* SIDEBAR */

        .resultSidebar {
          width: 230px;
          min-width: 230px;
          min-height: 100vh;

          position: sticky;
          top: 0;

          align-self: start;

          padding: 18px 12px;

          background: #092437;
          color: white;

          overflow-y: auto;

          z-index: 20;
        }

        .resultBrand {
          display: flex;
          align-items: center;

          gap: 10px;

          padding:
            2px 6px 22px;
        }

        .resultBrandLogo {
          width: 40px;
          height: 40px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 10px;

          background: #10a6a3;

          color: white;

          font-size: 17px;
          font-weight: 900;
        }

        .resultBrand h2 {
          margin: 0;

          color: white;

          font-size: 15px;
        }

        .resultBrand p {
          margin:
            4px 0 0;

          color: #94a8b6;

          font-size: 7px;

          letter-spacing: .6px;
        }

        .resultMenuLabel {
          margin:
            4px 8px 10px;

          color: #78909f;

          font-size: 8px;

          font-weight: 800;

          letter-spacing: 1.5px;
        }

        .managementLabel {
          margin-top: 22px;
        }

        .resultMenu {
          width: 100%;
          min-height: 42px;

          display: flex;
          align-items: center;

          gap: 10px;

          margin-bottom: 4px;

          padding:
            10px 11px;

          border: 0;

          border-radius: 7px;

          background: transparent;

          color: #cbd5df;

          font-size: 12px;

          font-weight: 600;

          text-align: left;
        }

        .resultMenu span {
          width: 20px;

          display: inline-flex;

          justify-content: center;

          font-size: 14px;
        }

        .resultMenu:hover {
          background:
            rgba(255,255,255,.06);

          color: white;
        }

        .resultMenuActive {
          background:
            #12465e !important;

          color: white !important;

          box-shadow:
            inset 3px 0 0 #10a6a3;
        }

        /* MAIN */

        .resultMain {
          width: auto;

          min-width: 0;

          max-width: none;

          margin: 0;

          padding: 0;

          overflow-x: hidden;
        }

        /* TOPBAR */

        .resultTopbar {
          width: 100%;
          min-height: 72px;

          padding:
            13px 24px;

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 20px;

          background: white;

          border-bottom:
            1px solid #e2e8f0;
        }

        .resultTopbar h3 {
          margin: 0;

          font-size: 15px;
        }

        .resultTopbar p {
          margin:
            3px 0 0;

          color: #64748b;

          font-size: 9px;
        }

        .resultSystemStatus {
          display: flex;

          align-items: center;

          gap: 7px;

          color: #64748b;

          font-size: 10px;

          font-weight: 600;
        }

        .resultSystemStatus span {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #16a36a;
        }

        /* CONTENT */

        .resultContent {
          width: 100%;

          min-width: 0;

          padding:
            22px 26px 40px;
        }

        /* HEADING */

        .resultPageHeading {
          width: 100%;

          display: flex;

          align-items: flex-start;

          justify-content: space-between;

          gap: 20px;

          margin-bottom: 16px;
        }

        .resultSmallTitle {
          color: #0d8e8b;

          font-size: 9px;

          font-weight: 900;

          letter-spacing: 1.4px;
        }

        .resultPageHeading h1 {
          margin:
            4px 0 3px;

          font-size: 23px;
        }

        .resultPageHeading p {
          margin: 0;

          color: #64748b;

          font-size: 11px;
        }

        .resultBackButton {
          min-height: 38px;

          padding:
            8px 14px;

          border:
            1px solid #dbe3ea;

          border-radius: 7px;

          background: white;

          color: #334155;

          font-size: 11px;

          font-weight: 700;
        }

        /* STEPS */

        .resultSteps {
          width: 100%;

          display: grid;

          grid-template-columns:
            repeat(5,minmax(0,1fr));

          margin-bottom: 14px;

          padding:
            10px 12px;

          background: white;

          border:
            1px solid #e2e8f0;

          border-radius: 9px;
        }

        .resultStep {
          display: flex;

          align-items: center;

          gap: 7px;

          color: #94a3b8;

          font-size: 9px;

          font-weight: 700;
        }

        .resultStep span {
          width: 25px;
          height: 25px;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 50%;

          background: #f1f5f9;

          color: #94a3b8;

          font-size: 10px;

          font-weight: 900;
        }

        .resultStep small {
          display: block;

          margin-top: 2px;

          color: #a0acb8;

          font-size: 7px;
        }

        .resultStepActive {
          color: #0d8e8b;
        }

        .resultStepActive span {
          background: #0d9e9a;

          color: white;
        }

        .resultStepActive small {
          color: #0d9e9a;
        }

        /* PATIENT */

        .resultPatientCard {
          width: 100%;

          display: grid;

          grid-template-columns:
            1.2fr
            1.7fr
            1fr
            1.5fr;

          margin-bottom: 12px;

          background: white;

          border:
            1px solid #e2e8f0;

          border-radius: 9px;

          overflow: hidden;
        }

        .resultPatientCard > div {
          padding:
            11px 13px;

          border-right:
            1px solid #e2e8f0;
        }

        .resultPatientCard > div:last-child {
          border-right: 0;
        }

        .resultPatientCard small {
          display: block;

          margin-bottom: 4px;

          color: #7b8795;

          font-size: 7px;

          font-weight: 800;
        }

        .resultPatientCard strong {
          display: block;

          color: #172033;

          font-size: 10px;

          word-break: break-word;
        }

        /* PROGRESS */

        .resultProgressCard {
          width: 100%;

          margin-bottom: 14px;

          padding:
            12px 14px;

          background: white;

          border:
            1px solid #e2e8f0;

          border-radius: 9px;
        }

        .resultProgressTop {
          display: flex;

          align-items: center;

          justify-content: space-between;
        }

        .resultProgressTop strong {
          display: block;

          font-size: 11px;
        }

        .resultProgressTop small {
          display: block;

          margin-top: 3px;

          color: #64748b;

          font-size: 8px;
        }

        .resultProgressNumber {
          color: #0d8e8b !important;

          font-size: 16px !important;
        }

        .resultProgressTrack {
          width: 100%;
          height: 6px;

          margin-top: 9px;

          border-radius: 20px;

          background: #e9eef2;

          overflow: hidden;
        }

        .resultProgressFill {
          height: 100%;

          border-radius: 20px;

          background: #0d9e9a;

          transition:
            width .25s ease;
        }

        /* MESSAGE */

        .resultSavedMessage {
          margin-bottom: 14px;

          padding:
            10px 14px;

          border:
            1px solid #a7f3d0;

          border-radius: 8px;

          background: #ecfdf5;

          color: #047857;

          font-size: 11px;

          font-weight: 700;
        }

        /* WORKSPACE */

        .resultWorkspace {
          width: 100%;

          min-width: 0;

          display: grid;

          grid-template-columns:
            200px
            minmax(0,1fr);

          gap: 14px;

          align-items: start;
        }

        /* TEST NAV */

        .desktopTestNav {
          width: 200px;

          padding: 9px;

          background: white;

          border:
            1px solid #e2e8f0;

          border-radius: 9px;
        }

        .desktopTestNavTitle {
          padding:
            6px 7px 10px;

          font-size: 10px;

          font-weight: 900;
        }

        .desktopTestButton {
          width: 100%;

          min-height: 55px;

          display: flex;

          align-items: center;

          gap: 8px;

          margin-bottom: 5px;

          padding: 8px;

          border:
            1px solid transparent;

          border-radius: 7px;

          background: white;

          color: #334155;

          text-align: left;
        }

        .desktopTestButton:hover {
          background: #f8fafc;

          border-color:
            #dce7ea;
        }

        .desktopTestButtonActive {
          background:
            #eaf9f8 !important;

          border-color:
            #0d9e9a !important;

          box-shadow:
            inset 3px 0 0 #0d9e9a;
        }

        .desktopTestNumber {
          width: 24px;
          height: 24px;

          flex: 0 0 auto;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 50%;

          background: #edf5f5;

          color: #087f7d;

          font-size: 10px;

          font-weight: 900;
        }

        .desktopTestButton strong {
          display: block;

          font-size: 10px;

          word-break: break-word;
        }

        .desktopTestButton small {
          display: block;

          margin-top: 3px;

          color: #7b8795;

          font-size: 7px;
        }

        .noSelectedTests {
          padding: 15px 8px;

          color: #94a3b8;

          font-size: 9px;

          text-align: center;
        }

        /* RESULT CARD */

        .resultEntryCard {
          width: 100%;

          min-width: 0;

          background: white;

          border:
            1px solid #e2e8f0;

          border-radius: 9px;

          overflow: hidden;
        }

        .resultCardHeader {
          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 18px;

          padding:
            16px 18px;

          border-bottom:
            1px solid #e2e8f0;
        }

        .resultCardHeader h2 {
          margin:
            3px 0;

          font-size: 19px;

          word-break: break-word;
        }

        .resultCardHeader p {
          margin: 0;

          color: #94a0ad;

          font-size: 9px;
        }

        .parameterBadge {
          flex: 0 0 auto;

          padding:
            8px 10px;

          border-radius: 20px;

          background: #e7f8f7;

          color: #087f7d;

          font-size: 8px;

          font-weight: 800;
        }

        /* TABLE */

        .desktopResultTable {
          width: 100%;

          overflow-x: auto;
        }

        .resultTable {
          width: 100%;

          min-width: 650px;

          table-layout: fixed;

          border-collapse: collapse;
        }

        .resultTable th {
          height: 34px;

          padding:
            8px 10px;

          border:
            1px solid #e1e7ec;

          background: #f3f6f8;

          color: #526170;

          font-size: 8px;

          font-weight: 900;

          text-align: left;
        }

        .resultTable td {
          padding:
            8px 10px;

          border:
            1px solid #e5e9ed;

          font-size: 9px;

          vertical-align: middle;

          word-break: break-word;
        }

        .resultTable th:nth-child(1) {
          width: 32%;
        }

        .resultTable th:nth-child(2) {
          width: 23%;
        }

        .resultTable th:nth-child(3) {
          width: 12%;
        }

        .resultTable th:nth-child(4) {
          width: 23%;
        }

        .resultTable th:nth-child(5) {
          width: 10%;
        }

        /* INPUT */

        .resultInput {
          display: block;

          width: 100%;

          height: 38px;

          padding:
            7px 10px;

          border:
            1px solid #d3dce3;

          border-radius: 7px;

          background: white;

          color: #172033;

          font-size: 12px;

          outline: none;
        }

        .resultInput:focus {
          border-color:
            #0d9e9a;

          box-shadow:
            0 0 0 3px
            rgba(13,158,154,.10);
        }

        .unitCell,
        .referenceCell {
          color: #475569;
        }

        .flagCell {
          text-align: center;
        }

        /* FLAGS */

        .resultFlag {
          display: inline-flex;

          align-items: center;

          justify-content: center;

          min-width: 44px;

          min-height: 20px;

          padding:
            2px 6px;

          border-radius: 5px;

          font-size: 7px;

          font-weight: 900;
        }

        .flagHigh {
          background: #fee2e2;

          color: #b91c1c;
        }

        .flagLow {
          background: #dbeafe;

          color: #1d4ed8;
        }

        .flagNormal {
          background: #dcfce7;

          color: #15803d;
        }

        /* MOBILE TESTS */

        .mobileSelectedTests {
          display: none;
        }

        /* MOBILE PARAMETERS */

        .mobileParameterList {
          display: none;
        }

        /* FOOTER */

        .resultFooter {
          width: 100%;

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 12px;

          padding:
            12px 14px;

          border-top:
            1px solid #e2e8f0;
        }

        .secondaryResultButton,
        .saveResultButton,
        .nextResultButton {
          min-height: 38px;

          padding:
            8px 13px;

          border-radius: 7px;

          font-size: 10px;

          font-weight: 800;
        }

        .secondaryResultButton {
          border:
            1px solid #dbe3ea;

          background: white;

          color: #64748b;
        }

        .saveResultButton {
          border:
            1px solid #0d9e9a;

          background: white;

          color: #087f7d;
        }

        .nextResultButton {
          border:
            1px solid #172033;

          background: #172033;

          color: white;
        }

        .resultFooterRight {
          display: flex;

          gap: 8px;
        }

        /* EMPTY */

        .emptyResultPage {
          padding: 50px 20px;

          text-align: center;
        }

        .emptyIcon {
          font-size: 35px;
        }

        .emptyResultPage h2 {
          margin:
            10px 0 5px;

          font-size: 18px;
        }

        .emptyResultPage p {
          margin:
            0 0 15px;

          color: #64748b;

          font-size: 10px;
        }

        .resultContinueButton {
          min-height: 40px;

          padding:
            8px 15px;

          border: 0;

          border-radius: 7px;

          background: #0d9e9a;

          color: white;

          font-size: 10px;

          font-weight: 800;
        }

        /* BOTTOM */

        .resultBottomActions {
          width: 100%;

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 20px;

          margin-top: 16px;

          padding:
            15px 17px;

          background: white;

          border:
            1px solid #e2e8f0;

          border-radius: 9px;
        }

        .resultBottomActions strong {
          font-size: 11px;
        }

        .resultBottomActions p {
          margin:
            3px 0 0;

          color: #64748b;

          font-size: 8px;
        }

        .generateReportButton {
          min-height: 40px;

          padding:
            8px 15px;

          border: 0;

          border-radius: 7px;

          background: #087f7d;

          color: white;

          font-size: 10px;

          font-weight: 800;
        }

        /* =====================================================
           MOBILE
           ===================================================== */

        @media (max-width: 900px) {

          .resultPageApp {
            display: block;

            width: 100%;

            min-width: 0;
          }

          .resultSidebar {
            display: none;
          }

          .resultMain {
            width: 100%;

            min-width: 0;
          }

          .resultTopbar {
            min-height: 60px;

            padding:
              11px 13px;
          }

          .resultTopbar h3 {
            font-size: 14px;
          }

          .resultTopbar p {
            font-size: 8px;
          }

          .resultSystemStatus {
            font-size: 8px;
          }

          .resultContent {
            padding:
              13px 12px 25px;
          }

          .resultPageHeading {
            flex-direction: column;

            gap: 9px;
          }

          .resultPageHeading h1 {
            font-size: 22px;
          }

          .resultBackButton {
            width: 100%;
          }

          .resultSteps {
            display: flex;

            overflow-x: auto;

            gap: 7px;

            scrollbar-width: none;
          }

          .resultSteps::-webkit-scrollbar {
            display: none;
          }

          .resultStep {
            flex: 0 0 105px;
          }

          .resultPatientCard {
            grid-template-columns:
              1fr 1fr;
          }

          .resultPatientCard > div {
            padding:
              9px 10px;

            border-bottom:
              1px solid #e2e8f0;
          }

          .resultWorkspace {
            display: block;
          }

          .desktopTestNav {
            display: none;
          }

          .mobileSelectedTests {
            display: block;

            margin-bottom: 12px;

            padding: 12px;

            background: white;

            border:
              1px solid #e2e8f0;

            border-radius: 12px;
          }

          .mobileSelectedTitle {
            margin-bottom: 9px;

            font-size: 13px;

            font-weight: 900;
          }

          .mobileTestScroller {
            display: flex;

            gap: 9px;

            overflow-x: auto;

            scrollbar-width: none;
          }

          .mobileTestScroller::-webkit-scrollbar {
            display: none;
          }

          .mobileTestButton {
            flex:
              0 0 auto;

            min-width: 125px;

            padding:
              9px 10px;

            display: flex;

            flex-direction: column;

            gap: 3px;

            border:
              1px solid #dce4e8;

            border-radius: 10px;

            background: white;

            text-align: left;
          }

          .mobileTestButton span {
            width: 25px;
            height: 25px;

            display: flex;

            align-items: center;

            justify-content: center;

            border-radius: 50%;

            background: #edf7f6;

            color: #087f7d;

            font-size: 11px;

            font-weight: 900;
          }

          .mobileTestButton strong {
            font-size: 13px;
          }

          .mobileTestButton small {
            color: #718096;

            font-size: 10px;
          }

          .mobileTestActive {
            border-color:
              #0d9e9a !important;

            background:
              #effcfb !important;
          }

          .resultEntryCard {
            width: 100%;
          }

          .resultCardHeader {
            align-items:
              flex-start;

            padding:
              14px;
          }

          .resultCardHeader h2 {
            font-size: 20px;
          }

          .desktopResultTable {
            display: none;
          }

          .mobileParameterList {
            display: block;

            padding:
              10px 9px;
          }

          .mobileParameterCard {
            margin-bottom: 11px;

            padding:
              13px 11px;

            border:
              1px solid #e1e7eb;

            border-radius: 12px;

            background: white;

            box-shadow:
              0 2px 8px
              rgba(15,23,42,.04);
          }

          .mobileParameterName {
            display: flex;

            align-items: center;

            gap: 8px;

            margin-bottom: 12px;
          }

          .mobileParameterName span {
            width: 28px;
            height: 28px;

            display: flex;

            align-items: center;

            justify-content: center;

            border-radius: 50%;

            background: #e9f8f7;

            color: #087f7d;

            font-size: 11px;

            font-weight: 900;
          }

          .mobileParameterName strong {
            font-size: 14px;
          }

          .mobileField {
            margin-bottom: 11px;
          }

          .mobileField label {
            display: block;

            margin-bottom: 6px;

            color: #64748b;

            font-size: 11px;

            font-weight: 800;
          }

          .mobileResultInput {
            width: 100%;

            height: 46px;

            padding:
              9px 11px;

            border:
              1px solid #cfd8df;

            border-radius: 9px;

            background: white;

            color: #172033;

            font-size: 15px;

            outline: none;
          }

          .mobileInfoGrid {
            display: grid;

            grid-template-columns:
              1fr 1.4fr;

            gap: 7px;
          }

          .mobileInfoGrid > div {
            padding: 9px;

            border-radius: 8px;

            background: #f8fafc;
          }

          .mobileInfoGrid > div:last-child {
            grid-column:
              1 / -1;
          }

          .mobileInfoGrid small {
            display: block;

            margin-bottom: 4px;

            color: #64748b;

            font-size: 9px;

            font-weight: 800;
          }

          .mobileInfoGrid strong {
            font-size: 11px;

            word-break: break-word;
          }

          .resultFooter {
            flex-direction: column;

            align-items: stretch;
          }

          .secondaryResultButton {
            width: 100%;
          }

          .resultFooterRight {
            width: 100%;

            display: grid;

            grid-template-columns:
              1fr 1fr;
          }

          .saveResultButton,
          .nextResultButton {
            width: 100%;
          }

          .resultBottomActions {
            flex-direction: column;

            align-items: stretch;
          }

          .generateReportButton {
            width: 100%;
          }
        }

        @media (max-width: 600px) {

          .resultContent {
            padding:
              10px 9px 22px;
          }

          .resultSystemStatus {
            display: none;
          }

          .resultPageHeading h1 {
            font-size: 23px;
          }

          .resultPatientCard strong {
            font-size: 11px;
          }

          .resultPatientCard small {
            font-size: 8px;
          }

          .resultFooterRight {
            grid-template-columns: 1fr;
          }

          .resultCardHeader h2 {
            font-size: 19px;
          }
        }

        @media (max-width: 380px) {

          .resultContent {
            padding-left: 7px;
            padding-right: 7px;
          }

          .resultPatientCard {
            grid-template-columns: 1fr;
          }

          .resultPatientCard > div {
            border-right: 0;
          }

          .mobileTestButton {
            min-width: 115px;
          }
        }

      `}</style>
    </>
  );
}
