import { VStack } from '@/src/components/ui/vstack';
import { Colors } from '@/src/constants/Colors';
import type { User, UserUpdateData } from '@/src/constants/types/user';
import { StyleSheet } from 'react-native';
import ProfileField from './ProfileField';

interface UserInfoSectionProps {
  user: User | null;
  formData: UserUpdateData;
  editMode: boolean;
  onFormDataChange: (field: keyof UserUpdateData, value: string) => void;
}

export default function UserInfoSection({
  user,
  formData,
  editMode,
  onFormDataChange,
}: UserInfoSectionProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Не вказано';
    return new Date(dateString).toLocaleDateString('uk-UA');
  };

  return (
    <VStack space="md" style={styles.infoSection}>
      {editMode ? (
        <>
          <ProfileField
            label="First name"
            value={formData.first_name || ''}
            placeholder="Enter first name"
            editMode={editMode}
            onValueChange={(value) => onFormDataChange('first_name', value)}
          />
          <ProfileField
            label="Last name"
            value={formData.last_name || ''}
            placeholder="Enter last name"
            editMode={editMode}
            onValueChange={(value) => onFormDataChange('last_name', value)}
          />
        </>
      ) : (
        <ProfileField
          label="Fullname"
          value={`${user?.first_name || ''} ${user?.last_name || ''}`.trim()}
          placeholder="Enter fullname"
          editMode={false}
        />
      )}

      <ProfileField
        label="Email"
        value={user?.email || ''}
        editMode={false}
        readOnly={true}
      />

      <ProfileField
        label="Registration date"
        value={formatDate(user?.created_at || null)}
        editMode={false}
        readOnly={true}
      />
    </VStack>
  );
}

const styles = StyleSheet.create({
  infoSection: {
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
});
