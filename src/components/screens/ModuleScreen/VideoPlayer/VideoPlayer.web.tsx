import React, { useEffect, useRef, useState } from 'react';
import { useInView } from './useInView';
import PauseSvg from '@/src/assets/images/pause.svg';

interface VideoPlayerProps {
  uri?: string;
  mux?: string;
  thumbnail?: string;
  isMuted?: boolean;
  toggleMute?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  uri,
  mux,
  thumbnail,
  isMuted: externalIsMuted,
  toggleMute: externalToggleMute,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>({ threshold: 0.5 });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [internalIsMuted, setInternalIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Используем внешнее состояние, если оно передано, иначе внутреннее
  const isMuted = externalIsMuted !== undefined ? externalIsMuted : internalIsMuted;
  // toggleMute handled by parent (LessonProgressBars) when provided; internal toggling remains via setInternalIsMuted

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).cast = undefined;
      (window as any).chrome = (window as any).chrome || {};
      (window as any).chrome.cast = undefined;
    }
  }, []);

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

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    // Синхронизируем внешнее состояние muted с видео элементом
    if (externalIsMuted !== undefined) {
      videoEl.muted = externalIsMuted;
    }

    if (inView) {
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    } else {
      videoEl.pause();
      setIsPlaying(false);
    }
  }, [inView, externalIsMuted]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleTimeUpdate = () => {
      setCurrentTime(videoEl.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(videoEl.duration);
    };

    videoEl.addEventListener('timeupdate', handleTimeUpdate);
    videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      videoEl.removeEventListener('timeupdate', handleTimeUpdate);
      videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [mux, uri]);

  const handlePlayPause = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (videoEl.paused) {
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            if (isMuted && externalToggleMute) {
              videoEl.muted = false;
              externalToggleMute();
            } else if (isMuted && !externalToggleMute) {
              videoEl.muted = false;
              setInternalIsMuted(false);
            }
          })
          .catch(() => setIsPlaying(false));
      }
    } else {
      videoEl.pause();
      setIsPlaying(false);
    }
  };

  // toggleMute теперь определен выше в пропсах

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const videoEl = videoRef.current;
    if (!videoEl || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    videoEl.currentTime = percentage * duration;
  };

  // Volume icons removed from web player; mute control is rendered in LessonProgressBars

  return (
    <div
      ref={viewRef}
      className="relative h-full w-full flex items-center justify-center bg-black overflow-hidden"
      style={{ position: 'relative' }}
    >
      <style>{`
        video::-webkit-media-controls-enclosure,
        video::-webkit-media-controls-panel,
        video::-webkit-media-controls { display: none !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          backgroundColor: 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <video
          ref={videoRef}
          style={{
            width: 'auto',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.5s ease',
          }}
          preload="auto"
          playsInline
          muted={isMuted}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: thumbnail ? 'transparent' : 'black',
              backgroundImage: thumbnail ? `url(${thumbnail})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {!thumbnail && (
              <div
                style={{
                  width: 60,
                  height: 60,
                  border: '6px solid rgba(255,255,255,0.2)',
                  borderTop: '6px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
            )}
          </div>
        )}

        {/* Large pause icon when paused */}
        {!isPlaying && (
          <div
            onClick={handlePlayPause}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PauseSvg width={64} height={64} />
          </div>
        )}

        {/* Clickable overlay for play/pause */}
        <div
          onClick={handlePlayPause}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            cursor: 'pointer',
          }}
        />

        {/* Progress bar with time stamps */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 0,
            right: 0,
            padding: '20px',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* Progress bar */}
          <div
            onClick={handleProgressClick}
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                height: '100%',
                backgroundColor: 'white',
                transition: 'width 0.1s linear',
              }}
            />
          </div>

          {/* Time stamps */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'white',
              fontSize: '14px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Mute button removed - теперь управляется через LessonProgressBars */}
      </div>
    </div>
  );
};

export default VideoPlayer;
