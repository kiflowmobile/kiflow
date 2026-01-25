import { View } from "react-native";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SCREEN_HEIGHT } from "../styles";
import { cn } from "@/lib/utils";

interface StoriesProgressBarProps {
  index: number;
  currentIndex: number;
  scrollY: Animated.SharedValue<number>;
  isDark: boolean;
}

export function StoriesProgressBar({
  index,
  currentIndex,
  scrollY,
  isDark,
}: StoriesProgressBarProps) {
  const progress = useSharedValue(0);

  useAnimatedReaction(
    () => scrollY.value,
    (currentScroll) => {
      const slideStart = index * SCREEN_HEIGHT;
      if (index < currentIndex) progress.value = 1;
      else if (index > currentIndex) progress.value = 0;
      else {
        const p = (currentScroll - slideStart) / SCREEN_HEIGHT;
        progress.value = Math.max(0, Math.min(1, p));
      }
    },
  );

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View className="flex-1 h-[3px]">
      <View
        className={cn(
          "flex-1 rounded-full overflow-hidden",
          isDark ? "bg-white/20" : "bg-slate-900/10"
        )}
      >
        <Animated.View
          style={animatedStyle}
          className={cn(
            "h-full",
            isDark ? "bg-white" : "bg-slate-900"
          )}
        />
      </View>
    </View>
  );
}
