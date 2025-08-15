import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User, TeamMember } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function NoTeamAssignedPage() {
    const [checking, setChecking] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Double-check team assignments when this page loads
        const recheckTeams = async () => {
            try {
                const currentUser = await User.me();
                if (currentUser.role === 'admin') {
                    navigate(createPageUrl('Dashboard'));
                    return;
                }

                const userTeams = await TeamMember.filter({ 
                    user_id: currentUser.id, 
                    is_active: true 
                });
                
                console.log('Rechecking team memberships:', userTeams);
                
                if (userTeams.length > 0) {
                    console.log('Found team memberships, redirecting to dashboard');
                    navigate(createPageUrl('Dashboard'));
                    return;
                }
            } catch (error) {
                console.error('Error rechecking teams:', error);
            } finally {
                setChecking(false);
            }
        };

        // Check after a short delay to allow for any pending database operations
        const timeoutId = setTimeout(recheckTeams, 1000);
        return () => clearTimeout(timeoutId);
    }, [navigate]);

    const handleLogout = async () => {
        await User.logout();
        window.location.reload();
    };

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-orange-50 p-4" dir="rtl">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <p className="mr-3 text-slate-600">در حال بررسی دسترسی‌ها...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-orange-50 p-4" dir="rtl">
            <Card className="w-full max-w-lg text-center glass-effect shadow-2xl">
                <CardHeader>
                    <UserX className="mx-auto h-16 w-16 text-orange-500" />
                    <CardTitle className="text-2xl mt-4">در انتظار تخصیص تیم</CardTitle>
                    <CardDescription className="mt-2 text-slate-600">
                        حساب کاربری شما فعال است اما هنوز به هیچ تیمی اختصاص داده نشده‌اید.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-6">
                        برای دسترسی به بوردها و وظایف، لطفاً با مدیر سیستم تماس بگیرید تا شما را به تیم‌های مربوطه اضافه کند.
                    </p>
                    <Button onClick={handleLogout} variant="outline">
                        خروج از حساب کاربری
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}