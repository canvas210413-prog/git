import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const reviews = [
  {
    source: "Naver SmartStore",
    author: "hn****",
    rating: 5,
    date: new Date("2025-11-19"),
    content: "예전에 구입해서 사용하다 너무 좋아서 1+1으로 구매했어요 공기 정화가 잘되길 바래봅니다! 배송 진짜 빠르고 우리집 효자템이예용!",
    sentiment: "Positive",
    topics: "Repurchase, Delivery, Effectiveness"
  },
  {
    source: "Naver SmartStore",
    author: "luxu******",
    rating: 5,
    date: new Date("2025-11-25"),
    content: "아기방이앙 거실에 놓고 쓰고있어요 디자인도 깔끔해서 좋네요 차에도 놓고 쓰고싶어서 미니로 추가 구매 고민중입니다!",
    sentiment: "Positive",
    topics: "Design, Baby Room, Repurchase Intent"
  },
  {
    source: "Naver SmartStore",
    author: "wldb*****",
    rating: 5,
    date: new Date("2025-08-07"),
    content: "아기가 최근에 장염에 각종 바이러스6개가 한꺼번에 걸려서.. 정말 크게 아팠었는데요... 작동 하고 나서 공기에 질이 달라요 !!!!!!너무 깔끔해지는 느낌이 정말 찐으로 달라요... 소음도 없고 디자인도 예뻐요.",
    sentiment: "Positive",
    topics: "Health, Effectiveness, Noise, Design"
  },
  {
    source: "Naver SmartStore",
    author: "sunj******",
    rating: 4,
    date: new Date("2025-10-18"),
    content: "충전선 꽃는데는 지장없어 사용하지만 우리나라에서 제조한 상품인데 유격이 안맞다니.... 좀 아쉽네요 😢 1단으로 켜놓고 사용중인데 귀를 갖다대야 웅웅- 약간의 소음인데 거슬리지않고...",
    sentiment: "Neutral",
    topics: "Build Quality, Noise, Cost-effectiveness"
  },
  {
    source: "Naver SmartStore",
    author: "imsl***",
    rating: 5,
    date: new Date("2025-11-07"),
    content: "방마다 한대씩 놓을려고 1+1 특가 제품이랑 한대 더 해서 세대 주문했어요... 환기를 안해도 공기가 가볍고 맑은 느낌이에요. 고양이 키우는데 냄새도 잡아줘요.",
    sentiment: "Positive",
    topics: "Pet Odor, Effectiveness, Ventilation"
  },
  {
    source: "Naver SmartStore",
    author: "choi****",
    rating: 5,
    date: new Date("2025-11-08"),
    content: "모텔인데 방이 작아서 큰 공기청정기는 부담되었는데 이거는 작고 무필터라서 추가비용도 안들고 전기료도 저렴해서 구매했어요.",
    sentiment: "Positive",
    topics: "Size, Cost-effectiveness, No Filter"
  },
  {
    source: "Naver SmartStore",
    author: "jeon****",
    rating: 5,
    date: new Date("2025-10-28"),
    content: "저희집은 고양이와 아기가 있어요 항상 고양이 냄새가 나서 아기한테 미안했는데 이 공기청정기 들이고부터 냄새가 사라진 것 같아요",
    sentiment: "Positive",
    topics: "Pet Odor, Baby, Effectiveness"
  },
  {
    source: "Naver SmartStore",
    author: "ko****",
    rating: 4,
    date: new Date("2025-11-16"),
    content: "아직모르겠어요 공기정화뫈성되는줄도모르겟고 한달후에다시후기올릴께요",
    sentiment: "Neutral",
    topics: "Unsure, Effectiveness"
  },
  {
    source: "Naver SmartStore",
    author: "ricj*****",
    rating: 5,
    date: new Date("2025-10-23"),
    content: "아직 이사전이지만 이사가서 안방에하나 아이방 하나 달려고 샀습니다. 테스트겸 꺼냈다가 계속 사용중이예요 4단계빼고는 소음도없고 좋아요. 디자인도 심플하고 가벼워요.",
    sentiment: "Positive",
    topics: "Noise, Design, Weight"
  },
  {
    source: "Naver SmartStore",
    author: "rrtt******",
    rating: 5,
    date: new Date("2025-11-28"),
    content: "기존에 사용하던게 효과가 있어서, 아이방에 놓기위해 추가하여 구매하였습니다!",
    sentiment: "Positive",
    topics: "Repurchase, Effectiveness, Baby Room"
  },
  {
    source: "Naver SmartStore",
    author: "leso***",
    rating: 5,
    date: new Date("2025-11-18"),
    content: "오늘 와서 잘때 아기방에 틀어놨어요. 저희 아이들 둘다 비염 있다고 해서 주문했는데 효가가 좋길 바랍니다!",
    sentiment: "Positive",
    topics: "Baby Room, Rhinitis, Expectation"
  },
  {
    source: "Naver SmartStore",
    author: "casj****",
    rating: 5,
    date: new Date("2025-11-25"),
    content: "비염 있는 아들방에서 쓰고 있어요 소음도 크지 않고 사용하기 괜찮아요",
    sentiment: "Positive",
    topics: "Rhinitis, Noise, Usability"
  },
  {
    source: "Naver SmartStore",
    author: "jeje****",
    rating: 5,
    date: new Date("2025-11-19"),
    content: "거실2 아이침대1 안방1 총 네개 샀어요 큰 효과가 있길 기대해봅니다아",
    sentiment: "Positive",
    topics: "Bulk Purchase, Expectation"
  },
  {
    source: "Naver SmartStore",
    author: "pgh5***",
    rating: 5,
    date: new Date("2025-11-25"),
    content: "잘 받았습니다 감사합니다",
    sentiment: "Positive",
    topics: "Delivery"
  },
  {
    source: "Naver SmartStore",
    author: "dd****",
    rating: 5,
    date: new Date("2025-11-27"),
    content: "설치 잘하고 이상없습니다. 잘 사용하겠습니다.",
    sentiment: "Positive",
    topics: "Installation, Usability"
  },
  {
    source: "Naver SmartStore",
    author: "tpgj****",
    rating: 5,
    date: new Date("2025-11-25"),
    content: "잘쓰고 있어요~ 좋아요",
    sentiment: "Positive",
    topics: "Satisfaction"
  },
  {
    source: "Naver SmartStore",
    author: "wind*****",
    rating: 5,
    date: new Date("2025-10-25"),
    content: "요즘 미세기관지염이 유행하고 있어 저희 아이도 걸렸어요.. 회복에 조금이라도 도움이 될까 싶어 구매를 했어요. 일단 안방에 두고 돌려봤는데 기분 탓인지 모르지만 잡냄세가 없어진것 같네요",
    sentiment: "Positive",
    topics: "Health, Odor Removal"
  },
  {
    source: "Naver SmartStore",
    author: "tndu****",
    rating: 4,
    date: new Date("2025-11-23"),
    content: "하루저녁 써봤는데...비염이 심해서 그런가....아직은 잘 모르겠어요.",
    sentiment: "Neutral",
    topics: "Effectiveness, Rhinitis"
  },
  {
    source: "Naver SmartStore",
    author: "bunz****",
    rating: 5,
    date: new Date("2025-11-22"),
    content: "아기방 공기청정에 도움이 되어 좋습니다.",
    sentiment: "Positive",
    topics: "Baby Room, Effectiveness"
  }
];

async function main() {
  console.log('Start seeding VOC data...');
  
  /*
  for (const review of reviews) {
    await prisma.review.create({
      data: review
    });
  }
  */
  console.log('Seeding finished (Review seeding skipped due to missing model).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
