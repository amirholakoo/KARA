
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/api/entities";
import { List } from "@/api/entities"; // Import the List entity
import { 
  Calendar, 
  Clock, 
  User as UserIcon, // Renamed to avoid conflict with 'user' prop
  AlertTriangle, 
  Save,
  Trash2,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import NotificationService from "../utils/notificationService"; // Updated path

export default function TaskModal({ task, onClose, onUpdate, user, teamMembers }) {
  const [editedTask, setEditedTask] = useState(task);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updatePayload = { ...editedTask };
      const oldStatus = task.status; // Store old status before potential changes
      
      // If status is changing to 'done', set completion data and move to Done list
      if (task.status !== 'done' && editedTask.status === 'done') {
        updatePayload.completed_at = new Date().toISOString();
        updatePayload.completed_by = user?.id;

        const allLists = await List.filter({ board_id: task.board_id });
        const doneList = allLists.find(l => l.name_en === 'Done');
        if (doneList) {
          updatePayload.list_id = doneList.id;
        }
      } else if (task.status !== 'doing' && editedTask.status === 'doing') { // New condition for 'doing'
        const allLists = await List.filter({ board_id: task.board_id });
        const doingList = allLists.find(l => l.name_en === 'Doing');
        if (doingList) {
          updatePayload.list_id = doingList.id;
        }
      }
      
      // Check if assignee changed
      const assigneeChanged = task.assignee_id !== editedTask.assignee_id;

      await Task.update(task.id, updatePayload);

      // Send notifications for changes
      if (oldStatus !== editedTask.status) {
        await NotificationService.notifyTaskStatusChange(
          { ...task, ...updatePayload }, // Pass the updated task object
          oldStatus, 
          editedTask.status, 
          user?.id
        );
      }
      
      if (assigneeChanged && editedTask.assignee_id) {
        await NotificationService.notifyTaskAssigned(
          { ...task, ...updatePayload }, // Pass the updated task object
          editedTask.assignee_id, 
          user?.id
        );
      }
      
      onUpdate();
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSnooze = async (minutes) => {
    if (task.snooze_count >= 2) {
      alert('این کار بیش از حد مجاز به تعویق افتاده است!');
      return;
    }

    setIsLoading(true);
    try {
      const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
      await Task.update(task.id, {
        ...editedTask,
        due_at: snoozeUntil.toISOString(),
        snooze_count: (task.snooze_count || 0) + 1,
        last_snoozed_at: new Date().toISOString(),
        snooze_reason: minutes === 15 ? '۱۵ دقیقه' : minutes === 60 ? '۱ ساعت' : '۴ ساعت'
      });
      onUpdate();
    } catch (error) {
      console.error('Error snoozing task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setIsLoading(true);
    try {
      const updatePayload = { ...editedTask, status: newStatus };
      const oldStatus = task.status; // Store old status before potential changes
      
      if (newStatus === 'done') {
        updatePayload.completed_at = new Date().toISOString();
        updatePayload.completed_by = user?.id;
        
        const allLists = await List.filter({ board_id: task.board_id });
        const doneList = allLists.find(l => l.name_en === 'Done');
        if (doneList) {
          updatePayload.list_id = doneList.id;
        }
      } else if (newStatus === 'doing') { // New condition for 'doing' status change
        const allLists = await List.filter({ board_id: task.board_id });
        const doingList = allLists.find(l => l.name_en === 'Doing');
        if (doingList) {
          updatePayload.list_id = doingList.id;
        }
      }
      
      await Task.update(task.id, updatePayload);
      
      // Send status change notification
      await NotificationService.notifyTaskStatusChange(
        { ...task, ...updatePayload }, // Pass the updated task object
        oldStatus, 
        newStatus, 
        user?.id
      );
      
      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>جزئیات کار</span>
            <div className="flex items-center gap-2">
              {task.is_stuck && (
                <Badge className="bg-red-100 text-red-800">
                  <AlertTriangle className="w-3 h-3 ml-1" />
                  مسدود شده
                </Badge>
              )}
              {task.snooze_count > 0 && (
                <Badge variant="outline" className="text-orange-600">
                  <Clock className="w-3 h-3 ml-1" />
                  {task.snooze_count}x به تعویق افتاده
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">عنوان کار</label>
            <Input
              value={editedTask.title}
              onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
              className="text-lg font-semibold"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">توضیحات</label>
            <Textarea
              value={editedTask.description || ''}
              onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
              rows={4}
              placeholder="توضیحات کار را وارد کنید..."
            />
          </div>

          {/* Priority, Status, and Assignee */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">اولویت</label>
              <Select
                value={editedTask.priority}
                onValueChange={(value) => setEditedTask({...editedTask, priority: value})}
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
              <label className="text-sm font-medium text-slate-700">وضعیت</label>
              <Select
                value={editedTask.status}
                onValueChange={(value) => setEditedTask({...editedTask, status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">انجام شود</SelectItem>
                  <SelectItem value="doing">در حال انجام</SelectItem>
                  <SelectItem value="done">انجام شده</SelectItem>
                  <SelectItem value="stuck">مسدود</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">مسئول</label>
              <Select
                value={editedTask.assignee_id || ''}
                onValueChange={(value) => setEditedTask({...editedTask, assignee_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب مسئول" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers && teamMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">موعد انجام</label>
            <Input
              type="datetime-local"
              value={editedTask.due_at ? format(new Date(editedTask.due_at), "yyyy-MM-dd'T'HH:mm") : ''}
              onChange={(e) => setEditedTask({...editedTask, due_at: e.target.value ? new Date(e.target.value).toISOString() : null})}
            />
          </div>

          {/* Estimated Hours */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">تخمین زمان (ساعت)</label>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={editedTask.estimated_hours || ''}
              onChange={(e) => setEditedTask({...editedTask, estimated_hours: parseFloat(e.target.value) || null})}
              placeholder="تخمین زمان به ساعت"
            />
          </div>

          {/* Quick Actions */}
          {task.status !== 'done' && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-slate-700">اقدامات سریع</h4>
              
              <div className="flex flex-wrap gap-2">
                {task.status === 'todo' && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange('doing')}
                    disabled={isLoading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    شروع کار
                  </Button>
                )}
                
                {task.status === 'doing' && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange('done')}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    انجام شد
                  </Button>
                )}
                
                {task.snooze_count < 2 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSnooze(15)}
                      disabled={isLoading}
                    >
                      <Clock className="w-3 h-3 ml-1" />
                      ۱۵ دقیقه تعویق
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSnooze(60)}
                      disabled={isLoading}
                    >
                      <Clock className="w-3 h-3 ml-1" />
                      ۱ ساعت تعویق
                    </Button>
                  </>
                )}
              </div>
              
              {task.snooze_count >= 2 && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  ⚠️ این کار بیش از حد مجاز به تعویق افتاده است
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 ml-2" />
            ذخیره تغییرات
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
