import { cn } from "@/lib/utils";
import React from "react";
import { Text, View } from "react-native";

export const AverageScoreBg = () => {
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0 }}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M25.5328 0.886709C34.1246 -2.84483 42.8448 5.87545 39.1133 14.4672L38.4963 15.8878C37.3571 18.5109 37.3571 21.4891 38.4963 24.1122L39.1133 25.5328C42.8448 34.1245 34.1245 42.8448 25.5328 39.1133L24.1122 38.4963C21.4891 37.3571 18.5109 37.3571 15.8878 38.4963L14.4672 39.1133C5.87545 42.8448 -2.84483 34.1245 0.886711 25.5328L1.50368 24.1122C2.64294 21.4891 2.64293 18.5109 1.50367 15.8878L0.886709 14.4672C-2.84483 5.87545 5.87546 -2.84483 14.4672 0.886711L15.8878 1.50367C18.5109 2.64294 21.4891 2.64293 24.1122 1.50367L25.5328 0.886709Z"
        fill="#B1C4FF"
      />
    </svg>
  );
};

interface AverageScoreProps {
  score: string | number;
  label?: string | null;
  variant?: "title1" | "title2";
  className?: string;
}

export const AverageScore = ({ score, label = "Average score", variant = "title2", className }: AverageScoreProps) => {
  return (
    <View className={cn("items-center gap-2", className)}>
      <View className="w-16 h-16 justify-center items-center relative">
        <AverageScoreBg />

        <Text className={cn(variant === "title1" ? "text-title-1" : "text-title-2")}>{score}</Text>
      </View>

      {label && <Text className="text-body-2 text-[#525252]">{label}</Text>}
    </View>
  );
};
