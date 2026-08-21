# Phase 7 Release Test Checklist

## Functional flow
- [ ] Login
- [ ] Register/select patient
- [ ] Create visit/order
- [ ] Confirm sample number and barcode
- [ ] Collect sample
- [ ] Receive/process/complete sample
- [ ] Open order result-entry queue
- [ ] Enter/save results
- [ ] Verify report
- [ ] Finalize report
- [ ] Confirm final report lock
- [ ] Create controlled revision when correction is required

## Report output
- [ ] Letterhead does not overlap patient details
- [ ] Barcode is visible above patient information
- [ ] Barcode remains visible in print preview
- [ ] A4 page has no unexpected horizontal overflow
- [ ] Test table fits within printable area
- [ ] Footer/signature remain inside A4 page
- [ ] Save as PDF produces one clean A4 report

## Regression/security
- [ ] Existing reports remain readable
- [ ] Billing/payment data unchanged
- [ ] Tenant/RLS boundaries remain enforced
- [ ] No client-side secrets are exposed
- [ ] Production build succeeds

## Release decision
Do not mark Phase 7 FINAL until all applicable checks above are verified against the deployed production build.
