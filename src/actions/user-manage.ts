"use server";

import type { User, CreateUserInput, UpdateUserInput } from "@/types/user";

// TODO: 替换为实际的 Prisma 操作
import prisma from "@/lib/prisma";

/**
 * 获取所有用户
 */
export async function getUsers(): Promise<User[]> {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return users;
  } catch (error) {
    console.error("Database query failed:", error);
    // 返回空数组而不是抛出错误，或者根据业务需求处理
    return [];
  }
}

/**
 * 获取单个用户
 */
export async function getUserById(id: number): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { id },
  });
}

/**
 * 创建用户
 */
export async function createUser(
  data: CreateUserInput,
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name || null,
      },
    });
    return { success: true, user };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "该邮箱已被使用" };
    }
    return { success: false, error: "创建用户失败" };
  }
}

/**
 * 更新用户
 */
export async function updateUser(
  id: number,
  data: UpdateUserInput,
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.name !== undefined && { name: data.name || null }),
      },
    });
    return { success: true, user };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "该邮箱已被使用" };
    }
    return { success: false, error: "更新用户失败" };
  }
}

/**
 * 删除用户
 */
export async function deleteUser(
  id: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.user.delete({
      where: { id },
    });
    return { success: true };
  } catch {
    return { success: false, error: "删除用户失败" };
  }
}

/**
 * 获取用户统计数据
 */
export async function getUserStats(): Promise<{
  total: number;
  withName: number;
  withoutName: number;
  recentCount: number;
}> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [total, withName, recentCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { name: { not: null } } }),
    prisma.user.count({ where: { createdAt: { gte: oneWeekAgo } } }),
  ]);

  return {
    total,
    withName,
    withoutName: total - withName,
    recentCount,
  };
}
