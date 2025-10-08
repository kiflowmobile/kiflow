import {  StyleSheet, View } from 'react-native';


type PaginationDotProps = {
  isActive: boolean;
  width: number;
  height: (isActive: boolean) => number;
  index: number;
};

function PaginationDots({ total, currentIndex }: { total: number; currentIndex: number }) {
    return (
      <View style={styles.paginationContainer}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    );
  }

export default PaginationDots;


const styles = StyleSheet.create({
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { color: '#ff4444', textAlign: 'center', marginBottom: 10, fontSize: 16 },
    retryText: { color: '#007AFF', textAlign: 'center', textDecorationLine: 'underline', fontSize: 16 },
    noSlidesText: { color: '#666', textAlign: 'center', fontSize: 16 },
  
    // 🔵 Пагінація
    paginationContainer: {
      position: 'absolute',
      right: 15,
      top: '50%',
      transform: [{ translateY: -50 }],
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    activeDot: {
      backgroundColor: '#0f172a',
    },
    inactiveDot: {
      backgroundColor: '#ccc',
    },
  });
  