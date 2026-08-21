import { describe, expect, it } from "vitest";
import { calculateDerivedResults } from "./lab-calculations";

describe("NIDAN calculation engine", () => {
  it("calculates CBC-derived values", () => {
    const r = calculateDerivedResults({ Haemoglobin: "15", "RBC Count": "5", Haematocrit: "45", "Total Leucocyte Count (TLC)": "8000", Neutrophils: "60", Lymphocytes: "30", Eosinophils: "5" });
    expect(r.MCH.value).toBe(30);
    expect(r.MCHC.value).toBe(33.3);
    expect(r.AEC.value).toBe(400);
    expect(r.ANC.value).toBe(4800);
    expect(r.NLR.value).toBe(2);
  });

  it("calculates lipid and liver-derived values", () => {
    const r = calculateDerivedResults({ "Total Cholesterol": "200", "HDL Cholesterol": "50", Triglycerides: "150", "Total Protein": "7", Albumin: "4", "Total Bilirubin": "1.2", "Direct Bilirubin": "0.4" });
    expect(r["LDL Cholesterol"].value).toBe(120);
    expect(r["VLDL Cholesterol"].value).toBe(30);
    expect(r["Non-HDL Cholesterol"].value).toBe(150);
    expect(r["Globulin"].value).toBe(3);
    expect(r["A/G Ratio"].value).toBeCloseTo(1.33, 2);
    expect(r["Indirect Bilirubin"].value).toBe(0.8);
  });

  it("does not calculate Friedewald LDL when triglycerides are 400 or higher", () => {
    const r = calculateDerivedResults({ "Total Cholesterol": "250", "HDL Cholesterol": "50", Triglycerides: "400" });
    expect(r["LDL Cholesterol"]).toBeUndefined();
  });

  it("does not divide by zero", () => {
    const r = calculateDerivedResults({ Haemoglobin: "15", "RBC Count": "0", "HDL Cholesterol": "0", "Total Cholesterol": "200", Albumin: "4", Globulin: "0" });
    expect(r.MCH).toBeUndefined();
    expect(r["Total Cholesterol / HDL Ratio"]).toBeUndefined();
    expect(r["A/G Ratio"]).toBeUndefined();
  });

  it("calculates diabetes and semen-derived values", () => {
    const r = calculateDerivedResults({ HbA1c: "7", "Sperm Concentration": "20", "Semen Volume": "3", "Progressive Motility": "40", "Non-Progressive Motility": "20" });
    expect(r.eAG.value).toBe(154);
    expect(r["Total Sperm Count"].value).toBe(60);
    expect(r["Total Motility"].value).toBe(60);
  });

  it("requires adult age and gender for eGFR", () => {
    const missing = calculateDerivedResults({ "Serum Creatinine": "1", Age: "17", Gender: "Male" });
    expect(missing.eGFR).toBeUndefined();
    const male = calculateDerivedResults({ "Serum Creatinine": "1", Age: "50", Gender: "Male" });
    const female = calculateDerivedResults({ "Serum Creatinine": "1", Age: "50", Gender: "Female" });
    expect(male.eGFR.value).toBeGreaterThan(70);
    expect(female.eGFR.value).toBeGreaterThan(65);
  });
});
