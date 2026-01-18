import { View } from 'react-native';

export function PaginationDots({ total, currentIndex }: { total: number; currentIndex: number }) {
  return (
    <View className="absolute right-0.5 top-1/2 -translate-y-1/2 justify-center items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`rounded-full ${
            i === currentIndex
              ? 'w-4 h-4 bg-black'
              : 'w-2.5 h-2.5 bg-gray-300'
          }`}
        />
      ))}
    </View>
  );
}

