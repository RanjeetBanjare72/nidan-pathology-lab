# NIDAN Pathology Lab — Phase 3

## Report Validation + Draft / Verified / Final workflow

### Status
Phase 3 foundation implemented.

### Workflow
- **Draft:** report can be entered and edited.
- **Verified:** allowed only when patient identity, selected tests and all required non-calculated parameters are complete.
- **Final:** allowed only from Verified status.
- **Final reports:** must be treated as release-locked; corrections should use a controlled revision rather than silently overwriting the released result.

### Validation rules
- Patient name is required.
- Patient gender is required.
- At least one test is required.
- Required non-calculated parameters must have a result.
- Calculated parameters are excluded from manual-completion checks.
- Missing data must never be replaced with guessed values.

### Implementation
`lib/report-validation.js` contains the shared status constants, report validation and transition guard so UI pages can use one consistent workflow.

### Next Phase 3 work
1. Connect the workflow to Result Entry and Saved Reports.
2. Persist report status and verification/finalization metadata in Supabase.
3. Lock Final reports in the UI.
4. Add controlled revision/version history.
5. Add release audit trail.
