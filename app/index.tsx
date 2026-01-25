import { useAuthStore } from "@/store/auth-store";
import { Redirect } from "expo-router";

export default function Index() {
  const { initialized, user, hasEnrollments } = useAuthStore();

  if (!initialized) return null;

  if (!user) return <Redirect href="/welcome" />;

  if (!hasEnrollments) return <Redirect href="/company-code" />;

  return <Redirect href="/(tabs)/courses" />;
}
