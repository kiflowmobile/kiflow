import React from 'react';
import LottieView from 'lottie-react-native';

type Props = {
  animationData: object;
  style?: any;
  autoPlay?: boolean;
  loop?: boolean;
  resizeMode?: 'cover' | 'contain' | 'center';
  pointerEvents?: 'none' | 'auto';

  onAnimationFinish?: (isCancelled: boolean) => void; // ✅ добавили
};

export default function LottiePlayer({
  animationData,
  style,
  autoPlay = true,
  loop = false,
  resizeMode = 'cover',
  pointerEvents,
  onAnimationFinish, // ✅ приняли
}: Props) {
  return (
    <LottieView
      source={animationData as any}
      autoPlay={autoPlay}
      loop={loop}
      resizeMode={resizeMode}
      style={style}
      onAnimationFinish={onAnimationFinish} // ✅ прокинули
    />
  );
}
