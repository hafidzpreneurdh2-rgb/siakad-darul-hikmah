import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import { supabase } from "./supabaseClient.js";

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
const MATA_KULIAH = ["Tahsin & Tajwid","Tahfidz Al-Qur'an","Bahasa Arab","Fiqih Ibadah","Aqidah Akhlak","Sirah Nabawiyah","Kewirausahaan Dasar","Manajemen Bisnis Syariah","Akuntansi Sederhana","Public Speaking & Dakwah","Bahasa Inggris","Digital Marketing","Sidang Bisnis","Sidang Munaqasyah Matan Jazary"];
const BIDANG_BISNIS = ["Bakery", "Fashion", "Kuliner", "Kerajinan", "Digital/Online", "Lainnya"];
const JENIS_IBADAH = ["Sholat Berjamaah", "Sholat Rawatib", "Sholat Dhuha", "Sholat Tahajud", "Al-Ma'tsurat", "Membaca Al-Kahfi", "Puasa Sunnah"];
const JENIS_SETORAN_QURAN = ["Ziyadah", "Murajaah", "Tilawah", "Tahsin", "Talaqqi"];
const JENIS_SETORAN_QURAN_COLOR = { Ziyadah: "#0B4D30", Murajaah: "#B8935A", Tilawah: "#3F6C8A", Tahsin: "#8A4A3A", Talaqqi: "#5C4A8A" };
const CAPAIAN_OPTIONS = {
  "Sholat Berjamaah": ["Berjamaah", "Sendiri", "Tidak Sholat"],
  "Sholat Rawatib": ["Lengkap", "Sebagian", "Tidak Dikerjakan"],
  "Sholat Dhuha": ["Dikerjakan", "Tidak Dikerjakan"],
  "Sholat Tahajud": ["Dikerjakan", "Tidak Dikerjakan"],
  "Al-Ma'tsurat": ["Lengkap", "Tidak Lengkap"],
  "Membaca Al-Kahfi": ["Dikerjakan", "Tidak Dikerjakan"],
  "Puasa Sunnah": ["Puasa Penuh", "Tidak Puasa"],
  "Qiyamullail": ["Dikerjakan", "Tidak Dikerjakan"],
};
const CAPAIAN_NEGATIF = ["Tidak Sholat", "Tidak Puasa", "Tidak Lengkap", "Tidak Dikerjakan"];
const CAPAIAN_NETRAL = ["Sendiri", "Sebagian"];
function capaianTone(capaian) {
  if (CAPAIAN_NEGATIF.includes(capaian)) return "red";
  if (CAPAIAN_NETRAL.includes(capaian)) return "gold";
  return "green";
}
const ROLE_LABEL = { admin: "Administrator", musyrif: "Musyrif", musyrifah: "Musyrifah", keuangan: "Bendahara", akademik: "Staf Akademik", pimpinan: "Pimpinan Pondok", santri: "Mahasantri / Wali" };
const AVATAR_COLORS = ["#0B4D30","#AD7F2C","#8A4A3A","#3F6C8A","#5C4A8A","#2F6B5E"];
const nowYear = new Date().getFullYear();
const DEFAULT_TAGLINE = "Pondok Tahfidz Qur'an dan Entrepreneur Darul Hikmah";
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
  santri: ["admin"], akademik: ["admin", "akademik"], kurikulum: ["admin", "akademik"],
  quran: ["admin", "musyrif", "musyrifah"], ibadah: ["admin", "musyrif", "musyrifah"],
  spp: ["admin", "keuangan"], pengumuman: ["admin", "pimpinan"], kalender: ["admin", "akademik", "pimpinan"],
};
function canEdit(role, area) { return CAN_EDIT[area]?.includes(role); }

const AKADEMIK_GROUP = { label: "Akademik", items: [["akademik","KRS & KHS"],["kurikulum","Kurikulum"],["kalender","Kalender Akademik"],["rapor","Rapor Bulanan"]] };
const KARTU_MENU = ["kartu", "Kartu Tanda Mahasantri"];
const MENUS = {
  admin: [["dashboard","Dashboard"],["santri","Data Mahasantri"], AKADEMIK_GROUP, KARTU_MENU, ["quran","Capaian Al-Qur'an"],["ibadah","Ibadah"],["spp","Iuran SPP"],["pengumuman","Pengumuman"],["akun","Kelola Akun"],["pengaturan","Pengaturan"]],
  musyrif: [["dashboard","Dashboard"],["quran","Capaian Al-Qur'an"],["ibadah","Ibadah"],["rapor","Rapor Bulanan"],["pengumuman","Pengumuman"],["kalender","Kalender Akademik"],["pengaturan","Pengaturan"]],
  musyrifah: [["dashboard","Dashboard"],["quran","Capaian Al-Qur'an"],["ibadah","Ibadah"],["rapor","Rapor Bulanan"],["pengumuman","Pengumuman"],["kalender","Kalender Akademik"],["pengaturan","Pengaturan"]],
  keuangan: [["dashboard","Dashboard"],["spp","Iuran SPP"],["pengumuman","Pengumuman"],["kalender","Kalender Akademik"],["pengaturan","Pengaturan"]],
  akademik: [["dashboard","Dashboard"], AKADEMIK_GROUP, KARTU_MENU, ["pengumuman","Pengumuman"],["pengaturan","Pengaturan"]],
  pimpinan: [["dashboard","Dashboard"],["santri","Data Mahasantri"], AKADEMIK_GROUP, KARTU_MENU, ["quran","Capaian Al-Qur'an"],["ibadah","Ibadah"],["spp","Iuran SPP"],["pengumuman","Pengumuman"],["pengaturan","Pengaturan"]],
  santri: [["dashboard","Dashboard"], AKADEMIK_GROUP, KARTU_MENU, ["quran","Capaian Al-Qur'an"],["ibadah","Ibadah"],["spp","Iuran SPP"],["pengumuman","Pengumuman"],["pengaturan","Pengaturan"]],
};
const PAGE_TITLES = { dashboard: "Dashboard", santri: "Data Mahasantri", akademik: "Akademik", kurikulum: "Kurikulum", rapor: "Rapor Bulanan", kartu: "Kartu Tanda Mahasantri", quran: "Capaian Al-Qur'an", ibadah: "Ibadah", spp: "Iuran SPP", pengumuman: "Pengumuman", kalender: "Kalender Akademik", akun: "Kelola Akun", pengaturan: "Pengaturan" };

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
function Shell({ profile, view, setView, brand, children }) {
  const menu = MENUS[profile.role] || [];
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
            <div className="text-[0.6875rem] text-stone-400 font-semibold">Beranda / {PAGE_TITLES[view]}</div>
            <div className="font-serif-dh text-[1.0625rem] font-semibold text-[#0B3B36]">{PAGE_TITLES[view]}</div>
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
function StackedBarChart({ data }) {
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
              {belumPct > 0 && <div style={{ height: `${belumPct}%`, backgroundColor: "#DC2626" }} />}
              {lunasPct > 0 && <div style={{ height: `${lunasPct}%`, backgroundColor: "#0B4D30" }} />}
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
      <div className="font-serif-dh text-3xl font-semibold mt-2 text-stone-800">{value}</div>
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
function useTable(table, deps = []) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  async function reload() {
    setLoading(true);
    const { data, error } = await supabase.from(table).select("*");
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
function Dashboard({ profile }) {
  const santriT = useTable("santri");
  const sppT = useTable("spp");
  const quranT = useTable("quran_log");
  const pengT = useTable("pengumuman");

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
        <PengumumanTerbaru rows={pengT.rows} />
      </div>
    );
  }

  const bulanIni = BULAN[new Date().getMonth()];
  const belumLunas = sppT.rows.filter((r) => r.bulan === bulanIni && r.tahun === nowYear && r.status !== "Lunas").length;
  const jenisCounts = JENIS_SETORAN_QURAN.map((j) => ({
    label: j,
    value: quranT.rows.filter((l) => l.jenis === j).length,
    color: JENIS_SETORAN_QURAN_COLOR[j],
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
              <StackedBarChart data={sppTrend} />
              <div className="flex items-center gap-4 mt-4 text-xs font-semibold text-stone-500">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: "#0B4D30" }} /> Lunas</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: "#DC2626" }} /> Belum Lunas</div>
              </div>
            </Card>
          )}
        </div>
      )}

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
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3.5">Mahasantri</th><th className="p-3.5">Angkatan</th><th className="p-3.5">Juz</th><th className="p-3.5">Status</th><th className="p-3.5"></th></tr></thead>
          <tbody>
            {rows.map((s) => (
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
    tanggal_masuk: "", status_spp: "Lunas",
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
        </div>
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
function AkademikStaffPage({ profile }) {
  const editable = canEdit(profile.role, "akademik");
  const brand = useContext(BrandContext);
  const santriT = useTable("santri");
  const akT = useTable("akademik");
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
  useEffect(() => { setPilihan(""); }, [nim]);
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
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3.5">Mahasantri</th><th className="p-3.5">Angkatan</th><th className="p-3.5">IPK</th><th className="p-3.5">Matkul Selesai</th></tr></thead>
            <tbody>
              {santriT.rows.map((s) => {
                const sel = bestPerKode(akT.rows.filter((a) => a.nim === s.nim && a.status === "selesai"));
                const tot = sel.reduce((a, r) => a + r.sks, 0);
                const ipk = tot ? (sel.reduce((a, r) => a + bobot(nilaiHuruf(r.nilai_angka)) * r.sks, 0) / tot).toFixed(2) : "-";
                return (
                  <tr key={s.nim} className="border-t border-stone-100 hover:bg-stone-50/60 cursor-pointer" onClick={() => setNim(s.nim)}>
                    <td className="p-3.5"><div className="flex items-center gap-3"><Avatar name={s.nama} size={30} /><div><div className="font-bold">{s.nama}</div><div className="text-[0.6875rem] text-stone-400">{s.nim}</div></div></div></td>
                    <td className="p-3.5">{s.kelas}</td><td className="p-3.5">{ipk}</td><td className="p-3.5">{sel.length}</td>
                  </tr>
                );
              })}
              {santriT.rows.length === 0 && <tr><td colSpan={4}><Empty text="Belum ada santri." /></td></tr>}
            </tbody>
          </table>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <BackBar onBack={() => setNim("")} />
      <PageHeader title={santri?.nama || nim} sub={nim} actions={
        <div className="flex gap-2">
          {editable && <Btn onClick={() => setShowForm(true)}>+ Tambah Mata Kuliah</Btn>}
        </div>
      } />

      {/* ===== Pratinjau & Cetak Dokumen Akademik (KRS / KHS) ===== */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .krs-print, .krs-print * { visibility: visible; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
          .krs-print { position: absolute; top: 0; left: 0; width: 100%; padding: 24px 32px; box-shadow: none !important; border: none !important; }
        }
      `}</style>
      <div className="mb-4 max-w-xs">
        <Select value={pilihanAktif} onChange={(e) => setPilihan(e.target.value)}>
          {semesters.length === 0 && <option value="">Belum ada data</option>}
          {semesters.map((s) => { const [ta2, sem2] = s.split("|"); return <option key={s} value={s}>{ta2} · Semester {sem2}</option>; })}
        </Select>
      </div>
      <div className="flex items-center justify-between mb-2">
        <div className="inline-flex rounded-lg border border-stone-300 overflow-hidden">
          <button onClick={() => setDokType("KRS")} className={`px-4 py-1.5 text-xs font-bold ${dokType === "KRS" ? "bg-[#0B3B36] text-white" : "bg-white text-stone-500"}`}>KRS</button>
          <button onClick={() => setDokType("KHS")} className={`px-4 py-1.5 text-xs font-bold ${dokType === "KHS" ? "bg-[#0B3B36] text-white" : "bg-white text-stone-500"}`}>KHS</button>
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

        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15 }}>{dokType === "KRS" ? "KARTU RENCANA STUDI (KRS)" : "KARTU HASIL STUDI (KHS)"}</div>
        <div style={{ textAlign: "center", fontSize: 11, paddingBottom: 6, marginBottom: 16 }}>
          Semester {semesterTerbaru?.semester || "-"} {semesterTerbaru?.tahun_ajaran || ""}
        </div>

        <div style={{ fontSize: 11, marginBottom: 3, display: "flex" }}><span style={{ width: 130 }}>Nama Mahasantri</span><span>: {santri?.nama}</span></div>
        <div style={{ fontSize: 11, marginBottom: 3, display: "flex" }}><span style={{ width: 130 }}>NIM</span><span>: {santri?.nim}</span></div>
        <div style={{ fontSize: 11, marginBottom: 14, display: "flex" }}><span style={{ width: 130 }}>Semester</span><span>: {semesterTerbaru?.semester || "-"} {semesterTerbaru?.tahun_ajaran || ""}</span></div>

        {dokType === "KRS" ? (
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

        <div style={{ fontSize: 10.5, marginTop: 24, textAlign: "right" }}>
          <div>{brand.kota_pondok || "Banda Aceh"}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
          <div>Mudir Pondok Tahfidz Qur'an dan Entrepreneur<br/>Darul Hikmah</div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, marginBottom: 6 }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${brand.nama_pondok || "SIAKAD"} | ${dokType} | NIM ${santri?.nim} | ${semesterTerbaru?.tahun_ajaran} Semester ${semesterTerbaru?.semester}`)}`}
              alt="QR verifikasi tanda tangan"
              style={{ width: 56, height: 56 }}
            />
          </div>
          {brand.tanda_tangan_mudir_url ? (
            <div><img src={brand.tanda_tangan_mudir_url} alt="Tanda tangan Mudir" style={{ height: 46, marginLeft: "auto" }} /></div>
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
      {showForm && <AkademikForm nim={nim} onCancel={() => setShowForm(false)} onSubmit={saveRecord} />}
      {editingRecord && <AkademikForm nim={nim} initial={editingRecord} onCancel={() => setEditingRecord(null)} onSubmit={saveRecord} />}
    </div>
  );
}
function AkademikForm({ initial, nim, onCancel, onSubmit }) {
  const [f, setF] = useState(initial || { tahun_ajaran: `${nowYear}/${nowYear + 1}`, semester: "Ganjil", mata_kuliah: MATA_KULIAH[0], sks: 2, status: "aktif", pengajar: "", kode_mk: "", mengulang: false, bidang_bisnis: "", nama_brand: "", deskripsi_produk: "", logo_url: "", foto_produk_url: "" });
  const [uploading, setUploading] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function uploadFile(field) {
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
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
        <Field label="Tahun Ajaran"><Input value={f.tahun_ajaran} onChange={set("tahun_ajaran")} /></Field>
        <Field label="Semester"><Select value={f.semester} onChange={set("semester")}><option>Ganjil</option><option>Genap</option></Select></Field>
        <Field label="Kode MK (opsional)"><Input value={f.kode_mk} onChange={set("kode_mk")} placeholder="cth. MKQ 1.1.1" /></Field>
        <Field label="Mata Kuliah">
          <Input list="mataKuliahSuggestions" value={f.mata_kuliah} onChange={set("mata_kuliah")} placeholder="Tulis nama mata kuliah" />
          <datalist id="mataKuliahSuggestions">{MATA_KULIAH.map((m) => <option key={m} value={m} />)}</datalist>
        </Field>
        <Field label="Pengajar"><Input value={f.pengajar} onChange={set("pengajar")} placeholder="Nama ustadz/ustadzah pengampu" /></Field>
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
function KurikulumPage({ profile }) {
  const editable = canEdit(profile.role, "kurikulum");
  const kurT = useTable("kurikulum");
  const akT = useTable("akademik");
  const santriT = useTable("santri");
  const isViewer = profile.role !== "santri";
  const [nim, setNim] = useState(isViewer ? "" : profile.nim);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const bySemester = {};
  kurT.rows.forEach((k) => { (bySemester[k.semester_ke] = bySemester[k.semester_ke] || []).push(k); });
  const semesterKeys = Object.keys(bySemester).map(Number).sort((a, b) => a - b);

  const santriRecords = nim ? akT.rows.filter((a) => a.nim === nim) : [];
  const kodeSudahDiambil = new Set(santriRecords.map((r) => r.kode_mk).filter(Boolean));

  async function saveItem(f) {
    const payload = { ...f, semester_ke: Number(f.semester_ke), sks: Number(f.sks) };
    const { error } = payload.id
      ? await supabase.from("kurikulum").update(payload).eq("id", payload.id)
      : await supabase.from("kurikulum").insert(payload);
    if (error) { alert(error.message); return; }
    setShowForm(false); setEditingItem(null); kurT.reload();
  }
  async function removeItem(id) {
    if (!confirm("Hapus mata kuliah kurikulum ini?")) return;
    const { error } = await supabase.from("kurikulum").delete().eq("id", id);
    if (error) alert(error.message); else kurT.reload();
  }

  const totalItem = kurT.rows.length;
  const totalDiambil = kurT.rows.filter((k) => kodeSudahDiambil.has(k.kode_mk)).length;

  return (
    <div>
      <PageHeader title="Kurikulum Mahasantri" sub="Daftar mata kuliah wajib per semester." actions={
        editable && <Btn onClick={() => setShowForm(true)}>+ Tambah Mata Kuliah Kurikulum</Btn>
      } />

      {!isViewer ? null : (
        <div className="mb-4 max-w-sm">
          <Select value={nim} onChange={(e) => setNim(e.target.value)}>
            <option value="">Pilih santri untuk lihat progres…</option>
            {santriT.rows.map((s) => <option key={s.nim} value={s.nim}>{s.nama} — {s.nim}</option>)}
          </Select>
        </div>
      )}

      {nim && (
        <Card className="mb-4">
          <div className="text-sm text-stone-600">Progres Kurikulum: <b className="text-[#0B3B36]">{totalDiambil} dari {totalItem}</b> mata kuliah wajib sudah diambil</div>
          <div className="h-2 bg-stone-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-[#0B3B36] rounded-full" style={{ width: `${totalItem ? (totalDiambil / totalItem) * 100 : 0}%` }}></div></div>
        </Card>
      )}

      {semesterKeys.length === 0 && <Empty text="Belum ada data kurikulum." />}
      {semesterKeys.map((sk) => (
        <Card key={sk} className="p-0 overflow-hidden mb-4">
          <div className="px-4 py-3 bg-stone-50 border-b border-stone-100 font-bold text-sm text-[#0B3B36]">Semester {sk}</div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3">Kode MK</th><th className="p-3">Mata Kuliah</th><th className="p-3">SKS</th>{nim && <th className="p-3">Status</th>}{editable && <th className="p-3"></th>}</tr></thead>
            <tbody>
              {bySemester[sk].map((k) => (
                <tr key={k.id} className="border-t border-stone-100">
                  <td className="p-3 text-stone-400">{k.kode_mk || "-"}</td>
                  <td className="p-3 font-semibold">{k.mata_kuliah}</td>
                  <td className="p-3">{k.sks}</td>
                  {nim && <td className="p-3">{kodeSudahDiambil.has(k.kode_mk) ? <Badge tone="green">✓ Sudah</Badge> : <Badge tone="gold">Belum</Badge>}</td>}
                  {editable && <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => setEditingItem(k)} className="text-[#145048] text-xs font-bold mr-3">Edit</button>
                    <button onClick={() => removeItem(k.id)} className="text-red-600 text-xs font-bold">Hapus</button>
                  </td>}
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="border-t border-stone-200 bg-stone-50 font-bold"><td className="p-3" colSpan={2}>Total SKS Semester {sk}</td><td className="p-3">{bySemester[sk].reduce((a, k) => a + Number(k.sks || 0), 0)}</td>{nim && <td></td>}{editable && <td></td>}</tr></tfoot>
          </table>
        </Card>
      ))}

      {(showForm || editingItem) && <KurikulumForm initial={editingItem} onCancel={() => { setShowForm(false); setEditingItem(null); }} onSubmit={saveItem} />}
    </div>
  );
}
function KurikulumForm({ initial, onCancel, onSubmit }) {
  const [f, setF] = useState(initial || { semester_ke: 1, kode_mk: "", mata_kuliah: "", sks: 2 });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={initial ? "Edit Kurikulum" : "Tambah Mata Kuliah Kurikulum"} onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
        <Field label="Semester ke-"><Input type="number" min={1} max={14} value={f.semester_ke} onChange={set("semester_ke")} /></Field>
        <Field label="Kode MK"><Input value={f.kode_mk} onChange={set("kode_mk")} placeholder="cth. MKQ 1.1.1" /></Field>
        <Field label="Mata Kuliah"><Input value={f.mata_kuliah} onChange={set("mata_kuliah")} /></Field>
        <Field label="SKS"><Input type="number" value={f.sks} onChange={set("sks")} /></Field>
        <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit">Simpan</Btn></div>
      </form>
    </Modal>
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
function RaporBulananPage({ profile }) {
  const brand = useContext(BrandContext);
  const santriT = useTable("santri");
  const quranT = useTable("quran_log");
  const ibadahT = useTable("ibadah_log");
  const isViewer = profile.role !== "santri";
  const [nim, setNim] = useState(isViewer ? "" : profile.nim);
  const santri = santriT.rows.find((s) => s.nim === nim);
  const pickable = santriT.rows.filter((s) => profile.role === "admin" || profile.role === "pimpinan" || s.musyrif_username === profile.username);

  const [bulan, setBulan] = useState(BULAN[new Date().getMonth()]);
  const [tahun, setTahun] = useState(nowYear);
  const periode = `${tahun}-${String(BULAN.indexOf(bulan) + 1).padStart(2, "0")}`;

  const quranBulan = quranT.rows.filter((l) => l.nim === nim && l.tanggal?.slice(0, 7) === periode);
  const ibadahBulan = ibadahT.rows.filter((l) => l.nim === nim && l.tanggal?.slice(0, 7) === periode);
  const jenisIbadahBulanIni = [...new Set([...JENIS_IBADAH, ...ibadahBulan.map((l) => l.jenis)])];

  return (
    <div>
      <PageHeader eyebrow={isViewer ? "Akademik" : ""} title="Rapor Bulanan" sub="Ringkasan capaian Ibadah &amp; Al-Qur'an per bulan, bisa dicetak untuk wali."
        actions={santri && <Btn tone="ghost" onClick={() => window.print()}>🖨 Cetak Rapor</Btn>} />

      {isViewer && !nim && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3.5">Mahasantri</th><th className="p-3.5">NIM</th></tr></thead>
            <tbody>
              {pickable.map((s) => (
                <tr key={s.nim} className="border-t border-stone-100 cursor-pointer hover:bg-stone-50/60" onClick={() => setNim(s.nim)}>
                  <td className="p-3.5 font-semibold">{s.nama}</td>
                  <td className="p-3.5 text-stone-500">{s.nim}</td>
                </tr>
              ))}
              {pickable.length === 0 && <tr><td colSpan={2}><Empty text="Belum ada santri." /></td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {santri && (
        <>
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .rapor-print, .rapor-print * { visibility: visible; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .rapor-print { position: absolute; top: 0; left: 0; width: 100%; padding: 24px 32px; box-shadow: none !important; border: none !important; }
            }
          `}</style>
          {isViewer && <BackBar onBack={() => setNim("")} />}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-serif-dh text-2xl font-semibold text-[#0B3B36]">{santri.nama}</div>
              <div className="text-sm text-stone-400">{santri.nim}</div>
            </div>
            <div className="flex gap-2">
              <Select value={bulan} onChange={(e) => setBulan(e.target.value)} className="!w-auto">{BULAN.map((b) => <option key={b}>{b}</option>)}</Select>
              <Select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} className="!w-auto">
                {[nowYear - 1, nowYear, nowYear + 1].map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
          </div>

          <div className="rapor-print bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
            <table style={{ width: "100%", marginBottom: 14, borderBottom: "2px solid #0B3B36", paddingBottom: 10 }}><tbody><tr>
              <td style={{ width: 70, verticalAlign: "middle" }}>{(brand.logo_dokumen_url || brand.logo_url) && <img src={brand.logo_dokumen_url || brand.logo_url} alt="logo" style={{ width: 60 }} />}</td>
              <td style={{ verticalAlign: "middle" }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: "#0B3B36" }}>{brand.yayasan_nama}</div>
                <div style={{ fontWeight: 700, fontSize: 12, color: "#0B3B36" }}>PONDOK TAHFIDZ QURAN DAN ENTREPRENEUR {brand.nama_pondok?.toUpperCase()}</div>
                <div style={{ fontSize: 9.5, color: "#44544D" }}>{brand.alamat_pondok}</div>
                <div style={{ fontSize: 9.5, color: "#44544D", fontStyle: "italic" }}>Contact: {brand.kontak_pondok}</div>
              </td>
            </tr></tbody></table>

            <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15, color: "#0B3B36" }}>RAPOR BULANAN SANTRI</div>
            <div style={{ textAlign: "center", fontSize: 11, marginBottom: 16 }}>Bulan {bulan} {tahun}</div>

            <table style={{ width: "100%", fontSize: 11, marginBottom: 18 }}><tbody>
              <tr><td style={{ width: 130 }}>Nama Mahasantri</td><td>: {santri.nama}</td></tr>
              <tr><td>NIM</td><td>: {santri.nim}</td></tr>
            </tbody></table>

            <div style={{ fontWeight: 700, fontSize: 12, color: "#0B3B36", marginBottom: 8 }}>Capaian Al-Qur'an</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5, marginBottom: 8 }}>
              <thead><tr style={{ background: "#0B3B36", color: "#fff" }}>
                {JENIS_SETORAN_QURAN.map((j) => <th key={j} style={{ border: "1px solid #1F2937", padding: 6 }}>{j}</th>)}
              </tr></thead>
              <tbody><tr>
                {JENIS_SETORAN_QURAN.map((j) => {
                  const hal = quranBulan.filter((l) => l.jenis === j).reduce((a, l) => a + (l.halaman_dari && l.halaman_sampai ? Math.max(0, Number(l.halaman_sampai) - Number(l.halaman_dari) + 1) : 0), 0);
                  return <td key={j} style={{ border: "1px solid #1F2937", padding: 6, textAlign: "center" }}>{hal} hal<div style={{ fontSize: 9, color: "#8A8A8A" }}>(~{(hal / 20).toFixed(1)} juz)</div></td>;
                })}
              </tr></tbody>
            </table>
            <div style={{ fontSize: 10.5, marginBottom: 18 }}><b>Total Hafalan Dikuasai (s.d. saat ini):</b> {santri.juz_dikuasai?.length || 0} dari 30 Juz</div>

            <div style={{ fontWeight: 700, fontSize: 12, color: "#0B3B36", marginBottom: 8 }}>Capaian Ibadah</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5, marginBottom: 18 }}>
              <thead><tr style={{ background: "#0B3B36", color: "#fff" }}>
                <th style={{ border: "1px solid #1F2937", padding: 6, textAlign: "left" }}>Jenis Ibadah</th>
                <th style={{ border: "1px solid #1F2937", padding: 6 }}>Capaian Baik</th>
                <th style={{ border: "1px solid #1F2937", padding: 6 }}>Total Dicatat</th>
              </tr></thead>
              <tbody>
                {jenisIbadahBulanIni.map((j) => {
                  const entries = ibadahBulan.filter((l) => l.jenis === j);
                  const positif = entries.filter((l) => !CAPAIAN_NEGATIF.includes(l.capaian)).length;
                  return (
                    <tr key={j}>
                      <td style={{ border: "1px solid #1F2937", padding: 6 }}>{j}</td>
                      <td style={{ border: "1px solid #1F2937", padding: 6, textAlign: "center" }}>{positif}</td>
                      <td style={{ border: "1px solid #1F2937", padding: 6, textAlign: "center" }}>{entries.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ fontWeight: 700, fontSize: 12, color: "#0B3B36", marginBottom: 6 }}>Catatan Musyrif/Musyrifah</div>
            <table style={{ width: "100%", fontSize: 10.5, marginBottom: 18 }}><tbody>
              <tr><td style={{ width: 110, verticalAlign: "top" }}>Al-Qur'an</td><td style={{ verticalAlign: "top" }}>: {santri.catatan_quran || "-"}</td></tr>
              <tr><td style={{ verticalAlign: "top" }}>Ibadah</td><td style={{ verticalAlign: "top" }}>: {santri.catatan_ibadah || "-"}</td></tr>
            </tbody></table>

            <div style={{ fontSize: 10.5, marginTop: 20, textAlign: "right" }}>
              <div>{brand.kota_pondok || "Banda Aceh"}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
              <div>Mudir Pondok Tahfidz Qur'an dan Entrepreneur<br/>Darul Hikmah</div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, marginBottom: 6 }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${brand.nama_pondok || "SIAKAD"} | Rapor Bulanan | NIM ${santri.nim} | ${bulan} ${tahun}`)}`}
                  alt="QR verifikasi tanda tangan"
                  style={{ width: 56, height: 56 }}
                />
              </div>
              {brand.tanda_tangan_mudir_url ? (
                <div><img src={brand.tanda_tangan_mudir_url} alt="Tanda tangan Mudir" style={{ height: 46, marginLeft: "auto" }} /></div>
              ) : null}
              <div style={{ borderTop: brand.tanda_tangan_mudir_url ? "1px solid #999" : "none", paddingTop: brand.tanda_tangan_mudir_url ? 2 : 0 }}>{brand.nama_mudir}</div>
              <div>NIP. {brand.nip_mudir || "-"}</div>
            </div>
            <div style={{ fontSize: 8.5, color: "#6B7280", marginTop: 18, paddingTop: 10, borderTop: "1px dashed #B8935A" }}>
              <div>No. Dokumen: RPR-{nim}-{periode.replace("-", "")}</div>
              <div>Dicetak: {new Date().toLocaleString("id-ID")}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Kartu Tanda Mahasantri (KTS)                                                 */
/* ---------------------------------------------------------------------- */
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
    qrPos: "kiri", qrUkuran: "38", qrTampil: "ya", ttdPos: "kanan", ttdUkuran: "22", ttdBentuk: "gambar",
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
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3.5">Mahasantri</th><th className="p-3.5">NIM</th></tr></thead>
              <tbody>
                {daftar.map((s) => (
                  <tr key={s.nim} className="border-t border-stone-100 cursor-pointer hover:bg-stone-50/60" onClick={() => setNim(s.nim)}>
                    <td className="p-3.5 font-semibold">{s.nama}</td>
                    <td className="p-3.5 text-stone-500">{s.nim}</td>
                  </tr>
                ))}
                {daftar.length === 0 && <tr><td colSpan={2}><Empty text="Tidak ada santri yang cocok." /></td></tr>}
              </tbody>
            </table>
          </Card>
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
                  ["QR code terpisah", seg("qrTampil", [["ya", "Tampilkan"], ["tidak", "Sembunyikan"]])],
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
            <p className="text-xs text-stone-400 mt-3">Pengaturan tersimpan di perangkat ini. Saat jendela cetak muncul, pastikan opsi <b>Margin</b> di browser diatur ke <b>Bawaan</b> atau <b>Tidak ada</b>.</p>
          </Card>
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
                  <div style={{ fontSize: 6.5, letterSpacing: 1, opacity: 0.75 }}>KARTU TANDA MAHASANTRI</div>
                  <div style={{ fontSize: 9, fontWeight: 700 }}>{brand.nama_pondok || "Darul Hikmah"}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: cfg.fotoPos === "kanan" ? "row-reverse" : "row", gap: 10, padding: "9px 10px", flex: 1 }}>
                <div style={{ width: 50, height: 62, borderRadius: 6, overflow: "hidden", background: "#EFE8D4", flexShrink: 0, border: "1px solid #DCCFA0" }}>
                  {santri.foto_url ? <img src={santri.foto_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div className="w-full h-full flex items-center justify-center text-[1.125rem] font-bold text-[#B8935A]">{initials(santri.nama)}</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: TA[cfg.dataAlign] }}>
                  <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2, color: "#0B3B36" }}>{santri.nama}</div>
                  <div style={{ fontSize: 8, color: "#B8935A", fontWeight: 700, marginBottom: 5 }}>NIM {santri.nim}</div>
                  <div style={{ fontSize: 7.5, color: "#44544D", lineHeight: 1.6 }}>
                    <div>Angkatan: {santri.angkatan || "-"}</div>
                    <div>TTL: {santri.tempat_lahir || "-"}, {fmtTgl(santri.tanggal_lahir)}</div>
                    <div>Gol. Darah: {santri.golongan_darah || "-"}</div>
                  </div>
                </div>
              </div>
              <div style={{ borderTop: "1px solid #E7DFCB", padding: "3px 10px", fontSize: 6, color: "#8A7F5E", fontStyle: "italic", textAlign: TA[cfg.footAlign] }}>Berlaku selama aktif sebagai mahasantri</div>
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
              <div style={{ padding: "8px 10px 0", fontSize: 7, color: "#44544D", lineHeight: 1.5, textAlign: TA[cfg.belAlign] }}>
                <div style={{ fontWeight: 700, color: "#0B3B36", fontSize: 8, marginBottom: 2 }}>{brand.yayasan_nama}</div>
                <div>{brand.alamat_pondok}</div>
                <div style={{ fontStyle: "italic" }}>Contact: {brand.kontak_pondok}</div>
              </div>
              <div style={{ padding: "0 10px", fontSize: 6.3, color: "#6B7280", lineHeight: 1.5, textAlign: TA[cfg.belAlign] }}>
                Kartu ini adalah identitas resmi mahasantri Pondok Tahfidz Qur'an dan Entrepreneur Darul Hikmah.
                Jika ditemukan, mohon dikembalikan ke alamat pondok di atas.
              </div>
              <div style={{ padding: "0 10px 9px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "end" }}>
                {["kiri", "tengah", "kanan"].map((pos) => (
                  <div key={pos} style={{ display: "flex", alignItems: "flex-end", gap: 8, justifyContent: FX[pos] }}>
                    {cfg.qrTampil !== "tidak" && cfg.qrPos === pos && qrEl}
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
function AkademikSantriPage({ profile }) {
  const brand = useContext(BrandContext);
  const akT = useTable("akademik");
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
      <PageHeader title="Akademik" sub="KRS dan KHS Anda, pilih semester di bawah ini." />

      <div className="mb-5 max-w-xs">
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

        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15 }}>{dokType === "KRS" ? "KARTU RENCANA STUDI (KRS)" : "KARTU HASIL STUDI (KHS)"}</div>
        <div style={{ textAlign: "center", fontSize: 11, paddingBottom: 6, marginBottom: 16 }}>
          Semester {sem || "-"} {ta || ""}
        </div>

        <div style={{ fontSize: 11, marginBottom: 3, display: "flex" }}><span style={{ width: 130 }}>Nama Mahasantri</span><span>: {santri?.nama}</span></div>
        <div style={{ fontSize: 11, marginBottom: 3, display: "flex" }}><span style={{ width: 130 }}>NIM</span><span>: {santri?.nim}</span></div>
        <div style={{ fontSize: 11, marginBottom: 14, display: "flex" }}><span style={{ width: 130 }}>Semester</span><span>: {sem || "-"} {ta || ""}</span></div>

        {dokType === "KRS" ? (
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

        <div style={{ fontSize: 10.5, marginTop: 24, textAlign: "right" }}>
          <div>{brand.kota_pondok || "Banda Aceh"}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
          <div>Mudir Pondok Tahfidz Qur'an dan Entrepreneur<br/>Darul Hikmah</div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, marginBottom: 6 }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${brand.nama_pondok || "SIAKAD"} | ${dokType} | NIM ${santri?.nim} | ${ta} Semester ${sem}`)}`}
              alt="QR verifikasi tanda tangan"
              style={{ width: 56, height: 56 }}
            />
          </div>
          {brand.tanda_tangan_mudir_url ? (
            <div><img src={brand.tanda_tangan_mudir_url} alt="Tanda tangan Mudir" style={{ height: 46, marginLeft: "auto" }} /></div>
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
  const pickable = santriT.rows.filter((s) => profile.role === "admin" || profile.role === "pimpinan" || s.musyrif_username === profile.username);

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
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3.5">Mahasantri</th><th className="p-3.5">Juz Dikuasai</th><th className="p-3.5">Setoran Terakhir</th></tr></thead>
            <tbody>
              {pickable.map((s) => {
                const last = logT.rows.filter((l) => l.nim === s.nim).sort((a, b) => b.tanggal.localeCompare(a.tanggal))[0];
                return (
                  <tr key={s.nim} className="border-t border-stone-100 hover:bg-stone-50/60 cursor-pointer" onClick={() => setNim(s.nim)}>
                    <td className="p-3.5"><div className="flex items-center gap-3"><Avatar name={s.nama} size={30} /><div><div className="font-bold">{s.nama}</div><div className="text-[0.6875rem] text-stone-400">{s.nim}</div></div></div></td>
                    <td className="p-3.5"><Badge tone="gold">{s.juz_dikuasai?.length || 0} juz</Badge></td>
                    <td className="p-3.5 text-stone-500">{last ? `${last.tanggal} · ${last.jenis}` : "-"}</td>
                  </tr>
                );
              })}
              {pickable.length === 0 && <tr><td colSpan={3}><Empty text="Belum ada mahasantri binaan." /></td></tr>}
            </tbody>
          </table>
        </Card>
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
        <div className="grid grid-cols-5 gap-3 mb-5">
          {JENIS_SETORAN_QURAN.map((j) => {
            const hal = logs.filter((l) => l.jenis === j).reduce((a, l) => a + (l.halaman_dari && l.halaman_sampai ? Math.max(0, Number(l.halaman_sampai) - Number(l.halaman_dari) + 1) : 0), 0);
            return <StatCard key={j} label={j} value={`${hal} hal`} sub={`~${(hal / 20).toFixed(1)} juz`} />;
          })}
        </div>
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
  const pickable = santriT.rows.filter((s) => profile.role === "admin" || profile.role === "pimpinan" || s.musyrif_username === profile.username);

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
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3.5">Mahasantri</th><th className="p-3.5">Catatan Terakhir</th><th className="p-3.5">Status</th></tr></thead>
            <tbody>
              {withStatus.map(({ s, last, perhatian }) => (
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
      </div>
    );
  }

  return (
    <div>
      {isViewer && <BackBar onBack={() => setNim("")} />}
      <PageHeader title={isViewer ? (santri?.nama || "Ibadah") : "Ibadah"} sub="Catatan pembinaan ibadah harian santri."
        actions={<div className="flex gap-2">{editable && isViewer && <Btn onClick={() => setShowForm(true)}>+ Catat Ibadah</Btn>}{!isViewer && <Btn tone="gold" onClick={() => window.print()}>🖨 Unduh PDF</Btn>}</div>} />
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
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase text-stone-500"><th className="p-3">Tanggal</th><th className="p-3">Jenis Ibadah</th><th className="p-3">Capaian</th><th className="p-3">Catatan</th>{editable && isViewer && <th className="p-3 text-right">Aksi</th>}</tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-stone-100">
                <td className="p-3">{l.tanggal}</td><td className="p-3">{l.jenis}</td>
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
      {showForm && <IbadahForm onCancel={() => setShowForm(false)} onSubmit={saveLog} />}
      {editingLog && <IbadahForm initial={editingLog} onCancel={() => setEditingLog(null)} onSubmit={saveLog} />}
    </div>
  );
}
function IbadahForm({ initial, onCancel, onSubmit }) {
  const [f, setF] = useState(initial || { tanggal: new Date().toISOString().slice(0, 10), jenis: JENIS_IBADAH[0], capaian: CAPAIAN_OPTIONS[JENIS_IBADAH[0]][0], catatan: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setJenis = (e) => setF({ ...f, jenis: e.target.value, capaian: CAPAIAN_OPTIONS[e.target.value]?.[0] || "" });
  return (
    <Modal title={initial ? "Edit Catatan Ibadah" : "Catat Ibadah"} onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
        <Field label="Tanggal"><Input type="date" value={f.tanggal} onChange={set("tanggal")} /></Field>
        <Field label="Jenis Ibadah">
          <Input list="jenisIbadahOpsi" value={f.jenis} onChange={setJenis} placeholder="Pilih dari daftar atau ketik sendiri" />
          <datalist id="jenisIbadahOpsi">{JENIS_IBADAH.map((j) => <option key={j} value={j} />)}</datalist>
        </Field>
        <Field label="Capaian">
          <Input list="capaianOpsi" value={f.capaian} onChange={set("capaian")} placeholder="Pilih dari daftar atau ketik sendiri" />
          <datalist id="capaianOpsi">{(CAPAIAN_OPTIONS[f.jenis] || []).map((c) => <option key={c} value={c} />)}</datalist>
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
function SppPage({ profile }) {
  const editable = canEdit(profile.role, "spp");
  const isViewer = profile.role !== "santri";
  const santriT = useTable("santri");
  const sppT = useTable("spp");
  const profilesT = useTable("profiles");
  const [nim, setNim] = useState(isViewer ? "" : profile.nim);
  const [showForm, setShowForm] = useState(false);
  const brand = useContext(BrandContext);
  const [kuitansi, setKuitansi] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [showBulk, setShowBulk] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const santri = santriT.rows.find((s) => s.nim === nim);
  const rows = sppT.rows.filter((r) => r.nim === nim).sort((a, b) => b.tahun - a.tahun || BULAN.indexOf(b.bulan) - BULAN.indexOf(a.bulan));
  const bulanIni = BULAN[new Date().getMonth()];

  async function addRecord(f) {
    const today = new Date().toISOString().slice(0, 10);
    const pencatat = profile.nama || profile.username;
    if (f.id) {
      const { error } = await supabase.from("spp").update({ bulan: f.bulan, tahun: Number(f.tahun), nominal: Number(f.nominal), status: f.status, metode_bayar: f.metode_bayar, tanggal_bayar: f.status === "Lunas" ? (f.tanggal_bayar || today) : null, dicatat_oleh: f.status === "Lunas" ? pencatat : null, dicatat_oleh_username: f.status === "Lunas" ? profile.username : null }).eq("id", f.id);
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
    const baru = santriT.rows.filter((s) => !sudahAda.has(s.nim)).map((s) => ({ nim: s.nim, bulan: f.bulan, tahun, nominal: Number(f.nominal), status: "Belum Lunas", tanggal_bayar: null }));
    if (baru.length === 0) { alert("Semua santri sudah punya iuran untuk bulan itu."); setShowBulk(false); return; }
    const { error } = await supabase.from("spp").insert(baru);
    if (error) { alert(error.message); return; }
    setShowBulk(false); sppT.reload();
    alert(`${baru.length} iuran berhasil dibuat untuk ${f.bulan} ${tahun}.`);
  }
  async function toggle(r) {
    const jadiLunas = r.status !== "Lunas";
    const { error } = await supabase.from("spp").update({ status: jadiLunas ? "Lunas" : "Belum Lunas", tanggal_bayar: jadiLunas ? new Date().toISOString().slice(0, 10) : null, dicatat_oleh: jadiLunas ? (profile.nama || profile.username) : null, dicatat_oleh_username: jadiLunas ? profile.username : null }).eq("id", r.id);
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

  if (isViewer && !nim) {
    const withStatus = santriT.rows.map((s) => {
      const row = sppT.rows.find((r) => r.nim === s.nim && r.bulan === bulanIni && r.tahun === nowYear);
      return { s, row };
    }).filter(({ s }) => !q || s.nama.toLowerCase().includes(q.toLowerCase()) || s.nim.includes(q));
    const lunas = withStatus.filter(({ row }) => row?.status === "Lunas").length;
    const belumLunas = withStatus.filter(({ row }) => row && row.status !== "Lunas").length;
    const totalTertunggak = withStatus.filter(({ row }) => row && row.status !== "Lunas").reduce((a, { row }) => a + Number(row.nominal || 0), 0);

    return (
      <div>
        <PageHeader title="Iuran SPP" sub={`Status pembayaran bulan ${bulanIni} — klik santri untuk kelola.`} actions={editable && <Btn onClick={() => setShowBulk(true)}>+ Buat Iuran Bulan Ini</Btn>} />
        <div className="grid grid-cols-3 gap-4 mb-5">
          <StatCard label={`Lunas Bulan ${bulanIni}`} value={lunas} />
          <StatCard label="Belum Lunas" value={belumLunas} />
          <StatCard label="Total Tertunggak" value={formatRupiah(totalTertunggak)} />
        </div>
        <div className="mb-4 max-w-xs"><Input placeholder="Cari nama atau NIM..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3.5">Mahasantri</th><th className="p-3.5">Status Bulan Ini</th></tr></thead>
            <tbody>
              {withStatus.map(({ s, row }) => (
                <tr key={s.nim} className="border-t border-stone-100 hover:bg-stone-50/60 cursor-pointer" onClick={() => setNim(s.nim)}>
                  <td className="p-3.5"><div className="flex items-center gap-3"><Avatar name={s.nama} size={30} /><div><div className="font-bold">{s.nama}</div><div className="text-[0.6875rem] text-stone-400">{s.nim}</div></div></div></td>
                  <td className="p-3.5">{row ? <Badge tone={row.status === "Lunas" ? "green" : "red"}>{row.status}</Badge> : <Badge tone="grey">Belum ada iuran</Badge>}</td>
                </tr>
              ))}
              {withStatus.length === 0 && <tr><td colSpan={2}><Empty text="Tidak ada santri yang cocok." /></td></tr>}
            </tbody>
          </table>
        </Card>
        {showBulk && <BuatIuranBulanan onCancel={() => setShowBulk(false)} onSubmit={buatIuranBulanan} jumlah={santriT.rows.length} />}
      </div>
    );
  }

  return (
    <div>
      {isViewer && <BackBar onBack={() => setNim("")} />}
      <PageHeader title={isViewer ? (santri?.nama || "Iuran SPP") : "Iuran SPP"}
        actions={<div className="flex gap-2">{editable && isViewer && <Btn onClick={() => setShowForm(true)}>+ Tambah Iuran</Btn>}{!isViewer && <Btn tone="gold" onClick={() => window.print()}>🖨 Unduh PDF</Btn>}</div>} />
      <div className="grid grid-cols-2 gap-4 mb-5 max-w-lg">
        <StatCard label="Total Tunggakan" value={formatRupiah(rows.filter((r) => r.status !== "Lunas").reduce((a, r) => a + Number(r.nominal || 0), 0))} />
        <StatCard label="Bulan Belum Lunas" value={rows.filter((r) => r.status !== "Lunas").length} />
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
      {showForm && <SppForm onCancel={() => setShowForm(false)} onSubmit={addRecord} />}
      {editingRow && <SppForm initial={editingRow} onCancel={() => setEditingRow(null)} onSubmit={addRecord} />}
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
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 14, marginBottom: 2 }}>BUKTI PEMBAYARAN IURAN SPP</div>
        <div style={{ textAlign: "center", fontSize: 10, color: "#555", marginBottom: 14 }}>No. {noKuitansi}</div>
        <table style={{ width: "100%", fontSize: 12, lineHeight: 1.7 }}><tbody>
          <tr><td style={{ width: 130 }}>Telah terima dari</td><td>: {santri?.nama || row.nim} (NIM {row.nim})</td></tr>
          <tr><td>Untuk pembayaran</td><td>: Iuran SPP bulan {row.bulan} {row.tahun}</td></tr>
          <tr><td>Uang sejumlah</td><td>: <b>{formatRupiah(row.nominal)}</b></td></tr>
          <tr><td>Terbilang</td><td>: <i style={{ textTransform: "capitalize" }}>{terbilang(row.nominal)} rupiah</i></td></tr>
          <tr><td>Metode Pembayaran</td><td>: {row.metode_bayar || "-"}</td></tr>
        </tbody></table>
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
function BuatIuranBulanan({ onCancel, onSubmit, jumlah }) {
  const [f, setF] = useState({ bulan: BULAN[new Date().getMonth()], tahun: nowYear, nominal: 500000 });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title="Buat Iuran Bulanan" onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
        <Field label="Bulan"><Select value={f.bulan} onChange={set("bulan")}>{BULAN.map((b) => <option key={b}>{b}</option>)}</Select></Field>
        <Field label="Tahun"><Input type="number" value={f.tahun} onChange={set("tahun")} /></Field>
        <Field label="Nominal per Santri"><Input type="number" value={f.nominal} onChange={set("nominal")} /></Field>
        <div className="text-xs text-stone-500 mb-1">Sistem membuat iuran berstatus "Belum Lunas" untuk semua santri ({jumlah} santri) yang belum punya iuran bulan itu. Yang sudah ada dilewati. Nominal santri tertentu bisa diedit setelahnya.</div>
        <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit">Buat Iuran</Btn></div>
      </form>
    </Modal>
  );
}
function SppForm({ initial, onCancel, onSubmit }) {
  const [f, setF] = useState(initial || { bulan: BULAN[new Date().getMonth()], tahun: nowYear, nominal: 500000, status: "Belum Lunas", metode_bayar: "Transfer Bank" });
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
          <div className="text-xs text-stone-400">{profilesT.rows.length} akun terdaftar</div>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-stone-50 text-left text-[0.6875rem] uppercase tracking-wide text-stone-500"><th className="p-3.5">Akun</th><th className="p-3.5">Peran</th><th className="p-3.5 text-right">Aksi</th></tr></thead>
          <tbody>
            {profilesT.rows.map((p) => (
              <tr key={p.id} className="border-t border-stone-100">
                <td className="p-3.5"><div className="flex items-center gap-3"><Avatar name={p.nama} url={p.avatar_url} size={30} /><div><div className="font-bold">{p.nama}</div><div className="text-[0.6875rem] text-stone-400">{p.username || p.nim}</div></div></div></td>
                <td className="p-3.5"><Badge tone="grey">{ROLE_LABEL[p.role] || p.role}</Badge></td>
                <td className="p-3.5 text-right"><button onClick={() => setEditingAkun(p)} className="text-[#145048] text-xs font-bold">Edit</button></td>
              </tr>
            ))}
            {profilesT.rows.length === 0 && <tr><td colSpan={3}><Empty text="Belum ada akun." /></td></tr>}
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
function PengaturanPage({ profile, onProfileUpdated, brand, onBrandUpdated, uiSize, setUiSize }) {
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
      nama_mudir: namaMudir, nip_mudir: nipMudir, nama_kabag_akademik: namaKabagAkademik, nip_kabag_akademik: nipKabagAkademik,
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
        .then(({ data }) => setProfile(data));
    } else {
      setProfile(null);
    }
  }
  useEffect(loadProfile, [session]);

  if (recovery) return <BrandContext.Provider value={brand}><ResetPasswordScreen brand={brand} onDone={() => setRecovery(false)} /></BrandContext.Provider>;
  if (session === undefined) return <div className="min-h-screen flex items-center justify-center text-stone-500">Memuat…</div>;
  if (!session) return <BrandContext.Provider value={brand}><LoginScreen brand={brand} /></BrandContext.Provider>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center text-stone-500">Memuat profil…</div>;

  function renderView() {
    if (view === "dashboard") return <Dashboard profile={profile} />;
    if (view === "santri" && ["admin","pimpinan"].includes(profile.role)) return <DataSantriPage profile={profile} />;
    if (view === "akademik") return profile.role === "santri" ? <AkademikSantriPage profile={profile} /> : <AkademikStaffPage profile={profile} />;
    if (view === "kurikulum") return <KurikulumPage profile={profile} />;
    if (view === "pengumuman") return <PengumumanPage profile={profile} />;
    if (view === "kalender") return <KalenderPage profile={profile} />;
    if (view === "rapor") return <RaporBulananPage profile={profile} />;
    if (view === "kartu") return <KartuSantriPage profile={profile} />;
    if (view === "quran") return <QuranPage profile={profile} />;
    if (view === "ibadah") return <IbadahPage profile={profile} />;
    if (view === "spp") return <SppPage profile={profile} />;
    if (view === "akun" && profile.role === "admin") return <KelolaAkunPage />;
    if (view === "pengaturan") return <PengaturanPage profile={profile} onProfileUpdated={loadProfile} brand={brand} onBrandUpdated={reloadBrand} uiSize={uiSize} setUiSize={setUiSize} />;
    return null;
  }

  return (
    <BrandContext.Provider value={brand}>
      <Shell profile={profile} view={view} setView={setView} brand={brand}>{renderView()}</Shell>
    </BrandContext.Provider>
  );
}
