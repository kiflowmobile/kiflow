import React, { memo } from 'react';
import { Platform, Text, View } from 'react-native';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';

interface SkillsChartProps {
  skills: any[];
  average?: number | null;
}

export const SkillsChart: React.FC<SkillsChartProps> = ({ skills, average }) => {
  if (average === null) {
    return (
      <Text className="text-base text-gray-400 text-center mt-5 italic">
        😔 Ви ще не маєте оцінок
      </Text>
    );
  }

  return (
    <View className="bg-gray-100 rounded-2xl p-4 mt-4">
      <Text className="text-lg font-semibold text-black mb-3">Порівняння навичок</Text>

      {Platform.OS === 'web' ? (
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={skills}>
            <PolarGrid />
            <PolarAngleAxis dataKey="criterion_name" />
            <PolarRadiusAxis angle={30} domain={[0, 5]} />
            <Radar
              name="Оцінка"
              dataKey="average_score"
              stroke="#7c3aed"
              fill="#7c3aed"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <Text className="text-gray-500 text-center">📊 Графік доступний лише у веб-версії</Text>
      )}
    </View>
  );
};
