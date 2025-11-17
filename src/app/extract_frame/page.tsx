"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Upload,
  Play,
  Grid3x3,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ExtractionMethod } from "./extraction_method";
import { FrameExtractorService } from "./frame_extractor_service";

export default function VideoFrameExtractor() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [frameCount, setFrameCount] = useState(6);
  const [isProcessing, setIsProcessing] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(
    null,
  );
  const [extractionMethod, setExtractionMethod] = useState<ExtractionMethod>(
    ExtractionMethod.VIDEO_ELEMENT,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      const preview = URL.createObjectURL(file);
      setVideoPreview(preview);
      setFrames([]);
    }
  };

  const handleExtractFrames = async () => {
    if (!videoFile) return;

    setIsProcessing(true);
    try {
      const frames = await FrameExtractorService.extractFrames(
        extractionMethod,
        videoFile,
        frameCount,
      );
      if (frames.length < frameCount) {
        toast.info("抽帧数量大于视频帧数,将按最大帧数抽帧！");
      }
      console.log(frames);

      setFrames(frames);
    } catch (error) {
      toast.error("抽帧失败：" + (error as Error).message);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMethodChange = (method: ExtractionMethod) => {
    setExtractionMethod(method);
  };

  const handleFrameCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) || 0;
    if (val >= 1 && val <= 1000) {
      setFrameCount(val);
    }
  };

  const handlePrevFrame = () => {
    if (selectedFrameIndex !== null && selectedFrameIndex > 0) {
      setSelectedFrameIndex(selectedFrameIndex - 1);
    }
  };

  const handleNextFrame = () => {
    if (selectedFrameIndex !== null && selectedFrameIndex < frames.length - 1) {
      setSelectedFrameIndex(selectedFrameIndex + 1);
    }
  };

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        {/* 页面标题 */}
        <div className="mb-12">
          <h1 className="text-foreground mb-2 text-4xl font-bold">
            视频抽帧工具
          </h1>
          <p className="text-muted-foreground">
            从视频中智能提取关键帧，支持自定义抽帧数量
          </p>
        </div>

        {/* 上传和预览区域 */}
        <div className="mb-8">
          <Card className="overflow-hidden">
            <div className="p-8">
              {!videoPreview ? (
                // 上传区域
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="hover:bg-muted/30 flex cursor-pointer flex-col items-center justify-center rounded-lg py-16 transition-colors"
                >
                  <div className="bg-primary mb-4 rounded-full p-4">
                    <Upload className="text-primary-foreground h-8 w-8" />
                  </div>
                  <h3 className="text-foreground mb-2 text-xl font-semibold">
                    选择视频文件
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    拖拽或点击上传 MP4、WebM、MOV 等格式
                  </p>
                  <Button>选择文件</Button>
                </div>
              ) : (
                // 预览区域
                <div className="space-y-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Play className="text-primary h-5 w-5" />
                      <span className="text-foreground font-medium">
                        {videoFile?.name}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                    >
                      更换视频
                    </Button>
                  </div>
                  <div className="overflow-hidden rounded-lg bg-black">
                    <video
                      src={videoPreview}
                      controls
                      className="h-auto max-h-96 w-full"
                    />
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
            </div>
          </Card>
        </div>

        {videoPreview && (
          <div className="mb-8">
            <Card className="p-6">
              <div className="flex w-full flex-col items-end gap-4">
                <div className="w-full">
                  <label className="text-foreground mb-2 block text-sm font-semibold">
                    抽帧数量
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={frameCount}
                    onChange={handleFrameCountChange}
                    disabled={isProcessing}
                    className="bg-input border-border text-foreground placeholder-muted-foreground focus:ring-primary w-full rounded-md border px-4 py-2.5 transition-all focus:ring-2 focus:outline-none"
                  />
                  <p className="text-muted-foreground mt-1.5 text-xs">
                    范围: 1 - 1000
                  </p>
                </div>

                {/* 抽帧方式选择 */}
                <div className="w-full">
                  <label className="text-foreground mb-2 block text-sm font-semibold">
                    抽帧方式
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() =>
                        handleMethodChange(ExtractionMethod.VIDEO_ELEMENT)
                      }
                      className={`flex-1 rounded-md border p-3 text-center transition-colors ${
                        extractionMethod === ExtractionMethod.VIDEO_ELEMENT
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <span className="font-medium">
                        Video Element + Canvas
                      </span>
                      <p className="text-muted-foreground mt-1 text-xs">
                        默认方式，兼容性好，速度慢
                      </p>
                    </button>
                    <button
                      onClick={() =>
                        handleMethodChange(ExtractionMethod.MP4BOX)
                      }
                      className={`flex-1 rounded-md border p-3 text-center transition-colors ${
                        extractionMethod === ExtractionMethod.MP4BOX
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <span className="font-medium">
                        MP4Box + VideoDecorder + Canvas
                      </span>
                      <p className="text-muted-foreground mt-1 text-xs">
                        速度快，但是兼容性差
                      </p>
                    </button>
                  </div>
                </div>

                {/* 开始按钮 */}
                <div className="w-full">
                  <Button
                    onClick={handleExtractFrames}
                    disabled={isProcessing || !videoPreview}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    {isProcessing ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                        处理中...
                      </>
                    ) : (
                      <>
                        <Grid3x3 className="mr-2 h-5 w-5" />
                        开始抽帧
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 抽帧结果 */}
        {frames.length > 0 && (
          <div>
            <div className="mb-6 flex items-center gap-2">
              <h2 className="text-foreground text-2xl font-bold">抽帧结果</h2>
              <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm font-medium">
                {frames.length} 帧
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {frames.map((frame, index) => (
                <div
                  key={index}
                  className="group bg-card border-border hover:border-primary/50 hover:shadow-primary/10 relative cursor-pointer overflow-hidden rounded-lg border transition-all hover:shadow-lg"
                  onClick={() => setSelectedFrameIndex(index)}
                >
                  <div className="aspect-video bg-black">
                    <Image
                      src={frame || "/placeholder.svg"}
                      alt={`Frame ${index + 1}`}
                      className="object-contain"
                      fill
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
                    <ZoomIn className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 空状态提示 */}
        {videoPreview && frames.length === 0 && !isProcessing && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              配置抽帧参数后点击&quot;开始抽帧&quot;按钮
            </p>
          </div>
        )}
      </div>

      <Dialog
        open={selectedFrameIndex !== null}
        onOpenChange={() => setSelectedFrameIndex(null)}
      >
        <DialogContent className="h-[80vh] w-[80vw] !max-w-[80vw]">
          <div className="flex flex-1 items-center justify-center gap-4 py-8">
            {/* 上一张按钮 */}
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevFrame}
              disabled={selectedFrameIndex === null || selectedFrameIndex === 0}
              className="rounded-full bg-transparent"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            {/* 图片展示 */}
            {selectedFrameIndex !== null && frames[selectedFrameIndex] && (
              <div className="flex h-full w-full flex-1 flex-col items-center">
                <div className="relative h-full w-full">
                  <Image
                    src={frames[selectedFrameIndex] || "/placeholder.svg"}
                    alt={`Frame ${selectedFrameIndex + 1}`}
                    fill
                    className="rounded-lg object-contain"
                  />
                </div>
                <p className="text-muted-foreground mt-4 text-sm">
                  {selectedFrameIndex + 1} / {frames.length}
                </p>
              </div>
            )}

            {/* 下一张按钮 */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextFrame}
              disabled={
                selectedFrameIndex === null ||
                selectedFrameIndex === frames.length - 1
              }
              className="rounded-full bg-transparent"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
