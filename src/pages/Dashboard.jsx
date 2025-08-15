
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Task, FormAssignment, Team, User, Notification } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Users, 
  TrendingUp,
  Calendar,
  ArrowLeft,
  Plus
} from "lucide-react";
import { format, isToday, isPast, differenceInHours } from "date-fns";
import { faIR } from "date-fns/locale";

import QuickStats from "../components/dashboard/QuickStats";
import TasksSummary from "../components/dashboard/TasksSummary"; 
import FormsSummary from "../components/dashboard/FormsSummary";
import RecentActivity from "../components/dashboard/RecentActivity";
import NotificationCenter from "../components/dashboard/NotificationCenter";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [myForms, setMyForms] = useState([]);
  const [teams, setTeams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Load user's teams
      const userTeams = await Team.list();
      setTeams(userTeams);

      // Load today's tasks assigned to user
      const todayTasks = await Task.filter(
        { assignee_id: currentUser.id },
        '-due_at',
        20
      );
      setMyTasks(todayTasks.filter(task => {
        if (!task.due_at) return false;
        const dueDate = new Date(task.due_at);
        // Hide completed tasks from the dashboard summary
        return (isToday(dueDate) || isPast(dueDate)) && task.status !== 'done';
      }));

      // Load today's form assignments
      const todayForms = await FormAssignment.filter(
        { assignee_id: currentUser.id, status: 'pending' },
        'due_at',
        10
      );
      setMyForms(todayForms.filter(form => {
        const dueDate = new Date(form.due_at);
        return isToday(dueDate) || isPast(dueDate);
      }));

      // Load recent notifications
      const recentNotifications = await Notification.filter(
        { user_id: currentUser.id },
        '-created_date',
        10
      );
      setNotifications(recentNotifications);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200', 
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      urgent: 'فوری',
      high: 'بالا',
      medium: 'متوسط', 
      low: 'پایین'
    };
    return labels[priority] || 'متوسط';
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: 'bg-blue-100 text-blue-800',
      doing: 'bg-purple-100 text-purple-800',
      done: 'bg-green-100 text-green-800',
      stuck: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.todo;
  };

  const getStatusLabel = (status) => {
    const labels = {
      todo: 'انجام شود',
      doing: 'در حال انجام',
      done: 'انجام شده', 
      stuck: 'مسدود'
    };
    return labels[status] || 'انجام شود';
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white/50 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              داشبورد مدیریت کار
            </h1>
            <p className="text-slate-600">
              سلام {user?.full_name || 'کاربر عزیز'}، امروز {format(new Date(), 'EEEE، d MMMM yyyy', { locale: faIR })}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl("Forms")}>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover-lift">
                <Plus className="w-4 h-4 ml-2" />
                فرم جدید
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <QuickStats 
          tasksCount={myTasks.length}
          formsCount={myForms.length}
          overdueTasks={myTasks.filter(t => isPast(new Date(t.due_at))).length}
          teamsCount={teams.length}
        />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Tasks & Forms */}
          <div className="lg:col-span-2 space-y-8">
            <TasksSummary 
              tasks={myTasks}
              onTaskUpdate={loadDashboardData}
              user={user}
            />
            
            <FormsSummary 
              forms={myForms}
              onFormUpdate={loadDashboardData}
            />
          </div>

          {/* Right Column - Activity & Notifications */}
          <div className="space-y-8">
            <NotificationCenter 
              notifications={notifications}
              onNotificationUpdate={loadDashboardData}
            />
            
            <RecentActivity />
          </div>
        </div>

        {/* Teams Overview */}
        <Card className="glass-effect border-none shadow-lg hover-lift">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Users className="w-6 h-6 text-blue-600" />
                تیم‌های شما
              </CardTitle>
              <Link to={createPageUrl("Teams")}>
                <Button variant="outline" size="sm" className="hover-lift">
                  مشاهده همه
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.slice(0, 6).map((team) => (
                <div key={team.id} className="p-4 bg-white/70 rounded-lg border hover-lift cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: team.color }}
                    ></div>
                    <div>
                      <h3 className="font-semibold text-slate-700">{team.name}</h3>
                      <p className="text-sm text-slate-500">{team.name_en}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
