import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'pt'];
const defaultLocale = 'pt';

function getLocale(request: NextRequest) {
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) return defaultLocale;

  // Simple locale matching
  if (acceptLanguage.toLowerCase().includes('en')) return 'en';
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  // Check if there is any supported locale in the pathname
  const { pathname } = request.nextUrl;
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Redirect if there is no locale
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next) and public folder files
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
