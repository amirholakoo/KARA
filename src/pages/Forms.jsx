
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Form, Team, FormSchedule, Board, List, FormAssignment, Task, FormField, FormSubmission, User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Edit, Trash2, Calendar, Eye, Upload, Download } from 'lucide-react';
import TeamSelector from '../components/boards/TeamSelector';
import FormScheduleModal from '../components/forms/FormScheduleModal';
import ScheduleCard from '../components/forms/ScheduleCard';
import ImportFormModal from '../components/forms/ImportFormModal';
import FormAnalytics from '../components/forms/FormAnalytics';
import PendingAssignments from '../components/forms/PendingAssignments';
import RecentSubmissions from '../components/forms/RecentSubmissions';
import SubmissionViewModal from '../components/forms/SubmissionViewModal';

export default function FormsPage() {
  const [forms, setForms] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedFormForSchedule, setSelectedFormForSchedule] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [analytics, setAnalytics] = useState({});
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [viewingSubmission, setViewingSubmission] = useState(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const allTeams = await Team.list();
      setTeams(allTeams);
      if (allTeams.length > 0) {
        const firstTeam = allTeams[0];
        setSelectedTeam(firstTeam);
        await loadTeamData(firstTeam.id);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamData = async (teamId) => {
    const teamForms = await Form.filter({ team_id: teamId });
    setForms(teamForms);
    const teamSchedules = await FormSchedule.filter({ team_id: teamId }, '-created_date');
    setSchedules(teamSchedules);
    
    // Load additional data
    await loadFormAnalytics(teamId);
    await loadPendingAssignments(teamId);
    await loadRecentSubmissions(teamId);
  };

  const loadFormAnalytics = async (teamId) => {
    try {
      const teamForms = await Form.filter({ team_id: teamId });
      const formIds = teamForms.map(f => f.id);
      
      let allAssignments = [];
      if (formIds.length > 0) {
        for (const formId of formIds) {
          const assignments = await FormAssignment.filter({ form_id: formId });
          allAssignments = [...allAssignments, ...assignments];
        }
      }

      const completedAssignments = allAssignments.filter(a => a.status === 'completed');
      const pendingAssignments = allAssignments.filter(a => a.status === 'pending');
      const overdueAssignments = allAssignments.filter(a => 
        a.status === 'pending' && new Date(a.due_at) < new Date()
      );

      let todaysSubmissionsCount = 0;
      if (formIds.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let allTeamSubmissions = [];
        for (const formId of formIds) {
            const submissions = await FormSubmission.filter({ form_id: formId });
            allTeamSubmissions = [...allTeamSubmissions, ...submissions];
        }
        
        todaysSubmissionsCount = allTeamSubmissions.filter(s => 
          new Date(s.submitted_at) >= today
        ).length;
      }

      const analyticsData = {
        totalAssignments: allAssignments.length,
        completedAssignments: completedAssignments.length,
        pendingAssignments: pendingAssignments.length,
        overdueAssignments: overdueAssignments.length,
        completionRate: allAssignments.length > 0 ? 
          Math.round((completedAssignments.length / allAssignments.length) * 100) : 0,
        avgCompletionTime: 0, // Could calculate this from submission times
        todaysSubmissions: todaysSubmissionsCount
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadPendingAssignments = async (teamId) => {
    try {
      const teamForms = await Form.filter({ team_id: teamId });
      const formIds = teamForms.map(f => f.id);
      
      let allPending = [];
      if (formIds.length > 0) {
        for (const formId of formIds) {
          const pending = await FormAssignment.filter({ 
            form_id: formId, 
            status: 'pending' 
          }, 'due_at');
          allPending = [...allPending, ...pending];
        }
      }

      // Sort by due date
      allPending.sort((a, b) => new Date(a.due_at) - new Date(b.due_at));
      setPendingAssignments(allPending.slice(0, 10)); // Show top 10
    } catch (error) {
      console.error('Error loading pending assignments:', error);
    }
  };

  const loadRecentSubmissions = async (teamId) => {
    try {
      const teamForms = await Form.filter({ team_id: teamId });
      const formIds = teamForms.map(f => f.id);
      
      let allSubmissions = [];
      if (formIds.length > 0) {
        for (const formId of formIds) {
          const submissions = await FormSubmission.filter({ 
            form_id: formId 
          }, '-submitted_at');
          allSubmissions = [...allSubmissions, ...submissions];
        }
      }

      // Sort by submission date (newest first)
      allSubmissions.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
      setRecentSubmissions(allSubmissions.slice(0, 10)); // Show recent 10

      // Load all users for display
      const users = await User.list();
      setAllUsers(users);
    } catch (error) {
      console.error('Error loading recent submissions:', error);
    }
  };

  const handleViewSubmission = async (submission) => {
    try {
      setViewingSubmission(submission);
      setShowSubmissionModal(true);
    } catch (error) {
      console.error('Error viewing submission:', error);
    }
  };

  const handleTeamSelect = async (team) => {
    setSelectedTeam(team);
    await loadTeamData(team.id);
  };

  const handleCreateForm = () => {
    if (!selectedTeam) return;
    navigate(createPageUrl(`FormEditor?teamId=${selectedTeam.id}`));
  };

  const handleDeleteForm = async (formId) => {
    if (confirm('آیا مطمئن هستید؟ این کار تمام زمان‌بندی‌های مرتبط را نیز حذف می‌کند.')) {
      try {
        // TODO: Also delete related fields, schedules, etc.
        await Form.delete(formId);
        await loadTeamData(selectedTeam.id);
      } catch (error) {
        console.error('Error deleting form:', error);
      }
    }
  };

  const handleScheduleForm = (form) => {
    setEditingSchedule(null);
    setSelectedFormForSchedule(form);
    setShowScheduleModal(true);
  };
  
  const handleEditSchedule = (schedule) => {
    setSelectedFormForSchedule(forms.find(f => f.id === schedule.form_id));
    setEditingSchedule(schedule);
    setShowScheduleModal(true);
  };

  const generateAssignmentsAndTasks = async (schedule) => {
    try {
      console.log('Generating assignments and tasks for schedule:', schedule);
      
      // Find or create the team's default board
      let teamBoards = await Board.filter({ team_id: schedule.team_id });
      let board;
      
      if (teamBoards.length === 0) {
        console.log('No board found, creating default board for team:', schedule.team_id);
        board = await Board.create({
          team_id: schedule.team_id,
          name: `بورد ${selectedTeam.name}`,
          description: `بورد پیش‌فرض برای تیم ${selectedTeam.name}`
        });
        
        // Create default lists for the new board
        await createDefaultLists(board);
      } else {
        board = teamBoards[0];
        console.log('Using existing board:', board);
      }

      // Get or create the "To Do" list
      let boardLists = await List.filter({ board_id: board.id });
      let todoList = boardLists.find(l => l.name_en === 'To Do');
      
      if (!todoList) {
        console.log('No To Do list found, creating default lists');
        await createDefaultLists(board);
        boardLists = await List.filter({ board_id: board.id });
        todoList = boardLists.find(l => l.name_en === 'To Do');
      }

      if (!todoList) {
        alert('خطا: نمی‌توان لیست "To Do" را ایجاد کرد');
        return;
      }

      const form = await Form.get(schedule.form_id);
      
      // Calculate due date
      const [hours, minutes] = schedule.due_time.split(':');
      const dueAt = new Date();
      dueAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      console.log('Creating tasks for assignees:', schedule.assignee_ids);

      // Create assignments and tasks for each assignee
      for (const assigneeId of schedule.assignee_ids) {
        const assignmentTitle = `${form.title} - ${new Date().toLocaleDateString('fa-IR')}`;
        
        console.log('Creating assignment for user:', assigneeId);
        const assignment = await FormAssignment.create({
          form_id: schedule.form_id,
          schedule_id: schedule.id,
          assignee_id: assigneeId,
          title: assignmentTitle,
          due_at: dueAt.toISOString(),
        });
        console.log('Created assignment:', assignment);
        
        console.log('Creating task for assignment:', assignment.id);
        const task = await Task.create({
          board_id: board.id,
          list_id: todoList.id,
          title: `تکمیل فرم: ${form.title}`,
          description: `لطفاً فرم "${form.title}" را به عنوان بخشی از این کار تکمیل کنید.`,
          assignee_id: assigneeId,
          due_at: dueAt.toISOString(),
          priority: 'medium',
          form_assignment_id: assignment.id,
          position: 999
        });
        console.log('Created task:', task);

        // Link them two-way
        await FormAssignment.update(assignment.id, { task_id: task.id });
        console.log('Linked assignment and task');
      }
      
      console.log('Successfully generated all assignments and tasks');
    } catch (error) {
      console.error('Error generating assignments and tasks:', error);
      alert('خطا در ایجاد تکالیف اولیه: ' + error.message);
      throw error;
    }
  };

  const createDefaultLists = async (board) => {
    console.log('Creating default lists for board:', board.id);
    const defaultLists = [
      { name: "انجام شود", name_en: "To Do", position: 1, color: "#6b7280" },
      { name: "در حال انجام", name_en: "Doing", position: 2, color: "#7c3aed", wip_limit: 3 },
      { name: "انجام شده", name_en: "Done", position: 3, color: "#16a34a" }
    ];

    for (const listData of defaultLists) {
      const list = await List.create({
        board_id: board.id,
        ...listData
      });
      console.log('Created list:', list);
    }
  };

  const handleSaveSchedule = async (scheduleData) => {
    try {
      console.log('Saving schedule:', scheduleData);
      let savedSchedule;
      
      if (editingSchedule) {
        savedSchedule = await FormSchedule.update(editingSchedule.id, scheduleData);
        console.log('Updated existing schedule:', savedSchedule);
      } else {
        savedSchedule = await FormSchedule.create(scheduleData);
        console.log('Created new schedule:', savedSchedule);
        
        // Generate first set of assignments for a NEW schedule
        console.log('Generating initial assignments and tasks...');
        await generateAssignmentsAndTasks(savedSchedule);
        console.log('Initial assignments and tasks generated successfully');
      }
      
      await loadTeamData(selectedTeam.id);
      setShowScheduleModal(false);
      setSelectedFormForSchedule(null);
      setEditingSchedule(null);
      
      const message = editingSchedule 
        ? 'زمان‌بندی با موفقیت به‌روزرسانی شد!' 
        : 'زمان‌بندی با موفقیت ایجاد و تکالیف اولیه در بورد کانبان تولید شدند!';
      
      alert(message);
      
    } catch (error) {
      console.error('خطا در ذخیره زمان‌بندی:', error);
      alert('خطا در ذخیره زمان‌بندی: ' + error.message);
      throw error;
    }
  };
  
  const handleDeleteSchedule = async (scheduleId) => {
    if (confirm('آیا از حذف این زمان‌بندی مطمئن هستید؟')) {
      try {
        await FormSchedule.delete(scheduleId);
        await loadTeamData(selectedTeam.id);
        alert('زمان‌بندی حذف شد.');
      } catch (error) {
        console.error('Error deleting schedule:', error);
      }
    }
  };

  const handleToggleSchedule = async (schedule) => {
    try {
      await FormSchedule.update(schedule.id, { is_active: !schedule.is_active });
      await loadTeamData(selectedTeam.id);
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  const handleImportForm = async (formData) => {
    try {
      if (!selectedTeam) return;

      // Create the form
      const newForm = await Form.create({
        team_id: selectedTeam.id,
        title: formData.title,
        description: formData.description,
        is_active: true
      });

      // Create all the fields
      for (const fieldData of formData.fields) {
        await FormField.create({
          form_id: newForm.id,
          ...fieldData
        });
      }

      // Reload team data
      await loadTeamData(selectedTeam.id);
      setShowImportModal(false);
      
      alert(`فرم "${formData.title}" با ${formData.fields.length} فیلد با موفقیت وارد شد!`);
    } catch (error) {
      console.error('Error importing form:', error);
      alert('خطا در وارد کردن فرم: ' + error.message);
    }
  };

  const handleExportFormSubmissions = async (formId) => {
    try {
      const form = forms.find(f => f.id === formId);
      if (!form) return;

      const submissions = await FormSubmission.filter({ form_id: formId });
      if (submissions.length === 0) {
        alert('هیچ داده‌ای برای خروجی گرفتن وجود ندارد.');
        return;
      }

      // Get user names for submitter IDs
      const userIds = [...new Set(submissions.map(s => s.submitter_id))];
      const users = await User.filter({ id: { $in: userIds }});
      const userMap = new Map(users.map(u => [u.id, u.full_name || u.email]));

      // Collect all possible headers from all submissions
      const dataHeaders = new Set();
      submissions.forEach(sub => {
        if (sub.data) {
          Object.keys(sub.data).forEach(key => dataHeaders.add(key));
        }
      });

      const sanitizeCsvValue = (value) => {
        if (value === null || value === undefined) return '';
        let strValue = String(value);
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
          strValue = strValue.replace(/"/g, '""');
          return `"${strValue}"`;
        }
        return strValue;
      };

      const headers = ['زمان ارسال', 'ارسال کننده', ...Array.from(dataHeaders)];
      const csvRows = [headers.map(sanitizeCsvValue).join(',')];

      submissions.forEach(sub => {
        const row = [
          sanitizeCsvValue(new Date(sub.submitted_at).toLocaleString('fa-IR')),
          sanitizeCsvValue(userMap.get(sub.submitter_id) || sub.submitter_id),
        ];
        
        Array.from(dataHeaders).forEach(header => {
          const value = sub.data ? sub.data[header] : '';
          row.push(sanitizeCsvValue(value));
        });

        csvRows.push(row.join(','));
      });
      
      const blob = new Blob([`\uFEFF${csvRows.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${form.title.replace(/\s+/g, '_')}_submissions.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up the object URL

    } catch (error) {
      console.error('Error exporting submissions:', error);
      alert('خطا در خروجی گرفتن داده‌ها: ' + error.message);
    }
  };

  if (loading && teams.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">فرم‌ها و چک‌لیست‌ها</h1>
            <p className="text-slate-600">طراحی، مدیریت و زمان‌بندی فرم‌های عملیاتی</p>
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            {teams.length > 0 && selectedTeam && (
              <TeamSelector teams={teams} selectedTeam={selectedTeam} onTeamSelect={handleTeamSelect} />
            )}
            <Button 
              onClick={() => setShowImportModal(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 hover-lift"
            >
              <Upload className="w-4 h-4 ml-2" />
              وارد کردن فرم
            </Button>
            <Button onClick={handleCreateForm} className="bg-gradient-to-r from-blue-600 to-blue-700 hover-lift">
              <Plus className="w-4 h-4 ml-2" />
              فرم جدید
            </Button>
          </div>
        </div>

        {/* Form Templates Section */}
        <Card className="glass-effect border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <FileText className="w-6 h-6 text-blue-600" />
              قالب‌های فرم
            </CardTitle>
          </CardHeader>
          <CardContent>
            {forms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">هیچ فرمی برای تیم {selectedTeam?.name} تعریف نشده.</p>
                <Button onClick={handleCreateForm} className="hover-lift">
                  <Plus className="w-4 h-4 ml-2" />
                  ایجاد اولین فرم
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forms.map(form => (
                  <Card key={form.id} className="hover-lift bg-white/70">
                    <CardHeader>
                      <CardTitle className="text-lg">{form.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-slate-600 line-clamp-2 h-10">{form.description || 'بدون توضیحات'}</p>
                      <div className="flex justify-between items-center pt-4 border-t">
                        <Badge variant={form.is_active ? "default" : "secondary"}>
                          {form.is_active ? 'فعال' : 'غیرفعال'}
                        </Badge>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExportFormSubmissions(form.id)}
                            title="خروجی CSV"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Link to={createPageUrl(`FormPreview?formId=${form.id}`)}>
                            <Button variant="outline" size="sm" title="پیش‌نمایش">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleScheduleForm(form)}
                            title="زمان‌بندی"
                          >
                            <Calendar className="w-4 h-4" />
                          </Button>
                          <Link to={createPageUrl(`FormEditor?formId=${form.id}`)}>
                            <Button variant="outline" size="sm" title="ویرایش">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteForm(form.id)} title="حذف">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedules Section */}
        <Card className="glass-effect border-none shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Calendar className="w-6 h-6 text-purple-600" />
                زمان‌بندی‌ها
              </CardTitle>
              <Button 
                className="bg-purple-600 hover:bg-purple-700 hover-lift" 
                onClick={() => handleScheduleForm(null)}
                disabled={forms.length === 0}
              >
                <Plus className="w-4 h-4 ml-2" />
                زمان‌بندی جدید
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">هیچ زمان‌بندی فعالی وجود ندارد.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schedules.map(schedule => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    form={forms.find(f => f.id === schedule.form_id)}
                    onEdit={() => handleEditSchedule(schedule)}
                    onToggle={handleToggleSchedule}
                    onDelete={handleDeleteSchedule}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Management & Analytics Section */}
        {selectedTeam && (
          <div className="space-y-8 pt-8 border-t border-slate-200">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">مدیریت و نظارت بر فرم‌ها</h2>
              <p className="text-slate-600">آمار، تکالیف در انتظار و آخرین ارسال‌ها</p>
            </div>

            {/* Analytics */}
            <FormAnalytics analytics={analytics} />

            {/* Pending & Recent Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
              <PendingAssignments 
                assignments={pendingAssignments} 
                users={allUsers}
              />
              
              <RecentSubmissions 
                submissions={recentSubmissions}
                users={allUsers}
                forms={forms}
                onViewSubmission={handleViewSubmission}
              />
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && selectedTeam && (
          <ImportFormModal
            team={selectedTeam}
            onClose={() => setShowImportModal(false)}
            onImport={handleImportForm}
          />
        )}

        {/* Schedule Modal */}
        {showScheduleModal && selectedTeam && (
          <FormScheduleModal
            form={selectedFormForSchedule}
            schedule={editingSchedule}
            team={selectedTeam}
            onClose={() => {
              setShowScheduleModal(false);
              setSelectedFormForSchedule(null);
              setEditingSchedule(null);
            }}
            onSave={handleSaveSchedule}
          />
        )}

        {/* Submission View Modal */}
        {showSubmissionModal && viewingSubmission && (
          <SubmissionViewModal
            submission={viewingSubmission}
            form={forms.find(f => f.id === viewingSubmission.form_id)}
            user={allUsers.find(u => u.id === viewingSubmission.submitter_id)}
            onClose={() => {
              setShowSubmissionModal(false);
              setViewingSubmission(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
