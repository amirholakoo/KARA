import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";

export default function ImportFormModal({ team, onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [previewFields, setPreviewFields] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    try {
      const text = await selectedFile.text();
      const fields = parseTabSeparatedFields(text);
      setPreviewFields(fields);
      
      // Auto-generate form title if not set
      if (!formTitle) {
        setFormTitle(`فرم وارداتی - ${selectedFile.name.replace('.txt', '')}`);
      }
    } catch (err) {
      setError('خطا در خواندن فایل');
      console.error('Error reading file:', err);
    }
  };

  const parseTabSeparatedFields = (text) => {
    // Split by tabs and clean up
    const rawFields = text.split('\t').map(field => field.trim()).filter(field => field.length > 0);
    
    // Track field names to handle duplicates
    const fieldCounts = {};
    const fields = [];

    rawFields.forEach((fieldLabel, index) => {
      // Clean up the field label
      let cleanLabel = fieldLabel.replace(/\n/g, ' ').replace(/"/g, '').trim();
      
      // Skip empty fields
      if (!cleanLabel) return;

      // Generate unique field name
      let baseFieldName = cleanLabel.replace(/\s+/g, '_').toLowerCase();
      baseFieldName = baseFieldName.replace(/[^\u0600-\u06FF\w_]/g, ''); // Keep Persian characters and basic Latin
      
      // Handle duplicates by adding suffix
      if (fieldCounts[baseFieldName]) {
        fieldCounts[baseFieldName]++;
        baseFieldName = `${baseFieldName}_${fieldCounts[baseFieldName]}`;
      } else {
        fieldCounts[baseFieldName] = 1;
      }

      // Determine field type based on content
      let fieldType = 'text';
      if (cleanLabel.includes('تصویر') || cleanLabel.includes('عکس') || cleanLabel.toLowerCase().includes('image')) {
        fieldType = 'file';
      } else if (cleanLabel.includes('تعداد') || cleanLabel.includes('میزان') || cleanLabel.includes('سایز')) {
        fieldType = 'number';
      } else if (cleanLabel.includes('علت') || cleanLabel.includes('توضیح')) {
        fieldType = 'textarea';
      } else if (cleanLabel.includes('روز') && (cleanLabel.includes('هفته') || cleanLabel.includes('ماه') || cleanLabel.includes('سال'))) {
        if (cleanLabel.includes('هفته')) {
          fieldType = 'select';
        } else {
          fieldType = 'number';
        }
      }

      fields.push({
        label: cleanLabel,
        name: baseFieldName,
        field_type: fieldType,
        is_required: false,
        position: index,
        options: fieldType === 'select' && cleanLabel.includes('هفته') ? 
          ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'] : []
      });
    });

    return fields;
  };

  const handleImport = async () => {
    if (!formTitle.trim()) {
      alert('لطفاً عنوان فرم را وارد کنید');
      return;
    }

    if (previewFields.length === 0) {
      alert('هیچ فیلدی برای وارد کردن یافت نشد');
      return;
    }

    setIsLoading(true);
    try {
      await onImport({
        title: formTitle,
        description: formDescription,
        fields: previewFields
      });
    } catch (error) {
      console.error('Error importing form:', error);
      alert('خطا در وارد کردن فرم');
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldTypeLabel = (type) => {
    const labels = {
      text: 'متن کوتاه',
      textarea: 'متن بلند', 
      number: 'عدد',
      select: 'لیست کشویی',
      file: 'فایل',
      date: 'تاریخ'
    };
    return labels[type] || type;
  };

  const getFieldTypeColor = (type) => {
    const colors = {
      text: 'bg-blue-100 text-blue-800',
      textarea: 'bg-green-100 text-green-800',
      number: 'bg-purple-100 text-purple-800',
      select: 'bg-orange-100 text-orange-800',
      file: 'bg-red-100 text-red-800',
      date: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            وارد کردن فرم از فایل
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Upload */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">انتخاب فایل</h3>
              <Input
                type="file"
                accept=".txt,.csv"
                onChange={handleFileChange}
                className="mb-4"
              />
              <p className="text-sm text-slate-500">
                فایل متنی با فیلدهای جداشده با Tab را انتخاب کنید
              </p>
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Details */}
          {previewFields.length > 0 && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">مشخصات فرم</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">عنوان فرم *</label>
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="عنوان فرم را وارد کنید..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">توضیحات فرم</label>
                  <Textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="توضیحات اختیاری..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Fields */}
          {previewFields.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">
                  پیش‌نمایش فیلدها ({previewFields.length} فیلد)
                </h3>
                
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {previewFields.map((field, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-700">{field.label}</h4>
                        <p className="text-sm text-slate-500">نام فیلد: {field.name}</p>
                        {field.options && field.options.length > 0 && (
                          <p className="text-xs text-slate-400">
                            گزینه‌ها: {field.options.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getFieldTypeColor(field.field_type)}`}>
                          {getFieldTypeLabel(field.field_type)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 ml-2" />
            انصراف
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={isLoading || previewFields.length === 0 || !formTitle.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <CheckCircle className="w-4 h-4 ml-2" />
            {isLoading ? 'در حال وارد کردن...' : `وارد کردن ${previewFields.length} فیلد`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}