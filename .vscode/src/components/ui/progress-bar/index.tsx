import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ProgressBarProps {
  percent: number; // 0..100
  height?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percent, height = 8 }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <View style={[styles.container, { height }]}> 
      <View style={[styles.fill, { width: `${clamped}%` }]} />
    </View>
  );
};

export default ProgressBar;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#026b1e',
  },
});


