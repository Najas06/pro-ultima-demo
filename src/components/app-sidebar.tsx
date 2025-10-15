"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconSearch,
  IconSettings,
  IconUsers,
  IconCash,
  IconTool,
  IconDots,
  IconBrush,
  IconTrash,
  IconRefresh,
  IconLogout,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"

const data = {
  user: {
    name: "Admin User",
    email: "admin@proultima.com",
    avatar: "/avatars/admin.svg",
    initials: "AU",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Tasks",
      url: "/admin/tasks",
      icon: IconListDetails,
    },
    {
      title: "Teams",
      url: "/admin/teams",
      icon: IconUsers,
    },
    {
      title: "Staff",
      url: "/admin/staff",
      icon: IconUsers,
    },
    {
      title: "Reports",
      url: "/admin/reports",
      icon: IconChartBar,
    },
    {
      title: "Cash Book",
      url: "/admin/cashbook",
      icon: IconCash,
    },
    {
      title: "Maintenance",
      url: "/admin/maintenance",
      icon: IconTool,
    },
  ],
  navClouds: [
    {
      title: "Task Management",
      icon: IconListDetails,
      isActive: true,
      url: "/admin/tasks",
      items: [
        {
          title: "All Tasks",
          url: "/admin/tasks",
        },
        {
          title: "My Tasks",
          url: "/admin/tasks?filter=my",
        },
        {
          title: "Completed",
          url: "/admin/tasks?status=completed",
        },
      ],
    },
    {
      title: "Team Management",
      icon: IconUsers,
      url: "/admin/teams",
      items: [
        {
          title: "All Teams",
          url: "/admin/teams",
        },
        {
          title: "My Teams",
          url: "/admin/teams?filter=my",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/admin/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "/admin/help",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "/admin/search",
      icon: IconSearch,
    },
  ],
  // documents: [
  //   {
  //     name: "Task Templates",
  //     url: "/admin/templates",
  //     icon: IconFileDescription,
  //   },
  //   {
  //     name: "Reports",
  //     url: "/admin/reports",
  //     icon: IconReport,
  //   },
  //   {
  //     name: "Analytics",
  //     url: "/admin/analytics",
  //     icon: IconChartBar,
  //   },
  // ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const handleCleanupDuplicates = async () => {
    alert('✅ No cleanup needed with real-time sync!');
  };

  const handleClearAllData = async () => {
    try {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      alert('✅ Data refreshed from Supabase!');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      alert('❌ Failed to refresh data. Check console for details.');
    }
  };

  const handleForceSync = async () => {
    try {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      alert('✅ Data refreshed from Supabase successfully!');
    } catch (error) {
      console.error('Failed to refresh:', error);
      alert('❌ Failed to refresh data. Check console for details.');
    }
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/admin/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">ProUltima</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavDocuments items={data.documents} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
        
        {/* More Actions Dropdown */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <IconDots className="!size-5" />
                  <span>More Actions</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-56">
                <DropdownMenuLabel>System Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCleanupDuplicates}>
                  <IconBrush className="mr-2 h-4 w-4" />
                  Fix Data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleClearAllData}>
                  <IconTrash className="mr-2 h-4 w-4" />
                  Clear All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleForceSync}>
                  <IconRefresh className="mr-2 h-4 w-4" />
                  Force Sync
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <IconLogout className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
