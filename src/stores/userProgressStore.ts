// Re-export from new location for backwards compatibility
// TODO: Update imports to use @/src/features/progress directly
import { useUserProgressStore as _useUserProgressStore } from '@/src/features/progress';

export const useUserProgressStore = _useUserProgressStore;