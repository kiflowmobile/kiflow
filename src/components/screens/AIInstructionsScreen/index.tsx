import React from 'react';
import { Dimensions, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Імпорт UI-компонентів
import { Box } from '@/src/components/ui/box';
import { ScrollView } from '@/src/components/ui/scroll-view';
import Button from '../../ui/button';
import Dropdown from '../../ui/dropdown/Dropdown';
import InstructionField from '../../ui/instruction-field/InstructionField';

// import { Header, InstructionField } from "./components";

const MockAIInstructionsScreen = () => {
  const { width: SCREEN_WIDTH } = Dimensions.get('window');

  const handleSaveCompany = () => {
    // TODO: Implement save company logic
  };

  const handleSaveCourse = () => {
    // TODO: Implement save course logic
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
            <Dropdown
              label="Select Company"
              items={[
                { id: '1', name: 'Company 1' },
                { id: '2', name: 'Company 2' },
              ]}
              selected={null}
              onSelect={() => {}}
            />

            <InstructionField
              title="1. Скрипти"
              value=""
              onChangeText={() => {}}
              placeholder="Введіть скрипти..."
              editable={true}
            />

            <InstructionField
              title="2. Стандарти сервісу"
              value=""
              onChangeText={() => {}}
              placeholder="Введіть стандарти сервісу..."
              editable={true}
            />

            <InstructionField
              title="3. Правила надання відгуку менеджерам з продажу"
              value=""
              onChangeText={() => {}}
              placeholder="Введіть правила..."
              editable={true}
            />

            {/* Save button */}
            <Button
              title="Save Company"
              onPress={handleSaveCompany}
              variant="secondary"
              size="lg"
              style={styles.saveButton}
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
