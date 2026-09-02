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
 * Traduz erros de rede/TLS (comuns quando o host da Evolution API tem
 * certificado inválido ou está fora do ar) em mensagens acionáveis.
 */
function describeNetworkError(error: unknown, baseUrl: string): string {
  const msg = error instanceof Error ? error.message : String(error);

  if (msg.includes("NotValidForName") || msg.includes("invalid peer certificate")) {
    return `O certificado SSL do servidor da Evolution API (${baseUrl}) não é válido para esse domínio. Atualize o secret EVOLUTION_API_URL para o domínio oficial do servidor (com HTTPS válido) ou corrija o certificado no servidor.`;
  }
  if (msg.includes("dns error") || msg.includes("failed to lookup")) {
    return `Não foi possível resolver o endereço da Evolution API (${baseUrl}). Verifique o secret EVOLUTION_API_URL.`;
  }
  if (msg.includes("error sending request") || msg.includes("ConnectionRefused")) {
    return `Não foi possível conectar ao servidor da Evolution API (${baseUrl}). Verifique se ele está online.`;
  }
  return msg;
}

function getErrorStatus(error: unknown): number {
  if (!(error instanceof Error)) return 500;
  if (error.message.includes("Não autorizado") || error.message.includes("Token inválido")) return 401;
  if (error.message.includes("Acesso restrito")) return 403;
  if (
    error.message.includes("certificado SSL") ||
    error.message.includes("Não foi possível resolver") ||
    error.message.includes("Não foi possível conectar")
  ) return 502;
  return 500;
}

/** fetch com tradução de erros de conexão/TLS */
async function safeFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    let origin = url;
    try {
      origin = new URL(url).origin;
    } catch {
      // mantém a url original se não for parseável
    }
    throw new Error(describeNetworkError(error, origin));
  }
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
        const res = await safeFetch(
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
        const res = await safeFetch(
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
        const logoutRes = await safeFetch(
          `${baseUrl}/instance/logout/${instance}`,
          { method: "DELETE", headers }
        );
        // Ignore logout errors, then reconnect
        if (logoutRes.ok) await logoutRes.json(); else await logoutRes.text();
        
        // Small delay before reconnecting
        await new Promise(r => setTimeout(r, 1000));
        
        const res = await safeFetch(
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
        const res = await safeFetch(
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

        let cleanNumber = number.replace(/\D/g, "");
        // Auto-prefix Brazil country code if missing
        if (!cleanNumber.startsWith("55")) {
          cleanNumber = "55" + cleanNumber;
        }
        const res = await safeFetch(
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
    const errorStatus = getErrorStatus(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        upstreamStatus: errorStatus === 502 ? errorStatus : undefined,
      }),
      {
        // Falhas operacionais do provedor são exibidas no painel sem derrubar
        // a aplicação como uma falha interna da Edge Function.
        status: errorStatus === 502 ? 200 : errorStatus,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
