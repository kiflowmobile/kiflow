import { ScrollView, Text, View } from "react-native";
import { useScrollableSlide } from "../context/ScrollableSlideContext";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../styles";

interface TextSlideProps {
  slide: {
    content?: {
      mainPoint?: string;
      tips?: string[];
      example?: string;
    };
  };
}

export function TextSlide({ slide }: TextSlideProps) {
  const { handleScroll, handleContentSizeChange, handleLayout } = useScrollableSlide();
  const content = slide.content;

  if (!content) {
    return null;
  }

  return (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} className="bg-bg px-4 pt-[56px]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        onLayout={(e) => handleLayout(e.nativeEvent.layout.height)}
        scrollEventThrottle={16}
        bounces={false}
      >
        <Text className="text-title-2 text-text mt-3">{content?.mainPoint || "Title"}</Text>

        {content.tips && content.tips.length > 0 && (
          <View className="gap-3 flex-col mt-3">
            {content.tips.map((tip: string, index: number) => {
              return (
                <View key={index} className="flex-row gap-3 pl-2">
                  <View className="w-1 h-1 bg-text rounded-full mt-[9px]"></View>

                  <Text className="text-body-2 flex-1">{tip}</Text>
                </View>
              );
            })}
          </View>
        )}

        {content.example && content.example.length > 0 && (
          <View className="mt-6 mb-6">
            <View className="bg-primary rounded-t-lg px-4 py-1.5 self-start">
              <Text className="title-3 text-white">Example</Text>
            </View>

            <View className="bg-white rounded-b-lg rounded-tr-lg p-4">
              <Text className="text-body-2 text-neutral">{content.example.replace(/\\n/g, "\n")}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
