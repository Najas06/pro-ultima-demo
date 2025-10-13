export interface Attendance {
  id: string;
  staff_id: string;
  login_time: string;
  logout_time?: string;
  date: string;
  status: 'active' | 'logged_out';
  created_at: string;
  check_ins?: string[]; // Optional for future use
  last_activity?: string; // Optional for future use
}

export interface AttendanceRecord extends Attendance {
  staff?: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    profile_image_url?: string | null;
  };
}

export interface AttendanceSummary {
  totalStaff: number;
  present: number;
  absent: number;
  loggedOut: number;
}

export interface AttendanceHistory {
  date: string;
  login_time: string;
  logout_time?: string;
  duration?: number; // in minutes
  status: string;
}

