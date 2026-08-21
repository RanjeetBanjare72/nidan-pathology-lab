# NIDAN Pathology Lab — Phase 5 Production Security

## Status
Implemented on 2026-08-21.

## Scope
Phase 5 hardens the production database/API boundary after the Phase 4 laboratory operations and billing work.

### Completed
- Locked down trigger-only PostgreSQL functions so they cannot be called through the Supabase API.
- Removed anonymous EXECUTE access from `current_user_lab_ids()` while preserving authenticated access required by tenant RLS policies.
- Pinned security-sensitive function `search_path` values to `public`.
- Added tenant-aware SELECT/INSERT RLS policies for `report_audit_log` through `report_id -> reports.lab_id`.
- Explicitly revoked anonymous access to report audit history.
- Rechecked Supabase security advisors after migration.

## Advisor status
The remaining warnings are intentional/operational:
1. `current_user_lab_ids()` remains SECURITY DEFINER and executable by authenticated users because existing tenant RLS policies depend on it. Changing this without redesigning the membership RLS model could break tenant isolation.
2. Supabase Auth leaked-password protection remains disabled and should be enabled from the Supabase Auth password-security settings before production launch.

## Phase 5 acceptance criteria
- Anonymous users cannot execute internal trigger functions.
- Anonymous users cannot access report audit history.
- Authenticated users can continue using tenant RLS through `current_user_lab_ids()`.
- Report audit records are tenant-scoped through the parent report.
- Security-sensitive functions have a fixed search path.

## Next phase
Phase 6 should focus on production QA and operational observability: automated workflow checks, TAT metrics, critical-result controls, delivery tracking, and end-to-end report/print verification.
