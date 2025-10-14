export type MaintenanceCondition = 'new' | 'used';
export type MaintenanceRunningStatus = 'running' | 'not_running';
export type MaintenanceStatus = 'pending' | 'approved' | 'rejected';

export interface MaintenanceRequest {
  id: string;
  staff_id: string;
  branch: string;
  
  // System Information
  serial_number?: string;
  workstation_number?: string;
  brand_name?: string;
  
  // Dates
  report_month: string;
  date_of_purchase?: string;
  warranty_start_date?: string;
  warranty_end_date?: string;
  
  // Status
  condition: MaintenanceCondition;
  running_status: MaintenanceRunningStatus;
  
  // Request Management
  status: MaintenanceStatus;
  requested_date: string;
  
  // Approval/Rejection
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations
  staff?: {
    name: string;
    email: string;
    employee_id: string;
  };
  approver?: {
    name: string;
    email: string;
  };
}

export interface MaintenanceFormData {
  serial_number?: string;
  workstation_number?: string;
  brand_name?: string;
  report_month: string;
  date_of_purchase?: string;
  warranty_start_date?: string;
  warranty_end_date?: string;
  condition: MaintenanceCondition;
  running_status: MaintenanceRunningStatus;
  branch: string;
}
