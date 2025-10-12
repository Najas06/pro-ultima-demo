"use client";

import { TeamsManagement } from "@/components/teams/teams-management"

export const dynamic = 'force-dynamic';

export default function TeamsPage() {
  return (
    <div className="@container/main flex flex-1 flex-col">
      <TeamsManagement />
    </div>
  );
}
