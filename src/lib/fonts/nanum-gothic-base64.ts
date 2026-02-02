// NanumGothic 폰트 Base64 (가벼운 서브셋 버전)
// 한글 PDF 출력을 위한 폰트 데이터
// 실제 배포 시에는 Google Fonts CDN에서 로드하거나 별도 파일로 관리

// 폰트 로딩 유틸리티 함수
export async function loadNanumGothicFont(): Promise<string> {
  // Google Fonts CDN에서 NanumGothic 폰트 로드
  const fontUrl = 'https://fonts.gstatic.com/ea/nanumgothic/v5/NanumGothic-Regular.ttf';
  
  try {
    const response = await fetch(fontUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    return base64;
  } catch (error) {
    console.error('폰트 로드 실패:', error);
    throw error;
  }
}

// ArrayBuffer를 Base64로 변환
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// 폰트 캐시 (한 번 로드 후 재사용)
let cachedFont: string | null = null;

export async function getCachedNanumGothicFont(): Promise<string> {
  if (cachedFont) {
    return cachedFont;
  }
  
  cachedFont = await loadNanumGothicFont();
  return cachedFont;
}
