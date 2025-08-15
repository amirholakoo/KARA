import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { TeamMember } from '@/api/entities';

export default function AssignTeamsModal({ user, teams, onClose, onTeamsAssigned }) {
    const [teamAssignments, setTeamAssignments] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUserTeams = async () => {
            const memberships = await TeamMember.filter({ user_id: user.id });
            setTeamAssignments(memberships.map(m => ({ team_id: m.team_id, role: m.role })));
        };
        fetchUserTeams();
    }, [user]);

    const handleToggleTeam = (teamId) => {
        setTeamAssignments(prev => {
            const isAssigned = prev.some(a => a.team_id === teamId);
            if (isAssigned) {
                return prev.filter(a => a.team_id !== teamId);
            } else {
                return [...prev, { team_id: teamId, role: 'member' }];
            }
        });
    };
    
    const handleRoleChange = (teamId, newRole) => {
        setTeamAssignments(prev =>
            prev.map(a => a.team_id === teamId ? { ...a, role: newRole } : a)
        );
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Get current memberships from the database
            const currentMemberships = await TeamMember.filter({ user_id: user.id });
            
            // Logic to determine what to create, update, or delete
            const promises = [];

            // 1. Handle creations and updates
            for (const newAssignment of teamAssignments) {
                const existingMembership = currentMemberships.find(m => m.team_id === newAssignment.team_id);
                if (existingMembership) {
                    // It exists, check if role needs updating
                    if (existingMembership.role !== newAssignment.role) {
                        promises.push(TeamMember.update(existingMembership.id, { role: newAssignment.role }));
                    }
                } else {
                    // It's a new assignment, create it
                    promises.push(TeamMember.create({ 
                        user_id: user.id, 
                        team_id: newAssignment.team_id, 
                        role: newAssignment.role 
                    }));
                }
            }
            
            // 2. Handle deletions
            for (const existingMembership of currentMemberships) {
                const stillAssigned = teamAssignments.some(a => a.team_id === existingMembership.team_id);
                if (!stillAssigned) {
                    promises.push(TeamMember.delete(existingMembership.id));
                }
            }

            await Promise.all(promises);

            alert('تیم‌های کاربر با موفقیت به‌روزرسانی شد.');
            onTeamsAssigned();
            onClose();
        } catch (error) {
            console.error('Error assigning teams:', error);
            alert('خطا در تخصیص تیم‌ها.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent dir="rtl">
                <DialogHeader>
                    <DialogTitle>تخصیص تیم و نقش برای {user.full_name || user.email}</DialogTitle>
                    <DialogDescription>کاربر را به تیم‌ها اضافه کرده و نقش او را مشخص کنید.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    {teams.map(team => {
                        const assignment = teamAssignments.find(a => a.team_id === team.id);
                        const isAssigned = !!assignment;

                        return (
                            <div key={team.id} className="p-4 border rounded-lg flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id={`team-${team.id}`}
                                        checked={isAssigned}
                                        onCheckedChange={() => handleToggleTeam(team.id)}
                                    />
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: team.color }}
                                      ></div>
                                      <Label htmlFor={`team-${team.id}`} className="font-medium cursor-pointer">
                                        {team.name}
                                      </Label>
                                    </div>
                                </div>
                                
                                {isAssigned && (
                                    <Select
                                        value={assignment.role}
                                        onValueChange={(role) => handleRoleChange(team.id, role)}
                                    >
                                        <SelectTrigger className="w-36">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="owner">مالک</SelectItem>
                                            <SelectItem value="manager">مدیر</SelectItem>
                                            <SelectItem value="member">عضو</SelectItem>
                                            <SelectItem value="viewer">مشاهده‌گر</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        )
                    })}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>انصراف</Button>
                    <Button onClick={handleSave} disabled={loading}>{loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}