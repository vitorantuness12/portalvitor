import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getEvolutionConfig() {
  const url = Deno.env.get("EVOLUTION_API_URL");
  const key = Deno.env.get("EVOLUTION_API_KEY");
  const instance = Deno.env.get("EVOLUTION_INSTANCE_NAME");
  if (!url || !key || !instance) {
    throw new Error("Credenciais da Evolution API não configuradas");
  }
  return { baseUrl: url.replace(/\/$/, ""), apiKey: key, instance };
}

/**
 * Traduz erros de rede/TLS em mensagens acionáveis.
 */
function describeNetworkError(error: unknown, baseUrl: string): string {
  const msg = String(error);

  if (msg.includes("NotValidForName") || msg.includes("peer certificate") || msg.includes("TLS")) {
    return `Erro de TLS/SSL na Evolution API (${baseUrl}). Verifique se o certificado HTTPS é válido ou se a URL está correta.`;
  }
  if (msg.includes("dns error") || msg.includes("failed to lookup")) {
    return `Endereço da Evolution API (${baseUrl}) não encontrado. Verifique o host informado.`;
  }
  if (msg.includes("ConnectionRefused") || msg.includes("error sending request")) {
    return `Servidor da Evolution API (${baseUrl}) recusou a conexão ou está offline.`;
  }
  return `Erro de rede ao conectar na Evolution API: ${msg}`;
}

async function safeFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    let origin = url;
    try { origin = new URL(url).origin; } catch { /* ignore */ }
    throw new Error(describeNetworkError(error, origin));
  }
}

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Não autorizado");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  // Usando getUser para validar token de forma padrão e segura
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) throw new Error("Token inválido ou expirado");

  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Acesso restrito a administradores");

  return { supabase, userId: user.id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await verifyAdmin(req);
    const { action, ...params } = await req.json();
    const { baseUrl, apiKey, instance } = getEvolutionConfig();

    const headers = { apikey: apiKey, "Content-Type": "application/json" };
    let result: any;

    switch (action) {
      case "status":
        const statusRes = await safeFetch(`${baseUrl}/instance/connectionState/${instance}`, { headers });
        result = statusRes.ok ? await statusRes.json() : { error: await statusRes.text() };
        break;
      case "qrcode":
        const qrRes = await safeFetch(`${baseUrl}/instance/connect/${instance}`, { headers });
        result = qrRes.ok ? await qrRes.json() : { error: await qrRes.text() };
        break;
      case "restart":
        await safeFetch(`${baseUrl}/instance/logout/${instance}`, { method: "DELETE", headers }).catch(() => {});
        await new Promise(r => setTimeout(r, 1000));
        const connectRes = await safeFetch(`${baseUrl}/instance/connect/${instance}`, { headers });
        result = connectRes.ok ? await connectRes.json() : { error: await connectRes.text() };
        break;
      case "logout":
        const logoutRes = await safeFetch(`${baseUrl}/instance/logout/${instance}`, { method: "DELETE", headers });
        result = logoutRes.ok ? await logoutRes.json() : { error: await logoutRes.text() };
        break;
      case "send-text":
        const { number, message } = params;
        if (!number || !message) throw new Error("Parâmetros ausentes");
        let cleanNumber = number.replace(/\D/g, "");
        if (!cleanNumber.startsWith("55")) cleanNumber = "55" + cleanNumber;
        const sendRes = await safeFetch(`${baseUrl}/message/sendText/${instance}`, {
          method: "POST",
          headers,
          body: JSON.stringify({ number: cleanNumber, text: message }),
        });
        result = sendRes.ok ? await sendRes.json() : { error: await sendRes.text() };
        break;
      default:
        throw new Error(`Ação '${action}' não reconhecida`);
    }

    return new Response(JSON.stringify({ success: !result.error, data: result.error ? null : result, error: result.error }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Evolution API Error:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: error.message.includes("autorizado") ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
