"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { CardTheme } from "@/lib/card-themes"

interface MarkdownPreviewProps {
  content: string
  theme: CardTheme
}

export function MarkdownPreview({ content, theme }: MarkdownPreviewProps) {
  return (
    <div
      className="markdown-preview p-8 min-h-full"
      style={{
        background: theme.background,
        color: theme.foreground,
        ["--tw-prose-body" as string]: theme.foreground,
        ["--tw-prose-headings" as string]: theme.foreground,
        ["--tw-prose-links" as string]: theme.accent,
        ["--code-bg" as string]: theme.codeBackground,
        ["--code-fg" as string]: theme.codeForeground,
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "")
            const language = match ? match[1] : ""

            return !inline && match ? (
              <div className="relative my-4">
                {language && (
                  <span
                    className="absolute top-0 right-0 px-2 py-1 text-xs rounded-bl-md font-mono"
                    style={{
                      backgroundColor: theme.accent,
                      color: theme.background,
                      opacity: 0.9,
                    }}
                  >
                    {language}
                  </span>
                )}
                <pre
                  className="overflow-auto rounded-lg p-4 text-sm font-mono"
                  style={{
                    backgroundColor: theme.codeBackground,
                    color: theme.codeForeground,
                  }}
                >
                  <code {...props}>{String(children).replace(/\n$/, "")}</code>
                </pre>
              </div>
            ) : (
              <code
                className="font-mono"
                style={{
                  backgroundColor: theme.codeBackground,
                  color: theme.codeForeground,
                  padding: "0.125rem 0.375rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.875rem",
                }}
                {...props}
              >
                {children}
              </code>
            )
          },
          pre({ children }) {
            return <>{children}</>
          },
          h1: ({ children }) => (
            <h1
              className="text-3xl font-bold mb-4 pb-2"
              style={{ color: theme.foreground, borderBottom: `2px solid ${theme.accent}` }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold mt-6 mb-3" style={{ color: theme.foreground }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold mt-4 mb-2" style={{ color: theme.foreground }}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-3 leading-relaxed" style={{ color: theme.foreground }}>
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-3 space-y-1" style={{ color: theme.foreground }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-3 space-y-1" style={{ color: theme.foreground }}>
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              className="underline underline-offset-2 hover:opacity-80 transition-opacity"
              style={{ color: theme.accent }}
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className="border-l-4 pl-4 my-4 italic"
              style={{ borderLeftColor: theme.accent, color: theme.foreground, opacity: 0.85 }}
            >
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-6" style={{ borderColor: theme.border }} />,
          table: ({ children }) => (
            <div className="overflow-auto my-4">
              <table className="w-full border-collapse" style={{ borderColor: theme.border }}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th
              className="border px-4 py-2 text-left font-semibold"
              style={{ backgroundColor: theme.codeBackground, borderColor: theme.border }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border px-4 py-2" style={{ borderColor: theme.border }}>
              {children}
            </td>
          ),
          img: ({ src, alt }) => (
            <img src={src || "/placeholder.svg"} alt={alt} className="max-w-full h-auto rounded-lg my-4" />
          ),
          strong: ({ children }) => (
            <strong className="font-bold" style={{ color: theme.foreground }}>
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
