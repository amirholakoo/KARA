import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Team } from '@/api/entities';
import { X, Save, Plus } from 'lucide-react';

const teamColors = [
  '#1e40af', '#7c3aed', '#dc2626', '#ea580c',
  '#ca8a04', '#16a34a', '#0891b2', '#be185d'
];

export default function CreateTeamModal({ isOpen, onClose, onTeamCreated, initialData = null }) {
    const [formData, setFormData] = useState({
        name: '',
        name_en: '',
        description: '',
        color: '#1e40af',
        timezone: 'Asia/Tehran'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                name_en: initialData.name_en || '',
                description: initialData.description || '',
                color: initialData.color || '#1e40af',
                timezone: initialData.timezone || 'Asia/Tehran'
            });
        } else {
            setFormData({
                name: '',
                name_en: '',
                description: '',
                color: '#1e40af',
                timezone: 'Asia/Tehran'
            });
        }
    }, [initialData, isOpen]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.name_en.trim()) {
            alert('لطفاً نام تیم را به فارسی و انگلیسی وارد کنید.');
            return;
        }

        setLoading(true);
        try {
            if (initialData) {
                await Team.update(initialData.id, formData);
            } else {
                await Team.create(formData);
            }
            onTeamCreated();
        } catch (error) {
            console.error('Error saving team:', error);
            alert('خطا در ذخیره تیم');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {initialData ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        {initialData ? 'ویرایش تیم' : 'ایجاد تیم جدید'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">نام تیم (فارسی) *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="مثال: تیم حسابداری"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name_en">نام تیم (انگلیسی) *</Label>
                        <Input
                            id="name_en"
                            value={formData.name_en}
                            onChange={(e) => handleInputChange('name_en', e.target.value)}
                            placeholder="Example: Accounting Team"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">توضیحات</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="توضیح کوتاهی درباره این تیم..."
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>رنگ تیم</Label>
                        <div className="flex gap-2">
                            {teamColors.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`w-8 h-8 rounded-full border-2 ${
                                        formData.color === color ? 'border-slate-400' : 'border-slate-200'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => handleInputChange('color', color)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            <X className="w-4 h-4 ml-2" />
                            انصراف
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'در حال ذخیره...' : (
                                initialData ? 'به‌روزرسانی' : 'ایجاد تیم'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}