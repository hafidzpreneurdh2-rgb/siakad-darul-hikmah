-- ============================================================================
-- SIAKAD DARUL HIKMAH — SETUP LENGKAP (Bersihkan dulu, lalu bangun ulang)
-- ============================================================================
-- Jalankan file ini SEKALI SAJA dari atas sampai bawah, sebagai satu query.
-- File ini otomatis membersihkan sisa tabel yang mungkin sudah setengah jadi
-- dari percobaan sebelumnya, lalu membangun semuanya dari awal dengan bersih.
--
-- CATATAN: kalau Anda sudah sempat membuat baris admin di tabel "profiles"
-- sebelumnya, baris itu akan ikut terhapus oleh proses bersih-bersih ini.
-- Akun LOGIN admin (di Authentication > Users) TIDAK terhapus — nanti
-- tinggal dibuatkan lagi baris profil-nya di Langkah "Akun Admin Pertama"
-- pada README, itu langkah cepat kok.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- BAGIAN 0 — BERSIHKAN SISA YANG MUNGKIN SUDAH ADA
-- ----------------------------------------------------------------------------
drop table if exists public.ibadah_log cascade;
drop table if exists public.spp cascade;
drop table if exists public.quran_log cascade;
drop table if exists public.akademik cascade;
drop table if exists public.santri cascade;
drop table if exists public.profiles cascade;
drop function if exists public.current_role() cascade;
drop function if exists public.current_username() cascade;
drop function if exists public.current_nim() cascade;
drop function if exists public.get_login_email(text) cascade;
drop function if exists public.restrict_santri_update_to_musyrif() cascade;

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- BAGIAN 1 — PROFILES
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  email text unique not null,
  role text not null check (role in ('admin','musyrif','musyrifah','keuangan','akademik','pimpinan','santri')),
  nama text not null,
  nim text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

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

create policy "profiles_select_admin" on public.profiles
  for select using (public.current_role() = 'admin');

create policy "profiles_admin_write" on public.profiles
  for all using (public.current_role() = 'admin');

-- ----------------------------------------------------------------------------
-- BAGIAN 2 — SANTRI
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

create policy "santri_select_pimpinan" on public.santri
  for select using (public.current_role() = 'pimpinan');

create policy "santri_select_akademik" on public.santri
  for select using (public.current_role() = 'akademik');

create policy "santri_write_admin" on public.santri
  for all using (public.current_role() = 'admin');

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
-- BAGIAN 3 — AKADEMIK
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

create policy "akademik_all_staf" on public.akademik
  for all using (public.current_role() = 'akademik');

create policy "akademik_select_pimpinan" on public.akademik
  for select using (public.current_role() = 'pimpinan');

-- ----------------------------------------------------------------------------
-- BAGIAN 4 — CAPAIAN QUR'AN
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

create policy "quran_select_pimpinan" on public.quran_log
  for select using (public.current_role() = 'pimpinan');

-- ----------------------------------------------------------------------------
-- BAGIAN 5 — LAPORAN IBADAH
-- ----------------------------------------------------------------------------
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

create policy "ibadah_select_pimpinan" on public.ibadah_log
  for select using (public.current_role() = 'pimpinan');

-- ----------------------------------------------------------------------------
-- BAGIAN 6 — SPP
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

create policy "spp_select_pimpinan" on public.spp
  for select using (public.current_role() = 'pimpinan');

-- ----------------------------------------------------------------------------
-- BAGIAN 7 — FUNGSI LOGIN
-- ----------------------------------------------------------------------------
create or replace function public.get_login_email(p_username text) returns text
language sql security definer stable as $$
  select email from public.profiles where username = p_username;
$$;

grant execute on function public.get_login_email(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- BAGIAN 8 — PENYIMPANAN FOTO PROFIL
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar_public_read" on storage.objects;
drop policy if exists "avatar_own_upload" on storage.objects;
drop policy if exists "avatar_own_update" on storage.objects;

create policy "avatar_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatar_own_upload" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatar_own_update" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- SELESAI! Semua tabel, keamanan, peran, dan penyimpanan foto sudah siap.
-- Langkah berikutnya: buat akun admin pertama (lihat README.md bagian
-- "Akun Admin Pertama" / "Membuat Akun Admin Pertama").
-- ============================================================================
