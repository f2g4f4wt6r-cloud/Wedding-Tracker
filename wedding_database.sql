-- AMORE WEDDING PLANNER DATABASE
-- PostgreSQL / Supabase compatible
-- No sample guest/vendor/budget data is inserted.

create extension if not exists pgcrypto;

create table if not exists weddings (
    id uuid primary key default gen_random_uuid(),
    couple_name text not null default '',
    wedding_date date,
    venue text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists budget_categories (
    id uuid primary key default gen_random_uuid(),
    wedding_id uuid not null references weddings(id) on delete cascade,
    name text not null,
    amount numeric(12,2) not null default 0,
    spent numeric(12,2) not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists additional_expense_settings (
    wedding_id uuid primary key references weddings(id) on delete cascade,
    budget numeric(12,2) not null default 0,
    updated_at timestamptz not null default now()
);

create table if not exists additional_expenses (
    id uuid primary key default gen_random_uuid(),
    wedding_id uuid not null references weddings(id) on delete cascade,
    expense_date date,
    category text not null default '',
    description text not null default '',
    amount numeric(12,2) not null default 0,
    status text not null default 'Pending',
    notes text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists guests (
    id uuid primary key default gen_random_uuid(),
    wedding_id uuid not null references weddings(id) on delete cascade,
    name text not null,
    side text not null default 'Bride',
    phone text not null default '',
    email text not null default '',
    meal text not null default 'Standard',
    plus_one text not null default 'No',
    status text not null default 'Pending',
    notes text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists guests_wedding_id_idx on guests(wedding_id);
create index if not exists guests_status_idx on guests(wedding_id, status);

create table if not exists vendors (
    id uuid primary key default gen_random_uuid(),
    wedding_id uuid not null references weddings(id) on delete cascade,
    category text not null default '',
    name text not null,
    contact_person text not null default '',
    phone text not null default '',
    email text not null default '',
    status text not null default 'Pending',
    total numeric(12,2) not null default 0,
    paid numeric(12,2) not null default 0,
    due_date date,
    notes text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists vendors_wedding_id_idx on vendors(wedding_id);

create table if not exists tasks (
    id uuid primary key default gen_random_uuid(),
    wedding_id uuid not null references weddings(id) on delete cascade,
    title text not null,
    done boolean not null default false,
    task_group text not null default '12+ MONTHS BEFORE',
    due_date date,
    priority text not null default 'Medium',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists tasks_wedding_id_idx on tasks(wedding_id);

create table if not exists notes (
    id uuid primary key default gen_random_uuid(),
    wedding_id uuid not null references weddings(id) on delete cascade,
    title text not null default '',
    text text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists rsvp_responses (
    id uuid primary key default gen_random_uuid(),
    wedding_id uuid not null references weddings(id) on delete cascade,
    response_name text not null default '',
    email text not null default '',
    phone text not null default '',
    rsvp_status text not null default '',
    raw_response jsonb not null default '{}'::jsonb,
    response_date timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (wedding_id, response_name, email)
);

create table if not exists app_settings (
    id uuid primary key default gen_random_uuid(),
    wedding_id uuid not null references weddings(id) on delete cascade,
    setting_key text not null,
    setting_value text not null default '',
    updated_at timestamptz not null default now(),
    unique (wedding_id, setting_key)
);

-- Useful summary views
create or replace view wedding_budget_summary as
select
    w.id as wedding_id,
    coalesce(sum(b.amount), 0) as allocated_budget,
    coalesce(sum(b.spent), 0) as allocated_spent,
    coalesce(sum(b.amount), 0) - coalesce(sum(b.spent), 0) as allocated_remaining
from weddings w
left join budget_categories b on b.wedding_id = w.id
group by w.id;

create or replace view wedding_guest_summary as
select
    wedding_id,
    count(*) as total_guests,
    count(*) filter (where status = 'RSVP Received') as confirmed_guests,
    count(*) filter (where status = 'Pending') as pending_guests,
    count(*) filter (where status = 'Declined') as declined_guests
from guests
group by wedding_id;

-- Seed only the default checklist that already exists in the website.
-- No personal wedding/guest/vendor data is inserted.
insert into weddings (couple_name, venue)
select '', ''
where not exists (select 1 from weddings);

insert into tasks (wedding_id, title, done, task_group, priority)
select w.id, x.title, false, x.task_group, x.priority
from weddings w
cross join (values
    ('Book caterer', '12+ MONTHS BEFORE', 'High'),
    ('Book live music or DJ', '12+ MONTHS BEFORE', 'Medium'),
    ('Plan honeymoon destination', '12+ MONTHS BEFORE', 'Medium'),
    ('Send save the dates', '12+ MONTHS BEFORE', 'High'),
    ('Research and book photographer', '12+ MONTHS BEFORE', 'High'),
    ('Choose wedding invitations', '9–12 MONTHS BEFORE', 'Medium'),
    ('Book florist', '9–12 MONTHS BEFORE', 'High'),
    ('Finalize wedding guest list', '9–12 MONTHS BEFORE', 'High'),
    ('Choose wedding dress', '9–12 MONTHS BEFORE', 'High'),
    ('Book hair and makeup', '6–9 MONTHS BEFORE', 'Medium'),
    ('Order wedding rings', '6–9 MONTHS BEFORE', 'High'),
    ('Book ceremony officiant', '6–9 MONTHS BEFORE', 'High')
) as x(title, task_group, priority)
where not exists (
    select 1 from tasks t
    where t.wedding_id = w.id and t.title = x.title
);
