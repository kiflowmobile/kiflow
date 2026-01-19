import React, { useEffect, useRef, useState } from 'react';
import { useInView } from './useInView';
import { PanGestureHandler, TapGestureHandler } from 'react-native-gesture-handler';

interface VideoPlayerProps {
  uri?: string;
  mux?: string;
  thumbnail?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ uri, mux, thumbnail }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>({ threshold: 0.5 });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const panRef = useRef(null);
  const tapRef = useRef(null);

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

    if (inView) {
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    } else {
      videoEl.pause();
      setIsPlaying(false);
    }
  }, [inView]);

  const handlePlayPause = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (videoEl.paused) {
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            if (isMuted) {
              videoEl.muted = false;
              setIsMuted(false);
            }
          })
          .catch(() => setIsPlaying(false));
      }
    } else {
      videoEl.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const newMuted = !isMuted;
    videoEl.muted = newMuted;
    setIsMuted(newMuted);
  };

  const MuteIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />
      <path d="M16 10l4 4m0 -4l-4 4" />
    </svg>
  );

  const VolumeIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 8a5 5 0 0 1 0 8" />
      <path d="M17.7 5a9 9 0 0 1 0 14" />
      <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />
    </svg>
  );

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
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.45)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isPlaying ? 0 : 1,
                  transition: 'opacity 0.3s ease',
                }}
              >
                <span
                  style={{
                    fontSize: 64,
                    color: 'white',
                    lineHeight: 1,
                  }}
                >
                  {isPlaying ? '❚❚' : '▶'}
                </span>
              </button>
            </div>
          </TapGestureHandler>
        </PanGestureHandler>

        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            right: '30px',
            display: 'flex',
            gap: '12px',
            zIndex: 10,
          }}
        >
          <button
            onClick={toggleMute}
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
              color: 'white',
              padding: '10px 14px',
              borderRadius: '50%',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isMuted ? <MuteIcon /> : <VolumeIcon />}
          </button>
        </div>
      </div>
    </div>
  );
};