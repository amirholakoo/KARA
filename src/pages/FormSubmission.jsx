
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Form, FormField, FormAssignment, FormSubmission, User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Send, FileText, Clock, AlertTriangle, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';

export default function FormSubmissionPage() {
  const [form, setForm] = useState(null);
  const [fields, setFields] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null); // Added error state
  
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const assignmentId = params.get('assignment');
  const formId = params.get('form'); // Direct form access

  useEffect(() => {
    loadFormData();
  }, [assignmentId, formId]);

  const loadFormData = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors

      // Handle missing parameters gracefully without throwing an error
      if (!assignmentId && !formId) {
        setError('فرم یا تکلیف مشخصی برای بارگذاری وجود ندارد.');
        setLoading(false); // Ensure loading state is turned off
        return; // Exit early
      }
      
      const currentUser = await User.me();
      setUser(currentUser);

      let targetForm;
      let targetAssignment = null;

      if (assignmentId) {
        // Load from assignment
        targetAssignment = await FormAssignment.get(assignmentId);
        targetForm = await Form.get(targetAssignment.form_id);
        setAssignment(targetAssignment);
      } else if (formId) {
        // Direct form access
        targetForm = await Form.get(formId);
      }

      const formFields = await FormField.filter({ form_id: targetForm.id }, 'position');
      
      setForm(targetForm);
      setFields(formFields);

      // Initialize form data
      const initialData = {};
      formFields.forEach(field => {
        initialData[field.name] = field.field_type === 'checkbox' ? false : '';
      });
      setFormData(initialData);

    } catch (err) {
      console.error('Unexpected error loading form data:', err); // Log unexpected errors
      setError('یک خطای پیش‌بینی نشده در بارگذاری فرم رخ داد.'); // Set generic error message
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = fields.filter(field => field.is_required);
    for (const field of requiredFields) {
      const value = formData[field.name];
      if (!value || (typeof value === 'string' && !value.trim())) {
        alert(`لطفاً فیلد "${field.label}" را پر کنید`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Create submission data
      const submissionData = {
        form_id: form.id,
        form_version: form.version,
        submitter_id: user.id,
        submitted_at: new Date().toISOString(),
        data: formData
      };

      // Only add assignment_id if it exists
      if (assignmentId) {
        submissionData.assignment_id = assignmentId;
      }

      // Create submission
      await FormSubmission.create(submissionData);

      // Update assignment status if exists
      if (assignment && assignmentId) {
        await FormAssignment.update(assignmentId, {
          status: 'completed',
          completed_at: new Date().toISOString()
        });
      }

      alert('فرم با موفقیت ارسال شد!');
      navigate(createPageUrl('Dashboard'));

    } catch (error) {
      console.error('Error submitting form:', error);
      alert('خطا در ارسال فرم');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const value = formData[field.name] || '';

    switch (field.field_type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.helper_text || `وارد کردن ${field.label}`}
            required={field.is_required}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.helper_text || `وارد کردن ${field.label}`}
            rows={4}
            required={field.is_required}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.helper_text || `وارد کردن ${field.label}`}
            required={field.is_required}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.is_required}
          />
        );

      case 'datetime':
        return (
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.is_required}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={value === true}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
            />
            <label htmlFor={field.name} className="text-sm mr-2">
              {field.helper_text || 'تأیید می‌کنم'}
            </label>
          </div>
        );

      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleFieldChange(field.name, newValue)}
            required={field.is_required}
          >
            <SelectTrigger>
              <SelectValue placeholder={`انتخاب ${field.label}`} />
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

      case 'file':
        return (
          <Input
            type="file"
            onChange={(e) => {
              // For now, just store the file name
              // In a real app, you'd upload the file and store the URL
              handleFieldChange(field.name, e.target.files[0]?.name || '');
            }}
          />
        );

      case 'header':
        return (
          <h3 className="text-xl font-bold text-slate-700 mt-6 mb-2">
            {field.label}
          </h3>
        );

      case 'info':
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">{field.label}</p>
            {field.helper_text && (
              <p className="text-blue-600 text-sm mt-1">{field.helper_text}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
          <p className="text-slate-600">در حال بارگذاری فرم...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-red-50 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-lg text-center p-8 glass-effect">
          <CardHeader>
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <CardTitle className="text-2xl text-red-700">خطا در بارگذاری</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-8">{error}</p>
            <Button onClick={() => navigate(createPageUrl('Dashboard'))} className="hover-lift">
              <ArrowRight className="w-4 h-4 ml-2" />
              بازگشت به داشبورد
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If form is null after loading (and no error was set), it's an unexpected state, return null or handle appropriately.
  if (!form) return null; 

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Card className="glass-effect border-none shadow-lg">
          <CardHeader className="border-b border-blue-100">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800">{form.title}</CardTitle>
                <p className="text-slate-600 mt-1">{form.description}</p>
              </div>
            </div>
            {assignment && (
              <div className="mt-4 flex items-center gap-4 text-sm text-slate-500 pt-4 border-t border-blue-100">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  موعد: {format(new Date(assignment.due_at), 'HH:mm - yyyy/MM/dd', { locale: faIR })}
                </span>
                <span className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  گیرنده: {user?.full_name || 'شما'}
                </span>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {fields.map(field => (
                <div key={field.id} className="space-y-2">
                  {field.field_type !== 'header' && field.field_type !== 'info' ? (
                    <label className="text-lg font-semibold text-slate-700 flex items-center">
                      {field.label}
                      {field.is_required && <span className="text-red-500 mr-2">*</span>}
                    </label>
                  ) : null}
                  {renderField(field)}
                  {field.helper_text && field.field_type !== 'info' && field.field_type !== 'checkbox' && (
                    <p className="text-xs text-slate-500 mt-1">{field.helper_text}</p>
                  )}
                </div>
              ))}

              <div className="pt-6 border-t flex justify-end">
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={submitting} 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover-lift"
                >
                  <Send className="w-5 h-5 ml-2" />
                  {submitting ? 'در حال ارسال...' : 'ارسال فرم'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
