// 쇼핑몰 상품 타입 정의
export interface MallProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  category: string;
  tags?: string[];
  detailContent?: string;
}

// 쇼핑몰 상품 목록 (임시 데이터 - 추후 DB 연동)
export const MALL_PRODUCTS: MallProductData[] = [
  {
    id: "1",
    name: "쉴드프로젝트 쉴드 공기청정기 거치대",
    description: "안전하게 쉴드프로젝트 제품입니다. 고객님의 편의를 위한 전용 거치대입니다.",
    price: 9960,
    originalPrice: 12000,
    discountRate: 17,
    rating: 4.89,
    reviewCount: 27,
    imageUrl: "https://placehold.co/600x600/png?text=Shield+Stand",
    category: "Accessory",
    tags: ["거치대", "전용상품"],
    detailContent: `
      <h2>쉴드프로젝트 쉴드 공기청정기 전용 거치대</h2>
      <p>쉴드 공기청정기를 더욱 안전하고 편리하게 사용할 수 있는 전용 거치대입니다.</p>
      <ul>
        <li>안전한 거치</li>
        <li>견고한 고정력</li>
        <li>미끄럼 방지 패드 부착</li>
      </ul>
    `
  },
  {
    id: "2",
    name: "쉴드 신생아 H13 헤파 초미세먼지 미세먼지 바이러스 박테리아 방역형 공기청정기",
    description: "신생아의 아이들을 위한 최고의 선택. 초미세먼지, 바이러스로부터 보호하세요.",
    price: 234400,
    originalPrice: 244400,
    discountRate: 4,
    rating: 4.79,
    reviewCount: 1125,
    imageUrl: "https://placehold.co/600x600/png?text=Shield+Air+Purifier+Set",
    category: "Air Purifier",
    tags: ["신생아", "H13헤파", "방역형"],
    detailContent: `
      <h2>우리 아이를 위한 쉴드 공기청정기</h2>
      <p>면역력이 약한 신생아와 아이들을 위해 심혈을 기울였습니다.</p>
      <h3>주요 기능</h3>
      <ul>
        <li>H13 헤파 필터 시스템</li>
        <li>초미세먼지 제거</li>
        <li>바이러스 차단 기능</li>
        <li>저소음 슬립 모드</li>
      </ul>
    `
  },
  {
    id: "3",
    name: "쉴드 신생아 H13 헤파 초미세먼지 바이러스 비염 박테리아 방역형 공기청정기 (단품)",
    description: "강력한 성능의 쉴드 공기청정기. 비염과 알러지로 고생하는 분들께 추천합니다.",
    price: 188000,
    originalPrice: 198000,
    discountRate: 5,
    rating: 4.74,
    reviewCount: 635,
    imageUrl: "https://placehold.co/600x600/png?text=Shield+Air+Purifier",
    category: "Air Purifier",
    tags: ["비염차단", "초미세먼지"],
    detailContent: `
      <h2>편안한 숨쉬기를 위한 공간, 쉴드와 함께</h2>
      <p>비염, 알러지로 고생하시는 분들을 위해 쉴드 공기청정기를 추천합니다.</p>
      <p>강력한 청정 성능으로 실내 공기질을 확실하게 개선합니다.</p>
    `
  },
  {
    id: "4",
    name: "쉴드 신생아 H13 헤파 바이러스 비염 박테리아 방역형 무아이온 공기청정기 아이방",
    description: "필터 교체가 필요 없는 혁신적인 기술. 경제적이고 강력합니다.",
    price: 169000,
    originalPrice: 179000,
    discountRate: 5,
    rating: 4.62,
    reviewCount: 167,
    imageUrl: "https://placehold.co/600x600/png?text=Filterless+Purifier",
    category: "Air Purifier",
    tags: ["무필터", "경제적", "아이방"],
    detailContent: `
      <h2>필터 걱정 없는 무필터 공기청정기</h2>
      <p>필터 교체 없이 반영구적 사용이 가능합니다.</p>
      <p>유지비 걱정 없이 365일 깨끗한 공기를 마시세요.</p>
    `
  },
  {
    id: "5",
    name: "쉴드미니 신생아 H13 헤파 플라즈마이온 무필터 공기청정기 비염 육아방 아이",
    description: "작지만 강력한 쉴드 미니. 육아방, 차량, 공부방에 딱 맞는 사이즈.",
    price: 99000,
    originalPrice: 119000,
    discountRate: 16,
    rating: 5.0,
    reviewCount: 1,
    imageUrl: "https://placehold.co/600x600/png?text=Shield+Mini+Set",
    category: "Mini Purifier",
    tags: ["미니", "플라즈마이온", "육아방"],
    detailContent: `
      <h2>작지만 강력한 쉴드 미니</h2>
      <p>공간 차지 없이 책상 위, 차량 내 어디든지 놓을 수 있습니다.</p>
      <p>플라즈마이온 기술로 공기 중 유해 물질을 효과적으로 제거합니다.</p>
    `
  },
  {
    id: "6",
    name: "쉴드미니 신생아 비염 박테리아 냄새 H13 헤파 공기청정기 방역형 바이러스",
    description: "냄새, 바이러스가 걱정되시나요? 쉴드 미니로 개인 방역을 시작하세요.",
    price: 99000,
    originalPrice: 119000,
    discountRate: 16,
    rating: 4.83,
    reviewCount: 323,
    imageUrl: "https://placehold.co/600x600/png?text=Shield+Mini",
    category: "Mini Purifier",
    tags: ["바이러스차단", "개인방역"],
    detailContent: `
      <h2>개인 공간을 위한 완벽한 솔루션</h2>
      <p>책상, 침대옆, 차량 어느 곳에서든 개인 공간의 공기를 책임집니다.</p>
      <p>소음이 거의 없어 어디든지 맑은 공기를 마실 수 있습니다.</p>
    `
  }
];

// 상품 ID로 상품 찾기
export function getMallProductById(id: string): MallProductData | null {
  return MALL_PRODUCTS.find(p => p.id === id) || null;
}

// 카테고리별 상품 필터링
export function getMallProductsByCategory(category: string): MallProductData[] {
  return MALL_PRODUCTS.filter(p => p.category === category);
}

// 추천 상품 가져오기 (리뷰 수 기준)
export function getFeaturedMallProducts(count: number = 4): MallProductData[] {
  return [...MALL_PRODUCTS]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, count);
}
