// 인사이트 리포트 LLM 테스트 스크립트
// Ollama API 직접 호출 테스트

const body = JSON.stringify({
  model: "gemma3:27b",
  messages: [
    {
      role: "system",
      content: "당신은 CRM 데이터 분석 전문가입니다. 간결하게 한국어로 답변하세요."
    },
    {
      role: "user", 
      content: "다음 매출 데이터를 분석해주세요: 이번 주 매출 1,500만원, 지난 주 매출 1,200만원, 성장률 25%. 핵심 인사이트 3개를 bullet point로 알려주세요."
    }
  ],
  stream: false
});

console.log("인사이트 리포트 LLM 테스트 시작...");
console.log("Ollama API 직접 호출 중...\n");

fetch("http://localhost:11434/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: body
})
.then(async response => {
  console.log("응답 상태:", response.status);
  const data = await response.json();
  console.log("\nLLM 응답:");
  console.log(data.message?.content || data);
})
.catch(error => {
  console.error("에러:", error.message);
});
