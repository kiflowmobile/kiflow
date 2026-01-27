import { CheckmarkIcon } from "@/components/icons/checkmark-icon";
import { CompassIcon } from "@/components/icons/compass-icon";
import { FaceFrownIcon } from "@/components/icons/face-frown-icon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getQuizResponse, upsertQuizResponse } from "@/lib/database";
import { Slide } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScrollableSlide } from "../context/ScrollableSlideContext";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../styles";

import { useLessonNavigation } from "../context/LessonNavigationContext";

interface QuizSlideProps {
  slide: Slide;
  onNext: () => void;
  isActive?: boolean;
}

type QuizSlideState = {
  selectedOption?: number;
  correctOptionIndex?: number;
  checked: boolean;
};

export function QuizSlide({ slide, onNext, isActive }: QuizSlideProps) {
  const { user } = useAuthStore();
  const { setAllowNext } = useLessonNavigation();
  const { handleScroll, handleContentSizeChange, handleLayout } = useScrollableSlide();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<QuizSlideState>({ checked: false });

  const content = slide.content as any;
  const { selectedOption, checked, correctOptionIndex } = state;

  useEffect(() => {
    const fetchQuizResponse = async () => {
      if (!user || !isActive) return;

      const response = await getQuizResponse(user.id, slide.id);
      if (response) {
        setState({
          selectedOption: response.selected_option_index,
          correctOptionIndex: content.correctAnswer ?? response.correct_option_index,
          checked: true,
        });
        setAllowNext(true);
      } else {
        setAllowNext(false);
      }
    };

    fetchQuizResponse();
  }, [user, slide.id, isActive, setAllowNext, content]);

  const handleCheck = async () => {
    if (selectedOption === undefined || !user) return;

    const correctOptionIndex = content.correctAnswer ?? content.correctOptionIndex ?? content.correct_idx;

    setState((prev) => ({ ...prev, correctOptionIndex: correctOptionIndex, checked: true }));
    setAllowNext(true);

    await upsertQuizResponse(user.id, slide.id, selectedOption, correctOptionIndex);
  };

  const getOptionClasses = (index: number) => {
    if (!checked) {
      return selectedOption === index ? "bg-[#CCD7F1] border-primary" : "bg-white border-neutral-200";
    }

    if (index === correctOptionIndex) {
      return "bg-[#CEF1CA] border-[#7CCF00]";
    }

    if (selectedOption === index && index !== correctOptionIndex) {
      return "bg-[#FFE1E1] border-[#FFA2A2]";
    }

    return "bg-white border-neutral-200";
  };

  return (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, paddingTop: insets.top + 56 }} className="bg-bg">
      <ScrollView
        className="flex-1 p-4"
        contentContainerClassName="pb-4"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        onLayout={(e) => handleLayout(e.nativeEvent.layout.height)}
        scrollEventThrottle={16}
        bounces={false}
      >
        <Label className="mt-3 mb-6 self-center">
          <CompassIcon width={16} height={16} />

          <Text className="text-caption font-semibold">Test</Text>
        </Label>

        <Text className="text-title-2 text-center mb-4 self-center">{content.question}</Text>

        <View className="gap-3">
          {content.options?.map((option: string, index: number) => (
            <TouchableOpacity
              key={index}
              className={cn("rounded-lg py-3 px-4 border", getOptionClasses(index))}
              onPress={() => !checked && setState({ ...state, selectedOption: index })}
              disabled={checked}
              activeOpacity={0.7}
            >
              <Text className="text-body-2">{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View className="mt-auto p-4">
        {checked && (
          <View className="flex-row items-center justify-center gap-2 mb-6">
            {correctOptionIndex === selectedOption ? (
              <CheckmarkIcon width={24} height={24} color="#FFFFFF" />
            ) : (
              <FaceFrownIcon width={24} height={24} color="#FFFFFF" />
            )}

            <Text
              className={cn("text-title-2", correctOptionIndex === selectedOption ? "text-[#5EA500]" : "text-text")}
            >
              {correctOptionIndex === selectedOption
                ? "Excellent! That's the right answer!"
                : "Not quite, but you're doing great!"}
            </Text>
          </View>
        )}

        <Button size="big" onPress={checked ? onNext : handleCheck} disabled={selectedOption === undefined}>
          {checked ? "Next" : "Check"}
        </Button>
      </View>
    </View>
  );
}
