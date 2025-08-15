
import React from 'react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task } from "@/api/entities";
import { List } from "@/api/entities"; // Import the List entity
import { FormAssignment } from "@/api/entities"; // Import the FormAssignment entity
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  User,
  Zap
} from "lucide-react";
import { format, isPast, differenceInHours, differenceInDays } from "date-fns";
import { faIR } from "date-fns/locale";

export default function TasksSummary({ tasks, onTaskUpdate, user }) {
  const handleSnooze = async (task, minutes) => {
    if (task.snooze_count >= 2) {
      alert('این کار بیش از حد مجاز به تعویق افتاده است!');
      return;
    }

    try {
      const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
      await Task.update(task.id, {
        ...task,
        due_at: snoozeUntil.toISOString(),
        snooze_count: (task.snooze_count || 0) + 1,
        last_snoozed_at: new Date().toISOString(),
        snooze_reason: minutes === 15 ? '۱۵ دقیقه' : minutes === 60 ? '۱ ساعت' : '۴ ساعت'
      });
      onTaskUpdate && onTaskUpdate();
    } catch (error) {
      console.error('Error snoozing task:', error);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      const updatePayload = { ...task, status: newStatus };
      if (newStatus === 'done') {
        updatePayload.completed_at = new Date().toISOString();
        updatePayload.completed_by = user?.id;

        // Find the 'Done' list for the task's board and update the list_id
        const allLists = await List.filter({ board_id: task.board_id });
        const doneList = allLists.find(l => l.name_en === 'Done');
        if (doneList) {
          updatePayload.list_id = doneList.id;
        }

        // If this task is linked to a form assignment, complete that too
        if (task.form_assignment_id) {
          await FormAssignment.update(task.form_assignment_id, {
            status: 'completed',
            completed_at: new Date().toISOString()
          });
        }
      } else if (newStatus === 'doing') {
        // Find the 'Doing' list for the task's board and update the list_id
        const allLists = await List.filter({ board_id: task.board_id });
        const doingList = allLists.find(l => l.name_en === 'Doing');
        if (doingList) {
          updatePayload.list_id = doingList.id;
        }
      }
      await Task.update(task.id, updatePayload);
      onTaskUpdate && onTaskUpdate();
    } catch (error) {
      console.error('Error updating task status:', error);
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

  const formatJalaliDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);

    // Persian day names
    const persianDays = [
      'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه',
      'پنج‌شنبه', 'جمعه', 'شنبه'
    ];

    // Persian month names
    const persianMonths = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر',
      'مرداد', 'شهریور', 'مهر', 'آبان',
      'آذر', 'دی', 'بهمن', 'اسفند'
    ];

    const dayName = persianDays[date.getDay()];
    const time = format(date, 'HH:mm');

    // Simple Jalali approximation (This is a simplified conversion and not a full accurate Jalali calendar library)
    // For a more accurate conversion, consider using a dedicated Jalali date library.
    const gregorianMonth = date.getMonth() + 1;
    const gregorianDay = date.getDate();

    let jalaliMonth = gregorianMonth - 3;
    if (jalaliMonth <= 0) jalaliMonth += 12;

    const monthName = persianMonths[jalaliMonth - 1] || persianMonths[0];

    let jalaliDay = gregorianDay;
    if (gregorianMonth <= 3) { // Adjust for months before April (approximate)
      jalaliDay += 10; // Roughly moves 10 days forward
      if (jalaliDay > 30) jalaliDay -= 30; // Handle month overflow
    } else { // Adjust for months after April (approximate)
      jalaliDay -= 21; // Roughly moves 21 days backward
      if (jalaliDay <= 0) jalaliDay += 30; // Handle month underflow
    }
    // Note: The above approximation for jalaliDay and jalaliMonth is very basic and not accurate for all dates.
    // It's just to match the outline's requirement for a "simple approximation".

    return `${dayName} ${jalaliDay} ${monthName}، ${time}`;
  };

  const getDaysRemainingText = (dueAt) => {
    if (!dueAt) return '';

    const daysLeft = differenceInDays(new Date(dueAt), new Date());
    const isOverdue = isPast(new Date(dueAt));

    if (isOverdue) {
      const overdueDays = Math.abs(daysLeft);
      if (overdueDays === 0) return '(امروز عقب افتاده)';
      if (overdueDays === 1) return '(۱ روز عقب افتاده)'; // Specific for 1 day
      return `(${overdueDays} روز عقب افتاده)`;
    }

    if (daysLeft === 0) return '(امروز)';
    if (daysLeft === 1) return '(فردا)';
    return `(${daysLeft} روز باقیمانده)`;
  };

  return (
    <Card className="glass-effect border-none shadow-lg hover-lift">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl">
            <CheckCircle className="w-6 h-6 text-blue-600" />
            کارهای امروز شما
          </CardTitle>
          <Link to={createPageUrl("Boards")}>
            <Button variant="outline" size="sm" className="hover-lift">
              مشاهده کانبان
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>شما امروز کار خاصی ندارید! 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.slice(0, 5).map((task) => {
              const isOverdue = isPast(new Date(task.due_at));

              return (
                <div key={task.id} className="p-4 bg-white/70 rounded-lg border hover-lift transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-700 mb-2">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-slate-500 mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getPriorityColor(task.priority)}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {getStatusLabel(task.status)}
                        </Badge>
                        {isOverdue && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 ml-1" />
                            عقب افتاده
                          </Badge>
                        )}
                        {task.snooze_count > 0 && (
                          <Badge variant="outline" className="text-orange-600">
                            <Clock className="w-3 h-3 ml-1" />
                            {task.snooze_count} بار به تعویق افتاده
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatJalaliDate(task.due_at)}
                      </span>
                      <span className={`text-xs font-medium mr-5 ${
                        isOverdue ? 'text-red-500' : 'text-orange-600'
                      }`}>
                        {getDaysRemainingText(task.due_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {task.status !== 'done' && task.snooze_count < 2 && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSnooze(task, 15)}
                            className="text-xs hover:bg-orange-50"
                          >
                            ۱۵ دقیقه
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSnooze(task, 60)}
                            className="text-xs hover:bg-orange-50"
                          >
                            ۱ ساعت
                          </Button>
                        </div>
                      )}

                      {task.status === 'todo' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(task, 'doing')}
                          className="bg-purple-600 hover:bg-purple-700 text-xs"
                        >
                          شروع کار
                        </Button>
                      )}

                      {task.status === 'doing' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(task, 'done')}
                          className="bg-green-600 hover:bg-green-700 text-xs"
                        >
                          انجام شد
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {tasks.length > 5 && (
              <div className="text-center pt-4">
                <Link to={createPageUrl("Boards")}>
                  <Button variant="outline" className="hover-lift">
                    مشاهده {tasks.length - 5} کار دیگر
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
