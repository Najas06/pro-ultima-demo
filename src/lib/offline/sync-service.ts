import { offlineDB, SyncOperation } from './database';
import { createClient } from '../supabase/client';
import type { SupabaseClient, SyncOperationData } from './types';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: number | null;
  pendingOperations: number;
  error?: string;
}

class SyncService {
  private isOnline = typeof window !== 'undefined' ? navigator.onLine : false;
  private isSyncing = false;
  private lastSync: number | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupNetworkListeners();
      this.startPeriodicSync();
    }
  }

  // Network status listeners
  private setupNetworkListeners() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  // Periodic sync when online
  private startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncAll();
      }
    }, 30000); // Sync every 30 seconds when online
  }

  // Subscribe to sync status changes
  subscribe(listener: (status: SyncStatus) => void) {
    this.listeners.add(listener);
    // Return current status immediately
    listener(this.getStatus());
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Get current sync status
  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSync: this.lastSync,
      pendingOperations: 0, // Will be updated when we check queue
    };
  }

  // Check if online
  isConnected(): boolean {
    return this.isOnline;
  }

  // Add operation to sync queue
  async queueOperation(table: string, operation: 'create' | 'update' | 'delete', data: SyncOperationData) {
    const syncOp: SyncOperation = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      table,
      operation,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    await offlineDB.syncQueue.add(syncOp);
    
    // If online, try to sync immediately
    if (this.isOnline) {
      this.syncAll();
    }
  }

  // Sync all pending operations
  async syncAll(): Promise<void> {
    if (!this.isOnline || this.isSyncing) {
      return;
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const pendingOps = await offlineDB.syncQueue.toArray();
      
      for (const op of pendingOps) {
        try {
          await this.syncOperation(op);
          await offlineDB.syncQueue.delete(op.id);
        } catch (error) {
          console.error('Sync operation failed:', error);
          op.retries++;
          op.error = error instanceof Error ? error.message : 'Unknown error';
          
          if (op.retries < 3) {
            await offlineDB.syncQueue.put(op);
          } else {
            // Remove after 3 failed attempts
            await offlineDB.syncQueue.delete(op.id);
          }
        }
      }

      this.lastSync = Date.now();
      this.notifyListeners();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  // Sync individual operation
  private async syncOperation(op: SyncOperation): Promise<void> {
    const supabase = createClient();

    switch (op.table) {
      case 'staff':
        await this.syncStaffOperation(op, supabase);
        break;
      case 'teams':
        await this.syncTeamOperation(op, supabase);
        break;
      case 'team_members':
        await this.syncTeamMemberOperation(op, supabase);
        break;
      case 'tasks':
        await this.syncTaskOperation(op, supabase);
        break;
      case 'task_assignments':
        await this.syncTaskAssignmentOperation(op, supabase);
        break;
      default:
        throw new Error(`Unknown table: ${op.table}`);
    }
  }

  // Staff sync operations
  private async syncStaffOperation(op: SyncOperation, supabase: ReturnType<typeof createClient>) {
    switch (op.operation) {
      case 'create':
        await supabase.from('staff').insert(op.data);
        break;
      case 'update':
        await supabase.from('staff').update(op.data).eq('id', op.data.id);
        break;
      case 'delete':
        await supabase.from('staff').delete().eq('id', op.data.id);
        break;
    }
  }

  // Team sync operations
  private async syncTeamOperation(op: SyncOperation, supabase: ReturnType<typeof createClient>) {
    switch (op.operation) {
      case 'create':
        await supabase.from('teams').insert(op.data);
        break;
      case 'update':
        await supabase.from('teams').update(op.data).eq('id', op.data.id);
        break;
      case 'delete':
        await supabase.from('teams').delete().eq('id', op.data.id);
        break;
    }
  }

  // Team member sync operations
  private async syncTeamMemberOperation(op: SyncOperation, supabase: ReturnType<typeof createClient>) {
    switch (op.operation) {
      case 'create':
        await supabase.from('team_members').insert(op.data);
        break;
      case 'update':
        await supabase.from('team_members').update(op.data).eq('id', op.data.id);
        break;
      case 'delete':
        await supabase.from('team_members').delete().eq('id', op.data.id);
        break;
    }
  }

  // Task sync operations
  private async syncTaskOperation(op: SyncOperation, supabase: ReturnType<typeof createClient>) {
    switch (op.operation) {
      case 'create':
        await supabase.from('tasks').insert(op.data);
        break;
      case 'update':
        await supabase.from('tasks').update(op.data).eq('id', op.data.id);
        break;
      case 'delete':
        await supabase.from('tasks').delete().eq('id', op.data.id);
        break;
    }
  }

  // Task assignment sync operations
  private async syncTaskAssignmentOperation(op: SyncOperation, supabase: ReturnType<typeof createClient>) {
    switch (op.operation) {
      case 'create':
        await supabase.from('task_assignments').insert(op.data);
        break;
      case 'update':
        await supabase.from('task_assignments').update(op.data).eq('id', op.data.id);
        break;
      case 'delete':
        await supabase.from('task_assignments').delete().eq('id', op.data.id);
        break;
    }
  }

  // Download data from Supabase to offline storage
  async downloadData(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot download data while offline');
    }

    const supabase = createClient();

    try {
      // Download staff
      const { data: staff } = await supabase.from('staff').select('*');
      if (staff) {
        await offlineDB.staff.clear();
        await offlineDB.staff.bulkAdd(staff.map(s => ({ ...s, _isOffline: false, _lastSync: Date.now() })));
      }

      // Download teams
      const { data: teams } = await supabase.from('teams').select('*');
      if (teams) {
        await offlineDB.teams.clear();
        await offlineDB.teams.bulkAdd(teams.map(t => ({ ...t, _isOffline: false, _lastSync: Date.now() })));
      }

      // Download team members
      const { data: teamMembers } = await supabase.from('team_members').select('*');
      if (teamMembers) {
        await offlineDB.teamMembers.clear();
        await offlineDB.teamMembers.bulkAdd(teamMembers.map(tm => ({ ...tm, _isOffline: false, _lastSync: Date.now() })));
      }

      // Download tasks
      const { data: tasks } = await supabase.from('tasks').select('*');
      if (tasks) {
        await offlineDB.tasks.clear();
        await offlineDB.tasks.bulkAdd(tasks.map(t => ({ ...t, _isOffline: false, _lastSync: Date.now() })));
      }

      // Download task assignments
      const { data: taskAssignments } = await supabase.from('task_assignments').select('*');
      if (taskAssignments) {
        await offlineDB.taskAssignments.clear();
        await offlineDB.taskAssignments.bulkAdd(taskAssignments.map(ta => ({ ...ta, _isOffline: false, _lastSync: Date.now() })));
      }

      this.lastSync = Date.now();
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to download data:', error);
      throw error;
    }
  }

  // Notify listeners of status changes
  private notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }

  // Cleanup
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export const syncService = new SyncService();
