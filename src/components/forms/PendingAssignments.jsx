import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Clock, 
  User, 
  AlertTriangle, 
  FileText,
  Calendar,
  ExternalLink
} from "lucide-react";
import { format, isPast, differenceInHours } from "date-fns";
import { faIR } from "date-fns/locale";

export default function PendingAssignments({ assignments, users }) {
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? (user.full_name || user.email) : 'کاربر نامشخص';
  };

  return (
    <Card className="glass-effect border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Clock className="w-6 h-6 text-orange-600" />
            فرم‌های در انتظار تکمیل
            <Badge className="bg-orange-100 text-orange-800 persian-nums">
              {assignments.length}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>همه فرم‌ها تکمیل شده‌اند! 🎉</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {assignments.map((assignment) => {
              const isOverdue = isPast(new Date(assignment.due_at));
              const hoursLeft = differenceInHours(new Date(assignment.due_at), new Date());

              return (
                <div key={assignment.id} className="p-4 bg-white/70 rounded-lg border hover-lift">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-700 mb-2">
                        {assignment.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge className={isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                          {isOverdue ? 'عقب افتاده' : 'در انتظار'}
                        </Badge>
                        {isOverdue && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 ml-1" />
                            {Math.abs(hoursLeft)} ساعت دیر
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {getUserName(assignment.assignee_id)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          موعد: {format(new Date(assignment.due_at), 'HH:mm - dd/MM', { locale: faIR })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link 
                        to={createPageUrl(`FormSubmission?assignment=${assignment.id}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                          <ExternalLink className="w-3 h-3 ml-1" />
                          تکمیل
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}