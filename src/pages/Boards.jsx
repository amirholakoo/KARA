
import React, { useState, useEffect } from "react";
import { Team, Board, List, Task, User, TaskTemplate, TeamMember } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Filter, 
  Users, 
  Clock, 
  AlertTriangle,
  MoreVertical,
  Calendar,
  CheckCircle,
  User as UserIcon,
  Repeat,
  Zap
} from "lucide-react";
import { addDays, addWeeks, addMonths, addYears, isBefore, startOfDay } from "date-fns";

import TeamSelector from "../components/boards/TeamSelector";
import KanbanBoard from "../components/boards/KanbanBoard";
import TaskModal from "../components/boards/TaskModal";
import CreateTaskModal from "../components/boards/CreateTaskModal";
import RecurringTaskCard from "../components/recurring/RecurringTaskCard";
import CreateRecurringTaskModal from "../components/recurring/CreateRecurringTaskModal";
import RecurringScheduleReport from "../components/recurring/RecurringScheduleReport";
import NotificationService from "../components/utils/notificationService";

export default function BoardsPage() {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalListId, setCreateModalListId] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  // Recurring tasks state
  const [templates, setTemplates] = useState([]);
  const [showCreateRecurringModal, setShowCreateRecurringModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load current user
      const currentUser = await User.me();
      setUser(currentUser);

      // Load all teams
      const allTeams = await Team.list();
      console.log('Loaded teams:', allTeams);
      setTeams(allTeams);
      
      if (allTeams.length > 0) {
        setSelectedTeam(allTeams[0]);
        await loadTeamData(allTeams[0]);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamData = async (team) => {
    try {
      // Load boards for the team
      const teamBoards = await Board.filter({ team_id: team.id });
      console.log('Loaded boards for team:', teamBoards);
      setBoards(teamBoards);
      
      if (teamBoards.length > 0) {
        setSelectedBoard(teamBoards[0]);
        await loadBoardData(teamBoards[0]);
      } else {
        // Create default board if none exists
        const newBoard = await Board.create({
          team_id: team.id,
          name: `بورد ${team.name}`,
          description: `بورد پیش‌فرض برای تیم ${team.name}`
        });
        setSelectedBoard(newBoard);
        await createDefaultLists(newBoard);
        await loadBoardData(newBoard);
      }

      // Load recurring task templates for the team
      await loadTemplates(team.id);

      // Load team members
      const members = await TeamMember.filter({ team_id: team.id });
      if (members.length > 0) {
        const userIds = members.map(m => m.user_id);
        // Assuming User.filter can take an array of IDs for the 'id' field
        const users = await User.filter({ id: { $in: userIds } });
        setTeamMembers(users);
      } else {
        setTeamMembers([]);
      }

    } catch (error) {
      console.error('Error loading team data:', error);
    }
  };

  const loadTemplates = async (teamId) => {
    try {
      const teamTemplates = await TaskTemplate.filter({ team_id: teamId }, '-created_date');
      setTemplates(teamTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const createDefaultLists = async (board) => {
    const defaultLists = [
      { name: "انجام شود", name_en: "To Do", position: 1, color: "#6b7280" },
      { name: "در حال انجام", name_en: "Doing", position: 2, color: "#7c3aed", wip_limit: 3 },
      { name: "انجام شده", name_en: "Done", position: 3, color: "#16a34a" }
    ];

    for (const listData of defaultLists) {
      await List.create({
        board_id: board.id,
        ...listData
      });
    }
  };

  const loadBoardData = async (board) => {
    try {
      // Load lists for the board
      const boardLists = await List.filter({ board_id: board.id }, 'position');
      console.log('Loaded lists for board:', boardLists);
      setLists(boardLists);

      // Load tasks for the board
      const boardTasks = await Task.filter({ board_id: board.id });
      console.log('Loaded tasks for board:', boardTasks);
      setTasks(boardTasks);
    } catch (error) {
      console.error('Error loading board data:', error);
    }
  };

  const handleTeamSelect = async (team) => {
    setSelectedTeam(team);
    await loadTeamData(team);
  };

  const handleTaskMove = async (taskId, newListId) => {
    try {
      // Update task in database
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await Task.update(taskId, {
          ...task,
          list_id: newListId
        });
        
        // Reload board data
        await loadBoardData(selectedBoard);
      }
    } catch (error) {
      console.error('Error moving task:', error);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleCreateTask = (listId) => {
    setCreateModalListId(listId);
    setShowCreateModal(true);
  };

  const handleTaskUpdate = async () => {
    await loadBoardData(selectedBoard);
    setShowTaskModal(false);
    setSelectedTask(null);
  };

  const handleTaskCreate = async () => {
    await loadBoardData(selectedBoard);
    setShowCreateModal(false);
    setCreateModalListId(null);
  };

  const getTasksForList = (listId) => {
    return tasks.filter(task => task.list_id === listId);
  };

  // Recurring task handlers
  const handleGenerateTasks = async () => {
    setIsGenerating(true);
    let tasksCreatedCount = 0;
    let templatesUsed = [];
    
    try {
      if (!selectedTeam) {
        alert("لطفا یک تیم انتخاب کنید.");
        return;
      }

      const activeTemplates = await TaskTemplate.filter({ team_id: selectedTeam.id, is_active: true });
      const boards = await Board.filter({ team_id: selectedTeam.id });
      if (boards.length === 0) {
        alert("تیمی که انتخاب کرده اید، بوردی ندارد. لطفا ابتدا یک بورد بسازید.");
        return;
      }
      const defaultBoard = boards[0];
      const lists = await List.filter({ board_id: defaultBoard.id });
      const todoList = lists.find(l => l.name_en === 'To Do');

      if (!todoList) {
        alert("بورد پیش فرض این تیم لیست 'To Do' ندارد.");
        return;
      }

      const today = startOfDay(new Date());

      for (const template of activeTemplates) {
        const lastSpawned = template.last_spawned_at ? startOfDay(new Date(template.last_spawned_at)) : null;
        if (!template.recurrence_rule) continue;

        let nextDueDate;
        if (!lastSpawned) {
          nextDueDate = today; 
        } else {
          const { frequency, interval = 1 } = template.recurrence_rule;
          switch (frequency) {
            case 'daily': nextDueDate = addDays(lastSpawned, interval); break;
            case 'weekly': nextDueDate = addWeeks(lastSpawned, interval); break;
            case 'monthly': nextDueDate = addMonths(lastSpawned, interval); break;
            case 'yearly': nextDueDate = addYears(lastSpawned, interval); break;
            default: continue;
          }
        }
        
        if (isBefore(nextDueDate, today) || nextDueDate.getTime() === today.getTime()) {
          const createdTask = await Task.create({
            board_id: defaultBoard.id,
            list_id: todoList.id,
            title: template.title,
            description: template.description,
            assignee_id: template.default_assignee_id,
            due_at: new Date().toISOString(),
            priority: template.priority,
            status: 'todo',
            template_id: template.id,
            estimated_hours: template.estimated_hours,
          });

          // Send notification to assignee
          if (template.default_assignee_id) {
            await NotificationService.notifyTaskAssigned(
              createdTask, 
              template.default_assignee_id, 
              user?.id
            );
          }

          await TaskTemplate.update(template.id, {
            last_spawned_at: new Date().toISOString()
          });
          
          tasksCreatedCount++;
          templatesUsed.push(template);
        }
      }
      
      // Notify team members about recurring tasks generation
      if (tasksCreatedCount > 0) {
        await NotificationService.notifyRecurringTasksGenerated(
          selectedTeam.id, 
          tasksCreatedCount, 
          templatesUsed
        );
      }
      
      alert(`${tasksCreatedCount} کار جدید با موفقیت ایجاد شد!`);
      
      // Reload board data to show new tasks
      await loadBoardData(selectedBoard);
    } catch(error) {
      console.error("Error generating tasks:", error);
      alert("خطا در ایجاد کارهای تکراری.");
    } finally {
      setIsGenerating(false);
      if (selectedTeam) {
        await loadTemplates(selectedTeam.id);
      }
    }
  };

  const handleCreateTemplate = async (templateData) => {
    try {
      await TaskTemplate.create({
        ...templateData,
        team_id: selectedTeam.id
      });
      await loadTemplates(selectedTeam.id);
      setShowCreateRecurringModal(false);
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setShowCreateRecurringModal(true);
  };

  const handleUpdateTemplate = async (templateData) => {
    try {
      await TaskTemplate.update(editingTemplate.id, templateData);
      await loadTemplates(selectedTeam.id);
      setShowCreateRecurringModal(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  const handleToggleTemplate = async (template) => {
    try {
      await TaskTemplate.update(template.id, {
        ...template,
        is_active: !template.is_active
      });
      await loadTemplates(selectedTeam.id);
    } catch (error) {
      console.error('Error toggling template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (confirm('آیا مطمئن هستید که می‌خواهید این الگو را حذف کنید؟')) {
      try {
        await TaskTemplate.delete(templateId);
        await loadTemplates(selectedTeam.id);
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const getRecurrenceText = (recurrenceRule) => {
    if (!recurrenceRule) return 'یکبار';
    
    const { frequency, interval = 1 } = recurrenceRule;
    
    const frequencies = {
      daily: interval === 1 ? 'روزانه' : `هر ${interval} روز`,
      weekly: interval === 1 ? 'هفتگی' : `هر ${interval} هفته`,
      monthly: interval === 1 ? 'ماهانه' : `هر ${interval} ماه`,
      yearly: interval === 1 ? 'سالانه' : `هر ${interval} سال`
    };
    
    return frequencies[frequency] || 'نامشخص';
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded-lg w-1/3"></div>
            <div className="h-64 bg-white/50 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              کانبان تیم‌ها
            </h1>
            <p className="text-slate-600">
              مدیریت کارها و پروژه‌های تیمی
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            {teams.length > 0 && (
              <TeamSelector 
                teams={teams}
                selectedTeam={selectedTeam}
                onTeamSelect={handleTeamSelect}
              />
            )}
          </div>
        </div>

        {/* Board Info */}
        {selectedBoard && (
          <Card className="glass-effect border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedTeam?.color || '#1e40af' }}
                  ></div>
                  <span>{selectedBoard.name}</span>
                </div>
                <div className="text-sm text-slate-500 persian-nums">
                  {tasks.length} کار در مجموع
                </div>
              </CardTitle>
            </CardHeader>
          </Card>
        )}

        {/* Kanban Board */}
        {selectedBoard && lists.length > 0 ? (
          <KanbanBoard
            lists={lists}
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onCreateTask={handleCreateTask}
            onTaskMove={handleTaskMove}
            getTasksForList={getTasksForList}
            user={user}
            teamMembers={teamMembers}
          />
        ) : (
          <Card className="glass-effect border-none shadow-lg">
            <CardContent className="p-8 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">
                {teams.length === 0 ? 'هیچ تیمی وجود ندارد' : 'در حال بارگذاری...'}
              </h3>
              <p className="text-slate-500">
                {teams.length === 0 ? 
                  'ابتدا تیم‌ها را در بخش تنظیمات ایجاد کنید' : 
                  'لطفاً صبر کنید تا داده‌ها بارگذاری شوند'
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recurring Tasks Section */}
        {selectedTeam && (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pt-8 border-t border-slate-200">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                  <Repeat className="w-8 h-8 text-purple-600" />
                  کارهای تکراری و دوره‌ای
                </h2>
                <p className="text-slate-600">
                  مدیریت کارهای تکراری مثل پرداخت قبوض، نگهداری دستگاه‌ها و بازرسی‌های دوره‌ای
                </p>
              </div>
              
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <Button
                  onClick={handleGenerateTasks}
                  disabled={isGenerating || !selectedTeam || templates.filter(t => t.is_active).length === 0}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white hover-lift"
                >
                  <Zap className="w-4 h-4 ml-2" />
                  {isGenerating ? 'در حال ایجاد...' : 'اکنون وظایف را ایجاد کنید'}
                </Button>
                <Button 
                  onClick={() => setShowCreateRecurringModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 hover-lift"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  کار تکراری جدید
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="glass-effect border-none shadow-lg hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">کل الگوها</p>
                      <p className="text-2xl font-bold text-slate-800 persian-nums">
                        {templates.length}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50">
                      <Repeat className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border-none shadow-lg hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">فعال</p>
                      <p className="text-2xl font-bold text-green-600 persian-nums">
                        {templates.filter(t => t.is_active).length}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-green-50">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border-none shadow-lg hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">غیرفعال</p>
                      <p className="text-2xl font-bold text-orange-600 persian-nums">
                        {templates.filter(t => !t.is_active).length}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-orange-50">
                      <Repeat className="w-6 h-6 text-orange-600 opacity-50" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border-none shadow-lg hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">فوری</p>
                      <p className="text-2xl font-bold text-red-600 persian-nums">
                        {templates.filter(t => t.priority === 'urgent').length}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-red-50">
                      <Zap className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Schedule Report */}
            <RecurringScheduleReport selectedTeam={selectedTeam} />

            {/* Templates Grid */}
            {templates.length === 0 ? (
              <Card className="glass-effect border-none shadow-lg">
                <CardContent className="p-8 text-center">
                  <Repeat className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">
                    هیچ کار تکراری‌ای تعریف نشده
                  </h3>
                  <p className="text-slate-500 mb-6">
                    برای شروع، اولین کار تکراری خود را ایجاد کنید
                  </p>
                  <Button 
                    onClick={() => setShowCreateRecurringModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 hover-lift"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    ایجاد کار تکراری
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-4">الگوهای کار تکراری</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                      <RecurringTaskCard
                        key={template.id}
                        template={template}
                        onEdit={handleEditTemplate}
                        onToggle={handleToggleTemplate}
                        onDelete={handleDeleteTemplate}
                        getRecurrenceText={getRecurrenceText}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Task Detail Modal */}
        {showTaskModal && selectedTask && (
          <TaskModal
            task={selectedTask}
            onClose={() => setShowTaskModal(false)}
            onUpdate={handleTaskUpdate}
            user={user}
            teamMembers={teamMembers}
          />
        )}

        {/* Create Task Modal */}
        {showCreateModal && (
          <CreateTaskModal
            boardId={selectedBoard?.id}
            listId={createModalListId}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleTaskCreate}
            user={user}
            teamMembers={teamMembers}
          />
        )}

        {/* Create/Edit Recurring Task Modal */}
        {showCreateRecurringModal && (
          <CreateRecurringTaskModal
            template={editingTemplate}
            onClose={() => {
              setShowCreateRecurringModal(false);
              setEditingTemplate(null);
            }}
            onCreate={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
          />
        )}
      </div>
    </div>
  );
}
