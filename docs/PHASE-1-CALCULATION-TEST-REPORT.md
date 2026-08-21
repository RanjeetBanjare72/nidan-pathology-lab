# NIDAN Pathology Lab — Phase 1 Calculation Verification

## Scope
Automated checks cover the centralized calculation engine before production merge. The engine itself states that derived values must not replace laboratory SOPs, analyzer calculations, or pathologist verification.

## Covered groups
- CBC: MCH, MCHC, AEC, ANC, NLR
- Lipid: LDL (Friedewald safety cutoff), VLDL, Non-HDL, TC/HDL ratio
- Liver/protein: Globulin, A/G ratio, indirect bilirubin
- Renal: BUN and adult CKD-EPI 2021 eGFR inputs
- Diabetes: eAG
- Semen analysis: total sperm count and total motility
- Safety: missing/non-numeric inputs and divide-by-zero cases

## Important validation rules
- Friedewald LDL is not generated when triglycerides are >=400 mg/dL.
- eGFR is not generated for age <18 by this implementation and requires sex plus serum creatinine.
- Calculations are withheld when required inputs are blank, non-numeric, or create a zero denominator.
- Derived values should remain visibly identifiable as calculated values and should be reviewed according to the laboratory SOP before report authorization.

## Test execution
The repository now includes a Vitest test script and test suite. Run `npm test` in the project environment. Production merge should occur only after the test suite passes and representative UI Result Entry cases are manually verified.
