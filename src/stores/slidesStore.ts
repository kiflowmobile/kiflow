// Re-export from new location for backwards compatibility
// TODO: Update imports to use @/src/features/lessons directly
import { useSlidesStore as _useSlidesStore } from '@/src/features/lessons';

export const useSlidesStore = _useSlidesStore;
