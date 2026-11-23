import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

// Pemeriksaan awal saja. Otorisasi final tetap dilakukan oleh requireAdmin/requirePermission dan RLS.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll(list) {
            list.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      },
    );

    const { data, error } = await supabase.auth.getClaims();
    if (error) {
      console.error("[auth:proxy] Session verification failed:", error.message);
    }
    if (!data?.claims && request.nextUrl.pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } catch (error) {
    // Jangan biarkan kegagalan sementara pemeriksaan sesi menjatuhkan seluruh Worker.
    console.error(
      "[auth:proxy] Unexpected error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    if (request.nextUrl.pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}

export const config = { matcher: ["/admin/:path*", "/login"] };
