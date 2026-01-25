import { cn } from "@/lib/utils";
import React from "react";
import { Text, View } from "react-native";

interface SkillRowProps {
  title: string;
  score: number;
}

const SkillRow = ({ title, score }: SkillRowProps) => {
  return (
    <View className="flex-row justify-between items-end gap-3">
      <Text className="flex-1 text-body-2 text-text">{title}</Text>

      <View className="w-[137px] items-end gap-3">
        <Text className="text-title-3">{score}/5</Text>
        <View className="flex-row gap-1 w-full">
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              className={cn(
                "flex-1 h-2",
                i <= score ? "bg-primary" : "bg-[#EBE9E9]",
                i === 1 && "rounded-l-sm",
                i === 5 && "rounded-r-sm"
              )}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

interface SkillsLevelProps {
  scores: { title: string; score: number }[];
  title?: string;
}

export const SkillsLevel = ({ scores, title = "Skills level" }: SkillsLevelProps) => {
  if (scores.length === 0) return null;

  return (
    <View className="gap-3">
      {title && <Text className="text-title-3 mb-1">{title}</Text>}

      {scores.map((score) => {
        return <SkillRow key={score.title} title={score.title} score={score.score} />;
      })}
    </View>
  );
};
