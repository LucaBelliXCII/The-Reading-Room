-- The Reading Room: apply in Supabase > SQL Editor.
-- Private per-user notes, favorite flags, status and custom books.
create table if not exists public.rr_book_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id text not null check (char_length(book_id) between 1 and 128),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id)
);
create table if not exists public.rr_custom_books (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id text not null check (char_length(book_id) between 1 and 128),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id)
);
alter table public.rr_book_progress enable row level security;
alter table public.rr_custom_books enable row level security;
revoke all on table public.rr_book_progress from anon, authenticated;
revoke all on table public.rr_custom_books from anon, authenticated;
grant select, insert, update on table public.rr_book_progress to authenticated;
grant select, insert, update on table public.rr_custom_books to authenticated;

drop policy if exists "rr_progress_select_own" on public.rr_book_progress;
drop policy if exists "rr_progress_insert_own" on public.rr_book_progress;
drop policy if exists "rr_progress_update_own" on public.rr_book_progress;
create policy "rr_progress_select_own" on public.rr_book_progress for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "rr_progress_insert_own" on public.rr_book_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "rr_progress_update_own" on public.rr_book_progress for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "rr_custom_select_own" on public.rr_custom_books;
drop policy if exists "rr_custom_insert_own" on public.rr_custom_books;
drop policy if exists "rr_custom_update_own" on public.rr_custom_books;
create policy "rr_custom_select_own" on public.rr_custom_books for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "rr_custom_insert_own" on public.rr_custom_books for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "rr_custom_update_own" on public.rr_custom_books for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);