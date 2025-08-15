import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Play, Pause, Clock, Repeat, Users, FileText } from "lucide-react";

export default function ScheduleCard({ schedule, form, onEdit, onToggle, onDelete }) {
  const getRecurrenceText = (recurrenceRule) => {
    if (!recurrenceRule) return 'یکبار';
    const { frequency, interval = 1 } = recurrenceRule;
    const frequencies = {
      daily: interval === 1 ? 'روزانه' : `هر ${interval} روز`,
      weekly: interval === 1 ? 'هفتگی' : `هر ${interval} هفته`,
      monthly: interval === 1 ? 'ماهانه' : `هر ${interval} ماه`,
    };
    return frequencies[frequency] || 'نامشخص';
  };

  return (
    <Card className={`hover-lift transition-all duration-200 ${
      schedule.is_active ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-slate-50/50'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-slate-700">
            {schedule.title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(schedule)}
            className={schedule.is_active ? 
              'text-orange-600 hover:text-orange-700 hover:bg-orange-50' : 
              'text-green-600 hover:text-green-700 hover:bg-green-50'
            }
            title={schedule.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
          >
            {schedule.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={schedule.is_active ? 
            'bg-green-100 text-green-800' : 
            'bg-slate-100 text-slate-600'
          }>
            {schedule.is_active ? 'فعال' : 'غیرفعال'}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Repeat className="w-3 h-3" />
            {getRecurrenceText(schedule.recurrence_rule)}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            ساعت {schedule.due_time}
          </Badge>
        </div>
        
        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <FileText className="w-4 h-4 text-purple-600" />
            <span>فرم: <strong>{form?.title || 'فرم حذف شده'}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Users className="w-4 h-4 text-blue-600" />
            <span>{schedule.assignee_ids?.length || 0} نفر</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(schedule)}
            className="hover:bg-blue-50 hover:text-blue-700"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(schedule.id)}
            className="hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}