import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableWithoutFeedback,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';

import Button from '../../ui/button';
import Input from '../../ui/input';
import { joinCompanyByCode } from '../../../services/company';
import { getCurrentUserCode } from '../../../services/users';
import { useCourseStore } from '@/src/stores/courseStore';
import { useAuthStore } from '@/src/stores';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';
import { Colors } from '@/src/constants/Colors';

export default function CourseCodeScreen() {
  const [courseCode, setCourseCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorAnimation] = useState(new Animated.Value(0));
  const [isSkipModalVisible, setIsSkipModalVisible] = useState(false);

  const router = useRouter();
  const fetchCourses = useCourseStore((state) => state.fetchCourses);
  const analyticsStore = useAnalyticsStore.getState();

  useEffect(() => {
    const fetchCurrentCode = async () => {
      try {
        const { code } = await getCurrentUserCode();
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
    analyticsStore.trackEvent('company_screen__submit__click');

    const trimmed = courseCode.trim();

    if (!trimmed) {
      showError('Будь ласка, введіть код курсу');
      return;
    }

    hideError();
    setLoading(true);

    try {
      const result = await joinCompanyByCode(trimmed);

      if (result.success) {
        await fetchCourses();
        router.push('/courses');
      } else {
        showError('Невірний код курсу. Перевірте правильність введення та спробуйте ще раз.');
      }
    } catch (error) {
      console.error('Error joining company:', error);
      showError(
        'Сталася помилка при приєднанні до компанії. Перевірте підключення до інтернету та спробуйте ще раз.',
      );
    } finally {
      useAuthStore.setState({ justSignedUp: false });
      await AsyncStorage.removeItem('justSignedUp');
      setLoading(false);
    }
  };

  /** Открыть модалку при нажатии на "Пропустити" */
  const handleSkipPress = () => {
    analyticsStore.trackEvent('company_screen__skip__click');
    setIsSkipModalVisible(true);
  };

  /** Реальный skip (как было раньше) */
  const handleSkipConfirm = async () => {
    analyticsStore.trackEvent('company_screen__skip_confirm__click');

    setLoading(true);
    try {
      await fetchCourses();
      router.push('/courses');
    } catch (err) {
      console.error('Error skipping company code:', err);
      showError('Сталася помилка при пропуску. Спробуйте ще раз.');
    } finally {
      useAuthStore.setState({ justSignedUp: false });
      setLoading(false);
      setIsSkipModalVisible(false);
    }
  };

  const handleSkipCancel = () => {
    analyticsStore.trackEvent('company_screen__skip_cancel__click');
    setIsSkipModalVisible(false);
  };

  const handleTextChange = (text: string) => {
    setCourseCode(text);
    if (error) {
      hideError();
    }
  };

  useEffect(() => {
    analyticsStore.trackEvent('company_screen__load');
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.contentContainer}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>Enter the code</Text>
              <Text style={styles.subtitle}>Add the company code to get acces to the courses</Text>
            </View>

            <View style={styles.formSection}>
              <Input
                value={courseCode}
                onChangeText={handleTextChange}
                renderCustomPlaceholder={() => (
                  <Text
                    style={{
                      ...TEXT_VARIANTS.placeholder,
                      color: '#a1a1a1',
                    }}
                  >
                    Enter the code
                  </Text>
                )}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleConfirm}
                containerStyle={[styles.input, error && styles.inputError]}
                isInvalid={!!error}
                rightIcon={renderValidIcon()}
              />

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
                title={'Confirm'}
                variant="dark"
                size="lg"
                onPress={handleConfirm}
                disabled={loading || !courseCode.trim()}
                style={styles.button}
              />
              <Pressable onPress={handleSkipPress} disabled={loading} hitSlop={10}>
                <Text style={styles.skipLink}>Skip</Text>
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
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleSkipCancel} />

          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Are you sure you want to skip?</Text>
            <Text style={styles.modalText}>
              If you continue without entering your company code, you’ll only see the public
              courses.
            </Text>

            <View style={styles.modalButtonsRow}>
              <Button
                title="Enter code"
                variant="accent"
                size="lg"
                onPress={handleSkipCancel}
                style={styles.modalButton}
              />
              <Button
                title="Skip"
                variant="dark"
                size="lg"
                onPress={handleSkipConfirm}
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
    paddingHorizontal: 32,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    ...TEXT_VARIANTS.largeTitle,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'RobotoCondensed',
    color: '#475569',
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
  skipLink: {
    marginTop: 16,
    fontFamily: 'RobotoCondensed',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
    color: Colors.black,
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

  // --- modal styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    marginBottom: 38,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  modalTitle: {
    ...TEXT_VARIANTS.largeTitle,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'RobotoCondensed',
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 16,
  },
  modalButton: {
    flex: 1,
    alignSelf: 'stretch',
  },
});
