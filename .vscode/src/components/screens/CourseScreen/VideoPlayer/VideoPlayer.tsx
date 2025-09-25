import { Box } from '@/src/components/ui/box';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect } from 'react';

interface VideoPlayerProps {
  uri?: string;
  mux?: string; // Added for consistency with web version
  isActive: boolean;
  thumbnail?: string; // Added for consistency with web version
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ uri, isActive }) => {
  // Only call useVideoPlayer with a valid URI since it doesn't accept undefined
  const player = useVideoPlayer(uri || '');
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  useEffect(() => {
    if (isActive && status === 'readyToPlay') {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, status, player]);

  return (
    <Box className='flex-1 items-center justify-center bg-black'>
      <VideoView
        player={player}
        className='h-full w-full self-center'
        contentFit='cover'
        allowsFullscreen={false}
        pointerEvents='none'
      />
    </Box>
  );
};

export default VideoPlayer;