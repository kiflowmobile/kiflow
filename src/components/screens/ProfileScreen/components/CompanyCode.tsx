import { View } from '@/src/components/ui/view';
import { Text } from '@/src/components/ui/text';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/Colors';

interface CompanyCodeProps {
  onPress: () => void;
}

export default function CompanyCode({ onPress }: CompanyCodeProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Access</Text>
      <Text style={styles.description}>
        You are viewing public courses only. Switch to company courses tailored for your team.
      </Text>

      <TouchableOpacity onPress={onPress}>
        <Text style={styles.link}>Switch to company courses</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E7E7E7',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.darkGray,
    marginBottom: 12,
  },
  link: {
    fontSize: 14,
    color: Colors.blue,
    fontWeight: '600',
  },
});
