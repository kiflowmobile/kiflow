import { Box } from '@/src/components/ui/box';
import type MuxPlayerElement from '@mux/mux-player';
import MuxPlayer from '@mux/mux-player-react';
import React, { useEffect, useRef } from 'react';
import { useInView } from './useInView';

interface VideoPlayerProps {
  uri?: string;
  mux?: string;
  thumbnail?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ uri, mux }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const muxPlayerRef = useRef<MuxPlayerElement>(null);
  const { ref: viewRef } = useInView<HTMLDivElement>({ threshold: 0.35 });

  // Disable Cast SDK globally when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).cast = undefined;
      (window as any).chrome = (window as any).chrome || {};
      (window as any).chrome.cast = undefined;
    }
  }, []);

  // Set playback rate for mux player
  useEffect(() => {
    if (mux && muxPlayerRef.current) {
      muxPlayerRef.current.playbackRate = 1.25;
    }
  }, [mux]);

  // Native video: setup video element
  useEffect(() => {
    if (!uri) return;
    const videoElement = videoRef.current;
    if (!videoElement) return;
    videoElement.playsInline = true;
    videoElement.muted = true; // Start muted by default
    // Remove autoplay - video will only play when user clicks play button
  }, [uri]);

  // MuxPlayer: setup player (no autoplay)
  useEffect(() => {
    if (!mux || !muxPlayerRef.current) return;
    // Remove autoplay - player will only play when user interacts
  }, [mux]);

  // Handle play event for native video - enable sound when user plays
  const handleVideoPlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    videoElement.muted = false;
  };

  // Handle play event for MuxPlayer - enable sound when user plays
  const handleMuxPlay = () => {
    if (!muxPlayerRef.current) return;
    muxPlayerRef.current.muted = false;
  };

  // Click-to-toggle playback for native video
  const toggleNativePlayback = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    if (videoElement.paused) {
      videoElement.play();
    } else {
      videoElement.pause();
    }
  };

  // Click-to-toggle playback for Mux player
  const toggleMuxPlayback = () => {
    const player = muxPlayerRef.current;
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
      {/* Стили для скрытия контролов */}
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

      {uri ? (
        <video
          ref={videoRef}
          src={uri || undefined}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          preload="auto"
          controls={false}
          onPlay={handleVideoPlay}
          onClick={toggleNativePlayback}
        />
      ) : mux ? (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <MuxPlayer
            ref={muxPlayerRef}
            playbackId={mux}
            streamType="on-demand"
            className="mux-no-controls"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            autoPlay={false}
            muted
            onPlay={handleMuxPlay}
          />
          <div
            onClick={toggleMuxPlayback}
            style={{ position: 'absolute', inset: 0, background: 'transparent' }}
          />
        </div>
      ) : null}
    </Box>
  );
};

export default VideoPlayer;