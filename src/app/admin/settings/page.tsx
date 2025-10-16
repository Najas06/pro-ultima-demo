import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/admin/settings/profile-settings";
import { SystemOptionsManager } from "@/components/admin/settings/system-options-manager";
import { getAdminProfile } from "@/lib/actions/adminActions";
import { User, Settings } from "lucide-react";

export default async function SettingsPage() {
  const profileResult = await getAdminProfile();

  const adminData = profileResult.success && profileResult.data
    ? { name: profileResult.data.name, email: profileResult.data.email }
    : { name: "Admin User", email: "admin@proultima.com" };

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and system options
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System Options
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileSettings initialData={adminData} />
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <SystemOptionsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

