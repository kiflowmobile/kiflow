import { useRef, useState, useEffect } from 'react';
import { Platform, Dimensions } from 'react-native';

export const useSlideHeight = () => {
  const [height, setHeight] = useState(Dimensions.get('window').height);
  const initialHeightRef = useRef(height);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleResize = () => {
        // на вебі ігноруємо resize через клавіатуру
        setHeight(initialHeightRef.current);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    } else {
      const subscription = Dimensions.addEventListener('change', ({ window }) => {
        setHeight(window.height);
      });
      return () => subscription.remove();
    }
  }, []);

  return height;
};