-- ============================================================================
-- TAMBAHAN: Tabel Laporan Ibadah
-- ============================================================================
-- Jalankan ini di Supabase Dashboard > SQL Editor > New Query
-- (Project Anda sudah punya tabel lain dari schema.sql sebelumnya —
--  ini HANYA menambahkan tabel baru untuk fitur "Laporan Ibadah")
-- ============================================================================

create table public.ibadah_log (
  id uuid primary key default gen_random_uuid(),
  nim text not null references public.santri(nim) on delete cascade,
  tanggal date not null default current_date,
  jenis text not null,
  capaian text not null default 'Baik' check (capaian in ('Baik','Cukup','Kurang')),
  catatan text,
  musyrif text,
  created_at timestamptz default now()
);

alter table public.ibadah_log enable row level security;

create policy "ibadah_select_own" on public.ibadah_log
  for select using (public.current_role() = 'santri' and nim = public.current_nim());

create policy "ibadah_select_musyrif" on public.ibadah_log
  for select using (
    public.current_role() in ('musyrif','musyrifah')
    and nim in (select s.nim from public.santri s where s.musyrif_username = public.current_username())
  );

create policy "ibadah_insert_musyrif" on public.ibadah_log
  for insert with check (
    public.current_role() in ('musyrif','musyrifah')
    and nim in (select s.nim from public.santri s where s.musyrif_username = public.current_username())
  );

create policy "ibadah_all_admin" on public.ibadah_log
  for all using (public.current_role() = 'admin');

-- Selesai. Fitur "Laporan Ibadah" di aplikasi sekarang siap dipakai.
