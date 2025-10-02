import { useAuthStore } from "@/src/stores/authStore";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Button from "../../ui/button";

export default function HomeScreen() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  
  // Zustand стор
  const { getUserRole } = useAuthStore();

  useEffect(() => {
    const fetchRole = async () => {
      const userRole = await getUserRole();
      setRole(userRole);
    };

    fetchRole();
  }, [getUserRole]);
  return (
    <View style={styles.container}>
      {/* <CustomHeader /> */}
      <View style={styles.contentContainer}>
        <View style={styles.logoSection}>
          <Image
            source={require('@/src/assets/images/kiflow-logo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>створюємо онлайн освіту</Text>
        </View>

        <View style={styles.navSection}>
          <Button
            title="COURSES"
            variant="secondary"
            size="lg"
            onPress={() => router.push('/courses/')}
            style={styles.navButton}
          />
          <Button
            title="STATISTICS"
            variant="secondary"
            size="lg"
            onPress={() => router.push('/statistics')}
            style={styles.navButton}
          />

          <Button
            title="PROFILE"
            variant="secondary"
            size="lg"
            onPress={() => router.push('/profile')}
            style={styles.navButton}
          />

          {role === 'admin' && (
            <>
              <Button
                title="AI INSTRUCTIONS"
                variant="secondary"
                size="lg"
                onPress={() => router.push('/instractions')}
                style={styles.navButton}
              />

              <Button
                title="REAL ESTATE SIMULATOR"
                variant="secondary"
                size="lg"
                onPress={() => {}}
                style={styles.navButton}
              />

              <Button
                title="COMPANY DASHBOARD"
                variant="secondary"
                size="lg"
                onPress={() => {}}
                style={styles.navButton}
              />
            </>
          )}
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 300,
    height: 120,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  navSection: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  navButton: {
    width: "80%",
  },
});
