"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

/* ============================================================
   NIDAN PATHOLOGY LAB
   FINAL A4 REPORT ENGINE
   ============================================================ */

const DEFAULT_SETTINGS = {
  labName: "NIDAN PATHOLOGY LAB",
  labAddress: "",
  phone: "",
  email: "",
  doctorName: "",
  letterhead: "",
  autoSave: true,
  showFlag: true,
  showReferenceRange: true,
};

/*
  IMPORTANT A4 POSITIONS

  Letterhead:
  content starts around 17-20%
  footer safe area around 87-90%

  No letterhead:
  content starts around 10%
  because built-in header is only ~27mm.
*/

const DEFAULT_LAYOUT = {
  contentTop: 18,
  contentBottom: 87,
  left: 6.5,
  right: 6.5,
};

/* ============================================================
   MAIN
============================================================ */

export default function ReportPage() {
  const router = useRouter();

  const [patient, setPatient] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
  const [results, setResults] = useState({});
  const [labSettings, setLabSettings] =
    useState(DEFAULT_SETTINGS);

  const [reportDate, setReportDate] = useState("");
  const [reportNo, setReportNo] = useState("");

  const [saveStatus, setSaveStatus] =
    useState("loading");

  const [saveMessage, setSaveMessage] =
    useState("");

  const [letterheadInfo, setLetterheadInfo] =
    useState(DEFAULT_LAYOUT);

  const [processedLetterhead, setProcessedLetterhead] =
    useState("");

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  useEffect(() => {
    loadReportData();
  }, []);

  async function loadReportData() {
    try {
      const patientData = readJSON([
        "nidanPatient",
        "patient",
        "currentPatient",
      ]);

      const testsData = readJSON([
        "nidanSelectedTests",
        "selectedTests",
        "selected_tests",
      ]);

      const resultData = readJSON([
        "nidanResults",
        "results",
        "testResults",
      ]);

      const settingsData = readJSON([
        "nidanLabSettings",
        "labSettings",
        "settings",
      ]);

      setPatient(patientData || {});

      setSelectedTests(
        Array.isArray(testsData)
          ? testsData
          : []
      );

      setResults(resultData || {});

      setLabSettings({
        ...DEFAULT_SETTINGS,
        ...(settingsData || {}),
      });

      setReportDate(
        formatDate(new Date())
      );

      const savedNo =
        localStorage.getItem(
          "nidanCurrentReportNo"
        );

      if (savedNo) {
        setReportNo(savedNo);
      }

      setSaveStatus("ready");
    } catch (error) {
      console.error(
        "REPORT LOAD ERROR",
        error
      );

      setSaveStatus("error");
      setSaveMessage(
        "Report data load failed"
      );
    }
  }

  function readJSON(keys) {
    for (const key of keys) {
      const value =
        localStorage.getItem(key);

      if (!value) continue;

      try {
        return JSON.parse(value);
      } catch {
        continue;
      }
    }

    return null;
  }

  function formatDate(date) {
    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  /* ==========================================================
     LETTERHEAD
  ========================================================== */

  useEffect(() => {
    if (!labSettings?.letterhead) {
      setProcessedLetterhead("");

      setLetterheadInfo({
        ...DEFAULT_LAYOUT,
      });

      return;
    }

    processLetterhead(
      labSettings.letterhead
    );
  }, [
    labSettings?.letterhead,
  ]);

  async function processLetterhead(src) {
    try {
      const img =
        await loadImage(src);

      const layout =
        detectLetterheadSafeArea(
          img
        );

      setProcessedLetterhead(src);
      setLetterheadInfo(layout);
    } catch (error) {
      console.error(
        "LETTERHEAD ERROR",
        error
      );

      /*
        IMPORTANT:
        Never remove the original
        letterhead if detection fails.
      */

      setProcessedLetterhead(src);

      /*
        Safe fallback for normal
        pathology letterhead.
      */

      setLetterheadInfo({
        ...DEFAULT_LAYOUT,
      });
    }
  }

  function loadImage(src) {
    return new Promise(
      (resolve, reject) => {
        const img =
          new Image();

        if (
          !src.startsWith("data:")
        ) {
          img.crossOrigin =
            "anonymous";
        }

        img.onload = () =>
          resolve(img);

        img.onerror = reject;

        img.src = src;
      }
    );
  }

  /* ==========================================================
     SMART LETTERHEAD SAFE AREA

     FIX:
     Old version searched only from 24%.
     That caused your patient box to start
     around 33%.

     New version checks 9%-28% and keeps
     the report much closer to the header.
  ========================================================== */

  function detectLetterheadSafeArea(
    image
  ) {
    const width =
      image.naturalWidth ||
      image.width;

    const height =
      image.naturalHeight ||
      image.height;

    if (!width || !height) {
      return {
        ...DEFAULT_LAYOUT,
      };
    }

    const maxWidth = 700;

    const ratio =
      Math.min(
        1,
        maxWidth / width
      );

    const w =
      Math.max(
        250,
        Math.round(
          width * ratio
        )
      );

    const h =
      Math.max(
        350,
        Math.round(
          height * ratio
        )
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width = w;
    canvas.height = h;

    const ctx =
      canvas.getContext(
        "2d",
        {
          willReadFrequently:
            true,
        }
      );

    if (!ctx) {
      return {
        ...DEFAULT_LAYOUT,
      };
    }

    try {
      ctx.drawImage(
        image,
        0,
        0,
        w,
        h
      );
    } catch {
      return {
        ...DEFAULT_LAYOUT,
      };
    }

    let data;

    try {
      data =
        ctx.getImageData(
          0,
          0,
          w,
          h
        ).data;
    } catch {
      return {
        ...DEFAULT_LAYOUT,
      };
    }

    const rows = [];

    for (
      let y = 0;
      y < h;
      y++
    ) {
      let score = 0;
      let samples = 0;

      for (
        let x = 0;
        x < w;
        x += 5
      ) {
        const i =
          (y * w + x) *
          4;

        const r =
          data[i];

        const g =
          data[i + 1];

        const b =
          data[i + 2];

        const brightness =
          (r + g + b) / 3;

        const saturation =
          Math.max(
            r,
            g,
            b
          ) -
          Math.min(
            r,
            g,
            b
          );

        /*
          Detect text,
          logos and coloured
          letterhead areas.
        */

        if (
          brightness < 210 ||
          saturation > 42
        ) {
          score++;
        }

        samples++;
      }

      rows.push(
        score /
          Math.max(
            1,
            samples
          )
      );
    }

    /*
      ----------------------------------------------------------
      HEADER DETECTION
      ----------------------------------------------------------
      Look between 8% and 27%.
      We want the FIRST large quiet area.
    */

    let contentTop = 18;

    let quietFound = false;

    const startY =
      Math.round(
        h * 0.08
      );

    const endY =
      Math.round(
        h * 0.28
      );

    const windowSize =
      Math.max(
        10,
        Math.round(
          h * 0.012
        )
      );

    for (
      let y = startY;
      y < endY;
      y++
    ) {
      let total = 0;

      for (
        let k = 0;
        k < windowSize;
        k++
      ) {
        total +=
          rows[
            Math.min(
              h - 1,
              y + k
            )
          ] || 0;
      }

      const avg =
        total /
        windowSize;

      /*
        White/quiet area.
      */

      if (avg < 0.045) {
        contentTop =
          Math.max(
            15,
            Math.min(
              25,
              (y / h) * 100 + 1.5
            )
          );

        quietFound = true;
        break;
      }
    }

    /*
      If detection is not reliable,
      use a safe standard position.
    */

    if (!quietFound) {
      contentTop = 18;
    }

    /*
      ----------------------------------------------------------
      FOOTER DETECTION
      ----------------------------------------------------------
    */

    let contentBottom = 87;

    let footerFound = false;

    const footerStart =
      Math.round(
        h * 0.76
      );

    const footerEnd =
      Math.round(
        h * 0.96
      );

    for (
      let y = footerStart;
      y < footerEnd;
      y++
    ) {
      let total = 0;

      for (
        let k = 0;
        k < windowSize;
        k++
      ) {
        total +=
          rows[
            Math.min(
              h - 1,
              y + k
            )
          ] || 0;
      }

      const avg =
        total /
        windowSize;

      if (avg > 0.045) {
        contentBottom =
          Math.max(
            80,
            Math.min(
              91,
              (y / h) * 100 - 1.5
            )
          );

        footerFound = true;
        break;
      }
    }

    if (!footerFound) {
      contentBottom = 87;
    }

    /*
      Final safety.
    */

    if (
      contentBottom -
        contentTop <
      55
    ) {
      contentTop = 18;
      contentBottom = 87;
    }

    return {
      contentTop,
      contentBottom,
      left: 6.5,
      right: 6.5,
    };
  }

  /* ==========================================================
     NORMALIZE
  ========================================================== */

  function normalizeName(
    name = ""
  ) {
    return String(name)
      .toLowerCase()
      .replace(/[()]/g, "")
      .replace(
        /[./_-]/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  }

  function getGender() {
    const value =
      String(
        patient?.gender ||
          patient?.sex ||
          ""
      )
        .trim()
        .toLowerCase();

    if (
      [
        "male",
        "m",
        "पुरुष",
      ].includes(value)
    ) {
      return "male";
    }

    if (
      [
        "female",
        "f",
        "महिला",
      ].includes(value)
    ) {
      return "female";
    }

    return "";
  }

  /* ==========================================================
     REFERENCE RANGES
  ========================================================== */

  function getDefaultReference(
    parameterName
  ) {
    const name =
      normalizeName(
        parameterName
      );

    const gender =
      getGender();

    if (
      [
        "hemoglobin",
        "haemoglobin",
        "hb",
      ].includes(name)
    ) {
      return gender === "female"
        ? {
            min: 12,
            max: 15,
            unit: "g/dL",
            range: "12 - 15",
          }
        : {
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
      name === "wbc" ||
      name.includes("wbc")
    ) {
      return {
        min: 4000,
        max: 11000,
        unit: "/cumm",
        range:
          "4000 - 11000",
      };
    }

    if (
      [
        "neutrophils",
        "neutrophil",
      ].includes(name)
    ) {
      return {
        min: 40,
        max: 75,
        unit: "%",
        range: "40 - 75",
      };
    }

    if (
      [
        "lymphocytes",
        "lymphocyte",
      ].includes(name)
    ) {
      return {
        min: 20,
        max: 40,
        unit: "%",
        range: "20 - 40",
      };
    }

    if (
      [
        "eosinophils",
        "eosinophil",
      ].includes(name)
    ) {
      return {
        min: 1,
        max: 6,
        unit: "%",
        range: "1 - 6",
      };
    }

    if (
      [
        "monocytes",
        "monocyte",
      ].includes(name)
    ) {
      return {
        min: 1,
        max: 10,
        unit: "%",
        range: "1 - 10",
      };
    }

    if (
      [
        "basophils",
        "basophil",
      ].includes(name)
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
      name === "rbc"
    ) {
      return gender === "female"
        ? {
            min: 4,
            max: 5.5,
            unit:
              "million/cumm",
            range:
              "4.0 - 5.5",
          }
        : {
            min: 4.5,
            max: 6,
            unit:
              "million/cumm",
            range:
              "4.5 - 6.0",
          };
    }

    if (
      name.includes("pcv") ||
      name.includes(
        "haematocrit"
      ) ||
      name.includes(
        "hematocrit"
      )
    ) {
      return gender === "female"
        ? {
            min: 36,
            max: 46,
            unit: "%",
            range: "36 - 46",
          }
        : {
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
        range:
          "11.5 - 14.5",
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
        range:
          "1.5 - 4.5",
      };
    }

    if (name === "mpv") {
      return {
        min: 7.5,
        max: 11.5,
        unit: "fL",
        range:
          "7.5 - 11.5",
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
        range:
          "0.15 - 0.40",
      };
    }

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

    if (
      name.includes(
        "fasting blood sugar"
      ) ||
      name === "fbs"
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
      name === "ppbs"
    ) {
      return {
        min: 70,
        max: 140,
        unit: "mg/dL",
        range:
          "70 - 140",
      };
    }

    if (
      name.includes(
        "random blood sugar"
      ) ||
      name === "rbs"
    ) {
      return {
        min: 70,
        max: 140,
        unit: "mg/dL",
        range:
          "70 - 140",
      };
    }

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
      name ===
        "serum creatinine" ||
      name === "creatinine"
    ) {
      return {
        min: 0.6,
        max: 1.3,
        unit: "mg/dL",
        range:
          "0.6 - 1.3",
      };
    }

    if (
      name === "uric acid"
    ) {
      return gender === "female"
        ? {
            min: 2.4,
            max: 6,
            unit: "mg/dL",
            range:
              "2.4 - 6.0",
          }
        : {
            min: 3.4,
            max: 7,
            unit: "mg/dL",
            range:
              "3.4 - 7.0",
          };
    }

    if (name === "sodium") {
      return {
        min: 135,
        max: 145,
        unit: "mEq/L",
        range:
          "135 - 145",
      };
    }

    if (name === "potassium") {
      return {
        min: 3.5,
        max: 5.1,
        unit: "mEq/L",
        range:
          "3.5 - 5.1",
      };
    }

    if (
      name ===
      "total bilirubin"
    ) {
      return {
        min: 0.2,
        max: 1.2,
        unit: "mg/dL",
        range:
          "0.2 - 1.2",
      };
    }

    if (
      name ===
      "direct bilirubin"
    ) {
      return {
        min: 0,
        max: 0.3,
        unit: "mg/dL",
        range:
          "0 - 0.3",
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

    if (name === "tsh") {
      return {
        min: 0.4,
        max: 4,
        unit: "µIU/mL",
        range:
          "0.4 - 4.0",
      };
    }

    if (name === "t3") {
      return {
        min: 80,
        max: 200,
        unit: "ng/dL",
        range:
          "80 - 200",
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

    return null;
  }

  /* ==========================================================
     PARAMETER
  ========================================================== */

  function resolveParameter(
    parameter
  ) {
    const name =
      typeof parameter ===
      "string"
        ? parameter
        : parameter?.name ||
          parameter?.testName ||
          parameter?.investigation ||
          "";

    const defaults =
      getDefaultReference(
        name
      );

    if (
      typeof parameter ===
      "string"
    ) {
      return {
        name,
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

    let min =
      parameter?.min;

    let max =
      parameter?.max;

    let unit =
      parameter?.unit ||
      parameter?.units;

    let range =
      parameter?.range ||
      parameter?.referenceRange ||
      parameter?.reference;

    if (
      min === undefined ||
      min === null ||
      min === ""
    ) {
      min =
        defaults?.min ??
        null;
    }

    if (
      max === undefined ||
      max === null ||
      max === ""
    ) {
      max =
        defaults?.max ??
        null;
    }

    if (!unit) {
      unit =
        defaults?.unit ||
        "";
    }

    if (!range) {
      if (
        min !== null &&
        max !== null
      ) {
        range =
          `${min} - ${max}`;
      } else if (
        max !== null
      ) {
        range =
          `< ${max}`;
      } else if (
        min !== null
      ) {
        range =
          `> ${min}`;
      } else {
        range = "-";
      }
    }

    return {
      ...parameter,
      name,
      min,
      max,
      unit,
      range,
    };
  }

  function getFlag(
    value,
    parameter
  ) {
    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return "";
    }

    const p =
      resolveParameter(
        parameter
      );

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

    if (
      p.min !== null &&
      p.min !== undefined &&
      numeric <
        Number(p.min)
    ) {
      return "L";
    }

    if (
      p.max !== null &&
      p.max !== undefined &&
      numeric >
        Number(p.max)
    ) {
      return "H";
    }

    return "";
  }

  /* ==========================================================
     BUILD REPORT TESTS
  ========================================================== */

  function buildReportTests() {
    if (
      !Array.isArray(
        selectedTests
      )
    ) {
      return [];
    }

    return selectedTests.map(
      (
        test,
        testIndex
      ) => {
        const testId =
          test?.id ??
          test?.testId ??
          `test-${testIndex}`;

        const parameters =
          test?.tests ||
          test?.parameters ||
          [];

        return {
          id: testId,

          name:
            test?.name ||
            test?.testName ||
            "Laboratory Test",

          category:
            test?.category ||
            test?.department ||
            "PATHOLOGY",

          parameters:
            Array.isArray(
              parameters
            )
              ? parameters.map(
                  (
                    parameter,
                    index
                  ) => {
                    const name =
                      typeof parameter ===
                      "string"
                        ? parameter
                        : parameter?.name ||
                          parameter?.testName ||
                          parameter?.investigation ||
                          `Investigation ${
                            index + 1
                          }`;

                    const key =
                      `${testId}-${name}-${index}`;

                    const value =
                      results?.[key] ??
                      "";

                    const resolved =
                      resolveParameter(
                        parameter
                      );

                    return {
                      name,

                      result:
                        value,

                      unit:
                        resolved.unit ||
                        "-",

                      referenceRange:
                        resolved.range ||
                        "-",

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

  const reportTests =
    useMemo(
      () =>
        buildReportTests(),
      [
        selectedTests,
        results,
        patient.gender,
        patient.sex,
        patient.age,
      ]
    );

  /* ==========================================================
     PAGINATION
  ========================================================== */

  function paginateTests(
    tests
  ) {
    if (!tests.length) {
      return [[]];
    }

    /*
      A4 content area is now larger,
      so CBC can fit comfortably.
    */

    const rowsPerPage = 30;

    const pages = [];

    let current = [];
    let used = 3;

    for (
      const test of tests
    ) {
      const count =
        Math.max(
          1,
          test.parameters?.length ||
            0
        );

      const cost =
        count + 3;

      if (
        current.length &&
        used + cost >
          rowsPerPage
      ) {
        pages.push(
          current
        );

        current = [];
        used = 3;
      }

      /*
        Very large test:
        split it.
      */

      if (
        cost >
        rowsPerPage
      ) {
        const chunks =
          chunkTest(
            test,
            rowsPerPage - 3
          );

        chunks.forEach(
          (
            chunk,
            index
          ) => {
            if (
              index <
              chunks.length - 1
            ) {
              pages.push([
                chunk,
              ]);
            } else {
              current.push(
                chunk
              );

              used +=
                chunk.parameters.length +
                3;
            }
          }
        );

        continue;
      }

      current.push(
        test
      );

      used += cost;
    }

    if (
      current.length
    ) {
      pages.push(
        current
      );
    }

    return pages;
  }

  function chunkTest(
    test,
    size
  ) {
    const rows =
      test.parameters || [];

    const chunks = [];

    for (
      let i = 0;
      i < rows.length;
      i += size
    ) {
      chunks.push({
        ...test,

        id:
          `${test.id}-${i}`,

        parameters:
          rows.slice(
            i,
            i + size
          ),
      });
    }

    return chunks;
  }

  const pages =
    useMemo(
      () =>
        paginateTests(
          reportTests
        ),
      [
        reportTests,
      ]
    );

  /* ==========================================================
     AUTO SAVE
  ========================================================== */

  useEffect(() => {
    if (
      !patient ||
      Object.keys(
        patient
      ).length === 0
    ) {
      return;
    }

    if (
      !selectedTests.length
    ) {
      return;
    }

    if (
      labSettings.autoSave ===
      false
    ) {
      return;
    }

    const timer =
      setTimeout(
        saveReport,
        1000
      );

    return () =>
      clearTimeout(timer);
  }, [
    patient,
    selectedTests,
    results,
    labSettings.autoSave,
  ]);

  async function saveReport() {
    try {
      setSaveStatus(
        "saving"
      );

      const patientId =
        patient?.patientId ||
        patient?.id;

      if (!patientId) {
        setSaveStatus(
          "error"
        );

        setSaveMessage(
          "Patient ID nahi mila."
        );

        return;
      }

      let currentReportNo =
        localStorage.getItem(
          "nidanCurrentReportNo"
        );

      if (!currentReportNo) {
        currentReportNo =
          `RPT-${Date.now()}`;

        localStorage.setItem(
          "nidanCurrentReportNo",
          currentReportNo
        );
      }

      setReportNo(
        currentReportNo
      );

      const payload = {
        patient,
        selectedTests,
        results,
        reportTests,
        reportNo:
          currentReportNo,
        reportDate:
          new Date().toISOString(),
      };

      const {
        data: existing,
        error: findError,
      } =
        await supabase
          .from("reports")
          .select("id")
          .eq(
            "report_no",
            currentReportNo
          )
          .maybeSingle();

      if (findError) {
        throw findError;
      }

      if (
        existing?.id
      ) {
        const {
          error,
        } =
          await supabase
            .from("reports")
            .update({
              patient_id:
                patientId,

              status:
                "completed",

              report_data:
                payload,
            })
            .eq(
              "id",
              existing.id
            );

        if (error) {
          throw error;
        }
      } else {
        const {
          error,
        } =
          await supabase
            .from("reports")
            .insert([
              {
                report_no:
                  currentReportNo,

                patient_id:
                  patientId,

                status:
                  "completed",

                report_data:
                  payload,
              },
            ]);

        if (error) {
          throw error;
        }
      }

      setSaveStatus(
        "saved"
      );

      setSaveMessage(
        "Saved to Reports"
      );
    } catch (error) {
      console.error(
        "SAVE REPORT ERROR",
        error
      );

      setSaveStatus(
        "error"
      );

      setSaveMessage(
        error?.message ||
          "Report save failed"
      );
    }
  }

  /* ==========================================================
     ACTIONS
  ========================================================== */

  function printReport() {
    window.print();
  }

  function newPatient() {
    const ok =
      window.confirm(
        "Current report clear karke New Patient start karein?"
      );

    if (!ok) return;

    [
      "nidanPatient",
      "nidanSelectedTests",
      "nidanResults",
      "nidanCurrentReportNo",
    ].forEach(
      (key) =>
        localStorage.removeItem(
          key
        )
    );

    router.push(
      "/patients"
    );
  }

  const hasLetterhead =
    Boolean(
      processedLetterhead ||
        labSettings?.letterhead
    );

  return (
    <>
      <main className="reportApp">

        {/* ==================================================
            TOOLBAR
        ================================================== */}

        <div className="reportToolbar">

          <div className="toolbarInfo">

            <strong>
              Final Laboratory Report
            </strong>

            <small>
              Professional A4 Report Preview
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
              className="editBtn"
              onClick={() =>
                router.push(
                  "/results"
                )
              }
            >
              ← Edit Results
            </button>

            <button
              className="printBtn"
              onClick={
                printReport
              }
            >
              🖨 Print / Save PDF
            </button>

            <button
              className="newBtn"
              onClick={
                newPatient
              }
            >
              + New Patient
            </button>

          </div>

        </div>

        {/* ==================================================
            STATUS
        ================================================== */}

        <div className="smartStatus">

          <span>
            {hasLetterhead
              ? "✓ Letterhead applied"
              : "✓ Professional built-in header"}
          </span>

          {hasLetterhead && (
            <>
              <span>
                Report Start:{" "}
                {Math.round(
                  letterheadInfo.contentTop
                )}
                %
              </span>

              <span>
                Report Area:{" "}
                {Math.round(
                  letterheadInfo.contentBottom -
                    letterheadInfo.contentTop
                )}
                %
              </span>

              <span>
                Footer Safe:{" "}
                {Math.round(
                  100 -
                    letterheadInfo.contentBottom
                )}
                %
              </span>
            </>
          )}

        </div>

        {/* ==================================================
            PAGES
        ================================================== */}

        <div className="pagesContainer">

          {pages.map(
            (
              pageTests,
              pageIndex
            ) => (
              <ReportSheet
                key={
                  pageIndex
                }
                pageTests={
                  pageTests
                }
                pageIndex={
                  pageIndex
                }
                totalPages={
                  pages.length
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
                letterhead={
                  processedLetterhead ||
                  labSettings?.letterhead ||
                  ""
                }
                layout={
                  letterheadInfo
                }
              />
            )
          )}

        </div>

      </main>

      {/* ====================================================
          GLOBAL CSS
      ==================================================== */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;

          background: #eef2f7;

          color: #111827;

          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        body {
          overflow-x: hidden;
        }

        /* ==================================================
           APP
        ================================================== */

        .reportApp {
          min-height: 100vh;

          padding: 12px;

          background:
            #eef2f7;
        }

        /* ==================================================
           TOOLBAR
        ================================================== */

        .reportToolbar {
          width: 100%;
          max-width: 1180px;

          margin:
            0 auto 8px;

          padding:
            10px 14px;

          background:
            #ffffff;

          border:
            1px solid #dbe3eb;

          border-radius:
            8px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap: 12px;

          box-shadow:
            0 2px 12px
            rgba(
              15,
              23,
              42,
              .07
            );
        }

        .toolbarInfo {
          display:
            flex;

          flex-direction:
            column;

          gap: 2px;
        }

        .toolbarInfo strong {
          font-size:
            14px;
        }

        .toolbarInfo small {
          font-size:
            8px;

          color:
            #64748b;
        }

        .saving {
          color:
            #b45309 !important;

          font-weight:
            700;
        }

        .saved {
          color:
            #15803d !important;

          font-weight:
            700;
        }

        .error {
          color:
            #dc2626 !important;

          font-weight:
            700;
        }

        .toolbarButtons {
          display:
            flex;

          gap: 6px;
        }

        .toolbarButtons button {
          min-height:
            34px;

          padding:
            7px 12px;

          border-radius:
            6px;

          font-size:
            9px;

          font-weight:
            800;

          cursor:
            pointer;

          background:
            #ffffff;
        }

        .editBtn {
          border:
            1px solid #cbd5e1;

          color:
            #334155;
        }

        .printBtn {
          border:
            1px solid #087f7d;

          background:
            #087f7d !important;

          color:
            #ffffff;
        }

        .newBtn {
          border:
            1px solid #fecaca;

          color:
            #dc2626;
        }

        /* ==================================================
           STATUS
        ================================================== */

        .smartStatus {
          width: 100%;
          max-width: 1180px;

          margin:
            0 auto 8px;

          padding:
            5px 10px;

          background:
            #f0fdf4;

          border:
            1px solid #bbf7d0;

          color:
            #166534;

          border-radius:
            6px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap: 18px;

          font-size:
            8px;

          font-weight:
            700;
        }

        /* ==================================================
           PAGES
        ================================================== */

        .pagesContainer {
          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          gap:
            18px;
        }

        /* ==================================================
           A4
        ================================================== */

        .reportSheet {
          position:
            relative;

          width:
            min(
              210mm,
              calc(100vw - 24px)
            );

          aspect-ratio:
            210 / 297;

          background:
            #ffffff;

          overflow:
            hidden;

          box-shadow:
            0 8px 28px
            rgba(
              15,
              23,
              42,
              .15
            );
        }

        /* ==================================================
           LETTERHEAD
        ================================================== */

        .letterheadImage {
          position:
            absolute;

          inset:
            0;

          width:
            100%;

          height:
            100%;

          object-fit:
            fill;

          z-index:
            0;

          pointer-events:
            none;

          user-select:
            none;
        }

        /* ==================================================
           BUILT-IN HEADER
        ================================================== */

        .nativeHeader {
          position:
            absolute;

          top:
            0;

          left:
            0;

          right:
            0;

          height:
            27mm;

          background:
            #ffffff;

          border-bottom:
            1px solid #111827;

          padding:
            6mm 9mm 3mm;

          z-index:
            2;
        }

        .nativeLabName {
          font-size:
            20px;

          font-weight:
            900;

          letter-spacing:
            .3px;

          color:
            #0f4c5c;
        }

        .nativeSubtitle {
          margin-top:
            2px;

          font-size:
            9px;

          font-weight:
            700;

          color:
            #475569;
        }

        .nativeAddress {
          margin-top:
            4px;

          font-size:
            7px;

          color:
            #334155;
        }

        .nativeHeaderLine {
          height:
            2px;

          margin-top:
            5px;

          background:
            #087f7d;
        }

        /* ==================================================
           BUILT-IN FOOTER
        ================================================== */

        .nativeFooter {
          position:
            absolute;

          left:
            0;

          right:
            0;

          bottom:
            0;

          height:
            15mm;

          border-top:
            1px solid #cbd5e1;

          background:
            #f8fafc;

          display:
            flex;

          flex-direction:
            column;

          justify-content:
            center;

          align-items:
            center;

          z-index:
            2;
        }

        .nativeFooter strong {
          font-size:
            8px;

          color:
            #0f4c5c;
        }

        .nativeFooter span {
          margin-top:
            2px;

          font-size:
            6px;

          color:
            #64748b;
        }

        /* ==================================================
           REPORT CONTENT
        ================================================== */

        .reportContent {
          position:
            absolute;

          z-index:
            5;

          display:
            flex;

          flex-direction:
            column;

          overflow:
            hidden;

          min-height:
            0;

          background:
            transparent;
        }

        /* ==================================================
           PATIENT BOX
        ================================================== */

        .patientBox {
          width:
            100%;

          display:
            grid;

          grid-template-columns:
            1.35fr 1fr 1fr;

          background:
            rgba(
              255,
              255,
              255,
              .97
            );

          border:
            1px solid #334155;

          flex-shrink:
            0;

          margin-bottom:
            3mm;
        }

        .patientColumn {
          min-width:
            0;

          padding:
            2.2mm 2.8mm;

          border-right:
            1px solid #cbd5e1;
        }

        .patientColumn:last-child {
          border-right:
            0;
        }

        .patientLine {
          display:
            flex;

          gap:
            3px;

          margin-bottom:
            1.5px;

          font-size:
            7.1px;

          line-height:
            1.2;
        }

        .patientLabel {
          font-weight:
            800;

          white-space:
            nowrap;
        }

        .patientValue {
          min-width:
            0;

          overflow-wrap:
            anywhere;
        }

        /* ==================================================
           TEST AREA
        ================================================== */

        .testArea {
          flex:
            1;

          min-height:
            0;

          overflow:
            hidden;

          display:
            flex;

          flex-direction:
            column;

          gap:
            3mm;
        }

        .testBlock {
          width:
            100%;

          flex-shrink:
            0;

          background:
            rgba(
              255,
              255,
              255,
              .97
            );

          break-inside:
            avoid;

          page-break-inside:
            avoid;
        }

        .category {
          text-align:
            center;

          font-size:
            6.5px;

          font-weight:
            900;

          letter-spacing:
            .7px;

          color:
            #475569;

          margin-bottom:
            1px;
        }

        .testTitle {
          text-align:
            center;

          font-size:
            9.5px;

          font-weight:
            900;

          color:
            #111827;

          margin-bottom:
            2mm;

          line-height:
            1.1;
        }

        /* ==================================================
           TABLE
        ================================================== */

        .reportTable {
          width:
            100%;

          border-collapse:
            collapse;

          table-layout:
            fixed;

          background:
            #ffffff;
        }

        .reportTable th {
          height:
            5.5mm;

          padding:
            1.1mm 1.3mm;

          border:
            1px solid #8b98a7;

          background:
            #edf2f7;

          font-size:
            6.5px;

          font-weight:
            900;

          text-align:
            center;

          text-transform:
            uppercase;

          line-height:
            1.05;
        }

        .reportTable td {
          padding:
            1mm 1.3mm;

          border:
            1px solid #c5ced8;

          background:
            rgba(
              255,
              255,
              255,
              .98
            );

          font-size:
            7.1px;

          line-height:
            1.1;

          vertical-align:
            middle;

          overflow-wrap:
            anywhere;
        }

        .investigationCol {
          width:
            32%;

          text-align:
            left !important;
        }

        .flagCol {
          width:
            8%;

          text-align:
            center !important;
        }

        .resultCol {
          width:
            16%;

          text-align:
            center !important;
        }

        .referenceCol {
          width:
            29%;

          text-align:
            center !important;
        }

        .unitCol {
          width:
            15%;

          text-align:
            center !important;
        }

        .normalResult {
          text-align:
            center;

          font-weight:
            700;
        }

        .abnormalResult {
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

        .flag {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          min-width:
            14px;

          height:
            12px;

          border-radius:
            3px;

          font-size:
            6px;

          font-weight:
            900;
        }

        .high {
          color:
            #b91c1c;

          background:
            #fee2e2;
        }

        .low {
          color:
            #1d4ed8;

          background:
            #dbeafe;
        }

        /* ==================================================
           SIGNATURE
        ================================================== */

        .signatureArea {
          flex-shrink:
            0;

          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            30mm;

          margin-top:
            3mm;

          padding-top:
            1mm;

          background:
            rgba(
              255,
              255,
              255,
              .96
            );

          break-inside:
            avoid;

          page-break-inside:
            avoid;
        }

        .signature {
          text-align:
            center;

          font-size:
            7px;
        }

        .signatureLine {
          height:
            6mm;

          border-bottom:
            1px solid #333;

          margin-bottom:
            1.5mm;
        }

        .signature strong {
          display:
            block;

          font-size:
            7px;
        }

        .signature span {
          display:
            block;

          color:
            #64748b;

          font-size:
            6px;

          margin-top:
            1px;
        }

        /* ==================================================
           NOTE
        ================================================== */

        .note {
          flex-shrink:
            0;

          margin-top:
            2mm;

          padding:
            1.5mm 2mm;

          border-top:
            1px solid #9ca3af;

          background:
            rgba(
              255,
              255,
              255,
              .95
            );

          font-size:
            5.5px;

          line-height:
            1.25;

          color:
            #475569;
        }

        /* ==================================================
           PAGE NUMBER
        ================================================== */

        .pageNumber {
          position:
            absolute;

          right:
            5mm;

          bottom:
            3mm;

          z-index:
            20;

          font-size:
            6px;

          color:
            #475569;

          background:
            rgba(
              255,
              255,
              255,
              .75
            );

          padding:
            1mm 1.5mm;

          border-radius:
            2px;
        }

        /* ==================================================
           MOBILE
        ================================================== */

        @media (
          max-width: 700px
        ) {

          .reportApp {
            padding:
              5px;
          }

          .reportToolbar {
            flex-direction:
              column;

            align-items:
              stretch;
          }

          .toolbarButtons {
            display:
              grid;

            grid-template-columns:
              1fr 1fr;
          }

          .toolbarButtons button {
            width:
              100%;
          }

          .printBtn {
            grid-column:
              span 2;
          }

          .smartStatus {
            gap:
              7px;

            font-size:
              6.5px;

            flex-wrap:
              wrap;
          }

          .reportSheet {
            width:
              calc(
                100vw - 10px
              );
          }

          .patientLine {
            font-size:
              5.5px;
          }

          .reportTable th {
            font-size:
              5px;
          }

          .reportTable td {
            font-size:
              5.5px;
          }

          .testTitle {
            font-size:
              7px;
          }

          .category {
            font-size:
              5px;
          }

          .signatureArea {
            gap:
              15mm;
          }

          .note {
            font-size:
              4.8px;
          }
        }

        /* ==================================================
           PRINT / A4
        ================================================== */

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

            margin:
              0 !important;

            padding:
              0 !important;

            background:
              #ffffff !important;
          }

          body {
            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;

            overflow:
              visible !important;
          }

          .reportApp {
            width:
              210mm;

            padding:
              0 !important;

            margin:
              0 !important;

            background:
              #ffffff !important;
          }

          .reportToolbar,
          .smartStatus {
            display:
              none !important;
          }

          .pagesContainer {
            width:
              210mm;

            display:
              block;

            margin:
              0;

            padding:
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

            box-shadow:
              none !important;

            overflow:
              hidden !important;

            page-break-after:
              always;

            break-after:
              page;
          }

          .reportSheet:last-child {
            page-break-after:
              auto;

            break-after:
              auto;
          }

          .letterheadImage {
            position:
              absolute !important;

            display:
              block !important;

            width:
              100% !important;

            height:
              100% !important;

            object-fit:
              fill !important;

            z-index:
              0 !important;
          }

          .reportContent {
            overflow:
              hidden !important;
          }

          .reportTable {
            border-collapse:
              collapse !important;
          }

          .reportTable th,
          .reportTable td {
            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;
          }

          .testBlock,
          .patientBox,
          .signatureArea,
          .note {
            break-inside:
              avoid !important;

            page-break-inside:
              avoid !important;
          }

          .nativeHeader,
          .nativeFooter {
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

/* ============================================================
   REPORT SHEET
============================================================ */

function ReportSheet({
  pageTests,
  pageIndex,
  totalPages,
  patient,
  reportDate,
  reportNo,
  labSettings,
  letterhead,
  layout,
}) {
  const hasLetterhead =
    Boolean(letterhead);

  const patientId =
    patient?.patientId ||
    patient?.id ||
    "-";

  const patientName =
    patient?.name ||
    patient?.patientName ||
    "-";

  const age =
    patient?.age ??
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
    patient?.collectionDate ||
    reportDate ||
    "-";

  /*
    ============================================================
    FINAL POSITION FIX

    LETTERHEAD ON:
    Starts around 18%, never lower than 25%.

    LETTERHEAD OFF:
    Starts at 10.5%, directly below header.

    This is the major fix for your screenshot.
  */

  const top = hasLetterhead
    ? Math.max(
        15,
        Math.min(
          25,
          layout?.contentTop ??
            18
        )
      )
    : 10.5;

  const bottom = hasLetterhead
    ? Math.max(
        7,
        Math.min(
          15,
          100 -
            (layout?.contentBottom ??
              87)
        )
      )
    : 7.5;

  const left =
    hasLetterhead
      ? layout?.left ??
        6.5
      : 7;

  const right =
    hasLetterhead
      ? layout?.right ??
        6.5
      : 7;

  const pageTestsSafe =
    Array.isArray(
      pageTests
    )
      ? pageTests
      : [];

  return (
    <div className="reportSheet">

      {/* =====================================================
          LETTERHEAD
      ===================================================== */}

      {hasLetterhead ? (
        <img
          src={letterhead}
          className="letterheadImage"
          alt="Laboratory Letterhead"
          draggable="false"
        />
      ) : (
        <>
          {/* BUILT-IN HEADER */}

          <div className="nativeHeader">

            <div className="nativeLabName">
              {labSettings?.labName ||
                "NIDAN PATHOLOGY LAB"}
            </div>

            <div className="nativeSubtitle">
              Diagnostic & Pathology Laboratory
            </div>

            <div className="nativeAddress">
              {labSettings?.labAddress ||
                "Laboratory Investigation & Diagnostic Services"}

              {labSettings?.phone
                ? ` | ${labSettings.phone}`
                : ""}

              {labSettings?.email
                ? ` | ${labSettings.email}`
                : ""}
            </div>

            <div className="nativeHeaderLine" />

          </div>

          {/* BUILT-IN FOOTER */}

          <div className="nativeFooter">

            <strong>
              {labSettings?.labName ||
                "NIDAN PATHOLOGY LAB"}
            </strong>

            <span>
              Computerised Laboratory Report •
              Please interpret results with
              clinical findings.
            </span>

          </div>
        </>
      )}

      {/* =====================================================
          REPORT CONTENT
      ===================================================== */}

      <div
        className="reportContent"
        style={{
          top:
            `${top}%`,

          bottom:
            `${bottom}%`,

          left:
            `${left}%`,

          right:
            `${right}%`,
        }}
      >

        {/* ===================================================
            PATIENT INFORMATION
        =================================================== */}

        <div className="patientBox">

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
                {labSettings?.labName ||
                  "NIDAN PATHOLOGY LAB"}
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

        </div>

        {/* ===================================================
            TESTS
        =================================================== */}

        <div className="testArea">

          {pageTestsSafe.map(
            (
              test,
              testIndex
            ) => {

              const showFlag =
                labSettings?.showFlag !==
                false;

              const showReference =
                labSettings?.showReferenceRange !==
                false;

              return (
                <section
                  className="testBlock"
                  key={
                    test.id ||
                    testIndex
                  }
                >

                  <div className="category">
                    {String(
                      test.category ||
                        "PATHOLOGY"
                    ).toUpperCase()}
                  </div>

                  <div className="testTitle">
                    {test.name}
                  </div>

                  <table className="reportTable">

                    <colgroup>

                      <col className="investigationCol" />

                      {showFlag && (
                        <col className="flagCol" />
                      )}

                      <col className="resultCol" />

                      {showReference && (
                        <col className="referenceCol" />
                      )}

                      <col className="unitCol" />

                    </colgroup>

                    <thead>

                      <tr>

                        <th>
                          Investigation
                        </th>

                        {showFlag && (
                          <th>
                            Flag
                          </th>
                        )}

                        <th>
                          Result
                        </th>

                        {showReference && (
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

                      {(
                        test.parameters ||
                        []
                      ).map(
                        (
                          parameter,
                          index
                        ) => {

                          const abnormal =
                            Boolean(
                              parameter.flag
                            );

                          const displayResult =
                            parameter.result ===
                              "" ||
                            parameter.result ===
                              null ||
                            parameter.result ===
                              undefined
                              ? "-"
                              : parameter.result;

                          return (
                            <tr
                              key={
                                `${test.id}-${index}`
                              }
                            >

                              <td>
                                {
                                  parameter.name
                                }
                              </td>

                              {showFlag && (
                                <td className="flagCell">

                                  {parameter.flag ? (
                                    <span
                                      className={
                                        `flag ${
                                          parameter.flag ===
                                          "H"
                                            ? "high"
                                            : "low"
                                        }`
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
                                  abnormal
                                    ? "abnormalResult"
                                    : "normalResult"
                                }
                              >
                                {
                                  displayResult
                                }
                              </td>

                              {showReference && (
                                <td>
                                  {
                                    parameter.referenceRange
                                  }
                                </td>
                              )}

                              <td>
                                {
                                  parameter.unit ||
                                  "-"
                                }
                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </section>
              );
            }
          )}

        </div>

        {/* ===================================================
            SIGNATURE
        =================================================== */}

        <div className="signatureArea">

          <div className="signature">

            <div className="signatureLine" />

            <strong>
              Lab Technician
            </strong>

            <span>
              {labSettings?.labName ||
                "NIDAN PATHOLOGY LAB"}
            </span>

          </div>

          <div className="signature">

            <div className="signatureLine" />

            <strong>
              Authorized Signatory
            </strong>

            <span>
              Signature & Seal
            </span>

          </div>

        </div>

        {/* ===================================================
            NOTE
        =================================================== */}

        <div className="note">

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

      {/* =====================================================
          PAGE NUMBER
      ===================================================== */}

      {totalPages > 1 && (
        <div className="pageNumber">
          Page{" "}
          {pageIndex + 1}{" "}
          of{" "}
          {totalPages}
        </div>
      )}

    </div>
  );
}
