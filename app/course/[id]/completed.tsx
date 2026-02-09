import { CheckmarkIcon } from '@/components/icons/checkmark-icon';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { sendCourseCompletionEmail } from '@/lib/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WavyCheckmark = () => (
  <View className="w-[148px] h-[146px] mb-8 relative justify-center items-center">
    <svg
      className="absolute inset-0"
      width="148"
      height="146"
      viewBox="0 0 148 146"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M57.9337 6.10363C58.7316 5.453 59.1305 5.12769 59.4947 4.85304C68.0753 -1.61768 79.9247 -1.61768 88.5053 4.85304C88.8695 5.12769 89.2684 5.453 90.0663 6.10363C90.4225 6.39407 90.6006 6.53929 90.7767 6.67753C94.8148 9.84692 99.7657 11.643 104.903 11.8021C105.127 11.8091 105.357 11.8119 105.817 11.8176C106.848 11.8304 107.364 11.8368 107.82 11.8597C118.566 12.4002 127.643 19.9918 130.043 30.446C130.145 30.8897 130.241 31.3945 130.432 32.4041C130.518 32.8548 130.561 33.0801 130.606 33.2988C131.656 38.3138 134.29 42.8616 138.123 46.2748C138.29 46.4237 138.464 46.5733 138.813 46.8725C139.595 47.5427 139.985 47.8778 140.32 48.1876C148.203 55.4863 150.261 67.1173 145.358 76.6633C145.149 77.0685 144.897 77.5166 144.393 78.4128C144.168 78.8128 144.055 79.0128 143.949 79.2097C141.519 83.7237 140.604 88.8952 141.339 93.9654C141.371 94.1866 141.408 94.4129 141.482 94.8656C141.649 95.8796 141.732 96.3866 141.788 96.8383C143.12 107.48 137.196 117.708 127.283 121.879C126.862 122.057 126.38 122.238 125.416 122.602C124.986 122.764 124.77 122.845 124.562 122.928C119.789 124.829 115.753 128.204 113.046 132.559C112.928 132.749 112.811 132.946 112.576 133.34C112.049 134.224 111.786 134.666 111.538 135.048C105.695 144.053 94.5605 148.093 84.2769 144.937C83.8405 144.803 83.3539 144.634 82.3809 144.294C81.9466 144.143 81.7294 144.067 81.5164 143.997C76.6343 142.395 71.3657 142.395 66.4836 143.997C66.2706 144.067 66.0534 144.143 65.6191 144.294C64.6461 144.634 64.1596 144.803 63.7231 144.937C53.4395 148.093 42.3047 144.053 36.462 135.048C36.214 134.666 35.9508 134.224 35.4243 133.34C35.1893 132.946 35.0717 132.749 34.9537 132.559C32.2467 128.204 28.2107 124.829 23.4378 122.928C23.2296 122.845 23.0144 122.764 22.584 122.602C21.6197 122.238 21.1376 122.057 20.7169 121.879C10.8042 117.708 4.87951 107.48 6.21155 96.8383C6.26809 96.3866 6.35128 95.8796 6.51766 94.8656C6.59193 94.4129 6.62907 94.1866 6.66112 93.9654C7.39592 88.8952 6.48103 83.7237 4.05069 79.2097C3.94468 79.0128 3.83212 78.8128 3.607 78.4128C3.10269 77.5166 2.85053 77.0685 2.64241 76.6633C-2.26106 67.1173 -0.203429 55.4863 7.68004 48.1876C8.01465 47.8778 8.40536 47.5427 9.18677 46.8725C9.53559 46.5733 9.71 46.4237 9.87718 46.2748C13.7099 42.8616 16.3442 38.3138 17.3936 33.2989C17.4394 33.0801 17.4822 32.8548 17.5677 32.4041C17.7593 31.3945 17.8551 30.8897 17.957 30.446C20.357 19.9918 29.4342 12.4002 40.1804 11.8597C40.6365 11.8368 41.1519 11.8304 42.1827 11.8176C42.6429 11.8119 42.8729 11.8091 43.097 11.8021C48.2343 11.643 53.1852 9.84692 57.2233 6.67753C57.3994 6.53929 57.5775 6.39407 57.9337 6.10363Z"
        fill="#5EA500"
      />
    </svg>

    <CheckmarkIcon width={45} height={45} stroke="#FFFFFF" className="z-10" />
  </View>
);

export default function CourseCompletedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id: courseId } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (courseId) {
      sendCourseCompletionEmail(courseId).catch((err) => {
        console.error('Failed to send completion email:', err);
      });
    }
  }, [courseId]);

  const handleReviewResults = () => {
    if (courseId) {
      router.push({
        pathname: '/course/[id]/progress',
        params: { id: courseId, fromCompleted: 'true' },
      });
    } else {
      router.replace('/(tabs)/courses');
    }
  };

  return (
    <View className="flex-1 bg-bg">
      <View style={{ paddingTop: insets.top + 16 }} className="px-4">
        <TouchableOpacity
          onPress={() => router.replace(`/course/${courseId}`)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <IconSymbol name="xmark" size={24} color="#0A0A0A" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center items-center px-4">
        <WavyCheckmark />

        <Text className="text-title-1 text-center mb-4">
          Congratulations!{'\n'}You’ve completed the course!
        </Text>

        <Text className="text-body-1 text-[#525252] text-center">
          Review your results and explore the skills you’ve built.
        </Text>
      </View>

      <View
        style={{
          paddingBottom: insets.bottom + 16,
          paddingLeft: 16,
          paddingRight: 16,
        }}
        className="mt-auto"
      >
        <Button onPress={handleReviewResults}>Review results</Button>
      </View>
    </View>
  );
}
