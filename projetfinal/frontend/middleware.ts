import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  // Pages publiques (tu peux en ajouter)
  const publicRoutes = ["/sign-in", "/sign-up"];

  // Si route publique, on laisse passer
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Si pas connecté → redirect
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Quelles routes sont concernées
export const config = {
  matcher: [
    "/((?!_next|favicon.ico|sign-in|sign-up|icons|images|public).*)",
  ],
};