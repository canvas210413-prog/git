import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notifyNewASFromPartner } from "@/lib/notification-helper";
import { createId } from "@paralleldrive/cuid2";

/**
 * 현재 로그인한 사용자의 협력사 정보를 조회합니다.
 * null이면 본사 (전체 접근), 값이 있으면 해당 협력사만 접근
 */
async function getCurrentUserPartner(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return null;
    }
    return (session.user as any).assignedPartner || null;
  } catch (error) {
    console.error("세션 조회 실패:", error);
    return null;
  }
}

/**
 * AS 목록 조회
 * GET /api/after-service
 * Query params: status, priority, customerId, startDate, endDate
 * 협력사 사용자는 자신의 업체명(companyName)에 해당하는 데이터만 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const customerId = searchParams.get("customerId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 현재 사용자의 협력사 정보 조회
    const assignedPartner = await getCurrentUserPartner();

    const where: any = {};

    // 협력사 사용자는 자신의 업체명에 해당하는 AS 데이터만 조회
    if (assignedPartner) {
      where.companyName = assignedPartner;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (priority && priority !== "all") {
      where.priority = priority;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const afterServices = await prisma.afterservice.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            grade: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(afterServices);
  } catch (error) {
    console.error("AS 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "AS 목록 조회 실패" },
      { status: 500 }
    );
  }
}

/**
 * AS 신규 접수
 * POST /api/after-service
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      // 날짜/업체 정보
      serviceDate,
      companyName,
      // 고객 정보
      customerName,
      customerPhone,
      customerAddress,
      // 일정 정보
      pickupRequestDate,
      processDate,
      shipDate,
      pickupCompleteDate,
      // 제품 정보
      productName,
      modelNumber,
      serialNumber,
      purchaseDate,
      warrantyStatus,
      // 내용
      issueType,
      issueTitle,
      issueDescription,
      repairContent,
      trackingNumber,
      courier,
      attachments,
      priority,
    } = body;

    // 필수 필드 검증 (최소한의 필수 항목)
    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: "고객명과 연락처는 필수입니다." },
        { status: 400 }
      );
    }

    // 전화번호 또는 이메일로 기존 고객 찾기 또는 생성
    const tempEmail = `${customerPhone}@temp.com`;
    let customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone: customerPhone },
          { email: tempEmail }
        ]
      },
    });

    if (!customer) {
      // 새 고객 생성
      customer = await prisma.customer.create({
        data: {
          id: createId(),
          name: customerName,
          phone: customerPhone,
          email: tempEmail,
          status: "ACTIVE",
          updatedAt: new Date(),
        },
      });
    }

    // 티켓 번호 생성 (AS-YYYYMMDD-XXX) - KST 기준
    const now = new Date();
    // KST는 UTC+9 (9시간 추가)
    const kstOffset = 9 * 60; // minutes
    const localTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000); // UTC로 변환
    const kstTime = new Date(localTime + (kstOffset * 60 * 1000));
    
    const year = kstTime.getFullYear();
    const month = String(kstTime.getMonth() + 1).padStart(2, "0");
    const day = String(kstTime.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;
    
    // 오늘 생성된 AS 건수 조회 (ticketNumber 기준)
    const todayPrefix = `AS-${dateStr}-`;
    const todayCount = await prisma.afterservice.count({
      where: {
        ticketNumber: {
          startsWith: todayPrefix,
        },
      },
    });

    const ticketNumber = `AS-${dateStr}-${String(todayCount + 1).padStart(3, "0")}`;

    const afterService = await prisma.afterservice.create({
      data: {
        id: createId(),
        asNumber: ticketNumber,
        ticketNumber,
        customerId: customer.id,
        type: "REPAIR",
        // 날짜/업체 정보
        serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
        companyName: companyName || "",
        // 고객 정보
        customerName,
        customerPhone,
        customerAddress: customerAddress || "",
        // 일정 정보
        pickupRequestDate: pickupRequestDate ? new Date(pickupRequestDate) : null,
        processDate: processDate ? new Date(processDate) : null,
        shipDate: shipDate ? new Date(shipDate) : null,
        pickupCompleteDate: pickupCompleteDate ? new Date(pickupCompleteDate) : null,
        // 제품 정보
        productName: productName || "",
        serialNumber: serialNumber || "",
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        // 내용
        issueType: issueType || "OTHER",
        description: issueDescription || issueTitle || "",
        repairContent: repairContent || "",
        trackingNumber: trackingNumber || "",
        courier: courier || "",
        priority: priority || "NORMAL",
        status: "RECEIVED",
        updatedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // 협력사가 A/S를 접수한 경우 관리자에게 알림
    const session = await getServerSession(authOptions);
    const assignedPartner = (session?.user as any)?.assignedPartner;
    if (assignedPartner) {
      // 협력사 계정이 A/S를 접수한 경우
      await notifyNewASFromPartner(
        assignedPartner,
        ticketNumber,
        customerName,
        issueDescription || issueTitle || "문제 설명 없음"
      ).catch(err => {
        console.error("관리자 알림 전송 실패:", err);
      });
    }

    return NextResponse.json(afterService, { status: 201 });
  } catch (error) {
    console.error("AS 접수 오류:", error);
    return NextResponse.json(
      { error: "AS 접수 실패", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * AS 정보 수정
 * PATCH /api/after-service
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "AS ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 읽기 전용 필드 및 relation 필드 제외
    const { 
      id: _id, 
      customer, 
      user,
      order,
      customerId, 
      orderId, 
      assignedToId,
      createdAt, 
      updatedAt, 
      ...updateData 
    } = data;

    // 날짜 필드 변환
    const dateFields = [
      'pickupRequestDate',
      'processDate', 
      'shipDate',
      'pickupCompleteDate',
      'purchaseDate',
      'receivedAt',
      'completedAt',
      'serviceDate',
      'scheduledDate',
      'visitedDate',
      'completedDate',
      'nextFilterDate'
    ];

    dateFields.forEach(field => {
      if (updateData[field]) {
        updateData[field] = new Date(updateData[field]);
      }
    });

    // 완료 시 completedAt 자동 설정
    if (updateData.status === "COMPLETED" && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }

    // 비용 계산
    if (updateData.laborCost !== undefined || updateData.partsCost !== undefined) {
      const currentAS = await prisma.afterservice.findUnique({
        where: { id },
        select: { laborCost: true, partsCost: true },
      });

      const laborCost = updateData.laborCost ?? currentAS?.laborCost ?? 0;
      const partsCost = updateData.partsCost ?? currentAS?.partsCost ?? 0;
      updateData.totalCost = laborCost + partsCost;
    }

    // updatedAt 필드 추가
    updateData.updatedAt = new Date();

    const afterService = await prisma.afterservice.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(afterService);
  } catch (error) {
    console.error("AS 수정 오류:", error);
    return NextResponse.json(
      { error: "AS 수정 실패", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
/**
 * AS 삭제 (단건 또는 전체)
 * DELETE /api/after-service
 * Query params: id (단건 삭제), all=true (전체 삭제)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const deleteAll = searchParams.get("all") === "true";

    if (deleteAll) {
      // 전체 삭제
      const result = await prisma.afterservice.deleteMany({});
      return NextResponse.json({
        message: `${result.count}건의 AS 데이터가 삭제되었습니다.`,
        deletedCount: result.count,
      });
    }

    if (!id) {
      return NextResponse.json(
        { error: "삭제할 AS ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 단건 삭제
    await prisma.afterservice.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "AS 데이터가 삭제되었습니다.",
      deletedId: id,
    });
  } catch (error) {
    console.error("AS 삭제 오류:", error);
    return NextResponse.json(
      { error: "AS 삭제 실패" },
      { status: 500 }
    );
  }
}