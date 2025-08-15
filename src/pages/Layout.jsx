

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, TeamMember } from "@/api/entities";
import { 
  LayoutDashboard, 
  Kanban, 
  FileText, 
  Settings,
  Bell,
  Users,
  BarChart3,
  Calendar,
  Menu,
  X,
  Repeat,
  ShieldCheck,
  LogOut // Added Logout icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import './components/utils/backgroundTasks'; // This will start background tasks

const navigationItems = [
  {
    title: "داشبورد",
    titleEn: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "کانبان تیم‌ها", 
    titleEn: "Team Boards",
    url: createPageUrl("Boards"),
    icon: Kanban,
  },
  {
    title: "کارهای تکراری", // New item
    titleEn: "Recurring Tasks", 
    url: createPageUrl("RecurringTasks"),
    icon: Repeat,
  },
  {
    title: "فرم‌ها و چک‌لیست‌ها",
    titleEn: "Forms & Checklists", 
    url: createPageUrl("Forms"),
    icon: FileText,
  },
  {
    title: "گزارشات",
    titleEn: "Reports",
    url: createPageUrl("Reports"),
    icon: BarChart3,
  },
  {
    title: "تیم‌ها",
    titleEn: "Teams",
    url: createPageUrl("Teams"),
    icon: Users,
  },
  {
    title: "تنظیمات",
    titleEn: "Settings", 
    url: createPageUrl("Settings"),
    icon: Settings,
  }
];

const adminNavItems = [
    {
        title: "مدیریت کاربران",
        titleEn: "User Management",
        url: createPageUrl("AdminUsers"),
        icon: ShieldCheck,
    }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
        try {
            const currentUser = await User.me();
            setUser(currentUser);

            // Skip team check for admin users
            if (currentUser.role === 'admin') {
                setLoading(false);
                return;
            }

            // Check if profile needs to be completed
            if (!currentUser.profile_completed && location.pathname !== createPageUrl('CompleteProfile')) {
                navigate(createPageUrl('CompleteProfile'));
                return;
            }

            // Only check team membership for completed profiles and non-admin users
            if (currentUser.profile_completed && currentUser.role !== 'admin') {
                try {
                    const userTeams = await TeamMember.filter({ user_id: currentUser.id, is_active: true });
                    console.log('Found team memberships for user:', userTeams);
                    
                    if (userTeams.length === 0 && location.pathname !== createPageUrl('NoTeamAssigned')) {
                        console.log('No team memberships found, redirecting to NoTeamAssigned');
                        navigate(createPageUrl('NoTeamAssigned'));
                        return;
                    }
                } catch (teamError) {
                    console.error('Error checking team memberships:', teamError);
                    // Don't redirect on error - let user continue
                }
            }

        } catch (error) {
            console.error("User not authenticated", error);
            // Not logged in, handled by platform
        } finally {
            setLoading(false);
        }
    };

    // Add a small delay to ensure any team assignments from profile completion are saved
    const timeoutId = setTimeout(checkUserStatus, 500);
    return () => clearTimeout(timeoutId);
  }, [location.pathname, navigate]);
    
  const handleLogout = async () => {
    try {
      await User.logout();
      window.location.reload(); // Force a reload to clear state and redirect to login
    } catch (error) {
      console.error("Logout failed:", error);
      alert("خروج از سیستم با مشکل مواجه شد.");
    }
  };

  const getInitials = (name = '') => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center text-slate-700 font-medium">در حال بارگذاری...</div>;
  }
    
  // Don't render layout for profile completion or no-team pages
  if (['CompleteProfile', 'NoTeamAssigned'].includes(currentPageName)) {
    return children;
  }

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap');
        
        :root {
          --font-vazir: 'Vazirmatn', system-ui, sans-serif;
          --primary-blue: #1e40af;
          --primary-orange: #ea580c;
          --warm-gray: #78716c;
          --light-blue: #dbeafe;
          --soft-orange: #fed7aa;
        }
        
        body {
          font-family: var(--font-vazir) !important;
        }

        * {
          font-family: var(--font-vazir) !important;
        }
        
        .persian-nums {
          font-feature-settings: 'locl' 1;
        }
        
        .gradient-border {
          background: linear-gradient(135deg, var(--primary-blue), var(--primary-orange));
          padding: 1px;
          border-radius: 12px;
        }
        
        .gradient-border-inner {
          background: white;
          border-radius: 11px;
          height: 100%;
          width: 100%;
        }
        
        .glass-effect {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .hover-lift {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(30, 64, 175, 0.15);
        }

        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 40;
        }

        .sidebar {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          width: 320px;
          transform: translateX(100%);
          transition: transform 0.3s ease-in-out;
          z-index: 50;
        }

        .sidebar.open {
          transform: translateX(0);
        }

        @media (min-width: 1024px) {
          .sidebar {
            position: static;
            transform: translateX(0);
            width: 280px;
            flex-shrink: 0;
          }
        }
      `}</style>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white/80 glass-effect border-b border-blue-100 px-6 py-4 lg:hidden">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="hover:bg-blue-50 p-2 rounded-lg transition-colors duration-200"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-slate-700">سیستم مدیریت کار</h1>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Kanban className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar glass-effect border-l border-blue-100 ${sidebarOpen ? 'open' : ''}`}>
        <div className="h-full flex flex-col bg-white/50">
          {/* Sidebar Header */}
          <div className="border-b border-blue-100 p-6 bg-gradient-to-br from-blue-600 to-blue-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Kanban className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg">سیستم مدیریت کار</h2>
                  <p className="text-blue-100 text-sm">کارخانه کاغذسازی</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 p-3 overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider px-3 py-3 mb-2">
                منوی اصلی
              </h3>
              <nav className="space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover-lift group ${
                      location.pathname === item.url ? 
                      'bg-gradient-to-r from-blue-50 to-orange-50 text-blue-700 border-r-2 border-blue-500' : 
                      'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{item.title}</span>
                      <span className="text-xs opacity-75">{item.titleEn}</span>
                    </div>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Admin Menu */}
            {user?.role === 'admin' && (
                <div className="mb-6">
                    <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider px-3 py-3 mb-2">
                        بخش ادمین
                    </h3>
                    <nav className="space-y-2">
                        {adminNavItems.map((item) => (
                          <Link
                            key={item.title}
                            to={item.url}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover-lift group ${
                              location.pathname.startsWith(item.url) ? 
                              'bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 border-r-2 border-orange-500' : 
                              'text-slate-600 hover:bg-orange-50 hover:text-orange-700'
                            }`}
                          >
                            <item.icon className="w-5 h-5" />
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{item.title}</span>
                              <span className="text-xs opacity-75">{item.titleEn}</span>
                            </div>
                          </Link>
                        ))}
                    </nav>
                </div>
            )}

            {/* Quick Info */}
            <div>
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider px-3 py-3 mb-2">
                اطلاعات سریع
              </h3>
              <div className="px-4 py-3 space-y-3">
                <div className="glass-effect rounded-lg p-3 hover-lift">
                  <div className="flex items-center gap-2 text-sm">
                    <Bell className="w-4 h-4 text-orange-500" />
                    <span className="text-slate-600">کارهای امروز</span>
                    <span className="mr-auto font-bold text-blue-600 persian-nums">۸</span>
                  </div>
                </div>
                <div className="glass-effect rounded-lg p-3 hover-lift">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-green-500" />
                    <span className="text-slate-600">فرم‌های پر نشده</span>
                    <span className="mr-auto font-bold text-orange-600 persian-nums">۳</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-blue-100 p-4 bg-white/70">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="gradient-border hover-lift cursor-pointer">
                  <div className="gradient-border-inner p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {getInitials(user?.full_name || user?.email)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-700 text-sm truncate">
                          {user?.full_name || 'کاربر'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount dir="rtl">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(createPageUrl('Settings'))} className="cursor-pointer">
                  <Settings className="ml-2 h-4 w-4" />
                  <span>تنظیمات</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>خروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
    </div>
  );
}

