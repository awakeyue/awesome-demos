"use client";

import { useState, useTransition } from "react";
import type { User, CreateUserInput, UpdateUserInput } from "@/types/user";
import { createUser, updateUser, deleteUser } from "@/actions/user-manage";
import { UserTable } from "./user-table";
import { UserDialog } from "./user-dialog";
import { DeleteDialog } from "./delete-dialog";
import { StatsCards } from "./stats-cards";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UsersPageClientProps {
  initialUsers: User[];
  initialStats: {
    total: number;
    withName: number;
    withoutName: number;
    recentCount: number;
  };
}

export function UsersPageClient({
  initialUsers,
  initialStats,
}: UsersPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleAdd = () => {
    setSelectedUser(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async (data: CreateUserInput | UpdateUserInput) => {
    startTransition(async () => {
      if (selectedUser) {
        // 更新用户
        const result = await updateUser(
          selectedUser.id,
          data as UpdateUserInput,
        );
        if (result.success) {
          toast.success("用户更新成功");
          router.refresh();
        } else {
          toast.error(result.error || "更新失败");
        }
      } else {
        // 创建用户
        const result = await createUser(data as CreateUserInput);
        if (result.success) {
          toast.success("用户创建成功");
          router.refresh();
        } else {
          toast.error(result.error || "创建失败");
        }
      }
      setIsDialogOpen(false);
    });
  };

  const handleConfirmDelete = () => {
    if (!selectedUser) return;

    startTransition(async () => {
      const result = await deleteUser(selectedUser.id);
      if (result.success) {
        toast.success("用户删除成功");
        router.refresh();
      } else {
        toast.error(result.error || "删除失败");
      }
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    });
  };

  return (
    <>
      <StatsCards stats={initialStats} />

      <div>
        <h2 className="mb-4 text-lg font-semibold">用户列表</h2>
        <UserTable
          users={initialUsers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
          isLoading={isPending}
        />
      </div>

      <UserDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        user={selectedUser}
        onSave={handleSave}
        isLoading={isPending}
      />

      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={selectedUser}
        onConfirm={handleConfirmDelete}
        isLoading={isPending}
      />
    </>
  );
}
