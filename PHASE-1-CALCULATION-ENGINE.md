# NIDAN Phase 1 — Test Value & Calculation Engine

The Phase 1 engine supports two types of test values:

1. **Direct values** entered by the laboratory/analyzer.
2. **Derived values** calculated from validated input parameters.

Derived values must never overwrite the original measured inputs. Each derived result carries a calculation ID and formula for traceability.

## Implemented calculation catalog

- LDL Cholesterol — Friedewald; disabled when triglycerides are >=400 mg/dL.
- VLDL Cholesterol — triglycerides / 5.
- Non-HDL Cholesterol — total cholesterol - HDL.
- Total Cholesterol/HDL Ratio.
- Globulin — total protein - albumin.
- A/G Ratio — albumin / globulin.
- Indirect Bilirubin — total - direct.
- BUN — urea x 0.467 when converting urea mg/dL to BUN mg/dL.
- MCH — Hb x 10 / RBC count.
- MCHC — Hb x 100 / hematocrit.
- AEC — TLC x eosinophil percentage / 100.
- ANC — TLC x neutrophil percentage / 100.
- NLR — neutrophil percentage / lymphocyte percentage.
- eAG — 28.7 x HbA1c - 46.7 mg/dL.
- Total sperm count — concentration x semen volume.
- Total motility — progressive + non-progressive motility.
- eGFR — CKD-EPI 2021 for adults >=18 years, requiring creatinine, age and sex.

## Safety rules

- Missing/non-numeric inputs produce no calculated value.
- Division by zero is blocked.
- LDL Friedewald calculation is blocked at triglycerides >=400 mg/dL.
- Database/laboratory-specific reference ranges should take precedence over fallback ranges.
- Calculations are decision-support/reporting functions and require laboratory/pathologist verification according to the laboratory SOP and analyzer method.
