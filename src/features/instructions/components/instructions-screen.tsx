import React, { useEffect, useState } from 'react';
import { Dimensions, Text, ActivityIndicator, Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Box, ScrollView, Button, Dropdown } from '@/shared/ui';
import { companyApi } from '@/features/company';
import { InstructionField } from '@/src/features/instructions/components/instruction-field';

export const InstructionsScreen = () => {
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingCompanies(true);
      const { data, error } = await companyApi.getAllCompanies();
      if (data && !error) {
        const items = data.map((c) => ({ id: c.id, name: c.name }));
        setCompanies(items);
      } else {
        console.error('Failed to load companies', error);
      }
      setLoadingCompanies(false);
    };

    load();
  }, []);

  const handleSaveCompany = () => {
    if (!selectedCompany || selectedCompany === 'none') {
      Alert.alert('Помилка', 'Будь ласка, оберіть компанію перед збереженням.');
      return;
    }

    const payload = {
      scripts: scriptsValue,
      serviceStandards: serviceStandardsValue,
      feedbackRules: feedbackRulesValue,
    };

    (async () => {
      try {
        setSaving(true);
        // Verify company exists
        const { error: companyError } = await companyApi.getCompanyById(selectedCompany);

        if (companyError) {
          Alert.alert('Помилка', 'Компанію не знайдено.');
          setSaving(false);
          return;
        }

        const { error } = await companyApi.updateCompanyServiceStandards(selectedCompany, payload);

        if (error) {
          console.error('Failed to update company:', error);
          const message = error.message || 'Unknown error';
          Alert.alert('Помилка', `Не вдалося зберегти дані: ${message}`);
          setSaving(false);
          return;
        }

        Alert.alert('Успіх', 'Дані збережено.');
      } catch (err) {
        console.error('Unexpected error while saving company:', err);
        Alert.alert('Помилка', 'Сталася невідома помилка.');
      } finally {
        setSaving(false);
      }
    })();
  };

  const handleSaveCourse = () => {
    // TODO: Implement save course logic
    Alert.alert('Info', 'Save Course logic not implemented yet.');
  };

  // Instruction fields state
  const [scriptsValue, setScriptsValue] = useState('');
  const [serviceStandardsValue, setServiceStandardsValue] = useState('');
  const [feedbackRulesValue, setFeedbackRulesValue] = useState('');
  const [saving, setSaving] = useState(false);

  // Auto-select first company with existing standards
  useEffect(() => {
    const pickExisting = async () => {
      if (!companies || companies.length === 0) return;

      for (const comp of companies) {
        try {
          const { data: companyData, error } = await companyApi.getCompanyById(comp.id);
          if (companyData && !error && companyData.service_standards) {
            setSelectedCompany(comp.id);
            const standards = companyData.service_standards;
            // Parse if it's a string, otherwise use directly
            const parsed = typeof standards === 'string' ? JSON.parse(standards) : standards;
            setScriptsValue(parsed?.scripts ?? '');
            setServiceStandardsValue(parsed?.serviceStandards ?? '');
            setFeedbackRulesValue(parsed?.feedbackRules ?? '');
            return; // Found one, stop searching
          }
        } catch (err) {
          console.warn('Error checking company for existing standards', comp.id, err);
        }
      }
    };

    pickExisting();
  }, [companies]);

  const handleSelectCompany = async (id: string) => {
    setSelectedCompany(id === 'none' ? null : id);
    if (!id || id === 'none') {
      setScriptsValue('');
      setServiceStandardsValue('');
      setFeedbackRulesValue('');
      return;
    }

    try {
      const { data: companyData, error } = await companyApi.getCompanyById(id);
      if (companyData && !error && companyData.service_standards) {
        const standards = companyData.service_standards;
        const parsed = typeof standards === 'string' ? JSON.parse(standards) : standards;
        setScriptsValue(parsed?.scripts ?? '');
        setServiceStandardsValue(parsed?.serviceStandards ?? '');
        setFeedbackRulesValue(parsed?.feedbackRules ?? '');
      } else {
        setScriptsValue('');
        setServiceStandardsValue('');
        setFeedbackRulesValue('');
      }
    } catch (err) {
      console.warn('Failed to load company standards on select', err);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light">
      <ScrollView
        contentContainerStyle={{
          width: SCREEN_WIDTH,
          alignSelf: 'center',
          paddingHorizontal: 16,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Box className="flex-1">
          {/* Main Container */}
          <View className="w-full flex-1 p-4 bg-[#f9f9f9] rounded-lg">
            {/* Company Section */}
            <Text className="text-xl font-bold mt-5 mb-2.5 text-[#333]">Company</Text>
            <Text className="mb-2 text-gray-600">Оберіть компанію</Text>

            {loadingCompanies ? (
              <ActivityIndicator size="small" className="my-4" />
            ) : (
              <Dropdown
                label="Select Company"
                items={companies.length ? companies : [{ id: 'none', name: 'No companies' }]}
                selected={selectedCompany}
                onSelect={(id) => handleSelectCompany(id)}
              />
            )}

            <InstructionField
              title="1. Скрипти"
              value={scriptsValue}
              onChangeText={setScriptsValue}
              placeholder="Введіть скрипти..."
              editable={true}
            />

            <InstructionField
              title="2. Стандарти сервісу"
              value={serviceStandardsValue}
              onChangeText={setServiceStandardsValue}
              placeholder="Введіть стандарти сервісу..."
              editable={true}
            />

            <InstructionField
              title="3. Правила надання відгуку менеджерам з продажу"
              value={feedbackRulesValue}
              onChangeText={setFeedbackRulesValue}
              placeholder="Введіть правила..."
              editable={true}
            />

            <View className="w-1/2 mt-8 self-center">
              <Button
                title={saving ? 'Saving...' : 'Save Company'}
                onPress={handleSaveCompany}
                variant="accent"
                size="lg"
                style={{ width: '100%' }}
                disabled={saving}
              />
            </View>

            {/* Course Section */}
            <Text className="text-xl font-bold mt-5 mb-2.5 text-[#333]">Course</Text>
            <Dropdown
              label="Dropdown - Course"
              items={[
                { id: '1', name: 'Course 1' },
                { id: '2', name: 'Course 2' },
              ]}
              selected={null}
              onSelect={() => {}}
            />

            <InstructionField
              title="4. Скрипти Курсу"
              value=""
              onChangeText={() => {}}
              placeholder="Введіть скрипти..."
              editable={true}
            />

            <View className="w-1/2 mt-8 self-center">
              <Button
                title="Save Course"
                onPress={handleSaveCourse}
                variant="accent"
                size="lg"
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
};
