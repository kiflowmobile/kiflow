import { IconSymbol } from '@/components/ui/icon-symbol';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../styles';

interface VideoSlideProps {
  slide: {
    content: {
      video: {
        mux: string;
      };
    };
  };
  isActive?: boolean;
  onNext?: () => void;
}

export function VideoSlide({ slide, isActive, onNext }: VideoSlideProps) {
  const videoUrl = `https://stream.mux.com/${slide.content?.video?.mux}.m3u8`;
  const insets = useSafeAreaInsets();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const ref = useRef<VideoView>(null);

  const player = useVideoPlayer(videoUrl, (player) => {
    if (isActive) {
      player.play();
    }
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  useEffect(() => {
    const subscription = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });

    const endSubscription = player.addListener('playToEnd', () => {
      if (isActive && onNext) {
        ref.current?.exitFullscreen();
        onNext();
      }
    });

    return () => {
      subscription.remove();
      endSubscription.remove();
    };
  }, [player, isActive, onNext]);

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const toggleMute = () => {
    player.muted = !player.muted;
    setIsMuted(player.muted);
  };

  if (!slide.content?.video?.mux) {
    return null;
  }

  return (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} className="bg-black">
      <VideoView
        ref={ref}
        style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
        player={player}
        contentFit="cover"
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        nativeControls={false}
      />

      <TouchableOpacity
        style={{ top: insets.top + 16, right: insets.left + 16 }}
        className="absolute z-1000"
        onPress={toggleMute}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      >
        <IconSymbol
          name={isMuted ? 'speaker.slash.fill' : 'speaker.wave.2.fill'}
          size={24}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      <TouchableOpacity
        className="absolute inset-0 justify-center items-center"
        onPress={togglePlay}
        activeOpacity={1}
      >
        {!isPlaying && <IconSymbol name="play.circle.fill" size={64} color="#FFFFFF" />}
      </TouchableOpacity>
    </View>
  );
}
