import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    });
    return Response.json({ app: "ok", supabase: res.ok ? "ok" : "error", status: res.status });
  } catch {
    return Response.json({ app: "ok", supabase: "unreachable" }, { status: 503 });
  }
}
