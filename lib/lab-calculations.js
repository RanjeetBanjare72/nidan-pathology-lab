// NIDAN Pathology Lab - calculation engine
// Calculated values are derived from entered analytes. The engine does not
// replace laboratory SOPs, analyzer calculations, or pathologist verification.

export function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

export function round(value, decimals = 2) {
  const n = toNumber(value);
  if (n === null) return null;
  const p = 10 ** decimals;
  return Math.round((n + Number.EPSILON) * p) / p;
}

export const CALCULATION_DEFINITIONS = {
  "LDL Cholesterol": { id: "friedewald_ldl", label: "LDL (Friedewald)", formula: "LDL = Total Cholesterol − HDL − (Triglycerides / 5)", requires: ["Total Cholesterol", "HDL Cholesterol", "Triglycerides"], calculate: ({ "Total Cholesterol": tc, "HDL Cholesterol": hdl, Triglycerides: tg }) => { const a=toNumber(tc),b=toNumber(hdl),c=toNumber(tg); return [a,b,c].some(v=>v===null)||c>=400?null:round(a-b-c/5,2); } },
  "VLDL Cholesterol": { id: "vldl_from_tg", label: "VLDL (estimated)", formula: "VLDL = Triglycerides / 5", requires: ["Triglycerides"], calculate: ({ Triglycerides: tg }) => { const n=toNumber(tg); return n===null?null:round(n/5,2); } },
  "Non-HDL Cholesterol": { id: "non_hdl", label: "Non-HDL Cholesterol", formula: "Non-HDL = Total Cholesterol − HDL", requires: ["Total Cholesterol", "HDL Cholesterol"], calculate: ({ "Total Cholesterol":tc,"HDL Cholesterol":hdl }) => { const a=toNumber(tc),b=toNumber(hdl); return a===null||b===null?null:round(a-b,2); } },
  "Total Cholesterol / HDL Ratio": { id: "tc_hdl_ratio", label: "TC/HDL Ratio", formula: "TC/HDL = Total Cholesterol / HDL Cholesterol", requires: ["Total Cholesterol","HDL Cholesterol"], calculate: ({"Total Cholesterol":tc,"HDL Cholesterol":hdl}) => { const a=toNumber(tc),b=toNumber(hdl); return a===null||b===null||b===0?null:round(a/b,2); } },
  "Globulin": { id: "globulin_from_protein_albumin", label: "Globulin (calculated)", formula: "Globulin = Total Protein − Albumin", requires: ["Total Protein", "Albumin"], calculate: ({ "Total Protein":tp, Albumin:alb }) => { const a=toNumber(tp),b=toNumber(alb); return a===null||b===null?null:round(a-b,2); } },
  "A/G Ratio": { id: "ag_ratio", label: "A/G Ratio (calculated)", formula: "A/G = Albumin / Globulin", requires: ["Albumin", "Globulin"], calculate: ({Albumin:alb,Globulin:glob}) => { const a=toNumber(alb),b=toNumber(glob); return a===null||b===null||b===0?null:round(a/b,2); } },
  "Indirect Bilirubin": { id: "indirect_bilirubin", label: "Indirect Bilirubin (calculated)", formula: "Indirect Bilirubin = Total Bilirubin − Direct Bilirubin", requires: ["Total Bilirubin","Direct Bilirubin"], calculate: ({"Total Bilirubin":total,"Direct Bilirubin":direct}) => { const a=toNumber(total),b=toNumber(direct); return a===null||b===null?null:round(a-b,2); } },
  "BUN": { id: "bun_from_urea", label: "BUN (from urea)", formula: "BUN ≈ Urea × 0.467", requires: ["Blood Urea"], calculate: ({"Blood Urea":urea}) => { const n=toNumber(urea); return n===null?null:round(n*0.467,2); } },
  "MCH": { id: "mch_from_hb_rbc", label: "MCH (calculated)", formula: "MCH = Haemoglobin × 10 / RBC Count", requires: ["Haemoglobin","RBC Count"], calculate: ({Haemoglobin:hb,"RBC Count":rbc}) => { const a=toNumber(hb),b=toNumber(rbc); return a===null||b===null||b===0?null:round(a*10/b,1); } },
  "MCHC": { id: "mchc_from_hb_hct", label: "MCHC (calculated)", formula: "MCHC = Haemoglobin × 100 / Haematocrit", requires: ["Haemoglobin","Haematocrit"], calculate: ({Haemoglobin:hb,Haematocrit:hct}) => { const a=toNumber(hb),b=toNumber(hct); return a===null||b===null||b===0?null:round(a*100/b,1); } },
  "AEC": { id: "aec_from_tlc_eosinophils", label: "AEC (calculated)", formula: "AEC = TLC × Eosinophils / 100", requires: ["Total Leucocyte Count (TLC)","Eosinophils"], calculate: ({"Total Leucocyte Count (TLC)":tlc,Eosinophils:eos}) => { const a=toNumber(tlc),b=toNumber(eos); return a===null||b===null?null:round(a*b/100,0); } },
  "ANC": { id: "anc_from_tlc_neutrophils", label: "ANC (calculated)", formula: "ANC = TLC × Neutrophils / 100", requires: ["Total Leucocyte Count (TLC)","Neutrophils"], calculate: ({"Total Leucocyte Count (TLC)":tlc,Neutrophils:neu}) => { const a=toNumber(tlc),b=toNumber(neu); return a===null||b===null?null:round(a*b/100,0); } },
  "NLR": { id: "nlr_from_neutrophils_lymphocytes", label: "NLR (calculated)", formula: "NLR = Neutrophils % / Lymphocytes %", requires: ["Neutrophils","Lymphocytes"], calculate: ({Neutrophils:neu,Lymphocytes:lym}) => { const a=toNumber(neu),b=toNumber(lym); return a===null||b===null||b===0?null:round(a/b,2); } },
  "eAG": { id: "eag_from_hba1c", label: "eAG (estimated average glucose)", formula: "eAG (mg/dL) = 28.7 × HbA1c − 46.7", requires: ["HbA1c"], calculate: ({HbA1c:a1c}) => { const n=toNumber(a1c); return n===null?null:round(28.7*n-46.7,0); } },
  "Total Sperm Count": { id: "total_sperm_count", label: "Total Sperm Count (calculated)", formula: "Total Sperm Count = Sperm Concentration × Semen Volume", requires: ["Sperm Concentration","Semen Volume"], calculate: ({"Sperm Concentration":conc,"Semen Volume":vol}) => { const a=toNumber(conc),b=toNumber(vol); return a===null||b===null?null:round(a*b,2); } },
  "Total Motility": { id: "total_motility", label: "Total Motility (calculated)", formula: "Total Motility = Progressive Motility + Non-Progressive Motility", requires: ["Progressive Motility","Non-Progressive Motility"], calculate: ({"Progressive Motility":p,"Non-Progressive Motility":np}) => { const a=toNumber(p),b=toNumber(np); return a===null||b===null?null:round(a+b,2); } },
  "eGFR": { id: "egfr_ckd_epi_2021", label: "eGFR (CKD-EPI 2021)", formula: "CKD-EPI 2021 creatinine equation; requires age, sex and serum creatinine", requires: ["Serum Creatinine","Age","Gender"], calculate: ({"Serum Creatinine":creatinine,Age:age,Gender:gender}) => { const cr=toNumber(creatinine),years=toNumber(age),sex=String(gender||"").toLowerCase(); if(cr===null||years===null||years<18)return null; const female=sex==="female"||sex==="f",k=female?0.7:0.9,alpha=female?-0.241:-0.302,sexFactor=female?1.012:1; return round(142*Math.min(cr/k,1)**alpha*Math.max(cr/k,1)**-1.2*0.9938**years*sexFactor,0); } },
};

function normalizeName(name="") { return String(name).toLowerCase().replace(/[()]/g,"").replace(/[./_-]/g," ").replace(/\s+/g," ").trim(); }
const ALIASES = {
  "total cholesterol":"Total Cholesterol","cholesterol total":"Total Cholesterol","hdl":"HDL Cholesterol","hdl cholesterol":"HDL Cholesterol","triglycerides":"Triglycerides","triglyceride":"Triglycerides","total protein":"Total Protein","albumin":"Albumin","globulin":"Globulin","total bilirubin":"Total Bilirubin","direct bilirubin":"Direct Bilirubin","blood urea":"Blood Urea","urea":"Blood Urea","serum creatinine":"Serum Creatinine","creatinine":"Serum Creatinine","haemoglobin":"Haemoglobin","hemoglobin":"Haemoglobin","hb":"Haemoglobin","rbc count":"RBC Count","total rbc count":"RBC Count","haematocrit":"Haematocrit","hematocrit":"Haematocrit","hct":"Haematocrit","total leucocyte count tlc":"Total Leucocyte Count (TLC)","total leukocyte count tlc":"Total Leucocyte Count (TLC)","tlc":"Total Leucocyte Count (TLC)","age":"Age","gender":"Gender","sex":"Gender","hba1c":"HbA1c","sperm concentration":"Sperm Concentration","semen volume":"Semen Volume","progressive motility":"Progressive Motility","non progressive motility":"Non-Progressive Motility","neutrophils":"Neutrophils","lymphocytes":"Lymphocytes","eosinophils":"Eosinophils"
};
export function canonicalParameterName(name) { const n=normalizeName(name); return ALIASES[n]||String(name||"").trim(); }
export function calculateDerivedResults(entries={}) { const values={}; Object.entries(entries).forEach(([name,value])=>{values[canonicalParameterName(name)]=value;}); const output={}; Object.entries(CALCULATION_DEFINITIONS).forEach(([target,definition])=>{const input={}; definition.requires.forEach(key=>{input[key]=values[key];}); const result=definition.calculate(input); if(result!==null) output[target]={value:result,calculationId:definition.id,formula:definition.formula};}); return output; }
export function getCalculationDefinition(testOrParameterName) { return CALCULATION_DEFINITIONS[testOrParameterName]||null; }
