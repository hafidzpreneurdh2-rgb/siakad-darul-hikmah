import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import { supabase } from "./supabaseClient.js";

// Pustaka Excel dimuat saat dibutuhkan dari CDN (bukan dari npm), sehingga build/deploy tidak bergantung paket "xlsx".
let _xlsxPromise = null;
const muatXLSX = () => {
  if (!_xlsxPromise) {
    _xlsxPromise = import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm")
      .then((mod) => (mod.default?.utils ? mod.default : mod))
      .catch((e) => { _xlsxPromise = null; throw new Error("Pustaka Excel gagal dimuat. Periksa koneksi internet lalu coba lagi."); });
  }
  return _xlsxPromise;
};

const BrandContext = createContext({ warna_utama: "#0B3B36", warna_aksen: "#B8935A" });

/* Ukuran tampilan (ukuran huruf dasar). Semua ukuran rem ikut membesar. */
const UI_SIZES = [15, 16, 17, 18, 20];
const UI_SIZE_LABELS = { 15: "Kecil", 16: "Normal", 17: "Sedang", 18: "Besar", 20: "Sangat Besar" };
const UI_SIZE_DEFAULT = 17;
function loadUiSize() {
  try {
    const v = Number(localStorage.getItem("siakad_ui_size_v2"));
    return UI_SIZES.includes(v) ? v : UI_SIZE_DEFAULT;
  } catch { return UI_SIZE_DEFAULT; }
}

const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const MATA_KULIAH = ["Tahsin & Tajwid","Tahfidz Al-Qur'an","Bahasa Arab","Fiqih Ibadah","Aqidah Akhlak","Sirah Nabawiyah","Kewirausahaan Dasar","Manajemen Bisnis Syariah","Akuntansi Sederhana","Public Speaking & Dakwah","Bahasa Inggris","Digital Marketing"];
const BIDANG_BISNIS = ["Bakery", "Fashion", "Kuliner", "Kerajinan", "Digital/Online", "Lainnya"];
const JENIS_IBADAH = ["Sholat Berjamaah", "Sholat Rawatib", "Sholat Dhuha", "Tahajud + Witir", "Al-Ma'tsurat", "Membaca Al-Kahfi", "Puasa Sunnah"];
const JENIS_SETORAN_QURAN = ["Ziyadah", "Murajaah", "Tilawah", "Tahsin", "Talaqqi", "Syahadah", "Tasmi'"];
const PALET_GRAFIK = [
  { nama: "Zamrud Lembut", warna: { hafalan: "#2A9D8F", ibadah_baik: "#2A9D8F", ibadah_sebagian: "#E9C46A", ibadah_kurang: "#E76F51", spp_lunas: "#2A9D8F", spp_belum: "#E76F51", Ziyadah: "#2A9D8F", Murajaah: "#E9C46A", Tilawah: "#457B9D", Tahsin: "#B5838D", Talaqqi: "#6D597A", Syahadah: "#C9A227", "Tasmi'": "#2F6F8F" } },
  { nama: "Hijau Pondok & Emas", warna: { hafalan: "#1B7F5C", ibadah_baik: "#1B7F5C", ibadah_sebagian: "#D4A650", ibadah_kurang: "#C8553D", spp_lunas: "#1B7F5C", spp_belum: "#C8553D", Ziyadah: "#1B7F5C", Murajaah: "#D4A650", Tilawah: "#3E7CB1", Tahsin: "#A0526B", Talaqqi: "#6B5CA5", Syahadah: "#C9A227", "Tasmi'": "#2F6F8F" } },
  { nama: "Biru Tenang", warna: { hafalan: "#3B82C4", ibadah_baik: "#3B82C4", ibadah_sebagian: "#F2B84B", ibadah_kurang: "#E4695B", spp_lunas: "#3B82C4", spp_belum: "#E4695B", Ziyadah: "#3B82C4", Murajaah: "#F2B84B", Tilawah: "#2A9D8F", Tahsin: "#9B7EBD", Talaqqi: "#6C7A89", Syahadah: "#D4A650", "Tasmi'": "#2A9D8F" } },
  { nama: "Pastel Lembut", warna: { hafalan: "#7FB89E", ibadah_baik: "#7FB89E", ibadah_sebagian: "#F0D08C", ibadah_kurang: "#E39A8E", spp_lunas: "#7FB89E", spp_belum: "#E39A8E", Ziyadah: "#7FB89E", Murajaah: "#F0D08C", Tilawah: "#8FB5D6", Tahsin: "#C9A0B4", Talaqqi: "#A99CCB", Syahadah: "#E3C878", "Tasmi'": "#8FB5D6" } },
  { nama: "Klasik (versi lama)", warna: { hafalan: "#0B4D30", ibadah_baik: "#0B4D30", ibadah_sebagian: "#B8935A", ibadah_kurang: "#DC2626", spp_lunas: "#0B4D30", spp_belum: "#DC2626", Ziyadah: "#0B4D30", Murajaah: "#B8935A", Tilawah: "#3F6C8A", Tahsin: "#8A4A3A", Talaqqi: "#5C4A8A", Syahadah: "#B8935A", "Tasmi'": "#1F5F7A" } },
];
const GRAFIK_DEFAULT = PALET_GRAFIK[0].warna;
function warnaGrafik(brand) { return { ...GRAFIK_DEFAULT, ...((brand && brand.warna_grafik) || {}) }; }
const JENIS_SETORAN_QURAN_COLOR = { Ziyadah: "#2A9D8F", Murajaah: "#E9C46A", Tilawah: "#457B9D", Tahsin: "#B5838D", Talaqqi: "#6D597A", Syahadah: "#C9A227", "Tasmi'": "#2F6F8F" };
const CAPAIAN_OPTIONS = {
  "Sholat Berjamaah": ["Berjamaah", "Sendiri", "Udzur", "Tidak Sholat"],
  "Sholat Rawatib": ["Lengkap", "Sebagian", "Tidak Dikerjakan"],
  "Sholat Dhuha": ["Dikerjakan", "Tidak Dikerjakan"],
  "Tahajud + Witir": ["Dikerjakan", "Tidak Dikerjakan"],
  "Al-Ma'tsurat": ["Lengkap", "Tidak Lengkap"],
  "Membaca Al-Kahfi": ["Dikerjakan", "Tidak Dikerjakan"],
  "Puasa Sunnah": ["Puasa Penuh", "Tidak Puasa"],
  "Qiyamullail": ["Dikerjakan", "Tidak Dikerjakan"],
};
const CAPAIAN_NEGATIF = ["Tidak Sholat", "Tidak Puasa", "Tidak Lengkap", "Tidak Dikerjakan"];
const CAPAIAN_NETRAL = ["Sendiri", "Sebagian", "Udzur"];
function capaianTone(capaian) {
  if (CAPAIAN_NEGATIF.includes(capaian)) return "red";
  if (CAPAIAN_NETRAL.includes(capaian)) return "gold";
  return "green";
}
const ROLE_LABEL = { admin: "Administrator", musyrif: "Musyrif", musyrifah: "Musyrifah", keuangan: "Bendahara", akademik: "Staf Akademik", pimpinan: "Pimpinan Pondok", santri: "Mahasantri / Wali" };
const AVATAR_COLORS = ["#0B4D30","#AD7F2C","#8A4A3A","#3F6C8A","#5C4A8A","#2F6B5E"];
const nowYear = new Date().getFullYear();
const CATATAN_KRS_BAWAAN = "* Mata kuliah bertanda bintang (*) mengikuti ketentuan khusus yang ditetapkan oleh pondok.";
const adaBintang = (rows) => (rows || []).some((r) => String(r.mata_kuliah || "").trim().endsWith("*"));
const DEFAULT_TAGLINE = "Pondok Tahfidz Qur'an dan Entrepreneur Darul Hikmah";
const DEFAULT_JABATAN_TTD = "Mudir\nPTQE Darul Hikmah";
/* Gaya tulisan jabatan (Mudir ...). "ikut" = ikut blok; "tengah" = baris-baris jabatan
   rata tengah satu sama lain (Mudir di tengah atas PTQE Darul Hikmah), blok tetap di sisi sesuai posisi blok. */
function jabatanStyle(brand) {
  const pos = brand?.posisi_jabatan;
  const base = { whiteSpace: "pre-line" };
  if (pos === "kiri") return { ...base, textAlign: "left" };
  if (pos === "kanan") return { ...base, textAlign: "right" };
  if (pos === "tengah") return { ...base, textAlign: "center", width: "fit-content", margin: isiAlign(brand).img };
  return base;
}
/* Rata isi blok tanda tangan. "tengah" = semua baris (tanggal, jabatan, QR, nama, NIP) sejajar di tengah blok. */
function isiAlign(brand) {
  if (brand?.rata_blok_ttd === "tengah") return { text: "center", flex: "center", img: "0 auto" };
  return ttdAlign(brand);
}
function ttdBlokStyle(brand, top) {
  const a = ttdAlign(brand);
  if (brand?.rata_blok_ttd === "tengah") {
    const pos = brand?.posisi_ttd || "kanan";
    const margin = pos === "kiri" ? `${top}px auto 0 0` : pos === "tengah" ? `${top}px auto 0` : `${top}px 0 0 auto`;
    return { textAlign: "center", width: "fit-content", margin };
  }
  return { marginTop: top, textAlign: a.text };
}
/* Posisi blok tanda tangan di dokumen: kiri / tengah / kanan */
function ttdAlign(brand) {
  const pos = brand?.posisi_ttd || "kanan";
  if (pos === "kiri") return { text: "left", flex: "flex-start", img: "0 auto 0 0" };
  if (pos === "tengah") return { text: "center", flex: "center", img: "0 auto" };
  return { text: "right", flex: "flex-end", img: "0 0 0 auto" };
}
function fontFamilyOf(brand, key) { return (FONT_OPTIONS[brand[key]] || FONT_OPTIONS.fraunces).heading; }

const FONT_OPTIONS = {
  fraunces: { label: "Elegan Serif (Fraunces)", heading: "'Fraunces', Georgia, serif", body: "'Plus Jakarta Sans', sans-serif" },
  poppins: { label: "Modern Bulat (Poppins)", heading: "'Poppins', sans-serif", body: "'Poppins', sans-serif" },
  inter: { label: "Bersih Minimalis (Inter)", heading: "'Inter', sans-serif", body: "'Inter', sans-serif" },
  georgia: { label: "Klasik Formal (Georgia)", heading: "Georgia, 'Times New Roman', serif", body: "Georgia, serif" },
  calibri: { label: "Standar Kantor (Calibri)", heading: "Calibri, 'Segoe UI', sans-serif", body: "Calibri, 'Segoe UI', sans-serif" },
};

function formatRupiah(n) { return n == null ? "-" : "Rp " + Number(n).toLocaleString("id-ID"); }
function nilaiHuruf(a) { if (a == null) return "-"; if (a >= 85) return "A"; if (a >= 75) return "B"; if (a >= 65) return "C"; if (a >= 50) return "D"; return "E"; }
function bobot(h) { return { A: 4, B: 3, C: 2, D: 1, E: 0 }[h] ?? 0; }
function bestPerKode(rows) {
  const map = {};
  rows.forEach((r) => {
    const key = r.kode_mk || `_${r.id}`;
    const cur = map[key];
    if (!cur || Number(r.nilai_angka || 0) > Number(cur.nilai_angka || 0)) map[key] = r;
  });
  return Object.values(map);
}
function initials(name = "") { return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase(); }
function avatarColor(name = "") { let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length; return AVATAR_COLORS[h]; }
function todayLong() { return new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }

/* ---------------------------------------------------------------------- */
/* Permission map                                                           */
/* ---------------------------------------------------------------------- */
const CAN_EDIT = {
  santri: ["admin"], akademik: ["admin", "akademik"], tahapan_akhir: ["admin", "akademik"], matkul: ["admin", "akademik"],
  quran: ["admin", "musyrif", "musyrifah"], ibadah: ["admin", "musyrif", "musyrifah"],
  spp: ["admin", "keuangan"], pengumuman: ["admin", "pimpinan"], kalender: ["admin", "akademik", "pimpinan"],
};
function canEdit(role, area) { return CAN_EDIT[area]?.includes(role); }

const AKADEMIK_GROUP = { label: "Akademik", items: [["akademik","KRS & KHS"],["akhir","Tugas Akhir & Ujian"],["matkul","Daftar Mata Kuliah"],["kalender","Kalender Akademik"],["rekap","Rekap Pencapaian"]] };
const AKADEMIK_GROUP_SANTRI = { label: "Akademik", items: [["akademik","KRS & KHS"],["akhir","Tugas Akhir & Ujian"],["kalender","Kalender Akademik"]] };
const KARTU_MENU = ["kartu", "Kartu Tanda Mahasantri"];
const QURAN_MENU = ["quran","Capaian Al-Qur'an"];
const MENUS = {
  admin: [["dashboard","Dashboard"],["santri","Data Mahasantri"], AKADEMIK_GROUP, QURAN_MENU,["ibadah","Ibadah"],["spp","Iuran SPP"], KARTU_MENU,["pengumuman","Pengumuman"],["akun","Kelola Akun"],["log","Log Aktivitas"],["pengaturan","Pengaturan"]],
  musyrif: [["dashboard","Dashboard"], QURAN_MENU,["ibadah","Ibadah"],["rekap","Rekap Pencapaian"],["pengumuman","Pengumuman"],["kalender","Kalender Akademik"],["pengaturan","Pengaturan"]],
  musyrifah: [["dashboard","Dashboard"], QURAN_MENU,["ibadah","Ibadah"],["rekap","Rekap Pencapaian"],["pengumuman","Pengumuman"],["kalender","Kalender Akademik"],["pengaturan","Pengaturan"]],
  keuangan: [["dashboard","Dashboard"],["spp","Iuran SPP"],["pengumuman","Pengumuman"],["kalender","Kalender Akademik"],["pengaturan","Pengaturan"]],
  akademik: [["dashboard","Dashboard"], AKADEMIK_GROUP, KARTU_MENU,["pengumuman","Pengumuman"],["pengaturan","Pengaturan"]],
  pimpinan: [["dashboard","Dashboard"],["santri","Data Mahasantri"], AKADEMIK_GROUP, QURAN_MENU,["ibadah","Ibadah"],["spp","Iuran SPP"], KARTU_MENU,["pengumuman","Pengumuman"],["log","Log Aktivitas"],["pengaturan","Pengaturan"]],
  santri: [["dashboard","Dashboard"], AKADEMIK_GROUP_SANTRI, QURAN_MENU,["ibadah","Ibadah"],["spp","Iuran SPP"], KARTU_MENU,["pengumuman","Pengumuman"],["pengaturan","Pengaturan"]],
};
const PAGE_TITLES = { dashboard: "Dashboard", santri: "Data Mahasantri", akademik: "KRS & KHS", akhir: "Tugas Akhir & Ujian", matkul: "Daftar Mata Kuliah", rekap: "Rekap Pencapaian", log: "Log Aktivitas", kartu: "Kartu Tanda Mahasantri", quran: "Capaian Al-Qur'an", ibadah: "Ibadah", spp: "Iuran SPP", pengumuman: "Pengumuman", kalender: "Kalender Akademik", akun: "Kelola Akun", pengaturan: "Pengaturan" };

/* ---------------------------------------------------------------------- */
/* Brand (logo & nama pondok) — publik, dibaca sebelum login juga           */
/* ---------------------------------------------------------------------- */
function useBrand() {
  const [brand, setBrand] = useState({ nama_pondok: "Darul Hikmah", tagline: DEFAULT_TAGLINE, logo_url: null, logo_dokumen_url: null, warna_utama: "#0B3B36", warna_aksen: "#B8935A", warna_arab: "#B8935A", ukuran_logo_sidebar: 52,
    yayasan_nama: "YAYASAN WAKAF HAMALATUL QURAN", alamat_pondok: "Komplek Kampoeng Quran Darul Hikmah Jalan Ajun Mata Ie Desa Geundring, Kecamatan Darul Imarah, Kabupaten Aceh Besar Kode Pos 23352", kontak_pondok: "+62821-3227-3431",
    nama_mudir: "Sudirman", nip_mudir: "", nama_kabag_akademik: "Nuraliah Syahfitri, S.Pd.", nip_kabag_akademik: "", judul_besar: "SIAKAD", subjudul: "Sistem Informasi Terpadu dan Manajemen Pembelajaran", slogan: "Mencetak Pengusaha Muda Penghafal Quran", sapaan: "Selamat Datang", ukuran_judul: 72, ukuran_subjudul: 18, font_style: "fraunces", align_subjudul: "left", align_slogan: "left", font_judul: "fraunces", font_subjudul: "fraunces", font_slogan: "fraunces", font_sapaan: "fraunces", ukuran_logo_login: 76, ukuran_slogan: 18, ukuran_sapaan: 24 });
  const [loaded, setLoaded] = useState(false);
  async function reload() {
    const { data } = await supabase.from("pengaturan_pondok").select("*").eq("id", 1).single();
    if (data) setBrand(data);
    setLoaded(true);
  }
  useEffect(() => { reload(); }, []);
  return { brand, reloadBrand: reload, loaded };
}

/* ---------------------------------------------------------------------- */
/* UI primitives                                                            */
/* ---------------------------------------------------------------------- */
function Badge({ tone = "grey", children }) {
  const map = { green: "bg-[#E9F1EE] text-[#0F4A44]", gold: "bg-[#FBF3DF] text-[#8A6A2A]", red: "bg-red-50 text-red-700", blue: "bg-blue-50 text-blue-700", grey: "bg-stone-100 text-stone-600" };
  return <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${map[tone]}`}><span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />{children}</span>;
}
function Card({ children, className = "" }) {
  return <div className={`bg-white border border-stone-200 rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,30,22,.06)] ${className}`}>{children}</div>;
}
function contrastText(hex) {
  if (!hex) return "#fff";
  const h = hex.replace("#", "");
  if (h.length !== 6) return "#fff";
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65 ? "#1a1a1a" : "#fff";
}
function Btn({ children, onClick, tone = "primary", type = "button", disabled }) {
  const brand = useContext(BrandContext);
  const base = "inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-40 shadow-sm hover:shadow hover:brightness-90 border border-black/5";
  if (tone === "primary") { const bg = brand.warna_utama || "#0B4D30"; return <button type={type} disabled={disabled} onClick={onClick} style={{ backgroundColor: bg, color: contrastText(bg) }} className={base}>{children}</button>; }
  if (tone === "gold") { const bg = brand.warna_aksen || "#AD7F2C"; return <button type={type} disabled={disabled} onClick={onClick} style={{ backgroundColor: bg, color: contrastText(bg) }} className={base}>{children}</button>; }
  const map = {
    ghost: "bg-transparent text-stone-600 border border-stone-300 hover:bg-stone-50",
    danger: "bg-transparent text-red-700 border border-red-200 hover:bg-red-50",
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      className={`inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-40 ${map[tone]}`}>
      {children}
    </button>
  );
}
function Field({ label, children }) {
  return <div className="mb-3"><label className="block text-[0.6875rem] font-extrabold text-stone-500 uppercase tracking-wider mb-1.5">{label}</label>{children}</div>;
}
function Input(props) { return <input {...props} className={`w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#E9F1EE] focus:border-[#0B3B36] transition ${props.className || ""}`} />; }
function Select(props) { return <select {...props} className={`w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#E9F1EE] ${props.className || ""}`} />; }
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-[#082A26]/50 backdrop-blur-[2px] flex items-center justify-center p-5 z-50" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center px-6 py-4 border-b border-stone-200">
          <h3 className="font-serif-dh text-lg text-[#0B3B36] font-semibold">{title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
function Avatar({ name, url, size = 34 }) {
  if (url) return <img src={url} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover flex-shrink-0 ring-2 ring-white" />;
  return (
    <div style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.36 }}
      className="rounded-full flex items-center justify-center font-extrabold text-white flex-shrink-0">
      {initials(name) || "?"}
    </div>
  );
}
function JuzTracker({ juz = [] }) {
  const set = new Set(juz);
  return (
    <div>
      <div className="grid grid-cols-10 gap-1.5">
        {Array.from({ length: 30 }, (_, i) => 30 - i).map((j) => (
          <div key={j} title={`Juz ${j}`}
            className={`aspect-square flex items-center justify-center text-[0.625rem] font-bold rounded-md transition-transform hover:scale-110 ${set.has(j) ? "bg-gradient-to-br from-[#D8BE93] to-[#B8935A] text-white shadow-sm" : "bg-stone-100 text-stone-400"}`}>
            {j}
          </div>
        ))}
      </div>
      <div className="text-xs text-stone-500 mt-3 font-semibold flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded bg-[#B8935A] inline-block" />
        {juz.length} dari 30 juz dikuasai
      </div>
    </div>
  );
}
function LogoMark({ size = 40, url }) {
  const brand = useContext(BrandContext);
  if (url) return <img src={url} alt="Logo" style={{ maxWidth: size, maxHeight: size, width: "auto", height: "auto" }} className="flex-shrink-0" />;
  return (
    <div style={{ width: size, height: size, backgroundColor: brand.warna_aksen }} className="rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <path d="M15 5a7 7 0 1 0 0 14 6.2 6.2 0 1 1 0-14Z" fill="white" fillOpacity=".95" />
      </svg>
    </div>
  );
}
function PatternBG() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none">
      <defs>
        <pattern id="dh-star" width="46" height="46" patternUnits="userSpaceOnUse">
          <path d="M23 3 L28 18 L43 23 L28 28 L23 43 L18 28 L3 23 L18 18 Z" fill="none" stroke="#fff" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dh-star)" />
    </svg>
  );
}

function SoftPatternBG({ color = "#0B3B36" }) {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.11] pointer-events-none" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="dh-rosette" width="120" height="120" patternUnits="userSpaceOnUse">
          <g fill="none" stroke={color} strokeWidth="1.1" transform="translate(60,60)">
            <path d="M0 0 C8 -15 8 -35 0 -50 C-8 -35 -8 -15 0 0 Z" />
            <path d="M0 0 C8 -15 8 -35 0 -50 C-8 -35 -8 -15 0 0 Z" transform="rotate(45)" />
            <path d="M0 0 C8 -15 8 -35 0 -50 C-8 -35 -8 -15 0 0 Z" transform="rotate(90)" />
            <path d="M0 0 C8 -15 8 -35 0 -50 C-8 -35 -8 -15 0 0 Z" transform="rotate(135)" />
            <path d="M0 0 C8 -15 8 -35 0 -50 C-8 -35 -8 -15 0 0 Z" transform="rotate(180)" />
            <path d="M0 0 C8 -15 8 -35 0 -50 C-8 -35 -8 -15 0 0 Z" transform="rotate(225)" />
            <path d="M0 0 C8 -15 8 -35 0 -50 C-8 -35 -8 -15 0 0 Z" transform="rotate(270)" />
            <path d="M0 0 C8 -15 8 -35 0 -50 C-8 -35 -8 -15 0 0 Z" transform="rotate(315)" />
            <circle cx="0" cy="0" r="3" fill={color} stroke="none" />
            <circle cx="0" cy="0" r="18" strokeWidth="0.8" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dh-rosette)" />
    </svg>
  );
}

/* ---------------------------------------------------------------------- */
/* Login                                                                    */
/* ---------------------------------------------------------------------- */
function LoginScreen({ brand }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotErr, setForgotErr] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const { data: email, error: rpcErr } = await supabase.rpc("get_login_email", { p_username: username.trim() });
      if (rpcErr || !email) throw new Error("NIM/Username tidak ditemukan.");
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) throw authErr;
    } catch (e2) {
      setErr(e2.message || "NIM/Username atau kata sandi salah.");
    } finally {
      setLoading(false);
    }
  }

  async function requestReset(e) {
    e.preventDefault();
    setForgotErr(""); setForgotMsg(""); setForgotLoading(true);
    try {
      const { data: email, error: rpcErr } = await supabase.rpc("get_login_email", { p_username: forgotUsername.trim() });
      if (rpcErr || !email) throw new Error("Username/NIM tidak ditemukan.");
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (resetErr) throw resetErr;
      setForgotMsg("Tautan reset kata sandi sudah dikirim ke email yang terdaftar untuk akun ini. Silakan cek inbox (atau folder spam), lalu buka tautannya untuk membuat kata sandi baru.");
    } catch (e2) {
      setForgotErr(e2.message || "Gagal mengirim tautan reset. Pastikan username/NIM sudah benar.");
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F2EA] p-5 relative overflow-hidden">
      <SoftPatternBG color={brand.warna_utama} />
      <div className="w-full max-w-4xl grid md:grid-cols-2 md:min-h-[30rem] rounded-[28px] overflow-hidden shadow-[0_30px_70px_-20px_rgba(10,30,20,.35)] relative z-10">
        <div
          className="relative p-10 text-white flex flex-col justify-between overflow-hidden bg-cover bg-center"
          style={
            brand.foto_latar_url
              ? { backgroundImage: `linear-gradient(150deg, ${brand.warna_utama}dd, #050b08e6 130%), url(${brand.foto_latar_url})` }
              : { background: `linear-gradient(150deg, ${brand.warna_utama}, #050b08 130%)` }
          }
        >
          {!brand.foto_latar_url && <PatternBG />}
          <div className="relative">
            <div className="mb-10">
              <LogoMark size={(brand.ukuran_logo_login || 76) * 1.1} url={brand.logo_url} />
            </div>
            <div className="font-bold leading-none mb-4 drop-shadow-sm" style={{ fontSize: `${(brand.ukuran_judul || 72) * 1.1}px`, fontFamily: fontFamilyOf(brand, "font_judul") }}>{brand.judul_besar || "SIAKAD"}</div>
            <p className="text-white/90 mt-2 leading-snug max-w-sm font-semibold whitespace-pre-line" style={{ fontSize: `${(brand.ukuran_subjudul || 18) * 1.1}px`, textAlign: brand.align_subjudul || "left", marginLeft: brand.align_subjudul === "center" ? "auto" : 0, marginRight: brand.align_subjudul === "center" ? "auto" : 0, fontFamily: fontFamilyOf(brand, "font_subjudul") }}>
              {brand.subjudul || "Sistem Informasi Terpadu dan Manajemen Pembelajaran"} {brand.nama_pondok}
            </p>
          </div>
          <div className="relative pt-5 mt-8 border-t border-white/15">
            <div className="italic text-white whitespace-pre-line" style={{ textAlign: brand.align_slogan || "left", fontFamily: fontFamilyOf(brand, "font_slogan"), fontSize: `${(brand.ukuran_slogan || 18) * 1.1}px` }}>"{brand.slogan || "Mencetak Pengusaha Muda Penghafal Quran"}"</div>
          </div>
        </div>

        <div className="bg-white p-10 flex flex-col justify-center">
          <h3 className="mb-1 font-semibold" style={{ color: brand.warna_utama, fontFamily: fontFamilyOf(brand, "font_sapaan"), fontSize: `${(brand.ukuran_sapaan || 24) * 1.1}px` }}>{brand.sapaan || "Selamat Datang"}</h3>
          <p dir="rtl" lang="ar" style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif", color: brand.warna_arab || "#B8935A" }} className="text-xl mb-4 text-left">السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ</p>
          {!forgotMode ? (
            <form onSubmit={submit}>
              <Field label="Username / NIM"><Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Masukkan username atau NIM Anda" required autoFocus /></Field>
              <Field label="Kata Sandi"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
              {err && <div className="text-red-700 text-xs bg-red-50 rounded-xl px-3.5 py-2.5 mb-4 font-medium">{err}</div>}
              <Btn type="submit" disabled={loading}>{loading ? "Memproses…" : "Masuk"}</Btn>
              <button type="button" onClick={() => { setForgotMode(true); setForgotUsername(username); setForgotErr(""); setForgotMsg(""); }} className="block mt-4 text-xs font-bold text-[#0F4A44] hover:text-[#082A26]">
                Lupa kata sandi?
              </button>
            </form>
          ) : (
            <form onSubmit={requestReset}>
              <p className="text-sm text-stone-500 mb-4">Masukkan username atau NIM Anda. Tautan untuk membuat kata sandi baru akan dikirim ke email yang terdaftar pada akun tersebut.</p>
              <Field label="Username / NIM"><Input value={forgotUsername} onChange={(e) => setForgotUsername(e.target.value)} placeholder="Masukkan username atau NIM Anda" required autoFocus /></Field>
              {forgotErr && <div className="text-red-700 text-xs bg-red-50 rounded-xl px-3.5 py-2.5 mb-4 font-medium">{forgotErr}</div>}
              {forgotMsg && <div className="text-[#0F4A44] text-xs bg-[#E9F1EE] rounded-xl px-3.5 py-2.5 mb-4 font-medium">{forgotMsg}</div>}
              <Btn type="submit" disabled={forgotLoading}>{forgotLoading ? "Mengirim…" : "Kirim Tautan Reset"}</Btn>
              <button type="button" onClick={() => { setForgotMode(false); setForgotErr(""); setForgotMsg(""); }} className="block mt-4 text-xs font-bold text-stone-500 hover:text-stone-700">
                ← Kembali ke halaman masuk
              </button>
            </form>
          )}
          <div className="text-center mt-8 text-[0.6875rem] text-stone-400">© {nowYear} {brand.tagline || DEFAULT_TAGLINE}</div>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordScreen({ brand, onDone }) {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (pw1.length < 6) { setErr("Kata sandi minimal 6 karakter."); return; }
    if (pw1 !== pw2) { setErr("Konfirmasi kata sandi tidak sama."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setOk(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F2EA] p-5 relative overflow-hidden">
      <SoftPatternBG color={brand.warna_utama} />
      <div className="w-full max-w-md bg-white rounded-[28px] p-10 shadow-[0_30px_70px_-20px_rgba(10,30,20,.35)] relative z-10">
        <h3 className="mb-1 font-semibold" style={{ color: brand.warna_utama }}>Buat Kata Sandi Baru</h3>
        {ok ? (
          <>
            <p className="text-sm text-stone-500 mt-2 mb-5">Kata sandi berhasil diperbarui. Silakan lanjutkan masuk ke aplikasi.</p>
            <Btn onClick={onDone}>Lanjutkan</Btn>
          </>
        ) : (
          <form onSubmit={submit} className="mt-4">
            <Field label="Kata Sandi Baru"><Input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} placeholder="Minimal 6 karakter" required autoFocus /></Field>
            <Field label="Ulangi Kata Sandi Baru"><Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required /></Field>
            {err && <div className="text-red-700 text-xs bg-red-50 rounded-xl px-3.5 py-2.5 mb-4 font-medium">{err}</div>}
            <Btn type="submit" disabled={loading}>{loading ? "Menyimpan…" : "Simpan Kata Sandi"}</Btn>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Shell (sidebar + topbar)                                                 */
/* ---------------------------------------------------------------------- */
function Shell({ profile, view, setView, brand, children, extraMenu = [], extraTitles = {} }) {
  const baseMenu = MENUS[profile.role] || [];
  const sisip = baseMenu.findIndex((m) => !m.items && (m[0] === "akun" || m[0] === "pengaturan"));
  const menu = extraMenu.length && sisip >= 0 ? [...baseMenu.slice(0, sisip), ...extraMenu, ...baseMenu.slice(sisip)] : baseMenu;
  const groupOf = (v) => menu.find((m) => m.items && m.items.some(([k]) => k === v));
  const [openGroup, setOpenGroup] = useState(() => groupOf(view)?.label || null);
  return (
    <div className="min-h-screen bg-[#F4F2EA] flex">
      <style>{`@media print { html { font-size: 16px !important; } }`}</style>
      <aside className="w-64 text-white p-4 flex flex-col relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${brand.warna_utama}, #04100a)` }}>
        <PatternBG />
        <div className="relative flex flex-col items-center text-center gap-2 pb-5 mb-5 border-b border-white/10">
          <LogoMark size={brand.ukuran_logo_sidebar || 52} url={brand.logo_url} />
          <div>
            <div className="text-[0.625rem] font-bold text-white/45 tracking-[0.15em]">SIAKAD</div>
            <div className="font-serif-dh text-[0.9375rem] font-semibold">{brand.nama_pondok}</div>
          </div>
        </div>
        <div className="relative text-[0.625rem] font-extrabold text-white/35 tracking-[0.15em] px-3 mb-2">MENU UTAMA</div>
        <nav className="relative flex-1 space-y-1">
          {menu.map((entry) => {
            if (entry.items) {
              const isOpen = openGroup === entry.label;
              const activeInside = entry.items.some(([k]) => k === view);
              return (
                <div key={entry.label}>
                  <div onClick={() => setOpenGroup(isOpen ? null : entry.label)}
                    className={`relative px-3.5 py-2.5 rounded-xl text-[0.84375rem] font-semibold cursor-pointer transition flex items-center justify-between ${activeInside ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"}`}>
                    {activeInside && <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r" style={{ backgroundColor: brand.warna_aksen }} />}
                    <span>{entry.label}</span>
                    <span className={`text-[0.625rem] transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                  </div>
                  {isOpen && (
                    <div className="pl-3 mt-1 space-y-1">
                      {entry.items.map(([key, label]) => (
                        <div key={key} onClick={() => setView(key)}
                          className={`relative px-3.5 py-2 rounded-lg text-[0.78125rem] font-medium cursor-pointer transition ${view === key ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>
                          {view === key && <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r" style={{ backgroundColor: brand.warna_aksen }} />}
                          {label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            const [key, label] = entry;
            return (
              <div key={key} onClick={() => setView(key)}
                className={`relative px-3.5 py-2.5 rounded-xl text-[0.84375rem] font-semibold cursor-pointer transition ${view === key ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"}`}>
                {view === key && <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r" style={{ backgroundColor: brand.warna_aksen }} />}
                {label}
              </div>
            );
          })}
        </nav>
        <div className="relative border-t border-white/10 pt-4 mt-3 flex items-center gap-3">
          <Avatar name={profile.nama} url={profile.avatar_url} />
          <div className="flex-1 min-w-0">
            <div className="text-[0.8125rem] font-bold truncate">{profile.nama}</div>
            <div className="text-[0.6875rem] text-white/45">{ROLE_LABEL[profile.role]}</div>
          </div>
          <button onClick={() => supabase.auth.signOut()} title="Keluar" className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/75">⏻</button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-stone-200 sticky top-0 z-10">
          <div>
            <div className="text-[0.6875rem] text-stone-400 font-semibold">Beranda / {PAGE_TITLES[view] || extraTitles[view]}</div>
            <div className="font-serif-dh text-[1.0625rem] font-semibold text-[#0B3B36]">{PAGE_TITLES[view] || extraTitles[view]}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-stone-500 font-medium hidden sm:block">{todayLong()}</div>
            <div className="w-px h-6 bg-stone-200" />
            <Avatar name={profile.nama} url={profile.avatar_url} size={30} />
          </div>
        </div>
        <main className="flex-1 p-8 max-w-5xl">{children}</main>
      </div>
    </div>
  );
}

function PageHeader({ eyebrow, title, sub, actions }) {
  return (
    <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
      <div>
        {eyebrow && <div className="text-[0.6875rem] font-extrabold text-[#B8935A] uppercase tracking-[0.14em] mb-1">{eyebrow}</div>}
        <h2 className="font-serif-dh text-2xl text-[#0B3B36] font-semibold">{title}</h2>
        {sub && <p className="text-sm text-stone-500 mt-1">{sub}</p>}
      </div>
      {actions}
    </div>
  );
}
function Empty({ text }) { return <div className="text-center text-stone-400 text-sm py-10">{text}</div>; }
function StackedBarChart({ data, warna = GRAFIK_DEFAULT }) {
  // data: [{ label, lunas, belum }]
  return (
    <div className="flex items-end gap-3 h-40">
      {data.map((d) => {
        const total = d.lunas + d.belum || 1;
        const lunasPct = (d.lunas / total) * 100;
        const belumPct = 100 - lunasPct;
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-2 h-full">
            <div className="w-full flex-1 rounded-lg overflow-hidden flex flex-col justify-end bg-stone-100">
              {belumPct > 0 && <div style={{ height: `${belumPct}%`, backgroundColor: warna.spp_belum }} />}
              {lunasPct > 0 && <div style={{ height: `${lunasPct}%`, backgroundColor: warna.spp_lunas }} />}
            </div>
            <div className="text-[0.6875rem] font-bold text-stone-500">{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}
function SectionLabel({ children }) {
  return <div className="text-[0.6875rem] font-extrabold text-stone-400 uppercase tracking-[0.12em] mb-3 flex items-center gap-2"><span className="w-4 h-[2px] rounded-full bg-[#B8935A]"></span>{children}</div>;
}
function StatCard({ label, value, sub, icon }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="text-[0.6875rem] font-extrabold text-stone-500 uppercase tracking-wider">{label}</div>
        {icon && <div className="w-8 h-8 rounded-lg bg-[#E9F1EE] flex items-center justify-center text-[#0F4A44]">{icon}</div>}
      </div>
      <div className="font-serif-dh text-2xl lg:text-[1.75rem] font-semibold mt-2 text-stone-800 whitespace-nowrap">{value}</div>
      {sub && <div className="text-xs text-stone-400 mt-1">{sub}</div>}
    </Card>
  );
}
function DokumenQR({ dokType, nim, ta, sem }) {
  const kode = `${dokType || "DOK"}-${nim || "-"}-${(ta || "").replace("/", "")}${(sem || "").slice(0, 1).toUpperCase()}`;
  return (
    <div style={{ fontSize: 8.5, color: "#6B7280", lineHeight: 1.5, marginTop: 18, paddingTop: 10, borderTop: "1px dashed #B8935A" }}>
      <div>No. Dokumen: {kode}</div>
      <div>Dicetak: {new Date().toLocaleString("id-ID")}</div>
    </div>
  );
}
function BackBar({ onBack, label = "← Kembali ke semua santri" }) {
  return <button onClick={onBack} className="text-sm font-bold text-[#0F4A44] hover:text-[#082A26] mb-4">{label}</button>;
}
function BarChartSimple({ data }) {
  // data: [{ label, value, color }]
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex flex-col gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <div className="w-20 text-xs font-bold text-stone-600 flex-shrink-0">{d.label}</div>
          <div className="flex-1 h-6 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color, minWidth: d.value > 0 ? 10 : 0 }}
            />
          </div>
          <div className="w-8 text-right text-xs font-extrabold text-stone-700 flex-shrink-0">{d.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Data hook                                                                */
/* ---------------------------------------------------------------------- */
// Supabase hanya mengirim 1.000 baris per permintaan, jadi data diambil bertahap sampai habis.
async function muatTabelLengkap(table) {
  const ukuran = 1000;
  let semua = [];
  for (let dari = 0; ; dari += ukuran) {
    let { data, error } = await supabase.from(table).select("*").order("id", { ascending: true }).range(dari, dari + ukuran - 1);
    if (error) ({ data, error } = await supabase.from(table).select("*").range(dari, dari + ukuran - 1)); // tabel tanpa kolom id
    if (error) return { error };
    semua = semua.concat(data || []);
    if (!data || data.length < ukuran) break;
  }
  return { data: semua };
}
function useTable(table, deps = []) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  async function reload() {
    setLoading(true);
    const { data, error } = await muatTabelLengkap(table);
    if (!error) setRows(data || []);
    setLoading(false);
  }
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, deps);
  return { rows, loading, reload };
}

/* ---------------------------------------------------------------------- */
/* Dashboard                                                                */
/* ---------------------------------------------------------------------- */
function monthsBack(n) {
  const arr = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    arr.push({ bulan: BULAN[d.getMonth()], tahun: d.getFullYear(), label: BULAN[d.getMonth()].slice(0, 3) });
  }
  return arr;
}
function PengumumanTerbaru({ rows, onLihat }) {
  const top = [...rows].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")).slice(0, 3);
  return (
    <Card className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold">Pengumuman Terbaru</h3>
        {onLihat && <button onClick={onLihat} className="text-xs font-bold text-[#145048]">Lihat semua →</button>}
      </div>
      {top.length === 0 && <div className="text-sm text-stone-400">Belum ada pengumuman.</div>}
      <div className="space-y-3">
        {top.map((p) => (
          <div key={p.id} className="border-t border-stone-100 pt-3 first:border-t-0 first:pt-0">
            <div className="text-sm font-bold text-stone-800">{p.judul}</div>
            <div className="text-[0.6875rem] text-stone-400 mb-1">{p.created_at ? new Date(p.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : ""}</div>
            <div className="text-sm text-stone-600 line-clamp-2 whitespace-pre-wrap">{p.isi}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
function halamanLog(l) { return Math.max(0, Number(l.halaman_sampai || 0) - Number(l.halaman_dari || 0) + 1); }
function ymOf(m) { return `${m.tahun}-${String(BULAN.indexOf(m.bulan) + 1).padStart(2, "0")}`; }
function VerticalBars({ data, color = "#2A9D8F", satuan = "" }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-3 h-44">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 h-full">
          <div className="text-[0.6875rem] font-extrabold text-stone-700">{d.value > 0 ? d.value.toLocaleString("id-ID") : ""}</div>
          <div className="w-full flex-1 rounded-lg bg-stone-100 flex flex-col justify-end overflow-hidden">
            <div style={{ height: `${(d.value / max) * 100}%`, backgroundColor: color, minHeight: d.value > 0 ? 6 : 0 }} className="rounded-t-lg transition-all" />
          </div>
          <div className="text-[0.6875rem] font-bold text-stone-500">{d.label}</div>
        </div>
      ))}
      {satuan && <div className="sr-only">{satuan}</div>}
    </div>
  );
}
function IbadahStacked({ logs, warna = GRAFIK_DEFAULT }) {
  const baris = JENIS_IBADAH.map((j) => {
    const it = logs.filter((l) => l.jenis === j);
    const kurang = it.filter((l) => CAPAIAN_NEGATIF.includes(l.capaian)).length;
    const netral = it.filter((l) => CAPAIAN_NETRAL.includes(l.capaian)).length;
    return { j, total: it.length, kurang, netral, baik: it.length - kurang - netral };
  });
  return (
    <div className="flex flex-col gap-3">
      {baris.map((b) => (
        <div key={b.j} className="flex items-center gap-3">
          <div className="w-32 text-xs font-bold text-stone-600 flex-shrink-0">{b.j}</div>
          <div className="flex-1 h-5 bg-stone-100 rounded-full overflow-hidden flex">
            {b.total > 0 && <><div style={{ width: `${(b.baik / b.total) * 100}%`, backgroundColor: warna.ibadah_baik }} /><div style={{ width: `${(b.netral / b.total) * 100}%`, backgroundColor: warna.ibadah_sebagian }} /><div style={{ width: `${(b.kurang / b.total) * 100}%`, backgroundColor: warna.ibadah_kurang }} /></>}
          </div>
          <div className="w-12 text-right text-xs font-extrabold text-stone-700 flex-shrink-0">{b.total > 0 ? `${Math.round((b.baik / b.total) * 100)}%` : "-"}</div>
        </div>
      ))}
      <div className="flex items-center gap-4 mt-1 text-xs font-semibold text-stone-500 flex-wrap">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: warna.ibadah_baik }} /> Terpenuhi</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: warna.ibadah_sebagian }} /> Sebagian / sendiri</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: warna.ibadah_kurang }} /> Tidak dikerjakan</div>
      </div>
    </div>
  );
}
/* Grafik pencapaian per pekan (4 pekan: tgl 1-7, 8-14, 15-21, 22-akhir bulan) */
function infoPekan(periode) {
  const [y, m] = periode.split("-").map(Number);
  const hari = new Date(y, m, 0).getDate();
  const sekarang = new Date();
  return [0, 1, 2, 3].map((i) => {
    const awal = i * 7 + 1, akhir = i === 3 ? hari : i * 7 + 7;
    return { i, label: `Pekan ${i + 1}`, rentang: `${awal}–${akhir}`, berjalan: new Date(y, m - 1, awal) <= sekarang };
  });
}
function pekanDari(tanggal) { return Math.min(3, Math.floor((Number(String(tanggal).slice(8, 10)) - 1) / 7)); }
function GrafikBatangPekan({ data, target, satuan, max, warnaOk, warnaGagal, ringkasan }) {
  const t = Number(target) || 0;
  const batas = Math.max(1, max || 0, t, ...data.map((p) => p.nilai || 0)) * 1.15;
  const dinilai = data.filter((p) => p.berjalan && p.nilai != null);
  const lolos = (p) => t > 0 && p.nilai != null && p.nilai >= t;
  const tercapai = dinilai.filter(lolos).length;
  return (
    <div>
      <div className="text-xs text-stone-500 mb-3">
        {ringkasan != null ? ringkasan : t > 0 ? <>Target <b>{t}{satuan}</b> per pekan · <b className="text-stone-800">Tercapai {tercapai} dari {dinilai.length} pekan</b></> : "Target per pekan belum diisi di Data Mahasantri."}
      </div>
      <div className="relative h-40">
        {t > 0 && <div className="absolute left-0 right-0 border-t-2 border-dashed border-stone-500 z-10" style={{ bottom: `${(t / batas) * 100}%` }}><span className="absolute right-0 -top-4 text-[0.625rem] font-bold text-stone-600 bg-white px-1">Target</span></div>}
        <div className="flex items-end gap-4 h-full">
          {data.map((p) => {
            const warna = !p.berjalan || p.nilai == null ? "#D6D3D1" : t > 0 ? (lolos(p) ? warnaOk : warnaGagal) : warnaOk;
            return (
              <div key={p.i} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="text-[0.6875rem] font-extrabold text-stone-700 mb-1">{p.berjalan && p.nilai != null ? `${p.nilai}${satuan === "%" ? "%" : ""}` : ""}</div>
                <div style={{ height: `${((p.nilai || 0) / batas) * 100}%`, backgroundColor: warna, minHeight: p.nilai > 0 ? 5 : 0 }} className="w-full rounded-t-lg" />
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex gap-4 mt-1.5 border-t border-stone-200 pt-1.5">
        {data.map((p) => (
          <div key={p.i} className="flex-1 text-center">
            <div className="text-[0.6875rem] font-bold text-stone-600">{p.label}</div>
            <div className="text-[0.625rem] text-stone-400">tgl {p.rentang}</div>
            <div className="text-[0.625rem] font-bold" style={{ color: p.ket != null || !p.berjalan || p.nilai == null || t === 0 ? "#78716C" : lolos(p) ? warnaOk : warnaGagal }}>{p.ket != null ? p.ket : !p.berjalan ? "belum berjalan" : p.nilai == null ? "tanpa data" : t === 0 ? "" : lolos(p) ? "Tercapai" : "Belum tercapai"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
function GrafikPekananQuran({ logs, periode, target, warna = GRAFIK_DEFAULT }) {
  const data = infoPekan(periode).map((p) => ({ ...p, nilai: logs.filter((l) => l.jenis === "Ziyadah" && l.tanggal?.slice(0, 7) === periode && pekanDari(l.tanggal) === p.i).reduce((a, l) => a + halamanLog(l), 0) }));
  return <GrafikBatangPekan data={data} target={target} satuan=" hlm" warnaOk={warna.hafalan} warnaGagal={warna.ibadah_kurang} />;
}
function GrafikPekananIbadah({ logs, periode, target, warna = GRAFIK_DEFAULT }) {
  const data = infoPekan(periode).map((p) => {
    const it = logs.filter((l) => l.tanggal?.slice(0, 7) === periode && pekanDari(l.tanggal) === p.i);
    return { ...p, nilai: it.length ? Math.round((it.filter((l) => !CAPAIAN_NEGATIF.includes(l.capaian)).length / it.length) * 100) : null };
  });
  return <GrafikBatangPekan data={data} target={Number(target) > 0 ? target : 80} satuan="%" max={100} warnaOk={warna.ibadah_baik} warnaGagal={warna.ibadah_kurang} />;
}
function GrafikPekananPanel({ kind, logs, santri }) {
  const wg = warnaGrafik(useContext(BrandContext));
  const [bulan, setBulan] = useState(BULAN[new Date().getMonth()]);
  const [tahun, setTahun] = useState(nowYear);
  const periode = `${tahun}-${String(BULAN.indexOf(bulan) + 1).padStart(2, "0")}`;
  return (
    <Card className="mb-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold">Grafik Pencapaian per Pekan — {kind === "quran" ? "Hafalan Baru (Ziyadah)" : "Ibadah"}</h3>
        <div className="flex gap-2">
          <Select value={bulan} onChange={(e) => setBulan(e.target.value)} className="!w-auto py-1.5 text-xs">{BULAN.map((b) => <option key={b}>{b}</option>)}</Select>
          <Select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} className="!w-auto py-1.5 text-xs">{[nowYear - 1, nowYear, nowYear + 1].map((t) => <option key={t} value={t}>{t}</option>)}</Select>
        </div>
      </div>
      {kind === "quran" ? <GrafikPekananQuran logs={logs} periode={periode} target={santri?.target_halaman_pekan} warna={wg} /> : <GrafikPekananIbadah logs={logs} periode={periode} target={santri?.target_ibadah_persen} warna={wg} />}
    </Card>
  );
}
function Dashboard({ profile }) {
  const santriT = useTable("santri");
  const sppT = useTable("spp");
  const quranT = useTable("quran_log");
  const ibadahT = useTable("ibadah_log");
  const pengT = useTable("pengumuman");
  const wg = warnaGrafik(useContext(BrandContext));
  const ymIni = new Date().toISOString().slice(0, 7);
  const trenZiyadah = (nim) => monthsBack(6).map((m) => ({ label: m.label, value: quranT.rows.filter((l) => (!nim || l.nim === nim) && l.jenis === "Ziyadah" && l.tanggal?.slice(0, 7) === ymOf(m)).reduce((a, l) => a + halamanLog(l), 0) }));

  if (profile.role === "santri") {
    const s = santriT.rows.find((x) => x.nim === profile.nim);
    const bulanIni = BULAN[new Date().getMonth()];
    const sppBulanIni = sppT.rows.find((r) => r.nim === profile.nim && r.bulan === bulanIni && r.tahun === nowYear);
    const setoranBulanIni = quranT.rows.filter((l) => l.nim === profile.nim && l.tanggal?.slice(0, 7) === new Date().toISOString().slice(0, 7)).length;
    return (
      <div>
        <PageHeader eyebrow="Ruang Santri" title={`Assalamu'alaikum, ${profile.nama.split(" ")[0]}`} sub={profile.nim} />
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Juz Dikuasai" value={`${s?.juz_dikuasai?.length || 0} / 30`} icon="📖" />
          <StatCard label="Setoran Bulan Ini" value={setoranBulanIni} icon="🕋" />
          <StatCard label="Status SPP Bulan Ini" value={sppBulanIni?.status || "Belum Ada Data"} icon="💳" />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Card>
            <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-4">Hafalan Baru per Bulan (halaman)</h3>
            <VerticalBars data={trenZiyadah(profile.nim)} color={wg.hafalan} />
            <div className="text-xs text-stone-400 mt-3">Jumlah halaman setoran Ziyadah dalam 6 bulan terakhir.</div>
          </Card>
          <Card>
            <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-4">Ibadah Bulan Ini</h3>
            <IbadahStacked warna={wg} logs={ibadahT.rows.filter((l) => l.nim === profile.nim && l.tanggal?.slice(0, 7) === ymIni)} />
          </Card>
        </div>
        <PengumumanTerbaru rows={pengT.rows} />
      </div>
    );
  }

  const bulanIni = BULAN[new Date().getMonth()];
  const belumLunas = sppT.rows.filter((r) => r.bulan === bulanIni && r.tahun === nowYear && r.status !== "Lunas").length;
  const jenisCounts = JENIS_SETORAN_QURAN.map((j) => ({
    label: j,
    value: quranT.rows.filter((l) => l.jenis === j).length,
    color: wg[j] || JENIS_SETORAN_QURAN_COLOR[j],
  }));
  const totalSantri = santriT.rows.length;
  const santriAktif = santriT.rows.filter((s) => s.status === "Aktif" || !s.status).length;
  const jumlahAlumni = santriT.rows.filter((s) => s.status === "Lulus").length;
  const sppTrend = monthsBack(6).map(({ bulan, tahun, label }) => {
    const lunas = sppT.rows.filter((r) => r.bulan === bulan && r.tahun === tahun && r.status === "Lunas").length;
    return { label, lunas, belum: Math.max(0, totalSantri - lunas) };
  });

  const sppBulanIniRows = sppT.rows.filter((r) => r.bulan === bulanIni && r.tahun === nowYear);
  const lunasBulanIni = sppBulanIniRows.filter((r) => r.status === "Lunas");
  const nominalTerkumpul = lunasBulanIni.reduce((a, r) => a + Number(r.nominal || 0), 0);
  const nominalBelum = sppBulanIniRows.filter((r) => r.status !== "Lunas").reduce((a, r) => a + Number(r.nominal || 0), 0);

  const showQuranChart = true;
  const showSppChart = true;

  return (
    <div>
      <PageHeader eyebrow="Ringkasan" title="Dashboard" sub={`Assalamu'alaikum, ${profile.nama}`} />

      <SectionLabel>Ringkasan Santri</SectionLabel>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard label="Total Santri" value={totalSantri} icon="👥" />
        <StatCard label="Rata-rata Juz Dikuasai" value={santriT.rows.length ? (santriT.rows.reduce((a, s) => a + (s.juz_dikuasai?.length || 0), 0) / santriT.rows.length).toFixed(1) : 0} sub="dari 30 juz" icon="📖" />
      </div>

      {(showQuranChart || showSppChart) && (
        <div className={`grid gap-4 mb-8 ${showQuranChart && showSppChart ? "grid-cols-2" : "grid-cols-1"}`}>
          {showQuranChart && (
            <Card>
              <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-4">Capaian Al-Qur'an Mahasantri</h3>
              <BarChartSimple data={jenisCounts} />
              <div className="text-xs text-stone-400 mt-3">Total seluruh catatan setoran berdasarkan jenis, dari semua mahasantri.</div>
            </Card>
          )}
          {showSppChart && (
            <Card>
              <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-4">Tren Pembayaran SPP (6 Bulan)</h3>
              <StackedBarChart data={sppTrend} warna={wg} />
              <div className="flex items-center gap-4 mt-4 text-xs font-semibold text-stone-500">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: wg.spp_lunas }} /> Lunas</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: wg.spp_belum }} /> Belum Lunas</div>
              </div>
            </Card>
          )}
        </div>
      )}

      <SectionLabel>Tren Al-Qur'an &amp; Ibadah</SectionLabel>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card>
          <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-4">Hafalan Baru per Bulan (halaman)</h3>
          <VerticalBars data={trenZiyadah(null)} color={wg.hafalan} />
          <div className="text-xs text-stone-400 mt-3">Total halaman setoran Ziyadah seluruh mahasantri, 6 bulan terakhir.</div>
        </Card>
        <Card>
          <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-4">Kepatuhan Ibadah Bulan Ini</h3>
          <IbadahStacked warna={wg} logs={ibadahT.rows.filter((l) => l.tanggal?.slice(0, 7) === ymIni)} />
        </Card>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-3">Setoran Terbanyak Bulan Ini</h3>
          {(() => {
            const per = {};
            quranT.rows.filter((l) => l.jenis === "Ziyadah" && l.tanggal?.slice(0, 7) === ymIni).forEach((l) => { per[l.nim] = (per[l.nim] || 0) + halamanLog(l); });
            const top = Object.entries(per).sort((a, b) => b[1] - a[1]).slice(0, 5);
            return top.length === 0 ? <div className="text-sm text-stone-400">Belum ada setoran Ziyadah bulan ini.</div> : top.map(([nim, hal], i) => (
              <div key={nim} className="flex items-center justify-between py-1.5 border-b border-stone-100 last:border-0 text-sm"><span><b className="text-[#B8935A] mr-2">{i + 1}</b>{santriT.rows.find((x) => x.nim === nim)?.nama || nim}</span><b>{hal} hlm</b></div>
            ));
          })()}
        </Card>
        <Card>
          <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-3">Perlu Perhatian (Ibadah)</h3>
          {(() => {
            const per = {};
            ibadahT.rows.filter((l) => l.tanggal?.slice(0, 7) === ymIni && CAPAIAN_NEGATIF.includes(l.capaian)).forEach((l) => { per[l.nim] = (per[l.nim] || 0) + 1; });
            const daftar = Object.entries(per).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 5);
            return daftar.length === 0 ? <div className="text-sm text-stone-400">Tidak ada santri dengan 2 catatan kurang atau lebih bulan ini.</div> : daftar.map(([nim, n]) => (
              <div key={nim} className="flex items-center justify-between py-1.5 border-b border-stone-100 last:border-0 text-sm"><span>{santriT.rows.find((x) => x.nim === nim)?.nama || nim}</span><b className="text-red-600">{n}× tidak terpenuhi</b></div>
            ));
          })()}
        </Card>
      </div>

      <SectionLabel>Administrasi &amp; Keuangan</SectionLabel>
      <Card className="bg-[#FAF8F2] border-stone-200/70 mb-8">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <StatCard label="Santri Aktif" value={santriAktif} icon="🟢" />
          <StatCard label="Jumlah Alumni" value={jumlahAlumni} icon="🎓" />
          <StatCard label="Tunggakan Bulan Ini" value={belumLunas} sub="santri belum lunas" icon="⚠️" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label={`Iuran Lunas (${bulanIni})`} value={`${lunasBulanIni.length} / ${sppBulanIniRows.length}`} sub="santri yang sudah bayar" icon="✅" />
          <StatCard label="Iuran Terkumpul" value={formatRupiah(nominalTerkumpul)} sub="bulan ini" icon="💰" />
          <StatCard label="Iuran Belum Terbayar" value={formatRupiah(nominalBelum)} sub="bulan ini" icon="⏳" />
        </div>
      </Card>

      <PengumumanTerbaru rows={pengT.rows} />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Data Santri                                                              */
/* ---------------------------------------------------------------------- */
function DataSantriPage({ profile }) {
  const editable = canEdit(profile.role, "santri");
  const { rows, reload } = useTable("santri");
  const [modal, setModal] = useState(null);

  async function upsert(rawForm) {
    const form = Object.fromEntries(
      Object.entries(rawForm).map(([k, v]) => [k, v === "" ? null : v])
    );
    if (modal === "new") {
      const { error } = await supabase.from("santri").insert(form);
      if (error) { alert(error.message); return; }
    } else {
      const { error } = await supabase.from("santri").update(form).eq("nim", modal.nim);
      if (error) { alert(error.message); return; }
    }
    setModal(null); reload();
  }
  async function remove(nim) {
    if (!confirm(`Hapus santri ${nim}?`)) return;
    const { error } = await supabase.from("santri").delete().eq("nim", nim);
    if (error) alert(error.message); else reload();
  }

  return (
    <div>
      <PageHeader title="Data Mahasantri" actions={editable && <Btn onClick={() => setModal("new")}>+ Tambah Mahasantri</Btn>} />
      <PerAngkatan santri={rows} kunci="santri">{(cocok) => (
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3.5">Mahasantri</th><th className="p-3.5">Angkatan</th><th className="p-3.5">Juz</th><th className="p-3.5">Status</th><th className="p-3.5"></th></tr></thead>
          <tbody>
            {rows.filter(cocok).map((s) => (
              <tr key={s.nim} className="border-t border-stone-100 hover:bg-stone-50/60">
                <td className="p-3.5"><div className="flex items-center gap-3"><Avatar name={s.nama} size={30} /><div><div className="font-bold">{s.nama}</div><div className="text-[0.6875rem] text-stone-400">{s.nim}</div></div></div></td>
                <td className="p-3.5">{s.kelas}</td>
                <td className="p-3.5"><Badge tone="gold">{s.juz_dikuasai?.length || 0} juz</Badge></td>
                <td className="p-3.5"><Badge tone={s.status === "Aktif" || !s.status ? "green" : s.status === "Lulus" ? "gold" : "grey"}>{s.status || "Aktif"}</Badge></td>
                <td className="p-3.5 text-right">
                  {editable && <>
                    <button onClick={() => setModal(s)} className="text-[#145048] text-xs font-bold mr-3">Edit</button>
                    <button onClick={() => remove(s.nim)} className="text-red-600 text-xs font-bold">Hapus</button>
                  </>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5}><Empty text="Belum ada santri." /></td></tr>}
          </tbody>
        </table>
      </Card>
      )}</PerAngkatan>
      {modal && <SantriForm initial={modal === "new" ? null : modal} daftarAngkatan={[...new Set(rows.map((s) => s.kelas))]} onCancel={() => setModal(null)} onSubmit={upsert} />}
    </div>
  );
}
function SantriForm({ initial, daftarAngkatan = [], onCancel, onSubmit }) {
  const [f, setF] = useState(initial || {
    nim: "", nama: "", jk: "Mahasantri", kelas: "", angkatan: String(nowYear), kamar: "", musyrif_username: "",
    nik: "", tempat_lahir: "", tanggal_lahir: "", no_hp: "", alamat: "",
    target_hafalan: "30 Juz", status: "Aktif",
    nama_ayah: "", nama_ibu: "", no_hp_ortu: "", pekerjaan_ortu: "", alamat_wali: "",
    tanggal_masuk: "", status_spp: "Lunas", nominal_spp: "", tagihan_koperasi: "", target_halaman_pekan: "", target_ibadah_persen: "",
    golongan_darah: "", kontak_darurat: "", riwayat_penyakit: "",
    foto_url: "", dok_kk_url: "", dok_akta_url: "", dok_ijazah_url: "", dok_ktp_url: "", dok_bpjs_url: "",
  });
  const [uploading, setUploading] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const SectionTitle = ({ children }) => <div className="text-[0.6875rem] font-extrabold text-[#B8935A] uppercase tracking-[0.1em] mt-5 mb-2 pt-4 border-t border-stone-100 first:mt-0 first:pt-0 first:border-0">{children}</div>;

  async function uploadPhoto(e) {
    const file = e.target.files?.[0];
    if (!file || !f.nim) { if (!f.nim) alert("Isi NIM terlebih dahulu sebelum unggah foto."); return; }
    setUploading("foto");
    const path = `${f.nim}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { alert(upErr.message); setUploading(""); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setF((prev) => ({ ...prev, foto_url: data.publicUrl }));
    setUploading("");
  }
  function uploadDokumen(field) {
    return async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !f.nim) { if (!f.nim) alert("Isi NIM terlebih dahulu sebelum unggah dokumen."); return; }
      setUploading(field);
      const path = `${f.nim}/${field}-${Date.now()}.${file.name.split(".").pop()}`;
      const { error: upErr } = await supabase.storage.from("dokumen-santri").upload(path, file, { upsert: true });
      if (upErr) { alert(upErr.message); setUploading(""); return; }
      const { data } = supabase.storage.from("dokumen-santri").getPublicUrl(path);
      setF((prev) => ({ ...prev, [field]: data.publicUrl }));
      setUploading("");
    };
  }
  function DokRow({ label, field }) {
    const sudah = !!f[field];
    return (
      <div className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 mb-2.5 text-sm border ${sudah ? "border-solid border-emerald-300 bg-emerald-50" : "border-dashed border-stone-300"}`}>
        <div className="flex flex-col">
          <span className="text-stone-700">{label}</span>
          {uploading === field ? (
            <span className="text-[0.6875rem] font-bold text-amber-600">Mengunggah…</span>
          ) : sudah ? (
            <span className="text-[0.6875rem] font-bold text-emerald-700">
              ✓ Terunggah <a href={f[field]} target="_blank" rel="noreferrer" className="ml-1 underline">Lihat file</a>
            </span>
          ) : (
            <span className="text-[0.6875rem] text-stone-400">Belum diunggah</span>
          )}
        </div>
        <label className="text-xs font-bold text-[#0B3B36] border border-stone-300 bg-white rounded-lg px-3 py-1.5 cursor-pointer hover:bg-stone-50">
          {uploading === field ? "Mengunggah…" : sudah ? "Ganti" : "Unggah"}
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={uploadDokumen(field)} disabled={uploading === field} />
        </label>
      </div>
    );
  }

  return (
    <Modal title={initial ? "Edit Mahasantri" : "Tambah Mahasantri"} onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
        <div className="flex items-center gap-4 mb-2">
          <Avatar name={f.nama || "?"} url={f.foto_url} size={64} />
          <div>
            <label className="text-xs font-bold text-[#0B3B36] border border-stone-300 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-stone-50 inline-block">
              {uploading === "foto" ? "Mengunggah…" : "Unggah Foto Profil"}
              <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} disabled={uploading === "foto"} />
            </label>
            <div className="text-[0.6875rem] text-stone-400 mt-1">JPG/PNG, isi NIM dulu sebelum unggah.</div>
          </div>
        </div>
        <SectionTitle>Data Pribadi</SectionTitle>
        <Field label="NIM"><Input value={f.nim} onChange={set("nim")} disabled={!!initial} required /></Field>
        <Field label="Nama Lengkap"><Input value={f.nama} onChange={set("nama")} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="NIK"><Input value={f.nik} onChange={set("nik")} placeholder="16 digit" /></Field>
          <Field label="No. HP Santri"><Input value={f.no_hp} onChange={set("no_hp")} placeholder="Opsional" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tempat Lahir"><Input value={f.tempat_lahir} onChange={set("tempat_lahir")} /></Field>
          <Field label="Tanggal Lahir"><Input type="date" value={f.tanggal_lahir} onChange={set("tanggal_lahir")} /></Field>
        </div>
        <Field label="Alamat Lengkap"><textarea className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm" rows={2} value={f.alamat} onChange={set("alamat")} /></Field>

        <SectionTitle>Data Akademik &amp; Tahfidz</SectionTitle>
        <Field label="Angkatan">
          <Input value={f.kelas} onChange={set("kelas")} list="daftar-angkatan" placeholder="cth: Angkatan 8, atau 2026" required />
          <datalist id="daftar-angkatan">{daftarAngkatan.map((a) => <option key={a} value={a} />)}</datalist>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Musyrif/ah (username)"><Input value={f.musyrif_username} onChange={set("musyrif_username")} placeholder="cth: musyrif1" /></Field>
          <Field label="Target Hafalan"><Input value={f.target_hafalan} onChange={set("target_hafalan")} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Target Hafalan Baru per Pekan (halaman)"><Input type="number" value={f.target_halaman_pekan ?? ""} onChange={set("target_halaman_pekan")} placeholder="mis. 10" /></Field>
          <Field label="Target Ibadah Terpenuhi per Pekan (%)"><Input type="number" value={f.target_ibadah_persen ?? ""} onChange={set("target_ibadah_persen")} placeholder="kosong = 80" /></Field>
        </div>
        <Field label="Status">
          <Select value={f.status} onChange={set("status")}><option>Aktif</option><option>Cuti</option><option>Lulus</option><option>Keluar</option></Select>
        </Field>

        <SectionTitle>Data Orang Tua / Wali</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nama Ayah"><Input value={f.nama_ayah} onChange={set("nama_ayah")} /></Field>
          <Field label="Nama Ibu"><Input value={f.nama_ibu} onChange={set("nama_ibu")} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="No. HP Orang Tua/Wali"><Input value={f.no_hp_ortu} onChange={set("no_hp_ortu")} /></Field>
          <Field label="Pekerjaan Orang Tua"><Input value={f.pekerjaan_ortu} onChange={set("pekerjaan_ortu")} /></Field>
        </div>
        <Field label="Alamat Wali (jika berbeda)"><textarea className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm" rows={2} value={f.alamat_wali} onChange={set("alamat_wali")} /></Field>

        <SectionTitle>Data Administrasi</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tanggal Masuk Pondok"><Input type="date" value={f.tanggal_masuk} onChange={set("tanggal_masuk")} /></Field>
          <Field label="Status SPP"><Select value={f.status_spp} onChange={set("status_spp")}><option>Lunas</option><option>Menunggak</option></Select></Field>
          <Field label="Nominal SPP per Bulan (Rp)"><Input type="number" value={f.nominal_spp ?? ""} onChange={set("nominal_spp")} placeholder="mis. 1000000" /></Field>
          <Field label="Total Tagihan Koperasi (Rp)"><Input type="number" value={f.tagihan_koperasi ?? ""} onChange={set("tagihan_koperasi")} placeholder="kosongkan jika tidak ada" /></Field>
        </div>
        <div className="text-xs text-stone-400 mb-2">Nominal SPP ini otomatis dipakai saat membuat Iuran SPP. Tagihan koperasi dikurangi cicilan yang tercatat di menu Iuran SPP.</div>
        <div className="mb-1">
          <DokRow label="Kartu Keluarga (KK)" field="dok_kk_url" />
          <DokRow label="Akta Kelahiran" field="dok_akta_url" />
          <DokRow label="Ijazah Terakhir" field="dok_ijazah_url" />
          <DokRow label="KTP Mahasantri" field="dok_ktp_url" />
          <DokRow label="Kartu BPJS" field="dok_bpjs_url" />
        </div>

        <SectionTitle>Data Kesehatan (opsional)</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Golongan Darah">
            <Select value={f.golongan_darah} onChange={set("golongan_darah")}><option value="">—</option><option>A</option><option>B</option><option>AB</option><option>O</option></Select>
          </Field>
          <Field label="Kontak Darurat"><Input value={f.kontak_darurat} onChange={set("kontak_darurat")} placeholder="Nama & no. HP" /></Field>
        </div>
        <Field label="Riwayat Penyakit / Alergi"><textarea className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm" rows={2} value={f.riwayat_penyakit} onChange={set("riwayat_penyakit")} /></Field>

        <div className="flex justify-end gap-2 mt-5"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit">Simpan</Btn></div>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------------- */
/* Input Akademik — overview semua santri + drill-down                     */
/* ---------------------------------------------------------------------- */
function AkademikStaffPage({ profile, tabAwal = "krs" }) {
  const editable = canEdit(profile.role, "akademik");
  const brand = useContext(BrandContext);
  const santriT = useTable("santri");
  const akT = useTable("akademik");
  const tahapT = useTable("tahapan_akhir");
  const [tab, setTab] = useState(tabAwal);
  const [showAmbil, setShowAmbil] = useState(false);
  const quranLogT = useTable("quran_log");
  const profilesT = useTable("profiles");
  const [nim, setNim] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [dokType, setDokType] = useState("KRS");
  const records = akT.rows.filter((a) => a.nim === nim);
  const quranLogs = quranLogT.rows.filter((l) => l.nim === nim);
  const santri = santriT.rows.find((s) => s.nim === nim);
  const pembimbing = profilesT.rows.find((p) => p.username === santri?.musyrif_username);
  const semesters = [...new Set(records.map((r) => `${r.tahun_ajaran}|${r.semester}`))].sort().reverse();
  const [pilihan, setPilihan] = useState("");
  useEffect(() => { setPilihan(""); setTab(tabAwal); }, [nim]);
  useEffect(() => { if (!pilihan && semesters[0]) setPilihan(semesters[0]); }, [semesters.join(","), nim]);
  const pilihanAktif = pilihan || semesters[0] || "";
  const [taPilih, semPilih] = pilihanAktif ? pilihanAktif.split("|") : [null, null];
  const semesterTerbaru = taPilih ? { tahun_ajaran: taPilih, semester: semPilih } : undefined;
  const recordsKRS = semesterTerbaru ? records.filter((r) => r.tahun_ajaran === semesterTerbaru.tahun_ajaran && r.semester === semesterTerbaru.semester) : [];

  const [catatanAkademik, setCatatanAkademik] = useState("");
  useEffect(() => { setCatatanAkademik(santri?.catatan_akademik || ""); }, [santri?.nim]);
  async function saveCatatanAkademik() {
    const { error } = await supabase.from("santri").update({ catatan_akademik: catatanAkademik }).eq("nim", nim);
    if (error) { alert(error.message); return; }
    santriT.reload();
  }

  const [editingRecord, setEditingRecord] = useState(null);
  async function saveRecord(f) {
    const payload = { ...f, sks: Number(f.sks) };
    if (editingRecord) {
      const { error } = await supabase.from("akademik").update(payload).eq("id", editingRecord.id);
      if (error) alert(error.message); else { setEditingRecord(null); akT.reload(); }
    } else {
      const { error } = await supabase.from("akademik").insert({ ...payload, nim });
      if (error) alert(error.message); else { setShowForm(false); akT.reload(); }
    }
  }
  async function updateNilai(id, v) {
    const nilai = v === "" ? null : Number(v);
    const { error } = await supabase.from("akademik").update({ nilai_angka: nilai, status: nilai == null ? "aktif" : "selesai" }).eq("id", id);
    if (!error) akT.reload();
  }
  async function removeMatkul(id) {
    if (!confirm("Hapus mata kuliah ini?")) return;
    const { error } = await supabase.from("akademik").delete().eq("id", id);
    if (error) alert(error.message); else akT.reload();
  }

  if (!nim) {
    return (
      <div>
        <PageHeader title="Akademik" sub="Semua santri — klik salah satu untuk kelola nilai." />
        <PerAngkatan santri={santriT.rows} kunci="akademik">{(cocok) => (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3.5">Mahasantri</th><th className="p-3.5">Angkatan</th><th className="p-3.5">IPK</th><th className="p-3.5">Matkul Selesai</th><th className="p-3.5">Tugas Akhir</th></tr></thead>
            <tbody>
              {santriT.rows.filter(cocok).map((s) => {
                const sel = bestPerKode(akT.rows.filter((a) => a.nim === s.nim && a.status === "selesai"));
                const tot = sel.reduce((a, r) => a + r.sks, 0);
                const ipk = tot ? (sel.reduce((a, r) => a + bobot(nilaiHuruf(r.nilai_angka)) * r.sks, 0) / tot).toFixed(2) : "-";
                return (
                  <tr key={s.nim} className="border-t border-stone-100 hover:bg-stone-50/60 cursor-pointer" onClick={() => setNim(s.nim)}>
                    <td className="p-3.5"><div className="flex items-center gap-3"><Avatar name={s.nama} size={30} /><div><div className="font-bold">{s.nama}</div><div className="text-[0.6875rem] text-stone-400">{s.nim}</div></div></div></td>
                    <td className="p-3.5">{s.kelas}</td><td className="p-3.5">{ipk}</td><td className="p-3.5">{sel.length}</td><td className="p-3.5">{jumlahTahapLulus(tahapT.rows.filter((t) => t.nim === s.nim))}/{TAHAPAN_AKHIR.length}</td>
                  </tr>
                );
              })}
              {santriT.rows.length === 0 && <tr><td colSpan={5}><Empty text="Belum ada santri." /></td></tr>}
            </tbody>
          </table>
        </Card>
        )}</PerAngkatan>
      </div>
    );
  }

  return (
    <div>
      <BackBar onBack={() => setNim("")} />
      <PageHeader title={santri?.nama || nim} sub={nim} actions={
        <div className="flex gap-2">
          {editable && <Btn tone="gold" onClick={() => setShowAmbil(true)}>Ambil dari Daftar</Btn>}
          {editable && <Btn onClick={() => setShowForm(true)}>+ Tambah Mata Kuliah</Btn>}
        </div>
      } />

      <TabAkademik tab={tab} setTab={setTab} rows={tahapT.rows.filter((t) => t.nim === nim)} />
      <div className={tab === "krs" ? "" : "hidden"}>
      {/* ===== Pratinjau & Cetak Dokumen Akademik (KRS / KHS) ===== */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .krs-print, .krs-print * { visibility: visible; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
          .krs-print { position: absolute; top: 0; left: 0; width: 100%; padding: 24px 32px; box-shadow: none !important; border: none !important; }
        }
      `}</style>
      <div className={`mb-4 max-w-xs ${dokType === "Transkrip" ? "hidden" : ""}`}>
        <Select value={pilihanAktif} onChange={(e) => setPilihan(e.target.value)}>
          {semesters.length === 0 && <option value="">Belum ada data</option>}
          {semesters.map((s) => { const [ta2, sem2] = s.split("|"); return <option key={s} value={s}>{ta2} · Semester {sem2}</option>; })}
        </Select>
      </div>
      <div className="flex items-center justify-between mb-2">
        <div className="inline-flex rounded-lg border border-stone-300 overflow-hidden">
          <button onClick={() => setDokType("KRS")} className={`px-4 py-1.5 text-xs font-bold ${dokType === "KRS" ? "bg-[#0B3B36] text-white" : "bg-white text-stone-500"}`}>KRS</button>
          <button onClick={() => setDokType("KHS")} className={`px-4 py-1.5 text-xs font-bold ${dokType === "KHS" ? "bg-[#0B3B36] text-white" : "bg-white text-stone-500"}`}>KHS</button>
          <button onClick={() => setDokType("Transkrip")} className={`px-4 py-1.5 text-xs font-bold ${dokType === "Transkrip" ? "bg-[#0B3B36] text-white" : "bg-white text-stone-500"}`}>Transkrip</button>
        </div>
        <Btn tone="ghost" onClick={() => window.print()}>🖨️ Cetak {dokType}</Btn>
      </div>
      <div className="krs-print bg-white rounded-2xl border border-stone-200 shadow-sm p-8 mb-6">
        <table style={{ width: "100%", marginBottom: 14 }}><tbody><tr>
          <td style={{ width: 90, verticalAlign: "middle" }}>{(brand.logo_dokumen_url || brand.logo_url) && <img src={brand.logo_dokumen_url || brand.logo_url} alt="logo" style={{ width: 80 }} />}</td>
          <td style={{ verticalAlign: "middle" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0B3B36" }}>{brand.yayasan_nama}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0B3B36" }}>PONDOK TAHFIDZ QURAN DAN ENTREPRENEUR {brand.nama_pondok?.toUpperCase()}</div>
            <div style={{ fontSize: 10.5, color: "#44544D" }}>{brand.alamat_pondok}</div>
            <div style={{ fontSize: 10.5, color: "#44544D", fontStyle: "italic" }}>Contact: {brand.kontak_pondok}</div>
          </td>
        </tr></tbody></table>

        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15 }}>{dokType === "Transkrip" ? "TRANSKRIP NILAI" : dokType === "KRS" ? "KARTU RENCANA STUDI (KRS)" : "KARTU HASIL STUDI (KHS)"}</div>
        <div style={{ textAlign: "center", fontSize: 11, paddingBottom: 6, marginBottom: 16 }}>
          {dokType === "Transkrip" ? "Riwayat studi seluruh semester" : <>Semester {semesterTerbaru?.semester || "-"} {semesterTerbaru?.tahun_ajaran || ""}</>}
        </div>

        <div style={{ fontSize: 11, marginBottom: 3, display: "flex" }}><span style={{ width: 130 }}>Nama Mahasantri</span><span>: {santri?.nama}</span></div>
        <div style={{ fontSize: 11, marginBottom: 3, display: "flex" }}><span style={{ width: 130 }}>NIM</span><span>: {santri?.nim}</span></div>
        {dokType === "Transkrip" ? <div style={{ marginBottom: 14 }} /> : <div style={{ fontSize: 11, marginBottom: 14, display: "flex" }}><span style={{ width: 130 }}>Semester</span><span>: {semesterKeDari(records, semesterTerbaru?.tahun_ajaran, semesterTerbaru?.semester)}</span></div>}

        {dokType === "Transkrip" ? (
        <TranskripNilai records={records} santri={santri} tahap={tahapT.rows.filter((t) => t.nim === nim)} />
        ) : dokType === "KRS" ? (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5, marginBottom: 8 }}>
          <thead><tr style={{ background: "#0B3B36", color: "#fff" }}>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>No</th>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>Kode MK</th>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>Mata Kuliah</th>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>SKS</th>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>Pengajar</th>
          </tr></thead>
          <tbody>
            {recordsKRS.map((r, i) => (
              <tr key={r.id}>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{i + 1}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{r.kode_mk || "-"}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5 }}>{r.mata_kuliah}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{r.sks}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5 }}>{r.pengajar || "-"}</td>
              </tr>
            ))}
            <tr style={{ background: "#F3EEE1", fontWeight: 700 }}>
              <td colSpan={3} style={{ border: "1px solid #1F2937", padding: "5px 10px 5px 5px", textAlign: "right" }}>Total SKS</td>
              <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center", fontWeight: 700 }}>{recordsKRS.reduce((a, r) => a + Number(r.sks || 0), 0)}</td>
              <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center", color: "#A8A29E" }}>–</td>
            </tr>
          </tbody>
        </table>
        ) : (
        <>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5, marginBottom: 0 }}>
          <thead>
            <tr style={{ background: "#0B3B36", color: "#fff" }}>
              <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 5 }}>No</th>
              <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 5 }}>Kode MK</th>
              <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 5 }}>Mata Kuliah</th>
              <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 5 }}>SKS</th>
              <th colSpan={3} style={{ border: "1px solid #1F2937", padding: 5 }}>Nilai</th>
              <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 5 }}>Total<br/>Bobot</th>
              <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 5 }}>Ket</th>
            </tr>
            <tr style={{ background: "#0B3B36", color: "#fff" }}>
              <th style={{ border: "1px solid #1F2937", padding: "2px 5px", fontWeight: 700 }}>Angka</th>
              <th style={{ border: "1px solid #1F2937", padding: "2px 5px", fontWeight: 700 }}>Predikat</th>
              <th style={{ border: "1px solid #1F2937", padding: "2px 5px", fontWeight: 700 }}>Bobot</th>
            </tr>
          </thead>
          <tbody>
            {recordsKRS.map((r, i) => {
              const ada = r.nilai_angka != null;
              const b = ada ? bobot(nilaiHuruf(r.nilai_angka)) : 0;
              return (
              <tr key={r.id}>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{i + 1}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{r.kode_mk || "-"}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5 }}>{r.mata_kuliah}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{r.sks}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{ada ? r.nilai_angka : "-"}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{ada ? nilaiHuruf(r.nilai_angka) : "-"}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{ada ? b.toFixed(2) : "-"}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{ada ? (b * Number(r.sks || 0)).toFixed(2) : "-"}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>-</td>
              </tr>
              );
            })}
            <tr style={{ background: "#F3EEE1", fontWeight: 700 }}>
              <td colSpan={3} style={{ border: "1px solid #1F2937", padding: "5px 10px 5px 5px", textAlign: "right" }}>JUMLAH</td>
              <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{recordsKRS.reduce((a, r) => a + Number(r.sks || 0), 0)}</td>
              <td colSpan={3} style={{ border: "1px solid #1F2937", padding: 5 }}></td>
              <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{recordsKRS.reduce((a, r) => a + (r.nilai_angka != null ? bobot(nilaiHuruf(r.nilai_angka)) * Number(r.sks || 0) : 0), 0).toFixed(2)}</td>
              <td style={{ border: "1px solid #1F2937", padding: 5 }}></td>
            </tr>
          </tbody>
        </table>
        <table style={{ width: "100%", fontSize: 10.5, marginTop: 6, marginBottom: 16 }}><tbody>
          <tr>
            <td style={{ verticalAlign: "top" }}>
              <div>Indeks Prestasi (IP) : <b>{(() => {
                const sel = recordsKRS.filter((r) => r.status === "selesai");
                const tot = sel.reduce((a, r) => a + Number(r.sks || 0), 0);
                return tot ? (sel.reduce((a, r) => a + bobot(nilaiHuruf(r.nilai_angka)) * Number(r.sks || 0), 0) / tot).toFixed(2) : "-";
              })()}</b></div>
              <div>Indeks Prestasi Kumulatif (IPK) : <b>{(() => {
                const sel = bestPerKode(records.filter((r) => r.status === "selesai"));
                const tot = sel.reduce((a, r) => a + Number(r.sks || 0), 0);
                return tot ? (sel.reduce((a, r) => a + bobot(nilaiHuruf(r.nilai_angka)) * Number(r.sks || 0), 0) / tot).toFixed(2) : "-";
              })()}</b></div>
            </td>
            <td style={{ textAlign: "right", verticalAlign: "top", fontSize: 9.5, color: "#44544D" }}>
              Keterangan Bobot:<br/>
              A = 4.00 &nbsp;&nbsp; B = 3.00<br/>
              C = 2.00 &nbsp;&nbsp; D = 1.00<br/>
              E = 0.00
            </td>
          </tr>
        </tbody></table>
        <div style={{ border: "1px solid #E7DFCB", background: "#FBF8F1", borderRadius: 6, padding: "10px 14px", marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#0B3B36", marginBottom: 4 }}>Rekapitulasi Capaian Al-Qur'an</div>
          <div style={{ fontSize: 10.5 }}><b>Total Hafalan Dikuasai:</b> {santri?.juz_dikuasai?.length || 0} dari 30 Juz</div>
        </div>
        </>
        )}
        {adaBintang(dokType === "Transkrip" ? records : recordsKRS) && <div style={{ fontSize: 9.5, fontStyle: "italic", color: "#44403C", marginTop: 6, lineHeight: 1.45 }}>{brand.catatan_krs || CATATAN_KRS_BAWAAN}</div>}

        <div style={{ fontSize: 10.5, ...ttdBlokStyle(brand, 24) }}>
          <div>{brand.kota_pondok || "Aceh Besar"}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
          <div style={jabatanStyle(brand)}>{brand.jabatan_ttd || DEFAULT_JABATAN_TTD}</div>
          <div style={{ display: "flex", justifyContent: isiAlign(brand).flex, marginTop: 10, marginBottom: 6 }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${brand.nama_pondok || "SIAKAD"} | ${dokType} | NIM ${santri?.nim} | ${semesterTerbaru?.tahun_ajaran} Semester ${semesterTerbaru?.semester}`)}`}
              alt="QR verifikasi tanda tangan"
              style={{ width: 56, height: 56 }}
            />
          </div>
          {brand.tanda_tangan_mudir_url ? (
            <div><img src={brand.tanda_tangan_mudir_url} alt="Tanda tangan Mudir" style={{ height: 46, margin: isiAlign(brand).img }} /></div>
          ) : null}
          <div style={{ borderTop: brand.tanda_tangan_mudir_url ? "1px solid #999" : "none", paddingTop: brand.tanda_tangan_mudir_url ? 2 : 0 }}><b>{brand.nama_mudir}</b></div>
          <div>NIP. {brand.nip_mudir || "-"}</div>
        </div>
        <DokumenQR dokType={dokType} nim={santri?.nim} ta={semesterTerbaru?.tahun_ajaran} sem={semesterTerbaru?.semester} pondok={brand.nama_pondok} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatCard label="Total SKS Diambil" value={records.reduce((a, r) => a + Number(r.sks || 0), 0)} />
        <StatCard label="IPK (Rata-rata Nilai)" value={(() => {
          const selesai = records.filter((r) => r.status === "selesai");
          const tot = selesai.reduce((a, r) => a + Number(r.sks || 0), 0);
          return tot ? (selesai.reduce((a, r) => a + bobot(nilaiHuruf(r.nilai_angka)) * Number(r.sks || 0), 0) / tot).toFixed(2) : "-";
        })()} />
        <StatCard label="Mata Kuliah Selesai" value={`${records.filter((r) => r.status === "selesai").length} dari ${records.length}`} />
      </div>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3.5">Kode MK</th><th className="p-3.5">Mata Kuliah</th><th className="p-3.5">Semester</th><th className="p-3.5">Pengajar</th><th className="p-3.5">SKS</th><th className="p-3.5">Status</th><th className="p-3.5">Nilai</th>{editable && <th className="p-3.5"></th>}</tr></thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-t border-stone-100">
                <td className="p-3.5 text-stone-400">{r.kode_mk || "-"}</td>
                <td className="p-3.5 font-semibold">
                  {r.mata_kuliah}
                  {r.mengulang && <span className="ml-2 inline-block text-[0.625rem] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">🔁 Mengulang</span>}
                  {r.mata_kuliah === "Sidang Bisnis" && r.nama_brand && (
                    <div className="text-[0.6875rem] font-normal text-stone-500 mt-0.5">
                      Brand: {r.nama_brand} ({r.bidang_bisnis || "-"})
                      {r.logo_url && <a href={r.logo_url} target="_blank" rel="noreferrer" className="ml-2 text-[#145048] font-bold underline">Logo</a>}
                      {r.foto_produk_url && <a href={r.foto_produk_url} target="_blank" rel="noreferrer" className="ml-2 text-[#145048] font-bold underline">Foto Produk</a>}
                    </div>
                  )}
                </td>
                <td className="p-3.5 text-stone-500">{r.tahun_ajaran} · {r.semester}</td>
                <td className="p-3.5 text-stone-500">{r.pengajar || "-"}</td>
                <td className="p-3.5">{r.sks}</td>
                <td className="p-3.5"><Badge tone={r.status === "selesai" ? "green" : "gold"}>{r.status}</Badge></td>
                <td className="p-3.5 w-28">{editable ? <Input type="number" defaultValue={r.nilai_angka ?? ""} onBlur={(e) => updateNilai(r.id, e.target.value)} /> : (r.nilai_angka ?? "-")}</td>
                {editable && <td className="p-3.5 text-right whitespace-nowrap">
                  <button onClick={() => setEditingRecord(r)} className="text-[#145048] text-xs font-bold mr-3">Edit</button>
                  <button onClick={() => removeMatkul(r.id)} className="text-red-600 text-xs font-bold">Hapus</button>
                </td>}
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={editable ? 8 : 7}><Empty text="Belum ada data." /></td></tr>}
          </tbody>
        </table>
      </Card>
      {nim && (
        <Card className="mt-4">
          <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-3">Catatan Akademik</h3>
          {editable ? (
            <>
              <textarea className="w-full border border-stone-200 rounded-lg p-3 text-sm" rows={3} value={catatanAkademik} onChange={(e) => setCatatanAkademik(e.target.value)} placeholder="Tulis catatan akademik mahasantri di sini..." />
              <div className="mt-2 text-right"><Btn onClick={saveCatatanAkademik}>Simpan Catatan</Btn></div>
            </>
          ) : (
            <p className="text-sm text-stone-600 whitespace-pre-wrap">{santri?.catatan_akademik || "Belum ada catatan."}</p>
          )}
        </Card>
      )}
      </div>
      {tab === "akhir" && <TugasAkhirPanel nim={nim} profile={profile} rows={tahapT.rows} reload={tahapT.reload} />}
      {showAmbil && santri && <AmbilMatkulModal santri={santri} semuaSantri={santriT.rows} akRows={akT.rows} onCancel={() => setShowAmbil(false)} onDone={(n) => { setShowAmbil(false); akT.reload(); alert(n + " mata kuliah ditambahkan ke KRS."); }} />}
      {showForm && <AkademikForm nim={nim} onCancel={() => setShowForm(false)} onSubmit={saveRecord} />}
      {editingRecord && <AkademikForm nim={nim} initial={editingRecord} onCancel={() => setEditingRecord(null)} onSubmit={saveRecord} />}
    </div>
  );
}
function AkademikForm({ initial, nim, onCancel, onSubmit }) {
  const masterForm = useTable("mata_kuliah_master");
  const [f, setF] = useState(initial || { tahun_ajaran: `${nowYear}/${nowYear + 1}`, semester: "Ganjil", mata_kuliah: MATA_KULIAH[0], sks: 2, status: "aktif", pengajar: "", kode_mk: "", mengulang: false, semester_ke: "", bidang_bisnis: "", nama_brand: "", deskripsi_produk: "", logo_url: "", foto_produk_url: "" });
  const [uploading, setUploading] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  function uploadFile(field) {
    return async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(field);
      const path = `${nim || f.nim || "umum"}/sidang-${field}-${Date.now()}.${file.name.split(".").pop()}`;
      const { error: upErr } = await supabase.storage.from("dokumen-santri").upload(path, file, { upsert: true });
      if (upErr) { alert(upErr.message); setUploading(""); return; }
      const { data } = supabase.storage.from("dokumen-santri").getPublicUrl(path);
      setF((prev) => ({ ...prev, [field]: data.publicUrl }));
      setUploading("");
    };
  }
  const isSidangBisnis = f.mata_kuliah === "Sidang Bisnis";
  return (
    <Modal title={initial ? "Edit Mata Kuliah" : "Tambah Mata Kuliah"} onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); const hasil = { ...f, pengajar: normalisasiPengampu(f.pengajar), semester_ke: f.semester_ke === "" || f.semester_ke == null ? null : Number(f.semester_ke) }; if (hasil.semester_ke == null) delete hasil.semester_ke; onSubmit(hasil); }}>
        <Field label="Tahun Ajaran"><Input value={f.tahun_ajaran} onChange={set("tahun_ajaran")} /></Field>
        <Field label="Semester"><Select value={f.semester} onChange={set("semester")}><option>Ganjil</option><option>Genap</option></Select></Field>
        <Field label="Semester ke- (1, 2, 3 ... untuk dicetak di KRS)"><Input type="number" min={1} max={12} value={f.semester_ke ?? ""} onChange={set("semester_ke")} placeholder="cth. 2" /></Field>
        <Field label="Kode MK (opsional)"><Input value={f.kode_mk} onChange={set("kode_mk")} placeholder="cth. MKQ 1.1.1" /></Field>
        <Field label="Mata Kuliah">
          <Input list="mataKuliahSuggestions" value={f.mata_kuliah} onChange={set("mata_kuliah")} placeholder="Tulis nama mata kuliah" />
          <datalist id="mataKuliahSuggestions">{MATA_KULIAH.map((m) => <option key={m} value={m} />)}</datalist>
        </Field>
        <Field label="Pengajar / Pengampu"><PengampuInput value={f.pengajar} saranTambahan={String((masterForm.rows.find((m) => m.nama === f.mata_kuliah) || {}).pengajar || "").split("/").map((x) => x.trim()).filter(Boolean)} onChange={(v) => setF({ ...f, pengajar: v })} /></Field>
        <Field label="SKS"><Input type="number" value={f.sks} onChange={set("sks")} /></Field>

        {isSidangBisnis && (
          <div className="border border-stone-200 rounded-xl p-3 mb-3 bg-stone-50/60">
            <div className="text-xs font-bold text-[#0B3B36] mb-2 uppercase tracking-wide">Data Sidang Bisnis</div>
            <Field label="Bidang Usaha"><Select value={f.bidang_bisnis} onChange={set("bidang_bisnis")}><option value="">Pilih bidang…</option>{BIDANG_BISNIS.map((b) => <option key={b}>{b}</option>)}</Select></Field>
            <Field label="Nama Brand"><Input value={f.nama_brand} onChange={set("nama_brand")} placeholder="cth. Roti Berkah" /></Field>
            <Field label="Deskripsi Produk"><textarea className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm" rows={2} value={f.deskripsi_produk} onChange={set("deskripsi_produk")} /></Field>
            <div className="flex items-center justify-between border border-dashed border-stone-300 rounded-xl px-3.5 py-2.5 mb-2.5 text-sm bg-white">
              <span className="text-stone-600">Logo Brand{f.logo_url && <a href={f.logo_url} target="_blank" rel="noreferrer" className="ml-2 text-[0.625rem] font-bold text-[#145048] underline">Lihat file</a>}</span>
              <label className="text-xs font-bold text-[#0B3B36] border border-stone-300 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-stone-50">
                {uploading === "logo_url" ? "Mengunggah…" : f.logo_url ? "Ganti" : "Unggah"}
                <input type="file" accept="image/*" className="hidden" onChange={uploadFile("logo_url")} disabled={uploading === "logo_url"} />
              </label>
            </div>
            <div className="flex items-center justify-between border border-dashed border-stone-300 rounded-xl px-3.5 py-2.5 text-sm bg-white">
              <span className="text-stone-600">Foto Produk{f.foto_produk_url && <a href={f.foto_produk_url} target="_blank" rel="noreferrer" className="ml-2 text-[0.625rem] font-bold text-[#145048] underline">Lihat file</a>}</span>
              <label className="text-xs font-bold text-[#0B3B36] border border-stone-300 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-stone-50">
                {uploading === "foto_produk_url" ? "Mengunggah…" : f.foto_produk_url ? "Ganti" : "Unggah"}
                <input type="file" accept="image/*" className="hidden" onChange={uploadFile("foto_produk_url")} disabled={uploading === "foto_produk_url"} />
              </label>
            </div>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm mb-3">
          <input type="checkbox" checked={!!f.mengulang} onChange={(e) => setF({ ...f, mengulang: e.target.checked })} />
          Mengulang mata kuliah ini (nilai sebelumnya kurang)
        </label>
        <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit">Simpan</Btn></div>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------------- */
/* Kurikulum Mahasantri                                                    */
/* ---------------------------------------------------------------------- */
/* ---------------------------------------------------------------------- */
/* Tugas Akhir & Ujian — alur tahapan akhir mahasantri                      */
/* KPM → Magang → Sidang Akhir Bisnis | Sidang Munaqasyah → Syahadah Kubro → Sanad */
/* Bobot penilaian & daftar berkas di bawah mudah diubah sesuai ketentuan pondok.   */
/* ---------------------------------------------------------------------- */
const ALUR_PROGRAM = ["Diajukan", "Disetujui", "Berjalan", "Lulus"];
const ALUR_SIDANG = ["Diajukan", "Disetujui", "Terjadwal", "Lulus"];
const TAHAPAN_AKHIR = [
  { kode: "Magang", nama: "Magang", lengkap: "Magang Usaha / Profesi", ikon: "💼", prasyarat: [], alur: ALUR_PROGRAM, lblSelesai: "Tanggal Selesai",
    syarat: "Berstatus mahasantri aktif, sudah menempuh minimal 4 semester, dan ada surat penerimaan dari tempat magang.",
    langkah: "Mengajukan tempat dan rencana magang → disetujui akademik → pelaksanaan dan logbook → laporan, penilaian pembimbing dan mitra.",
    berkas: ["Surat Penerimaan dari Mitra", "Logbook Harian", "Laporan Magang", "Penilaian Pembimbing Mitra"],
    komponen: [{ kode: "mitra", label: "Penilaian Pembimbing Mitra", bobot: 40 }, { kode: "laporan", label: "Laporan Magang", bobot: 30 }, { kode: "pondok", label: "Penilaian Pembimbing Pondok", bobot: 30 }],
    lbl: { judul: "Bidang / Posisi Magang", pembimbing: "Pembimbing Pondok", penguji: "Pembimbing Mitra", lokasi: "Tempat Magang (Perusahaan / Mitra)", tgl: "Tanggal Mulai" } },
  { kode: "KPM", nama: "KPM", lengkap: "Kuliah Pengabdian Masyarakat", ikon: "🤝", prasyarat: ["Magang"], alur: ALUR_PROGRAM, lblSelesai: "Tanggal Selesai",
    syarat: "Magang sudah dinyatakan lulus dan mengikuti pembekalan KPM.",
    langkah: "Mengajukan program dan lokasi → disetujui akademik → pelaksanaan di lapangan → laporan dan penilaian pembimbing.",
    berkas: ["Proposal / Surat Pengajuan Program", "Laporan KPM", "Dokumentasi Kegiatan", "Lembar Penilaian Pembimbing Lapangan"],
    komponen: [{ kode: "lapangan", label: "Kinerja di Lapangan", bobot: 40 }, { kode: "laporan", label: "Laporan KPM", bobot: 40 }, { kode: "sikap", label: "Sikap & Adab", bobot: 20 }],
    lbl: { judul: "Tema / Program Pengabdian", pembimbing: "Pembimbing Lapangan", penguji: "Penilai", lokasi: "Lokasi / Mitra", tgl: "Tanggal Mulai" } },
  { kode: "Sidang Akhir Bisnis", nama: "Sidang Akhir Bisnis", lengkap: "Sidang Akhir Bisnis (Tugas Akhir Kewirausahaan)", ikon: "📈", prasyarat: ["Magang", "KPM"], alur: ALUR_SIDANG,
    syarat: "Magang dan KPM sudah lulus, laporan bisnis disetujui pembimbing, dan nilai matakuliah kewirausahaan sudah lengkap.",
    langkah: "Mengajukan sidang beserta laporan bisnis → persetujuan pembimbing → penjadwalan → presentasi dan tanya jawab → penilaian (lulus / revisi / mengulang).",
    berkas: ["Logo Brand", "Foto Produk 1", "Foto Produk 2", "Foto Produk 3", "Proposal / Rencana Bisnis", "Laporan Akhir Bisnis", "Slide Presentasi", "Berita Acara Sidang"],
    foto: ["Logo Brand", "Foto Produk 1", "Foto Produk 2", "Foto Produk 3"], fotoWajib: ["Logo Brand", "Foto Produk 1"],
    karya: [{ kode: "nama_brand", label: "Nama Brand" }, { kode: "bidang", label: "Bidang / Jenis Usaha", ph: "cth. Kuliner, Fashion Muslim, Jasa" }, { kode: "tagline", label: "Tagline / Slogan" }, { kode: "produk", label: "Produk / Layanan Utama", ph: "cth. Madu hutan 250 ml, kemasan botol" }, { kode: "tautan", label: "Tautan Media Sosial / Marketplace", ph: "https://instagram.com/..." }],
    komponen: [{ kode: "laporan", label: "Laporan Bisnis", bobot: 40 }, { kode: "presentasi", label: "Presentasi", bobot: 30 }, { kode: "tanyajawab", label: "Tanya Jawab", bobot: 30 }],
    lbl: { judul: "Nama Usaha & Judul Laporan Bisnis", pembimbing: "Dosen Pembimbing", penguji: "Tim Penguji", lokasi: "Tempat Sidang", tgl: "Tanggal Sidang" } },
  { kode: "Sidang Munaqasyah", nama: "Sidang Munaqasyah", lengkap: "Sidang Munaqasyah Tahfidz", ikon: "📖", prasyarat: [], alur: ALUR_SIDANG, cekQuran: true,
    syarat: "Hafalan memenuhi target kelulusan, sudah mengikuti Tasmi', dan memiliki Syahadah (tercatat di menu Capaian Al-Qur'an).",
    langkah: "Mengajukan munaqasyah → verifikasi hafalan oleh musyrif → penjadwalan → ujian lisan di hadapan tim penguji → penilaian.",
    berkas: ["Surat Rekomendasi Musyrif", "Berita Acara Munaqasyah"],
    komponen: [{ kode: "hafalan", label: "Kelancaran Hafalan", bobot: 50 }, { kode: "tajwid", label: "Tajwid & Makhraj", bobot: 30 }, { kode: "adab", label: "Adab & Sikap Ujian", bobot: 20 }],
    lbl: { judul: "Materi / Cakupan Ujian", pembimbing: "Musyrif Pembimbing", penguji: "Tim Penguji", lokasi: "Tempat Ujian", tgl: "Tanggal Ujian" } },
  { kode: "Syahadah Kubro", nama: "Syahadah Kubro", lengkap: "Syahadah Kubro (Setoran 30 Juz Sekali Duduk)", ikon: "🏅", prasyarat: [], alur: ALUR_SIDANG, duaHari: true, lblSelesai: "Tanggal Selesai (Hari ke-2)",
    syarat: "Capaian Al-Qur'an: Ziyadah 30 juz sudah selesai dan sudah Tasmi'. Tahap ini tidak bergantung pada tahap tugas akhir lain.", syaratQuran: true,
    langkah: "Mengajukan Syahadah Kubro → verifikasi kesiapan oleh musyrif → penjadwalan 2 hari → setoran 30 juz sekali duduk (hari ke-1 dan hari ke-2) di hadapan tim penyimak → penilaian dan penyerahan syahadah.",
    berkas: ["Berita Acara Syahadah Kubro", "Dokumentasi Pelaksanaan", "Salinan Syahadah"],
    lbl: { judul: "Nomor Syahadah / Keterangan", pembimbing: "Musyrif Pembimbing", penguji: "Tim Penyimak / Penguji", lokasi: "Tempat Pelaksanaan", tgl: "Tanggal Mulai (Hari ke-1)" } },
  { kode: "Pengambilan Sanad", nama: "Pengambilan Sanad", lengkap: "Pengambilan Sanad Al-Qur'an", ikon: "📜", prasyarat: ["Syahadah Kubro"], alur: ALUR_SIDANG,
    syarat: "Syahadah Kubro sudah lulus dan mendapat izin dari guru pemberi sanad.",
    langkah: "Mengajukan pengambilan sanad → izin guru pemberi sanad → penjadwalan talaqqi → prosesi dan penyimakan → pencatatan sanad.",
    berkas: ["Surat Izin Guru Pemberi Sanad", "Salinan Sanad"],
    lbl: { judul: "Jalur / Riwayat Sanad", pembimbing: "Guru Pemberi Sanad", penguji: "Saksi / Penyimak", lokasi: "Tempat Pengambilan", tgl: "Tanggal Pengambilan" } },
  { kode: "Wisuda", nama: "Wisuda", lengkap: "Pengajuan dan Pelaksanaan Wisuda", ikon: "🎓", prasyarat: ["Magang", "KPM", "Sidang Akhir Bisnis", "Sidang Munaqasyah", "Syahadah Kubro", "Pengambilan Sanad"], alur: ALUR_SIDANG, cekKeuangan: true,
    syarat: "Seluruh tahap tugas akhir dan ujian sudah lulus, serta administrasi (SPP dan koperasi) sudah lunas.",
    langkah: "Mengajukan wisuda → verifikasi kelengkapan oleh akademik → penetapan jadwal → pelaksanaan wisuda → pencatatan kelulusan.",
    berkas: ["Formulir Pendaftaran Wisuda", "Pas Foto", "Bukti Pelunasan Administrasi", "Salinan Transkrip Nilai"],
    lbl: { judul: "Nomor Ijazah / Keterangan", pembimbing: "Verifikator Akademik", penguji: "Pejabat Penandatangan", lokasi: "Tempat Wisuda", tgl: "Tanggal Wisuda" } },
];
const STATUS_TAHAP_TONE = { Diajukan: "blue", Disetujui: "gold", Terjadwal: "gold", Berjalan: "gold", Revisi: "gold", Lulus: "green", "Tidak Lulus": "red", Ditolak: "red" };
const STATUS_TAHAP_AKHIR = ["Lulus", "Tidak Lulus", "Ditolak"];
function tahapTerakhir(rows, kode) {
  return rows.filter((r) => r.jenis === kode).sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")) || (Number(b.id) || 0) - (Number(a.id) || 0))[0];
}
function tahapLulus(rows, kode) { return rows.some((r) => r.jenis === kode && r.status === "Lulus"); }
function jumlahTahapLulus(rows) { return TAHAPAN_AKHIR.filter((t) => tahapLulus(rows, t.kode)).length; }
function langkahBerikut(cfg, status) {
  if (status === "Revisi") return "Lulus";
  const i = cfg.alur.indexOf(status);
  return i >= 0 && i < cfg.alur.length - 1 ? cfg.alur[i + 1] : null;
}
function tglPendek(t) { return t ? new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : ""; }
function nilaiAkhirKomponen(cfg, kom) {
  if (!cfg.komponen) return null;
  if (!cfg.komponen.every((k) => kom && kom[k.kode] !== undefined && kom[k.kode] !== "" && kom[k.kode] !== null)) return null;
  const tot = cfg.komponen.reduce((a, k) => a + k.bobot, 0);
  return Math.round((cfg.komponen.reduce((a, k) => a + Number(kom[k.kode]) * k.bobot, 0) / tot) * 10) / 10;
}

function TabAkademik({ tab, setTab, rows }) {
  return (
    <div className="flex gap-1 mb-5 border-b border-stone-200">
      {[["krs", "KRS & KHS"], ["akhir", `Tugas Akhir & Ujian (${jumlahTahapLulus(rows)}/${TAHAPAN_AKHIR.length})`]].map(([k, l]) => (
        <button key={k} type="button" onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-bold -mb-px border-b-2 ${tab === k ? "border-[#0B3B36] text-[#0B3B36]" : "border-transparent text-stone-400 hover:text-stone-600"}`}>{l}</button>
      ))}
    </div>
  );
}

function TugasAkhirPanel({ nim, profile, rows, reload }) {
  const staff = canEdit(profile.role, "tahapan_akhir");
  const quranT = useTable("quran_log");
  const [form, setForm] = useState(null);
  const [lihatCetak, setLihatCetak] = useState(false);
  const sppPanelT = useTable("spp");
  const lihatKeuangan = ["admin", "pimpinan", "santri"].includes(profile.role);
  const santriPanelT = useTable("santri");
  const santriPanel = santriPanelT.rows.find((x) => x.nim === nim);
  const mine = rows.filter((r) => r.nim === nim);
  const lulus = jumlahTahapLulus(mine);
  const syahadah = quranT.rows.filter((l) => l.nim === nim && l.jenis === "Syahadah").length;
  const tasmi = quranT.rows.filter((l) => l.nim === nim && l.jenis === "Tasmi'").length;

  async function simpan(cfg, f, id) {
    let error;
    if (!staff && id) {
      ({ error } = await supabase.from("tahapan_akhir").update({ judul: f.judul || null, lokasi: f.lokasi || null, berkas: f.berkas || {}, karya: f.karya || {} }).eq("id", id));
    } else {
      const angka = nilaiAkhirKomponen(cfg, f.komponen) ?? (f.nilai_angka === "" || f.nilai_angka == null ? null : Number(f.nilai_angka));
      const payload = {
        jenis: cfg.kode, status: f.status || "Diajukan", judul: f.judul || null, pembimbing: f.pembimbing || null, penguji: f.penguji || null, lokasi: f.lokasi || null,
        tanggal_pengajuan: f.tanggal_pengajuan || null, tanggal_pelaksanaan: f.tanggal_pelaksanaan || null,
        tanggal_selesai: cfg.lblSelesai ? f.tanggal_selesai || null : null,
        capaian_hari1: cfg.duaHari ? f.capaian_hari1 || null : null, capaian_hari2: cfg.duaHari ? f.capaian_hari2 || null : null,
        nilai_angka: angka, komponen: cfg.komponen ? f.komponen || {} : {}, berkas: f.berkas || {}, karya: cfg.karya ? f.karya || {} : {}, catatan: f.catatan || null,
        diperbarui_oleh: profile.username || null,
      };
      ({ error } = id ? await supabase.from("tahapan_akhir").update(payload).eq("id", id) : await supabase.from("tahapan_akhir").insert({ ...payload, nim }));
    }
    if (error) alert(error.message); else { setForm(null); reload(); }
  }
  async function lanjut(r, cfg, next) {
    if (next === "Lulus") { setForm({ cfg, initial: { ...r, status: "Lulus" }, id: r.id }); return; }
    const { error } = await supabase.from("tahapan_akhir").update({ status: next, diperbarui_oleh: profile.username || null }).eq("id", r.id);
    if (error) alert(error.message); else reload();
  }
  async function hapus(id) {
    if (!confirm("Hapus catatan tahap ini?")) return;
    const { error } = await supabase.from("tahapan_akhir").delete().eq("id", id);
    if (error) alert(error.message); else reload();
  }

  return (
    <div>
      <Card className="mb-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="max-w-xl">
            <h3 className="font-serif-dh text-lg text-[#0B3B36] font-semibold">Perjalanan Tugas Akhir & Ujian</h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">Magang → KPM → Sidang Akhir Bisnis. Sidang Munaqasyah dan Syahadah Kubro tidak bergantung pada tahap lain, tetapi Syahadah Kubro butuh Ziyadah 30 juz dan Tasmi' di Capaian Al-Qur'an. Pengambilan Sanad setelah Syahadah Kubro. Wisuda dapat diajukan setelah semua tahap lulus.</p>
          </div>
          <div className="text-right"><button type="button" onClick={() => setLihatCetak(!lihatCetak)} className="text-xs font-bold text-[#145048] underline mb-2 block ml-auto">{lihatCetak ? "Tutup Pratinjau Cetak" : "Pratinjau & Cetak Ringkasan"}</button><div className="text-3xl font-extrabold text-[#0B3B36] leading-none">{lulus}<span className="text-base text-stone-400 font-bold">/{TAHAPAN_AKHIR.length}</span></div><div className="text-[0.6875rem] text-stone-400 mt-1 uppercase tracking-wider">tahap lulus</div></div>
        </div>
        <div className="h-1.5 bg-stone-100 rounded-full mt-4 overflow-hidden"><div className="h-full bg-gradient-to-r from-[#2A9D8F] to-[#C9A227] transition-all" style={{ width: `${(lulus / TAHAPAN_AKHIR.length) * 100}%` }} /></div>
        {lulus === TAHAPAN_AKHIR.length - 1 && !tahapLulus(mine, "Wisuda") && <div className="mt-3 text-sm font-bold text-[#8A6A2A] bg-[#FBF3DC] rounded-xl px-3 py-2">Semua tahap sebelum wisuda sudah lulus — mahasantri layak mengajukan wisuda.</div>}
        {lulus === TAHAPAN_AKHIR.length && <div className="mt-3 text-sm font-bold text-[#0F4A44] bg-[#E9F1EE] rounded-xl px-3 py-2">✅ Seluruh tahapan, termasuk wisuda, sudah dinyatakan lulus.</div>}
      </Card>

      <div>
        {TAHAPAN_AKHIR.map((cfg, i) => {
          const r = tahapTerakhir(mine, cfg.kode);
          const percobaan = mine.filter((x) => x.jenis === cfg.kode).length;
          const belum = cfg.prasyarat.filter((k) => !tahapLulus(mine, k));
          const selesai = tahapLulus(mine, cfg.kode);
          const aktif = r && !STATUS_TAHAP_AKHIR.includes(r.status);
          const bisaAjukan = !aktif && !selesai && belum.length === 0 && quranOk;
          const next = aktif ? langkahBerikut(cfg, r.status) : null;
          const juzSelesai = (santriPanel?.juz_dikuasai || []).length;
          const quranOk = !cfg.syaratQuran || (juzSelesai >= 30 && tasmi >= 1);
          const terkunci = !r && (belum.length > 0 || !quranOk);
          const berkasR = (r && r.berkas) || {};
          const jmlBerkas = cfg.berkas.filter((b) => berkasR[b]).length;
          const kom = (r && r.komponen) || {};
          const terakhir = i === TAHAPAN_AKHIR.length - 1;
          const bulat = selesai ? "bg-[#2A9D8F] text-white" : aktif ? "bg-[#FBF3DC] text-[#8A6A2A] ring-2 ring-[#C9A227]" : terkunci ? "bg-stone-100 text-stone-400" : "bg-white text-[#0B3B36] ring-1 ring-stone-300";
          return (
            <div key={cfg.kode} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shrink-0 ${bulat}`}>{selesai ? <IkonCentang /> : terkunci ? <IkonKunci /> : <IkonTahap kode={cfg.kode} />}</div>
                {!terakhir && <div className={`w-px flex-1 my-1 ${selesai ? "bg-[#2A9D8F]" : "bg-stone-200"}`} />}
              </div>
              <div className={`flex-1 min-w-0 ${terakhir ? "" : "pb-5"}`}>
                <Card className={terkunci ? "opacity-70" : ""}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-serif-dh font-semibold text-[#0B3B36] text-base">{cfg.nama}</h4>
                        {r ? <Badge tone={STATUS_TAHAP_TONE[r.status] || "grey"}>{r.status}</Badge> : <Badge tone="grey">{terkunci ? "Terkunci" : "Belum diajukan"}</Badge>}
                        {percobaan > 1 && <span className="text-[0.6875rem] text-stone-400">percobaan ke-{percobaan}</span>}
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5">{cfg.lengkap}</div>
                    </div>
                    <div className="flex gap-1.5 items-center flex-wrap justify-end">
                      {bisaAjukan && <Btn onClick={() => setForm({ cfg, initial: null, id: null })}>{r ? "Ajukan Ulang" : "Ajukan"}</Btn>}
                      {staff && !bisaAjukan && !aktif && !selesai && <Btn tone="ghost" onClick={() => { if (confirm("Prasyarat belum terpenuhi. Tetap input manual (mis. data lama)?")) setForm({ cfg, initial: null, id: null }); }}>Input Manual</Btn>}
                      {!staff && aktif && <Btn tone="ghost" onClick={() => setForm({ cfg, initial: r, id: r.id })}>Unggah Berkas</Btn>}
                      {staff && next && <Btn tone="gold" onClick={() => lanjut(r, cfg, next)}>Lanjut: {next}</Btn>}
                      {staff && r && <Btn tone="ghost" onClick={() => setForm({ cfg, initial: r, id: r.id })}>Edit / Nilai</Btn>}
                      {staff && r && <button type="button" onClick={() => hapus(r.id)} className="text-[0.6875rem] text-red-500 font-bold px-1">Hapus</button>}
                    </div>
                  </div>

                  {!r && (
                    <div className="mt-3 text-xs text-stone-500 space-y-1">
                      <div><b>Syarat:</b> {cfg.syarat}</div>
                      <div><b>Proses:</b> {cfg.langkah}</div>
                    </div>
                  )}
                  {terkunci && <div className="text-xs text-[#8A6A2A] mt-2">Menunggu: {[belum.length ? "tahap " + belum.join(", ") : "", !quranOk ? "Ziyadah 30 juz dan Tasmi'" : ""].filter(Boolean).join(" · ")}</div>}
                  {cfg.syaratQuran && !selesai && <div className="text-xs mt-2 text-stone-500">Capaian Al-Qur'an: Ziyadah <b className={juzSelesai >= 30 ? "text-[#0F4A44]" : "text-red-600"}>{juzSelesai}/30 juz</b> · Tasmi' <b className={tasmi ? "text-[#0F4A44]" : "text-red-600"}>{tasmi}x</b></div>}
                  {cfg.cekKeuangan && !selesai && lihatKeuangan && (() => { const tg = sppPanelT.rows.filter((x) => x.nim === nim && x.status !== "Lunas").reduce((a, x) => a + Number(x.nominal || 0), 0); return <div className="text-xs mt-2 text-stone-500">Administrasi SPP: {tg > 0 ? <b className="text-red-600">tertunggak {formatRupiah(tg)}</b> : <b className="text-[#0F4A44]">tidak ada tunggakan</b>}</div>; })()}
                  {cfg.cekQuran && !selesai && <div className="text-xs mt-2 text-stone-500">Capaian Al-Qur'an tercatat: Tasmi' <b className={tasmi ? "text-[#0F4A44]" : "text-red-600"}>{tasmi}x</b> · Syahadah <b className={syahadah ? "text-[#0F4A44]" : "text-red-600"}>{syahadah}x</b></div>}

                  {r && (
                    <div className="mt-3 border-t border-stone-100 pt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                      {r.judul && <div className="col-span-2"><span className="text-stone-400 text-xs">{cfg.lbl.judul}</span><div className="font-semibold text-[#0B3B36]">{r.judul}</div></div>}
                      {r.pembimbing && <div><span className="text-stone-400 text-xs">{cfg.lbl.pembimbing}</span><div>{r.pembimbing}</div></div>}
                      {r.penguji && <div><span className="text-stone-400 text-xs">{cfg.lbl.penguji}</span><div>{r.penguji}</div></div>}
                      {r.lokasi && <div><span className="text-stone-400 text-xs">{cfg.lbl.lokasi}</span><div>{r.lokasi}</div></div>}
                      {r.tanggal_pengajuan && <div><span className="text-stone-400 text-xs">Tanggal Pengajuan</span><div>{tglPendek(r.tanggal_pengajuan)}</div></div>}
                      {r.tanggal_pelaksanaan && <div><span className="text-stone-400 text-xs">{cfg.lbl.tgl}</span><div>{tglPendek(r.tanggal_pelaksanaan)}</div></div>}
                      {cfg.lblSelesai && r.tanggal_selesai && <div><span className="text-stone-400 text-xs">{cfg.lblSelesai}</span><div>{tglPendek(r.tanggal_selesai)}</div></div>}
                      {cfg.duaHari && r.capaian_hari1 && <div><span className="text-stone-400 text-xs">Capaian Hari ke-1</span><div>{r.capaian_hari1}</div></div>}
                      {cfg.duaHari && r.capaian_hari2 && <div><span className="text-stone-400 text-xs">Capaian Hari ke-2</span><div>{r.capaian_hari2}</div></div>}
                      {r.catatan && <div className="col-span-2"><span className="text-stone-400 text-xs">Catatan Evaluasi</span><div>{r.catatan}</div></div>}
                    </div>
                  )}

                  {r && cfg.komponen && Object.keys(kom).length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {cfg.komponen.filter((k) => kom[k.kode] !== undefined && kom[k.kode] !== "").map((k) => (
                        <div key={k.kode} className="bg-stone-50 rounded-lg px-3 py-1.5 text-xs"><span className="text-stone-400">{k.label}</span> <b className="text-[#0B3B36] ml-1">{kom[k.kode]}</b></div>
                      ))}
                    </div>
                  )}
                  {r && r.nilai_angka != null && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-[#E9F1EE] text-[#0F4A44] rounded-xl px-3 py-1.5 text-sm"><span className="text-xs">Nilai Akhir</span><b className="text-base">{r.nilai_angka}</b><span className="text-xs font-bold">({nilaiHuruf(r.nilai_angka)})</span></div>
                  )}

                  {r && cfg.karya && (r.karya && Object.values(r.karya).some(Boolean) || cfg.foto.some((x) => berkasR[x])) && (
                    <div className="mt-3 rounded-xl border border-[#E4DCC5] bg-[#FBF8EE] p-3">
                      <div className="text-[0.6875rem] uppercase tracking-wider text-[#8A6A2A] font-bold mb-2">Karya Bisnis</div>
                      <div className="flex gap-3 flex-wrap items-start">
                        {berkasR["Logo Brand"] && <a href={berkasR["Logo Brand"]} target="_blank" rel="noreferrer"><img src={berkasR["Logo Brand"]} alt="Logo brand" className="w-20 h-20 rounded-xl object-cover bg-white border border-stone-200" /></a>}
                        <div className="flex-1 min-w-[10rem]">
                          {(r.karya || {}).nama_brand && <div className="font-serif-dh text-lg font-semibold text-[#0B3B36] leading-tight">{r.karya.nama_brand}</div>}
                          {(r.karya || {}).tagline && <div className="text-xs italic text-stone-500">“{r.karya.tagline}”</div>}
                          <div className="text-xs text-stone-600 mt-1 space-y-0.5">
                            {(r.karya || {}).bidang && <div><span className="text-stone-400">Bidang:</span> {r.karya.bidang}</div>}
                            {(r.karya || {}).produk && <div><span className="text-stone-400">Produk:</span> {r.karya.produk}</div>}
                            {(r.karya || {}).tautan && <div><a href={r.karya.tautan} target="_blank" rel="noreferrer" className="text-[#145048] underline font-bold">Kunjungi brand</a></div>}
                          </div>
                        </div>
                      </div>
                      {cfg.foto.filter((x) => x !== "Logo Brand" && berkasR[x]).length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {cfg.foto.filter((x) => x !== "Logo Brand" && berkasR[x]).map((x) => <a key={x} href={berkasR[x]} target="_blank" rel="noreferrer"><img src={berkasR[x]} alt={x} className="w-24 h-24 rounded-lg object-cover border border-stone-200" /></a>)}
                        </div>
                      )}
                    </div>
                  )}

                  {r && (
                    <div className="mt-3">
                      <div className="text-[0.6875rem] uppercase tracking-wider text-stone-400 font-bold mb-1.5">Berkas ({jmlBerkas}/{cfg.berkas.length})</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {cfg.berkas.map((b) => berkasR[b]
                          ? <a key={b} href={berkasR[b]} target="_blank" rel="noreferrer" className="text-xs px-2.5 py-1 rounded-full bg-[#E9F1EE] text-[#0F4A44] font-semibold hover:underline">✓ {b}</a>
                          : <span key={b} className="text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-400">○ {b}</span>)}
                        {r.berkas_url && <a href={r.berkas_url} target="_blank" rel="noreferrer" className="text-xs px-2.5 py-1 rounded-full bg-[#E9F1EE] text-[#0F4A44] font-semibold hover:underline">✓ Berkas lain</a>}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          );
        })}
      </div>
      {lihatCetak && (
        <div className="mt-6">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .krs-print, .krs-print * { visibility: visible; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
              .krs-print { position: absolute; top: 0; left: 0; width: 100%; padding: 24px 32px; box-shadow: none !important; border: none !important; }
            }
          `}</style>
          <div className="flex justify-end mb-2"><Btn tone="ghost" onClick={() => window.print()}>🖨️ Cetak Ringkasan</Btn></div>
          <RingkasanTugasAkhirCetak santri={santriPanel} rows={mine} />
        </div>
      )}
      {!staff && <p className="text-xs text-stone-400 mt-4">Pengajuan dan berkas Anda akan diperiksa dan diproses oleh bagian Akademik. Hubungi Akademik bila ada kendala.</p>}
      {form && <TahapanForm cfg={form.cfg} initial={form.initial} nim={nim} terbatas={!staff} onCancel={() => setForm(null)} onSubmit={(f) => { if (staff && f.status === "Lulus" && form.cfg.fotoWajib && form.cfg.fotoWajib.some((x) => !(f.berkas || {})[x]) && !confirm("Foto karya wajib (" + form.cfg.fotoWajib.join(", ") + ") belum lengkap. Tetap luluskan?")) return; simpan(form.cfg, { ...f, status: staff ? f.status : "Diajukan" }, form.id); }} />}
    </div>
  );
}

function TahapanForm({ cfg, initial, nim, terbatas, onCancel, onSubmit }) {
  const [f, setF] = useState(initial
    ? { ...initial, nilai_angka: initial.nilai_angka ?? "", komponen: initial.komponen || {}, berkas: initial.berkas || {}, karya: initial.karya || {} }
    : { status: "Diajukan", judul: "", pembimbing: "", penguji: "", lokasi: "", tanggal_pengajuan: new Date().toISOString().slice(0, 10), tanggal_pelaksanaan: "", tanggal_selesai: "", capaian_hari1: "", capaian_hari2: "", nilai_angka: "", komponen: {}, berkas: {}, karya: {}, catatan: "" });
  const [uploading, setUploading] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function upload(nama, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(nama);
    const path = `${nim}/tahap-${cfg.kode.replace(/[^A-Za-z0-9]+/g, "-")}-${nama.replace(/[^A-Za-z0-9]+/g, "-")}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("dokumen-santri").upload(path, file, { upsert: true });
    if (error) { alert(error.message); setUploading(""); return; }
    const { data } = supabase.storage.from("dokumen-santri").getPublicUrl(path);
    setF((prev) => ({ ...prev, berkas: { ...prev.berkas, [nama]: data.publicUrl } }));
    setUploading("");
  }
  const otomatis = nilaiAkhirKomponen(cfg, f.komponen);
  const statusOpsi = [...cfg.alur, "Revisi", "Tidak Lulus", "Ditolak"];
  return (
    <Modal title={`${initial ? (terbatas ? "Berkas" : "Edit") : terbatas ? "Ajukan" : "Input"} ${cfg.nama}`} onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
        {!terbatas && <Field label="Status"><Select value={f.status} onChange={set("status")}>{statusOpsi.map((x) => <option key={x}>{x}</option>)}</Select></Field>}
        <Field label={cfg.lbl.judul}><Input value={f.judul || ""} onChange={set("judul")} /></Field>
        {!terbatas && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={cfg.lbl.pembimbing}><Input value={f.pembimbing || ""} onChange={set("pembimbing")} /></Field>
            <Field label={cfg.lbl.penguji}><Input value={f.penguji || ""} onChange={set("penguji")} /></Field>
          </div>
        )}
        <Field label={cfg.lbl.lokasi}><Input value={f.lokasi || ""} onChange={set("lokasi")} /></Field>
        {!terbatas && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tanggal Pengajuan"><Input type="date" value={f.tanggal_pengajuan || ""} onChange={set("tanggal_pengajuan")} /></Field>
              <Field label={cfg.lbl.tgl}><Input type="date" value={f.tanggal_pelaksanaan || ""} onChange={set("tanggal_pelaksanaan")} /></Field>
            </div>
            {cfg.lblSelesai && <Field label={cfg.lblSelesai}><Input type="date" value={f.tanggal_selesai || ""} onChange={set("tanggal_selesai")} /></Field>}
            {cfg.duaHari && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Capaian Hari ke-1"><Input value={f.capaian_hari1 || ""} onChange={set("capaian_hari1")} placeholder="cth. Juz 1–15, 3 teguran" /></Field>
                <Field label="Capaian Hari ke-2"><Input value={f.capaian_hari2 || ""} onChange={set("capaian_hari2")} placeholder="cth. Juz 16–30, 2 teguran" /></Field>
              </div>
            )}
            {cfg.komponen ? (
              <div className="mb-3">
                <div className="text-xs font-bold text-[#0B3B36] mb-1.5 uppercase tracking-wide">Komponen Penilaian (0–100)</div>
                <div className="grid grid-cols-3 gap-2">
                  {cfg.komponen.map((k) => (
                    <Field key={k.kode} label={`${k.label} (${k.bobot}%)`}><Input type="number" min={0} max={100} value={f.komponen[k.kode] ?? ""} onChange={(e) => setF({ ...f, komponen: { ...f.komponen, [k.kode]: e.target.value } })} /></Field>
                  ))}
                </div>
                <div className="text-xs text-stone-500">{otomatis != null ? <>Nilai akhir otomatis: <b className="text-[#0B3B36]">{otomatis}</b> ({nilaiHuruf(otomatis)})</> : "Isi semua komponen untuk menghitung nilai akhir otomatis."}</div>
              </div>
            ) : (
              <Field label={`Nilai Angka (0–100)${f.nilai_angka !== "" ? ` — predikat ${nilaiHuruf(Number(f.nilai_angka))}` : ""}`}><Input type="number" min={0} max={100} value={f.nilai_angka} onChange={set("nilai_angka")} /></Field>
            )}
            <Field label="Catatan / Hasil Evaluasi"><textarea className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm" rows={2} value={f.catatan || ""} onChange={set("catatan")} placeholder="cth. Revisi bab analisis pasar, mengulang pekan depan" /></Field>
          </>
        )}
        {cfg.karya && (
          <div className="mb-3 rounded-xl border border-[#E4DCC5] bg-[#FBF8EE] p-3">
            <div className="text-xs font-bold text-[#0B3B36] mb-2 uppercase tracking-wide">Karya Bisnis — Brand Sendiri</div>
            <div className="grid grid-cols-2 gap-x-3">
              {cfg.karya.map((k) => <Field key={k.kode} label={k.label}><Input value={f.karya[k.kode] || ""} onChange={(e) => setF({ ...f, karya: { ...f.karya, [k.kode]: e.target.value } })} placeholder={k.ph || ""} /></Field>)}
            </div>
            <div className="text-[0.6875rem] text-stone-500">Wajib foto: {cfg.fotoWajib.join(" dan ")}. Foto produk lain bersifat tambahan.</div>
          </div>
        )}
        <div className="mb-2">
          <div className="text-xs font-bold text-[#0B3B36] mb-1.5 uppercase tracking-wide">Berkas ({cfg.berkas.filter((b) => f.berkas[b]).length}/{cfg.berkas.length})</div>
          <div className="space-y-1.5">
            {cfg.berkas.map((b) => (
              <div key={b} className="flex items-center gap-2 text-sm bg-stone-50 rounded-lg px-3 py-1.5">
                <span className={f.berkas[b] ? "text-[#2A9D8F] font-bold" : "text-stone-300"}>{f.berkas[b] ? "✓" : "○"}</span>
                <span className="flex-1 min-w-0 truncate">{b}</span>
                {f.berkas[b] && cfg.foto && cfg.foto.includes(b) && <img src={f.berkas[b]} alt={b} className="w-8 h-8 rounded object-cover" />}
                {f.berkas[b] && <a href={f.berkas[b]} target="_blank" rel="noreferrer" className="text-xs text-[#145048] font-bold underline">lihat</a>}
                <label className="text-xs font-bold text-[#0B3B36] cursor-pointer underline">{uploading === b ? "Mengunggah…" : f.berkas[b] ? "ganti" : "unggah"}<input type="file" accept={cfg.foto && cfg.foto.includes(b) ? "image/*" : undefined} className="hidden" onChange={(e) => upload(b, e)} /></label>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit" disabled={!!uploading}>{terbatas ? (initial ? "Simpan Berkas" : "Kirim Pengajuan") : "Simpan"}</Btn></div>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------------- */
/* Monitoring Tugas Akhir — siapa yang mengajukan, siapa yang siap          */
/* ---------------------------------------------------------------------- */
const GRUP_STATUS_TAHAP = {
  "Perlu tindakan": ["Diajukan"],
  "Sedang berjalan": ["Disetujui", "Terjadwal", "Berjalan", "Revisi"],
  "Lulus": ["Lulus"],
  "Belum lulus": ["Tidak Lulus", "Ditolak"],
};
function TugasAkhirPantauPage({ profile }) {
  const staff = canEdit(profile.role, "tahapan_akhir");
  const santriT = useTable("santri");
  const tahapT = useTable("tahapan_akhir");
  const quranPantauT = useTable("quran_log");
  const [mode, setMode] = useState("pengajuan");
  const [tahap, setTahap] = useState("Semua");
  const [status, setStatus] = useState("Perlu tindakan");
  const [kelas, setKelas] = useState("Semua");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState(null);

  const daftarKelas = [...new Set(santriT.rows.map((s) => s.kelas).filter(Boolean))].sort();
  const cocokSantri = (s) => (kelas === "Semua" || s.kelas === kelas) && (!q || (s.nama || "").toLowerCase().includes(q.toLowerCase()) || String(s.nim || "").includes(q));
  const rowsNim = (nim) => tahapT.rows.filter((r) => r.nim === nim);

  const semua = [];
  santriT.rows.forEach((s) => {
    const mine = rowsNim(s.nim);
    TAHAPAN_AKHIR.forEach((cfg) => {
      const r = tahapTerakhir(mine, cfg.kode);
      if (r) semua.push({ s, cfg, r, mine });
    });
  });
  const ringkas = TAHAPAN_AKHIR.map((cfg) => {
    const list = semua.filter((x) => x.cfg.kode === cfg.kode);
    const hitung = (g) => list.filter((x) => GRUP_STATUS_TAHAP[g].includes(x.r.status)).length;
    return { cfg, tindakan: hitung("Perlu tindakan"), berjalan: hitung("Sedang berjalan"), lulus: hitung("Lulus") };
  });
  const totalTindakan = ringkas.reduce((a, x) => a + x.tindakan, 0);

  const tampil = semua
    .filter((x) => (tahap === "Semua" || x.cfg.kode === tahap) && (status === "Semua" || GRUP_STATUS_TAHAP[status].includes(x.r.status)) && cocokSantri(x.s))
    .sort((a, b) => (a.r.status === "Diajukan" ? 0 : 1) - (b.r.status === "Diajukan" ? 0 : 1) || String(b.r.tanggal_pengajuan || "").localeCompare(String(a.r.tanggal_pengajuan || "")));

  const cfgSiap = TAHAPAN_AKHIR.find((c) => c.kode === tahap);
  const siap = cfgSiap
    ? santriT.rows.filter((s) => (s.status === "Aktif" || !s.status) && cocokSantri(s)).filter((s) => {
        const mine = rowsNim(s.nim);
        const r = tahapTerakhir(mine, cfgSiap.kode);
        const aktifR = r && !STATUS_TAHAP_AKHIR.includes(r.status);
        const quranOk = !cfgSiap.syaratQuran || (((s.juz_dikuasai || []).length >= 30) && quranPantauT.rows.some((l) => l.nim === s.nim && l.jenis === "Tasmi'"));
        return !aktifR && !tahapLulus(mine, cfgSiap.kode) && cfgSiap.prasyarat.every((k) => tahapLulus(mine, k)) && quranOk;
      })
    : [];

  async function lanjut(x) {
    const next = langkahBerikut(x.cfg, x.r.status);
    if (!next) return;
    if (next === "Lulus") { setDetail(x.s.nim); return; }
    const { error } = await supabase.from("tahapan_akhir").update({ status: next, diperbarui_oleh: profile.username || null }).eq("id", x.r.id);
    if (error) alert(error.message); else tahapT.reload();
  }
  async function ekspor() {
    const XLSX = await muatXLSX();
    const data = tampil.map((x) => ({
      Nama: x.s.nama, NIM: x.s.nim, Kelas: x.s.kelas || "", Tahap: x.cfg.nama, Status: x.r.status,
      "Tanggal Pengajuan": x.r.tanggal_pengajuan || "", "Tanggal Pelaksanaan": x.r.tanggal_pelaksanaan || "",
      Nilai: x.r.nilai_angka ?? "", Predikat: x.r.nilai_angka != null ? nilaiHuruf(x.r.nilai_angka) : "",
      Berkas: `${x.cfg.berkas.filter((b) => (x.r.berkas || {})[b]).length}/${x.cfg.berkas.length}`,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Tugas Akhir");
    XLSX.writeFile(wb, `monitoring-tugas-akhir-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  if (detail) {
    const s = santriT.rows.find((x) => x.nim === detail);
    return (
      <div>
        <PageHeader title={s ? s.nama : detail} sub={`Tugas Akhir & Ujian · ${detail}${s?.kelas ? " · " + s.kelas : ""}`} actions={<Btn tone="ghost" onClick={() => setDetail(null)}>← Kembali ke Monitoring</Btn>} />
        <TugasAkhirPanel nim={detail} profile={profile} rows={tahapT.rows} reload={tahapT.reload} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Monitoring Tugas Akhir & Ujian" sub={totalTindakan ? `${totalTindakan} pengajuan menunggu tindakan` : "Tidak ada pengajuan yang menunggu tindakan"} actions={mode === "pengajuan" ? <Btn tone="ghost" onClick={ekspor}>Unduh Excel</Btn> : null} />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 mb-5">
        {ringkas.map(({ cfg, tindakan, berjalan, lulus }) => (
          <button key={cfg.kode} type="button" onClick={() => { setTahap(tahap === cfg.kode ? "Semua" : cfg.kode); setStatus("Semua"); }}
            className={`text-left rounded-2xl p-3.5 bg-white border transition ${tahap === cfg.kode ? "border-[#0B3B36] ring-1 ring-[#0B3B36]" : "border-stone-200 hover:border-stone-300"}`}>
            <div className="text-[#0B3B36]"><IkonTahap kode={cfg.kode} /></div>
            <div className="text-xs font-bold text-[#0B3B36] mt-1 leading-tight">{cfg.nama}</div>
            <div className="mt-2 space-y-0.5 text-[0.6875rem]">
              <div className={tindakan ? "text-[#8A6A2A] font-bold" : "text-stone-400"}>● {tindakan} perlu tindakan</div>
              <div className="text-stone-500">● {berjalan} berjalan</div>
              <div className="text-[#0F4A44]">● {lulus} lulus</div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-1 mb-4 border-b border-stone-200">
        {[["pengajuan", "Yang Sudah Mengajukan"], ["siap", "Siap Diajukan (belum mengajukan)"]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => { setMode(k); if (k === "siap" && tahap === "Semua") setTahap("Syahadah Kubro"); }} className={`px-4 py-2 text-sm font-bold -mb-px border-b-2 ${mode === k ? "border-[#0B3B36] text-[#0B3B36]" : "border-transparent text-stone-400 hover:text-stone-600"}`}>{l}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <Select value={tahap} onChange={(e) => setTahap(e.target.value)}>
          {mode === "pengajuan" && <option value="Semua">Semua tahap</option>}
          {TAHAPAN_AKHIR.map((c) => <option key={c.kode} value={c.kode}>{c.nama}</option>)}
        </Select>
        {mode === "pengajuan" && (
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {["Semua", ...Object.keys(GRUP_STATUS_TAHAP)].map((g) => <option key={g} value={g}>{g === "Semua" ? "Semua status" : g}</option>)}
          </Select>
        )}
        <Select value={kelas} onChange={(e) => setKelas(e.target.value)}>
          <option value="Semua">Semua kelas</option>
          {daftarKelas.map((k) => <option key={k} value={k}>{k}</option>)}
        </Select>
        <Input placeholder="Cari nama / NIM" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card className="!p-0 overflow-hidden">
        {mode === "pengajuan" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wider text-stone-400 bg-stone-50"><th className="p-3.5">Mahasantri</th><th className="p-3.5">Tahap</th><th className="p-3.5">Status</th><th className="p-3.5">Diajukan</th><th className="p-3.5">Pelaksanaan</th><th className="p-3.5">Nilai</th><th className="p-3.5">Berkas</th><th className="p-3.5"></th></tr></thead>
              <tbody>
                {tampil.map((x) => {
                  const next = langkahBerikut(x.cfg, x.r.status);
                  const jml = x.cfg.berkas.filter((b) => (x.r.berkas || {})[b]).length;
                  return (
                    <tr key={x.r.id} className="border-t border-stone-100">
                      <td className="p-3.5"><div className="flex items-center gap-3"><Avatar name={x.s.nama} size={30} /><div><div className="font-semibold text-[#0B3B36]">{x.s.nama}</div><div className="text-xs text-stone-400">{x.s.nim}{x.s.kelas ? " · " + x.s.kelas : ""}</div></div></div></td>
                      <td className="p-3.5"><span className="inline-flex items-center gap-2"><span className="text-[#0B3B36]"><IkonTahap kode={x.cfg.kode} size={16} /></span>{x.cfg.nama}</span></td>
                      <td className="p-3.5"><Badge tone={STATUS_TAHAP_TONE[x.r.status] || "grey"}>{x.r.status}</Badge></td>
                      <td className="p-3.5 text-stone-600">{tglPendek(x.r.tanggal_pengajuan) || "—"}</td>
                      <td className="p-3.5 text-stone-600">{tglPendek(x.r.tanggal_pelaksanaan) || "—"}</td>
                      <td className="p-3.5">{x.r.nilai_angka != null ? <b>{x.r.nilai_angka} <span className="text-xs text-stone-400">({nilaiHuruf(x.r.nilai_angka)})</span></b> : "—"}</td>
                      <td className="p-3.5 text-stone-600">{jml}/{x.cfg.berkas.length}</td>
                      <td className="p-3.5"><div className="flex gap-1.5 justify-end">
                        {staff && next && !STATUS_TAHAP_AKHIR.includes(x.r.status) && <Btn tone="gold" onClick={() => lanjut(x)}>{next === "Lulus" ? "Beri Nilai" : `Lanjut: ${next}`}</Btn>}
                        <Btn tone="ghost" onClick={() => setDetail(x.s.nim)}>Buka</Btn>
                      </div></td>
                    </tr>
                  );
                })}
                {tampil.length === 0 && <tr><td colSpan={8}><Empty text="Tidak ada data untuk filter ini." /></td></tr>}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="px-4 py-3 text-xs text-stone-500 bg-stone-50 border-b border-stone-100">Mahasantri aktif yang sudah memenuhi prasyarat <b>{cfgSiap?.nama}</b> {cfgSiap && cfgSiap.prasyarat.length ? `(${cfgSiap.prasyarat.join(", ")} lulus)` : ""}{cfgSiap && cfgSiap.syaratQuran ? " (Ziyadah 30 juz dan Tasmi')" : ""} tetapi belum mengajukan. Total: <b>{siap.length}</b>.</div>
            <table className="w-full text-sm">
              <tbody>
                {siap.map((s) => (
                  <tr key={s.nim} className="border-t border-stone-100">
                    <td className="p-3.5"><div className="flex items-center gap-3"><Avatar name={s.nama} size={30} /><div><div className="font-semibold text-[#0B3B36]">{s.nama}</div><div className="text-xs text-stone-400">{s.nim}{s.kelas ? " · " + s.kelas : ""}</div></div></div></td>
                    <td className="p-3.5 text-right"><Btn tone="ghost" onClick={() => setDetail(s.nim)}>Buka</Btn></td>
                  </tr>
                ))}
                {siap.length === 0 && <tr><td><Empty text="Belum ada mahasantri yang siap untuk tahap ini." /></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Daftar mahasantri per angkatan: pilih angkatan dulu, baru nama & NIM muncul   */
/* ---------------------------------------------------------------------- */
function PerAngkatan({ santri, cari, kunci, children }) {
  // Tanpa prop "cari": kotak pencarian nama/NIM disediakan di sini. Dengan prop "cari": halaman punya pencarian sendiri.
  const pakaiLokal = cari === undefined;
  const [qLokal, setQLokal] = useState("");
  const [angkatan, setAngkatan] = useState(() => { try { return sessionStorage.getItem("angkatan:" + kunci) || ""; } catch (e) { return ""; } });
  const pilih = (a) => { setAngkatan(a); try { sessionStorage.setItem("angkatan:" + kunci, a); } catch (e) { /* abaikan */ } };
  const kata = String(pakaiLokal ? qLokal : cari || "").trim().toLowerCase();
  const grup = {};
  santri.forEach((x) => { const k = String(x.kelas || "").trim() || "Tanpa angkatan"; grup[k] = (grup[k] || 0) + 1; });
  const urut = Object.keys(grup).sort((a, b) => a.localeCompare(b, "id", { numeric: true }));
  const valid = angkatan === "*" || (angkatan && grup[angkatan]);
  const namaAngkatan = (k) => (/^\d+$/.test(k) ? "Angkatan " + k : k);
  const cocokNama = (x) => !pakaiLokal || !kata || String(x.nama || "").toLowerCase().includes(kata) || String(x.nim || "").toLowerCase().includes(kata);
  const cocok = (x) => cocokNama(x) && (!valid || angkatan === "*" || (String(x.kelas || "").trim() || "Tanpa angkatan") === angkatan);
  const kotakCari = pakaiLokal && (
    <div className="mb-4 max-w-sm"><Input placeholder="Cari nama atau NIM…" value={qLokal} onChange={(e) => setQLokal(e.target.value)} /></div>
  );
  if (!valid && !kata) {
    return (
      <div>
        {kotakCari}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="text-xs text-stone-500">Pilih angkatan untuk menampilkan nama dan NIM mahasantri, atau ketik nama di kotak pencarian.</div>
          <button type="button" onClick={() => pilih("*")} className="text-xs font-bold text-[#145048] underline">Tampilkan semua ({santri.length})</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {urut.map((k) => (
            <button key={k} type="button" onClick={() => pilih(k)} className="text-left bg-white rounded-2xl border border-stone-200 hover:border-[#0B3B36] hover:shadow-sm transition p-4">
              <div className="text-[0.6875rem] uppercase tracking-wider text-stone-400 font-bold">Angkatan</div>
              <div className="font-serif-dh text-xl font-semibold text-[#0B3B36] mt-0.5">{namaAngkatan(k).replace(/^Angkatan /, "")}</div>
              <div className="text-xs text-stone-500 mt-2">{grup[k]} mahasantri</div>
            </button>
          ))}
          {urut.length === 0 && <div className="col-span-full"><Empty text="Belum ada data mahasantri." /></div>}
        </div>
      </div>
    );
  }
  return (
    <div>
      {kotakCari}
      {valid && (
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <button type="button" onClick={() => pilih("")} className="text-sm font-bold text-[#145048]">← Semua angkatan</button>
          <span className="text-sm text-stone-500">{angkatan === "*" ? "Semua mahasantri" : namaAngkatan(angkatan)}{angkatan !== "*" && <> · {grup[angkatan]} mahasantri</>}</span>
        </div>
      )}
      {pakaiLokal && kata && <div className="text-xs text-stone-500 mb-2">{santri.filter(cocok).length} hasil untuk “{qLokal.trim()}”{valid ? "" : " di semua angkatan"}</div>}
      {children(cocok)}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Daftar Mata Kuliah (master) per semester — dipakai sebagai pilihan di KRS    */
/* ---------------------------------------------------------------------- */
function semesterJenis(ke) { return Number(ke) % 2 === 1 ? "Ganjil" : "Genap"; }
function tahunAjaranSekarang() { const d = new Date(); const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1; return `${y}/${y + 1}`; }

function MatkulForm({ initial, semester, onCancel, onSubmit }) {
  const [f, setF] = useState(initial || { semester_ke: semester, kode_mk: "", nama: "", sks: 2, pengajar: "", urutan: 0 });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={initial ? "Edit Mata Kuliah" : `Tambah Mata Kuliah — Semester ${f.semester_ke}`} onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kode MK"><Input value={f.kode_mk || ""} onChange={set("kode_mk")} placeholder="cth. MKQ 1.1.1" /></Field>
          <Field label="Semester ke-"><Input type="number" min={1} max={12} value={f.semester_ke} onChange={set("semester_ke")} required /></Field>
        </div>
        <Field label="Nama Mata Kuliah"><Input value={f.nama} onChange={set("nama")} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="SKS"><Input type="number" min={0} step="0.5" value={f.sks} onChange={set("sks")} required /></Field>
          <Field label="Urutan tampil"><Input type="number" value={f.urutan ?? 0} onChange={set("urutan")} /></Field>
        </div>
        <Field label="Pengampu bawaan (opsional, boleh lebih dari satu)"><PengampuInput value={f.pengajar || ""} onChange={(v) => setF({ ...f, pengajar: v })} /></Field>
        <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit">Simpan</Btn></div>
      </form>
    </Modal>
  );
}

function MatkulImpor({ semester, onCancel, onDone }) {
  const [teks, setTeks] = useState("");
  const [busy, setBusy] = useState(false);
  const baris = teks.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const p = l.split(/\t|;|\|/).map((x) => x.trim());
    return { kode_mk: p[0] || "", nama: p[1] || "", sks: Number((p[2] || "2").replace(",", ".")) || 2, pengajar: p[3] || "" };
  }).filter((x) => x.nama);
  async function simpan() {
    setBusy(true);
    const { error } = await supabase.from("mata_kuliah_master").insert(baris.map((b, i) => ({ ...b, semester_ke: semester, urutan: i + 1 })));
    setBusy(false);
    if (error) alert(error.message); else onDone();
  }
  return (
    <Modal title={`Impor Cepat — Semester ${semester}`} onClose={onCancel}>
      <p className="text-xs text-stone-500 mb-2">Tempel daftar, satu mata kuliah per baris, dengan urutan <b>Kode ; Nama ; SKS ; Pengampu</b> (pengampu boleh dikosongkan; untuk lebih dari satu pengampu pisahkan dengan garis miring, mis. <i>Ust. Ahmad / Ustzh. Aisyah</i>). Boleh disalin langsung dari Excel (kolom dipisah tab).</p>
      <textarea className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm font-mono" rows={8} value={teks} onChange={(e) => setTeks(e.target.value)} placeholder={"MKQ 1.1.1 ; Tahsin & Tajwid ; 2\nMKQ 1.1.2 ; Bahasa Arab ; 3 ; Ustadz Ahmad"} />
      <div className="text-xs text-stone-500 mt-2">{baris.length} mata kuliah terbaca{baris.length > 0 && <> · total {baris.reduce((a, b) => a + b.sks, 0)} SKS</>}</div>
      <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn onClick={simpan} disabled={busy || baris.length === 0}>Tambahkan {baris.length} mata kuliah</Btn></div>
    </Modal>
  );
}

function DaftarMatkulPage({ profile, brand = {}, onBrandUpdated }) {
  const [catatan, setCatatan] = useState(brand.catatan_krs ?? CATATAN_KRS_BAWAAN);
  const [pesanCatatan, setPesanCatatan] = useState("");
  async function simpanCatatan() {
    const { error } = await supabase.from("pengaturan_pondok").update({ catatan_krs: catatan.trim() || null }).eq("id", 1);
    if (error) setPesanCatatan("Gagal: " + error.message + " (jalankan file 23-catatan-krs.sql di Supabase)"); else { setPesanCatatan("Catatan KRS tersimpan."); if (onBrandUpdated) onBrandUpdated(); }
  }
  const editable = canEdit(profile.role, "matkul");
  const masterT = useTable("mata_kuliah_master");
  const [semester, setSemester] = useState(1);
  const [form, setForm] = useState(null);
  const [impor, setImpor] = useState(false);
  const semuaSem = [...new Set([1, 2, 3, 4, 5, 6, ...masterT.rows.map((m) => Number(m.semester_ke))])].sort((a, b) => a - b);
  const daftar = masterT.rows.filter((m) => Number(m.semester_ke) === Number(semester)).sort((a, b) => (a.urutan || 0) - (b.urutan || 0) || String(a.kode_mk || "").localeCompare(String(b.kode_mk || ""), "id", { numeric: true }));
  const totalSks = daftar.reduce((a, m) => a + Number(m.sks || 0), 0);
  async function simpan(f) {
    const payload = { semester_ke: Number(f.semester_ke), kode_mk: f.kode_mk || null, nama: f.nama, sks: Number(f.sks), pengajar: normalisasiPengampu(f.pengajar) || null, urutan: Number(f.urutan) || 0 };
    const { error } = f.id ? await supabase.from("mata_kuliah_master").update(payload).eq("id", f.id) : await supabase.from("mata_kuliah_master").insert(payload);
    if (error) alert(error.message); else { setForm(null); masterT.reload(); }
  }
  async function hapus(id) {
    if (!confirm("Hapus mata kuliah ini dari daftar? KRS mahasantri yang sudah terisi tidak terpengaruh.")) return;
    const { error } = await supabase.from("mata_kuliah_master").delete().eq("id", id);
    if (error) alert(error.message); else masterT.reload();
  }
  return (
    <div>
      <PageHeader title="Daftar Mata Kuliah" sub="Isi sekali per semester. Di KRS, mata kuliah tinggal dipilih dari daftar ini, jadi tidak ada yang terlewat." actions={editable && <div className="flex gap-2"><Btn tone="ghost" onClick={() => setImpor(true)}>Impor Cepat</Btn><Btn onClick={() => setForm({ initial: null })}>+ Tambah</Btn></div>} />
      <Card className="mb-4">
        <div className="text-xs font-bold text-[#0B3B36] uppercase tracking-wide mb-1">Tanda Bintang (*) di KRS dan KHS</div>
        <p className="text-xs text-stone-500 mb-2">Tambahkan tanda <b>*</b> di akhir nama mata kuliah (contoh: <i>Bahasa Arab*</i>). Di KRS dan KHS cetak, catatan kecil di bawah ini otomatis muncul di bawah tabel.</p>
        {profile.role === "admin" ? (
          <>
            <textarea className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm" rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} />
            <div className="flex items-center gap-3 mt-2"><Btn onClick={simpanCatatan}>Simpan Catatan</Btn>{pesanCatatan && <span className="text-xs text-stone-500">{pesanCatatan}</span>}</div>
          </>
        ) : (
          <div className="text-sm italic text-stone-600">{brand.catatan_krs || CATATAN_KRS_BAWAAN}</div>
        )}
      </Card>
      <div className="flex gap-2 flex-wrap mb-4">
        {semuaSem.map((n) => {
          const jml = masterT.rows.filter((m) => Number(m.semester_ke) === n).length;
          return <button key={n} type="button" onClick={() => setSemester(n)} className={`px-4 py-2 rounded-xl text-sm font-bold border ${semester === n ? "bg-[#0B3B36] text-white border-[#0B3B36]" : "bg-white text-[#0B3B36] border-stone-200 hover:border-[#0B3B36]"}`}>Semester {n}<span className={`ml-2 text-xs ${semester === n ? "text-white/70" : "text-stone-400"}`}>{jml}</span></button>;
        })}
      </div>
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 text-xs text-stone-500 bg-stone-50 border-b border-stone-100">Semester {semester} ({semesterJenis(semester)}) · {daftar.length} mata kuliah · <b>{totalSks} SKS</b></div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[0.6875rem] uppercase tracking-wide text-stone-400"><th className="p-3.5">Kode MK</th><th className="p-3.5">Mata Kuliah</th><th className="p-3.5">SKS</th><th className="p-3.5">Pengampu</th><th className="p-3.5"></th></tr></thead>
          <tbody>
            {daftar.map((m) => (
              <tr key={m.id} className="border-t border-stone-100">
                <td className="p-3.5 text-stone-500 whitespace-nowrap">{m.kode_mk || "—"}</td>
                <td className="p-3.5 font-semibold text-[#0B3B36]">{m.nama}</td>
                <td className="p-3.5">{m.sks}</td>
                <td className="p-3.5 text-stone-600">{m.pengajar || "—"}</td>
                <td className="p-3.5 text-right whitespace-nowrap">{editable && <><button type="button" onClick={() => setForm({ initial: m })} className="text-[#145048] text-xs font-bold mr-3">Edit</button><button type="button" onClick={() => hapus(m.id)} className="text-red-600 text-xs font-bold">Hapus</button></>}</td>
              </tr>
            ))}
            {daftar.length === 0 && <tr><td colSpan={5}><Empty text={`Belum ada mata kuliah untuk semester ${semester}. ${editable ? "Gunakan Impor Cepat atau + Tambah." : ""}`} /></td></tr>}
          </tbody>
        </table>
      </Card>
      {form && <MatkulForm initial={form.initial} semester={semester} onCancel={() => setForm(null)} onSubmit={simpan} />}
      {impor && <MatkulImpor semester={semester} onCancel={() => setImpor(false)} onDone={() => { setImpor(false); masterT.reload(); }} />}
    </div>
  );
}

/* Ambil mata kuliah KRS dari daftar master (satu mahasantri atau seluruh angkatan) */
function AmbilMatkulModal({ santri, semuaSantri, akRows, onCancel, onDone }) {
  const masterT = useTable("mata_kuliah_master");
  const semuaSem = [...new Set(masterT.rows.map((m) => Number(m.semester_ke)))].sort((a, b) => a - b);
  const [semester, setSemester] = useState(0);
  const [ta, setTa] = useState(tahunAjaranSekarang());
  const [target, setTarget] = useState("satu");
  const [dipilih, setDipilih] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pilihNama, setPilihNama] = useState({});
  const [tambahan, setTambahan] = useState({});
  const namaMaster = (m) => String(m.pengajar || "").split("/").map((x) => x.trim()).filter(Boolean);
  const terpilih = (m) => pilihNama[m.id] ?? (namaMaster(m).length === 1 ? namaMaster(m) : []);
  const pengajarAkhir = (m) => [...terpilih(m), ...String(tambahan[m.id] || "").split("/").map((x) => x.trim()).filter(Boolean)].join(" / ");
  const gantiNama = (m, n) => { const sekarang = terpilih(m); setPilihNama({ ...pilihNama, [m.id]: sekarang.includes(n) ? sekarang.filter((x) => x !== n) : [...sekarang, n] }); };
  const sem = semester || semuaSem[0] || 1;
  const jenis = semesterJenis(sem);
  const daftar = masterT.rows.filter((m) => Number(m.semester_ke) === Number(sem)).sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
  const aktifIds = dipilih || daftar.map((m) => m.id);
  const rekanAngkatan = semuaSantri.filter((x) => String(x.kelas || "") === String(santri.kelas || "") && (x.status === "Aktif" || !x.status));
  const sasaran = target === "angkatan" ? rekanAngkatan : [santri];
  const ada = (nim, m) => akRows.some((r) => r.nim === nim && r.tahun_ajaran === ta && r.semester === jenis && ((m.kode_mk && r.kode_mk === m.kode_mk) || r.mata_kuliah === m.nama));
  const baru = [];
  sasaran.forEach((x) => daftar.filter((m) => aktifIds.includes(m.id)).forEach((m) => { if (!ada(x.nim, m)) baru.push({ nim: x.nim, tahun_ajaran: ta, semester: jenis, kode_mk: m.kode_mk || "", mata_kuliah: m.nama, sks: Number(m.sks), pengajar: pengajarAkhir(m), status: "aktif", semester_ke: Number(sem) }); }));
  async function simpan() {
    setBusy(true);
    let { error } = await supabase.from("akademik").insert(baru);
    if (error && /semester_ke/.test(error.message)) ({ error } = await supabase.from("akademik").insert(baru.map(({ semester_ke, ...sisa }) => sisa)));
    setBusy(false);
    if (error) alert(error.message); else onDone(baru.length);
  }
  return (
    <Modal title="Ambil dari Daftar Mata Kuliah" onClose={onCancel}>
      {semuaSem.length === 0 ? (
        <p className="text-sm text-stone-500">Daftar mata kuliah masih kosong. Isi dulu lewat menu <b>Akademik → Daftar Mata Kuliah</b>.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Semester ke-"><Select value={sem} onChange={(e) => { setSemester(Number(e.target.value)); setDipilih(null); }}>{semuaSem.map((n) => <option key={n} value={n}>Semester {n} ({semesterJenis(n)})</option>)}</Select></Field>
            <Field label="Tahun Ajaran"><Input value={ta} onChange={(e) => setTa(e.target.value)} /></Field>
          </div>
          <Field label="Berlaku untuk">
            <Select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="satu">Hanya {santri.nama}</option>
              <option value="angkatan">Semua mahasantri aktif angkatan {santri.kelas || "ini"} ({rekanAngkatan.length} orang)</option>
            </Select>
          </Field>
          <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 max-h-64 overflow-y-auto">
            {daftar.map((m) => (
              <div key={m.id} className="px-3 py-2">
                <label className="flex items-center gap-3 text-sm cursor-pointer">
                  <input type="checkbox" checked={aktifIds.includes(m.id)} onChange={(e) => setDipilih(e.target.checked ? [...aktifIds, m.id] : aktifIds.filter((x) => x !== m.id))} />
                  <span className="flex-1">{m.nama}<span className="text-xs text-stone-400 ml-2">{m.kode_mk || ""}</span></span>
                  <span className="text-xs text-stone-500">{m.sks} SKS</span>
                </label>
                {aktifIds.includes(m.id) && (
                  <div className="ml-7 mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[0.6875rem] text-stone-400">Pengampu:</span>
                    {namaMaster(m).length > 1 && terpilih(m).length === 0 && <span className="text-[0.6875rem] text-[#8A6A2A]">pilih salah satu atau lebih →</span>}
                    {namaMaster(m).map((n) => (
                      <button key={n} type="button" onClick={() => gantiNama(m, n)} className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${terpilih(m).includes(n) ? "bg-[#0B3B36] text-white border-[#0B3B36]" : "bg-white text-stone-400 border-stone-200"}`}>{n}</button>
                    ))}
                    <input value={tambahan[m.id] || ""} onChange={(e) => setTambahan({ ...tambahan, [m.id]: e.target.value.replace(/\//g, " ") })} placeholder={namaMaster(m).length ? "+ pengampu lain" : "Nama pengampu"} className="px-2 py-0.5 border border-stone-200 rounded-full text-xs w-36" />
                  </div>
                )}
              </div>
            ))}
            {daftar.length === 0 && <div className="p-4 text-sm text-stone-400">Belum ada mata kuliah di semester ini.</div>}
          </div>
          <div className="text-xs text-stone-500 mt-2">Akan ditambahkan: <b>{baru.length}</b> baris KRS. Mata kuliah yang sudah ada di KRS tahun ajaran dan semester yang sama dilewati otomatis. Pilih pengampu tiap mata kuliah dengan mengklik namanya (boleh lebih dari satu). Hanya nama yang dipilih yang tercetak di KRS dan hanya berlaku untuk semester ini; Daftar Mata Kuliah tidak berubah.</div>
          <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn onClick={simpan} disabled={busy || baru.length === 0}>Tambahkan ke KRS</Btn></div>
        </>
      )}
    </Modal>
  );
}

/* ---------------------------------------------------------------------- */
/* Presensi shalat berjamaah lima waktu — input cepat untuk banyak mahasantri   */
/* ---------------------------------------------------------------------- */
const WAKTU_SHOLAT = ["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"];
const STATUS_PRESENSI = [
  { k: "Berjamaah", label: "Berjamaah", on: "bg-[#2A9D8F] text-white border-[#2A9D8F]" },
  { k: "Sendiri", label: "Sendiri", on: "bg-[#E9C46A] text-[#5A4410] border-[#E9C46A]" },
  { k: "Udzur", label: "Udzur", on: "bg-[#8FB5D6] text-[#1F3F57] border-[#8FB5D6]" },
  { k: "Tidak Sholat", label: "Tidak", on: "bg-[#E76F51] text-white border-[#E76F51]" },
];
const SIMBOL_PRESENSI = { Berjamaah: ["✓", "text-[#2A9D8F]"], Sendiri: ["S", "text-[#B8860B]"], Udzur: ["U", "text-[#3F7CA8]"], "Tidak Sholat": ["✗", "text-[#E76F51]"] };
function tanggalLokal() { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
function waktuSekarang() { const h = new Date().getHours(); return h < 10 ? "Subuh" : h < 15 ? "Dzuhur" : h < 17 ? "Ashar" : h < 19 ? "Maghrib" : "Isya"; }

function PresensiSholatPanel({ santri, logRows, reload, profile }) {
  const [tanggal, setTanggal] = useState(tanggalLokal());
  const [waktu, setWaktu] = useState(waktuSekarang());
  const [mode, setMode] = useState("input");
  const [kelas, setKelas] = useState("Semua");
  const [q, setQ] = useState("");
  const [pilih, setPilih] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { setPilih({}); }, [tanggal, waktu]);
  const aktif = santri.filter((s) => s.status === "Aktif" || !s.status);
  const daftarKelas = [...new Set(aktif.map((s) => String(s.kelas || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "id", { numeric: true }));
  const kata = q.trim().toLowerCase();
  const tampil = aktif
    .filter((s) => (kelas === "Semua" || String(s.kelas || "").trim() === kelas) && (!kata || String(s.nama || "").toLowerCase().includes(kata) || String(s.nim || "").toLowerCase().includes(kata)))
    .sort((a, b) => String(a.nama || "").localeCompare(String(b.nama || ""), "id"));
  const hariIni = logRows.filter((l) => l.jenis === "Sholat Berjamaah" && l.waktu && l.tanggal === tanggal);
  const tersimpan = (nim, w) => { const r = hariIni.find((l) => l.nim === nim && l.waktu === w); return r ? r.capaian : null; };
  const statusDari = (nim) => pilih[nim] || tersimpan(nim, waktu) || "Berjamaah";
  const ringkas = {}; tampil.forEach((s) => { const st = statusDari(s.nim); ringkas[st] = (ringkas[st] || 0) + 1; });
  const sudahSimpan = tampil.filter((s) => tersimpan(s.nim, waktu)).length;

  async function simpan() {
    if (tampil.length === 0) return;
    setBusy(true);
    const nims = tampil.map((s) => s.nim);
    const { error: e1 } = await supabase.from("ibadah_log").delete().eq("jenis", "Sholat Berjamaah").eq("tanggal", tanggal).eq("waktu", waktu).in("nim", nims);
    if (e1) { setBusy(false); alert(e1.message); return; }
    const baris = tampil.map((s) => ({ nim: s.nim, tanggal, jenis: "Sholat Berjamaah", waktu, capaian: statusDari(s.nim), musyrif: profile.nama }));
    for (let i = 0; i < baris.length; i += 200) {
      const { error } = await supabase.from("ibadah_log").insert(baris.slice(i, i + 200));
      if (error) { setBusy(false); alert(error.message); return; }
    }
    setBusy(false); setPilih({}); reload();
    alert(`Presensi ${waktu} tanggal ${tanggal} tersimpan untuk ${baris.length} mahasantri.`);
  }

  return (
    <div>
      <Card className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Tanggal"><Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} /></Field>
          <Field label="Angkatan"><Select value={kelas} onChange={(e) => setKelas(e.target.value)}><option value="Semua">Semua angkatan</option>{daftarKelas.map((k) => <option key={k} value={k}>{/^\d+$/.test(k) ? "Angkatan " + k : k}</option>)}</Select></Field>
          <Field label="Cari nama / NIM"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari…" /></Field>
        </div>
        <div className="flex gap-2 flex-wrap mt-1">
          {WAKTU_SHOLAT.map((w) => {
            const n = aktif.filter((s) => tersimpan(s.nim, w)).length;
            return (
              <button key={w} type="button" onClick={() => setWaktu(w)} className={`px-4 py-2 rounded-xl text-sm font-bold border ${waktu === w ? "bg-[#0B3B36] text-white border-[#0B3B36]" : "bg-white text-[#0B3B36] border-stone-200 hover:border-[#0B3B36]"}`}>
                {w}<span className={`ml-2 text-xs font-semibold ${waktu === w ? "text-white/75" : n ? "text-[#2A9D8F]" : "text-stone-300"}`}>{n ? `✓ ${n}/${aktif.length}` : "belum"}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="flex gap-1 mb-4 border-b border-stone-200">
        {[["input", `Catat ${waktu}`], ["rekap", "Rekap Hari Ini (5 waktu)"]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setMode(k)} className={`px-4 py-2 text-sm font-bold -mb-px border-b-2 ${mode === k ? "border-[#0B3B36] text-[#0B3B36]" : "border-transparent text-stone-400 hover:text-stone-600"}`}>{l}</button>
        ))}
      </div>

      {mode === "input" ? (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div className="text-xs text-stone-500">
              {tampil.length} mahasantri · <b className="text-[#2A9D8F]">{ringkas.Berjamaah || 0} berjamaah</b> · {ringkas.Sendiri || 0} sendiri · {ringkas.Udzur || 0} udzur · <b className="text-[#E76F51]">{ringkas["Tidak Sholat"] || 0} tidak</b>
              {sudahSimpan > 0 && <span className="ml-2 text-[#8A6A2A]">(sudah pernah disimpan untuk {sudahSimpan}, simpan lagi akan memperbarui)</span>}
            </div>
            <div className="flex gap-2">
              <Btn tone="ghost" onClick={() => setPilih({})}>Setel ulang</Btn>
              <Btn onClick={simpan} disabled={busy || tampil.length === 0}>{busy ? "Menyimpan…" : `Simpan ${waktu}`}</Btn>
            </div>
          </div>
          <p className="text-xs text-stone-400 mb-3">Semua mahasantri otomatis ditandai <b>Berjamaah</b>. Cukup ubah yang berbeda, lalu klik Simpan.</p>
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-stone-100">
              {tampil.map((s) => {
                const st = statusDari(s.nim);
                return (
                  <div key={s.nim} className="flex items-center justify-between gap-3 px-4 py-2.5 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0"><Avatar name={s.nama} size={30} /><div className="min-w-0"><div className="font-semibold text-[#0B3B36] truncate">{s.nama}</div><div className="text-[0.6875rem] text-stone-400">{s.nim}{s.kelas ? " · " + s.kelas : ""}</div></div></div>
                    <div className="flex gap-1.5">
                      {STATUS_PRESENSI.map((o) => (
                        <button key={o.k} type="button" onClick={() => setPilih({ ...pilih, [s.nim]: o.k })} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${st === o.k ? o.on : "bg-white text-stone-400 border-stone-200 hover:border-stone-300"}`}>{o.label}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {tampil.length === 0 && <Empty text="Tidak ada mahasantri yang cocok." />}
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[0.6875rem] uppercase tracking-wide text-stone-400 bg-stone-50"><th className="p-3.5">Mahasantri</th>{WAKTU_SHOLAT.map((w) => <th key={w} className="p-3.5 text-center">{w}</th>)}<th className="p-3.5 text-center">Berjamaah</th></tr></thead>
              <tbody>
                {tampil.map((s) => {
                  const nilai = WAKTU_SHOLAT.map((w) => tersimpan(s.nim, w));
                  const jml = nilai.filter((x) => x === "Berjamaah").length;
                  return (
                    <tr key={s.nim} className="border-t border-stone-100">
                      <td className="p-3.5"><div className="font-semibold text-[#0B3B36]">{s.nama}</div><div className="text-[0.6875rem] text-stone-400">{s.nim}</div></td>
                      {nilai.map((x, i) => <td key={i} className={`p-3.5 text-center font-bold ${x ? SIMBOL_PRESENSI[x]?.[1] || "text-stone-500" : "text-stone-300"}`}>{x ? SIMBOL_PRESENSI[x]?.[0] || "•" : "·"}</td>)}
                      <td className="p-3.5 text-center font-bold text-[#0B3B36]">{jml}/5</td>
                    </tr>
                  );
                })}
                {tampil.length === 0 && <tr><td colSpan={7}><Empty text="Tidak ada mahasantri yang cocok." /></td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 text-[0.6875rem] text-stone-400 border-t border-stone-100">✓ berjamaah · S sendiri · U udzur · ✗ tidak shalat · · belum dicatat</div>
        </Card>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Catat ibadah harian satu mahasantri: semua ibadah sekaligus dalam satu form  */
/* ---------------------------------------------------------------------- */
const JENIS_HARIAN_LAIN = ["Sholat Rawatib", "Sholat Dhuha", "Tahajud + Witir", "Al-Ma'tsurat", "Membaca Al-Kahfi", "Puasa Sunnah"];
const JENIS_LAMA = { "Tahajud + Witir": "Sholat Tahajud" };
const BARIS_HARIAN = [
  ...WAKTU_SHOLAT.map((w) => ({ key: "Sholat Berjamaah|" + w, jenis: "Sholat Berjamaah", waktu: w, label: "Shalat " + w, grup: "Shalat Lima Waktu" })),
  ...JENIS_HARIAN_LAIN.map((j) => ({ key: j, jenis: j, waktu: null, label: j, grup: "Ibadah Sunnah & Amalan" })),
];
const WARNA_PILIHAN = { green: "bg-[#2A9D8F] text-white border-[#2A9D8F]", gold: "bg-[#E9C46A] text-[#5A4410] border-[#E9C46A]", red: "bg-[#E76F51] text-white border-[#E76F51]" };

function IbadahHarianModal({ santri, logRows, profile, kustom = [], onCancel, onDone }) {
  const BARIS = [...BARIS_HARIAN, ...kustom.filter((k) => k.aktif).sort((a, b) => (a.urutan || 0) - (b.urutan || 0)).map((k) => ({ key: "kustom|" + k.nama, jenis: k.nama, waktu: null, label: k.nama, grup: "Ibadah Sunnah & Amalan", opsiKustom: k.opsi }))];
  const [tanggal, setTanggal] = useState(tanggalLokal());
  const [st, setSt] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const ada = {};
    logRows.filter((l) => l.nim === santri.nim && l.tanggal === tanggal).forEach((l) => {
      const b = BARIS.find((x) => (x.jenis === l.jenis || JENIS_LAMA[x.jenis] === l.jenis) && (x.waktu ? x.waktu === l.waktu : !l.waktu));
      if (b) ada[b.key] = l.capaian;
    });
    setSt(ada);
  }, [tanggal, santri.nim, logRows.length]);
  const opsi = (b) => b.opsiKustom || CAPAIAN_OPTIONS[b.jenis] || [];
  const terisi = BARIS.filter((b) => st[b.key]);
  async function simpan() {
    if (terisi.length === 0) return;
    setBusy(true);
    const shalat = terisi.filter((b) => b.waktu);
    if (shalat.length) {
      const { error } = await supabase.from("ibadah_log").delete().eq("nim", santri.nim).eq("tanggal", tanggal).eq("jenis", "Sholat Berjamaah").in("waktu", shalat.map((b) => b.waktu));
      if (error) { setBusy(false); alert(error.message + "\n\nJika pesan menyebut kolom waktu, jalankan file 20-presensi-shalat.sql di Supabase."); return; }
    }
    for (const b of terisi.filter((x) => !x.waktu)) {
      const { error } = await supabase.from("ibadah_log").delete().eq("nim", santri.nim).eq("tanggal", tanggal).in("jenis", [b.jenis, JENIS_LAMA[b.jenis]].filter(Boolean));
      if (error) { setBusy(false); alert(error.message); return; }
    }
    const baris = terisi.map((b) => ({ nim: santri.nim, tanggal, jenis: b.jenis, capaian: st[b.key], musyrif: profile.nama, ...(b.waktu ? { waktu: b.waktu } : {}) }));
    const { error } = await supabase.from("ibadah_log").insert(baris);
    setBusy(false);
    if (error) { alert(error.message + "\n\nJika pesan menyebut kolom waktu, jalankan file 20-presensi-shalat.sql di Supabase."); return; }
    onDone(baris.length);
  }
  const semuaBaik = () => { const n = {}; BARIS.forEach((b) => { n[b.key] = opsi(b)[0]; }); setSt(n); };
  return (
    <Modal title={`Catat Ibadah Harian — ${santri.nama}`} onClose={onCancel}>
      <div className="flex items-end gap-3 flex-wrap mb-3">
        <div className="flex-1 min-w-[10rem]"><Field label="Tanggal"><Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} /></Field></div>
        <div className="flex gap-2 mb-3"><Btn tone="ghost" onClick={semuaBaik}>Semua dikerjakan</Btn><Btn tone="ghost" onClick={() => setSt({})}>Kosongkan</Btn></div>
      </div>
      <p className="text-xs text-stone-400 mb-2">Pilih satu capaian per ibadah. Yang dibiarkan kosong tidak dicatat. Jika tanggal ini sudah pernah dicatat, pilihan lama tampil dan akan diperbarui.</p>
      <div className="max-h-[55vh] overflow-y-auto pr-1">
        {["Shalat Lima Waktu", "Ibadah Sunnah & Amalan"].map((grup) => (
          <div key={grup} className="mb-3">
            <div className="text-[0.6875rem] uppercase tracking-wider text-stone-400 font-bold mb-1.5">{grup}</div>
            <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl">
              {BARIS.filter((b) => b.grup === grup).map((b) => (
                <div key={b.key} className="flex items-center justify-between gap-2 px-3 py-2 flex-wrap">
                  <div className="text-sm font-semibold text-[#0B3B36] min-w-[7rem]">{b.label}</div>
                  <div className="flex gap-1 flex-wrap">
                    {opsi(b).map((o) => (
                      <button key={o} type="button" onClick={() => setSt({ ...st, [b.key]: st[b.key] === o ? "" : o })} className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${st[b.key] === o ? WARNA_PILIHAN[capaianTone(o)] || WARNA_PILIHAN.green : "bg-white text-stone-400 border-stone-200 hover:border-stone-300"}`}>{o}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 mt-3">
        <div className="text-xs text-stone-500">{terisi.length} dari {BARIS.length} ibadah diisi</div>
        <div className="flex gap-2"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn onClick={simpan} disabled={busy || terisi.length === 0}>{busy ? "Menyimpan…" : "Simpan Semua"}</Btn></div>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------------- */
/* Daftar amalan sunnah tambahan — dikelola administrator tanpa deploy         */
/* ---------------------------------------------------------------------- */
const TEMPLATE_AMALAN = {
  ya: ["Dikerjakan", "Tidak Dikerjakan"],
  lengkap: ["Lengkap", "Sebagian", "Tidak Dikerjakan"],
};
function AmalanKustomManager() {
  const amalanT = useTable("jenis_ibadah_kustom");
  const [nama, setNama] = useState("");
  const [tpl, setTpl] = useState("ya");
  const [busy, setBusy] = useState(false);
  async function tambah(e) {
    e.preventDefault();
    const n = nama.trim();
    if (!n) return;
    if ([...JENIS_IBADAH, ...amalanT.rows.map((r) => r.nama)].some((x) => x.toLowerCase() === n.toLowerCase())) { alert("Nama amalan itu sudah ada."); return; }
    setBusy(true);
    const { error } = await supabase.from("jenis_ibadah_kustom").insert({ nama: n, opsi: TEMPLATE_AMALAN[tpl], urutan: amalanT.rows.length + 1, aktif: true });
    setBusy(false);
    if (error) alert(error.message + "\n\nJika tabel belum ada, jalankan file 21-amalan-tambahan.sql di Supabase."); else { setNama(""); amalanT.reload(); }
  }
  async function ubah(id, data) {
    const { error } = await supabase.from("jenis_ibadah_kustom").update(data).eq("id", id);
    if (error) alert(error.message); else amalanT.reload();
  }
  async function hapus(r) {
    if (!confirm(`Hapus amalan "${r.nama}" dari daftar? Catatan lama tetap tersimpan di riwayat mahasantri. Untuk sekadar menyembunyikan, pakai tombol Sembunyikan.`)) return;
    const { error } = await supabase.from("jenis_ibadah_kustom").delete().eq("id", r.id);
    if (error) alert(error.message); else amalanT.reload();
  }
  return (
    <Card className="mb-5">
      <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold">Amalan Sunnah Tambahan</h3>
      <p className="text-xs text-stone-500 mt-1 mb-3">Tambahkan amalan baru (misalnya Puasa Senin-Kamis, Shalat Rawatib Maghrib, Sedekah Subuh). Amalan aktif otomatis muncul di form <b>Catat Semua Ibadah</b> dan masuk rekap Ibadah.</p>
      <form onSubmit={tambah} className="flex gap-2 flex-wrap items-end mb-3">
        <div className="flex-1 min-w-[12rem]"><Field label="Nama amalan"><Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="cth. Puasa Senin-Kamis" /></Field></div>
        <div className="min-w-[12rem]"><Field label="Pilihan capaian"><Select value={tpl} onChange={(e) => setTpl(e.target.value)}><option value="ya">Dikerjakan / Tidak Dikerjakan</option><option value="lengkap">Lengkap / Sebagian / Tidak Dikerjakan</option></Select></Field></div>
        <div className="mb-3"><Btn type="submit" disabled={busy || !nama.trim()}>Tambah</Btn></div>
      </form>
      <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl">
        {amalanT.rows.sort((a, b) => (a.urutan || 0) - (b.urutan || 0)).map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 px-3 py-2 flex-wrap">
            <div className="min-w-0"><span className={`font-semibold ${r.aktif ? "text-[#0B3B36]" : "text-stone-400 line-through"}`}>{r.nama}</span><span className="text-xs text-stone-400 ml-2">{(r.opsi || []).join(" / ")}</span></div>
            <div className="flex gap-3 text-xs font-bold">
              <button type="button" onClick={() => ubah(r.id, { aktif: !r.aktif })} className="text-[#145048]">{r.aktif ? "Sembunyikan" : "Tampilkan"}</button>
              <button type="button" onClick={() => hapus(r)} className="text-red-600">Hapus</button>
            </div>
          </div>
        ))}
        {amalanT.rows.length === 0 && <div className="px-3 py-4 text-sm text-stone-400">Belum ada amalan tambahan.</div>}
      </div>
    </Card>
  );
}

/* Pengampu bisa lebih dari satu (mis. musyrif dan musyrifah): disimpan dipisah " / " */
function semesterKeDari(records, ta, sem) {
  const eksplisit = (records || []).filter((r) => r.tahun_ajaran === ta && r.semester === sem && r.semester_ke).map((r) => Number(r.semester_ke));
  if (eksplisit.length) { const hit = {}; eksplisit.forEach((x) => { hit[x] = (hit[x] || 0) + 1; }); return Object.keys(hit).sort((a, b) => hit[b] - hit[a])[0]; }
  const kunci = [...new Set((records || []).map((r) => `${r.tahun_ajaran}|${r.semester === "Ganjil" ? 1 : 2}`))].sort();
  const i = kunci.indexOf(`${ta}|${sem === "Ganjil" ? 1 : 2}`);
  return i >= 0 ? String(i + 1) : "-";
}
function normalisasiPengampu(v) { return String(v || "").split("/").map((x) => x.trim()).filter(Boolean).join(" / "); }
function PengampuInput({ value, onChange, saranTambahan = [] }) {
  const profT = useTable("profiles");
  const saran = [...new Set([...saranTambahan, ...profT.rows.filter((p) => ["musyrif", "musyrifah"].includes(p.role)).map((p) => p.nama).filter(Boolean)])];
  const dipilih = String(value || "").split("/").map((x) => x.trim()).filter(Boolean);
  const kolam = [...new Set(saranTambahan)];
  if (kolam.length > 0) {
    // Mode pilihan: klik nama pengampu yang mengajar; yang lain boleh diketik terpisah
    const lain = dipilih.filter((n) => !kolam.includes(n));
    const ubah = (daftar) => onChange(daftar.join(" / "));
    const toggle = (n) => ubah(dipilih.includes(n) ? dipilih.filter((x) => x !== n) : [...dipilih.filter((x) => kolam.includes(x)), n, ...lain]);
    return (
      <div>
        <datalist id="saranPengampu">{saran.map((n) => <option key={n} value={n} />)}</datalist>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {kolam.map((n) => <button key={n} type="button" onClick={() => toggle(n)} className={`px-3 py-1 rounded-full text-xs font-semibold border ${dipilih.includes(n) ? "bg-[#0B3B36] text-white border-[#0B3B36]" : "bg-white text-stone-400 border-stone-200 hover:border-stone-300"}`}>{n}</button>)}
        </div>
        <Input list="saranPengampu" value={lain.join(" / ")} onChange={(e) => ubah([...dipilih.filter((x) => kolam.includes(x)), ...e.target.value.split("/").map((x) => x.replace(/^\s+/, ""))])} placeholder="Pengampu lain (opsional)" />
      </div>
    );
  }
  const arr = String(value || "").split("/").map((x) => x.replace(/^\s+/, ""));
  const daftar = arr.length ? arr : [""];
  const ubah = (i, v) => onChange(daftar.map((x, j) => (j === i ? v : x)).join(" / "));
  const hapus = (i) => onChange(daftar.filter((_, j) => j !== i).join(" / "));
  return (
    <div>
      <datalist id="saranPengampu">{saran.map((n) => <option key={n} value={n} />)}</datalist>
      <div className="space-y-2">
        {daftar.map((n, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input list="saranPengampu" value={n} onChange={(e) => ubah(i, e.target.value.replace(/\//g, ""))} placeholder={i === 0 ? "Nama pengampu (ustadz / musyrif)" : "Pengampu lain (mis. musyrifah)"} />
            {daftar.length > 1 && <button type="button" onClick={() => hapus(i)} className="text-red-500 text-lg font-bold px-1" aria-label="Hapus pengampu">×</button>}
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange(daftar.join(" / ") + " / ")} className="mt-2 text-xs font-bold text-[#145048] underline">+ Tambah pengampu</button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Transkrip Nilai — seluruh semester, IPK, dan ringkasan tugas akhir          */
/* ---------------------------------------------------------------------- */
function TranskripNilai({ records, santri, tahap = [] }) {
  const sel = records.filter((r) => r.status === "selesai" && r.nilai_angka != null);
  const terbaik = bestPerKode(sel);
  const urutSem = (r) => `${r.tahun_ajaran || ""}|${r.semester === "Ganjil" ? 1 : 2}`;
  const kunci = [...new Set(terbaik.map(urutSem))].sort();
  const sks = (r) => Number(r.sks || 0);
  const mutu = (r) => bobot(nilaiHuruf(r.nilai_angka)) * sks(r);
  const totalSks = terbaik.reduce((a, r) => a + sks(r), 0);
  const totalMutu = terbaik.reduce((a, r) => a + mutu(r), 0);
  const ipk = totalSks ? (totalMutu / totalSks).toFixed(2) : "-";
  const sel2 = { border: "1px solid #1F2937", padding: 5 };
  const lulusTahap = TAHAPAN_AKHIR.map((t) => ({ t, r: tahap.filter((x) => x.jenis === t.kode && x.status === "Lulus").sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))[0] })).filter((x) => x.r);
  if (terbaik.length === 0) {
    return <div style={{ fontSize: 11, textAlign: "center", color: "#78716C", padding: "24px 0" }}>Belum ada mata kuliah dengan nilai berstatus selesai untuk ditampilkan di transkrip.</div>;
  }
  let no = 0;
  return (
    <>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5, marginBottom: 8 }}>
        <thead>
          <tr style={{ background: "#0B3B36", color: "#fff" }}>
            <th style={sel2}>No</th><th style={sel2}>Kode MK</th><th style={sel2}>Mata Kuliah</th><th style={sel2}>SKS</th>
            <th style={sel2}>Nilai</th><th style={sel2}>Huruf</th><th style={sel2}>Bobot</th><th style={sel2}>SKS × Bobot</th>
          </tr>
        </thead>
        <tbody>
          {kunci.map((k) => {
            const [ta, kode] = k.split("|");
            const baris = terbaik.filter((r) => urutSem(r) === k).sort((a, b) => String(a.kode_mk || a.mata_kuliah).localeCompare(String(b.kode_mk || b.mata_kuliah), "id", { numeric: true }));
            return [
              <tr key={"h" + k} style={{ background: "#F3EEE1", fontWeight: 700 }}><td colSpan={8} style={sel2}>Tahun Ajaran {ta} — Semester {kode === "1" ? "Ganjil" : "Genap"}</td></tr>,
              ...baris.map((r) => { no += 1; return (
                <tr key={r.id}>
                  <td style={{ ...sel2, textAlign: "center" }}>{no}</td>
                  <td style={{ ...sel2, textAlign: "center" }}>{r.kode_mk || "-"}</td>
                  <td style={sel2}>{r.mata_kuliah}</td>
                  <td style={{ ...sel2, textAlign: "center" }}>{r.sks}</td>
                  <td style={{ ...sel2, textAlign: "center" }}>{r.nilai_angka}</td>
                  <td style={{ ...sel2, textAlign: "center" }}>{nilaiHuruf(r.nilai_angka)}</td>
                  <td style={{ ...sel2, textAlign: "center" }}>{bobot(nilaiHuruf(r.nilai_angka)).toFixed(2)}</td>
                  <td style={{ ...sel2, textAlign: "center" }}>{mutu(r).toFixed(2)}</td>
                </tr>
              ); }),
            ];
          })}
          <tr style={{ background: "#F3EEE1", fontWeight: 700 }}>
            <td colSpan={3} style={{ ...sel2, textAlign: "right", padding: "5px 10px 5px 5px" }}>JUMLAH</td>
            <td style={{ ...sel2, textAlign: "center" }}>{totalSks}</td>
            <td colSpan={3} style={sel2}></td>
            <td style={{ ...sel2, textAlign: "center" }}>{totalMutu.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      <table style={{ width: "100%", fontSize: 10.5, marginTop: 6, marginBottom: 14 }}><tbody><tr>
        <td style={{ verticalAlign: "top" }}>
          <div>Total SKS Lulus : <b>{totalSks}</b></div>
          <div>Indeks Prestasi Kumulatif (IPK) : <b>{ipk}</b></div>
        </td>
        <td style={{ textAlign: "right", verticalAlign: "top", fontSize: 9.5, color: "#44544D" }}>
          Keterangan Bobot:<br />A = 4.00 &nbsp;&nbsp; B = 3.00<br />C = 2.00 &nbsp;&nbsp; D = 1.00<br />E = 0.00
        </td>
      </tr></tbody></table>
      {lulusTahap.length > 0 && (
        <div style={{ border: "1px solid #E7DFCB", background: "#FBF8F1", borderRadius: 6, padding: "10px 14px", marginBottom: 14 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#0B3B36", marginBottom: 4 }}>Tugas Akhir & Ujian</div>
          <table style={{ width: "100%", fontSize: 10.5 }}><tbody>
            {lulusTahap.map(({ t, r }) => (
              <tr key={t.kode}>
                <td style={{ padding: "1px 0" }}>{t.nama}</td>
                <td style={{ padding: "1px 0", textAlign: "center" }}>{r.nilai_angka != null ? `${r.nilai_angka} (${nilaiHuruf(r.nilai_angka)})` : "Lulus"}</td>
                <td style={{ padding: "1px 0", textAlign: "right" }}>{r.tanggal_pelaksanaan ? new Date(r.tanggal_pelaksanaan).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : ""}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}
      <div style={{ border: "1px solid #E7DFCB", background: "#FBF8F1", borderRadius: 6, padding: "10px 14px", marginBottom: 16 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#0B3B36", marginBottom: 4 }}>Rekapitulasi Capaian Al-Qur'an</div>
        <div style={{ fontSize: 10.5 }}><b>Total Hafalan Dikuasai:</b> {santri?.juz_dikuasai?.length || 0} dari 30 Juz</div>
      </div>
    </>
  );
}

/* Ikon garis seragam untuk tahap tugas akhir (lebih formal daripada emoji) */
function IkonTahap({ kode, size = 20 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  if (kode === "KPM") return <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
  if (kode === "Magang") return <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
  if (kode === "Sidang Akhir Bisnis") return <svg {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>;
  if (kode === "Sidang Munaqasyah") return <svg {...p}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
  if (kode === "Syahadah Kubro") return <svg {...p}><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg>;
  if (kode === "Wisuda") return <svg {...p}><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>;
  return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
}
function IkonCentang({ size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>; }
function IkonKunci({ size = 18 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>; }

/* Dokumen cetak: ringkasan tugas akhir & ujian per mahasantri */
function RingkasanTugasAkhirCetak({ santri, rows }) {
  const brand = useContext(BrandContext);
  const mine = rows.filter((r) => r.nim === santri?.nim);
  const lulus = jumlahTahapLulus(mine);
  const sel = { border: "1px solid #1F2937", padding: 5 };
  const tanggal = (r) => {
    if (!r || !r.tanggal_pelaksanaan) return "-";
    const a = tglPendek(r.tanggal_pelaksanaan);
    return r.tanggal_selesai ? `${a} s.d. ${tglPendek(r.tanggal_selesai)}` : a;
  };
  const karya = tahapTerakhir(mine, "Sidang Akhir Bisnis")?.karya || {};
  return (
    <div className="krs-print bg-white rounded-2xl border border-stone-200 shadow-sm p-8 mb-6">
      <table style={{ width: "100%", marginBottom: 14 }}><tbody><tr>
        <td style={{ width: 90, verticalAlign: "middle" }}>{(brand.logo_dokumen_url || brand.logo_url) && <img src={brand.logo_dokumen_url || brand.logo_url} alt="logo" style={{ width: 80 }} />}</td>
        <td style={{ verticalAlign: "middle" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0B3B36" }}>{brand.yayasan_nama}</div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0B3B36" }}>PONDOK TAHFIDZ QURAN DAN ENTREPRENEUR {brand.nama_pondok?.toUpperCase()}</div>
          <div style={{ fontSize: 10.5, color: "#44544D" }}>{brand.alamat_pondok}</div>
          <div style={{ fontSize: 10.5, color: "#44544D", fontStyle: "italic" }}>Contact: {brand.kontak_pondok}</div>
        </td>
      </tr></tbody></table>
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15 }}>RINGKASAN TUGAS AKHIR & UJIAN</div>
      <div style={{ textAlign: "center", fontSize: 11, paddingBottom: 6, marginBottom: 16 }}>{lulus} dari {TAHAPAN_AKHIR.length} tahap dinyatakan lulus</div>
      <div style={{ fontSize: 11, marginBottom: 3, display: "flex" }}><span style={{ width: 130 }}>Nama Mahasantri</span><span>: {santri?.nama}</span></div>
      <div style={{ fontSize: 11, marginBottom: 3, display: "flex" }}><span style={{ width: 130 }}>NIM</span><span>: {santri?.nim}</span></div>
      <div style={{ fontSize: 11, marginBottom: 14, display: "flex" }}><span style={{ width: 130 }}>Angkatan</span><span>: {santri?.kelas || "-"}</span></div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5, marginBottom: 10 }}>
        <thead><tr style={{ background: "#0B3B36", color: "#fff" }}>
          <th style={sel}>No</th><th style={sel}>Tahap</th><th style={sel}>Status</th><th style={sel}>Pelaksanaan</th><th style={sel}>Pembimbing / Penguji</th><th style={sel}>Nilai</th>
        </tr></thead>
        <tbody>
          {TAHAPAN_AKHIR.map((cfg, i) => {
            const r = tahapLulus(mine, cfg.kode) ? mine.filter((x) => x.jenis === cfg.kode && x.status === "Lulus")[0] : tahapTerakhir(mine, cfg.kode);
            return (
              <tr key={cfg.kode}>
                <td style={{ ...sel, textAlign: "center" }}>{i + 1}</td>
                <td style={sel}>{cfg.nama}</td>
                <td style={{ ...sel, textAlign: "center" }}>{r ? r.status : "Belum diajukan"}</td>
                <td style={{ ...sel, textAlign: "center" }}>{tanggal(r)}</td>
                <td style={sel}>{r ? [r.pembimbing, r.penguji].filter(Boolean).join(" / ") || "-" : "-"}</td>
                <td style={{ ...sel, textAlign: "center" }}>{r && r.nilai_angka != null ? `${r.nilai_angka} (${nilaiHuruf(r.nilai_angka)})` : "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {(karya.nama_brand || karya.bidang) && (
        <div style={{ border: "1px solid #E7DFCB", background: "#FBF8F1", borderRadius: 6, padding: "10px 14px", marginBottom: 14, fontSize: 10.5 }}>
          <div style={{ fontWeight: 700, color: "#0B3B36", marginBottom: 3 }}>Karya Bisnis (Sidang Akhir Bisnis)</div>
          <div><b>Brand:</b> {karya.nama_brand || "-"}{karya.bidang ? ` — ${karya.bidang}` : ""}</div>
          {karya.produk && <div><b>Produk / Layanan:</b> {karya.produk}</div>}
        </div>
      )}
      <div style={{ fontSize: 10.5, ...ttdBlokStyle(brand, 24) }}>
        <div>{brand.kota_pondok || "Aceh Besar"}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
        <div style={jabatanStyle(brand)}>{brand.jabatan_ttd || DEFAULT_JABATAN_TTD}</div>
        <div style={{ display: "flex", justifyContent: isiAlign(brand).flex, marginTop: 10, marginBottom: 6 }}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${brand.nama_pondok || "SIAKAD"} | Ringkasan Tugas Akhir | NIM ${santri?.nim} | ${lulus}/${TAHAPAN_AKHIR.length} lulus`)}`} alt="QR verifikasi" style={{ width: 56, height: 56 }} />
        </div>
        {brand.tanda_tangan_mudir_url ? <div><img src={brand.tanda_tangan_mudir_url} alt="Tanda tangan Mudir" style={{ height: 46, margin: isiAlign(brand).img }} /></div> : null}
        <div style={{ borderTop: brand.tanda_tangan_mudir_url ? "1px solid #999" : "none", paddingTop: brand.tanda_tangan_mudir_url ? 2 : 0 }}><b>{brand.nama_mudir}</b></div>
        <div>NIP. {brand.nip_mudir || "-"}</div>
      </div>
    </div>
  );
}

/* Rekap setoran per jenis (Ziyadah, Murajaah, Tasmi', Tilawah, Tahsin, Talaqqi, Syahadah) */
const JENIS_REKAP = [["Ziyadah", "hlm"], ["Murajaah", "hlm"], ["Tasmi'", "kali"], ["Tilawah", "hlm"], ["Tahsin", "hlm"], ["Talaqqi", "hlm"], ["Syahadah", "kali"]];
function hitungJenisSetoran(quranRows, nim, saring) {
  const baris = quranRows.filter((l) => l.nim === nim && saring(l));
  const o = {};
  JENIS_REKAP.forEach(([j]) => { const x = baris.filter((l) => l.jenis === j); o[j] = { hlm: x.reduce((a, l) => a + halamanLog(l), 0), kali: x.length }; });
  return o;
}
function TabelSetoranJenis({ data, judul, sub }) {
  const nilai = (v, j, u) => (u === "hlm" ? v[j].hlm : v[j].kali);
  const total = (j, u) => data.reduce((a, x) => a + nilai(x.v, j, u), 0);
  return (
    <div className="mt-6">
      <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-1">{judul}</h3>
      {sub && <div className="text-[0.6875rem] text-stone-500 mb-3">{sub}</div>}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-3">
        {JENIS_REKAP.map(([j, u]) => (
          <div key={j} className="rounded-xl border border-stone-200 bg-white px-3 py-2">
            <div className="text-[0.625rem] uppercase tracking-wide text-stone-400 font-bold">{j}</div>
            <div className="font-serif-dh text-lg font-semibold text-[#0B3B36]">{total(j, u).toLocaleString("id-ID")}<span className="text-xs text-stone-400 ml-1">{u === "hlm" ? "hlm" : "kali"}</span></div>
          </div>
        ))}
      </div>
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="bg-stone-50 text-[0.625rem] uppercase text-stone-500">
            <th className="p-2 text-left">Mahasantri</th>
            {JENIS_REKAP.map(([j, u]) => <th key={j} className="p-2">{j}<div className="normal-case text-stone-400 font-normal">{u === "hlm" ? "halaman" : "kali"}</div></th>)}
          </tr></thead>
          <tbody>
            {data.map(({ b, v }) => (
              <tr key={b.s.nim} className="border-t border-stone-100 text-center">
                <td className="p-2 text-left"><div className="font-bold text-[0.8rem]">{b.s.nama}</div><div className="text-[0.625rem] text-stone-400">{b.s.nim}</div></td>
                {JENIS_REKAP.map(([j, u]) => { const n = nilai(v, j, u); return <td key={j} className={`p-2 ${n ? "font-bold text-[#0B3B36]" : "text-stone-300"}`}>{n || "-"}</td>; })}
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={8}><Empty text="Belum ada mahasantri." /></td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* Ringkasan visual pencapaian: diagram lingkaran, siapa mencapai / belum, dan per angkatan */
function RingkasanVisualRekap({ daftar, wg, judul }) {
  const [fokus, setFokus] = useState("q");
  const [semua, setSemua] = useState(false);
  const STATUS = [
    { k: "tercapai", label: "Tercapai", warna: wg.hafalan },
    { k: "sebagian", label: "Sebagian pekan", warna: "#E9C46A" },
    { k: "belum", label: "Belum tercapai", warna: wg.ibadah_kurang },
    { k: "tanpa", label: "Tanpa target / data", warna: "#D6D3D1" },
  ];
  const rows = daftar.map((d) => ({ s: d.s, ...d[fokus] }));
  const hitung = Object.fromEntries(STATUS.map((x) => [x.k, rows.filter((r) => r.status === x.k).length]));
  const total = rows.length || 1;
  const dinilai = rows.length - hitung.tanpa;
  let kumulatif = 0;
  const segmen = STATUS.map((x) => { const pct = (hitung[x.k] / total) * 100; const o = { ...x, pct, offset: 25 - kumulatif }; kumulatif += pct; return o; });
  const tercapai = rows.filter((r) => r.status === "tercapai").sort((a, b) => a.s.nama.localeCompare(b.s.nama));
  const belum = rows.filter((r) => r.status === "belum" || r.status === "sebagian").sort((a, b) => a.persen - b.persen || a.s.nama.localeCompare(b.s.nama));
  const tanpa = rows.filter((r) => r.status === "tanpa");
  const batas = semua ? 999 : 8;
  const angkatan = {};
  rows.forEach((r) => { const k = String(r.s.kelas || "").trim() || "Tanpa angkatan"; (angkatan[k] = angkatan[k] || []).push(r); });
  const urutAng = Object.keys(angkatan).sort((a, b) => a.localeCompare(b, "id", { numeric: true }));
  const namaFokus = fokus === "q" ? "Ziyadah" : "Ibadah";
  const Baris = ({ r, warna }) => (
    <div className="py-2 border-t border-stone-100 first:border-t-0">
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0"><span className="font-semibold text-[0.8rem] text-[#0B3B36]">{r.s.nama}</span><span className="text-[0.625rem] text-stone-400 ml-2">{r.s.nim}{r.s.kelas ? " · " + r.s.kelas : ""}</span></div>
        <div className="text-[0.6875rem] font-bold shrink-0" style={{ color: warna }}>{r.persen}%</div>
      </div>
      <div className="h-1.5 bg-stone-100 rounded-full mt-1 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(100, r.persen)}%`, background: warna }} /></div>
      <div className="text-[0.625rem] text-stone-500 mt-0.5">{r.info}</div>
    </div>
  );
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold">Gambaran Pencapaian Target — {judul}</h3>
        <div className="inline-flex border border-stone-200 rounded-lg overflow-hidden print:hidden">
          {[["q", "Ziyadah"], ["i", "Ibadah"]].map(([k, l]) => <button key={k} type="button" onClick={() => setFokus(k)} className={`px-4 py-1.5 text-xs font-bold ${fokus === k ? "bg-[#0B3B36] text-white" : "bg-white text-stone-500"}`}>{l}</button>)}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card>
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 42 42" width="132" height="132" role="img" aria-label={`Diagram pencapaian target ${namaFokus}`}>
              <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#F5F5F4" strokeWidth="6" />
              {segmen.filter((x) => x.pct > 0).map((x) => <circle key={x.k} cx="21" cy="21" r="15.9155" fill="none" stroke={x.warna} strokeWidth="6" strokeDasharray={`${x.pct} ${100 - x.pct}`} strokeDashoffset={x.offset} />)}
              <text x="21" y="20" textAnchor="middle" fontSize="7" fontWeight="700" fill="#0B3B36">{dinilai ? Math.round((hitung.tercapai / dinilai) * 100) : 0}%</text>
              <text x="21" y="26" textAnchor="middle" fontSize="2.8" fill="#78716C">tercapai</text>
            </svg>
            <div className="space-y-1.5 text-xs">
              {STATUS.map((x) => <div key={x.k} className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: x.warna }} /><span className="text-stone-600">{x.label}</span><b className="text-[#0B3B36]">{hitung[x.k]}</b></div>)}
            </div>
          </div>
          <div className="text-[0.6875rem] text-stone-500 mt-3">Target {namaFokus}: <b>{hitung.tercapai}</b> dari <b>{dinilai}</b> mahasantri yang dinilai tercapai penuh.</div>
        </Card>
        <Card className="lg:col-span-2">
          <div className="text-[0.6875rem] uppercase tracking-wider text-stone-400 font-bold mb-2">Pencapaian per angkatan ({namaFokus})</div>
          <div className="space-y-2.5">
            {urutAng.map((k) => {
              const g = angkatan[k]; const den = g.filter((r) => r.status !== "tanpa").length; const ok = g.filter((r) => r.status === "tercapai").length;
              const pct = den ? Math.round((ok / den) * 100) : 0;
              return (
                <div key={k}>
                  <div className="flex justify-between text-xs"><span className="font-semibold text-[#0B3B36]">{/^\d+$/.test(k) ? "Angkatan " + k : k}</span><span className="text-stone-500">{den ? `${ok} dari ${den} tercapai (${pct}%)` : "belum ada data / target"}</span></div>
                  <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden mt-1"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: wg.hafalan }} /></div>
                </div>
              );
            })}
            {urutAng.length === 0 && <Empty text="Belum ada data." />}
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-1"><h4 className="font-bold text-sm" style={{ color: wg.hafalan }}>Mencapai target ({tercapai.length})</h4></div>
          {tercapai.slice(0, batas).map((r) => <Baris key={r.s.nim} r={r} warna={wg.hafalan} />)}
          {tercapai.length === 0 && <div className="text-xs text-stone-400 py-3">Belum ada mahasantri yang mencapai target.</div>}
          {tercapai.length > batas && <div className="text-[0.6875rem] text-stone-400 pt-2">dan {tercapai.length - batas} lainnya</div>}
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-1"><h4 className="font-bold text-sm" style={{ color: wg.ibadah_kurang }}>Belum mencapai target ({belum.length})</h4><span className="text-[0.625rem] text-stone-400">yang paling rendah di atas</span></div>
          {belum.slice(0, batas).map((r) => <Baris key={r.s.nim} r={r} warna={r.status === "sebagian" ? "#C9A227" : wg.ibadah_kurang} />)}
          {belum.length === 0 && <div className="text-xs text-stone-400 py-3">Semua mahasantri yang dinilai sudah mencapai target.</div>}
          {belum.length > batas && <div className="text-[0.6875rem] text-stone-400 pt-2">dan {belum.length - batas} lainnya</div>}
        </Card>
      </div>
      {(tercapai.length > batas || belum.length > batas) && <button type="button" onClick={() => setSemua(!semua)} className="mt-2 text-xs font-bold text-[#145048] underline print:hidden">{semua ? "Ringkas daftar" : "Tampilkan semua nama"}</button>}
      {tanpa.length > 0 && <div className="mt-3 text-[0.6875rem] text-stone-500"><b>Belum dinilai ({tanpa.length}):</b> {tanpa.map((r) => r.s.nama).join(", ")}. {fokus === "q" ? "Biasanya target halaman per pekan belum diisi di Data Mahasantri, atau pekan belum berjalan." : "Belum ada catatan ibadah pada periode ini."}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Pengumuman                                                               */
/* ---------------------------------------------------------------------- */
function PengumumanPage({ profile }) {
  const editable = canEdit(profile.role, "pengumuman");
  const pengT = useTable("pengumuman");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const sorted = [...pengT.rows].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

  async function saveItem(f) {
    const { error } = f.id
      ? await supabase.from("pengumuman").update(f).eq("id", f.id)
      : await supabase.from("pengumuman").insert({ ...f, dibuat_oleh: profile.username, created_at: new Date().toISOString() });
    if (error) { alert(error.message); return; }
    setShowForm(false); setEditingItem(null); pengT.reload();
  }
  async function removeItem(id) {
    if (!confirm("Hapus pengumuman ini?")) return;
    const { error } = await supabase.from("pengumuman").delete().eq("id", id);
    if (error) alert(error.message); else pengT.reload();
  }

  return (
    <div>
      <PageHeader title="Pengumuman" sub="Informasi &amp; agenda pondok." actions={
        editable && <Btn onClick={() => setShowForm(true)}>+ Buat Pengumuman</Btn>
      } />
      {sorted.length === 0 && <Empty text="Belum ada pengumuman." />}
      <div className="space-y-3">
        {sorted.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold text-[#0B3B36] text-base mb-1">{p.judul}</div>
                <div className="text-[0.6875rem] text-stone-400 mb-2">{p.created_at ? new Date(p.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : ""} — {p.dibuat_oleh}</div>
                <div className="text-sm text-stone-700 whitespace-pre-wrap">{p.isi}</div>
              </div>
              {editable && <div className="flex gap-3 shrink-0">
                <button onClick={() => setEditingItem(p)} className="text-[#145048] text-xs font-bold">Edit</button>
                <button onClick={() => removeItem(p.id)} className="text-red-600 text-xs font-bold">Hapus</button>
              </div>}
            </div>
          </Card>
        ))}
      </div>
      {(showForm || editingItem) && <PengumumanForm initial={editingItem} onCancel={() => { setShowForm(false); setEditingItem(null); }} onSubmit={saveItem} />}
    </div>
  );
}
function PengumumanForm({ initial, onCancel, onSubmit }) {
  const [f, setF] = useState(initial || { judul: "", isi: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={initial ? "Edit Pengumuman" : "Buat Pengumuman"} onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
        <Field label="Judul"><Input value={f.judul} onChange={set("judul")} placeholder="cth. Libur Semester Ganjil" /></Field>
        <Field label="Isi"><textarea className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm" rows={5} value={f.isi} onChange={set("isi")} /></Field>
        <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit">Simpan</Btn></div>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------------- */
/* Kalender Akademik                                                        */
/* ---------------------------------------------------------------------- */
function KalenderPage({ profile }) {
  const editable = canEdit(profile.role, "kalender");
  const kalT = useTable("kalender_akademik");
  const dokT = useTable("kalender_dokumen");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...kalT.rows].sort((a, b) => (a.tanggal_mulai || "").localeCompare(b.tanggal_mulai || ""));
  const akanDatang = sorted.filter((k) => (k.tanggal_selesai || k.tanggal_mulai) >= today);
  const sudahLewat = sorted.filter((k) => (k.tanggal_selesai || k.tanggal_mulai) < today);
  const dokumen = [...dokT.rows].sort((a, b) => (b.uploaded_at || "").localeCompare(a.uploaded_at || ""));

  async function uploadDokumen(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const judul = prompt("Judul dokumen (cth. Kalender Akademik Semester Ganjil 2026/2027):", file.name.replace(/\.[^.]+$/, ""));
    if (!judul) { setUploading(false); return; }
    const path = `kalender/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("dokumen-santri").upload(path, file, { upsert: true });
    if (upErr) { alert(upErr.message); setUploading(false); return; }
    const { data } = supabase.storage.from("dokumen-santri").getPublicUrl(path);
    const { error } = await supabase.from("kalender_dokumen").insert({ judul, url: data.publicUrl, uploaded_at: new Date().toISOString() });
    setUploading(false);
    if (error) alert(error.message); else dokT.reload();
  }
  async function hapusDokumen(id) {
    if (!confirm("Hapus dokumen kalender ini?")) return;
    const { error } = await supabase.from("kalender_dokumen").delete().eq("id", id);
    if (error) alert(error.message); else dokT.reload();
  }

  async function saveItem(f) {
    const { error } = f.id
      ? await supabase.from("kalender_akademik").update(f).eq("id", f.id)
      : await supabase.from("kalender_akademik").insert(f);
    if (error) { alert(error.message); return; }
    setShowForm(false); setEditingItem(null); kalT.reload();
  }
  async function removeItem(id) {
    if (!confirm("Hapus agenda ini?")) return;
    const { error } = await supabase.from("kalender_akademik").delete().eq("id", id);
    if (error) alert(error.message); else kalT.reload();
  }
  const fmt = (d) => d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";

  const Baris = ({ k }) => (
    <tr className="border-t border-stone-100">
      <td className="p-3.5 whitespace-nowrap text-stone-500">{fmt(k.tanggal_mulai)}{k.tanggal_selesai && k.tanggal_selesai !== k.tanggal_mulai ? ` – ${fmt(k.tanggal_selesai)}` : ""}</td>
      <td className="p-3.5 font-semibold">{k.judul_kegiatan}</td>
      <td className="p-3.5 text-stone-500">{k.keterangan || "-"}</td>
      {editable && <td className="p-3.5 text-right whitespace-nowrap">
        <button onClick={() => setEditingItem(k)} className="text-[#145048] text-xs font-bold mr-3">Edit</button>
        <button onClick={() => removeItem(k.id)} className="text-red-600 text-xs font-bold">Hapus</button>
      </td>}
    </tr>
  );

  return (
    <div>
      <PageHeader title="Kalender Akademik" sub="Agenda &amp; tanggal penting pondok." actions={
        editable && <Btn onClick={() => setShowForm(true)}>+ Tambah Agenda</Btn>
      } />

      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold">Dokumen Kalender Akademik</h3>
          {editable && (
            <label className="text-xs font-bold text-[#0B3B36] border border-stone-300 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-stone-50">
              {uploading ? "Mengunggah…" : "+ Unggah Dokumen"}
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={uploadDokumen} disabled={uploading} />
            </label>
          )}
        </div>
        {dokumen.length === 0 && <div className="text-sm text-stone-400">Belum ada dokumen kalender yang diunggah. Bisa unggah PDF atau gambar kalender akademik yang sudah dibuat pondok.</div>}
        <div className="space-y-2">
          {dokumen.map((d) => (
            <div key={d.id} className="flex items-center justify-between border border-stone-100 rounded-lg px-3.5 py-2.5">
              <a href={d.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#145048] underline">📄 {d.judul}</a>
              <div className="flex items-center gap-3">
                <span className="text-[0.6875rem] text-stone-400">{d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : ""}</span>
                {editable && <button onClick={() => hapusDokumen(d.id)} className="text-red-600 text-xs font-bold">Hapus</button>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden mb-4">
        <div className="px-4 py-3 bg-stone-50 border-b border-stone-100 font-bold text-sm text-[#0B3B36]">Akan Datang</div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3.5">Tanggal</th><th className="p-3.5">Kegiatan</th><th className="p-3.5">Keterangan</th>{editable && <th className="p-3.5"></th>}</tr></thead>
          <tbody>{akanDatang.map((k) => <Baris key={k.id} k={k} />)}{akanDatang.length === 0 && <tr><td colSpan={editable ? 4 : 3}><Empty text="Tidak ada agenda mendatang." /></td></tr>}</tbody>
        </table>
      </Card>
      {sudahLewat.length > 0 && (
        <Card className="p-0 overflow-hidden opacity-70">
          <div className="px-4 py-3 bg-stone-50 border-b border-stone-100 font-bold text-sm text-stone-500">Sudah Lewat</div>
          <table className="w-full text-sm">
            <tbody>{sudahLewat.map((k) => <Baris key={k.id} k={k} />)}</tbody>
          </table>
        </Card>
      )}
      {(showForm || editingItem) && <KalenderForm initial={editingItem} onCancel={() => { setShowForm(false); setEditingItem(null); }} onSubmit={saveItem} />}
    </div>
  );
}
function KalenderForm({ initial, onCancel, onSubmit }) {
  const [f, setF] = useState(initial || { judul_kegiatan: "", tanggal_mulai: new Date().toISOString().slice(0, 10), tanggal_selesai: "", keterangan: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={initial ? "Edit Agenda" : "Tambah Agenda"} onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
        <Field label="Nama Kegiatan"><Input value={f.judul_kegiatan} onChange={set("judul_kegiatan")} placeholder="cth. Ujian Akhir Semester" /></Field>
        <Field label="Tanggal Mulai"><Input type="date" value={f.tanggal_mulai} onChange={set("tanggal_mulai")} /></Field>
        <Field label="Tanggal Selesai (opsional)"><Input type="date" value={f.tanggal_selesai} onChange={set("tanggal_selesai")} /></Field>
        <Field label="Keterangan (opsional)"><Input value={f.keterangan} onChange={set("keterangan")} /></Field>
        <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit">Simpan</Btn></div>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------------- */
/* Rapor Bulanan — gabungan Ibadah + Al-Qur'an per bulan                   */
/* ---------------------------------------------------------------------- */
function RekapPencapaian({ santriList, quranRows, ibadahRows, brand, onBack }) {
  const wg = warnaGrafik(brand);
  const [bulan, setBulan] = useState(BULAN[new Date().getMonth()]);
  const [tahun, setTahun] = useState(nowYear);
  const [mode, setMode] = useState("bulan");
  const [pk, setPk] = useState(Math.min(3, Math.floor((new Date().getDate() - 1) / 7)));
  const [urut, setUrut] = useState("belum");
  const periode = `${tahun}-${String(BULAN.indexOf(bulan) + 1).padStart(2, "0")}`;
  const pekan = infoPekan(periode);
  const baris = [...santriList].sort((a, b) => a.nama.localeCompare(b.nama)).map((s) => {
    const lq = quranRows.filter((l) => l.nim === s.nim && l.jenis === "Ziyadah" && l.tanggal?.slice(0, 7) === periode);
    const li = ibadahRows.filter((l) => l.nim === s.nim && l.tanggal?.slice(0, 7) === periode);
    const q = pekan.map((p) => lq.filter((l) => pekanDari(l.tanggal) === p.i).reduce((a, l) => a + halamanLog(l), 0));
    const ib = pekan.map((p) => { const it = li.filter((l) => pekanDari(l.tanggal) === p.i); return it.length ? Math.round((it.filter((l) => !CAPAIAN_NEGATIF.includes(l.capaian)).length / it.length) * 100) : null; });
    const tq = Number(s.target_halaman_pekan) || 0, ti = Number(s.target_ibadah_persen) || 80;
    const qOk = pekan.map((p, i) => (p.berjalan && tq > 0 ? q[i] >= tq : null));
    const iOk = pekan.map((p, i) => (p.berjalan && ib[i] != null ? ib[i] >= ti : null));
    return { s, q, ib, tq, ti, qOk, iOk, totalQ: q.reduce((a, b) => a + b, 0), qN: qOk.filter((x) => x === true).length, qD: qOk.filter((x) => x !== null).length, iN: iOk.filter((x) => x === true).length, iD: iOk.filter((x) => x !== null).length };
  });
  const agregat = (ok) => pekan.map((p, i) => {
    if (!p.berjalan) return { ...p, nilai: null, ket: "belum berjalan" };
    const ds = baris.filter((b) => b[ok][i] !== null);
    if (!ds.length) return { ...p, nilai: null, ket: "tanpa data" };
    const n = ds.filter((b) => b[ok][i]).length;
    return { ...p, nilai: Math.round((n / ds.length) * 100), ket: `${n} dari ${ds.length} santri` };
  });
  const totalHal = baris.reduce((a, b) => a + b.totalQ, 0);
  const penuhQ = baris.filter((b) => b.qD > 0 && b.qN === b.qD).length, adaQ = baris.filter((b) => b.qD > 0).length;
  const penuhI = baris.filter((b) => b.iD > 0 && b.iN === b.iD).length, adaI = baris.filter((b) => b.iD > 0).length;
  const semuaIb = baris.flatMap((b) => b.ib.filter((x) => x != null));
  const rataIb = semuaIb.length ? Math.round(semuaIb.reduce((a, b) => a + b, 0) / semuaIb.length) : null;
  const wk = baris.map((b) => ({ b, q: b.q[pk], ib: b.ib[pk], qOk: b.qOk[pk], iOk: b.iOk[pk] }));
  const wkQD = wk.filter((x) => x.qOk !== null).length, wkQN = wk.filter((x) => x.qOk === true).length;
  const wkID = wk.filter((x) => x.iOk !== null).length, wkIN = wk.filter((x) => x.iOk === true).length;
  const wkTotal = wk.reduce((a, x) => a + x.q, 0);
  const wkIbVals = wk.map((x) => x.ib).filter((x) => x != null);
  const wkRata = wkIbVals.length ? Math.round(wkIbVals.reduce((a, b) => a + b, 0) / wkIbVals.length) : null;
  const rank = (x) => (x.qOk === false || x.iOk === false ? 0 : x.qOk === null && x.iOk === null ? 1 : 2);
  const wkUrut = [...wk].sort((a, b) => (urut === "belum" ? rank(a) - rank(b) : 0) || a.b.s.nama.localeCompare(b.b.s.nama));
  const nimSet = new Set(santriList.map((x) => x.nim));
  const trenHal = monthsBack(6).map((m) => ({ label: m.label, value: quranRows.filter((l) => nimSet.has(l.nim) && l.jenis === "Ziyadah" && l.tanggal?.slice(0, 7) === ymOf(m)).reduce((a, l) => a + halamanLog(l), 0) }));
  const trenIb = monthsBack(6).map((m) => { const it = ibadahRows.filter((l) => nimSet.has(l.nim) && l.tanggal?.slice(0, 7) === ymOf(m)); return { label: m.label, value: it.length ? Math.round((it.filter((l) => !CAPAIAN_NEGATIF.includes(l.capaian)).length / it.length) * 100) : 0 }; });
  const jenisBulan = baris.map((b) => ({ b, v: hitungJenisSetoran(quranRows, b.s.nim, (l) => l.tanggal?.slice(0, 7) === periode) }));
  const jenisPekan = baris.map((b) => ({ b, v: hitungJenisSetoran(quranRows, b.s.nim, (l) => l.tanggal?.slice(0, 7) === periode && pekanDari(l.tanggal) === pk) }));
  const statusBulan = (n, d) => (d === 0 ? "tanpa" : n === d ? "tercapai" : n > 0 ? "sebagian" : "belum");
  const rataIbBaris = (b) => { const v = b.ib.filter((x) => x != null); return v.length ? Math.round(v.reduce((a, x) => a + x, 0) / v.length) : null; };
  const daftarBulan = baris.map((b) => ({ s: b.s,
    q: { status: statusBulan(b.qN, b.qD), persen: b.qD ? Math.round((b.qN / b.qD) * 100) : 0, info: b.qD ? `${b.qN} dari ${b.qD} pekan tercapai · ${b.totalQ} hlm (target ${b.tq} hlm/pekan)` : b.tq ? "belum ada pekan yang berjalan" : "target halaman belum diisi" },
    i: { status: statusBulan(b.iN, b.iD), persen: b.iD ? Math.round((b.iN / b.iD) * 100) : 0, info: b.iD ? `${b.iN} dari ${b.iD} pekan tercapai · rata-rata ${rataIbBaris(b)}% (target ${b.ti}%)` : "belum ada catatan ibadah" } }));
  const daftarPekan = wk.map((x) => ({ s: x.b.s,
    q: { status: x.qOk === null ? "tanpa" : x.qOk ? "tercapai" : "belum", persen: x.b.tq ? Math.min(100, Math.round((x.q / x.b.tq) * 100)) : 0, info: x.b.tq ? `${x.q} hlm dari target ${x.b.tq} hlm` : "target halaman belum diisi" },
    i: { status: x.iOk === null ? "tanpa" : x.iOk ? "tercapai" : "belum", persen: x.ib == null ? 0 : Math.min(100, Math.round((x.ib / x.b.ti) * 100)), info: x.ib == null ? "belum ada catatan ibadah" : `${x.ib}% dari target ${x.b.ti}%` } }));
  const sel = (ok) => (ok === true ? { color: wg.hafalan, fontWeight: 700 } : ok === false ? { color: wg.ibadah_kurang, fontWeight: 700 } : { color: "#A8A29E" });
  async function unduhExcel() {
    const XLSX = await muatXLSX();
    if (mode === "pekan") {
      const aoaP = [
        [`Rekap Pencapaian Seluruh Santri — Pekan ${pk + 1} (tgl ${pekan[pk].rentang}) ${bulan} ${tahun}`], [brand.nama_pondok || ""], [],
        ["Total Ziyadah (halaman)", wkTotal], ["Santri memenuhi target Ziyadah", `${wkQN} dari ${wkQD}`], ["Santri memenuhi target ibadah", `${wkIN} dari ${wkID}`], ["Rata-rata ibadah terpenuhi (%)", wkRata ?? "-"], [],
        ["Nama", "NIM", "Ziyadah (hlm)", "Target Ziyadah", "Status Ziyadah", "Ibadah (%)", "Target ibadah (%)", "Status ibadah"],
        ...wkUrut.map(({ b, q, ib, qOk, iOk }) => [b.s.nama, b.s.nim, q, b.tq || "-", qOk === null ? "-" : qOk ? "Tercapai" : "Belum tercapai", ib == null ? "-" : ib, b.ti, iOk === null ? "-" : iOk ? "Tercapai" : "Belum tercapai"]),
      ];
      const wsP = XLSX.utils.aoa_to_sheet(aoaP); wsP["!cols"] = [{ wch: 28 }, { wch: 14 }, ...Array(6).fill({ wch: 16 })];
      const wbP = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wbP, wsP, `Pekan ${pk + 1} ${bulan} ${tahun}`.slice(0, 31));
      XLSX.utils.book_append_sheet(wbP, XLSX.utils.aoa_to_sheet([["Nama", "NIM", ...JENIS_REKAP.map(([j, u]) => `${j} (${u})`)], ...jenisPekan.map(({ b, v }) => [b.s.nama, b.s.nim, ...JENIS_REKAP.map(([j, u]) => (u === "hlm" ? v[j].hlm : v[j].kali))])]), "Setoran per Jenis");
      XLSX.writeFile(wbP, `Rekap-Pencapaian-Pekan${pk + 1}-${bulan}-${tahun}.xlsx`); return;
    }
    const aoa = [
      [`Rekap Pencapaian Seluruh Santri — ${bulan} ${tahun}`], [brand.nama_pondok || ""], [],
      ["Total Ziyadah (halaman)", totalHal], ["Santri memenuhi target Ziyadah", `${penuhQ} dari ${adaQ}`], ["Santri memenuhi target ibadah", `${penuhI} dari ${adaI}`], ["Rata-rata ibadah terpenuhi (%)", rataIb ?? "-"], [],
      ["Nama", "NIM", "Target hlm/pekan", "Pekan 1 (hlm)", "Pekan 2 (hlm)", "Pekan 3 (hlm)", "Pekan 4 (hlm)", "Total hlm", "Pekan tercapai (Ziyadah)", "Target ibadah (%)", "Pekan 1 (%)", "Pekan 2 (%)", "Pekan 3 (%)", "Pekan 4 (%)", "Pekan tercapai (ibadah)"],
      ...baris.map((b) => [b.s.nama, b.s.nim, b.tq || "-", ...b.q, b.totalQ, b.qD ? `${b.qN}/${b.qD}` : "-", b.ti, ...b.ib.map((x) => (x == null ? "-" : x)), b.iD ? `${b.iN}/${b.iD}` : "-"]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa); ws["!cols"] = [{ wch: 28 }, { wch: 14 }, ...Array(13).fill({ wch: 14 })];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, `Rekap ${bulan} ${tahun}`.slice(0, 31));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Nama", "NIM", ...JENIS_REKAP.map(([j, u]) => `${j} (${u})`)], ...jenisBulan.map(({ b, v }) => [b.s.nama, b.s.nim, ...JENIS_REKAP.map(([j, u]) => (u === "hlm" ? v[j].hlm : v[j].kali))])]), "Setoran per Jenis");
    XLSX.writeFile(wb, `Rekap-Pencapaian-${bulan}-${tahun}.xlsx`);
  }
  return (
    <div>
      {onBack && <BackBar onBack={onBack} />}
      <PageHeader eyebrow="Akademik" title="Rekap Pencapaian Seluruh Santri" sub="Hasil evaluasi pekanan terhadap target, untuk dipaparkan setiap bulan." actions={<div className="flex gap-2"><Btn tone="ghost" onClick={unduhExcel}>⬇ Unduh Excel</Btn><Btn tone="gold" onClick={() => window.print()}>🖨 Cetak / PDF</Btn></div>} />
      <div className="flex items-center gap-3 mb-5 flex-wrap print:hidden">
        <div className="inline-flex rounded-xl border border-stone-300 overflow-hidden text-sm font-bold">
          <button type="button" onClick={() => setMode("bulan")} className={`px-4 py-2 ${mode === "bulan" ? "bg-[#0B3B36] text-white" : "bg-white text-stone-600"}`}>Per Bulan</button>
          <button type="button" onClick={() => setMode("pekan")} className={`px-4 py-2 ${mode === "pekan" ? "bg-[#0B3B36] text-white" : "bg-white text-stone-600"}`}>Per Pekan</button>
        </div>
        <Select value={bulan} onChange={(e) => setBulan(e.target.value)} className="!w-auto">{BULAN.map((b) => <option key={b}>{b}</option>)}</Select>
        <Select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} className="!w-auto">{[nowYear - 1, nowYear, nowYear + 1].map((t) => <option key={t} value={t}>{t}</option>)}</Select>
        {mode === "pekan" && <>
          <Select value={pk} onChange={(e) => setPk(Number(e.target.value))} className="!w-auto">{pekan.map((p) => <option key={p.i} value={p.i}>Pekan {p.i + 1} (tgl {p.rentang})</option>)}</Select>
          <Select value={urut} onChange={(e) => setUrut(e.target.value)} className="!w-auto"><option value="belum">Belum tercapai di atas</option><option value="nama">Urut nama</option></Select>
        </>}
      </div>
      <style>{`@page { size: A4 landscape; margin: 10mm; } @media print { body * { visibility: hidden; } .rekappenc-print, .rekappenc-print * { visibility: visible; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .rekappenc-print { position: absolute; top: 0; left: 0; width: 100%; } }`}</style>
      <div className="rekappenc-print">
        <div className="hidden print:block mb-3" style={{ borderBottom: "2px solid #0B3B36", paddingBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0B3B36" }}>{brand.nama_pondok}</div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Rekap Pencapaian Seluruh Santri — {mode === "pekan" ? `Pekan ${pk + 1} (tgl ${pekan[pk].rentang}) ` : ""}{bulan} {tahun}</div>
        </div>
        {mode === "bulan" ? (
          <>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <StatCard label="Total Ziyadah" value={`${totalHal.toLocaleString("id-ID")} hlm`} sub={`${baris.length} mahasantri`} />
          <StatCard label="Memenuhi Target Ziyadah" value={`${penuhQ} / ${adaQ}`} sub="semua pekan berjalan" />
          <StatCard label="Memenuhi Target Ibadah" value={`${penuhI} / ${adaI}`} sub="semua pekan berjalan" />
          <StatCard label="Rata-rata Ibadah Terpenuhi" value={rataIb == null ? "-" : `${rataIb}%`} />
        </div>
        <RingkasanVisualRekap daftar={daftarBulan} wg={wg} judul={`${bulan} ${tahun}`} />
        <div className="grid grid-cols-2 gap-4 mb-5">
          <Card><h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-1">Santri yang Mencapai Target Ziyadah</h3><GrafikBatangPekan data={agregat("qOk")} satuan="%" max={100} warnaOk={wg.hafalan} warnaGagal={wg.ibadah_kurang} ringkasan="Persentase santri yang mencapai target hafalan tiap pekan." /></Card>
          <Card><h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-1">Santri yang Mencapai Target Ibadah</h3><GrafikBatangPekan data={agregat("iOk")} satuan="%" max={100} warnaOk={wg.ibadah_baik} warnaGagal={wg.ibadah_kurang} ringkasan="Persentase santri yang mencapai target ibadah tiap pekan." /></Card>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <Card><h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-3">Tren 6 Bulan — Ziyadah (halaman)</h3><VerticalBars data={trenHal} color={wg.hafalan} /></Card>
          <Card><h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-3">Tren 6 Bulan — Ibadah Terpenuhi (%)</h3><VerticalBars data={trenIb} color={wg.ibadah_baik} /></Card>
        </div>
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-stone-50 text-[0.625rem] uppercase text-stone-500"><th className="p-2 text-left" rowSpan={2}>Mahasantri</th><th className="p-2 border-l border-stone-200" colSpan={7}>Ziyadah (halaman)</th><th className="p-2 border-l border-stone-200" colSpan={6}>Ibadah terpenuhi (%)</th></tr>
              <tr className="bg-stone-50 text-[0.625rem] uppercase text-stone-500"><th className="p-2 border-l border-stone-200">Target</th><th className="p-2">P1</th><th className="p-2">P2</th><th className="p-2">P3</th><th className="p-2">P4</th><th className="p-2">Total</th><th className="p-2">Tercapai</th><th className="p-2 border-l border-stone-200">Target</th><th className="p-2">P1</th><th className="p-2">P2</th><th className="p-2">P3</th><th className="p-2">P4</th><th className="p-2">Tercapai</th></tr>
            </thead>
            <tbody>
              {baris.map((b) => (
                <tr key={b.s.nim} className="border-t border-stone-100 text-center">
                  <td className="p-2 text-left"><div className="font-bold text-[0.8rem]">{b.s.nama}</div><div className="text-[0.625rem] text-stone-400">{b.s.nim}</div></td>
                  <td className="p-2 border-l border-stone-100 text-stone-500">{b.tq || "-"}</td>
                  {b.q.map((v, i) => <td key={i} className="p-2" style={sel(b.qOk[i])}>{pekan[i].berjalan ? v : "-"}</td>)}
                  <td className="p-2 font-bold">{b.totalQ}</td>
                  <td className="p-2 font-bold">{b.qD ? `${b.qN}/${b.qD}` : "-"}</td>
                  <td className="p-2 border-l border-stone-100 text-stone-500">{b.ti}%</td>
                  {b.ib.map((v, i) => <td key={i} className="p-2" style={sel(b.iOk[i])}>{v == null ? "-" : `${v}%`}</td>)}
                  <td className="p-2 font-bold">{b.iD ? `${b.iN}/${b.iD}` : "-"}</td>
                </tr>
              ))}
              {baris.length === 0 && <tr><td colSpan={14}><Empty text="Belum ada mahasantri." /></td></tr>}
            </tbody>
          </table>
        </Card>
        <div className="text-[0.6875rem] text-stone-500 mt-2">P1 = tgl 1–7, P2 = 8–14, P3 = 15–21, P4 = 22–akhir bulan. Hijau = target tercapai, merah = belum tercapai, "-" = belum ada data atau target belum diisi.</div>
        <TabelSetoranJenis data={jenisBulan} judul={`Rekap Setoran per Jenis — ${bulan} ${tahun}`} sub="Jumlah halaman untuk Ziyadah, Murajaah, Tilawah, Tahsin, dan Talaqqi; jumlah kali untuk Tasmi' dan Syahadah." />
          </>
        ) : (
          <>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <StatCard label="Total Ziyadah" value={`${wkTotal.toLocaleString("id-ID")} hlm`} sub={`Pekan ${pk + 1}, tgl ${pekan[pk].rentang}`} />
          <StatCard label="Memenuhi Target Ziyadah" value={`${wkQN} / ${wkQD}`} sub="santri bertarget" />
          <StatCard label="Memenuhi Target Ibadah" value={`${wkIN} / ${wkID}`} sub="santri bercatatan" />
          <StatCard label="Rata-rata Ibadah Terpenuhi" value={wkRata == null ? "-" : `${wkRata}%`} />
        </div>
        <RingkasanVisualRekap daftar={daftarPekan} wg={wg} judul={`Pekan ${pk + 1} (tgl ${pekan[pk].rentang}) ${bulan} ${tahun}`} />
        {!pekan[pk].berjalan && <div className="text-sm text-stone-500 mb-3">Pekan ini belum berjalan, jadi belum ada penilaian.</div>}
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3">Mahasantri</th><th className="p-3">Ziyadah</th><th className="p-3">Ibadah terpenuhi</th></tr></thead>
            <tbody>
              {wkUrut.map(({ b, q, ib, qOk, iOk }) => (
                <tr key={b.s.nim} className="border-t border-stone-100">
                  <td className="p-3"><div className="font-bold">{b.s.nama}</div><div className="text-[0.6875rem] text-stone-400">{b.s.nim}</div></td>
                  <td className="p-3 min-w-[220px]">
                    <div className="flex items-center justify-between text-xs mb-1"><b>{pekan[pk].berjalan ? `${q} hlm` : "-"}</b><span style={sel(qOk)}>{qOk === null ? (b.tq ? "" : "target belum diisi") : qOk ? `Tercapai (target ${b.tq})` : `Belum tercapai (target ${b.tq})`}</span></div>
                    <div className="h-2.5 rounded-full bg-stone-100 overflow-hidden"><div style={{ width: `${b.tq > 0 ? Math.min(100, (q / b.tq) * 100) : 0}%`, backgroundColor: qOk === false ? wg.ibadah_kurang : wg.hafalan }} className="h-full rounded-full" /></div>
                  </td>
                  <td className="p-3 min-w-[220px]">
                    <div className="flex items-center justify-between text-xs mb-1"><b>{ib == null ? "-" : `${ib}%`}</b><span style={sel(iOk)}>{iOk === null ? "" : iOk ? `Tercapai (target ${b.ti}%)` : `Belum tercapai (target ${b.ti}%)`}</span></div>
                    <div className="h-2.5 rounded-full bg-stone-100 overflow-hidden"><div style={{ width: `${ib == null ? 0 : Math.min(100, (ib / b.ti) * 100)}%`, backgroundColor: iOk === false ? wg.ibadah_kurang : wg.ibadah_baik }} className="h-full rounded-full" /></div>
                  </td>
                </tr>
              ))}
              {wkUrut.length === 0 && <tr><td colSpan={3}><Empty text="Belum ada mahasantri." /></td></tr>}
            </tbody>
          </table>
        </Card>
        <TabelSetoranJenis data={jenisPekan} judul={`Rekap Setoran per Jenis — Pekan ${pk + 1} (tgl ${pekan[pk].rentang})`} sub="Jumlah halaman untuk Ziyadah, Murajaah, Tilawah, Tahsin, dan Talaqqi; jumlah kali untuk Tasmi' dan Syahadah." />
        <div className="text-[0.6875rem] text-stone-500 mt-2">Batang menunjukkan capaian terhadap target pekan itu (penuh = target tercapai). Santri yang belum mencapai target ditampilkan paling atas.</div>
          </>
        )}
        <div className="hidden print:block text-[10px] text-stone-500 mt-3">Dicetak {new Date().toLocaleString("id-ID")} dari SIAKAD</div>
      </div>
    </div>
  );
}
function RekapPencapaianPage({ profile }) {
  const brand = useContext(BrandContext);
  const santriT = useTable("santri");
  const quranT = useTable("quran_log");
  const ibadahT = useTable("ibadah_log");
  const daftar = santriT.rows;
  return <RekapPencapaian santriList={daftar} quranRows={quranT.rows} ibadahRows={ibadahT.rows} brand={brand} />;
}
/* ---------------------------------------------------------------------- */
/* Kartu Tanda Mahasantri (KTS)                                                 */
/* ---------------------------------------------------------------------- */
const KTS_TEKS = [
  ["judul", "Judul kartu (KARTU TANDA MAHASANTRI)", { size: 6.5, bold: false, italic: false, color: "#D5E6E1", font: "" }],
  ["pondok", "Nama pondok (header)", { size: 9, bold: true, italic: false, color: "#FFFFFF", font: "" }],
  ["nama", "Nama mahasantri", { size: 11, bold: true, italic: false, color: "#0B3B36", font: "" }],
  ["nim", "NIM", { size: 8, bold: true, italic: false, color: "#B8935A", font: "" }],
  ["data", "Angkatan, TTL, Gol. Darah", { size: 7.5, bold: false, italic: false, color: "#44544D", font: "" }],
  ["foot", "Tulisan bawah (sisi depan)", { size: 6, bold: false, italic: true, color: "#8A7F5E", font: "" }],
  ["yayasan", "Nama yayasan (sisi belakang)", { size: 8, bold: true, italic: false, color: "#0B3B36", font: "" }],
  ["alamat", "Alamat & kontak (sisi belakang)", { size: 7, bold: false, italic: false, color: "#44544D", font: "" }],
  ["pernyataan", "Pernyataan (sisi belakang)", { size: 6.3, bold: false, italic: false, color: "#6B7280", font: "" }],
];
function KartuSantriPage({ profile }) {
  const brand = useContext(BrandContext);
  const santriT = useTable("santri");
  const isViewer = profile.role !== "santri";
  const [nim, setNim] = useState(isViewer ? "" : profile.nim);
  const [q, setQ] = useState("");
  const KTS_DEFAULT = {
    skala: "100", marginAtas: "10", marginKiri: "10", jarak: "5", susunan: "kolom",
    hdrAlign: "tengah", hdrSusunan: "atas", logoUkuran: "26",
    fotoPos: "kiri", dataAlign: "kiri", footAlign: "tengah", belAlign: "tengah",
    qrPos: "kiri", qrUkuran: "38", qrTampil: "ya", ttdPos: "kanan", ttdUkuran: "22", ttdBentuk: "gambar", teks: {},
  };
  const [cfg, setCfg] = useState(() => {
    try { return { ...KTS_DEFAULT, ...JSON.parse(localStorage.getItem("siakad_kartu_cfg") || "{}") }; } catch { return KTS_DEFAULT; }
  });
  useEffect(() => { try { localStorage.setItem("siakad_kartu_cfg", JSON.stringify(cfg)); } catch {} }, [cfg]);
  const num = (v, d) => { const n = parseFloat(String(v).replace(",", ".")); return Number.isFinite(n) ? n : d; };
  const skala = Math.min(200, Math.max(30, num(cfg.skala, 100))) / 100;
  const mAtas = Math.max(0, num(cfg.marginAtas, 10));
  const mKiri = Math.max(0, num(cfg.marginKiri, 10));
  const jarak = Math.max(0, num(cfg.jarak, 5));
  const setC = (k) => (e) => setCfg((c) => ({ ...c, [k]: e.target.value }));
  const TA = { kiri: "left", tengah: "center", kanan: "right" };
  const FX = { kiri: "flex-start", tengah: "center", kanan: "flex-end" };
  const clamp = (v, d, lo, hi) => Math.min(hi, Math.max(lo, num(v, d)));
  const logoPx = clamp(cfg.logoUkuran, 26, 12, 60);
  const tv = (k) => ({ ...KTS_TEKS.find((x) => x[0] === k)[2], ...((cfg.teks || {})[k] || {}) });
  const ts = (k) => { const v = tv(k); return { fontSize: clamp(v.size, 8, 3, 30), fontWeight: v.bold ? 700 : 400, fontStyle: v.italic ? "italic" : "normal", color: v.color, ...(v.font && FONT_OPTIONS[v.font] ? { fontFamily: FONT_OPTIONS[v.font].heading } : {}) }; };
  const setT = (k, patch) => setCfg((c) => ({ ...c, teks: { ...(c.teks || {}), [k]: { ...((c.teks || {})[k] || {}), ...patch } } }));
  const qrPx = clamp(cfg.qrUkuran, 38, 20, 70);
  const ttdPx = clamp(cfg.ttdUkuran, 22, 10, 70);
  const seg = (k, opts) => (
    <div className="inline-flex gap-1">
      {opts.map(([v, l]) => (
        <button key={v} type="button" onClick={() => setCfg((c) => ({ ...c, [k]: v }))}
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${cfg[k] === v ? "bg-[#0B3B36] text-white border-[#0B3B36]" : "bg-white text-[#0B3B36] border-stone-300 hover:bg-stone-50"}`}>{l}</button>
      ))}
    </div>
  );
  const ALIGN3 = [["kiri", "Kiri"], ["tengah", "Tengah"], ["kanan", "Kanan"]];
  const santri = santriT.rows.find((s) => s.nim === nim);
  const daftar = santriT.rows.filter((s) => (s.status === "Aktif" || !s.status) && (s.nama.toLowerCase().includes(q.toLowerCase()) || s.nim.includes(q)));
  const fmtTgl = (d) => d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";

  const qrEl = santri ? (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(`${brand.nama_pondok || "SIAKAD"} | KTM | ${santri.nama} | NIM ${santri.nim}`)}`}
      alt="QR verifikasi"
      style={{ width: qrPx, height: qrPx }}
    />
  ) : null;
  const ttdBentuk = cfg.ttdBentuk || "gambar";
  const ttdQrEl = santri ? (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`TTD Digital | ${brand.nama_mudir || "Mudir"} | ${brand.nama_pondok || "SIAKAD"} | KTM ${santri.nama} | NIM ${santri.nim}`)}`}
      alt="QR tanda tangan digital"
      style={{ width: ttdPx, height: ttdPx, margin: "0 auto 1px" }}
    />
  ) : null;
  const ttdEl = (
    <div style={{ textAlign: "center", fontSize: 6.5 }}>
      {(ttdBentuk === "gambar" || ttdBentuk === "keduanya") && (
        brand.tanda_tangan_mudir_url ? (
          <img src={brand.tanda_tangan_mudir_url} alt="Tanda tangan Mudir" style={{ height: ttdPx, margin: "0 auto 1px" }} />
        ) : ttdBentuk === "gambar" ? <div style={{ height: ttdPx }}></div> : null
      )}
      {(ttdBentuk === "qr" || ttdBentuk === "keduanya") && ttdQrEl}
      <div style={{ borderTop: "1px solid #bbb", paddingTop: 1, color: "#0B3B36", fontWeight: 700 }}>{brand.nama_mudir}</div>
      <div style={{ color: "#8A8A8A" }}>Mudir Pondok</div>
    </div>
  );

  return (
    <div>
      <PageHeader title="Kartu Tanda Mahasantri" sub="Kartu identitas resmi mahasantri, bisa dicetak." actions={santri && <Btn tone="ghost" onClick={() => window.print()}>🖨 Cetak Kartu</Btn>} />

      {isViewer && !nim && (
        <>
          <div className="mb-4 max-w-sm"><Input placeholder="Cari nama atau NIM…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <PerAngkatan santri={santriT.rows.filter((x) => x.status === "Aktif" || !x.status)} cari={q} kunci="kartu">{(cocok) => (
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3.5">Mahasantri</th><th className="p-3.5">NIM</th></tr></thead>
              <tbody>
                {daftar.filter(cocok).map((s) => (
                  <tr key={s.nim} className="border-t border-stone-100 cursor-pointer hover:bg-stone-50/60" onClick={() => setNim(s.nim)}>
                    <td className="p-3.5 font-semibold">{s.nama}</td>
                    <td className="p-3.5 text-stone-500">{s.nim}</td>
                  </tr>
                ))}
                {daftar.length === 0 && <tr><td colSpan={2}><Empty text="Tidak ada santri yang cocok." /></td></tr>}
              </tbody>
            </table>
          </Card>
          )}</PerAngkatan>
        </>
      )}

      {santri && (
        <>
          <style>{`
            .kts-print { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; zoom: 1.4; }
            .kts-side { width: 85.6mm; zoom: ${skala}; }
            .kts-label { font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #8A7F5E; margin-bottom: 6px; }
            @media print {
              @page { margin: 0; }
              body * { visibility: hidden; }
              .kts-print, .kts-print * { visibility: visible; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .kts-print { position: absolute; top: ${mAtas}mm; left: ${mKiri}mm; zoom: 1; flex-direction: ${cfg.susunan === "baris" ? "row" : "column"}; flex-wrap: nowrap; gap: ${jarak}mm; width: auto; }
              .kts-label, .kts-hint { display: none !important; }
            }
          `}</style>
          {isViewer && (
          <Card className="mb-4 kts-hint">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold">Atur Ukuran &amp; Margin Cetak</h3>
              <Btn tone="ghost" onClick={() => setCfg(KTS_DEFAULT)}>Kembalikan ke Bawaan</Btn>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ["skala", "Ukuran kartu (%)", "30–200"],
                ["marginAtas", "Margin atas (mm)", "jarak dari tepi atas kertas"],
                ["marginKiri", "Margin kiri (mm)", "jarak dari tepi kiri kertas"],
                ["jarak", "Jarak depan–belakang (mm)", ""],
              ].map(([k, label, hint]) => (
                <label key={k} className="block">
                  <span className="block text-[0.6875rem] font-bold uppercase tracking-wide text-stone-500 mb-1">{label}</span>
                  <input type="number" step="any" min="0" value={cfg[k]} onChange={setC(k)} className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm" />
                  {hint && <span className="block text-[0.625rem] text-stone-400 mt-1">{hint}</span>}
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-[0.6875rem] font-bold uppercase tracking-wide text-stone-500">Susunan saat dicetak:</span>
              {[["kolom", "Atas–bawah"], ["baris", "Berdampingan"]].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setCfg((c) => ({ ...c, susunan: v }))}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${cfg.susunan === v ? "bg-[#0B3B36] text-white border-[#0B3B36]" : "bg-white text-[#0B3B36] border-stone-300 hover:bg-stone-50"}`}>{l}</button>
              ))}
            </div>
            <div className="border-t border-stone-100 mt-4 pt-4">
              <div className="text-[0.6875rem] font-extrabold text-[#B8935A] uppercase tracking-[0.1em] mb-3">Tata Letak Kartu</div>
              <div className="grid gap-3">
                {[
                  ["Judul & logo (header)", seg("hdrAlign", ALIGN3)],
                  ["Susunan logo & judul", seg("hdrSusunan", [["atas", "Logo di atas"], ["samping", "Logo di samping"]])],
                  ["Posisi foto", seg("fotoPos", [["kiri", "Kiri"], ["kanan", "Kanan"]])],
                  ["Rata data mahasantri", seg("dataAlign", ALIGN3)],
                  ["Rata tulisan bawah (depan)", seg("footAlign", ALIGN3)],
                  ["Rata tulisan sisi belakang", seg("belAlign", ALIGN3)],
                  ["QR code terpisah" + ((cfg.ttdBentuk === "qr" || cfg.ttdBentuk === "keduanya") ? " (otomatis tersembunyi karena TTD sudah memakai QR)" : ""), seg("qrTampil", [["ya", "Tampilkan"], ["tidak", "Sembunyikan"]])],
                  ["Posisi QR code terpisah", seg("qrPos", ALIGN3)],
                  ["Bentuk tanda tangan", seg("ttdBentuk", [["gambar", "Gambar TTD"], ["qr", "QR code"], ["keduanya", "Keduanya"]])],
                  ["Posisi tanda tangan", seg("ttdPos", ALIGN3)],
                ].map(([label, ctrl]) => (
                  <div key={label} className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm text-stone-600">{label}</span>
                    {ctrl}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  ["logoUkuran", "Ukuran logo (px)", "12–60"],
                  ["qrUkuran", "Ukuran QR (px)", "20–70"],
                  ["ttdUkuran", "Ukuran tanda tangan / QR TTD (px)", "10–70"],
                ].map(([k, label, hint]) => (
                  <label key={k} className="block">
                    <span className="block text-[0.6875rem] font-bold uppercase tracking-wide text-stone-500 mb-1">{label}</span>
                    <input type="number" step="any" value={cfg[k]} onChange={setC(k)} className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm" />
                    <span className="block text-[0.625rem] text-stone-400 mt-1">{hint}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="border-t border-stone-100 mt-4 pt-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="text-[0.6875rem] font-extrabold text-[#B8935A] uppercase tracking-[0.1em]">Gaya Tulisan (ukuran, font, tebal, miring, warna)</div>
                <Btn tone="ghost" onClick={() => setCfg((c) => ({ ...c, teks: {} }))}>Kembalikan gaya tulisan</Btn>
              </div>
              <div className="grid gap-2">
                {KTS_TEKS.map(([k, label]) => {
                  const v = tv(k);
                  return (
                    <div key={k} className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-stone-600 w-60">{label}</span>
                      <input type="number" step="0.5" min="3" max="30" value={v.size} onChange={(e) => setT(k, { size: e.target.value })} title="Ukuran huruf (px)" className="w-20 px-2 py-1.5 border border-stone-300 rounded-lg text-sm" />
                      <select value={v.font || ""} onChange={(e) => setT(k, { font: e.target.value })} className="px-2 py-1.5 border border-stone-300 rounded-lg text-sm bg-white">
                        <option value="">Font bawaan</option>
                        {Object.entries(FONT_OPTIONS).map(([key, f]) => <option key={key} value={key}>{f.label}</option>)}
                      </select>
                      <button type="button" onClick={() => setT(k, { bold: !v.bold })} title="Tebal" className={`w-8 h-8 rounded-lg border text-sm font-extrabold ${v.bold ? "bg-[#0B3B36] text-white border-[#0B3B36]" : "bg-white text-stone-600 border-stone-300"}`}>B</button>
                      <button type="button" onClick={() => setT(k, { italic: !v.italic })} title="Miring" className={`w-8 h-8 rounded-lg border text-sm italic font-semibold ${v.italic ? "bg-[#0B3B36] text-white border-[#0B3B36]" : "bg-white text-stone-600 border-stone-300"}`}>I</button>
                      <input type="color" value={v.color} onChange={(e) => setT(k, { color: e.target.value })} title="Warna tulisan" className="w-9 h-8 p-0 border border-stone-300 rounded-lg cursor-pointer bg-white" />
                    </div>
                  );
                })}
              </div>
              <p className="text-[0.625rem] text-stone-400 mt-2">Ukuran dalam piksel pada kartu (contoh nama 11, data 7,5). Perubahan langsung terlihat pada pratinjau di bawah.</p>
            </div>
            <p className="text-xs text-stone-400 mt-3">Pengaturan tersimpan di perangkat ini. Saat jendela cetak muncul, pastikan opsi <b>Margin</b> di browser diatur ke <b>Bawaan</b> atau <b>Tidak ada</b>.</p>
          </Card>
          )}
          {isViewer && <BackBar onBack={() => setNim("")} />}

          <div className="kts-hint text-xs text-stone-500 mb-3">Pratinjau kartu. Ukuran saat dicetak: {(85.6 * skala).toFixed(1).replace(".", ",")} × {(54 * skala).toFixed(1).replace(".", ",")} mm (kartu ATM standar: 85,6 × 54 mm).</div>
          <div className="kts-print">
            {/* ===== Sisi Depan ===== */}
            <div className="kts-side">
            <div className="kts-label">Sisi Depan</div>
            <div style={{
              width: "85.6mm", height: "54mm", borderRadius: 10, overflow: "hidden", position: "relative",
              background: "#FBF8F1", color: "#0B3B36", border: "1px solid #E7DFCB",
              fontFamily: fontFamilyOf(brand, "font_judul"), boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ background: `linear-gradient(120deg, ${brand.warna_utama || "#0B3B36"}, #04100a)`, padding: "6px 10px", display: "flex", flexDirection: cfg.hdrSusunan === "samping" ? "row" : "column", alignItems: cfg.hdrSusunan === "samping" ? "center" : FX[cfg.hdrAlign], justifyContent: cfg.hdrSusunan === "samping" ? FX[cfg.hdrAlign] : "center", gap: cfg.hdrSusunan === "samping" ? 7 : 3, textAlign: TA[cfg.hdrAlign], borderBottom: "2px solid #B8935A" }}>
                {brand.logo_url && <img src={brand.logo_url} alt="logo" style={{ width: logoPx, height: logoPx, objectFit: "contain" }} />}
                <div style={{ lineHeight: 1.15, color: "#fff" }}>
                  <div style={{ letterSpacing: 1, ...ts("judul") }}>KARTU TANDA MAHASANTRI</div>
                  <div style={ts("pondok")}>{brand.nama_pondok || "Darul Hikmah"}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: cfg.fotoPos === "kanan" ? "row-reverse" : "row", gap: 10, padding: "9px 10px", flex: 1 }}>
                <div style={{ width: 50, height: 62, borderRadius: 6, overflow: "hidden", background: "#EFE8D4", flexShrink: 0, border: "1px solid #DCCFA0" }}>
                  {santri.foto_url ? <img src={santri.foto_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div className="w-full h-full flex items-center justify-center text-[1.125rem] font-bold text-[#B8935A]">{initials(santri.nama)}</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: TA[cfg.dataAlign] }}>
                  <div style={{ lineHeight: 1.2, ...ts("nama") }}>{santri.nama}</div>
                  <div style={{ marginBottom: 5, ...ts("nim") }}>NIM {santri.nim}</div>
                  <div style={{ lineHeight: 1.6, ...ts("data") }}>
                    <div>Angkatan: {santri.angkatan || "-"}</div>
                    <div>TTL: {santri.tempat_lahir || "-"}, {fmtTgl(santri.tanggal_lahir)}</div>
                    <div>Gol. Darah: {santri.golongan_darah || "-"}</div>
                  </div>
                </div>
              </div>
              <div style={{ borderTop: "1px solid #E7DFCB", padding: "3px 10px", textAlign: TA[cfg.footAlign], ...ts("foot") }}>Berlaku selama aktif sebagai mahasantri</div>
            </div>

            </div>

            {/* ===== Sisi Belakang ===== */}
            <div className="kts-side">
            <div className="kts-label">Sisi Belakang</div>
            <div style={{
              width: "85.6mm", height: "54mm", borderRadius: 10, overflow: "hidden", position: "relative",
              background: "#FBF8F1", border: "1px solid #E7DFCB", boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
            }}>
              <div style={{ borderTop: "3px solid #B8935A" }}></div>
              <div style={{ padding: "8px 10px 0", lineHeight: 1.5, textAlign: TA[cfg.belAlign] }}>
                <div style={{ marginBottom: 2, ...ts("yayasan") }}>{brand.yayasan_nama}</div>
                <div style={ts("alamat")}>{brand.alamat_pondok}</div>
                <div style={{ ...ts("alamat"), fontStyle: "italic" }}>Contact: {brand.kontak_pondok}</div>
              </div>
              <div style={{ padding: "0 10px", lineHeight: 1.5, textAlign: TA[cfg.belAlign], ...ts("pernyataan") }}>
                Kartu ini adalah identitas resmi mahasantri Pondok Tahfidz Qur'an dan Entrepreneur Darul Hikmah.
                Jika ditemukan, mohon dikembalikan ke alamat pondok di atas.
              </div>
              <div style={{ padding: "0 10px 9px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "end" }}>
                {["kiri", "tengah", "kanan"].map((pos) => (
                  <div key={pos} style={{ display: "flex", alignItems: "flex-end", gap: 8, justifyContent: FX[pos] }}>
                    {cfg.qrTampil !== "tidak" && ttdBentuk === "gambar" && cfg.qrPos === pos && qrEl}
                    {cfg.ttdPos === pos && ttdEl}
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Akademik santri — gabungan KRS + KHS                                    */
/* ---------------------------------------------------------------------- */
function AkademikSantriPage({ profile, tabAwal = "krs" }) {
  const brand = useContext(BrandContext);
  const akT = useTable("akademik");
  const tahapT = useTable("tahapan_akhir");
  const [tab, setTab] = useState(tabAwal);
  const santriT = useTable("santri");
  const quranLogT = useTable("quran_log");
  const profilesT = useTable("profiles");
  const santri = santriT.rows.find((s) => s.nim === profile.nim);
  const quranLogs = quranLogT.rows.filter((l) => l.nim === profile.nim);
  const pembimbing = profilesT.rows.find((p) => p.username === santri?.musyrif_username);

  const semesters = [...new Set(akT.rows.map((r) => `${r.tahun_ajaran}|${r.semester}`))].sort().reverse();
  const [pilihan, setPilihan] = useState(semesters[0] || "");
  const [dokType, setDokType] = useState("KRS");
  useEffect(() => { if (!pilihan && semesters[0]) setPilihan(semesters[0]); }, [semesters.join(",")]);

  const [ta, sem] = pilihan ? pilihan.split("|") : [null, null];
  const recordsSemester = pilihan ? akT.rows.filter((r) => r.tahun_ajaran === ta && r.semester === sem) : [];

  return (
    <div>
      <PageHeader title="Akademik" sub="KRS, KHS, serta tahapan tugas akhir dan ujian Anda." />
      <TabAkademik tab={tab} setTab={setTab} rows={tahapT.rows.filter((t) => t.nim === profile.nim)} />
      {tab === "akhir" && <TugasAkhirPanel nim={profile.nim} profile={profile} rows={tahapT.rows} reload={tahapT.reload} />}
      <div className={tab === "krs" ? "" : "hidden"}>

      <div className={`mb-5 max-w-xs ${dokType === "Transkrip" ? "hidden" : ""}`}>
        <Select value={pilihan} onChange={(e) => setPilihan(e.target.value)}>
          {semesters.length === 0 && <option value="">Belum ada data</option>}
          {semesters.map((s) => { const [ta2, sem2] = s.split("|"); return <option key={s} value={s}>{ta2} · Semester {sem2}</option>; })}
        </Select>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .krs-print, .krs-print * { visibility: visible; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
          .krs-print { position: absolute; top: 0; left: 0; width: 100%; padding: 24px 32px; box-shadow: none !important; border: none !important; }
        }
      `}</style>
      <div className="flex items-center justify-between mb-2">
        <div className="inline-flex rounded-lg border border-stone-300 overflow-hidden">
          <button onClick={() => setDokType("KRS")} className={`px-4 py-1.5 text-xs font-bold ${dokType === "KRS" ? "bg-[#0B3B36] text-white" : "bg-white text-stone-500"}`}>KRS</button>
          <button onClick={() => setDokType("KHS")} className={`px-4 py-1.5 text-xs font-bold ${dokType === "KHS" ? "bg-[#0B3B36] text-white" : "bg-white text-stone-500"}`}>KHS</button>
          <button onClick={() => setDokType("Transkrip")} className={`px-4 py-1.5 text-xs font-bold ${dokType === "Transkrip" ? "bg-[#0B3B36] text-white" : "bg-white text-stone-500"}`}>Transkrip</button>
        </div>
        <Btn tone="ghost" onClick={() => window.print()}>🖨️ Cetak {dokType}</Btn>
      </div>

      <div className="krs-print bg-white rounded-2xl border border-stone-200 shadow-sm p-8 mb-6">
        <table style={{ width: "100%", marginBottom: 14 }}><tbody><tr>
          <td style={{ width: 90, verticalAlign: "middle" }}>{(brand.logo_dokumen_url || brand.logo_url) && <img src={brand.logo_dokumen_url || brand.logo_url} alt="logo" style={{ width: 80 }} />}</td>
          <td style={{ verticalAlign: "middle" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0B3B36" }}>{brand.yayasan_nama}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0B3B36" }}>PONDOK TAHFIDZ QURAN DAN ENTREPRENEUR {brand.nama_pondok?.toUpperCase()}</div>
            <div style={{ fontSize: 10.5, color: "#44544D" }}>{brand.alamat_pondok}</div>
            <div style={{ fontSize: 10.5, color: "#44544D", fontStyle: "italic" }}>Contact: {brand.kontak_pondok}</div>
          </td>
        </tr></tbody></table>

        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15 }}>{dokType === "Transkrip" ? "TRANSKRIP NILAI" : dokType === "KRS" ? "KARTU RENCANA STUDI (KRS)" : "KARTU HASIL STUDI (KHS)"}</div>
        <div style={{ textAlign: "center", fontSize: 11, paddingBottom: 6, marginBottom: 16 }}>
          {dokType === "Transkrip" ? "Riwayat studi seluruh semester" : <>Semester {sem || "-"} {ta || ""}</>}
        </div>

        <div style={{ fontSize: 11, marginBottom: 3, display: "flex" }}><span style={{ width: 130 }}>Nama Mahasantri</span><span>: {santri?.nama}</span></div>
        <div style={{ fontSize: 11, marginBottom: 3, display: "flex" }}><span style={{ width: 130 }}>NIM</span><span>: {santri?.nim}</span></div>
        {dokType === "Transkrip" ? <div style={{ marginBottom: 14 }} /> : <div style={{ fontSize: 11, marginBottom: 14, display: "flex" }}><span style={{ width: 130 }}>Semester</span><span>: {semesterKeDari(akT.rows, ta, sem)}</span></div>}

        {dokType === "Transkrip" ? (
        <TranskripNilai records={akT.rows} santri={santri} tahap={tahapT.rows.filter((t) => t.nim === profile.nim)} />
        ) : dokType === "KRS" ? (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5, marginBottom: 8 }}>
          <thead><tr style={{ background: "#0B3B36", color: "#fff" }}>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>No</th>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>Kode MK</th>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>Mata Kuliah</th>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>SKS</th>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>Pengajar</th>
          </tr></thead>
          <tbody>
            {recordsSemester.map((r, i) => (
              <tr key={r.id}>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{i + 1}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{r.kode_mk || "-"}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5 }}>{r.mata_kuliah}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{r.sks}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5 }}>{r.pengajar || "-"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><td colSpan={3} style={{ border: "1px solid #1F2937", padding: 5, textAlign: "right", fontWeight: 700 }}>Total SKS</td><td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center", fontWeight: 700 }}>{recordsSemester.reduce((a, r) => a + Number(r.sks || 0), 0)}</td><td style={{ border: "1px solid #1F2937", padding: 5 }}></td></tr></tfoot>
        </table>
        ) : (
        <>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5, marginBottom: 0 }}>
          <thead>
            <tr style={{ background: "#0B3B36", color: "#fff" }}>
              <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 5 }}>No</th>
              <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 5 }}>Kode MK</th>
              <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 5 }}>Mata Kuliah</th>
              <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 5 }}>SKS</th>
              <th colSpan={3} style={{ border: "1px solid #1F2937", padding: 5 }}>Nilai</th>
              <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 5 }}>Total<br/>Bobot</th>
              <th rowSpan={2} style={{ border: "1px solid #1F2937", padding: 5 }}>Ket</th>
            </tr>
            <tr style={{ background: "#0B3B36", color: "#fff" }}>
              <th style={{ border: "1px solid #1F2937", padding: "2px 5px", fontWeight: 700 }}>Angka</th>
              <th style={{ border: "1px solid #1F2937", padding: "2px 5px", fontWeight: 700 }}>Predikat</th>
              <th style={{ border: "1px solid #1F2937", padding: "2px 5px", fontWeight: 700 }}>Bobot</th>
            </tr>
          </thead>
          <tbody>
            {recordsSemester.map((r, i) => {
              const ada = r.nilai_angka != null;
              const b = ada ? bobot(nilaiHuruf(r.nilai_angka)) : 0;
              return (
              <tr key={r.id}>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{i + 1}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{r.kode_mk || "-"}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5 }}>{r.mata_kuliah}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{r.sks}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{ada ? r.nilai_angka : "-"}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{ada ? nilaiHuruf(r.nilai_angka) : "-"}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{ada ? b.toFixed(2) : "-"}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{ada ? (b * Number(r.sks || 0)).toFixed(2) : "-"}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>-</td>
              </tr>
              );
            })}
            <tr style={{ background: "#F3EEE1", fontWeight: 700 }}>
              <td colSpan={3} style={{ border: "1px solid #1F2937", padding: "5px 10px 5px 5px", textAlign: "right" }}>JUMLAH</td>
              <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{recordsSemester.reduce((a, r) => a + Number(r.sks || 0), 0)}</td>
              <td colSpan={3} style={{ border: "1px solid #1F2937", padding: 5 }}></td>
              <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{recordsSemester.reduce((a, r) => a + (r.nilai_angka != null ? bobot(nilaiHuruf(r.nilai_angka)) * Number(r.sks || 0) : 0), 0).toFixed(2)}</td>
              <td style={{ border: "1px solid #1F2937", padding: 5 }}></td>
            </tr>
          </tbody>
        </table>
        <table style={{ width: "100%", fontSize: 10.5, marginTop: 6, marginBottom: 16 }}><tbody>
          <tr>
            <td style={{ verticalAlign: "top" }}>
              <div>Indeks Prestasi (IP) : <b>{(() => {
                const sel = recordsSemester.filter((r) => r.status === "selesai");
                const tot = sel.reduce((a, r) => a + Number(r.sks || 0), 0);
                return tot ? (sel.reduce((a, r) => a + bobot(nilaiHuruf(r.nilai_angka)) * Number(r.sks || 0), 0) / tot).toFixed(2) : "-";
              })()}</b></div>
              <div>Indeks Prestasi Kumulatif (IPK) : <b>{(() => {
                const sel = bestPerKode(akT.rows.filter((r) => r.status === "selesai"));
                const tot = sel.reduce((a, r) => a + Number(r.sks || 0), 0);
                return tot ? (sel.reduce((a, r) => a + bobot(nilaiHuruf(r.nilai_angka)) * Number(r.sks || 0), 0) / tot).toFixed(2) : "-";
              })()}</b></div>
            </td>
            <td style={{ textAlign: "right", verticalAlign: "top", fontSize: 9.5, color: "#44544D" }}>
              Keterangan Bobot:<br/>
              A = 4.00 &nbsp;&nbsp; B = 3.00<br/>
              C = 2.00 &nbsp;&nbsp; D = 1.00<br/>
              E = 0.00
            </td>
          </tr>
        </tbody></table>
        <div style={{ border: "1px solid #E7DFCB", background: "#FBF8F1", borderRadius: 6, padding: "10px 14px", marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#0B3B36", marginBottom: 4 }}>Rekapitulasi Capaian Al-Qur'an</div>
          <div style={{ fontSize: 10.5 }}><b>Total Hafalan Dikuasai:</b> {santri?.juz_dikuasai?.length || 0} dari 30 Juz</div>
        </div>
        </>
        )}
        {adaBintang(dokType === "Transkrip" ? akT.rows : recordsSemester) && <div style={{ fontSize: 9.5, fontStyle: "italic", color: "#44403C", marginTop: 6, lineHeight: 1.45 }}>{brand.catatan_krs || CATATAN_KRS_BAWAAN}</div>}

        <div style={{ fontSize: 10.5, ...ttdBlokStyle(brand, 24) }}>
          <div>{brand.kota_pondok || "Aceh Besar"}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
          <div style={jabatanStyle(brand)}>{brand.jabatan_ttd || DEFAULT_JABATAN_TTD}</div>
          <div style={{ display: "flex", justifyContent: isiAlign(brand).flex, marginTop: 10, marginBottom: 6 }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${brand.nama_pondok || "SIAKAD"} | ${dokType} | NIM ${santri?.nim} | ${ta} Semester ${sem}`)}`}
              alt="QR verifikasi tanda tangan"
              style={{ width: 56, height: 56 }}
            />
          </div>
          {brand.tanda_tangan_mudir_url ? (
            <div><img src={brand.tanda_tangan_mudir_url} alt="Tanda tangan Mudir" style={{ height: 46, margin: isiAlign(brand).img }} /></div>
          ) : null}
          <div style={{ borderTop: brand.tanda_tangan_mudir_url ? "1px solid #999" : "none", paddingTop: brand.tanda_tangan_mudir_url ? 2 : 0 }}><b>{brand.nama_mudir}</b></div>
          <div>NIP. {brand.nip_mudir || "-"}</div>
        </div>
        <DokumenQR dokType={dokType} nim={santri?.nim} ta={ta} sem={sem} pondok={brand.nama_pondok} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total SKS Diambil" value={akT.rows.reduce((a, r) => a + Number(r.sks || 0), 0)} />
        <StatCard label="IPK Kumulatif" value={(() => {
          const selesai = bestPerKode(akT.rows.filter((r) => r.status === "selesai"));
          const tot = selesai.reduce((a, r) => a + Number(r.sks || 0), 0);
          return tot ? (selesai.reduce((a, r) => a + bobot(nilaiHuruf(r.nilai_angka)) * Number(r.sks || 0), 0) / tot).toFixed(2) : "-";
        })()} />
        <StatCard label="Mata Kuliah Selesai" value={`${akT.rows.filter((r) => r.status === "selesai").length} dari ${akT.rows.length}`} />
      </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Capaian Al-Qur'an — overview semua santri + drill-down          */
/* ---------------------------------------------------------------------- */
function QuranPage({ profile }) {
  const editable = canEdit(profile.role, "quran");
  const santriT = useTable("santri");
  const logT = useTable("quran_log");
  const isViewer = profile.role !== "santri";
  const [nim, setNim] = useState(isViewer ? "" : profile.nim);
  const [showForm, setShowForm] = useState(false);
  const santri = santriT.rows.find((s) => s.nim === nim);
  const logs = logT.rows.filter((l) => l.nim === nim).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const pickable = [...santriT.rows].sort((a, b) => (b.musyrif_username === profile.username) - (a.musyrif_username === profile.username));

  const [filterTahun, setFilterTahun] = useState("");
  const [filterBulan, setFilterBulan] = useState("");
  const tahunTersedia = [...new Set(logs.map((l) => l.tanggal?.slice(0, 4)).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  const filteredLogs = logs.filter((l) => {
    if (!l.tanggal) return true;
    const [y, m] = l.tanggal.split("-");
    if (filterTahun && y !== filterTahun) return false;
    if (filterBulan && m !== filterBulan) return false;
    return true;
  });

  const [catatan, setCatatan] = useState("");
  useEffect(() => { setCatatan(santri?.catatan_quran || ""); }, [santri?.nim]);
  async function saveCatatan() {
    const { error } = await supabase.from("santri").update({ catatan_quran: catatan }).eq("nim", nim);
    if (error) { alert(error.message); return; }
    santriT.reload();
  }

  const [editingLog, setEditingLog] = useState(null);
  async function saveLog(f) {
    const { tandai, ...payload } = f;
    const cleanPayload = { ...payload, juz: Number(f.juz), halaman_dari: Number(f.halaman_dari), halaman_sampai: Number(f.halaman_sampai) };
    if (editingLog) {
      const { error } = await supabase.from("quran_log").update(cleanPayload).eq("id", editingLog.id);
      if (error) { alert(error.message); return; }
      setEditingLog(null);
    } else {
      const { error } = await supabase.from("quran_log").insert({ ...cleanPayload, nim, musyrif: profile.nama });
      if (error) { alert(error.message); return; }
      setShowForm(false);
    }
    if (tandai && santri && !santri.juz_dikuasai.includes(Number(f.juz))) {
      await supabase.from("santri").update({ juz_dikuasai: [...santri.juz_dikuasai, Number(f.juz)] }).eq("nim", nim);
      santriT.reload();
    }
    logT.reload();
  }
  async function removeLog(id) {
    if (!confirm("Hapus catatan setoran ini?")) return;
    const { error } = await supabase.from("quran_log").delete().eq("id", id);
    if (error) alert(error.message); else logT.reload();
  }

  if (isViewer && !nim) {
    return (
      <div>
        <PageHeader title="Capaian Al-Qur'an" sub="Semua santri — klik salah satu untuk lihat detail." />
        <PerAngkatan santri={pickable} kunci="quran">{(cocok) => (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3.5">Mahasantri</th><th className="p-3.5">Juz Dikuasai</th><th className="p-3.5">Setoran Terakhir</th></tr></thead>
            <tbody>
              {pickable.filter(cocok).map((s) => {
                const last = logT.rows.filter((l) => l.nim === s.nim).sort((a, b) => b.tanggal.localeCompare(a.tanggal))[0];
                return (
                  <tr key={s.nim} className="border-t border-stone-100 hover:bg-stone-50/60 cursor-pointer" onClick={() => setNim(s.nim)}>
                    <td className="p-3.5"><div className="flex items-center gap-3"><Avatar name={s.nama} size={30} /><div><div className="font-bold">{s.nama}</div><div className="text-[0.6875rem] text-stone-400">{s.nim}</div></div></div></td>
                    <td className="p-3.5"><Badge tone="gold">{s.juz_dikuasai?.length || 0} juz</Badge></td>
                    <td className="p-3.5 text-stone-500">{last ? `${last.tanggal} · ${last.jenis}` : "-"}</td>
                  </tr>
                );
              })}
              {pickable.length === 0 && <tr><td colSpan={3}><Empty text="Belum ada data mahasantri." /></td></tr>}
            </tbody>
          </table>
        </Card>
        )}</PerAngkatan>
      </div>
    );
  }

  return (
    <div>
      {isViewer && <BackBar onBack={() => setNim("")} />}
      <PageHeader title={isViewer ? (santri?.nama || "Capaian Al-Qur'an") : "Capaian Al-Qur'an"}
        actions={(!isViewer || editable) && <div className="flex gap-2">{editable && isViewer && <Btn onClick={() => setShowForm(true)}>+ Catat Setoran</Btn>}{!isViewer && <Btn tone="gold" onClick={() => window.print()}>🖨 Unduh PDF</Btn>}</div>} />
      {santri && (
        <>
        <div className="grid grid-cols-4 xl:grid-cols-7 gap-3 mb-5">
          {JENIS_SETORAN_QURAN.map((j) => {
            const hal = logs.filter((l) => l.jenis === j).reduce((a, l) => a + (l.halaman_dari && l.halaman_sampai ? Math.max(0, Number(l.halaman_sampai) - Number(l.halaman_dari) + 1) : 0), 0);
            return <StatCard key={j} label={j} value={`${hal} hal`} sub={`~${(hal / 20).toFixed(1)} juz`} />;
          })}
        </div>
        <GrafikPekananPanel kind="quran" logs={logs} santri={santri} />
        <div className="grid grid-cols-[0.85fr_1.3fr] gap-4 items-start">
          <Card><h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-3">Peta Hafalan</h3><JuzTracker juz={santri.juz_dikuasai || []} /></Card>
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center gap-2 p-3 border-b border-stone-100">
              <span className="text-xs text-stone-500 mr-1">Filter:</span>
              <Select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="!w-auto py-1.5 text-xs">
                <option value="">Semua Bulan</option>
                {BULAN.map((b, i) => <option key={b} value={String(i + 1).padStart(2, "0")}>{b}</option>)}
              </Select>
              <Select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="!w-auto py-1.5 text-xs">
                <option value="">Semua Tahun</option>
                {tahunTersedia.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
              {(filterBulan || filterTahun) && <button onClick={() => { setFilterBulan(""); setFilterTahun(""); }} className="text-xs text-stone-400 hover:text-stone-600">Reset</button>}
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase text-stone-500"><th className="p-3 whitespace-nowrap">Tgl</th><th className="p-3 whitespace-nowrap">Jenis</th><th className="p-3 whitespace-nowrap">Juz &amp; Hal.</th><th className="p-3 whitespace-nowrap">Penilaian</th><th className="p-3 whitespace-nowrap">Catatan</th>{editable && isViewer && <th className="p-3 text-right whitespace-nowrap">Aksi</th>}</tr></thead>
              <tbody>{filteredLogs.map((l) => (
                <tr key={l.id} className="border-t border-stone-100 align-top">
                  <td className="p-3 whitespace-nowrap">{l.tanggal}</td>
                  <td className="p-3 whitespace-nowrap">{l.jenis}</td>
                  <td className="p-3 whitespace-nowrap">Juz {l.juz}{l.halaman_dari ? <div className="text-[0.6875rem] text-stone-400">hal. {l.halaman_dari}–{l.halaman_sampai}</div> : null}</td>
                  <td className="p-3 whitespace-nowrap"><Badge tone={["Lancar", "Sudah Baik", "Paham"].includes(l.kelancaran) ? "green" : "gold"}>{l.kelancaran || "-"}</Badge></td>
                  <td className="p-3 text-stone-500 max-w-[160px]">{l.catatan || "-"}</td>
                  {editable && isViewer && <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => setEditingLog(l)} className="text-[#145048] text-xs font-bold mr-3">Edit</button>
                    <button onClick={() => removeLog(l.id)} className="text-red-600 text-xs font-bold">Hapus</button>
                  </td>}
                </tr>
              ))}
                {filteredLogs.length === 0 && <tr><td colSpan={editable && isViewer ? 6 : 5}><Empty text="Belum ada catatan." /></td></tr>}</tbody>
            </table>
            </div>
          </Card>
        </div>
        <Card className="mt-4">
          <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-3">Catatan Musyrif/Musyrifah</h3>
          {editable ? (
            <>
              <textarea className="w-full border border-stone-200 rounded-lg p-3 text-sm" rows={3} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Tulis catatan perkembangan mahasantri di sini..." />
              <div className="mt-2 text-right"><Btn onClick={saveCatatan}>Simpan Catatan</Btn></div>
            </>
          ) : (
            <p className="text-sm text-stone-600 whitespace-pre-wrap">{santri.catatan_quran || "Belum ada catatan."}</p>
          )}
        </Card>
        </>
      )}
      {showForm && <QuranForm onCancel={() => setShowForm(false)} onSubmit={saveLog} />}
      {editingLog && <QuranForm initial={editingLog} onCancel={() => setEditingLog(null)} onSubmit={saveLog} />}
    </div>
  );
}
const PENILAIAN_QURAN = {
  Ziyadah: ["Lancar", "Kurang Lancar", "Mengulang"],
  Murajaah: ["Lancar", "Kurang Lancar", "Mengulang"],
  Tilawah: ["Lancar", "Kurang Lancar", "Tersendat"],
  Tahsin: ["Sudah Baik", "Perlu Perbaikan Makhraj", "Perlu Perbaikan Tajwid"],
  Talaqqi: ["Paham", "Perlu Pengulangan", "Belum Paham"],
  Syahadah: ["Lulus", "Lulus dengan Catatan", "Belum Lulus"],
  "Tasmi'": ["Mumtaz", "Jayyid Jiddan", "Jayyid", "Maqbul", "Perlu Mengulang"],
};
function QuranForm({ initial, onCancel, onSubmit }) {
  const [f, setF] = useState(initial || { tanggal: new Date().toISOString().slice(0, 10), jenis: JENIS_SETORAN_QURAN[0], juz: 1, halaman_dari: 1, halaman_sampai: 1, kelancaran: "Lancar", catatan: "", tandai: false });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setJenis = (e) => setF({ ...f, jenis: e.target.value, kelancaran: PENILAIAN_QURAN[e.target.value][0] });
  return (
    <Modal title={initial ? "Edit Setoran" : "Catat Setoran"} onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
        <Field label="Tanggal"><Input type="date" value={f.tanggal} onChange={set("tanggal")} /></Field>
        <Field label="Jenis"><Select value={f.jenis} onChange={setJenis}>{JENIS_SETORAN_QURAN.map((j) => <option key={j}>{j}</option>)}</Select></Field>
        <Field label="Juz"><Input type="number" min={1} max={30} value={f.juz} onChange={set("juz")} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Halaman Dari"><Input type="number" min={1} value={f.halaman_dari} onChange={set("halaman_dari")} /></Field>
          <Field label="Halaman Sampai"><Input type="number" min={1} value={f.halaman_sampai} onChange={set("halaman_sampai")} /></Field>
        </div>
        <Field label="Penilaian">
          <Input list="penilaian-opsi" value={f.kelancaran} onChange={set("kelancaran")} placeholder="Pilih dari daftar atau ketik sendiri" />
          <datalist id="penilaian-opsi">{(PENILAIAN_QURAN[f.jenis] || []).map((p) => <option key={p} value={p} />)}</datalist>
        </Field>
        <Field label="Musyrif/ah Penguji"><div className="text-sm text-stone-500 px-1">Otomatis tercatat sesuai akun Anda yang login.</div></Field>
        <Field label="Catatan (opsional)"><textarea className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm" rows={2} placeholder="cth. Tajwid perlu diperbaiki di ayat 12" value={f.catatan} onChange={set("catatan")} /></Field>
        <label className="flex items-center gap-2 text-sm mb-2"><input type="checkbox" checked={f.tandai} onChange={(e) => setF({ ...f, tandai: e.target.checked })} /> Tandai juz ini selesai</label>
        <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit">Simpan</Btn></div>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------------- */
/* Ibadah — overview semua santri + drill-down                      */
/* ---------------------------------------------------------------------- */
function IbadahPage({ profile }) {
  const editable = canEdit(profile.role, "ibadah");
  const santriT = useTable("santri");
  const logT = useTable("ibadah_log");
  const isViewer = profile.role !== "santri";
  const [nim, setNim] = useState(isViewer ? "" : profile.nim);
  const [showForm, setShowForm] = useState(false);
  const santri = santriT.rows.find((s) => s.nim === nim);
  const logs = logT.rows.filter((l) => l.nim === nim).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const pickable = [...santriT.rows].sort((a, b) => (b.musyrif_username === profile.username) - (a.musyrif_username === profile.username));

  const [catatanIbadah, setCatatanIbadah] = useState("");
  useEffect(() => { setCatatanIbadah(santri?.catatan_ibadah || ""); }, [santri?.nim]);
  async function saveCatatanIbadah() {
    const { error } = await supabase.from("santri").update({ catatan_ibadah: catatanIbadah }).eq("nim", nim);
    if (error) { alert(error.message); return; }
    santriT.reload();
  }

  const [editingLog, setEditingLog] = useState(null);
  async function saveLog(f) {
    if (editingLog) {
      const { error } = await supabase.from("ibadah_log").update(f).eq("id", editingLog.id);
      if (error) alert(error.message); else { setEditingLog(null); logT.reload(); }
    } else {
      const { error } = await supabase.from("ibadah_log").insert({ ...f, nim, musyrif: profile.nama });
      if (error) alert(error.message); else { setShowForm(false); logT.reload(); }
    }
  }
  async function removeLog(id) {
    if (!confirm("Hapus catatan ibadah ini?")) return;
    const { error } = await supabase.from("ibadah_log").delete().eq("id", id);
    if (error) alert(error.message); else logT.reload();
  }

  const [q, setQ] = useState("");
  const [filterCapaian, setFilterCapaian] = useState("SEMUA");
  const [tabIb, setTabIb] = useState("rekap");
  const [showHarian, setShowHarian] = useState(false);
  const amalanT = useTable("jenis_ibadah_kustom");

  if (isViewer && !nim) {
    const withStatus = pickable.map((s) => {
      const own = logT.rows.filter((l) => l.nim === s.nim).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      const last = own[0];
      const kurangBulanIni = own.filter((l) => l.tanggal.slice(0, 7) === new Date().toISOString().slice(0, 7) && CAPAIAN_NEGATIF.includes(l.capaian)).length;
      return { s, last, kurangBulanIni, perhatian: kurangBulanIni >= 2 || CAPAIAN_NEGATIF.includes(last?.capaian) };
    }).filter(({ s }) => !q || s.nama.toLowerCase().includes(q.toLowerCase()) || s.nim.includes(q))
      .filter(({ perhatian }) => filterCapaian === "SEMUA" || (filterCapaian === "Perhatian" ? perhatian : !perhatian));
    const perluPerhatian = withStatus.filter((x) => x.perhatian).length;

    return (
      <div>
        <PageHeader title="Ibadah" sub="Semua santri — klik salah satu untuk lihat detail." />
        <div className="flex gap-1 mb-5 border-b border-stone-200">
          {[["rekap", "Rekap per Mahasantri"], ["presensi", "Presensi Shalat Berjamaah"]].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setTabIb(k)} className={`px-4 py-2 text-sm font-bold -mb-px border-b-2 ${tabIb === k ? "border-[#0B3B36] text-[#0B3B36]" : "border-transparent text-stone-400 hover:text-stone-600"}`}>{l}</button>
          ))}
        </div>
        {tabIb === "presensi" ? <PresensiSholatPanel santri={pickable} logRows={logT.rows} reload={logT.reload} profile={profile} /> : (
        <>
        <div className="grid grid-cols-2 gap-4 mb-5 max-w-xl">
          <StatCard label="Total Santri Dipantau" value={pickable.length} />
          <StatCard label="Perlu Perhatian" value={perluPerhatian} />
        </div>
        <div className="flex gap-3 mb-4">
          <Input placeholder="Cari nama atau NIM..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Select value={filterCapaian} onChange={(e) => setFilterCapaian(e.target.value)} className="max-w-[180px]">
            <option value="SEMUA">Semua status</option><option value="Baik">Baik</option><option value="Perhatian">Perlu Perhatian</option>
          </Select>
        </div>
        <PerAngkatan santri={pickable} cari={q} kunci="ibadah">{(cocok) => (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3.5">Mahasantri</th><th className="p-3.5">Catatan Terakhir</th><th className="p-3.5">Status</th></tr></thead>
            <tbody>
              {withStatus.filter(({ s }) => cocok(s)).map(({ s, last, perhatian }) => (
                <tr key={s.nim} className="border-t border-stone-100 hover:bg-stone-50/60 cursor-pointer" onClick={() => setNim(s.nim)}>
                  <td className="p-3.5"><div className="flex items-center gap-3"><Avatar name={s.nama} size={30} /><div><div className="font-bold">{s.nama}</div><div className="text-[0.6875rem] text-stone-400">{s.nim}</div></div></div></td>
                  <td className="p-3.5 text-stone-500">{last ? <>{last.tanggal} · {last.jenis} · <Badge tone={capaianTone(last.capaian)}>{last.capaian}</Badge></> : "-"}</td>
                  <td className="p-3.5">{perhatian ? <Badge tone="red">Perlu Perhatian</Badge> : <Badge tone="green">Baik</Badge>}</td>
                </tr>
              ))}
              {withStatus.length === 0 && <tr><td colSpan={3}><Empty text="Tidak ada santri yang cocok." /></td></tr>}
            </tbody>
          </table>
        </Card>
        )}</PerAngkatan>
        </>
        )}
      </div>
    );
  }

  return (
    <div>
      {isViewer && <BackBar onBack={() => setNim("")} />}
      <PageHeader title={isViewer ? (santri?.nama || "Ibadah") : "Ibadah"} sub="Catatan pembinaan ibadah harian santri."
        actions={<div className="flex gap-2">{editable && isViewer && <Btn tone="gold" onClick={() => setShowHarian(true)}>Catat Semua Ibadah</Btn>}{editable && isViewer && <Btn onClick={() => setShowForm(true)}>+ Catat Ibadah</Btn>}{!isViewer && <Btn tone="gold" onClick={() => window.print()}>🖨 Unduh PDF</Btn>}</div>} />
      {(() => {
        const bulanIniLogs = logs.filter((l) => l.tanggal.slice(0, 7) === new Date().toISOString().slice(0, 7));
        return (
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[...JENIS_IBADAH, ...new Set(bulanIniLogs.map((l) => l.jenis).filter((j) => j && !JENIS_IBADAH.includes(j)))].map((j) => {
              const entries = bulanIniLogs.filter((l) => l.jenis === j);
              const positif = entries.filter((l) => !CAPAIAN_NEGATIF.includes(l.capaian)).length;
              return <StatCard key={j} label={j} value={`${positif}/${entries.length}`} sub="bulan ini" />;
            })}
          </div>
        );
      })()}
      <GrafikPekananPanel kind="ibadah" logs={logs} santri={santri} />
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase text-stone-500"><th className="p-3">Tanggal</th><th className="p-3">Jenis Ibadah</th><th className="p-3">Capaian</th><th className="p-3">Catatan</th>{editable && isViewer && <th className="p-3 text-right">Aksi</th>}</tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-stone-100">
                <td className="p-3">{l.tanggal}</td><td className="p-3">{l.jenis}{l.waktu ? ` · ${l.waktu}` : ""}</td>
                <td className="p-3"><Badge tone={capaianTone(l.capaian)}>{l.capaian}</Badge></td>
                <td className="p-3 text-stone-500">{l.catatan}</td>
                {editable && isViewer && <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => setEditingLog(l)} className="text-[#145048] text-xs font-bold mr-3">Edit</button>
                  <button onClick={() => removeLog(l.id)} className="text-red-600 text-xs font-bold">Hapus</button>
                </td>}
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={editable && isViewer ? 5 : 4}><Empty text="Belum ada catatan ibadah." /></td></tr>}
          </tbody>
        </table>
      </Card>
      <Card className="mt-4">
        <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-3">Catatan Musyrif/Musyrifah</h3>
        {editable ? (
          <>
            <textarea className="w-full border border-stone-200 rounded-lg p-3 text-sm" rows={3} value={catatanIbadah} onChange={(e) => setCatatanIbadah(e.target.value)} placeholder="Tulis catatan pembinaan ibadah mahasantri di sini..." />
            <div className="mt-2 text-right"><Btn onClick={saveCatatanIbadah}>Simpan Catatan</Btn></div>
          </>
        ) : (
          <p className="text-sm text-stone-600 whitespace-pre-wrap">{santri?.catatan_ibadah || "Belum ada catatan."}</p>
        )}
      </Card>
      {showForm && <IbadahForm extra={amalanT.rows.filter((k) => k.aktif)} onCancel={() => setShowForm(false)} onSubmit={saveLog} />}
      {showHarian && santri && <IbadahHarianModal santri={santri} logRows={logT.rows} profile={profile} kustom={amalanT.rows} onCancel={() => setShowHarian(false)} onDone={(n) => { setShowHarian(false); logT.reload(); alert(n + " catatan ibadah tersimpan."); }} />}
      {editingLog && <IbadahForm extra={amalanT.rows.filter((k) => k.aktif)} initial={editingLog} onCancel={() => setEditingLog(null)} onSubmit={saveLog} />}
    </div>
  );
}
function IbadahForm({ initial, extra = [], onCancel, onSubmit }) {
  const [f, setF] = useState(initial || { tanggal: new Date().toISOString().slice(0, 10), jenis: JENIS_IBADAH[0], capaian: CAPAIAN_OPTIONS[JENIS_IBADAH[0]][0], catatan: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const opsiDari = (j) => CAPAIAN_OPTIONS[j] || (extra.find((k) => k.nama === j)?.opsi) || ["Dikerjakan", "Tidak Dikerjakan"];
  const setJenis = (e) => setF({ ...f, jenis: e.target.value, capaian: opsiDari(e.target.value)[0] || "" });
  return (
    <Modal title={initial ? "Edit Catatan Ibadah" : "Catat Ibadah"} onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
        <Field label="Tanggal"><Input type="date" value={f.tanggal} onChange={set("tanggal")} /></Field>
        <Field label="Jenis Ibadah">
          <Input list="jenisIbadahOpsi" value={f.jenis} onChange={setJenis} placeholder="Pilih dari daftar atau ketik sendiri" />
          <datalist id="jenisIbadahOpsi">{[...JENIS_IBADAH, ...extra.map((k) => k.nama)].map((j) => <option key={j} value={j} />)}</datalist>
        </Field>
        <Field label="Capaian">
          <Input list="capaianOpsi" value={f.capaian} onChange={set("capaian")} placeholder="Pilih dari daftar atau ketik sendiri" />
          <datalist id="capaianOpsi">{opsiDari(f.jenis).map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="Catatan"><textarea className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm" rows={3} value={f.catatan} onChange={set("catatan")} /></Field>
        <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit">Simpan</Btn></div>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------------- */
/* Iuran SPP — overview semua santri + drill-down                        */
/* ---------------------------------------------------------------------- */
function noWa(hp) {
  let d = String(hp || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("0")) d = "62" + d.slice(1); else if (d.startsWith("8")) d = "62" + d;
  return d;
}
function linkWaTunggakan({ santri, rows, sisaKop, namaPondok }) {
  const hp = noWa(santri?.no_hp_ortu || santri?.no_hp);
  if (!hp || rows.length === 0) return null;
  const urut = [...rows].sort((a, b) => a.tahun - b.tahun || BULAN.indexOf(a.bulan) - BULAN.indexOf(b.bulan));
  const total = urut.reduce((a, r) => a + Number(r.nominal || 0), 0);
  const teks = `Assalamu'alaikum warahmatullahi wabarakatuh.\n\nYth. Bapak/Ibu wali dari ananda ${santri.nama}. Kami dari ${namaPondok || "pondok"} mengingatkan bahwa iuran SPP berikut belum kami terima:\n${urut.map((r) => `- ${r.bulan} ${r.tahun}: ${formatRupiah(r.nominal)}`).join("\n")}\n\nTotal: ${formatRupiah(total)}` + (sisaKop > 0 ? `\nSisa tagihan koperasi: ${formatRupiah(sisaKop)}` : "") + `\n\nMohon kesediaannya menyelesaikan pembayaran. Apabila sudah membayar, mohon abaikan pesan ini atau kirimkan bukti transfernya.\n\nJazakumullahu khairan.`;
  return `https://wa.me/${hp}?text=${encodeURIComponent(teks)}`;
}
function SppPage({ profile }) {
  const editable = canEdit(profile.role, "spp");
  const isViewer = profile.role !== "santri";
  const santriT = useTable("santri");
  const sppT = useTable("spp");
  const profilesT = useTable("profiles");
  const koperasiT = useTable("koperasi_cicilan");
  const [showRekap, setShowRekap] = useState(false);
  const [hanyaBelum, setHanyaBelum] = useState(false);
  const [showGabungan, setShowGabungan] = useState(false);
  const [showKoperasi, setShowKoperasi] = useState(false);
  const [nim, setNim] = useState(isViewer ? "" : profile.nim);
  const [showForm, setShowForm] = useState(false);
  const brand = useContext(BrandContext);
  const [kuitansi, setKuitansi] = useState(null);
  const [kuitansiKop, setKuitansiKop] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [showBulk, setShowBulk] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const santri = santriT.rows.find((s) => s.nim === nim);
  const rows = sppT.rows.filter((r) => r.nim === nim).sort((a, b) => b.tahun - a.tahun || BULAN.indexOf(b.bulan) - BULAN.indexOf(a.bulan));
  const bulanIni = BULAN[new Date().getMonth()];
  const cicilan = koperasiT.rows.filter((c) => c.nim === nim).sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));
  const totalCicilan = cicilan.reduce((a, c) => a + Number(c.jumlah || 0), 0);
  const tagihanKoperasi = Number(santri?.tagihan_koperasi || 0);
  const sisaKoperasi = Math.max(0, tagihanKoperasi - totalCicilan);

  async function terimaGabungan(f) {
    const total = Number(f.total);
    if (!(total > 0)) { alert("Isi jumlah yang diterima."); return; }
    const today = new Date().toISOString().slice(0, 10);
    const pencatat = profile.nama || profile.username;
    let target = rows.find((r) => String(r.id) === String(f.sppId));
    let nominalSpp = target ? Number(target.nominal || 0) : 0;
    let sppBaru = null;
    if (f.sppId === "baru") {
      nominalSpp = Number(f.nominalBaru);
      if (!(nominalSpp > 0)) { alert("Isi nominal SPP bulan ini."); return; }
      const ada = rows.find((r) => r.bulan === f.bulan && Number(r.tahun) === Number(f.tahun));
      if (ada && ada.status === "Lunas") { alert(`Iuran ${f.bulan} ${f.tahun} untuk santri ini sudah lunas.`); return; }
      if (ada) { target = ada; nominalSpp = Number(ada.nominal || nominalSpp); } else sppBaru = { bulan: f.bulan, tahun: Number(f.tahun), nominal: nominalSpp };
    } else if (!target) { alert("Pilih iuran SPP yang dibayar."); return; }
    const untukKoperasi = total - nominalSpp;
    if (untukKoperasi < 0) { alert(`Jumlah yang diterima kurang dari SPP (${formatRupiah(nominalSpp)}).`); return; }
    if (untukKoperasi > 0 && tagihanKoperasi > 0 && untukKoperasi > sisaKoperasi && !confirm(`Cicilan koperasi ${formatRupiah(untukKoperasi)} melebihi sisa tagihan (${formatRupiah(sisaKoperasi)}). Tetap simpan?`)) return;
    const dataBayar = { status: "Lunas", metode_bayar: f.metode, tanggal_bayar: today, total_diterima: untukKoperasi > 0 ? total : null, dicatat_oleh: pencatat, dicatat_oleh_username: profile.username };
    let sppId, bulanTahun;
    if (sppBaru) {
      const { data, error } = await supabase.from("spp").insert({ ...sppBaru, nim, ...dataBayar }).select().single();
      if (error) { alert(error.message); return; }
      sppId = data.id; bulanTahun = `${sppBaru.bulan} ${sppBaru.tahun}`;
    } else {
      const { error } = await supabase.from("spp").update(dataBayar).eq("id", target.id);
      if (error) { alert(error.message); return; }
      sppId = target.id; bulanTahun = `${target.bulan} ${target.tahun}`;
    }
    if (untukKoperasi > 0) {
      const { error: e2 } = await supabase.from("koperasi_cicilan").insert({ nim, jumlah: untukKoperasi, tanggal: today, metode_bayar: f.metode, spp_id: String(sppId), catatan: `Dari pembayaran gabungan ${formatRupiah(total)} (SPP ${bulanTahun})`, dicatat_oleh: pencatat, dicatat_oleh_username: profile.username });
      if (e2) alert("SPP tersimpan, tetapi cicilan koperasi gagal dicatat: " + e2.message);
    }
    setShowGabungan(false); sppT.reload(); koperasiT.reload();
  }
  async function catatKoperasi(f) {
    const jumlah = Number(f.jumlah);
    if (!(jumlah > 0)) { alert("Isi jumlah cicilan."); return; }
    const { error } = await supabase.from("koperasi_cicilan").insert({ nim, jumlah, tanggal: f.tanggal, metode_bayar: f.metode, catatan: f.catatan || null, dicatat_oleh: profile.nama || profile.username, dicatat_oleh_username: profile.username });
    if (error) alert(error.message); else { setShowKoperasi(false); koperasiT.reload(); }
  }
  async function hapusCicilan(c) {
    if (!confirm(`Hapus cicilan koperasi ${formatRupiah(c.jumlah)}?`)) return;
    const { error } = await supabase.from("koperasi_cicilan").delete().eq("id", c.id);
    if (error) alert(error.message); else koperasiT.reload();
  }

  async function addRecord(f) {
    const today = new Date().toISOString().slice(0, 10);
    const pencatat = profile.nama || profile.username;
    if (f.id) {
      const { error } = await supabase.from("spp").update({ bulan: f.bulan, tahun: Number(f.tahun), nominal: Number(f.nominal), status: f.status, metode_bayar: f.metode_bayar, ...(f.status !== "Lunas" ? { total_diterima: null } : {}), tanggal_bayar: f.status === "Lunas" ? (f.tanggal_bayar || today) : null, dicatat_oleh: f.status === "Lunas" ? pencatat : null, dicatat_oleh_username: f.status === "Lunas" ? profile.username : null }).eq("id", f.id);
      if (error) alert(error.message); else { setEditingRow(null); sppT.reload(); }
      return;
    }
    const dobel = sppT.rows.find((r) => r.nim === nim && r.bulan === f.bulan && Number(r.tahun) === Number(f.tahun));
    if (dobel && !confirm(`Iuran ${f.bulan} ${f.tahun} untuk santri ini sudah ada. Tetap tambahkan?`)) return;
    const { error } = await supabase.from("spp").insert({ ...f, nim, nominal: Number(f.nominal), tahun: Number(f.tahun), tanggal_bayar: f.status === "Lunas" ? today : null, dicatat_oleh: f.status === "Lunas" ? pencatat : null, dicatat_oleh_username: f.status === "Lunas" ? profile.username : null });
    if (error) alert(error.message); else { setShowForm(false); sppT.reload(); }
  }
  async function hapusIuran(r) {
    if (!confirm(`Hapus iuran ${r.bulan} ${r.tahun} (${formatRupiah(r.nominal)})?`)) return;
    const { error } = await supabase.from("spp").delete().eq("id", r.id);
    if (error) alert(error.message); else sppT.reload();
  }
  async function buatIuranBulanan(f) {
    const tahun = Number(f.tahun);
    const sudahAda = new Set(sppT.rows.filter((r) => r.bulan === f.bulan && Number(r.tahun) === tahun).map((r) => r.nim));
    const baru = santriT.rows.filter((s) => !sudahAda.has(s.nim)).map((s) => ({ nim: s.nim, bulan: f.bulan, tahun, nominal: Number(s.nominal_spp) > 0 ? Number(s.nominal_spp) : Number(f.nominal), status: "Belum Lunas", tanggal_bayar: null }));
    if (baru.length === 0) { alert("Semua santri sudah punya iuran untuk bulan itu."); setShowBulk(false); return; }
    const { error } = await supabase.from("spp").insert(baru);
    if (error) { alert(error.message); return; }
    setShowBulk(false); sppT.reload();
    alert(`${baru.length} iuran berhasil dibuat untuk ${f.bulan} ${tahun}.`);
  }
  async function toggle(r) {
    const jadiLunas = r.status !== "Lunas";
    const { error } = await supabase.from("spp").update({ status: jadiLunas ? "Lunas" : "Belum Lunas", total_diterima: null, tanggal_bayar: jadiLunas ? new Date().toISOString().slice(0, 10) : null, dicatat_oleh: jadiLunas ? (profile.nama || profile.username) : null, dicatat_oleh_username: jadiLunas ? profile.username : null }).eq("id", r.id);
    if (!error) sppT.reload();
  }

  async function unggahBukti(r, file) {
    if (!file) return;
    setUploadingId(r.id);
    const path = `${r.nim}/spp-${r.id}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: upErr } = await supabase.storage.from("dokumen-santri").upload(path, file, { upsert: true });
    if (upErr) { alert(upErr.message); setUploadingId(null); return; }
    const { data } = supabase.storage.from("dokumen-santri").getPublicUrl(path);
    const { error } = await supabase.from("spp").update({ bukti_url: data.publicUrl }).eq("id", r.id);
    setUploadingId(null);
    if (error) alert(error.message); else sppT.reload();
  }

  const [q, setQ] = useState("");

  if (isViewer && !nim && showRekap) {
    return <RekapSpp santriRows={santriT.rows} sppRows={sppT.rows} koperasiRows={koperasiT.rows} brand={brand} onBack={() => setShowRekap(false)} />;
  }
  if (isViewer && !nim) {
    const withStatus = santriT.rows.map((s) => {
      const row = sppT.rows.find((r) => r.nim === s.nim && r.bulan === bulanIni && r.tahun === nowYear);
      return { s, row, tunggak: sppT.rows.filter((r) => r.nim === s.nim && r.status !== "Lunas") };
    }).filter(({ s }) => !q || s.nama.toLowerCase().includes(q.toLowerCase()) || s.nim.includes(q)).filter(({ tunggak }) => !hanyaBelum || tunggak.length > 0);
    const lunas = withStatus.filter(({ row }) => row?.status === "Lunas").length;
    const belumLunas = withStatus.filter(({ row }) => row && row.status !== "Lunas").length;
    const totalTertunggak = withStatus.filter(({ row }) => row && row.status !== "Lunas").reduce((a, { row }) => a + Number(row.nominal || 0), 0);

    return (
      <div>
        <PageHeader title="Iuran SPP" sub={`Status pembayaran bulan ${bulanIni} — klik santri untuk kelola.`} actions={<div className="flex gap-2"><Btn tone="ghost" onClick={() => setShowRekap(true)}>📊 Rekap Bulanan</Btn>{editable && <Btn onClick={() => setShowBulk(true)}>+ Buat Iuran Bulan Ini</Btn>}</div>} />
        <div className="grid grid-cols-3 gap-4 mb-5">
          <StatCard label={`Lunas Bulan ${bulanIni}`} value={lunas} />
          <StatCard label="Belum Lunas" value={belumLunas} />
          <StatCard label="Total Tertunggak" value={formatRupiah(totalTertunggak)} />
        </div>
        <div className="mb-4 flex items-center gap-4 flex-wrap"><div className="max-w-xs w-full"><Input placeholder="Cari nama atau NIM..." value={q} onChange={(e) => setQ(e.target.value)} /></div><label className="flex items-center gap-2 text-sm text-stone-600"><input type="checkbox" checked={hanyaBelum} onChange={(e) => setHanyaBelum(e.target.checked)} />Hanya yang punya tunggakan</label></div>
        <PerAngkatan santri={santriT.rows} cari={q} kunci="spp">{(cocok) => (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3.5">Mahasantri</th><th className="p-3.5">Status Bulan Ini</th><th className="p-3.5">Tunggakan</th>{editable && <th className="p-3.5 text-right">Pengingat</th>}</tr></thead>
            <tbody>
              {withStatus.filter(({ s }) => cocok(s)).map(({ s, row, tunggak }) => {
                const sisaKop = Math.max(0, Number(s.tagihan_koperasi || 0) - koperasiT.rows.filter((c) => c.nim === s.nim).reduce((a, c) => a + Number(c.jumlah || 0), 0));
                const linkWa = linkWaTunggakan({ santri: s, rows: tunggak, sisaKop, namaPondok: brand.nama_pondok });
                return (
                <tr key={s.nim} className="border-t border-stone-100 hover:bg-stone-50/60 cursor-pointer" onClick={() => setNim(s.nim)}>
                  <td className="p-3.5"><div className="flex items-center gap-3"><Avatar name={s.nama} size={30} /><div><div className="font-bold">{s.nama}</div><div className="text-[0.6875rem] text-stone-400">{s.nim}</div></div></div></td>
                  <td className="p-3.5">{row ? <Badge tone={row.status === "Lunas" ? "green" : "red"}>{row.status}</Badge> : <Badge tone="grey">Belum ada iuran</Badge>}</td>
                  <td className="p-3.5 text-xs">{tunggak.length > 0 ? <span className="font-bold text-red-700">{tunggak.length} bln · {formatRupiah(tunggak.reduce((a, r) => a + Number(r.nominal || 0), 0))}</span> : <span className="text-stone-400">-</span>}</td>
                  {editable && <td className="p-3.5 text-right">{tunggak.length === 0 ? <span className="text-stone-300">-</span> : linkWa ? <a href={linkWa} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs font-bold text-green-700 border border-green-300 rounded-lg px-2.5 py-1 hover:bg-green-50">📲 Ingatkan</a> : <span className="text-[0.6875rem] text-stone-400">No. HP wali kosong</span>}</td>}
                </tr>
                );
              })}
              {withStatus.length === 0 && <tr><td colSpan={editable ? 4 : 3}><Empty text="Tidak ada santri yang cocok." /></td></tr>}
            </tbody>
          </table>
        </Card>
        )}</PerAngkatan>
        {showBulk && <BuatIuranBulanan onCancel={() => setShowBulk(false)} onSubmit={buatIuranBulanan} jumlah={santriT.rows.length} />}
      </div>
    );
  }

  return (
    <div>
      {isViewer && <BackBar onBack={() => setNim("")} />}
      <PageHeader title={isViewer ? (santri?.nama || "Iuran SPP") : "Iuran SPP"}
        actions={<div className="flex gap-2">{editable && isViewer && (() => { const l = linkWaTunggakan({ santri, rows: rows.filter((r) => r.status !== "Lunas"), sisaKop: sisaKoperasi, namaPondok: brand.nama_pondok }); return l ? <a href={l} target="_blank" rel="noreferrer" className="px-4 py-2.5 rounded-xl text-sm font-bold border border-green-300 text-green-700 hover:bg-green-50">📲 Ingatkan Wali</a> : null; })()}{editable && isViewer && <Btn tone="gold" onClick={() => setShowGabungan(true)}>💰 Terima Pembayaran</Btn>}{editable && isViewer && <Btn onClick={() => setShowForm(true)}>+ Tambah Iuran</Btn>}{!isViewer && <Btn tone="gold" onClick={() => window.print()}>🖨 Unduh PDF</Btn>}</div>} />
      <div className={`grid grid-cols-1 ${tagihanKoperasi > 0 ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-4 mb-5 max-w-4xl`}>
        <StatCard label="Total Tunggakan" value={formatRupiah(rows.filter((r) => r.status !== "Lunas").reduce((a, r) => a + Number(r.nominal || 0), 0))} />
        <StatCard label="Bulan Belum Lunas" value={rows.filter((r) => r.status !== "Lunas").length} />
        {tagihanKoperasi > 0 && <StatCard label="Sisa Tagihan Koperasi" value={formatRupiah(sisaKoperasi)} />}
      </div>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase text-stone-500"><th className="p-3">Bulan</th><th className="p-3">Tahun</th><th className="p-3">Nominal</th><th className="p-3">Status</th><th className="p-3">Bukti Bayar</th>{editable && <th className="p-3 text-right">Aksi</th>}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-stone-100">
                <td className="p-3">{r.bulan}</td><td className="p-3">{r.tahun}</td><td className="p-3">{formatRupiah(r.nominal)}</td>
                <td className="p-3">{editable ? <button onClick={() => toggle(r)}><Badge tone={r.status === "Lunas" ? "green" : "red"}>{r.status}</Badge></button> : <Badge tone={r.status === "Lunas" ? "green" : "red"}>{r.status}</Badge>}</td>
                <td className="p-3 whitespace-nowrap">
                  {r.status === "Lunas" ? (
                    <button onClick={() => setKuitansi(r)} className="text-[#145048] text-xs font-bold">🧾 Cetak Bukti Bayar</button>
                  ) : (
                    <div className="flex items-center gap-3">
                      {r.bukti_url && <a href={r.bukti_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-green-700 underline">Bukti terkirim ✓</a>}
                      {(!isViewer || editable) && (
                        <label className="text-xs font-bold text-[#0B3B36] border border-stone-300 rounded-lg px-2.5 py-1 cursor-pointer hover:bg-stone-50">
                          {uploadingId === r.id ? "Mengunggah…" : r.bukti_url ? "Ganti" : "Unggah Bukti"}
                          <input type="file" accept="image/*,application/pdf" className="hidden" disabled={uploadingId === r.id} onChange={(e) => unggahBukti(r, e.target.files?.[0])} />
                        </label>
                      )}
                      {isViewer && !editable && !r.bukti_url && <span className="text-xs text-stone-400">-</span>}
                    </div>
                  )}
                </td>
                {editable && <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => setEditingRow(r)} className="text-[#145048] text-xs font-bold mr-3">Edit</button>
                  <button onClick={() => hapusIuran(r)} className="text-red-600 text-xs font-bold">Hapus</button>
                </td>}
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={editable ? 6 : 5}><Empty text="Belum ada data." /></td></tr>}
          </tbody>
        </table>
      </Card>
      {(cicilan.length > 0 || tagihanKoperasi > 0 || editable) && (
        <Card className="p-0 overflow-hidden mt-6">
          <div className="flex items-center justify-between p-4 border-b border-stone-100">
            <div>
              <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold">Cicilan Koperasi</h3>
              <div className="text-xs text-stone-500">{tagihanKoperasi > 0 ? `Tagihan ${formatRupiah(tagihanKoperasi)} · Terbayar ${formatRupiah(totalCicilan)} · Sisa ${formatRupiah(sisaKoperasi)}` : `Total cicilan tercatat ${formatRupiah(totalCicilan)}`}</div>
            </div>
            {editable && isViewer && <Btn onClick={() => setShowKoperasi(true)}>+ Catat Cicilan</Btn>}
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase text-stone-500"><th className="p-3">Tanggal</th><th className="p-3">Jumlah</th><th className="p-3">Metode</th><th className="p-3">Catatan</th><th className="p-3">Bukti</th>{editable && <th className="p-3 text-right">Aksi</th>}</tr></thead>
            <tbody>
              {cicilan.map((c) => (
                <tr key={c.id} className="border-t border-stone-100">
                  <td className="p-3">{c.tanggal ? new Date(c.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}</td>
                  <td className="p-3 font-bold">{formatRupiah(c.jumlah)}</td><td className="p-3">{c.metode_bayar || "-"}</td><td className="p-3 text-xs text-stone-500">{c.catatan || "-"}</td>
                  <td className="p-3 whitespace-nowrap">{c.spp_id ? (() => { const rs = rows.find((r) => String(r.id) === String(c.spp_id)); return rs ? <button onClick={() => setKuitansi(rs)} className="text-[#145048] text-xs font-bold">🧾 Bukti SPP + Koperasi</button> : <span className="text-stone-300">-</span>; })() : <button onClick={() => setKuitansiKop(c)} className="text-[#145048] text-xs font-bold">🧾 Cetak Bukti</button>}</td>
                  {editable && <td className="p-3 text-right"><button onClick={() => hapusCicilan(c)} className="text-red-600 text-xs font-bold">Hapus</button></td>}
                </tr>
              ))}
              {cicilan.length === 0 && <tr><td colSpan={editable ? 6 : 5}><Empty text="Belum ada cicilan koperasi." /></td></tr>}
            </tbody>
          </table>
        </Card>
      )}
      {showGabungan && <BayarGabunganForm rows={rows} defaultNominal={santri?.nominal_spp} sisaKoperasi={sisaKoperasi} onCancel={() => setShowGabungan(false)} onSubmit={terimaGabungan} />}
      {showKoperasi && <KoperasiForm onCancel={() => setShowKoperasi(false)} onSubmit={catatKoperasi} />}
      {showForm && <SppForm defaultNominal={santri?.nominal_spp} onCancel={() => setShowForm(false)} onSubmit={addRecord} />}
      {editingRow && <SppForm initial={editingRow} onCancel={() => setEditingRow(null)} onSubmit={addRecord} />}
      {kuitansiKop && <KuitansiKoperasi cicilan={kuitansiKop} santri={santri} brand={brand} penandaTangan={profilesT.rows.find((p) => p.username === kuitansiKop.dicatat_oleh_username)} sisaSetelah={tagihanKoperasi > 0 ? Math.max(0, tagihanKoperasi - cicilan.filter((x) => String(x.tanggal) < String(kuitansiKop.tanggal) || (String(x.tanggal) === String(kuitansiKop.tanggal) && Number(x.id) <= Number(kuitansiKop.id))).reduce((a, x) => a + Number(x.jumlah || 0), 0)) : null} onClose={() => setKuitansiKop(null)} />}
      {kuitansi && <KuitansiSpp row={kuitansi} santri={santri} brand={brand} penandaTangan={profilesT.rows.find((p) => p.username === kuitansi.dicatat_oleh_username)} onClose={() => setKuitansi(null)} />}
    </div>
  );
}
function terbilang(n) {
  const s = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  n = Math.floor(Number(n) || 0);
  if (n === 0) return "nol";
  if (n < 12) return s[n];
  if (n < 20) return terbilang(n - 10) + " belas";
  if (n < 100) return terbilang(Math.floor(n / 10)) + " puluh" + (n % 10 ? " " + terbilang(n % 10) : "");
  if (n < 200) return "seratus" + (n - 100 ? " " + terbilang(n - 100) : "");
  if (n < 1000) return terbilang(Math.floor(n / 100)) + " ratus" + (n % 100 ? " " + terbilang(n % 100) : "");
  if (n < 2000) return "seribu" + (n - 1000 ? " " + terbilang(n - 1000) : "");
  if (n < 1e6) return terbilang(Math.floor(n / 1e3)) + " ribu" + (n % 1000 ? " " + terbilang(n % 1000) : "");
  if (n < 1e9) return terbilang(Math.floor(n / 1e6)) + " juta" + (n % 1e6 ? " " + terbilang(n % 1e6) : "");
  return String(n);
}
function KuitansiSpp({ row, santri, brand, penandaTangan, onClose }) {
  const tglBayar = row.tanggal_bayar ? new Date(row.tanggal_bayar) : new Date();
  const noKuitansi = `BKT-${row.nim}-${row.tahun}${String(BULAN.indexOf(row.bulan) + 1).padStart(2, "0")}`;
  const gabungan = Number(row.total_diterima) > Number(row.nominal);
  const totalBayar = gabungan ? Number(row.total_diterima) : Number(row.nominal);
  const kopBagian = totalBayar - Number(row.nominal);
  return (
    <Modal title="Bukti Pembayaran Iuran SPP" onClose={onClose}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .kuitansi-print, .kuitansi-print * { visibility: visible; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .kuitansi-print { position: absolute; top: 0; left: 0; width: 100%; padding: 24px 32px; }
        }
      `}</style>
      <div className="kuitansi-print" style={{ fontSize: 12, color: "#111" }}>
        <table style={{ width: "100%", marginBottom: 14, borderBottom: "2px solid #0B3B36", paddingBottom: 10 }}><tbody><tr>
          <td style={{ width: 70, verticalAlign: "middle" }}>{(brand.logo_dokumen_url || brand.logo_url) && <img src={brand.logo_dokumen_url || brand.logo_url} alt="logo" style={{ width: 60 }} />}</td>
          <td style={{ verticalAlign: "middle" }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#0B3B36" }}>{brand.yayasan_nama}</div>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#0B3B36" }}>PONDOK TAHFIDZ QURAN DAN ENTREPRENEUR {brand.nama_pondok?.toUpperCase()}</div>
            <div style={{ fontSize: 9.5, color: "#44544D" }}>{brand.alamat_pondok}</div>
            <div style={{ fontSize: 9.5, color: "#44544D", fontStyle: "italic" }}>Contact: {brand.kontak_pondok}</div>
          </td>
        </tr></tbody></table>
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{gabungan ? "BUKTI PEMBAYARAN IURAN SPP & KOPERASI" : "BUKTI PEMBAYARAN IURAN SPP"}</div>
        <div style={{ textAlign: "center", fontSize: 10, color: "#555", marginBottom: 14 }}>No. {noKuitansi}</div>
        <table style={{ width: "100%", fontSize: 12, lineHeight: 1.7 }}><tbody>
          <tr><td style={{ width: 130 }}>Telah terima dari</td><td>: {santri?.nama || row.nim} (NIM {row.nim})</td></tr>
          {!gabungan && <tr><td>Untuk pembayaran</td><td>: Iuran SPP bulan {row.bulan} {row.tahun}</td></tr>}
          {gabungan && <tr><td>Untuk pembayaran</td><td>: Iuran SPP bulan {row.bulan} {row.tahun} + Cicilan Koperasi (satu bukti, rincian di bawah)</td></tr>}
          {!gabungan && <tr><td>Uang sejumlah</td><td>: <b>{formatRupiah(row.nominal)}</b></td></tr>}
          {!gabungan && <tr><td>Terbilang</td><td>: <i style={{ textTransform: "capitalize" }}>{terbilang(row.nominal)} rupiah</i></td></tr>}
          <tr><td>Metode Pembayaran</td><td>: {row.metode_bayar || "-"}</td></tr>
        </tbody></table>
        {gabungan && (
          <table style={{ width: "100%", fontSize: 12, marginTop: 8, borderCollapse: "collapse" }}><tbody>
            <tr style={{ background: "#E9F1EE" }}><td style={{ border: "1px solid #999", padding: "5px 8px", fontWeight: 700 }}>Rincian Pembayaran</td><td style={{ border: "1px solid #999", padding: "5px 8px", fontWeight: 700, textAlign: "right", width: 140 }}>Jumlah</td></tr>
            <tr><td style={{ border: "1px solid #999", padding: "5px 8px" }}>Iuran SPP bulan {row.bulan} {row.tahun}</td><td style={{ border: "1px solid #999", padding: "5px 8px", textAlign: "right" }}>{formatRupiah(row.nominal)}</td></tr>
            <tr><td style={{ border: "1px solid #999", padding: "5px 8px" }}>Cicilan Koperasi</td><td style={{ border: "1px solid #999", padding: "5px 8px", textAlign: "right" }}>{formatRupiah(kopBagian)}</td></tr>
            <tr><td style={{ border: "1px solid #999", padding: "5px 8px", fontWeight: 700 }}>TOTAL DITERIMA</td><td style={{ border: "1px solid #999", padding: "5px 8px", textAlign: "right", fontWeight: 700 }}>{formatRupiah(totalBayar)}</td></tr>
            <tr><td colSpan={2} style={{ border: "1px solid #999", padding: "5px 8px", fontSize: 11 }}>Terbilang: <i style={{ textTransform: "capitalize" }}>{terbilang(totalBayar)} rupiah</i></td></tr>
          </tbody></table>
        )}
        <div style={{ textAlign: "right", marginTop: 26, fontSize: 12 }}>
          <div>{tglBayar.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
          <div>Bendahara</div>
          {row.dicatat_oleh ? (
            penandaTangan?.tanda_tangan_url ? (
              <img src={penandaTangan.tanda_tangan_url} alt="Tanda tangan" style={{ height: 48, marginBottom: -4 }} />
            ) : (
              <div style={{ fontFamily: "cursive", fontSize: 20, color: "#0B3B36", display: "inline-block", paddingTop: 8 }}>{row.dicatat_oleh}</div>
            )
          ) : (
            <div style={{ height: 44 }}></div>
          )}
          <div style={{ borderTop: "1px solid #999", paddingTop: 2 }}>{row.dicatat_oleh || "( ............................ )"}</div>
          {row.dicatat_oleh && <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>Ditandatangani secara digital di SIAKAD</div>}
        </div>
        <div style={{ textAlign: "center", fontSize: 8.5, color: "#888", marginTop: 16, borderTop: "1px dashed #ccc", paddingTop: 8 }}>No. {noKuitansi} — Dicetak {new Date().toLocaleString("id-ID")}</div>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Btn tone="ghost" onClick={onClose}>Tutup</Btn>
        <Btn onClick={() => window.print()}>🖨 Cetak</Btn>
      </div>
    </Modal>
  );
}
function KuitansiKoperasi({ cicilan, santri, brand, penandaTangan, sisaSetelah, onClose }) {
  const tglBayar = cicilan.tanggal ? new Date(cicilan.tanggal) : new Date();
  const noKuitansi = `KOP-${cicilan.nim}-${String(cicilan.id).padStart(5, "0")}`;
  return (
    <Modal title="Bukti Pembayaran Cicilan Koperasi" onClose={onClose}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .kuitansi-print, .kuitansi-print * { visibility: visible; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .kuitansi-print { position: absolute; top: 0; left: 0; width: 100%; padding: 24px 32px; }
        }
      `}</style>
      <div className="kuitansi-print" style={{ fontSize: 12, color: "#111" }}>
        <table style={{ width: "100%", marginBottom: 14, borderBottom: "2px solid #0B3B36", paddingBottom: 10 }}><tbody><tr>
          <td style={{ width: 70, verticalAlign: "middle" }}>{(brand.logo_dokumen_url || brand.logo_url) && <img src={brand.logo_dokumen_url || brand.logo_url} alt="logo" style={{ width: 60 }} />}</td>
          <td style={{ verticalAlign: "middle" }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#0B3B36" }}>{brand.yayasan_nama}</div>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#0B3B36" }}>PONDOK TAHFIDZ QURAN DAN ENTREPRENEUR {brand.nama_pondok?.toUpperCase()}</div>
            <div style={{ fontSize: 9.5, color: "#44544D" }}>{brand.alamat_pondok}</div>
            <div style={{ fontSize: 9.5, color: "#44544D", fontStyle: "italic" }}>Contact: {brand.kontak_pondok}</div>
          </td>
        </tr></tbody></table>
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 14, marginBottom: 2 }}>BUKTI PEMBAYARAN CICILAN KOPERASI</div>
        <div style={{ textAlign: "center", fontSize: 10, color: "#555", marginBottom: 14 }}>No. {noKuitansi}</div>
        <table style={{ width: "100%", fontSize: 12, lineHeight: 1.7 }}><tbody>
          <tr><td style={{ width: 130 }}>Telah terima dari</td><td>: {santri?.nama || cicilan.nim} (NIM {cicilan.nim})</td></tr>
          <tr><td>Untuk pembayaran</td><td>: Cicilan Koperasi{cicilan.catatan ? ` — ${cicilan.catatan}` : ""}</td></tr>
          <tr><td>Uang sejumlah</td><td>: <b>{formatRupiah(cicilan.jumlah)}</b></td></tr>
          <tr><td>Terbilang</td><td>: <i style={{ textTransform: "capitalize" }}>{terbilang(cicilan.jumlah)} rupiah</i></td></tr>
          <tr><td>Metode Pembayaran</td><td>: {cicilan.metode_bayar || "-"}</td></tr>
          {sisaSetelah != null && <tr><td>Sisa tagihan koperasi</td><td>: {formatRupiah(sisaSetelah)}</td></tr>}
        </tbody></table>
        <div style={{ textAlign: "right", marginTop: 26, fontSize: 12 }}>
          <div>{tglBayar.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
          <div>Bendahara</div>
          {cicilan.dicatat_oleh ? (
            penandaTangan?.tanda_tangan_url ? (
              <img src={penandaTangan.tanda_tangan_url} alt="Tanda tangan" style={{ height: 48, marginBottom: -4 }} />
            ) : (
              <div style={{ fontFamily: "cursive", fontSize: 20, color: "#0B3B36", display: "inline-block", paddingTop: 8 }}>{cicilan.dicatat_oleh}</div>
            )
          ) : (
            <div style={{ height: 44 }}></div>
          )}
          <div style={{ borderTop: "1px solid #999", paddingTop: 2 }}>{cicilan.dicatat_oleh || "( ............................ )"}</div>
          {cicilan.dicatat_oleh && <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>Ditandatangani secara digital di SIAKAD</div>}
        </div>
        <div style={{ textAlign: "center", fontSize: 8.5, color: "#888", marginTop: 16, borderTop: "1px dashed #ccc", paddingTop: 8 }}>No. {noKuitansi} — Dicetak {new Date().toLocaleString("id-ID")}</div>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Btn tone="ghost" onClick={onClose}>Tutup</Btn>
        <Btn onClick={() => window.print()}>🖨 Cetak</Btn>
      </div>
    </Modal>
  );
}
function BuatIuranBulanan({ onCancel, onSubmit, jumlah }) {
  const [f, setF] = useState({ bulan: BULAN[new Date().getMonth()], tahun: nowYear, nominal: 500000 });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title="Buat Iuran Bulanan" onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
        <Field label="Bulan"><Select value={f.bulan} onChange={set("bulan")}>{BULAN.map((b) => <option key={b}>{b}</option>)}</Select></Field>
        <Field label="Tahun"><Input type="number" value={f.tahun} onChange={set("tahun")} /></Field>
        <Field label="Nominal Default (bila santri belum punya nominal SPP)"><Input type="number" value={f.nominal} onChange={set("nominal")} /></Field>
        <div className="text-xs text-stone-500 mb-1">Sistem membuat iuran berstatus "Belum Lunas" untuk semua santri ({jumlah} santri) yang belum punya iuran bulan itu. Yang sudah ada dilewati. Nominal otomatis diambil dari Data Mahasantri (Nominal SPP per Bulan); angka di atas hanya dipakai untuk santri yang belum diisi.</div>
        <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit">Buat Iuran</Btn></div>
      </form>
    </Modal>
  );
}
function BayarGabunganForm({ rows, defaultNominal, sisaKoperasi, onCancel, onSubmit }) {
  const belum = rows.filter((r) => r.status !== "Lunas").sort((a, b) => a.tahun - b.tahun || BULAN.indexOf(a.bulan) - BULAN.indexOf(b.bulan));
  const sekarang = new Date();
  const [f, setF] = useState({
    sppId: belum[0]?.id ?? "baru",
    total: belum[0] ? Number(belum[0].nominal) : Number(defaultNominal) || "",
    metode: "Transfer Bank",
    bulan: BULAN[sekarang.getMonth()], tahun: sekarang.getFullYear(), nominalBaru: defaultNominal || "",
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const baru = String(f.sppId) === "baru";
  const target = belum.find((r) => String(r.id) === String(f.sppId));
  const untukSpp = baru ? Number(f.nominalBaru || 0) : target ? Number(target.nominal || 0) : 0;
  const untukKop = Number(f.total || 0) - untukSpp;
  return (
    <Modal title="Terima Pembayaran" onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
        {belum.length === 0 && <div className="text-xs text-stone-500 mb-3">Belum ada tagihan SPP yang tertunda. Pilih bulan yang dibayar di bawah, tagihannya otomatis dibuat dan langsung ditandai Lunas.</div>}
        <Field label="Iuran SPP yang dibayar">
          <Select value={f.sppId} onChange={set("sppId")}>
            {belum.map((r) => <option key={r.id} value={r.id}>{r.bulan} {r.tahun} — {formatRupiah(r.nominal)}</option>)}
            <option value="baru">Bulan lain (belum ada tagihannya)</option>
          </Select>
        </Field>
        {baru && (
          <div className="grid grid-cols-3 gap-3">
            <Field label="Bulan"><Select value={f.bulan} onChange={set("bulan")}>{BULAN.map((b) => <option key={b}>{b}</option>)}</Select></Field>
            <Field label="Tahun"><Input type="number" value={f.tahun} onChange={set("tahun")} /></Field>
            <Field label="Nominal SPP (Rp)"><Input type="number" value={f.nominalBaru} onChange={set("nominalBaru")} /></Field>
          </div>
        )}
        <Field label="Total uang yang diterima (Rp)"><Input type="number" value={f.total} onChange={set("total")} /></Field>
        <Field label="Metode Pembayaran"><Select value={f.metode} onChange={set("metode")}><option>Transfer Bank</option><option>Tunai</option></Select></Field>
        <div className="rounded-xl bg-[#E9F1EE] p-3 text-sm mb-1">
          <div className="flex justify-between"><span>Untuk SPP</span><b>{formatRupiah(untukSpp)}</b></div>
          <div className="flex justify-between"><span>Untuk cicilan koperasi</span><b className={untukKop < 0 ? "text-red-600" : ""}>{formatRupiah(untukKop)}</b></div>
          {sisaKoperasi > 0 && <div className="text-xs text-stone-500 mt-1">Sisa tagihan koperasi saat ini {formatRupiah(sisaKoperasi)}</div>}
          {untukKop < 0 && <div className="text-xs text-red-600 mt-1">Jumlah diterima kurang dari nominal SPP.</div>}
        </div>
        <div className="text-xs text-stone-400">SPP otomatis ditandai Lunas; selisihnya dicatat sebagai cicilan koperasi.</div>
        <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit">Simpan</Btn></div>
      </form>
    </Modal>
  );
}
function KoperasiForm({ onCancel, onSubmit }) {
  const [f, setF] = useState({ jumlah: "", tanggal: new Date().toISOString().slice(0, 10), metode: "Transfer Bank", catatan: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title="Catat Cicilan Koperasi" onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
        <Field label="Jumlah (Rp)"><Input type="number" value={f.jumlah} onChange={set("jumlah")} /></Field>
        <Field label="Tanggal"><Input type="date" value={f.tanggal} onChange={set("tanggal")} /></Field>
        <Field label="Metode Pembayaran"><Select value={f.metode} onChange={set("metode")}><option>Transfer Bank</option><option>Tunai</option></Select></Field>
        <Field label="Catatan (opsional)"><Input value={f.catatan} onChange={set("catatan")} /></Field>
        <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit">Simpan</Btn></div>
      </form>
    </Modal>
  );
}
function SppForm({ initial, defaultNominal, onCancel, onSubmit }) {
  const [f, setF] = useState(initial || { bulan: BULAN[new Date().getMonth()], tahun: nowYear, nominal: Number(defaultNominal) > 0 ? Number(defaultNominal) : 500000, status: "Belum Lunas", metode_bayar: "Transfer Bank" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={initial ? "Edit Iuran SPP" : "Tambah Iuran SPP"} onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
        <Field label="Bulan"><Select value={f.bulan} onChange={set("bulan")}>{BULAN.map((b) => <option key={b}>{b}</option>)}</Select></Field>
        <Field label="Tahun"><Input type="number" value={f.tahun} onChange={set("tahun")} /></Field>
        <Field label="Nominal"><Input type="number" value={f.nominal} onChange={set("nominal")} /></Field>
        <Field label="Status Pembayaran">
          <Select value={f.status} onChange={set("status")}>
            <option>Belum Lunas</option>
            <option>Lunas</option>
          </Select>
        </Field>
        {f.status === "Lunas" && (
          <Field label="Metode Pembayaran">
            <Select value={f.metode_bayar || "Transfer Bank"} onChange={set("metode_bayar")}>
              <option>Transfer Bank</option>
              <option>Tunai</option>
            </Select>
          </Field>
        )}
        <div className="text-xs text-stone-400 mb-1">Pilih "Lunas" jika uangnya sudah diterima. Status juga bisa diubah nanti dengan mengklik badge di tabel.</div>
        <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit">Simpan</Btn></div>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------------- */
/* Kelola Akun                                                              */
/* ---------------------------------------------------------------------- */
function infoMasuk(ts) {
  if (!ts) return { text: "Belum pernah masuk", tone: "grey", hariIni: false };
  const d = new Date(ts), now = new Date();
  const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return { text: `Hari ini, ${jam}`, tone: "green", hariIni: true };
  const selisih = Math.floor((new Date(now.toDateString()) - new Date(d.toDateString())) / 86400000);
  if (selisih === 1) return { text: `Kemarin, ${jam}`, tone: "grey", hariIni: false };
  if (selisih < 7) return { text: `${selisih} hari lalu`, tone: "grey", hariIni: false };
  return { text: d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }), tone: "grey", hariIni: false };
}
const LABEL_TABEL_LOG = { santri: "Data Mahasantri", spp: "Iuran SPP", koperasi_cicilan: "Cicilan Koperasi", akademik: "Akademik", quran_log: "Capaian Al-Qur'an", ibadah_log: "Ibadah", profiles: "Akun", pengaturan_pondok: "Pengaturan", modul_kustom: "Menu Tambahan", modul_kustom_data: "Data Menu Tambahan", pengumuman: "Pengumuman", kurikulum: "Kurikulum", tahapan_akhir: "Tugas Akhir & Ujian", kalender_akademik: "Kalender Akademik" };
const LABEL_AKSI_LOG = { INSERT: ["Tambah", "green"], UPDATE: ["Ubah", "gold"], DELETE: ["Hapus", "red"] };
function ringkasLog(l, namaSantri) {
  const r = l.konteks || l.data_baru || l.data_lama || {};
  const sn = r.nim ? (namaSantri(r.nim) || r.nim) : "";
  const ganti = l.aksi === "UPDATE" && l.data_baru ? Object.keys(l.data_baru) : [];
  let t = "";
  if (l.tabel === "spp") t = `SPP ${r.bulan || ""} ${r.tahun || ""} — ${sn}` + (l.aksi === "UPDATE" && l.data_baru?.status ? ` (status ${l.data_lama?.status ?? "?"} → ${l.data_baru.status})` : "");
  else if (l.tabel === "koperasi_cicilan") t = `${sn}: cicilan koperasi ${formatRupiah(r.jumlah)}`;
  else if (l.tabel === "santri") t = r.nama || sn;
  else if (l.tabel === "quran_log") t = `${sn}: ${r.jenis || ""} ${r.halaman_dari ? `hlm ${r.halaman_dari}–${r.halaman_sampai}` : ""}`;
  else if (l.tabel === "ibadah_log") t = `${sn}: ${r.jenis || ""}${r.capaian ? ` (${r.capaian})` : ""}`;
  else if (l.tabel === "akademik") t = `${sn}: ${r.mata_kuliah || ""}`;
  else if (l.tabel === "profiles") t = `Akun ${r.username || r.nama || ""}`;
  else t = r.judul || r.nama || `ID ${l.id_baris || "-"}`;
  if (ganti.length && l.tabel !== "spp") t += ` · diubah: ${ganti.slice(0, 4).join(", ")}${ganti.length > 4 ? ", …" : ""}`;
  return t.trim();
}
function LogAktivitasPage() {
  const santriT = useTable("santri");
  const [rows, setRows] = useState([]);
  const [muat, setMuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [rentang, setRentang] = useState("hari");
  const [fUser, setFUser] = useState("");
  const [fTabel, setFTabel] = useState("");
  const [fAksi, setFAksi] = useState("");
  const [buka, setBuka] = useState(null);
  const namaSantri = (nim) => santriT.rows.find((x) => x.nim === nim)?.nama;
  async function load() {
    setMuat(true); setGalat("");
    let q = supabase.from("log_aktivitas").select("*").order("waktu", { ascending: false }).limit(1000);
    const d = new Date();
    if (rentang === "hari") { d.setHours(0, 0, 0, 0); q = q.gte("waktu", d.toISOString()); }
    else if (rentang === "7") { d.setDate(d.getDate() - 7); q = q.gte("waktu", d.toISOString()); }
    else if (rentang === "30") { d.setDate(d.getDate() - 30); q = q.gte("waktu", d.toISOString()); }
    const { data, error } = await q;
    if (error) setGalat(error.message); else setRows(data || []);
    setMuat(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [rentang]);
  const awalHari = new Date(); awalHari.setHours(0, 0, 0, 0);
  const hariIni = rows.filter((l) => new Date(l.waktu) >= awalHari);
  const perUser = {};
  hariIni.forEach((l) => { const k = l.nama || l.username || "Sistem / SQL Editor"; perUser[k] = perUser[k] || { n: 0, peran: l.peran }; perUser[k].n += 1; });
  const daftarUser = [...new Set(rows.map((l) => l.username || ""))];
  const tersaring = rows.filter((l) => (!fUser || (l.username || "") === fUser) && (!fTabel || l.tabel === fTabel) && (!fAksi || l.aksi === fAksi));
  const fmtWaktu = (w) => new Date(w).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const nilai = (v) => { const t = v === null || v === undefined ? "(kosong)" : typeof v === "object" ? JSON.stringify(v) : String(v); return t.length > 90 ? t.slice(0, 90) + "…" : t; };
  async function unduh() {
    const XLSX = await muatXLSX();
    const data = tersaring.map((l) => ({ Waktu: fmtWaktu(l.waktu), Pengguna: l.nama || l.username || "Sistem / SQL Editor", Peran: l.peran || "", Data: LABEL_TABEL_LOG[l.tabel] || l.tabel, Aksi: (LABEL_AKSI_LOG[l.aksi] || [l.aksi])[0], Keterangan: ringkasLog(l, namaSantri), "Nilai lama": l.data_lama ? JSON.stringify(l.data_lama) : "", "Nilai baru": l.data_baru ? JSON.stringify(l.data_baru) : "" }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Log Aktivitas");
    XLSX.writeFile(wb, `Log-Aktivitas-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
  return (
    <div>
      <PageHeader eyebrow="Keamanan" title="Log Aktivitas" sub="Jejak siapa menambah, mengubah, dan menghapus data. Dicatat otomatis oleh database dan tidak bisa diubah dari aplikasi." actions={<Btn tone="ghost" onClick={unduh}>⬇ Unduh Excel</Btn>} />
      {galat && <Card className="mb-4 border-red-200"><div className="text-sm text-red-700">Gagal memuat log: {galat}. Pastikan file <b>14-log-aktivitas.sql</b> sudah dijalankan di Supabase.</div></Card>}
      <Card className="mb-4">
        <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-2">Siapa yang mengubah data hari ini</h3>
        {Object.keys(perUser).length === 0 ? <div className="text-sm text-stone-400">Belum ada perubahan data hari ini.</div> : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(perUser).sort((a, b) => b[1].n - a[1].n).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-2 rounded-xl bg-[#E9F1EE] px-3 py-1.5 text-sm"><b className="text-[#0B3B36]">{k}</b>{v.peran && <span className="text-xs text-stone-500">{ROLE_LABEL[v.peran] || v.peran}</span>}<span className="text-xs font-bold text-[#145048]">{v.n} perubahan</span></span>
            ))}
          </div>
        )}
      </Card>
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <Select value={rentang} onChange={(e) => setRentang(e.target.value)} className="!w-auto"><option value="hari">Hari ini</option><option value="7">7 hari terakhir</option><option value="30">30 hari terakhir</option><option value="semua">Semua (maks. 1.000 terbaru)</option></Select>
        <Select value={fUser} onChange={(e) => setFUser(e.target.value)} className="!w-auto"><option value="">Semua pengguna</option>{daftarUser.map((u) => <option key={u} value={u}>{u || "Sistem / SQL Editor"}</option>)}</Select>
        <Select value={fTabel} onChange={(e) => setFTabel(e.target.value)} className="!w-auto"><option value="">Semua data</option>{Object.entries(LABEL_TABEL_LOG).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
        <Select value={fAksi} onChange={(e) => setFAksi(e.target.value)} className="!w-auto"><option value="">Semua aksi</option><option value="INSERT">Tambah</option><option value="UPDATE">Ubah</option><option value="DELETE">Hapus</option></Select>
        <Btn tone="ghost" onClick={load}>↻ Muat ulang</Btn>
        <span className="text-xs text-stone-400">{tersaring.length} catatan</span>
      </div>
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3">Waktu</th><th className="p-3">Pengguna</th><th className="p-3">Aksi</th><th className="p-3">Data</th><th className="p-3">Keterangan</th></tr></thead>
          <tbody>
            {tersaring.map((l) => {
              const [labelAksi, tone] = LABEL_AKSI_LOG[l.aksi] || [l.aksi, "grey"];
              const detail = l.aksi === "UPDATE" ? Object.keys(l.data_baru || {}).map((k) => [k, l.data_lama?.[k], l.data_baru[k]]) : Object.entries(l.data_baru || l.data_lama || {}).filter(([, v]) => v !== null && v !== "").map(([k, v]) => [k, null, v]);
              return (
                <React.Fragment key={l.id}>
                  <tr className="border-t border-stone-100 cursor-pointer hover:bg-stone-50/60" onClick={() => setBuka(buka === l.id ? null : l.id)}>
                    <td className="p-3 whitespace-nowrap text-xs text-stone-500">{fmtWaktu(l.waktu)}</td>
                    <td className="p-3"><div className="font-bold">{l.nama || l.username || "Sistem / SQL Editor"}</div>{l.peran && <div className="text-[0.6875rem] text-stone-400">{ROLE_LABEL[l.peran] || l.peran}</div>}</td>
                    <td className="p-3"><Badge tone={tone}>{labelAksi}</Badge></td>
                    <td className="p-3">{LABEL_TABEL_LOG[l.tabel] || l.tabel}</td>
                    <td className="p-3 text-stone-600">{ringkasLog(l, namaSantri)}</td>
                  </tr>
                  {buka === l.id && (
                    <tr className="bg-stone-50/70"><td colSpan={5} className="px-4 py-3">
                      <div className="text-[0.6875rem] font-bold uppercase text-stone-500 mb-1.5">{l.aksi === "UPDATE" ? "Perubahan (lama → baru)" : l.aksi === "INSERT" ? "Data yang ditambahkan" : "Data yang dihapus"}</div>
                      <div className="grid gap-1 text-xs">
                        {detail.map(([k, lama, baru]) => (
                          <div key={k} className="flex gap-2"><span className="w-40 text-stone-500 flex-shrink-0">{k}</span>{l.aksi === "UPDATE" ? <span><span className="text-red-600 line-through">{nilai(lama)}</span> <span className="text-stone-400">→</span> <b className="text-[#145048]">{nilai(baru)}</b></span> : <span>{nilai(baru)}</span>}</div>
                        ))}
                        {detail.length === 0 && <span className="text-stone-400">Tidak ada rincian.</span>}
                      </div>
                    </td></tr>
                  )}
                </React.Fragment>
              );
            })}
            {!muat && tersaring.length === 0 && <tr><td colSpan={5}><Empty text="Tidak ada catatan pada pilihan ini." /></td></tr>}
            {muat && <tr><td colSpan={5}><Empty text="Memuat…" /></td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
function KelolaAkunPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingAkun, setEditingAkun] = useState(null);
  const [msg, setMsg] = useState("");
  const profilesT = useTable("profiles");
  const santriT = useTable("santri");

  async function createAccount(f) {
    setMsg("");
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(f),
    });
    const data = await res.json();
    if (!res.ok) { setMsg("Gagal: " + data.error); return; }
    setMsg("Akun berhasil dibuat.");
    setShowForm(false);
    profilesT.reload();
  }

  async function updateAccount(f) {
    setMsg("");
    const { error } = await supabase.from("profiles").update({ nama: f.nama, role: f.role, nim: f.role === "santri" ? f.nim : null }).eq("id", f.id);
    if (error) { setMsg("Gagal: " + error.message); return; }
    setMsg("Akun berhasil diperbarui.");
    setEditingAkun(null);
    profilesT.reload();
  }

  return (
    <div>
      <PageHeader title="Kelola Akun" sub="Buat akun login baru untuk santri atau staf." actions={<Btn onClick={() => setShowForm(true)}>+ Tambah Akun</Btn>} />
      {msg && <div className="text-sm mb-4 p-3.5 rounded-xl bg-[#E9F1EE] text-[#0F4A44] font-medium">{msg}</div>}
      <Card className="bg-[#FBF3DF]/60 border-[#EDD9A0] text-sm text-[#8A6A2A] mb-5">
        💡 Contoh akun staf yang biasa dibutuhkan: <b>musyrifah1</b> (Musyrifah), <b>akademik1</b> (Staf Akademik),
        <b> bendahara1</b> (Bendahara), <b>pimpinan1</b> (Pimpinan Pondok — akses lihat semua data, tanpa mengedit).
      </Card>
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="font-bold text-sm text-[#0B3B36]">Daftar Akun</div>
          <div className="text-xs text-stone-400">{profilesT.rows.filter((p) => infoMasuk(p.last_login).hariIni).length} dari {profilesT.rows.length} akun sudah masuk hari ini</div>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3.5">Akun</th><th className="p-3.5">Peran</th><th className="p-3.5">Terakhir Masuk</th><th className="p-3.5 text-right">Aksi</th></tr></thead>
          <tbody>
            {[...profilesT.rows].sort((a, b) => String(b.last_login || "").localeCompare(String(a.last_login || ""))).map((p) => (
              <tr key={p.id} className="border-t border-stone-100">
                <td className="p-3.5"><div className="flex items-center gap-3"><Avatar name={p.nama} url={p.avatar_url} size={30} /><div><div className="font-bold">{p.nama}</div><div className="text-[0.6875rem] text-stone-400">{p.username || p.nim}</div></div></div></td>
                <td className="p-3.5"><Badge tone="grey">{ROLE_LABEL[p.role] || p.role}</Badge></td>
                <td className="p-3.5">{(() => { const m = infoMasuk(p.last_login); return <Badge tone={m.tone}>{m.text}</Badge>; })()}</td>
                <td className="p-3.5 text-right"><button onClick={() => setEditingAkun(p)} className="text-[#145048] text-xs font-bold">Edit</button></td>
              </tr>
            ))}
            {profilesT.rows.length === 0 && <tr><td colSpan={4}><Empty text="Belum ada akun." /></td></tr>}
          </tbody>
        </table>
      </Card>
      {showForm && <AkunForm onCancel={() => setShowForm(false)} onSubmit={createAccount} />}
      {editingAkun && <AkunEditForm initial={editingAkun} santriRows={santriT.rows} onCancel={() => setEditingAkun(null)} onSubmit={updateAccount} />}
    </div>
  );
}
function AkunEditForm({ initial, santriRows, onCancel, onSubmit }) {
  const [f, setF] = useState({ id: initial.id, nama: initial.nama || "", role: initial.role, nim: initial.nim || "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={`Edit Akun — ${initial.username || initial.nim}`} onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
        <Field label="Nama"><Input value={f.nama} onChange={set("nama")} /></Field>
        <Field label="Peran">
          <Select value={f.role} onChange={set("role")}>
            {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        {f.role === "santri" && (
          <Field label="Terhubung ke Data Mahasantri">
            <Select value={f.nim} onChange={set("nim")}>
              <option value="">— Pilih santri —</option>
              {santriRows.map((s) => <option key={s.nim} value={s.nim}>{s.nama} — {s.nim}</option>)}
            </Select>
          </Field>
        )}
        <div className="text-xs text-stone-400 mb-2">Username dan kata sandi tidak bisa diubah di sini. Untuk ganti kata sandi, pemilik akun bisa menggantinya sendiri lewat menu Pengaturan.</div>
        <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit">Simpan</Btn></div>
      </form>
    </Modal>
  );
}
function AkunForm({ onCancel, onSubmit }) {
  const [f, setF] = useState({ username: "", email: "", password: "", nama: "", role: "santri", nim: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title="Tambah Akun" onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} onKeyDown={(e) => { if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") { e.preventDefault(); onSubmit(f); } }}>
        <Field label="Username / NIM"><Input value={f.username} onChange={set("username")} required /></Field>
        <Field label="Nama"><Input value={f.nama} onChange={set("nama")} required /></Field>
        <Field label="Email">
          <Input type="email" value={f.email} onChange={set("email")} placeholder="cth. email wali/orang tua" required />
        </Field>
        <div className="text-xs text-stone-400 -mt-2 mb-3">Untuk mahasantri, isi dengan email orang tua/wali. Email ini dipakai untuk fitur "Lupa Kata Sandi", jadi pastikan aktif dan bisa diakses.</div>
        <Field label="Kata Sandi (min. 6 karakter)"><Input type="password" value={f.password} onChange={set("password")} required /></Field>
        <Field label="Peran">
          <Select value={f.role} onChange={set("role")}>
            <option value="santri">Mahasantri</option>
            <option value="admin">Administrator</option>
            <option value="musyrif">Musyrif</option>
            <option value="musyrifah">Musyrifah</option>
            <option value="keuangan">Bendahara (Keuangan)</option>
            <option value="akademik">Staf Akademik</option>
            <option value="pimpinan">Pimpinan Pondok</option>
          </Select>
        </Field>
        <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit">Buat Akun</Btn></div>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------------- */
/* Pengaturan — profil, foto, ganti kata sandi, + branding (admin)          */
/* ---------------------------------------------------------------------- */
/* ---------------------------------------------------------------------- */
/* Menu Tambahan (buatan administrator, tanpa deploy)                       */
/* ---------------------------------------------------------------------- */
const TIPE_KOLOM = [["teks", "Teks pendek"], ["teks_panjang", "Teks panjang"], ["angka", "Angka"], ["rupiah", "Rupiah"], ["tanggal", "Tanggal"], ["pilihan", "Pilihan"], ["santri", "Pilih Mahasantri"]];
function ModulKustomPage({ modul, profile }) {
  const kolom = modul.kolom || [];
  const editable = profile.role === "admin" || (modul.peran_edit || []).includes(profile.role);
  const santriT = useTable("santri");
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null);
  async function load() {
    const { data } = await supabase.from("modul_kustom_data").select("*").eq("modul_id", modul.id).order("id", { ascending: false });
    setRows(data || []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [modul.id]);
  const namaSantri = (nim) => santriT.rows.find((x) => x.nim === nim)?.nama || nim;
  const tampil = (c, v) => {
    if (v == null || v === "") return "-";
    if (c.tipe === "rupiah") return formatRupiah(v);
    if (c.tipe === "tanggal") return new Date(v).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    if (c.tipe === "santri") return namaSantri(v);
    return String(v);
  };
  const tersaring = rows.filter((r) => !q || kolom.map((c) => tampil(c, r.data?.[c.key])).join(" ").toLowerCase().includes(q.toLowerCase()));
  async function simpan(data, id) {
    const { error } = id
      ? await supabase.from("modul_kustom_data").update({ data, diubah_pada: new Date().toISOString() }).eq("id", id)
      : await supabase.from("modul_kustom_data").insert({ modul_id: modul.id, data, dibuat_oleh: profile.nama || profile.username });
    if (error) alert(error.message); else { setForm(null); load(); }
  }
  async function hapus(r) {
    if (!confirm("Hapus baris ini?")) return;
    const { error } = await supabase.from("modul_kustom_data").delete().eq("id", r.id);
    if (error) alert(error.message); else load();
  }
  function unduhCsv() {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const baris = [kolom.map((c) => esc(c.label)).join(","), ...tersaring.map((r) => kolom.map((c) => esc(tampil(c, r.data?.[c.key]))).join(","))];
    const url = URL.createObjectURL(new Blob(["\ufeff" + baris.join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `${modul.nama}.csv`; a.click(); URL.revokeObjectURL(url);
  }
  return (
    <div>
      <PageHeader title={modul.nama} sub={`${rows.length} data tercatat`} actions={<div className="flex gap-2"><Btn tone="ghost" onClick={unduhCsv}>⬇ Unduh CSV</Btn>{editable && <Btn onClick={() => setForm({})}>+ Tambah Data</Btn>}</div>} />
      <div className="mb-4 max-w-xs"><Input placeholder="Cari..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase tracking-wide text-stone-500">{kolom.map((c) => <th key={c.key} className="p-3.5">{c.label}</th>)}{editable && <th className="p-3.5 text-right">Aksi</th>}</tr></thead>
          <tbody>
            {tersaring.map((r) => (
              <tr key={r.id} className="border-t border-stone-100">
                {kolom.map((c) => <td key={c.key} className="p-3.5 whitespace-pre-line">{tampil(c, r.data?.[c.key])}</td>)}
                {editable && <td className="p-3.5 text-right whitespace-nowrap">
                  <button onClick={() => setForm(r)} className="text-[#145048] text-xs font-bold mr-3">Edit</button>
                  <button onClick={() => hapus(r)} className="text-red-600 text-xs font-bold">Hapus</button>
                </td>}
              </tr>
            ))}
            {tersaring.length === 0 && <tr><td colSpan={kolom.length + 1}><Empty text="Belum ada data." /></td></tr>}
          </tbody>
        </table>
      </Card>
      {form && <ModulKustomForm modul={modul} initial={form.id ? form : null} santriRows={santriT.rows} onCancel={() => setForm(null)} onSubmit={simpan} />}
    </div>
  );
}
function ModulKustomForm({ modul, initial, santriRows, onCancel, onSubmit }) {
  const [f, setF] = useState(initial?.data || {});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={`${initial ? "Edit" : "Tambah"} — ${modul.nama}`} onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f, initial?.id); }}>
        {(modul.kolom || []).map((c) => (
          <Field key={c.key} label={c.label}>
            {c.tipe === "teks_panjang" ? <textarea className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm" rows={3} value={f[c.key] ?? ""} onChange={set(c.key)} />
              : c.tipe === "pilihan" ? <Select value={f[c.key] ?? ""} onChange={set(c.key)}><option value="">— Pilih —</option>{(c.opsi || []).map((o) => <option key={o}>{o}</option>)}</Select>
              : c.tipe === "santri" ? <Select value={f[c.key] ?? ""} onChange={set(c.key)}><option value="">— Pilih mahasantri —</option>{santriRows.map((x) => <option key={x.nim} value={x.nim}>{x.nama} — {x.nim}</option>)}</Select>
              : <Input type={c.tipe === "angka" || c.tipe === "rupiah" ? "number" : c.tipe === "tanggal" ? "date" : "text"} value={f[c.key] ?? ""} onChange={set(c.key)} />}
          </Field>
        ))}
        <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit">Simpan</Btn></div>
      </form>
    </Modal>
  );
}
function MenuKustomManager({ onChanged }) {
  const modulT = useTable("modul_kustom");
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");
  async function simpan(f) {
    const payload = { nama: f.nama.trim(), ikon: f.ikon || "📄", kolom: f.kolom, peran_lihat: [...new Set([...f.peran_lihat, ...f.peran_edit])], peran_edit: f.peran_edit };
    const { error } = f.id ? await supabase.from("modul_kustom").update(payload).eq("id", f.id) : await supabase.from("modul_kustom").insert(payload);
    if (error) { alert(error.message); return; }
    setEditing(null); setMsg(f.id ? "Menu berhasil diperbarui." : "Menu baru berhasil dibuat dan sudah muncul di sidebar."); modulT.reload(); onChanged && onChanged();
  }
  async function hapus(m) {
    if (!confirm(`Hapus menu "${m.nama}" beserta SEMUA datanya? Tindakan ini tidak bisa dibatalkan.`)) return;
    const { error } = await supabase.from("modul_kustom").delete().eq("id", m.id);
    if (error) alert(error.message); else { setMsg("Menu dihapus."); modulT.reload(); onChanged && onChanged(); }
  }
  return (
    <Card className="mb-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold">Menu Tambahan</h3>
        <Btn onClick={() => setEditing("new")}>+ Buat Menu Baru</Btn>
      </div>
      <p className="text-xs text-stone-500 mb-4">Buat menu baru sendiri (misalnya Inventaris, Data Alumni, Absensi Kegiatan) tanpa perlu pengembang. Menu langsung muncul di sidebar sesuai peran yang Anda pilih.</p>
      {msg && <div className="text-sm mb-3 p-3 rounded-xl bg-[#E9F1EE] text-[#0F4A44] font-medium">{msg}</div>}
      <div className="space-y-2">
        {modulT.rows.sort((a, b) => a.id - b.id).map((m) => (
          <div key={m.id} className="flex items-center justify-between border border-stone-200 rounded-xl px-4 py-3">
            <div><div className="font-bold text-sm">{m.ikon || "📄"} {m.nama}</div><div className="text-xs text-stone-400">{(m.kolom || []).length} kolom · dilihat: {(m.peran_lihat || []).map((r) => ROLE_LABEL[r] || r).join(", ") || "hanya Administrator"}</div></div>
            <div className="whitespace-nowrap"><button onClick={() => setEditing(m)} className="text-[#145048] text-xs font-bold mr-3">Edit</button><button onClick={() => hapus(m)} className="text-red-600 text-xs font-bold">Hapus</button></div>
          </div>
        ))}
        {modulT.rows.length === 0 && <div className="text-sm text-stone-400 py-3">Belum ada menu tambahan.</div>}
      </div>
      {editing && <MenuKustomForm initial={editing === "new" ? null : editing} onCancel={() => setEditing(null)} onSubmit={simpan} />}
    </Card>
  );
}
function MenuKustomForm({ initial, onCancel, onSubmit }) {
  const [f, setF] = useState(initial ? { ...initial, kolom: (initial.kolom || []).map((c) => ({ ...c, opsiText: (c.opsi || []).join(", ") })), peran_lihat: initial.peran_lihat || [], peran_edit: initial.peran_edit || [] } : { nama: "", ikon: "📄", kolom: [{ key: "k" + Date.now().toString(36), label: "", tipe: "teks", opsiText: "" }], peran_lihat: [], peran_edit: [] });
  const peran = Object.entries(ROLE_LABEL).filter(([k]) => k !== "admin");
  const setKol = (i, patch) => setF({ ...f, kolom: f.kolom.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const geser = (i, d) => { const k = [...f.kolom]; const j = i + d; if (j < 0 || j >= k.length) return; [k[i], k[j]] = [k[j], k[i]]; setF({ ...f, kolom: k }); };
  const toggle = (field, r) => setF({ ...f, [field]: f[field].includes(r) ? f[field].filter((x) => x !== r) : [...f[field], r] });
  function kirim(e) {
    e.preventDefault();
    const kolom = f.kolom.filter((c) => c.label.trim()).map((c) => ({ key: c.key, label: c.label.trim(), tipe: c.tipe, ...(c.tipe === "pilihan" ? { opsi: (c.opsiText || "").split(",").map((o) => o.trim()).filter(Boolean) } : {}) }));
    if (!f.nama.trim()) { alert("Isi nama menu."); return; }
    if (kolom.length === 0) { alert("Tambahkan minimal satu kolom."); return; }
    onSubmit({ ...f, kolom });
  }
  return (
    <Modal title={initial ? "Edit Menu Tambahan" : "Buat Menu Baru"} onClose={onCancel}>
      <form onSubmit={kirim}>
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-3"><Field label="Nama Menu"><Input value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} placeholder="mis. Inventaris" /></Field></div>
          <Field label="Ikon (emoji)"><Input value={f.ikon} onChange={(e) => setF({ ...f, ikon: e.target.value })} /></Field>
        </div>
        <div className="text-xs font-extrabold text-[#B8935A] uppercase tracking-[0.1em] mb-2">Kolom Isian</div>
        {f.kolom.map((c, i) => (
          <div key={c.key} className="border border-stone-200 rounded-xl p-3 mb-2 bg-stone-50/60">
            <div className="flex gap-2 items-center">
              <Input value={c.label} onChange={(e) => setKol(i, { label: e.target.value })} placeholder={`Nama kolom ${i + 1}`} />
              <Select value={c.tipe} onChange={(e) => setKol(i, { tipe: e.target.value })} className="max-w-[170px]">{TIPE_KOLOM.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
              <button type="button" onClick={() => geser(i, -1)} className="text-stone-500 px-1">↑</button>
              <button type="button" onClick={() => geser(i, 1)} className="text-stone-500 px-1">↓</button>
              <button type="button" onClick={() => { if (!c.label || confirm("Hapus kolom ini? Data lama di kolom ini tidak tampil lagi.")) setF({ ...f, kolom: f.kolom.filter((_, j) => j !== i) }); }} className="text-red-600 px-1">✕</button>
            </div>
            {c.tipe === "pilihan" && <div className="mt-2"><Input value={c.opsiText} onChange={(e) => setKol(i, { opsiText: e.target.value })} placeholder="Daftar pilihan, pisahkan dengan koma. mis. Baik, Rusak, Hilang" /></div>}
          </div>
        ))}
        <Btn tone="ghost" onClick={() => setF({ ...f, kolom: [...f.kolom, { key: "k" + Date.now().toString(36), label: "", tipe: "teks", opsiText: "" }] })}>+ Tambah Kolom</Btn>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <div className="text-xs font-extrabold text-stone-500 uppercase mb-1.5">Boleh melihat</div>
            {peran.map(([k, l]) => <label key={k} className="flex items-center gap-2 text-sm py-0.5"><input type="checkbox" checked={f.peran_lihat.includes(k) || f.peran_edit.includes(k)} disabled={f.peran_edit.includes(k)} onChange={() => toggle("peran_lihat", k)} />{l}</label>)}
          </div>
          <div>
            <div className="text-xs font-extrabold text-stone-500 uppercase mb-1.5">Boleh mengisi / mengubah</div>
            {peran.map(([k, l]) => <label key={k} className="flex items-center gap-2 text-sm py-0.5"><input type="checkbox" checked={f.peran_edit.includes(k)} onChange={() => toggle("peran_edit", k)} />{l}</label>)}
          </div>
        </div>
        <div className="text-xs text-stone-400 mt-2">Administrator selalu bisa melihat dan mengisi. Hati-hati: jika "Mahasantri / Wali" diberi akses lihat, mereka melihat semua baris, bukan hanya milik sendiri.</div>
        <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit">Simpan Menu</Btn></div>
      </form>
    </Modal>
  );
}

const NAMA_BULAN_ID = BULAN;
function RekapSpp({ santriRows, sppRows, koperasiRows, brand, onBack }) {
  const [bulan, setBulan] = useState(BULAN[new Date().getMonth()]);
  const [tahun, setTahun] = useState(nowYear);
  const mm = String(BULAN.indexOf(bulan) + 1).padStart(2, "0");
  const sppBulan = sppRows.filter((r) => r.bulan === bulan && Number(r.tahun) === Number(tahun));
  const baris = [...santriRows].sort((a, b) => a.nama.localeCompare(b.nama)).map((s) => {
    const r = sppBulan.find((x) => x.nim === s.nim);
    const cicilBulan = koperasiRows.filter((c) => c.nim === s.nim && String(c.tanggal || "").startsWith(`${tahun}-${mm}`)).reduce((a, c) => a + Number(c.jumlah || 0), 0);
    const totalCicil = koperasiRows.filter((c) => c.nim === s.nim).reduce((a, c) => a + Number(c.jumlah || 0), 0);
    const sisa = Math.max(0, Number(s.tagihan_koperasi || 0) - totalCicil);
    return { nim: s.nim, nama: s.nama, nominal: r ? Number(r.nominal || 0) : 0, status: r ? r.status : "Belum ada iuran", tglBayar: r?.tanggal_bayar || "", metode: r?.metode_bayar || "", cicilBulan, sisa };
  });
  const tertagih = baris.reduce((a, b) => a + b.nominal, 0);
  const diterima = baris.filter((b) => b.status === "Lunas").reduce((a, b) => a + b.nominal, 0);
  const jmlLunas = baris.filter((b) => b.status === "Lunas").length;
  const jmlBelum = baris.filter((b) => b.status !== "Lunas" && b.status !== "Belum ada iuran").length;
  const koperasiMasuk = baris.reduce((a, b) => a + b.cicilBulan, 0);
  const koperasiSisa = baris.reduce((a, b) => a + b.sisa, 0);
  const tgl = (v) => v ? new Date(v).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";
  async function unduhExcel() {
    const XLSX = await muatXLSX();
    const aoa = [
      [`Rekap Iuran SPP & Koperasi — ${bulan} ${tahun}`], [brand.nama_pondok || ""], [],
      ["Jumlah santri", baris.length], ["Sudah lunas", jmlLunas], ["Belum lunas", jmlBelum],
      ["Total tertagih SPP", tertagih], ["SPP diterima", diterima], ["SPP belum diterima", tertagih - diterima],
      ["Cicilan koperasi masuk bulan ini", koperasiMasuk], ["Total sisa tagihan koperasi", koperasiSisa], [],
      ["NIM", "Nama", "Nominal SPP", "Status", "Tanggal Bayar", "Metode", "Cicilan Koperasi Bulan Ini", "Sisa Tagihan Koperasi"],
      ...baris.map((b) => [b.nim, b.nama, b.nominal, b.status, b.tglBayar, b.metode, b.cicilBulan, b.sisa]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wch: 14 }, { wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 24 }, { wch: 22 }];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, `Rekap ${bulan} ${tahun}`.slice(0, 31));
    XLSX.writeFile(wb, `Rekap-SPP-${bulan}-${tahun}.xlsx`);
  }
  return (
    <div>
      <BackBar onBack={onBack} />
      <PageHeader title="Rekap Bulanan SPP & Koperasi" sub="Ringkasan pembayaran per bulan untuk laporan." actions={<div className="flex gap-2"><Btn tone="ghost" onClick={unduhExcel}>⬇ Unduh Excel</Btn><Btn tone="gold" onClick={() => window.print()}>🖨 Cetak / PDF</Btn></div>} />
      <div className="flex gap-3 mb-5 max-w-sm print:hidden">
        <Select value={bulan} onChange={(e) => setBulan(e.target.value)}>{BULAN.map((b) => <option key={b}>{b}</option>)}</Select>
        <Input type="number" value={tahun} onChange={(e) => setTahun(e.target.value)} />
      </div>
      <style>{`@media print { body * { visibility: hidden; } .rekap-print, .rekap-print * { visibility: visible; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .rekap-print { position: absolute; top: 0; left: 0; width: 100%; padding: 16px 24px; } }`}</style>
      <div className="rekap-print">
        <div className="hidden print:block mb-3" style={{ borderBottom: "2px solid #0B3B36", paddingBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0B3B36" }}>{brand.nama_pondok}</div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Rekap Iuran SPP &amp; Koperasi — {bulan} {tahun}</div>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-5">
          <StatCard label="Lunas / Total Santri" value={`${jmlLunas} / ${baris.length}`} />
          <StatCard label="SPP Diterima" value={formatRupiah(diterima)} sub={`dari ${formatRupiah(tertagih)}`} />
          <StatCard label="SPP Belum Diterima" value={formatRupiah(tertagih - diterima)} />
          <StatCard label="Cicilan Koperasi Masuk" value={formatRupiah(koperasiMasuk)} sub={`Sisa tagihan ${formatRupiah(koperasiSisa)}`} />
        </div>
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3">Mahasantri</th><th className="p-3">SPP</th><th className="p-3">Status</th><th className="p-3">Tgl Bayar</th><th className="p-3">Cicilan Koperasi</th><th className="p-3">Sisa Koperasi</th></tr></thead>
            <tbody>
              {baris.map((b) => (
                <tr key={b.nim} className="border-t border-stone-100">
                  <td className="p-3"><div className="font-bold">{b.nama}</div><div className="text-[0.6875rem] text-stone-400">{b.nim}</div></td>
                  <td className="p-3">{formatRupiah(b.nominal)}</td>
                  <td className="p-3"><Badge tone={b.status === "Lunas" ? "green" : b.status === "Belum ada iuran" ? "grey" : "red"}>{b.status}</Badge></td>
                  <td className="p-3">{tgl(b.tglBayar)}</td>
                  <td className="p-3">{b.cicilBulan ? formatRupiah(b.cicilBulan) : "-"}</td>
                  <td className="p-3">{b.sisa ? formatRupiah(b.sisa) : "-"}</td>
                </tr>
              ))}
              {baris.length === 0 && <tr><td colSpan={6}><Empty text="Belum ada santri." /></td></tr>}
            </tbody>
          </table>
        </Card>
        <div className="hidden print:block text-[10px] text-stone-500 mt-3">Dicetak {new Date().toLocaleString("id-ID")} dari SIAKAD</div>
      </div>
    </div>
  );
}
async function ambilSemuaBaris(tabel, kolom = "*") {
  const hasil = []; let dari = 0;
  for (;;) {
    const { data, error } = await supabase.from(tabel).select(kolom).range(dari, dari + 999);
    if (error) throw new Error(`${tabel}: ${error.message}`);
    hasil.push(...(data || []));
    if (!data || data.length < 1000) break;
    dari += 1000;
  }
  return hasil;
}
function WarnaGrafikCard({ brand, onBrandUpdated }) {
  const [w, setW] = useState(warnaGrafik(brand));
  const [msg, setMsg] = useState("");
  const kelompok = [
    ["Hafalan baru per bulan", [["hafalan", "Batang hafalan"]]],
    ["Kepatuhan ibadah", [["ibadah_baik", "Terpenuhi"], ["ibadah_sebagian", "Sebagian / sendiri"], ["ibadah_kurang", "Tidak dikerjakan"]]],
    ["Tren pembayaran SPP", [["spp_lunas", "Lunas"], ["spp_belum", "Belum lunas"]]],
    ["Setoran Al-Qur'an per jenis", JENIS_SETORAN_QURAN.map((j) => [j, j])],
  ];
  async function simpan() {
    const { error } = await supabase.from("pengaturan_pondok").update({ warna_grafik: w }).eq("id", 1);
    if (error) setMsg("Gagal: " + error.message + " (pastikan SQL 11-warna-grafik.sql sudah dijalankan)"); else { setMsg("Warna grafik disimpan."); onBrandUpdated && onBrandUpdated(); }
  }
  return (
    <Card className="mb-5">
      <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-1">Warna Grafik</h3>
      <p className="text-xs text-stone-500 mb-4">Ubah warna batang pada grafik di Dashboard. Klik kotak warna untuk memilih.</p>
      {msg && <div className="text-sm mb-3 p-3 rounded-xl bg-[#E9F1EE] text-[#0F4A44] font-medium">{msg}</div>}
      <div className="text-xs font-extrabold text-stone-500 uppercase tracking-wide mb-2">Tema siap pakai</div>
      <div className="flex flex-wrap gap-2 mb-5">
        {PALET_GRAFIK.map((p) => (
          <button key={p.nama} type="button" onClick={() => setW({ ...p.warna })} className="flex items-center gap-2 border border-stone-200 rounded-xl px-3 py-2 hover:border-[#B8935A] hover:bg-[#FBF3DF]/50 text-left">
            <span className="flex -space-x-1">{[p.warna.hafalan, p.warna.ibadah_sebagian, p.warna.ibadah_kurang, p.warna.Tilawah].map((c, i) => <span key={i} className="w-4 h-4 rounded-full border border-white inline-block" style={{ backgroundColor: c }} />)}</span>
            <span className="text-xs font-bold text-stone-700">{p.nama}</span>
          </button>
        ))}
      </div>
      <div className="text-xs text-stone-400 mb-4">Pilih tema untuk mengisi semua warna sekaligus, lalu sesuaikan satu per satu bila perlu. Jangan lupa klik Simpan Warna.</div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {kelompok.map(([judul, items]) => (
          <div key={judul}>
            <div className="text-xs font-extrabold text-stone-500 uppercase tracking-wide mb-2">{judul}</div>
            {items.map(([k, label]) => (
              <label key={k} className="flex items-center justify-between gap-3 py-1 text-sm">
                <span>{label}</span>
                <span className="flex items-center gap-2"><span className="text-[0.6875rem] text-stone-400 font-mono">{w[k]}</span><input type="color" value={w[k]} onChange={(e) => setW({ ...w, [k]: e.target.value })} className="w-9 h-7 p-0 border border-stone-300 rounded cursor-pointer bg-white" /></span>
              </label>
            ))}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-5"><Btn tone="gold" onClick={simpan}>Simpan Warna</Btn><Btn tone="ghost" onClick={() => setW({ ...GRAFIK_DEFAULT })}>Kembalikan ke bawaan</Btn></div>
    </Card>
  );
}
function BackupDataCard() {
  const [proses, setProses] = useState(false);
  const [msg, setMsg] = useState("");
  async function unduh() {
    setProses(true); setMsg("");
    try {
      const XLSX = await muatXLSX();
      const datar = (rows) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v !== null && typeof v === "object" ? JSON.stringify(v) : v])));
      const lembar = [
        ["Mahasantri", "santri"], ["Akademik", "akademik"], ["Tugas Akhir & Ujian", "tahapan_akhir"], ["Daftar Mata Kuliah", "mata_kuliah_master"], ["Amalan Sunnah Tambahan", "jenis_ibadah_kustom"], ["Iuran SPP", "spp"], ["Cicilan Koperasi", "koperasi_cicilan"],
        ["Capaian Quran", "quran_log"], ["Ibadah", "ibadah_log"], ["Kalender Akademik", "kalender_akademik"], ["Pengumuman", "pengumuman"],
      ];
      const wb = XLSX.utils.book_new(); const gagal = [];
      for (const [nama, tabel] of lembar) {
        try { const rows = await ambilSemuaBaris(tabel); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datar(rows)), nama.slice(0, 31)); }
        catch (e) { gagal.push(nama); }
      }
      try {
        const prof = await ambilSemuaBaris("profiles", "username,nama,role,nim,last_login");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prof), "Akun");
      } catch (e) { gagal.push("Akun"); }
      try {
        const moduls = await ambilSemuaBaris("modul_kustom"); const isi = await ambilSemuaBaris("modul_kustom_data");
        moduls.forEach((m) => {
          const baris = isi.filter((d) => d.modul_id === m.id).map((d) => Object.fromEntries((m.kolom || []).map((c) => [c.label, d.data?.[c.key] ?? ""])));
          XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(baris), `Menu ${m.nama}`.replace(/[\\/?*\[\]:]/g, " ").slice(0, 31));
        });
      } catch (e) { /* menu tambahan belum dipasang */ }
      XLSX.writeFile(wb, `Cadangan-SIAKAD-${new Date().toISOString().slice(0, 10)}.xlsx`);
      setMsg(gagal.length ? `Cadangan diunduh, tetapi bagian ini gagal diambil: ${gagal.join(", ")}.` : "Cadangan berhasil diunduh.");
    } catch (e) { setMsg("Gagal membuat cadangan: " + e.message); }
    setProses(false);
  }
  return (
    <Card className="mb-5">
      <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-1">Cadangan Data (Backup)</h3>
      <p className="text-xs text-stone-500 mb-4">Unduh seluruh data SIAKAD ke satu file Excel (satu lembar per jenis data). Lakukan rutin, misalnya sebulan sekali. File berisi data pribadi santri, jadi simpan di tempat yang aman dan jangan dibagikan sembarangan.</p>
      {msg && <div className="text-sm mb-3 p-3 rounded-xl bg-[#E9F1EE] text-[#0F4A44] font-medium">{msg}</div>}
      <Btn tone="gold" onClick={unduh} disabled={proses}>{proses ? "Menyiapkan file…" : "⬇ Unduh Semua Data (Excel)"}</Btn>
    </Card>
  );
}

/* Riwayat pembaruan — TAMBAHKAN entri baru di paling atas setiap ada fitur baru */
const RIWAYAT_PEMBARUAN = [
  { tgl: "Okt 2026", judul: "Gambaran pencapaian target di Rekap Pencapaian", isi: "Bagian baru di atas rekap: diagram lingkaran status pencapaian (tercapai, sebagian pekan, belum tercapai, tanpa target/data) untuk Ziyadah dan Ibadah, grafik batang per angkatan, serta dua daftar nama berbar kemajuan: yang mencapai target dan yang belum (paling rendah di atas). Tersedia untuk tampilan Per Bulan dan Per Pekan, ikut tercetak.", lokasi: "Rekap Pencapaian" },
  { tgl: "Okt 2026", judul: "Nomor semester di KRS, pilihan pengampu, rekap per jenis setoran", isi: "KRS dan KHS mencetak Semester : 1, 2, 3 (bukan Ganjil/Genap). Pengampu dipilih dengan klik nama dari daftar, hanya yang dipilih yang tercetak. Rekap Pencapaian memakai istilah Ziyadah dan menambah rekap per jenis (Ziyadah, Murajaah, Tasmi', Tilawah, Tahsin, Talaqqi, Syahadah) per bulan dan per pekan, juga di Excel. Butuh file SQL 24-semester-ke.sql.", lokasi: "KRS & KHS, Rekap Pencapaian" },
  { tgl: "Okt 2026", judul: "Syarat Syahadah Kubro mengikuti Capaian Al-Qur'an", isi: "Syahadah Kubro terbuka hanya jika Ziyadah 30 juz sudah selesai (juz dikuasai 30) dan sudah ada catatan Tasmi'. Kartu tahap menampilkan juz dan Tasmi' saat ini, dan Monitoring → Siap Diajukan hanya menampilkan yang memenuhi syarat. Admin/Akademik tetap dapat Input Manual untuk data lama.", lokasi: "Akademik → Tugas Akhir & Ujian" },
  { tgl: "Okt 2026", judul: "Urutan tugas akhir diperbarui, pengajuan Wisuda, pilihan pengampu per semester", isi: "Alur menjadi Magang lalu KPM lalu Sidang Akhir Bisnis; Sidang Munaqasyah dan Syahadah Kubro berdiri sendiri; Pengambilan Sanad setelah Syahadah Kubro; Wisuda sebagai tahap terakhir setelah semua tahap lulus (dengan penanda tunggakan SPP). Di Ambil dari Daftar, pengampu tiap mata kuliah dapat dipilih per semester tanpa input ganda.", lokasi: "Akademik → Tugas Akhir & Ujian dan KRS" },
  { tgl: "Okt 2026", judul: "Ringkasan Tugas Akhir & Ujian siap cetak, ikon formal", isi: "Di tab Tugas Akhir & Ujian mahasantri ada Pratinjau & Cetak Ringkasan: dokumen berkop pondok berisi enam tahap, status, tanggal, pembimbing/penguji, nilai, karya bisnis, tanda tangan, dan QR. Ikon emoji pada tiap tahap diganti ikon garis seragam agar tampil lebih formal.", lokasi: "Akademik → Tugas Akhir & Ujian" },
  { tgl: "Okt 2026", judul: "Transkrip Nilai", isi: "Di KRS & KHS kini ada pilihan ketiga: Transkrip. Menampilkan seluruh mata kuliah berstatus selesai per semester, nilai, bobot, total SKS, IPK, ringkasan Tugas Akhir & Ujian yang sudah lulus, dan rekap hafalan, siap dicetak dengan tanda tangan dan QR.", lokasi: "Akademik → KRS & KHS → Transkrip" },
  { tgl: "Okt 2026", judul: "Catatan bintang (*) di KRS dan KHS", isi: "Mata kuliah yang namanya diakhiri tanda * (mis. Bahasa Arab*) memunculkan catatan kaki kecil bercetak miring di bawah tabel KRS dan KHS. Teks catatan dapat diubah administrator di Akademik → Daftar Mata Kuliah. Butuh file SQL 23-catatan-krs.sql.", lokasi: "Akademik → Daftar Mata Kuliah dan KRS & KHS" },
  { tgl: "Okt 2026", judul: "Pengampu mata kuliah lebih dari satu", isi: "Pengampu di Daftar Mata Kuliah dan form KRS bisa diisi lebih dari satu orang (misalnya musyrif dan musyrifah) dengan tombol + Tambah pengampu. Nama musyrif/musyrifah muncul sebagai saran saat mengetik. Butuh file SQL 22-kolom-akademik.sql untuk melengkapi kolom tabel akademik.", lokasi: "Akademik → Daftar Mata Kuliah dan KRS" },
  { tgl: "Okt 2026", judul: "Tahajud + Witir dan amalan sunnah tambahan", isi: "Ibadah Tahajud kini bernama Tahajud + Witir. Administrator dapat menambah amalan sunnah baru (misalnya Puasa Senin-Kamis) di Pengaturan → Amalan Sunnah Tambahan; amalan aktif otomatis muncul di Catat Semua Ibadah dan masuk rekap. Butuh file SQL 21-amalan-tambahan.sql.", lokasi: "Pengaturan → Amalan Sunnah Tambahan" },
  { tgl: "Okt 2026", judul: "Catat Semua Ibadah sekaligus", isi: "Di halaman Ibadah per mahasantri, tombol Catat Semua Ibadah membuka satu form berisi shalat lima waktu, rawatib, dhuha, tahajud, Al-Ma'tsurat, Al-Kahfi, dan puasa sunnah. Pilih capaian tiap ibadah, lalu Simpan Semua sekali jalan. Ada tombol Semua dikerjakan, dan tanggal yang sudah pernah dicatat tampil kembali untuk diperbarui.", lokasi: "Ibadah → pilih mahasantri → Catat Semua Ibadah" },
  { tgl: "Okt 2026", judul: "Presensi Shalat Berjamaah lima waktu", isi: "Tab baru di menu Ibadah untuk mencatat shalat berjamaah Subuh, Dzuhur, Ashar, Maghrib, dan Isya bagi banyak mahasantri sekaligus. Semua otomatis berjamaah, musyrif hanya mengubah yang berbeda (sendiri, udzur, tidak shalat), lalu Simpan. Ada rekap harian lima waktu dan hasilnya ikut dihitung di rekap Ibadah. Butuh file SQL 20-presensi-shalat.sql.", lokasi: "Ibadah → Presensi Shalat Berjamaah" },
  { tgl: "Okt 2026", judul: "Daftar Mata Kuliah per semester dan pilihan sekali ambil di KRS", isi: "Menu baru Akademik → Daftar Mata Kuliah untuk mengisi kode MK, nama, SKS, dan pengampu per semester (ada Impor Cepat dari Excel). Di KRS, tombol Ambil dari Daftar menambahkan seluruh mata kuliah satu semester sekaligus, untuk satu mahasantri atau seluruh angkatan, dan melewati yang sudah ada. Butuh file SQL 19-master-mata-kuliah.sql.", lokasi: "Akademik → Daftar Mata Kuliah dan KRS & KHS" },
  { tgl: "Okt 2026", judul: "Daftar mahasantri per angkatan", isi: "Halaman Data Mahasantri, Akademik, Al-Qur'an, Ibadah, Iuran SPP, dan Kartu kini menampilkan pilihan angkatan terlebih dahulu. Nama dan NIM muncul setelah angkatan diklik, atau langsung saat mencari. Tersedia juga tombol Tampilkan semua.", lokasi: "Halaman daftar mahasantri" },
  { tgl: "Okt 2026", judul: "Perbaikan: data di atas 1.000 baris", isi: "Semua halaman kini memuat seluruh data tabel secara bertahap. Sebelumnya hanya 1.000 baris pertama yang terbaca, sehingga angka Dashboard dan Rekap bisa kurang setelah data setoran dan ibadah menumpuk.", lokasi: "Seluruh aplikasi" },
  { tgl: "Okt 2026", judul: "Monitoring Tugas Akhir (menu Tugas Akhir & Ujian)", isi: "Menu Tugas Akhir & Ujian langsung menampilkan satu halaman untuk melihat semua mahasantri yang mengajukan KPM, Magang, Sidang, Syahadah Kubro, dan Sanad tanpa membuka satu per satu. Ada ringkasan per tahap, filter tahap/status/kelas/nama, tombol Lanjut langsung dari daftar, daftar mahasantri yang siap tetapi belum mengajukan, dan unduh Excel.", lokasi: "Akademik → Tugas Akhir & Ujian" },
  { tgl: "Okt 2026", judul: "Tugas Akhir & Ujian (KPM, Magang, Sidang Akhir Bisnis, Sidang Munaqasyah, Syahadah Kubro, Pengambilan Sanad)", isi: "Tab baru di menu Akademik yang mengatur alur tahapan akhir seperti kampus: pengajuan → persetujuan → penjadwalan/pelaksanaan → penilaian (lulus, revisi, tidak lulus, ajukan ulang). Ada kunci prasyarat antar tahap (KPM → Magang → Sidang Akhir Bisnis; Munaqasyah → Syahadah Kubro dan Pengambilan Sanad), pembimbing/penguji, tanggal, nilai per komponen yang dihitung otomatis, dan daftar berkas wajib per tahap (mis. logbook dan laporan magang). Sidang Akhir Bisnis mencatat karya brand sendiri: nama brand, bidang, tagline, produk, tautan, logo, dan foto produk. Mahasantri dapat mengajukan sendiri dan memantau statusnya. Butuh file SQL 16-tahapan-akhir.sql.", lokasi: "Akademik → tab Tugas Akhir & Ujian" },
  { tgl: "Okt 2026", judul: "Jenis setoran Syahadah dan Tasmi' di Capaian Al-Qur'an", isi: "Dua jenis baru untuk dicatat bersama Ziyadah, Murajaah, dan lainnya. Syahadah dan Tasmi' tercatat juga menjadi acuan syarat Sidang Munaqasyah.", lokasi: "Capaian Al-Qur'an → Catat Setoran" },
  { tgl: "Okt 2026", judul: "Penataan menu", isi: "Menu Kurikulum dan Rapor Bulanan dihapus. Urutan menu utama: Data Mahasantri, Akademik, Capaian Al-Qur'an, Ibadah, Iuran SPP, Kartu Tanda Mahasantri. Grup Akademik berisi KRS & KHS, Tugas Akhir & Ujian, Kalender Akademik, dan Rekap Pencapaian.", lokasi: "Menu samping" },
  { tgl: "Okt 2026", judul: "Log Aktivitas", isi: "Jejak otomatis siapa menambah, mengubah, dan menghapus data (SPP, koperasi, data santri, Al-Qur'an, ibadah, akun, dan lainnya), lengkap dengan nilai lama dan baru. Dicatat oleh database sehingga tidak bisa diubah dari aplikasi. Ada ringkasan siapa yang mengubah data hari ini.", lokasi: "Menu Log Aktivitas (Administrator dan Pimpinan)" },
  { tgl: "Okt 2026", judul: "Gaya tulisan Kartu Tanda Mahasantri bisa diatur", isi: "Ukuran huruf, jenis font, tebal, miring, dan warna setiap tulisan pada kartu (nama, NIM, data, nama pondok, alamat, dll.) bisa diubah dan langsung terlihat di pratinjau.", lokasi: "Kartu Tanda Mahasantri → Gaya Tulisan" },
  { tgl: "Okt 2026", judul: "Rekap Pencapaian Seluruh Santri (per bulan dan per pekan)", isi: "Satu halaman untuk memaparkan hasil evaluasi semua santri, bisa dipilih per bulan (dengan tren 6 bulan) atau per pekan (siapa yang belum mencapai target): grafik persentase santri yang mencapai target hafalan dan ibadah, tabel per santri, serta unduh Excel dan cetak/PDF.", lokasi: "Menu Rekap Pencapaian (di bawah Rapor Bulanan)" },
  { tgl: "Okt 2026", judul: "Warna grafik baru dan tema siap pakai", isi: "Warna bawaan grafik diganti dengan palet yang lebih lembut. Tersedia 5 tema (Zamrud Lembut, Hijau Pondok & Emas, Biru Tenang, Pastel Lembut, Klasik) yang bisa dipilih sekali klik lalu disesuaikan.", lokasi: "Pengaturan → Warna Grafik" },
  { tgl: "Okt 2026", judul: "Grafik pencapaian per pekan + target mingguan", isi: "Dua grafik (hafalan baru dan ibadah) per pekan terhadap target tiap santri, lengkap dengan status Tercapai / Belum tercapai. Muncul di Rapor Bulanan (ikut tercetak), halaman Al-Qur'an, dan halaman Ibadah. Target diisi di Data Mahasantri.", lokasi: "Rapor Bulanan, Al-Qur'an, Ibadah; target di Data Mahasantri" },
  { tgl: "Okt 2026", judul: "Warna grafik bisa diubah", isi: "Administrator dapat mengganti warna batang pada semua grafik Dashboard (hafalan, ibadah, SPP, setoran per jenis) tanpa pengembang.", lokasi: "Pengaturan → Warna Grafik" },
  { tgl: "Okt 2026", judul: "Grafik capaian Al-Qur'an dan ibadah di Dashboard", isi: "Grafik hafalan baru per bulan, kepatuhan ibadah per jenis, daftar setoran terbanyak, dan santri yang perlu perhatian. Dashboard mahasantri/wali menampilkan grafik milik sendiri.", lokasi: "Dashboard" },
  { tgl: "Okt 2026", judul: "Bukti pembayaran: satu bon untuk SPP + koperasi, dan bukti cicilan koperasi", isi: "Pembayaran gabungan kini tercetak dalam satu bukti dengan rincian SPP dan koperasi. Cicilan koperasi yang dibayar terpisah juga punya bukti cetak sendiri (menampilkan sisa tagihan).", lokasi: "Iuran SPP → pilih santri → Cetak Bukti Bayar / kartu Cicilan Koperasi" },
  { tgl: "Okt 2026", judul: "Rekap Bulanan SPP & Koperasi", isi: "Ringkasan pembayaran per bulan (lunas, belum, total diterima, cicilan koperasi) yang bisa diunduh ke Excel atau dicetak sebagai PDF untuk laporan ke pimpinan.", lokasi: "Iuran SPP → tombol Rekap Bulanan" },
  { tgl: "Okt 2026", judul: "Cadangan Data (Backup) ke Excel", isi: "Satu tombol untuk mengunduh seluruh data SIAKAD ke satu file Excel sebagai cadangan.", lokasi: "Pengaturan → Cadangan Data" },
  { tgl: "Okt 2026", judul: "Pengingat tunggakan lewat WhatsApp", isi: "Daftar santri kini menampilkan tunggakan, dan tombol Ingatkan membuka WhatsApp wali dengan pesan siap kirim. Perlu No. HP Orang Tua/Wali terisi di Data Mahasantri.", lokasi: "Iuran SPP → kolom Pengingat" },
  { tgl: "Okt 2026", judul: "Menu Tambahan buatan sendiri", isi: "Administrator bisa membuat menu baru lengkap dengan kolom isiannya (misalnya Inventaris, Data Alumni, Absensi Kegiatan) tanpa pengembang dan tanpa deploy.", lokasi: "Pengaturan → Menu Tambahan" },
  { tgl: "Okt 2026", judul: "Terakhir Masuk di Kelola Akun", isi: "Kolom baru yang menunjukkan kapan tiap akun terakhir masuk, supaya terlihat siapa yang sudah aktif hari ini.", lokasi: "Menu Kelola Akun" },
  { tgl: "Okt 2026", judul: "Nominal SPP per santri + pembayaran gabungan", isi: "Nominal SPP kini diisi sekali di data santri dan otomatis dipakai saat membuat iuran. Satu transfer bisa dipecah otomatis, misalnya Rp1.500.000 menjadi SPP Rp1.000.000 dan cicilan koperasi Rp500.000.", lokasi: "Data Mahasantri (isi nominal) dan Iuran SPP → pilih santri → Terima Pembayaran" },
  { tgl: "Okt 2026", judul: "Cicilan Koperasi", isi: "Catatan tagihan dan cicilan koperasi per mahasantri, lengkap dengan sisa tagihan.", lokasi: "Iuran SPP → pilih santri → kartu Cicilan Koperasi" },
  { tgl: "Okt 2026", judul: "Pratinjau langsung halaman login", isi: "Saat mengubah identitas pondok, tampilan halaman login terlihat langsung sebelum disimpan.", lokasi: "Pengaturan → Identitas Pondok" },
];
function PanduanAdmin() {
  const Bagian = ({ judul, children }) => (
    <details className="border border-stone-200 rounded-xl mb-2 bg-white">
      <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-[#0B3B36]">{judul}</summary>
      <div className="px-4 pb-4 text-sm text-stone-600 leading-relaxed">{children}</div>
    </details>
  );
  return (
    <Card className="mb-5 border-[#EDD9A0] bg-[#FBF3DF]/40">
      <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-1">Panduan Administrator</h3>
      <p className="text-xs text-stone-500 mb-4">Ringkasan cara memakai SIAKAD dan daftar fitur yang pernah ditambahkan. Klik judul untuk membuka.</p>
      <Bagian judul="🆕 Riwayat Pembaruan (apa saja yang baru)">
        <div className="space-y-3">
          {RIWAYAT_PEMBARUAN.map((r, i) => (
            <div key={i} className="border-l-4 border-[#B8935A] pl-3">
              <div className="text-[0.6875rem] text-stone-400">{r.tgl}</div>
              <div className="font-bold text-[#0B3B36]">{r.judul}</div>
              <div>{r.isi}</div>
              <div className="text-xs text-[#8A6A2A] mt-0.5">📍 {r.lokasi}</div>
            </div>
          ))}
        </div>
      </Bagian>
      <Bagian judul="➕ Ingin menambah menu atau kolom sendiri?">
        Gunakan kartu <b>Menu Tambahan</b> di bawah panduan ini. Anda bisa membuat menu baru, menentukan kolomnya (teks, angka, rupiah, tanggal, pilihan, atau pilih mahasantri), dan mengatur peran mana yang boleh melihat atau mengisi. Menu langsung muncul di sidebar tanpa perlu pengembang. Fitur yang butuh perhitungan atau logika khusus (seperti pembayaran gabungan SPP) tetap perlu pengembang.
      </Bagian>
      <Bagian judul="📅 Tugas rutin administrator">
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Awal bulan:</b> bendahara membuka Iuran SPP lalu klik "+ Buat Iuran Bulan Ini". Nominal otomatis dari data masing-masing santri.</li>
          <li><b>Santri baru:</b> tambahkan di Data Mahasantri (isi Nominal SPP), lalu buat akun loginnya di Kelola Akun.</li>
          <li><b>Sebulan sekali:</b> buka Pengaturan lalu klik "Unduh Semua Data" untuk cadangan, dan simpan file-nya di tempat aman (misalnya Google Drive pribadi pondok).</li>
          <li><b>Awal bulan / akhir bulan:</b> bendahara membuka Iuran SPP → Rekap Bulanan untuk laporan ke pimpinan, dan memakai tombol Ingatkan bagi yang menunggak.</li>
          <li><b>Setiap hari / pekan:</b> buka Log Aktivitas untuk melihat siapa yang mengubah data hari ini, dan Kelola Akun (kolom "Terakhir Masuk") untuk melihat staf yang sudah aktif.</li>
          <li><b>Staf pindah tugas:</b> ubah peran akunnya lewat tombol Edit di Kelola Akun, jangan buat akun baru.</li>
        </ul>
      </Bagian>
      <Bagian judul="👥 Siapa bisa melakukan apa">
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Administrator:</b> semua menu, termasuk Kelola Akun dan Pengaturan identitas pondok.</li>
          <li><b>Bendahara:</b> Iuran SPP dan cicilan koperasi.</li>
          <li><b>Staf Akademik:</b> grup Akademik (KRS &amp; KHS, tugas akhir &amp; ujian, kalender, rekap) dan kartu mahasantri.</li>
          <li><b>Musyrif / Musyrifah:</b> capaian Al-Qur'an dan ibadah santri bimbingannya.</li>
          <li><b>Pimpinan:</b> hanya melihat data, tanpa mengubah.</li>
          <li><b>Mahasantri / Wali:</b> melihat data milik sendiri.</li>
        </ul>
      </Bagian>
      <Bagian judul="🔑 Lupa kata sandi atau akun bermasalah">
        Pemilik akun bisa memakai "Lupa Kata Sandi" di halaman login (butuh email aktif yang terdaftar di akun). Kalau email salah, buat ulang akun lewat Kelola Akun. Peran dan nama bisa diubah lewat tombol Edit.
      </Bagian>
      <Bagian judul="🛠 Kalau butuh fitur baru atau ada yang error">
        Catat: <b>menu mana</b>, <b>apa yang diklik</b>, dan <b>pesan error yang muncul</b> (sertakan tangkapan layar), lalu sampaikan ke pengembang. Setiap fitur baru akan ditambahkan ke Riwayat Pembaruan di atas supaya administrator tahu apa yang berubah.
      </Bagian>
    </Card>
  );
}
function PengaturanPage({ profile, onProfileUpdated, brand, onBrandUpdated, uiSize, setUiSize, onModulChanged }) {
  const [nama, setNama] = useState(profile.nama);
  const [newPw, setNewPw] = useState("");
  const [uploading, setUploading] = useState(false);
  const [ttdUploading, setTtdUploading] = useState(false);
  const ttdRef = useRef(null);
  const [msg, setMsg] = useState("");
  const fileRef = useRef(null);

  const [namaPondok, setNamaPondok] = useState(brand.nama_pondok);
  const [tagline, setTagline] = useState(brand.tagline);
  const [warnaUtama, setWarnaUtama] = useState(brand.warna_utama || "#0B4D30");
  const [warnaAksen, setWarnaAksen] = useState(brand.warna_aksen || "#AD7F2C");
  const [warnaArab, setWarnaArab] = useState(brand.warna_arab || "#B8935A");
  const [yayasanNama, setYayasanNama] = useState(brand.yayasan_nama || "");
  const [alamatPondok, setAlamatPondok] = useState(brand.alamat_pondok || "");
  const [kontakPondok, setKontakPondok] = useState(brand.kontak_pondok || "");
  const [namaMudir, setNamaMudir] = useState(brand.nama_mudir || "");
  const [nipMudir, setNipMudir] = useState(brand.nip_mudir || "");
  const [jabatanTtd, setJabatanTtd] = useState(brand.jabatan_ttd || DEFAULT_JABATAN_TTD);
  const [posisiTtd, setPosisiTtd] = useState(brand.posisi_ttd || "kanan");
  const [rataBlok, setRataBlok] = useState(brand.rata_blok_ttd || "ikut");
  const [posisiJabatan, setPosisiJabatan] = useState(brand.posisi_jabatan || "ikut");
  const [uploadingTtdMudir, setUploadingTtdMudir] = useState(false);
  async function uploadTtdMudir(e) {
    const file = e.target.files[0]; if (!file) return;
    setUploadingTtdMudir(true); setMsg("");
    try {
      const ext = file.name.split(".").pop();
      const path = `mudir/ttd-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: dbErr } = await supabase.from("pengaturan_pondok").update({ tanda_tangan_mudir_url: data.publicUrl }).eq("id", 1);
      if (dbErr) throw dbErr;
      setMsg("Tanda tangan Mudir berhasil diperbarui.");
      onBrandUpdated();
    } catch (err) {
      setMsg("Gagal unggah tanda tangan: " + err.message);
    } finally {
      setUploadingTtdMudir(false);
    }
  }
  const [namaKabagAkademik, setNamaKabagAkademik] = useState(brand.nama_kabag_akademik || "");
  const [nipKabagAkademik, setNipKabagAkademik] = useState(brand.nip_kabag_akademik || "");
  const [ukuranLogo, setUkuranLogo] = useState(brand.ukuran_logo_sidebar || 52);
  const [ukuranLogoLogin, setUkuranLogoLogin] = useState(brand.ukuran_logo_login || 76);
  const [ukuranSlogan, setUkuranSlogan] = useState(brand.ukuran_slogan || 18);
  const [ukuranSapaan, setUkuranSapaan] = useState(brand.ukuran_sapaan || 24);
  const [judulBesar, setJudulBesar] = useState(brand.judul_besar || "SIAKAD");
  const [ukuranJudul, setUkuranJudul] = useState(brand.ukuran_judul || 72);
  const [subjudul, setSubjudul] = useState(brand.subjudul || "Sistem Informasi Terpadu dan Manajemen Pembelajaran");
  const [ukuranSubjudul, setUkuranSubjudul] = useState(brand.ukuran_subjudul || 18);
  const [fontStyle, setFontStyle] = useState(brand.font_style || "fraunces");
  const [fontJudul, setFontJudul] = useState(brand.font_judul || "fraunces");
  const [fontSubjudul, setFontSubjudul] = useState(brand.font_subjudul || "fraunces");
  const [fontSlogan, setFontSlogan] = useState(brand.font_slogan || "fraunces");
  const [fontSapaan, setFontSapaan] = useState(brand.font_sapaan || "fraunces");
  const [alignSubjudul, setAlignSubjudul] = useState(brand.align_subjudul || "left");
  const [alignSlogan, setAlignSlogan] = useState(brand.align_slogan || "left");
  const [slogan, setSlogan] = useState(brand.slogan || "Mencetak Pengusaha Muda Penghafal Quran");
  const [sapaan, setSapaan] = useState(brand.sapaan || "Selamat Datang");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDokumenUploading, setLogoDokumenUploading] = useState(false);
  const [wallpaperUploading, setWallpaperUploading] = useState(false);
  const logoDokumenRef = useRef(null);
  const logoRef = useRef(null);
  const wallpaperRef = useRef(null);

  async function saveNama(e) {
    e.preventDefault(); setMsg("");
    const { error } = await supabase.from("profiles").update({ nama }).eq("id", profile.id);
    if (error) setMsg("Gagal: " + error.message); else { setMsg("Nama berhasil diperbarui."); onProfileUpdated(); }
  }
  async function savePassword(e) {
    e.preventDefault(); setMsg("");
    if (newPw.length < 6) { setMsg("Kata sandi baru minimal 6 karakter."); return; }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) setMsg("Gagal: " + error.message); else { setMsg("Kata sandi berhasil diganti."); setNewPw(""); }
  }
  async function uploadPhoto(e) {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true); setMsg("");
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", profile.id);
      if (dbErr) throw dbErr;
      setMsg("Foto profil berhasil diperbarui.");
      onProfileUpdated();
    } catch (err) {
      setMsg("Gagal unggah foto: " + err.message);
    } finally {
      setUploading(false);
    }
  }
  async function uploadTtd(e) {
    const file = e.target.files[0]; if (!file) return;
    setTtdUploading(true); setMsg("");
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/ttd.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: dbErr } = await supabase.from("profiles").update({ tanda_tangan_url: data.publicUrl }).eq("id", profile.id);
      if (dbErr) throw dbErr;
      setMsg("Tanda tangan digital berhasil diperbarui.");
      onProfileUpdated();
    } catch (err) {
      setMsg("Gagal unggah tanda tangan: " + err.message);
    } finally {
      setTtdUploading(false);
    }
  }
  async function hapusTtd() {
    if (!confirm("Hapus tanda tangan digital?")) return;
    const { error } = await supabase.from("profiles").update({ tanda_tangan_url: null }).eq("id", profile.id);
    if (!error) onProfileUpdated();
  }
  async function saveBranding(e) {
    e.preventDefault(); setMsg("");
    const { error } = await supabase.from("pengaturan_pondok").update({
      nama_pondok: namaPondok, tagline, warna_utama: warnaUtama, warna_aksen: warnaAksen, warna_arab: warnaArab,
      yayasan_nama: yayasanNama, alamat_pondok: alamatPondok, kontak_pondok: kontakPondok,
      nama_mudir: namaMudir, nip_mudir: nipMudir, ...("jabatan_ttd" in brand ? { jabatan_ttd: jabatanTtd } : {}), ...("posisi_ttd" in brand ? { posisi_ttd: posisiTtd } : {}), ...("rata_blok_ttd" in brand ? { rata_blok_ttd: rataBlok } : {}), ...("posisi_jabatan" in brand ? { posisi_jabatan: posisiJabatan } : {}), nama_kabag_akademik: namaKabagAkademik, nip_kabag_akademik: nipKabagAkademik,
      ukuran_logo_sidebar: Number(ukuranLogo), ukuran_logo_login: Number(ukuranLogoLogin),
      ukuran_slogan: Number(ukuranSlogan), ukuran_sapaan: Number(ukuranSapaan),
      judul_besar: judulBesar, subjudul, slogan, sapaan,
      ukuran_judul: Number(ukuranJudul), ukuran_subjudul: Number(ukuranSubjudul), font_style: fontStyle,
      font_judul: fontJudul, font_subjudul: fontSubjudul, font_slogan: fontSlogan, font_sapaan: fontSapaan,
      align_subjudul: alignSubjudul, align_slogan: alignSlogan,
    }).eq("id", 1);
    if (error) setMsg("Gagal: " + error.message); else { setMsg("Identitas pondok berhasil diperbarui."); onBrandUpdated(); }
  }
  async function uploadLogo(e) {
    const file = e.target.files[0]; if (!file) return;
    setLogoUploading(true); setMsg("");
    try {
      const ext = file.name.split(".").pop();
      const path = `logo.${ext}`;
      const { error: upErr } = await supabase.storage.from("branding").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("branding").getPublicUrl(path);
      const { error: dbErr } = await supabase.from("pengaturan_pondok").update({ logo_url: `${data.publicUrl}?t=${Date.now()}` }).eq("id", 1);
      if (dbErr) throw dbErr;
      setMsg("Logo pondok berhasil diperbarui.");
      onBrandUpdated();
    } catch (err) {
      setMsg("Gagal unggah logo: " + err.message);
    } finally {
      setLogoUploading(false);
    }
  }
  async function uploadLogoDokumen(e) {
    const file = e.target.files[0]; if (!file) return;
    setLogoDokumenUploading(true); setMsg("");
    try {
      const ext = file.name.split(".").pop();
      const path = `logo-dokumen.${ext}`;
      const { error: upErr } = await supabase.storage.from("branding").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("branding").getPublicUrl(path);
      const { error: dbErr } = await supabase.from("pengaturan_pondok").update({ logo_dokumen_url: `${data.publicUrl}?t=${Date.now()}` }).eq("id", 1);
      if (dbErr) throw dbErr;
      setMsg("Logo dokumen berhasil diperbarui.");
      onBrandUpdated();
    } catch (err) {
      setMsg("Gagal unggah logo dokumen: " + err.message);
    } finally {
      setLogoDokumenUploading(false);
    }
  }

  async function uploadWallpaper(e) {
    const file = e.target.files[0]; if (!file) return;
    setWallpaperUploading(true); setMsg("");
    try {
      const ext = file.name.split(".").pop();
      const path = `wallpaper.${ext}`;
      const { error: upErr } = await supabase.storage.from("branding").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("branding").getPublicUrl(path);
      const { error: dbErr } = await supabase.from("pengaturan_pondok").update({ foto_latar_url: `${data.publicUrl}?t=${Date.now()}` }).eq("id", 1);
      if (dbErr) throw dbErr;
      setMsg("Wallpaper latar login berhasil diperbarui.");
      onBrandUpdated();
    } catch (err) {
      setMsg("Gagal unggah wallpaper: " + err.message);
    } finally {
      setWallpaperUploading(false);
    }
  }
  async function hapusWallpaper() {
    setWallpaperUploading(true); setMsg("");
    const { error } = await supabase.from("pengaturan_pondok").update({ foto_latar_url: null }).eq("id", 1);
    setWallpaperUploading(false);
    if (error) setMsg("Gagal: " + error.message); else { setMsg("Wallpaper dihapus, kembali ke latar gradasi warna."); onBrandUpdated(); }
  }

  return (
    <div>
      <PageHeader title="Pengaturan" sub="Kelola profil dan kata sandi akun Anda." />
      {msg && <div className="text-sm mb-4 p-3.5 rounded-xl bg-[#E9F1EE] text-[#0F4A44] font-medium">{msg}</div>}

      <Card className="mb-5">
        <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-2">Ukuran Tampilan</h3>
        <p className="text-xs text-stone-400 mb-4">Atur besar huruf dan elemen di seluruh aplikasi. Pilihan ini tersimpan di perangkat ini saja, jadi tiap perangkat bisa berbeda.</p>
        <div className="flex flex-wrap gap-2">
          {UI_SIZES.map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => setUiSize(sz)}
              className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${uiSize === sz ? "bg-[#0B3B36] text-white border-[#0B3B36]" : "bg-white text-[#0B3B36] border-stone-300 hover:bg-stone-50"}`}
            >
              {UI_SIZE_LABELS[sz]}
              {sz === UI_SIZE_DEFAULT && <span className="ml-1.5 text-[0.625rem] font-bold opacity-70">(bawaan)</span>}
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-400 mt-3">Ukuran berubah langsung saat dipilih. Hasil cetak (kartu, rapor, KRS/KHS) tidak terpengaruh.</p>
      </Card>

      <Card className="mb-5">
        <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-4">Foto Profil</h3>
        <div className="flex items-center gap-5">
          <Avatar name={profile.nama} url={profile.avatar_url} size={72} />
          <div>
            <Btn tone="ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? "Mengunggah…" : "Ganti Foto"}</Btn>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
            <p className="text-xs text-stone-400 mt-2">JPG/PNG, maksimal 2MB.</p>
          </div>
        </div>
      </Card>

      <Card className="mb-5">
        <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-2">Tanda Tangan Digital</h3>
        <p className="text-xs text-stone-400 mb-4">Foto/scan tanda tangan Anda (latar putih/transparan lebih baik). Akan otomatis terpasang di dokumen yang Anda proses, misalnya Bukti Pembayaran Iuran SPP.</p>
        <div className="flex items-center gap-5">
          <div className="w-32 h-16 border border-dashed border-stone-300 rounded-lg flex items-center justify-center bg-stone-50 overflow-hidden">
            {profile.tanda_tangan_url ? <img src={profile.tanda_tangan_url} alt="Tanda tangan" className="max-h-full max-w-full object-contain" /> : <span className="text-[0.625rem] text-stone-400">Belum ada</span>}
          </div>
          <div>
            <div className="flex gap-2">
              <Btn tone="ghost" onClick={() => ttdRef.current?.click()} disabled={ttdUploading}>{ttdUploading ? "Mengunggah…" : profile.tanda_tangan_url ? "Ganti" : "Unggah Tanda Tangan"}</Btn>
              {profile.tanda_tangan_url && <Btn tone="ghost" onClick={hapusTtd}>Hapus</Btn>}
            </div>
            <input ref={ttdRef} type="file" accept="image/*" className="hidden" onChange={uploadTtd} />
            <p className="text-xs text-stone-400 mt-2">JPG/PNG, maksimal 2MB.</p>
          </div>
        </div>
      </Card>

      <Card className="mb-5">
        <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-4">Nama Tampilan</h3>
        <form onSubmit={saveNama} className="flex gap-3 items-end max-w-md">
          <div className="flex-1"><Field label="Nama Lengkap"><Input value={nama} onChange={(e) => setNama(e.target.value)} /></Field></div>
          <Btn type="submit">Simpan</Btn>
        </form>
      </Card>

      <Card className="mb-5">
        <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-4">Ganti Kata Sandi</h3>
        <form onSubmit={savePassword} className="flex gap-3 items-end max-w-md">
          <div className="flex-1"><Field label="Kata Sandi Baru"><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Minimal 6 karakter" /></Field></div>
          <Btn type="submit" tone="gold">Ganti</Btn>
        </form>
      </Card>

      {profile.role === "admin" && <PanduanAdmin />}
      {profile.role === "admin" && <MenuKustomManager onChanged={onModulChanged} />}
      {profile.role === "admin" && <AmalanKustomManager />}
      {profile.role === "admin" && <BackupDataCard />}
      {profile.role === "admin" && <WarnaGrafikCard brand={brand} onBrandUpdated={onBrandUpdated} />}

      {profile.role === "admin" && (
        <Card className="border-[#EDD9A0] bg-[#FBF3DF]/40">
          <h3 className="font-serif-dh text-base text-[#0B3B36] font-semibold mb-1">Identitas Pondok (Branding)</h3>
          <p className="text-xs text-stone-500 mb-4">Tampil di halaman login dan sidebar seluruh pengguna.</p>

          <div className="flex items-center gap-5 mb-5">
            <LogoMark size={64} url={brand.logo_url} />
            <div>
              <Btn tone="ghost" onClick={() => logoRef.current?.click()} disabled={logoUploading}>{logoUploading ? "Mengunggah…" : "Ganti Logo"}</Btn>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
              <p className="text-xs text-stone-400 mt-2">Disarankan gambar persegi, JPG/PNG.</p>
            </div>
          </div>

          <div className="flex items-center gap-5 mb-5 pt-4 border-t border-[#EDD9A0]">
            <div className="w-16 h-16 rounded-lg bg-white border border-stone-200 flex items-center justify-center overflow-hidden">
              {brand.logo_dokumen_url ? <img src={brand.logo_dokumen_url} alt="logo dokumen" className="w-full h-full object-contain p-1" /> : <span className="text-[0.625rem] text-stone-300 text-center px-2">Belum ada</span>}
            </div>
            <div>
              <Btn tone="ghost" onClick={() => logoDokumenRef.current?.click()} disabled={logoDokumenUploading}>{logoDokumenUploading ? "Mengunggah…" : "Ganti Logo untuk Dokumen (KRS/KHS)"}</Btn>
              <input ref={logoDokumenRef} type="file" accept="image/*" className="hidden" onChange={uploadLogoDokumen} />
              <p className="text-xs text-stone-400 mt-2">Pakai versi logo BERWARNA ASLI (bukan putih) — dipakai khusus di kop KRS/KHS yang latarnya putih. Tidak memengaruhi logo sidebar & login.</p>
            </div>
          </div>

          <div className="flex items-center gap-5 mb-5 pt-4 border-t border-[#EDD9A0]">
            <div className="w-24 h-16 rounded-lg bg-stone-800 border border-stone-200 flex items-center justify-center overflow-hidden">
              {brand.foto_latar_url ? <img src={brand.foto_latar_url} alt="wallpaper login" className="w-full h-full object-cover" /> : <span className="text-[0.625rem] text-stone-400 text-center px-2">Belum ada — pakai gradasi warna</span>}
            </div>
            <div>
              <div className="flex gap-2">
                <Btn tone="ghost" onClick={() => wallpaperRef.current?.click()} disabled={wallpaperUploading}>{wallpaperUploading ? "Mengunggah…" : "Ganti Wallpaper Latar Login"}</Btn>
                {brand.foto_latar_url && <Btn tone="ghost" onClick={hapusWallpaper} disabled={wallpaperUploading}>Hapus</Btn>}
              </div>
              <input ref={wallpaperRef} type="file" accept="image/*" className="hidden" onChange={uploadWallpaper} />
              <p className="text-xs text-stone-400 mt-2">Foto latar di panel kiri halaman login (mis. foto gedung/gerbang pondok). Otomatis digelapkan supaya teks & logo tetap terbaca. Kosongkan untuk pakai gradasi warna seperti sekarang.</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
          <form onSubmit={saveBranding} className="min-w-0">
            <Field label="Nama Pondok (ditampilkan di sidebar)"><Input value={namaPondok} onChange={(e) => setNamaPondok(e.target.value)} /></Field>
            <div className="border-t border-[#EDD9A0] my-4 pt-4">
              <div className="text-xs font-extrabold text-stone-500 uppercase tracking-wide mb-3">Teks Halaman Login</div>
              <Field label="Gaya Font (berlaku ke seluruh aplikasi)">
                <Select value={fontStyle} onChange={(e) => setFontStyle(e.target.value)}>
                  {Object.entries(FONT_OPTIONS).map(([key, f]) => <option key={key} value={key}>{f.label}</option>)}
                </Select>
              </Field>
              <Field label="Judul Besar"><Input value={judulBesar} onChange={(e) => setJudulBesar(e.target.value)} placeholder="SIAKAD" /></Field>
              <Field label="Font Judul Besar">
                <Select value={fontJudul} onChange={(e) => setFontJudul(e.target.value)}>
                  {Object.entries(FONT_OPTIONS).map(([key, f]) => <option key={key} value={key}>{f.label}</option>)}
                </Select>
              </Field>
              <Field label={`Ukuran Judul Besar (${ukuranJudul}px)`}><input type="range" min="36" max="110" value={ukuranJudul} onChange={(e) => setUkuranJudul(e.target.value)} className="w-full" /></Field>
              <Field label="Sub-judul (di bawah judul besar — Enter untuk baris baru)"><textarea className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm" rows={2} value={subjudul} onChange={(e) => setSubjudul(e.target.value)} /></Field>
              <Field label="Font Sub-judul">
                <Select value={fontSubjudul} onChange={(e) => setFontSubjudul(e.target.value)}>
                  {Object.entries(FONT_OPTIONS).map(([key, f]) => <option key={key} value={key}>{f.label}</option>)}
                </Select>
              </Field>
              <Field label={`Ukuran Sub-judul (${ukuranSubjudul}px)`}><input type="range" min="12" max="32" value={ukuranSubjudul} onChange={(e) => setUkuranSubjudul(e.target.value)} className="w-full" /></Field>
              <Field label="Perataan Sub-judul">
                <Select value={alignSubjudul} onChange={(e) => setAlignSubjudul(e.target.value)}>
                  <option value="left">Kiri</option><option value="center">Tengah</option><option value="right">Kanan</option>
                </Select>
              </Field>
              <Field label="Slogan / Kutipan (di bawah garis, panel kiri — Enter untuk baris baru)"><textarea className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm" rows={2} value={slogan} onChange={(e) => setSlogan(e.target.value)} /></Field>
              <Field label="Font Slogan">
                <Select value={fontSlogan} onChange={(e) => setFontSlogan(e.target.value)}>
                  {Object.entries(FONT_OPTIONS).map(([key, f]) => <option key={key} value={key}>{f.label}</option>)}
                </Select>
              </Field>
              <Field label={`Ukuran Slogan (${ukuranSlogan}px)`}><input type="range" min="12" max="36" value={ukuranSlogan} onChange={(e) => setUkuranSlogan(e.target.value)} className="w-full" /></Field>
              <Field label="Perataan Slogan">
                <Select value={alignSlogan} onChange={(e) => setAlignSlogan(e.target.value)}>
                  <option value="left">Kiri</option><option value="center">Tengah</option><option value="right">Kanan</option>
                </Select>
              </Field>
              <Field label="Kata Sapaan (panel kanan, di atas form login)"><Input value={sapaan} onChange={(e) => setSapaan(e.target.value)} /></Field>
              <Field label="Font Kata Sapaan">
                <Select value={fontSapaan} onChange={(e) => setFontSapaan(e.target.value)}>
                  {Object.entries(FONT_OPTIONS).map(([key, f]) => <option key={key} value={key}>{f.label}</option>)}
                </Select>
              </Field>
              <Field label={`Ukuran Kata Sapaan (${ukuranSapaan}px)`}><input type="range" min="14" max="40" value={ukuranSapaan} onChange={(e) => setUkuranSapaan(e.target.value)} className="w-full" /></Field>
            </div>
            <Field label="Tagline (© footer)"><Input value={tagline} onChange={(e) => setTagline(e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Warna Utama">
                <div className="flex items-center gap-2">
                  <input type="color" value={warnaUtama} onChange={(e) => setWarnaUtama(e.target.value)} className="w-11 h-11 rounded-lg border border-stone-300 cursor-pointer" />
                  <Input value={warnaUtama} onChange={(e) => setWarnaUtama(e.target.value)} />
                </div>
              </Field>
              <Field label="Warna Aksen">
                <div className="flex items-center gap-2">
                  <input type="color" value={warnaAksen} onChange={(e) => setWarnaAksen(e.target.value)} className="w-11 h-11 rounded-lg border border-stone-300 cursor-pointer" />
                  <Input value={warnaAksen} onChange={(e) => setWarnaAksen(e.target.value)} />
                </div>
              </Field>
              <Field label="Warna Teks Arab (Salam)">
                <div className="flex items-center gap-2">
                  <input type="color" value={warnaArab} onChange={(e) => setWarnaArab(e.target.value)} className="w-11 h-11 rounded-lg border border-stone-300 cursor-pointer" />
                  <Input value={warnaArab} onChange={(e) => setWarnaArab(e.target.value)} />
                </div>
              </Field>
            </div>
            <p className="text-xs text-stone-400 mb-4">Warna Utama untuk latar sidebar & tombol utama. Warna Aksen untuk logo, sorotan menu, dan tagline. Warna Teks Arab khusus untuk salam "Assalamu'alaikum" di halaman login.</p>

            <div className="text-[0.6875rem] font-extrabold text-[#B8935A] uppercase tracking-[0.1em] mt-6 mb-2 pt-4 border-t border-stone-100">Kop Surat & Tanda Tangan (untuk Cetak KRS)</div>
            <Field label="Nama Yayasan"><Input value={yayasanNama} onChange={(e) => setYayasanNama(e.target.value)} placeholder="cth. YAYASAN WAKAF HAMALATUL QURAN" /></Field>
            <Field label="Alamat Pondok"><textarea className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm" rows={2} value={alamatPondok} onChange={(e) => setAlamatPondok(e.target.value)} /></Field>
            <Field label="Kontak"><Input value={kontakPondok} onChange={(e) => setKontakPondok(e.target.value)} placeholder="cth. +62812-3456-7890" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nama Plt. Mudir"><Input value={namaMudir} onChange={(e) => setNamaMudir(e.target.value)} /></Field>
              <Field label="NIP Mudir"><Input value={nipMudir} onChange={(e) => setNipMudir(e.target.value)} /></Field>
            </div>
            <Field label="Jabatan Penandatangan (tulisan di atas tanda tangan pada dokumen)">
              <textarea
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm"
                rows={2}
                value={jabatanTtd}
                onChange={(e) => setJabatanTtd(e.target.value)}
                placeholder={"Mudir\nPTQE Darul Hikmah"}
              />
              <p className="text-xs text-stone-400 mt-1">Tiap baris (Enter) akan tampil sebagai baris baru di dokumen KRS, KHS, dan rapor.</p>
              {!("jabatan_ttd" in brand) && <p className="text-xs text-red-600 mt-1">Kolom <b>jabatan_ttd</b> belum ada di database, jadi isian ini belum bisa disimpan. Jalankan SQL penambahan kolom di Supabase terlebih dahulu.</p>}
            </Field>
            <Field label="Posisi Tulisan Jabatan (Mudir / PTQE Darul Hikmah)">
              <div className="inline-flex gap-1 flex-wrap">
                {[["ikut", "Ikut blok"], ["kiri", "Kiri"], ["tengah", "Tengah"], ["kanan", "Kanan"]].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setPosisiJabatan(v)}
                    className={`px-4 py-2 rounded-xl border text-sm font-semibold ${posisiJabatan === v ? "bg-[#0B3B36] text-white border-[#0B3B36]" : "bg-white text-[#0B3B36] border-stone-300 hover:bg-stone-50"}`}>{l}</button>
                ))}
              </div>
              <p className="text-xs text-stone-400 mt-1">Hanya mengatur tulisan jabatan. QR, tanda tangan, nama, dan NIP tetap mengikuti <b>Posisi Blok Tanda Tangan</b> di bawah. "Tengah" membuat baris-barisnya rata tengah satu sama lain (misalnya "Mudir" tepat di tengah atas "PTQE Darul Hikmah").</p>
              {!("posisi_jabatan" in brand) && <p className="text-xs text-red-600 mt-1">Kolom <b>posisi_jabatan</b> belum ada di database, jadi pilihan ini belum bisa disimpan. Jalankan SQL penambahan kolom di Supabase terlebih dahulu.</p>}
            </Field>
            <Field label="Rata Isi Blok Tanda Tangan">
              <div className="inline-flex gap-1 flex-wrap">
                {[["ikut", "Ikut posisi blok"], ["tengah", "Semua rata tengah"]].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setRataBlok(v)}
                    className={`px-4 py-2 rounded-xl border text-sm font-semibold ${rataBlok === v ? "bg-[#0B3B36] text-white border-[#0B3B36]" : "bg-white text-[#0B3B36] border-stone-300 hover:bg-stone-50"}`}>{l}</button>
                ))}
              </div>
              <p className="text-xs text-stone-400 mt-1">"Semua rata tengah": tanggal, jabatan, QR, tanda tangan, nama, dan NIP sejajar di tengah blok. Letak blok di halaman tetap mengikuti <b>Posisi Blok Tanda Tangan</b> di bawah.</p>
              {!("rata_blok_ttd" in brand) && <p className="text-xs text-red-600 mt-1">Kolom <b>rata_blok_ttd</b> belum ada di database, jadi pilihan ini belum bisa disimpan. Jalankan SQL penambahan kolom di Supabase terlebih dahulu.</p>}
            </Field>
            <Field label="Posisi Blok Tanda Tangan di Dokumen">
              <div className="inline-flex gap-1">
                {[["kiri", "Kiri"], ["tengah", "Tengah"], ["kanan", "Kanan"]].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setPosisiTtd(v)}
                    className={`px-4 py-2 rounded-xl border text-sm font-semibold ${posisiTtd === v ? "bg-[#0B3B36] text-white border-[#0B3B36]" : "bg-white text-[#0B3B36] border-stone-300 hover:bg-stone-50"}`}>{l}</button>
                ))}
              </div>
              <p className="text-xs text-stone-400 mt-1">Mengatur posisi tanggal, jabatan (Mudir), QR, tanda tangan, nama, dan NIP di KRS, KHS, dan rapor.</p>
              {!("posisi_ttd" in brand) && <p className="text-xs text-red-600 mt-1">Kolom <b>posisi_ttd</b> belum ada di database, jadi pilihan ini belum bisa disimpan. Jalankan SQL penambahan kolom di Supabase terlebih dahulu.</p>}
            </Field>
            <Field label="Tanda Tangan Digital Mudir">
              <div className="flex items-center gap-4">
                <div className="w-32 h-16 border border-dashed border-stone-300 rounded-lg flex items-center justify-center bg-stone-50 overflow-hidden">
                  {brand.tanda_tangan_mudir_url ? <img src={brand.tanda_tangan_mudir_url} alt="Tanda tangan Mudir" className="max-h-full max-w-full object-contain" /> : <span className="text-[0.625rem] text-stone-400">Belum ada</span>}
                </div>
                <div>
                  <label className="text-xs font-bold text-[#0B3B36] border border-stone-300 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-stone-50">
                    {uploadingTtdMudir ? "Mengunggah…" : brand.tanda_tangan_mudir_url ? "Ganti" : "Unggah Tanda Tangan"}
                    <input type="file" accept="image/*" className="hidden" onChange={uploadTtdMudir} disabled={uploadingTtdMudir} />
                  </label>
                  <p className="text-xs text-stone-400 mt-2">Foto/scan tanda tangan Mudir, latar putih/transparan. Otomatis dipakai di KRS, KHS, dan Rapor Bulanan.</p>
                </div>
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nama Kabag. Akademik"><Input value={namaKabagAkademik} onChange={(e) => setNamaKabagAkademik(e.target.value)} /></Field>
              <Field label="NIP Kabag. Akademik"><Input value={nipKabagAkademik} onChange={(e) => setNipKabagAkademik(e.target.value)} /></Field>
            </div>
            <Field label={`Ukuran Logo di Sidebar (${ukuranLogo}px)`}>
              <input type="range" min="32" max="220" value={ukuranLogo} onChange={(e) => setUkuranLogo(e.target.value)} className="w-full" />
            </Field>
            <Field label={`Ukuran Logo di Halaman Login (${ukuranLogoLogin}px)`}>
              <input type="range" min="40" max="320" value={ukuranLogoLogin} onChange={(e) => setUkuranLogoLogin(e.target.value)} className="w-full" />
            </Field>
            <Btn type="submit" tone="gold">Simpan Identitas Pondok</Btn>
          </form>
          <div className="sticky top-4 hidden lg:block">
            <LoginPreviewCard
              namaPondok={namaPondok} logoUrl={brand.logo_url} warnaUtama={warnaUtama} warnaArab={warnaArab} fotoLatarUrl={brand.foto_latar_url}
              judulBesar={judulBesar} ukuranJudul={ukuranJudul} fontJudul={fontJudul}
              subjudul={subjudul} ukuranSubjudul={ukuranSubjudul} fontSubjudul={fontSubjudul} alignSubjudul={alignSubjudul}
              slogan={slogan} ukuranSlogan={ukuranSlogan} fontSlogan={fontSlogan} alignSlogan={alignSlogan}
              sapaan={sapaan} ukuranSapaan={ukuranSapaan} fontSapaan={fontSapaan} ukuranLogoLogin={ukuranLogoLogin}
            />
          </div>
          </div>
        </Card>
      )}
    </div>
  );
}
function LoginPreviewCard({ namaPondok, logoUrl, warnaUtama, warnaArab, fotoLatarUrl, judulBesar, ukuranJudul, fontJudul, subjudul, ukuranSubjudul, fontSubjudul, alignSubjudul, slogan, ukuranSlogan, fontSlogan, alignSlogan, sapaan, ukuranSapaan, fontSapaan, ukuranLogoLogin }) {
  const scale = 0.42;
  const ff = (key) => (FONT_OPTIONS[key] || FONT_OPTIONS.fraunces).heading;
  return (
    <div>
      <div className="text-xs font-extrabold text-stone-500 uppercase tracking-wide mb-2">Pratinjau Halaman Login</div>
      <div className="rounded-2xl overflow-hidden shadow-lg border border-stone-200 mb-4">
        <div
          className="relative p-5 text-white flex flex-col justify-between overflow-hidden bg-cover bg-center"
          style={fotoLatarUrl
            ? { minHeight: 180, backgroundImage: `linear-gradient(150deg, ${warnaUtama}dd, #050b08e6 130%), url(${fotoLatarUrl})` }
            : { minHeight: 180, background: `linear-gradient(150deg, ${warnaUtama || "#0B3B36"}, #050b08 130%)` }
          }
        >
          <div>
            <div className="mb-3"><LogoMark size={(Number(ukuranLogoLogin) || 76) * scale} url={logoUrl} /></div>
            <div className="font-bold leading-none mb-1.5" style={{ fontSize: `${(Number(ukuranJudul) || 72) * scale}px`, fontFamily: ff(fontJudul) }}>{judulBesar || "SIAKAD"}</div>
            <p className="text-white/90 leading-snug font-semibold whitespace-pre-line" style={{ fontSize: `${(Number(ukuranSubjudul) || 18) * scale}px`, textAlign: alignSubjudul || "left", fontFamily: ff(fontSubjudul) }}>
              {subjudul} {namaPondok}
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-white/15">
            <div className="italic" style={{ textAlign: alignSlogan || "left", fontFamily: ff(fontSlogan), fontSize: `${(Number(ukuranSlogan) || 18) * scale}px` }}>"{slogan}"</div>
          </div>
        </div>
        <div className="bg-white p-5">
          <div className="font-semibold mb-1" style={{ color: warnaUtama, fontFamily: ff(fontSapaan), fontSize: `${(Number(ukuranSapaan) || 24) * scale}px` }}>{sapaan || "Selamat Datang"}</div>
          <p dir="rtl" lang="ar" style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif", color: warnaArab || "#B8935A", fontSize: 13 }}>السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ</p>
          <div className="mt-3 space-y-2">
            <div className="h-7 rounded-lg bg-stone-100"></div>
            <div className="h-7 rounded-lg bg-stone-100"></div>
            <div className="h-7 rounded-lg mt-1" style={{ background: warnaUtama }}></div>
          </div>
        </div>
      </div>
      <p className="text-xs text-stone-400">Pratinjau langsung sesuai perubahan yang belum disimpan. Klik "Simpan Identitas Pondok" kalau sudah cocok.</p>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Root                                                                     */
/* ---------------------------------------------------------------------- */
export default function App() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState("dashboard");
  const [recovery, setRecovery] = useState(false);
  const { brand, reloadBrand } = useBrand();
  const [uiSize, setUiSize] = useState(loadUiSize);
  const modulT = useTable("modul_kustom", [session]);

  useEffect(() => {
    document.documentElement.style.fontSize = uiSize + "px";
    try { localStorage.setItem("siakad_ui_size_v2", String(uiSize)); } catch {}
  }, [uiSize]);

  useEffect(() => {
    const f = FONT_OPTIONS[brand.font_style] || FONT_OPTIONS.fraunces;
    document.documentElement.style.setProperty("--font-heading", f.heading);
    document.documentElement.style.setProperty("--font-body", f.body);
  }, [brand.font_style]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  function loadProfile() {
    if (session) {
      supabase.from("profiles").select("*").eq("id", session.user.id).single()
        .then(({ data }) => {
          setProfile(data);
          // Catat waktu masuk (maks. sekali per 5 menit agar tidak menulis berlebihan)
          if (data && (!data.last_login || Date.now() - new Date(data.last_login).getTime() > 5 * 60 * 1000)) {
            supabase.from("profiles").update({ last_login: new Date().toISOString() }).eq("id", data.id).then(() => {});
          }
        });
    } else {
      setProfile(null);
    }
  }
  useEffect(loadProfile, [session]);

  if (recovery) return <BrandContext.Provider value={brand}><ResetPasswordScreen brand={brand} onDone={() => setRecovery(false)} /></BrandContext.Provider>;
  if (session === undefined) return <div className="min-h-screen flex items-center justify-center text-stone-500">Memuat…</div>;
  if (!session) return <BrandContext.Provider value={brand}><LoginScreen brand={brand} /></BrandContext.Provider>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center text-stone-500">Memuat profil…</div>;

  const modulTampil = modulT.rows.filter((m) => profile.role === "admin" || (m.peran_lihat || []).includes(profile.role)).sort((a, b) => a.id - b.id);
  const extraMenu = modulTampil.map((m) => [`kustom:${m.id}`, `${m.ikon || "📄"} ${m.nama}`]);
  const extraTitles = Object.fromEntries(modulTampil.map((m) => [`kustom:${m.id}`, m.nama]));

  const halamanBoleh = (MENUS[profile.role] || []).flatMap((m) => (m.items ? m.items.map(([k]) => k) : [m[0]]));
  function renderView() {
    if (!view.startsWith("kustom:") && !halamanBoleh.includes(view)) return <Dashboard profile={profile} />;
    if (view.startsWith("kustom:")) {
      const m = modulTampil.find((x) => `kustom:${x.id}` === view);
      return m ? <ModulKustomPage key={m.id} modul={m} profile={profile} /> : null;
    }
    if (view === "dashboard") return <Dashboard profile={profile} />;
    if (view === "santri" && ["admin","pimpinan"].includes(profile.role)) return <DataSantriPage profile={profile} />;
    if (view === "akhir" && ["admin","pimpinan","akademik"].includes(profile.role)) return <TugasAkhirPantauPage profile={profile} />;
    if (view === "akademik" || view === "akhir") return profile.role === "santri" ? <AkademikSantriPage key={view} profile={profile} tabAwal={view === "akhir" ? "akhir" : "krs"} /> : <AkademikStaffPage key={view} profile={profile} tabAwal={view === "akhir" ? "akhir" : "krs"} />;
    if (view === "pengumuman") return <PengumumanPage profile={profile} />;
    if (view === "matkul") return <DaftarMatkulPage profile={profile} brand={brand} onBrandUpdated={reloadBrand} />;
    if (view === "kalender") return <KalenderPage profile={profile} />;
    if (view === "rekap") return <RekapPencapaianPage profile={profile} />;
    if (view === "kartu") return <KartuSantriPage profile={profile} />;
    if (view === "quran") return <QuranPage profile={profile} />;
    if (view === "ibadah") return <IbadahPage profile={profile} />;
    if (view === "spp") return <SppPage profile={profile} />;
    if (view === "akun" && profile.role === "admin") return <KelolaAkunPage />;
    if (view === "log" && (profile.role === "admin" || profile.role === "pimpinan")) return <LogAktivitasPage />;
    if (view === "pengaturan") return <PengaturanPage profile={profile} onProfileUpdated={loadProfile} brand={brand} onBrandUpdated={reloadBrand} uiSize={uiSize} setUiSize={setUiSize} onModulChanged={modulT.reload} />;
    return null;
  }

  return (
    <BrandContext.Provider value={brand}>
      <Shell profile={profile} view={view} setView={setView} brand={brand} extraMenu={extraMenu} extraTitles={extraTitles}>{renderView()}</Shell>
    </BrandContext.Provider>
  );
}
