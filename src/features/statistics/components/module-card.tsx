import React from 'react';
import { View, Text } from 'react-native';
import { SkillRow } from './skill-row';
import type { Skill } from '@/features/statistics';

interface Props {
  module: { id: string; title: string };
  skills: Skill[];
  loadingSkills: boolean;
  percent: number;
  completedSlides: number;
  totalSlides: number;
}

export const ModuleCard: React.FC<Props> = ({
  module,
  skills,
  loadingSkills,
  percent,
  completedSlides,
  totalSlides,
}) => {
  const status = percent >= 100 ? 'Completed' : percent > 0 ? 'In progress' : 'Not started';
  const hasStarted = status !== 'Not started';

  const badgeColor =
    status === 'Completed'
      ? 'bg-green-500'
      : status === 'In progress'
        ? 'bg-orange-500'
        : 'bg-gray-400';

  return (
    <View className="bg-white rounded-2xl p-4 mb-4">
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="text-base font-semibold mb-2">{module.title}</Text>
          <Text className="text-gray-400 text-sm">{`${completedSlides}/${totalSlides || 0} lessons`}</Text>
        </View>
        <View className="justify-center items-end">
          <Text className={`px-2.5 py-1.5 rounded-xl text-white text-xs font-bold ${badgeColor}`}>
            {status}
          </Text>
        </View>
      </View>

      {hasStarted && (
        <>
          <View className="h-px bg-gray-100 my-3" />

          <Text className="text-sm font-bold mb-2">Skills level</Text>

          {loadingSkills ? (
            <Text className="text-slate-500 text-center mt-4">Loading skills...</Text>
          ) : skills?.length ? (
            skills.map((s) => <SkillRow key={s.criterion_id} skill={s} />)
          ) : (
            <Text className="text-slate-500 text-center mt-4">No data available</Text>
          )}
        </>
      )}
    </View>
  );
};
