// 리뷰 분석 LLM 테스트 스크립트
const body = JSON.stringify({
  reviews: [
    {
      id: "test-1",
      subject: "[네이버] 5점 - 테스트고객",
      description: "공기청정기 정말 좋아요! 비염이 있는데 확실히 증상이 완화된 것 같습니다. 소음도 작고 디자인도 이뻐요.",
      rating: 5,
      customerName: "테스트고객"
    }
  ]
});

console.log("리뷰 분석 LLM 테스트 시작...");

fetch("http://localhost:3000/api/reviews/analyze", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: body
})
.then(async response => {
  console.log("응답 상태:", response.status);
  const data = await response.json();
  console.log("응답 데이터:");
  console.log(JSON.stringify(data, null, 2));
})
.catch(error => {
  console.error("에러:", error.message);
});
