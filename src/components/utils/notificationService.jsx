import { Notification, User, Team, Task, Form, FormAssignment, TeamMember } from '@/api/entities';
import { SendEmail } from '@/api/integrations';

class NotificationService {
  // Create a notification record
  static async createNotification({
    userId,
    type,
    title,
    message,
    relatedId,
    relatedType,
    metadata = {},
    channels = ['in_app']
  }) {
    try {
      const notification = await Notification.create({
        user_id: userId,
        type,
        title,
        message,
        channel: channels[0], // Primary channel for storage
        is_read: false,
        related_id: relatedId,
        related_type: relatedType,
        metadata: {
          ...metadata,
          all_channels: channels,
          created_at: new Date().toISOString()
        }
      });

      // If email is requested, try to send it (but don't fail if it doesn't work)
      if (channels.includes('email')) {
        try {
          await this.sendEmailNotification(userId, title, message, metadata);
        } catch (emailError) {
          console.warn('Email notification failed, but in-app notification was created:', emailError);
          // Continue - in-app notification still works
        }
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      // Don't throw - we don't want notification failures to break the main flow
    }
  }

  // Send email notification with better error handling
  static async sendEmailNotification(userId, title, message, metadata = {}) {
    try {
      // Safer user fetching
      let user;
      try {
        user = await User.get(userId);
      } catch (userError) {
        console.warn(`Could not fetch user ${userId} for email notification:`, userError);
        return; // Skip email if we can't get user info
      }

      if (!user || !user.email) {
        console.warn(`User ${userId} has no email address for notification`);
        return;
      }

      // Check user preferences (with fallback)
      const emailEnabled = user.notification_preferences?.email !== false;
      if (!emailEnabled) {
        console.log(`User ${userId} has disabled email notifications`);
        return;
      }

      const emailBody = `
سلام ${user.full_name || user.email || 'کاربر عزیز'}،

${message}

${metadata.actionUrl ? `برای مشاهده جزئیات روی لینک زیر کلیک کنید:\n${metadata.actionUrl}\n` : ''}

با تشکر،
تیم سیستم مدیریت کار کارراه
      `.trim();

      await SendEmail({
        to: user.email,
        subject: `کارراه - ${title}`,
        body: emailBody
      });

      console.log(`Email notification sent successfully to ${user.email}`);

    } catch (error) {
      console.error('Error sending email notification:', error);
      // Log but don't throw - email failures shouldn't break the main flow
    }
  }

  // Safer user fetching helper
  static async safeGetUser(userId) {
    try {
      return await User.get(userId);
    } catch (error) {
      console.warn(`Could not fetch user ${userId}:`, error);
      return null;
    }
  }

  // Safer form fetching helper
  static async safeGetForm(formId) {
    try {
      if (!formId || formId === 'test' || typeof formId !== 'string') {
        console.warn(`Invalid form ID: ${formId}`);
        return null;
      }
      return await Form.get(formId);
    } catch (error) {
      console.warn(`Could not fetch form ${formId}:`, error);
      return null;
    }
  }

  // Task-related notifications
  static async notifyTaskAssigned(task, assigneeId, assignedBy) {
    try {
      if (!assigneeId) return; // No assignee to notify
      
      const assignedByUser = await this.safeGetUser(assignedBy);
      
      await this.createNotification({
        userId: assigneeId,
        type: 'assignment',
        title: 'کار جدید به شما تخصیص یافت',
        message: `کار "${task.title}" توسط ${assignedByUser?.full_name || 'مدیر'} به شما تخصیص داده شد.`,
        relatedId: task.id,
        relatedType: 'task',
        metadata: {
          task_title: task.title,
          assigned_by: assignedByUser?.full_name || 'مدیر',
          due_date: task.due_at,
          priority: task.priority,
          actionUrl: `${window.location.origin}/boards`
        },
        channels: ['in_app'] // Only in-app for now to avoid email issues
      });
    } catch (error) {
      console.error('Error notifying task assignment:', error);
    }
  }

  static async notifyTaskOverdue(task) {
    try {
      if (!task.assignee_id) return;

      await this.createNotification({
        userId: task.assignee_id,
        type: 'task_overdue',
        title: 'کار عقب افتاده',
        message: `کار "${task.title}" از موعد مقرر عبور کرده است. لطفاً هرچه سریع‌تر آن را تکمیل کنید.`,
        relatedId: task.id,
        relatedType: 'task',
        metadata: {
          task_title: task.title,
          due_date: task.due_at,
          priority: task.priority,
          overdue_hours: Math.floor((new Date() - new Date(task.due_at)) / (1000 * 60 * 60)),
          actionUrl: `${window.location.origin}/boards`
        },
        channels: ['in_app'] // Only in-app for now
      });
    } catch (error) {
      console.error('Error notifying task overdue:', error);
    }
  }

  static async notifyTaskReminder(task, hoursBeforeDue) {
    try {
      if (!task.assignee_id) return;

      const timeText = hoursBeforeDue < 1 ? 
        `${Math.floor(hoursBeforeDue * 60)} دقیقه` : 
        `${hoursBeforeDue} ساعت`;

      await this.createNotification({
        userId: task.assignee_id,
        type: 'task_reminder',
        title: 'یادآوری موعد کار',
        message: `کار "${task.title}" تا ${timeText} دیگر موعد انجامش می‌رسد.`,
        relatedId: task.id,
        relatedType: 'task',
        metadata: {
          task_title: task.title,
          due_date: task.due_at,
          priority: task.priority,
          hours_remaining: hoursBeforeDue,
          actionUrl: `${window.location.origin}/boards`
        },
        channels: ['in_app'] // Only in-app for now
      });
    } catch (error) {
      console.error('Error sending task reminder:', error);
    }
  }

  static async notifyTaskStatusChange(task, oldStatus, newStatus, changedBy) {
    try {
      if (!task.assignee_id || task.assignee_id === changedBy) return;

      const statusLabels = {
        todo: 'انجام شود',
        doing: 'در حال انجام',
        done: 'انجام شده',
        stuck: 'مسدود'
      };

      const changedByUser = await this.safeGetUser(changedBy);

      await this.createNotification({
        userId: task.assignee_id,
        type: 'task_status_changed',
        title: 'وضعیت کار تغییر کرد',
        message: `وضعیت کار "${task.title}" از "${statusLabels[oldStatus]}" به "${statusLabels[newStatus]}" توسط ${changedByUser?.full_name || 'کاربر'} تغییر یافت.`,
        relatedId: task.id,
        relatedType: 'task',
        metadata: {
          task_title: task.title,
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: changedByUser?.full_name || 'کاربر',
          actionUrl: `${window.location.origin}/boards`
        },
        channels: ['in_app']
      });
    } catch (error) {
      console.error('Error notifying task status change:', error);
    }
  }

  // Form-related notifications
  static async notifyFormAssigned(formAssignment, form, assigneeId) {
    try {
      const dueDate = new Date(formAssignment.due_at).toLocaleDateString('fa-IR');
      const dueTime = new Date(formAssignment.due_at).toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      await this.createNotification({
        userId: assigneeId,
        type: 'form_assignment',
        title: 'فرم جدید برای تکمیل',
        message: `فرم "${form.title}" برای تکمیل به شما تخصیص یافت. موعد تکمیل: ${dueDate} ساعت ${dueTime}`,
        relatedId: formAssignment.id,
        relatedType: 'form_assignment',
        metadata: {
          form_title: form.title,
          assignment_title: formAssignment.title,
          due_date: formAssignment.due_at,
          actionUrl: `${window.location.origin}/form-submission?assignment=${formAssignment.id}`
        },
        channels: ['in_app'] // Only in-app for now
      });
    } catch (error) {
      console.error('Error notifying form assignment:', error);
    }
  }

  static async notifyFormOverdue(formAssignment, form) {
    try {
      await this.createNotification({
        userId: formAssignment.assignee_id,
        type: 'form_overdue',
        title: 'فرم عقب افتاده',
        message: `فرم "${form.title}" از موعد مقرر عبور کرده است. لطفاً هرچه سریع‌تر آن را تکمیل کنید.`,
        relatedId: formAssignment.id,
        relatedType: 'form_assignment',
        metadata: {
          form_title: form.title,
          assignment_title: formAssignment.title,
          due_date: formAssignment.due_at,
          overdue_hours: Math.floor((new Date() - new Date(formAssignment.due_at)) / (1000 * 60 * 60)),
          actionUrl: `${window.location.origin}/form-submission?assignment=${formAssignment.id}`
        },
        channels: ['in_app'] // Only in-app for now
      });
    } catch (error) {
      console.error('Error notifying form overdue:', error);
    }
  }

  static async notifyFormReminder(formAssignment, form, hoursBeforeDue) {
    try {
      const timeText = hoursBeforeDue < 1 ? 
        `${Math.floor(hoursBeforeDue * 60)} دقیقه` : 
        `${hoursBeforeDue} ساعت`;

      await this.createNotification({
        userId: formAssignment.assignee_id,
        type: 'form_reminder',
        title: 'یادآوری تکمیل فرم',
        message: `فرم "${form.title}" تا ${timeText} دیگر موعد تکمیلش می‌رسد.`,
        relatedId: formAssignment.id,
        relatedType: 'form_assignment',
        metadata: {
          form_title: form.title,
          assignment_title: formAssignment.title,
          due_date: formAssignment.due_at,
          hours_remaining: hoursBeforeDue,
          actionUrl: `${window.location.origin}/form-submission?assignment=${formAssignment.id}`
        },
        channels: ['in_app'] // Only in-app for now
      });
    } catch (error) {
      console.error('Error sending form reminder:', error);
    }
  }

  // Team management notifications
  static async notifyTeamMemberAdded(teamId, newMemberId, addedBy) {
    try {
      const team = await Team.get(teamId);
      const addedByUser = await this.safeGetUser(addedBy);

      await this.createNotification({
        userId: newMemberId,
        type: 'team_assignment',
        title: 'به تیم جدید اضافه شدید',
        message: `شما توسط ${addedByUser?.full_name || 'مدیر'} به تیم "${team?.name}" اضافه شدید.`,
        relatedId: teamId,
        relatedType: 'team',
        metadata: {
          team_name: team?.name,
          added_by: addedByUser?.full_name || 'مدیر',
          actionUrl: `${window.location.origin}/teams`
        },
        channels: ['in_app'] // Only in-app for now
      });
    } catch (error) {
      console.error('Error notifying team member addition:', error);
    }
  }

  // Recurring task notifications
  static async notifyRecurringTasksGenerated(teamId, tasksCount, templates) {
    try {
      const team = await Team.get(teamId);
      const teamMembers = await TeamMember.filter({ team_id: teamId });

      for (const membership of teamMembers) {
        await this.createNotification({
          userId: membership.user_id,
          type: 'recurring_tasks_generated',
          title: 'کارهای تکراری جدید ایجاد شد',
          message: `${tasksCount} کار تکراری جدید برای تیم "${team?.name}" ایجاد شد.`,
          relatedId: teamId,
          relatedType: 'team',
          metadata: {
            team_name: team?.name,
            tasks_count: tasksCount,
            templates_used: templates.length,
            actionUrl: `${window.location.origin}/boards`
          },
          channels: ['in_app']
        });
      }
    } catch (error) {
      console.error('Error notifying recurring tasks generation:', error);
    }
  }

  // Batch operations for checking overdue items - with better error handling
  static async checkAndNotifyOverdueItems() {
    try {
      const now = new Date();
      
      // Check overdue tasks with safer queries
      let overdueTasks = [];
      try {
        overdueTasks = await Task.filter({
          status: { $in: ['todo', 'doing'] }
        });
        
        // Filter for overdue on client side to avoid date query issues
        overdueTasks = overdueTasks.filter(task => 
          task.due_at && new Date(task.due_at) < now
        );
      } catch (taskError) {
        console.error('Error fetching overdue tasks:', taskError);
      }

      for (const task of overdueTasks) {
        if (!task.assignee_id) continue;
        
        // Check if we've already notified about this task being overdue recently
        try {
          const recentNotifications = await Notification.filter({
            user_id: task.assignee_id,
            type: 'task_overdue',
            related_id: task.id
          });

          // Simple check: if any overdue notification exists for this task, skip
          if (recentNotifications.length === 0) {
            await this.notifyTaskOverdue(task);
          }
        } catch (notificationError) {
          console.error('Error checking recent notifications:', notificationError);
        }
      }

      // Check overdue forms with similar safety
      let overdueFormAssignments = [];
      try {
        overdueFormAssignments = await FormAssignment.filter({
          status: 'pending'
        });
        
        // Filter for overdue on client side
        overdueFormAssignments = overdueFormAssignments.filter(assignment => 
          assignment.due_at && new Date(assignment.due_at) < now
        );
      } catch (formError) {
        console.error('Error fetching overdue form assignments:', formError);
      }

      for (const assignment of overdueFormAssignments) {
        try {
          const recentNotifications = await Notification.filter({
            user_id: assignment.assignee_id,
            type: 'form_overdue',
            related_id: assignment.id
          });

          if (recentNotifications.length === 0) {
            const form = await this.safeGetForm(assignment.form_id);
            if (form) {
              await this.notifyFormOverdue(assignment, form);
            }
          }
        } catch (formNotificationError) {
          console.error('Error handling form overdue notification:', formNotificationError);
        }
      }

    } catch (error) {
      console.error('Error checking overdue items:', error);
    }
  }

  // Check for upcoming due dates and send reminders - with better error handling
  static async checkAndSendReminders() {
    try {
      const now = new Date();
      const reminderTimes = [24, 2, 0.5]; // 24 hours, 2 hours, 30 minutes

      for (const hours of reminderTimes) {
        const targetTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
        const windowStart = new Date(targetTime.getTime() - 10 * 60 * 1000); // 10 minutes before
        const windowEnd = new Date(targetTime.getTime() + 10 * 60 * 1000); // 10 minutes after

        // Check tasks due in this window - safer approach
        try {
          const allTasks = await Task.filter({
            status: { $in: ['todo', 'doing'] }
          });
          
          const upcomingTasks = allTasks.filter(task => {
            if (!task.due_at) return false;
            const dueDate = new Date(task.due_at);
            return dueDate >= windowStart && dueDate <= windowEnd;
          });

          for (const task of upcomingTasks) {
            if (!task.assignee_id) continue;
            
            try {
              // Simple check for existing reminders
              const existingReminders = await Notification.filter({
                user_id: task.assignee_id,
                type: 'task_reminder',
                related_id: task.id
              });

              // Only send if no reminder exists yet
              if (existingReminders.length === 0) {
                await this.notifyTaskReminder(task, hours);
              }
            } catch (reminderError) {
              console.error('Error sending task reminder:', reminderError);
            }
          }
        } catch (taskReminderError) {
          console.error('Error processing task reminders:', taskReminderError);
        }

        // Check forms due in this window - similar safer approach
        try {
          const allFormAssignments = await FormAssignment.filter({
            status: 'pending'
          });
          
          const upcomingForms = allFormAssignments.filter(assignment => {
            if (!assignment.due_at) return false;
            const dueDate = new Date(assignment.due_at);
            return dueDate >= windowStart && dueDate <= windowEnd;
          });

          for (const assignment of upcomingForms) {
            try {
              const existingReminders = await Notification.filter({
                user_id: assignment.assignee_id,
                type: 'form_reminder',
                related_id: assignment.id
              });

              if (existingReminders.length === 0) {
                const form = await this.safeGetForm(assignment.form_id);
                if (form) {
                  await this.notifyFormReminder(assignment, form, hours);
                }
              }
            } catch (formReminderError) {
              console.error('Error sending form reminder:', formReminderError);
            }
          }
        } catch (formReminderError) {
          console.error('Error processing form reminders:', formReminderError);
        }
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
    }
  }
}

export default NotificationService;