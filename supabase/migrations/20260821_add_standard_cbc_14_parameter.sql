-- NIDAN PATHOLOGY LAB
-- Standard 14-parameter CBC investigation based on the requested CBC format.
-- The uploaded reference shows 13 measured rows; RDW-CV is added as the 14th
-- standard CBC parameter so the investigation contains exactly 14 parameters.

WITH new_test AS (
  INSERT INTO public.tests
    (name, short_name, category, department, sample_type, price, method, active, created_at, updated_at)
  SELECT
    'Complete Blood Count (CBC) - 14 Parameters',
    'CBC-14',
    'Hematology',
    'Hematology',
    'EDTA Whole Blood',
    0,
    'Automated Hematology Analyzer',
    true,
    now(),
    now()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.tests WHERE short_name = 'CBC-14'
  )
  RETURNING id
), target_test AS (
  SELECT id FROM new_test
  UNION ALL
  SELECT id FROM public.tests WHERE short_name = 'CBC-14'
  LIMIT 1
), standard_parameters AS (
  SELECT * FROM (VALUES
    (1, 'Hemoglobin', 'g/dL', NULL::numeric, NULL::numeric, 'Female: 12-15; Male: 13-17'),
    (2, 'Total Leucocyte Count', '/cumm', 4800::numeric, 10800::numeric, '4,800-10,800 /cumm'),
    (3, 'Neutrophils', '%', 40::numeric, 80::numeric, '40-80 %'),
    (4, 'Lymphocytes', '%', 20::numeric, 40::numeric, '20-40 %'),
    (5, 'Eosinophils', '%', 1::numeric, 6::numeric, '1-6 %'),
    (6, 'Monocytes', '%', 2::numeric, 10::numeric, '2-10 %'),
    (7, 'Basophils', '%', NULL::numeric, 2::numeric, '<2 %'),
    (8, 'Platelet Count', 'lakhs/cumm', 1.5::numeric, 4.1::numeric, '1.5-4.1 lakhs/cumm'),
    (9, 'Total RBC Count', 'million/cumm', 3.9::numeric, 4.8::numeric, 'Female: 3.9-4.8; Male: 4.5-5.5 million/cumm'),
    (10, 'Hematocrit Value, Hct', '%', 36::numeric, 46::numeric, '36-46 %'),
    (11, 'Mean Corpuscular Volume, MCV', 'fL', 83::numeric, 101::numeric, '83-101 fL'),
    (12, 'Mean Cell Haemoglobin, MCH', 'pg', 27::numeric, 32::numeric, '27-32 pg'),
    (13, 'Mean Cell Haemoglobin Concentration, MCHC', 'g/dL', 31.5::numeric, 36::numeric, '31.5-36 g/dL'),
    (14, 'RDW-CV', '%', 11.5::numeric, 14.5::numeric, '11.5-14.5 %')
  ) AS p(sort_order, parameter_name, unit, min_value, max_value, reference_range)
)
INSERT INTO public.test_parameters
  (test_id, parameter_name, unit, min_value, max_value, reference_range, options, sort_order, active)
SELECT
  t.id,
  p.parameter_name,
  p.unit,
  p.min_value,
  p.max_value,
  p.reference_range,
  '{}'::jsonb,
  p.sort_order,
  true
FROM target_test t
CROSS JOIN standard_parameters p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.test_parameters tp
  WHERE tp.test_id = t.id
    AND tp.sort_order = p.sort_order
);
