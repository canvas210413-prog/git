import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ 
    success: true,
    message: "로그아웃 되었습니다." 
  });
  
  // 세션 쿠키 제거
  response.cookies.set({
    name: 'auth-token',
    value: '',
    expires: new Date(0),
    path: '/',
  });
  
  return response;
}
