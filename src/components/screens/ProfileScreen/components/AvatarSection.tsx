import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import { TouchableOpacity, StyleSheet } from 'react-native';
import LogOutIcon from '@/src/components/ui/LogOutIcon';
import EditIcon from '@/src/components/ui/EditIcon';
import CheckIcon from '@/src/components/ui/CheckIcon';
import CloseIcon from '@/src/components/ui/CloseIcon';
import { Colors } from '@/src/constants/Colors';

interface AvatarSectionProps {
  fullName?: string;
  onEditPress: () => void;
  onSignOutPress: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  editMode: boolean;
  updating?: boolean;
}

export default function AvatarSection({ 
  fullName, 
  onEditPress, 
  onSignOutPress, 
  onSave, 
  onCancel, 
  editMode,
  updating = false
}: AvatarSectionProps) {
  const initial = (fullName || '').trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={styles.largeAvatarSection}>
      <View style={styles.iconsContainer}>
        {editMode ? (
          <>
            <TouchableOpacity onPress={onCancel} disabled={updating}>
              <CloseIcon size={32} color={updating ? Colors.darkGray : '#000000'} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={onSave} disabled={updating}>
              <CheckIcon size={32} color={updating ? Colors.darkGray : '#000000'} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={onSignOutPress}>
              <LogOutIcon size={32} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={onEditPress}>
              <EditIcon size={32} />
            </TouchableOpacity>
          </>
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
    borderColor: Colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  
});
