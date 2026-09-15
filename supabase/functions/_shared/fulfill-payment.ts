import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

interface PaymentRecord {
  id: string;
  user_id: string;
  reference_type: string;
  reference_id: string;
}

export async function fulfillPayment(
  supabase: SupabaseClient,
  payment: PaymentRecord,
): Promise<void> {
  if (payment.reference_type === "student_card") {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    const { error } = await supabase.from("student_cards").update({
      status: "active",
      paid_at: new Date().toISOString(),
      issued_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    }).eq("id", payment.reference_id);
    if (error) throw error;
    return;
  }

  let courseIds: string[] = [];

  if (payment.reference_type === "course") {
    const { data: items, error } = await supabase
      .from("payment_items")
      .select("course_id")
      .eq("payment_id", payment.id);
    if (error) throw error;
    courseIds = items?.length
      ? items.map((item: { course_id: string }) => item.course_id)
      : [payment.reference_id];
  }

  if (payment.reference_type === "track") {
    const { error: trackError } = await supabase.from("track_enrollments").upsert(
      { user_id: payment.user_id, track_id: payment.reference_id },
      { onConflict: "user_id,track_id", ignoreDuplicates: true },
    );
    if (trackError) throw trackError;

    const { data: trackCourses, error } = await supabase
      .from("track_courses")
      .select("course_id")
      .eq("track_id", payment.reference_id);
    if (error) throw error;
    courseIds = (trackCourses ?? []).map((item: { course_id: string }) => item.course_id);
  }

  if (!courseIds.length) return;

  const enrollments = [...new Set(courseIds)].map((courseId) => ({
    user_id: payment.user_id,
    course_id: courseId,
    status: "in_progress",
    progress: 0,
  }));

  const { error } = await supabase
    .from("enrollments")
    .upsert(enrollments, { onConflict: "user_id,course_id", ignoreDuplicates: true });
  if (error) throw error;
}