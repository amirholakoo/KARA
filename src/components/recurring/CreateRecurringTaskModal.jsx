import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Clock, Calendar, Repeat } from "lucide-react";

export default function CreateRecurringTaskModal({ template, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    title: template?.title || '',
    description: template?.description || '',
    priority: template?.priority || 'medium',
    estimated_hours: template?.estimated_hours || '',
    default_assignee_id: template?.default_assignee_id || '',
    recurrence_rule: template?.recurrence_rule || {
      frequency: 'weekly',
      interval: 1,
      days_of_week: []
    },
    default_checklist: template?.default_checklist || [],
    is_active: template?.is_active !== undefined ? template.is_active : true
  });

  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('لطفاً عنوان کار را وارد کنید');
      return;
    }

    setIsLoading(true);
    try {
      await onCreate({
        ...formData,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null
      });
    } catch (error) {
      console.error('Error creating/updating template:', error);
      alert('خطا در ذخیره الگو');
    } finally {
      setIsLoading(false);
    }
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setFormData({
        ...formData,
        default_checklist: [...formData.default_checklist, newChecklistItem.trim()]
      });
      setNewChecklistItem('');
    }
  };

  const removeChecklistItem = (index) => {
    setFormData({
      ...formData,
      default_checklist: formData.default_checklist.filter((_, i) => i !== index)
    });
  };

  const handleRecurrenceChange = (field, value) => {
    setFormData({
      ...formData,
      recurrence_rule: {
        ...formData.recurrence_rule,
        [field]: value
      }
    });
  };

  const handleDayToggle = (day) => {
    const currentDays = formData.recurrence_rule.days_of_week || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    handleRecurrenceChange('days_of_week', newDays);
  };

  const weekDays = [
    { key: 'sunday', label: 'یکشنبه' },
    { key: 'monday', label: 'دوشنبه' },
    { key: 'tuesday', label: 'سه‌شنبه' },
    { key: 'wednesday', label: 'چهارشنبه' },
    { key: 'thursday', label: 'پنج‌شنبه' },
    { key: 'friday', label: 'جمعه' },
    { key: 'saturday', label: 'شنبه' }
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-blue-600" />
            {template ? 'ویرایش کار تکراری' : 'ایجاد کار تکراری جدید'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">عنوان کار *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="مثال: پرداخت قبض برق، بازرسی دستگاه A"
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">توضیحات</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                placeholder="توضیحات تکمیلی درباره کار..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">اولویت</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({...formData, priority: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">فوری</SelectItem>
                    <SelectItem value="high">بالا</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="low">پایین</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">تخمین زمان (ساعت)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({...formData, estimated_hours: e.target.value})}
                  placeholder="۲.۵"
                />
              </div>
            </div>
          </div>

          {/* Recurrence Settings */}
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              تنظیمات تکرار
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">نوع تکرار</label>
                <Select
                  value={formData.recurrence_rule.frequency}
                  onValueChange={(value) => handleRecurrenceChange('frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">روزانه</SelectItem>
                    <SelectItem value="weekly">هفتگی</SelectItem>
                    <SelectItem value="monthly">ماهانه</SelectItem>
                    <SelectItem value="yearly">سالانه</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">فاصله تکرار</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.recurrence_rule.interval || 1}
                  onChange={(e) => handleRecurrenceChange('interval', parseInt(e.target.value) || 1)}
                  placeholder="۱"
                />
              </div>
            </div>

            {formData.recurrence_rule.frequency === 'weekly' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">روزهای هفته</label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map(day => (
                    <div key={day.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.key}
                        checked={formData.recurrence_rule.days_of_week?.includes(day.key) || false}
                        onCheckedChange={() => handleDayToggle(day.key)}
                      />
                      <label htmlFor={day.key} className="text-sm text-slate-600 mr-2">
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Default Checklist */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              چک‌لیست پیش‌فرض
            </h3>

            <div className="flex gap-2">
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                placeholder="مورد جدید چک‌لیست..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
              />
              <Button type="button" onClick={addChecklistItem} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {formData.default_checklist.length > 0 && (
              <div className="space-y-2">
                {formData.default_checklist.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm">{item}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChecklistItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
            />
            <label htmlFor="is_active" className="text-sm text-slate-700 mr-2">
              فعال (کارهای جدید ایجاد شوند)
            </label>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button 
              type="submit"
              disabled={isLoading || !formData.title.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'در حال ذخیره...' : template ? 'به‌روزرسانی' : 'ایجاد الگو'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}