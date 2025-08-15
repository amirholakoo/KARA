import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Form, FormField, Team } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ArrowRight, Save, ChevronUp, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FieldEditor = ({ field, index, moveFieldUp, moveFieldDown, updateField, removeField, isFirst, isLast }) => {
  const handleInputChange = (e) => {
    updateField(index, { ...field, [e.target.name]: e.target.value });
  };
  
  const handleTypeChange = (value) => {
    updateField(index, { ...field, field_type: value });
  };
  
  const handleRequiredChange = (checked) => {
    updateField(index, { ...field, is_required: checked });
  };

  const handleOptionChange = (optionIndex, value) => {
    const newOptions = [...(field.options || [])];
    newOptions[optionIndex] = value;
    updateField(index, { ...field, options: newOptions });
  };
  
  const addOption = () => {
    const newOptions = [...(field.options || []), ''];
    updateField(index, { ...field, options: newOptions });
  };

  const removeOption = (optionIndex) => {
    const newOptions = [...(field.options || [])].filter((_, i) => i !== optionIndex);
    updateField(index, { ...field, options: newOptions });
  };

  return (
    <Card className="mb-4 bg-white/80 p-4">
      <div className="flex justify-between items-start">
        <div className="flex-grow space-y-4">
          <Input
            name="label"
            value={field.label}
            onChange={handleInputChange}
            placeholder="سوال یا عنوان فیلد"
            className="text-lg"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select value={field.field_type} onValueChange={handleTypeChange}>
              <SelectTrigger><SelectValue placeholder="نوع فیلد" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="text">متن کوتاه</SelectItem>
                <SelectItem value="textarea">متن بلند</SelectItem>
                <SelectItem value="number">عدد</SelectItem>
                <SelectItem value="checkbox">چک‌باکس</SelectItem>
                <SelectItem value="select">لیست کشویی</SelectItem>
                <SelectItem value="date">تاریخ</SelectItem>
                <SelectItem value="file">فایل</SelectItem>
                <SelectItem value="header">عنوان بخش</SelectItem>
                <SelectItem value="info">متن اطلاعاتی</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {field.field_type === 'select' && (
            <div className="space-y-2 pl-4 border-r-2 border-slate-200">
              <label className="text-sm font-medium">گزینه‌ها</label>
              {(field.options || []).map((option, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <Input value={option} onChange={(e) => handleOptionChange(optIndex, e.target.value)} placeholder={`گزینه ${optIndex + 1}`} />
                  <Button variant="ghost" size="sm" onClick={() => removeOption(optIndex)}><Trash2 className="w-4 h-4 text-red-500"/></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addOption}><Plus className="w-4 h-4 mr-2" />افزودن گزینه</Button>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <input type="checkbox" id={`required-${index}`} name="is_required" checked={field.is_required} onChange={(e) => handleRequiredChange(e.target.checked)} />
            <label htmlFor={`required-${index}`} className="text-sm font-medium">الزامی</label>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 mr-4">
          <Button variant="ghost" size="sm" onClick={() => moveFieldUp(index)} disabled={isFirst}>
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => moveFieldDown(index)} disabled={isLast}>
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => removeField(index)} className="text-red-500">
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default function FormEditor() {
  const [form, setForm] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const formId = params.get('formId');
  const teamId = params.get('teamId');

  useEffect(() => {
    if (formId) {
      loadForm(formId);
    } else if (teamId) {
      setForm({ team_id: teamId, title: '', description: '' });
      setFields([]);
      setLoading(false);
    }
  }, [formId, teamId]);

  const loadForm = async (id) => {
    setLoading(true);
    const existingForm = await Form.get(id);
    const existingFields = await FormField.filter({ form_id: id }, 'position');
    setForm(existingForm);
    setFields(existingFields);
    setLoading(false);
  };

  const addField = () => {
    setFields([...fields, { id: `new-${fields.length}`, label: '', field_type: 'text', is_required: false, position: fields.length }]);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };
  
  const updateField = (index, updatedField) => {
    const newFields = [...fields];
    newFields[index] = updatedField;
    setFields(newFields);
  };
  
  const moveFieldUp = (index) => {
    if (index > 0) {
      const newFields = [...fields];
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      setFields(newFields);
    }
  };

  const moveFieldDown = (index) => {
    if (index < fields.length - 1) {
      const newFields = [...fields];
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      setFields(newFields);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let savedForm;
      if (formId) {
        await Form.update(formId, { title: form.title, description: form.description });
        savedForm = { id: formId };
      } else {
        savedForm = await Form.create({ team_id: teamId, title: form.title, description: form.description });
      }

      // Sync fields
      await Promise.all(fields.map(async (field, index) => {
        const fieldData = {
          ...field,
          form_id: savedForm.id,
          position: index,
          name: field.label.replace(/\s+/g, '_').toLowerCase() || `field_${index}`
        };
        if (String(field.id).startsWith('new-')) {
          delete fieldData.id;
          await FormField.create(fieldData);
        } else {
          await FormField.update(field.id, fieldData);
        }
      }));
      
      navigate(createPageUrl('Forms'));
    } catch (error) {
      console.error("Failed to save form:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>در حال بارگذاری...</div>;

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link to={createPageUrl('Forms')} className="flex items-center gap-2 text-slate-600 hover:text-blue-600">
            <ArrowRight className="w-5 h-5" />
            <span>بازگشت به لیست فرم‌ها</span>
          </Link>
          <Button onClick={handleSave} disabled={loading} className="hover-lift">
            <Save className="w-4 h-4 ml-2" />
            {loading ? 'در حال ذخیره...' : 'ذخیره فرم'}
          </Button>
        </div>
        
        <Card className="glass-effect border-none shadow-lg mb-8">
          <CardContent className="p-6 space-y-4">
            <Input
              value={form?.title || ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="عنوان فرم"
              className="text-2xl font-bold border-0 focus-visible:ring-0 px-0"
            />
            <Textarea
              value={form?.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="توضیحات فرم (اختیاری)"
              className="border-0 focus-visible:ring-0 px-0"
            />
          </CardContent>
        </Card>

        <div>
          {fields.map((field, index) => (
            <FieldEditor
              key={field.id}
              index={index}
              field={field}
              moveFieldUp={moveFieldUp}
              moveFieldDown={moveFieldDown}
              updateField={updateField}
              removeField={removeField}
              isFirst={index === 0}
              isLast={index === fields.length - 1}
            />
          ))}
        </div>

        <Button onClick={addField} variant="outline" className="w-full py-6 border-dashed hover-lift">
          <Plus className="w-5 h-5 mr-2" />
          افزودن فیلد جدید
        </Button>
      </div>
    </div>
  );
}