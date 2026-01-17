// Re-export from new location for backwards compatibility
// TODO: Update imports to use @/src/shared/lib/amplitude directly
export {
  initAmplitude,
  logAmplitudeEvent as logEvent,
} from '@/src/shared/lib/amplitude';
