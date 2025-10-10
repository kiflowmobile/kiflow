import { Box } from '@/src/components/ui/box';
import React, { useEffect, useRef, useState } from 'react';
import { useInView } from './useInView';
import { PanGestureHandler, TapGestureHandler } from 'react-native-gesture-handler';

interface VideoPlayerProps {
  uri?: string;
  mux?: string;
  thumbnail?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ uri, mux, thumbnail }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>({ threshold: 0.5 }); // 🎯 відсоток видимості слайду

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const panRef = useRef(null);
const tapRef = useRef(null);



  // 🔇 Вимикаємо Google Cast SDK
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).cast = undefined;
      (window as any).chrome = (window as any).chrome || {};
      (window as any).chrome.cast = undefined;
    }
  }, []);

  // ⚙️ Ініціалізація HLS або URI
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    setIsLoading(true);
    let hls: any | null = null;

    if (mux) {
      const muxSrc = `https://stream.mux.com/${mux}.m3u8`;

      (async () => {
        try {
          const mod = await import('hls.js');
          const Hls = mod.default || mod;
          if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(muxSrc);
            hls.attachMedia(videoEl);
            hls.on(Hls.Events.MANIFEST_PARSED, () => setIsLoading(false));
          } else {
            videoEl.src = muxSrc;
            videoEl.oncanplay = () => setIsLoading(false);
          }
        } catch {
          videoEl.src = muxSrc;
          videoEl.oncanplay = () => setIsLoading(false);
        }
      })();
    } else if (uri) {
      videoEl.src = uri;
      videoEl.oncanplay = () => setIsLoading(false);
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [mux, uri]);

  // 🧠 Автовідтворення при вході в зону видимості
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (inView) {
      videoEl.play().catch(() => {}); // іноді браузер блокує autoplay
      setIsPlaying(true);
    } else {
      videoEl.pause();
      setIsPlaying(false);
    }
  }, [inView]);

  // 🎬 Кнопка Play / Pause
  const handlePlayPause = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
  
    if (videoEl.paused) {
      videoEl.play();
      setIsPlaying(true);
  
      // перший раз користувач включив звук
      if (isMuted) {
        videoEl.muted = false;
        setIsMuted(false);
      }
    } else {
      videoEl.pause();
      setIsPlaying(false);
    }
  };
  

  // 🔈 Кнопка звуку
  const toggleMute = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const newMuted = !isMuted;
    videoEl.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  // 🧩 Стилі
  const styles = {
    wrapper: {
      position: 'relative' as const,
      width: '100%',
      height: '90vh',
      // overflow: 'hidden',
      backgroundColor: 'black',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    video: {
      width: 'auto',
      height: '100%',
      objectFit: 'cover' as const,
      opacity: isLoading ? 0 : 1,
      transition: 'opacity 0.5s ease',
      // pointerEvents: 'none'
    },
    overlay: {
      position: 'absolute' as const,
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: thumbnail ? 'transparent' : 'black',
      backgroundImage: thumbnail ? `url(${thumbnail})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
    loader: {
      width: 60,
      height: 60,
      border: '6px solid rgba(255,255,255,0.2)',
      borderTop: '6px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    controls: {
      position: 'absolute' as const,
      bottom: '70px',
      right: '30px',
      display: 'flex',
      gap: '12px',
      zIndex: 10,
    },
    buttonWrapper: {
      position: 'absolute' as const,
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      // pointerEvents: 'none' as const,
    },
    button: {
      width: 120,
      height: 120,
      borderRadius: '50%',
      background: 'rgba(0,0,0,0.45)',
      border: 'none',
      cursor: 'pointer',
      zIndex: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isPlaying ? 0 : 1,
      transition: 'opacity 0.3s ease',
      // pointerEvents: 'auto' as const,
    },
    icon: {
      fontSize: 64,
      color: 'white',
      lineHeight: 1,
    },
    muteButton: {
      background: 'rgba(0,0,0,0.5)',
      border: 'none',
      color: 'white',
      padding: '10px 14px',
      borderRadius: '50%',
      fontSize: '24px',
      cursor: 'pointer',
      
    },
  };

  return (
    <Box
      // @ts-expect-error Box component type definition issue
      ref={viewRef}
      className="relative h-full w-full flex-1 items-center justify-center bg-black overflow-hidden"
    >
      <style>{`
        video::-webkit-media-controls-enclosure,
        video::-webkit-media-controls-panel,
        video::-webkit-media-controls { display: none !important; }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={styles.wrapper}>
        {/* 🎥 Відео */}
        <video
          ref={videoRef}
          style={styles.video}
          preload="auto"
  playsInline
  muted={isMuted}
  onPlay={handlePlay}
  onPause={handlePause}
          
        />

        {/* 🖼️ Лоадер / превʼю */}
        {isLoading && (
          <div style={styles.overlay}>
            {!thumbnail && <div style={styles.loader} />}
          </div>
        )}

        {/* ▶️ Кнопка відтворення */}
        <PanGestureHandler ref={panRef}>
  <TapGestureHandler waitFor={panRef} ref={tapRef}>
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 120,
        height: 120,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 2,
      }}
    >
      <button
        onClick={handlePlayPause}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        style={styles.button}
      >
        <span style={styles.icon}>{isPlaying ? '❚❚' : '▶'}</span>
      </button>
    </div>
  </TapGestureHandler>
</PanGestureHandler>

        {/* 🔈 Контрол звуку */}
        <div style={styles.controls}>
          <button onClick={toggleMute} style={styles.muteButton}>
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>
    </Box>
  );
};

export default VideoPlayer;
