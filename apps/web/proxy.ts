import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Chequeo optimista: sin cookie de sesión, /admin redirige al login.
// La protección real está en el API (JwtAuthGuard): sin sesión válida no devuelve datos.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";
  const hasSession = request.cookies.has("admin_token");

  if (!isLogin && !hasSession) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
