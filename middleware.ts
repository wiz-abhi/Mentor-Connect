import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAuth } from "./lib/auth"

export async function middleware(req: NextRequest) {
  try {
    // Create a response object
    const res = NextResponse.next()

    // Verify authentication
    const payload = await verifyAuth(req)
    const isAuthenticated = !!payload

    // Debug information
    console.log(`Middleware checking path: ${req.nextUrl.pathname}, authenticated: ${isAuthenticated}`)

    // If accessing protected routes without authentication, redirect to login
    if (!isAuthenticated && req.nextUrl.pathname.startsWith("/dashboard")) {
      console.log("Not authenticated, redirecting to login")
      const redirectUrl = new URL("/login", req.url)
      return NextResponse.redirect(redirectUrl)
    }

    // If authenticated and trying to access login/register, redirect to dashboard
    if (isAuthenticated && (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/register")) {
      console.log("Already authenticated, redirecting to dashboard")
      const redirectUrl = new URL("/dashboard", req.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Return the response
    return res
  } catch (error) {
    console.error("Middleware error:", error)

    // If there's an error in the middleware, allow the request to continue
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/protected/:path*", "/login", "/register"],
}

