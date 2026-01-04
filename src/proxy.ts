import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";
import { i18n } from '@/i18n/config';

function getLocale(request: NextRequest): string {
  // Check if there is any supported locale in the pathname
  const pathname = request.nextUrl.pathname;
  const pathnameIsMissingLocale = i18n.locales.every(
    locale => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // If no locale in pathname, redirect to default
  if (pathnameIsMissingLocale) {
    return i18n.defaultLocale;
  }

  // Extract locale from pathname
  const locale = pathname.split('/')[1];
  return i18n.locales.includes(locale as any) ? locale : i18n.defaultLocale;
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Handle locale routing first
    const pathnameIsMissingLocale = i18n.locales.every(
      locale => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
    );

    if (pathnameIsMissingLocale && !pathname.startsWith('/api/')) {
      return NextResponse.redirect(
        new URL(`/${i18n.defaultLocale}${pathname}`, req.url)
      );
    }

    // Extract current locale
    const currentLocale = getLocale(req);
    
    // Check admin access
    const isAdminPage = pathname.includes("/admin");
    if (isAdminPage && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow API routes and auth pages
        if (req.nextUrl.pathname.startsWith('/api/') || 
            req.nextUrl.pathname.includes('/auth/') ||
            req.nextUrl.pathname.includes('/login')) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|api/auth|favicon.ico).*)',
    // Include dashboard and admin paths with locale
    '/(ar|en)/dashboard/:path*',
    '/(ar|en)/admin/:path*',
  ],
};