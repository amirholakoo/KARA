
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/api/entities";
import { Plus, X, Calendar, User as UserIcon } from "lucide-react";
import NotificationService from "../utils/notificationService";

// Simple Jalali/Persian date converter
const jalaliMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 
  'مرداد', 'شهریور', 'مهر', 'آبان', 
  'آذر', 'دی', 'بهمن', 'اسفند'
];

const jalaliDays = [
  'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 
  'چهارشنبه', 'پنج‌شنبه', 'جمعه'
];

// More accurate Gregorian to Jalali conversion
const gregorianToJalali = (gDate) => {
    const gy = gDate.getFullYear();
    const gm = gDate.getMonth() + 1;
    const gd = gDate.getDate();

    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    const gy2 = (gm > 2) ? (gy + 1) : gy;
    const days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
    let jy = -1595 + (33 * Math.floor(days / 12053));
    let newDays = days % 12053;
    jy += 4 * Math.floor(newDays / 1461);
    newDays %= 1461;
    if (newDays > 365) {
        jy += Math.floor((newDays - 1) / 365);
        newDays = (newDays - 1) % 365;
    }
    const jm = (newDays < 186) ? 1 + Math.floor(newDays / 31) : 7 + Math.floor((newDays - 186) / 30);
    const jd = 1 + ((newDays < 186) ? (newDays % 31) : ((newDays - 186) % 30));
    return { year: jy, month: jm, day: jd };
};

// More accurate Jalali to Gregorian conversion
const jalaliToGregorian = (jy, jm, jd) => {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    const j_d_m = [0, 31, 62, 93, 124, 155, 186, 216, 246, 276, 306, 336];
    let gy = jy + 621;
    let days = (365 * gy) + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400) - 292753 + j_d_m[jm - 1] + jd;
    gy = -2728 + (400 * Math.floor(days / 146097));
    let newDays = days % 146097;
    if (newDays > 36524) {
        gy += 100 * Math.floor(--newDays / 36524);
        newDays %= 36524;
        if (newDays >= 365) newDays++;
    }
    gy += 4 * Math.floor(newDays / 1461);
    newDays %= 1461;
    if (newDays > 365) {
        gy += Math.floor((newDays - 1) / 365);
        newDays = (newDays - 1) % 365;
    }
    let gd = newDays + 1;
    let gmIndex;
    for (gmIndex = 0; gmIndex < 13 && gd > g_d_m[gmIndex] + ((gmIndex === 2 && ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0))) ? 1 : 0); gmIndex++) {
        gd -= g_d_m[gmIndex] + ((gmIndex === 2 && ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0))) ? 1 : 0);
    }
    return new Date(gy, gmIndex - 1, gd);
};

const formatPersianDate = (date) => {
  const jalali = gregorianToJalali(date);
  const dayName = jalaliDays[date.getDay()];
  return `${dayName} ${jalali.day} ${jalaliMonths[jalali.month - 1]} ${jalali.year}`;
};

export default function CreateTaskModal({ boardId, listId, onClose, onCreate, user, teamMembers }) {
  const formatDateForInputLocal = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  const getInitialDueDate = () => {
    const date = new Date();
    date.setHours(9, 0, 0, 0); // Default to 9:00 AM
    return formatDateForInputLocal(date);
  };
  
  const today = new Date();
  const todayJalali = gregorianToJalali(today);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    due_at: getInitialDueDate(),
    due_at_persian: '',
    estimated_hours: '',
    assignee_id: user?.id || ''
  });

  // Persian date states
  const [persianDate, setPersianDate] = useState({
    year: todayJalali.year,
    month: todayJalali.month,
    day: todayJalali.day
  });
  const [persianTime, setPersianTime] = useState('09:00');
  const [usePersianDate, setUsePersianDate] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);

  const generateYearOptions = () => {
    const currentJYear = gregorianToJalali(new Date()).year;
    const years = [];
    for (let i = currentJYear - 2; i <= currentJYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  const generateDayOptions = (month) => {
    // For Jalali calendar, months 1-6 have 31 days, 7-11 have 30 days, month 12 has 29 or 30 days (leap year)
    // This simple logic assumes a non-leap year for month 12 for simplicity in dropdown, but the jalaliToGregorian handles leap years correctly.
    const daysInMonth = month <= 6 ? 31 : (month <= 11 ? 30 : 29); // Assuming month 12 always 29 for general dropdown
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const handlePersianDateChange = (field, value) => {
    const newPersianDate = { ...persianDate, [field]: parseInt(value) };
    setPersianDate(newPersianDate);
    
    // Convert to Gregorian and update due_at
    try {
      const gregorianDate = jalaliToGregorian(newPersianDate.year, newPersianDate.month, newPersianDate.day);
      const [hours, minutes] = persianTime.split(':');
      gregorianDate.setHours(parseInt(hours), parseInt(minutes));
      
      const persianDateString = `${newPersianDate.day} ${jalaliMonths[newPersianDate.month - 1]} ${newPersianDate.year}`;
      
      setNewTask({
        ...newTask,
        due_at: formatDateForInputLocal(gregorianDate),
        due_at_persian: persianDateString
      });
    } catch (error) {
      console.error('Error converting Persian date:', error);
      // Fallback or error indication
      setNewTask({
        ...newTask,
        due_at: '', // Clear due date on error
        due_at_persian: ''
      });
    }
  };

  const handlePersianTimeChange = (time) => {
    setPersianTime(time);
    
    if (usePersianDate) {
      try {
        const gregorianDate = jalaliToGregorian(persianDate.year, persianDate.month, persianDate.day);
        const [hours, minutes] = time.split(':');
        gregorianDate.setHours(parseInt(hours), parseInt(minutes));
        
        setNewTask({
          ...newTask,
          due_at: formatDateForInputLocal(gregorianDate)
        });
      } catch (error) {
        console.error('Error updating time:', error);
      }
    }
  };

  const handleCreate = async () => {
    if (!newTask.title.trim()) {
      alert('لطفاً عنوان کار را وارد کنید');
      return;
    }

    setIsLoading(true);
    try {
      const taskData = {
        ...newTask,
        board_id: boardId,
        list_id: listId,
        position: 999,
        due_at: newTask.due_at ? new Date(newTask.due_at).toISOString() : null,
        estimated_hours: newTask.estimated_hours ? parseFloat(newTask.estimated_hours) : null
      };

      // Add Persian date if using Persian calendar
      if (usePersianDate && newTask.due_at_persian) {
        taskData.due_at_persian = newTask.due_at_persian;
      } else if (newTask.due_at) {
        // Generate Persian date from Gregorian
        const gDate = new Date(newTask.due_at);
        taskData.due_at_persian = formatPersianDate(gDate);
      }

      const createdTask = await Task.create(taskData);
      
      // Send notification if task is assigned to someone other than creator
      if (createdTask.assignee_id && createdTask.assignee_id !== user?.id) {
        await NotificationService.notifyTaskAssigned(
          createdTask, 
          createdTask.assignee_id, 
          user?.id
        );
      }
      
      onCreate();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('خطا در ایجاد کار');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            ایجاد کار جدید
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">عنوان کار *</label>
            <Input
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              placeholder="عنوان کار را وارد کنید..."
              className="text-lg"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">توضیحات</label>
            <Textarea
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              rows={3}
              placeholder="توضیحات کار را وارد کنید..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">اولویت</label>
              <Select
                value={newTask.priority}
                onValueChange={(value) => setNewTask({...newTask, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">فوری</SelectItem>
                  <SelectItem value="high">بالا</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="low">پایین</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">مسئول</label>
              <Select
                value={newTask.assignee_id}
                onValueChange={(value) => setNewTask({...newTask, assignee_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب مسئول" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers && teamMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date Section */}
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">موعد انجام</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="usePersianDate"
                  checked={usePersianDate}
                  onChange={(e) => setUsePersianDate(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="usePersianDate" className="text-sm text-slate-600">
                  استفاده از تقویم شمسی
                </label>
              </div>
            </div>

            {usePersianDate ? (
              /* Persian Date Picker */
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {/* Year */}
                  <Select
                    value={persianDate.year.toString()}
                    onValueChange={(value) => handlePersianDateChange('year', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="سال" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateYearOptions().map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Month */}
                  <Select
                    value={persianDate.month.toString()}
                    onValueChange={(value) => handlePersianDateChange('month', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="ماه" />
                    </SelectTrigger>
                    <SelectContent>
                      {jalaliMonths.map((month, index) => (
                        <SelectItem key={index + 1} value={(index + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Day */}
                  <Select
                    value={persianDate.day.toString()}
                    onValueChange={(value) => handlePersianDateChange('day', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="روز" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateDayOptions(persianDate.month).map(day => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Time */}
                <Input
                  type="time"
                  value={persianTime}
                  onChange={(e) => handlePersianTimeChange(e.target.value)}
                  className="w-full"
                />

                {/* Preview */}
                {newTask.due_at_persian && (
                  <div className="text-sm text-slate-600 bg-white p-2 rounded border persian-nums">
                    📅 {newTask.due_at_persian} ساعت {persianTime}
                  </div>
                )}
              </div>
            ) : (
              /* Regular Date Picker */
              <Input
                type="datetime-local"
                value={newTask.due_at}
                onChange={(e) => setNewTask({...newTask, due_at: e.target.value})}
              />
            )}
          </div>

          {/* Estimated Hours */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">تخمین زمان (ساعت)</label>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={newTask.estimated_hours}
              onChange={(e) => setNewTask({...newTask, estimated_hours: e.target.value})}
              placeholder="تخمین زمان به ساعت"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 ml-2" />
            انصراف
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={isLoading || !newTask.title.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 ml-2" />
            ایجاد کار
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
