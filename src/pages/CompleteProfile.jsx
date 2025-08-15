
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { UserInvitation } from '@/api/entities';
import { TeamMember } from '@/api/entities';
import { Team } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User as UserIcon, Mail, Check } from 'lucide-react';

export default function CompleteProfilePage() {
    const [user, setUser] = useState(null);
    const [invitation, setInvitation] = useState(null);
    const [invitationTeams, setInvitationTeams] = useState([]);
    const [profileData, setProfileData] = useState({
        first_name: '',
        last_name: '',
        national_code: '',
        mobile_number: '',
        address: '',
        postal_code: '',
        telegram_id: ''
    });
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserAndInvitation = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                setProfileData({
                    first_name: currentUser.first_name || '',
                    last_name: currentUser.last_name || '',
                    national_code: currentUser.national_code || '',
                    mobile_number: currentUser.mobile_number || '',
                    address: currentUser.address || '',
                    postal_code: currentUser.postal_code || '',
                    telegram_id: currentUser.telegram_id || ''
                });

                // Check if user came from invitation link
                const invitationToken = searchParams.get('invitation_token');
                if (invitationToken) {
                    try {
                        const invitations = await UserInvitation.filter({ 
                            invitation_token: invitationToken,
                            status: 'pending'
                        });
                        
                        if (invitations.length > 0) {
                            const userInvitation = invitations[0];
                            
                            // Check if invitation is still valid
                            if (new Date(userInvitation.expires_at) > new Date()) {
                                setInvitation(userInvitation);
                                
                                // Load team information from team_assignments
                                if (userInvitation.team_assignments && userInvitation.team_assignments.length > 0) {
                                    const teamIds = userInvitation.team_assignments.map(ta => ta.team_id);
                                    const teams = await Team.filter({ 
                                        id: { $in: teamIds } 
                                    });
                                    // Add role info to teams
                                    const teamsWithRoles = teams.map(team => ({
                                        ...team,
                                        role: userInvitation.team_assignments.find(ta => ta.team_id === team.id)?.role || 'member'
                                    }));
                                    setInvitationTeams(teamsWithRoles);
                                }
                            }
                        }
                    } catch (error) {
                        console.error("Error loading invitation:", error);
                    }
                }
            } catch (error) {
                console.error("Error fetching user:", error);
            }
        };
        
        fetchUserAndInvitation();
    }, [searchParams]);

    const handleChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // Update user profile first
            await User.updateMyUserData({
                ...profileData,
                profile_completed: true
            });

            // If user came from invitation, process the invitation
            if (invitation && invitation.team_assignments && invitation.team_assignments.length > 0) {
                console.log('Processing invitation team assignments:', invitation.team_assignments);
                
                // Add user to teams specified in invitation with their roles
                const teamAssignmentPromises = invitation.team_assignments.map(async (assignment) => {
                    try {
                        const teamMember = await TeamMember.create({
                            team_id: assignment.team_id,
                            user_id: user.id,
                            role: assignment.role,
                            joined_at: new Date().toISOString(),
                            is_active: true
                        });
                        console.log('Created team membership:', teamMember);
                        return teamMember;
                    } catch (error) {
                        console.error('Error creating team membership:', error);
                        throw error;
                    }
                });

                await Promise.all(teamAssignmentPromises);

                // Mark invitation as accepted
                await UserInvitation.update(invitation.id, { 
                    status: 'accepted' 
                });
                
                console.log('All team assignments completed successfully');
            }

            alert('پروفایل شما با موفقیت تکمیل شد!');
            
            // Add a small delay to ensure all database operations are completed
            setTimeout(() => {
                navigate(createPageUrl('Dashboard'));
            }, 1000);
            
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('خطا در تکمیل پروفایل. لطفاً دوباره تلاش کنید.');
        } finally {
            setLoading(false);
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
            owner: 'bg-purple-100 text-purple-800',
            manager: 'bg-blue-100 text-blue-800',
            member: 'bg-green-100 text-green-800',
            viewer: 'bg-gray-100 text-gray-800'
        };
        return colors[role] || colors.member;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4" dir="rtl">
            <Card className="w-full max-w-2xl glass-effect shadow-2xl">
                <CardHeader className="text-center">
                    <UserIcon className="mx-auto h-12 w-12 text-blue-600" />
                    <CardTitle className="text-2xl mt-4">تکمیل پروفایل کاربری</CardTitle>
                    <CardDescription>
                        {invitation 
                            ? 'برای تکمیل دعوت، لطفاً اطلاعات زیر را تکمیل کنید.'
                            : 'برای دسترسی به سیستم، لطفاً اطلاعات زیر را تکمیل کنید.'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Enhanced Invitation Info */}
                    {invitation && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Mail className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-blue-800">شما دعوت شده‌اید!</span>
                            </div>
                            <p className="text-sm text-blue-700 mb-3">
                                شما برای عضویت در سیستم مدیریت کار دعوت شده‌اید.
                            </p>
                            {invitationTeams.length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-sm font-medium text-blue-800">تیم‌ها و نقش‌های تخصیص یافته:</span>
                                    <div className="space-y-2">
                                        {invitationTeams.map(team => (
                                            <div key={team.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                                <div className="flex items-center gap-2">
                                                    <div 
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: team.color }}
                                                    ></div>
                                                    <span className="font-medium">{team.name}</span>
                                                </div>
                                                <Badge className={getRoleColor(team.role)}>
                                                    {getRoleLabel(team.role)}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">نام *</label>
                                <Input 
                                    name="first_name" 
                                    value={profileData.first_name} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">نام خانوادگی *</label>
                                <Input 
                                    name="last_name" 
                                    value={profileData.last_name} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">کد ملی *</label>
                                <Input 
                                    name="national_code" 
                                    value={profileData.national_code} 
                                    onChange={handleChange} 
                                    maxLength={10}
                                    pattern="[0-9]{10}"
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">شماره موبایل *</label>
                                <Input 
                                    name="mobile_number" 
                                    value={profileData.mobile_number} 
                                    onChange={handleChange}
                                    pattern="[0-9]{11}"
                                    maxLength={11}
                                    required 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">آدرس</label>
                            <Textarea 
                                name="address" 
                                value={profileData.address} 
                                onChange={handleChange}
                                rows={3}
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">کد پستی</label>
                                <Input 
                                    name="postal_code" 
                                    value={profileData.postal_code} 
                                    onChange={handleChange}
                                    maxLength={10}
                                    pattern="[0-9]{10}"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">آی‌دی تلگرام</label>
                                <Input 
                                    name="telegram_id" 
                                    value={profileData.telegram_id} 
                                    onChange={handleChange}
                                    placeholder="@username"
                                />
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full bg-blue-600 hover:bg-blue-700 hover-lift" 
                            disabled={loading}
                        >
                            {loading ? 'در حال ذخیره...' : (
                                invitation ? 'تکمیل دعوت و ورود' : 'ذخیره و ادامه'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
