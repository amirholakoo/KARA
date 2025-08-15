
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { User, TeamMember, Form, FormSchedule, FormAssignment } from "@/api/entities"; // Added FormSchedule and FormAssignment
import { Plus, X, Clock, Calendar, Users, UserPlus } from "lucide-react";
import NotificationService from "../utils/notificationService"; // Updated NotificationService import path

export default function FormScheduleModal({ form, schedule, team, onClose, onSave }) {
  const [scheduleData, setScheduleData] = useState({
    title: schedule?.title || (form ? `${form.title} - زمان‌بندی` : 'زمان‌بندی جدید'),
    form_id: schedule?.form_id || form?.id || '',
    assignee_ids: schedule?.assignee_ids || [],
    recurrence_rule: schedule?.recurrence_rule || {
      frequency: 'weekly',
      interval: 1,
      days_of_week: []
    },
    due_time: schedule?.due_time || '09:00',
    is_active: schedule ? schedule.is_active : true
  });

  const [teamMembers, setTeamMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // This state seems to be used for an alert message only, not for actual filtering of teamMembers. Keeping it as is.
  const [availableForms, setAvailableForms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    loadTeamData();
    // Only load forms if no pre-selected form and no existing schedule,
    // OR if editing a schedule (to ensure form title is displayed correctly)
    if (!form || schedule) { // Changed condition to ensure forms are loaded if no 'form' prop but 'schedule' prop exists (for displaying schedule's form title)
      loadAvailableForms();
    }
  }, [team.id, form, schedule]);

  const loadTeamData = async () => {
    try {
      setLoadingMembers(true);
      
      // Try to load team members first
      const members = await TeamMember.filter({ team_id: team.id, is_active: true });
      console.log('Found team members:', members);
      
      if (members.length > 0) {
        // Load user details for team members
        const memberDetails = await Promise.all(
          members.map(async (member) => {
            try {
              const user = await User.get(member.user_id);
              return { 
                ...member, 
                user,
                isTeamMember: true,
                displayName: user.full_name || user.email,
                role: member.role || 'عضو'
              };
            } catch (error) {
              console.error(`Error loading user ${member.user_id}:`, error);
              return null;
            }
          })
        );
        
        const validMembers = memberDetails.filter(Boolean);
        setTeamMembers(validMembers);
        console.log('Team members with user details:', validMembers);
      } else {
        // Fallback: Load all users if no team members exist
        console.log('No team members found, loading all users as fallback');
        const users = await User.list();
        const userList = users.map(user => ({
          user_id: user.id,
          user: user,
          isTeamMember: false,
          displayName: user.full_name || user.email,
          role: 'کاربر'
        }));
        setTeamMembers(userList);
        setAllUsers(userList); // Set allUsers for the warning message
        console.log('All users loaded as fallback:', userList);
      }
      
    } catch (error) {
      console.error('Error loading team data:', error);
      
      // Final fallback: try to load all users
      try {
        const users = await User.list();
        const userList = users.map(user => ({
          user_id: user.id,
          user: user,
          isTeamMember: false,
          displayName: user.full_name || user.email,
          role: 'کاربر'
        }));
        setTeamMembers(userList);
        setAllUsers(userList); // Set allUsers for the warning message
        console.log('Loaded all users as final fallback:', userList);
      } catch (finalError) {
        console.error('Error loading users as fallback:', finalError);
      }
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadAvailableForms = async () => {
    try {
      const teamForms = await Form.filter({ team_id: team.id, is_active: true });
      setAvailableForms(teamForms);
    } catch (error) {
      console.error('Error loading forms:', error);
    }
  };

  // Renamed from handleSubmit to handleSave
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!scheduleData.title.trim()) {
      alert('لطفاً عنوان زمان‌بندی را وارد کنید');
      return;
    }

    if (!scheduleData.form_id) {
      alert('لطفاً فرم مورد نظر را انتخاب کنید');
      return;
    }

    if (scheduleData.assignee_ids.length === 0) {
      alert('لطفاً حداقل یک نفر را انتخاب کنید');
      return;
    }

    setIsLoading(true);
    try {
      const dataToPersist = { // Prepare data for either create or update
        ...scheduleData,
        team_id: team.id,
      };

      let persistedSchedule;
      if (schedule) {
        // Existing schedule: Pass current schedule data with ID to onSave for update
        persistedSchedule = await onSave({ ...dataToPersist, id: schedule.id });
      } else {
        // New schedule: Create it directly within the modal
        persistedSchedule = await FormSchedule.create(dataToPersist);
        
        // Create initial form assignments and send notifications for NEW schedules
        // Ensure to retrieve the form details to use in assignment title and notification
        const assignedForm = await Form.get(persistedSchedule.form_id);
        
        const [hours, minutes] = persistedSchedule.due_time.split(':');
        const dueAt = new Date();
        dueAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        for (const assigneeId of persistedSchedule.assignee_ids) {
          const assignment = await FormAssignment.create({
            form_id: persistedSchedule.form_id,
            schedule_id: persistedSchedule.id,
            assignee_id: assigneeId,
            title: `${assignedForm.title} - ${new Date().toLocaleDateString('fa-IR')}`, // Current date for initial title
            due_at: dueAt.toISOString(),
          });

          // Send notification about form assignment
          await NotificationService.notifyFormAssigned(assignment, assignedForm, assigneeId);
        }
        
        // Call onSave for new schedules as well, to signal creation to parent
        // The parent might update its list or navigate
        await onSave(persistedSchedule);
      }

      onClose(); // Close the modal after successful operation
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('خطا در ذخیره زمان‌بندی');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecurrenceChange = (field, value) => {
    setScheduleData(prevData => ({
      ...prevData,
      recurrence_rule: {
        ...prevData.recurrence_rule,
        [field]: value
      }
    }));
  };

  const handleDayToggle = (day) => {
    setScheduleData(prevData => {
      const currentDays = prevData.recurrence_rule.days_of_week || [];
      const newDays = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day];
      
      return {
        ...prevData,
        recurrence_rule: {
          ...prevData.recurrence_rule,
          days_of_week: newDays
        }
      };
    });
  };

  const handleAssigneeToggle = (userId) => {
    setScheduleData(prevData => {
      const newAssignees = prevData.assignee_ids.includes(userId)
        ? prevData.assignee_ids.filter(id => id !== userId)
        : [...prevData.assignee_ids, userId];
      
      return {
        ...prevData,
        assignee_ids: newAssignees
      };
    });
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
            <Calendar className="w-5 h-5 text-purple-600" />
            {schedule ? 'ویرایش زمان‌بندی' : 'زمان‌بندی جدید'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6 py-4"> {/* Changed onSubmit to handleSave */}
          {/* Form Selection (only when no pre-selected form/schedule) */}
          {!form && !schedule && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">انتخاب فرم *</label>
              <Select
                value={scheduleData.form_id}
                onValueChange={(value) => {
                  const selectedForm = availableForms.find(f => f.id === value);
                  setScheduleData(prevData => ({
                    ...prevData,
                    form_id: value,
                    title: selectedForm ? `${selectedForm.title} - زمان‌بندی` : 'زمان‌بندی جدید'
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="فرم مورد نظر را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  {availableForms.map((availableForm) => (
                    <SelectItem key={availableForm.id} value={availableForm.id}>
                      {availableForm.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Display selected form if exists (either passed as prop or from schedule) */}
          {(form || schedule) && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">فرم انتخاب شده</label>
              <Input
                value={form?.title || availableForms.find(f => f.id === scheduleData.form_id)?.title || 'بارگذاری فرم...'}
                readOnly
                className="text-lg bg-slate-100 cursor-not-allowed"
              />
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">عنوان زمان‌بندی *</label>
              <Input
                value={scheduleData.title}
                onChange={(e) => setScheduleData(prevData => ({...prevData, title: e.target.value}))}
                placeholder="مثال: گزارش روزانه کیفیت"
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">ساعت موعد انجام</label>
              <Input
                type="time"
                value={scheduleData.due_time}
                onChange={(e) => setScheduleData(prevData => ({...prevData, due_time: e.target.value}))}
              />
            </div>
          </div>

          {/* Assignees Selection */}
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              انتخاب افراد ({scheduleData.assignee_ids.length} نفر انتخاب شده)
            </h3>
            
            {loadingMembers ? (
              <div className="text-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-slate-500 text-sm">در حال بارگذاری اعضا...</p>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <UserPlus className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm mb-4">هیچ عضو تیمی یافت نشد</p>
                <p className="text-xs">ابتدا اعضا را به تیم اضافه کنید</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {teamMembers.map((member) => (
                    <div key={member.user_id} className="flex items-center space-x-3 p-3 hover:bg-white rounded-lg border-l-2 border-transparent hover:border-purple-300 transition-all">
                      <Checkbox
                        checked={scheduleData.assignee_ids.includes(member.user_id)}
                        onCheckedChange={() => handleAssigneeToggle(member.user_id)}
                        className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                      <div className="flex-1 mr-3">
                        <p className="font-medium text-slate-700">{member.displayName}</p>
                        <p className="text-xs text-slate-500">
                          {member.user?.email || 'ایمیل نامشخص'} • {member.role}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {member.isTeamMember ? (
                            member.role === 'owner' ? 'مالک' : 
                            member.role === 'manager' ? 'مدیر' : 'عضو'
                          ) : 'کاربر'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                
                {allUsers.length > 0 && ( // This condition assumes allUsers only gets populated in fallback
                  <p className="text-xs text-orange-600 mt-2 p-2 bg-orange-50 rounded">
                    💡 از آنجا که اعضای تیم تعریف نشده‌اند، همه کاربران نمایش داده شده‌اند
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Recurrence Settings */}
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              تنظیمات تکرار
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">نوع تکرار</label>
                <Select
                  value={scheduleData.recurrence_rule.frequency}
                  onValueChange={(value) => handleRecurrenceChange('frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">روزانه</SelectItem>
                    <SelectItem value="weekly">هفتگی</SelectItem>
                    <SelectItem value="monthly">ماهانه</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">فاصله تکرار</label>
                <Input
                  type="number"
                  min="1"
                  value={scheduleData.recurrence_rule.interval || 1}
                  onChange={(e) => handleRecurrenceChange('interval', parseInt(e.target.value) || 1)}
                  placeholder="۱"
                />
              </div>
            </div>

            {scheduleData.recurrence_rule.frequency === 'weekly' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">روزهای هفته</label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map(day => (
                    <div key={day.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.key}
                        checked={scheduleData.recurrence_rule.days_of_week?.includes(day.key) || false}
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

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={scheduleData.is_active}
              onCheckedChange={(checked) => setScheduleData(prevData => ({...prevData, is_active: checked}))}
            />
            <label htmlFor="is_active" className="text-sm text-slate-700 mr-2">
              فعال (تکالیف جدید ایجاد شوند)
            </label>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button 
              type="submit"
              disabled={isLoading || !scheduleData.title.trim() || !scheduleData.form_id || scheduleData.assignee_ids.length === 0 || loadingMembers}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? 'در حال ذخیره...' : (schedule ? 'ذخیره تغییرات' : 'ایجاد زمان‌بندی')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
