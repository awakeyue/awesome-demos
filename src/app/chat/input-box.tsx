"use client";

import { Button } from "@/components/ui/button";
import { ChatStatus } from "ai";
import { ArrowUp, CircleStop, Plus, X } from "lucide-react"; // 引入 X 图标用于删除图片
import { useRef, useState, useCallback, memo, useEffect } from "react";
import Image from "next/image"; // 使用 Next.js 的 Image 组件（可选，也可以用普通 img）
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// 新增导入
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatHistoryStore, useModelStore } from "@/store/chat";
import { cn } from "@/lib/utils";
// import { ModelListConfig } from "./model-list-config";

interface InputBoxProps {
  onSubmit: (text: string, attachments: File[]) => void;
  status: ChatStatus;
  stop?: () => void;
}

export default function InputBox({ onSubmit, status, stop }: InputBoxProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]); // 存储图片文件
  const [isDragging, setIsDragging] = useState(false); // 拖拽状态
  const fileInputRef = useRef<HTMLInputElement>(null); // 隐藏的文件输入框引用
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 新增模型相关状态
  const { currentModelId, modelList, setCurrentModelId } = useModelStore();
  const currentModel =
    modelList.find((model) => model.id === currentModelId) || modelList[0];

  const disabled = status !== "ready";

  const { currentChatId } = useChatHistoryStore();

  useEffect(() => {
    // 在组件挂载时以及 currentChatId 变化时都尝试聚焦
    if (inputRef.current) {
      // 使用 requestAnimationFrame 确保 DOM 已经准备就绪
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [currentChatId]);

  // 处理图片选择（点击加号）
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    // 清空 value 防止重复选择同一文件不触发 onChange
    // e.target.value = "";
  };

  // 处理粘贴事件
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    const pastedFiles: File[] = [];

    for (const item of items) {
      if (item.type.indexOf("image") === 0) {
        const file = item.getAsFile();
        if (file) pastedFiles.push(file);
        e.preventDefault(); // 如果是图片，阻止默认粘贴（避免文件名粘贴到文本框）
      }
    }

    if (pastedFiles.length > 0) {
      setFiles((prev) => [...prev, ...pastedFiles]);
    }
  };

  // 处理拖拽进入
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  // 处理拖拽离开
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // 处理拖拽放下
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  }, []);

  // 删除已选图片
  const removeFile = useCallback((indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleSend = () => {
    // 如果既没有文字也没有图片，则不发送
    if (!input.trim() && files.length === 0) return;

    const message = input.trim();
    onSubmit(message, files); // 将图片传递给父组件
    setInput("");
    setFiles([]); // 发送后清空图片
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-background py-4">
      <div
        // 添加拖拽事件监听
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-input bg-card focus-within:ring-ring space-y-2 rounded-2xl border p-4 pb-2 text-sm shadow transition-all focus-within:border-transparent focus-within:ring-2 ${
          isDragging ? "border-primary ring-primary ring-2" : ""
        }`}
      >
        {/* 图片预览区域 */}
        <FilesPreview files={files} removeFile={removeFile} />

        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste} // 绑定粘贴事件
          placeholder={
            files.length > 0 ? "添加描述..." : "请输入内容，按 Enter 发送..."
          }
          rows={files.length > 0 ? 1 : 2} //如果有图片，文本框可以稍微变小一点
          className="text-foreground placeholder:text-muted-foreground max-h-32 w-full resize-none bg-transparent font-sans focus:outline-none"
        />

        {/* 隐藏的文件输入框 */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*" // 限制只能选图片
          multiple // 支持多选
        />

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button
              title="Add file or image"
              size="sm"
              variant={"ghost"}
              onClick={() => fileInputRef.current?.click()} // 点击触发文件选择
            >
              <Plus className="opacity-80" />
            </Button>

            {/* 模型选择 使用shadcn dropdown-menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  title="Select model"
                  size="sm"
                  variant="ghost"
                  className="max-w-[120px]"
                >
                  <span className="truncate text-xs">
                    {currentModel?.name || "Select Model"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                {modelList.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onSelect={() => setCurrentModelId(model.id)}
                    className={cn(
                      "hover:bg-accent/20 flex cursor-pointer flex-col items-start p-2",
                      model.id === currentModelId
                        ? "bg-accent text-accent-foreground"
                        : "",
                    )}
                  >
                    <span className="font-medium">{model.name}</span>
                    {/* <span className="text-muted-foreground text-xs">
                        {model.description}
                      </span> */}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* <Button title="Advanced settings" size={"sm"} variant={"ghost"}>
                <Settings2 className="opacity-80" />
              </Button> */}
            {/* <ModelListConfig /> */}
          </div>

          {status === "streaming" ? (
            <Button size="sm" onClick={() => stop && stop()}>
              <CircleStop size={20} />
              stop
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              // 只要有文字 OR 有文件，就可以发送
              disabled={disabled || (!input.trim() && files.length === 0)}
              size="sm"
              className="disabled:bg-white-400 rounded-lg px-3 py-2 disabled:text-white"
            >
              <ArrowUp size={20} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const FilesPreview = memo(function ({
  files,
  removeFile,
}: {
  files: File[];
  removeFile: (indexToRemove: number) => void;
}) {
  return (
    files.length > 0 && (
      <div className="flex flex-wrap gap-2 pb-2">
        {files.map((file, index) => (
          <div
            key={index}
            className="group bg-muted relative size-16 overflow-hidden rounded-md border"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Image
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  fill
                  className="size-full object-cover"
                />
              </TooltipTrigger>
              <TooltipContent side="top">{file.name}</TooltipContent>
            </Tooltip>
            <button
              onClick={() => removeFile(index)}
              className="absolute top-0.5 right-0.5 rounded-full bg-black/50 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    )
  );
});
FilesPreview.displayName = "FilesPreview";
