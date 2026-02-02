import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromCookies } from "@/lib/mall-auth";

// 기본 배송지로 설정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUserFromCookies();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(sessionUser.id);
    const { id } = await params;

    const user = await prisma.mallUser.findUnique({
      where: { id: userId },
      select: { addresses: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const addresses: any[] = user.addresses ? JSON.parse(user.addresses) : [];
    const addressIndex = addresses.findIndex((a) => a.id === id);

    if (addressIndex === -1) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // 모든 배송지 기본값 해제 후 선택한 배송지 기본값 설정
    addresses.forEach((addr) => (addr.isDefault = false));
    addresses[addressIndex].isDefault = true;

    await prisma.mallUser.update({
      where: { id: userId },
      data: { addresses: JSON.stringify(addresses) },
    });

    return NextResponse.json(addresses[addressIndex]);
  } catch (error) {
    console.error("Failed to set default address:", error);
    return NextResponse.json(
      { error: "기본 배송지 설정에 실패했습니다." },
      { status: 500 }
    );
  }
}
