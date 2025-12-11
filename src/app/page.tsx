"use client";

import { ArrowUpRight, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  const demos = [
    {
      id: 1,
      title: "视频抽帧",
      description: "使用多种方式，实现视频抽帧功能",
      link: "/extract_frame",
      tags: ["JS", "视频抽帧"],
    },
    {
      id: 2,
      title: "AI 聊天",
      description: "使用多种模型，于AI聊天",
      link: "/chat",
      tags: ["AI", "SSE"],
    },
    {
      id: 3,
      title: "markdown 转图片",
      description: "可以将markdown转为图片，可用于复制ai回复，生成图片",
      link: "/markdown_to_img",
      tags: ["markdown", "html-to-image"],
    },
    {
      id: 4,
      title: "操作数据库",
      description: "创建一个用户管理页面，实现数据库的增删查改",
      link: "/user_manage",
      tags: ["prisma", "数据库"],
    },
  ];

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <div className="animate-fade-in mb-12 flex items-center justify-between sm:mb-16">
          <div>
            <h1 className="animate-slide-in-up stagger-1 mb-4 text-4xl font-bold text-balance sm:text-5xl">
              开发案例
            </h1>
            <p className="text-muted-foreground animate-slide-in-up stagger-2 max-w-xl text-base sm:text-lg">
              记录开发过程中遇到的有趣案例和实验探索。
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="border-border hover:bg-accent animate-scale-in stagger-3 flex-shrink-0 rounded-lg border p-2 transition-all duration-300 hover:scale-110"
            aria-label="切换主题"
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="space-y-3">
          {demos.map((demo) => (
            <Link
              key={demo.id}
              href={demo.link}
              className={`group border-border bg-card hover:bg-accent/50 hover:border-foreground/20 block rounded-lg border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-sm sm:p-5`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="group-hover:text-foreground mb-2 text-lg font-semibold transition-colors sm:text-xl">
                    {demo.title}
                  </h2>
                  <p className="text-muted-foreground mb-3 text-sm sm:text-base">
                    {demo.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {demo.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-secondary text-secondary-foreground inline-block rounded-md px-2.5 py-1 text-xs font-medium transition-transform duration-300 group-hover:scale-105"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowUpRight className="text-muted-foreground group-hover:text-foreground mt-1 h-5 w-5 flex-shrink-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="border-border animate-fade-in mt-16 border-t pt-8 sm:mt-20">
          <p className="text-muted-foreground text-sm">
            想要讨论项目或有想法？欢迎联系我。
          </p>
          <div className="mt-4 flex gap-4 text-sm">
            <a
              href="#"
              className="text-foreground hover:text-muted-foreground transition-colors"
            >
              邮件
            </a>
            <a
              href="#"
              className="text-foreground hover:text-muted-foreground transition-colors"
            >
              GitHub
            </a>
            <a
              href="#"
              className="text-foreground hover:text-muted-foreground transition-colors"
            >
              推特
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
