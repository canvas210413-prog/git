import { MallAuthProvider } from "@/components/mall/auth/MallAuthProvider";
import { MallCartProvider } from "@/components/mall/cart/MallCartProvider";
import { MallNavbar } from "@/components/mall/MallNavbar";
import { MallChatbotWidget } from "@/components/mall/MallChatbotWidget";

export default function MallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MallAuthProvider>
      <MallCartProvider>
        <div className="min-h-screen bg-slate-50">
          <MallNavbar />
          <main>{children}</main>
          {/* 챗봇 위젯 */}
          <MallChatbotWidget />
          <footer className="bg-slate-900 text-white py-12 mt-16">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <h3 className="font-bold text-lg mb-4">K-Project Mall</h3>
                  <p className="text-slate-400 text-sm">
                    건강한 공기를 위한 최고의 선택,<br />
                    K-Project와 함께하세요.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">고객센터</h4>
                  <ul className="space-y-2 text-slate-400 text-sm">
                    <li>전화: 1588-0000</li>
                    <li>평일 09:00 - 18:00</li>
                    <li>점심 12:00 - 13:00</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">정책</h4>
                  <ul className="space-y-2 text-slate-400 text-sm">
                    <li>이용약관</li>
                    <li>개인정보처리방침</li>
                    <li>교환/반품 정책</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">계좌정보</h4>
                  <ul className="space-y-2 text-slate-400 text-sm">
                    <li>국민은행</li>
                    <li>123-456-789012</li>
                    <li>예금주: (주)케이프로젝트</li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-500 text-sm">
                &copy; 2025 K-Project Mall. All rights reserved.
              </div>
            </div>
          </footer>
        </div>
      </MallCartProvider>
    </MallAuthProvider>
  );
}
