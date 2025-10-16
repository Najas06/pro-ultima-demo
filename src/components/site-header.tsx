import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationDropdown } from "@/components/admin/notification-dropdown"
import { MaintenanceNotificationDropdown } from "@/components/admin/maintenance-notification-dropdown"

interface SiteHeaderProps {
  userName?: string;
  userRole?: 'admin' | 'staff';
}

export function SiteHeader({ userName, userRole }: SiteHeaderProps) {
  const handleViewProof = (taskId: string) => {
    // TODO: Open task verification dialog for specific task
    console.log('Open verification dialog for task:', taskId);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const greeting = getGreeting();
  const roleLabel = userRole === 'admin' ? ' ' : userRole === 'staff' ? 'Staff' : '';
  const displayText = userName ? `${greeting}, ${roleLabel} ${userName}` : 'Documents';

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 " />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{displayText}</h1>
        <div className="ml-auto flex items-center gap-2">
          {/* Task Proof Notifications */}
          <NotificationDropdown onViewProof={handleViewProof} />
          
          {/* Maintenance Notifications */}
          <MaintenanceNotificationDropdown />
          
        
        </div>
      </div>
    </header>
  )
}
