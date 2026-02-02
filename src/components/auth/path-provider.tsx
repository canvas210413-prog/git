"use client";

import { usePathname } from "next/navigation";

// 클라이언트 사이드에서 현재 pathname을 가져오는 컴포넌트
export function PathProvider({ children, onPath }: { 
  children: React.ReactNode; 
  onPath?: (path: string) => void;
}) {
  const pathname = usePathname();
  
  // pathname을 부모에게 전달 (있는 경우)
  if (onPath) {
    onPath(pathname);
  }

  return <>{children}</>;
}

export function useCurrentPath() {
  return usePathname();
}
