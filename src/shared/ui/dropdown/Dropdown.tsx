import React, { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Text, TouchableOpacity, View } from 'react-native';
import clsx from 'clsx';

type DropdownItemType = {
  id: string;
  name: string;
};

type DropdownProps = {
  label: string;
  items: DropdownItemType[];
  selected?: string | null;
  onSelect?: (item: string) => void;
  disabled?: boolean;
};

export function Dropdown({ label, items, selected, onSelect, disabled }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 🔑 анімація висоти і прозорості
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(animatedHeight, {
          toValue: items.length * 50, // висота залежить від кількості елементів
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(animatedHeight, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, items.length, animatedHeight, animatedOpacity]);

  const handleSelect = (item: string) => {
    if (onSelect) onSelect(item);
    setIsOpen(false);
  };

  return (
    <View className="my-2.5 z-[1000]">
      <TouchableOpacity
        className={clsx('p-3 bg-gray-200 rounded-md', disabled && 'bg-gray-300')}
        onPress={() => !disabled && setIsOpen(!isOpen)}
      >
        {/* Показываем имя выбранного элемента (если есть), иначе лейбл */}
        <Text className="text-base">{items.find((i) => i.id === selected)?.name ?? label}</Text>
      </TouchableOpacity>

      <Animated.View
        className="absolute top-[50px] left-0 right-0 overflow-hidden bg-surface border border-gray-300 rounded-md z-[1000]"
        style={{ maxHeight: animatedHeight, opacity: animatedOpacity, elevation: 5 }}
      >
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="p-3 border-b border-gray-300"
              onPress={() => handleSelect(item.id)}
            >
              <Text>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </Animated.View>
    </View>
  );
}
