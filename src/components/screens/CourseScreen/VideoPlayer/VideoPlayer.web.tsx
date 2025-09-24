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
    videoElement.controls = true;
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

  return (
    <Box
      // @ts-expect-error Box component type definition issue
      ref={viewRef}
      className='relative h-full w-full flex-1 items-center justify-center bg-black'
    >
      {uri ? (
        <video
          ref={videoRef}
          src={uri || undefined}
          style={{ width: '100%', height: '80%', objectFit: 'cover' }}
          preload='auto'
          onPlay={handleVideoPlay}
        />
      ) : mux ? (
        <MuxPlayer
          ref={muxPlayerRef}
          playbackId={mux}
          streamType='on-demand'
          style={{ width: '100%', height: '95%', objectFit: 'cover' }}
          autoPlay={false}
          muted
          onPlay={handleMuxPlay}
        />
      ) : null}
    </Box>
  );
};

export default VideoPlayer;