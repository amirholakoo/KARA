import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";

export default function TeamSelector({ teams, selectedTeam, onTeamSelect }) {
  return (
    <div className="flex items-center gap-3">
      <Users className="w-5 h-5 text-slate-600" />
      <Select 
        value={selectedTeam?.id || ""} 
        onValueChange={(teamId) => {
          const team = teams.find(t => t.id === teamId);
          if (team) {
            onTeamSelect(team);
          }
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="انتخاب تیم" />
        </SelectTrigger>
        <SelectContent>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: team.color }}
                ></div>
                <span>{team.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}