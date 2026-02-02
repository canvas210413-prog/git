"use server";

export async function getBehaviorAnalysisData() {
  // In a real app, this would aggregate data from an analytics DB (e.g., ClickHouse, Mixpanel, or a large Postgres table)
  // For now, we return rich dummy data for the UI.

  const activityTrend = [
    { date: "11/01", visits: 120, actions: 450 },
    { date: "11/02", visits: 132, actions: 480 },
    { date: "11/03", visits: 101, actions: 350 },
    { date: "11/04", visits: 154, actions: 520 },
    { date: "11/05", visits: 190, actions: 610 },
    { date: "11/06", visits: 230, actions: 750 },
    { date: "11/07", visits: 210, actions: 700 },
  ];

  const conversionFunnel = [
    { stage: "상품 조회", count: 5000, dropOff: 0 },
    { stage: "장바구니 담기", count: 1200, dropOff: 76 },
    { stage: "결제 시도", count: 450, dropOff: 62.5 },
    { stage: "구매 완료", count: 380, dropOff: 15.5 },
  ];

  const categoryInterests = [
    { name: "전자제품", score: 85 },
    { name: "패션/의류", score: 65 },
    { name: "생활용품", score: 45 },
    { name: "도서/티켓", score: 30 },
    { name: "식품", score: 25 },
  ];

  const recentBehaviors = [
    { id: 1, user: "홍길동", action: "장바구니 이탈", target: "프리미엄 노트북", time: "10분 전", risk: "High" },
    { id: 2, user: "김철수", action: "상세페이지 반복 조회", target: "게이밍 모니터", time: "30분 전", risk: "Medium" },
    { id: 3, user: "이영희", action: "쿠폰 다운로드", target: "신규 가입 10%", time: "1시간 전", risk: "Low" },
    { id: 4, user: "박민수", action: "검색어 반복", target: "최저가", time: "2시간 전", risk: "Medium" },
    { id: 5, user: "최지우", action: "리뷰 작성", target: "무선 이어폰", time: "3시간 전", risk: "Low" },
  ];

  return {
    activityTrend,
    conversionFunnel,
    categoryInterests,
    recentBehaviors,
  };
}
