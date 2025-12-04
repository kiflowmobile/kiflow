import React from 'react';
import { View as RNView, Text, StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/Colors';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';

interface Props {
  title: string;
}

const QuizBadge: React.FC<Props> = ({ title }) => {
  return (
    <RNView style={styles.badgeWrapper}>
      <RNView style={styles.badge}>
        <Text style={styles.badgeText}>{title}</Text>
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
