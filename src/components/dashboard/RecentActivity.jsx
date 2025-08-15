import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Activity, 
  CheckCircle, 
  Clock, 
  User, 
  FileText,
  ArrowRight
} from "lucide-react";

export default function RecentActivity() {
  // Mock activity data - in real app this would come from ActivityLog entity
  const recentActivities = [
    {
      id: 1,
      type: 'task_completed',
      title: 'بررسی کیفیت محصول A تکمیل شد',
      user: 'علی احمدی',
      time: '۲ ساعت پیش',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      id: 2,
      type: 'form_submitted',
      title: 'گزارش روزانه لابراتوار ارسال شد',
      user: 'مریم رضایی',
      time: '۴ ساعت پیش',
      icon: FileText,
      color: 'text-purple-600'
    },
    {
      id: 3,
      type: 'task_started',
      title: 'کار "نگهداری دستگاه B" آغاز شد',
      user: 'حسن کریمی',
      time: '۶ ساعت پیش',
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      id: 4,
      type: 'task_assigned',
      title: 'کار جدید به تیم تولید واگذار شد',
      user: 'سیستم',
      time: '۸ ساعت پیش',
      icon: User,
      color: 'text-orange-600'
    }
  ];

  return (
    <Card className="glass-effect border-none shadow-lg hover-lift">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-3 text-xl">
          <Activity className="w-6 h-6 text-green-600" />
          فعالیت‌های اخیر
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-all">
              <div className="p-2 bg-slate-50 rounded-lg">
                <activity.icon className={`w-4 h-4 ${activity.color}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 mb-1">
                  {activity.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <User className="w-3 h-3" />
                  <span>{activity.user}</span>
                  <span>•</span>
                  <span>{activity.time}</span>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-300" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}