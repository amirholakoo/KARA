
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TeamMember, User } from '@/api/entities';
import { Plus, Trash2, Users, X, Crown, Shield, User as UserIcon, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import NotificationService from '@/components/utils/notificationService';

export default function ManageMembersModal({ team, onClose }) {
    const [members, setMembers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedRole, setSelectedRole] = useState('member');

    useEffect(() => {
        loadData();
    }, [team]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch current members
            const teamMembersRecords = await TeamMember.filter({ team_id: team.id });
            
            if (teamMembersRecords.length > 0) {
                const memberUserIds = teamMembersRecords.map(tm => tm.user_id);
                const memberUsers = await User.filter({ id: { $in: memberUserIds } });

                const combinedMembers = teamMembersRecords.map(tm => {
                    const user = memberUsers.find(u => u.id === tm.user_id);
                    return { 
                        ...tm, 
                        user,
                        teamMemberId: tm.id,
                        displayName: user?.full_name || user?.email || 'نام نامشخص',
                        joinDate: tm.joined_at ? new Date(tm.joined_at).toLocaleDateString('fa-IR') : 'تاریخ نامشخص'
                    };
                });
                setMembers(combinedMembers);
            } else {
                setMembers([]);
            }

            // Fetch all users in the system to populate the dropdown
            const allSystemUsers = await User.list();
            setAllUsers(allSystemUsers);
        } catch (error) {
            console.error("Error loading members data:", error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleAddMember = async () => {
        if (!selectedUser) {
            alert('لطفاً یک کاربر را انتخاب کنید.');
            return;
        }

        // Check if user is already a member
        const isAlreadyMember = members.some(m => m.user_id === selectedUser);
        if (isAlreadyMember) {
            alert('این کاربر قبلاً عضو این تیم است.');
            return;
        }

        try {
            await TeamMember.create({
                team_id: team.id,
                user_id: selectedUser,
                role: selectedRole,
                joined_at: new Date().toISOString(),
                is_active: true
            });
            
            // Get current user for notification
            const currentUser = await User.me();
            
            // Send notification about team membership
            await NotificationService.notifyTeamMemberAdded(
                team.id, 
                selectedUser, 
                currentUser?.id
            );
            
            alert('عضو جدید با موفقیت اضافه شد.');
            loadData(); // Refresh list
            setSelectedUser('');
            setSelectedRole('member');
        } catch (error) {
            console.error("Error adding member:", error);
            alert('خطا در افزودن عضو: ' + error.message);
        }
    };

    const handleRemoveMember = async (member) => {
        if (confirm(`آیا از حذف ${member.displayName} از تیم مطمئن هستید؟`)) {
            try {
                await TeamMember.delete(member.teamMemberId);
                alert('عضو با موفقیت حذف شد.');
                loadData(); // Refresh list
            } catch (error) {
                console.error("Error removing member:", error);
                alert('خطا در حذف عضو');
            }
        }
    };

    const handleChangeRole = async (member, newRole) => {
        if (member.role === newRole) return; // No change needed

        try {
            await TeamMember.update(member.teamMemberId, { role: newRole });
            alert(`نقش ${member.displayName} به ${getRoleLabel(newRole)} تغییر یافت.`);
            loadData(); // Refresh list
        } catch (error) {
            console.error("Error changing role:", error);
            alert('خطا در تغییر نقش');
        }
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

    const getRoleColor = (role) => {
        const colors = {
            owner: 'bg-purple-100 text-purple-800 border-purple-200',
            manager: 'bg-blue-100 text-blue-800 border-blue-200',
            member: 'bg-green-100 text-green-800 border-green-200',
            viewer: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[role] || colors.member;
    };

    const getRoleIcon = (role) => {
        const icons = {
            owner: Crown,
            manager: Shield,
            member: UserIcon,
            viewer: Eye
        };
        const Icon = icons[role] || UserIcon;
        return <Icon className="w-4 h-4" />;
    };

    const availableUsersToAdd = allUsers.filter(u => 
        !members.some(m => m.user_id === u.id) && u.profile_completed
    );

    const getInitials = (name) => {
        if (!name) return 'NN';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return parts[0].charAt(0) + parts[1].charAt(0);
        }
        return name.charAt(0) + (name.charAt(1) || '');
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col" dir="rtl">
                <DialogHeader className="pb-4 border-b border-slate-200">
                    <DialogTitle className="flex items-center gap-3 text-xl">
                        <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: team.color }}
                        ></div>
                        <span>مدیریت اعضای تیم: {team.name}</span>
                        <Badge variant="outline" className="mr-auto">
                            {members.length} عضو
                        </Badge>
                    </DialogTitle>
                </DialogHeader>
                
                {/* Add New Member Section */}
                <div className="p-4 bg-slate-50 rounded-lg border">
                    <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        افزودن عضو جدید
                    </h3>
                    <div className="flex items-center gap-3">
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="انتخاب کاربر..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableUsersToAdd.length === 0 ? (
                                    <div className="p-3 text-sm text-slate-500 text-center">
                                        همه کاربران فعال عضو این تیم هستند
                                    </div>
                                ) : (
                                    availableUsersToAdd.map(user => (
                                        <SelectItem key={user.id} value={user.id}>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-6 h-6">
                                                    <AvatarFallback className="text-xs">
                                                        {getInitials(user.full_name || user.email)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">
                                                        {user.full_name || 'نام تکمیل نشده'}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="owner">
                                    <div className="flex items-center gap-2">
                                        <Crown className="w-4 h-4" />
                                        مالک
                                    </div>
                                </SelectItem>
                                <SelectItem value="manager">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        مدیر
                                    </div>
                                </SelectItem>
                                <SelectItem value="member">
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="w-4 h-4" />
                                        عضو
                                    </div>
                                </SelectItem>
                                <SelectItem value="viewer">
                                    <div className="flex items-center gap-2">
                                        <Eye className="w-4 h-4" />
                                        مشاهده‌گر
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <Button 
                            onClick={handleAddMember}
                            disabled={!selectedUser || availableUsersToAdd.length === 0}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Plus className="w-4 h-4 ml-1" />
                            افزودن
                        </Button>
                    </div>
                </div>

                {/* Members List */}
                <div className="flex-1 overflow-y-auto space-y-3">
                    {loading ? (
                        <div className="text-center py-8 text-slate-500">
                            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                            در حال بارگذاری اعضا...
                        </div>
                    ) : members.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <h3 className="text-lg font-semibold mb-2">هیچ عضوی یافت نشد</h3>
                            <p className="text-sm">اولین عضو تیم را اضافه کنید</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {members.map(member => (
                                <Card key={member.teamMemberId} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="w-12 h-12">
                                                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-slate-700 font-semibold">
                                                        {getInitials(member.displayName)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h4 className="font-semibold text-slate-800">
                                                            {member.displayName}
                                                        </h4>
                                                        <Badge className={getRoleColor(member.role)}>
                                                            <div className="flex items-center gap-1">
                                                                {getRoleIcon(member.role)}
                                                                {getRoleLabel(member.role)}
                                                            </div>
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-slate-500">
                                                        {member.user?.email || 'ایمیل نامشخص'}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        عضویت از: {member.joinDate}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <Select
                                                    value={member.role}
                                                    onValueChange={(newRole) => handleChangeRole(member, newRole)}
                                                >
                                                    <SelectTrigger className="w-36">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="owner">
                                                            <div className="flex items-center gap-2">
                                                                <Crown className="w-4 h-4" />
                                                                مالک
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="manager">
                                                            <div className="flex items-center gap-2">
                                                                <Shield className="w-4 h-4" />
                                                                مدیر
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="member">
                                                            <div className="flex items-center gap-2">
                                                                <UserIcon className="w-4 h-4" />
                                                                عضو
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="viewer">
                                                            <div className="flex items-center gap-2">
                                                                <Eye className="w-4 h-4" />
                                                                مشاهده‌گر
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => handleRemoveMember(member)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-200 flex justify-end">
                    <Button onClick={onClose} className="bg-slate-600 hover:bg-slate-700">
                        بستن
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
