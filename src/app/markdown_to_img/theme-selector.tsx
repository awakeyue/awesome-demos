"use client"

import { cn } from "@/lib/utils"
import type { CardTheme } from "@/lib/card-themes"

interface ThemeSelectorProps {
  themes: CardTheme[]
  selectedTheme: CardTheme
  onSelect: (theme: CardTheme) => void
}

export function ThemeSelector({ themes, selectedTheme, onSelect }: ThemeSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      {themes.map((theme) => (
        <button
          key={theme.id}
          onClick={() => onSelect(theme)}
          className={cn(
            "flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all",
            selectedTheme.id === theme.id ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted",
          )}
        >
          <div
            className="w-6 h-6 rounded-md shadow-sm overflow-hidden flex"
            style={{ border: `1px solid ${theme.border}` }}
          >
            <span className="w-1/2 h-full" style={{ backgroundColor: theme.previewColor }} />
            <span className="w-1/2 h-full" style={{ backgroundColor: theme.accent }} />
          </div>
          {/* 主题名称 - 下方 */}
          <span
            className={cn(
              "text-[10px] font-medium leading-none whitespace-nowrap",
              selectedTheme.id === theme.id ? "text-primary" : "text-muted-foreground",
            )}
          >
            {theme.name}
          </span>
        </button>
      ))}
    </div>
  )
}
