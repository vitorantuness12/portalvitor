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

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Não autorizado");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error } = await supabase.auth.getClaims(token);
  if (error || !claims?.claims) throw new Error("Token inválido");

  const userId = claims.claims.sub as string;
  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Acesso restrito a administradores");

  return { supabase, userId };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await verifyAdmin(req);

    const { action, ...params } = await req.json();
    const { baseUrl, apiKey, instance } = getEvolutionConfig();

    const headers = {
      apikey: apiKey,
      "Content-Type": "application/json",
    };

    let result: unknown;

    switch (action) {
      case "status": {
        // Get connection status
        const res = await fetch(
          `${baseUrl}/instance/connectionState/${instance}`,
          { headers }
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erro ao verificar status: ${res.status} - ${text}`);
        }
        result = await res.json();
        break;
      }

      case "qrcode": {
        // Get QR code for connection
        const res = await fetch(
          `${baseUrl}/instance/connect/${instance}`,
          { headers }
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erro ao gerar QR code: ${res.status} - ${text}`);
        }
        result = await res.json();
        break;
      }

      case "restart": {
        // Restart instance - try DELETE+reconnect approach
        const logoutRes = await fetch(
          `${baseUrl}/instance/logout/${instance}`,
          { method: "DELETE", headers }
        );
        // Ignore logout errors, then reconnect
        if (logoutRes.ok) await logoutRes.json(); else await logoutRes.text();
        
        // Small delay before reconnecting
        await new Promise(r => setTimeout(r, 1000));
        
        const res = await fetch(
          `${baseUrl}/instance/connect/${instance}`,
          { headers }
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erro ao reiniciar: ${res.status} - ${text}`);
        }
        result = await res.json();
        break;
      }

      case "logout": {
        // Disconnect / logout
        const res = await fetch(
          `${baseUrl}/instance/logout/${instance}`,
          { method: "DELETE", headers }
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erro ao desconectar: ${res.status} - ${text}`);
        }
        result = await res.json();
        break;
      }

      case "send-text": {
        const { number, message } = params;
        if (!number || !message) throw new Error("Número e mensagem obrigatórios");

        const cleanNumber = number.replace(/\D/g, "");
        const res = await fetch(
          `${baseUrl}/message/sendText/${instance}`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ number: cleanNumber, text: message }),
          }
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erro ao enviar: ${res.status} - ${text}`);
        }
        result = await res.json();
        break;
      }

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Evolution API error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        status: error instanceof Error && error.message.includes("autorizado") ? 401 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
