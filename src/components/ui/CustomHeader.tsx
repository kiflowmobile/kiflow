// src/components/CustomHeader.tsx
import { useAuthStore } from "@/src/stores/authStore";
import { Href, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { AppRoute } from "../screens/HomePageScreen/NavigationButton";

export default function CustomHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Zustand store
  const { user } = useAuthStore();

  // derive initial from user name/email
  const userInitial = ((
    ((user as any)?.user_metadata?.full_name as string) ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'User'
  ).trim().charAt(0).toUpperCase()) || '?';

  // no extra handlers

  // navigation helpers

  const navigateToProfile = () => {
    router.push('/profile' as Href);
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      {/* Left side: user name */}
      <View style={styles.nameWrap}>
        <Text style={styles.guestText}>
          {(
            (user as any)?.user_metadata?.full_name ||
            (user?.email ? user.email.split('@')[0] : '') ||
            'User'
          )}
        </Text>
      </View>

      {/* Right side: avatar only for authenticated users */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={navigateToProfile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{userInitial}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  guestText: {
    color: "#666",
    fontWeight: "500",
  },
  nameWrap: {
    height: 36,
    justifyContent: 'center',
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  avatarInitial: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 16,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  // no auth buttons
});
