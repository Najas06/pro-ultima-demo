// Task types
export interface Task {
  id: string;
  name: string;
  description?: string;
  assignee_id?: string;
  assignee?: Staff;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  created_at: string;
  updated_at: string;
  repeat?: TaskRepeat;
  team_id?: string;
  team?: Team;
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskRepeat = 'none' | 'daily' | 'weekly' | 'monthly';

// Staff types
export interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  branch?: string;
  phone?: string;
  profile_image_url?: string | null;
  created_at: string;
  updated_at: string;
}

// Team types
export interface Team {
  id: string;
  name: string;
  description?: string;
  leader_id: string;
  leader?: Staff;
  branch?: string;
  members?: TeamMember[];
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  staff_id: string;
  staff?: Staff;
  joined_at: string;
}

// Report types
export interface Report {
  id: string;
  title: string;
  description?: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// UI State types
export interface UIState {
  // Dialog states
  taskDialog: {
    isOpen: boolean;
    mode: 'create' | 'edit';
    taskId?: string;
  };
  teamDialog: {
    isOpen: boolean;
    mode: 'create' | 'edit';
    teamId?: string;
  };
  staffDialog: {
    isOpen: boolean;
    mode: 'create' | 'edit';
    staffId?: string;
  };
  
  // Filter states
  searchQuery: string;
  statusFilter: TaskStatus | 'all';
  priorityFilter: TaskPriority | 'all';
  
  // Loading states
  isLoading: boolean;
  draggedItem: string | null;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Form types
export interface TaskFormData {
  name: string;
  description?: string;
  assignee_id?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  repeat?: TaskRepeat;
  team_id?: string;
}

export interface StaffFormData {
  name: string;
  email: string;
  role: string;
  department: string;
}

export interface TeamFormData {
  name: string;
  description?: string;
  leader_id: string;
  branch?: string;
  member_ids: string[];
}

export interface UpdateTeamFormData extends TeamFormData {
  id: string;
}
