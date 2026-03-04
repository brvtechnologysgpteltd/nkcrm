import "server-only";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const sessionCookieName = "nk_session";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
