import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ProgressBar } from '@/shared/ui';
import { useAnalytics } from '@/features/analytics';
import { useCourseStore } from '@/features/courses';
import { useModulesStore, type Module } from '@/features/modules';
import { useCourseProgress, useUserProgressStore } from '@/features/progress';
import { lessonsApi } from '@/features/lessons';

const LINE_DEFAULT = '#D9D9D9';
const LINE_COMPLETED = '#22c55e'; // green-500

export function ModulesScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { trackEvent } = useAnalytics();

  const {
    modules,
    isLoading,
    error,
    fetchModulesByCourse,
    clearError,
    currentModule,
    setCurrentModule,
  } = useModulesStore();

  const { currentCourse, fetchCourseById } = useCourseStore();
  const { getModuleProgress } = useUserProgressStore();
  const { modules: progressModules } = useCourseProgress(params.id || '');

  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});

  // Track screen load
  useEffect(() => {
    trackEvent('modules_screen__load');
  }, [trackEvent]);

  // Fetch course and modules
  useEffect(() => {
    if (!params.id) return;
    fetchCourseById(params.id).catch((err) => console.error('Error fetching course:', err));
    fetchModulesByCourse(params.id).catch((err) => console.error('Error fetching modules:', err));
  }, [params.id, fetchModulesByCourse, fetchCourseById]);

  // Fetch lesson counts
  useEffect(() => {
    if (!modules?.length) return;

    let mounted = true;
    lessonsApi
      .fetchLessonCountsByModuleIds(modules.map((m) => m.id))
      .then((res: any) => {
        if (mounted) setLessonCounts(res?.data || {});
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [modules]);

  const handleModulePress = (module: Module, index: number, progress: number) => {
    setCurrentModule(module);
    trackEvent('modules_screen__module__click', { id: module.id, index, progress });

    const progressEntry = progressModules?.find((m) => m.module_id === module.id);
    const slideId = progressEntry?.last_slide_id || undefined;

    router.push({
      pathname: '/module/[moduleId]',
      params: {
        moduleId: module.id,
        courseId: params.id,
        ...(slideId ? { slideId } : {}),
      },
    });
  };

  const handleRetry = () => {
    clearError();
    if (params.id) {
      fetchModulesByCourse(params.id);
    }
  };

  const renderModuleItem = ({ item, index }: { item: Module; index: number }) => {
    const progress = params.id ? getModuleProgress(params.id, item.id) : 0;
    const isCurrent = currentModule?.id === item.id;
    const isCompleted = progress >= 100;
    const isFirst = index === 0;
    const isLast = index === modules.length - 1;

    // Determine line colors based on progress
    let topLineColor = LINE_DEFAULT;
    if (!isFirst && params.id) {
      const prevModule = modules[index - 1];
      const prevProgress = getModuleProgress(params.id, prevModule.id);
      if (prevProgress >= 100) topLineColor = LINE_COMPLETED;
    }
    const bottomLineColor = isCompleted ? LINE_COMPLETED : LINE_DEFAULT;

    return (
      <Pressable
        className="relative p-4 mb-3 ml-7 rounded-xl bg-black/[0.03]"
        onPress={() => handleModulePress(item, index, progress)}
      >
        {/* Timeline Indicator */}
        <View className="absolute -left-7 top-0 bottom-0 w-6">
          <View className="flex-1 items-center">
            {/* Top Line */}
            <View
              className="w-0.5 flex-1 -mb-3 rounded-sm"
              style={{ backgroundColor: isFirst ? 'transparent' : topLineColor }}
            />

            {/* Dot */}
            <View className="h-6 justify-center items-center">
              {isCompleted ? (
                <View className="w-6 h-6 rounded-full bg-green-500 items-center justify-center">
                  <Text className="text-white text-[10px] font-bold">✓</Text>
                </View>
              ) : isCurrent ? (
                <View className="w-6 h-6 rounded-full bg-white border-[3px] border-black items-center justify-center">
                  <View className="w-2.5 h-2.5 rounded-full bg-black" />
                </View>
              ) : (
                <View className="w-6 h-6 rounded-full bg-white border-2 border-gray-300" />
              )}
            </View>

            {/* Bottom Line */}
            <View
              className="w-0.5 flex-1 -mb-3 rounded-sm"
              style={{ backgroundColor: isLast ? 'transparent' : bottomLineColor }}
            />
          </View>
        </View>

        {/* Module Content */}
        <Text className="text-base font-semibold text-gray-900 mb-1">{item.title}</Text>
        {item.description && <Text className="mt-2 text-gray-600 text-sm">{item.description}</Text>}

        {/* Lessons Badge */}
        <View
          className="absolute right-4 top-4 bg-blue-500 px-2.5 py-1 rounded-2xl"
          pointerEvents="none"
        >
          <Text className="text-white text-sm font-semibold">
            {`${lessonCounts[item.id] ?? 0} lessons`}
          </Text>
        </View>

        {/* Progress Bar */}
        {params.id && (
          <View className="mt-3 mb-1.5">
            <ProgressBar percent={progress} />
          </View>
        )}
      </Pressable>
    );
  };

  if (error) {
    return (
      <View className="flex-1 bg-background-light p-4">
        <View className="items-center p-5 mt-12">
          <Text className="text-red-500 text-center mb-2.5">Помилка: {error}</Text>
          <Text className="text-blue-500 text-center underline" onPress={handleRetry}>
            Спробувати знову
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-background-light p-4">
        <Text className="text-center text-gray-500 mt-12">Завантаження модулів...</Text>
      </View>
    );
  }

  if (modules.length === 0) {
    return (
      <View className="flex-1 bg-background-light p-4">
        <Text className="text-center text-gray-500 mt-12">Модулі не знайдено</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-light p-4">
      {currentCourse?.title && (
        <Text className="text-xl font-bold mb-4" numberOfLines={2} ellipsizeMode="tail">
          Курс "{currentCourse.title}"
        </Text>
      )}

      <FlatList
        data={modules}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderModuleItem}
      />
    </View>
  );
}
