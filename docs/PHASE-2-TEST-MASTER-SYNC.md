# NIDAN Pathology Lab — Phase 2

## Test Master → Test Selection → Result Entry contract

Phase 2 is complete only when the production UI uses one authoritative test/parameter source. The current legacy Test Selection page still contains a hardcoded MASTER_TESTS catalog; this document records the required migration contract and prevents the hardcoded catalog from being treated as the final source of truth.

### Required production behavior
1. Test Master/Supabase is authoritative for tests, parameters, units, prices and reference ranges.
2. Test Selection loads active tests from Supabase and retains a safe fallback only for transient read failure.
3. Selected test IDs, not copied parameter objects, are persisted through the patient/billing flow.
4. Result Entry resolves current active parameters from the selected test IDs.
5. Calculation metadata is resolved centrally; calculated parameters are read-only and are never manually overwritten.
6. Final Report reads the saved result snapshot, preserving the exact unit/reference range used when authorized.
7. Price changes in Test Master affect new bills without rewriting historical bills.

### Acceptance checks
- Add/edit/deactivate a parameter in Test Master and verify Result Entry reflects it after refresh.
- Change a test price and verify only a new bill uses the new price.
- Select two tests, reload, and verify the same test IDs restore.
- Enter primary values and verify calculated parameters update without manual entry.
- Save results and reopen the report; values, units and ranges must remain identical.

### Status
The existing application has the required modules, but the hardcoded catalog in `app/tests/page.js` is still present. Therefore this checkpoint must **not** be called fully production-complete until the UI migration is implemented and these acceptance checks pass.
