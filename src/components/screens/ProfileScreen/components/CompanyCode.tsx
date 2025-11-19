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
      <Button title="Код компанії" variant="outline" onPress={onPress} size="lg" />
    </VStack>
  );
}

const styles = StyleSheet.create({
  companyCodeSection: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.darkGray,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
  },
});
