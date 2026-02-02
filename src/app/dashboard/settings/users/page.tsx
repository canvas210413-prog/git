import { getUsers } from "@/app/actions/users";
import { UserList } from "@/components/settings/user-list";
import { AddUserDialog } from "@/components/settings/add-user-dialog";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UserManagementPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  let users: any[] = [];
  let error = null;

  try {
    const result = await getUsers();
    users = result.users;
  } catch (e) {
    console.error("Error loading users:", e);
    error = e;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">사용자 정보를 불러올 수 없습니다.</h2>
        <p className="text-muted-foreground mt-2">데이터베이스 연결을 확인해주세요.</p>
        <pre className="mt-4 p-4 bg-slate-100 rounded text-left text-xs overflow-auto max-w-lg mx-auto">
          {String(error)}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">사용자 및 권한 관리</h2>
          <p className="text-muted-foreground">
            시스템 사용자 계정을 관리하고 접근 권한을 설정합니다.
          </p>
        </div>
        <AddUserDialog />
      </div>

      <UserList users={users} />
    </div>
  );
}