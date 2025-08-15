import React, { useState, useEffect } from 'react';
import { Team } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users, Search } from 'lucide-react';

import TeamCard from '../components/teams/TeamCard';
import CreateTeamModal from '../components/teams/CreateTeamModal';
import ManageMembersModal from '../components/teams/ManageMembersModal';

export default function TeamsPage() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [editingTeam, setEditingTeam] = useState(null);

    useEffect(() => {
        loadTeams();
    }, []);

    const loadTeams = async () => {
        try {
            setLoading(true);
            const allTeams = await Team.list('-created_date');
            setTeams(allTeams);
        } catch (error) {
            console.error("Error loading teams:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClick = () => {
        setEditingTeam(null);
        setShowCreateModal(true);
    };

    const handleEditClick = (team) => {
        setEditingTeam(team);
        setShowCreateModal(true);
    };

    const handleManageMembersClick = (team) => {
        setSelectedTeam(team);
        setShowMembersModal(true);
    };

    const handleDeleteTeam = async (teamId) => {
        if (confirm('آیا مطمئن هستید که می‌خواهید این تیم را حذف کنید؟ این عمل غیرقابل بازگشت است.')) {
            try {
                await Team.delete(teamId);
                loadTeams(); // Refresh the list
            } catch (error) {
                console.error("Error deleting team:", error);
                alert('خطا در حذف تیم');
            }
        }
    };

    const filteredTeams = teams.filter(team => 
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.name_en.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">مدیریت تیم‌ها</h1>
                        <p className="text-slate-600">ایجاد، ویرایش و مدیریت اعضای تیم‌های خود</p>
                    </div>
                    <Button onClick={handleCreateClick} className="bg-gradient-to-r from-blue-600 to-blue-700 hover-lift">
                        <Plus className="w-4 h-4 ml-2" />
                        تیم جدید
                    </Button>
                </div>

                {/* Team List */}
                <Card className="glass-effect border-none shadow-lg">
                    <CardContent className="p-6">
                        {loading ? (
                            <div className="text-center py-8 text-slate-500">در حال بارگذاری تیم‌ها...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredTeams.map(team => (
                                    <TeamCard 
                                        key={team.id}
                                        team={team}
                                        onManageMembers={() => handleManageMembersClick(team)}
                                        onEdit={() => handleEditClick(team)}
                                        onDelete={() => handleDeleteTeam(team.id)}
                                    />
                                ))}
                            </div>
                        )}
                        {!loading && filteredTeams.length === 0 && (
                             <div className="text-center py-12 text-slate-500">
                                <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                <h3 className="text-xl font-semibold text-slate-600 mb-2">
                                    هیچ تیمی یافت نشد
                                </h3>
                                <p className="mb-6">برای شروع، اولین تیم خود را ایجاد کنید.</p>
                                <Button onClick={handleCreateClick} className="hover-lift">
                                    <Plus className="w-4 h-4 ml-2" />
                                    ایجاد تیم
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Modals */}
                {showCreateModal && (
                    <CreateTeamModal
                        isOpen={showCreateModal}
                        onClose={() => setShowCreateModal(false)}
                        onTeamCreated={() => {
                            setShowCreateModal(false);
                            loadTeams();
                        }}
                        initialData={editingTeam}
                    />
                )}

                {showMembersModal && selectedTeam && (
                    <ManageMembersModal
                        team={selectedTeam}
                        onClose={() => setShowMembersModal(false)}
                    />
                )}
            </div>
        </div>
    );
}