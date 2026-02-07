import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const CONFIG_FILE_PATH = path.join(process.cwd(), "config", "margin-formula.json");

// 마진 공식 설정 타입
export interface MarginDeduction {
  id: string;
  type: "cost" | "shippingFee" | "commission" | "custom";
  enabled: boolean;
  label: string;
  description: string;
  valueType: "kpi" | "fixed" | "rate";
  fixedValue: number;
  rate?: number;
  excludePartners?: string[];
}

export interface MarginFormulaConfig {
  version: number;
  name: string;
  description: string;
  formula: {
    base: "supplyPrice" | "basePrice";
    vatExclude: boolean;
    vatRate: number;
    deductions: MarginDeduction[];
  };
  updatedAt: string;
  updatedBy: string;
}

// GET - 마진 공식 설정 조회
export async function GET() {
  try {
    // 설정 파일 읽기
    const configData = await fs.readFile(CONFIG_FILE_PATH, "utf-8");
    const config: MarginFormulaConfig = JSON.parse(configData);

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("마진 공식 설정 조회 실패:", error);
    
    // 파일이 없으면 기본 설정 반환
    const defaultConfig: MarginFormulaConfig = {
      version: 1,
      name: "기본 마진 공식",
      description: "마진 = 공급가 - 원가 - 배송비 - 수수료",
      formula: {
        base: "supplyPrice",
        vatExclude: false,
        vatRate: 0.1,
        deductions: [
          {
            id: "cost",
            type: "cost",
            enabled: true,
            label: "원가",
            description: "상품별 KPI 설정의 원가 사용",
            valueType: "kpi",
            fixedValue: 0,
          },
          {
            id: "shippingFee",
            type: "shippingFee",
            enabled: true,
            label: "배송비",
            description: "건당 배송비 (로켓그로스 제외)",
            valueType: "fixed",
            fixedValue: 3000,
            excludePartners: ["로켓그로스"],
          },
          {
            id: "commission",
            type: "commission",
            enabled: true,
            label: "수수료",
            description: "공급가 대비 수수료율",
            valueType: "rate",
            rate: 0.02585,
            fixedValue: 0,
          },
        ],
      },
      updatedAt: new Date().toISOString(),
      updatedBy: "system",
    };

    return NextResponse.json({
      success: true,
      data: defaultConfig,
    });
  }
}

// PUT - 마진 공식 설정 저장
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, formula, updatedBy } = body;

    // 기존 설정 읽기
    let existingConfig: MarginFormulaConfig;
    try {
      const configData = await fs.readFile(CONFIG_FILE_PATH, "utf-8");
      existingConfig = JSON.parse(configData);
    } catch {
      existingConfig = {
        version: 0,
        name: "",
        description: "",
        formula: {
          base: "supplyPrice",
          vatExclude: false,
          vatRate: 0.1,
          deductions: [],
        },
        updatedAt: "",
        updatedBy: "",
      };
    }

    // 새 설정 생성
    const newConfig: MarginFormulaConfig = {
      version: existingConfig.version + 1,
      name: name || existingConfig.name,
      description: description || existingConfig.description,
      formula: formula || existingConfig.formula,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || "unknown",
    };

    // config 디렉토리 확인 및 생성
    const configDir = path.dirname(CONFIG_FILE_PATH);
    try {
      await fs.access(configDir);
    } catch {
      await fs.mkdir(configDir, { recursive: true });
    }

    // 설정 파일 저장
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(newConfig, null, 2), "utf-8");

    console.log("마진 공식 설정 저장 완료:", newConfig.name);

    return NextResponse.json({
      success: true,
      message: "마진 공식 설정이 저장되었습니다.",
      data: newConfig,
    });
  } catch (error) {
    console.error("마진 공식 설정 저장 실패:", error);
    return NextResponse.json(
      { success: false, message: "마진 공식 설정 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
