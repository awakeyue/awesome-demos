"use client";

import { useState, useRef, useCallback } from "react";
import { toPng, toJpeg } from "html-to-image";
import {
  Download,
  Copy,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownEditor } from "./markdown-editor";
import { MarkdownPreview } from "./markdown-preview";
import { ThemeSelector } from "./theme-selector";
import { ExportSettings } from "./export-settings";
import { cardThemes, type CardTheme } from "./card-themes";

const defaultMarkdown = `# 🚀 欢迎使用 Markdown to Image

这是一个强大的 **Markdown 转图片** 工具，让你的文字变成精美的卡片！

## ✨ 特性

- 🎨 **多种主题** - 8 种精心设计的配色方案
- 💻 **代码高亮** - 支持多种编程语言
- 📱 **响应式** - 完美适配各种屏幕
- 🖼️ **高清导出** - 支持 PNG/JPEG 格式

## 📝 代码示例

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}! 👋\`);
}

greet("World");
\`\`\`

## 💡 提示

> 试试切换不同的主题，找到最适合你的风格！

---

Made with ❤️ by Markdown to Image
`;

function Toast({
  message,
  type,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-top-2 fixed top-4 left-1/2 z-50 -translate-x-1/2 duration-300">
      <div
        className={`flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg ${
          type === "success"
            ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
            : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        }`}
      >
        {type === "success" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>(cardThemes[0]);
  const [padding, setPadding] = useState(32);
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [watermarkText, setWatermarkText] = useState(
    "Made with Markdown to Image",
  );
  const [showWatermark, setShowWatermark] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const exportImage = useCallback(async () => {
    if (!previewRef.current) return;

    setIsExporting(true);
    try {
      const exportFn = format === "png" ? toPng : toJpeg;
      const dataUrl = await exportFn(previewRef.current, {
        pixelRatio: 2,
        quality: format === "jpeg" ? 0.95 : undefined,
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `markdown-image-${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();

      showToast("图片已导出！", "success");
    } catch (error) {
      console.error("Export failed:", error);
      showToast("导出失败，请重试", "error");
    } finally {
      setIsExporting(false);
    }
  }, [format]);

  const copyToClipboard = useCallback(async () => {
    if (!previewRef.current) return;

    setIsExporting(true);
    try {
      const dataUrl = await toPng(previewRef.current, {
        pixelRatio: 2,
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);

      showToast("图片已复制到剪贴板！", "success");
    } catch (error) {
      console.error("Copy failed:", error);
      showToast("复制失败，请重试", "error");
    } finally {
      setIsExporting(false);
    }
  }, []);

  const getBackgroundBase = () => {
    if (selectedTheme.background.includes("gradient")) {
      return selectedTheme.previewColor;
    }
    return selectedTheme.background;
  };

  return (
    <div className="bg-background min-h-screen">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <main className="container mx-auto px-4 py-4">
        <div className="bg-muted/30 border-border mb-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <Sparkles className="text-primary h-5 w-5" />
            <span className="text-sm font-medium">Markdown to Image</span>
          </div>

          {/* 主题选择器 */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">主题:</span>
            <ThemeSelector
              themes={cardThemes}
              selectedTheme={selectedTheme}
              onSelect={setSelectedTheme}
            />
          </div>

          <ExportSettings
            padding={padding}
            onPaddingChange={setPadding}
            format={format}
            onFormatChange={setFormat}
            showWatermark={showWatermark}
            onWatermarkChange={setShowWatermark}
            watermarkText={watermarkText}
            onWatermarkTextChange={setWatermarkText}
          />

          {/* 导出按钮 */}
          <div className="flex w-40 items-center gap-2">
            <Button onClick={exportImage} disabled={isExporting} size="sm">
              {isExporting ? <Loader className="animate-spin" /> : <Download />}
              导出
            </Button>
            <Button
              onClick={copyToClipboard}
              disabled={isExporting}
              variant="outline"
              size="sm"
            >
              <Copy className="mr-1 h-4 w-4" />
              复制
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* 左侧：编辑器 */}
          <Card className="overflow-hidden">
            <CardContent className="h-[calc(100vh-200px)] min-h-[500px] p-0">
              <MarkdownEditor value={markdown} onChange={setMarkdown} />
            </CardContent>
          </Card>

          {/* 右侧：预览 */}
          <Card className="overflow-hidden bg-[#1a1a1a]">
            <CardContent className="h-[calc(100vh-200px)] min-h-[500px] overflow-auto p-0">
              <div className="flex min-h-full items-center justify-center p-4">
                <div
                  ref={previewRef}
                  style={{
                    width: "100%",
                    maxWidth: "672px",
                    padding: `${padding}px`,
                    background: `linear-gradient(135deg, ${selectedTheme.accent}33, ${getBackgroundBase()})`,
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  <div
                    style={{
                      background: selectedTheme.background,
                      border: `1px solid ${selectedTheme.border}`,
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <MarkdownPreview content={markdown} theme={selectedTheme} />
                  </div>
                  {showWatermark && watermarkText && (
                    <div
                      style={{
                        textAlign: "center",
                        paddingTop: "12px",
                        paddingBottom: "4px",
                        fontSize: "11px",
                        color: selectedTheme.foreground,
                        opacity: 0.6,
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {watermarkText}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
