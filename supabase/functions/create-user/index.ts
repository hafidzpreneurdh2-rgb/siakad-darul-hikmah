// Edge Function: create-user
// Dipanggil oleh Admin dari aplikasi untuk membuat akun baru (santri atau staf).
// Kunci rahasia (service role key) hanya hidup di server ini, TIDAK PERNAH
// dikirim ke browser — inilah yang membuat pembuatan akun aman.
//
// Deploy dengan: supabase functions deploy create-user

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";

    // Klien biasa: dipakai untuk memverifikasi SIAPA yang memanggil (harus admin)
    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) return json({ error: "Tidak terautentikasi." }, 401);

    const { data: callerProfile } = await callerClient
      .from("profiles").select("role").eq("id", user.id).single();
    if (callerProfile?.role !== "admin") {
      return json({ error: "Hanya admin yang boleh membuat akun baru." }, 403);
    }

    const body = await req.json();
    const { username, password, nama, role, nim } = body;
    if (!username || !password || !nama || !role) {
      return json({ error: "Data tidak lengkap." }, 400);
    }
    if (password.length < 6) {
      return json({ error: "Kata sandi minimal 6 karakter." }, 400);
    }

    // Klien admin: pakai service role key, HANYA ada di server ini
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const email = `${username}@santri.internal`;
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (createErr) return json({ error: createErr.message }, 400);

    const { error: profileErr } = await adminClient.from("profiles").insert({
      id: created.user.id, username, email, role, nama, nim: role === "santri" ? nim ?? username : null,
    });
    if (profileErr) {
      // rollback: hapus auth user kalau insert profil gagal
      await adminClient.auth.admin.deleteUser(created.user.id);
      return json({ error: profileErr.message }, 400);
    }

    return json({ success: true, id: created.user.id }, 200);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
