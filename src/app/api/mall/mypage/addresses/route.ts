import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromCookies } from "@/lib/mall-auth";

// 배송지 목록 조회
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUserFromCookies();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(sessionUser.id);
    const user = await prisma.mallUser.findUnique({
      where: { id: userId },
      select: { addresses: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const addresses = user.addresses ? JSON.parse(user.addresses) : [];
    return NextResponse.json(addresses);
  } catch (error) {
    console.error("Failed to fetch addresses:", error);
    return NextResponse.json(
      { error: "배송지 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// 배송지 추가
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUserFromCookies();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(sessionUser.id);
    const body = await request.json();
    const { name, recipient, phone, zipCode, address, addressDetail, isDefault } = body;

    const user = await prisma.mallUser.findUnique({
      where: { id: userId },
      select: { addresses: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const addresses: any[] = user.addresses ? JSON.parse(user.addresses) : [];
    
    // 새 배송지 생성
    const newAddress = {
      id: `addr_${Date.now()}`,
      name,
      recipient,
      phone,
      zipCode,
      address,
      addressDetail,
      isDefault: isDefault || addresses.length === 0, // 첫 번째 배송지는 자동으로 기본
      createdAt: new Date().toISOString(),
    };

    // 기본 배송지로 설정시 다른 배송지 기본값 해제
    if (newAddress.isDefault) {
      addresses.forEach((addr) => (addr.isDefault = false));
    }

    addresses.push(newAddress);

    await prisma.mallUser.update({
      where: { id: userId },
      data: { addresses: JSON.stringify(addresses) },
    });

    return NextResponse.json(newAddress);
  } catch (error) {
    console.error("Failed to add address:", error);
    return NextResponse.json(
      { error: "배송지 추가에 실패했습니다." },
      { status: 500 }
    );
  }
}
