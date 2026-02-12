import { useAuthStore } from '@/store/auth-store';
import { Redirect, useGlobalSearchParams } from 'expo-router';

export default function Index() {
  const { initialized, user, hasEnrollments } = useAuthStore();

  const global = useGlobalSearchParams();
  const hash = global['#'] as string;

  if (!initialized) return null;

  if (hash?.includes('access_token')) return <Redirect href={`/reset-password#${hash}`} />;

  if (!user) return <Redirect href="/welcome" />;

  if (!hasEnrollments) return <Redirect href="/company-code" />;

  return <Redirect href="/(tabs)/courses" />;
}
