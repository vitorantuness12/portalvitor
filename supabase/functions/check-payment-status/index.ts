import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { paymentId } = await req.json();

    if (!paymentId) {
      return new Response(JSON.stringify({ error: "Payment ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get local payment
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .eq("user_id", userData.user.id)
      .single();

    if (paymentError || !payment) {
      return new Response(JSON.stringify({ error: "Payment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If payment is already approved/rejected, just return current status
    if (payment.status === "approved" || payment.status === "rejected") {
      return new Response(
        JSON.stringify({
          paymentId: payment.id,
          status: payment.status,
          mercadoPagoStatus: payment.mercado_pago_status,
          paidAt: payment.paid_at,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check status in Mercado Pago
    if (payment.mercado_pago_id) {
      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${payment.mercado_pago_id}`,
        {
          headers: {
            "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          },
        }
      );

      if (mpResponse.ok) {
        const mpPayment = await mpResponse.json();

        // Update local payment if status changed
        if (mpPayment.status !== payment.mercado_pago_status) {
          let newStatus = payment.status;
          const updateData: Record<string, unknown> = {
            mercado_pago_status: mpPayment.status,
          };

          if (mpPayment.status === "approved") {
            newStatus = "approved";
            updateData.status = "approved";
            updateData.paid_at = new Date().toISOString();

            // Update reference if needed
            if (payment.reference_type === "student_card") {
              const expiresAt = new Date();
              expiresAt.setFullYear(expiresAt.getFullYear() + 1);

              await supabase
                .from("student_cards")
                .update({
                  status: "active",
                  paid_at: new Date().toISOString(),
                  issued_at: new Date().toISOString(),
                  expires_at: expiresAt.toISOString(),
                })
                .eq("id", payment.reference_id);
            }
          } else if (mpPayment.status === "rejected") {
            newStatus = "rejected";
            updateData.status = "rejected";
          }

          await supabase.from("payments").update(updateData).eq("id", payment.id);

          return new Response(
            JSON.stringify({
              paymentId: payment.id,
              status: newStatus,
              mercadoPagoStatus: mpPayment.status,
              paidAt: updateData.paid_at || null,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        paymentId: payment.id,
        status: payment.status,
        mercadoPagoStatus: payment.mercado_pago_status,
        paidAt: payment.paid_at,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error checking payment status:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
