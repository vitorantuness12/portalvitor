ALTER FUNCTION public.generate_referral_code() SET search_path = public;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.user_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.issue_track_certificate(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.validate_coupon(text, numeric, text, uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.user_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.issue_track_certificate(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric, text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.set_referral_code() TO service_role;