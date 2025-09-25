import React, { useEffect, useRef, useState } from "react";
import { Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

export default function Dropdown({ label, items, selected, onSelect, disabled }: DropdownProps) {
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
  }, [isOpen, items.length]);

  const handleSelect = (item: string) => {
    if (onSelect) onSelect(item);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.dropdownButton, disabled && styles.disabled]}
        onPress={() => !disabled && setIsOpen(!isOpen)}
      >
        <Text style={styles.buttonText}>{selected || label}</Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.dropdownList,
          { maxHeight: animatedHeight, opacity: animatedOpacity },
        ]}
      >
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.dropdownItem}
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

const styles = StyleSheet.create({
  container: { marginVertical: 10, zIndex: 1000 },
  dropdownButton: {
    padding: 12,
    backgroundColor: "#eee",
    borderRadius: 6,
  },
  disabled: {
    backgroundColor: "#ddd",
  },
  buttonText: { fontSize: 16 },
  dropdownList: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    zIndex: 1000,
    elevation: 5,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
});