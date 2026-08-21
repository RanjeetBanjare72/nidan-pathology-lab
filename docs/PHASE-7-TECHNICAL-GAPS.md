# Phase 7 — Technical Gap Closure

## Scope

Phase 7 closes the remaining production gaps without changing laboratory results or reference ranges.

### Required production gates

1. Single authoritative A4 report print layout.
2. Barcode visible in preview and print/PDF output.
3. Patient → Visit → Order → Sample → Result → Verify → Final → Report traceability.
4. Production build must pass before release.
5. Existing data and RLS must remain protected.
6. Final visual QA must be performed on the deployed application.

## Current implementation notes

- Report lifecycle supports DRAFT → VERIFIED → FINAL and controlled revision.
- Laboratory orders and samples have barcode/sample lifecycle support.
- Report printing currently uses browser print/PDF; the production stylesheet is responsible for A4 geometry.
- Browser-based visual verification remains a release gate and must not be represented as completed unless it has actually been performed.

## Release rule

Phase 7 is considered FINAL only when the production deployment is READY and the above end-to-end workflow has been manually verified without regression.
