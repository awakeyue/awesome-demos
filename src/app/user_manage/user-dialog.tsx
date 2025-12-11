"use client";

import { useEffect } from "react";
import type { User, CreateUserInput, UpdateUserInput } from "@/types/user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSave: (data: CreateUserInput | UpdateUserInput) => void;
  isLoading?: boolean; // 添加 loading 状态
}

interface FormData {
  email: string;
  name: string;
}

export function UserDialog({
  open,
  onOpenChange,
  user,
  onSave,
  isLoading,
}: UserDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      email: "",
      name: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        email: user?.email || "",
        name: user?.name || "",
      });
    }
  }, [open, user, reset]);

  const onSubmit = (data: FormData) => {
    onSave({
      email: data.email,
      name: data.name || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? "编辑用户" : "添加用户"}</DialogTitle>
          <DialogDescription>
            {user ? "修改用户信息后点击保存。" : "填写用户信息后点击添加。"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">
                邮箱 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                disabled={isLoading}
                {...register("email", {
                  required: "邮箱不能为空",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "请输入有效的邮箱地址",
                  },
                })}
              />
              {errors.email && (
                <p className="text-destructive text-sm">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                placeholder="张三"
                disabled={isLoading}
                {...register("name")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {user ? "保存" : "添加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
