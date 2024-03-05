import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  // A list of all locales that are supported
  locales: ["en", "fi", "se", "ee"],

  // Used when no locale matches
  defaultLocale: "fi",
});

export const config = {
  // Match only internationalized pathnames
  // matcher: ["/", "/(fi|en|se)/:path*"],
  matcher: ["/((?!api|static|.*\\..*|_next|favicon.ico|robots.txt).*)"],
};
