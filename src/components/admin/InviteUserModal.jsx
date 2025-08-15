import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, X, Copy, Check, Mail, Link as LinkIcon, UserPlus } from "lucide-react";
import { UserInvitation } from '@/api/entities';
import { User } from '@/api/entities';

export default function InviteUserModal({ teams, onClose, onInvitationSent }) {
    const [email, setEmail] = useState('');
    const [selectedTeamAssignments, setSelectedTeamAssignments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [invitationLink, setInvitationLink] = useState('');
    const [linkCopied, setLinkCopied] = useState(false);
    const [step, setStep] = useState('form'); // 'form' or 'success'

    React.useEffect(() => {
        User.me().then(setCurrentUser);
    }, []);
    
    const handleToggleTeam = (teamId) => {
        setSelectedTeamAssignments(prev => {
            const existing = prev.find(ta => ta.team_id === teamId);
            if (existing) {
                // Remove if exists
                return prev.filter(ta => ta.team_id !== teamId);
            } else {
                // Add with default role
                return [...prev, { team_id: teamId, role: 'member' }];
            }
        });
    };

    const handleRoleChange = (teamId, newRole) => {
        setSelectedTeamAssignments(prev => 
            prev.map(ta => 
                ta.team_id === teamId ? { ...ta, role: newRole } : ta
            )
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !currentUser) return;

        setLoading(true);
        try {
            // Generate unique invitation token
            const token = [...Array(32)].map(() => Math.random().toString(36)[2]).join('');
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration

            // Create invitation record with team assignments
            await UserInvitation.create({
                email,
                team_assignments: selectedTeamAssignments, // Changed from team_ids to team_assignments
                invitation_token: token,
                expires_at: expiresAt.toISOString(),
                invited_by: currentUser.id,
                status: 'pending'
            });

            // Generate invitation link
            const generatedLink = `${window.location.origin}?invitation_token=${token}`;
            setInvitationLink(generatedLink);
            setStep('success');
            
        } catch (error) {
            console.error('Error creating invitation:', error);
            alert('خطا در ایجاد دعوت‌نامه.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(invitationLink);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = invitationLink;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
            }
            document.body.removeChild(textArea);
        }
    };

    const handleClose = () => {
        if (step === 'success') {
            onInvitationSent();
        }
        onClose();
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

    const selectedTeams = selectedTeamAssignments.map(ta => ({
        ...teams.find(team => team.id === ta.team_id),
        role: ta.role
    })).filter(team => team.id);

    return (
        <Dialog open onOpenChange={handleClose}>
            <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {step === 'form' ? <UserPlus className="w-5 h-5" /> : <Check className="w-5 h-5 text-green-600" />}
                        {step === 'form' ? 'دعوت کاربر جدید' : 'دعوت‌نامه آماده شد!'}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'form' 
                            ? 'ایمیل کاربر و نقش او در هر تیم را مشخص کنید.'
                            : 'لینک دعوت ایجاد شد. آن را کپی کرده و برای کاربر ارسال کنید.'
                        }
                    </DialogDescription>
                </DialogHeader>

                {step === 'form' ? (
                    <form onSubmit={handleSubmit} className="space-y-6 py-4">
                        <div>
                            <Label htmlFor="email">ایمیل کاربر *</Label>
                            <Input 
                                id="email" 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder="user@example.com"
                                required 
                            />
                        </div>

                        <div className="space-y-4">
                            <Label>تخصیص تیم و نقش</Label>
                            <div className="space-y-3">
                                {teams.map(team => {
                                    const assignment = selectedTeamAssignments.find(ta => ta.team_id === team.id);
                                    const isSelected = !!assignment;

                                    return (
                                        <div key={team.id} className="p-4 border rounded-lg space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id={`team-${team.id}`}
                                                    checked={isSelected}
                                                    onCheckedChange={() => handleToggleTeam(team.id)}
                                                />
                                                <div className="flex items-center gap-2 flex-1">
                                                    <div 
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: team.color }}
                                                    ></div>
                                                    <label htmlFor={`team-${team.id}`} className="font-medium cursor-pointer">
                                                        {team.name}
                                                    </label>
                                                </div>
                                            </div>
                                            
                                            {isSelected && (
                                                <div className="mr-6">
                                                    <Label className="text-sm">نقش در این تیم:</Label>
                                                    <Select
                                                        value={assignment.role}
                                                        onValueChange={(role) => handleRoleChange(team.id, role)}
                                                    >
                                                        <SelectTrigger className="w-40">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="owner">مالک</SelectItem>
                                                            <SelectItem value="manager">مدیر</SelectItem>
                                                            <SelectItem value="member">عضو</SelectItem>
                                                            <SelectItem value="viewer">مشاهده‌گر</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {selectedTeams.length > 0 && (
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <h4 className="font-medium text-blue-800 mb-2">خلاصه تخصیص:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTeams.map(team => (
                                            <Badge key={team.id} className={getRoleColor(team.role)}>
                                                {team.name} - {getRoleLabel(team.role)}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Check className="w-5 h-5 text-green-600" />
                                <span className="font-semibold text-green-800">دعوت‌نامه ایجاد شد</span>
                            </div>
                            <p className="text-sm text-green-700">
                                لینک دعوت برای {email} آماده است. این لینک تا ۷ روز معتبر می‌باشد.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>لینک دعوت:</Label>
                            <div className="flex gap-2">
                                <Input 
                                    value={invitationLink} 
                                    readOnly 
                                    className="font-mono text-sm"
                                />
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={copyToClipboard}
                                    className="flex-shrink-0"
                                >
                                    {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                            {linkCopied && (
                                <p className="text-sm text-green-600">✓ لینک کپی شد!</p>
                            )}
                        </div>

                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-blue-800 mb-2">مراحل بعدی:</h4>
                            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                                <li>لینک بالا را کپی کنید</li>
                                <li>آن را از طریق ایمیل، تلگرام یا هر روش دیگری برای کاربر ارسال کنید</li>
                                <li>کاربر با کلیک روی لینک وارد سیستم شده و پروفایل خود را تکمیل می‌کند</li>
                                <li>به صورت خودکار به تیم‌های انتخاب شده با نقش مشخص شده اضافه می‌شود</li>
                            </ol>
                        </div>

                        {selectedTeams.length > 0 && (
                            <div className="space-y-2">
                                <Label>تیم‌ها و نقش‌های انتخاب شده:</Label>
                                <div className="space-y-2">
                                    {selectedTeams.map(team => (
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

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        {step === 'form' ? 'انصراف' : 'بستن'}
                    </Button>
                    {step === 'form' && (
                        <Button type="submit" onClick={handleSubmit} disabled={loading || !email || selectedTeamAssignments.length === 0}>
                            {loading ? 'در حال ایجاد...' : 'ایجاد لینک دعوت'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}