import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Імпорт UI-компонентів
import { Box } from '@/src/components/ui/box';
import { ScrollView } from '@/src/components/ui/scroll-view';
import Button from '../../ui/button';
import Dropdown from '../../ui/dropdown/Dropdown';
import {
  getAllCompanies,
  updateCompanyServiceStandards,
  getCompanyById,
} from '@/src/services/company';
import InstructionField from '../../ui/instruction-field/InstructionField';

// import { Header, InstructionField } from "./components";

const MockAIInstructionsScreen = () => {
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingCompanies(true);
      const { data, error } = await getAllCompanies();
      if (data && !error) {
        // Map to dropdown item shape
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
    // Сохраняем три поля в service_standards в формате JSON
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
        try {
          const companyCheck = await getCompanyById(selectedCompany);
        } catch (err) {
          console.error('Error checking company before update:', err);
        }

        const result = await updateCompanyServiceStandards(selectedCompany, payload);
        if (result.error) {
          console.error('Failed to update company:', result.error);
          const message = result.error?.message || JSON.stringify(result.error);
          Alert.alert('Помилка', `Не вдалося зберегти дані: ${message}`);
          setSaving(false);
          return;
        }

        Alert.alert('Успіх', 'Дані збережено.');
      } catch (err) {
        console.error('Unexpected error while saving company:', err);
        Alert.alert('Помилка', 'Сталася невідома помилка. Перевірте лог.');
      } finally {
        setSaving(false);
      }
    })();
  };

  const handleSaveCourse = () => {
    // TODO: Implement save course logic
  };

  // Instruction fields state
  const [scriptsValue, setScriptsValue] = useState('');
  const [serviceStandardsValue, setServiceStandardsValue] = useState('');
  const [feedbackRulesValue, setFeedbackRulesValue] = useState('');
  const [saving, setSaving] = useState(false);

  // Когда компании загружены — ищем первую с уже сохранёнными service_standards
  // и автоматически выбираем её и подгружаем значения в поля.
  useEffect(() => {
    const pickExisting = async () => {
      if (!companies || companies.length === 0) return;

      for (const comp of companies) {
        try {
          const { data: companyData, error } = await getCompanyById(comp.id);
          if (companyData && !error && companyData.service_standards) {
            setSelectedCompany(comp.id);
            const standards = companyData.service_standards;
            const parsed = typeof standards === 'string' ? JSON.parse(standards) : standards;
            setScriptsValue(parsed?.scripts ?? '');
            setServiceStandardsValue(parsed?.serviceStandards ?? '');
            setFeedbackRulesValue(parsed?.feedbackRules ?? '');
            return;
          }
        } catch (err) {
          console.warn('Error checking company for existing standards', comp.id, err);
        }
      }
    };

    pickExisting();
  }, [companies]);

  // Обработчик выбора компании из Dropdown — загружает её service_standards (если есть)
  const handleSelectCompany = async (id: string) => {
    setSelectedCompany(id === 'none' ? null : id);
    if (!id || id === 'none') {
      setScriptsValue('');
      setServiceStandardsValue('');
      setFeedbackRulesValue('');
      return;
    }

    try {
      const { data: companyData, error } = await getCompanyById(id);
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
          {/* Header */}
          {/* <Header /> */}

          {/* Content */}
          <ScrollView style={styles.container}>
            {/* Company */}
            <Text style={styles.sectionTitle}>Company</Text>
            <Text style={{ marginBottom: 8 }}>Оберіть компанію</Text>
            {loadingCompanies ? (
              <ActivityIndicator size="small" />
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

            {/* Save button */}
            <Button
              title={saving ? 'Saving...' : 'Save Company'}
              onPress={handleSaveCompany}
              variant="secondary"
              size="lg"
              style={styles.saveButton}
              disabled={saving}
            />

            {/* Course */}
            <Text style={styles.sectionTitle}>Course</Text>
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

            <Button
              title="Save Course"
              onPress={handleSaveCourse}
              variant="secondary"
              size="lg"
              style={styles.saveButton}
            />
          </ScrollView>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  saveButton: {
    width: '50%',
    marginTop: 30,
    alignSelf: 'center',
  },
});

export default MockAIInstructionsScreen;
