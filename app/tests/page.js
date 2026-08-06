"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/* =========================================================
   NIDAN PATHOLOGY LAB
   TEST SELECTION
   app/tests/page.js
   ========================================================= */

const testGroups = [
  /* =======================================================
     HAEMATOLOGY
     ======================================================= */

  {
    id: "cbc",
    name: "Complete Blood Count (CBC)",
    short: "CBC",
    icon: "🩸",
    price: 250,
    category: "Hematology",
    department: "HAEMATOLOGY",

    tests: [
      {
        name: "Haemoglobin",
        unit: "g/dL",
        reference: "Male: 13-17 | Female: 12-15",
      },

      {
        name: "Total Leucocyte Count (TLC)",
        unit: "/cumm",
        min: 4000,
        max: 11000,
        reference: "4000-11000",
      },

      {
        name: "Neutrophils",
        unit: "%",
        min: 40,
        max: 75,
        reference: "40-75",
      },

      {
        name: "Lymphocytes",
        unit: "%",
        min: 20,
        max: 40,
        reference: "20-40",
      },

      {
        name: "Eosinophils",
        unit: "%",
        min: 1,
        max: 6,
        reference: "1-6",
      },

      {
        name: "Monocytes",
        unit: "%",
        min: 1,
        max: 10,
        reference: "1-10",
      },

      {
        name: "Basophils",
        unit: "%",
        min: 0,
        max: 1,
        reference: "0-1",
      },

      {
        name: "RBC Count",
        unit: "million/cumm",
        reference:
          "Male: 4.5-6.0 | Female: 4.0-5.5",
      },

      {
        name: "PCV / Haematocrit",
        unit: "%",
        reference:
          "Male: 40-50 | Female: 36-46",
      },

      {
        name: "MCV",
        unit: "fL",
        min: 80,
        max: 100,
        reference: "80-100",
      },

      {
        name: "MCH",
        unit: "pg",
        min: 27,
        max: 32,
        reference: "27-32",
      },

      {
        name: "MCHC",
        unit: "g/dL",
        min: 32,
        max: 36,
        reference: "32-36",
      },

      {
        name: "RDW-CV",
        unit: "%",
        min: 11.5,
        max: 14.5,
        reference: "11.5-14.5",
      },

      {
        name: "Platelet Count",
        unit: "Lac/cumm",
        min: 1.5,
        max: 4.5,
        reference: "1.5-4.5",
      },

      {
        name: "MPV",
        unit: "fL",
        min: 7.5,
        max: 11.5,
        reference: "7.5-11.5",
      },

      {
        name: "PDW",
        unit: "%",
        min: 9,
        max: 17,
        reference: "9-17",
      },

      {
        name: "PCT",
        unit: "%",
        min: 0.15,
        max: 0.4,
        reference: "0.15-0.40",
      },
    ],
  },

  {
    id: "esr",
    name: "ESR",
    short: "ESR",
    icon: "⏱️",
    price: 100,
    category: "Hematology",
    department: "HAEMATOLOGY",

    tests: [
      {
        name: "ESR (Westergren Method)",
        unit: "mm/1st hr",
        reference:
          "Male: 0-15 | Female: 0-20",
      },
    ],
  },

  {
    id: "bloodgroup",
    name: "Blood Group",
    short: "Blood Group",
    icon: "🩸",
    price: 100,
    category: "Hematology",
    department: "HAEMATOLOGY",

    tests: [
      {
        name: "ABO Blood Group",
        unit: "",
        reference: "A / B / AB / O",
      },

      {
        name: "Rh Type",
        unit: "",
        reference: "Positive / Negative",
      },
    ],
  },

  {
    id: "btct",
    name: "Bleeding Time / Clotting Time",
    short: "BT / CT",
    icon: "⏱️",
    price: 150,
    category: "Hematology",
    department: "HAEMATOLOGY",

    tests: [
      {
        name: "Bleeding Time (BT)",
        unit: "minutes",
        min: 2,
        max: 7,
        reference: "2-7",
      },

      {
        name: "Clotting Time (CT)",
        unit: "minutes",
        min: 5,
        max: 11,
        reference: "5-11",
      },
    ],
  },

  /* =======================================================
     COAGULATION
     ======================================================= */

  {
    id: "ptinr",
    name: "Prothrombin Time (PT/INR)",
    short: "PT / INR",
    icon: "🩸",
    price: 350,
    category: "Coagulation",
    department: "COAGULATION",

    tests: [
      {
        name: "Prothrombin Time (PT)",
        unit: "sec",
        min: 11,
        max: 16,
        reference: "11-16",
      },

      {
        name: "Control PT",
        unit: "sec",
        reference: "Laboratory Control",
      },

      {
        name: "INR",
        unit: "",
        min: 0.8,
        max: 1.2,
        reference: "0.8-1.2",
      },
    ],
  },

  {
    id: "aptt",
    name: "Activated Partial Thromboplastin Time",
    short: "APTT",
    icon: "🩸",
    price: 350,
    category: "Coagulation",
    department: "COAGULATION",

    tests: [
      {
        name:
          "Activated Partial Thromboplastin Time",
        unit: "sec",
        min: 25,
        max: 35,
        reference: "25-35",
      },

      {
        name: "Control",
        unit: "sec",
        reference: "Laboratory Control",
      },
    ],
  },

  /* =======================================================
     BIOCHEMISTRY
     ======================================================= */

  {
    id: "fbs",
    name: "Fasting Blood Sugar",
    short: "FBS",
    icon: "🩸",
    price: 100,
    category: "Biochemistry",
    department: "BIOCHEMISTRY",

    tests: [
      {
        name: "Fasting Blood Sugar",
        unit: "mg/dL",
        min: 70,
        max: 99,
        reference: "70-99",
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
    department: "BIOCHEMISTRY",

    tests: [
      {
        name: "Post Prandial Blood Sugar",
        unit: "mg/dL",
        max: 140,
        reference: "<140",
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
    department: "BIOCHEMISTRY",

    tests: [
      {
        name: "Random Blood Sugar",
        unit: "mg/dL",
        min: 70,
        max: 140,
        reference: "70-140",
      },
    ],
  },

  {
    id: "hba1c",
    name: "HbA1c",
    short: "HbA1c",
    icon: "💉",
    price: 450,
    category: "Biochemistry",
    department: "BIOCHEMISTRY",

    tests: [
      {
        name: "HbA1c",
        unit: "%",
        reference:
          "Normal: <5.7 | Prediabetes: 5.7-6.4 | Diabetes: ≥6.5",
      },

      {
        name:
          "Estimated Average Glucose (eAG)",
        unit: "mg/dL",
        reference: "",
      },
    ],
  },

  {
    id: "kft",
    name: "Kidney Function Test (KFT/RFT)",
    short: "KFT",
    icon: "🧪",
    price: 500,
    category: "Biochemistry",
    department: "BIOCHEMISTRY",

    tests: [
      {
        name: "Blood Urea",
        unit: "mg/dL",
        min: 15,
        max: 40,
        reference: "15-40",
      },

      {
        name: "Serum Creatinine",
        unit: "mg/dL",
        min: 0.6,
        max: 1.3,
        reference: "0.6-1.3",
      },

      {
        name: "Uric Acid",
        unit: "mg/dL",
        reference:
          "Male: 3.4-7.0 | Female: 2.4-6.0",
      },

      {
        name: "Blood Urea Nitrogen (BUN)",
        unit: "mg/dL",
        min: 7,
        max: 20,
        reference: "7-20",
      },

      {
        name: "Sodium",
        unit: "mmol/L",
        min: 135,
        max: 145,
        reference: "135-145",
      },

      {
        name: "Potassium",
        unit: "mmol/L",
        min: 3.5,
        max: 5.1,
        reference: "3.5-5.1",
      },

      {
        name: "Chloride",
        unit: "mmol/L",
        min: 98,
        max: 107,
        reference: "98-107",
      },
    ],
  },

  {
    id: "lft",
    name: "Liver Function Test (LFT)",
    short: "LFT",
    icon: "🧪",
    price: 500,
    category: "Biochemistry",
    department: "BIOCHEMISTRY",

    tests: [
      {
        name: "Total Bilirubin",
        unit: "mg/dL",
        min: 0.2,
        max: 1.2,
        reference: "0.2-1.2",
      },

      {
        name: "Direct Bilirubin",
        unit: "mg/dL",
        min: 0,
        max: 0.3,
        reference: "0.0-0.3",
      },

      {
        name: "Indirect Bilirubin",
        unit: "mg/dL",
        min: 0.2,
        max: 0.9,
        reference: "0.2-0.9",
      },

      {
        name: "SGOT / AST",
        unit: "U/L",
        max: 40,
        reference: "Up to 40",
      },

      {
        name: "SGPT / ALT",
        unit: "U/L",
        max: 40,
        reference: "Up to 40",
      },

      {
        name: "Alkaline Phosphatase (ALP)",
        unit: "U/L",
        min: 44,
        max: 147,
        reference: "44-147",
      },

      {
        name: "Total Protein",
        unit: "g/dL",
        min: 6,
        max: 8.3,
        reference: "6.0-8.3",
      },

      {
        name: "Albumin",
        unit: "g/dL",
        min: 3.5,
        max: 5.2,
        reference: "3.5-5.2",
      },

      {
        name: "Globulin",
        unit: "g/dL",
        min: 2,
        max: 3.5,
        reference: "2.0-3.5",
      },

      {
        name: "A/G Ratio",
        unit: "",
        min: 1,
        max: 2.2,
        reference: "1.0-2.2",
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
    department: "BIOCHEMISTRY",

    tests: [
      {
        name: "Total Cholesterol",
        unit: "mg/dL",
        max: 200,
        reference: "Desirable: <200",
      },

      {
        name: "Triglycerides",
        unit: "mg/dL",
        max: 150,
        reference: "Normal: <150",
      },

      {
        name: "HDL Cholesterol",
        unit: "mg/dL",
        min: 40,
        max: 60,
        reference: "40-60",
      },

      {
        name: "LDL Cholesterol",
        unit: "mg/dL",
        max: 100,
        reference: "Optimal: <100",
      },

      {
        name: "VLDL Cholesterol",
        unit: "mg/dL",
        min: 5,
        max: 40,
        reference: "5-40",
      },

      {
        name: "TC/HDL Ratio",
        unit: "",
        max: 5,
        reference: "<5.0",
      },

      {
        name: "LDL/HDL Ratio",
        unit: "",
        max: 3.5,
        reference: "<3.5",
      },
    ],
  },

  {
    id: "uricacid",
    name: "Serum Uric Acid",
    short: "Uric Acid",
    icon: "🧪",
    price: 150,
    category: "Biochemistry",
    department: "BIOCHEMISTRY",

    tests: [
      {
        name: "Serum Uric Acid",
        unit: "mg/dL",
        reference:
          "Male: 3.4-7.0 | Female: 2.4-6.0",
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
    department: "BIOCHEMISTRY",

    tests: [
      {
        name: "Serum Calcium",
        unit: "mg/dL",
        min: 8.5,
        max: 10.5,
        reference: "8.5-10.5",
      },
    ],
  },

  {
    id: "electrolytes",
    name: "Serum Electrolytes",
    short: "Electrolytes",
    icon: "🧪",
    price: 400,
    category: "Biochemistry",
    department: "BIOCHEMISTRY",

    tests: [
      {
        name: "Sodium (Na+)",
        unit: "mmol/L",
        min: 135,
        max: 145,
        reference: "135-145",
      },

      {
        name: "Potassium (K+)",
        unit: "mmol/L",
        min: 3.5,
        max: 5.1,
        reference: "3.5-5.1",
      },

      {
        name: "Chloride (Cl-)",
        unit: "mmol/L",
        min: 98,
        max: 107,
        reference: "98-107",
      },
    ],
  },

  {
    id: "ironprofile",
    name: "Iron Profile",
    short: "Iron Profile",
    icon: "🩸",
    price: 700,
    category: "Biochemistry",
    department: "BIOCHEMISTRY",

    tests: [
      {
        name: "Serum Iron",
        unit: "µg/dL",
        min: 60,
        max: 170,
        reference: "60-170",
      },

      {
        name: "TIBC",
        unit: "µg/dL",
        min: 240,
        max: 450,
        reference: "240-450",
      },

      {
        name: "Transferrin Saturation",
        unit: "%",
        min: 20,
        max: 50,
        reference: "20-50",
      },

      {
        name: "Serum Ferritin",
        unit: "ng/mL",
        reference:
          "Lab / Age / Sex dependent",
      },
    ],
  },

  /* =======================================================
     THYROID / IMMUNOASSAY
     ======================================================= */

  {
    id: "thyroid",
    name: "Thyroid Profile",
    short: "Thyroid",
    icon: "🧬",
    price: 600,
    category: "Hormone",
    department: "IMMUNOASSAY",

    tests: [
      {
        name: "T3 (Triiodothyronine)",
        unit: "ng/dL",
        min: 80,
        max: 200,
        reference: "80-200",
      },

      {
        name: "T4 (Thyroxine)",
        unit: "µg/dL",
        min: 5,
        max: 12,
        reference: "5.0-12.0",
      },

      {
        name: "TSH",
        unit: "µIU/mL",
        min: 0.4,
        max: 4.5,
        reference: "0.4-4.5",
      },
    ],
  },

  {
    id: "thyroidft3ft4",
    name: "Thyroid Profile (FT3, FT4, TSH)",
    short: "FT3 FT4 TSH",
    icon: "🧬",
    price: 750,
    category: "Hormone",
    department: "IMMUNOASSAY",

    tests: [
      {
        name: "FT3",
        unit: "pg/mL",
        min: 2,
        max: 4.4,
        reference: "2.0-4.4",
      },

      {
        name: "FT4",
        unit: "ng/dL",
        min: 0.8,
        max: 1.8,
        reference: "0.8-1.8",
      },

      {
        name: "TSH",
        unit: "µIU/mL",
        min: 0.4,
        max: 4.5,
        reference: "0.4-4.5",
      },
    ],
  },

  /* =======================================================
     SEROLOGY
     ======================================================= */

  {
    id: "crp",
    name: "C-Reactive Protein (CRP)",
    short: "CRP",
    icon: "🧪",
    price: 300,
    category: "Serology",
    department: "SEROLOGY",

    tests: [
      {
        name: "C-Reactive Protein",
        unit: "mg/L",
        max: 6,
        reference: "<6",
      },
    ],
  },

  {
    id: "rafactor",
    name: "Rheumatoid Factor",
    short: "RA Factor",
    icon: "🧪",
    price: 300,
    category: "Serology",
    department: "SEROLOGY",

    tests: [
      {
        name: "Rheumatoid Factor",
        unit: "IU/mL",
        max: 14,
        reference: "<14",
      },
    ],
  },

  {
    id: "aso",
    name: "ASO Titre",
    short: "ASO",
    icon: "🧪",
    price: 300,
    category: "Serology",
    department: "SEROLOGY",

    tests: [
      {
        name: "ASO Titre",
        unit: "IU/mL",
        max: 200,
        reference: "<200",
      },
    ],
  },

  {
    id: "widal",
    name: "Widal Test",
    short: "Widal",
    icon: "🧫",
    price: 200,
    category: "Serology",
    department: "SEROLOGY",

    tests: [
      {
        name: "S. Typhi O",
        unit: "Titre",
        reference: "Lab / Regional cut-off",
      },

      {
        name: "S. Typhi H",
        unit: "Titre",
        reference: "Lab / Regional cut-off",
      },

      {
        name: "S. Paratyphi AH",
        unit: "Titre",
        reference: "Lab / Regional cut-off",
      },

      {
        name: "S. Paratyphi BH",
        unit: "Titre",
        reference: "Lab / Regional cut-off",
      },
    ],
  },

  {
    id: "dengue",
    name: "Dengue Profile",
    short: "Dengue",
    icon: "🦟",
    price: 800,
    category: "Serology",
    department: "SEROLOGY",

    tests: [
      {
        name: "Dengue NS1 Antigen",
        unit: "",
        reference: "Negative",
      },

      {
        name: "Dengue IgM",
        unit: "",
        reference: "Negative",
      },

      {
        name: "Dengue IgG",
        unit: "",
        reference: "Negative",
      },
    ],
  },

  {
    id: "hbsag",
    name: "HBsAg",
    short: "HBsAg",
    icon: "🧪",
    price: 300,
    category: "Serology",
    department: "SEROLOGY",

    tests: [
      {
        name: "HBsAg",
        unit: "",
        reference: "Non-Reactive",
      },
    ],
  },

  {
    id: "hiv",
    name: "HIV 1 & 2",
    short: "HIV",
    icon: "🧪",
    price: 350,
    category: "Serology",
    department: "SEROLOGY",

    tests: [
      {
        name: "HIV 1 & 2",
        unit: "",
        reference: "Non-Reactive",
      },
    ],
  },

  {
    id: "hcv",
    name: "Anti-HCV",
    short: "Anti-HCV",
    icon: "🧪",
    price: 400,
    category: "Serology",
    department: "SEROLOGY",

    tests: [
      {
        name: "Anti-HCV",
        unit: "",
        reference: "Non-Reactive",
      },
    ],
  },

  {
    id: "vdrl",
    name: "VDRL",
    short: "VDRL",
    icon: "🧪",
    price: 250,
    category: "Serology",
    department: "SEROLOGY",

    tests: [
      {
        name: "VDRL",
        unit: "",
        reference: "Non-Reactive",
      },
    ],
  },

  /* =======================================================
     PARASITOLOGY
     ======================================================= */

  {
    id: "malaria",
    name: "Malaria Test",
    short: "Malaria",
    icon: "🦟",
    price: 250,
    category: "Parasitology",
    department: "PARASITOLOGY",

    tests: [
      {
        name: "Malaria Parasite",
        unit: "",
        reference: "Not Detected",
      },

      {
        name: "P. falciparum",
        unit: "",
        reference: "Negative",
      },

      {
        name: "P. vivax",
        unit: "",
        reference: "Negative",
      },
    ],
  },

  /* =======================================================
     CLINICAL PATHOLOGY
     ======================================================= */

  {
    id: "urine",
    name: "Urine Routine & Microscopy",
    short: "Urine R/M",
    icon: "🔬",
    price: 150,
    category: "Clinical Pathology",
    department: "CLINICAL PATHOLOGY",

    tests: [
      {
        name: "Colour",
        unit: "",
        reference: "Pale Yellow",
      },

      {
        name: "Appearance",
        unit: "",
        reference: "Clear",
      },

      {
        name: "Specific Gravity",
        unit: "",
        reference: "1.005-1.030",
      },

      {
        name: "pH",
        unit: "",
        reference: "4.5-8.0",
      },

      {
        name: "Protein / Albumin",
        unit: "",
        reference: "Negative",
      },

      {
        name: "Sugar / Glucose",
        unit: "",
        reference: "Negative",
      },

      {
        name: "Ketone Bodies",
        unit: "",
        reference: "Negative",
      },

      {
        name: "Bile Salt",
        unit: "",
        reference: "Negative",
      },

      {
        name: "Bile Pigment",
        unit: "",
        reference: "Negative",
      },

      {
        name: "Blood",
        unit: "",
        reference: "Negative",
      },

      {
        name: "Pus Cells",
        unit: "/HPF",
        reference: "0-5",
      },

      {
        name: "Epithelial Cells",
        unit: "/HPF",
        reference: "0-5",
      },

      {
        name: "RBC",
        unit: "/HPF",
        reference: "0-2",
      },

      {
        name: "Casts",
        unit: "/LPF",
        reference: "Nil",
      },

      {
        name: "Crystals",
        unit: "",
        reference: "Nil",
      },

      {
        name: "Bacteria",
        unit: "",
        reference: "Nil",
      },

      {
        name: "Yeast Cells",
        unit: "",
        reference: "Nil",
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
    department: "CLINICAL PATHOLOGY",

    tests: [
      {
        name: "Colour",
        unit: "",
        reference: "Brown",
      },

      {
        name: "Consistency",
        unit: "",
        reference: "Formed",
      },

      {
        name: "Mucus",
        unit: "",
        reference: "Absent",
      },

      {
        name: "Blood",
        unit: "",
        reference: "Absent",
      },

      {
        name: "Pus Cells",
        unit: "/HPF",
        reference: "Nil / Few",
      },

      {
        name: "RBC",
        unit: "/HPF",
        reference: "Nil",
      },

      {
        name: "Ova",
        unit: "",
        reference: "Not Seen",
      },

      {
        name: "Cyst",
        unit: "",
        reference: "Not Seen",
      },

      {
        name: "Parasite",
        unit: "",
        reference: "Not Seen",
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
    department: "CLINICAL PATHOLOGY",

    tests: [
      {
        name: "Urine Pregnancy Test",
        unit: "",
        reference: "Negative",
      },
    ],
  },

  {
    id: "semen",
    name: "Semen Analysis",
    short: "Semen Analysis",
    icon: "🔬",
    price: 500,
    category: "Clinical Pathology",
    department: "CLINICAL PATHOLOGY",

    tests: [
      {
        name: "Volume",
        unit: "mL",
        reference: "≥1.4",
      },

      {
        name: "Colour / Appearance",
        unit: "",
        reference: "Grey-opalescent",
      },

      {
        name: "Liquefaction Time",
        unit: "minutes",
        reference: "Within 60",
      },

      {
        name: "pH",
        unit: "",
        reference: "≥7.2",
      },

      {
        name: "Sperm Concentration",
        unit: "million/mL",
        reference: "≥16",
      },

      {
        name: "Total Sperm Number",
        unit: "million/ejaculate",
        reference: "≥39",
      },

      {
        name: "Total Motility",
        unit: "%",
        reference: "≥42",
      },

      {
        name: "Progressive Motility",
        unit: "%",
        reference: "≥30",
      },

      {
        name: "Normal Forms",
        unit: "%",
        reference: "≥4",
      },

      {
        name: "Pus Cells",
        unit: "/HPF",
        reference: "Few / Nil",
      },
    ],
  },
];

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function TestsPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  /* Load already selected tests if user comes back */

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(
          "nidanSelectedTests"
        ) || "[]"
      );

      if (Array.isArray(saved)) {
        /*
         * Important:
         * Old saved tests may contain string parameters.
         * Rebuild them from the new master library.
         */

        const restored = saved
          .map((savedTest) =>
            testGroups.find(
              (masterTest) =>
                masterTest.id === savedTest.id
            )
          )
          .filter(Boolean);

        setSelected(restored);
      }
    } catch (error) {
      console.error(
        "Selected tests load error:",
        error
      );
    }
  }, []);

  /* Search */

  const filteredTests = useMemo(() => {
    const value = search
      .toLowerCase()
      .trim();

    if (!value) return testGroups;

    return testGroups.filter((item) => {
      const parameterNames = item.tests
        .map((parameter) => parameter.name)
        .join(" ")
        .toLowerCase();

      return (
        item.name
          .toLowerCase()
          .includes(value) ||
        item.short
          .toLowerCase()
          .includes(value) ||
        item.category
          .toLowerCase()
          .includes(value) ||
        parameterNames.includes(value)
      );
    });
  }, [search]);

  /* Select / Unselect */

  function toggleTest(item) {
    setSelected((current) => {
      const alreadySelected =
        current.some(
          (test) => test.id === item.id
        );

      if (alreadySelected) {
        return current.filter(
          (test) => test.id !== item.id
        );
      }

      return [...current, item];
    });
  }

  /* Total */

  const totalAmount = selected.reduce(
    (sum, item) =>
      sum + Number(item.price || 0),
    0
  );

  /* Continue */

  function continueBilling() {
    if (selected.length === 0) {
      alert(
        "Kam se kam ek test select karein."
      );
      return;
    }

    /*
     * Remove old result data because parameter
     * structure may have changed.
     */

    localStorage.removeItem(
      "nidanResults"
    );

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

      {/* SIDEBAR */}

      <aside className="sidebar">
        <div className="brand">
          <div className="brandLogo">
            N+
          </div>

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
          onClick={() =>
            router.push("/")
          }
        >
          <span>⌂</span>
          Dashboard
        </button>

        <button
          className="menu"
          onClick={() =>
            router.push("/patients")
          }
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
          onClick={() =>
            router.push("/billing")
          }
        >
          <span>₹</span>
          Billing
        </button>

        <button
          className="menu"
          onClick={() =>
            router.push("/results")
          }
        >
          <span>✎</span>
          Result Entry
        </button>

        <button
          className="menu"
          onClick={() =>
            router.push("/reports")
          }
        >
          <span>▤</span>
          Reports
        </button>
      </aside>

      {/* MAIN */}

      <main className="mainArea">

        <header className="topbar">
          <div>
            <h3>
              Test Selection
            </h3>

            <p>
              Select laboratory
              investigations for the patient
            </p>
          </div>

          <div className="topRight">
            <span className="statusDot" />
            NIDAN Lab System
          </div>
        </header>

        <div className="content">

          {/* HEADING */}

          <div className="pageHeading">
            <div>
              <div className="smallTitle">
                STEP 2 OF 5
              </div>

              <h1>
                Select Laboratory Tests
              </h1>

              <p>
                Patient ke liye required test
                ya profile select karein.
              </p>
            </div>

            <button
              className="backBtn"
              onClick={() =>
                router.back()
              }
            >
              ← Back
            </button>
          </div>

          {/* STEPS */}

          <div className="steps">

            <div className="step">
              <span>✓</span>

              <div>
                Patient
                <small>
                  Registered
                </small>
              </div>
            </div>

            <div className="step activeStep">
              <span>2</span>

              <div>
                Tests
                <small>
                  Select Tests
                </small>
              </div>
            </div>

            <div className="step">
              <span>3</span>

              <div>
                Billing
                <small>
                  Create Bill
                </small>
              </div>
            </div>

            <div className="step">
              <span>4</span>

              <div>
                Results
                <small>
                  Enter Results
                </small>
              </div>
            </div>

            <div className="step">
              <span>5</span>

              <div>
                Report
                <small>
                  Print / PDF
                </small>
              </div>
            </div>

          </div>

          {/* WORKSPACE */}

          <div className="testWorkspace">

            {/* TEST LIST */}

            <section className="testSelectionPanel">

              <div className="testSearchBox">
                <input
                  type="text"
                  placeholder="🔎 Search CBC, LFT, KFT, Sugar, Thyroid..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="sectionHeading">
                <div>
                  <h2>
                    Available Tests
                  </h2>

                  <p>
                    Profile select karne par
                    uske sabhi parameters
                    result entry aur report me
                    add honge.
                  </p>
                </div>
              </div>

              <div className="testCards">

                {filteredTests.length ===
                0 ? (
                  <div
                    style={{
                      padding: "25px",
                    }}
                  >
                    No test found.
                  </div>
                ) : (
                  filteredTests.map(
                    (item) => {
                      const active =
                        selected.some(
                          (test) =>
                            test.id ===
                            item.id
                        );

                      return (
                        <button
                          key={item.id}
                          className={
                            active
                              ? "testCard selectedTest"
                              : "testCard"
                          }
                          onClick={() =>
                            toggleTest(
                              item
                            )
                          }
                        >
                          <div className="testCardTop">
                            <span className="testEmoji">
                              {
                                item.icon
                              }
                            </span>

                            <span className="testCheck">
                              {active
                                ? "✓"
                                : "+"}
                            </span>
                          </div>

                          <h3>
                            {
                              item.short
                            }
                          </h3>

                          <p>
                            {item.name}
                          </p>

                          <div className="testMeta">
                            <span>
                              {
                                item.category
                              }
                            </span>

                            <span>
                              {
                                item
                                  .tests
                                  .length
                              }{" "}
                              Parameters
                            </span>
                          </div>

                          <div className="testPrice">
                            ₹
                            {
                              item.price
                            }
                          </div>
                        </button>
                      );
                    }
                  )
                )}

              </div>
            </section>

            {/* SELECTED PANEL */}

            <aside className="selectedPanel">

              <div className="selectedHeader">
                <div>
                  <h2>
                    Selected Tests
                  </h2>

                  <p>
                    {selected.length}{" "}
                    test/profile selected
                  </p>
                </div>

                <div className="selectedCount">
                  {selected.length}
                </div>
              </div>

              {selected.length === 0 ? (
                <div className="noSelectedTest">
                  <div>🧪</div>

                  <h3>
                    No tests selected
                  </h3>

                  <p>
                    Laboratory tests select
                    karein.
                  </p>
                </div>
              ) : (
                <div className="selectedList">

                  {selected.map(
                    (item) => (
                      <div
                        className="selectedItem"
                        key={item.id}
                      >
                        <div>
                          <strong>
                            {
                              item.short
                            }
                          </strong>

                          <small>
                            {
                              item
                                .tests
                                .length
                            }{" "}
                            parameters
                          </small>
                        </div>

                        <div className="selectedPrice">
                          ₹
                          {
                            item.price
                          }

                          <button
                            type="button"
                            onClick={() =>
                              toggleTest(
                                item
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )
                  )}

                </div>
              )}

              {/* BILL SUMMARY */}

              <div className="billSummary">

                <div>
                  <span>
                    Selected Tests
                  </span>

                  <strong>
                    {selected.length}
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

              <button
                className="continueBtn"
                onClick={
                  continueBilling
                }
              >
                Continue to Billing →
              </button>

            </aside>

          </div>
        </div>
      </main>
    </div>
  );
}
