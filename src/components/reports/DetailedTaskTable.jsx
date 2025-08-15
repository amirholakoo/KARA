import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from "@/components/ui/badge";
import { List } from 'lucide-react';

export default function DetailedTaskTable({ tasks, users, teams }) {
  const userMap = new Map(users.map(u => [u.id, u.full_name || u.email]));
  const teamMap = new Map(teams.map(t => [t.id, t.name]));

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || colors.medium;
  };
  
  const getStatusColor = (status) => {
    const colors = {
      todo: 'bg-blue-100 text-blue-800',
      doing: 'bg-purple-100 text-purple-800',
      done: 'bg-green-100 text-green-800',
      stuck: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.todo;
  };
  
  return (
    <Card className="glass-effect border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="w-5 h-5 text-gray-600" />
          جزئیات کارها
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>عنوان کار</TableHead>
                <TableHead>تیم</TableHead>
                <TableHead>مسئول</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>اولویت</TableHead>
                <TableHead>تاریخ ایجاد</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map(task => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>{teamMap.get(task.team_id) || 'نامشخص'}</TableCell>
                  <TableCell>{userMap.get(task.assignee_id) || 'نامشخص'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="persian-nums">
                    {new Date(task.created_date).toLocaleDateString('fa-IR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}