import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { joinCompanyByCode } from '../../../services/company';
import Button from '../../ui/button';
import { Input, InputField } from '../../ui/input';
import { getCurrentUserCode, updateCurrentUserProfile } from '../../../services/users';
import { useCourseStore } from '@/src/stores/courseStore';

export default function CourseCodeScreen() {
  const [courseCode, setCourseCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorAnimation] = useState(new Animated.Value(0));
  const router = useRouter();
  const fetchCourses = useCourseStore((state) => state.fetchCourses);

  useEffect(() => {
    const fetchCurrentCode = async () => {
      const { code } = await getCurrentUserCode();
      if (code) {
        setCourseCode(code);
      }
    };
    fetchCurrentCode();
  }, []);

  const showError = (message: string) => {
    setError(message);
    Animated.sequence([
      Animated.timing(errorAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideError = () => {
    Animated.timing(errorAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setError('');
    });
  };

  const handleConfirm = async () => {
    if (!courseCode.trim()) {
      showError('Будь ласка, введіть код курсу');
      return;
    }

    hideError();
    setLoading(true);

    try {
      const result = await joinCompanyByCode(courseCode.trim());

      if (result.success) {
        await fetchCourses(); // обновить курсы после успешного действия

        const message = result.alreadyMember
          ? `Ви вже є членом компанії "${result.company?.name}". Вам доступні курси цієї компанії.`
          : `Ви успішно приєдналися до компанії "${result.company?.name}". Тепер вам доступні курси цієї компанії.`;

        Alert.alert('Успіх!', message, [
          {
            text: 'OK',
            onPress: async () => {
              await fetchCourses();
              router.push('/home'); // заменено
            },
          },
        ]);

        setTimeout(async () => {
          await fetchCourses();
          router.push('/home'); // заменено
        }, 1000);
      } else {
        showError('Невірний код курсу. Перевірте правильність введення та спробуйте ще раз.');
      }
    } catch (error) {
      console.error('Error joining company:', error);
      showError(
        'Сталася помилка при приєднанні до компанії. Перевірте підключення до інтернету та спробуйте ще раз.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await updateCurrentUserProfile({ current_code: null });
      await fetchCourses(); // обновить курсы после пропуска
      router.push('/home'); // заменено
    } catch (err) {
      console.error('Error skipping company code:', err);
      showError('Сталася помилка при пропуску. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    setCourseCode(text);
    if (error) {
      hideError();
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.contentContainer}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>Введіть код</Text>
              <Text style={styles.subtitle}>
                Введіть код компанії, щоб отримати доступ до її курсів
              </Text>
            </View>

            <View style={styles.formSection}>
              <Input variant="outline" size="xl" style={[styles.input, error && styles.inputError]}>
                <InputField
                  placeholder="Код компанії"
                  value={courseCode}
                  onChangeText={handleTextChange}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleConfirm}
                />
              </Input>

              {/* Error Message */}
              {error && (
                <Animated.View
                  style={[
                    styles.errorContainer,
                    {
                      opacity: errorAnimation,
                      transform: [
                        {
                          translateY: errorAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-10, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.errorContent}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                </Animated.View>
              )}

              <Button
                title={loading ? 'Підтвердження...' : 'Підтвердити'}
                variant="primary"
                size="lg"
                onPress={handleConfirm}
                disabled={loading || !courseCode.trim()}
                style={styles.button}
              />
              <Button
                title="Пропустити"
                variant="secondary"
                size="lg"
                onPress={handleSkip}
                disabled={loading}
                style={styles.button}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '400',
  },
  formSection: {
    width: '100%',
    maxWidth: 400,
    gap: 24,
  },
  input: {
    marginBottom: 0,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  button: {
    marginTop: 0,
  },
  errorContainer: {
    marginTop: 8,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  errorIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  errorText: {
    flex: 1,
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
