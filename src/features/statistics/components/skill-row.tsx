import React from 'react';
import { View, Text } from 'react-native';
import type { Skill } from '../types';

interface Props {
  skill: Skill;
}

const SEGMENT_WIDTH = 25;

export const SkillRow: React.FC<Props> = ({ skill }) => {
  const score = Math.max(0, Math.min(5, skill.average_score));

  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="flex-1 text-gray-900 text-sm mr-3" numberOfLines={2} ellipsizeMode="tail">
        {skill.criterion_name}
      </Text>

      <View className="flex-col items-end">
        <Text className="w-14 text-right font-semibold mb-2">{`${score}/5`}</Text>

        <View className="flex-row items-center">
          {Array.from({ length: 5 }).map((_, i) => {
            const isFirst = i === 0;
            const isLast = i === 4;
            const rawFill = score - i;
            const fill = Math.max(0, Math.min(1, rawFill));

            return (
              <View
                key={i}
                className={`w-[25px] h-2 mr-2 bg-gray-200 overflow-hidden ${
                  isFirst ? 'rounded-l-full' : ''
                } ${isLast ? 'rounded-r-full mr-0' : ''}`}
              >
                {fill > 0 && (
                  <View
                    className={`h-full bg-[#5774CD] ${isFirst ? 'rounded-l-full' : ''} ${
                      isLast && fill === 1 ? 'rounded-r-full' : ''
                    }`}
                    style={{ width: SEGMENT_WIDTH * fill }}
                  />
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};
