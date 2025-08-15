import React, { useState, useEffect } from 'react';
import { Task, FormSubmission, Team, User, Board } from '@/api/entities';
import { subDays, startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import {
  BarChart3,
  Loader2
} from 'lucide-react';

import ReportFilters from '../components/reports/ReportFilters';
import PerformanceKPIs from '../components/reports/PerformanceKPIs';
import TaskTrendsChart from '../components/reports/TaskTrendsChart';
import TeamPerformanceChart from '../components/reports/TeamPerformanceChart';
import TaskStatusDistribution from '../components/reports/TaskStatusDistribution';
import DetailedTaskTable from '../components/reports/DetailedTaskTable';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({});
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [boards, setBoards] = useState([]);
  
  const [filters, setFilters] = useState({
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date(),
    },
    teamId: 'all',
  });

  useEffect(() => {
    loadBaseData();
  }, []);
  
  useEffect(() => {
    if (teams.length > 0 && filters.dateRange?.from && filters.dateRange?.to) {
      loadAnalytics();
    }
  }, [filters, teams, boards]);
  
  const loadBaseData = async () => {
    try {
      const [allTeams, allUsers, allBoards] = await Promise.all([Team.list(), User.list(), Board.list()]);
      setTeams(allTeams);
      setUsers(allUsers);
      setBoards(allBoards);
    } catch(e) {
      console.error("Error loading base data", e);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const { dateRange, teamId } = filters;
      
      if (!dateRange || !dateRange.from || !dateRange.to) {
        console.error("Invalid date range:", dateRange);
        setLoading(false);
        return;
      }

      const boardToTeamMap = new Map(boards.map(b => [b.id, b.team_id]));

      const allTasks = await Task.list('-created_date', 1000);
      
      const tasksWithTeam = allTasks.map(task => ({
          ...task,
          team_id: boardToTeamMap.get(task.board_id)
      }));
      
      const tasks = tasksWithTeam.filter(task => {
        if (!task.created_date) return false;
        
        const taskDate = new Date(task.created_date);
        const inDateRange = taskDate >= dateRange.from && taskDate <= dateRange.to;
        const inTeam = teamId === 'all' ? true : task.team_id === teamId;
        return inDateRange && inTeam;
      });

      // --- Data Processing ---
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'done');
      const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_at && new Date(t.due_at) < new Date());
      const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
      
      // Trend data (created vs completed)
      const trendData = {};
      tasks.forEach(task => {
        if (!task.created_date) return;
        
        const date = format(new Date(task.created_date), 'yyyy-MM-dd');
        if (!trendData[date]) trendData[date] = { date, created: 0, completed: 0 };
        trendData[date].created += 1;
        
        if (task.status === 'done' && task.completed_at) {
          const completedDate = format(new Date(task.completed_at), 'yyyy-MM-dd');
          if (!trendData[completedDate]) trendData[completedDate] = { date: completedDate, created: 0, completed: 0 };
          trendData[completedDate].completed += 1;
        }
      });
      
      // Team performance
      const teamPerformance = (teamId === 'all' ? teams : [teams.find(t => t.id === teamId)]).filter(Boolean).map(team => ({
        teamName: team.name,
        completed: tasks.filter(t => t.team_id === team.id && t.status === 'done').length,
        total: tasks.filter(t => t.team_id === team.id).length,
      }));

      // Status distribution
      const statusDistribution = [
        { name: 'انجام شود', value: tasks.filter(t => t.status === 'todo').length },
        { name: 'در حال انجام', value: tasks.filter(t => t.status === 'doing').length },
        { name: 'انجام شده', value: completedTasks.length },
        { name: 'مسدود', value: tasks.filter(t => t.status === 'stuck').length },
      ];

      setAnalyticsData({
        kpis: {
          totalTasks,
          completionRate,
          overdueTasks: overdueTasks.length,
          avgCompletionTime: '۳.۵ ساعت', // Mock for now
        },
        taskTrends: Object.values(trendData).sort((a,b) => new Date(a.date) - new Date(b.date)),
        teamPerformance,
        statusDistribution,
        detailedTasks: tasks
      });

    } catch (error) {
      console.error("Error loading analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              گزارشات و تحلیل‌ها
            </h1>
            <p className="text-slate-600">
              بررسی عملکرد تیم و بهره‌وری کارها با گزارشات پویا
            </p>
          </div>
        </div>

        {/* Filters */}
        <ReportFilters
          filters={filters}
          onFilterChange={setFilters}
          teams={teams}
        />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="mr-3 text-slate-600">در حال بارگذاری گزارشات...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPIs */}
            <PerformanceKPIs data={analyticsData.kpis} />
            
            {/* Charts Grid */}
            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                <TaskTrendsChart data={analyticsData.taskTrends} />
              </div>
              <div className="lg:col-span-2">
                <TaskStatusDistribution data={analyticsData.statusDistribution} />
              </div>
            </div>

            {/* Team Performance */}
            <TeamPerformanceChart data={analyticsData.teamPerformance} />
            
            {/* Detailed Table */}
            <DetailedTaskTable 
              tasks={analyticsData.detailedTasks}
              users={users}
              teams={teams}
            />
          </div>
        )}
      </div>
    </div>
  );
}