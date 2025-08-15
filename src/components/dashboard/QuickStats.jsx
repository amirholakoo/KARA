import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Users, 
  TrendingUp 
} from "lucide-react";

export default function QuickStats({ tasksCount, formsCount, overdueTasks, teamsCount }) {
  const stats = [
    {
      title: "کارهای امروز",
      value: tasksCount,
      icon: CheckCircle,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "فرم‌های امروز", 
      value: formsCount,
      icon: Clock,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      title: "کارهای عقب افتاده",
      value: overdueTasks,
      icon: AlertTriangle,
      color: "from-red-500 to-red-600", 
      bgColor: "bg-red-50",
      textColor: "text-red-600"
    },
    {
      title: "تیم‌های شما",
      value: teamsCount,
      icon: Users,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50", 
      textColor: "text-green-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="glass-effect border-none shadow-lg hover-lift overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-slate-800 persian-nums">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
            
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
              <span className="text-green-600 font-medium persian-nums">+۱۲٪</span>
              <span className="text-slate-500 mr-2">نسبت به هفته گذشته</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}