import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import { TouchableOpacity, StyleSheet } from 'react-native';
import LogOutIcon from '@/src/components/ui/LogOutIcon';
import EditIcon from '@/src/components/ui/EditIcon';
import { Colors } from '@/src/constants/Colors';

interface AvatarSectionProps {
  fullName?: string;
  onEditPress: () => void;
  onSignOutPress: () => void;
  editMode: boolean;
}

export default function AvatarSection({ fullName, onEditPress, onSignOutPress, editMode }: AvatarSectionProps) {
  const initial = (fullName || '').trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={styles.largeAvatarSection}>
      {/* Контейнер для иконок над аватаром */}
      <View style={styles.iconsContainer}>
        {/* Иконка выхода слева */}
        <TouchableOpacity onPress={onSignOutPress}>
          <LogOutIcon size={32} />
        </TouchableOpacity>
        
        {/* Иконка редактирования справа */}
        { (
          <TouchableOpacity onPress={onEditPress}>
            <EditIcon size={32} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Аватар */}
      <View style={styles.largeAvatar}>
        <Text style={styles.initialText}>{initial}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  largeAvatarSection: {
    alignItems: 'center',
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
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
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
