# SIAKAD Darul Hikmah — Panduan Deploy (Gratis)

Aplikasi ini memakai dua layanan gratis:
- **Supabase** — database, autentikasi (login), dan keamanan data
- **Vercel** — hosting agar aplikasi bisa diakses lewat internet

Kedua layanan ini **gratis** di skala pondok Anda (100–500 santri). Total waktu
setup sekitar **30–60 menit**, tidak perlu bisa coding — cukup ikuti langkah
di bawah persis seperti tertulis.

> 💡 **Cara termudah:** buka file proyek ini di Claude Code dan minta Claude
> menemani Anda menjalankan setiap langkah secara langsung — ia bisa
> menjalankan perintah dan memeriksa hasilnya bersama Anda secara real-time.

---

## Bagian 1 — Membuat Database (Supabase)

1. Buka **supabase.com** → klik **Start your project** → daftar (bisa pakai akun Google).
2. Klik **New Project**. Isi:
   - Name: `siakad-darul-hikmah`
   - Database Password: buat kata sandi kuat, **simpan di tempat aman**
   - Region: pilih **Southeast Asia (Singapore)** agar akses dari Indonesia cepat
3. Tunggu ± 2 menit sampai project siap.
4. Di menu kiri, klik **SQL Editor** → **New query**.
5. Buka file `supabase/schema.sql` dari proyek ini, salin **seluruh isinya**,
   tempel ke SQL Editor, lalu klik **Run**.
   Jika berhasil akan muncul "Success. No rows returned."
6. Buka **Project Settings (ikon gerigi) → API**. Catat dua nilai ini:
   - **Project URL**
   - **anon public key**
   (Nanti dipakai di Bagian 3.)

---

## Bagian 2 — Fungsi Pembuatan Akun (Edge Function)

Ini bagian yang membuat pembuatan akun santri/staf aman (kunci rahasia tidak
pernah terbuka ke browser).

1. Install Supabase CLI (sekali saja di komputer Anda):
   ```
   npm install -g supabase
   ```
2. Login: `supabase login`
3. Di dalam folder proyek ini, hubungkan ke project Anda:
   ```
   supabase link --project-ref XXXXXXXXXXXX
   ```
   (XXXXXXXXXXXX ada di Project Settings → General → Reference ID)
4. Deploy fungsinya:
   ```
   supabase functions deploy create-user
   ```
5. Set kunci rahasia untuk fungsi ini (ambil dari Project Settings → API → `service_role` key — **JANGAN pernah taruh ini di kode frontend**):
   ```
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=isi_kunci_disini
   supabase secrets set SUPABASE_URL=isi_project_url_disini
   supabase secrets set SUPABASE_ANON_KEY=isi_anon_key_disini
   ```

---

## Bagian 3 — Membuat Akun Admin Pertama

Karena belum ada admin, akun pertama dibuat manual lewat Dashboard:

1. Supabase Dashboard → **Authentication → Users → Add user**.
   - Email: `admin@santri.internal`
   - Password: buat kata sandi kuat
   - Centang **Auto Confirm User**
2. Klik **Table Editor → profiles → Insert row**:
   - `id`: salin dari user yang baru dibuat di langkah 1
   - `username`: `admin`
   - `email`: `admin@santri.internal`
   - `role`: `admin`
   - `nama`: nama Anda
3. Selesai — nanti login pakai username `admin`.

Untuk santri/staf berikutnya, **tidak perlu manual lagi** — cukup pakai
halaman **Kelola Akun** di dalam aplikasi (Bagian 2 di atas harus sudah selesai).

---

## Bagian 4 — Menjalankan di Komputer (opsional, untuk uji coba)

```
npm install
cp .env.example .env
```
Buka file `.env`, isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dengan
nilai dari Bagian 1 langkah 6. Lalu:
```
npm run dev
```
Buka `http://localhost:5173` di browser.

---

## Bagian 5 — Deploy ke Internet (Vercel)

1. Buat repository GitHub baru, upload seluruh folder proyek ini ke sana.
   (Termudah: buka GitHub Desktop, atau minta bantuan Claude Code.)
2. Buka **vercel.com** → daftar dengan akun GitHub Anda.
3. Klik **Add New → Project**, pilih repository yang baru diupload.
4. Sebelum klik Deploy, buka **Environment Variables**, tambahkan:
   - `VITE_SUPABASE_URL` = (dari Bagian 1)
   - `VITE_SUPABASE_ANON_KEY` = (dari Bagian 1)
5. Klik **Deploy**. Tunggu ± 1 menit.
6. Selesai! Aplikasi Anda sudah online di alamat seperti
   `siakad-darul-hikmah.vercel.app` — bisa dibagikan ke wali santri.

*(Opsional: sambungkan domain sendiri, misal `siakad.ponpesdarulhikmah.sch.id`,
lewat menu Vercel → Domains.)*

---

## Checklist Keamanan yang Sudah Berjalan

- ✅ Kata sandi di-hash otomatis oleh Supabase Auth (tidak pernah tersimpan mentah)
- ✅ Data terenkripsi saat perpindahan (HTTPS otomatis dari Vercel & Supabase)
- ✅ Row Level Security — **database sendiri yang menolak** akses data santri
  lain, bukan hanya disembunyikan di tampilan aplikasi
- ✅ Kunci rahasia (`service_role`) hanya hidup di server (Edge Function),
  tidak pernah terkirim ke browser
- ✅ Backup otomatis harian dijalankan oleh Supabase

## Jika Butuh Bantuan

Proyek ini paling nyaman dikerjakan bersama **Claude Code** (aplikasi
Anthropic untuk coding) — Anda bisa membuka folder ini di sana dan minta
Claude menjalankan tiap langkah bersama Anda, termasuk memperbaiki error jika
ada, secara langsung dan real-time.
