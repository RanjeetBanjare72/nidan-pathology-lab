-- NIDAN Phase 3 final integrity: controlled revision numbers are assigned
-- from the live report_revisions schema and protected against concurrency.
-- Existing report data is preserved; legacy status values are normalized by
-- the UI until an authenticated data migration is run.

create or replace function public.nidan_assign_revision_no()
returns trigger
language plpgsql
as $$
declare
  current_max integer;
begin
  perform pg_advisory_xact_lock(hashtext(NEW.report_id::text));
  select coalesce(max(revision_no), 0) into current_max
  from public.report_revisions
  where report_id = NEW.report_id;

  if NEW.revision_no is null or NEW.revision_no <= current_max then
    NEW.revision_no := current_max + 1;
  end if;

  return NEW;
end;
$$;

drop trigger if exists nidan_assign_revision_no on public.report_revisions;
create trigger nidan_assign_revision_no
before insert on public.report_revisions
for each row execute function public.nidan_assign_revision_no();

create or replace function public.nidan_prevent_revision_regression()
returns trigger
language plpgsql
as $$
begin
  if NEW.revision_number < OLD.revision_number then
    NEW.revision_number := OLD.revision_number;
  end if;
  return NEW;
end;
$$;

drop trigger if exists nidan_prevent_revision_regression on public.reports;
create trigger nidan_prevent_revision_regression
before update on public.reports
for each row execute function public.nidan_prevent_revision_regression();

create index if not exists reports_status_idx on public.reports(status);
create index if not exists report_revisions_report_revision_idx
  on public.report_revisions(report_id, revision_no desc);
