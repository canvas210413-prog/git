/**
 * Dashboard Utility Functions
 * 
 * 대시보드에서 사용되는 헬퍼 함수들을 제공합니다.
 */

/**
 * 주문 상태에 따른 Badge variant 반환
 */
export function getOrderBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "COMPLETED":
      return "outline";
    case "PENDING":
      return "default";
    case "CANCELLED":
      return "destructive";
    default:
      return "secondary";
  }
}

/**
 * 티켓 상태에 따른 Badge variant 반환
 */
export function getTicketBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "RESOLVED":
      return "outline";
    case "OPEN":
      return "destructive";
    case "IN_PROGRESS":
      return "default";
    case "CLOSED":
      return "secondary";
    default:
      return "secondary";
  }
}

/**
 * StatCard variant를 조건에 따라 반환
 */
export function getStatCardVariant(
  value: number,
  threshold: { warning?: number; danger?: number }
): "default" | "info" | "success" | "warning" | "danger" | undefined {
  if (threshold.danger !== undefined && value >= threshold.danger) {
    return "danger";
  }
  if (threshold.warning !== undefined && value >= threshold.warning) {
    return "warning";
  }
  return undefined;
}

/**
 * 퍼센트 값을 색상 variant로 변환
 * @param percent 퍼센트 값
 * @param isHighBetter true면 높을수록 좋음, false면 낮을수록 좋음
 */
export function getPercentVariant(
  percent: number,
  isHighBetter: boolean = true
): "success" | "warning" | "danger" | undefined {
  if (isHighBetter) {
    if (percent >= 70) return "success";
    if (percent >= 40) return "warning";
    return "danger";
  } else {
    if (percent <= 10) return "success";
    if (percent <= 30) return "warning";
    return "danger";
  }
}

/**
 * 날짜를 한국어 형식으로 포맷
 */
export function formatKoreanDate(date: Date): string {
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * 날짜를 상대 시간으로 표시 (예: "3시간 전", "2일 전")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return formatKoreanDate(date);
  } else if (days > 0) {
    return `${days}일 전`;
  } else if (hours > 0) {
    return `${hours}시간 전`;
  } else if (minutes > 0) {
    return `${minutes}분 전`;
  } else {
    return "방금 전";
  }
}
