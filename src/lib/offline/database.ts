import Dexie, { Table } from 'dexie';
import type { OfflineData } from './types';

// Define interfaces for offline storage
export interface OfflineStaff extends OfflineData {
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

export interface OfflineTeam extends OfflineData {
  id: string;
  name: string;
  description?: string;
  leader_id: string;
  leader?: OfflineStaff;
  branch?: string;
  members?: OfflineTeamMember[];
  created_at: string;
  updated_at: string;
}

export interface OfflineTeamMember extends OfflineData {
  id: string;
  team_id: string;
  staff_id: string;
  staff?: OfflineStaff;
  joined_at: string;
}

export interface OfflineTask extends OfflineData {
  id: string;
  title: string;
  description?: string;
  assigned_staff_ids: string[];
  assigned_team_ids: string[];
  status: 'backlog' | 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  start_date?: string;
  created_at: string;
  updated_at: string;
  allocation_mode: 'individual' | 'team';
  assigned_staff?: OfflineTaskAssignment[];
  assigned_teams?: OfflineTeam[];
  is_repeated: boolean;
  repeat_config?: string; // JSON string
  support_files?: string[];
}

export interface OfflineTaskAssignment extends OfflineData {
  id: string;
  task_id: string;
  staff_id: string;
  staff?: OfflineStaff;
  assigned_at: string;
}

// Sync queue for pending operations
export interface SyncOperation {
  id: string;
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
  error?: string;
}

// Database class
export class OfflineDatabase extends Dexie {
  // Tables
  staff!: Table<OfflineStaff>;
  teams!: Table<OfflineTeam>;
  teamMembers!: Table<OfflineTeamMember>;
  tasks!: Table<OfflineTask>;
  taskAssignments!: Table<OfflineTaskAssignment>;
  syncQueue!: Table<SyncOperation>;

  constructor() {
    super('ProUltimaOfflineDB');
    
    this.version(1).stores({
      staff: 'id, name, email, role, department, branch, created_at, updated_at, _lastSync',
      teams: 'id, name, leader_id, branch, created_at, updated_at, _lastSync',
      teamMembers: 'id, team_id, staff_id, joined_at, _lastSync',
      tasks: 'id, title, assignee_id, team_id, status, priority, due_date, created_at, updated_at, _lastSync',
      taskAssignments: 'id, task_id, staff_id, assigned_at, _lastSync',
      syncQueue: 'id, table, operation, timestamp, retries'
    });

    // Version 2: Add compound index for task assignments
    this.version(2).stores({
      staff: 'id, name, email, role, department, branch, created_at, updated_at, _lastSync',
      teams: 'id, name, leader_id, branch, created_at, updated_at, _lastSync',
      teamMembers: 'id, team_id, staff_id, joined_at, _lastSync',
      tasks: 'id, title, assignee_id, team_id, status, priority, due_date, created_at, updated_at, _lastSync',
      taskAssignments: 'id, task_id, staff_id, assigned_at, _lastSync, [task_id+staff_id]',
      syncQueue: 'id, table, operation, timestamp, retries'
    });

    // Add hooks for automatic sync queue management
    this.staff.hook('creating', (primKey, obj) => {
      obj._isOffline = true;
      obj._lastSync = Date.now();
    });

    this.staff.hook('updating', (modifications) => {
      (modifications as OfflineData)._isOffline = true;
      (modifications as OfflineData)._lastSync = Date.now();
    });

    this.teams.hook('creating', (primKey, obj) => {
      obj._isOffline = true;
      obj._lastSync = Date.now();
    });

    this.teams.hook('updating', (modifications) => {
      (modifications as OfflineData)._isOffline = true;
      (modifications as OfflineData)._lastSync = Date.now();
    });

    this.tasks.hook('creating', (primKey, obj) => {
      obj._isOffline = true;
      obj._lastSync = Date.now();
    });

    this.tasks.hook('updating', (modifications) => {
      (modifications as OfflineData)._isOffline = true;
      (modifications as OfflineData)._lastSync = Date.now();
    });
  }
}

// Export database instance
export const offlineDB = new OfflineDatabase();
