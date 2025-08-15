import React from 'react';
import { Draggable } from "@hello-pangea/dnd";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle } from "lucide-react";
import TaskCard from "./TaskCard";

export default function KanbanList({ list, tasks, provided, isDraggingOver, onTaskClick, onCreateTask, user }) {
  const getWIPViolation = () => {
    if (!list.wip_limit) return false;
    const userTasksInList = tasks.filter(task => task.assignee_id === user?.id);
    return userTasksInList.length > list.wip_limit;
  };
  
  const hasWIPViolation = getWIPViolation();

  return (
    <div
      ref={provided.innerRef}
      {...provided.droppableProps}
      className="flex flex-col h-full"
    >
      <Card className={`glass-effect border-none shadow-lg flex-1 flex flex-col ${
        hasWIPViolation ? 'border-red-300 bg-red-50/50' : ''
      }`}>
        <CardHeader className="pb-3 sticky top-0 bg-white/80 backdrop-blur-sm z-10">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: list.color }}
              ></div>
              <span>{list.name}</span>
              <span className="text-sm font-normal text-slate-500 persian-nums">
                ({tasks.length})
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
        
        <CardContent className={`pt-0 flex-1 overflow-y-auto space-y-3 p-2 rounded-lg transition-colors min-h-[400px] ${
          isDraggingOver ? 'bg-blue-50' : ''
        }`}>
          {tasks.map((task, index) => (
            <Draggable key={task.id} draggableId={task.id} index={index}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className={`${
                    snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                  }`}
                >
                  <TaskCard
                    task={task}
                    onClick={() => onTaskClick(task)}
                  />
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
          
          {tasks.length === 0 && !isDraggingOver && (
            <div className="text-center text-slate-400 pt-16">
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
        </CardContent>
      </Card>
    </div>
  );
}