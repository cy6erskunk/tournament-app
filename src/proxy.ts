import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { locales, defaultLocale } from "./i18n/request";

const handleI18nRouting = createMiddleware({
  // A list of all locales that are supported
  locales: locales,

  // Used when no locale matches
  defaultLocale: defaultLocale,
});

export default function proxy(request: NextRequest) {
  return handleI18nRouting(request);
}

export const config = {
  // Match only internationalized pathnames
  // matcher: ["/", "/(fi|en|se)/:path*"],
  matcher: ["/((?!api|static|.*\\..*|_next|favicon.ico|robots.txt).*)"],
};
