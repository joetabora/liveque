import { auth } from "@/lib/auth/authjs";
import { canSkipQueueAuth } from "@/lib/auth/queue-access";
import { LEGACY_TENANT_SLUG } from "@/lib/constants";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
  "/",
  "/login",
  "/signup",
  "/verify-email",
  "/reset-password",
  "/forgot-password",
  "/api/auth",
  "/api/tenants",
  "/api/stripe/webhook",
];

function isPublicPath(pathname: string) {
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return true;
  }
  if (pathname.includes("/display/")) return true;
  if (pathname === "/display") return true;
  if (pathname.endsWith("/media-check")) return true;
  if (pathname.endsWith("/checkin")) return true;
  return false;
}

function isProtectedAdminPath(pathname: string) {
  if (pathname === "/admin") return true;
  if (pathname.endsWith("/admin")) return true;
  if (pathname.includes("/settings")) return true;
  if (pathname.includes("/analytics")) return true;
  if (pathname.startsWith("/platform")) return true;
  if (pathname.startsWith("/onboarding")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    isPublicPath(pathname) &&
    !isProtectedAdminPath(pathname) &&
    !pathname.startsWith("/platform")
  ) {
    return NextResponse.next();
  }

  if (
    canSkipQueueAuth(LEGACY_TENANT_SLUG) &&
    (pathname === "/admin" || pathname === `/${LEGACY_TENANT_SLUG}/admin`)
  ) {
    return NextResponse.next();
  }

  if (isProtectedAdminPath(pathname)) {
    const session = await auth();
    if (!session?.user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
