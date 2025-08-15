
import React from 'react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormAssignment } from "@/api/entities";
import { 
  FileText, 
  Clock, 
  AlertTriangle, 
  ArrowLeft, 
  Calendar,
  CheckCircle
} from "lucide-react";
import { format, isPast, differenceInHours } from "date-fns";
import { faIR } from "date-fns/locale";

export default function FormsSummary({ forms, onFormUpdate }) {
  const handleCompleteForm = (assignment) => {
    // Navigate to form completion page
    window.location.href = createPageUrl(`FormSubmission?assignment=${assignment.id}`);
  };

  return (
    <Card className="glass-effect border-none shadow-lg hover-lift">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl">
            <FileText className="w-6 h-6 text-purple-600" />
            فرم‌های امروز شما
          </CardTitle>
          <Link to={createPageUrl("Forms")}>
            <Button variant="outline" size="sm" className="hover-lift">
              مشاهده همه فرم‌ها
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {forms.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>شما امروز فرم خاصی برای پر کردن ندارید! ✅</p>
          </div>
        ) : (
          <div className="space-y-4">
            {forms.slice(0, 5).map((assignment) => {
              const isOverdue = isPast(new Date(assignment.due_at));
              const hoursLeft = differenceInHours(new Date(assignment.due_at), new Date());
              
              return (
                <div key={assignment.id} className="p-4 bg-white/70 rounded-lg border hover-lift transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-700 mb-2">{assignment.title}</h3>
                      
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <Badge className={assignment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                          {assignment.status === 'pending' ? 'در انتظار تکمیل' : 'تکمیل شده'}
                        </Badge>
                        {isOverdue && assignment.status === 'pending' && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 ml-1" />
                            عقب افتاده
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        موعد: {format(new Date(assignment.due_at), 'HH:mm - dd/MM', { locale: faIR })}
                      </span>
                      {!isOverdue && hoursLeft <= 24 && assignment.status === 'pending' && (
                        <span className="flex items-center gap-1 text-orange-600">
                          <Clock className="w-4 h-4" />
                          {hoursLeft < 1 ? 'کمتر از یک ساعت' : `${hoursLeft} ساعت باقیمانده`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {assignment.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleCompleteForm(assignment)}
                          className="bg-purple-600 hover:bg-purple-700 text-xs"
                        >
                          <CheckCircle className="w-3 h-3 ml-1" />
                          تکمیل فرم
                        </Button>
                      )}
                      
                      {assignment.status === 'completed' && (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="w-3 h-3 ml-1" />
                          تکمیل شده
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {forms.length > 5 && (
              <div className="text-center pt-4">
                <Link to={createPageUrl("Forms")}>
                  <Button variant="outline" className="hover-lift">
                    مشاهده {forms.length - 5} فرم دیگر
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
