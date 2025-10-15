"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconListDetails,
  IconSettings,
  IconClock,
  IconLogout,
  IconCash,
  IconTool,
} from "@tabler/icons-react"
import { useAuth } from "@/contexts/auth-context"
import { useAttendance } from "@/hooks/use-attendance"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

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
import Link from "next/link"

export function StaffSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth();
  const { useTodayAttendance, markLogout } = useAttendance();
  const { data: todayAttendance } = useTodayAttendance(user?.staffId);

  const handleLogout = async () => {
    try {
      // Mark logout in attendance
      if (user?.staffId) {
        await markLogout(user.staffId);
      }
      
      // Logout user
      await logout();
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  // Get staff profile image from user object
  const staffProfileImage = user?.profileImage || "/avatars/staff.svg";
  const staffInitials = user?.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'SU';

  const data = {
    user: {
      name: user?.name || "Staff User",
      email: user?.email || "staff@proultima.com",
      avatar: staffProfileImage,
      initials: staffInitials,
    },
    navMain: [
      {
        title: "Dashboard",
        url: "/staff/dashboard",
        icon: IconDashboard,
      },
      {
        title: "My Tasks",
        url: "/staff/tasks",
        icon: IconListDetails,
      },
      {
        title: "Cash Book",
        url: "/staff/cashbook",
        icon: IconCash,
      },
      {
        title: "Maintenance",
        url: "/staff/maintenance",
        icon: IconTool,
      },
    ],
    navSecondary: [
      {
        title: "Help & Support",
        url: "#",
        icon: IconHelp,
      },
      {
        title: "Settings",
        url: "#",
        icon: IconSettings,
      },
    ],
  }

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/staff/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                  <span className="text-lg font-bold">P</span>
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">ProUltima</span>
                  <span className="text-xs text-muted-foreground">Staff Portal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Attendance Status */}
        {todayAttendance && (
          <div className="mx-2 mt-2 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm">
            <IconClock className="h-4 w-4 text-green-600" />
            <div className="flex-1">
              <div className="font-medium text-green-700">Logged In</div>
              <div className="text-xs text-green-600">
                {new Date(todayAttendance.login_time).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="gap-2">
        <NavUser user={data.user} />
        <div className="px-2 pb-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <IconLogout className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

