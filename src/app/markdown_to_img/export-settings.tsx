"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Settings2 } from "lucide-react"

interface ExportSettingsProps {
  padding: number
  onPaddingChange: (value: number) => void
  format: "png" | "jpeg"
  onFormatChange: (value: "png" | "jpeg") => void
  showWatermark: boolean
  onWatermarkChange: (value: boolean) => void
  watermarkText: string
  onWatermarkTextChange: (value: string) => void
}

export function ExportSettings({
  padding,
  onPaddingChange,
  format,
  onFormatChange,
  showWatermark,
  onWatermarkChange,
  watermarkText,
  onWatermarkTextChange,
}: ExportSettingsProps) {
  return (
    <div className="flex items-center gap-3">
      {/* 格式选择 */}
      <Select value={format} onValueChange={(v) => onFormatChange(v as "png" | "jpeg")}>
        <SelectTrigger className="h-8 w-20 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="png">PNG</SelectItem>
          <SelectItem value="jpeg">JPEG</SelectItem>
        </SelectContent>
      </Select>

      {/* 更多设置 */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 px-2 bg-transparent">
            <Settings2 className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">卡片边距</Label>
                <span className="text-xs text-muted-foreground">{padding}px</span>
              </div>
              <Slider value={[padding]} onValueChange={([v]) => onPaddingChange(v)} min={0} max={64} step={8} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">显示水印</Label>
                <Switch checked={showWatermark} onCheckedChange={onWatermarkChange} />
              </div>
              {showWatermark && (
                <Input
                  value={watermarkText}
                  onChange={(e) => onWatermarkTextChange(e.target.value)}
                  placeholder="输入水印文字..."
                  className="h-8 text-xs"
                />
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
