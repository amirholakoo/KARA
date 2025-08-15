import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, Shield } from 'lucide-react';

export default function UserList({ users, teams, teamMemberships, onAssignTeams, loading }) {
    const getUserTeams = (userId) => {
        const userMemberships = teamMemberships.filter(tm => tm.user_id === userId);
        return userMemberships.map(tm => {
            const team = teams.find(t => t.id === tm.team_id);
            return team ? { ...team, role: tm.role } : null;
        }).filter(Boolean);
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            owner: 'bg-purple-100 text-purple-800',
            manager: 'bg-blue-100 text-blue-800',
            member: 'bg-green-100 text-green-800',
            viewer: 'bg-gray-100 text-gray-800'
        };
        return colors[role] || colors.member;
    };

    const getRoleLabel = (role) => {
        const labels = {
            owner: 'مالک',
            manager: 'مدیر',
            member: 'عضو',
            viewer: 'مشاهده‌گر'
        };
        return labels[role] || 'عضو';
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 bg-slate-100 rounded-lg">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {users.map(user => {
                const userTeams = getUserTeams(user.id);
                
                return (
                    <div key={user.id} className="p-4 bg-slate-50 rounded-lg hover-lift">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar className="w-12 h-12">
                                    <AvatarFallback className="bg-blue-100 text-blue-700">
                                        {user.full_name ? user.full_name.charAt(0) : user.email.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-slate-700">
                                            {user.full_name || 'نام تکمیل نشده'}
                                        </h3>
                                        {user.role === 'admin' && (
                                            <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
                                                <Shield className="w-3 h-3" />
                                                ادمین
                                            </Badge>
                                        )}
                                        {!user.profile_completed && (
                                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                                                پروفایل ناتمام
                                            </Badge>
                                        )}
                                    </div>
                                    
                                    <p className="text-sm text-slate-500">{user.email}</p>
                                    
                                    {/* User Teams */}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {userTeams.length > 0 ? (
                                            userTeams.map(team => (
                                                <Badge 
                                                    key={team.id} 
                                                    className={getRoleBadgeColor(team.role)}
                                                >
                                                    {team.name} ({getRoleLabel(team.role)})
                                                </Badge>
                                            ))
                                        ) : (
                                            <Badge variant="outline" className="text-slate-500">
                                                بدون تیم
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onAssignTeams(user)}
                                className="hover:bg-blue-50 hover:text-blue-700"
                            >
                                <UserPlus className="w-4 h-4 ml-2" />
                                مدیریت تیم‌ها
                            </Button>
                        </div>
                    </div>
                );
            })}
            
            {users.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    <p>هیچ کاربری یافت نشد.</p>
                </div>
            )}
        </div>
    );
}