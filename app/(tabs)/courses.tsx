import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useInitialLoad } from "@/hooks/use-initial-load";
import { calculateCourseProgress, getCourses, getLessonCountByCourseId } from "@/lib/database";
import { Course } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface CourseWithProgress extends Course {
  progress: number;
  lessonCount: number;
}

const EmptyCoursesList = () => {
  const router = useRouter();

  const handleEnterCode = () => {
    router.push("/company-code");
  };

  return (
    <View className="flex-1 flex-col justify-center items-center max-w-[320px] mx-auto">
      <IconSymbol name="book.fill" size={80} color="#000000" />

      <Text className="text-body-1 text-center text-neutral mt-3">
        Your course list is empty. If you skipped entering your company code, you can try again now.
      </Text>

      <TouchableOpacity onPress={handleEnterCode} className="mt-4">
        <Text className="text-title-2 text-primary">Enter code</Text>
      </TouchableOpacity>
    </View>
  );
};

const CoursesList = ({ courses }: { courses: CourseWithProgress[] }) => {
  const router = useRouter();

  const handleCoursePress = (courseId: string) => {
    router.push(`/course/${courseId}`);
  };

  return (
    <View className="gap-3">
      {courses.map((course) => (
        <TouchableOpacity
          key={course.id}
          className="rounded-xl overflow-hidden bg-white"
          onPress={() => handleCoursePress(course.id)}
          activeOpacity={0.9}
        >
          <View className="relative h-[160px] w-full">
            <Image source={{ uri: course.image_url }} className="w-full h-full" contentFit="cover" transition={200} />

            <View className="absolute bottom-4 left-4 flex-row gap-2">
              <View className="bg-primary px-2.5 py-1 rounded-full">
                <Text className="text-white text-caption font-semibold">{course.lessonCount} lessons</Text>
              </View>

              {course.progress === 100 && (
                <View className="bg-[#65A30D] px-2.5 py-1 rounded-full">
                  <Text className="text-white text-caption font-semibold">Completed</Text>
                </View>
              )}
            </View>
          </View>

          <View className="p-4">
            {course.progress > 0 && course.progress < 100 && (
              <ProgressBar progress={course.progress} className="mb-2.5" />
            )}

            <Text className="text-title-2" numberOfLines={2}>
              {course.title}
            </Text>

            {course.description && (
              <Text className="text-body-2 text-[#525252] mt-1" numberOfLines={2}>
                {course.description}
              </Text>
            )}

            <Button className="mt-4">{course.progress === 0 ? "Start course" : "Continue"}</Button>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function CoursesScreen() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const { loading, startLoading, finishLoading } = useInitialLoad(user?.id || "");

  const loadCourses = useCallback(async () => {
    if (!user) {
      finishLoading();
      return;
    }

    try {
      startLoading();
      const allCourses = await getCourses(user.id);

      // Calculate progress and lesson count for each course
      const coursesWithData = await Promise.all(
        allCourses.map(async (course) => {
          const [progressPercentage, lessonCount] = await Promise.all([
            calculateCourseProgress(user.id, course.id),
            getLessonCountByCourseId(course.id),
          ]);

          return {
            ...course,
            progress: progressPercentage,
            lessonCount,
          };
        })
      );
      setCourses(coursesWithData);
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      finishLoading();
    }
  }, [user, startLoading, finishLoading]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#5774CD" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView contentContainerClassName="flex-1 px-4 pb-4" showsVerticalScrollIndicator={false}>
        <View className="mt-4 mb-3">
          <Text className="text-title-1">Courses</Text>
        </View>

        {courses.length === 0 ? <EmptyCoursesList /> : <CoursesList courses={courses} />}
      </ScrollView>
    </SafeAreaView>
  );
}
