import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { productUrl } = await request.json();

    if (!productUrl) {
      return NextResponse.json(
        { success: false, error: '상품 URL이 필요합니다.' },
        { status: 400 }
      );
    }

    // Python 스크립트 경로
    const scriptPath = path.join(process.cwd(), 'scripts', 'naver_crawler_simple.py');
    
    // Python 실행 경로 - 시스템 PATH에서 python 사용
    const pythonPath = 'python';
    
    // Python 스크립트 실행
    const command = `"${pythonPath}" "${scriptPath}" "${productUrl}"`;
    
    console.log('Executing:', command);
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 90000, // 90초 타임아웃
      maxBuffer: 1024 * 1024 * 10, // 10MB 버퍼
      shell: 'powershell.exe',
      encoding: 'utf8', // UTF-8 인코딩 명시
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8', // Python 출력 인코딩
      },
    });

    if (stderr && !stderr.includes('DevTools')) {
      console.error('Python stderr:', stderr);
    }

    // Python 스크립트의 JSON 출력 파싱
    const result = JSON.parse(stdout);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error: any) {
    console.error('크롤링 API 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || '크롤링 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
