import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Button from '@/src/components/ui/button';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';
import { Colors } from '@/src/constants/Colors';

type Props = {
  caseState: 'idle' | 'analyzing' | 'result' | 'completed';
  isSubmitDisabled: boolean;
  loading: boolean;
  onSubmit: () => void;
  onTryAgain: () => void;
  onComplete: () => void;
  attemptsLeft?: number;
};

const CaseFooter: React.FC<Props> = ({
  caseState,
  isSubmitDisabled,
  loading,
  onSubmit,
  onTryAgain,
  onComplete,
  attemptsLeft = 3,
}) => {
  return (
    <View
      style={styles.fixedButtonContainer}
      pointerEvents={caseState === 'analyzing' ? 'none' : 'auto'}
    >
      {caseState === 'result' ? (
        <View style={styles.resultActions}>
          <Button
            title="Try again"
            onPress={onTryAgain}
            variant="accent"
            size="md"
            style={{ flex: 1, marginRight: 8 }}
            disabled={attemptsLeft <= 0}
          />

          <Button
            title="Complete"
            onPress={onComplete}
            variant="dark"
            size="md"
            style={{ flex: 1 }}
          />
        </View>
      ) : (
        <Button
          title="Submit answer"
          onPress={onSubmit}
          disabled={isSubmitDisabled}
          loading={loading}
          variant="dark"
          size="lg"
          accessibilityLabel="submit-answer"
          style={styles.submitButton}
          textStyle={
            isSubmitDisabled ? styles.submitButtonTextDisabled : styles.submitButtonTextActive
          }
        />
      )}
    </View>
  );
};

export default CaseFooter;

const styles = StyleSheet.create({
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    backgroundColor: Colors.bg,
    zIndex: 50,
  },
  submitButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonTextActive: {
    ...TEXT_VARIANTS.button,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  submitButtonTextDisabled: {
    ...TEXT_VARIANTS.button,
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
  resultActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
