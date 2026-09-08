-- ============================================================================
-- TAMBAHAN: Peran baru (Akademik, Pimpinan) + Foto Profil
-- ============================================================================
-- Jalankan ini di Supabase Dashboard > SQL Editor > New Query
-- ============================================================================

-- 1. Izinkan dua peran baru di tabel profiles
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','musyrif','musyrifah','keuangan','akademik','pimpinan','santri'));

-- 2. Kolom foto profil
alter table public.profiles add column if not exists avatar_url text;

-- 3. Hak akses "Pimpinan" — boleh MELIHAT semua data (read-only), tidak mengedit
create policy "santri_select_pimpinan" on public.santri
  for select using (public.current_role() = 'pimpinan');

create policy "akademik_select_pimpinan" on public.akademik
  for select using (public.current_role() = 'pimpinan');

create policy "quran_select_pimpinan" on public.quran_log
  for select using (public.current_role() = 'pimpinan');

create policy "spp_select_pimpinan" on public.spp
  for select using (public.current_role() = 'pimpinan');

create policy "ibadah_select_pimpinan" on public.ibadah_log
  for select using (public.current_role() = 'pimpinan');

-- 4. Hak akses "Staf Akademik" — boleh mengelola tabel akademik penuh
create policy "akademik_all_staf" on public.akademik
  for all using (public.current_role() = 'akademik');

create policy "santri_select_akademik" on public.santri
  for select using (public.current_role() = 'akademik');

-- ============================================================================
-- 5. Penyimpanan Foto Profil (Supabase Storage)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Siapa saja boleh melihat foto (bucket publik, wajar untuk foto profil)
create policy "avatar_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

-- Pengguna hanya boleh mengunggah/mengganti foto milik akun sendiri
-- (nama file harus diawali dengan ID akun pengguna, contoh: {user_id}/avatar.jpg)
create policy "avatar_own_upload" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatar_own_update" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- SELESAI.
-- ============================================================================
