import { Colors } from '@/src/constants/Colors';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

type Props = {
  visible: boolean;
};

const CaseOverlay: React.FC<Props> = ({ visible }) => {
  const dot1TranslateY = useRef(new Animated.Value(0)).current;
  const dot2TranslateY = useRef(new Animated.Value(0)).current;
  const dot3TranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      // Сбрасываем анимацию когда overlay скрыт
      dot1TranslateY.setValue(0);
      dot2TranslateY.setValue(0);
      dot3TranslateY.setValue(0);
      return;
    }

    // Амплитуда движения точек вверх-вниз (в пикселях)
    const amplitude = 6;

    // Создаем последовательную анимацию движения вверх-вниз для трех точек
    const createBounceAnimation = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -amplitude,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createBounceAnimation(dot1TranslateY, 0);
    const anim2 = createBounceAnimation(dot2TranslateY, 150);
    const anim3 = createBounceAnimation(dot3TranslateY, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [visible, dot1TranslateY, dot2TranslateY, dot3TranslateY]);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <View style={styles.dotsContainer}>
        <Animated.View 
          style={[
            styles.dot, 
            { transform: [{ translateY: dot1TranslateY }] }
          ]} 
        />
        <Animated.View 
          style={[
            styles.dot, 
            { transform: [{ translateY: dot2TranslateY }] }
          ]} 
        />
        <Animated.View 
          style={[
            styles.dot, 
            { transform: [{ translateY: dot3TranslateY }] }
          ]} 
        />
      </View>
      <Text style={styles.overlayText}>Analysing your answer</Text>
    </View>
  );
};

export default CaseOverlay;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
    zIndex: 60,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
  },
  overlayText: {
    marginTop: 12,
    color: '#111827',
    fontSize: 14,
  },
});
