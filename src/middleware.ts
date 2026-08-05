import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

// El build standalone corre con trustHostHeader=false (default fuera de
// Vercel), así que request.nextUrl.clone() arma la URL con el host/puerto
// interno del proceso Node (ej. localhost:3000) en vez del dominio público.
// Construimos la URL a mano a partir de los headers que sí llegan bien
// (Nginx los reenvía: ver infra/nginx.conf.tmpl).
function urlPublica(request: NextRequest, pathname: string): URL {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  return new URL(pathname, `${proto}://${host}`);
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!user && pathname !== "/login") {
    return NextResponse.redirect(urlPublica(request, "/login"));
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(urlPublica(request, "/dashboard"));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo-rm.png).*)"],
};
