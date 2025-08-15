import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Form, FormField } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Eye, Edit, Send, Calendar } from 'lucide-react';

export default function FormPreviewPage() {
  const [form, setForm] = useState(null);
  const [fields, setFields] = useState([]);
  const [previewData, setPreviewData] = useState({});
  const [loading, setLoading] = useState(true);
  
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const formId = params.get('formId');

  useEffect(() => {
    if (formId) {
      loadForm();
    }
  }, [formId]);

  const loadForm = async () => {
    try {
      setLoading(true);
      const targetForm = await Form.get(formId);
      const formFields = await FormField.filter({ form_id: formId }, 'position');
      
      setForm(targetForm);
      setFields(formFields);

      // Initialize preview data
      const initialData = {};
      formFields.forEach(field => {
        initialData[field.name] = field.field_type === 'checkbox' ? false : '';
      });
      setPreviewData(initialData);

    } catch (error) {
      console.error('Error loading form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setPreviewData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const renderField = (field, isPreview = true) => {
    const value = previewData[field.name] || '';

    const fieldWrapper = (content) => (
      <div key={field.id} className="space-y-2 mb-6">
        <label className="block text-sm font-semibold text-slate-700">
          {field.label}
          {field.is_required && <span className="text-red-500 mr-1">*</span>}
        </label>
        {field.helper_text && (
          <p className="text-xs text-slate-500">{field.helper_text}</p>
        )}
        {content}
      </div>
    );

    switch (field.field_type) {
      case 'text':
        return fieldWrapper(
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={isPreview ? 'نمونه متن...' : `وارد کردن ${field.label}`}
            disabled={!isPreview}
            className="bg-white"
          />
        );

      case 'textarea':
        return fieldWrapper(
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={isPreview ? 'نمونه متن طولانی...' : `وارد کردن ${field.label}`}
            rows={3}
            disabled={!isPreview}
            className="bg-white"
          />
        );

      case 'number':
        return fieldWrapper(
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={isPreview ? '123' : 'عدد وارد کنید'}
            disabled={!isPreview}
            className="bg-white"
          />
        );

      case 'checkbox':
        return fieldWrapper(
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
              disabled={!isPreview}
            />
            <span className="text-sm text-slate-600 mr-2">
              {isPreview ? 'تیک بزنید' : field.label}
            </span>
          </div>
        );

      case 'select':
        return fieldWrapper(
          <Select
            value={value}
            onValueChange={(val) => handleFieldChange(field.name, val)}
            disabled={!isPreview}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="انتخاب کنید..." />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'date':
        return fieldWrapper(
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            disabled={!isPreview}
            className="bg-white"
          />
        );

      case 'datetime':
        return fieldWrapper(
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            disabled={!isPreview}
            className="bg-white"
          />
        );

      case 'file':
        return fieldWrapper(
          <Input
            type="file"
            onChange={(e) => handleFieldChange(field.name, e.target.files?.[0]?.name || '')}
            disabled={!isPreview}
            className="bg-white"
          />
        );

      case 'header':
        return (
          <div key={field.id} className="mb-6 pt-4 border-t border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">{field.label}</h3>
          </div>
        );

      case 'info':
        return (
          <div key={field.id} className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800">{field.label}</p>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded-lg w-1/3"></div>
            <div className="h-64 bg-white/50 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="max-w-3xl mx-auto text-center py-16">
          <p className="text-slate-600">فرم یافت نشد</p>
          <Link to={createPageUrl('Forms')}>
            <Button className="mt-4">
              <ArrowRight className="w-4 h-4 ml-2" />
              بازگشت به فرم‌ها
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Forms')} className="flex items-center gap-2 text-slate-600 hover:text-blue-600">
              <ArrowRight className="w-5 h-5" />
              <span>بازگشت به فرم‌ها</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl(`FormEditor?formId=${formId}`)}>
              <Button variant="outline" className="hover-lift">
                <Edit className="w-4 h-4 ml-2" />
                ویرایش فرم
              </Button>
            </Link>
            <Link to={createPageUrl(`FormSubmission?form=${formId}`)}>
              <Button className="bg-green-600 hover:bg-green-700 hover-lift">
                <Send className="w-4 h-4 ml-2" />
                تست فرم
              </Button>
            </Link>
          </div>
        </div>

        {/* Preview Card */}
        <Card className="glass-effect border-none shadow-lg mb-6">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle className="text-2xl text-slate-800">پیش‌نمایش فرم</CardTitle>
                <p className="text-slate-600 mt-1">نمایش نحوه ظاهر فرم برای کاربران</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Form Preview */}
        <Card className="glass-effect border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-2xl font-bold text-slate-800">
              {form.title}
            </CardTitle>
            {form.description && (
              <p className="text-slate-600 mt-2">{form.description}</p>
            )}
          </CardHeader>
          <CardContent className="p-8">
            <form className="space-y-6">
              {fields.map(field => renderField(field, true))}
              
              {fields.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>این فرم هیچ فیلدی ندارد</p>
                  <Link to={createPageUrl(`FormEditor?formId=${formId}`)}>
                    <Button className="mt-4">
                      <Edit className="w-4 h-4 ml-2" />
                      افزودن فیلد
                    </Button>
                  </Link>
                </div>
              )}
              
              {fields.length > 0 && (
                <div className="pt-6 border-t border-slate-200">
                  <Button 
                    type="button"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover-lift"
                    disabled
                  >
                    <Send className="w-5 h-5 ml-2" />
                    ارسال فرم (پیش‌نمایش)
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}