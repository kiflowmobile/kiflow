import { cn } from "@/lib/utils";
import { Text, View } from "react-native";

export const ProgressBar = ({ progress, className }: { progress: number; className?: string }) => {
  return (
    <View className={cn("flex-row items-center gap-3", className)}>
      <View className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
        <View className="h-full bg-[#65A30D] rounded-full" style={{ width: `${progress}%` }} />
      </View>

      <Text className="text-body-2">{progress}%</Text>
    </View>
  );
};
