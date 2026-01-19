import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
  Modal,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input } from '@/shared/ui';
import { companyApi } from '@/features/company';
import { profileApi } from '@/features/profile';
import { useCourses } from '../hooks/useCourses';
import { useAuth } from '@/features/auth';
import { useAnalytics } from '@/features/analytics';

export function CourseCodeScreen() {
  const [courseCode, setCourseCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorAnimation] = useState(new Animated.Value(0));
  const [isSkipModalVisible, setIsSkipModalVisible] = useState(false);

  const router = useRouter();
  const { fetchCourses } = useCourses();
  const { setJustSignedUp } = useAuth();
  const analytics = useAnalytics();

  useEffect(() => {
    const fetchCurrentCode = async () => {
      try {
        const { code } = await profileApi.getCurrentUserCode();
        if (code) {
          setCourseCode(code);
        }
      } catch (e) {
        console.error('Error fetching current code:', e);
      }
    };
    fetchCurrentCode();
  }, []);

  const showError = (message: string) => {
    setError(message);
    Animated.timing(errorAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
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

  const isCodeValid = useMemo(() => {
    return !!courseCode.trim() && !error;
  }, [courseCode, error]);

  const renderValidIcon = () =>
    isCodeValid ? (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M20 6L9 17L4 12"
          stroke="#22C55E"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ) : null;

  const handleConfirm = async () => {
    analytics.trackEvent('company_screen__submit__click');

    const trimmed = courseCode.trim();

    if (!trimmed) {
      showError('Будь ласка, введіть код курсу');
      return;
    }

    hideError();
    setLoading(true);

    try {
      const result = await companyApi.joinCompanyByCode(trimmed);

      if (result.success) {
        await fetchCourses();
        router.push('/courses');
      } else {
        const message = result.error instanceof Error ? result.error.message : String(result.error);
        showError(
          message || 'Невірний код курсу. Перевірте правильність введення та спробуйте ще раз.',
        );
      }
    } catch (error) {
      console.error('Error joining company:', error);
      showError(
        'Сталася помилка при приєднанні до компанії. Перевірте підключення до інтернету та спробуйте ще раз.',
      );
    } finally {
      setJustSignedUp(false);
      await AsyncStorage.removeItem('justSignedUp');
      setLoading(false);
    }
  };

  /** Открыть модалку при нажатии на "Пропустити" */
  const handleSkipPress = () => {
    analytics.trackEvent('company_screen__skip__click');
    setIsSkipModalVisible(true);
  };

  /** Реальный skip (как было раньше) */
  const handleSkipConfirm = async () => {
    analytics.trackEvent('company_screen__skip_confirm__click');

    setLoading(true);
    try {
      await fetchCourses();
      router.push('/courses');
    } catch (err) {
      console.error('Error skipping company code:', err);
      showError('Сталася помилка при пропуску. Спробуйте ще раз.');
    } finally {
      setJustSignedUp(false);
      setLoading(false);
      setIsSkipModalVisible(false);
    }
  };

  const handleSkipCancel = () => {
    analytics.trackEvent('company_screen__skip_cancel__click');
    setIsSkipModalVisible(false);
  };

  const handleTextChange = (text: string) => {
    setCourseCode(text);
    if (error) {
      hideError();
    }
  };

  useEffect(() => {
    analytics.trackEvent('company_screen__load');
  }, []);

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 justify-center items-center px-8">
            <View className="items-center mb-10">
              <Text className="text-3xl font-bold text-center mb-2 text-black">Enter the code</Text>
              <Text className="text-base text-gray-500 text-center font-normal">
                Add the company code to get acces to the courses
              </Text>
            </View>

            <View className="w-full max-w-[400px] gap-6">
              <View className="w-full">
                <Input
                  value={courseCode}
                  onChangeText={handleTextChange}
                  renderCustomPlaceholder={() => (
                    <Text className="text-sm text-[#a1a1a1]">Enter the code</Text>
                  )}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleConfirm}
                  containerStyle={{ marginBottom: 0, borderColor: error ? '#ef4444' : '#E0E0E0' }}
                  isInvalid={!!error}
                  rightIcon={renderValidIcon()}
                />
              </View>

              {error && (
                <Animated.View
                  style={{
                    marginTop: 8,
                    opacity: errorAnimation,
                    transform: [
                      {
                        translateY: errorAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-10, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <View className="flex-row items-start bg-red-50 border border-red-200 rounded-lg p-3 gap-2">
                    <Text className="text-base mt-[1px]">⚠️</Text>
                    <Text className="flex-1 text-red-600 text-sm font-medium leading-5">
                      {error}
                    </Text>
                  </View>
                </Animated.View>
              )}

              <View className="mt-0 w-full">
                <Button
                  title={'Confirm'}
                  variant="dark"
                  size="lg"
                  onPress={handleConfirm}
                  disabled={loading || !courseCode.trim()}
                  style={{ width: '100%' }}
                />
              </View>

              <Pressable onPress={handleSkipPress} disabled={loading} hitSlop={10}>
                <Text className="mt-4 text-lg text-center font-semibold text-black">Skip</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Modal
        visible={isSkipModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleSkipCancel}
      >
        <View className="flex-1 bg-slate-900/50 px-4 justify-end">
          <Pressable className="absolute inset-0" onPress={handleSkipCancel} />

          <View className="w-full mb-10 bg-white rounded-3xl px-6 py-6">
            <Text className="text-xl text-center font-bold mb-3 text-black">
              Are you sure you want to skip?
            </Text>
            <Text className="text-base text-gray-600 text-center mb-6 font-normal">
              If you continue without entering your company code, you’ll only see the public
              courses.
            </Text>

            <View className="flex-row w-full gap-4">
              <View className="flex-1">
                <Button
                  title="Enter code"
                  variant="accent"
                  size="lg"
                  onPress={handleSkipCancel}
                  style={{ width: '100%' }}
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Skip"
                  variant="dark"
                  size="lg"
                  onPress={handleSkipConfirm}
                  style={{ width: '100%' }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
