import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export default function PerformanceKPIs({ data }) {
  if (!data) return null;

  const kpis = [
    { title: "کل کارهای ایجاد شده", value: data.totalTasks, icon: TrendingUp, color: "text-blue-600", bgColor: "bg-blue-50" },
    { title: "نرخ تکمیل", value: `${data.completionRate}%`, icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50" },
    { title: "کارهای عقب افتاده", value: data.overdueTasks, icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-50" },
    { title: "متوسط زمان تکمیل", value: data.avgCompletionTime, icon: Clock, color: "text-orange-600", bgColor: "bg-orange-50" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-4">شاخص‌های کلیدی عملکرد (KPIs)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <Card key={index} className="glass-effect border-none shadow-lg hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-1.5">
                  <p className="text-sm font-medium text-slate-600">{kpi.title}</p>
                  <p className={`text-3xl font-bold ${kpi.color} persian-nums`}>{kpi.value}</p>
                </div>
                <div className={`p-3 rounded-full ${kpi.bgColor}`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}