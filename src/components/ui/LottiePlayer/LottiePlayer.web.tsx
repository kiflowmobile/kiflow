import React, { useEffect, useRef } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';

type Props = {
  animationData: object;
  style?: React.CSSProperties;
  autoPlay?: boolean;
  loop?: boolean;
  pointerEvents?: 'none' | 'auto';
  onAnimationFinish?: () => void; // ✅ добавили
};

export default function LottiePlayer({
  animationData,
  style,
  autoPlay = true,
  loop = false,
  pointerEvents,
  onAnimationFinish,
}: Props) {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);

  useEffect(() => {
    const inst = lottieRef.current;
    if (!inst) return;

    // если loop=true — "complete" будет триггериться каждый круг, обычно не надо
    if (loop) return;

    const handleComplete = () => onAnimationFinish?.();

    // lottie-web events
    // @ts-expect-error: lottieRef instance exposes addEventListener at runtime
    inst.addEventListener?.('complete', handleComplete);

    return () => {
      // @ts-expect-error: lottieRef instance exposes removeEventListener at runtime
      inst.removeEventListener?.('complete', handleComplete);
    };
  }, [loop, onAnimationFinish, animationData]);

  return (
    <div style={{ ...(style || {}), pointerEvents: pointerEvents ?? 'auto' }}>
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        autoplay={autoPlay}
        loop={loop}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
