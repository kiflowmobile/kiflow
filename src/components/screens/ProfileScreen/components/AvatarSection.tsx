import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import { StyleSheet } from 'react-native';

interface AvatarSectionProps {
  fullName?: string;
}

export default function AvatarSection({ fullName }: AvatarSectionProps) {
  const initial = (fullName || '').trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={styles.largeAvatarSection}>
      <View style={styles.largeAvatar}>
        <Text style={styles.initialText}>{initial}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  largeAvatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  largeAvatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    fontSize: 64,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});
