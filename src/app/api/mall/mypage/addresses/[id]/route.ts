import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromCookies } from "@/lib/mall-auth";

// 배송지 수정
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
    const addressIndex = addresses.findIndex((a) => a.id === id);

    if (addressIndex === -1) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // 기본 배송지로 설정시 다른 배송지 기본값 해제
    if (isDefault) {
      addresses.forEach((addr) => (addr.isDefault = false));
    }

    addresses[addressIndex] = {
      ...addresses[addressIndex],
      name,
      recipient,
      phone,
      zipCode,
      address,
      addressDetail,
      isDefault: isDefault ?? addresses[addressIndex].isDefault,
      updatedAt: new Date().toISOString(),
    };

    await prisma.mallUser.update({
      where: { id: userId },
      data: { addresses: JSON.stringify(addresses) },
    });

    return NextResponse.json(addresses[addressIndex]);
  } catch (error) {
    console.error("Failed to update address:", error);
    return NextResponse.json(
      { error: "배송지 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 배송지 삭제
export async function DELETE(
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

    let addresses: any[] = user.addresses ? JSON.parse(user.addresses) : [];
    const deletedAddress = addresses.find((a) => a.id === id);

    if (!deletedAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    addresses = addresses.filter((a) => a.id !== id);

    // 삭제된 배송지가 기본이었으면 다른 배송지를 기본으로 설정
    if (deletedAddress.isDefault && addresses.length > 0) {
      addresses[0].isDefault = true;
    }

    await prisma.mallUser.update({
      where: { id: userId },
      data: { addresses: JSON.stringify(addresses) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete address:", error);
    return NextResponse.json(
      { error: "배송지 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
