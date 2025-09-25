// src/components/CustomHeader.tsx
import { useAuthStore } from "@/src/stores/authStore";
import { Href, useRouter } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppRoute } from "../screens/HomePageScreen/NavigationButton";
import Button from "./button";
import { HStack } from "./hstack";

export default function CustomHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Zustand store
  const { isGuest, signOut } = useAuthStore();

  const defaultAvatarUrl =
    "https://www.shutterstock.com/image-vector/blank-avatar-photo-place-holder-600nw-1095249842.jpg";

  const handleLogout = async () => {
    try {
      await signOut();
      console.log("Successfully logged out");
    } catch (error) {
      console.error("Unexpected logout error:", error);
    }
  };

  const navigateTo = (route: AppRoute) => {
    router.push(route as Href);
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      {/* Left side: Guest label */}
      {isGuest ? (
        <HStack className="items-center justify-center rounded-md bg-gray-100 px-3 py-1">
          
          <Text style={styles.guestText}>Guest</Text>
        </HStack>
      ):
      <HStack className="items-center justify-center rounded-md bg-gray-100 px-3 py-1">
          
          <Text style={styles.guestText}>User</Text>
        </HStack>
      }

      {/* Right side: actions */}
      <View style={styles.actions}>
        {isGuest ? (
          <Button
            title="Login"
            variant="primary"
            size="sm"
            onPress={() => navigateTo("/")}
            style={styles.loginButton}
          />
        ) : (
          <>
            <Image
              source={{ uri: defaultAvatarUrl }}
              style={styles.avatar}
            />
            <Button
              title="Logout"
              variant="secondary"
              size="sm"
              onPress={handleLogout}
              style={styles.logoutButton}
            />
          </>
        )}
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
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#000",
  },
  loginButton: {
    minWidth: 80,
  },
  logoutButton: {
    minWidth: 80,
  },
});
