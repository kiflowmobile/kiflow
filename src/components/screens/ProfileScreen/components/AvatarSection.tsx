import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import { Image } from '@/src/components/ui/image';
import { TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import LogOutIcon from '@/src/components/ui/LogOutIcon';
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
  email?: string;
  startedAt?: string | null;
  avatarUrl?: string;
  avatarSource?: any;
}

export default function AvatarSection({
  fullName,
  onEditPress,
  onSignOutPress,
  onSave,
  onCancel,
  editMode,
  updating = false,
  email,
  startedAt,
  avatarUrl,
  avatarSource,
}: AvatarSectionProps) {
  const initial = (fullName || '').trim().charAt(0).toUpperCase() || '?';

  const formatLongDate = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return null;
    }
  };

  const started = formatLongDate(startedAt || undefined);

  return (
    <View style={styles.container}>
      {/* Верхний баннер */}
      <ImageBackground
        source={require('@/src/assets/images/profile-bg.png')}
        style={styles.banner}
        imageStyle={styles.bannerImage}
      >
        {/* Иконка выхода в левом углу баннера */}
        <TouchableOpacity style={styles.logoutButton} onPress={onSignOutPress}>
          {/* делаю размер иконки равным 20, чтобы она ровно центровалась в круге 40x40 */}
          <LogOutIcon size={20} color={Colors.white} />
        </TouchableOpacity>
      </ImageBackground>

      {/* Аватар, перекрывающий баннер */}
      <View style={styles.avatarWrapper}>
        <View style={styles.largeAvatar}>
          {avatarSource ? (
            <Image source={avatarSource} style={styles.avatarImage} />
          ) : avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.initialText}>{initial}</Text>
          )}
        </View>
      </View>

      {/* Имя */}
      <View style={styles.infoRow}>
        <Text style={styles.fullName}>{fullName || ''}</Text>
      </View>

      {/* Почта */}
      {email ? <Text style={styles.email}>{email}</Text> : null}

      {/* Бейдж с датой */}
      {started ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🎉 Started on {started}</Text>
        </View>
      ) : null}

      {/* Кнопки редактирования / сохранения */}
      <View style={styles.actionsRow}>
        {editMode ? (
          <>
            <TouchableOpacity onPress={onCancel} disabled={updating} style={styles.iconAction}>
              <CloseIcon size={24} color={updating ? Colors.darkGray : Colors.black} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSave}
              disabled={updating}
              style={[styles.editButton, styles.saveButton]}
            >
              <Text style={styles.editButtonText}>Save</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={onEditPress} style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 8,
  },
  banner: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    position: 'relative',
    backgroundColor: Colors.blue,
    overflow: 'hidden',
  },
  logoutButton: {
    position: 'absolute',
    left: 16,
    top: 24,
    width: 40,
    height: 40,
    // borderRadius must be exactly half of width/height for a perfect circle
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  avatarWrapper: {
    marginTop: -60,
    alignItems: 'center',
  },
  largeAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.bg,
  },
  initialText: {
    fontSize: 40,
    color: Colors.black,
    fontWeight: '700',
  },
  infoRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  fullName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
  },
  email: {
    marginTop: 6,
    color: Colors.darkGray,
    fontSize: 14,
  },
  badge: {
    marginTop: 12,
    backgroundColor: Colors.pink,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    color: Colors.black,
    fontWeight: '600',
  },
  actionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: Colors.buttonBlue,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    marginLeft: 12,
  },
  editButtonText: {
    color: Colors.black,
    fontWeight: '700',
  },
  iconAction: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
  },
  bannerImage: {
    resizeMode: 'cover',
    width: '100%',
    height: '100%',
  },
});
