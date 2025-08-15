import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  User as UserIcon, 
  Bell, 
  Palette, 
  Shield, 
  Globe,
  Save,
  Eye,
  Mail,
  Smartphone,
  MessageCircle,
  Clock,
  Zap,
  Info
} from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    // Profile settings
    profile: {
      first_name: '',
      last_name: '',
      national_code: '',
      mobile_number: '',
      address: '',
      postal_code: '',
      telegram_id: ''
    },
    // Notification preferences
    notifications: {
      email: true,
      sms: false,
      telegram: false,
      in_app: true,
      task_reminders: true,
      form_reminders: true,
      task_assignments: true,
      form_assignments: true,
      overdue_alerts: true,
      status_changes: true
    },
    // Display preferences
    display: {
      theme: 'light',
      language: 'fa',
      timezone: 'Asia/Tehran',
      date_format: 'jalali',
      time_format: '24h'
    },
    // Work preferences
    work: {
      default_priority: 'medium',
      wip_limit: 3,
      working_hours_start: '08:00',
      working_hours_end: '17:00',
      working_days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      setLoading(true);
      const currentUser = await User.me();
      setUser(currentUser);
      
      // Merge user data with default settings
      setSettings(prevSettings => ({
        ...prevSettings,
        profile: {
          first_name: currentUser.first_name || '',
          last_name: currentUser.last_name || '',
          national_code: currentUser.national_code || '',
          mobile_number: currentUser.mobile_number || '',
          address: currentUser.address || '',
          postal_code: currentUser.postal_code || '',
          telegram_id: currentUser.telegram_id || ''
        },
        notifications: {
          ...prevSettings.notifications,
          ...(currentUser.notification_preferences || {})
        },
        work: {
          ...prevSettings.work,
          wip_limit: currentUser.wip_limit || 3
        }
      }));
    } catch (error) {
      console.error('Error loading user settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update user profile and preferences
      await User.updateMyUserData({
        ...settings.profile,
        notification_preferences: settings.notifications,
        wip_limit: settings.work.wip_limit,
        working_hours: {
          start: settings.work.working_hours_start,
          end: settings.work.working_hours_end,
          days: settings.work.working_days
        },
        display_preferences: settings.display
      });

      alert('تنظیمات با موفقیت ذخیره شد!');
      await loadUserSettings(); // Refresh
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const toggleWorkingDay = (day) => {
    setSettings(prev => ({
      ...prev,
      work: {
        ...prev.work,
        working_days: prev.work.working_days.includes(day)
          ? prev.work.working_days.filter(d => d !== day)
          : [...prev.work.working_days, day]
      }
    }));
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

  if (loading) {
    return (
      <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded-lg w-1/3"></div>
            <div className="h-96 bg-white/50 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-blue-600" />
              تنظیمات
            </h1>
            <p className="text-slate-600">شخصی‌سازی تجربه کاری خود</p>
          </div>
          
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 hover-lift"
          >
            <Save className="w-4 h-4 ml-2" />
            {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
          </Button>
        </div>

        {/* Settings Tabs */}
        <Card className="glass-effect border-none shadow-lg">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                پروفایل
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                اعلان‌ها
              </TabsTrigger>
              <TabsTrigger value="display" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                نمایش
              </TabsTrigger>
              <TabsTrigger value="work" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                کار
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  اطلاعات شخصی
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">نام</label>
                    <Input
                      value={settings.profile.first_name}
                      onChange={(e) => updateSetting('profile', 'first_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">نام خانوادگی</label>
                    <Input
                      value={settings.profile.last_name}
                      onChange={(e) => updateSetting('profile', 'last_name', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">کد ملی</label>
                    <Input
                      value={settings.profile.national_code}
                      onChange={(e) => updateSetting('profile', 'national_code', e.target.value)}
                      maxLength={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">شماره موبایل</label>
                    <Input
                      value={settings.profile.mobile_number}
                      onChange={(e) => updateSetting('profile', 'mobile_number', e.target.value)}
                      maxLength={11}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">آدرس</label>
                  <Textarea
                    value={settings.profile.address}
                    onChange={(e) => updateSetting('profile', 'address', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">کد پستی</label>
                    <Input
                      value={settings.profile.postal_code}
                      onChange={(e) => updateSetting('profile', 'postal_code', e.target.value)}
                      maxLength={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">آی‌دی تلگرام</label>
                    <Input
                      value={settings.profile.telegram_id}
                      onChange={(e) => updateSetting('profile', 'telegram_id', e.target.value)}
                      placeholder="@username"
                    />
                  </div>
                </div>
              </CardContent>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  تنظیمات اعلان‌ها
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Notification Channels */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-700">کانال‌های اعلان</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Eye className="w-5 h-5 text-blue-600" />
                        <span>اعلان‌های داخل برنامه</span>
                      </div>
                      <Switch
                        checked={settings.notifications.in_app}
                        onCheckedChange={(checked) => updateSetting('notifications', 'in_app', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-green-600" />
                        <span>ایمیل</span>
                      </div>
                      <Switch
                        checked={settings.notifications.email}
                        onCheckedChange={(checked) => updateSetting('notifications', 'email', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-orange-600" />
                        <span>پیامک</span>
                      </div>
                      <Switch
                        checked={settings.notifications.sms}
                        onCheckedChange={(checked) => updateSetting('notifications', 'sms', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5 text-blue-500" />
                        <span>تلگرام</span>
                      </div>
                      <Switch
                        checked={settings.notifications.telegram}
                        onCheckedChange={(checked) => updateSetting('notifications', 'telegram', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Notification Types */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-700">انواع اعلان</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'task_assignments', label: 'تخصیص کارهای جدید', icon: Zap },
                      { key: 'task_reminders', label: 'یادآوری موعد کارها', icon: Clock },
                      { key: 'form_assignments', label: 'تخصیص فرم‌های جدید', icon: Zap },
                      { key: 'form_reminders', label: 'یادآوری تکمیل فرم‌ها', icon: Clock },
                      { key: 'overdue_alerts', label: 'هشدار کارهای عقب افتاده', icon: Bell },
                      { key: 'status_changes', label: 'تغییر وضعیت کارها', icon: Info }
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-slate-600" />
                          <span>{label}</span>
                        </div>
                        <Switch
                          checked={settings.notifications[key]}
                          onCheckedChange={(checked) => updateSetting('notifications', key, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </TabsContent>

            {/* Display Settings */}
            <TabsContent value="display">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  تنظیمات نمایش
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">زبان سیستم</label>
                    <Select
                      value={settings.display.language}
                      onValueChange={(value) => updateSetting('display', 'language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fa">فارسی</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">منطقه زمانی</label>
                    <Select
                      value={settings.display.timezone}
                      onValueChange={(value) => updateSetting('display', 'timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Tehran">تهران (GMT+3:30)</SelectItem>
                        <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">فرمت تاریخ</label>
                    <Select
                      value={settings.display.date_format}
                      onValueChange={(value) => updateSetting('display', 'date_format', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jalali">شمسی (۱۴۰۳/۱۰/۱۵)</SelectItem>
                        <SelectItem value="gregorian">میلادی (2024/12/05)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">فرمت زمان</label>
                    <Select
                      value={settings.display.time_format}
                      onValueChange={(value) => updateSetting('display', 'time_format', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">۲۴ ساعته (۱۴:۳۰)</SelectItem>
                        <SelectItem value="12h">۱۲ ساعته (۲:۳۰ PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </TabsContent>

            {/* Work Settings */}
            <TabsContent value="work">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  تنظیمات کاری
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">اولویت پیش‌فرض کارها</label>
                    <Select
                      value={settings.work.default_priority}
                      onValueChange={(value) => updateSetting('work', 'default_priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">پایین</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="high">بالا</SelectItem>
                        <SelectItem value="urgent">فوری</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">حداکثر کارهای همزمان</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={settings.work.wip_limit}
                      onChange={(e) => updateSetting('work', 'wip_limit', parseInt(e.target.value) || 3)}
                    />
                  </div>
                </div>

                {/* Working Hours */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-700">ساعات کاری</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">شروع کار</label>
                      <Input
                        type="time"
                        value={settings.work.working_hours_start}
                        onChange={(e) => updateSetting('work', 'working_hours_start', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">پایان کار</label>
                      <Input
                        type="time"
                        value={settings.work.working_hours_end}
                        onChange={(e) => updateSetting('work', 'working_hours_end', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Working Days */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-700">روزهای کاری</h3>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map(day => (
                      <Badge
                        key={day.key}
                        variant={settings.work.working_days.includes(day.key) ? "default" : "outline"}
                        className={`cursor-pointer hover-lift ${
                          settings.work.working_days.includes(day.key) 
                            ? 'bg-blue-600 text-white' 
                            : 'text-slate-600 hover:bg-blue-50'
                        }`}
                        onClick={() => toggleWorkingDay(day.key)}
                      >
                        {day.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}