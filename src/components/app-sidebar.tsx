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
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
