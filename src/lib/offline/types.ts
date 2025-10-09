// Offline types and interfaces

export interface OfflineData {
  _isOffline?: boolean;
  _lastSync?: number;
}

export interface SyncOperationData {
  id?: string;
  [key: string]: unknown;
}

export interface SupabaseClient {
  from: (table: string) => {
    select: (columns?: string) => Promise<{ data: unknown[] | null; error: unknown }>;
    insert: (data: unknown) => Promise<{ data: unknown; error: unknown }>;
    update: (data: unknown) => {
      eq: (column: string, value: unknown) => Promise<{ data: unknown; error: unknown }>;
    };
    delete: () => {
      eq: (column: string, value: unknown) => Promise<{ data: unknown; error: unknown }>;
    };
  };
}

export interface BeforeInstallPromptEvent extends Event {
  preventDefault(): void;
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface NetworkChangeEvent extends CustomEvent {
  detail: { isOnline: boolean };
}
