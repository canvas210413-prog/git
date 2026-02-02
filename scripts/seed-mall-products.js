const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const products = [
  {
    name: "쉴드 신생아 항알러지 초미세먼지꽃가루 비염 폐렴 방역용 무필터 공기청정기 아이방",
    description: "신생아와 아이방을 위한 프리미엄 공기청정기입니다. H13 헤파 필터와 플라즈마이온 기술로 초미세먼지, 꽃가루, 바이러스, 세균을 99.9% 제거합니다. 무필터 교체 방식으로 유지비가 절감됩니다.",
    price: 244400,
    originalPrice: 299000,
    stock: 100,
    category: "공기청정기",
    images: JSON.stringify(["/products/shield-purifier.jpg"]),
    tags: "쉴드,공기청정기,신생아,항알러지,초미세먼지,꽃가루,비염,폐렴,방역,무필터,아이방",
    isActive: true,
    isFeatured: true,
    rating: 4.79,
    reviewCount: 1152,
  },
  {
    name: "쉴드 신생아 항알러지 초미세먼지꽃가루 비염 폐렴 방역용 무필터 공기청정기 (화이트)",
    description: "클린한 화이트 컬러의 프리미엄 공기청정기입니다. 신생아부터 온 가족이 함께 사용할 수 있으며, 초미세먼지와 유해물질을 효과적으로 제거합니다.",
    price: 198000,
    originalPrice: 249000,
    stock: 80,
    category: "공기청정기",
    images: JSON.stringify(["/products/shield-purifier.jpg"]),
    tags: "쉴드,공기청정기,신생아,항알러지,초미세먼지,꽃가루,비염,폐렴,방역,무필터,화이트",
    isActive: true,
    isFeatured: true,
    rating: 4.75,
    reviewCount: 644,
  },
  {
    name: "케이프로젝트 쉴드 공기살균기 거치대",
    description: "쉴드 공기살균기 전용 거치대입니다. 안정적인 설치와 깔끔한 인테리어를 위한 프리미엄 거치대입니다.",
    price: 9960,
    originalPrice: 12000,
    stock: 200,
    category: "액세서리",
    images: JSON.stringify(["/products/shield-stand.jpg"]),
    tags: "케이프로젝트,쉴드,거치대,공기살균기,액세서리",
    isActive: true,
    isFeatured: false,
    rating: 4.89,
    reviewCount: 28,
  },
  {
    name: "쉴드 항알러지 꽃가루 비염 폐렴 방역용 무필터 공기살균기 아이방",
    description: "컴팩트한 사이즈로 아이방에 딱 맞는 공기살균기입니다. 항알러지 기능과 무필터 설계로 경제적이고 효과적인 공기 정화가 가능합니다.",
    price: 179000,
    originalPrice: 219000,
    stock: 60,
    category: "공기청정기",
    images: JSON.stringify(["/products/shield-purifier.jpg"]),
    tags: "쉴드,공기살균기,항알러지,꽃가루,비염,폐렴,방역,무필터,아이방",
    isActive: true,
    isFeatured: true,
    rating: 4.61,
    reviewCount: 168,
  },
  {
    name: "쉴드미니 신생아 항알러지 양극이온 무필터 공기청정기 비염 아이방 공기살균기",
    description: "쉴드미니는 아기 곁에서 조용히 작동하는 프리미엄 미니 공기청정기입니다. 양극이온 기술로 바이러스와 세균을 효과적으로 제거하며, 무필터 설계로 유지비 부담이 없습니다.",
    price: 99000,
    originalPrice: 119000,
    stock: 150,
    category: "공기청정기",
    images: JSON.stringify(["/products/shield-mini.jpg"]),
    tags: "쉴드미니,신생아,항알러지,양극이온,무필터,공기청정기,비염,아이방,공기살균기",
    isActive: true,
    isFeatured: true,
    rating: 4.82,
    reviewCount: 523,
  },
  {
    name: "쉴드미니 신생아 비염 폐렴 독감 항알러지 공기청정기 방역용 바이러스 무필터",
    description: "독감 시즌에 특히 유용한 쉴드미니 공기청정기입니다. 바이러스와 세균을 99.9% 제거하여 신생아와 어린이의 건강을 지켜드립니다.",
    price: 99000,
    originalPrice: 119000,
    stock: 150,
    category: "공기청정기",
    images: JSON.stringify(["/products/shield-mini.jpg"]),
    tags: "쉴드미니,신생아,비염,폐렴,독감,항알러지,공기청정기,방역,바이러스,무필터",
    isActive: true,
    isFeatured: false,
    rating: 4.78,
    reviewCount: 412,
  },
];

async function seedProducts() {
  console.log('쇼핑몰 상품 등록 시작...');
  
  // 기존 상품 삭제 (선택적)
  await prisma.mallProduct.deleteMany({});
  console.log('기존 상품 삭제 완료');
  
  // 새 상품 등록
  for (const product of products) {
    const created = await prisma.mallProduct.create({
      data: product,
    });
    console.log(`상품 등록: ${created.name}`);
  }
  
  console.log(`\n총 ${products.length}개 상품 등록 완료!`);
  await prisma.$disconnect();
}

seedProducts().catch(console.error);
