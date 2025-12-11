import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UserX, Clock } from "lucide-react"

interface StatsCardsProps {
  stats: {
    total: number
    withName: number
    withoutName: number
    recentCount: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const statsConfig = [
    {
      title: "总用户数",
      value: stats.total,
      icon: Users,
      description: "系统中的所有用户",
    },
    {
      title: "已设置姓名",
      value: stats.withName,
      icon: UserCheck,
      description: "已完善资料的用户",
    },
    {
      title: "未设置姓名",
      value: stats.withoutName,
      icon: UserX,
      description: "需要完善资料的用户",
    },
    {
      title: "最近新增",
      value: stats.recentCount,
      icon: Clock,
      description: "过去 7 天内创建",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statsConfig.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
