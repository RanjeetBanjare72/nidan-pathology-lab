"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/*
  ============================================================
  NIDAN PATHOLOGY LAB
  MASTER TEST DATABASE

  IMPORTANT:
  Reference ranges can vary by:
  - Analyzer
  - Laboratory method
  - Age
  - Sex
  - Pregnancy
  - Local laboratory validation

  Verify ranges before clinical use.
  ============================================================
*/

const MASTER_TESTS = [
  // =========================================================
  // HEMATOLOGY
  // =========================================================

  {
    id: "cbc",
    name: "Complete Blood Count (CBC)",
    short: "CBC",
    icon: "🩸",
    price: 250,
    category: "Hematology",
    tests: [
      {
        name: "Haemoglobin",
        unit: "g/dL",
        min: 13,
        max: 17,
        range: "Male: 13-17 | Female: 12-15",
      },
      {
        name: "Total Leucocyte Count (TLC)",
        unit: "/cumm",
        min: 4000,
        max: 11000,
        range: "4000-11000",
      },
      {
        name: "Neutrophils",
        unit: "%",
        min: 40,
        max: 75,
        range: "40-75",
      },
      {
        name: "Lymphocytes",
        unit: "%",
        min: 20,
        max: 40,
        range: "20-40",
      },
      {
        name: "Eosinophils",
        unit: "%",
        min: 1,
        max: 6,
        range: "1-6",
      },
      {
        name: "Monocytes",
        unit: "%",
        min: 1,
        max: 10,
        range: "1-10",
      },
      {
        name: "Basophils",
        unit: "%",
        min: 0,
        max: 1,
        range: "0-1",
      },
      {
        name: "RBC Count",
        unit: "million/cumm",
        min: 4.5,
        max: 6.0,
        range: "Male: 4.5-6.0 | Female: 4.0-5.5",
      },
      {
        name: "PCV / Haematocrit",
        unit: "%",
        min: 40,
        max: 50,
        range: "Male: 40-50 | Female: 36-46",
      },
      {
        name: "MCV",
        unit: "fL",
        min: 80,
        max: 100,
        range: "80-100",
      },
      {
        name: "MCH",
        unit: "pg",
        min: 27,
        max: 32,
        range: "27-32",
      },
      {
        name: "MCHC",
        unit: "g/dL",
        min: 32,
        max: 36,
        range: "32-36",
      },
      {
        name: "RDW-CV",
        unit: "%",
        min: 11.5,
        max: 14.5,
        range: "11.5-14.5",
      },
      {
        name: "Platelet Count",
        unit: "Lac/cumm",
        min: 1.5,
        max: 4.5,
        range: "1.5-4.5",
      },
      {
        name: "MPV",
        unit: "fL",
        min: 7.5,
        max: 11.5,
        range: "7.5-11.5",
      },
      {
        name: "PDW",
        unit: "%",
        min: 9,
        max: 17,
        range: "9-17",
      },
      {
        name: "PCT",
        unit: "%",
        min: 0.15,
        max: 0.40,
        range: "0.15-0.40",
      },
    ],
  },

  {
    id: "hb",
    name: "Haemoglobin",
    short: "Hb",
    icon: "🩸",
    price: 100,
    category: "Hematology",
    tests: [
      {
        name: "Haemoglobin",
        unit: "g/dL",
        min: 13,
        max: 17,
        range: "Male: 13-17 | Female: 12-15",
      },
    ],
  },

  {
    id: "esr",
    name: "Erythrocyte Sedimentation Rate",
    short: "ESR",
    icon: "⏱️",
    price: 100,
    category: "Hematology",
    tests: [
      {
        name: "ESR",
        unit: "mm/hr",
        min: 0,
        max: 20,
        range: "Male: 0-15 | Female: 0-20",
      },
    ],
  },

  {
    id: "reticulocyte",
    name: "Reticulocyte Count",
    short: "Reticulocyte",
    icon: "🩸",
    price: 200,
    category: "Hematology",
    tests: [
      {
        name: "Reticulocyte Count",
        unit: "%",
        min: 0.5,
        max: 2.5,
        range: "0.5-2.5",
      },
    ],
  },

  // =========================================================
  // BIOCHEMISTRY
  // =========================================================

  {
    id: "fbs",
    name: "Fasting Blood Sugar",
    short: "FBS",
    icon: "🩸",
    price: 100,
    category: "Biochemistry",
    tests: [
      {
        name: "Fasting Blood Sugar",
        unit: "mg/dL",
        min: 70,
        max: 99,
        range: "70-99",
      },
    ],
  },

  {
    id: "ppbs",
    name: "Post Prandial Blood Sugar",
    short: "PPBS",
    icon: "🩸",
    price: 100,
    category: "Biochemistry",
    tests: [
      {
        name: "Post Prandial Blood Sugar",
        unit: "mg/dL",
        min: 70,
        max: 140,
        range: "<140",
      },
    ],
  },

  {
    id: "rbs",
    name: "Random Blood Sugar",
    short: "RBS",
    icon: "🩸",
    price: 100,
    category: "Biochemistry",
    tests: [
      {
        name: "Random Blood Sugar",
        unit: "mg/dL",
        min: 70,
        max: 140,
        range: "70-140",
      },
    ],
  },

  {
    id: "hba1c",
    name: "Glycated Haemoglobin",
    short: "HbA1c",
    icon: "💉",
    price: 450,
    category: "Biochemistry",
    tests: [
      {
        name: "HbA1c",
        unit: "%",
        min: 4,
        max: 5.6,
        range: "Normal: <5.7 | Prediabetes: 5.7-6.4 | Diabetes: ≥6.5",
      },
    ],
  },

  {
    id: "kft",
    name: "Kidney Function Test",
    short: "KFT / RFT",
    icon: "🧪",
    price: 500,
    category: "Biochemistry",
    tests: [
      {
        name: "Blood Urea",
        unit: "mg/dL",
        min: 15,
        max: 40,
        range: "15-40",
      },
      {
        name: "Serum Creatinine",
        unit: "mg/dL",
        min: 0.6,
        max: 1.3,
        range: "0.6-1.3",
      },
      {
        name: "Uric Acid",
        unit: "mg/dL",
        min: 3.5,
        max: 7.2,
        range: "Male: 3.5-7.2 | Female: 2.6-6.0",
      },
      {
        name: "BUN",
        unit: "mg/dL",
        min: 7,
        max: 20,
        range: "7-20",
      },
      {
        name: "Sodium",
        unit: "mmol/L",
        min: 135,
        max: 145,
        range: "135-145",
      },
      {
        name: "Potassium",
        unit: "mmol/L",
        min: 3.5,
        max: 5.1,
        range: "3.5-5.1",
      },
      {
        name: "Chloride",
        unit: "mmol/L",
        min: 98,
        max: 107,
        range: "98-107",
      },
    ],
  },

  {
    id: "lft",
    name: "Liver Function Test",
    short: "LFT",
    icon: "🧪",
    price: 500,
    category: "Biochemistry",
    tests: [
      {
        name: "Total Bilirubin",
        unit: "mg/dL",
        min: 0.3,
        max: 1.2,
        range: "0.3-1.2",
      },
      {
        name: "Direct Bilirubin",
        unit: "mg/dL",
        min: 0,
        max: 0.3,
        range: "0-0.3",
      },
      {
        name: "Indirect Bilirubin",
        unit: "mg/dL",
        min: 0.2,
        max: 0.9,
        range: "0.2-0.9",
      },
      {
        name: "SGOT / AST",
        unit: "U/L",
        min: 5,
        max: 40,
        range: "5-40",
      },
      {
        name: "SGPT / ALT",
        unit: "U/L",
        min: 5,
        max: 40,
        range: "5-40",
      },
      {
        name: "Alkaline Phosphatase",
        unit: "U/L",
        min: 44,
        max: 147,
        range: "44-147",
      },
      {
        name: "Total Protein",
        unit: "g/dL",
        min: 6.0,
        max: 8.3,
        range: "6.0-8.3",
      },
      {
        name: "Albumin",
        unit: "g/dL",
        min: 3.5,
        max: 5.0,
        range: "3.5-5.0",
      },
      {
        name: "Globulin",
        unit: "g/dL",
        min: 2.0,
        max: 3.5,
        range: "2.0-3.5",
      },
      {
        name: "A/G Ratio",
        unit: "Ratio",
        min: 1.0,
        max: 2.5,
        range: "1.0-2.5",
      },
    ],
  },

  {
    id: "lipid",
    name: "Lipid Profile",
    short: "Lipid Profile",
    icon: "❤️",
    price: 500,
    category: "Biochemistry",
    tests: [
      {
        name: "Total Cholesterol",
        unit: "mg/dL",
        min: 0,
        max: 199,
        range: "Desirable: <200",
      },
      {
        name: "Triglycerides",
        unit: "mg/dL",
        min: 0,
        max: 149,
        range: "Normal: <150",
      },
      {
        name: "HDL Cholesterol",
        unit: "mg/dL",
        range: "Male: >40 | Female: >50",
      },
      {
        name: "LDL Cholesterol",
        unit: "mg/dL",
        min: 0,
        max: 99,
        range: "Optimal: <100",
      },
      {
        name: "VLDL Cholesterol",
        unit: "mg/dL",
        min: 5,
        max: 40,
        range: "5-40",
      },
    ],
  },

  {
    id: "calcium",
    name: "Serum Calcium",
    short: "Calcium",
    icon: "🧪",
    price: 200,
    category: "Biochemistry",
    tests: [
      {
        name: "Serum Calcium",
        unit: "mg/dL",
        min: 8.5,
        max: 10.5,
        range: "8.5-10.5",
      },
    ],
  },

  {
    id: "phosphorus",
    name: "Serum Phosphorus",
    short: "Phosphorus",
    icon: "🧪",
    price: 200,
    category: "Biochemistry",
    tests: [
      {
        name: "Serum Phosphorus",
        unit: "mg/dL",
        min: 2.5,
        max: 4.5,
        range: "2.5-4.5",
      },
    ],
  },

  {
    id: "amylase",
    name: "Serum Amylase",
    short: "Amylase",
    icon: "🧪",
    price: 400,
    category: "Biochemistry",
    tests: [
      {
        name: "Serum Amylase",
        unit: "U/L",
        min: 30,
        max: 110,
        range: "30-110",
      },
    ],
  },

  {
    id: "lipase",
    name: "Serum Lipase",
    short: "Lipase",
    icon: "🧪",
    price: 500,
    category: "Biochemistry",
    tests: [
      {
        name: "Serum Lipase",
        unit: "U/L",
        min: 13,
        max: 60,
        range: "13-60",
      },
    ],
  },

  // =========================================================
  // THYROID / HORMONE
  // =========================================================

  {
    id: "thyroid",
    name: "Thyroid Profile",
    short: "T3 T4 TSH",
    icon: "🧬",
    price: 600,
    category: "Hormone",
    tests: [
      {
        name: "T3",
        unit: "ng/dL",
        min: 80,
        max: 200,
        range: "80-200",
      },
      {
        name: "T4",
        unit: "µg/dL",
        min: 5.1,
        max: 14.1,
        range: "5.1-14.1",
      },
      {
        name: "TSH",
        unit: "µIU/mL",
        min: 0.4,
        max: 4.0,
        range: "0.4-4.0",
      },
    ],
  },

  {
    id: "tsh",
    name: "Thyroid Stimulating Hormone",
    short: "TSH",
    icon: "🧬",
    price: 300,
    category: "Hormone",
    tests: [
      {
        name: "TSH",
        unit: "µIU/mL",
        min: 0.4,
        max: 4.0,
        range: "0.4-4.0",
      },
    ],
  },

  // =========================================================
  // SEROLOGY
  // =========================================================

  {
    id: "widal",
    name: "Widal Test",
    short: "Widal",
    icon: "🧫",
    price: 200,
    category: "Serology",
    tests: [
      {
        name: "S. Typhi O",
        unit: "Titre",
        range: "Report titre",
      },
      {
        name: "S. Typhi H",
        unit: "Titre",
        range: "Report titre",
      },
      {
        name: "S. Typhi AH",
        unit: "Titre",
        range: "Report titre",
      },
      {
        name: "S. Typhi BH",
        unit: "Titre",
        range: "Report titre",
      },
    ],
  },

  {
    id: "crp",
    name: "C-Reactive Protein",
    short: "CRP",
    icon: "🧫",
    price: 350,
    category: "Serology",
    tests: [
      {
        name: "C-Reactive Protein",
        unit: "mg/L",
        min: 0,
        max: 6,
        range: "<6",
      },
    ],
  },

  {
    id: "ra",
    name: "Rheumatoid Factor",
    short: "RA Factor",
    icon: "🧫",
    price: 300,
    category: "Serology",
    tests: [
      {
        name: "Rheumatoid Factor",
        unit: "IU/mL",
        min: 0,
        max: 14,
        range: "<14",
      },
    ],
  },

  {
    id: "aso",
    name: "Anti Streptolysin O",
    short: "ASO",
    icon: "🧫",
    price: 300,
    category: "Serology",
    tests: [
      {
        name: "ASO Titre",
        unit: "IU/mL",
        min: 0,
        max: 200,
        range: "<200",
      },
    ],
  },

  {
    id: "hiv",
    name: "HIV 1 & 2",
    short: "HIV",
    icon: "🧫",
    price: 300,
    category: "Serology",
    tests: [
      {
        name: "HIV 1 & 2",
        unit: "",
        range: "Non-Reactive",
      },
    ],
  },

  {
    id: "hbsag",
    name: "Hepatitis B Surface Antigen",
    short: "HBsAg",
    icon: "🧫",
    price: 300,
    category: "Serology",
    tests: [
      {
        name: "HBsAg",
        unit: "",
        range: "Non-Reactive",
      },
    ],
  },

  {
    id: "hcv",
    name: "Hepatitis C Virus Antibody",
    short: "Anti-HCV",
    icon: "🧫",
    price: 500,
    category: "Serology",
    tests: [
      {
        name: "Anti-HCV",
        unit: "",
        range: "Non-Reactive",
      },
    ],
  },

  // =========================================================
  // CLINICAL PATHOLOGY
  // =========================================================

  {
    id: "urine",
    name: "Urine Routine & Microscopy",
    short: "Urine R/M",
    icon: "🔬",
    price: 150,
    category: "Clinical Pathology",
    tests: [
      {
        name: "Colour",
        unit: "",
        range: "Pale Yellow",
      },
      {
        name: "Appearance",
        unit: "",
        range: "Clear",
      },
      {
        name: "Reaction / pH",
        unit: "",
        range: "4.5-8.0",
      },
      {
        name: "Specific Gravity",
        unit: "",
        range: "1.005-1.030",
      },
      {
        name: "Albumin",
        unit: "",
        range: "Nil",
      },
      {
        name: "Sugar",
        unit: "",
        range: "Nil",
      },
      {
        name: "Ketone Bodies",
        unit: "",
        range: "Negative",
      },
      {
        name: "Bile Salt",
        unit: "",
        range: "Negative",
      },
      {
        name: "Bile Pigment",
        unit: "",
        range: "Negative",
      },
      {
        name: "Pus Cells",
        unit: "/HPF",
        range: "0-5",
      },
      {
        name: "Epithelial Cells",
        unit: "/HPF",
        range: "0-5",
      },
      {
        name: "RBC",
        unit: "/HPF",
        range: "0-2",
      },
      {
        name: "Casts",
        unit: "/LPF",
        range: "Nil",
      },
      {
        name: "Crystals",
        unit: "",
        range: "Nil",
      },
      {
        name: "Bacteria",
        unit: "",
        range: "Nil",
      },
    ],
  },

  {
    id: "stool",
    name: "Stool Routine & Microscopy",
    short: "Stool R/M",
    icon: "🔬",
    price: 150,
    category: "Clinical Pathology",
    tests: [
      {
        name: "Colour",
        unit: "",
        range: "Brown",
      },
      {
        name: "Consistency",
        unit: "",
        range: "Formed",
      },
      {
        name: "Mucus",
        unit: "",
        range: "Absent",
      },
      {
        name: "Blood",
        unit: "",
        range: "Absent",
      },
      {
        name: "Pus Cells",
        unit: "/HPF",
        range: "Nil / Few",
      },
      {
        name: "RBC",
        unit: "/HPF",
        range: "Nil",
      },
      {
        name: "Ova",
        unit: "",
        range: "Not Seen",
      },
      {
        name: "Cyst",
        unit: "",
        range: "Not Seen",
      },
      {
        name: "Parasite",
        unit: "",
        range: "Not Seen",
      },
    ],
  },

  // =========================================================
  // COAGULATION
  // =========================================================

  {
    id: "ptinr",
    name: "Prothrombin Time / INR",
    short: "PT / INR",
    icon: "🩸",
    price: 400,
    category: "Coagulation",
    tests: [
      {
        name: "Prothrombin Time",
        unit: "sec",
        range: "Lab control dependent",
      },
      {
        name: "Control",
        unit: "sec",
        range: "Laboratory Control",
      },
      {
        name: "INR",
        unit: "",
        min: 0.8,
        max: 1.2,
        range: "0.8-1.2",
      },
    ],
  },

  {
    id: "aptt",
    name: "Activated Partial Thromboplastin Time",
    short: "APTT",
    icon: "🩸",
    price: 400,
    category: "Coagulation",
    tests: [
      {
        name: "APTT",
        unit: "sec",
        range: "Lab control dependent",
      },
      {
        name: "Control",
        unit: "sec",
        range: "Laboratory Control",
      },
    ],
  },

  {
    id: "btct",
    name: "Bleeding Time / Clotting Time",
    short: "BT / CT",
    icon: "🩸",
    price: 150,
    category: "Coagulation",
    tests: [
      {
        name: "Bleeding Time",
        unit: "min",
        range: "Method dependent",
      },
      {
        name: "Clotting Time",
        unit: "min",
        range: "Method dependent",
      },
    ],
  },

  // =========================================================
  // OTHER COMMON TESTS
  // =========================================================

  {
    id: "bloodgroup",
    name: "ABO & Rh Blood Group",
    short: "Blood Group",
    icon: "🩸",
    price: 100,
    category: "Hematology",
    tests: [
      {
        name: "ABO Blood Group",
        unit: "",
        range: "A / B / AB / O",
      },
      {
        name: "Rh Type",
        unit: "",
        range: "Positive / Negative",
      },
    ],
  },

  {
    id: "pregnancy",
    name: "Urine Pregnancy Test",
    short: "UPT",
    icon: "🧪",
    price: 150,
    category: "Clinical Pathology",
    tests: [
      {
        name: "Urine Pregnancy Test",
        unit: "",
        range: "Negative",
      },
    ],
  },

  {
    id: "malaria",
    name: "Malaria Parasite",
    short: "MP",
    icon: "🔬",
    price: 200,
    category: "Hematology",
    tests: [
      {
        name: "Malaria Parasite",
        unit: "",
        range: "Not Seen",
      },
    ],
  },
];

const CATEGORIES = [
  "All",
  "Hematology",
  "Biochemistry",
  "Serology",
  "Clinical Pathology",
  "Hormone",
  "Coagulation",
];

export default function TestsPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState([]);

  // ---------------------------------------------------------
  // LOAD PREVIOUSLY SELECTED TESTS
  // ---------------------------------------------------------

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("nidanSelectedTests") || "[]"
      );

      if (Array.isArray(saved)) {
        /*
          Rebuild from current MASTER_TESTS so old localStorage
          entries using string parameters do not break Result Entry.
        */
        const ids = saved.map((item) => item.id);

        const restored = MASTER_TESTS.filter((item) =>
          ids.includes(item.id)
        );

        setSelected(restored);
      }
    } catch (error) {
      console.error("Selected test load error:", error);
    }
  }, []);

  // ---------------------------------------------------------
  // FILTER TESTS
  // ---------------------------------------------------------

  const filteredTests = useMemo(() => {
    const value = search.toLowerCase().trim();

    return MASTER_TESTS.filter((item) => {
      const categoryMatch =
        category === "All" || item.category === category;

      if (!categoryMatch) return false;

      if (!value) return true;

      const parameterMatch = item.tests.some((parameter) =>
        parameter.name.toLowerCase().includes(value)
      );

      return (
        item.name.toLowerCase().includes(value) ||
        item.short.toLowerCase().includes(value) ||
        item.category.toLowerCase().includes(value) ||
        parameterMatch
      );
    });
  }, [search, category]);

  // ---------------------------------------------------------
  // SELECT / REMOVE
  // ---------------------------------------------------------

  function toggleTest(item) {
    setSelected((previous) => {
      const exists = previous.some(
        (test) => test.id === item.id
      );

      if (exists) {
        return previous.filter(
          (test) => test.id !== item.id
        );
      }

      return [...previous, item];
    });
  }

  function clearAll() {
    if (selected.length === 0) return;

    const confirmClear = window.confirm(
      "Sabhi selected tests remove karna hai?"
    );

    if (confirmClear) {
      setSelected([]);
    }
  }

  // ---------------------------------------------------------
  // TOTAL
  // ---------------------------------------------------------

  const totalAmount = selected.reduce(
    (sum, item) => sum + Number(item.price || 0),
    0
  );

  const totalParameters = selected.reduce(
    (sum, item) => sum + (item.tests?.length || 0),
    0
  );

  // ---------------------------------------------------------
  // CONTINUE BILLING
  // ---------------------------------------------------------

  function continueBilling() {
    if (selected.length === 0) {
      alert("Kam se kam ek test select karein.");
      return;
    }

    /*
      Clear old results because test structure may have changed.
      This prevents old patient/test result keys from mixing.
    */
    localStorage.removeItem("nidanResults");

    localStorage.setItem(
      "nidanSelectedTests",
      JSON.stringify(selected)
    );

    localStorage.setItem(
      "nidanBillTotal",
      String(totalAmount)
    );

    router.push("/billing");
  }

  return (
    <div className="labApp">
      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside className="sidebar">
        <div className="brand">
          <div className="brandLogo">N+</div>

          <div>
            <h2>NIDAN</h2>
            <p>PATHOLOGY LAB</p>
          </div>
        </div>

        <div className="menuLabel">
          MAIN MENU
        </div>

        <button
          className="menu"
          onClick={() => router.push("/")}
        >
          <span>⌂</span>
          Dashboard
        </button>

        <button
          className="menu"
          onClick={() => router.push("/patients")}
        >
          <span>♙</span>
          Patients
        </button>

        <button className="menu active">
          <span>🧪</span>
          Test Selection
        </button>

        <button
          className="menu"
          onClick={() => router.push("/billing")}
        >
          <span>₹</span>
          Billing
        </button>

        <button
          className="menu"
          onClick={() => router.push("/results")}
        >
          <span>✎</span>
          Result Entry
        </button>

        <button
          className="menu"
          onClick={() => router.push("/reports")}
        >
          <span>▤</span>
          Reports
        </button>
      </aside>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="mainArea">
        <header className="topbar">
          <div>
            <h3>Test Selection</h3>
            <p>
              Select laboratory investigations for the patient
            </p>
          </div>

          <div className="topRight">
            <span className="statusDot"></span>
            NIDAN Lab System
          </div>
        </header>

        <div className="content">
          {/* =================================================
              PAGE HEADING
          ================================================== */}

          <div className="pageHeading">
            <div>
              <div className="smallTitle">
                STEP 2 OF 5
              </div>

              <h1>Select Laboratory Tests</h1>

              <p>
                Patient ke liye required test ya profile
                select karein.
              </p>
            </div>

            <button
              className="backBtn"
              onClick={() => router.push("/patients")}
            >
              ← Back to Patient
            </button>
          </div>

          {/* =================================================
              STEPS
          ================================================== */}

          <div className="steps">
            <div className="step">
              <span>✓</span>
              <div>
                Patient
                <small>Registered</small>
              </div>
            </div>

            <div className="step activeStep">
              <span>2</span>
              <div>
                Tests
                <small>Select Tests</small>
              </div>
            </div>

            <div className="step">
              <span>3</span>
              <div>
                Billing
                <small>Create Bill</small>
              </div>
            </div>

            <div className="step">
              <span>4</span>
              <div>
                Results
                <small>Enter Results</small>
              </div>
            </div>

            <div className="step">
              <span>5</span>
              <div>
                Report
                <small>Print / PDF</small>
              </div>
            </div>
          </div>

          {/* =================================================
              WORKSPACE
          ================================================== */}

          <div className="testWorkspace">
            <section className="testSelectionPanel">
              {/* SEARCH */}

              <div className="testSearchBox">
                <input
                  type="text"
                  placeholder="🔎 Search CBC, LFT, KFT, Sugar, Thyroid, CRP..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </div>

              {/* CATEGORY FILTER */}

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginBottom: "20px",
                }}
              >
                {CATEGORIES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    style={{
                      border:
                        category === item
                          ? "1px solid #0fa8a0"
                          : "1px solid #dce3ea",

                      background:
                        category === item
                          ? "#e8fbf9"
                          : "#ffffff",

                      color:
                        category === item
                          ? "#07877f"
                          : "#53606f",

                      padding: "8px 13px",
                      borderRadius: "20px",
                      cursor: "pointer",
                      fontWeight: "700",
                      fontSize: "12px",
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {/* HEADING */}

              <div className="sectionHeading">
                <div>
                  <h2>Available Tests</h2>

                  <p>
                    {filteredTests.length} tests/profiles
                    available
                  </p>
                </div>
              </div>

              {/* TEST CARDS */}

              <div className="testCards">
                {filteredTests.length === 0 ? (
                  <div
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      background: "#fff",
                      border: "1px solid #e5e9ef",
                      borderRadius: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "35px",
                        marginBottom: "10px",
                      }}
                    >
                      🔎
                    </div>

                    <strong>
                      Test nahi mila
                    </strong>

                    <p>
                      Search ya category change karein.
                    </p>
                  </div>
                ) : (
                  filteredTests.map((item) => {
                    const active = selected.some(
                      (test) => test.id === item.id
                    );

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={
                          active
                            ? "testCard selectedTest"
                            : "testCard"
                        }
                        onClick={() => toggleTest(item)}
                      >
                        <div className="testCardTop">
                          <span className="testEmoji">
                            {item.icon}
                          </span>

                          <span className="testCheck">
                            {active ? "✓" : "+"}
                          </span>
                        </div>

                        <h3>
                          {item.short}
                        </h3>

                        <p>
                          {item.name}
                        </p>

                        <div className="testMeta">
                          <span>
                            {item.category}
                          </span>

                          <span>
                            {item.tests.length} Parameters
                          </span>
                        </div>

                        <div className="testPrice">
                          ₹{item.price}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            {/* =================================================
                SELECTED PANEL
            ================================================== */}

            <aside className="selectedPanel">
              <div className="selectedHeader">
                <div>
                  <h2>
                    Selected Tests
                  </h2>

                  <p>
                    {selected.length} test/profile selected
                  </p>
                </div>

                <div className="selectedCount">
                  {selected.length}
                </div>
              </div>

              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  style={{
                    width: "100%",
                    marginBottom: "12px",
                    padding: "8px",
                    border: "1px solid #efcccc",
                    background: "#fff",
                    color: "#b43b3b",
                    borderRadius: "7px",
                    cursor: "pointer",
                    fontWeight: "700",
                  }}
                >
                  Clear All
                </button>
              )}

              {selected.length === 0 ? (
                <div className="noSelectedTest">
                  <div>🧪</div>

                  <h3>
                    No tests selected
                  </h3>

                  <p>
                    Left side se laboratory tests select
                    karein.
                  </p>
                </div>
              ) : (
                <div className="selectedList">
                  {selected.map((item) => (
                    <div
                      className="selectedItem"
                      key={item.id}
                    >
                      <div>
                        <strong>
                          {item.short}
                        </strong>

                        <small>
                          {item.tests.length} parameters
                        </small>
                      </div>

                      <div className="selectedPrice">
                        ₹{item.price}

                        <button
                          type="button"
                          aria-label={`Remove ${item.name}`}
                          onClick={() =>
                            toggleTest(item)
                          }
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SUMMARY */}

              <div className="billSummary">
                <div>
                  <span>
                    Selected Tests
                  </span>

                  <strong>
                    {selected.length}
                  </strong>
                </div>

                <div>
                  <span>
                    Total Parameters
                  </span>

                  <strong>
                    {totalParameters}
                  </strong>
                </div>

                <div className="grandTotal">
                  <span>
                    Estimated Total
                  </span>

                  <strong>
                    ₹{totalAmount}
                  </strong>
                </div>
              </div>

              {/* CONTINUE */}

              <button
                className="continueBtn"
                onClick={continueBilling}
              >
                Continue to Billing →
              </button>

              <p
                style={{
                  margin: "12px 0 0",
                  fontSize: "11px",
                  color: "#7b8795",
                  lineHeight: "1.5",
                  textAlign: "center",
                }}
              >
                Selected test parameters automatically
                Result Entry aur Final Report me jayenge.
              </p>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
