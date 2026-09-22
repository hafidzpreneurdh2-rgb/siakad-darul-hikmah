import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import { supabase } from "./supabaseClient.js";

const BrandContext = createContext({ warna_utama: "#0B3B36", warna_aksen: "#B8935A" });

const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const MATA_KULIAH = ["Tahsin & Tajwid","Tahfidz Al-Qur'an","Bahasa Arab","Fiqih Ibadah","Aqidah Akhlak","Sirah Nabawiyah","Kewirausahaan Dasar","Manajemen Bisnis Syariah","Akuntansi Sederhana","Public Speaking & Dakwah","Bahasa Inggris","Digital Marketing"];
const JENIS_IBADAH = ["Sholat 5 Waktu Berjamaah","Sholat Sunnah Rawatib (Qabliyah/Ba'diyah)","Puasa Sunnah","Tilawah Harian","Dzikir Pagi-Petang","Qiyamullail"];
const JENIS_SETORAN_QURAN = ["Ziyadah", "Murajaah", "Tilawah", "Tahsin", "Talaqqi"];
const JENIS_SETORAN_QURAN_COLOR = { Ziyadah: "#0B4D30", Murajaah: "#B8935A", Tilawah: "#3F6C8A", Tahsin: "#8A4A3A", Talaqqi: "#5C4A8A" };
const CAPAIAN_OPTIONS = {
  "Sholat 5 Waktu Berjamaah": ["Berjamaah", "Sendiri", "Tidak Sholat"],
  "Sholat Sunnah Rawatib (Qabliyah/Ba'diyah)": ["Lengkap", "Sebagian", "Tidak Dikerjakan"],
  "Puasa Sunnah": ["Puasa Penuh", "Tidak Puasa"],
  "Tilawah Harian": ["Selesai", "Tidak Selesai"],
  "Dzikir Pagi-Petang": ["Lengkap", "Tidak Lengkap"],
  "Qiyamullail": ["Dikerjakan", "Tidak Dikerjakan"],
};
const CAPAIAN_NEGATIF = ["Tidak Sholat", "Tidak Puasa", "Tidak Selesai", "Tidak Lengkap", "Tidak Dikerjakan"];
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
function initials(name = "") { return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase(); }
function avatarColor(name = "") { let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length; return AVATAR_COLORS[h]; }
function todayLong() { return new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }

/* ---------------------------------------------------------------------- */
/* Permission map                                                           */
/* ---------------------------------------------------------------------- */
const CAN_EDIT = {
  santri: ["admin"], akademik: ["admin", "akademik"],
  quran: ["admin", "musyrif", "musyrifah"], ibadah: ["admin", "musyrif", "musyrifah"],
  spp: ["admin", "keuangan"],
};
function canEdit(role, area) { return CAN_EDIT[area]?.includes(role); }

const MENUS = {
  admin: [["dashboard","Dashboard"],["santri","Data Mahasantri"],["akademik","Akademik"],["quran","Capaian Al-Qur'an"],["ibadah","Ibadah"],["catatan","Catatan Pojok"],["spp","Tagihan SPP"],["akun","Kelola Akun"],["pengaturan","Pengaturan"]],
  musyrif: [["dashboard","Dashboard"],["quran","Capaian Al-Qur'an"],["ibadah","Ibadah"],["catatan","Catatan Pojok"],["pengaturan","Pengaturan"]],
  musyrifah: [["dashboard","Dashboard"],["quran","Capaian Al-Qur'an"],["ibadah","Ibadah"],["catatan","Catatan Pojok"],["pengaturan","Pengaturan"]],
  keuangan: [["dashboard","Dashboard"],["spp","Tagihan SPP"],["pengaturan","Pengaturan"]],
  akademik: [["dashboard","Dashboard"],["akademik","Akademik"],["pengaturan","Pengaturan"]],
  pimpinan: [["dashboard","Dashboard"],["santri","Data Mahasantri"],["akademik","Akademik"],["quran","Capaian Al-Qur'an"],["ibadah","Ibadah"],["catatan","Catatan Pojok"],["spp","Tagihan SPP"],["pengaturan","Pengaturan"]],
  santri: [["dashboard","Dashboard"],["akademik","Akademik"],["quran","Capaian Al-Qur'an"],["ibadah","Ibadah"],["catatan","Catatan Pojok"],["spp","Tagihan SPP"],["pengaturan","Pengaturan"]],
};
const PAGE_TITLES = { dashboard: "Dashboard", santri: "Data Mahasantri", akademik: "Akademik", quran: "Capaian Al-Qur'an", ibadah: "Ibadah", catatan: "Catatan Pojok", spp: "Tagihan SPP", akun: "Kelola Akun", pengaturan: "Pengaturan" };

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
  const map = { green: "bg-[#E9F1EE] text-[#0F4A44]", gold: "bg-[#FBF3DF] text-[#8A6A2A]", red: "bg-red-50 text-red-700", grey: "bg-stone-100 text-stone-600" };
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
  return <div className="mb-3"><label className="block text-[11px] font-extrabold text-stone-500 uppercase tracking-wider mb-1.5">{label}</label>{children}</div>;
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
            className={`aspect-square flex items-center justify-center text-[10px] font-bold rounded-md transition-transform hover:scale-110 ${set.has(j) ? "bg-gradient-to-br from-[#D8BE93] to-[#B8935A] text-white shadow-sm" : "bg-stone-100 text-stone-400"}`}>
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
      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-[28px] overflow-hidden shadow-[0_30px_70px_-20px_rgba(10,30,20,.35)] relative z-10">
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
              <LogoMark size={brand.ukuran_logo_login || 76} url={brand.logo_url} />
            </div>
            <div className="font-bold leading-none mb-4 drop-shadow-sm" style={{ fontSize: `${brand.ukuran_judul || 72}px`, fontFamily: fontFamilyOf(brand, "font_judul") }}>{brand.judul_besar || "SIAKAD"}</div>
            <p className="text-white/90 mt-2 leading-snug max-w-sm font-semibold whitespace-pre-line" style={{ fontSize: `${brand.ukuran_subjudul || 18}px`, textAlign: brand.align_subjudul || "left", marginLeft: brand.align_subjudul === "center" ? "auto" : 0, marginRight: brand.align_subjudul === "center" ? "auto" : 0, fontFamily: fontFamilyOf(brand, "font_subjudul") }}>
              {brand.subjudul || "Sistem Informasi Terpadu dan Manajemen Pembelajaran"} {brand.nama_pondok}
            </p>
          </div>
          <div className="relative pt-5 mt-8 border-t border-white/15">
            <div className="italic text-white whitespace-pre-line" style={{ textAlign: brand.align_slogan || "left", fontFamily: fontFamilyOf(brand, "font_slogan"), fontSize: `${brand.ukuran_slogan || 18}px` }}>"{brand.slogan || "Mencetak Pengusaha Muda Penghafal Quran"}"</div>
          </div>
        </div>

        <div className="bg-white p-10 flex flex-col justify-center">
          <h3 className="mb-1 font-semibold" style={{ color: brand.warna_utama, fontFamily: fontFamilyOf(brand, "font_sapaan"), fontSize: `${brand.ukuran_sapaan || 24}px` }}>{brand.sapaan || "Selamat Datang"}</h3>
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
          <div className="text-center mt-8 text-[11px] text-stone-400">© {nowYear} {brand.tagline || DEFAULT_TAGLINE}</div>
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
  return (
    <div className="min-h-screen bg-[#F4F2EA] flex">
      <aside className="w-64 text-white p-4 flex flex-col relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${brand.warna_utama}, #04100a)` }}>
        <PatternBG />
        <div className="relative flex flex-col items-center text-center gap-2 pb-5 mb-5 border-b border-white/10">
          <LogoMark size={brand.ukuran_logo_sidebar || 52} url={brand.logo_url} />
          <div>
            <div className="text-[10px] font-bold text-white/45 tracking-[0.15em]">SIAKAD</div>
            <div className="font-serif-dh text-[15px] font-semibold">{brand.nama_pondok}</div>
          </div>
        </div>
        <div className="relative text-[10px] font-extrabold text-white/35 tracking-[0.15em] px-3 mb-2">MENU UTAMA</div>
        <nav className="relative flex-1 space-y-1">
          {menu.map(([key, label]) => (
            <div key={key} onClick={() => setView(key)}
              className={`relative px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold cursor-pointer transition ${view === key ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"}`}>
              {view === key && <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r" style={{ backgroundColor: brand.warna_aksen }} />}
              {label}
            </div>
          ))}
        </nav>
        <div className="relative border-t border-white/10 pt-4 mt-3 flex items-center gap-3">
          <Avatar name={profile.nama} url={profile.avatar_url} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold truncate">{profile.nama}</div>
            <div className="text-[11px] text-white/45">{ROLE_LABEL[profile.role]}</div>
          </div>
          <button onClick={() => supabase.auth.signOut()} title="Keluar" className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/75">⏻</button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-stone-200 sticky top-0 z-10">
          <div>
            <div className="text-[11px] text-stone-400 font-semibold">Beranda / {PAGE_TITLES[view]}</div>
            <div className="font-serif-dh text-[17px] font-semibold text-[#0B3B36]">{PAGE_TITLES[view]}</div>
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
        {eyebrow && <div className="text-[11px] font-extrabold text-[#B8935A] uppercase tracking-[0.14em] mb-1">{eyebrow}</div>}
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
            <div className="text-[11px] font-bold text-stone-500">{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}
function StatCard({ label, value, sub, icon }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-extrabold text-stone-500 uppercase tracking-wider">{label}</div>
        {icon && <div className="w-8 h-8 rounded-lg bg-[#E9F1EE] flex items-center justify-center text-[#0F4A44]">{icon}</div>}
      </div>
      <div className="font-serif-dh text-3xl font-semibold mt-2 text-stone-800">{value}</div>
      {sub && <div className="text-xs text-stone-400 mt-1">{sub}</div>}
    </Card>
  );
}
function DokumenQR({ dokType, nim, ta, sem, pondok }) {
  const kode = `${dokType || "DOK"}-${nim || "-"}-${(ta || "").replace("/", "")}${(sem || "").slice(0, 1).toUpperCase()}`;
  const data = `${pondok || "SIAKAD"} | ${dokType} | NIM ${nim} | ${ta} Semester ${sem}`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, paddingTop: 10, borderTop: "1px dashed #B8935A" }}>
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(data)}`}
        alt="QR dokumen"
        style={{ width: 56, height: 56, flexShrink: 0 }}
      />
      <div style={{ fontSize: 8.5, color: "#6B7280", lineHeight: 1.5 }}>
        <div>No. Dokumen: {kode}</div>
        <div>Dicetak: {new Date().toLocaleString("id-ID")}</div>
      </div>
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
function Dashboard({ profile }) {
  const santriT = useTable("santri");
  const sppT = useTable("spp");
  const quranT = useTable("quran_log");

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
  const sppTrend = monthsBack(6).map(({ bulan, tahun, label }) => {
    const lunas = sppT.rows.filter((r) => r.bulan === bulan && r.tahun === tahun && r.status === "Lunas").length;
    return { label, lunas, belum: Math.max(0, totalSantri - lunas) };
  });

  const showQuranChart = true;
  const showSppChart = true;

  return (
    <div>
      <PageHeader eyebrow="Ringkasan" title="Dashboard" sub={`Assalamu'alaikum, ${profile.nama}`} />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Santri" value={santriT.rows.length} icon="👥" />
        <StatCard label="Tunggakan Bulan Ini" value={belumLunas} icon="💳" />
        <StatCard label="Rata-rata Juz" value={santriT.rows.length ? (santriT.rows.reduce((a, s) => a + (s.juz_dikuasai?.length || 0), 0) / santriT.rows.length).toFixed(1) : 0} icon="📖" />
      </div>
      {(showQuranChart || showSppChart) && (
        <div className={`grid gap-4 ${showQuranChart && showSppChart ? "grid-cols-2" : "grid-cols-1"}`}>
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

  async function upsert(form) {
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
          <thead><tr className="bg-stone-50 text-left text-[11px] uppercase tracking-wide text-stone-500"><th className="p-3.5">Mahasantri</th><th className="p-3.5">Angkatan</th><th className="p-3.5">Juz</th><th className="p-3.5">Status</th><th className="p-3.5"></th></tr></thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.nim} className="border-t border-stone-100 hover:bg-stone-50/60">
                <td className="p-3.5"><div className="flex items-center gap-3"><Avatar name={s.nama} size={30} /><div><div className="font-bold">{s.nama}</div><div className="text-[11px] text-stone-400">{s.nim}</div></div></div></td>
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
  const SectionTitle = ({ children }) => <div className="text-[11px] font-extrabold text-[#B8935A] uppercase tracking-[0.1em] mt-5 mb-2 pt-4 border-t border-stone-100 first:mt-0 first:pt-0 first:border-0">{children}</div>;

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
  async function uploadDokumen(field) {
    return async (e) => {
      const file = e.target.files?.[0];
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
    return (
      <div className="flex items-center justify-between border border-dashed border-stone-300 rounded-xl px-3.5 py-2.5 mb-2.5 text-sm">
        <span className="text-stone-600">{label}{f[field] && <a href={f[field]} target="_blank" rel="noreferrer" className="ml-2 text-[10px] font-bold text-[#145048] underline">Lihat file</a>}</span>
        <label className="text-xs font-bold text-[#0B3B36] border border-stone-300 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-stone-50">
          {uploading === field ? "Mengunggah…" : f[field] ? "Ganti" : "Unggah"}
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
            <div className="text-[11px] text-stone-400 mt-1">JPG/PNG, isi NIM dulu sebelum unggah.</div>
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
  const profilesT = useTable("profiles");
  const [nim, setNim] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [dokType, setDokType] = useState("KRS");
  const records = akT.rows.filter((a) => a.nim === nim);
  const santri = santriT.rows.find((s) => s.nim === nim);
  const pembimbing = profilesT.rows.find((p) => p.username === santri?.musyrif_username);
  const semesterTerbaru = [...records].sort((a, b) => (b.tahun_ajaran || "").localeCompare(a.tahun_ajaran || "") || (b.semester || "").localeCompare(a.semester || ""))[0];
  const recordsKRS = semesterTerbaru ? records.filter((r) => r.tahun_ajaran === semesterTerbaru.tahun_ajaran && r.semester === semesterTerbaru.semester) : [];

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
            <thead><tr className="bg-stone-50 text-left text-[11px] uppercase tracking-wide text-stone-500"><th className="p-3.5">Mahasantri</th><th className="p-3.5">Angkatan</th><th className="p-3.5">IPK</th><th className="p-3.5">Matkul Selesai</th></tr></thead>
            <tbody>
              {santriT.rows.map((s) => {
                const sel = akT.rows.filter((a) => a.nim === s.nim && a.status === "selesai");
                const tot = sel.reduce((a, r) => a + r.sks, 0);
                const ipk = tot ? (sel.reduce((a, r) => a + bobot(nilaiHuruf(r.nilai_angka)) * r.sks, 0) / tot).toFixed(2) : "-";
                return (
                  <tr key={s.nim} className="border-t border-stone-100 hover:bg-stone-50/60 cursor-pointer" onClick={() => setNim(s.nim)}>
                    <td className="p-3.5"><div className="flex items-center gap-3"><Avatar name={s.nama} size={30} /><div><div className="font-bold">{s.nama}</div><div className="text-[11px] text-stone-400">{s.nim}</div></div></div></td>
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
          .krs-print, .krs-print * { visibility: visible; }
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
        <div style={{ textAlign: "center", fontSize: 11, borderBottom: "1px solid #B8935A", paddingBottom: 6, marginBottom: 16 }}>
          Semester {semesterTerbaru?.semester || "-"} {semesterTerbaru?.tahun_ajaran || ""}
        </div>

        <div style={{ fontSize: 11, marginBottom: 3, display: "flex" }}><span style={{ width: 130 }}>Nama Mahasantri</span><span>: {santri?.nama}</span></div>
        <div style={{ fontSize: 11, marginBottom: 3, display: "flex" }}><span style={{ width: 130 }}>NIM</span><span>: {santri?.nim}</span></div>
        <div style={{ fontSize: 11, marginBottom: 14, display: "flex" }}><span style={{ width: 130 }}>Angkatan</span><span>: {santri?.kelas}</span></div>

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
              <td colSpan={3} style={{ border: "1px solid #1F2937", padding: 5 }}>Total SKS</td>
              <td colSpan={2} style={{ border: "1px solid #1F2937", padding: 5 }}>{recordsKRS.reduce((a, r) => a + Number(r.sks || 0), 0)}</td>
            </tr>
          </tbody>
        </table>
        ) : (
        <>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5, marginBottom: 8 }}>
          <thead><tr style={{ background: "#0B3B36", color: "#fff" }}>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>No</th>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>Kode MK</th>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>Mata Kuliah</th>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>SKS</th>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>Nilai Angka</th>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>Nilai Huruf</th>
          </tr></thead>
          <tbody>
            {recordsKRS.map((r, i) => (
              <tr key={r.id}>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{i + 1}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{r.kode_mk || "-"}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5 }}>{r.mata_kuliah}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{r.sks}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{r.nilai_angka ?? "-"}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{r.nilai_angka != null ? nilaiHuruf(r.nilai_angka) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table style={{ width: "100%", fontSize: 10.5, marginBottom: 16 }}><tbody>
          <tr>
            <td>IP Semester ini: <b>{(() => {
              const sel = recordsKRS.filter((r) => r.status === "selesai");
              const tot = sel.reduce((a, r) => a + Number(r.sks || 0), 0);
              return tot ? (sel.reduce((a, r) => a + bobot(nilaiHuruf(r.nilai_angka)) * Number(r.sks || 0), 0) / tot).toFixed(2) : "-";
            })()}</b></td>
            <td style={{ textAlign: "right" }}>IPK Kumulatif: <b>{(() => {
              const sel = records.filter((r) => r.status === "selesai");
              const tot = sel.reduce((a, r) => a + Number(r.sks || 0), 0);
              return tot ? (sel.reduce((a, r) => a + bobot(nilaiHuruf(r.nilai_angka)) * Number(r.sks || 0), 0) / tot).toFixed(2) : "-";
            })()}</b></td>
          </tr>
        </tbody></table>
        </>
        )}

        <div style={{ fontSize: 10.5, marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>Menyetujui,<br/>Pembimbing</div>
            <div style={{ textAlign: "right" }}>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}<br/>Mahasantri ybs</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 42 }}>
            <div><b>{pembimbing?.nama || "-"}</b><br/>NIP. {pembimbing?.nip || "-"}</div>
            <div style={{ textAlign: "right" }}><b>{santri?.nama}</b><br/>NIM. {santri?.nim}</div>
          </div>

          <div style={{ textAlign: "center", marginTop: 26 }}>Mengetahui,</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
            <div>Plt. Mudir</div>
            <div style={{ textAlign: "right" }}>Kabag. Akademik</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 42 }}>
            <div><b>{brand.nama_mudir}</b><br/>NIP. {brand.nip_mudir || "-"}</div>
            <div style={{ textAlign: "right" }}><b>{brand.nama_kabag_akademik}</b><br/>NIP. {brand.nip_kabag_akademik || "-"}</div>
          </div>
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
          <thead><tr className="bg-stone-50 text-left text-[11px] uppercase tracking-wide text-stone-500"><th className="p-3.5">Kode MK</th><th className="p-3.5">Mata Kuliah</th><th className="p-3.5">Semester</th><th className="p-3.5">Pengajar</th><th className="p-3.5">SKS</th><th className="p-3.5">Status</th><th className="p-3.5">Nilai</th>{editable && <th className="p-3.5"></th>}</tr></thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-t border-stone-100">
                <td className="p-3.5 text-stone-400">{r.kode_mk || "-"}</td>
                <td className="p-3.5 font-semibold">{r.mata_kuliah}</td>
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
      {showForm && <AkademikForm onCancel={() => setShowForm(false)} onSubmit={saveRecord} />}
      {editingRecord && <AkademikForm initial={editingRecord} onCancel={() => setEditingRecord(null)} onSubmit={saveRecord} />}
    </div>
  );
}
function AkademikForm({ initial, onCancel, onSubmit }) {
  const [f, setF] = useState(initial || { tahun_ajaran: `${nowYear}/${nowYear + 1}`, semester: "Ganjil", mata_kuliah: MATA_KULIAH[0], sks: 2, status: "aktif", pengajar: "", kode_mk: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
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
        <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit">Simpan</Btn></div>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------------- */
/* Akademik santri — gabungan KRS + KHS                                    */
/* ---------------------------------------------------------------------- */
function AkademikSantriPage({ profile }) {
  const brand = useContext(BrandContext);
  const akT = useTable("akademik");
  const santriT = useTable("santri");
  const profilesT = useTable("profiles");
  const santri = santriT.rows.find((s) => s.nim === profile.nim);
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
          .krs-print, .krs-print * { visibility: visible; }
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
        <div style={{ textAlign: "center", fontSize: 11, borderBottom: "1px solid #B8935A", paddingBottom: 6, marginBottom: 16 }}>
          Semester {sem || "-"} {ta || ""}
        </div>

        <div style={{ fontSize: 11, marginBottom: 3, display: "flex" }}><span style={{ width: 130 }}>Nama Mahasantri</span><span>: {santri?.nama}</span></div>
        <div style={{ fontSize: 11, marginBottom: 3, display: "flex" }}><span style={{ width: 130 }}>NIM</span><span>: {santri?.nim}</span></div>
        <div style={{ fontSize: 11, marginBottom: 14, display: "flex" }}><span style={{ width: 130 }}>Angkatan</span><span>: {santri?.kelas}</span></div>

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
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5, marginBottom: 8 }}>
          <thead><tr style={{ background: "#0B3B36", color: "#fff" }}>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>No</th>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>Kode MK</th>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>Mata Kuliah</th>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>SKS</th>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>Nilai Angka</th>
            <th style={{ border: "1px solid #1F2937", padding: 5 }}>Nilai Huruf</th>
          </tr></thead>
          <tbody>
            {recordsSemester.map((r, i) => (
              <tr key={r.id}>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{i + 1}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{r.kode_mk || "-"}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5 }}>{r.mata_kuliah}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{r.sks}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{r.nilai_angka ?? "-"}</td>
                <td style={{ border: "1px solid #1F2937", padding: 5, textAlign: "center" }}>{r.nilai_angka != null ? nilaiHuruf(r.nilai_angka) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table style={{ width: "100%", fontSize: 10.5, marginBottom: 16 }}><tbody>
          <tr>
            <td>IP Semester ini: <b>{(() => {
              const sel = recordsSemester.filter((r) => r.status === "selesai");
              const tot = sel.reduce((a, r) => a + Number(r.sks || 0), 0);
              return tot ? (sel.reduce((a, r) => a + bobot(nilaiHuruf(r.nilai_angka)) * Number(r.sks || 0), 0) / tot).toFixed(2) : "-";
            })()}</b></td>
            <td style={{ textAlign: "right" }}>IPK Kumulatif: <b>{(() => {
              const sel = akT.rows.filter((r) => r.status === "selesai");
              const tot = sel.reduce((a, r) => a + Number(r.sks || 0), 0);
              return tot ? (sel.reduce((a, r) => a + bobot(nilaiHuruf(r.nilai_angka)) * Number(r.sks || 0), 0) / tot).toFixed(2) : "-";
            })()}</b></td>
          </tr>
        </tbody></table>
        </>
        )}

        <div style={{ fontSize: 10.5, marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>Menyetujui,<br/>Pembimbing</div>
            <div style={{ textAlign: "right" }}>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}<br/>Mahasantri ybs</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 42 }}>
            <div><b>{pembimbing?.nama || "-"}</b><br/>NIP. {pembimbing?.nip || "-"}</div>
            <div style={{ textAlign: "right" }}><b>{santri?.nama}</b><br/>NIM. {santri?.nim}</div>
          </div>

          <div style={{ textAlign: "center", marginTop: 26 }}>Mengetahui,</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
            <div>Plt. Mudir</div>
            <div style={{ textAlign: "right" }}>Kabag. Akademik</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 42 }}>
            <div><b>{brand.nama_mudir}</b><br/>NIP. {brand.nip_mudir || "-"}</div>
            <div style={{ textAlign: "right" }}><b>{brand.nama_kabag_akademik}</b><br/>NIP. {brand.nip_kabag_akademik || "-"}</div>
          </div>
        </div>
        <DokumenQR dokType={dokType} nim={santri?.nim} ta={ta} sem={sem} pondok={brand.nama_pondok} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total SKS Diambil" value={akT.rows.reduce((a, r) => a + Number(r.sks || 0), 0)} />
        <StatCard label="IPK Kumulatif" value={(() => {
          const selesai = akT.rows.filter((r) => r.status === "selesai");
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
            <thead><tr className="bg-stone-50 text-left text-[11px] uppercase tracking-wide text-stone-500"><th className="p-3.5">Mahasantri</th><th className="p-3.5">Juz Dikuasai</th><th className="p-3.5">Setoran Terakhir</th></tr></thead>
            <tbody>
              {pickable.map((s) => {
                const last = logT.rows.filter((l) => l.nim === s.nim).sort((a, b) => b.tanggal.localeCompare(a.tanggal))[0];
                return (
                  <tr key={s.nim} className="border-t border-stone-100 hover:bg-stone-50/60 cursor-pointer" onClick={() => setNim(s.nim)}>
                    <td className="p-3.5"><div className="flex items-center gap-3"><Avatar name={s.nama} size={30} /><div><div className="font-bold">{s.nama}</div><div className="text-[11px] text-stone-400">{s.nim}</div></div></div></td>
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
          {JENIS_SETORAN_QURAN.map((j) => (
            <StatCard key={j} label={j} value={logs.filter((l) => l.jenis === j).length} />
          ))}
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
              <thead><tr className="bg-stone-50 text-left text-[11px] uppercase text-stone-500"><th className="p-3 whitespace-nowrap">Tgl</th><th className="p-3 whitespace-nowrap">Jenis</th><th className="p-3 whitespace-nowrap">Juz &amp; Hal.</th><th className="p-3 whitespace-nowrap">Penilaian</th><th className="p-3 whitespace-nowrap">Catatan</th>{editable && isViewer && <th className="p-3 text-right whitespace-nowrap">Aksi</th>}</tr></thead>
              <tbody>{filteredLogs.map((l) => (
                <tr key={l.id} className="border-t border-stone-100 align-top">
                  <td className="p-3 whitespace-nowrap">{l.tanggal}</td>
                  <td className="p-3 whitespace-nowrap">{l.jenis}</td>
                  <td className="p-3 whitespace-nowrap">Juz {l.juz}{l.halaman_dari ? <div className="text-[11px] text-stone-400">hal. {l.halaman_dari}–{l.halaman_sampai}</div> : null}</td>
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
            <thead><tr className="bg-stone-50 text-left text-[11px] uppercase tracking-wide text-stone-500"><th className="p-3.5">Mahasantri</th><th className="p-3.5">Catatan Terakhir</th><th className="p-3.5">Status</th></tr></thead>
            <tbody>
              {withStatus.map(({ s, last, perhatian }) => (
                <tr key={s.nim} className="border-t border-stone-100 hover:bg-stone-50/60 cursor-pointer" onClick={() => setNim(s.nim)}>
                  <td className="p-3.5"><div className="flex items-center gap-3"><Avatar name={s.nama} size={30} /><div><div className="font-bold">{s.nama}</div><div className="text-[11px] text-stone-400">{s.nim}</div></div></div></td>
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
        const baik = bulanIniLogs.filter((l) => !CAPAIAN_NEGATIF.includes(l.capaian) && !CAPAIAN_NETRAL.includes(l.capaian)).length;
        const perluPerhatianBulanIni = bulanIniLogs.filter((l) => CAPAIAN_NEGATIF.includes(l.capaian)).length;
        return (
          <div className="grid grid-cols-3 gap-4 mb-5">
            <StatCard label="Catatan Bulan Ini" value={bulanIniLogs.length} />
            <StatCard label="Capaian Baik" value={baik} />
            <StatCard label="Perlu Perhatian" value={perluPerhatianBulanIni} />
          </div>
        );
      })()}
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-stone-50 text-left text-[11px] uppercase text-stone-500"><th className="p-3">Tanggal</th><th className="p-3">Jenis Ibadah</th><th className="p-3">Capaian</th><th className="p-3">Catatan</th>{editable && isViewer && <th className="p-3 text-right">Aksi</th>}</tr></thead>
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
      {showForm && <IbadahForm onCancel={() => setShowForm(false)} onSubmit={saveLog} />}
      {editingLog && <IbadahForm initial={editingLog} onCancel={() => setEditingLog(null)} onSubmit={saveLog} />}
    </div>
  );
}
function IbadahForm({ initial, onCancel, onSubmit }) {
  const [f, setF] = useState(initial || { tanggal: new Date().toISOString().slice(0, 10), jenis: JENIS_IBADAH[0], capaian: CAPAIAN_OPTIONS[JENIS_IBADAH[0]][0], catatan: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setJenis = (e) => setF({ ...f, jenis: e.target.value, capaian: CAPAIAN_OPTIONS[e.target.value][0] });
  return (
    <Modal title={initial ? "Edit Catatan Ibadah" : "Catat Ibadah"} onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
        <Field label="Tanggal"><Input type="date" value={f.tanggal} onChange={set("tanggal")} /></Field>
        <Field label="Jenis Ibadah"><Select value={f.jenis} onChange={setJenis}>{JENIS_IBADAH.map((j) => <option key={j}>{j}</option>)}</Select></Field>
        <Field label="Capaian"><Select value={f.capaian} onChange={set("capaian")}>{CAPAIAN_OPTIONS[f.jenis].map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Catatan"><textarea className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm" rows={3} value={f.catatan} onChange={set("catatan")} /></Field>
        <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit">Simpan</Btn></div>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------------- */
/* Catatan Pojok — catatan pribadi musyrif untuk santri, privat            */
/* ---------------------------------------------------------------------- */
function CatatanPojokPage({ profile }) {
  const isViewer = profile.role !== "santri";
  const canView = ["admin", "musyrif", "musyrifah", "pimpinan"].includes(profile.role);
  const santriT = useTable("santri");
  const catT = useTable("catatan_pojok");
  const [nim, setNim] = useState(isViewer ? "" : profile.nim);
  const [showForm, setShowForm] = useState(false);
  const santri = santriT.rows.find((s) => s.nim === nim);
  const catatan = catT.rows.filter((c) => c.nim === nim).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const pickable = canView ? santriT.rows : [];
  const canAddForThis = profile.role === "admin" || (["musyrif", "musyrifah"].includes(profile.role) && santri?.musyrif_username === profile.username);

  async function addCatatan(f) {
    const { error } = await supabase.from("catatan_pojok").insert({ ...f, nim, musyrif: profile.nama });
    if (error) alert(error.message); else { setShowForm(false); catT.reload(); }
  }
  async function removeCatatan(id) {
    if (!confirm("Hapus catatan ini?")) return;
    const { error } = await supabase.from("catatan_pojok").delete().eq("id", id);
    if (!error) catT.reload();
  }

  const [q, setQ] = useState("");

  if (isViewer && !nim) {
    const filtered = pickable.filter((s) => !q || s.nama.toLowerCase().includes(q.toLowerCase()) || s.nim.includes(q));
    return (
      <div>
        <PageHeader title="Catatan Pojok" sub="Catatan pribadi untuk mahasantri binaan — hanya terlihat oleh mahasantri/wali yang bersangkutan." />
        <div className="mb-4 max-w-xs"><Input placeholder="Cari nama atau NIM..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-stone-50 text-left text-[11px] uppercase tracking-wide text-stone-500"><th className="p-3.5">Mahasantri</th><th className="p-3.5">Jumlah Catatan</th></tr></thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.nim} className="border-t border-stone-100 hover:bg-stone-50/60 cursor-pointer" onClick={() => setNim(s.nim)}>
                  <td className="p-3.5"><div className="flex items-center gap-3"><Avatar name={s.nama} size={30} /><div><div className="font-bold">{s.nama}</div><div className="text-[11px] text-stone-400">{s.nim}</div></div></div></td>
                  <td className="p-3.5">{catT.rows.filter((c) => c.nim === s.nim).length} catatan</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={2}><Empty text="Tidak ada santri yang cocok." /></td></tr>}
            </tbody>
          </table>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {isViewer && <BackBar onBack={() => setNim("")} />}
      <PageHeader title={isViewer ? (santri?.nama || "Catatan Pojok") : "Catatan Pojok"} sub={!isViewer ? "Catatan pribadi dari musyrif — hanya Anda yang bisa melihat ini." : undefined}
        actions={canAddForThis && isViewer && <Btn onClick={() => setShowForm(true)}>+ Tambah Catatan</Btn>} />
      <div className="space-y-3">
        {catatan.map((c) => (
          <Card key={c.id}>
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs font-bold text-stone-500">{c.tanggal} · {c.musyrif}</div>
              {canAddForThis && isViewer && <button onClick={() => removeCatatan(c.id)} className="text-red-600 text-xs font-bold">Hapus</button>}
            </div>
            <div className="text-sm text-stone-700 whitespace-pre-line">{c.isi_catatan}</div>
          </Card>
        ))}
        {catatan.length === 0 && <Empty text="Belum ada catatan." />}
      </div>
      {showForm && <CatatanPojokForm onCancel={() => setShowForm(false)} onSubmit={addCatatan} />}
    </div>
  );
}
function CatatanPojokForm({ onCancel, onSubmit }) {
  const [f, setF] = useState({ tanggal: new Date().toISOString().slice(0, 10), isi_catatan: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title="Tambah Catatan Pojok" onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
        <Field label="Tanggal"><Input type="date" value={f.tanggal} onChange={set("tanggal")} /></Field>
        <Field label="Isi Catatan"><textarea className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm" rows={5} value={f.isi_catatan} onChange={set("isi_catatan")} placeholder="Tulis catatan pribadi untuk santri ini..." required /></Field>
        <div className="flex justify-end gap-2 mt-4"><Btn tone="ghost" onClick={onCancel}>Batal</Btn><Btn type="submit">Simpan</Btn></div>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------------- */
/* Tagihan SPP — overview semua santri + drill-down                        */
/* ---------------------------------------------------------------------- */
function SppPage({ profile }) {
  const editable = canEdit(profile.role, "spp");
  const isViewer = profile.role !== "santri";
  const santriT = useTable("santri");
  const sppT = useTable("spp");
  const [nim, setNim] = useState(isViewer ? "" : profile.nim);
  const [showForm, setShowForm] = useState(false);
  const santri = santriT.rows.find((s) => s.nim === nim);
  const rows = sppT.rows.filter((r) => r.nim === nim).sort((a, b) => b.tahun - a.tahun || BULAN.indexOf(b.bulan) - BULAN.indexOf(a.bulan));
  const bulanIni = BULAN[new Date().getMonth()];

  async function addRecord(f) {
    const { error } = await supabase.from("spp").insert({ ...f, nim, nominal: Number(f.nominal), tahun: Number(f.tahun) });
    if (error) alert(error.message); else { setShowForm(false); sppT.reload(); }
  }
  async function toggle(r) {
    const { error } = await supabase.from("spp").update({ status: r.status === "Lunas" ? "Belum Lunas" : "Lunas", tanggal_bayar: r.status === "Lunas" ? null : new Date().toISOString().slice(0, 10) }).eq("id", r.id);
    if (!error) sppT.reload();
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
        <PageHeader title="Tagihan SPP" sub={`Status pembayaran bulan ${bulanIni} — klik santri untuk kelola.`} />
        <div className="grid grid-cols-3 gap-4 mb-5">
          <StatCard label={`Lunas Bulan ${bulanIni}`} value={lunas} />
          <StatCard label="Belum Lunas" value={belumLunas} />
          <StatCard label="Total Tertunggak" value={formatRupiah(totalTertunggak)} />
        </div>
        <div className="mb-4 max-w-xs"><Input placeholder="Cari nama atau NIM..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-stone-50 text-left text-[11px] uppercase tracking-wide text-stone-500"><th className="p-3.5">Mahasantri</th><th className="p-3.5">Status Bulan Ini</th></tr></thead>
            <tbody>
              {withStatus.map(({ s, row }) => (
                <tr key={s.nim} className="border-t border-stone-100 hover:bg-stone-50/60 cursor-pointer" onClick={() => setNim(s.nim)}>
                  <td className="p-3.5"><div className="flex items-center gap-3"><Avatar name={s.nama} size={30} /><div><div className="font-bold">{s.nama}</div><div className="text-[11px] text-stone-400">{s.nim}</div></div></div></td>
                  <td className="p-3.5">{row ? <Badge tone={row.status === "Lunas" ? "green" : "red"}>{row.status}</Badge> : <Badge tone="grey">Belum ada tagihan</Badge>}</td>
                </tr>
              ))}
              {withStatus.length === 0 && <tr><td colSpan={2}><Empty text="Tidak ada santri yang cocok." /></td></tr>}
            </tbody>
          </table>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {isViewer && <BackBar onBack={() => setNim("")} />}
      <PageHeader title={isViewer ? (santri?.nama || "Tagihan SPP") : "Tagihan SPP"}
        actions={<div className="flex gap-2">{editable && isViewer && <Btn onClick={() => setShowForm(true)}>+ Tambah Tagihan</Btn>}{!isViewer && <Btn tone="gold" onClick={() => window.print()}>🖨 Unduh PDF</Btn>}</div>} />
      <div className="grid grid-cols-2 gap-4 mb-5 max-w-lg">
        <StatCard label="Total Tunggakan" value={formatRupiah(rows.filter((r) => r.status !== "Lunas").reduce((a, r) => a + Number(r.nominal || 0), 0))} />
        <StatCard label="Bulan Belum Lunas" value={rows.filter((r) => r.status !== "Lunas").length} />
      </div>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-stone-50 text-left text-[11px] uppercase text-stone-500"><th className="p-3">Bulan</th><th className="p-3">Tahun</th><th className="p-3">Nominal</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-stone-100">
                <td className="p-3">{r.bulan}</td><td className="p-3">{r.tahun}</td><td className="p-3">{formatRupiah(r.nominal)}</td>
                <td className="p-3">{editable ? <button onClick={() => toggle(r)}><Badge tone={r.status === "Lunas" ? "green" : "red"}>{r.status}</Badge></button> : <Badge tone={r.status === "Lunas" ? "green" : "red"}>{r.status}</Badge>}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4}><Empty text="Belum ada data." /></td></tr>}
          </tbody>
        </table>
      </Card>
      {showForm && <SppForm onCancel={() => setShowForm(false)} onSubmit={addRecord} />}
    </div>
  );
}
function SppForm({ onCancel, onSubmit }) {
  const [f, setF] = useState({ bulan: BULAN[new Date().getMonth()], tahun: nowYear, nominal: 500000, status: "Belum Lunas" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title="Tambah Tagihan SPP" onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
        <Field label="Bulan"><Select value={f.bulan} onChange={set("bulan")}>{BULAN.map((b) => <option key={b}>{b}</option>)}</Select></Field>
        <Field label="Tahun"><Input type="number" value={f.tahun} onChange={set("tahun")} /></Field>
        <Field label="Nominal"><Input type="number" value={f.nominal} onChange={set("nominal")} /></Field>
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
  const [msg, setMsg] = useState("");
  const profilesT = useTable("profiles");

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
          <thead><tr className="bg-stone-50 text-left text-[11px] uppercase tracking-wide text-stone-500"><th className="p-3.5">Akun</th><th className="p-3.5">Peran</th></tr></thead>
          <tbody>
            {profilesT.rows.map((p) => (
              <tr key={p.id} className="border-t border-stone-100">
                <td className="p-3.5"><div className="flex items-center gap-3"><Avatar name={p.nama} url={p.avatar_url} size={30} /><div><div className="font-bold">{p.nama}</div><div className="text-[11px] text-stone-400">{p.username || p.nim}</div></div></div></td>
                <td className="p-3.5"><Badge tone="grey">{ROLE_LABEL[p.role] || p.role}</Badge></td>
              </tr>
            ))}
            {profilesT.rows.length === 0 && <tr><td colSpan={2}><Empty text="Belum ada akun." /></td></tr>}
          </tbody>
        </table>
      </Card>
      {showForm && <AkunForm onCancel={() => setShowForm(false)} onSubmit={createAccount} />}
    </div>
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
function PengaturanPage({ profile, onProfileUpdated, brand, onBrandUpdated }) {
  const [nama, setNama] = useState(profile.nama);
  const [newPw, setNewPw] = useState("");
  const [uploading, setUploading] = useState(false);
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
              {brand.logo_dokumen_url ? <img src={brand.logo_dokumen_url} alt="logo dokumen" className="w-full h-full object-contain p-1" /> : <span className="text-[10px] text-stone-300 text-center px-2">Belum ada</span>}
            </div>
            <div>
              <Btn tone="ghost" onClick={() => logoDokumenRef.current?.click()} disabled={logoDokumenUploading}>{logoDokumenUploading ? "Mengunggah…" : "Ganti Logo untuk Dokumen (KRS/KHS)"}</Btn>
              <input ref={logoDokumenRef} type="file" accept="image/*" className="hidden" onChange={uploadLogoDokumen} />
              <p className="text-xs text-stone-400 mt-2">Pakai versi logo BERWARNA ASLI (bukan putih) — dipakai khusus di kop KRS/KHS yang latarnya putih. Tidak memengaruhi logo sidebar & login.</p>
            </div>
          </div>

          <div className="flex items-center gap-5 mb-5 pt-4 border-t border-[#EDD9A0]">
            <div className="w-24 h-16 rounded-lg bg-stone-800 border border-stone-200 flex items-center justify-center overflow-hidden">
              {brand.foto_latar_url ? <img src={brand.foto_latar_url} alt="wallpaper login" className="w-full h-full object-cover" /> : <span className="text-[10px] text-stone-400 text-center px-2">Belum ada — pakai gradasi warna</span>}
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

          <form onSubmit={saveBranding} className="max-w-md">
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

            <div className="text-[11px] font-extrabold text-[#B8935A] uppercase tracking-[0.1em] mt-6 mb-2 pt-4 border-t border-stone-100">Kop Surat & Tanda Tangan (untuk Cetak KRS)</div>
            <Field label="Nama Yayasan"><Input value={yayasanNama} onChange={(e) => setYayasanNama(e.target.value)} placeholder="cth. YAYASAN WAKAF HAMALATUL QURAN" /></Field>
            <Field label="Alamat Pondok"><textarea className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm" rows={2} value={alamatPondok} onChange={(e) => setAlamatPondok(e.target.value)} /></Field>
            <Field label="Kontak"><Input value={kontakPondok} onChange={(e) => setKontakPondok(e.target.value)} placeholder="cth. +62812-3456-7890" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nama Plt. Mudir"><Input value={namaMudir} onChange={(e) => setNamaMudir(e.target.value)} /></Field>
              <Field label="NIP Mudir"><Input value={nipMudir} onChange={(e) => setNipMudir(e.target.value)} /></Field>
            </div>
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
        </Card>
      )}
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
    if (view === "quran") return <QuranPage profile={profile} />;
    if (view === "ibadah") return <IbadahPage profile={profile} />;
    if (view === "catatan") return <CatatanPojokPage profile={profile} />;
    if (view === "spp") return <SppPage profile={profile} />;
    if (view === "akun" && profile.role === "admin") return <KelolaAkunPage />;
    if (view === "pengaturan") return <PengaturanPage profile={profile} onProfileUpdated={loadProfile} brand={brand} onBrandUpdated={reloadBrand} />;
    return null;
  }

  return (
    <BrandContext.Provider value={brand}>
      <Shell profile={profile} view={view} setView={setView} brand={brand}>{renderView()}</Shell>
    </BrandContext.Provider>
  );
}
