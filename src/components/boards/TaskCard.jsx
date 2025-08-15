import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, AlertTriangle, User, FileText, UserCheck } from "lucide-react";
import { isPast, formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

export default function TaskCard({ task, onClick, teamMembers }) {
  const isOverdue = task.due_at && isPast(new Date(task.due_at));

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

  const formatDueDate = () => {
    if (!task.due_at) return 'بدون موعد';
    
    // Use Persian date if available, otherwise convert Gregorian
    if (task.due_at_persian) {
      const time = new Date(task.due_at).toLocaleTimeString('fa-IR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      return `${task.due_at_persian} - ${time}`;
    }
    
    // Fallback to Gregorian display
    return formatDistanceToNow(new Date(task.due_at), { addSuffix: true, locale: faIR });
  };

  const handleDragStart = (event) => {
    event.dataTransfer.setData('text/plain', task.id);
  };

  // Find assignee information
  const assignee = task.assignee_id && teamMembers 
    ? teamMembers.find(member => member.id === task.assignee_id)
    : null;

  const getAssigneeInitials = (name) => {
    if (!name) return 'N';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0].charAt(0) + parts[1].charAt(0);
    }
    return name.charAt(0);
  };

  return (
    <Card 
      className="bg-white/70 hover-lift shadow-sm cursor-pointer" 
      onClick={() => onClick(task)}
      draggable
      onDragStart={handleDragStart}
    >
      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-slate-700">{task.title}</h3>

        {/* Priority and Overdue Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={getPriorityColor(task.priority)}>
            {getPriorityLabel(task.priority)}
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

        {/* Assignee Information */}
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
          <UserCheck className="w-4 h-4 text-slate-400" />
          {assignee ? (
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                  {getAssigneeInitials(assignee.full_name || assignee.email)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-slate-600">
                {assignee.full_name || assignee.email}
              </span>
            </div>
          ) : (
            <span className="text-sm text-slate-500 italic">
              تخصیص داده نشده
            </span>
          )}
        </div>

        {/* Description Snippet */}
        {task.description && (
          <p className="text-sm text-slate-500 line-clamp-2">
            {task.description}
          </p>
        )}
        
        {/* Complete Form Button */}
        {task.form_assignment_id && (
          <div className="pt-2">
            <Link 
              to={createPageUrl(`FormSubmission?assignment=${task.form_assignment_id}`)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()} // Prevent card's onClick from firing
            >
              <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                <FileText className="w-4 h-4 ml-2" />
                تکمیل فرم
              </Button>
            </Link>
          </div>
        )}

        {/* Footer with Due Date */}
        <div className="flex items-center justify-between text-sm text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="persian-nums">{formatDueDate()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}