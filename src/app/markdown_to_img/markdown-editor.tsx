"use client"

import { Textarea } from "@/components/ui/textarea"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <span className="text-sm font-medium text-muted-foreground">Markdown 编辑器</span>
        <span className="text-xs text-muted-foreground">{value.length} 字符</span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="在这里输入 Markdown 内容..."
        className="flex-1 resize-none border-0 rounded-none font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0 bg-card"
      />
    </div>
  )
}
