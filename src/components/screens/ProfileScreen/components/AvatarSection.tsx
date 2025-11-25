import React, { useState } from 'react';
import { View } from '@/src/components/ui/view';
import { Image } from '@/src/components/ui/image';
import { TouchableOpacity, StyleSheet, ImageBackground, Modal, Pressable,Text } from 'react-native';
import LogOutIcon from '@/src/components/ui/LogOutIcon';
import CloseIcon from '@/src/components/ui/CloseIcon';
import Button from '@/src/components/ui/button';
import { Colors } from '@/src/constants/Colors';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';

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
  onAvatarSecretTap?: () => void;
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
  onAvatarSecretTap,
}: AvatarSectionProps) {
  const [showConfirm, setShowConfirm] = useState(false);
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
        <TouchableOpacity style={styles.logoutButton} onPress={() => setShowConfirm(true)}>
          <LogOutIcon size={20} color={Colors.white} />
        </TouchableOpacity>
      </ImageBackground>

      {/* Аватар, перекрывающий баннер */}
      <Pressable style={styles.avatarWrapper} onPress={onAvatarSecretTap}>
        <View style={styles.largeAvatar}>
          {avatarSource ? (
            <Image source={avatarSource} style={styles.avatarImage} />
          ) : avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.initialText}>{initial}</Text>
          )}
        </View>
      </Pressable>

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
            <Button
              title="Edit"
              onPress={onEditPress}
              variant="accent"
              size="sm"
              style={styles.editButton}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Logout confirmation modal (pattern like existing skip modal) */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowConfirm(false)} />

          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Are you sure you want to logout?</Text>
            <Text style={styles.modalText}>
              You’ll need to log in again to continue learning the course.
            </Text>

            <View style={styles.modalButtonsRow}>
              <Button
                title="Cancel"
                variant="accent"
                size="lg"
                onPress={() => setShowConfirm(false)}
                style={styles.modalButton}
              />
              <Button
                title="Log out"
                variant="dark"
                size="lg"
                onPress={() => {
                  setShowConfirm(false);
                  onSignOutPress();
                }}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    ...TEXT_VARIANTS.title1,
  },
  email: {
    ...TEXT_VARIANTS.body2,
    marginTop: 6,
  },
  badge: {
    marginTop: 12,
    backgroundColor: Colors.pink,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    ...TEXT_VARIANTS.body2,
  },
  actionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    paddingHorizontal: 48,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    marginLeft: 12,
  },
  editButtonText: {},
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 760,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: Colors.darkGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    color: Colors.darkGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.buttonBlue,
    paddingVertical: 18,
    borderRadius: 12,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.black,
    fontWeight: '700',
    fontSize: 20,
  },
  logoutConfirmButton: {
    flex: 1,
    backgroundColor: Colors.black,
    paddingVertical: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutConfirmText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 6,
  },
});
