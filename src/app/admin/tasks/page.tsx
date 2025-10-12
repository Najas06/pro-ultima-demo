"use client";

import { TasksManagement } from "@/components/tasks/tasks-management"

export const dynamic = 'force-dynamic';

export default function TasksPage() {
  return (
    <div className="@container/main flex flex-1 flex-col">
      <TasksManagement />
    </div>
  );
}
