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
  const invitationToken = metadata.portal_invitation_token;
  if (typeof invitationToken === "string" && invitationToken.length > 0) {
    const { error: claimError } = await supabase.rpc("claim_student_portal_invitation", {
      p_token: invitationToken,
    });
    if (claimError) {
      console.error("[auth:portal] Invitation claim after confirmation failed:", claimError.code);
      await supabase.auth.signOut();
      return redirectTo(requestUrl, "/portal/daftar?error=konfirmasi");
    }
    await supabase.auth.updateUser({
      data: { portal_invitation_token: null },
    });
    return redirectTo(requestUrl, "/portal");
  }

  if (metadata.portal_registration === "student") {
    const { error: requestError } = await supabase.rpc("submit_student_portal_registration", {
      p_full_name: metadata.portal_registration_full_name,
      p_nis: metadata.portal_registration_nis,
      p_birth_date: metadata.portal_registration_birth_date,
    });
    if (requestError && requestError.code !== "23505") {
      console.error("[auth:portal] Registration submission after confirmation failed:", requestError.code);
      await supabase.auth.signOut();
      return redirectTo(requestUrl, "/portal/daftar?error=konfirmasi");
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
