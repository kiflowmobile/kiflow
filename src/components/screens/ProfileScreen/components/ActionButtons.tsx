import Button from '@/src/components/ui/button';
import { HStack } from '@/src/components/ui/hstack';
import { VStack } from '@/src/components/ui/vstack';
import { Colors } from '@/src/constants/Colors';
import { StyleSheet } from 'react-native';

interface ActionButtonsProps {
  editMode: boolean;
  updating: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export default function ActionButtons({
  editMode,
  updating,
  onSave,
  onCancel,
}: ActionButtonsProps) {
  return (
    <VStack space="md" style={styles.actionsSection}>
      {editMode && (
        <HStack space="md" style={styles.editModeButtons}>
          <Button
            title="Скасувати"
            variant="secondary"
            onPress={onCancel}
            disabled={updating}
            size="lg"
          />
          <Button
            title={updating ? "Збереження..." : "Зберегти"}
            variant="primary"
            onPress={onSave}
            disabled={updating}
            size="lg"
          />
        </HStack>
      )}
    </VStack>
  );
}

const styles = StyleSheet.create({
  actionsSection: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  editModeButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  actionButton: {
    flex: 1,

  },
  editButton: {
    alignSelf: 'stretch',
  },
});
