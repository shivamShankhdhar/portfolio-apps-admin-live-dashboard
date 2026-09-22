'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
  SidebarContext,
} from '@/components/ui/sidebar';
import {
  Gamepad2,
  Smartphone,
  LayoutGrid,
  LayoutDashboard,
  User,
  Code2,
  Briefcase,
  GraduationCap,
  Mail,
  ExternalLink,
  Shield,
  Settings,
  ChevronRight,
} from 'lucide-react';

export type AdminTab =
  | 'dashboard'
  | 'apps'
  | 'games'
  | 'projects'
  | 'profile'
  | 'skills'
  | 'experience'
  | 'education'
  | 'messages';

interface SidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  appsCount: number;
  gamesCount?: number;
  projectsCount: number;
  messagesCount: number;
  onLogout?: () => void;
  profile?: any;
  adminEmail?: string;
}

// Clean email truncation: e.g. "s.shankhdhar1981@gmail.com" -> "s.shankh...@gmail.com"
function formatTruncatedEmail(email: string): string {
  if (!email) return 'admin@hub';
  const parts = email.split('@');
  if (parts.length === 2) {
    const [local, domain] = parts;
    const truncatedLocal = local.length > 8 ? `${local.slice(0, 8)}...` : local;
    return `${truncatedLocal}@${domain}`;
  }
  return email.length > 18 ? `${email.slice(0, 16)}...` : email;
}

function AdminSidebarInner({
  activeTab,
  setActiveTab,
  appsCount,
  gamesCount = 0,
  projectsCount,
  messagesCount,
  onLogout,
  profile,
  adminEmail,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isSettingsRoute = pathname === '/settings';
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const [emailState, setEmailState] = useState(adminEmail || 's.shankhdhar1981@gmail.com');
  const [siteUrls, setSiteUrls] = useState<{ portfolioUrl: string; appsUrl: string }>({
    portfolioUrl: profile?.portfolioUrl || process.env.NEXT_PUBLIC_PORTFOLIO_URL || 'http://localhost:3000',
    appsUrl: profile?.appsUrl || process.env.NEXT_PUBLIC_APPS_URL || 'http://localhost:3002',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('adminEmail');
      if (stored) setEmailState(stored);
    }
  }, []);

  useEffect(() => {
    if (adminEmail) setEmailState(adminEmail);
  }, [adminEmail]);

  // Sync profile live URLs
  useEffect(() => {
    if (profile?.portfolioUrl || profile?.appsUrl) {
      setSiteUrls({
        portfolioUrl: profile.portfolioUrl || process.env.NEXT_PUBLIC_PORTFOLIO_URL || 'http://localhost:3000',
        appsUrl: profile.appsUrl || process.env.NEXT_PUBLIC_APPS_URL || 'http://localhost:3002',
      });
    }
  }, [profile?.portfolioUrl, profile?.appsUrl]);

  const portfolioLiveUrl =
    siteUrls.portfolioUrl ||
    profile?.portfolioUrl ||
    process.env.NEXT_PUBLIC_PORTFOLIO_URL ||
    'http://localhost:3000';

  const appsLiveUrl =
    siteUrls.appsUrl ||
    profile?.appsUrl ||
    process.env.NEXT_PUBLIC_APPS_URL ||
    'http://localhost:3002';

  interface NavItem {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    badgeColor?: string;
  }

  const overviewNavItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
  ];

  const appsNavItems: NavItem[] = [
    {
      id: 'apps',
      label: 'Applications',
      icon: Smartphone,
      count: appsCount,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
    {
      id: 'games',
      label: 'Games Hub',
      icon: Gamepad2,
      count: gamesCount,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
  ];

  const portfolioNavItems: NavItem[] = [
    {
      id: 'projects',
      label: 'Projects',
      icon: LayoutGrid,
      count: projectsCount,
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    },
    {
      id: 'profile',
      label: 'Profile & Bio',
      icon: User,
    },
    {
      id: 'skills',
      label: 'Skills & Stack',
      icon: Code2,
    },
    {
      id: 'experience',
      label: 'Experience',
      icon: Briefcase,
    },
    {
      id: 'education',
      label: 'Education',
      icon: GraduationCap,
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: Mail,
      count: messagesCount,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    },
  ];

  const handleTabClick = (itemId: AdminTab) => {
    if (pathname !== '/') {
      router.push(`/?tab=${itemId}`);
    } else {
      setActiveTab(itemId);
    }
  };

  const truncatedEmail = formatTruncatedEmail(emailState);

  const renderNavMenu = (items: NavItem[]) => (
    <SidebarMenu className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = !isSettingsRoute && activeTab === item.id;
        return (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              onClick={() => handleTabClick(item.id)}
              isActive={isActive}
              tooltip={item.label}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? '!bg-gradient-to-r !from-red-600 !to-rose-600 !text-white shadow-md shadow-red-600/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-red-400'}`} />
                <span className="truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
              </span>
              {item.count !== undefined && (
                <SidebarMenuBadge
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full group-data-[collapsible=icon]:hidden ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor
                  }`}
                >
                  {item.count}
                </SidebarMenuBadge>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <>
      <ShadcnSidebar
        collapsible="icon"
        className="border-r border-red-500/20 bg-[#0d0e17] text-white select-none shrink-0"
      >
        {/* 1. Header: Brand & Collapse Trigger */}
        <SidebarHeader className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
            <Link
              href="/"
              className="flex items-center gap-2.5 overflow-hidden group group-data-[collapsible=icon]:hidden"
              title="Admin Control Center"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-600/30 font-bold shrink-0 group-hover:scale-105 transition-transform">
                <Shield className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-black text-white tracking-tight truncate leading-tight">
                  Admin Hub
                </span>
                <span className="text-[10px] font-mono text-slate-400 truncate">
                  Control Center
                </span>
              </div>
            </Link>

            <SidebarTrigger className="text-slate-400 hover:text-white hover:bg-white/10 shrink-0" />
          </div>
        </SidebarHeader>

        {/* 2. Scrollable Middle Content: Apps Section, Portfolio Section & Live Deployments */}
        <SidebarContent className="px-2 py-3 space-y-4">
          {/* Overview / Dashboard */}
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-red-400/90 px-2 py-1 group-data-[collapsible=icon]:hidden">
              Overview
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {renderNavMenu(overviewNavItems)}
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="bg-white/10" />

          {/* Apps Section */}
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-red-400/90 px-2 py-1 group-data-[collapsible=icon]:hidden flex items-center justify-between">
              <span>Apps &amp; Games</span>
              <span className="text-[9px] font-mono font-normal text-slate-500">{appsCount + gamesCount} Total</span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {renderNavMenu(appsNavItems)}
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="bg-white/10" />

          {/* Portfolio Section */}
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 group-data-[collapsible=icon]:hidden flex items-center justify-between">
              <span>Portfolio</span>
              <span className="text-[9px] font-mono font-normal text-slate-500">{projectsCount} Projects</span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {renderNavMenu(portfolioNavItems)}
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="bg-white/10" />

          {/* Live External Deployments Group */}
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1 group-data-[collapsible=icon]:hidden">
              Live Deployments
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {/* Portfolio Website */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Portfolio Website (Live)"
                    className="w-full text-slate-300 hover:text-white hover:bg-white/5 rounded-xl px-3 py-2 text-xs cursor-pointer"
                  >
                    <a href={portfolioLiveUrl} target="_blank" rel="noopener noreferrer">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 shadow-xs shadow-emerald-400/50" />
                      <span className="truncate group-data-[collapsible=icon]:hidden">Portfolio Website</span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-500 ml-auto group-data-[collapsible=icon]:hidden" />
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Apps Website */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Apps & Games Hub (Live)"
                    className="w-full text-slate-300 hover:text-white hover:bg-white/5 rounded-xl px-3 py-2 text-xs cursor-pointer"
                  >
                    <a href={appsLiveUrl} target="_blank" rel="noopener noreferrer">
                      <span className="h-2 w-2 rounded-full bg-red-400 shrink-0 shadow-xs shadow-red-400/50" />
                      <span className="truncate group-data-[collapsible=icon]:hidden">Apps Website</span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-500 ml-auto group-data-[collapsible=icon]:hidden" />
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* 3. Footer: User Details as Settings in the last (Transparent, no extra black bg box) */}
        <SidebarFooter className="p-2 border-t border-white/10">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="lg"
                isActive={isSettingsRoute}
                tooltip={`Settings (${emailState})`}
                className={`w-full rounded-2xl p-2 h-auto flex items-center gap-3 transition-all cursor-pointer ${
                  isSettingsRoute
                    ? '!bg-gradient-to-r !from-red-600 !to-rose-600 !text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Link href="/settings">
                  <div className="relative shrink-0">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-red-600/30">
                      {emailState.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0d0e17]" />
                  </div>

                  <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden text-left">
                    <p className="text-xs font-bold text-white truncate font-mono">
                      {truncatedEmail}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 group-hover:text-red-300 transition-colors">
                      Settings &amp; Security
                    </p>
                  </div>

                  <Settings className="h-4 w-4 text-slate-400 group-hover:text-white ml-auto shrink-0 group-data-[collapsible=icon]:hidden" />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </ShadcnSidebar>
    </>
  );
}

export default function Sidebar(props: SidebarProps) {
  const context = React.useContext(SidebarContext);
  if (!context) {
    return (
      <SidebarProvider defaultOpen={true}>
        <AdminSidebarInner {...props} />
      </SidebarProvider>
    );
  }
  return <AdminSidebarInner {...props} />;
}
