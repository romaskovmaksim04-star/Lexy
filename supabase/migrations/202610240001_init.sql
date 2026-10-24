create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  path text check (path in ('ielts', 'english')),
  plan text not null default 'free' check (plan in ('free', 'pro', 'pro_plus')),
  plan_expires_at timestamptz,
  target numeric(3, 1) check (target between 0 and 9),
  exam_date date,
  lang text not null default 'ru',
  survey jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'platega',
  provider_transaction_id text unique,
  plan text not null check (plan in ('pro', 'pro_plus')),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'RUB' check (currency in ('RUB')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'canceled', 'chargebacked', 'failed')),
  payment_url text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists payments_user_created_idx on public.payments (user_id, created_at desc);
create index if not exists payments_pending_idx on public.payments (status, created_at) where status = 'pending';

alter table public.profiles enable row level security;
alter table public.payments enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists payments_select_own on public.payments;
create policy payments_select_own on public.payments
  for select to authenticated
  using (auth.uid() = user_id);

revoke all on public.profiles from anon, authenticated;
revoke all on public.payments from anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.payments to authenticated;

create or replace function public.lexy_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.lexy_touch_updated_at();

drop trigger if exists payments_touch_updated_at on public.payments;
create trigger payments_touch_updated_at
  before update on public.payments
  for each row execute function public.lexy_touch_updated_at();

create or replace function public.lexy_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        name = case when public.profiles.name = '' then excluded.name else public.profiles.name end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.lexy_handle_new_user();

create or replace function public.lexy_update_profile(
  p_name text default null,
  p_path text default null,
  p_target numeric default null,
  p_exam_date date default null,
  p_lang text default null,
  p_survey jsonb default null,
  p_settings jsonb default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  prof public.profiles;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_path is not null and p_path not in ('ielts', 'english') then
    raise exception 'invalid path' using errcode = '22023';
  end if;
  update public.profiles
     set name = coalesce(p_name, name),
         path = coalesce(p_path, path),
         target = coalesce(p_target, target),
         exam_date = coalesce(p_exam_date, exam_date),
         lang = coalesce(p_lang, lang),
         survey = coalesce(p_survey, survey),
         settings = coalesce(p_settings, settings)
   where id = uid
   returning * into prof;
  if prof.id is null then
    insert into public.profiles (id, email, name, path, target, exam_date, lang, survey, settings)
    values (
      uid,
      coalesce(auth.jwt() ->> 'email', ''),
      coalesce(p_name, ''),
      p_path,
      p_target,
      p_exam_date,
      coalesce(p_lang, 'ru'),
      coalesce(p_survey, '{}'::jsonb),
      coalesce(p_settings, '{}'::jsonb)
    )
    returning * into prof;
  end if;
  return prof;
end;
$$;

revoke all on function public.lexy_update_profile(text, text, numeric, date, text, jsonb, jsonb) from public;
grant execute on function public.lexy_update_profile(text, text, numeric, date, text, jsonb, jsonb) to authenticated;

create or replace function public.lexy_my_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  prof public.profiles;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  update public.profiles
     set plan = 'free', plan_expires_at = null
   where id = uid and plan <> 'free' and plan_expires_at is not null and plan_expires_at <= now();
  select * into prof from public.profiles where id = uid;
  return prof;
end;
$$;

revoke all on function public.lexy_my_profile() from public;
grant execute on function public.lexy_my_profile() to authenticated;

create or replace function public.lexy_confirm_payment(
  p_transaction_id text,
  p_amount numeric,
  p_currency text,
  p_raw jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pay public.payments;
  prof public.profiles;
begin
  select * into pay
    from public.payments
   where provider_transaction_id = p_transaction_id
   for update;
  if not found then
    raise exception 'payment not found' using errcode = 'P0002';
  end if;
  if pay.status = 'confirmed' then
    select * into prof from public.profiles where id = pay.user_id;
    return jsonb_build_object('payment', to_jsonb(pay), 'profile', to_jsonb(prof));
  end if;
  if pay.status not in ('pending', 'failed') then
    raise exception 'payment status %', pay.status using errcode = '22023';
  end if;
  if round(pay.amount, 2) <> round(p_amount, 2) or upper(pay.currency) <> upper(p_currency) then
    update public.payments set status = 'failed', raw = p_raw where id = pay.id;
    raise exception 'amount mismatch' using errcode = '22023';
  end if;
  update public.payments
     set status = 'confirmed', paid_at = now(), raw = p_raw
   where id = pay.id
   returning * into pay;
  update public.profiles
     set plan = pay.plan,
         plan_expires_at = greatest(coalesce(plan_expires_at, now()), now()) + interval '30 days'
   where id = pay.user_id
   returning * into prof;
  return jsonb_build_object('payment', to_jsonb(pay), 'profile', to_jsonb(prof));
end;
$$;

revoke all on function public.lexy_confirm_payment(text, numeric, text, jsonb) from public, anon, authenticated;
grant execute on function public.lexy_confirm_payment(text, numeric, text, jsonb) to service_role;

create or replace function public.lexy_fail_payment(
  p_transaction_id text,
  p_status text,
  p_raw jsonb default '{}'::jsonb
)
returns public.payments
language plpgsql
security definer
set search_path = public
as $$
declare
  pay public.payments;
  next_status text;
begin
  next_status := case
    when p_status = 'canceled' then 'canceled'
    when p_status = 'chargebacked' then 'chargebacked'
    else 'failed'
  end;
  select * into pay
    from public.payments
   where provider_transaction_id = p_transaction_id
   for update;
  if not found then
    raise exception 'payment not found' using errcode = 'P0002';
  end if;
  if pay.status = next_status then
    return pay;
  end if;
  if pay.status = 'confirmed' and next_status = 'chargebacked' then
    update public.profiles
       set plan = 'free', plan_expires_at = null
     where id = pay.user_id and plan = pay.plan;
  end if;
  if pay.status = 'confirmed' and next_status <> 'chargebacked' then
    return pay;
  end if;
  update public.payments
     set status = next_status, raw = p_raw
   where id = pay.id
   returning * into pay;
  return pay;
end;
$$;

revoke all on function public.lexy_fail_payment(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.lexy_fail_payment(text, text, jsonb) to service_role;

create or replace function public.lexy_delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.lexy_delete_account() from public;
grant execute on function public.lexy_delete_account() to authenticated;
