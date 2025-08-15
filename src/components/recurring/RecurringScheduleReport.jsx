import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskTemplate, Task } from "@/api/entities";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { 
  addDays, 
  addWeeks, 
  addMonths, 
  addYears, 
  startOfMonth, 
  endOfMonth, 
  differenceInDays,
  format,
  isBefore,
  isAfter,
  isSameDay
} from "date-fns";

export default function RecurringScheduleReport({ selectedTeam }) {
  const [scheduleItems, setScheduleItems] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedTeam) {
      loadScheduleData();
    }
  }, [selectedTeam, currentMonth]);

  const loadScheduleData = async () => {
    try {
      setLoading(true);
      
      // Load active templates for the team
      const templates = await TaskTemplate.filter({ 
        team_id: selectedTeam.id, 
        is_active: true 
      });
      
      // Load completed tasks from this month onwards
      const monthStart = startOfMonth(currentMonth);
      const allTasks = await Task.filter({ board_id: selectedTeam.id }); // This should filter by team, but we'll filter manually
      const monthTasks = allTasks.filter(task => 
        task.completed_at && 
        task.template_id &&
        new Date(task.completed_at) >= monthStart
      );
      
      setCompletedTasks(monthTasks);
      
      // Generate schedule for current month
      const scheduleData = generateMonthlySchedule(templates, currentMonth);
      setScheduleItems(scheduleData);
      
    } catch (error) {
      console.error('Error loading schedule data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlySchedule = (templates, month) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const today = new Date();
    const scheduleItems = [];

    templates.forEach(template => {
      if (!template.recurrence_rule) return;

      const { frequency, interval = 1 } = template.recurrence_rule;
      let currentDate = template.last_spawned_at ? 
        new Date(template.last_spawned_at) : 
        monthStart;

      // Generate occurrences for the month
      while (isBefore(currentDate, monthEnd) || isSameDay(currentDate, monthEnd)) {
        // Calculate next occurrence
        let nextDate;
        switch (frequency) {
          case 'daily':
            nextDate = addDays(currentDate, interval);
            break;
          case 'weekly':
            nextDate = addWeeks(currentDate, interval);
            break;
          case 'monthly':
            nextDate = addMonths(currentDate, interval);
            break;
          case 'yearly':
            nextDate = addYears(currentDate, interval);
            break;
          default:
            return;
        }

        if ((isAfter(nextDate, monthStart) || isSameDay(nextDate, monthStart)) && 
            (isBefore(nextDate, monthEnd) || isSameDay(nextDate, monthEnd))) {
          
          const isPast = isBefore(nextDate, today);
          const isToday = isSameDay(nextDate, today);
          const daysFromNow = differenceInDays(nextDate, today);
          
          scheduleItems.push({
            id: `${template.id}-${nextDate.getTime()}`,
            templateId: template.id,
            title: template.title,
            description: template.description,
            priority: template.priority,
            dueDate: nextDate,
            isPast,
            isToday,
            daysFromNow,
            template,
            estimatedHours: template.estimated_hours,
            frequency: getFrequencyText(template.recurrence_rule)
          });
        }

        currentDate = nextDate;
        
        // Safety check to prevent infinite loops
        if (currentDate > addYears(monthEnd, 1)) break;
      }
    });

    // Sort by due date
    return scheduleItems.sort((a, b) => a.dueDate - b.dueDate);
  };

  const getFrequencyText = (recurrenceRule) => {
    if (!recurrenceRule) return 'یکبار';
    
    const { frequency, interval = 1 } = recurrenceRule;
    
    const frequencies = {
      daily: interval === 1 ? 'روزانه' : `هر ${interval} روز`,
      weekly: interval === 1 ? 'هفتگی' : `هر ${interval} هفته`,
      monthly: interval === 1 ? 'ماهانه' : `هر ${interval} ماه`,
      yearly: interval === 1 ? 'سالانه' : `هر ${interval} سال`
    };
    
    return frequencies[frequency] || 'نامشخص';
  };

  const formatIranianDate = (date) => {
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
    
    // Simple Jalali conversion (approximate)
    const gregorianMonth = date.getMonth() + 1;
    const gregorianDay = date.getDate();
    
    let jalaliMonth = gregorianMonth - 3;
    if (jalaliMonth <= 0) {
      jalaliMonth += 12;
    }
    
    const monthName = persianMonths[jalaliMonth - 1] || persianMonths[0];
    
    let jalaliDay = gregorianDay;
    if (gregorianMonth <= 3) {
      jalaliDay += 10;
      if (jalaliDay > 30) jalaliDay -= 30;
    } else {
      jalaliDay -= 21;
      if (jalaliDay <= 0) jalaliDay += 30;
    }
    
    return `${dayName} ${jalaliDay} ${monthName}`;
  };

  const getDaysRemainingText = (daysFromNow, isPast, isToday) => {
    if (isToday) return '(امروز)';
    if (isPast) {
      const overdueDays = Math.abs(daysFromNow);
      if (overdueDays === 1) return '(۱ روز گذشته)';
      return `(${overdueDays} روز گذشته)`;
    }
    
    if (daysFromNow === 1) return '(فردا)';
    if (daysFromNow < 7) return `(${daysFromNow} روز باقیمانده)`;
    
    const weeks = Math.floor(daysFromNow / 7);
    if (weeks === 1) return '(۱ هفته باقیمانده)';
    if (weeks < 4) return `(${weeks} هفته باقیمانده)`;
    
    return `(${daysFromNow} روز باقیمانده)`;
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

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };

  const currentMonthName = formatIranianDate(currentMonth).split(' ').slice(-1)[0];

  if (loading) {
    return (
      <Card className="glass-effect border-none shadow-lg">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const upcomingTasks = scheduleItems.filter(item => !item.isPast);
  const pastTasks = scheduleItems.filter(item => item.isPast);

  return (
    <Card className="glass-effect border-none shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Calendar className="w-6 h-6 text-blue-600" />
            برنامه ماه {currentMonthName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Upcoming Tasks */}
        <div>
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            کارهای پیش رو ({upcomingTasks.length})
          </h3>
          
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p>هیچ کار تکراری پیش رو در این ماه وجود ندارد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map((item) => (
                <div key={item.id} className={`p-4 rounded-lg border transition-all hover-lift ${
                  item.isToday ? 'bg-blue-50 border-blue-200' : 
                  item.daysFromNow <= 3 ? 'bg-orange-50 border-orange-200' : 
                  'bg-white border-slate-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-slate-700">{item.title}</h4>
                        <Badge className={getPriorityColor(item.priority)}>
                          {getPriorityLabel(item.priority)}
                        </Badge>
                        <Badge variant="outline">
                          {item.frequency}
                        </Badge>
                      </div>
                      
                      {item.description && (
                        <p className="text-sm text-slate-600 mb-2">{item.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatIranianDate(item.dueDate)}
                        </span>
                        {item.estimatedHours && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {item.estimatedHours} ساعت
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-left">
                      <div className={`text-sm font-medium ${
                        item.isToday ? 'text-blue-600' : 
                        item.daysFromNow <= 3 ? 'text-orange-600' : 
                        'text-slate-500'
                      }`}>
                        {getDaysRemainingText(item.daysFromNow, item.isPast, item.isToday)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Tasks */}
        {pastTasks.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-600" />
              کارهای گذشته این ماه ({pastTasks.length})
            </h3>
            
            <div className="space-y-3">
              {pastTasks.map((item) => (
                <div key={item.id} className="p-4 rounded-lg border bg-slate-50 border-slate-200 opacity-75">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-slate-600">{item.title}</h4>
                        <Badge className={`${getPriorityColor(item.priority)} opacity-75`}>
                          {getPriorityLabel(item.priority)}
                        </Badge>
                        <Badge variant="outline" className="opacity-75">
                          {item.frequency}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatIranianDate(item.dueDate)}
                        </span>
                        {item.estimatedHours && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {item.estimatedHours} ساعت
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-left">
                      <div className="text-sm font-medium text-slate-500">
                        {getDaysRemainingText(item.daysFromNow, item.isPast, item.isToday)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}