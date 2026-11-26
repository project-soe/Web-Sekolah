import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function redirectTo(requestUrl: URL, path: string) {
  return NextResponse.redirect(new URL(path, requestUrl.origin));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  if (!code) return redirectTo(requestUrl, "/portal/daftar?error=konfirmasi");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    console.error("[auth:portal] Email confirmation exchange failed:", error?.code ?? "missing_user");
    return redirectTo(requestUrl, "/portal/daftar?error=konfirmasi");
  }

  const metadata = data.user.user_metadata ?? {};
  const teacherInvitationToken = metadata.teacher_invitation_token;
  if (typeof teacherInvitationToken === "string" && /^[0-9a-f]{64}$/.test(teacherInvitationToken)) {
    const { error: teacherClaimError } = await supabase.rpc("claim_teacher_account_invitation", {
      p_token: teacherInvitationToken,
    });
    if (teacherClaimError) {
      console.error("[auth:teacher] Invitation claim after confirmation failed:", teacherClaimError.code);
      await supabase.auth.signOut();
      return redirectTo(requestUrl, "/login?error=undangan-guru");
    }
    await supabase.auth.updateUser({ data: { teacher_invitation_token: null } });
    return redirectTo(requestUrl, "/ruang-guru");
  }

  const invitationToken = metadata.portal_invitation_token;
  if (typeof invitationToken === "string" && invitationToken.length > 0) {
    const { error: claimError } = await supabase.rpc("claim_student_portal_invitation", { p_token: invitationToken });
    if (claimError) {
      console.error("[auth:portal] Invitation claim after confirmation failed:", { code: claimError.code, message: claimError.message });
      return redirectTo(requestUrl, "/portal/daftar?error=konfirmasi");
    }
    await supabase.auth.updateUser({ data: { portal_invitation_token: null } });
    return redirectTo(requestUrl, "/portal");
  }

  if (metadata.portal_registration === "student") {
    const { error: requestError } = await supabase.rpc("submit_student_portal_registration", {
      p_full_name: metadata.portal_registration_full_name,
      p_nis: metadata.portal_registration_nis,
      p_birth_date: metadata.portal_registration_birth_date,
    });
    if (requestError && requestError.code !== "23505") {
      // Keep the confirmed session and metadata so the applicant can retry safely.
      console.error("[auth:portal] Registration submission after confirmation failed:", {
        code: requestError.code,
        message: requestError.message,
        details: requestError.details,
        hint: requestError.hint,
      });
      return redirectTo(requestUrl, "/portal/daftar?error=lanjutkan");
    }
    if (requestError?.code === "23505") {
      const { data: existingRequest, error: lookupError } = await supabase
        .from("student_portal_registration_requests")
        .select("id")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (lookupError || !existingRequest) {
        console.error("[auth:portal] Duplicate registration was not confirmed as an existing request:", lookupError?.code ?? "not_found");
        return redirectTo(requestUrl, "/portal/daftar?error=lanjutkan");
      }
    }
    await supabase.auth.updateUser({
      data: {
        portal_registration: null,
        portal_registration_full_name: null,
        portal_registration_nis: null,
        portal_registration_birth_date: null,
      },
    });
    await supabase.auth.signOut();
    return redirectTo(requestUrl, "/portal/menunggu");
  }

  await supabase.auth.signOut();
  return redirectTo(requestUrl, "/login");
}
