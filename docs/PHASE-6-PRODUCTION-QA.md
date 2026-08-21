# NIDAN Pathology Lab — Phase 6 Production QA

## Scope
Production QA and laboratory intelligence baseline for the patient → order → sample → result → verification → release → billing workflow.

## QA checklist
- Tenant isolation: every laboratory record is scoped by lab_id and protected by RLS.
- Patient registration: unique patient number, demographic validation, mobile normalization.
- Order workflow: ordered → sample collection → processing → verification → release.
- Sample traceability: sample number/barcode must remain linked to the order and patient.
- Result integrity: abnormal/critical flags must not bypass verification.
- Report lifecycle: draft → verified → released; revisions are auditable and immutable in history.
- Billing: bill, payment, outstanding and payment status remain consistent.
- Printing: A4 report layout, header/logo/footer, reference ranges, flags and signatures are validated before release.
- Mobile: core registration, order, result and report screens must remain usable at phone width.

## Laboratory intelligence baseline
1. TAT metrics should use ordered_at, sample_collected_at, verified_at and released_at.
2. Abnormal result flags must be visible during verification.
3. Critical values should require explicit acknowledgement before release when configured by the laboratory.
4. Released reports must not be silently overwritten; corrections create a revision.
5. Barcode/sample identifiers must be searchable and traceable to patient and order.
6. Dashboard counts should be derived from current workflow status rather than duplicated counters.

## Release gate
A build is production-ready only when authentication, RLS, report status guards, revision audit, billing integrity, print/PDF rendering and mobile smoke tests pass.

## Phase 6 status
Completed as the production QA/intelligence specification and repository checkpoint. Application-level automated UI/E2E execution still depends on the deployed frontend test environment.
