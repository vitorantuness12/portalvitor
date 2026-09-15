import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { fulfillPayment } from "../_shared/fulfill-payment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreatePaymentRequest {
  referenceType: "student_card" | "course" | "track";
  referenceId: string;
  amount: number;
  paymentMethod: "pix" | "credit_card" | "debit_card";
  description: string;
  payerEmail: string;
  payerName: string;
  payerCpf?: string;
  couponCode?: string;
  // Card data (only for card payments)
  cardToken?: string;
  installments?: number;
  courseIds?: string[];
}


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

    // Get user from auth header
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

    const body: CreatePaymentRequest = await req.json();
    const { referenceType, referenceId, amount, paymentMethod, description, payerEmail, payerName, payerCpf, couponCode, cardToken, installments, courseIds } = body;

    // Validate required fields
    if (!referenceType || !referenceId || !paymentMethod || !description || !payerEmail || !payerName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---------------------------------------------------------------
    // Preço confiável: para curso e trilha o valor SEMPRE vem do banco,
    // nunca do cliente (evita manipulação do valor no navegador).
    // ---------------------------------------------------------------
    let baseAmount = Number(amount) || 0;
    let validatedCourses: Array<{ id: string; title: string; price: number; category_id: string | null }> = [];

    if (referenceType === "course") {
      const requestedIds = [...new Set([referenceId, ...(courseIds ?? [])])];
      if (requestedIds.length > 6 || requestedIds.some((courseId) => typeof courseId !== "string")) {
        return new Response(JSON.stringify({ error: "Seleção de cursos inválida" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("id, price, title, status, category_id")
        .in("id", requestedIds);
      if (coursesError || !courses || courses.length !== requestedIds.length || courses.some((course) => course.status !== "active")) {
        return new Response(JSON.stringify({ error: "Um ou mais cursos estão indisponíveis" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const primaryCourse = courses.find((course) => course.id === referenceId);
      if (!primaryCourse || courses.some((course) => course.category_id !== primaryCourse.category_id)) {
        return new Response(JSON.stringify({ error: "Os cursos adicionais devem ser da mesma categoria" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existingEnrollments, error: enrollmentError } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("user_id", userData.user.id)
        .in("course_id", requestedIds);
      if (enrollmentError) throw enrollmentError;
      const ownedIds = new Set((existingEnrollments ?? []).map((item) => item.course_id));
      if (ownedIds.has(referenceId)) {
        return new Response(JSON.stringify({ error: "Você já possui acesso ao curso principal" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      validatedCourses = courses
        .filter((course) => !ownedIds.has(course.id))
        .map((course) => ({ ...course, price: Number(course.price) || 0 }));
      baseAmount = validatedCourses.reduce((total, course) => total + course.price, 0);
    } else if (referenceType === "track") {
      const { data: track } = await supabase
        .from("learning_tracks")
        .select("price, title, is_active")
        .eq("id", referenceId)
        .maybeSingle();
      if (!track || !track.is_active) {
        return new Response(JSON.stringify({ error: "Trilha indisponível" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      baseAmount = Number(track.price) || 0;
    }

    // Aplica cupom (validação e cálculo feitos no banco)
    let discount = 0;
    let couponId: string | null = null;
    let couponCodeApplied: string | null = null;

    if (couponCode && couponCode.trim() && referenceType !== "student_card") {
      let couponAmount = baseAmount;
      let couponScopeId = referenceId;

      if (referenceType === "course" && validatedCourses.length > 1) {
        const { data: couponRecord } = await supabase
          .from("coupons")
          .select("scope, scope_id")
          .ilike("code", couponCode.trim())
          .maybeSingle();
        if (couponRecord?.scope === "course" && couponRecord.scope_id) {
          const eligibleCourse = validatedCourses.find((course) => course.id === couponRecord.scope_id);
          if (!eligibleCourse) {
            return new Response(JSON.stringify({ error: "Cupom não válido para os cursos selecionados" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          couponAmount = eligibleCourse.price;
          couponScopeId = eligibleCourse.id;
        }
      }

      const { data: couponResult, error: couponError } = await supabase.rpc("validate_coupon", {
        _code: couponCode.trim(),
        _amount: couponAmount,
        _scope: referenceType,
        _scope_id: couponScopeId,
      });

      if (couponError) {
        console.error("Coupon validation error:", couponError);
      } else if (couponResult?.valid) {
        discount = Number(couponResult.discount) || 0;
        couponId = couponResult.coupon_id;
        couponCodeApplied = couponResult.code;
      } else {
        return new Response(JSON.stringify({ error: couponResult?.error || "Cupom inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const finalAmount = Math.max(Math.round((baseAmount - discount) * 100) / 100, 0);

    if (finalAmount <= 0) {
      return new Response(
        JSON.stringify({ error: "Valor inválido para pagamento. Use a liberação gratuita." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Create local payment record first
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: userData.user.id,
        reference_type: referenceType,
        reference_id: referenceId,
        amount: finalAmount,
        payment_method: paymentMethod,
        status: "pending",
        metadata: {
          description,
          payer_email: payerEmail,
          payer_name: payerName,
          base_amount: baseAmount,
          discount,
          coupon_id: couponId,
          coupon_code: couponCodeApplied,
        },
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error creating payment record:", paymentError);
      throw new Error("Failed to create payment record");
    }

    if (referenceType === "course" && validatedCourses.length) {
      const { error: itemsError } = await supabase.from("payment_items").insert(
        validatedCourses.map((course) => ({
          payment_id: payment.id,
          course_id: course.id,
          unit_price: course.price,
          is_primary: course.id === referenceId,
        })),
      );
      if (itemsError) {
        await supabase.from("payments").delete().eq("id", payment.id);
        throw new Error("Failed to create payment items");
      }
    }

    // Build Mercado Pago payment request
    let mpPaymentData: Record<string, unknown> = {
      transaction_amount: finalAmount,

      description: referenceType === "course" && validatedCourses.length > 1
        ? `${validatedCourses.length} cursos Formak`
        : description,
      external_reference: payment.id,
      notification_url: `${SUPABASE_URL}/functions/v1/mercadopago-webhook`,
      payer: {
        email: payerEmail,
        first_name: payerName.split(" ")[0],
        last_name: payerName.split(" ").slice(1).join(" ") || payerName.split(" ")[0],
      },
    };

    if (payerCpf) {
      mpPaymentData.payer = {
        ...mpPaymentData.payer as object,
        identification: {
          type: "CPF",
          number: payerCpf.replace(/\D/g, ""),
        },
      };
    }

    // Configure payment method specific options
    if (paymentMethod === "pix") {
      mpPaymentData.payment_method_id = "pix";
    } else if (paymentMethod === "credit_card" || paymentMethod === "debit_card") {
      if (!cardToken) {
        return new Response(JSON.stringify({ error: "Card token is required for card payments" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      mpPaymentData.token = cardToken;
      mpPaymentData.installments = installments || 1;
      mpPaymentData.payment_method_id = paymentMethod === "debit_card" ? "debit_card" : undefined;
    }

    console.log("Creating payment in Mercado Pago:", JSON.stringify(mpPaymentData, null, 2));

    // Call Mercado Pago API
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": payment.id,
      },
      body: JSON.stringify(mpPaymentData),
    });

    const mpResult = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Mercado Pago API error:", mpResult);
      
      // Update local payment with error
      await supabase
        .from("payments")
        .update({
          status: "rejected",
          mercado_pago_status: "error",
          metadata: { ...payment.metadata, error: mpResult },
        })
        .eq("id", payment.id);

      return new Response(JSON.stringify({ error: "Payment creation failed", details: mpResult }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Mercado Pago response:", JSON.stringify(mpResult, null, 2));

    // Update local payment with Mercado Pago data
    const updateData: Record<string, unknown> = {
      mercado_pago_id: mpResult.id.toString(),
      mercado_pago_status: mpResult.status,
    };

    // Handle PIX specific data
    if (paymentMethod === "pix" && mpResult.point_of_interaction?.transaction_data) {
      const pixData = mpResult.point_of_interaction.transaction_data;
      updateData.pix_qr_code = pixData.qr_code;
      updateData.pix_qr_code_base64 = pixData.qr_code_base64;
      updateData.pix_expiration = mpResult.date_of_expiration;
    }

    // Handle card specific data
    if ((paymentMethod === "credit_card" || paymentMethod === "debit_card") && mpResult.card) {
      updateData.card_last_four = mpResult.card.last_four_digits;
      updateData.card_brand = mpResult.card.payment_method?.name || mpResult.payment_method_id;
    }

    // Update status based on MP status
    if (mpResult.status === "approved") {
      updateData.status = "approved";
      updateData.paid_at = new Date().toISOString();
    } else if (mpResult.status === "rejected") {
      updateData.status = "rejected";
    }

    await supabase
      .from("payments")
      .update(updateData)
      .eq("id", payment.id);

    if (mpResult.status === "approved") {
      await fulfillPayment(supabase, {
        id: payment.id,
        user_id: userData.user.id,
        reference_type: referenceType,
        reference_id: referenceId,
      });
    }

    // Return response
    return new Response(
      JSON.stringify({
        success: true,
        paymentId: payment.id,
        mercadoPagoId: mpResult.id,
        status: mpResult.status,
        statusDetail: mpResult.status_detail,
        // PIX specific
        pixQrCode: updateData.pix_qr_code,
        pixQrCodeBase64: updateData.pix_qr_code_base64,
        pixExpiration: updateData.pix_expiration,
        // Card specific
        cardLastFour: updateData.card_last_four,
        cardBrand: updateData.card_brand,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in create-payment:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
