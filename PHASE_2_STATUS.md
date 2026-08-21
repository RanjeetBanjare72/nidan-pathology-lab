# NIDAN Pathology Lab — Phase 2

Phase 2 started: Calculation Metadata + CBC Calculation Expansion.

- Added calculation metadata fields to `test_parameters`.
- CBC calculated parameters are being expanded to include MCV, ANC, ALC, AEC, NLR and Mentzer Index.
- Result-entry calculated values remain read-only and are derived only when required primary inputs are present.
- Final clinical values must be verified against the laboratory SOP/analyzer before release.
