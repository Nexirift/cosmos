import { betterFetch } from "@better-fetch/fetch";
import type { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { env } from "./env";

const corsOptions: {
  allowedMethods: string[];
  allowedOrigins: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge?: number;
  credentials: boolean;
} = {
  allowedMethods: (env.CORS_ALLOWED_METHODS || "").split(","),
  allowedOrigins: (env.CORS_ALLOWED_ORIGINS || "").split(","),
  allowedHeaders: (env.CORS_ALLOWED_HEADERS || "").split(","),
  exposedHeaders: (env.CORS_EXPOSED_HEADERS || "").split(","),
  maxAge: (process.env?.MAX_AGE && parseInt(process.env?.MAX_AGE)) || undefined, // 60 * 60 * 24 * 30, // 30 days
  credentials: env.CORS_ALLOWED_CREDENTIALS,
};

type Session = typeof auth.$Infer.Session;

export async function middleware(request: NextRequest, response: NextResponse) {
  let headers: Headers = new Headers();

  // Add current path header
  headers.set("x-current-path", request.nextUrl.pathname);

  // Apply CORS headers to all API endpoints
  if (request.nextUrl.pathname.startsWith("/api")) {
    const origin = request.headers.get("origin") ?? "";
    if (
      corsOptions.allowedOrigins.includes("*") ||
      corsOptions.allowedOrigins.includes(origin)
    ) {
      headers.set("Access-Control-Allow-Origin", origin);
    }
    headers.set(
      "Access-Control-Allow-Credentials",
      corsOptions.credentials.toString(),
    );
    headers.set(
      "Access-Control-Allow-Methods",
      corsOptions.allowedMethods.join(","),
    );
    headers.set(
      "Access-Control-Allow-Headers",
      corsOptions.allowedHeaders.join(","),
    );
    headers.set(
      "Access-Control-Expose-Headers",
      corsOptions.exposedHeaders.join(","),
    );
    headers.set("Access-Control-Max-Age", corsOptions.maxAge?.toString() ?? "");

    // For regular API requests, just pass the CORS headers
    return NextResponse.next({
      headers,
    });
  }

  // For all other routes, just continue
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
