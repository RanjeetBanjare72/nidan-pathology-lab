import { calculateDerivedResults } from "./lab-calculations";

describe("NIDAN calculation engine", () => {
  test("calculates lipid values", () => {
    const r = calculateDerivedResults({ "Total Cholesterol": 200, "HDL Cholesterol": 50, Triglycerides: 150 });
    expect(r["LDL Cholesterol"].value).toBe(120);
    expect(r["VLDL Cholesterol"].value).toBe(30);
    expect(r["Non-HDL Cholesterol"].value).toBe(150);
    expect(r["Total Cholesterol / HDL Ratio"].value).toBe(4);
  });
  test("calculates CBC derived values", () => {
    const r = calculateDerivedResults({ Haemoglobin: 14, "RBC Count": 5, Haematocrit: 42, "Total Leucocyte Count (TLC)": 8000, Neutrophils: 60, Lymphocytes: 30, Eosinophils: 4 });
    expect(r.MCH.value).toBe(28);
    expect(r.MCHC.value).toBe(33.3);
    expect(r.AEC.value).toBe(320);
    expect(r.ANC.value).toBe(4800);
    expect(r.NLR.value).toBe(2);
  });
  test("calculates liver derived values", () => {
    const r = calculateDerivedResults({ "Total Protein": 7.2, Albumin: 4.2, "Total Bilirubin": 1.0, "Direct Bilirubin": 0.3 });
    expect(r.Globulin.value).toBe(3);
    expect(r["A/G Ratio"].value).toBe(1.4);
    expect(r["Indirect Bilirubin"].value).toBe(0.7);
  });
  test("calculates HbA1c eAG", () => {
    const r = calculateDerivedResults({ HbA1c: 6.5 });
    expect(r.eAG.value).toBe(140);
  });
  test("calculates semen derived values", () => {
    const r = calculateDerivedResults({ "Sperm Concentration": 20, "Semen Volume": 3, "Progressive Motility": 30, "Non-Progressive Motility": 10 });
    expect(r["Total Sperm Count"].value).toBe(60);
    expect(r["Total Motility"].value).toBe(40);
  });
  test("does not calculate LDL with triglycerides >= 400", () => {
    const r = calculateDerivedResults({ "Total Cholesterol": 200, "HDL Cholesterol": 50, Triglycerides: 400 });
    expect(r["LDL Cholesterol"]).toBeUndefined();
  });
});
