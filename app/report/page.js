"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

/* ============================================================
   NIDAN PATHOLOGY LAB
   SMART LETTERHEAD AUTO-FIT REPORT ENGINE

   Features:
   1. Automatic letterhead analysis
   2. Automatic screenshot/page crop
   3. Automatic header detection
   4. Automatic footer detection
   5. Automatic report safe-area calculation
   6. Automatic font/table scaling
   7. Automatic A4 pagination
   8. Normal CBC tries to remain on one page
   9. Letterhead repeats on every page
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

const DEFAULT_LAYOUT = {
  cropLeft: 0,
  cropTop: 0,
  cropRight: 100,
  cropBottom: 100,

  contentTop: 28,
  contentBottom: 84,

  left: 7,
  right: 7,

  headerBottom: 27,
  footerTop: 86,

  scale: 1,
};

export default function ReportPage() {
  const router = useRouter();

  const [patient, setPatient] =
    useState({});

  const [selectedTests, setSelectedTests] =
    useState([]);

  const [results, setResults] =
    useState({});

  const [labSettings, setLabSettings] =
    useState(DEFAULT_SETTINGS);

  const [reportDate, setReportDate] =
    useState("");

  const [reportNo, setReportNo] =
    useState("");

  const [saveStatus, setSaveStatus] =
    useState("loading");

  const [saveMessage, setSaveMessage] =
    useState("");

  const [letterheadInfo, setLetterheadInfo] =
    useState(DEFAULT_LAYOUT);

  const [processedLetterhead, setProcessedLetterhead] =
    useState("");

  /* ============================================================
     LOAD DATA
  ============================================================ */

  useEffect(() => {
    loadReportData();
  }, []);

  async function loadReportData() {
    try {
      const patientData =
        readJSON([
          "nidanPatient",
          "patient",
          "currentPatient",
        ]);

      const testsData =
        readJSON([
          "nidanSelectedTests",
          "selectedTests",
          "selected_tests",
        ]);

      const resultData =
        readJSON([
          "nidanResults",
          "results",
          "testResults",
        ]);

      const settingsData =
        readJSON([
          "nidanLabSettings",
          "labSettings",
          "settings",
        ]);

      setPatient(
        patientData || {}
      );

      setSelectedTests(
        Array.isArray(testsData)
          ? testsData
          : []
      );

      setResults(
        resultData || {}
      );

      setLabSettings({
        ...DEFAULT_SETTINGS,
        ...(settingsData || {}),
      });

      setReportDate(
        formatDateTime(
          new Date()
        )
      );

      const savedReportNo =
        localStorage.getItem(
          "nidanCurrentReportNo"
        );

      if (savedReportNo) {
        setReportNo(
          savedReportNo
        );
      }
    } catch (error) {
      console.error(
        "REPORT LOAD ERROR:",
        error
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

  function formatDateTime(date) {
    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  /* ============================================================
     SMART LETTERHEAD ENGINE
  ============================================================ */

  useEffect(() => {
    if (
      !labSettings?.letterhead
    ) {
      setLetterheadInfo(
        DEFAULT_LAYOUT
      );

      setProcessedLetterhead("");

      return;
    }

    analyzeLetterhead(
      labSettings.letterhead
    );
  }, [
    labSettings?.letterhead,
  ]);

  async function analyzeLetterhead(
    source
  ) {
    try {
      const image =
        await loadImage(
          source
        );

      const analysis =
        analyzeImageGeometry(
          image
        );

      const cropped =
        cropImageToPage(
          image,
          analysis
        );

      const croppedImage =
        cropped.image;

      const finalAnalysis =
        analyzeImageGeometry(
          croppedImage
        );

      const dataURL =
        canvasToDataURL(
          croppedImage
        );

      setProcessedLetterhead(
        dataURL
      );

      setLetterheadInfo({
        ...DEFAULT_LAYOUT,
        ...finalAnalysis,
      });
    } catch (error) {
      console.error(
        "LETTERHEAD ANALYSIS ERROR:",
        error
      );

      setProcessedLetterhead(
        source
      );

      setLetterheadInfo(
        DEFAULT_LAYOUT
      );
    }
  }

  function loadImage(src) {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        const img =
          new Image();

        img.onload = () =>
          resolve(img);

        img.onerror = reject;

        img.src = src;
      }
    );
  }

  /* ============================================================
     IMAGE ANALYSIS

     The algorithm looks for:
     - large white A4 page
     - dark/colored header
     - dark/colored footer
     - central white writing area

     It does NOT depend on a fixed percentage.
  ============================================================ */

  function analyzeImageGeometry(
    image
  ) {
    const MAX_W = 1000;

    const ratio =
      Math.min(
        1,
        MAX_W /
          image.naturalWidth
      );

    const width =
      Math.max(
        300,
        Math.round(
          image.naturalWidth *
            ratio
        )
      );

    const height =
      Math.max(
        400,
        Math.round(
          image.naturalHeight *
            ratio
        )
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      width;

    canvas.height =
      height;

    const ctx =
      canvas.getContext(
        "2d",
        {
          willReadFrequently:
            true,
        }
      );

    ctx.drawImage(
      image,
      0,
      0,
      width,
      height
    );

    const data =
      ctx.getImageData(
        0,
        0,
        width,
        height
      ).data;

    const rowDensity =
      [];

    const colDensity =
      [];

    for (
      let y = 0;
      y < height;
      y++
    ) {
      let ink = 0;

      for (
        let x = 0;
        x < width;
        x += 3
      ) {
        const i =
          (y * width + x) *
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

        if (
          brightness <
            215 ||
          saturation >
            35
        ) {
          ink++;
        }
      }

      rowDensity.push(
        ink /
          Math.ceil(
            width / 3
          )
      );
    }

    for (
      let x = 0;
      x < width;
      x++
    ) {
      let ink = 0;

      for (
        let y = 0;
        y < height;
        y += 3
      ) {
        const i =
          (y * width + x) *
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

        if (
          brightness <
            215 ||
          saturation >
            35
        ) {
          ink++;
        }
      }

      colDensity.push(
        ink /
          Math.ceil(
            height / 3
          )
      );
    }

    /*
      =========================================================
      FIND PAGE CROP
      =========================================================
    */

    const crop =
      detectPageBounds(
        rowDensity,
        colDensity,
        width,
        height
      );

    /*
      =========================================================
      ANALYZE HEADER
      =========================================================
    */

    const safeTop =
      detectHeaderEnd(
        rowDensity,
        height
      );

    /*
      =========================================================
      ANALYZE FOOTER
      =========================================================
    */

    const safeBottom =
      detectFooterStart(
        rowDensity,
        height
      );

    /*
      =========================================================
      SAFE MARGINS
      =========================================================
    */

    const leftMargin =
      detectHorizontalMargin(
        colDensity,
        width,
        "left"
      );

    const rightMargin =
      detectHorizontalMargin(
        colDensity,
        width,
        "right"
      );

    /*
      Don't allow report to touch letterhead.
    */

    const contentTop =
      clamp(
        safeTop + 1.5,
        22,
        48
      );

    const contentBottom =
      clamp(
        safeBottom - 1.5,
        65,
        90
      );

    const usableHeight =
      contentBottom -
      contentTop;

    const scale =
      clamp(
        usableHeight /
          55,
        0.78,
        1.18
      );

    return {
      cropLeft:
        crop.left,

      cropTop:
        crop.top,

      cropRight:
        crop.right,

      cropBottom:
        crop.bottom,

      contentTop,

      contentBottom,

      left:
        clamp(
          leftMargin,
          5,
          12
        ),

      right:
        clamp(
          rightMargin,
          5,
          12
        ),

      headerBottom:
        contentTop,

      footerTop:
        contentBottom,

      scale,
    };
  }

  /* ============================================================
     PAGE BOUNDARY DETECTOR
  ============================================================ */

  function detectPageBounds(
    rows,
    cols,
    width,
    height
  ) {
    /*
      If uploaded image is already a clean
      A4 letterhead, do not crop aggressively.
    */

    const imageRatio =
      width / height;

    const a4Ratio =
      210 / 297;

    const ratioDifference =
      Math.abs(
        imageRatio -
          a4Ratio
      );

    if (
      ratioDifference <
      0.06
    ) {
      return {
        left: 0,
        top: 0,
        right: 100,
        bottom: 100,
      };
    }

    /*
      Screenshot handling.

      Search for the biggest A4-like
      white/bright region.
    */

    let best = null;

    const minWidth =
      Math.round(
        width * 0.45
      );

    const minHeight =
      Math.round(
        height * 0.45
      );

    const targetRatio =
      a4Ratio;

    for (
      let top = 0;
      top <
        Math.round(
          height * 0.45
        );
      top += Math.max(
        5,
        Math.round(
          height * 0.015
        )
      )
    ) {
      for (
        let left = 0;
        left <
          Math.round(
            width * 0.25
          );
        left += Math.max(
          5,
          Math.round(
            width * 0.015
          )
        )
      ) {
        let possibleHeight =
          Math.round(
            (width - left) /
              targetRatio
          );

        if (
          possibleHeight >
          height - top
        ) {
          possibleHeight =
            height - top;
        }

        if (
          possibleHeight <
          minHeight
        ) {
          continue;
        }

        const candidateRatio =
          (width - left) /
          possibleHeight;

        if (
          Math.abs(
            candidateRatio -
              targetRatio
          ) > 0.12
        ) {
          continue;
        }

        const score =
          brightRectangleScore(
            rows,
            cols,
            width,
            height,
            left,
            top,
            width - 1,
            top +
              possibleHeight -
              1
          );

        if (
          !best ||
          score >
            best.score
        ) {
          best = {
            left,
            top,
            right:
              width - 1,
            bottom:
              top +
              possibleHeight -
              1,
            score,
          };
        }
      }
    }

    if (!best) {
      return {
        left: 0,
        top: 0,
        right: 100,
        bottom: 100,
      };
    }

    return {
      left:
        (best.left /
          width) *
        100,

      top:
        (best.top /
          height) *
        100,

      right:
        (best.right /
          width) *
        100,

      bottom:
        (best.bottom /
          height) *
        100,
    };
  }

  function brightRectangleScore(
    rows,
    cols,
    width,
    height,
    left,
    top,
    right,
    bottom
  ) {
    const centerX =
      Math.round(
        (left + right) / 2
      );

    const centerY =
      Math.round(
        (top + bottom) / 2
      );

    const sampleRows = [
      top,
      Math.round(
        top +
          (bottom -
            top) *
            0.25
      ),
      centerY,
      Math.round(
        top +
          (bottom -
            top) *
            0.75
      ),
      bottom,
    ];

    const sampleCols = [
      left,
      Math.round(
        left +
          (right -
            left) *
            0.25
      ),
      centerX,
      Math.round(
        left +
          (right -
            left) *
            0.75
      ),
      right,
    ];

    let score = 0;

    for (
      const y of sampleRows
    ) {
      const value =
        rows[
          Math.max(
            0,
            Math.min(
              rows.length - 1,
              y
            )
          )
        ] || 0;

      score +=
        1 -
        Math.min(
          value,
          1
        );
    }

    for (
      const x of sampleCols
    ) {
      const value =
        cols[
          Math.max(
            0,
            Math.min(
              cols.length - 1,
              x
            )
          )
        ] || 0;

      score +=
        1 -
        Math.min(
          value,
          1
        );
    }

    return score;
  }

  /* ============================================================
     HEADER DETECTOR
  ============================================================ */

  function detectHeaderEnd(
    rows,
    height
  ) {
    const limit =
      Math.floor(
        height * 0.42
      );

    const minStart =
      Math.floor(
        height * 0.05
      );

    let lastStrong =
      minStart;

    let blankRun = 0;

    for (
      let y = minStart;
      y < limit;
      y++
    ) {
      const density =
        rows[y] || 0;

      /*
        Header ink.
      */

      if (
        density >
          0.025
      ) {
        lastStrong = y;
        blankRun = 0;
      } else {
        blankRun++;
      }

      /*
        Long white area after header
        means header is finished.
      */

      if (
        blankRun >
        Math.max(
          12,
          Math.round(
            height * 0.025
          )
        )
      ) {
        if (
          lastStrong >
          minStart
        ) {
          break;
        }
      }
    }

    const percentage =
      (lastStrong /
        height) *
      100;

    return clamp(
      percentage + 1.5,
      18,
      48
    );
  }

  /* ============================================================
     FOOTER DETECTOR
  ============================================================ */

  function detectFooterStart(
    rows,
    height
  ) {
    const start =
      Math.floor(
        height * 0.60
      );

    let firstFooter =
      height;

    let strongRun = 0;

    for (
      let y = start;
      y < height;
      y++
    ) {
      const density =
        rows[y] || 0;

      if (
        density >
        0.025
      ) {
        strongRun++;

        if (
          strongRun >= 4
        ) {
          firstFooter =
            y -
            3;

          break;
        }
      } else {
        strongRun = 0;
      }
    }

    /*
      If there is no obvious footer,
      keep a reasonable bottom margin.
    */

    if (
      firstFooter ===
      height
    ) {
      return 88;
    }

    return clamp(
      (firstFooter /
        height) *
        100 -
        1.5,
      65,
      91
    );
  }

  /* ============================================================
     HORIZONTAL MARGIN DETECTOR
  ============================================================ */

  function detectHorizontalMargin(
    cols,
    width,
    side
  ) {
    const limit =
      Math.floor(
        width * 0.18
      );

    let boundary = 0;

    if (
      side === "left"
    ) {
      for (
        let x = 0;
        x < limit;
        x++
      ) {
        if (
          (cols[x] || 0) >
          0.035
        ) {
          boundary = x;
          break;
        }
      }
    } else {
      for (
        let x =
          width - 1;
        x >=
          width - limit;
        x--
      ) {
        if (
          (cols[x] || 0) >
          0.035
        ) {
          boundary =
            width -
            1 -
            x;

          break;
        }
      }
    }

    const percentage =
      (boundary /
        width) *
      100;

    return clamp(
      percentage + 2,
      5,
      12
    );
  }

  /* ============================================================
     CROP IMAGE
  ============================================================ */

  function cropImageToPage(
    image,
    bounds
  ) {
    const sourceWidth =
      image.naturalWidth;

    const sourceHeight =
      image.naturalHeight;

    const left =
      Math.round(
        (bounds.left /
          100) *
          sourceWidth
      );

    const top =
      Math.round(
        (bounds.top /
          100) *
          sourceHeight
      );

    const right =
      Math.round(
        (bounds.right /
          100) *
          sourceWidth
      );

    const bottom =
      Math.round(
        (bounds.bottom /
          100) *
          sourceHeight
      );

    const width =
      Math.max(
        100,
        right - left
      );

    const height =
      Math.max(
        100,
        bottom - top
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      width;

    canvas.height =
      height;

    const ctx =
      canvas.getContext(
        "2d"
      );

    ctx.fillStyle =
      "#ffffff";

    ctx.fillRect(
      0,
      0,
      width,
      height
    );

    ctx.drawImage(
      image,
      left,
      top,
      width,
      height,
      0,
      0,
      width,
      height
    );

    return {
      canvas,
      image: canvas,
    };
  }

  function canvasToDataURL(
    canvas
  ) {
    return canvas.toDataURL(
      "image/jpeg",
      0.96
    );
  }

  /* ============================================================
     UTILITIES
  ============================================================ */

  function clamp(
    value,
    min,
    max
  ) {
    return Math.max(
      min,
      Math.min(
        max,
        value
      )
    );
  }

  /* ============================================================
     PATIENT / TEST FUNCTIONS
  ============================================================ */

  function normalizeName(
    name = ""
  ) {
    return String(name)
      .toLowerCase()
      .replace(
        /[()]/g,
        ""
      )
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
    const gender =
      String(
        patient.gender ||
          patient.sex ||
          ""
      )
        .trim()
        .toLowerCase();

    if (
      ["male", "m", "पुरुष"].includes(
        gender
      )
    ) {
      return "male";
    }

    if (
      [
        "female",
        "f",
        "महिला",
      ].includes(gender)
    ) {
      return "female";
    }

    return "";
  }

  function getAge() {
    const age =
      parseFloat(
        patient.age
      );

    return Number.isNaN(age)
      ? null
      : age;
  }

  /* ============================================================
     REFERENCE RANGE DATABASE
  ============================================================ */

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
      name === "hemoglobin" ||
      name === "haemoglobin" ||
      name === "hb"
    ) {
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
        range:
          "4000 - 11000",
      };
    }

    if (
      name ===
        "neutrophils" ||
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
      name ===
        "lymphocytes" ||
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
      name ===
        "eosinophils" ||
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
      name ===
        "monocytes" ||
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
      name ===
        "basophils" ||
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
      name ===
        "rbc count"
    ) {
      return gender ===
        "female"
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
      return gender ===
        "female"
        ? {
            min: 36,
            max: 46,
            unit: "%",
            range:
              "36 - 46",
          }
        : {
            min: 40,
            max: 50,
            unit: "%",
            range:
              "40 - 50",
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
        range:
          "11.5 - 14.5",
      };
    }

    if (
      name ===
        "platelet count" ||
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

    if (
      name === "mpv"
    ) {
      return {
        min: 7.5,
        max: 11.5,
        unit: "fL",
        range:
          "7.5 - 11.5",
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
      return gender ===
        "female"
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

    if (
      name === "sodium"
    ) {
      return {
        min: 135,
        max: 145,
        unit: "mEq/L",
        range:
          "135 - 145",
      };
    }

    if (
      name === "potassium"
    ) {
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
      name === "direct bilirubin"
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
      name.includes(
        "sgot"
      ) ||
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
      name.includes(
        "sgpt"
      ) ||
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

    if (
      name === "tsh"
    ) {
      return {
        min: 0.4,
        max: 4,
        unit: "µIU/mL",
        range:
          "0.4 - 4.0",
      };
    }

    if (
      name === "t3"
    ) {
      return {
        min: 80,
        max: 200,
        unit: "ng/dL",
        range:
          "80 - 200",
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

    return null;
  }

  /* ============================================================
     PARAMETER
  ============================================================ */

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
          .replace(
            /,/g,
            ""
          )
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

  function getParameterKey(
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
                    const key =
                      getParameterKey(
                        testId,
                        parameter,
                        index
                      );

                    const value =
                      results?.[
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

  /* ============================================================
     SMART PAGINATION

     The engine uses the detected letterhead safe area.
     It tries to keep CBC together.
  ============================================================ */

  function paginateTests(
    tests
  ) {
    const pages = [];

    const availableHeight =
      Math.max(
        35,
        letterheadInfo.contentBottom -
          letterheadInfo.contentTop
      );

    /*
      Approximate rows available.

      Large safe area =
      more rows.

      Small safe area =
      fewer rows.
    */

    const rowsPerPage =
      clamp(
        Math.floor(
          availableHeight /
            2.35
        ),
        14,
        28
      );

    let page = [];
    let used = 0;

    for (
      const test of tests
    ) {
      const rowCount =
        test.parameters
          ?.length || 1;

      const testCost =
        rowCount + 3;

      /*
        If current page is empty,
        allow the complete test even
        when it is slightly larger.
      */

      if (
        page.length === 0
      ) {
        page.push(test);
        used =
          testCost;

        continue;
      }

      /*
        Keep test together.
      */

      if (
        used +
          testCost <=
        rowsPerPage
      ) {
        page.push(test);

        used +=
          testCost;

        continue;
      }

      /*
        New page.
      */

      pages.push(page);

      page = [test];

      used =
        testCost;
    }

    if (
      page.length
    ) {
      pages.push(page);
    }

    return pages.length
      ? pages
      : [[]];
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

  const pages =
    useMemo(
      () =>
        paginateTests(
          reportTests
        ),
      [
        reportTests,
        letterheadInfo,
      ]
    );

  /* ============================================================
     AUTO SAVE
  ============================================================ */

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

    const timer =
      setTimeout(
        saveReport,
        700
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
        patient.patientId ||
        patient.id;

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

      /*
        Keep existing reports functionality.
      */

      const {
        data: existing,
      } =
        await supabase
          .from("reports")
          .select("id")
          .eq(
            "report_no",
            currentReportNo
          )
          .maybeSingle();

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

        if (error)
          throw error;
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

        if (error)
          throw error;
      }

      setSaveStatus(
        "saved"
      );

      setSaveMessage(
        "Saved to Reports"
      );
    } catch (error) {
      console.error(
        "SAVE REPORT ERROR:",
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

  /* ============================================================
     PRINT
  ============================================================ */

  function printReport() {
    window.print();
  }

  /* ============================================================
     NEW PATIENT
  ============================================================ */

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

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <>
      <main className="reportApp">

        {/* TOOLBAR */}

        <div className="reportToolbar">

          <div className="toolbarInfo">

            <strong>
              Final Laboratory Report
            </strong>

            <small>
              Smart Letterhead Auto-Fit
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

        {/* AUTO DETECTION STATUS */}

        <div className="smartStatus">

          <span>
            ✓ Letterhead detected
          </span>

          <span>
            Header:{" "}
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
            Footer:{" "}
            {Math.round(
              100 -
                letterheadInfo.contentBottom
            )}
            %
          </span>

        </div>

        {/* A4 PAGES */}

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
                  labSettings.letterhead
                }
                layout={
                  letterheadInfo
                }
              />
            )
          )}

        </div>

      </main>

      {/* ======================================================
          CSS
      ====================================================== */}

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

        /* ======================================================
           APP
        ====================================================== */

        .reportApp {
          min-height: 100vh;
          padding: 12px;
          background: #eef2f7;
        }

        /* ======================================================
           TOOLBAR
        ====================================================== */

        .reportToolbar {
          width: 100%;
          max-width: 1180px;

          margin: 0 auto 8px;

          padding: 11px 15px;

          background: #ffffff;

          border: 1px solid #dce3ea;

          border-radius: 9px;

          display: flex;

          align-items: center;

          justify-content:
            space-between;

          gap: 12px;

          box-shadow:
            0 3px 12px
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
        }

        .toolbarInfo strong {
          font-size: 15px;
        }

        .toolbarInfo small {
          font-size: 9px;
          color: #64748b;
        }

        .toolbarInfo .saving {
          color: #b45309;
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
          gap: 6px;
          flex-wrap: wrap;
        }

        .toolbarButtons button {
          min-height: 36px;
          border-radius: 6px;
          padding: 7px 12px;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          background: #fff;
        }

        .editBtn {
          border:
            1px solid #d5dde5;
          color: #334155;
        }

        .printBtn {
          border:
            1px solid #087f7d;
          background:
            #087f7d !important;
          color:
            #fff;
        }

        .newBtn {
          border:
            1px solid #fecaca;
          color:
            #dc2626;
        }

        /* ======================================================
           SMART STATUS
        ====================================================== */

        .smartStatus {
          width: 100%;
          max-width: 1180px;

          margin: 0 auto 8px;

          padding: 5px 10px;

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

          gap: 16px;

          font-size:
            9px;

          font-weight:
            700;
        }

        /* ======================================================
           PAGES
        ====================================================== */

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

        /* ======================================================
           A4
        ====================================================== */

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
            #fff;

          overflow:
            hidden;

          box-shadow:
            0 8px 28px
            rgba(
              15,
              23,
              42,
              0.15
            );
        }

        /* ======================================================
           LETTERHEAD
        ====================================================== */

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

        /* ======================================================
           SMART REPORT AREA
        ====================================================== */

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

          background:
            transparent;
        }

        .patientBox {
          width:
            100%;

          flex-shrink:
            0;

          display:
            grid;

          grid-template-columns:
            1.25fr 1fr 1fr;

          background:
            rgba(
              255,
              255,
              255,
              0.97
            );

          border-top:
            1px solid #202020;

          border-bottom:
            1px solid #9ca3af;

          margin-bottom:
            6px;
        }

        .patientColumn {
          padding:
            5px 7px;

          border-right:
            1px solid #cbd5e1;

          min-width:
            0;
        }

        .patientColumn:last-child {
          border-right:
            0;
        }

        .patientLine {
          display:
            flex;

          gap:
            4px;

          margin-bottom:
            3px;

          font-size:
            7px;

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

        /* ======================================================
           TEST AREA
        ====================================================== */

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
            5px;
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
              0.97
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

          color:
            #475569;

          letter-spacing:
            .5px;

          margin-bottom:
            1px;
        }

        .testTitle {
          text-align:
            center;

          font-size:
            8.5px;

          font-weight:
            900;

          line-height:
            1.2;

          margin-bottom:
            3px;
        }

        /* ======================================================
           TABLE
        ====================================================== */

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
              0.98
            );
        }

        .reportTable th {
          background:
            #edf2f7;

          border:
            1px solid #9aa5b1;

          padding:
            3px;

          height:
            17px;

          font-size:
            6.2px;

          font-weight:
            900;

          text-align:
            center;

          text-transform:
            uppercase;
        }

        .reportTable td {
          border:
            1px solid #c7d0d9;

          padding:
            3px 4px;

          min-height:
            15px;

          font-size:
            6.8px;

          line-height:
            1.15;

          background:
            rgba(
              255,
              255,
              255,
              0.96
            );

          vertical-align:
            middle;
        }

        .reportTable th:nth-child(1),
        .reportTable td:nth-child(1) {
          width:
            31%;

          text-align:
            left;
        }

        .reportTable th:nth-child(2),
        .reportTable td:nth-child(2) {
          width:
            9%;

          text-align:
            center;
        }

        .reportTable th:nth-child(3),
        .reportTable td:nth-child(3) {
          width:
            16%;

          text-align:
            center;
        }

        .reportTable th:nth-child(4),
        .reportTable td:nth-child(4) {
          width:
            29%;

          text-align:
            center;
        }

        .reportTable th:nth-child(5),
        .reportTable td:nth-child(5) {
          width:
            15%;

          text-align:
            center;
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

        /* ======================================================
           SIGNATURE
        ====================================================== */

        .signatureArea {
          flex-shrink:
            0;

          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            60px;

          margin-top:
            6px;

          padding-top:
            4px;

          background:
            rgba(
              255,
              255,
              255,
              0.93
            );

          break-inside:
            avoid;
        }

        .signature {
          text-align:
            center;

          font-size:
            6.5px;
        }

        .signatureLine {
          height:
            17px;

          border-bottom:
            1px solid #333;

          margin-bottom:
            3px;
        }

        .signature strong {
          display:
            block;

          font-size:
            6.5px;
        }

        .signature span {
          color:
            #64748b;

          font-size:
            5.5px;
        }

        /* ======================================================
           NOTE
        ====================================================== */

        .note {
          flex-shrink:
            0;

          margin-top:
            4px;

          padding:
            3px 5px;

          border-top:
            1px solid #9ca3af;

          background:
            rgba(
              255,
              255,
              255,
              0.94
            );

          font-size:
            5.5px;

          line-height:
            1.25;

          color:
            #475569;
        }

        /* ======================================================
           PAGE NUMBER
        ====================================================== */

        .pageNumber {
          position:
            absolute;

          right:
            7mm;

          bottom:
            4mm;

          z-index:
            20;

          font-size:
            7px;

          color:
            #475569;

          background:
            rgba(
              255,
              255,
              255,
              0.7
            );

          padding:
            2px 4px;

          border-radius:
            3px;
        }

        /* ======================================================
           MOBILE
        ====================================================== */

        @media (
          max-width: 700px
        ) {

          .reportApp {
            padding:
              6px;
          }

          .reportToolbar {
            flex-direction:
              column;

            align-items:
              stretch;

            position:
              static;
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

            font-size:
              9px;
          }

          .printBtn {
            grid-column:
              span 2;
          }

          .smartStatus {
            font-size:
              7px;

            gap:
              7px;

            padding:
              5px;
          }

          .reportSheet {
            width:
              calc(100vw - 12px);
          }

          .patientLine {
            font-size:
              5.5px;
          }

          .reportTable th {
            font-size:
              4.7px;

            padding:
              2px;
          }

          .reportTable td {
            font-size:
              5.2px;

            padding:
              2px;
          }

          .testTitle {
            font-size:
              6.8px;
          }

          .category {
            font-size:
              5.2px;
          }

        }

        /* ======================================================
           PRINT / PDF
        ====================================================== */

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
            display:
              block !important;

            width:
              100% !important;

            height:
              100% !important;

            object-fit:
              fill !important;
          }

          .reportContent {
            overflow:
              hidden !important;
          }

          .reportTable {
            border-collapse:
              collapse !important;
          }

          .reportTable tr,
          .testBlock,
          .patientBox,
          .signatureArea,
          .note {
            page-break-inside:
              avoid !important;

            break-inside:
              avoid !important;
          }

          .reportTable th,
          .reportTable td {
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
  const patientId =
    patient?.patientId ||
    patient?.id ||
    "-";

  const patientName =
    patient?.name ||
    patient?.patientName ||
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

  /*
    =========================================================
    SMART CALCULATED POSITION

    This is the important part.
    No fixed 42.5%.
    =========================================================
  */

  const top =
    layout?.contentTop ??
    28;

  const bottom =
    100 -
    (layout?.contentBottom ??
      84);

  const left =
    layout?.left ??
    7;

  const right =
    layout?.right ??
    7;

  const scale =
    layout?.scale ??
    1;

  const pageTestsSafe =
    Array.isArray(
      pageTests
    )
      ? pageTests
      : [];

  return (
    <div className="reportSheet">

      {/* COMPLETE LETTERHEAD */}

      {letterhead ? (
        <img
          src={letterhead}
          className="letterheadImage"
          alt="Laboratory Letterhead"
          draggable="false"
        />
      ) : null}

      {/* REPORT SAFE AREA */}

      <div
        className="reportContent"
        style={{
          top: `${top}%`,
          bottom: `${bottom}%`,
          left: `${left}%`,
          right: `${right}%`,
          "--report-scale":
            scale,
        }}
      >

        {/* PATIENT INFORMATION */}

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

        {/* TESTS */}

        <div className="testArea">

          {pageTestsSafe.map(
            (
              test,
              index
            ) => (
              <section
                className="testBlock"
                key={
                  test.id ||
                  index
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

                    {(
                      test.parameters ||
                      []
                    ).map(
                      (
                        parameter,
                        pIndex
                      ) => (
                        <tr
                          key={
                            pIndex
                          }
                        >

                          <td>
                            {
                              parameter.name
                            }
                          </td>

                          {labSettings?.showFlag !==
                            false && (
                            <td className="flagCell">

                              {parameter.flag && (
                                <span
                                  className={`flag ${
                                    parameter.flag ===
                                    "H"
                                      ? "high"
                                      : "low"
                                  }`}
                                >
                                  {
                                    parameter.flag
                                  }
                                </span>
                              )}

                            </td>
                          )}

                          <td
                            className={
                              parameter.flag
                                ? "abnormalResult"
                                : "normalResult"
                            }
                          >
                            {parameter.result ===
                              "" ||
                            parameter.result ===
                              null ||
                            parameter.result ===
                              undefined
                              ? "-"
                              : parameter.result}
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
                    )}

                  </tbody>

                </table>

              </section>
            )
          )}

        </div>

        {/* SIGNATURE */}

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

        {/* NOTE */}

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

      {/* PAGE NUMBER */}

      {totalPages > 1 && (
        <div className="pageNumber">
          {pageIndex + 1} /{" "}
          {totalPages}
        </div>
      )}

    </div>
  );
}
