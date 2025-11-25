import { View } from '@/src/components/ui/view';
import { TouchableOpacity, StyleSheet,Text } from 'react-native';
import { Colors } from '@/src/constants/Colors';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';

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
    ...TEXT_VARIANTS.title2,
    marginBottom: 8,
  },
  description: {
...TEXT_VARIANTS.body2,
    marginBottom: 12,
  },
  link: {
    fontSize: 16,
    fontFamily: 'RobotoCondensed',
    color: Colors.blue,
    fontWeight: '500',
  },
});
