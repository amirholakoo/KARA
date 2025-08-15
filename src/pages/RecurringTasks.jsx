
import React, { useState, useEffect } from "react";
import { TaskTemplate, Team, User, Task, List, Board } from "@/api/entities"; // Added List and Board
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Repeat, 
  Clock, 
  Calendar,
  Settings,
  Play,
  Pause,
  Edit,
  Trash2,
  Zap,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { addDays, addWeeks, addMonths, addYears, isBefore, startOfDay } from "date-fns"; // Added date-fns imports

import CreateRecurringTaskModal from "../components/recurring/CreateRecurringTaskModal";
import RecurringTaskCard from "../components/recurring/RecurringTaskCard";
import TeamSelector from "../components/boards/TeamSelector";
import RecurringScheduleReport from "../components/recurring/RecurringScheduleReport"; // New import

export default function RecurringTasksPage() {
  const [templates, setTemplates] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false); // New state for generation loading

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const currentUser = await User.me();
      setUser(currentUser);

      const allTeams = await Team.list();
      setTeams(allTeams);
      
      if (allTeams.length > 0) {
        const firstTeam = allTeams[0]; // Use a variable for clarity
        setSelectedTeam(firstTeam);
        await loadTemplates(firstTeam.id);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
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

  const handleTeamSelect = async (team) => {
    setSelectedTeam(team);
    await loadTemplates(team.id);
  };
  
  const handleGenerateTasks = async () => {
    setIsGenerating(true);
    let tasksCreatedCount = 0;
    
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
          // If never spawned, treat it as due today to initiate the cycle
          nextDueDate = today; 
        } else {
          const { frequency, interval = 1 } = template.recurrence_rule;
          switch (frequency) {
            case 'daily': nextDueDate = addDays(lastSpawned, interval); break;
            case 'weekly': nextDueDate = addWeeks(lastSpawned, interval); break;
            case 'monthly': nextDueDate = addMonths(lastSpawned, interval); break;
            case 'yearly': nextDueDate = addYears(lastSpawned, interval); break;
            default: continue; // Skip if frequency is unknown
          }
        }
        
        // Only generate if the next due date is today or in the past
        if (isBefore(nextDueDate, today) || nextDueDate.getTime() === today.getTime()) {
          await Task.create({
            board_id: defaultBoard.id,
            list_id: todoList.id,
            title: template.title,
            description: template.description,
            assignee_id: template.default_assignee_id,
            due_at: new Date().toISOString(), // Set due date to now
            priority: template.priority,
            status: 'todo',
            template_id: template.id,
            estimated_hours: template.estimated_hours,
          });

          await TaskTemplate.update(template.id, {
            last_spawned_at: new Date().toISOString() // Update last spawned time to now
          });
          tasksCreatedCount++;
        }
      }
      
      alert(`${tasksCreatedCount} کار جدید با موفقیت ایجاد شد!`);
    } catch(error) {
      console.error("Error generating tasks:", error);
      alert("خطا در ایجاد کارهای تکراری.");
    } finally {
      setIsGenerating(false);
      // Re-load templates to reflect updated last_spawned_at if needed, though not strictly necessary for this view
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
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setShowCreateModal(true);
  };

  const handleUpdateTemplate = async (templateData) => {
    try {
      await TaskTemplate.update(editingTemplate.id, templateData);
      await loadTemplates(selectedTeam.id);
      setShowCreateModal(false);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-white/50 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              کارهای تکراری و دوره‌ای
            </h1>
            <p className="text-slate-600">
              مدیریت کارهای تکراری مثل پرداخت قبوض، نگهداری دستگاه‌ها و بازرسی‌های دوره‌ای
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            {teams.length > 0 && selectedTeam && (
              <TeamSelector 
                teams={teams}
                selectedTeam={selectedTeam}
                onTeamSelect={handleTeamSelect}
              />
            )}
            <Button
              onClick={handleGenerateTasks}
              disabled={isGenerating || !selectedTeam || templates.filter(t => t.is_active).length === 0} // Disable if no active templates
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white hover-lift"
            >
              <Zap className="w-4 h-4 ml-2" />
              {isGenerating ? 'در حال ایجاد...' : 'اکنون وظایف را ایجاد کنید'}
            </Button>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover-lift"
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
                  <Pause className="w-6 h-6 text-orange-600" />
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
        {selectedTeam && (
          <RecurringScheduleReport selectedTeam={selectedTeam} />
        )}

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
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 hover-lift"
              >
                <Plus className="w-4 h-4 ml-2" />
                ایجاد کار تکراری
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">الگوهای کار تکراری</h2>
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

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <CreateRecurringTaskModal
            template={editingTemplate}
            onClose={() => {
              setShowCreateModal(false);
              setEditingTemplate(null);
            }}
            onCreate={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
          />
        )}
      </div>
    </div>
  );
}
