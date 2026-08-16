import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value, options }) => {
              request.cookies.set(
                name,
                value
              );
            }
          );

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  /*
   * LOGIN PAGE
   * Login page ko authentication se free rakhenge.
   */
  if (pathname === "/login") {
    if (user) {
      return NextResponse.redirect(
        new URL("/", request.url)
      );
    }

    return response;
  }

  /*
   * PUBLIC NEXT.JS FILES
   */
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return response;
  }

  /*
   * WITHOUT LOGIN
   * Kisi bhi software page ko access nahi kar sakenge.
   */
  if (!user) {
    const loginUrl = new URL(
      "/login",
      request.url
    );

    loginUrl.searchParams.set(
      "redirect",
      pathname
    );

    return NextResponse.redirect(
      loginUrl
    );
  }

  /*
   * LOGGED-IN USER
   */
  return response;
}

export const config = {
  matcher: [
    /*
     * Root aur application ke
     * saare pages protect honge.
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
