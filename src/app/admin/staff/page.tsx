"use client";

import { EmployeeFormOptimized } from "@/components/staff/employee-form-optimized"

export const dynamic = 'force-dynamic';

export default function StaffPage() {
  return (
    <div className="@container/main flex flex-1 flex-col">
      <EmployeeFormOptimized />
    </div>
  );
}
