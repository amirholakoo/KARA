import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notification } from "@/api/entities";
import { 
  Bell, 
  BellOff, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Users, 
  CheckCircle,
  Eye,
  Mail,
  Settings
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

export default function NotificationCenter({ notifications, onNotificationUpdate }) {
  const [showAll, setShowAll] = useState(false);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await Notification.update(notificationId, {
        is_read: true,
        read_at: new Date().toISOString()
      });
      onNotificationUpdate();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => 
          Notification.update(n.id, {
            is_read: true,
            read_at: new Date().toISOString()
          })
        )
      );
      onNotificationUpdate();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      task_reminder: Clock,
      task_overdue: AlertTriangle,
      assignment: Bell,
      form_assignment: FileText,
      form_reminder: Clock,
      form_overdue: AlertTriangle,
      team_assignment: Users,
      task_status_changed: CheckCircle,
      recurring_tasks_generated: Settings
    };
    const Icon = icons[type] || Bell;
    return <Icon className="w-4 h-4" />;
  };

  const getNotificationColor = (type) => {
    const colors = {
      task_overdue: 'text-red-600',
      form_overdue: 'text-red-600',
      task_reminder: 'text-orange-600',
      form_reminder: 'text-orange-600',
      assignment: 'text-blue-600',
      form_assignment: 'text-purple-600',
      team_assignment: 'text-green-600',
      task_status_changed: 'text-slate-600',
      recurring_tasks_generated: 'text-indigo-600'
    };
    return colors[type] || 'text-slate-600';
  };

  const getPriorityBadge = (type) => {
    const urgent = ['task_overdue', 'form_overdue'];
    const high = ['task_reminder', 'form_reminder'];
    
    if (urgent.includes(type)) {
      return <Badge className="bg-red-100 text-red-800 text-xs">فوری</Badge>;
    }
    if (high.includes(type)) {
      return <Badge className="bg-orange-100 text-orange-800 text-xs">مهم</Badge>;
    }
    return null;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const displayNotifications = showAll ? notifications : notifications.slice(0, 5);

  return (
    <Card className="glass-effect border-none shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="relative">
              <Bell className="w-6 h-6 text-orange-600" />
              {unreadCount > 0 && (
                <div className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center persian-nums">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </div>
            اعلان‌ها
          </CardTitle>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              <CheckCircle className="w-4 h-4 ml-1" />
              همه را خوانده علامت‌گذاری کن
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {displayNotifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <BellOff className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="font-semibold mb-1">اعلانی وجود ندارد</h3>
            <p className="text-sm">همه چیز به‌روز است!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                  !notification.is_read ? 'bg-blue-50/50' : ''
                }`}
                onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-semibold text-sm ${
                        !notification.is_read ? 'text-slate-800' : 'text-slate-600'
                      }`}>
                        {notification.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(notification.type)}
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(notification.created_date), { 
                          addSuffix: true, 
                          locale: faIR 
                        })}
                      </span>
                      
                      {notification.metadata?.all_channels?.includes('email') && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Mail className="w-3 h-3" />
                          ایمیل ارسال شد
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {notifications.length > 5 && (
          <div className="p-4 border-t border-slate-100 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-blue-600 hover:text-blue-700"
            >
              {showAll ? (
                <>
                  <Eye className="w-4 h-4 ml-1" />
                  نمایش کمتر
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 ml-1" />
                  مشاهده همه ({notifications.length})
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}