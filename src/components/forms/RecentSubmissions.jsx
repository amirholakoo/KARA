import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  User, 
  Calendar,
  Eye,
  Download,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { faIR } from "date-fns/locale";

export default function RecentSubmissions({ submissions, users, forms, onViewSubmission }) {
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? (user.full_name || user.email) : 'کاربر نامشخص';
  };

  const getFormTitle = (formId) => {
    const form = forms.find(f => f.id === formId);
    return form ? form.title : 'فرم حذف شده';
  };

  return (
    <Card className="glass-effect border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl">
            <CheckCircle className="w-6 h-6 text-green-600" />
            آخرین فرم‌های تکمیل شده
            <Badge className="bg-green-100 text-green-800 persian-nums">
              {submissions.length}
            </Badge>
          </CardTitle>
          <Button variant="outline" size="sm" className="hover-lift">
            <Download className="w-4 h-4 ml-2" />
            خروجی Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>هنوز فرمی تکمیل نشده است</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {submissions.map((submission) => (
              <div key={submission.id} className="p-4 bg-white/70 rounded-lg border hover-lift">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-700 mb-2">
                      {getFormTitle(submission.form_id)}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-2">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {getUserName(submission.submitter_id)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(submission.submitted_at), 'HH:mm - dd/MM yyyy', { locale: faIR })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 ml-1" />
                        تکمیل شده
                      </Badge>
                      <Badge variant="outline" className="text-slate-600 persian-nums">
                        نسخه {submission.form_version}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewSubmission(submission)}
                      className="hover:bg-blue-50"
                    >
                      <Eye className="w-3 h-3 ml-1" />
                      مشاهده
                    </Button>
                  </div>
                </div>

                {/* Preview of submission data */}
                <div className="mt-3 p-3 bg-slate-50 rounded text-sm">
                  <p className="text-slate-600 mb-1">نمونه داده‌های ارسالی:</p>
                  <div className="text-slate-500 space-y-1">
                    {Object.entries(submission.data || {}).slice(0, 3).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="font-medium min-w-0 flex-1 truncate">{key}:</span>
                        <span className="text-slate-400 min-w-0 flex-1 truncate">{String(value)}</span>
                      </div>
                    ))}
                    {Object.keys(submission.data || {}).length > 3 && (
                      <p className="text-slate-400 persian-nums">
                        ... و {Object.keys(submission.data || {}).length - 3} فیلد دیگر
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}