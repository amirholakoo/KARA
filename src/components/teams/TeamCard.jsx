import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Edit, Trash2 } from 'lucide-react';

export default function TeamCard({ team, onManageMembers, onEdit, onDelete }) {
  return (
    <Card className="hover-lift bg-white/70 flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
              style={{ backgroundColor: team.color || '#1e40af' }}
            ></div>
            <div>
              <CardTitle className="text-lg">{team.name}</CardTitle>
              <p className="text-sm text-slate-500">{team.name_en}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <p className="text-sm text-slate-600 line-clamp-2 h-10 mb-4">
          {team.description || 'بدون توضیحات'}
        </p>
        <div className="flex justify-end items-center gap-2 pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="hover:bg-red-50 hover:text-red-700"
            title="حذف تیم"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="hover:bg-blue-50 hover:text-blue-700"
            title="ویرایش تیم"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            onClick={onManageMembers}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            title="مدیریت اعضا"
          >
            <Users className="w-4 h-4 ml-2" />
            اعضا
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}