import { TEXT_VARIANTS } from '@/src/constants/Fonts';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import QuoteIcon from '@/src/assets/images/quote.svg';
import { Colors } from '@/src/constants/Colors';

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
          <Text style={styles.title}>{title}</Text>

          <View style={styles.top}>
            <Text style={styles.mainPoint}>{mainPoint}</Text>
          </View>

          <View style={styles.tipsContainer}>
            {tips.map((tip, index) => (
              <View key={index} style={styles.tipRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.section, styles.exampleSection]}>
            <View style={styles.exampleBadge}>
              <Text style={styles.exampleBadgeText}>Example</Text>
            </View>

            <View style={styles.exampleContent}>
              {example
                .split('\n\n')
                .map((para) => para.trim())
                .filter(Boolean)
                .map((para, idx) => (
                  <View key={idx} style={styles.exampleRow}>
                    <QuoteIcon width={24} height={24} style={styles.quoteIcon} />
                    <Text style={styles.exampleText}>{para}</Text>
                  </View>
                ))}
            </View>
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
    backgroundColor: Colors.bg,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  card: {
    paddingHorizontal: 16,
    width: '100%',
  },
  icon: { marginBottom: 0 },
  title: {
    ...TEXT_VARIANTS.body1,
    lineHeight: 22,
    marginBottom: 12,
  },
  section: {
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  exampleSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    position: 'relative',
    borderRadius: 12,
    marginTop: 54,
  },
  exampleBadge: {
    position: 'absolute',
    top: -34,
    left: 0,
    backgroundColor: Colors.blue,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  exampleBadgeText: {
    color: '#fff',
    ...TEXT_VARIANTS.title3,
  },
  exampleContent: {
    marginTop: 8,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  quoteMark: {
    fontSize: 26,
    color: '#666',
    marginRight: 10,
    lineHeight: 28,
  },
  quoteIcon: {
    marginRight: 12,
  },
  exampleText: {
    flex: 1,
    ...TEXT_VARIANTS.body1,
    lineHeight: 22,

    color: '#525252',
  },

  top: {
    marginTop: 4,
    marginBottom: 6,
  },
  mainPoint: {
    ...TEXT_VARIANTS.body1,
    marginBottom: 8,
    color: '#111',
    lineHeight: 22,
  },
  tipsContainer: {
    marginTop: 12,
    marginBottom: 6,
  },
  bullet: {
    fontSize: 20,
    lineHeight: 28,
    marginRight: 12,
    color: '#111',
    marginTop: 4,
  },
  tipText: {
    flex: 1,
    ...TEXT_VARIANTS.body1,
    lineHeight: 22,
  },
});
