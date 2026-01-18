import { Icon } from '@/shared/ui';
import { AlertCircle, CheckCircle } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

export interface ContentWithExampleProps {
  title: string;
  mainPoint: string;
  tips: string[];
  example: string;
}

const ContentWithExample: React.FC<ContentWithExampleProps> = ({
  title,
  mainPoint,
  tips,
  example,
}) => {
  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 bg-surface">
          <Icon as={AlertCircle} size={44} color="#111" className="mb-0" />
          <Text className="text-xl font-bold text-center mb-2 text-black">{title}</Text>

          <View className="rounded-lg p-3 bg-black/5">
            <Text className="text-base text-black leading-5">{mainPoint}</Text>
          </View>

          <View className="rounded-lg p-3">
            {tips.map((tip, index) => (
              <View key={index} className="flex-row items-start mb-2">
                <Icon as={CheckCircle} size={20} color="#111" className="mt-0.5" />
                <Text className="flex-1 flex-shrink ml-2 text-base text-black leading-5">{tip}</Text>
              </View>
            ))}
          </View>

          <View className="rounded-lg p-3 bg-black/3">
            <View className="flex-row items-center mb-1">
              <Icon as={AlertCircle} size={20} color="#111" />
              <Text className="text-base font-semibold ml-1.5 text-black">Приклад</Text>
            </View>
            <Text className="text-base italic text-black leading-[22px]">{example}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ContentWithExample;
