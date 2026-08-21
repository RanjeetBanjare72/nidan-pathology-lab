"use client";

import { useEffect } from "react";

const RANGES = {
  "alb": "3.5-5.0 g/dL",
  "a/g ratio": "1.0-2.5",
  "alp": "Adult: 44-147 U/L (lab dependent)",
  "amylase": "30-110 U/L",
  "post prandial blood glucose": "<140 mg/dL (2-hour)",
  "urea": "15-45 mg/dL",
  "bun": "7-20 mg/dL",
  "ca": "8.5-10.5 mg/dL",
  "ck-mb": "<5 ng/mL (assay dependent)",
  "ck": "30-200 U/L (lab dependent)",
  "db": "0.0-0.3 mg/dL",
  "ferritin": "Male: 30-400 ng/mL; Female: 13-150 ng/mL",
  "folate": ">4 ng/mL",
  "ggt": "Male: 8-61 U/L; Female: 5-36 U/L",
  "globulin": "2.0-3.5 g/dL",
  "ib": "0.2-0.9 mg/dL",
  "iron": "Male: 65-175 µg/dL; Female: 50-170 µg/dL",
  "ldh": "140-280 U/L (lab dependent)",
  "lipase": "13-60 U/L",
  "mg": "1.7-2.2 mg/dL",
  "nt-probnp": "<125 pg/mL (age/clinical context dependent)",
  "phos": "2.5-4.5 mg/dL",
  "random blood glucose": "<200 mg/dL; interpret clinically",
  "cl-": "98-106 mmol/L",
  "creatinine": "Male: 0.7-1.3 mg/dL; Female: 0.6-1.1 mg/dL",
  "k+": "3.5-5.1 mmol/L",
  "na+": "135-145 mmol/L",
  "sgot": "Male: 15-37 U/L; Female: 13-35 U/L (lab dependent)",
  "sgpt": "Male: 16-63 U/L; Female: 13-35 U/L (lab dependent)",
  "tb": "0.2-1.2 mg/dL",
  "tibc": "240-450 µg/dL",
  "tp": "6.0-8.3 g/dL",
  "transferrin": "200-360 mg/dL",
  "trop i": "<0.04 ng/mL (assay dependent)",
  "trop t": "<0.014 ng/mL (high-sensitivity assay dependent)",
  "uric acid": "Male: 3.5-7.2 mg/dL; Female: 2.6-6.0 mg/dL",
  "b12": "200-900 pg/mL",
  "25-oh vitamin d": "30-100 ng/mL",
  "hb": "Male: 13-17 g/dL; Female: 12-15 g/dL",
  "mch": "27-33 pg",
  "mchc": "32-36 g/dL",
  "mcv": "80-100 fL",
  "pcv": "Male: 40-54%; Female: 36-46%",
  "pbs": "No abnormal morphology / lab interpretation",
  "plt": "150,000-450,000 /µL",
  "rbc": "Male: 4.5-5.9 million/µL; Female: 4.1-5.1 million/µL",
  "rdw": "11.5-14.5%",
  "retic": "0.5-2.5%",
  "tlc": "4,000-11,000 /µL",
  "β-hcg": "Non-pregnant: <5 mIU/mL; pregnancy: gestational-age dependent",
  "ft3": "2.0-4.4 pg/mL",
  "ft4": "0.8-1.8 ng/dL",
  "fsh": "Male: 1.5-12.4 mIU/mL; Female: cycle-dependent",
  "insulin f": "2-25 µIU/mL fasting",
  "insulin pp": "Lab/clinical reference; post-meal interpretation",
  "lh": "Male: 1.7-8.6 mIU/mL; Female: cycle-dependent",
  "progesterone": "Cycle/gestation dependent; use laboratory-specific range",
  "prl": "Male: 4-15 ng/mL; Female: 4-23 ng/mL",
  "testosterone": "Male: 300-1000 ng/dL; Female: 15-70 ng/dL",
  "tsh": "0.4-4.0 µIU/mL",
  "t4": "5.0-12.0 µg/dL",
  "t3": "0.8-2.0 ng/mL",
  "afB": "Negative / Not detected",
  "gram stain": "No pathogenic organisms seen / interpret with smear",
  "koh": "No fungal elements seen",
  "hcv": "Non-reactive",
  "aso": "<200 IU/mL (adult; lab dependent)",
  "crp": "<5 mg/L",
  "dengue igg/igm": "Negative / Non-reactive",
  "dengue ns1": "Negative / Not detected",
  "dengue combo": "NS1/IgM/IgG: Negative / Non-reactive",
  "hbsag": "Non-reactive",
  "hiv": "Non-reactive",
  "malaria ag": "Negative / Not detected",
  "mp": "No malarial parasite seen",
  "rf": "<14 IU/mL",
  "typhoid igg/igm": "Negative / Non-reactive",
  "vdrl": "Non-reactive",
  "widal": "<1:80 or laboratory-specific cutoff",
  "dct": "Negative",
  "ict": "Negative",
  "bt": "2-7 minutes (method dependent)",
  "ct": "5-11 minutes (method dependent)",
  "aec": "40-400 /µL",
  "aptt": "25-35 seconds (lab dependent)",
  "inr": "0.8-1.2 (non-anticoagulated)",
  "prothrombin time": "11-14 seconds (lab dependent)",
  "upt": "Negative",
  "fobt": "Negative",
  "sputum r/m": "No abnormality / lab interpretation",
  "urine r/m": "Normal / no abnormality detected",
  "urine re": "Normal / no abnormality detected",
};

const GENERIC = new Set([
  "-",
  "lab-defined reference range",
  "lab/clinical reference applicable",
  "lab dependent",
  "lab control/reference",
  "lab/clinical reference",
  "who laboratory reference",
  "who/laboratory reference",
]);

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[./_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findRange(name) {
  const key = normalize(name);
  if (RANGES[key]) return RANGES[key];

  const aliases = {
    "albumin": "alb",
    "a/g ratio": "a/g ratio",
    "albumin/globulin ratio": "a/g ratio",
    "alkaline phosphatase": "alp",
    "gamma gt": "ggt",
    "gamma glutamyl transferase": "ggt",
    "direct bilirubin": "db",
    "indirect bilirubin": "ib",
    "total bilirubin": "tb",
    "serum creatinine": "creatinine",
    "serum sodium": "na+",
    "serum potassium": "k+",
    "serum chloride": "cl-",
    "sgot / ast": "sgot",
    "sgpt / alt": "sgpt",
    "total protein": "tp",
    "total iron binding capacity": "tibc",
    "vitamin b12": "b12",
    "vitamin d3": "25-oh vitamin d",
    "haemoglobin": "hb",
    "hemoglobin": "hb",
    "platelet count": "plt",
    "red blood cell count": "rbc",
    "red cell distribution width": "rdw",
    "total leucocyte count": "tlc",
    "absolute eosinophil count": "aec",
    "rheumatoid factor": "rf",
    "activated partial thromboplastin time": "aptt",
  };
  return RANGES[aliases[key]] || "";
}

function enhance(root = document) {
  root.querySelectorAll(".resultTable tbody tr").forEach((row) => {
    const nameCell = row.querySelector(".investigationCell");
    const referenceCell = row.querySelector(".referenceCell");
    if (!nameCell || !referenceCell) return;

    const current = referenceCell.textContent.trim();
    if (!GENERIC.has(normalize(current))) return;

    const range = findRange(nameCell.textContent);
    if (range) referenceCell.textContent = range;
  });
}

export default function NidanReferenceRangeEnhancer() {
  useEffect(() => {
    enhance();
    const observer = new MutationObserver(() => enhance());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
