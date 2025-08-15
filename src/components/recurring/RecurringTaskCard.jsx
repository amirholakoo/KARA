import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Clock, 
  Repeat,
  CheckSquare,
  AlertTriangle
} from "lucide-react";

export default function RecurringTaskCard({ template, onEdit, onToggle, onDelete, getRecurrenceText }) {
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

  return (
    <Card className={`hover-lift transition-all duration-200 ${
      template.is_active ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-slate-50/50'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg font-semibold text-slate-700">
              {template.title}
            </CardTitle>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getPriorityColor(template.priority)}>
                {getPriorityLabel(template.priority)}
              </Badge>
              
              <Badge variant="outline" className="flex items-center gap-1">
                <Repeat className="w-3 h-3" />
                {getRecurrenceText(template.recurrence_rule)}
              </Badge>
              
              <Badge className={template.is_active ? 
                'bg-green-100 text-green-800' : 
                'bg-slate-100 text-slate-600'
              }>
                {template.is_active ? 'فعال' : 'غیرفعال'}
              </Badge>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(template)}
            className={template.is_active ? 
              'text-orange-600 hover:text-orange-700 hover:bg-orange-50' : 
              'text-green-600 hover:text-green-700 hover:bg-green-50'
            }
            title={template.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
          >
            {template.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {template.description && (
          <p className="text-sm text-slate-600 line-clamp-2">
            {template.description}
          </p>
        )}

        {/* Details */}
        <div className="space-y-2">
          {template.estimated_hours && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              <span>تخمین زمان: {template.estimated_hours} ساعت</span>
            </div>
          )}
          
          {template.default_checklist && template.default_checklist.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckSquare className="w-4 h-4" />
              <span>{template.default_checklist.length} مورد چک‌لیست</span>
            </div>
          )}
        </div>

        {/* Default Checklist Preview */}
        {template.default_checklist && template.default_checklist.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-700 mb-2">چک‌لیست:</h4>
            <ul className="space-y-1">
              {template.default_checklist.slice(0, 3).map((item, index) => (
                <li key={index} className="text-xs text-slate-600 flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-300 rounded-full flex-shrink-0"></div>
                  <span>{item}</span>
                </li>
              ))}
              {template.default_checklist.length > 3 && (
                <li className="text-xs text-slate-500">
                  و {template.default_checklist.length - 3} مورد دیگر...
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(template)}
            className="hover:bg-blue-50 hover:text-blue-700"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(template.id)}
            className="hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}