import { getUsers, getUserStats } from "@/actions/user-manage";
import { Users } from "lucide-react";
import { UsersPageClient } from "./users-page-client";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [users, stats] = await Promise.all([getUsers(), getUserStats()]);

  return (
    <div className="bg-background min-h-screen">
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-lg">
              <Users className="text-primary-foreground h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">用户管理</h1>
              <p className="text-muted-foreground text-sm">
                管理系统中的所有用户，支持添加、编辑和删除操作
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto space-y-8 px-4 py-8">
        <UsersPageClient initialUsers={users} initialStats={stats} />
      </main>
    </div>
  );
}
