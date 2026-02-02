import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/mall-auth";

export async function POST() {
  const cookie = clearSessionCookie();
  const response = NextResponse.json({ message: "로그아웃 되었습니다." });
  response.cookies.set(cookie);
  return response;
}
