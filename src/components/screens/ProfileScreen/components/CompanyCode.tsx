import Button from '@/src/components/ui/button';
import { VStack } from '@/src/components/ui/vstack';
import { Colors } from '@/src/constants/Colors';
import { StyleSheet } from 'react-native';

interface CompanyCodeProps {
  onPress: () => void;
}

export default function CompanyCode({ onPress }: CompanyCodeProps) {
  return (
    <VStack space="md" style={styles.companyCodeSection}>
      <Button title="Код компанії" variant="secondary" onPress={onPress} size="lg" />
    </VStack>
  );
}

const styles = StyleSheet.create({
  companyCodeSection: {
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
});
