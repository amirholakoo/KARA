
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle } from "lucide-react";

import TaskCard from "./TaskCard";

export default function KanbanBoard({ 
  lists, 
  tasks, 
  onTaskClick, 
  onCreateTask, 
  onTaskMove,
  getTasksForList,
  user,
  teamMembers
}) {
  const getWIPViolation = (list, listTasks) => {
    if (!list.wip_limit) return false;
    const userTasksInList = listTasks.filter(task => task.assignee_id === user?.id);
    return userTasksInList.length > list.wip_limit;
  };

  const handleDrop = (event, listId) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    if (taskId && onTaskMove) {
      onTaskMove(taskId, listId);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[600px]">
      {lists.map((list) => {
        const listTasks = getTasksForList(list.id);
        const hasWIPViolation = getWIPViolation(list, listTasks);

        return (
          <div 
            key={list.id} 
            className="flex flex-col"
            onDrop={(e) => handleDrop(e, list.id)}
            onDragOver={handleDragOver}
          >
            <Card className={`glass-effect border-none shadow-lg flex-1 ${
              hasWIPViolation ? 'border-red-300 bg-red-50/50' : ''
            }`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: list.color }}
                    ></div>
                    <span>{list.name}</span>
                    <span className="text-sm font-normal text-slate-500 persian-nums">
                      ({listTasks.length})
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {hasWIPViolation && (
                      <AlertTriangle className="w-4 h-4 text-red-500" title="تجاوز از حد مجاز WIP" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCreateTask(list.id)}
                      className="hover:bg-blue-50"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
                
                {list.wip_limit && (
                  <div className="text-xs text-slate-500">
                    حداکثر WIP: {list.wip_limit} کار برای هر کاربر
                  </div>
                )}
                
                {hasWIPViolation && (
                  <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                    ⚠️ تجاوز از حد مجاز کارهای در حال انجام
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="pt-0 flex-1">
                <div className="space-y-3 min-h-[400px] p-2 rounded-lg">
                  {listTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick(task)}
                      teamMembers={teamMembers}
                    />
                  ))}
                  
                  {listTasks.length === 0 && (
                    <div className="text-center text-slate-400 py-8">
                      <div className="text-4xl mb-2">📝</div>
                      <p>هیچ کاری وجود ندارد</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCreateTask(list.id)}
                        className="mt-3 hover-lift"
                      >
                        <Plus className="w-4 h-4 ml-1" />
                        افزودن کار
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
