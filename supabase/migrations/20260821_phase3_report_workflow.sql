-- NIDAN Phase 3: report lifecycle, revisions and audit trail
-- Safe additive migration. Existing report data is preserved.

alter table if exists public.reports
  add column if not exists status text not null default 'draft',
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by text,
  add column if not exists finalized_at timestamptz,
  add column if not exists finalized_by text,
  add column if not exists revision integer not null default 1,
  add column if not exists parent_report_id uuid;

alter table if exists public.reports
  drop constraint if exists reports_status_check;

alter table if exists public.reports
  add constraint reports_status_check
  check (status in ('draft','verified','final'));

create index if not exists reports_status_idx on public.reports(status);
create index if not exists reports_parent_report_id_idx on public.reports(parent_report_id);

create table if not exists public.report_revisions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  revision integer not null,
  status text not null default 'draft' check (status in ('draft','verified','final')),
  report_data jsonb not null default '{}'::jsonb,
  changed_by text,
  change_reason text,
  created_at timestamptz not null default now(),
  unique(report_id, revision)
);

create index if not exists report_revisions_report_id_idx
  on public.report_revisions(report_id, revision desc);

create table if not exists public.report_audit_log (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  action text not null,
  from_status text,
  to_status text,
  actor text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists report_audit_log_report_id_idx
  on public.report_audit_log(report_id, created_at desc);
