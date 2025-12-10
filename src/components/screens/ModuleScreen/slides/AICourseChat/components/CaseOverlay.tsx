import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

type Props = {
  visible: boolean;
};

const CaseOverlay: React.FC<Props> = ({ visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <ActivityIndicator size="large" color="#1f2937" />
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 60,
  },
  overlayText: {
    marginTop: 12,
    color: '#111827',
    fontSize: 14,
  },
});
