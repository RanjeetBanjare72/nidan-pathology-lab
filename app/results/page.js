"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ResultsPage() {
  const router = useRouter();

  const [patient, setPatient] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
  const [results, setResults] = useState({});
  const [activeTest, setActiveTest] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const p = JSON.parse(
        localStorage.getItem("nidanPatient") || "{}"
      );

      const t = JSON.parse(
        localStorage.getItem("nidanSelectedTests") || "[]"
      );

      const r = JSON.parse(
        localStorage.getItem("nidanResults") || "{}"
      );

      setPatient(p && typeof p === "object" ? p : {});
      setSelectedTests(Array.isArray(t) ? t : []);
      setResults(r && typeof r === "object" ? r : {});

      if (Array.isArray(t) && t.length) {
        setActiveTest(String(t[0].id));
      }
    } catch (error) {
      console.error("NIDAN Result Load Error:", error);
    }
  }, []);

  const currentTest = useMemo(() => {
    return selectedTests.find(
      (t) => String(t.id) === String(activeTest)
    );
  }, [selectedTests, activeTest]);

  const currentParameters = currentTest
    ? currentTest.tests || currentTest.parameters || []
    : [];

  /* =========================================================
     NORMALIZE
  ========================================================= */

  function normalize(name = "") {
    return String(name)
      .toLowerCase()
      .replace(/[()]/g, "")
      .replace(/[./_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* =========================================================
     GENDER
  ========================================================= */

  function gender() {
    const g = String(
      patient?.gender || patient?.sex || ""
    )
      .toLowerCase()
      .trim();

    if (
      ["male", "m", "पुरुष"].includes(g)
    ) {
      return "male";
    }

    if (
      ["female", "f", "महिला"].includes(g)
    ) {
      return "female";
    }

    return "";
  }

  /* =========================================================
     REFERENCE RANGES
  ========================================================= */

  function reference(name) {
    const n = normalize(name);
    const g = gender();

    const refs = {
      neutrophils: [40, 75, "%", "40 - 75"],
      lymphocytes: [20, 40, "%", "20 - 40"],
      eosinophils: [1, 6, "%", "1 - 6"],
      monocytes: [1, 10, "%", "1 - 10"],
      basophils: [0, 1, "%", "0 - 1"],

      mcv: [80, 100, "fL", "80 - 100"],
      mch: [27, 32, "pg", "27 - 32"],
      mchc: [32, 36, "g/dL", "32 - 36"],
      "rdw cv": [11.5, 14.5, "%", "11.5 - 14.5"],
      mpv: [7.5, 11.5, "fL", "7.5 - 11.5"],
      pdw: [9, 17, "%", "9 - 17"],
      pct: [0.15, 0.4, "%", "0.15 - 0.40"],

      esr: [
        0,
        g === "female" ? 20 : 15,
        "mm/hr",
        g === "female" ? "0 - 20" : "0 - 15",
      ],

      fbs: [70, 99, "mg/dL", "70 - 99"],
      ppbs: [70, 140, "mg/dL", "70 - 140"],
      rbs: [70, 140, "mg/dL", "70 - 140"],

      urea: [15, 40, "mg/dL", "15 - 40"],
      creatinine: [0.6, 1.3, "mg/dL", "0.6 - 1.3"],

      sodium: [135, 145, "mEq/L", "135 - 145"],
      potassium: [3.5, 5.1, "mEq/L", "3.5 - 5.1"],
      chloride: [98, 107, "mEq/L", "98 - 107"],
      bun: [7, 20, "mg/dL", "7 - 20"],

      "total bilirubin": [
        0.2,
        1.2,
        "mg/dL",
        "0.2 - 1.2",
      ],

      "direct bilirubin": [
        0,
        0.3,
        "mg/dL",
        "0 - 0.3",
      ],

      ast: [0, 40, "U/L", "Up to 40"],
      alt: [0, 40, "U/L", "Up to 40"],
      alp: [44, 147, "U/L", "44 - 147"],

      "total protein": [
        6,
        8.3,
        "g/dL",
        "6.0 - 8.3",
      ],

      albumin: [
        3.5,
        5,
        "g/dL",
        "3.5 - 5.0",
      ],

      globulin: [
        2,
        3.5,
        "g/dL",
        "2.0 - 3.5",
      ],

      triglycerides: [
        0,
        150,
        "mg/dL",
        "< 150",
      ],

      ldl: [
        0,
        100,
        "mg/dL",
        "< 100",
      ],

      vldl: [
        5,
        40,
        "mg/dL",
        "5 - 40",
      ],

      hba1c: [
        4,
        5.6,
        "%",
        "4.0 - 5.6",
      ],

      t3: [
        80,
        200,
        "ng/dL",
        "80 - 200",
      ],

      t4: [
        5,
        12,
        "µg/dL",
        "5 - 12",
      ],

      tsh: [
        0.4,
        4,
        "µIU/mL",
        "0.4 - 4.0",
      ],
    };

    let x = null;

    if (
      n === "hemoglobin" ||
      n === "haemoglobin" ||
      n === "hb"
    ) {
      x =
        g === "female"
          ? [12, 15, "g/dL", "12 - 15"]
          : [13, 17, "g/dL", "13 - 17"];
    }

    else if (
      n.includes("total leucocyte") ||
      n.includes("total leukocyte") ||
      n === "tlc" ||
      n.includes("wbc")
    ) {
      x = [
        4000,
        11000,
        "/cumm",
        "4000 - 11000",
      ];
    }

    else if (
      n === "rbc count" ||
      n === "total rbc count"
    ) {
      x =
        g === "female"
          ? [
              4,
              5.5,
              "million/cumm",
              "4.0 - 5.5",
            ]
          : [
              4.5,
              6,
              "million/cumm",
              "4.5 - 6.0",
            ];
    }

    else if (
      n.includes("pcv") ||
      n.includes("haematocrit") ||
      n.includes("hematocrit")
    ) {
      x =
        g === "female"
          ? [36, 46, "%", "36 - 46"]
          : [40, 50, "%", "40 - 50"];
    }

    else if (
      n === "platelet count" ||
      n === "platelets"
    ) {
      x = [
        1.5,
        4.5,
        "Lac/cumm",
        "1.5 - 4.5",
      ];
    }

    else if (
      n.includes("fasting blood sugar") ||
      n === "fbs" ||
      n.includes("fasting glucose")
    ) {
      x = refs.fbs;
    }

    else if (
      n.includes("post prandial") ||
      n === "ppbs" ||
      n.includes("postprandial")
    ) {
      x = refs.ppbs;
    }

    else if (
      n.includes("random blood sugar") ||
      n === "rbs" ||
      n.includes("random glucose")
    ) {
      x = refs.rbs;
    }

    else if (
      n === "blood urea" ||
      n === "urea"
    ) {
      x = refs.urea;
    }

    else if (
      n === "serum creatinine" ||
      n === "creatinine"
    ) {
      x = refs.creatinine;
    }

    else if (n === "uric acid") {
      x =
        g === "female"
          ? [
              2.4,
              6,
              "mg/dL",
              "2.4 - 6.0",
            ]
          : [
              3.4,
              7,
              "mg/dL",
              "3.4 - 7.0",
            ];
    }

    else if (n === "sodium") {
      x = refs.sodium;
    }

    else if (n === "potassium") {
      x = refs.potassium;
    }

    else if (n === "chloride") {
      x = refs.chloride;
    }

    else if (n === "bun") {
      x = refs.bun;
    }

    else if (n === "total bilirubin") {
      x = refs["total bilirubin"];
    }

    else if (n === "direct bilirubin") {
      x = refs["direct bilirubin"];
    }

    else if (
      n.includes("sgot") ||
      n === "ast"
    ) {
      x = refs.ast;
    }

    else if (
      n.includes("sgpt") ||
      n === "alt"
    ) {
      x = refs.alt;
    }

    else if (
      n.includes("alkaline phosphatase") ||
      n === "alp"
    ) {
      x = refs.alp;
    }

    else if (n === "total protein") {
      x = refs["total protein"];
    }

    else if (n === "albumin") {
      x = refs.albumin;
    }

    else if (n === "globulin") {
      x = refs.globulin;
    }

    else if (
      n.includes("total cholesterol")
    ) {
      x = [
        0,
        200,
        "mg/dL",
        "< 200",
      ];
    }

    else if (
      n.includes("triglyceride")
    ) {
      x = refs.triglycerides;
    }

    else if (n.includes("hdl")) {
      x = [
        40,
        null,
        "mg/dL",
        "> 40",
      ];
    }

    else if (n.includes("ldl")) {
      x = refs.ldl;
    }

    else if (n.includes("vldl")) {
      x = refs.vldl;
    }

    else if (
      n === "hba1c" ||
      n.includes("glycated")
    ) {
      x = refs.hba1c;
    }

    else if (n === "t3") {
      x = refs.t3;
    }

    else if (n === "t4") {
      x = refs.t4;
    }

    else if (n === "tsh") {
      x = refs.tsh;
    }

    if (!x) return null;

    return {
      min: x[0],
      max: x[1],
      unit: x[2],
      range: x[3],
    };
  }

  /* =========================================================
     PARAMETER
  ========================================================= */

  function resolveParameter(p) {
    const name =
      p?.name ||
      p?.testName ||
      p?.investigation ||
      "";

    const d = reference(name);

    let min = p?.min;
    let max = p?.max;

    const unit =
      p?.unit ||
      p?.units ||
      d?.unit ||
      "";

    let range =
      p?.range ||
      p?.reference ||
      p?.referenceRange ||
      "";

    if (
      (min === undefined ||
        min === null ||
        min === "") &&
      d
    ) {
      min = d.min;
    }

    if (
      (max === undefined ||
        max === null ||
        max === "") &&
      d
    ) {
      max = d.max;
    }

    if (!range && d) {
      range = d.range;
    }

    if (
      !range &&
      min != null &&
      max != null
    ) {
      range = `${min} - ${max}`;
    }

    else if (
      !range &&
      max != null
    ) {
      range = `< ${max}`;
    }

    else if (
      !range &&
      min != null
    ) {
      range = `> ${min}`;
    }

    return {
      ...p,
      min,
      max,
      unit,
      range: range || "-",
    };
  }

  /* =========================================================
     RESULT KEY
  ========================================================= */

  function resultKey(testId, p, index) {
    const name =
      p?.name ||
      p?.testName ||
      p?.investigation ||
      `parameter-${index}`;

    return `${testId}-${name}-${index}`;
  }

  /* =========================================================
     UPDATE RESULT
  ========================================================= */

  function updateResult(
    testId,
    p,
    index,
    value
  ) {
    const key = resultKey(
      testId,
      p,
      index
    );

    setResults((old) => ({
      ...old,
      [key]: value,
    }));
  }

  /* =========================================================
     FLAG
  ========================================================= */

  function getFlag(value, p) {
    if (
      value === "" ||
      value == null
    ) {
      return "";
    }

    const r = resolveParameter(p);

    const n = Number(
      String(value).replace(/,/g, "")
    );

    if (Number.isNaN(n)) {
      return "";
    }

    if (
      r.min != null &&
      n < Number(r.min)
    ) {
      return "LOW";
    }

    if (
      r.max != null &&
      n > Number(r.max)
    ) {
      return "HIGH";
    }

    if (
      r.min != null ||
      r.max != null
    ) {
      return "NORMAL";
    }

    return "";
  }

  /* =========================================================
     OPTIONS
  ========================================================= */

  function getOptions(p) {
    if (
      Array.isArray(p?.options) &&
      p.options.length
    ) {
      return p.options;
    }

    const n = normalize(
      p?.name || ""
    );

    if (
      n.includes("hiv") ||
      n.includes("hbsag") ||
      n.includes("hcv")
    ) {
      return [
        "Non-Reactive",
        "Reactive",
      ];
    }

    if (
      n === "albumin" ||
      n === "sugar"
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
      n === "colour" ||
      n === "color"
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
      n === "appearance"
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

  function buildReportData(
    realPatientId = null
  ) {
    return {
      /*
        IMPORTANT:
        patient_id = REAL patients.id
        NOT patient registration number
      */

      patient_id:
        realPatientId || null,

      patient_number:
        patient?.patientId ||
        patient?.patient_id_number ||
        patient?.patient_number ||
        patient?.patientNumber ||
        patient?.number ||
        "",

      patient_name:
        patient?.name || "",

      age:
        patient?.age ?? null,

      gender:
        patient?.gender ||
        patient?.sex ||
        "",

      referring_doctor:
        patient?.doctor ||
        patient?.refDoctor ||
        patient?.referring_doctor ||
        "",

      tests: selectedTests.map(
        (t) => ({
          id: t.id,

          name:
            t.name ||
            t.short ||
            "",

          short:
            t.short ||
            t.name ||
            "",

          category:
            t.category || "",

          price:
            t.price ||
            t.rate ||
            0,

          parameters:
            t.tests ||
            t.parameters ||
            [],
        })
      ),

      results,

      status: "Pending",
    };
  }

  /* =========================================================
     🔥 CRITICAL FK FIX
     =========================================================

     reports.patient_id must contain patients.id.

     Example:

     WRONG:
     patient_id = "NPL-20260818-8350"

     RIGHT:
     patient_id = "550e8400-e29b-41d4-a716-446655440000"

     This function searches the actual patients table.
  */

  async function resolveRealPatientId() {
    /* -------------------------------------------------------
       1. Previously saved database patient ID
    ------------------------------------------------------- */

    const saved =
      localStorage.getItem(
        "nidanDatabasePatientId"
      );

    if (saved) {
      try {
        const { data, error } =
          await supabase
            .from("patients")
            .select("id")
            .eq("id", saved)
            .maybeSingle();

        if (
          !error &&
          data?.id
        ) {
          return data.id;
        }
      } catch (error) {
        console.warn(
          "Saved patient ID lookup failed:",
          error
        );
      }
    }

    /* -------------------------------------------------------
       2. Patient object may already contain database ID
    ------------------------------------------------------- */

    const directIds = [
      patient?.id,
      patient?.patient_id,
      patient?.databaseId,
      patient?.database_id,
    ].filter(
      (v) =>
        v !== null &&
        v !== undefined &&
        String(v).trim() !== ""
    );

    for (
      const id of [
        ...new Set(
          directIds.map(String)
        ),
      ]
    ) {
      try {
        const { data, error } =
          await supabase
            .from("patients")
            .select("id")
            .eq("id", id)
            .maybeSingle();

        if (
          !error &&
          data?.id
        ) {
          localStorage.setItem(
            "nidanDatabasePatientId",
            String(data.id)
          );

          return data.id;
        }
      } catch (error) {
        console.warn(
          "Direct patient ID lookup failed:",
          error
        );
      }
    }

    /* -------------------------------------------------------
       3. Search by registration/patient number

       The registration number is NEVER inserted into
       reports.patient_id.
    ------------------------------------------------------- */

    const registrationNumbers = [
      patient?.patientId,
      patient?.patient_id_number,
      patient?.patient_number,
      patient?.patientNumber,
      patient?.number,
    ].filter(
      (v) =>
        v !== null &&
        v !== undefined &&
        String(v).trim() !== ""
    );

    const possibleColumns = [
      "patient_id",
      "patient_number",
      "registration_no",
      "registration_number",
      "patient_no",
      "number",
    ];

    for (
      const column of possibleColumns
    ) {
      for (
        const value of [
          ...new Set(
            registrationNumbers.map(
              String
            )
          ),
        ]
      ) {
        try {
          const {
            data,
            error,
          } = await supabase
            .from("patients")
            .select("id")
            .eq(column, value)
            .limit(1)
            .maybeSingle();

          if (
            !error &&
            data?.id
          ) {
            localStorage.setItem(
              "nidanDatabasePatientId",
              String(data.id)
            );

            return data.id;
          }
        } catch (error) {
          console.warn(
            `Patient lookup using ${column} failed:`,
            error
          );
        }
      }
    }

    /*
      No real database ID found.

      VERY IMPORTANT:
      Return null.

      Do NOT return registration number.
      PostgreSQL FK error will therefore not happen
      because we never put registration number into
      reports.patient_id.
    */

    return null;
  }

  /* =========================================================
     SAVE REPORT TO SUPABASE
  ========================================================= */

  async function saveReportToSupabase() {
    const realPatientId =
      await resolveRealPatientId();

    /*
      Here is the main fix.

      patient_id will either be:

      1. Real patients.id

      OR

      2. null

      Never registration number.
    */

    const report =
      buildReportData(
        realPatientId
      );

    let existing = null;

    /* -------------------------------------------------------
       Find existing report
    ------------------------------------------------------- */

    if (realPatientId) {
      const found =
        await supabase
          .from("reports")
          .select("*")
          .eq(
            "patient_id",
            realPatientId
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(1);

      if (
        !found.error &&
        found.data?.length
      ) {
        existing =
          found.data[0];
      }
    }

    /* -------------------------------------------------------
       UPDATE existing report
    ------------------------------------------------------- */

    if (existing?.id) {
      const {
        data,
        error,
      } = await supabase
        .from("reports")
        .update({
          patient_id:
            realPatientId,

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
          existing.id
        )
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

    /* -------------------------------------------------------
       INSERT new report
    ------------------------------------------------------- */

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

    if (realPatientId) {
      localStorage.setItem(
        "nidanDatabasePatientId",
        String(realPatientId)
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
      /* Local backup */

      localStorage.setItem(
        "nidanResults",
        JSON.stringify(results)
      );

      localStorage.setItem(
        "nidanPatient",
        JSON.stringify(patient)
      );

      localStorage.setItem(
        "nidanSelectedTests",
        JSON.stringify(
          selectedTests
        )
      );

      let report;

      /* Supabase */

      try {
        report =
          await saveReportToSupabase();
      } catch (error) {
        console.error(
          "Supabase report error:",
          error
        );

        /*
          Local backup is still retained.
        */

        localStorage.setItem(
          "nidanPendingReport",
          JSON.stringify({
            ...buildReportData(null),

            savedAt:
              new Date().toISOString(),
          })
        );

        alert(
          "Result local me save ho gaya, lekin Supabase report save nahi hui.\n\n" +
          error.message
        );

        return false;
      }

      /* Save pending/final report cache */

      localStorage.setItem(
        "nidanPendingReport",
        JSON.stringify({
          ...buildReportData(
            report?.patient_id ||
              null
          ),

          reportId:
            report?.id ||
            localStorage.getItem(
              "nidanReportId"
            ),

          savedAt:
            new Date().toISOString(),
        })
      );

      if (showMessage) {
        setSavedMessage(
          "✓ Results saved — Report Pending"
        );

        setTimeout(() => {
          setSavedMessage("");
        }, 3000);
      }

      return true;
    } catch (error) {
      console.error(
        "Result Save Error:",
        error
      );

      alert(
        "Result save nahi ho paya.\n\n" +
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

  function missingResults() {
    const missing = [];

    selectedTests.forEach(
      (test) => {
        const parameters =
          test.tests ||
          test.parameters ||
          [];

        parameters.forEach(
          (p, index) => {
            const value =
              results[
                resultKey(
                  test.id,
                  p,
                  index
                )
              ];

            if (
              value == null ||
              String(value).trim() === ""
            ) {
              missing.push({
                test:
                  test.short ||
                  test.name ||
                  "Test",

                parameter:
                  p?.name ||
                  p?.testName ||
                  p?.investigation ||
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
    if (!selectedTests.length) {
      alert(
        "Koi test selected nahi hai."
      );

      return;
    }

    const missing =
      missingResults();

    if (missing.length) {
      const text =
        missing
          .slice(0, 5)
          .map(
            (x) =>
              `${x.test}: ${x.parameter}`
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
          `${missing.length} result blank hain:\n\n${text}${more}\n\nKya phir bhi Final Report banana hai?`
        );

      if (!proceed) {
        return;
      }
    }

    const ok =
      await saveResults(false);

    if (!ok) {
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
        (t) =>
          String(t.id) ===
          String(activeTest)
      );

    if (
      index >= 0 &&
      index <
        selectedTests.length - 1
    ) {
      setActiveTest(
        String(
          selectedTests[
            index + 1
          ].id
        )
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
        (t) =>
          String(t.id) ===
          String(activeTest)
      );

    if (index > 0) {
      setActiveTest(
        String(
          selectedTests[
            index - 1
          ].id
        )
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  /* =========================================================
     PROGRESS
  ========================================================= */

  const totalParameters =
    selectedTests.reduce(
      (total, test) =>
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
      (total, test) => {
        const parameters =
          test.tests ||
          test.parameters ||
          [];

        return (
          total +
          parameters.filter(
            (p, index) => {
              const value =
                results[
                  resultKey(
                    test.id,
                    p,
                    index
                  )
                ];

              return (
                value != null &&
                String(
                  value
                ).trim() !== ""
              );
            }
          ).length
        );
      },
      0
    );

  const progress =
    totalParameters
      ? Math.round(
          (completedResults /
            totalParameters) *
            100
        )
      : 0;

  const currentIndex =
    selectedTests.findIndex(
      (t) =>
        String(t.id) ===
        String(activeTest)
    );

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      <div className="app">

        {/* SIDEBAR */}

        <aside className="sidebar">

          <div className="brand">

            <div className="logo">
              N+
            </div>

            <div>
              <b>NIDAN</b>

              <small>
                PATHOLOGY LAB
              </small>
            </div>

          </div>

          <div className="label">
            MAIN MENU
          </div>

          {[
            ["⌂", "Dashboard", "/"],
            ["+", "New Patient", "/new-patient"],
            ["♙", "Patients", "/patients"],
            ["🧪", "Test Selection", "/tests"],
            ["₹", "Billing", "/billing"],
            ["✎", "Result Entry", null],
            ["▤", "Reports", "/reports"],
          ].map(
            ([icon, name, path]) => (
              <button
                key={name}
                className={
                  "menu " +
                  (!path
                    ? "active"
                    : "")
                }
                onClick={() =>
                  path &&
                  router.push(path)
                }
              >
                <span>
                  {icon}
                </span>

                {name}
              </button>
            )
          )}

          <div className="label manage">
            MANAGEMENT
          </div>

          {[
            ["⚙", "Test Master", "/test-master"],
            ["♟", "Doctors", "/doctors"],
            ["⚙", "Settings", "/settings"],
          ].map(
            ([icon, name, path]) => (
              <button
                key={name}
                className="menu"
                onClick={() =>
                  router.push(path)
                }
              >
                <span>
                  {icon}
                </span>

                {name}
              </button>
            )
          )}

        </aside>

        {/* MAIN */}

        <main className="main">

          <header className="top">

            <div>
              <b>
                Result Entry
              </b>

              <small>
                Enter laboratory investigation results
              </small>
            </div>

            <span className="online">
              ● NIDAN Lab System
            </span>

          </header>

          <div className="content">

            {/* HEADING */}

            <div className="heading">

              <div>
                <em>
                  STEP 4 OF 5
                </em>

                <h1>
                  Laboratory Results
                </h1>

                <p>
                  Selected tests ke results enter karein.
                </p>
              </div>

              <button
                className="back"
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

            <div className="steps">

              {[
                "Patient",
                "Tests",
                "Billing",
                "Results",
                "Report",
              ].map(
                (x, i) => (
                  <div
                    key={x}
                    className={
                      "step " +
                      (i === 3
                        ? "current"
                        : "")
                    }
                  >

                    <span>
                      {i < 3
                        ? "✓"
                        : i + 1}
                    </span>

                    <div>
                      {x}

                      <small>
                        {i === 3
                          ? "Enter Results"
                          : i === 4
                          ? "Print / PDF"
                          : "Completed"}
                      </small>
                    </div>

                  </div>
                )
              )}

            </div>

            {/* PATIENT INFO */}

            <div className="patient">

              <div>
                <small>
                  PATIENT ID
                </small>

                <b>
                  {patient?.patientId ||
                    patient?.patient_id_number ||
                    patient?.patient_number ||
                    patient?.number ||
                    patient?.id ||
                    "-"}
                </b>
              </div>

              <div>
                <small>
                  PATIENT NAME
                </small>

                <b>
                  {patient?.name ||
                    "-"}
                </b>
              </div>

              <div>
                <small>
                  AGE / SEX
                </small>

                <b>
                  {patient?.age ||
                    "-"}

                  {" / "}

                  {patient?.gender ||
                    patient?.sex ||
                    "-"}
                </b>
              </div>

              <div>
                <small>
                  REF. DOCTOR
                </small>

                <b>
                  {patient?.doctor ||
                    patient?.refDoctor ||
                    patient?.referring_doctor ||
                    "-"}
                </b>
              </div>

            </div>

            {/* PROGRESS */}

            <div className="progressBox">

              <div>

                <div>
                  <b>
                    Result Progress
                  </b>

                  <small>
                    {completedResults} of{" "}
                    {totalParameters}{" "}
                    parameters entered
                  </small>
                </div>

                <strong>
                  {progress}%
                </strong>

              </div>

              <div className="track">
                <div
                  style={{
                    width:
                      progress +
                      "%",
                  }}
                />
              </div>

            </div>

            {savedMessage && (
              <div className="saved">
                {savedMessage}
              </div>
            )}

            {/* MOBILE TESTS */}

            <div className="mobileTests">

              <b>
                Selected Tests
              </b>

              <div>

                {selectedTests.map(
                  (t, i) => (
                    <button
                      key={t.id}
                      className={
                        String(
                          activeTest
                        ) ===
                        String(t.id)
                          ? "testChip selected"
                          : "testChip"
                      }
                      onClick={() =>
                        setActiveTest(
                          String(
                            t.id
                          )
                        )
                      }
                    >

                      <span>
                        {i + 1}
                      </span>

                      <strong>
                        {t.short ||
                          t.name}
                      </strong>

                      <small>
                        {
                          (
                            t.tests ||
                            t.parameters ||
                            []
                          ).length
                        }{" "}
                        parameters
                      </small>

                    </button>
                  )
                )}

              </div>

            </div>

            {/* WORKSPACE */}

            <div className="workspace">

              {/* DESKTOP TEST NAV */}

              <aside className="testNav">

                <b>
                  Selected Tests
                </b>

                {selectedTests.map(
                  (t, i) => (
                    <button
                      key={t.id}
                      className={
                        String(
                          activeTest
                        ) ===
                        String(t.id)
                          ? "navTest selected"
                          : "navTest"
                      }
                      onClick={() =>
                        setActiveTest(
                          String(
                            t.id
                          )
                        )
                      }
                    >

                      <span>
                        {i + 1}
                      </span>

                      <div>

                        <b>
                          {t.short ||
                            t.name}
                        </b>

                        <small>
                          {
                            (
                              t.tests ||
                              t.parameters ||
                              []
                            ).length
                          }{" "}
                          parameters
                        </small>

                      </div>

                    </button>
                  )
                )}

              </aside>

              {/* RESULT CARD */}

              <section className="card">

                {!currentTest ? (

                  <div className="empty">

                    <div>
                      🧪
                    </div>

                    <h2>
                      No Test Selected
                    </h2>

                    <button
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

                    <div className="cardHead">

                      <div>

                        <em>
                          INVESTIGATION
                        </em>

                        <h2>
                          {currentTest.name ||
                            currentTest.short}
                        </h2>

                        <p>
                          Enter patient laboratory results.
                        </p>

                      </div>

                      <span>
                        {
                          currentParameters.length
                        }{" "}
                        Parameters
                      </span>

                    </div>

                    {/* DESKTOP TABLE */}

                    <div className="desktopTable">

                      <table>

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
                            (p, i) => {

                              const key =
                                resultKey(
                                  currentTest.id,
                                  p,
                                  i
                                );

                              const value =
                                results[
                                  key
                                ] ?? "";

                              const r =
                                resolveParameter(
                                  p
                                );

                              const flag =
                                getFlag(
                                  value,
                                  p
                                );

                              const options =
                                getOptions(
                                  p
                                );

                              return (
                                <tr
                                  key={
                                    key
                                  }
                                >

                                  <td>
                                    <b>
                                      {p?.name ||
                                        p?.testName ||
                                        p?.investigation ||
                                        "Investigation"}
                                    </b>
                                  </td>

                                  <td>

                                    {options.length ? (

                                      <select
                                        value={
                                          value
                                        }
                                        onChange={(
                                          e
                                        ) =>
                                          updateResult(
                                            currentTest.id,
                                            p,
                                            i,
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
                                        value={
                                          value
                                        }
                                        onChange={(
                                          e
                                        ) =>
                                          updateResult(
                                            currentTest.id,
                                            p,
                                            i,
                                            e.target.value
                                          )
                                        }
                                        placeholder="Enter result"
                                      />

                                    )}

                                  </td>

                                  <td>
                                    {r.unit ||
                                      "-"}
                                  </td>

                                  <td>
                                    {r.range ||
                                      "-"}
                                  </td>

                                  <td>

                                    {flag && (
                                      <span
                                        className={
                                          "flag " +
                                          flag.toLowerCase()
                                        }
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

                    {/* MOBILE PARAMETERS */}

                    <div className="mobileParams">

                      {currentParameters.map(
                        (p, i) => {

                          const key =
                            resultKey(
                              currentTest.id,
                              p,
                              i
                            );

                          const value =
                            results[
                              key
                            ] ?? "";

                          const r =
                            resolveParameter(
                              p
                            );

                          const flag =
                            getFlag(
                              value,
                              p
                            );

                          const options =
                            getOptions(
                              p
                            );

                          return (

                            <div
                              className="param"
                              key={key}
                            >

                              <b className="paramName">

                                <span>
                                  {i + 1}
                                </span>

                                {p?.name ||
                                  p?.testName ||
                                  p?.investigation ||
                                  "Investigation"}

                              </b>

                              {options.length ? (

                                <select
                                  value={
                                    value
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    updateResult(
                                      currentTest.id,
                                      p,
                                      i,
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
                                  value={
                                    value
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    updateResult(
                                      currentTest.id,
                                      p,
                                      i,
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter result"
                                />

                              )}

                              <div className="info">

                                <div>
                                  <small>
                                    Unit
                                  </small>

                                  <b>
                                    {r.unit ||
                                      "-"}
                                  </b>
                                </div>

                                <div>
                                  <small>
                                    Reference
                                  </small>

                                  <b>
                                    {r.range ||
                                      "-"}
                                  </b>
                                </div>

                                <div>
                                  <small>
                                    Flag
                                  </small>

                                  <b>
                                    {flag ||
                                      "-"}
                                  </b>
                                </div>

                              </div>

                            </div>

                          );
                        }
                      )}

                    </div>

                    {/* FOOTER */}

                    <div className="footer">

                      <button
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

                      <div>

                        <button
                          className="save"
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
                          className="next"
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

            {/* FINAL REPORT */}

            <div className="bottom">

              <div>

                <b>
                  Results ready?
                </b>

                <small>
                  Save results and create final laboratory report.
                </small>

              </div>

              <button
                onClick={
                  continueReport
                }
                disabled={
                  saving
                }
              >
                {saving
                  ? "Saving..."
                  : "Generate Final Report →"}
              </button>

            </div>

          </div>

        </main>

      </div>

      {/* =====================================================
          CSS
      ===================================================== */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
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
          opacity: 0.55;
          cursor: not-allowed;
        }

        .app {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 230px minmax(0, 1fr);
        }

        .sidebar {
          background: #092437;
          color: white;
          padding: 18px 12px;
          min-height: 100vh;
          position: sticky;
          top: 0;
        }

        .brand {
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 2px 6px 22px;
        }

        .logo {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #10a6a3;
          display: grid;
          place-items: center;
          font-weight: 900;
        }

        .brand b {
          display: block;
        }

        .brand small {
          display: block;
          color: #94a8b6;
          font-size: 7px;
          letter-spacing: 0.6px;
          margin-top: 3px;
        }

        .label {
          margin: 4px 8px 10px;
          color: #78909f;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .manage {
          margin-top: 22px;
        }

        .menu {
          width: 100%;
          min-height: 42px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #cbd5df;
          text-align: left;
          padding: 10px 11px;
          margin-bottom: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .menu span {
          display: inline-flex;
          width: 22px;
          justify-content: center;
          margin-right: 8px;
        }

        .menu:hover,
        .menu.active {
          background: #12465e;
          color: white;
        }

        .menu.active {
          box-shadow:
            inset 3px 0 #10a6a3;
        }

        .main {
          min-width: 0;
        }

        .top {
          min-height: 72px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 13px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .top b {
          display: block;
          font-size: 15px;
        }

        .top small {
          display: block;
          color: #64748b;
          font-size: 9px;
          margin-top: 3px;
        }

        .online {
          font-size: 10px;
          color: #64748b;
        }

        .content {
          padding: 22px 26px 40px;
        }

        .heading {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 16px;
        }

        .heading em,
        .cardHead em {
          font-style: normal;
          color: #0d8e8b;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.4px;
        }

        .heading h1 {
          margin: 4px 0 3px;
          font-size: 23px;
        }

        .heading p {
          margin: 0;
          color: #64748b;
          font-size: 11px;
        }

        .back {
          height: 38px;
          padding: 0 14px;
          background: white;
          border: 1px solid #dbe3ea;
          border-radius: 7px;
          font-weight: 700;
          color: #334155;
        }

        .steps {
          display: grid;
          grid-template-columns:
            repeat(5, 1fr);
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          padding: 10px 12px;
          margin-bottom: 14px;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #94a3b8;
          font-size: 9px;
          font-weight: 700;
        }

        .step span {
          width: 25px;
          height: 25px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #f1f5f9;
          font-size: 10px;
        }

        .step small {
          display: block;
          color: #a0acb8;
          font-size: 7px;
          margin-top: 2px;
        }

        .step.current {
          color: #0d8e8b;
        }

        .step.current span {
          background: #0d9e9a;
          color: white;
        }

        .patient {
          display: grid;
          grid-template-columns:
            1.2fr 1.7fr 1fr 1.5fr;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .patient > div {
          padding: 11px 13px;
          border-right: 1px solid #e2e8f0;
        }

        .patient > div:last-child {
          border: 0;
        }

        .patient small {
          display: block;
          color: #7b8795;
          font-size: 7px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .patient b {
          font-size: 10px;
          word-break: break-word;
        }

        .progressBox,
        .card,
        .testNav,
        .bottom,
        .mobileTests {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
        }

        .progressBox {
          padding: 12px 14px;
          margin-bottom: 14px;
        }

        .progressBox > div:first-child {
          display: flex;
          justify-content: space-between;
        }

        .progressBox b {
          font-size: 11px;
        }

        .progressBox small {
          display: block;
          color: #64748b;
          font-size: 8px;
          margin-top: 3px;
        }

        .progressBox
          > div:first-child
          > strong {
          color: #0d8e8b;
          font-size: 16px;
        }

        .track {
          height: 6px;
          background: #e9eef2;
          border-radius: 20px;
          overflow: hidden;
          margin-top: 9px;
        }

        .track > div {
          height: 100%;
          background: #0d9e9a;
          transition: width 0.25s;
        }

        .saved {
          padding: 10px 14px;
          margin-bottom: 14px;
          border: 1px solid #a7f3d0;
          border-radius: 8px;
          background: #ecfdf5;
          color: #047857;
          font-size: 11px;
          font-weight: 700;
        }

        .workspace {
          display: grid;
          grid-template-columns:
            200px minmax(0, 1fr);
          gap: 14px;
          align-items: start;
        }

        .testNav {
          padding: 9px;
        }

        .testNav > b {
          display: block;
          padding: 6px 7px 10px;
          font-size: 10px;
        }

        .navTest {
          width: 100%;
          min-height: 55px;
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 8px;
          border: 1px solid transparent;
          border-radius: 7px;
          background: white;
          text-align: left;
        }

        .navTest:hover {
          background: #f8fafc;
        }

        .navTest.selected {
          background: #eaf9f8;
          border-color: #0d9e9a;
          box-shadow:
            inset 3px 0 #0d9e9a;
        }

        .navTest > span {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #edf5f5;
          color: #087f7d;
          font-size: 10px;
          font-weight: 900;
        }

        .navTest b {
          display: block;
          font-size: 10px;
        }

        .navTest small {
          display: block;
          color: #7b8795;
          font-size: 7px;
          margin-top: 3px;
        }

        .card {
          min-width: 0;
          overflow: hidden;
        }

        .cardHead {
          padding: 16px 18px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          gap: 18px;
        }

        .cardHead h2 {
          margin: 3px 0;
          font-size: 19px;
        }

        .cardHead p {
          margin: 0;
          color: #94a0ad;
          font-size: 9px;
        }

        .cardHead > span {
          height: max-content;
          padding: 8px 10px;
          border-radius: 20px;
          background: #e7f8f7;
          color: #087f7d;
          font-size: 8px;
          font-weight: 800;
          white-space: nowrap;
        }

        .desktopTable {
          overflow-x: auto;
        }

        .desktopTable table {
          width: 100%;
          min-width: 650px;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .desktopTable th {
          height: 34px;
          padding: 8px 10px;
          border: 1px solid #e1e7ec;
          background: #f3f6f8;
          color: #526170;
          font-size: 8px;
          text-align: left;
        }

        .desktopTable td {
          padding: 8px 10px;
          border: 1px solid #e5e9ed;
          font-size: 9px;
        }

        .desktopTable th:nth-child(1) {
          width: 32%;
        }

        .desktopTable th:nth-child(2) {
          width: 23%;
        }

        .desktopTable th:nth-child(3) {
          width: 12%;
        }

        .desktopTable th:nth-child(4) {
          width: 23%;
        }

        .desktopTable th:nth-child(5) {
          width: 10%;
        }

        .desktopTable input,
        .desktopTable select {
          width: 100%;
          height: 38px;
          padding: 7px 10px;
          border: 1px solid #d3dce3;
          border-radius: 7px;
          background: white;
          font-size: 12px;
          outline: 0;
        }

        .desktopTable input:focus,
        .desktopTable select:focus {
          border-color: #0d9e9a;
        }

        .flag {
          display: inline-flex;
          min-width: 44px;
          justify-content: center;
          padding: 4px 6px;
          border-radius: 5px;
          font-size: 7px;
          font-weight: 900;
        }

        .flag.high {
          background: #fee2e2;
          color: #b91c1c;
        }

        .flag.low {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .flag.normal {
          background: #dcfce7;
          color: #15803d;
        }

        .mobileTests,
        .mobileParams {
          display: none;
        }

        .footer {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-top: 1px solid #e2e8f0;
        }

        .footer button {
          min-height: 38px;
          padding: 8px 13px;
          border-radius: 7px;
          font-size: 10px;
          font-weight: 800;
          border: 1px solid #dbe3ea;
          background: white;
          color: #64748b;
        }

        .footer > div {
          display: flex;
          gap: 8px;
        }

        .footer .save {
          border-color: #0d9e9a;
          color: #087f7d;
        }

        .footer .next {
          background: #172033;
          border-color: #172033;
          color: white;
        }

        .bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: 16px;
          padding: 15px 17px;
        }

        .bottom b {
          font-size: 11px;
        }

        .bottom small {
          display: block;
          color: #64748b;
          font-size: 8px;
          margin-top: 3px;
        }

        .bottom button,
        .empty button {
          min-height: 40px;
          padding: 8px 15px;
          border: 0;
          border-radius: 7px;
          background: #087f7d;
          color: white;
          font-size: 10px;
          font-weight: 800;
        }

        .empty {
          text-align: center;
          padding: 50px 20px;
        }

        .empty > div {
          font-size: 35px;
        }

        .empty h2 {
          font-size: 18px;
        }

        @media (max-width: 900px) {

          .app {
            display: block;
          }

          .sidebar {
            display: none;
          }

          .top {
            min-height: 60px;
            padding: 11px 13px;
          }

          .content {
            padding: 13px 12px 25px;
          }

          .heading {
            flex-direction: column;
            gap: 9px;
          }

          .heading h1 {
            font-size: 22px;
          }

          .back {
            width: 100%;
          }

          .steps {
            display: flex;
            overflow: auto;
            gap: 7px;
          }

          .step {
            flex: 0 0 105px;
          }

          .patient {
            grid-template-columns:
              1fr 1fr;
          }

          .patient > div {
            border-bottom:
              1px solid #e2e8f0;
          }

          .workspace {
            display: block;
          }

          .testNav {
            display: none;
          }

          .mobileTests {
            display: block;
            padding: 12px;
            margin-bottom: 12px;
          }

          .mobileTests > b {
            display: block;
            margin-bottom: 9px;
            font-size: 13px;
          }

          .mobileTests > div {
            display: flex;
            gap: 9px;
            overflow: auto;
          }

          .testChip {
            flex: 0 0 125px;
            display: flex;
            flex-direction: column;
            gap: 3px;
            padding: 9px 10px;
            border: 1px solid #dce4e8;
            border-radius: 10px;
            background: white;
            text-align: left;
          }

          .testChip span {
            width: 25px;
            height: 25px;
            display: grid;
            place-items: center;
            border-radius: 50%;
            background: #edf7f6;
            color: #087f7d;
            font-weight: 900;
          }

          .testChip strong {
            font-size: 13px;
          }

          .testChip small {
            color: #718096;
            font-size: 10px;
          }

          .testChip.selected {
            border-color: #0d9e9a;
            background: #effcfb;
          }

          .desktopTable {
            display: none;
          }

          .mobileParams {
            display: block;
            padding: 10px 9px;
          }

          .param {
            margin-bottom: 11px;
            padding: 13px 11px;
            border: 1px solid #e1e7eb;
            border-radius: 12px;
            background: white;
          }

          .paramName {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            font-size: 14px;
          }

          .paramName span {
            width: 28px;
            height: 28px;
            display: grid;
            place-items: center;
            border-radius: 50%;
            background: #e9f8f7;
            color: #087f7d;
          }

          .param > input,
          .param > select {
            width: 100%;
            height: 46px;
            padding: 9px 11px;
            border: 1px solid #cfd8df;
            border-radius: 9px;
            background: white;
            font-size: 15px;
          }

          .info {
            display: grid;
            grid-template-columns:
              1fr 1.4fr 1fr;
            gap: 7px;
            margin-top: 10px;
          }

          .info > div {
            padding: 9px;
            border-radius: 8px;
            background: #f8fafc;
          }

          .info small {
            display: block;
            color: #64748b;
            font-size: 9px;
            margin-bottom: 4px;
          }

          .info b {
            font-size: 11px;
            word-break: break-word;
          }

          .footer {
            flex-direction: column;
          }

          .footer > button {
            width: 100%;
          }

          .footer > div {
            width: 100%;
            display: grid;
            grid-template-columns:
              1fr 1fr;
          }

          .footer > div button {
            width: 100%;
          }

          .bottom {
            flex-direction: column;
            align-items: stretch;
          }

          .bottom button {
            width: 100%;
          }

          .cardHead h2 {
            font-size: 20px;
          }
        }

        @media (max-width: 600px) {

          .content {
            padding: 10px 9px 22px;
          }

          .online {
            display: none;
          }

          .patient b {
            font-size: 11px;
          }

          .patient small {
            font-size: 8px;
          }

          .footer > div {
            grid-template-columns: 1fr;
          }

          .cardHead h2 {
            font-size: 19px;
          }
        }

        @media (max-width: 380px) {

          .patient {
            grid-template-columns: 1fr;
          }

          .patient > div {
            border-right: 0;
          }

          .testChip {
            min-width: 115px;
          }
        }

      `}</style>
    </>
  );
}
