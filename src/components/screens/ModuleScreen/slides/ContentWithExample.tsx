import { Icon } from '@/src/components/ui/icon';
import { AlertCircle, CheckCircle } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export interface ContentWithExampleProps {
  title: string;
  mainPoint: string;
  tips: string[];
  example: string;
}

const ContentWithExample: React.FC<ContentWithExampleProps> = ({
  title,
  mainPoint,
  tips,
  example,
}) => {
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Icon as={AlertCircle} size={44} color="#111" style={styles.icon} />
          <Text style={styles.title}>{title}</Text>

          <View style={[styles.section, { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
            <Text style={styles.mainPoint}>{mainPoint}</Text>
          </View>

          <View style={styles.section}>
            {tips.map((tip, index) => (
              <View key={index} style={styles.tipRow}>
                <Icon as={CheckCircle} size={20} color="#111" style={styles.tipIcon} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.section, { backgroundColor: 'rgba(0,0,0,0.03)' }]}>
            <View style={styles.exampleHeader}>
              <Icon as={AlertCircle} size={20} color="#111" style={styles.exampleIcon} />
              <Text style={styles.exampleTitle}>Приклад</Text>
            </View>
            <Text style={styles.exampleText}>{example}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ContentWithExample;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    paddingInline: 16,
    backgroundColor: '#ffffff',
  },
  icon: { marginBottom: 0 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#111',
  },
  section: {
    borderRadius: 12,
    padding: 12,
  },
  mainPoint: {
    fontSize: 16,
    color: '#111',
    lineHeight: 20,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipIcon: {
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    flexShrink: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111',
    lineHeight: 20,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  exampleIcon: {},
  exampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
    color: '#111',
  },
  exampleText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#111',
    lineHeight: 22,
  },
});
