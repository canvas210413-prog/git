// AS 인사이트 API 테스트 스크립트
const body = JSON.stringify({
  startDate: "2025-12-01",
  endDate: "2025-12-31"
});

console.log("AS 인사이트 API 테스트 시작...");
console.log("요청 body:", body);

fetch("http://localhost:3000/api/after-service/insights", {
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
  console.log(JSON.stringify(data, null, 2).substring(0, 2000));
  if (data.insight) {
    console.log("\n인사이트 내용:");
    console.log(data.insight.substring(0, 1000));
  }
})
.catch(error => {
  console.error("에러:", error.message);
});
