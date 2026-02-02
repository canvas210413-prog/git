import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || "USER";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1 flex">
        <aside className="w-64 border-r bg-background hidden md:block">
          <Sidebar userRole={userRole} />
        </aside>
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
