-- NIDAN Phase 4: operations workflow + billing integrity
create index if not exists idx_visits_patient_date on public.visits(patient_id, visit_date desc);
create index if not exists idx_visits_status_date on public.visits(status, visit_date desc);
create index if not exists idx_lab_orders_status_date on public.lab_orders(status, ordered_at desc);
create index if not exists idx_lab_samples_status_date on public.lab_samples(status, created_at desc);
create index if not exists idx_bills_payment_status_date on public.bills(payment_status, bill_date desc);
create index if not exists idx_bill_payments_bill_date on public.bill_payments(bill_id, paid_at desc);

create or replace function public.nidan_recalculate_bill_payment_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bill_id bigint;
  v_net numeric;
  v_paid numeric;
  v_balance numeric;
  v_status text;
begin
  v_bill_id := coalesce(new.bill_id, old.bill_id);
  select coalesce(net_amount,0) into v_net from public.bills where id = v_bill_id for update;
  select coalesce(sum(amount),0) into v_paid from public.bill_payments where bill_id = v_bill_id;
  v_paid := greatest(0, least(v_paid, v_net));
  v_balance := greatest(v_net - v_paid, 0);
  v_status := case when v_net <= 0 then 'Not Billed' when v_balance <= 0 then 'Paid' when v_paid > 0 then 'Partial' else 'Unpaid' end;
  update public.bills set paid_amount = v_paid, paid = v_paid, balance = v_balance, payment_status = v_status where id = v_bill_id;
  if TG_OP = 'DELETE' then return old; else return new; end if;
end;
$$;

drop trigger if exists trg_bill_payment_totals on public.bill_payments;
create trigger trg_bill_payment_totals after insert or update or delete on public.bill_payments for each row execute function public.nidan_recalculate_bill_payment_totals();

create or replace function public.nidan_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_visits_updated_at on public.visits;
create trigger trg_visits_updated_at before update on public.visits for each row execute function public.nidan_touch_updated_at();
drop trigger if exists trg_lab_orders_updated_at on public.lab_orders;
create trigger trg_lab_orders_updated_at before update on public.lab_orders for each row execute function public.nidan_touch_updated_at();
drop trigger if exists trg_lab_samples_updated_at on public.lab_samples;
create trigger trg_lab_samples_updated_at before update on public.lab_samples for each row execute function public.nidan_touch_updated_at();
