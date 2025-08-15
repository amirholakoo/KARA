import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  X, 
  User, 
  Calendar, 
  FileText,
  Download,
  Copy
} from "lucide-react";
import { format } from "date-fns";
import { faIR } from "date-fns/locale";

export default function SubmissionViewModal({ submission, form, user, onClose }) {
  if (!submission) return null;

  const handleCopyData = () => {
    const dataText = Object.entries(submission.data || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    navigator.clipboard.writeText(dataText);
    alert('داده‌ها در کلیپ‌بورد کپی شدند');
  };

  const handleExportData = () => {
    const dataText = Object.entries(submission.data || {})
      .map(([key, value]) => `${key}\t${value}`)
      .join('\n');
    
    const blob = new Blob([dataText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form-submission-${submission.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            جزئیات فرم تکمیل شده
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header Info */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg text-slate-700 mb-4">
                    {form?.title || 'فرم حذف شده'}
                  </h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500" />
                      <span>تکمیل شده توسط: <strong>{user?.full_name || user?.email || 'کاربر نامشخص'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>زمان ارسال: {format(new Date(submission.submitted_at), 'HH:mm - EEEE، dd MMMM yyyy', { locale: faIR })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">
                      تکمیل شده
                    </Badge>
                    <Badge variant="outline" className="persian-nums">
                      نسخه {submission.form_version}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyData}>
                      <Copy className="w-4 h-4 ml-2" />
                      کپی داده‌ها
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportData}>
                      <Download className="w-4 h-4 ml-2" />
                      خروجی فایل
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submitted Data */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-slate-700 mb-4">داده‌های ارسال شده</h4>
              
              {Object.keys(submission.data || {}).length === 0 ? (
                <p className="text-slate-500 text-center py-8">هیچ داده‌ای ارسال نشده است</p>
              ) : (
                <div className="grid gap-4">
                  {Object.entries(submission.data || {}).map(([fieldName, fieldValue]) => (
                    <div key={fieldName} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-600">
                          {fieldName}
                        </label>
                        <div className="bg-white p-3 rounded border text-slate-700">
                          {fieldValue === null || fieldValue === undefined || fieldValue === '' ? (
                            <span className="text-slate-400 italic">خالی</span>
                          ) : typeof fieldValue === 'boolean' ? (
                            <Badge className={fieldValue ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {fieldValue ? 'بله' : 'خیر'}
                            </Badge>
                          ) : (
                            <span className="whitespace-pre-wrap">{String(fieldValue)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 ml-2" />
            بستن
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}