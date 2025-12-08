"use client";

import { cn } from "@/lib/utils";
import type { CardTheme } from "./card-themes";

interface ThemeSelectorProps {
  themes: CardTheme[];
  selectedTheme: CardTheme;
  onSelect: (theme: CardTheme) => void;
}

export function ThemeSelector({
  themes,
  selectedTheme,
  onSelect,
}: ThemeSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      {themes.map((theme) => (
        <button
          key={theme.id}
          onClick={() => onSelect(theme)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 transition-all",
            selectedTheme.id === theme.id
              ? "bg-primary/10 ring-primary ring-2"
              : "hover:bg-muted",
          )}
        >
          <div
            className="flex h-6 w-6 overflow-hidden rounded-md shadow-sm"
            style={{ border: `1px solid ${theme.border}` }}
          >
            <span
              className="h-full w-1/2"
              style={{ backgroundColor: theme.previewColor }}
            />
            <span
              className="h-full w-1/2"
              style={{ backgroundColor: theme.accent }}
            />
          </div>
          {/* 主题名称 - 下方 */}
          <span
            className={cn(
              "text-[10px] leading-none font-medium whitespace-nowrap",
              selectedTheme.id === theme.id
                ? "text-primary"
                : "text-muted-foreground",
            )}
          >
            {theme.name}
          </span>
        </button>
      ))}
    </div>
  );
}
