import { Box } from '@/src/components/ui/box';
import React, { useEffect, useRef, useState } from 'react';
import { useInView } from './useInView';

interface VideoPlayerProps {
  uri?: string;
  mux?: string;
  thumbnail?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ uri, mux }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: viewRef } = useInView<HTMLDivElement>({ threshold: 0.35 });

  const [isPlaying, setIsPlaying] = useState(false);

  // Отключаем Cast SDK
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).cast = undefined;
      (window as any).chrome = (window as any).chrome || {};
      (window as any).chrome.cast = undefined;
    }
  }, []);

  useEffect(() => {
    if (!mux) return;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const muxSrc = `https://stream.mux.com/${mux}.m3u8`;

    if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = muxSrc;
      return;
    }

    let hls: any | null = null;
    let cancelled = false;

    (async () => {
      try {
        const mod = await import('hls.js');
        if (cancelled) return;
        const Hls = mod.default || mod;
        if (Hls.isSupported()) {
          hls = new Hls({ autoStartLoad: true });
          hls.loadSource(muxSrc);
          hls.attachMedia(videoEl);
        } else {
          videoEl.src = muxSrc;
        }
      } catch {
        videoEl.src = muxSrc;
      }
    })();

    return () => {
      cancelled = true;
      if (hls) {
        try {
          hls.destroy();
        } catch {}
      }
    };
  }, [mux]);

  useEffect(() => {
    if (!uri) return;
    const videoElement = videoRef.current;
    if (!videoElement) return;
    videoElement.playsInline = true;
    videoElement.muted = true;
  }, [uri]);

  const handleVideoPlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    videoElement.muted = false;
    setIsPlaying(true);
  };

  const handleVideoPause = () => setIsPlaying(false);

  const handleMuxPlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    videoElement.muted = false;
    setIsPlaying(true);
  };

  const handleMuxPause = () => setIsPlaying(false);

  const toggleNativePlayback = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    if (videoElement.paused) {
      videoElement.play();
    } else {
      videoElement.pause();
    }
  };

  const toggleMuxPlayback = () => {
    const player = videoRef.current;
    if (!player) return;
    if (player.paused) {
      player.play();
    } else {
      player.pause();
    }
  };

  return (
    <Box
      // @ts-expect-error Box component type definition issue
      ref={viewRef}
      className="relative h-full w-full flex-1 items-center justify-center bg-black"
    >
      <style>{`
      .mux-no-controls {
        --controls: none;
        --top: none;
        --bottom: none;
        --play-button: none;
        --time-range: none;
        --mute-button: none;
        --captions-button: none;
      }
      video::-webkit-media-controls-enclosure,
      video::-webkit-media-controls-panel,
      video::-webkit-media-controls { display: none !important; }
    `}</style>

      {(uri && !mux) ? (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <video
            ref={videoRef}
            src={uri || undefined}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            preload="auto"
            controls={false}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
          />
          <button
            onClick={toggleNativePlayback}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 80,
              height: 80,
              borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.8)',
              background: 'rgba(0,0,0,0.45)',
              cursor: 'pointer',
              zIndex: 2,
              transition: 'opacity 200ms ease',
              opacity: isPlaying ? 0 : 1,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: 36,
                color: 'white',
                lineHeight: 1,
              }}
            >
              {isPlaying ? '❚❚' : '▶'}
            </span>
          </button>
        </div>
      ) : mux ? (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            preload="auto"
            controls={false}
            muted
            onPlay={handleMuxPlay}
            onPause={handleMuxPause}
          />
          <button
            onClick={toggleMuxPlayback}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              border: 'none',
              cursor: 'pointer',
              zIndex: 2,
              transition: 'opacity 200ms ease',
              opacity: isPlaying ? 0 : 1,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: 64,
                color: 'white',
                lineHeight: 1,
              }}
            >
              {isPlaying ? '❚❚' : '▶'}
            </span>
          </button>
        </div>
      ) : null}
    </Box>
  );
};

export default VideoPlayer;