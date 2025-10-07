import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { UIState, TaskStatus, TaskPriority } from '@/types';

interface UIStore extends UIState {
  // Dialog actions
  openTaskDialog: (mode: 'create' | 'edit', taskId?: string) => void;
  closeTaskDialog: () => void;
  openTeamDialog: (mode: 'create' | 'edit', teamId?: string) => void;
  closeTeamDialog: () => void;
  openStaffDialog: (mode: 'create' | 'edit', staffId?: string) => void;
  closeStaffDialog: () => void;
  
  // Filter actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: TaskStatus | 'all') => void;
  setPriorityFilter: (priority: TaskPriority | 'all') => void;
  clearFilters: () => void;
  
  // Loading actions
  setLoading: (loading: boolean) => void;
  setDraggedItem: (itemId: string | null) => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      // Initial state
      taskDialog: {
        isOpen: false,
        mode: 'create',
      },
      teamDialog: {
        isOpen: false,
        mode: 'create',
      },
      staffDialog: {
        isOpen: false,
        mode: 'create',
      },
      searchQuery: '',
      statusFilter: 'all',
      priorityFilter: 'all',
      isLoading: false,
      draggedItem: null,
      
      // Dialog actions
      openTaskDialog: (mode, taskId) =>
        set(() => ({
          taskDialog: {
            isOpen: true,
            mode,
            taskId,
          },
        })),
      
      closeTaskDialog: () =>
        set(() => ({
          taskDialog: {
            isOpen: false,
            mode: 'create',
          },
        })),
      
      openTeamDialog: (mode, teamId) =>
        set(() => ({
          teamDialog: {
            isOpen: true,
            mode,
            teamId,
          },
        })),
      
      closeTeamDialog: () =>
        set(() => ({
          teamDialog: {
            isOpen: false,
            mode: 'create',
          },
        })),
      
      openStaffDialog: (mode, staffId) =>
        set(() => ({
          staffDialog: {
            isOpen: true,
            mode,
            staffId,
          },
        })),
      
      closeStaffDialog: () =>
        set(() => ({
          staffDialog: {
            isOpen: false,
            mode: 'create',
          },
        })),
      
      // Filter actions
      setSearchQuery: (query) =>
        set(() => ({
          searchQuery: query,
        })),
      
      setStatusFilter: (status) =>
        set(() => ({
          statusFilter: status,
        })),
      
      setPriorityFilter: (priority) =>
        set(() => ({
          priorityFilter: priority,
        })),
      
      clearFilters: () =>
        set(() => ({
          searchQuery: '',
          statusFilter: 'all',
          priorityFilter: 'all',
        })),
      
      // Loading actions
      setLoading: (loading) =>
        set(() => ({
          isLoading: loading,
        })),
      
      setDraggedItem: (itemId) =>
        set(() => ({
          draggedItem: itemId,
        })),
    }),
    {
      name: 'ui-store',
    }
  )
);
