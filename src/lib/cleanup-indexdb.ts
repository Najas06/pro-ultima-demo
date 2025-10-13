/**
 * Cleanup old IndexedDB databases from the previous offline implementation
 * This runs once per user to remove the complex offline/IndexedDB hybrid system
 */
export async function cleanupOldIndexedDB() {
  if (typeof window === 'undefined') return;
  
  try {
    // Check if cleanup already done
    const cleanupDone = localStorage.getItem('indexdb-cleanup-done');
    if (cleanupDone === 'true') {
      console.log('✅ IndexedDB cleanup already completed');
      return;
    }
    
    console.log('🧹 Starting IndexedDB cleanup...');
    
    // Delete old IndexedDB database
    await indexedDB.deleteDatabase('ProUltimaOfflineDB');
    
    // Mark cleanup as done
    localStorage.setItem('indexdb-cleanup-done', 'true');
    
    console.log('✅ Old IndexedDB cleaned up successfully');
  } catch (error) {
    console.error('❌ IndexedDB cleanup error:', error);
    // Don't throw - allow app to continue even if cleanup fails
  }
}

