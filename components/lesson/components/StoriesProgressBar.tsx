import { cn } from "@/lib/utils";
import { View } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";

interface StoriesProgressBarProps {
  index: number;
  currentIndex: number;
  scrollY: SharedValue<number>;
  isDark: boolean;
}

export function StoriesProgressBar({
  index,
  currentIndex,
  isDark,
}: StoriesProgressBarProps) {
  // Calculate progress based on current index
  const progress = useDerivedValue(() => {
    if (index < currentIndex) {
      return withTiming(1, { duration: 200 });
    } else if (index > currentIndex) {
      return withTiming(0, { duration: 200 });
    } else {
      // Current slide - show as complete
      return withTiming(1, { duration: 200 });
    }
  }, [currentIndex]);

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
