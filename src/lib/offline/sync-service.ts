import { offlineDB, SyncOperation, type OfflineStaff, type OfflineTeam, type OfflineTask } from './database';
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
  private realtimeChannel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupNetworkListeners();
      this.setupRealtimeSync();
      this.startPeriodicSync();
    }
  }

  // Network status listeners
  private setupNetworkListeners() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('App is online - syncing data...');
      this.notifyListeners();
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('App is offline - working locally');
      this.notifyListeners();
    });
  }

  // Real-time sync using localStorage events (same device) and Supabase Realtime (cross-device)
  private setupRealtimeSync() {
    if (typeof window === 'undefined') return;

    // 1. Listen for localStorage changes from other browser tabs/windows (same device)
    window.addEventListener('storage', (event) => {
      if (event.key === 'crossBrowserData' && event.newValue) {
        console.log('🔄 Real-time sync: Detected data change in another browser tab');
        this.handleRealtimeDataChange(event.newValue);
      }
    });

    // 2. Setup Supabase Realtime for cross-device sync
    this.setupSupabaseRealtime();

    console.log('✅ Real-time sync enabled (cross-browser & cross-device)');
  }

  // Setup Supabase Realtime subscriptions for cross-device sync
  private setupSupabaseRealtime() {
    try {
      const supabase = createClient();
      
      // Create a channel for real-time updates
      this.realtimeChannel = supabase.channel('db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'staff' },
          (payload) => {
            console.log('🔔 Real-time: Staff changed on another device', payload);
            this.handleSupabaseRealtimeChange('staff', payload);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'teams' },
          (payload) => {
            console.log('🔔 Real-time: Team changed on another device', payload);
            this.handleSupabaseRealtimeChange('teams', payload);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks' },
          (payload) => {
            console.log('🔔 Real-time: Task changed on another device', payload);
            this.handleSupabaseRealtimeChange('tasks', payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Supabase Realtime: Connected for cross-device sync');
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('⚠️ Supabase Realtime: Connection error (using local sync only)');
            console.warn('💡 To enable Realtime: Go to Supabase Dashboard → Database → Replication → Enable for staff, teams, tasks tables');
          } else if (status === 'TIMED_OUT') {
            console.warn('⚠️ Supabase Realtime: Connection timed out (using local sync only)');
          } else if (status === 'CLOSED') {
            console.warn('⚠️ Supabase Realtime: Connection closed (using local sync only)');
          }
        });
    } catch (error) {
      console.warn('⚠️ Supabase Realtime setup failed (using local sync only):', error);
    }
  }

  // Handle Supabase Realtime changes (INSERT, UPDATE, DELETE)
  private async handleSupabaseRealtimeChange(table: string, payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        // Add or update the record in IndexedDB
        if (table === 'staff') {
          await offlineDB.staff.put(newRecord as unknown as OfflineStaff);
          console.log(`📝 Real-time: Updated staff in local DB`);
        } else if (table === 'teams') {
          await offlineDB.teams.put(newRecord as unknown as OfflineTeam);
          console.log(`📝 Real-time: Updated team in local DB`);
        } else if (table === 'tasks') {
          await offlineDB.tasks.put(newRecord as unknown as OfflineTask);
          console.log(`📝 Real-time: Updated task in local DB`);
        }
      } else if (eventType === 'DELETE' && oldRecord) {
        // Remove the record from IndexedDB
        if (table === 'staff' && typeof oldRecord.id === 'string') {
          await offlineDB.staff.delete(oldRecord.id);
          console.log(`🗑️ Real-time: Deleted staff from local DB`);
        } else if (table === 'teams' && typeof oldRecord.id === 'string') {
          await offlineDB.teams.delete(oldRecord.id);
          console.log(`🗑️ Real-time: Deleted team from local DB`);
        } else if (table === 'tasks' && typeof oldRecord.id === 'string') {
          await offlineDB.tasks.delete(oldRecord.id);
          console.log(`🗑️ Real-time: Deleted task from local DB`);
        }
      }

      // Trigger query invalidation to update UI
      this.triggerQueryInvalidation();
      this.notifyListeners();
    } catch (error) {
      console.error('❌ Error handling Supabase realtime change:', error);
    }
  }

  // Handle real-time data changes from other browser tabs
  private async handleRealtimeDataChange(newData: string) {
    try {
      const crossBrowserData = JSON.parse(newData);
      console.log('📥 Real-time sync: Processing new data from other browser', crossBrowserData);

      // Merge the new data with existing IndexedDB data
      await this.mergeRealtimeData(crossBrowserData);
      
      // Notify listeners that data has been updated
      this.notifyListeners();
      
      console.log('✅ Real-time sync: Data merged successfully');
    } catch (error) {
      console.error('❌ Real-time sync error:', error);
    }
  }

  // Merge real-time data with existing IndexedDB data
  private async mergeRealtimeData(crossBrowserData: { staff?: OfflineStaff[]; teams?: OfflineTeam[]; tasks?: OfflineTask[] }) {
    try {
      // Merge staff data
      if (crossBrowserData.staff && Array.isArray(crossBrowserData.staff)) {
        for (const staff of crossBrowserData.staff) {
          const existing = await offlineDB.staff.get(staff.id);
          if (!existing || new Date(staff.updated_at || staff.created_at) > new Date(existing.updated_at || existing.created_at)) {
            await offlineDB.staff.put(staff);
            console.log(`📝 Real-time sync: Updated staff ${staff.name}`);
          }
        }
      }

      // Merge teams data
      if (crossBrowserData.teams && Array.isArray(crossBrowserData.teams)) {
        for (const team of crossBrowserData.teams) {
          const existing = await offlineDB.teams.get(team.id);
          if (!existing || new Date(team.updated_at || team.created_at) > new Date(existing.updated_at || existing.created_at)) {
            await offlineDB.teams.put(team);
            console.log(`📝 Real-time sync: Updated team ${team.name}`);
          }
        }
      }

      // Merge tasks data
      if (crossBrowserData.tasks && Array.isArray(crossBrowserData.tasks)) {
        for (const task of crossBrowserData.tasks) {
          const existing = await offlineDB.tasks.get(task.id);
          if (!existing || new Date(task.updated_at || task.created_at) > new Date(existing.updated_at || existing.created_at)) {
            await offlineDB.tasks.put(task);
            console.log(`📝 Real-time sync: Updated task ${task.title}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error merging real-time data:', error);
    }
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
    }, 10000); // Sync every 30 seconds when online
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

  // Get status with pending operations count
  async getDetailedStatus(): Promise<SyncStatus> {
    const pendingCount = await this.getPendingOperationsCount();
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSync: this.lastSync,
      pendingOperations: pendingCount,
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
    console.log(`Syncing ${op.operation} operation for ${op.table}:`, op.data);
    const supabase = createClient();

    try {
      switch (op.table) {
        case 'staff':
          await this.syncStaffOperation(op, supabase);
          console.log(`Successfully synced staff ${op.operation} operation`);
          break;
        case 'teams':
          await this.syncTeamOperation(op, supabase);
          console.log(`Successfully synced teams ${op.operation} operation`);
          break;
        case 'team_members':
          await this.syncTeamMemberOperation(op, supabase);
          console.log(`Successfully synced team_members ${op.operation} operation`);
          break;
        case 'tasks':
          await this.syncTaskOperation(op, supabase);
          console.log(`Successfully synced tasks ${op.operation} operation`);
          break;
        case 'task_assignments':
          await this.syncTaskAssignmentOperation(op, supabase);
          console.log(`Successfully synced task_assignments ${op.operation} operation`);
          break;
        default:
          throw new Error(`Unknown table: ${op.table}`);
      }
    } catch (error) {
      console.error(`Failed to sync ${op.operation} operation for ${op.table}:`, error);
      throw error;
    }
  }

  // Staff sync operations
  private async syncStaffOperation(op: SyncOperation, supabase: ReturnType<typeof createClient>) {
    console.log(`Executing staff ${op.operation} with data:`, op.data);
    
    switch (op.operation) {
      case 'create':
        const { data: insertData, error: insertError } = await supabase.from('staff').insert(op.data);
        if (insertError) {
          console.error('Staff insert error:', insertError);
          throw insertError;
        }
        console.log('Staff inserted successfully:', insertData);
        break;
      case 'update':
        const { data: updateData, error: updateError } = await supabase.from('staff').update(op.data).eq('id', op.data.id);
        if (updateError) {
          console.error('Staff update error:', updateError);
          throw updateError;
        }
        console.log('Staff updated successfully:', updateData);
        break;
      case 'delete':
        const { data: deleteData, error: deleteError } = await supabase.from('staff').delete().eq('id', op.data.id);
        if (deleteError) {
          console.error('Staff delete error:', deleteError);
          throw deleteError;
        }
        console.log('Staff deleted successfully:', deleteData);
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
    // First, migrate any existing data with format issues
    await this.migrateData();
    
    // Then, try to sync cross-browser data
    await this.syncCrossBrowserData();
    
    // Check if we have data after cross-browser sync
    const existingStaff = await offlineDB.staff.count();
    const existingTeams = await offlineDB.teams.count();
    const existingTasks = await offlineDB.tasks.count();
    
    if (existingStaff > 0 || existingTeams > 0 || existingTasks > 0) {
      console.log('Found existing data, skipping sample data initialization');
      return;
    }

    // Always try to connect to Supabase when online
    if (this.isOnline) {
      console.log('Online mode: Attempting to connect to Supabase...');
      try {
        const supabase = createClient();
        
        // Test Supabase connection
        const { data: testData, error: testError } = await supabase.from('staff').select('id').limit(1);
        
        if (testError) {
          console.warn('Supabase connection failed:', testError.message);
          console.log('Falling back to sample data');
          await this.initializeSampleData();
          return;
        }
        
        console.log('Supabase connection successful, downloading real data...');
        await this.downloadFromSupabase(supabase);
        return;
        
      } catch (error) {
        console.warn('Supabase connection error:', error);
        console.log('Falling back to sample data');
        await this.initializeSampleData();
        return;
      }
    }

    // Offline mode - use sample data
    console.warn('Offline mode, initializing with sample data');
    await this.initializeSampleData();
  }

  // Download data from Supabase
  private async downloadFromSupabase(supabase: ReturnType<typeof createClient>): Promise<void> {
    try {
      // Download staff
      const { data: staff, error: staffError } = await supabase.from('staff').select('*');
      if (staffError) {
        console.error('Error downloading staff:', staffError);
        throw staffError;
      }
      if (staff && staff.length > 0) {
        await offlineDB.staff.clear();
        await offlineDB.staff.bulkAdd(staff.map((s) => ({ ...s, _isOffline: false, _lastSync: Date.now() })));
        console.log(`Downloaded ${staff.length} staff members`);
      }

      // Download teams
      const { data: teams, error: teamsError } = await supabase.from('teams').select('*');
      if (teamsError) {
        console.error('Error downloading teams:', teamsError);
        throw teamsError;
      }
      if (teams && teams.length > 0) {
        await offlineDB.teams.clear();
        await offlineDB.teams.bulkAdd(teams.map((t) => ({ ...t, _isOffline: false, _lastSync: Date.now() })));
        console.log(`Downloaded ${teams.length} teams`);
      }

      // Download team members
      const { data: teamMembers, error: teamMembersError } = await supabase.from('team_members').select('*');
      if (teamMembersError) {
        console.error('Error downloading team members:', teamMembersError);
        throw teamMembersError;
      }
      if (teamMembers && teamMembers.length > 0) {
        await offlineDB.teamMembers.clear();
        await offlineDB.teamMembers.bulkAdd(teamMembers.map((tm) => ({ ...tm, _isOffline: false, _lastSync: Date.now() })));
        console.log(`Downloaded ${teamMembers.length} team members`);
      }

      // Download tasks
      const { data: tasks, error: tasksError } = await supabase.from('tasks').select('*');
      if (tasksError) {
        console.error('Error downloading tasks:', tasksError);
        throw tasksError;
      }
      if (tasks && tasks.length > 0) {
        await offlineDB.tasks.clear();
        await offlineDB.tasks.bulkAdd(tasks.map((t) => ({ ...t, _isOffline: false, _lastSync: Date.now() })));
        console.log(`Downloaded ${tasks.length} tasks`);
      }

      // Download task assignments
      const { data: taskAssignments, error: taskAssignmentsError } = await supabase.from('task_assignments').select('*');
      if (taskAssignmentsError) {
        console.error('Error downloading task assignments:', taskAssignmentsError);
        throw taskAssignmentsError;
      }
      if (taskAssignments && taskAssignments.length > 0) {
        await offlineDB.taskAssignments.clear();
        await offlineDB.taskAssignments.bulkAdd(taskAssignments.map((ta) => ({ ...ta, _isOffline: false, _lastSync: Date.now() })));
        console.log(`Downloaded ${taskAssignments.length} task assignments`);
      }

      this.lastSync = Date.now();
      this.notifyListeners();
      console.log('Supabase data download completed successfully');
    } catch (error) {
      console.error('Failed to download data from Supabase:', error);
      throw error;
    }
  }

  // Force refresh data (useful for testing)
  async forceRefreshData(): Promise<void> {
    console.log('Force refreshing data...');
    try {
      await this.downloadData();
      console.log('Force refresh completed');
    } catch (error) {
      console.error('Force refresh failed:', error);
    }
  }

  // Public method to trigger cross-browser sync
  async triggerCrossBrowserSync(): Promise<void> {
    console.log('Triggering cross-browser sync...');
    await this.syncCrossBrowserData();
    await this.saveCrossBrowserData();
  }

  // Force sync all pending operations
  async forceSyncAll(): Promise<void> {
    console.log('Force syncing all pending operations...');
    if (this.isOnline) {
      await this.syncAll();
    } else {
      console.log('Cannot sync - offline');
      throw new Error('Cannot sync while offline');
    }
  }

  // Get pending operations count
  async getPendingOperationsCount(): Promise<number> {
    try {
      const pendingOps = await offlineDB.syncQueue.toArray();
      return pendingOps.length;
    } catch (error) {
      console.error('Failed to get pending operations count:', error);
      return 0;
    }
  }

  // Get pending operations details
  async getPendingOperations(): Promise<SyncOperation[]> {
    try {
      return await offlineDB.syncQueue.toArray();
    } catch (error) {
      console.error('Failed to get pending operations:', error);
      return [];
    }
  }

  // Cross-browser data synchronization using localStorage
  private async syncCrossBrowserData(): Promise<void> {
    try {
      // Check if there's data in localStorage from another browser
      const crossBrowserData = localStorage.getItem('proultima_cross_browser_data');
      if (crossBrowserData) {
        const data = JSON.parse(crossBrowserData);
        console.log('Found cross-browser data, syncing...', data);
        
        // Sync staff data - merge instead of replace
        if (data.staff && data.staff.length > 0) {
          const existingStaff = await offlineDB.staff.toArray();
          const existingStaffIds = new Set(existingStaff.map(s => s.id));
          
          // Add new staff that don't exist locally
          const newStaff = data.staff.filter((s: OfflineStaff) => !existingStaffIds.has(s.id));
          if (newStaff.length > 0) {
            await offlineDB.staff.bulkAdd(newStaff.map((s: OfflineStaff) => ({ ...s, _isOffline: true, _lastSync: Date.now() })));
            console.log(`Added ${newStaff.length} new staff from cross-browser sync`);
          }
        }
        
        // Sync teams data - merge instead of replace
        if (data.teams && data.teams.length > 0) {
          const existingTeams = await offlineDB.teams.toArray();
          const existingTeamIds = new Set(existingTeams.map(t => t.id));
          
          // Add new teams that don't exist locally
          const newTeams = data.teams.filter((t: OfflineTeam) => !existingTeamIds.has(t.id));
          if (newTeams.length > 0) {
            await offlineDB.teams.bulkAdd(newTeams.map((t: OfflineTeam) => ({ ...t, _isOffline: true, _lastSync: Date.now() })));
            console.log(`Added ${newTeams.length} new teams from cross-browser sync`);
          }
        }
        
        // Sync tasks data - merge instead of replace
        if (data.tasks && data.tasks.length > 0) {
          const existingTasks = await offlineDB.tasks.toArray();
          const existingTaskIds = new Set(existingTasks.map(task => task.id));
          
          // Add new tasks that don't exist locally
          const newTasks = data.tasks.filter((task: OfflineTask) => !existingTaskIds.has(task.id));
          if (newTasks.length > 0) {
            await offlineDB.tasks.bulkAdd(newTasks.map((task: OfflineTask) => ({ ...task, _isOffline: true, _lastSync: Date.now() })));
            console.log(`Added ${newTasks.length} new tasks from cross-browser sync`);
          }
        }
        
        console.log('Cross-browser data synced successfully');
      }
    } catch (error) {
      console.error('Failed to sync cross-browser data:', error);
    }
  }

  // Save current data to localStorage for cross-browser sync
  private async saveCrossBrowserData(): Promise<void> {
    try {
      const staff = await offlineDB.staff.toArray();
      const teams = await offlineDB.teams.toArray();
      const tasks = await offlineDB.tasks.toArray();
      
      const crossBrowserData = {
        staff: staff, // Save all staff data
        teams: teams, // Save all teams data
        tasks: tasks, // Save all tasks data
        timestamp: Date.now()
      };
      
      localStorage.setItem('proultima_cross_browser_data', JSON.stringify(crossBrowserData));
      console.log(`Cross-browser data saved: ${staff.length} staff, ${teams.length} teams, ${tasks.length} tasks`);
    } catch (error) {
      console.error('Failed to save cross-browser data:', error);
    }
  }

  // Initialize with sample data when Supabase is not available
  private async initializeSampleData(): Promise<void> {
    console.log('Initializing sample data for offline demo');
    
    const sampleStaff = [
      {
        id: 'staff_1',
        name: 'John Doe',
        email: 'john.doe@company.com',
        employee_id: 'EMP001',
        role: 'Project Manager',
        department: 'Engineering',
        branch: 'Main Office',
        phone: '+1-555-0123',
        profile_image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _isOffline: true,
        _lastSync: Date.now(),
      },
      {
        id: 'staff_2',
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        employee_id: 'EMP002',
        role: 'Developer',
        department: 'Engineering',
        branch: 'Main Office',
        phone: '+1-555-0124',
        profile_image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _isOffline: true,
        _lastSync: Date.now(),
      },
      {
        id: 'staff_3',
        name: 'Mike Johnson',
        email: 'mike.johnson@company.com',
        employee_id: 'EMP003',
        role: 'Designer',
        department: 'Design',
        branch: 'Main Office',
        phone: '+1-555-0125',
        profile_image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _isOffline: true,
        _lastSync: Date.now(),
      },
    ];

    const sampleTeams = [
      {
        id: 'team_1',
        name: 'Development Team',
        description: 'Main development team for web applications',
        leader_id: 'staff_1',
        branch: 'Main Office',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _isOffline: true,
        _lastSync: Date.now(),
      },
      {
        id: 'team_2',
        name: 'Design Team',
        description: 'UI/UX design and creative team',
        leader_id: 'staff_3',
        branch: 'Main Office',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _isOffline: true,
        _lastSync: Date.now(),
      },
    ];

    const sampleTasks = [
      {
        id: 'task_1',
        title: 'Implement user authentication',
        description: 'Create login and registration system',
        status: 'in_progress' as const,
        priority: 'high' as const,
        assignee_id: 'staff_2',
        team_id: 'team_1',
        allocation_mode: 'individual' as const,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_repeated: false,
        repeat_config: undefined,
        _isOffline: true,
        _lastSync: Date.now(),
      },
      {
        id: 'task_2',
        title: 'Design new dashboard',
        description: 'Create wireframes and mockups for the new dashboard',
        status: 'todo' as const,
        priority: 'medium' as const,
        assignee_id: 'staff_3',
        team_id: 'team_2',
        allocation_mode: 'individual' as const,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_repeated: false,
        repeat_config: undefined,
        _isOffline: true,
        _lastSync: Date.now(),
      },
      {
        id: 'task_3',
        title: 'Code review process',
        description: 'Review and approve pull requests',
        status: 'completed' as const,
        priority: 'low' as const,
        assignee_id: 'staff_1',
        team_id: 'team_1',
        allocation_mode: 'individual' as const,
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        updated_at: new Date().toISOString(),
        is_repeated: false,
        repeat_config: undefined,
        _isOffline: true,
        _lastSync: Date.now(),
      },
    ];

    try {
      // Clear existing data and add sample data
      await offlineDB.staff.clear();
      await offlineDB.staff.bulkAdd(sampleStaff);
      
      await offlineDB.teams.clear();
      await offlineDB.teams.bulkAdd(sampleTeams);
      
      await offlineDB.tasks.clear();
      await offlineDB.tasks.bulkAdd(sampleTasks);
      
      this.lastSync = Date.now();
      this.notifyListeners();
      console.log('Sample data initialized successfully');
      
      // Verify data was added
      const staffCount = await offlineDB.staff.count();
      const teamsCount = await offlineDB.teams.count();
      const tasksCount = await offlineDB.tasks.count();
      console.log(`Sample data verification: ${staffCount} staff, ${teamsCount} teams, ${tasksCount} tasks`);
      
    } catch (error) {
      console.error('Failed to initialize sample data:', error);
    }
  }

  // Notify listeners of status changes
  private notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }

  // Migrate existing data to fix format issues
  private async migrateData(): Promise<void> {
    try {
      console.log('Starting data migration...');
      
      // Fix tasks with incorrect repeat_config format
      const tasks = await offlineDB.tasks.toArray();
      for (const task of tasks) {
        if (task.repeat_config && typeof task.repeat_config === 'object') {
          console.log('Fixing repeat_config for task:', task.id);
          await offlineDB.tasks.update(task.id, {
            repeat_config: JSON.stringify(task.repeat_config)
          });
        }
      }
      
      console.log('Data migration completed');
    } catch (error) {
      console.error('Data migration failed:', error);
    }
  }

  // Trigger query invalidation for real-time updates
  triggerQueryInvalidation() {
    // Dispatch a custom event that React Query can listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      console.log('🔄 Triggered query invalidation for real-time updates');
    }
  }

  // Cleanup
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
      console.log('🔌 Disconnected from Supabase Realtime');
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export const syncService = new SyncService();
