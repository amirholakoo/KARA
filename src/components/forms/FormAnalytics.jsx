import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar
} from "lucide-react";

export default function FormAnalytics({ analytics }) {
  const {
    totalAssignments = 0,
    completedAssignments = 0,
    pendingAssignments = 0,
    overdueAssignments = 0,
    completionRate = 0,
    avgCompletionTime = 0,
    todaysSubmissions = 0
  } = analytics;

  const statsCards = [
    {
      title: "کل تکالیف",
      value: totalAssignments,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "تکمیل شده",
      value: completedAssignments,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "در انتظار",
      value: pendingAssignments,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "عقب افتاده",
      value: overdueAssignments,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50"
    }
  ];

  return (
    <Card className="glass-effect border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <TrendingUp className="w-6 h-6 text-purple-600" />
          آمار و تحلیل فرم‌ها
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <div key={index} className={`p-4 rounded-lg ${stat.bgColor} hover-lift`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color} persian-nums`}>
                    {stat.value}
                  </p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Completion Rate */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-slate-700">نرخ تکمیل فرم‌ها</h4>
            <span className="text-lg font-bold text-purple-600 persian-nums">
              {completionRate}%
            </span>
          </div>
          <Progress value={completionRate} className="h-3" />
          <p className="text-sm text-slate-500">
            {completedAssignments} از {totalAssignments} تکلیف تکمیل شده
          </p>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-50 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">ارسال‌های امروز</p>
              <p className="text-xl font-bold text-slate-800 persian-nums">
                {todaysSubmissions}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 rounded-lg">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">متوسط زمان تکمیل</p>
              <p className="text-xl font-bold text-slate-800">
                {avgCompletionTime > 0 ? `${avgCompletionTime} دقیقه` : 'نامشخص'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}