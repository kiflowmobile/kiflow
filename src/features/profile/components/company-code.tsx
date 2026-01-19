import { View } from '@/shared/ui';
import { Text, TouchableOpacity } from 'react-native';

interface CompanyCodeProps {
  onPress: () => void;
}

export function CompanyCode({ onPress }: CompanyCodeProps) {
  return (
    <View className="rounded-lg border border-[#E7E7E7] bg-surface p-4">
      <Text className="mb-2 text-lg font-semibold text-black">Access</Text>
      <Text className="mb-3 text-sm text-gray-400">
        You are viewing public courses only. Switch to company courses tailored for your team.
      </Text>

      <TouchableOpacity onPress={onPress}>
        <Text className="text-base font-primary text-primary">Switch to company courses</Text>
      </TouchableOpacity>
    </View>
  );
}
