import { Colors } from '@/src/constants/Colors';
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface ProgressBarProps {
  percent: number; // 0..100
  height?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percent, height = 8 }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <View style={styles.wrapper}>
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width: `${clamped}%` }]} />
      </View>

      <Text style={styles.label}>{clamped}%</Text>
    </View>
  );
};

export default ProgressBar;

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  track: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.green,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    color: '#0A0A0A',
  },
});
