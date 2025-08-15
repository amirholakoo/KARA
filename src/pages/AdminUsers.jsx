import React, { useState, useEffect } from 'react';
import { User, Team, TeamMember } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users as UsersIcon, Mail } from 'lucide-react';
import UserList from '../../components/admin/UserList';
import InviteUserModal from '../../components/admin/InviteUserModal';
import AssignTeamsModal from '../../components/admin/AssignTeamsModal';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [teamMemberships, setTeamMemberships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [allUsers, allTeams, allMemberships] = await Promise.all([
                User.list('-created_date'),
                Team.list(),
                TeamMember.list()
            ]);
            setUsers(allUsers);
            setTeams(allTeams);
            setTeamMemberships(allMemberships);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignTeams = (user) => {
        setSelectedUser(user);
        setShowAssignModal(true);
    };

    return (
        <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">مدیریت کاربران</h1>
                        <p className="text-slate-600">دعوت، تخصیص تیم و مشاهده کاربران سیستم</p>
                    </div>
                    <Button onClick={() => setShowInviteModal(true)} className="bg-gradient-to-r from-blue-600 to-blue-700 hover-lift">
                        <Mail className="w-4 h-4 ml-2" />
                        دعوت کاربر جدید
                    </Button>
                </div>

                <Card className="glass-effect border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl">
                            <UsersIcon className="w-6 h-6 text-blue-600" />
                            لیست کاربران ({users.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <UserList 
                            users={users} 
                            teams={teams}
                            teamMemberships={teamMemberships}
                            onAssignTeams={handleAssignTeams}
                            loading={loading}
                        />
                    </CardContent>
                </Card>

                {showInviteModal && (
                    <InviteUserModal
                        teams={teams}
                        onClose={() => setShowInviteModal(false)}
                        onInvitationSent={loadData}
                    />
                )}

                {showAssignModal && selectedUser && (
                    <AssignTeamsModal
                        user={selectedUser}
                        teams={teams}
                        onClose={() => setShowAssignModal(false)}
                        onTeamsAssigned={loadData}
                    />
                )}
            </div>
        </div>
    );
}