import { useEffect } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useCourseStore } from "@/src/stores/courseStore";
import { useCriteriaStore } from "@/src/stores/criterias";
import { useMainRatingStore } from "@/src/stores/mainRatingStore";
import { useAuthStore, useModulesStore } from "@/src/stores";

export default function StatisticsScreen() {
  const { courses, fetchCourses, isLoading: coursesLoading } = useCourseStore();
  const { criterias, fetchAllCriterias} = useCriteriaStore();
  const { fetchUserRatings, ratings } = useMainRatingStore();
  const { modules, fetchMyModulesByCourses } = useModulesStore(); 
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      fetchCourses();
      fetchAllCriterias();
      fetchUserRatings(user.id);
    }
  }, []);


  useEffect(() => {
    fetchMyModulesByCourses(courses.map(course=>course.id))
  }, [courses]);

  const getModulesCount = (courseId: string) => {
    return modules.filter((m) => m.course_id === courseId).length;
  };


  const getCourseAverageFromRatings = (courseId: string) => {
    const courseCriterias = criterias.filter(c => c.course_id === courseId);
    if (!courseCriterias.length) return 0;
  
    const courseRatings = ratings.filter(r => courseCriterias.some(c => c.key === r.criteria_key));
  
    if (!courseRatings.length) return 0;
  
    const total = courseRatings.reduce((sum, r) => sum + (r.rating || 0), 0);
    return (total / courseRatings.length).toFixed(1);
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.card} contentContainerStyle={styles.cardContent} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrapper}>
          <MaterialIcons name="insert-chart" size={40} color="#7c3aed" />
        </View>

        <Text style={styles.title}>Статистика</Text>
        <Text style={styles.subtitle}>Тут відображається статистика по кожному курсу</Text>

        {coursesLoading && <Text>Завантаження курсів...</Text>}

        {!coursesLoading && courses.map((course) => (
          <View key={course.id} style={styles.skillsCard}>
            <Text style={styles.courseTitle}>{course.title}</Text>

            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: "#dcfce7" }]}>
                <Text style={styles.statLabel}>Середній бал</Text>
                <Text style={[styles.statValue, { color: "#15803d" }]}>
                  {getCourseAverageFromRatings(course.id)} / 5
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: "#ede9fe" }]}>
                  <Text style={styles.statLabel}>Модулів</Text>
                  <Text style={[styles.statValue, { color: "#7c3aed" }]}>
                    {getModulesCount(course.id)}
                  </Text>
                </View>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Характеристика</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Оцінка</Text>
            </View>

            <FlatList
              data={criterias.filter(c => c.course_id === course.id)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const skill = ratings.find(s => s.criteria_key === item.key);
                return (
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCell}>{item.name}</Text>
                    <Text style={styles.tableCell}>{skill?.rating ?? 0}</Text>
                  </View>
                );
              }}
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
