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
  
  // Attachments
  attachment_urls?: string[];
  
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
  attachment_urls?: string[];
}

// Purchase Requisition Types
export interface PurchaseRequisition {
  id: string;
  staff_id: string;
  name: string;
  designation: string;
  department: string;
  branch: string;
  purchase_item: string;
  description?: string;
  quotation_urls?: string[];
  status: 'pending' | 'approved' | 'rejected';
  requested_date: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  staff?: {
    name: string;
    employee_id: string;
    email: string;
  };
  admin?: {
    name: string;
    email: string;
  };
}

export interface PurchaseRequisitionFormData {
  name: string;
  designation: string;
  department: string;
  branch: string;
  purchase_item: string;
  description?: string;
  quotation_urls?: string[];
}



