import { useAuthStore } from "@/src/stores";
import { useMainRatingStore } from "@/src/stores/mainRatingStore";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";

export default function StatisticsScreen() {
  const {average, fetchUserAverage} = useMainRatingStore();
  const { user } = useAuthStore();
  const courses = [
    {
      id: "c1",
      name: "Курс 1: Основи програмування",
      skills: [
        { id: "1", criterion_name: "Логіка", average_score: 4.3 },
        { id: "2", criterion_name: "Синтаксис", average_score: 4.0 },
        { id: "3", criterion_name: "Практика", average_score: 4.5 },
      ],
    },
    {
      id: "c2",
      name: "Курс 2: Алгоритми",
      skills: [
        { id: "1", criterion_name: "Аналіз", average_score: 3.9 },
        { id: "2", criterion_name: "Швидкодія", average_score: 4.1 },
        { id: "3", criterion_name: "Оптимізація", average_score: 3.7 },
      ],
    },
    {
      id: "c3",
      name: "Курс 3: Алгоритми",
      skills: [
        { id: "1", criterion_name: "Аналіз", average_score: 3.9 },
        { id: "2", criterion_name: "Швидкодія", average_score: 4.1 },
        { id: "3", criterion_name: "Оптимізація", average_score: 3.7 },
      ],
    },
  ];

  useEffect(() => {
    if (user) {
      fetchUserAverage(user.id);
    }
  }, [user]);

  return (
    <View style={styles.screen}>
      {/* 🔹 Додаємо ScrollView */}
      <ScrollView
        style={styles.card}
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrapper}>
          <MaterialIcons name="insert-chart" size={40} color="#7c3aed" />
        </View>

        <Text style={styles.title}>Статистика</Text>
        <Text style={styles.subtitle}>
          Тут відображається статистика по всіх твоїх курсах
        </Text>

        {/* Основні метрики */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Основні оцінки</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: "#dbeafe" }]}>
              <Text style={styles.statLabel}>Час навчання</Text>
              <Text style={[styles.statValue, { color: "#1d4ed8" }]}>
                12 год
              </Text>
            </View>
            {average &&
              <View style={[styles.statBox, { backgroundColor: "#dcfce7" }]}>
                <Text style={styles.statLabel}>Середній бал</Text>
                <Text style={[styles.statValue, { color: "#15803d" }]}>{average} / 5</Text>
              </View>
            }
            <View style={[styles.statBox, { backgroundColor: "#ede9fe" }]}>
              <Text style={styles.statLabel}>Курси</Text>
              <Text style={[styles.statValue, { color: "#7c3aed" }]}>
                {courses.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Таблиці по курсах */}
        {courses.map((course) => (
          <View key={course.id} style={styles.skillsCard}>
            <Text style={styles.courseTitle}>{course.name}</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>
                Характеристика
              </Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Оцінка</Text>
            </View>
            <FlatList
              data={course.skills}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>{item.criterion_name}</Text>
                  <Text style={styles.tableCell}>{item.average_score}</Text>
                </View>
              )}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardContent: {
    padding: 24,
  },
  iconWrapper: {
    alignSelf: "center",
    backgroundColor: "#f3e8ff",
    padding: 12,
    borderRadius: 50,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: "#0f172a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#475569",
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  skillsCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: "#334155",
  },
  tableHeaderText: {
    fontWeight: "700",
    color: "#0f172a",
  },
});
