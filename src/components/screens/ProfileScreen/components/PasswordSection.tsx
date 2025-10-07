import Button from '@/src/components/ui/button';
import { VStack } from '@/src/components/ui/vstack';
import { Colors } from '@/src/constants/Colors';
import { useAuthStore } from '@/src/stores/authStore';
import { useState } from 'react';
import { Alert, Platform, StyleSheet } from 'react-native';
import ProfileField from './ProfileField';

export default function PasswordSection() {
  const { changePassword } = useAuthStore();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      const message = 'Нові паролі не співпадають';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Помилка', message);
      }
      return;
    }

    if (passwordData.newPassword.length < 6) {
      const message = 'Новий пароль повинен містити принаймні 6 символів';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Помилка', message);
      }
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      // Очищаємо форму після успішної зміни
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordFields(false);

      const message = 'Пароль успішно змінено';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Успішно', message);
      }
    } catch (error: any) {
      const message = error.message || 'Не вдалося змінити пароль';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Помилка', message);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCancel = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowPasswordFields(false);
  };

  return (
    <VStack space="md" style={styles.passwordSection}>
      
      {!showPasswordFields ? (
        <Button
          title="Змінити пароль"
          onPress={() => setShowPasswordFields(true)}
          style={styles.changePasswordButton}
          textStyle={styles.buttonText}
        />
      ) : (
        <VStack space="md" style={styles.fieldsContainer}>
          <ProfileField
            label="Поточний пароль"
            value={passwordData.currentPassword}
            placeholder="Введіть поточний пароль"
            editMode={true}
            onValueChange={(value) => 
              setPasswordData(prev => ({ ...prev, currentPassword: value }))
            }
            inputProps={{ secureTextEntry: true }}
          />

          <ProfileField
            label="Новий пароль"
            value={passwordData.newPassword}
            placeholder="Введіть новий пароль"
            editMode={true}
            onValueChange={(value) => 
              setPasswordData(prev => ({ ...prev, newPassword: value }))
            }
            inputProps={{ secureTextEntry: true }}
          />

          <ProfileField
            label="Підтвердіть новий пароль"
            value={passwordData.confirmPassword}
            placeholder="Підтвердіть новий пароль"
            editMode={true}
            onValueChange={(value) => 
              setPasswordData(prev => ({ ...prev, confirmPassword: value }))
            }
            inputProps={{ secureTextEntry: true }}
          />

          <VStack space="sm" style={styles.buttonContainer}>
            <Button
              title={isChangingPassword ? 'Збереження...' : 'Зберегти новий пароль'}
              onPress={handleChangePassword}
              disabled={isChangingPassword}
              variant="success"
              style={styles.saveButton}
              textStyle={styles.saveButtonText}
            />

            <Button
              title="Скасувати"
              onPress={handleCancel}
              disabled={isChangingPassword}
              variant="secondary"
              style={styles.cancelButton}
              textStyle={styles.cancelButtonText}
            />
          </VStack>
        </VStack>
      )}
    </VStack>
  );
}

const styles = StyleSheet.create({
  passwordSection: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: 16,
  },
  changePasswordButton: {
    marginTop: 16,
  },
  buttonText: {
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 16,
  },
  fieldsContainer: {
    marginTop: 20,
  },
  saveButton: {
    marginBottom: 8,
  },
  saveButtonText: {
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 0,
  },
  cancelButtonText: {
    fontWeight: '600',
  },
});
