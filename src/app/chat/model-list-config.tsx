// components/chat/AdvancedSettingsButton.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useModelStore } from "@/store/chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Trash2,
  Edit,
  Plus,
  AlertTriangle,
  ArrowLeftRight,
  Settings2,
} from "lucide-react";
// [改] 引入 useCallback
import { useState, useMemo, useCallback, memo } from "react";
import { ModelInfo } from "@/types/chat";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner"; // 假设您已安装并配置了 sonner

// --- 辅助组件：为 Input/Textarea 添加 Label ---
const LabeledInput = ({
  label,
  ...props
}: React.ComponentProps<typeof Input> & { label: string }) => (
  <div className="space-y-1">
    <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {label}
    </label>
    <Input {...props} />
  </div>
);

const LabeledTextarea = ({
  label,
  ...props
}: React.ComponentProps<typeof Textarea> & { label: string }) => (
  <div className="space-y-1">
    <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {label}
    </label>
    <Textarea {...props} />
  </div>
);

// --- 抽屉组件 Props ---
interface ModelSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 辅助函数：创建一个新的空模型对象
const createNewModel = (): ModelInfo => ({
  id: "",
  name: "",
  description: "",
  baseURL: "",
  apiKey: "",
});

function ModelSettingsDrawer({ open, onOpenChange }: ModelSettingsDrawerProps) {
  const { modelList, setModelList, setCurrentModelId, currentModelId } =
    useModelStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempModel, setTempModel] = useState<ModelInfo | null>(null);

  // --- CRUD 操作逻辑 (使用 useCallback 优化) ---

  // 1. 开始编辑或添加新模型
  const handleEdit = useCallback((model: ModelInfo | "new") => {
    if (model === "new") {
      setTempModel(createNewModel());
      setEditingId("new");
    } else {
      setTempModel({ ...model }); // 创建副本，避免直接修改 store
      setEditingId(model.id);
    }
  }, []); // 依赖项为空数组

  // 2. 取消编辑/添加
  const handleCancel = useCallback(() => {
    setEditingId(null);
    setTempModel(null);
  }, []); // 依赖项为空数组

  // 3. 保存模型
  const handleSave = useCallback(() => {
    if (!tempModel) return;

    // 基本验证
    if (!tempModel.name || !tempModel.baseURL || !tempModel.apiKey) {
      toast.error("名称、基础URL和API密钥不能为空。");
      return;
    }

    // 检查是否为新增
    if (editingId === "new") {
      const modelToSave = { ...tempModel };
      // [注意] setModelList 需要访问 modelList，所以需要作为依赖
      setModelList([...modelList, modelToSave]);
      setEditingId(null);
      setTempModel(null);
      toast.success("新模型添加成功。");
    } else {
      // 编辑现有模型
      const updatedList = modelList.map((m) =>
        m.id === editingId ? tempModel : m,
      );
      setModelList(updatedList as ModelInfo[]);
      setEditingId(null);
      setTempModel(null);
      toast.success(`${tempModel.name} 已更新。`);
    }
  }, [tempModel, editingId, modelList, setModelList]); // 依赖项包括 setModelList, modelList, tempModel, editingId

  // 4. 删除模型
  const handleDelete = useCallback(
    (idToDelete: string) => {
      // 默认模型（前缀为 ep-）不应该被删除
      if (idToDelete.startsWith("ep-")) {
        toast.warning("默认模型不能被删除。");
        return;
      }

      // 如果删除的是当前选中的模型，则切换到第一个默认模型
      if (idToDelete === currentModelId) {
        // 找到第一个非自定义的模型作为默认切换目标
        const defaultModel = modelList.find((m) => m.id.startsWith("ep-"));
        if (defaultModel) {
          setCurrentModelId(defaultModel.id);
        } else {
          setCurrentModelId(modelList.length > 0 ? modelList[0].id : "");
        }
      }

      const updatedList = modelList.filter((m) => m.id !== idToDelete);
      setModelList(updatedList);
      toast.success("模型已删除。");
    },
    [currentModelId, modelList, setCurrentModelId, setModelList],
  ); // 依赖项包括所有从 store 中取出的 state/setter

  // --- 编辑表单组件 (useMemo 保持不变，但依赖的函数已经是 stable 的) ---
  const ModelEditForm = useMemo(() => {
    if (!tempModel || !editingId) return null;

    return (
      <div className="bg-card space-y-4 rounded-lg border p-4">
        <h3 className="flex items-center space-x-2 text-lg font-semibold">
          {editingId === "new" ? "添加新模型" : `编辑: ${tempModel.name}`}
        </h3>
        <LabeledInput
          label="模型ID"
          placeholder="例如：custom-model-id"
          disabled={editingId !== "new"}
          value={tempModel.id}
          onChange={(e) => setTempModel({ ...tempModel, id: e.target.value })}
        />
        {/* 使用 LabeledInput 组件 */}
        <LabeledInput
          label="模型名称"
          placeholder="例如：我的自定义GPT"
          value={tempModel.name}
          onChange={(e) => setTempModel({ ...tempModel, name: e.target.value })}
        />
        {/* 使用 LabeledTextarea 组件 */}
        <LabeledTextarea
          label="描述"
          placeholder="可选的描述"
          value={tempModel.description}
          onChange={(e) =>
            setTempModel({ ...tempModel, description: e.target.value })
          }
        />
        <LabeledInput
          label="基础URL (端点)"
          placeholder="例如：https://api.openai.com/v1"
          value={tempModel.baseURL}
          onChange={(e) =>
            setTempModel({ ...tempModel, baseURL: e.target.value })
          }
        />
        <LabeledInput
          label="API密钥 (加密展示)"
          placeholder="例如：$MY_CUSTOM_API_KEY 或 sk-..."
          value={tempModel.apiKey}
          type="password"
          autoComplete="new-password"
          onChange={(e) =>
            setTempModel({ ...tempModel, apiKey: e.target.value })
          }
        />
        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button onClick={handleSave}>保存模型</Button>
        </div>
      </div>
    );
  }, [tempModel, editingId, handleCancel, handleSave]);

  // --- 模型列表组件 (useCallback 保持不变，但依赖的函数已经是 stable 的) ---
  const ModelList = useCallback(
    () => (
      <div className="space-y-3">
        {modelList.map((model) => (
          <div
            key={model.id}
            className="bg-muted/20 flex items-center justify-between rounded-lg border p-3"
          >
            <div className="space-y-0.5">
              <p className="flex items-center text-sm font-medium">
                {model.name}
                {model.id === currentModelId && (
                  <span className="bg-primary/20 text-primary ml-2 rounded-full px-2 py-0.5 text-xs">
                    当前
                  </span>
                )}
                {/* 仅显示非默认模型的ID（自定义模型） */}
                {model.id.startsWith("custom-") && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground ml-2 cursor-help text-xs">
                        (ID)
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs break-all">{model.id}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </p>
              <p className="text-muted-foreground max-w-lg truncate text-xs">
                {model.baseURL || "未定义基础URL"}
              </p>
            </div>

            <div className="flex space-x-1">
              {/* 切换为当前模型按钮 */}
              {model.id !== currentModelId && (
                <Button
                  variant="ghost"
                  size="icon"
                  title="切换为当前模型"
                  onClick={() => {
                    setCurrentModelId(model.id);
                    toast.success(`已切换到 ${model.name}`);
                  }}
                >
                  <ArrowLeftRight size={16} />
                </Button>
              )}

              {/* 编辑按钮 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(model)}
                disabled={editingId === model.id}
              >
                <Edit size={16} />
              </Button>

              {/* 删除按钮 (默认模型不能删) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(model.id)}
                    disabled={model.id.startsWith("ep-")} // 禁用默认模型删除
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </TooltipTrigger>
                {model.id.startsWith("ep-") && (
                  <TooltipContent>
                    <span className="flex items-center text-xs">
                      <AlertTriangle
                        size={14}
                        className="mr-1 text-yellow-500"
                      />
                      默认模型不能被删除。
                    </span>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    ),
    [
      modelList,
      editingId,
      currentModelId,
      setCurrentModelId, // 依赖项
      handleDelete, // 依赖项
      handleEdit, // 依赖项
    ],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col px-2 sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>模型配置</SheetTitle>
          <SheetDescription>
            管理您的AI模型端点，包括自定义API、基础URL和密钥。
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 space-y-6 py-6 pr-6">
          {/* 1. 编辑/新增表单 */}
          {editingId && ModelEditForm}

          {/* 2. 添加新模型按钮 */}
          {!editingId && (
            <div className="pb-4">
              <Button onClick={() => handleEdit("new")} className="w-full">
                <Plus size={16} className="mr-2" />
                添加新自定义模型
              </Button>
            </div>
          )}

          {/* 3. 模型列表 */}
          {!editingId && ModelList()}
        </ScrollArea>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="secondary">关闭</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// 这是一个被抽离出来的按钮，它只负责打开抽屉
const ModelListConfig = memo(function () {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 1. 按钮 - 负责打开抽屉 */}
      <Button
        title="高级设置"
        size={"sm"}
        variant={"ghost"}
        onClick={() => setOpen(true)}
      >
        <Settings2 className="opacity-80" />
      </Button>

      {/* 2. 模型配置抽屉 */}
      <ModelSettingsDrawer open={open} onOpenChange={setOpen} />
    </>
  );
});
ModelListConfig.displayName = "ModelListConfig";

export { ModelListConfig };
