-- ============================================================================
-- SIAKAD DARUL HIKMAH — Database Schema + Row Level Security
-- ============================================================================
-- Jalankan seluruh file ini di: Supabase Dashboard > SQL Editor > New Query
-- Ini akan membuat semua tabel DAN aturan keamanan yang dijalankan langsung
-- oleh database (bukan hanya disembunyikan di tampilan aplikasi).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PROFILES — menghubungkan akun login (auth.users) dengan peran & identitas
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,          -- NIM (santri) atau username staf
  email text unique not null,             -- email sintetis untuk login, contoh: 2024001@santri.internal
  role text not null check (role in ('admin','musyrif','musyrifah','keuangan','santri')),
  nama text not null,
  nim text,                               -- diisi hanya untuk role santri
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Setiap orang boleh membaca profil dirinya sendiri
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- Fungsi bantu (SECURITY DEFINER) — dipakai di kebijakan tabel lain
-- supaya aman dari infinite-recursion saat memeriksa role/username pengguna.
-- ----------------------------------------------------------------------------
create or replace function public.current_role() returns text
language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_username() returns text
language sql security definer stable as $$
  select username from public.profiles where id = auth.uid();
$$;

create or replace function public.current_nim() returns text
language sql security definer stable as $$
  select nim from public.profiles where id = auth.uid();
$$;

-- Admin boleh membaca semua profil (memakai fungsi di atas, aman dari rekursi)
create policy "profiles_select_admin" on public.profiles
  for select using (public.current_role() = 'admin');

create policy "profiles_admin_write" on public.profiles
  for all using (public.current_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 2. SANTRI — data induk mahasantri
-- ----------------------------------------------------------------------------
create table public.santri (
  nim text primary key,
  nama text not null,
  jk text not null default 'Santri',
  kelas text not null,
  angkatan text not null,
  kamar text,
  musyrif_username text,
  juz_dikuasai int[] not null default '{}',
  created_at timestamptz default now()
);

alter table public.santri enable row level security;

create policy "santri_select_own" on public.santri
  for select using (public.current_role() = 'santri' and nim = public.current_nim());

create policy "santri_select_musyrif" on public.santri
  for select using (public.current_role() in ('musyrif','musyrifah') and musyrif_username = public.current_username());

create policy "santri_select_staff" on public.santri
  for select using (public.current_role() in ('admin','keuangan'));

create policy "santri_write_admin" on public.santri
  for all using (public.current_role() = 'admin');

-- Musyrif boleh memperbarui HANYA kolom juz_dikuasai milik santri binaannya
-- (ditegakkan lewat trigger di bawah, karena RLS tidak bisa membatasi per-kolom)
create policy "santri_update_musyrif" on public.santri
  for update using (public.current_role() in ('musyrif','musyrifah') and musyrif_username = public.current_username());

create or replace function public.restrict_santri_update_to_musyrif() returns trigger
language plpgsql as $$
begin
  if public.current_role() in ('musyrif','musyrifah') then
    if new.nama <> old.nama or new.kelas <> old.kelas or new.kamar is distinct from old.kamar
       or new.musyrif_username is distinct from old.musyrif_username then
      raise exception 'Musyrif hanya boleh memperbarui data hafalan (juz_dikuasai)';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_restrict_santri_update
  before update on public.santri
  for each row execute function public.restrict_santri_update_to_musyrif();

-- ----------------------------------------------------------------------------
-- 3. AKADEMIK — KRS / KHS
-- ----------------------------------------------------------------------------
create table public.akademik (
  id uuid primary key default gen_random_uuid(),
  nim text not null references public.santri(nim) on delete cascade,
  tahun_ajaran text not null,
  semester text not null check (semester in ('Ganjil','Genap')),
  mata_pelajaran text not null,
  sks int not null default 2,
  status text not null default 'aktif' check (status in ('aktif','selesai')),
  nilai_angka numeric,
  created_at timestamptz default now()
);

alter table public.akademik enable row level security;

create policy "akademik_select_own" on public.akademik
  for select using (public.current_role() = 'santri' and nim = public.current_nim());

create policy "akademik_all_admin" on public.akademik
  for all using (public.current_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 4. CAPAIAN QUR'AN
-- ----------------------------------------------------------------------------
create table public.quran_log (
  id uuid primary key default gen_random_uuid(),
  nim text not null references public.santri(nim) on delete cascade,
  tanggal date not null default current_date,
  jenis text not null check (jenis in ('Setoran Baru','Murojaah','Tasmi''')),
  juz int not null check (juz between 1 and 30),
  halaman_dari int not null default 1,
  halaman_sampai int not null default 1,
  kelancaran text not null default 'Lancar' check (kelancaran in ('Lancar','Cukup','Kurang')),
  catatan text,
  musyrif text,
  created_at timestamptz default now()
);

alter table public.quran_log enable row level security;

create policy "quran_select_own" on public.quran_log
  for select using (public.current_role() = 'santri' and nim = public.current_nim());

create policy "quran_select_musyrif" on public.quran_log
  for select using (
    public.current_role() in ('musyrif','musyrifah')
    and nim in (select s.nim from public.santri s where s.musyrif_username = public.current_username())
  );

create policy "quran_insert_musyrif" on public.quran_log
  for insert with check (
    public.current_role() in ('musyrif','musyrifah')
    and nim in (select s.nim from public.santri s where s.musyrif_username = public.current_username())
  );

create policy "quran_all_admin" on public.quran_log
  for all using (public.current_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 5. SPP — pembayaran bulanan
-- ----------------------------------------------------------------------------
create table public.spp (
  id uuid primary key default gen_random_uuid(),
  nim text not null references public.santri(nim) on delete cascade,
  bulan text not null,
  tahun int not null,
  nominal numeric not null default 500000,
  status text not null default 'Belum Lunas' check (status in ('Lunas','Belum Lunas')),
  tanggal_bayar date,
  metode text,
  created_at timestamptz default now()
);

alter table public.spp enable row level security;

create policy "spp_select_own" on public.spp
  for select using (public.current_role() = 'santri' and nim = public.current_nim());

create policy "spp_all_keuangan" on public.spp
  for all using (public.current_role() in ('admin','keuangan'));

-- ----------------------------------------------------------------------------
-- 6. Fungsi login: cari email dari username/NIM (dipakai halaman login)
-- Hanya mengembalikan email, tidak membocorkan data lain.
-- ----------------------------------------------------------------------------
create or replace function public.get_login_email(p_username text) returns text
language sql security definer stable as $$
  select email from public.profiles where username = p_username;
$$;

grant execute on function public.get_login_email(text) to anon, authenticated;

-- ============================================================================
-- SELESAI. Langkah berikutnya: buat akun admin pertama lewat
-- Supabase Dashboard > Authentication > Add User, lalu tambahkan baris
-- yang sesuai di tabel "profiles" (lihat README.md bagian "Akun Admin Pertama").
-- ============================================================================
