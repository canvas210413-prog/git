import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { moveAfterServiceToTrash } from "@/app/actions/trash";

// AS 단일 항목 삭제 (휴지통으로 이동)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // AS 항목이 존재하는지 확인
    const existing = await prisma.afterservice.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "AS 항목을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 휴지통으로 이동
    const result = await moveAfterServiceToTrash(id);

    if (result.success) {
      return NextResponse.json(
        { message: "AS 항목이 휴지통으로 이동되었습니다.", id },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: result.error?.message || "휴지통 이동에 실패했습니다." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("AS 삭제 오류:", error);
    return NextResponse.json(
      { error: "AS 삭제 중 오류가 발생했습니다.", details: String(error) },
      { status: 500 }
    );
  }
}

// AS 단일 항목 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const asItem = await prisma.afterservice.findUnique({
      where: { id },
    });

    if (!asItem) {
      return NextResponse.json(
        { error: "AS 항목을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(asItem, { status: 200 });
  } catch (error) {
    console.error("AS 조회 오류:", error);
    return NextResponse.json(
      { error: "AS 조회 중 오류가 발생했습니다.", details: String(error) },
      { status: 500 }
    );
  }
}

// AS 단일 항목 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // AS 항목이 존재하는지 확인
    const existing = await prisma.afterservice.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "AS 항목을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 업데이트할 데이터 준비
    const updateData: any = {};
    
    if (body.customerName !== undefined) updateData.customerName = body.customerName;
    if (body.phoneNumber !== undefined) updateData.phoneNumber = body.phoneNumber;
    if (body.productName !== undefined) updateData.productName = body.productName;
    if (body.productCode !== undefined) updateData.productCode = body.productCode;
    if (body.serialNumber !== undefined) updateData.serialNumber = body.serialNumber;
    if (body.purchaseDate !== undefined) {
      updateData.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null;
    }
    if (body.symptom !== undefined) updateData.symptom = body.symptom;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.pickupRequestDate !== undefined) {
      updateData.pickupRequestDate = body.pickupRequestDate ? new Date(body.pickupRequestDate) : null;
    }
    if (body.address !== undefined) updateData.address = body.address;
    if (body.memo !== undefined) updateData.memo = body.memo;

    // AS 항목 업데이트
    const updated = await prisma.afterservice.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      { message: "AS 항목이 수정되었습니다.", data: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("AS 수정 오류:", error);
    return NextResponse.json(
      { error: "AS 수정 중 오류가 발생했습니다.", details: String(error) },
      { status: 500 }
    );
  }
}