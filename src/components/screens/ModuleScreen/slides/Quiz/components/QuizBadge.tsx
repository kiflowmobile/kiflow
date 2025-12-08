import React from 'react';
import { View as RNView, Text, StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/Colors';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';
import TestSvg from '@/src/assets/images/test-icon.svg';



const QuizBadge: React.FC = () => {
  return (
    <RNView style={styles.badgeWrapper}>
      <RNView style={styles.badge}>
        <TestSvg width={16} height={16} />
        <Text style={styles.badgeText}>Test</Text>
      </RNView>
    </RNView>
  );
};

const styles = StyleSheet.create({
  badgeWrapper: {
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFD988',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeText: {
    ...TEXT_VARIANTS.body2,
    fontWeight: '700',
    color: Colors.black,
  },
});

export default QuizBadge;
