import { StyleSheet, View } from 'react-native';

function PaginationDots({ total, currentIndex }: { total: number; currentIndex: number }) {
  return (
    <View style={styles.paginationContainer}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === currentIndex ? styles.activeDot : styles.inactiveDot,
            i === currentIndex && styles.activeDotSize,
          ]}
        />
      ))}
    </View>
  );
}

export default PaginationDots;

const styles = StyleSheet.create({
  paginationContainer: {
    position: 'absolute',
    right: 2,
    top: '50%',
    transform: [{ translateY: '-50%' }],
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
  },
  activeDotSize: {
    width: 16,
    height: 16,
    borderRadius: '50%',
  },
  activeDot: {
    backgroundColor: '#000000',
  },
  inactiveDot: {
    backgroundColor: '#ccc',
  },
});
